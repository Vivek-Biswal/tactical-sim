import { ExerciseState, AARReportData, SimulationEventLog } from "../types/exercise";
import { Scenario, ScenarioEvent } from "../types/scenario";
import { RadioMessage, MessageSenderRole, MessageType, DeliveryStatus } from "../types/communication";
import { DecisionRecord, DecisionPoint } from "../types/decision";
import { getDemoScenario } from "../data/demoScenario";
const formatSimTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;

export class LocalSimulationEngine {
  private state: ExerciseState;
  private scenario: Scenario;
  private timerId: NodeJS.Timeout | null = null;
  private listeners: Set<(state: ExerciseState) => void> = new Set();
  private triggeredEventIds: Set<string> = new Set();
  private startTimestamp: number = Date.now();
  private lastMapUpdateSecond = 0;

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
      messageLossPercentage: 0,
      allowIncompleteReports: false,
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
      pendingMessages: [],
      decisions: [],
      activeDecisionPoint: null,
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
    if (this.state.status === "running" || this.state.status === "completed") return;
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
    this.lastMapUpdateSecond = 0;
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

    // Units only move via explicit scenario events now.
    
    // Process pending messages (Phase 4)
    const remainingPending: RadioMessage[] = [];
    for (const msg of this.state.pendingMessages) {
      if (msg.delayRemaining !== undefined) {
        msg.delayRemaining -= effectiveDelta;
        if (msg.delayRemaining <= 0) {
          msg.status = "delivered";
          msg.deliveryStatus = "DELIVERED";
          msg.delayRemaining = 0;
          msg.timestampDelivered = Date.now();
          msg.formattedTimeDelivered = this.state.formattedTime;
          this.state.messages.push(msg);
          this.logEvent("Message Delivered", `From ${msg.sender}: ${msg.content.substring(0, 35)}...`, "comms", { messageId: msg.id });
        } else {
          remainingPending.push(msg);
        }
      } else {
        // Fallback for safety, shouldn't happen if properly initialized
        remainingPending.push(msg);
      }
    }
    this.state.pendingMessages = remainingPending;

    // Check scenario timeline triggers
    for (const evt of this.scenario.events) {
      if (!this.triggeredEventIds.has(evt.id) && this.state.elapsedSeconds >= evt.triggerTime) {
        this.triggeredEventIds.add(evt.id);
        this.triggerScenarioEvent(evt);
      }
    }

    this.refreshMap();

    // Check completion
    if (this.state.elapsedSeconds >= this.state.totalDuration) {
      this.end();
    }

    this.notify();
  }

  private refreshMap() {
    if (this.state.mapStatus === "current") {
      this.state.units = JSON.parse(JSON.stringify(this.state.trueUnits));
      this.lastMapUpdateSecond = this.state.elapsedSeconds;
      this.state.mapLastUpdated = `Updated at ${this.state.formattedTime}`;
    } else if (this.state.mapStatus === "unavailable") {
      this.state.mapLastUpdated = "Telemetry unavailable";
    } else {
      this.state.mapLastUpdated = `Last update ${formatSimTime(this.lastMapUpdateSecond)} · ${Math.floor(this.state.elapsedSeconds - this.lastMapUpdateSecond)}s old`;
    }
  }

  public dispose() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = null;
  }

  private triggerScenarioEvent(evt: ScenarioEvent) {
    const payload = evt.payload;
    if (payload.mapStatus) this.state.mapStatus = payload.mapStatus;
    this.logEvent(evt.title, evt.description, evt.type, payload);

    if (payload.availableInfo) {
      this.state.availableInformation = payload.availableInfo;
    }
    if (payload.unavailableInfo) {
      this.state.unavailableInformation = payload.unavailableInfo;
    }

    if (evt.type === "UNIT_MOVE" || evt.type === "CONTACT_DETECTED" || evt.type === "STATUS_CHANGE") {
      if (payload.targetUnitId && this.state.trueUnits) {
        const unit = this.state.trueUnits.find(u => u.id === payload.targetUnitId);
        if (unit) {
          if (payload.x !== undefined) unit.x = payload.x as number;
          if (payload.y !== undefined) unit.y = payload.y as number;
          if (payload.heading !== undefined) unit.heading = payload.heading as number;
          if (payload.status !== undefined) unit.status = payload.status as any;
          if (payload.faction !== undefined) unit.faction = payload.faction as any;
          if (payload.communicationStatus !== undefined) unit.communicationStatus = payload.communicationStatus as any;
        }
      }
    } else if (evt.type === "INTEL_REPORT") {
      const sender = payload.sender || "UAV REPORT";
      const role = payload.senderRole || "INTELLIGENCE";
      const content = payload.content || "Emergent intelligence update received.";
      // Route INTEL_REPORT through Phase 4 comms logic
      this.generateMessage(sender, role, content, "INTEL_REPORT");
    } else if (evt.type === "CONFLICTING_REPORT") {
      if (payload.reports) {
        // Phase 4: Conflicting reports
        const groupId = Math.random().toString(36).substring(2, 9);
        for (const rep of payload.reports) {
          this.generateMessage(rep.source, rep.senderRole, rep.content, "CONFLICTING_REPORT", true, groupId);
        }
      }
    } else if (evt.type === "comms_degradation") {
      if (payload.commsStatus) {
        this.state.commsStatus = payload.commsStatus as any;
        this.state.radioDelaySeconds = Number(payload.radioDelaySeconds) || 0;
        this.state.messageLossPercentage = Number(payload.messageLossPercentage) || 0;
        this.state.allowIncompleteReports = !!payload.allowIncompleteReports;
      }
      if (payload.broadcastMessage) {
        const bm = payload.broadcastMessage;
        // Broadcasts from instructor/system often bypass degradation, but we'll use normal generateMessage for realism unless it's a SYSTEM message
        this.generateMessage(bm.sender, bm.senderRole, bm.content, "SYSTEM");
      }
    } else if (evt.type === "map_status") {
      if (payload.mapStatus) {
        this.state.mapStatus = payload.mapStatus as any;
        this.refreshMap();
      }
    } else if (evt.type === "decision_point") {
      this.state.activeDecisionPoint = {
        id: evt.id,
        title: payload.title as string || "Commander Decision Required",
        situation: payload.prompt as string || payload.situation as string || "Situation unclear.",
        availableActions: (payload.options as any[]) || [],
        status: "active",
        timestamp: Date.now(),
        simulationSecond: this.state.elapsedSeconds,
        relatedSector: payload.relatedSector as string,
        relatedUnits: payload.relatedUnits as string[]
      };
      
      // Check if we need to pause
      if (payload.pauseOnDecision) {
        this.pause();
      }
    }
  }

  // Phase 4 Core Communication Engine
  public generateMessage(
    sender: string, 
    senderRole: string, 
    content: string, 
    messageType: MessageType = "UNIT_REPORT",
    isConflicting: boolean = false,
    conflictGroupId?: string
  ): RadioMessage {
    const msgId = Math.random().toString(36).substring(2, 9);
    let finalContent = content;
    
    // 1. Process Incomplete Reports (Degraded State)
    if (this.state.commsStatus === "degraded" && this.state.allowIncompleteReports && messageType !== "SYSTEM") {
      // Simulate static/garbled text by replacing random words with [GARBLED] or UNKNOWN
      // A simple deterministic approach: replace numbers with UNKNOWN
      if (content.match(/\b\d+\b/g)) {
        finalContent = content.replace(/\b\d+\b/g, "UNKNOWN");
      } else {
        // If no numbers, just randomly garble some words for effect, deterministically based on length
        const words = content.split(" ");
        if (words.length > 3) {
           words[Math.floor(words.length / 2)] = "[STATIC]";
           finalContent = words.join(" ");
        }
      }
    }

    const baseMsg: RadioMessage = {
      id: msgId,
      exerciseId: this.state.exerciseId,
      sender,
      senderRole,
      content: finalContent,
      originalContent: content,
      messageType,
      timestamp: Date.now(),
      timestampGenerated: Date.now(),
      formattedTime: this.state.formattedTime,
      status: "sent",
      deliveryStatus: "PENDING",
      communicationState: this.state.commsStatus,
      isConflicting,
      conflictGroupId
    };

    // Instructor/System messages usually bypass degradation to ensure trainee knows what's going on
    if (messageType === "SYSTEM" || senderRole === "INSTRUCTOR" || senderRole === "COMMANDER") {
       // Commander (Trainee) outbound messages still experience drop/delay in real life, but for now we'll route them normally, 
       // actually the requirement says: "When communication state is LOST: Messages generated by affected units should not be delivered."
       // If Commander sends a message while LOST, it should drop.
    }

    // 2. Process Message Loss (Offline or Degraded with loss)
    if (this.state.commsStatus === "offline" || (this.state.commsStatus === "degraded" && Math.random() * 100 < this.state.messageLossPercentage)) {
      baseMsg.status = "dropped";
      baseMsg.deliveryStatus = "DROPPED";
      baseMsg.content = `[SIGNAL LOST] ${baseMsg.content}`;
      this.state.messages.push(baseMsg);
      this.logEvent("Message Dropped", `Generated by ${sender} but dropped due to comms degradation.`, "comms", { messageId: msgId });
      this.notify();
      return baseMsg;
    }

    // 3. Process Message Delay (Delayed or Degraded)
    if (this.state.commsStatus === "delayed" || this.state.commsStatus === "degraded") {
      const delay = this.state.radioDelaySeconds || 8;
      baseMsg.status = "delayed";
      baseMsg.deliveryStatus = "DELAYED";
      baseMsg.delayRemaining = delay;
      this.state.pendingMessages.push(baseMsg);
      this.logEvent("Message Queued", `Generated by ${sender}, delayed by ${delay}s`, "comms", { messageId: msgId });
      this.notify();
      return baseMsg;
    }

    // 4. Normal Delivery
    baseMsg.status = "delivered";
    baseMsg.deliveryStatus = "DELIVERED";
    baseMsg.timestampDelivered = Date.now();
    baseMsg.formattedTimeDelivered = this.state.formattedTime;
    this.state.messages.push(baseMsg);
    this.notify();
    return baseMsg;
  }

  // Legacy compat wrapper for trainees (e.g. from RadioPanel)
  public sendRadioMessage(sender: string, role: string, content: string): RadioMessage {
    return this.generateMessage(sender, role, content, "COMMAND");
  }

  // Legacy compat wrapper for old injects
  public injectIncomingMessage(sender: string, senderRole: string, content: string) {
    this.generateMessage(sender, senderRole, content, "SYSTEM");
  }

  public submitDecision(decisionText: string, rationale: string, confidence: "low" | "medium" | "high", traineeId: string = "COMMANDER_1", actionId?: string): DecisionRecord {
    const point = this.state.activeDecisionPoint;
    const actionLabel = point?.availableActions.find(a => a.id === actionId)?.label || decisionText;
    
    const dec: DecisionRecord = {
      id: Math.random().toString(36).substring(2, 9),
      exerciseId: this.state.exerciseId,
      traineeId,
      decisionPointId: point?.id || "unknown",
      selectedActionId: actionId || "custom",
      selectedActionLabel: actionLabel,
      decision: decisionText, // legacy
      rationale, // legacy
      confidence, // legacy
      realTimestamp: Date.now(),
      scenarioTimestamp: Math.floor(this.state.elapsedSeconds),
      communicationState: this.state.commsStatus,
      simulationTime: this.state.formattedTime, // legacy
      availableInformation: [...this.state.availableInformation], // legacy
      unavailableInformation: [...this.state.unavailableInformation], // legacy
      relatedSector: point?.relatedSector,
      relatedUnits: point?.relatedUnits
    };

    this.state.decisions.push(dec);
    this.state.activeDecisionPoint = null;
    
    // Process consequence
    const selectedAction = point?.availableActions.find(a => a.id === actionId);
    if (selectedAction?.consequence) {
      this.processDecisionConsequence(selectedAction.consequence);
    }
    
    this.refreshMap();
    this.logEvent("Commander Decision Submitted", `Action: ${actionLabel}`, "decision", {
      actionId,
      actionLabel,
      rationale,
      confidence
    });
    this.notify();
    
    // Automatically resume if we were paused for this decision
    // Usually scenarios will resume automatically if they were paused
    if (this.state.status === "paused") {
       // Only if explicitly instructed, but normally user resumes manually. We can leave it manual or auto.
       // Let's assume manual or if explicitly paused by event, we resume.
    }
    
    return dec;
  }
  
  private processDecisionConsequence(consequence: Record<string, unknown>) {
    if (consequence.type === "schedule_event") {
       if (consequence.eventPayload) {
          const payload = consequence.eventPayload as any;
          if (payload.type === "STATUS_CHANGE" && payload.targetUnitId && this.state.trueUnits) {
             const unit = this.state.trueUnits.find(u => u.id === payload.targetUnitId);
             if (unit && payload.status) {
               unit.status = payload.status;
               this.logEvent("Unit Status Changed", `Unit status changed to ${unit.status}`, "STATUS_CHANGE", { targetUnitId: unit.id, status: unit.status });
             }
          }
       }
    } else if (consequence.type === "move_unit") {
       if (this.state.trueUnits) {
         const unit = this.state.trueUnits.find(u => u.id === consequence.targetUnitId);
         if (unit) {
            if (consequence.sector) unit.sector = consequence.sector as string;
            if (consequence.status) unit.status = consequence.status as any;
            if (consequence.x !== undefined) unit.x = consequence.x as number;
            if (consequence.y !== undefined) unit.y = consequence.y as number;
            
            this.logEvent("Unit Moved (Decision Consequence)", `Unit ${unit.name} moving based on commander order`, "UNIT_MOVE", {
              targetUnitId: unit.id,
              sector: unit.sector,
              status: unit.status,
              x: unit.x,
              y: unit.y
            });
         }
       }
    }
  }

  public applyInstructorInject(action: string, payload?: Record<string, unknown>) {
    if (action === "set_comms") {
      this.state.commsStatus = (payload?.status as any) || "normal";
      this.state.radioDelaySeconds = Number(payload?.delay || 0);
      this.state.messageLossPercentage = Number(payload?.loss || 0);
      this.state.allowIncompleteReports = !!payload?.incomplete;
      this.logEvent("Instructor Inject: Comms State", `Forced comms to ${this.state.commsStatus}`, "instructor");
    } else if (action === "conflicting_report") {
       this.generateMessage("Team Alpha Lead", "TEAM_ALPHA", "URGENT: Hostile movement sighted near Sector 2 tree-line!", "CONFLICTING_REPORT", true, "grp1");
       this.generateMessage("SIGINT Remote", "INTELLIGENCE", "ADVISORY: Acoustic arrays indicate Sector 2 clear; activity concentrated near Sector 5.", "CONFLICTING_REPORT", true, "grp1");
       this.logEvent("Instructor Inject: Conflicting SITREPs", "Dispatched contradictory intelligence feeds", "instructor");
    } else if (action === "outdate_map") {
      this.state.mapStatus = "outdated";
      this.refreshMap();
      this.logEvent("Instructor Inject: Outdate Map", "Tactical map GPS telemetry frozen", "instructor");
    } else if (action === "unavailable_map") {
      this.state.mapStatus = "unavailable";
      this.logEvent("Map Unavailable", "Map feed denied", "map_status", { mapStatus: "unavailable" });
    } else if (action === "restore_map") {
      this.state.mapStatus = "current";
      this.state.mapLastUpdated = "Live Telemetry Active";
      this.logEvent("Instructor Inject: Restore Map", "GPS feed re-synchronized", "instructor");
    } else if (action === "intel_report") {
      this.generateMessage(
        String(payload?.source || "Instructor"),
        String(payload?.senderRole || "INTELLIGENCE"),
        String(payload?.message || "Intel Report"),
        "INTEL_REPORT",
        true
      );
      this.logEvent("Instructor Inject: Intel Report", `Source: ${payload?.source}`, "instructor");
    } else if (action === "move_unit") {
      const unit = this.state.trueUnits?.find(u => u.id === payload?.targetUnitId);
      if (unit) {
        if (typeof payload?.x === "number") unit.x = payload.x;
        if (typeof payload?.y === "number") unit.y = payload.y;
        unit.sector = payload?.sector as string || unit.sector;
        this.logEvent("Instructor Inject: Move Unit", `Moved ${unit.name} to ${unit.sector}`, "instructor");
      }
    } else if (action === "change_status") {
      const unit = this.state.trueUnits?.find(u => u.id === payload?.targetUnitId);
      if (unit) {
        unit.status = payload?.status as any || unit.status;
        this.logEvent("Instructor Inject: Change Status", `Status of ${unit.name} set to ${unit.status}`, "instructor");
      }
    } else if (action === "detect_contact" || action === "activate_contact") {
      const contactId = payload?.targetContactId as string;
      const contact = this.state.trueUnits?.find(u => u.id === contactId);
      if (contact) {
        contact.sector = payload?.sector as string || contact.sector;
        contact.faction = action === "activate_contact" ? "hostile" : "unknown";
        this.logEvent(`Instructor Inject: ${action}`, `Contact ${contact.name} in ${contact.sector} set to ${contact.faction}`, "instructor");
      }
    } else if (action === "change_objective") {
      const title = payload?.title as string || "New Objective";
      const desc = payload?.description as string || "";
      this.logEvent("Instructor Inject: Change Objective", `Objective updated: ${title} - ${desc}`, "instructor");
      this.generateMessage("HQ Command", "HQ", `NEW OBJECTIVE: ${title}. ${desc}`, "SYSTEM", true);
    } else if (action === "decision_point") {
      this.state.activeDecisionPoint = {
        id: "instructor-decision-" + Date.now(),
        title: String(payload?.title || "Commander Decision Required"),
        situation: String(payload?.prompt || "Situation requires immediate decision."),
        availableActions: (payload?.options as any) || [],
        status: "active",
        timestamp: Date.now(),
        simulationSecond: this.state.elapsedSeconds
      };
      this.logEvent("Instructor Inject: Decision Point", `Forced decision point: ${payload?.title}`, "instructor");
    }
    this.refreshMap();
    this.notify();
  }

  public generateAAR(): AARReportData {
    const deliveredCount = this.state.messages.filter((m) => m.deliveryStatus === "DELIVERED").length;
    const delayedCount = this.state.messages.filter((m) => m.deliveryStatus === "DELAYED").length + this.state.pendingMessages.length;
    const droppedCount = this.state.messages.filter((m) => m.deliveryStatus === "DROPPED").length;

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
      fullEventLog: [...this.state.eventLog],
      decisions: this.state.decisions,
      messages: this.state.messages,
      pendingMessages: this.state.pendingMessages,
      initialUnits: JSON.parse(JSON.stringify(this.scenario.initialUnits)),
      stats: {
        duration: this.state.formattedTime,
        messagesTotal: this.state.messages.length + this.state.pendingMessages.length,
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

let globalSimulationEngine: LocalSimulationEngine | null = null;

export function getSimulationEngine(exerciseId: string = "exercise-demo-1", isDemo: boolean = true): LocalSimulationEngine {
  if (!globalSimulationEngine || globalSimulationEngine.getState().exerciseId !== exerciseId) {
    globalSimulationEngine?.dispose();
    globalSimulationEngine = new LocalSimulationEngine(exerciseId, isDemo);
  }
  return globalSimulationEngine;
}
