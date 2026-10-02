import React from "react";
import { DecisionRecord } from "../../types/decision";
import { CheckCircle, Clock } from "lucide-react";

interface DecisionHistoryProps {
  decisions: DecisionRecord[];
  className?: string;
}

export const DecisionHistory: React.FC<DecisionHistoryProps> = ({ decisions, className = "" }) => {
  if (decisions.length === 0) return null;

  return (
    <div className={`bg-slate-950 border border-slate-800 rounded-lg p-3 ${className}`}>
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Decision History</h3>
      <div className="space-y-2">
        {decisions.map((dec) => (
          <div key={dec.id} className="bg-slate-900 border border-emerald-900/50 rounded p-2.5 flex items-start space-x-3">
            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 text-xs truncate">
                  {dec.selectedActionLabel}
                </span>
                <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                  <Clock className="w-3 h-3" />
                  <span>{dec.simulationTime || `T+${dec.scenarioTimestamp}s`}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-400 font-mono">
                <span className="px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800">
                  COMMS: {dec.communicationState.toUpperCase()}
                </span>
                {dec.confidence && (
                  <span className="px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800">
                    CONFIDENCE: {dec.confidence.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
