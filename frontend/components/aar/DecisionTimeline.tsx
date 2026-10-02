import React from "react";
import { Decision } from "../../types/decision";
import {
  WifiOff,
  Clock,
  Radio,
  FileWarning,
  HelpCircle,
  ShieldAlert,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface DecisionTimelineProps {
  timelineEvents: Array<{
    time: string;
    second: number;
    title: string;
    description: string;
    category: string;
  }>;
  decisions: Decision[];
  className?: string;
}

export const DecisionTimeline: React.FC<DecisionTimelineProps> = ({
  timelineEvents,
  decisions,
  className = ""
}) => {
  // Merge timeline events with decisions for a complete chronological view
  const combinedItems = [
    ...timelineEvents.map((evt) => ({
      type: "event" as const,
      second: evt.second,
      time: evt.time,
      title: evt.title,
      description: evt.description,
      category: evt.category
    })),
    ...decisions.map((dec) => ({
      type: "decision" as const,
      second: dec.simulationSecond,
      time: dec.simulationTime,
      title: `COMMANDER DECISION: ${dec.decision}`,
      description: `Rationale: "${dec.rationale}" (Confidence: ${dec.confidence.toUpperCase()})`,
      category: "decision"
    }))
  ].sort((a, b) => a.second - b.second);

  const getEventIcon = (category: string, isDecision: boolean) => {
    if (isDecision) {
      return <CheckCircle2 className="w-4 h-4 text-cyan-400" />;
    }
    switch (category) {
      case "comms":
      case "comms_degradation":
        return <WifiOff className="w-4 h-4 text-amber-400" />;
      case "conflicting_report":
        return <HelpCircle className="w-4 h-4 text-yellow-400" />;
      case "map_status":
        return <FileWarning className="w-4 h-4 text-amber-400" />;
      case "intel_update":
        return <ShieldAlert className="w-4 h-4 text-purple-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className={`font-mono text-xs ${className}`}>
      <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6 my-4">
        {combinedItems.map((item, idx) => {
          const isDecision = item.type === "decision";

          return (
            <div key={idx} className="relative group">
              {/* Circle Marker on the Line */}
              <div
                className={`absolute -left-[31px] top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                  isDecision
                    ? "bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                    : "bg-slate-900 border-slate-700 text-slate-300"
                }`}
              >
                {getEventIcon(item.category, isDecision)}
              </div>

              {/* Event Body Box */}
              <div
                className={`p-3 rounded-lg border transition ${
                  isDecision
                    ? "bg-cyan-950/20 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                    : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-cyan-400 font-bold">{item.time}</span>
                    <span className="text-slate-600">|</span>
                    <span className="font-bold text-slate-200">{item.title}</span>
                  </div>

                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase border ${
                      isDecision
                        ? "bg-cyan-950 text-cyan-300 border-cyan-700"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    {item.category}
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed mt-1">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
