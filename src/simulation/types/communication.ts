import { CommsStatus } from "./scenario";

export type MessageSenderRole = "COMMANDER" | "TEAM_ALPHA" | "TEAM_BRAVO" | "TEAM_CHARLIE" | "INTELLIGENCE" | "INSTRUCTOR" | "HQ";
export type DeliveryStatus = "PENDING" | "DELIVERED" | "DELAYED" | "DROPPED";
export type MessageType = "INTEL_REPORT" | "UNIT_REPORT" | "COMMAND" | "SYSTEM" | "CONFLICTING_REPORT";

export interface RadioMessage {
  id: string;
  exerciseId: string;
  sender: string;
  senderRole: MessageSenderRole | string;
  recipient?: string;
  content: string;
  originalContent?: string;          // preserved for incomplete reports
  messageType?: MessageType;
  timestamp: number;                 // legacy compat
  timestampGenerated: number;        // when the event actually happened
  timestampDelivered?: number;       // when the trainee received it
  formattedTime: string;             // sim clock when generated
  formattedTimeDelivered?: string;   // sim clock when delivered
  status: "sent" | "delivered" | "delayed" | "dropped";
  deliveryStatus: DeliveryStatus;
  communicationState?: CommsStatus;  // comm state at generation time
  delayRemaining?: number;
  isConflicting?: boolean;
  conflictGroupId?: string;
  generatedSecond?: number;
  deliveredSecond?: number;
  wasDelayed?: boolean;
  configuredDelaySeconds?: number;
  channel?: string;
  reliability?: string;
  confirmed?: boolean;
  dropReason?: string;
}

export interface CommunicationConfig {
  communicationState: CommsStatus;
  delaySeconds: number;
  messageLossPercentage: number;
  allowIncompleteReports: boolean;
  allowConflictingReports: boolean;
}

export interface CommunicationMetrics {
  totalSent: number;
  delivered: number;
  delayed: number;
  dropped: number;
  pending: number;
  currentStatus: CommsStatus;
  currentLatencySeconds: number;
}
