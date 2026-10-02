import React from "react";
import { Decision } from "../../types/decision";
import { Check, X, ShieldAlert, CheckCircle2, HelpCircle } from "lucide-react";

interface InformationStateProps {
  decisions: Decision[];
  className?: string;
}

export const InformationState: React.FC<InformationStateProps> = ({ decisions, className = "" }) => {
  if (decisions.length === 0) {
    return (
      <div className={`p-6 text-center bg-slate-900 border border-slate-800 rounded-lg text-slate-500 font-mono text-xs ${className}`}>
        No tactical decisions were submitted during this exercise session.
      </div>
    );
  }

  return (
    <div className={`space-y-4 font-mono text-xs ${className}`}>
      {decisions.map((dec, idx) => (
        <div key={dec.id || idx} className="p-4 bg-slate-900 border border-slate-800 rounded-lg shadow-sm">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800 mb-3">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                DECISION #{idx + 1}
              </span>
              <span className="text-slate-400 font-bold">TIME: {dec.simulationTime}</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-500">TRAINEE CONFIDENCE:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                  dec.confidence === "high"
                    ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                    : dec.confidence === "medium"
                    ? "bg-amber-950 text-amber-400 border-amber-800"
                    : "bg-rose-950 text-rose-400 border-rose-800"
                }`}
              >
                {dec.confidence}
              </span>
            </div>
          </div>

          {/* Action & Stated Rationale */}
          <div className="space-y-2 mb-4">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block mb-0.5">ACTION TAKEN:</span>
              <div className="text-sm font-bold text-slate-100 bg-slate-950 p-2.5 rounded border border-slate-800">
                {dec.decision}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-bold block mb-0.5">STATED RATIONALE:</span>
              <div className="text-xs text-slate-300 italic bg-slate-950/70 p-2.5 rounded border border-slate-800/80 leading-relaxed">
                &ldquo;{dec.rationale}&rdquo;
              </div>
            </div>
          </div>

          {/* What Was Known vs. Denied at that Second */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Information Available */}
            <div className="p-3 bg-emerald-950/10 border border-emerald-900/40 rounded">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px] mb-2">
                <Check className="w-3.5 h-3.5" />
                <span>INFORMATION AVAILABLE AT DECISION POINT</span>
              </div>
              <ul className="space-y-1">
                {dec.availableInformation.length === 0 ? (
                  <li className="text-slate-500 italic text-[11px]">No verified telemetry.</li>
                ) : (
                  dec.availableInformation.map((item, i) => (
                    <li key={i} className="text-emerald-200/90 text-[11px] flex items-start space-x-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Information Unavailable / Denied */}
            <div className="p-3 bg-rose-950/10 border border-rose-900/40 rounded">
              <div className="flex items-center space-x-1.5 text-rose-400 font-bold text-[11px] mb-2">
                <X className="w-3.5 h-3.5" />
                <span>INFORMATION DENIED / UNAVAILABLE</span>
              </div>
              <ul className="space-y-1">
                {dec.unavailableInformation.length === 0 ? (
                  <li className="text-slate-500 italic text-[11px]">None recorded.</li>
                ) : (
                  dec.unavailableInformation.map((item, i) => (
                    <li key={i} className="text-rose-200/90 text-[11px] flex items-start space-x-1.5">
                      <span className="text-rose-400 font-bold">✗</span>
                      <span>{item}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
