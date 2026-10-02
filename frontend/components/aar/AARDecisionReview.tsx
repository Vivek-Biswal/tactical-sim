"use client";
import React, { useState } from "react";
import { DecisionRecord } from "../../types/decision";
import { CheckCircle2, Radio, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";

interface AARDecisionReviewProps {
  decisions: DecisionRecord[];
}

function CommsChip({ status }: { status: string }) {
  const colors: Record<string, string> = {
    normal: "text-emerald-400 border-emerald-800 bg-emerald-950/40",
    delayed: "text-amber-400 border-amber-800 bg-amber-950/40",
    degraded: "text-orange-400 border-orange-800 bg-orange-950/40",
    offline: "text-rose-400 border-rose-800 bg-rose-950/40",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colors[status] ?? "text-slate-400 border-slate-800"}`}>
      COMMS: {status.toUpperCase()}
    </span>
  );
}

export const AARDecisionReview: React.FC<AARDecisionReviewProps> = ({ decisions }) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    decisions.length > 0 ? decisions[0].id : null
  );

  if (decisions.length === 0) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg text-center text-slate-500 italic text-sm">
        No trainee decisions were recorded during this exercise.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-500 bg-slate-900/60 border border-slate-800 rounded p-2.5">
        <span className="text-cyan-400 font-bold">AAR NOTE:</span> These records show what information the trainee had access to at the moment of each decision. No action is labelled correct or incorrect.
      </div>

      {decisions.map((dec, idx) => {
        const isExpanded = expandedId === dec.id;
        return (
          <div key={dec.id} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            {/* Decision header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : dec.id)}
              className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center shrink-0">
                  <span className="text-emerald-400 text-[10px] font-bold">{idx + 1}</span>
                </div>
                <div>
                  <div className="text-emerald-300 font-bold text-sm">
                    {dec.selectedActionLabel || dec.decision || "(action)"}
                  </div>
                  <div className="text-slate-500 text-[10px] font-mono">
                    {dec.simulationTime || `T+${dec.scenarioTimestamp}s`}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CommsChip status={dec.communicationState ?? "normal"} />
                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-slate-800 p-4 space-y-4 font-mono text-xs">
                {/* Situation */}
                {dec.decision && (
                  <div>
                    <div className="text-slate-500 font-bold mb-1 uppercase tracking-wider">Situation Context</div>
                    <div className="bg-slate-950 rounded border border-slate-800 p-3 text-slate-300 leading-relaxed">
                      {dec.decision}
                    </div>
                  </div>
                )}

                {/* Selected Action */}
                <div className="flex items-start space-x-3 p-3 bg-emerald-950/20 border border-emerald-900/50 rounded">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-slate-500 font-bold uppercase text-[10px] mb-0.5">Selected Action</div>
                    <div className="text-emerald-200 font-bold">{dec.selectedActionLabel || dec.decision || "-"}</div>
                  </div>
                </div>

                {/* Rationale */}
                {dec.rationale && (
                  <div>
                    <div className="text-slate-500 font-bold mb-1 uppercase tracking-wider">Trainee Rationale</div>
                    <div className="bg-slate-950 rounded border border-slate-800 p-3 text-slate-300 italic leading-relaxed">
                      &ldquo;{dec.rationale}&rdquo;
                    </div>
                  </div>
                )}

                {/* Communication Context */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-center">
                    <div className="text-slate-500 text-[9px] uppercase mb-1">Time</div>
                    <div className="text-cyan-400 font-bold">{dec.simulationTime ?? `T+${dec.scenarioTimestamp}s`}</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-center">
                    <div className="text-slate-500 text-[9px] uppercase mb-1">Comms State</div>
                    <div className={`font-bold ${
                      dec.communicationState === "normal" ? "text-emerald-400" :
                      dec.communicationState === "delayed" ? "text-amber-400" :
                      dec.communicationState === "degraded" ? "text-orange-400" : "text-rose-400"
                    }`}>{(dec.communicationState ?? "unknown").toUpperCase()}</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-center">
                    <div className="text-slate-500 text-[9px] uppercase mb-1">Confidence</div>
                    <div className={`font-bold ${
                      dec.confidence === "high" ? "text-emerald-400" :
                      dec.confidence === "medium" ? "text-amber-400" :
                      dec.confidence === "low" ? "text-rose-400" : "text-slate-500"
                    }`}>{(dec.confidence ?? "—").toUpperCase()}</div>
                  </div>
                </div>

                {/* Info available/denied */}
                {((dec.availableInformation?.length ?? 0) > 0 || (dec.unavailableInformation?.length ?? 0) > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-2.5 bg-emerald-950/10 border border-emerald-900/40 rounded">
                      <div className="text-emerald-500 font-bold text-[10px] uppercase mb-2">Information Available</div>
                      <ul className="space-y-1">
                        {(dec.availableInformation ?? []).map((item, i) => (
                          <li key={i} className="text-slate-300 text-[11px] flex items-start space-x-1.5">
                            <span className="text-emerald-400">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                        {(dec.availableInformation ?? []).length === 0 && (
                          <li className="text-slate-600 italic">None recorded.</li>
                        )}
                      </ul>
                    </div>
                    <div className="p-2.5 bg-rose-950/10 border border-rose-900/40 rounded">
                      <div className="text-rose-500 font-bold text-[10px] uppercase mb-2">Information Denied/Lost</div>
                      <ul className="space-y-1">
                        {(dec.unavailableInformation ?? []).map((item, i) => (
                          <li key={i} className="text-slate-300 text-[11px] flex items-start space-x-1.5">
                            <span className="text-rose-400">✗</span>
                            <span>{item}</span>
                          </li>
                        ))}
                        {(dec.unavailableInformation ?? []).length === 0 && (
                          <li className="text-slate-600 italic">None recorded.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
