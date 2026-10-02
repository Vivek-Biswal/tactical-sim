"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { PanelCard } from "@/components/ui/PanelCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { StatusBadge, StatusVariant } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { X, Check } from "lucide-react";

export default function CreateScenarioPage() {
  const router = useRouter();
  const { addToast } = useToast();

  // Form State
  const [name, setName] = useState("");
  const [scenarioId, setScenarioId] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [duration, setDuration] = useState("30");
  const [participants, setParticipants] = useState("8");
  
  const [commEnv, setCommEnv] = useState<string | null>(null);
  const [infoConditions, setInfoConditions] = useState<string[]>([]);
  const [objectives, setObjectives] = useState<string[]>([]);
  
  const [status, setStatus] = useState<"DRAFT" | "READY">("DRAFT");
  
  // Validation State
  const [errorMsg, setErrorMsg] = useState("");

  const toggleInfoCondition = (cond: string) => {
    setInfoConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  const toggleObjective = (obj: string) => {
    setObjectives((prev) =>
      prev.includes(obj) ? prev.filter((o) => o !== obj) : [...prev, obj]
    );
  };

  const handleSaveDraft = () => {
    addToast({
      variant: "success",
      title: "Draft Saved",
      message: "Scenario saved as draft.",
    });
  };

  const handleCreate = () => {
    setErrorMsg("");
    if (!name.trim() || !scenarioId.trim() || !description.trim() || !type || !difficulty) {
      setErrorMsg("Please fill in all required fields: Name, ID, Description, Type, and Difficulty.");
      return;
    }

    addToast({
      variant: "success",
      title: "Scenario Created",
      message: "Scenario created successfully.",
    });

    router.push("/instructor/scenarios");
  };

  return (
    <AppShell pageTitle="SCENARIO CONFIGURATION" role="instructor">
      <PageHeader
        label="SCENARIO CONFIGURATION"
        title="Create Training Scenario"
        description="Configure a new decision-making exercise for the training environment."
        action={
          <Link href="/instructor/scenarios">
            <SecondaryButton icon={<X size={16} />}>CANCEL</SecondaryButton>
          </Link>
        }
      />

      <div className="mt-8 flex flex-col gap-8 max-w-4xl mx-auto pb-12">
        {/* 1. BASIC INFORMATION */}
        <PanelCard accent="olive" header={<span className="text-xs font-black uppercase tracking-widest text-[#344438]">Basic Information</span>}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#687066] mb-1.5">
                  Scenario Name <span className="text-[#A94A3F]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter scenario name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded border border-[#D9D8CE] bg-[#F7F5EE] focus:bg-white text-[#263229] placeholder-[#A0A59E] font-medium text-sm focus:outline-none focus:border-[#556B3F] focus:ring-1 focus:ring-[#556B3F] transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#687066] mb-1.5">
                  Scenario ID <span className="text-[#A94A3F]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="SCN-005"
                  value={scenarioId}
                  onChange={(e) => setScenarioId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded border border-[#D9D8CE] bg-[#F7F5EE] focus:bg-white text-[#263229] placeholder-[#A0A59E] font-medium text-sm focus:outline-none focus:border-[#556B3F] focus:ring-1 focus:ring-[#556B3F] transition-all font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#687066] mb-1.5">
                Scenario Description <span className="text-[#A94A3F]">*</span>
              </label>
              <textarea
                placeholder="Describe the training situation and objectives..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 rounded border border-[#D9D8CE] bg-[#F7F5EE] focus:bg-white text-[#263229] placeholder-[#A0A59E] font-medium text-sm focus:outline-none focus:border-[#556B3F] focus:ring-1 focus:ring-[#556B3F] transition-all resize-none"
              />
            </div>
          </div>
        </PanelCard>

        {/* 2. TRAINING CONFIGURATION */}
        <PanelCard header={<span className="text-xs font-black uppercase tracking-widest text-[#344438]">Training Configuration</span>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#687066] mb-1.5">
                Training Type <span className="text-[#A94A3F]">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2.5 rounded border border-[#D9D8CE] bg-[#F7F5EE] focus:bg-white text-[#263229] font-medium text-sm focus:outline-none focus:border-[#556B3F]"
              >
                <option value="" disabled>Select Type</option>
                <option value="Commander">Commander</option>
                <option value="Team">Team</option>
                <option value="Communication">Communication</option>
                <option value="Decision Making">Decision Making</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#687066] mb-1.5">
                Difficulty <span className="text-[#A94A3F]">*</span>
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-2.5 rounded border border-[#D9D8CE] bg-[#F7F5EE] focus:bg-white text-[#263229] font-medium text-sm focus:outline-none focus:border-[#556B3F]"
              >
                <option value="" disabled>Select Difficulty</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#687066] mb-1.5">
                Duration (Minutes)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2.5 rounded border border-[#D9D8CE] bg-[#F7F5EE] focus:bg-white text-[#263229] font-medium text-sm focus:outline-none focus:border-[#556B3F]"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#687066] mb-1.5">
                Number of Participants
              </label>
              <input
                type="number"
                min="1"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                className="w-full px-4 py-2.5 rounded border border-[#D9D8CE] bg-[#F7F5EE] focus:bg-white text-[#263229] font-medium text-sm focus:outline-none focus:border-[#556B3F]"
              />
            </div>
          </div>
        </PanelCard>

        {/* 3. COMMUNICATION ENVIRONMENT */}
        <PanelCard header={<span className="text-xs font-black uppercase tracking-widest text-[#344438]">Communication Environment</span>}>
          <p className="text-xs text-[#687066] font-medium mb-4">Define the communication conditions trainees will experience.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: "NORMAL", label: "NORMAL", desc: "Reliable communication" },
              { id: "DEGRADED", label: "DEGRADED", desc: "Delayed or incomplete communication" },
              { id: "DISRUPTED", label: "DISRUPTED", desc: "Severe communication limitations" },
              { id: "OFFLINE", label: "OFFLINE", desc: "Communication unavailable" },
            ].map((opt) => {
              const selected = commEnv === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCommEnv(opt.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3
                    ${selected 
                      ? "border-[#556B3F] bg-[#EEF3E8]" 
                      : "border-[#D9D8CE] bg-white hover:border-[#71805A]/50"
                    }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${selected ? "border-[#556B3F]" : "border-[#D9D8CE]"}
                  `}>
                    {selected && <div className="w-2 h-2 bg-[#556B3F] rounded-full" />}
                  </div>
                  <div>
                    <div className="text-sm font-black uppercase tracking-widest text-[#263229] mb-0.5">{opt.label}</div>
                    <div className="text-xs text-[#687066] font-medium">{opt.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </PanelCard>

        {/* 4. INFORMATION CONDITIONS */}
        <PanelCard header={<span className="text-xs font-black uppercase tracking-widest text-[#344438]">Information Conditions</span>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: "COMPLETE", label: "COMPLETE", desc: "Full information available" },
              { id: "LIMITED", label: "LIMITED", desc: "Some information is unavailable" },
              { id: "CONFLICTING", label: "CONFLICTING", desc: "Reports may contain conflicting information" },
              { id: "OUTDATED", label: "OUTDATED", desc: "Some information may no longer be current" },
            ].map((opt) => {
              const selected = infoConditions.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleInfoCondition(opt.id)}
                  className={`text-left p-4 rounded-xl border transition-all flex items-start gap-3
                    ${selected 
                      ? "border-[#556B3F] bg-white ring-1 ring-[#556B3F]" 
                      : "border-[#D9D8CE] bg-white hover:border-[#71805A]/50"
                    }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors
                    ${selected ? "bg-[#556B3F] border-[#556B3F] text-white" : "border-[#D9D8CE]"}
                  `}>
                    {selected && <Check size={12} strokeWidth={4} />}
                  </div>
                  <div>
                    <div className="text-sm font-black uppercase tracking-widest text-[#263229] mb-0.5">{opt.label}</div>
                    <div className="text-xs text-[#687066] font-medium">{opt.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </PanelCard>

        {/* 5. TRAINING OBJECTIVES */}
        <PanelCard header={<span className="text-xs font-black uppercase tracking-widest text-[#344438]">Training Objectives</span>}>
          <div className="flex flex-wrap gap-3">
            {[
              "Decision Making",
              "Situational Awareness",
              "Communication",
              "Team Coordination",
              "Information Analysis",
              "Leadership",
            ].map((obj) => {
              const selected = objectives.includes(obj);
              return (
                <button
                  key={obj}
                  type="button"
                  onClick={() => toggleObjective(obj)}
                  className={`px-4 py-2 rounded-full border text-xs font-black tracking-widest transition-all
                    ${selected 
                      ? "border-[#556B3F] bg-[#EEF3E8] text-[#344438]" 
                      : "border-[#D9D8CE] bg-white text-[#687066] hover:border-[#71805A] hover:text-[#344438]"
                    }`}
                >
                  {obj.toUpperCase()}
                </button>
              );
            })}
          </div>
        </PanelCard>

        {/* 6. SCENARIO STATUS */}
        <PanelCard header={<span className="text-xs font-black uppercase tracking-widest text-[#344438]">Scenario Status</span>}>
          <p className="text-xs text-[#687066] font-medium mb-4">Draft scenarios can be configured before deployment.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStatus("DRAFT")}
              className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-all ${
                status === "DRAFT" ? "border-[#B69B63] bg-[#F5F1E8]" : "border-transparent bg-white hover:bg-[#F7F5EE]"
              }`}
            >
              <StatusBadge status="PENDING" showDot={false} />
            </button>
            <button
              onClick={() => setStatus("READY")}
              className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-all ${
                status === "READY" ? "border-[#556B3F] bg-[#EEF3E8]" : "border-transparent bg-white hover:bg-[#F7F5EE]"
              }`}
            >
              <StatusBadge status="READY" showDot={false} />
            </button>
          </div>
        </PanelCard>

        {/* 7. ACTIONS */}
        <div className="bg-white p-6 rounded-xl border border-[#D9D8CE] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          {errorMsg ? (
            <div className="text-sm font-bold text-[#A94A3F] flex items-center gap-2">
              <X size={16} /> {errorMsg}
            </div>
          ) : (
            <div className="text-[10px] font-mono font-bold tracking-widest text-[#A0A59E] uppercase">
              SCN-CONFIG | ENVIRONMENT OK
            </div>
          )}
          
          <div className="flex w-full sm:w-auto items-center gap-3">
            <SecondaryButton onClick={handleSaveDraft} fullWidth className="sm:w-auto">
              SAVE AS DRAFT
            </SecondaryButton>
            <PrimaryButton onClick={handleCreate} fullWidth className="sm:w-auto">
              CREATE SCENARIO
            </PrimaryButton>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
