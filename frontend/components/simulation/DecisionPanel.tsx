import React, { useState } from "react";
import { DecisionPoint } from "../../types/decision";
import { CommsStatus } from "../../types/scenario";
import { AlertTriangle, CheckCircle, Radio, Clock, ChevronRight } from "lucide-react";
import { RationaleModal } from "./RationaleModal";

interface DecisionPanelProps {
  decisionPoint: DecisionPoint;
  commsStatus: CommsStatus;
  onSubmit: (actionId: string, actionLabel: string, rationale: string, confidence: "low" | "medium" | "high") => void;
  className?: string;
}

export const DecisionPanel: React.FC<DecisionPanelProps> = ({
  decisionPoint,
  commsStatus,
  onSubmit,
  className = ""
}) => {
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getCommsDisplay = () => {
    switch (commsStatus) {
      case "normal": return <span className="text-emerald-400">NORMAL</span>;
      case "delayed": return <span className="text-amber-400 animate-pulse">DELAYED</span>;
      case "degraded": return <span className="text-orange-400 font-bold animate-pulse">DEGRADED</span>;
      case "offline": return <span className="text-rose-400 font-bold animate-pulse">OFFLINE (LOST)</span>;
    }
  };

  const handleActionSelect = (id: string) => {
    setSelectedActionId(id);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (rationale: string, confidence: "low" | "medium" | "high") => {
    if (selectedActionId) {
      const actionLabel = decisionPoint.availableActions.find(a => a.id === selectedActionId)?.label || "";
      onSubmit(selectedActionId, actionLabel, rationale, confidence);
    }
    setIsModalOpen(false);
  };

  return (
    <div className={`bg-slate-900 border-2 border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.2)] rounded-lg overflow-hidden flex flex-col font-mono ${className}`}>
      {/* Header */}
      <div className="bg-amber-950/50 border-b border-amber-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-amber-400 font-bold">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          <h2 className="tracking-widest text-sm uppercase">⚠ Decision Point</h2>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono">
          <Radio className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">COMMS:</span>
          {getCommsDisplay()}
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <h3 className="text-lg font-bold text-white mb-2">{decisionPoint.title}</h3>
        
        <div className="bg-slate-950 rounded border border-slate-800 p-3 mb-6 text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
          {decisionPoint.situation}
        </div>

        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Available Actions:</div>
          {decisionPoint.availableActions.map(action => (
            <button
              key={action.id}
              onClick={() => handleActionSelect(action.id)}
              className={`w-full text-left p-3 rounded border transition-all flex items-start space-x-3
                ${selectedActionId === action.id 
                  ? 'bg-cyan-900/40 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500' 
                  : 'bg-slate-950/80 border-slate-800 hover:bg-slate-800/90 hover:border-cyan-500/60'
                }
              `}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0
                ${selectedActionId === action.id ? 'border-cyan-400 bg-cyan-400/20' : 'border-slate-500'}
              `}>
                {selectedActionId === action.id && <div className="w-2 h-2 rounded-full bg-cyan-400" />}
              </div>
              <div>
                <div className={`font-bold ${selectedActionId === action.id ? 'text-cyan-300' : 'text-slate-200'}`}>
                  {action.label}
                </div>
                {action.description && (
                  <div className={`text-xs mt-1 ${selectedActionId === action.id ? 'text-cyan-400/80' : 'text-slate-400'}`}>
                    {action.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Rationale Modal */}
      {selectedActionId && (
        <RationaleModal
          isOpen={isModalOpen}
          selectedOptionText={decisionPoint.availableActions.find(a => a.id === selectedActionId)?.label || ""}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
};
