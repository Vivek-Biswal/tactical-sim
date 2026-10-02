import React, { useEffect, useRef } from "react";
import { RadioMessage } from "../../types/communication";
import { AlertCircle, Clock, CheckCircle2, ShieldAlert } from "lucide-react";

interface MessageListProps {
  messages: RadioMessage[];
  className?: string;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, className = "" }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "COMMANDER":
        return "bg-cyan-950 text-cyan-400 border-cyan-800";
      case "TEAM_ALPHA":
      case "TEAM_BRAVO":
        return "bg-emerald-950 text-emerald-400 border-emerald-800";
      case "INTELLIGENCE":
        return "bg-purple-950 text-purple-300 border-purple-800";
      case "INSTRUCTOR":
      case "HQ":
        return "bg-amber-950 text-amber-300 border-amber-800";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div
      ref={scrollRef}
      className={`space-y-2 overflow-y-auto font-mono text-xs p-2.5 bg-slate-950/60 rounded border border-slate-800/80 ${className}`}
    >
      {messages.length === 0 ? (
        <div className="text-center py-6 text-slate-500 italic">
          Tactical radio net standing by. No transmissions recorded yet.
        </div>
      ) : (
        messages.map((msg) => {
          const isDropped = msg.status === "dropped";
          const isDelayed = msg.status === "delayed";

          return (
            <div
              key={msg.id}
              className={`p-2 rounded border transition-all ${
                isDropped
                  ? "bg-rose-950/30 border-rose-800/60 text-rose-300"
                  : isDelayed
                  ? "bg-amber-950/20 border-amber-800/50 text-amber-200"
                  : "bg-slate-900/80 border-slate-800 text-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center space-x-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-bold">{msg.formattedTime}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getRoleBadge(
                      msg.senderRole
                    )}`}
                  >
                    {msg.sender}
                  </span>
                </div>

                {/* Delivery Status Indicator */}
                <div className="flex items-center space-x-1 text-[10px]">
                  {isDropped ? (
                    <span className="flex items-center space-x-0.5 text-rose-400 font-bold">
                      <ShieldAlert className="w-3 h-3" />
                      <span>DROPPED</span>
                    </span>
                  ) : isDelayed ? (
                    <span className="flex items-center space-x-0.5 text-amber-400">
                      <Clock className="w-3 h-3 animate-spin" />
                      <span>DELAYED ({msg.delayRemaining || 8}s)</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-0.5 text-emerald-400/80">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>DELIVERED</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <p className={`text-[11px] leading-relaxed ${isDropped ? "line-through opacity-75" : ""}`}>
                {msg.content.split(/(\[STATIC\]|UNKNOWN)/g).map((part, i) => {
                  if (part === "[STATIC]" || part === "UNKNOWN") {
                    return <span key={i} className="text-amber-500 font-bold bg-amber-950/50 px-0.5 rounded">{part}</span>;
                  }
                  return part;
                })}
              </p>
              
              {msg.isConflicting && (
                <div className="mt-1 flex items-center space-x-1 text-rose-400 text-[9px] font-bold uppercase tracking-wider">
                  <ShieldAlert className="w-2.5 h-2.5" />
                  <span>Conflicting Intel Detected</span>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
