"use client";
import React, { useState } from "react";
import { SimulationEventLog } from "../../types/exercise";
import {
  Radio, WifiOff, Map, Cpu, Zap, AlertTriangle,
  CheckCircle2, FileText, Eye, Filter
} from "lucide-react";

type FilterType = "all" | "comms" | "intel" | "units" | "decision" | "instructor" | "system";

interface AARTimelineProps {
  events: SimulationEventLog[];
  onSelectEvent?: (event: SimulationEventLog) => void;
  selectedEventId?: string;
}

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: "all", label: "ALL" },
  { key: "comms", label: "COMMS" },
  { key: "intel", label: "INTEL" },
  { key: "units", label: "UNITS" },
  { key: "decision", label: "DECISIONS" },
  { key: "instructor", label: "INSTRUCTOR" },
  { key: "system", label: "SYSTEM" },
];

function getCategoryFilter(cat: string): FilterType {
  if (cat === "comms" || cat.includes("comms")) return "comms";
  if (cat === "intel" || cat === "INTEL_REPORT" || cat === "CONFLICTING_REPORT") return "intel";
  if (cat === "UNIT_MOVE" || cat === "STATUS_CHANGE" || cat === "CONTACT_DETECTED" || cat === "units") return "units";
  if (cat === "decision" || cat === "decision_point") return "decision";
  if (cat === "instructor") return "instructor";
  return "system";
}

function getCategoryIcon(cat: string) {
  const f = getCategoryFilter(cat);
  switch (f) {
    case "comms": return <Radio className="w-3.5 h-3.5 text-amber-400" />;
    case "intel": return <Eye className="w-3.5 h-3.5 text-purple-400" />;
    case "units": return <Map className="w-3.5 h-3.5 text-cyan-400" />;
    case "decision": return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    case "instructor": return <Zap className="w-3.5 h-3.5 text-yellow-400" />;
    default: return <Cpu className="w-3.5 h-3.5 text-slate-400" />;
  }
}

function getCategoryColor(cat: string) {
  const f = getCategoryFilter(cat);
  switch (f) {
    case "comms": return "border-amber-800 bg-amber-950/20";
    case "intel": return "border-purple-800 bg-purple-950/20";
    case "units": return "border-cyan-800 bg-cyan-950/20";
    case "decision": return "border-emerald-700 bg-emerald-950/30";
    case "instructor": return "border-yellow-800 bg-yellow-950/20";
    default: return "border-slate-800 bg-slate-950/20";
  }
}

export const AARTimeline: React.FC<AARTimelineProps> = ({
  events,
  onSelectEvent,
  selectedEventId
}) => {
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = filter === "all"
    ? events
    : events.filter(e => getCategoryFilter(e.category) === filter);

  return (
    <div className="space-y-3">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider transition border ${
              filter === opt.key
                ? "bg-cyan-900/50 border-cyan-600 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-slate-600 self-center">{filtered.length} events</span>
      </div>

      {/* Timeline entries */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[22px] top-0 bottom-0 w-px bg-slate-800" />

        <div className="space-y-1.5">
          {filtered.map((evt, idx) => {
            const isSelected = selectedEventId === evt.id;
            const isDecision = getCategoryFilter(evt.category) === "decision";
            return (
              <button
                key={evt.id}
                onClick={() => onSelectEvent?.(evt)}
                className={`w-full text-left pl-10 pr-3 py-2.5 rounded border transition-all relative ${getCategoryColor(evt.category)} ${
                  isSelected
                    ? "ring-1 ring-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                    : "hover:bg-slate-900/60 hover:border-slate-700"
                } ${isDecision ? "border-l-2 border-l-emerald-600" : ""}`}
              >
                {/* Icon bubble on the line */}
                <div className="absolute left-[12px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center z-10">
                  {getCategoryIcon(evt.category)}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-bold text-[10px] font-mono shrink-0">
                        T+{evt.time}
                      </span>
                      <span className={`font-bold text-xs truncate ${isDecision ? "text-emerald-300" : "text-slate-200"}`}>
                        {evt.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug truncate">
                      {evt.description}
                    </p>
                  </div>
                  <span className="text-[9px] text-slate-600 uppercase shrink-0 mt-0.5">
                    {evt.category}
                  </span>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="pl-10 py-6 text-slate-500 italic text-xs">
              No events in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
