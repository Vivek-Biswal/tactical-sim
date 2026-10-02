export type ConfidenceLevel = "low" | "medium" | "high";

export interface Decision {
  id: string;
  exerciseId: string;
  traineeId: string;
  decision: string;
  rationale: string;
  confidence: ConfidenceLevel;
  timestamp: number;
  simulationTime: string;
  simulationSecond: number;
  availableInformation: string[];
  unavailableInformation: string[];
}

export interface DecisionPromptOption {
  id: string;
  label: string;
  description: string;
}

export interface DecisionPrompt {
  eventId: string;
  prompt: string;
  options: DecisionPromptOption[];
  timestamp: string;
  simulationSecond: number;
}
