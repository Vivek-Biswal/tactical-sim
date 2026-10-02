"use client";

import React, { useRef, useEffect } from "react";
import { SimulationEventLog } from "../../types/exercise";
import { Radio } from "lucide-react";

interface IntelFeedProps {
  eventLog: SimulationEventLog[];
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  system: "text-slate-400 border-slate-600",
  UNIT_MOVE: "text-cyan-400 border-cyan-700",
  CONTACT_DETECTED: "text-red-400 border-red-700",
  INTEL_REPORT: "text-amber-400 border-amber-700",
  STATUS_CHANGE: "text-emerald-400 border-emerald-700",
  comms: "text-purple-400 border-purple-700",
  comms_degradation: "text-orange-400 border-orange-600",
  CONFLICTING_REPORT: "text-rose-400 border-rose-600",
  decision_point: "text-yellow-400 border-yellow-600",
  instructor: "text-orange-400 border-orange-700",
  decision: "text-yellow-400 border-yellow-700",
};

export const IntelFeed: React.FC<IntelFeedProps> = ({
  eventLog,
  className = "",
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [eventLog.length]);

  return (
    <div className={`bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-cyan-400 font-bold text-xs tracking-wider">INTEL FEED</span>
        </div>
        <span className="text-slate-500 text-[10px]">{eventLog.length} EVENTS</span>
      </div>

      {/* Event List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
        {eventLog.length === 0 && (
          <div className="text-center text-slate-500 text-xs py-8">
            No events yet. Start the scenario.
          </div>
        )}
        {eventLog.map((evt) => {
          const colors = CATEGORY_COLORS[evt.category] || "text-slate-400 border-slate-600";
          return (
            <div
              key={evt.id}
              className={`border-l-2 pl-2.5 py-1 text-xs font-mono ${colors}`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 shrink-0">[{evt.time}]</span>
                <span className="font-bold uppercase truncate">{evt.title}</span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-snug">{evt.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
