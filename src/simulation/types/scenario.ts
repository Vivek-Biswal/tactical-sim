import type { UnitDomain } from "./geography";
export type CommsStatus = "normal" | "delayed" | "degraded" | "offline";
export type MapStatus = "current" | "outdated" | "unavailable";

export interface ScenarioEventPayload {
  commsStatus?: CommsStatus;
  mapStatus?: MapStatus;
  radioDelaySeconds?: number;
  messageLossPercentage?: number;
  allowIncompleteReports?: boolean;
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
    consequence?: Record<string, unknown>;
  }>;
  availableInfo?: string[];
  unavailableInfo?: string[];
  
  // Phase 3 extensions
  targetUnitId?: string;
  x?: number;
  y?: number;
  heading?: number;
  status?: "operational" | "moving" | "damaged" | "unknown";
  faction?: "friendly" | "hostile" | "neutral" | "unknown";
  communicationStatus?: "NORMAL" | "DELAYED" | "DEGRADED" | "LOST";
  
  activityMarker?: ActivityMarker;
  movementDurationSeconds?: number;
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
  type: string;
  faction: "friendly" | "hostile" | "neutral" | "unknown";
  x: number;
  y: number;
  heading?: number;
  /** UAV height above terrain; rendering metadata, not a new flight engine. */
  altitudeMeters?: number;
  domain?: UnitDomain;
  speedGridPerSecond?: number;
  patrolRoute?: { x: number; y: number }[];
  patrolIndex?: number;
  destination?: { x: number; y: number };
  status: "operational" | "moving" | "damaged" | "unknown";
  sector?: string;
  communicationStatus?: "NORMAL" | "DELAYED" | "DEGRADED" | "LOST";
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
  initialActivityMarkers?: ActivityMarker[];
  events: ScenarioEvent[];
}
