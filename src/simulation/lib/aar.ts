import type { AARReportData, SimulationEventLog } from "../types/exercise";
import type { DecisionRecord } from "../types/decision";
import type { RadioMessage } from "../types/communication";

export type TimelineCategory = "scenario" | "communication" | "intelligence" | "decision" | "team" | "instructor";
export type ReviewEvent = { id: string; second: number; title: string; description: string; category: TimelineCategory; decisionId?: string; messageId?: string; payload?: Record<string, unknown> };
export type StateInterval = { second: number; end: number; state: string; delay?: number; duration: number; recovery?: number };
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const knownSecond = (value: unknown): number | null => finite(value) && value >= 0 ? value : null;
export const displayValue = (value: string | undefined | null) => value ? value.replaceAll("_", " ") : "Not available";

/** All intervals and latencies use the simulation clock, including accelerated practice. */
export function formatAARTime(second: number | null | undefined, precise = false): string {
  if (!finite(second) || second < 0) return "Not available";
  const tenths = Math.round(second * 10);
  const whole = precise ? Math.floor(tenths / 10) : Math.floor(second);
  return `${Math.floor(whole / 60).toString().padStart(2, "0")}:${(whole % 60).toString().padStart(2, "0")}${precise ? `.${tenths % 10}` : ""}`;
}

export function wallTime(value: number | null): string {
  if (!finite(value) || value <= 0) return "Not available";
  const date = new Date(value < 1e12 ? value * 1000 : value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
}

function parseClock(value: string | undefined): number | null {
  if (!value || !/^\d+:\d{2}(?:\.\d+)?$/.test(value)) return null;
  const [minutes, seconds] = value.split(":").map(Number);
  return minutes * 60 + seconds;
}

export function decisionSecond(decision: DecisionRecord): number | null {
  return knownSecond(decision.simulationSecond) ?? knownSecond(decision.scenarioTimestamp) ?? parseClock(decision.simulationTime);
}

export function messageSecond(message: RadioMessage, delivered = false): number | null {
  const explicit = knownSecond(delivered ? message.deliveredSecond : message.generatedSecond);
  if (explicit !== null) return explicit;
  // Older local records use wall-clock milliseconds; server records use simulation seconds.
  const timestamp = delivered ? message.timestampDelivered : message.timestampGenerated;
  return finite(timestamp) && timestamp < 1e9 ? knownSecond(timestamp) : parseClock(delivered ? message.formattedTimeDelivered : message.formattedTime);
}

export function allMessages(report: AARReportData): RadioMessage[] {
  const unique = new Map<string, RadioMessage>();
  // Backend pendingMessages also occur in messages. Count every transmission once.
  for (const message of [...report.pendingMessages, ...report.messages]) unique.set(message.id, message);
  return [...unique.values()].sort((a, b) => (messageSecond(a) ?? Infinity) - (messageSecond(b) ?? Infinity));
}

function category(event: SimulationEventLog, message?: RadioMessage): TimelineCategory {
  if (/^(Exercise|Scenario) Started$/i.test(event.title)) return "scenario";
  if (/decision/i.test(event.category) || event.payload?.decisionPointId) return "decision";
  if (event.source === "instructor" || event.category === "instructor") return "instructor";
  if (message) return /INTEL|CONFLICTING/.test(message.messageType ?? "") ? "intelligence" : /TEAM|COMMANDER/.test(message.senderRole) ? "team" : "communication";
  if (/comms|radio|map|message|communication/i.test(event.category)) return "communication";
  if (/intel|report/i.test(event.category)) return "intelligence";
  if (/unit_move|team_movement|patrol|status_change/i.test(event.category)) return "team";
  return "scenario";
}

export function buildTimeline(report: AARReportData): ReviewEvent[] {
  const messages = new Map(allMessages(report).map(message => [message.id, message]));
  const decisionIds = new Set(report.decisions.map(d => d.id));
  const linkedDecisions = new Set<string>();
  const deliveries = new Set<string>();
  const attempts = new Set<string>();
  const timeline: ReviewEvent[] = report.fullEventLog.map(event => {
    const messageId = typeof event.payload?.messageId === "string" ? event.payload.messageId : undefined;
    const decisionId = typeof event.payload?.decisionId === "string" && decisionIds.has(event.payload.decisionId) ? event.payload.decisionId : undefined;
    const message = messageId ? messages.get(messageId) : undefined;
    const wasDelivered = /delivered/i.test(event.title + event.category);
    if (decisionId) linkedDecisions.add(decisionId);
    if (messageId) (wasDelivered ? deliveries : attempts).add(messageId);
    const decision = decisionId ? report.decisions.find(d => d.id === decisionId) : undefined;
    return { ...event, id: `event-${event.id}`, title: decision ? decision.selectedActionLabel : message && wasDelivered ? `Message delivered · ${message.sender}` : event.title, description: decision?.rationale ?? (message && wasDelivered ? message.content : event.description), category: decisionId ? "decision" : category(event, message), decisionId, messageId };
  });
  for (const decision of report.decisions) {
    const second = decisionSecond(decision);
    if (!linkedDecisions.has(decision.id) && second !== null) timeline.push({ id: `decision-${decision.id}`, second, title: decision.selectedActionLabel || decision.decision || "Decision submitted", description: decision.rationale || "Rationale not recorded.", category: "decision", decisionId: decision.id });
  }
  for (const message of messages.values()) {
    const generated = messageSecond(message);
    const delivered = messageSecond(message, true);
    const type = /INTEL|CONFLICTING/.test(message.messageType ?? "") ? "intelligence" : "team";
    if (message.deliveryStatus === "DELIVERED" && delivered !== null && !deliveries.has(message.id)) timeline.push({ id: `delivered-${message.id}`, second: delivered, title: `Report received · ${message.sender}`, description: message.content, category: type, messageId: message.id });
    if (generated !== null && !attempts.has(message.id) && (message.deliveryStatus !== "DELIVERED" || (delivered !== null && delivered > generated))) timeline.push({ id: `generated-${message.id}`, second: generated, title: `Transmission generated · ${message.sender}`, description: `${message.deliveryStatus.toLowerCase()} · received content is shown separately.`, category: type, messageId: message.id });
  }
  return timeline.sort((a, b) => a.second - b.second);
}

export function responseTimes(report: AARReportData, decision: DecisionRecord) {
  const prompt = report.fullEventLog.find(event => event.payload?.decisionPointId === decision.decisionPointId && !event.payload?.decisionId);
  const required = knownSecond(decision.decisionRequiredSecond) ?? (prompt ? knownSecond(prompt.second) : null);
  const submitted = decisionSecond(decision);
  const latency = knownSecond(decision.responseLatencySeconds) ?? (required !== null && submitted !== null && submitted >= required ? submitted - required : null);
  return { event: knownSecond(decision.decisionEventSecond), required, submitted, latency };
}

export type ReportAvailability = "available" | "unavailable" | "unknown";
export function reportAvailability(report: AARReportData, message: RadioMessage, decision: DecisionRecord): ReportAvailability {
  const delivered = messageSecond(message, true);
  const submitted = decisionSecond(decision);
  if (message.deliveryStatus !== "DELIVERED") return "unavailable";
  if (delivered !== null && submitted !== null && delivered > submitted) return "unavailable";
  if (decision.informationSnapshot?.reportIds) return decision.informationSnapshot.reportIds.includes(message.id) ? "available" : "unavailable";
  if (delivered === null || submitted === null) return "unknown";
  if (delivered < submitted) return "available";
  // Resolve equal timestamps from event order, never from final report contents.
  const deliveryIndex = report.fullEventLog.findIndex(event => event.payload?.messageId === message.id && /delivered/i.test(event.title + event.category));
  const decisionIndex = report.fullEventLog.findIndex(event => event.payload?.decisionId === decision.id);
  return deliveryIndex >= 0 && decisionIndex >= 0 ? deliveryIndex < decisionIndex ? "available" : "unavailable" : "unknown";
}

/** Recorded state transitions only; missing initial state is not assumed normal. */
export function stateIntervals(report: AARReportData, kind: "radio" | "map"): StateInterval[] {
  const transitions: { second: number; state: string; delay?: number }[] = [];
  for (const event of [...report.fullEventLog].sort((a, b) => a.second - b.second)) {
    const payload = event.payload ?? {};
    const value = kind === "radio" ? payload.commsStatus ?? payload.radioStatus : payload.mapStatus;
    if (typeof value !== "string") continue;
    const state = value.toLowerCase() === "lost" ? "offline" : value.toLowerCase();
    if (transitions.at(-1)?.state === state) continue;
    transitions.push({ second: event.second, state, delay: kind === "radio" && finite(payload.radioDelaySeconds ?? payload.radioDelay) ? Number(payload.radioDelaySeconds ?? payload.radioDelay) : undefined });
  }
  let disruptionStarted: number | null = null;
  return transitions.map((transition, index) => {
    const end = transitions[index + 1]?.second ?? report.durationSeconds;
    const normal = kind === "radio" ? "normal" : "current";
    let recovery: number | undefined;
    if (transition.state !== normal && disruptionStarted === null) disruptionStarted = transition.second;
    if (transition.state === normal && disruptionStarted !== null) { recovery = transition.second - disruptionStarted; disruptionStarted = null; }
    return { ...transition, end, duration: Math.max(0, end - transition.second), recovery };
  });
}

export function analyzeAAR(report: AARReportData) {
  const messages = allMessages(report);
  const radio = stateIntervals(report, "radio");
  const map = stateIntervals(report, "map");
  const latencies = report.decisions.map(decision => responseTimes(report, decision).latency).filter(finite);
  const unavailableSeconds = radio.filter(interval => interval.state === "offline").reduce((sum, interval) => sum + interval.duration, 0);
  const radioCoverageComplete = radio[0]?.second === 0;
  return {
    messages, radio, map, timeline: buildTimeline(report),
    disruptions: radio.filter((interval, index) => interval.state !== "normal" && (index === 0 || radio[index - 1].state === "normal")).length,
    conflicts: messages.filter(message => message.isConflicting).length,
    informationUpdates: messages.filter(message => message.deliveryStatus === "DELIVERED" && /INTEL|CONFLICTING/.test(message.messageType ?? "")).length,
    averageLatency: latencies.length ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : null,
    measuredResponses: latencies.length,
    radioAvailableSeconds: radioCoverageComplete ? Math.max(0, report.durationSeconds - unavailableSeconds) : null,
    summary: `${report.decisions.length} ${report.decisions.length === 1 ? "decision was" : "decisions were"} recorded over ${formatAARTime(report.durationSeconds)} of simulation time. ${report.stats.messagesDelivered} transmissions were delivered, ${report.stats.messagesDelayed} experienced delay and ${report.stats.messagesDropped} were dropped. ${messages.filter(message => message.isConflicting).length} transmissions were marked conflicting. Rationale was recorded for ${report.decisions.filter(d => d.rationale?.trim()).length} of ${report.decisions.length} decisions.`,
  };
}

export function decisionsCSV(report: AARReportData): string {
  const cell = (value: unknown) => {
    const raw = value == null ? "Not available" : String(value);
    const safe = /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const rows: unknown[][] = [["simulationSecond", "traineeId", "decision", "rationale", "confidence", "comms", "map", "availableInformation", "unavailableInformation", "decisionRequiredSecond", "responseLatencySeconds", "availableReportIds"]];
  for (const decision of report.decisions) rows.push([decisionSecond(decision), decision.traineeId, decision.selectedActionLabel, decision.rationale, decision.confidence, decision.communicationState, decision.mapStatus, decision.availableInformation?.join(" | "), decision.unavailableInformation?.join(" | "), responseTimes(report, decision).required, responseTimes(report, decision).latency, decision.informationSnapshot?.reportIds?.join(" | ")]);
  return rows.map(row => row.map(cell).join(",")).join("\r\n");
}

export function downloadReview(report: AARReportData, format: "json" | "csv") {
  const content = format === "json" ? JSON.stringify({ ...report, reviewAnalysis: analyzeAAR(report) }, null, 2) : decisionsCSV(report);
  const url = URL.createObjectURL(new Blob([content], { type: format === "json" ? "application/json" : "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url; link.download = `aar-${report.exerciseId}.${format}`;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function localReportKey(id: string, accountId: string | null) { return `tactical-sim:aar:v1:${accountId ?? "local-practice"}:${id.toLowerCase()}`; }

export function saveLocalReport(report: AARReportData, accountId: string | null): boolean {
  if (!report.isFinal) return false;
  try {
    localStorage.setItem(localReportKey(report.exerciseId, accountId), JSON.stringify(report));
    if (typeof window !== "undefined") window.dispatchEvent(new Event("tactical-sim:aar-saved"));
    return true;
  }
  catch { return false; }
}
