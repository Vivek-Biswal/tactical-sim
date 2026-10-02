"use client";
import React from "react";
import { RadioMessage } from "../../types/communication";
import { SimulationEventLog } from "../../types/exercise";
import { Radio, WifiOff, Clock, CheckCircle2, AlertOctagon, ArrowDown } from "lucide-react";

interface AARCommsReviewProps {
  events: SimulationEventLog[];
  messages: RadioMessage[];
  pendingMessages?: RadioMessage[];
}

const COMMS_ORDER = ["normal", "delayed", "degraded", "offline"];
const COMMS_LABELS: Record<string, string> = {
  normal: "NORMAL",
  delayed: "DELAYED",
  degraded: "DEGRADED",
  offline: "LOST (OFFLINE)",
};
const COMMS_COLORS: Record<string, string> = {
  normal: "text-emerald-400 border-emerald-700 bg-emerald-950/30",
  delayed: "text-amber-400 border-amber-700 bg-amber-950/30",
  degraded: "text-orange-400 border-orange-700 bg-orange-950/30",
  offline: "text-rose-400 border-rose-700 bg-rose-950/30",
};

function getMessageStatusColor(status: string) {
  switch (status) {
    case "DELIVERED": return "text-emerald-400";
    case "DELAYED": return "text-amber-400";
    case "DROPPED": return "text-rose-400";
    default: return "text-slate-400";
  }
}

export const AARCommsReview: React.FC<AARCommsReviewProps> = ({
  events,
  messages,
  pendingMessages = []
}) => {
  // Extract comms state changes from event log
  const commsChanges = events.filter(e =>
    e.category === "comms_degradation" ||
    (e.category === "instructor" && e.title.toLowerCase().includes("comms"))
  );

  const allMessages = [...messages, ...pendingMessages].sort(
    (a, b) => (a.timestampGenerated ?? 0) - (b.timestampGenerated ?? 0)
  );

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Degradation Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="font-bold text-slate-200 mb-4 flex items-center space-x-2">
          <Radio className="w-4 h-4 text-amber-400" />
          <span>COMMUNICATION DEGRADATION TIMELINE</span>
        </h3>

        {commsChanges.length === 0 ? (
          <div className="text-slate-500 italic text-center py-3">
            No communication state changes recorded.
          </div>
        ) : (
          <div className="space-y-0">
            {/* Starting state */}
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-emerald-400 font-bold">NORMAL</span>
              <span className="text-slate-600">— Initial state</span>
            </div>

            {commsChanges.map((evt) => {
              const newState = (evt.payload?.commsStatus as string) || "degraded";
              const color = COMMS_COLORS[newState] ?? COMMS_COLORS.degraded;
              const label = COMMS_LABELS[newState] ?? newState.toUpperCase();
              const delay = evt.payload?.radioDelaySeconds as number;
              const loss = evt.payload?.messageLossPercentage as number;

              return (
                <div key={evt.id} className="flex flex-col pl-1">
                  <div className="flex items-center space-x-1 text-slate-600 py-0.5 pl-0.5">
                    <ArrowDown className="w-3 h-3" />
                  </div>
                  <div className={`flex items-center justify-between p-2.5 rounded border ${color}`}>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">{label}</span>
                      {delay > 0 && <span className="text-slate-400">(+{delay}s delay)</span>}
                      {loss > 0 && <span className="text-slate-400">({loss}% packet loss)</span>}
                    </div>
                    <span className="text-slate-500 font-mono">T+{evt.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="font-bold text-slate-200 mb-4 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>MESSAGE TRANSMISSION LOG ({allMessages.length} total)</span>
        </h3>

        <div className="space-y-2">
          {allMessages.map(msg => (
            <div
              key={msg.id}
              className={`p-3 rounded border ${
                msg.deliveryStatus === "DROPPED"
                  ? "border-rose-900/50 bg-rose-950/10"
                  : msg.deliveryStatus === "DELAYED"
                  ? "border-amber-900/50 bg-amber-950/10"
                  : "border-slate-800 bg-slate-950/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <span className="font-bold text-slate-200">[{msg.sender}]</span>
                  <span className="text-slate-500 mx-1.5">→</span>
                  <span className="text-[10px] text-slate-500 uppercase">{msg.messageType}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                  msg.deliveryStatus === "DELIVERED" ? "border-emerald-800 text-emerald-400 bg-emerald-950/30" :
                  msg.deliveryStatus === "DROPPED" ? "border-rose-800 text-rose-400 bg-rose-950/30" :
                  "border-amber-800 text-amber-400 bg-amber-950/30"
                }`}>
                  {msg.deliveryStatus ?? "PENDING"}
                </span>
              </div>

              <p className="text-slate-300 leading-snug mb-2">
                {msg.content}
              </p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
                <span>Generated: <span className="text-slate-400 font-mono">{msg.formattedTime}</span></span>
                {msg.deliveryStatus === "DELIVERED" && msg.formattedTimeDelivered && (
                  <span>Delivered: <span className="text-emerald-400 font-mono">{msg.formattedTimeDelivered}</span></span>
                )}
                {msg.deliveryStatus === "DROPPED" && (
                  <span className="text-rose-400 font-bold">DROPPED — comms offline or packet loss</span>
                )}
                {msg.deliveryStatus === "DELAYED" && (
                  <span className="text-amber-400 font-bold">STILL IN QUEUE — {msg.delayRemaining?.toFixed(0) ?? "?"}s remaining</span>
                )}
                {msg.communicationState && (
                  <span>Comms at send: <span className={`font-bold ${
                    msg.communicationState === "normal" ? "text-emerald-400" :
                    msg.communicationState === "delayed" ? "text-amber-400" :
                    msg.communicationState === "degraded" ? "text-orange-400" : "text-rose-400"
                  }`}>{msg.communicationState.toUpperCase()}</span></span>
                )}
                {msg.isConflicting && (
                  <span className="text-yellow-400 font-bold">⚡ CONFLICTING REPORT</span>
                )}
              </div>
            </div>
          ))}

          {allMessages.length === 0 && (
            <div className="text-center text-slate-500 italic py-4">
              No messages were generated during this exercise.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
