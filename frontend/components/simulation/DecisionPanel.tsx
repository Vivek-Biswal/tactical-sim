import React, { useState } from "react";
import { DecisionPrompt } from "../../types/decision";
import { RationaleModal } from "./RationaleModal";
import { AlertCircle, CheckCircle, ShieldAlert, ArrowRight, Compass } from "lucide-react";

interface DecisionPanelProps {
  decisionRequired?: DecisionPrompt | null;
  onSubmitDecision: (decision: string, rationale: string, confidence: "low" | "medium" | "high") => void;
  className?: string;
}

export const DecisionPanel: React.FC<DecisionPanelProps> = ({
  decisionRequired,
  onSubmitDecision,
  className = ""
}) => {
  const [selectedOptionText, setSelectedOptionText] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Default fallback options if custom decision initiated
  const defaultOptions = [
    {
      id: "opt-1",
      label: "Continue Current Route through Northern Defile",
      description: "Maintain original schedule and advance along primary highway despite reports of hostile EW jammer."
    },
    {
      id: "opt-2",
      label: "Divert Route via Western Ridge Pass",
      description: "Bypass suspected jammer vehicle, accept rough terrain delay and risk of Western patrol."
    },
    {
      id: "opt-3",
      label: "Halt and Establish Defensive Perimeter",
      description: "Wait for communication recovery or courier contact before risking further advancement."
    },
    {
      id: "opt-4",
      label: "Dispatch Runner / Recon Scout toward Eastern Canyon",
      description: "Seek direct visual confirmation before moving main force."
    }
  ];

  const currentPrompt = decisionRequired?.prompt || "Tactical Command Decision Options:";
  const options = decisionRequired?.options && decisionRequired.options.length > 0
    ? decisionRequired.options
    : defaultOptions;

  const handleSelectOption = (label: string) => {
    setSelectedOptionText(label);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (rationale: string, confidence: "low" | "medium" | "high") => {
    if (selectedOptionText) {
      onSubmitDecision(selectedOptionText, rationale, confidence);
    }
    setIsModalOpen(false);
    setSelectedOptionText(null);
  };

  return (
    <div className={`bg-slate-900/90 border rounded-lg p-3 font-mono text-xs ${
      decisionRequired ? "border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.2)]" : "border-slate-800"
    } ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {decisionRequired ? (
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600 font-bold animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>DECISION REQUIRED</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>COMMAND DECISION POINT</span>
            </div>
          )}
        </div>

        {decisionRequired && (
          <span className="text-[10px] text-amber-400/90 font-bold">
            TIMESTAMPT: {decisionRequired.timestamp}
          </span>
        )}
      </div>

      <p className="text-slate-300 font-medium mb-3 leading-relaxed">
        {currentPrompt}
      </p>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {options.map((opt, idx) => (
          <button
            key={opt.id || idx}
            type="button"
            onClick={() => handleSelectOption(opt.label)}
            className="text-left p-2.5 rounded bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/60 transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center space-x-1.5 text-cyan-300 font-bold group-hover:text-cyan-200">
                <span className="text-[10px] px-1 bg-slate-900 border border-slate-700 rounded text-slate-400">
                  {idx + 1}
                </span>
                <span>{opt.label}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                {opt.description}
              </p>
            </div>

            <div className="mt-2 text-[10px] text-slate-500 group-hover:text-cyan-400 flex items-center space-x-1 justify-end font-bold">
              <span>SELECT &amp; GIVE RATIONALE</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </div>
          </button>
        ))}
      </div>

      {/* Rationale Modal */}
      {selectedOptionText && (
        <RationaleModal
          isOpen={isModalOpen}
          selectedOptionText={selectedOptionText}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
};
