import { CommsStatus } from "./scenario";

export type MessageSenderRole = "COMMANDER" | "TEAM_ALPHA" | "TEAM_BRAVO" | "INTELLIGENCE" | "INSTRUCTOR" | "HQ";

export interface RadioMessage {
  id: string;
  exerciseId: string;
  sender: string;
  senderRole: MessageSenderRole | string;
  recipient?: string;
  content: string;
  timestamp: number;
  formattedTime: string;
  status: "sent" | "delivered" | "delayed" | "dropped";
  delayRemaining?: number;
}

export interface CommunicationMetrics {
  totalSent: number;
  delivered: number;
  delayed: number;
  dropped: number;
  currentStatus: CommsStatus;
  currentLatencySeconds: number;
}
