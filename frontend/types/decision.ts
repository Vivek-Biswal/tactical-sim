import { CommsStatus } from "./scenario";

export type ConfidenceLevel = "low" | "medium" | "high";

export interface DecisionAction {
  id: string;
  label: string;
  description?: string;
  consequence?: Record<string, unknown>;
}

export interface DecisionPoint {
  id: string;
  timestamp: number;
  simulationSecond: number;
  title: string;
  situation: string;
  availableActions: DecisionAction[];
  status: "active" | "resolved";
  timeLimit?: number;
  relatedSector?: string;
  relatedUnits?: string[];
}

export interface DecisionRecord {
  id: string;
  exerciseId: string;
  traineeId: string;
  decisionPointId: string;
  selectedActionId: string;
  selectedActionLabel: string;
  scenarioTimestamp: number;
  realTimestamp: number;
  communicationState: CommsStatus;
  
  // Optional relations
  relatedSector?: string;
  relatedUnits?: string[];

  // Legacy/AAR fields
  decision?: string; 
  rationale?: string;
  confidence?: ConfidenceLevel;
  simulationTime?: string;
  availableInformation?: string[];
  unavailableInformation?: string[];
}

// Backward-compatibility aliases used by AAR and legacy components
export type Decision = DecisionRecord;
export type DecisionPrompt = {
  eventId: string;
  prompt: string;
  options: Array<{ id: string; label: string; description?: string }>;
  timestamp: string;
  simulationSecond: number;
};
