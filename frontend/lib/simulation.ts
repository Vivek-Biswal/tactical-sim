import { ExerciseState, AARReportData, SimulationEventLog } from "../types/exercise";
import { Scenario, ScenarioEvent } from "../types/scenario";
import { RadioMessage } from "../types/communication";
import { Decision } from "../types/decision";
import { getDemoScenario } from "../data/demoScenario";
import { formatSimTime } from "./utils";

export class LocalSimulationEngine {
  private state: ExerciseState;
  private scenario: Scenario;
  private timerId: NodeJS.Timeout | null = null;
  private listeners: Set<(state: ExerciseState) => void> = new Set();
  private delayedMessageQueue: Array<{ message: RadioMessage; deliverIn: number }> = [];
  private triggeredEventIds: Set<string> = new Set();
  private startTimestamp: number = Date.now();

  constructor(exerciseId: string = "exercise-demo-1", isDemo: boolean = true) {
    this.scenario = getDemoScenario(isDemo);
    this.state = this.createInitialState(exerciseId, isDemo);
  }

  private createInitialState(exerciseId: string, isDemo: boolean): ExerciseState {
    return {
      exerciseId,
      scenarioName: this.scenario.name,
      scenarioCode: this.scenario.codeName,
      teamName: "Task Force Alpha",
      isDemo,
      status: "pending",
      elapsedSeconds: 0,
      totalDuration: this.scenario.durationSeconds,
      formattedTime: "00:00",
      progressPercent: 0,
      speedMultiplier: 1.0,
      commsStatus: "normal",
      radioDelaySeconds: 0,
      mapStatus: "current",
      mapLastUpdated: "Live Telemetry Active",
      units: JSON.parse(JSON.stringify(this.scenario.initialUnits)),
      trueUnits: JSON.parse(JSON.stringify(this.scenario.initialUnits)),
      activityMarkers: [
        {
          id: "act-1",
          label: "Sector 3 Checkpoint",
          x: 380,
          y: 280,
          type: "checkpoint",
          status: "active"
        }
      ],
      availableInformation: [
        "Satellite GPS Track (Normal)",
        "Direct VHF Radio Uplink (Clear)",
        "Pre-mission Area Reconnaissance"
      ],
      unavailableInformation: [],
      messages: [],
      decisions: [],
      decisionRequired: null,
      eventLog: [
        {
          id: "log-init",
          time: "00:00",
          second: 0,
          title: "System Initialized",
          description: "Tactical training net connected.",
          category: "system"
        }
      ],
      connectedTrainees: [
        { role: "COMMANDER", name: "Commander 1" },
        { role: "TEAM_ALPHA", name: "Alpha Scout" }
      ]
    };
  }

  public subscribe(listener: (state: ExerciseState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((fn) => fn(currentState));
  }

  public getState(): ExerciseState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public setState(newState: ExerciseState) {
    this.state = newState;
    this.notify();
  }

  public start() {
    if (this.state.status === "running") return;
    this.state.status = "running";
    this.logEvent("Exercise Started", `Simulation commenced (${this.state.isDemo ? "Fast Demo 2m" : "Standard 10m"})`, "system");
    this.notify();

    if (!this.timerId) {
      this.timerId = setInterval(() => this.tick(1.0), 1000);
    }
  }

  public pause() {
    if (this.state.status !== "running") return;
    this.state.status = "paused";
    this.logEvent("Exercise Paused", "Simulation clock suspended", "system");
    this.notify();
  }

  public resume() {
    if (this.state.status !== "paused") return;
    this.state.status = "running";
    this.logEvent("Exercise Resumed", "Simulation clock resumed", "system");
    this.notify();
  }

  public end() {
    this.state.status = "completed";
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.logEvent("Exercise Completed", "Simulation reached end of training timeline", "system");
    this.notify();
  }

  public setSpeed(multiplier: number) {
    this.state.speedMultiplier = multiplier;
    this.notify();
  }

  public reset(isDemo?: boolean) {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    const demo = isDemo !== undefined ? isDemo : this.state.isDemo;
    this.scenario = getDemoScenario(demo);
    this.triggeredEventIds.clear();
    this.delayedMessageQueue = [];
    this.startTimestamp = Date.now();
    this.state = this.createInitialState(this.state.exerciseId, demo);
    this.notify();
  }

  private logEvent(title: string, description: string, category: string, payload?: Record<string, unknown>) {
    const log: SimulationEventLog = {
      id: Math.random().toString(36).substring(2, 9),
      time: this.state.formattedTime,
      second: this.state.elapsedSeconds,
      title,
      description,
      category,
      payload
    };
    this.state.eventLog.push(log);
  }

  public tick(deltaSeconds: number = 1.0) {
    if (this.state.status !== "running") return;

    const effectiveDelta = deltaSeconds * this.state.speedMultiplier;
    this.state.elapsedSeconds += effectiveDelta;
    this.state.formattedTime = formatSimTime(this.state.elapsedSeconds);
    this.state.progressPercent = Math.min(
      100,
      Math.round((this.state.elapsedSeconds / Math.max(1, this.state.totalDuration)) * 100)
    );

    // Advance true units along road/patrol
    if (this.state.trueUnits) {
      for (const u of this.state.trueUnits) {
        if (u.id === "unit-alpha" && u.x < 520) {
          u.x += 0.8 * effectiveDelta;
          u.y -= 0.3 * effectiveDelta;
        } else if (u.id === "unit-bravo" && u.x < 450) {
          u.x += 0.5 * effectiveDelta;
          u.y -= 0.35 * effectiveDelta;
        }
      }
    }

    // Mirror to display units unless map is outdated
    if (this.state.mapStatus === "current" && this.state.trueUnits) {
      this.state.units = JSON.parse(JSON.stringify(this.state.trueUnits));
      this.state.mapLastUpdated = "Live Telemetry Active";
    } else {
      const staleMins = Math.floor(this.state.elapsedSeconds / 60);
      const staleSecs = Math.floor(this.state.elapsedSeconds % 60);
      this.state.mapLastUpdated = `Last updated: ${staleMins}m ${staleSecs}s ago (STALE)`;
    }

    // Process delayed message queue
    const remainingQueue: Array<{ message: RadioMessage; deliverIn: number }> = [];
    for (const item of this.delayedMessageQueue) {
      item.deliverIn -= effectiveDelta;
      if (item.deliverIn <= 0) {
        item.message.status = "delivered";
        item.message.delayRemaining = 0;
        this.state.messages.push(item.message);
        this.logEvent("Delayed Message Delivered", `From ${item.message.sender}: ${item.message.content.substring(0, 35)}...`, "comms");
      } else {
        item.message.delayRemaining = Math.ceil(item.deliverIn);
        remainingQueue.push(item);
      }
    }
    this.delayedMessageQueue = remainingQueue;

    // Check scenario timeline triggers
    for (const evt of this.scenario.events) {
      if (!this.triggeredEventIds.has(evt.id) && this.state.elapsedSeconds >= evt.triggerTime) {
        this.triggeredEventIds.add(evt.id);
        this.triggerScenarioEvent(evt);
      }
    }

    // Check completion
    if (this.state.elapsedSeconds >= this.state.totalDuration) {
      this.end();
    }

    this.notify();
  }

  private triggerScenarioEvent(evt: ScenarioEvent) {
    const payload = evt.payload;
    this.logEvent(evt.title, evt.description, evt.type, payload);

    if (payload.availableInfo) {
      this.state.availableInformation = payload.availableInfo;
    }
    if (payload.unavailableInfo) {
      this.state.unavailableInformation = payload.unavailableInfo;
    }

    if (evt.type === "comms_degradation") {
      if (payload.commsStatus) {
        this.state.commsStatus = payload.commsStatus;
        this.state.radioDelaySeconds = payload.radioDelaySeconds || 0;
      }
      if (payload.broadcastMessage) {
        const bm = payload.broadcastMessage;
        this.injectIncomingMessage(bm.sender, bm.senderRole, bm.content);
      }
    } else if (evt.type === "conflicting_report") {
      if (payload.reports) {
        for (const rep of payload.reports) {
          this.injectIncomingMessage(rep.source, rep.senderRole, rep.content);
        }
      }
      // Add visual contact markers
      this.state.activityMarkers.push({
        id: "act-conflict-west",
        label: "Alpha Scout Contact: Western Ridge",
        x: 260,
        y: 210,
        type: "contact_warning",
        status: "unverified"
      });
      this.state.activityMarkers.push({
        id: "act-conflict-east",
        label: "SIGINT Triangulation: Eastern Canyon",
        x: 710,
        y: 320,
        type: "contact_warning",
        status: "unverified"
      });
    } else if (evt.type === "map_status") {
      if (payload.mapStatus) {
        this.state.mapStatus = payload.mapStatus;
        this.state.mapLastUpdated = "Last updated: 3 minutes ago (STALE)";
      }
    } else if (evt.type === "intel_update") {
      const sender = payload.sender || "INTELLIGENCE";
      const role = payload.senderRole || "INTELLIGENCE";
      const content = payload.content || "Emergent intelligence update received.";
      this.injectIncomingMessage(sender, role, content);
      this.state.activityMarkers.push({
        id: "act-jammer",
        label: "Hostile Mobile Jammer (EW)",
        x: 560,
        y: 180,
        type: "hostile_jammer",
        status: "high_threat"
      });
    } else if (evt.type === "decision_point") {
      this.state.decisionRequired = {
        eventId: evt.id,
        prompt: payload.prompt || "Commander Decision Required",
        options: payload.options || [],
        timestamp: this.state.formattedTime,
        simulationSecond: this.state.elapsedSeconds
      };
    }
  }

  public injectIncomingMessage(sender: string, senderRole: string, content: string) {
    const msg: RadioMessage = {
      id: Math.random().toString(36).substring(2, 9),
      exerciseId: this.state.exerciseId,
      sender,
      senderRole,
      content,
      timestamp: Date.now(),
      formattedTime: this.state.formattedTime,
      status: "delivered"
    };
    this.state.messages.push(msg);
    this.notify();
  }

  public sendRadioMessage(sender: string, role: string, content: string): RadioMessage {
    const msgId = Math.random().toString(36).substring(2, 9);

    if (this.state.commsStatus === "offline") {
      const droppedMsg: RadioMessage = {
        id: msgId,
        exerciseId: this.state.exerciseId,
        sender,
        senderRole: role,
        content: `[SIGNAL LOST] ${content}`,
        timestamp: Date.now(),
        formattedTime: this.state.formattedTime,
        status: "dropped"
      };
      this.state.messages.push(droppedMsg);
      this.logEvent("Message Dropped (Radio Offline)", `Attempted from ${sender}: ${content.substring(0, 30)}...`, "comms");
      this.notify();
      return droppedMsg;
    }

    if (this.state.commsStatus === "delayed") {
      const delay = this.state.radioDelaySeconds || 8;
      const delayedMsg: RadioMessage = {
        id: msgId,
        exerciseId: this.state.exerciseId,
        sender,
        senderRole: role,
        content,
        timestamp: Date.now(),
        formattedTime: this.state.formattedTime,
        status: "delayed",
        delayRemaining: delay
      };
      this.delayedMessageQueue.push({
        message: delayedMsg,
        deliverIn: delay
      });
      this.logEvent("Message Queued (Radio Delayed)", `From ${sender} with ${delay}s propagation latency`, "comms");
      this.notify();
      return delayedMsg;
    }

    // Normal delivery
    const normalMsg: RadioMessage = {
      id: msgId,
      exerciseId: this.state.exerciseId,
      sender,
      senderRole: role,
      content,
      timestamp: Date.now(),
      formattedTime: this.state.formattedTime,
      status: "delivered"
    };
    this.state.messages.push(normalMsg);
    this.notify();
    return normalMsg;
  }

  public submitDecision(decisionText: string, rationale: string, confidence: "low" | "medium" | "high", traineeId: string = "COMMANDER_1"): Decision {
    const dec: Decision = {
      id: Math.random().toString(36).substring(2, 9),
      exerciseId: this.state.exerciseId,
      traineeId,
      decision: decisionText,
      rationale,
      confidence,
      timestamp: Date.now(),
      simulationTime: this.state.formattedTime,
      simulationSecond: Math.floor(this.state.elapsedSeconds),
      availableInformation: [...this.state.availableInformation],
      unavailableInformation: [...this.state.unavailableInformation]
    };

    this.state.decisions.push(dec);
    this.state.decisionRequired = null;
    this.logEvent("Commander Decision Submitted", `Action: ${decisionText} | Confidence: ${confidence.toUpperCase()}`, "decision", {
      decision: decisionText,
      rationale,
      confidence
    });
    this.notify();
    return dec;
  }

  public applyInstructorInject(action: string, payload?: Record<string, unknown>) {
    if (action === "delay_radio") {
      this.state.commsStatus = "delayed";
      this.state.radioDelaySeconds = Number(payload?.delay || 10);
      this.logEvent("Instructor Inject: Delay Radio", `Forced radio latency to ${this.state.radioDelaySeconds}s`, "instructor");
    } else if (action === "drop_radio") {
      this.state.commsStatus = "offline";
      this.state.radioDelaySeconds = 9999;
      this.logEvent("Instructor Inject: Drop Radio", "Tactical net forced offline", "instructor");
    } else if (action === "restore_radio") {
      this.state.commsStatus = "normal";
      this.state.radioDelaySeconds = 0;
      this.logEvent("Instructor Inject: Restore Radio", "Tactical net restored to normal", "instructor");
    } else if (action === "conflicting_report") {
      this.injectIncomingMessage("Team Alpha Lead", "TEAM_ALPHA", "URGENT: Hostile movement sighted near Sector 2 tree-line!");
      this.injectIncomingMessage("SIGINT Remote", "INTELLIGENCE", "ADVISORY: Acoustic arrays indicate Sector 2 clear; activity concentrated near Sector 5.");
      this.logEvent("Instructor Inject: Conflicting SITREPs", "Dispatched contradictory intelligence feeds", "instructor");
    } else if (action === "outdate_map") {
      this.state.mapStatus = "outdated";
      this.state.mapLastUpdated = "Last updated: 3 minutes ago (STALE)";
      this.logEvent("Instructor Inject: Outdate Map", "Tactical map GPS telemetry frozen", "instructor");
    } else if (action === "restore_map") {
      this.state.mapStatus = "current";
      this.state.mapLastUpdated = "Live Telemetry Active";
      this.logEvent("Instructor Inject: Restore Map", "GPS feed re-synchronized", "instructor");
    } else if (action === "new_intelligence") {
      this.injectIncomingMessage("HIGH_COMMAND_RELAY", "INTELLIGENCE", "FLASH: High-power mobile electronic warfare emitter located at Choke Point Bravo.");
      this.logEvent("Instructor Inject: New Intel", "Acoustic EW intercept broadcasted", "instructor");
    }
    this.notify();
  }

  public generateAAR(): AARReportData {
    const deliveredCount = this.state.messages.filter((m) => m.status === "delivered").length;
    const delayedCount = this.state.messages.filter((m) => m.status === "delayed").length;
    const droppedCount = this.state.messages.filter((m) => m.status === "dropped").length;

    const findings: string[] = [];
    if (this.state.commsStatus !== "normal") {
      findings.push(`Unit endured multiple electronic degradation phases resulting in ${droppedCount} dropped messages and ${delayedCount} delayed packets.`);
    }
    if (this.state.decisions.length > 0) {
      findings.push(`Commander executed ${this.state.decisions.length} operational order(s) under high uncertainty and incomplete Common Operating Picture telemetry.`);
    } else {
      findings.push("No explicit tactical order was recorded prior to timeline conclusion.");
    }

    return {
      exerciseId: this.state.exerciseId,
      scenarioName: this.state.scenarioName,
      teamName: this.state.teamName,
      startedAt: this.startTimestamp,
      completedAt: Date.now(),
      durationSeconds: Math.floor(this.state.elapsedSeconds),
      commsTimeline: this.state.eventLog.map((l) => ({
        time: l.time,
        second: l.second,
        title: l.title,
        description: l.description,
        category: l.category
      })),
      decisions: this.state.decisions,
      messages: this.state.messages,
      stats: {
        duration: this.state.formattedTime,
        messagesTotal: this.state.messages.length,
        messagesDelivered: deliveredCount,
        messagesDelayed: delayedCount,
        messagesDropped: droppedCount,
        decisionsCount: this.state.decisions.length,
        finalCommsStatus: this.state.commsStatus,
        finalMapStatus: this.state.mapStatus
      },
      analyticalFindings: findings,
      recommendations: [
        "Pre-designate lost-communication rendezvous points and fallback azimuths before entering defiles.",
        "Cross-correlate conflicting visual scout observations against acoustic sensor data before committing main forces.",
        "Employ terrain-association dead reckoning immediately when tactical COP telemetry freezes."
      ]
    };
  }
}

// Global singleton instance for local simulation across pages
let globalSimulationEngine: LocalSimulationEngine | null = null;

export function getSimulationEngine(exerciseId: string = "exercise-demo-1", isDemo: boolean = true): LocalSimulationEngine {
  if (!globalSimulationEngine || globalSimulationEngine.getState().exerciseId !== exerciseId) {
    globalSimulationEngine = new LocalSimulationEngine(exerciseId, isDemo);
  }
  return globalSimulationEngine;
}
