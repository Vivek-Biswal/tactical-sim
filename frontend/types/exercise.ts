import { CommsStatus, MapStatus, TacticalUnit, ActivityMarker } from "./scenario";
import { RadioMessage } from "./communication";
import { Decision, DecisionPrompt } from "./decision";

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
  mapStatus: MapStatus;
  mapLastUpdated: string;
  units: TacticalUnit[];
  trueUnits?: TacticalUnit[];
  activityMarkers: ActivityMarker[];
  availableInformation: string[];
  unavailableInformation: string[];
  messages: RadioMessage[];
  decisions: Decision[];
  decisionRequired?: DecisionPrompt | null;
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
  commsTimeline: Array<{
    time: string;
    second: number;
    title: string;
    description: string;
    category: string;
  }>;
  decisions: Decision[];
  messages: RadioMessage[];
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
