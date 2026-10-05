import type { ExerciseState, AARReportData } from "../types/exercise";
import type { DecisionRecord } from "../types/decision";

type ObjectValue = Record<string, unknown>;
const object = (value: unknown): value is ObjectValue => value !== null && typeof value === "object" && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === "string");
const textFields = (value: ObjectValue, names: string[]) => names.every(name => typeof value[name] === "string");
const list = (value: unknown, check: (item: unknown) => boolean) => Array.isArray(value) && value.every(check);
const unit = (value: unknown) => object(value) && textFields(value, ["id", "name", "type", "faction", "status"]) && finite(value.x) && finite(value.y);
const activity = (value: unknown) => object(value) && textFields(value, ["id", "label", "type", "status"]) && finite(value.x) && finite(value.y);
const message = (value: unknown) => object(value) && textFields(value, ["id", "sender", "content", "deliveryStatus"]) && ["DELIVERED", "DELAYED", "DROPPED", "PENDING"].includes(value.deliveryStatus as string);
const decision = (value: unknown) => object(value) && textFields(value, ["id", "traineeId", "simulationTime", "selectedActionLabel", "rationale", "communicationState"]) && strings(value.availableInformation) && strings(value.unavailableInformation);
const event = (value: unknown) => object(value) && textFields(value, ["id", "time", "title", "description", "category"]) && finite(value.second);

/** Reject unusable updates instead of enabling controls against malformed state. */
export function isExerciseState(value: unknown, id: string): value is ExerciseState {
  if (!object(value) || value.exerciseId !== id || !textFields(value, ["scenarioName", "teamName", "formattedTime", "mapLastUpdated"])) return false;
  if (!["pending", "running", "paused", "completed"].includes(value.status as string) || !["normal", "delayed", "degraded", "offline"].includes(value.commsStatus as string) || !["current", "outdated", "unavailable"].includes(value.mapStatus as string)) return false;
  if (!finite(value.elapsedSeconds) || value.elapsedSeconds < 0 || !finite(value.totalDuration) || value.totalDuration <= 0 || !finite(value.speedMultiplier) || value.speedMultiplier <= 0) return false;
  if (!list(value.units, unit) || !list(value.activityMarkers, activity) || !list(value.messages, message) || !list(value.pendingMessages, message) || !list(value.decisions, decision) || !list(value.eventLog, event) || !strings(value.availableInformation) || !strings(value.unavailableInformation)) return false;
  if (value.trainingArea != null && (!object(value.trainingArea) || !textFields(value.trainingArea, ["id", "name"]) || !["latitude", "longitude", "widthMeters", "heightMeters"].every(key => finite(value.trainingArea && (value.trainingArea as ObjectValue)[key])))) return false;
  const point = value.activeDecisionPoint;
  if (point != null && (!object(point) || !textFields(point, ["id", "title", "situation"]) || !list(point.availableActions, item => object(item) && textFields(item, ["id", "label"])))) return false;
  return value.connectedTrainees == null || list(value.connectedTrainees, item => object(item) && textFields(item, ["name", "role"]));
}

export type ScenarioNotice = { event: string; timestamp: number; title: string; description: string };
export type SharedPacket =
  | { type: "STATE_UPDATE"; state: ExerciseState }
  | { type: "SCENARIO_EVENT"; notice: ScenarioNotice }
  | { type: "ACK"; requestId: string; result: ObjectValue }
  | { type: "ERROR"; requestId?: string; message: string }
  | { type: "IGNORED" };

export function parseSharedPacket(raw: string, id: string): SharedPacket {
  const packet: unknown = JSON.parse(raw);
  if (!object(packet) || typeof packet.type !== "string") throw new Error("Invalid simulation packet.");
  if (packet.type === "STATE_UPDATE") {
    if (!isExerciseState(packet.state, id)) throw new Error("Invalid simulation state.");
    return { type: "STATE_UPDATE", state: packet.state };
  }
  if (packet.type === "SCENARIO_EVENT") {
    if (typeof packet.event !== "string" || !finite(packet.timestamp)) throw new Error("Invalid scenario event.");
    return { type: "SCENARIO_EVENT", notice: { event: packet.event, timestamp: packet.timestamp, title: typeof packet.title === "string" ? packet.title : packet.event.replaceAll("_", " ").toLowerCase(), description: typeof packet.description === "string" ? packet.description : "The simulation server updated the information environment." } };
  }
  if (packet.type === "ACK") {
    if (typeof packet.requestId !== "string" || (packet.result != null && !object(packet.result))) throw new Error("Invalid acknowledgement.");
    return { type: "ACK", requestId: packet.requestId, result: object(packet.result) ? packet.result : {} };
  }
  if (packet.type === "ERROR") {
    if (typeof packet.message !== "string") throw new Error("Invalid server error.");
    return { type: "ERROR", requestId: typeof packet.requestId === "string" ? packet.requestId : undefined, message: packet.message };
  }
  // Additional envelopes (for example TEAM_MESSAGE) do not mutate state.
  // STATE_UPDATE is authoritative for messages, positions and decisions.
  return { type: "IGNORED" };
}

export type ServerAARReport = Omit<AARReportData, "startedAt" | "completedAt" | "decisions"> & {
  startedAt: number | null;
  completedAt: number | null;
  isFinal: boolean;
  decisions: (DecisionRecord & { mapStatus?: string })[];
};

export function isServerAARReport(value: unknown, id: string): value is ServerAARReport {
  if (!object(value) || value.exerciseId !== id || !textFields(value, ["scenarioName", "teamName"]) || typeof value.isFinal !== "boolean" || !finite(value.durationSeconds)) return false;
  if ((value.startedAt !== null && !finite(value.startedAt)) || (value.completedAt !== null && !finite(value.completedAt))) return false;
  if (value.trainingArea != null && (!object(value.trainingArea) || !textFields(value.trainingArea, ["id", "name"]) || !["latitude", "longitude", "widthMeters", "heightMeters"].every(key => finite((value.trainingArea as ObjectValue)[key])))) return false;
  if (!list(value.fullEventLog, event) || !list(value.decisions, decision) || !list(value.messages, message) || !list(value.pendingMessages, message) || !strings(value.analyticalFindings) || !strings(value.recommendations)) return false;
  const stats = value.stats;
  return object(stats) && typeof stats.duration === "string" && ["messagesTotal", "messagesDelivered", "messagesDelayed", "messagesDropped", "decisionsCount"].every(key => finite(stats[key]) && (stats[key] as number) >= 0);
}
