import { CommsStatus, MapStatus, TacticalUnit, ActivityMarker } from "./scenario";
import { RadioMessage } from "./communication";
import { DecisionRecord, DecisionPoint } from "./decision";

export type ExerciseStatus = "pending" | "running" | "paused" | "completed";

export interface TraineePresence {
  role: string;
  name: string;
}

export interface SimulationEventLog {
  id: string;
  time: string;
  second: number;
  title: string;
  description: string;
  category: "comms" | "map" | "intel" | "decision" | "system" | "instructor" | "general" | string;
  payload?: Record<string, unknown>;
}

export interface ExerciseState {
  exerciseId: string;
  scenarioName: string;
  scenarioCode: string;
  teamName: string;
  isDemo: boolean;
  status: ExerciseStatus;
  elapsedSeconds: number;
  totalDuration: number;
  formattedTime: string;
  progressPercent: number;
  speedMultiplier: number;
  commsStatus: CommsStatus;
  radioDelaySeconds: number;
  messageLossPercentage: number;
  allowIncompleteReports: boolean;
  mapStatus: MapStatus;
  mapLastUpdated: string;
  units: TacticalUnit[];
  trueUnits?: TacticalUnit[];
  activityMarkers: ActivityMarker[];
  availableInformation: string[];
  unavailableInformation: string[];
  messages: RadioMessage[];
  pendingMessages: RadioMessage[];
  decisions: DecisionRecord[];
  activeDecisionPoint?: DecisionPoint | null;
  eventLog: SimulationEventLog[];
  connectedTrainees?: TraineePresence[];
}

export interface AARReportData {
  exerciseId: string;
  scenarioName: string;
  teamName: string;
  startedAt: number;
  completedAt: number;
  durationSeconds: number;
  // Legacy timeline (used by old DecisionTimeline component)
  commsTimeline: Array<{
    time: string;
    second: number;
    title: string;
    description: string;
    category: string;
  }>;
  // Full rich event log — the source of truth for the new AAR screen
  fullEventLog: SimulationEventLog[];
  decisions: DecisionRecord[];
  messages: RadioMessage[];
  pendingMessages: RadioMessage[];
  // Initial unit positions for map replay reconstruction
  initialUnits: TacticalUnit[];
  stats: {
    duration: string;
    messagesTotal: number;
    messagesDelivered: number;
    messagesDelayed: number;
    messagesDropped: number;
    decisionsCount: number;
    finalCommsStatus: CommsStatus;
    finalMapStatus: MapStatus;
  };
  analyticalFindings: string[];
  recommendations: string[];
}
