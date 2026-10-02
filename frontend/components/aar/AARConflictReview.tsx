"use client";
import React from "react";
import { RadioMessage } from "../../types/communication";
import { AlertTriangle } from "lucide-react";

interface AARConflictReviewProps {
  messages: RadioMessage[];
}

export const AARConflictReview: React.FC<AARConflictReviewProps> = ({ messages }) => {
  // Group conflicting messages by conflictGroupId
  const conflictingMessages = messages.filter(m => m.isConflicting && m.conflictGroupId);
  const groups = new Map<string, RadioMessage[]>();
  for (const msg of conflictingMessages) {
    const gid = msg.conflictGroupId!;
    if (!groups.has(gid)) groups.set(gid, []);
    groups.get(gid)!.push(msg);
  }

  if (groups.size === 0) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg text-center text-slate-500 italic text-sm">
        No conflicting intelligence reports were recorded during this exercise.
      </div>
    );
  }

  let conflictIndex = 0;
  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="text-xs text-slate-500 bg-slate-900/60 border border-slate-800 rounded p-2.5">
        <span className="text-yellow-400 font-bold">AAR NOTE:</span> These are intelligence conflicts that were active during the exercise. They are not automatically resolved. The instructor should evaluate how the trainee responded.
      </div>

      {[...groups.entries()].map(([groupId, msgs]) => {
        conflictIndex++;
        const firstMsg = msgs[0];
        return (
          <div key={groupId} className="bg-slate-900 border border-yellow-900/50 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-yellow-950/30 border-b border-yellow-900/40 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-yellow-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>CONFLICT #{String(conflictIndex).padStart(2, "0")}</span>
              </div>
              <div className="flex items-center space-x-3 text-[10px]">
                <span className="text-slate-500">Generated: <span className="text-slate-300 font-mono">{firstMsg.formattedTime}</span></span>
                {firstMsg.communicationState && (
                  <span className={`font-bold ${
                    firstMsg.communicationState === "degraded" ? "text-orange-400" :
                    firstMsg.communicationState === "delayed" ? "text-amber-400" :
                    firstMsg.communicationState === "offline" ? "text-rose-400" : "text-emerald-400"
                  }`}>COMMS: {firstMsg.communicationState.toUpperCase()}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
              {msgs.map((msg, idx) => (
                <div key={msg.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-600 uppercase block">Report {String.fromCharCode(65 + idx)}</span>
                      <span className="font-bold text-slate-200">{msg.sender}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                      msg.deliveryStatus === "DELIVERED" ? "border-emerald-800 text-emerald-400" :
                      msg.deliveryStatus === "DROPPED" ? "border-rose-800 text-rose-400" :
                      "border-amber-800 text-amber-400"
                    }`}>{msg.deliveryStatus}</span>
                  </div>
                  <div className="bg-slate-950 rounded border border-slate-800 p-2.5 text-slate-300 leading-relaxed">
                    {msg.content}
                    {msg.content !== msg.originalContent && msg.originalContent && (
                      <div className="mt-2 pt-2 border-t border-slate-800 text-slate-500">
                        <span className="text-orange-400 font-bold text-[9px] block mb-1">ORIGINAL (GARBLED IN TRANSIT):</span>
                        {msg.originalContent}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
