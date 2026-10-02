import React, { useState } from "react";
import { ConfidenceLevel } from "../../types/decision";
import { AlertCircle, CheckCircle2, ShieldAlert, HelpCircle } from "lucide-react";

interface RationaleModalProps {
  isOpen: boolean;
  selectedOptionText: string;
  onClose: () => void;
  onSubmit: (rationale: string, confidence: ConfidenceLevel) => void;
}

export const RationaleModal: React.FC<RationaleModalProps> = ({
  isOpen,
  selectedOptionText,
  onClose,
  onSubmit
}) => {
  const [rationale, setRationale] = useState("");
  const [confidence, setConfidence] = useState<ConfidenceLevel>("medium");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rationale.trim()) return;
    onSubmit(rationale.trim(), confidence);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/50 rounded-lg max-w-lg w-full p-6 text-slate-100 font-mono shadow-[0_0_30px_rgba(6,182,212,0.2)] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center space-x-2 text-cyan-400 mb-2">
          <HelpCircle className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            WHY DID YOU MAKE THIS DECISION?
          </h3>
        </div>

        {/* Selected Option Display */}
        <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs mb-4">
          <span className="text-slate-500 font-bold block mb-1">SELECTED COURSE OF ACTION:</span>
          <span className="text-cyan-300 font-semibold">{selectedOptionText}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rationale Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              COMMANDER&apos;S RATIONALE &amp; REASONING:
            </label>
            <textarea
              required
              rows={4}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="State your assessment of contradictory reports, degraded radio risks, and expected tactical trade-offs..."
              className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 transition"
            />
          </div>

          {/* Subjective Confidence Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              CONFIDENCE LEVEL UNDER UNCERTAINTY:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as ConfidenceLevel[]).map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setConfidence(level)}
                  className={`py-2 px-3 rounded text-xs font-bold uppercase border transition ${
                    confidence === level
                      ? level === "high"
                        ? "bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                        : level === "medium"
                        ? "bg-amber-950 text-amber-300 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                        : "bg-rose-950 text-rose-300 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!rationale.trim()}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition shadow-[0_0_12px_rgba(6,182,212,0.4)] disabled:opacity-50"
            >
              SUBMIT DECISION &amp; LOG
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
