"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { PanelCard } from "@/components/ui/PanelCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { StatusBadge, StatusVariant } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import {
  ShieldAlert,
  Radio,
  Clock,
  Users,
  Map,
  Activity,
  Crosshair,
  List,
  FileText,
  PlayCircle,
  AlertTriangle,
  Info
} from "lucide-react";

export default function CommanderPage() {
  const { addToast } = useToast();

  const handleViewExercise = () => {
    addToast({
      variant: "info",
      title: "Exercise Access",
      message: "Commander access is available for this training exercise.",
    });
  };

  const handlePrepareExercise = () => {
    addToast({
      variant: "info",
      title: "Exercise Prep",
      message: "Preparing exercise environment...",
    });
  };

  return (
    <AppShell pageTitle="COMMANDER OPERATIONS" role="commander">
      <PageHeader
        label="COMMANDER OPERATIONS"
        title="COMMANDER OPERATIONS"
        description="Select an active training exercise and enter the tactical environment."
        action={
          <div className="flex items-center gap-2 bg-[#EBF4E8] border border-[#C4DAC0] rounded px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4A7A3A] animate-pulse" />
            <span className="text-[10px] font-black tracking-widest text-[#3A6B30] uppercase">
              Commander • Training System Online
            </span>
          </div>
        }
      />

      <div className="mt-8 flex flex-col gap-6">
        
        {/* ── COMMAND STATUS & OPERATIONAL NOTICE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PanelCard
              accent="olive"
              header={
                <div className="flex items-center gap-2">
                  <ShieldAlert size={14} className="text-[#556B3F]" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Command Status</h2>
                </div>
              }
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: "ROLE", value: "Commander", bold: true },
                  { label: "STATUS", badge: "READY" },
                  { label: "ACTIVE EXERCISES", value: "02" },
                  { label: "COMMUNICATION", value: "Training Env" },
                  { label: "ACCESS LEVEL", value: "Command" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E]">
                      {item.label}
                    </span>
                    {item.badge ? (
                      <div>
                        <StatusBadge status={item.badge as StatusVariant} />
                      </div>
                    ) : (
                      <span className={`text-sm ${item.bold ? 'font-black' : 'font-medium'} text-[#263229]`}>
                        {item.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </PanelCard>
          </div>

          <div className="lg:col-span-1">
            <PanelCard
              accent="brass"
              header={
                <div className="flex items-center gap-2">
                  <Info size={14} className="text-[#B69B63]" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Training Environment</h2>
                </div>
              }
            >
              <p className="text-xs font-medium text-[#687066] leading-relaxed mb-4">
                This environment simulates command decisions under changing information and degraded communication conditions.
              </p>
              <div className="space-y-2 text-[9px] font-mono font-bold tracking-widest text-[#A0A59E]">
                <div className="flex justify-between">
                  <span>ENVIRONMENT:</span>
                  <span className="text-[#344438]">SIMULATION</span>
                </div>
                <div className="flex justify-between">
                  <span>DATA SOURCE:</span>
                  <span className="text-[#344438]">DEMO DATA</span>
                </div>
                <div className="flex justify-between">
                  <span>REAL-TIME CONNECTION:</span>
                  <span className="text-[#344438]">NOT REQUIRED</span>
                </div>
              </div>
            </PanelCard>
          </div>
        </div>

        {/* ── MAIN AREA: ACTIVE EXERCISES & QUICK ACCESS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ACTIVE EXERCISES */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#687066]">Active Training Exercises</h3>
            
            {/* EXERCISE 1 */}
            <PanelCard className="border-[#D9D8CE] hover:border-[#556B3F] transition-colors group">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black tracking-widest text-[#B69B63]">EX-001</span>
                    <StatusBadge status="ACTIVE" />
                  </div>
                  <h4 className="text-lg font-black text-[#263229] mb-4 uppercase">Operation Silent Link</h4>
                  
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="flex items-center gap-2">
                      <Crosshair size={14} className="text-[#687066]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-widest text-[#A0A59E] uppercase">Training Type</span>
                        <span className="text-xs font-medium text-[#263229]">Commander</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-[#687066]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-widest text-[#A0A59E] uppercase">Difficulty</span>
                        <span className="text-xs font-medium text-[#263229]">Advanced</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Radio size={14} className="text-[#8A5C2A]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-widest text-[#A0A59E] uppercase">Communication</span>
                        <span className="text-xs font-black text-[#8A5C2A]">DEGRADED</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Map size={14} className="text-[#687066]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-widest text-[#A0A59E] uppercase">Grid</span>
                        <span className="text-xs font-mono font-bold text-[#344438]">24A</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-[#687066]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-widest text-[#A0A59E] uppercase">Participants</span>
                        <span className="text-xs font-medium text-[#263229]">08</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-start md:items-end gap-4 min-w-[140px]">
                  <div className="flex items-center gap-1.5 text-[#A94A3F] bg-[#FAF0EF] px-2 py-1 rounded border border-[#E8C4C0]">
                    <Clock size={12} />
                    <span className="text-xs font-mono font-bold">18:42</span>
                  </div>
                  <Link href="/commander/simulation/EX-001" className="w-full md:w-auto">
                    <PrimaryButton icon={<PlayCircle size={16} />} fullWidth>
                      ENTER SIMULATION
                    </PrimaryButton>
                  </Link>
                </div>
              </div>
            </PanelCard>

            {/* EXERCISE 2 */}
            <PanelCard className="border-[#D9D8CE] hover:border-[#556B3F] transition-colors group">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black tracking-widest text-[#B69B63]">EX-002</span>
                    <StatusBadge status="ACTIVE" />
                  </div>
                  <h4 className="text-lg font-black text-[#263229] mb-4 uppercase">Iron Horizon</h4>
                  
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="flex items-center gap-2">
                      <Crosshair size={14} className="text-[#687066]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-widest text-[#A0A59E] uppercase">Training Type</span>
                        <span className="text-xs font-medium text-[#263229]">Team</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-[#687066]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-widest text-[#A0A59E] uppercase">Difficulty</span>
                        <span className="text-xs font-medium text-[#263229]">Intermediate</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Radio size={14} className="text-[#B87A3A]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-widest text-[#A0A59E] uppercase">Communication</span>
                        <span className="text-xs font-black text-[#B87A3A]">LIMITED</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Map size={14} className="text-[#687066]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-widest text-[#A0A59E] uppercase">Grid</span>
                        <span className="text-xs font-mono font-bold text-[#344438]">17C</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-[#687066]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-widest text-[#A0A59E] uppercase">Participants</span>
                        <span className="text-xs font-medium text-[#263229]">06</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-start md:items-end gap-4 min-w-[140px]">
                  <div className="flex items-center gap-1.5 text-[#344438] bg-[#EFE8D8] px-2 py-1 rounded border border-[#D8C7A5]">
                    <Clock size={12} />
                    <span className="text-xs font-mono font-bold">32:15</span>
                  </div>
                  <SecondaryButton onClick={handleViewExercise} fullWidth>
                    VIEW EXERCISE
                  </SecondaryButton>
                </div>
              </div>
            </PanelCard>

            {/* EXERCISE 3 */}
            <PanelCard className="border-[#D9D8CE] hover:border-[#556B3F] transition-colors group">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black tracking-widest text-[#B69B63]">EX-003</span>
                    <StatusBadge status="READY" />
                  </div>
                  <h4 className="text-lg font-black text-[#263229] mb-4 uppercase">Field Echo</h4>
                  
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="flex items-center gap-2">
                      <Crosshair size={14} className="text-[#687066]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-widest text-[#A0A59E] uppercase">Training Type</span>
                        <span className="text-xs font-medium text-[#263229]">Decision Making</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-[#687066]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-widest text-[#A0A59E] uppercase">Difficulty</span>
                        <span className="text-xs font-medium text-[#263229]">Advanced</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Radio size={14} className="text-[#3A6B30]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-widest text-[#A0A59E] uppercase">Communication</span>
                        <span className="text-xs font-black text-[#3A6B30]">NORMAL</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Map size={14} className="text-[#687066]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-widest text-[#A0A59E] uppercase">Grid</span>
                        <span className="text-xs font-mono font-bold text-[#344438]">31B</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-[#687066]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-widest text-[#A0A59E] uppercase">Participants</span>
                        <span className="text-xs font-medium text-[#263229]">10</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-start md:items-end gap-4 min-w-[140px]">
                  <SecondaryButton onClick={handlePrepareExercise} fullWidth>
                    PREPARE EXERCISE
                  </SecondaryButton>
                </div>
              </div>
            </PanelCard>
          </div>
          
          {/* QUICK ACCESS */}
          <div className="lg:col-span-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#687066] mb-6">Quick Access</h3>
            <div className="flex flex-col gap-4">
              <Link href="/commander/simulation/EX-001" className="group">
                <PanelCard className="flex items-center gap-4 hover:border-[#556B3F] hover:bg-[#F7F5EE] transition-colors cursor-pointer p-4">
                  <div className="w-10 h-10 rounded-full bg-[#EBF4E8] border border-[#C4DAC0] flex items-center justify-center flex-shrink-0 group-hover:bg-[#556B3F] group-hover:text-white transition-colors text-[#344438]">
                    <PlayCircle size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-black uppercase tracking-widest text-[#263229]">Active Simulation</div>
                    <div className="text-xs text-[#687066] font-medium mt-0.5">Open current active simulation.</div>
                  </div>
                </PanelCard>
              </Link>
              
              <Link href="/instructor/scenarios" className="group">
                <PanelCard className="flex items-center gap-4 hover:border-[#B69B63] hover:bg-[#F7F5EE] transition-colors cursor-pointer p-4">
                  <div className="w-10 h-10 rounded-full bg-[#FDF3E3] border border-[#E8D4B0] flex items-center justify-center flex-shrink-0 group-hover:bg-[#B69B63] group-hover:text-white transition-colors text-[#8A5C2A]">
                    <List size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-black uppercase tracking-widest text-[#263229]">Training Scenarios</div>
                    <div className="text-xs text-[#687066] font-medium mt-0.5">Navigate to Scenario list.</div>
                  </div>
                </PanelCard>
              </Link>

              <Link href="/aar/EX-001" className="group">
                <PanelCard className="flex items-center gap-4 hover:border-[#71805A] hover:bg-[#F7F5EE] transition-colors cursor-pointer p-4">
                  <div className="w-10 h-10 rounded-full bg-[#EFE8D8] border border-[#D8C7A5] flex items-center justify-center flex-shrink-0 group-hover:bg-[#71805A] group-hover:text-white transition-colors text-[#344438]">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-black uppercase tracking-widest text-[#263229]">After Action Review</div>
                    <div className="text-xs text-[#687066] font-medium mt-0.5">Review completed exercises.</div>
                  </div>
                </PanelCard>
              </Link>
            </div>
          </div>
          
        </div>
      </div>
    </AppShell>
  );
}
