export type CommsStatus = "normal" | "delayed" | "offline";
export type MapStatus = "current" | "outdated" | "unavailable";

export interface ScenarioEventPayload {
  commsStatus?: CommsStatus;
  mapStatus?: MapStatus;
  radioDelaySeconds?: number;
  staleSinceSeconds?: number;
  staleMessage?: string;
  systemAlert?: string;
  sender?: string;
  senderRole?: string;
  content?: string;
  reports?: Array<{
    source: string;
    senderRole: string;
    content: string;
  }>;
  broadcastMessage?: {
    sender: string;
    senderRole: string;
    content: string;
  };
  prompt?: string;
  options?: Array<{
    id: string;
    label: string;
    description: string;
  }>;
  availableInfo?: string[];
  unavailableInfo?: string[];
  [key: string]: unknown;
}

export interface ScenarioEvent {
  id: string;
  type: string;
  triggerTime: number; // in seconds
  title: string;
  description: string;
  payload: ScenarioEventPayload;
}

export interface TacticalUnit {
  id: string;
  name: string;
  callsign: string;
  role: string;
  x: number;
  y: number;
  heading?: number;
  status: "operational" | "degraded" | "contested" | "neutral";
}

export interface ActivityMarker {
  id: string;
  label: string;
  x: number;
  y: number;
  type: "checkpoint" | "contact_warning" | "hostile_jammer" | "objective";
  status: "active" | "unverified" | "high_threat" | "cleared";
}

export interface Scenario {
  id: string;
  name: string;
  codeName: string;
  description: string;
  durationSeconds: number;
  operationalArea: string;
  initialUnits: TacticalUnit[];
  events: ScenarioEvent[];
}
