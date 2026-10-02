"use client";

import React, { useState } from "react";
import { PanelCard } from "@/components/ui/PanelCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { AlertTriangle, CheckCircle2, ChevronRight, Crosshair, FileText, Clock } from "lucide-react";

export interface DecisionOption {
  id: string;
  code: string;
  title: string;
  description: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
}

interface DecisionPanelProps {
  onDecisionSubmit?: (optionId: string) => void;
  submitted?: boolean;
}

const MOCK_INJECTS = [
  {
    id: "I-001",
    time: "16:31",
    type: "INTELLIGENCE REPORT",
    severity: "HIGH",
    text: "SIGINT indicates enemy activity near Grid 24A. Source reliability: MEDIUM. Information may be 30 minutes old due to communication delays.",
  },
  {
    id: "I-002",
    time: "16:38",
    type: "UNIT REPORT",
    severity: "MEDIUM",
    text: 'Alpha 1 reports: "No visual confirmation of reported activity. Visibility limited to 300 metres. Proceeding with caution."',
  },
];

const MOCK_OPTIONS: DecisionOption[] = [
  {
    id: "OPT-A",
    code: "OPTION ALPHA",
    title: "Advance and Confirm",
    description: "Direct Alpha 1 to advance to Grid 24A and establish observation post. Accept risk of contact pending confirmation.",
    risk: "HIGH",
  },
  {
    id: "OPT-B",
    code: "OPTION BRAVO",
    title: "Hold and Request Clarification",
    description: "Halt all movement. Request updated intelligence from higher command before committing forces. Accept time delay.",
    risk: "LOW",
  },
  {
    id: "OPT-C",
    code: "OPTION CHARLIE",
    title: "Flank via Alternative Route",
    description: "Redirect Bravo element to approach from the south via Grid 26C while Alpha 1 maintains current position.",
    risk: "MEDIUM",
  },
];

const riskConfig: Record<DecisionOption["risk"], { color: string; bg: string; label: string }> = {
  HIGH:   { color: "text-[#A94A3F]", bg: "bg-[#FAF0EF] border-[#E8C4C0]", label: "HIGH RISK" },
  MEDIUM: { color: "text-[#8A5C2A]", bg: "bg-[#FDF3E3] border-[#E8D4B0]", label: "MED RISK" },
  LOW:    { color: "text-[#3A6B30]", bg: "bg-[#EBF4E8] border-[#C4DAC0]", label: "LOW RISK" },
};

export function DecisionPanel({ onDecisionSubmit, submitted }: DecisionPanelProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSelect = (id: string) => {
    if (submitted) return;
    setSelected(id);
    setShowConfirm(false);
  };

  const handleConfirm = () => {
    if (!selected) return;
    setShowConfirm(true);
  };

  const handleSubmit = () => {
    if (selected && onDecisionSubmit) {
      onDecisionSubmit(selected);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Intelligence Injects */}
      <PanelCard
        header={
          <div className="flex items-center gap-2">
            <FileText size={13} className="text-[#8A5C2A]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#344438]">Intelligence Injects</span>
          </div>
        }
        noPadding
      >
        <div className="divide-y divide-[#D9D8CE]">
          {MOCK_INJECTS.map((inj) => (
            <div key={inj.id} className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle
                  size={12}
                  className={inj.severity === "HIGH" ? "text-[#A94A3F]" : "text-[#8A5C2A]"}
                />
                <span className={`text-[9px] font-black tracking-widest ${inj.severity === "HIGH" ? "text-[#A94A3F]" : "text-[#8A5C2A]"}`}>
                  {inj.type}
                </span>
                <span className="ml-auto text-[9px] font-mono font-bold text-[#B69B63] flex items-center gap-1">
                  <Clock size={9} />
                  {inj.time}
                </span>
              </div>
              <p className="text-xs font-medium text-[#263229] leading-relaxed">
                {inj.text}
              </p>
            </div>
          ))}
        </div>
      </PanelCard>

      {/* Decision Options */}
      <PanelCard
        header={
          <div className="flex items-center gap-2">
            <Crosshair size={13} className="text-[#344438]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#344438]">Decision Required</span>
            {!submitted && (
              <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-black tracking-widest text-[#A94A3F]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A94A3F] animate-pulse" />
                ACTION REQUIRED
              </span>
            )}
          </div>
        }
        className="flex flex-col flex-1"
      >
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <CheckCircle2 size={32} className="text-[#4A7A3A]" />
            <div className="text-sm font-black uppercase tracking-widest text-[#344438]">Decision Submitted</div>
            <div className="text-xs font-medium text-[#687066]">
              Your decision has been logged. Await instructor response.
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {MOCK_OPTIONS.map((opt) => {
                const risk = riskConfig[opt.risk];
                const isSelected = selected === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all group ${
                      isSelected
                        ? "border-[#344438] bg-[#EFE8D8] shadow-sm"
                        : "border-[#D9D8CE] bg-white hover:border-[#556B3F] hover:bg-[#F7F5EE]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          isSelected ? "border-[#344438] bg-[#344438]" : "border-[#A0A59E]"
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-[9px] font-black tracking-widest text-[#687066]">{opt.code}</span>
                      </div>
                      <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded border ${risk.bg} ${risk.color}`}>
                        {risk.label}
                      </span>
                    </div>
                    <div className="font-black text-sm text-[#263229] mb-1 pl-6">{opt.title}</div>
                    <div className="text-xs font-medium text-[#687066] leading-relaxed pl-6">{opt.description}</div>
                  </button>
                );
              })}
            </div>

            {/* Confirm step */}
            {showConfirm && selected && (
              <div className="mb-4 p-4 bg-[#EFE8D8] border border-[#D8C7A5] rounded-lg">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#344438] mb-1 flex items-center gap-2">
                  <AlertTriangle size={12} className="text-[#8A5C2A]" />
                  Confirm Decision
                </div>
                <p className="text-xs font-medium text-[#687066] leading-relaxed mb-3">
                  You are about to submit{" "}
                  <span className="font-black text-[#344438]">
                    {MOCK_OPTIONS.find(o => o.id === selected)?.code}
                  </span>. This action will be logged and cannot be undone.
                </p>
                <div className="flex gap-2">
                  <PrimaryButton size="sm" onClick={handleSubmit} icon={<CheckCircle2 size={14} />}>
                    CONFIRM & SUBMIT
                  </PrimaryButton>
                  <SecondaryButton size="sm" onClick={() => setShowConfirm(false)}>
                    CANCEL
                  </SecondaryButton>
                </div>
              </div>
            )}

            {!showConfirm && (
              <PrimaryButton
                disabled={!selected}
                onClick={handleConfirm}
                icon={<ChevronRight size={16} />}
                className="w-full"
              >
                SUBMIT DECISION
              </PrimaryButton>
            )}
          </>
        )}
      </PanelCard>
    </div>
  );
}
