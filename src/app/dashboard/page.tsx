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
  Activity,
  Users,
  Radio,
  Server,
  PlayCircle,
  Clock,
  Map,
  ShieldAlert,
  List,
  Target,
  FileText,
  Info,
  ChevronRight,
  Crosshair
} from "lucide-react";

export default function DashboardPage() {
  const { addToast } = useToast();

  const handleOpenExercise = (id: string) => {
    addToast({
      variant: "info",
      title: "Exercise Access",
      message: `Access to exercise ${id} will be available in the next phase.`,
    });
  };

  return (
    <AppShell pageTitle="TACTICAL DASHBOARD" role="commander">
      <PageHeader
        label="OVERVIEW"
        title="TACTICAL DASHBOARD"
        description="Training environment overview and operational status."
        action={
          <div className="flex items-center gap-2 bg-[#EBF4E8] border border-[#C4DAC0] rounded px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4A7A3A] animate-pulse" />
            <span className="text-[10px] font-black tracking-widest text-[#3A6B30] uppercase">
              Training System • Online
            </span>
          </div>
        }
      />

      <div className="mt-8 flex flex-col gap-6">

        {/* ── 1. OVERVIEW CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PanelCard>
            <div className="flex items-center gap-2 mb-3">
              <Activity size={14} className="text-[#556B3F]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E]">Active Exercises</span>
            </div>
            <div className="text-3xl font-black text-[#263229] font-mono mb-1">03</div>
            <div className="text-[10px] font-medium text-[#687066]">Currently running</div>
          </PanelCard>
          
          <PanelCard>
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-[#344438]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E]">Active Trainees</span>
            </div>
            <div className="text-3xl font-black text-[#263229] font-mono mb-1">24</div>
            <div className="text-[10px] font-medium text-[#687066]">Across active exercises</div>
          </PanelCard>
          
          <PanelCard>
            <div className="flex items-center gap-2 mb-3">
              <Radio size={14} className="text-[#8A5C2A]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E]">Communication</span>
            </div>
            <div className="mt-1 mb-2">
              <StatusBadge status="DEGRADED" showDot={false} />
            </div>
            <div className="text-[10px] font-medium text-[#687066]">Network simulated delay</div>
          </PanelCard>
          
          <PanelCard>
            <div className="flex items-center gap-2 mb-3">
              <Server size={14} className="text-[#4A7A3A]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E]">System Status</span>
            </div>
            <div className="mt-1 mb-2">
              <StatusBadge status="ACTIVE" label="ONLINE" showDot={false} />
            </div>
            <div className="text-[10px] font-medium text-[#687066]">All services operational</div>
          </PanelCard>
        </div>

        {/* ── 2. CURRENT EXERCISE & ACTIVE TRAINING ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* CURRENT EXERCISE */}
          <PanelCard
            accent="olive"
            header={
              <div className="flex items-center gap-2">
                <Target size={14} className="text-[#556B3F]" />
                <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Current Exercise</h2>
              </div>
            }
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-black tracking-widest text-[#B69B63]">EX-001</span>
              <StatusBadge status="ACTIVE" />
            </div>
            <h3 className="text-xl font-black text-[#263229] mb-5 uppercase">Operation Silent Link</h3>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-6 bg-[#F7F5EE] border border-[#D9D8CE] p-4 rounded-xl">
              {[
                { label: "ROLE", value: "Commander" },
                { label: "PHASE", value: "Decision" },
                { label: "GRID", value: "24A", mono: true },
                { label: "COMMUNICATION", badge: "DEGRADED" },
                { label: "PARTICIPANTS", value: "08" },
                { label: "TIME REMAINING", value: "18:42", mono: true, highlight: true },
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E]">{item.label}</span>
                  {item.badge ? (
                    <div><StatusBadge status={item.badge as StatusVariant} /></div>
                  ) : (
                    <span className={`text-sm ${item.mono ? 'font-mono' : ''} ${item.highlight ? 'font-bold text-[#A94A3F]' : 'font-black text-[#344438]'}`}>
                      {item.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            <Link href="/commander/simulation/EX-001" className="block">
              <PrimaryButton icon={<PlayCircle size={16} />} fullWidth>
                ENTER SIMULATION
              </PrimaryButton>
            </Link>
          </PanelCard>

          {/* ACTIVE TRAINING LIST */}
          <PanelCard
            header={
              <div className="flex items-center gap-2">
                <List size={14} className="text-[#344438]" />
                <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Active Training</h2>
              </div>
            }
            noPadding
          >
            <div className="divide-y divide-[#D9D8CE]">
              
              {/* EX-001 */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F7F5EE] transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black tracking-widest text-[#B69B63]">EX-001</span>
                    <span className="text-sm font-black text-[#263229] uppercase">Operation Silent Link</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-[#687066]">
                    <span>Commander Training</span>
                    <span>•</span>
                    <span className="text-[#4A7A3A] font-bold">Active</span>
                    <span>•</span>
                    <span className="font-mono">18:42 remaining</span>
                  </div>
                </div>
                <Link href="/commander/simulation/EX-001">
                  <SecondaryButton size="sm">OPEN</SecondaryButton>
                </Link>
              </div>

              {/* EX-002 */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F7F5EE] transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black tracking-widest text-[#B69B63]">EX-002</span>
                    <span className="text-sm font-black text-[#263229] uppercase">Iron Horizon</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-[#687066]">
                    <span>Team Training</span>
                    <span>•</span>
                    <span className="text-[#4A7A3A] font-bold">Active</span>
                    <span>•</span>
                    <span className="font-mono">32:15 remaining</span>
                  </div>
                </div>
                <SecondaryButton size="sm" onClick={() => handleOpenExercise("EX-002")}>OPEN</SecondaryButton>
              </div>

              {/* EX-003 */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F7F5EE] transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black tracking-widest text-[#B69B63]">EX-003</span>
                    <span className="text-sm font-black text-[#263229] uppercase">Field Echo</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-[#687066]">
                    <span>Decision Making</span>
                    <span>•</span>
                    <span className="text-[#4A7A3A] font-bold">Active</span>
                    <span>•</span>
                    <span className="font-mono">11:27 remaining</span>
                  </div>
                </div>
                <SecondaryButton size="sm" onClick={() => handleOpenExercise("EX-003")}>OPEN</SecondaryButton>
              </div>

            </div>
          </PanelCard>
        </div>

        {/* ── 3. RECENT ACTIVITY & TRAINING MODULES ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* RECENT ACTIVITY */}
          <PanelCard
            header={
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#344438]" />
                <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Recent Activity</h2>
              </div>
            }
            noPadding
          >
            <div className="relative border-l border-[#D9D8CE] ml-8 my-6 space-y-0">
              {[
                { time: "16:45", text: "Operation Silent Link completed decision phase", type: "system" },
                { time: "16:32", text: "Commander submitted decision", type: "decision" },
                { time: "16:27", text: "Map update delay detected", type: "warning" },
                { time: "16:21", text: "Conflicting report received", type: "warning" },
                { time: "16:12", text: "Communication environment degraded", type: "warning" },
              ].map((ev, i) => {
                const isLast = i === 4;
                const dot = ev.type === "system" ? "bg-[#344438]" : ev.type === "decision" ? "bg-[#4A7A3A]" : "bg-[#B87A3A]";
                return (
                  <div key={i} className="relative pl-6 pb-6 hover:bg-[#F7F5EE] transition-colors pr-4 pt-1">
                    {!isLast && <div className="absolute left-[-1px] top-6 bottom-0 w-px bg-[#D9D8CE]" />}
                    <span className={`absolute -left-[5px] top-2.5 w-2.5 h-2.5 rounded-full ${dot} ring-4 ring-white`} />
                    <div className="text-[9px] font-mono font-bold tracking-widest text-[#B69B63] mb-0.5">{ev.time}</div>
                    <div className="text-sm font-medium text-[#263229] leading-snug">{ev.text}</div>
                  </div>
                );
              })}
            </div>
          </PanelCard>

          {/* TRAINING MODULES */}
          <PanelCard
            accent="brass"
            header={
              <div className="flex items-center gap-2">
                <Crosshair size={14} className="text-[#B69B63]" />
                <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Training Modules</h2>
              </div>
            }
            noPadding
          >
            <div className="divide-y divide-[#D9D8CE]">
              
              {/* Instructor */}
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FDF3E3] transition-colors group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F5F1E8] border border-[#D9D8CE] flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-[#B69B63] transition-colors">
                    <ShieldAlert size={16} className="text-[#344438]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#263229]">Instructor</h3>
                    <p className="text-xs font-medium text-[#687066] mt-0.5">Manage scenarios and exercises.</p>
                  </div>
                </div>
                <Link href="/instructor">
                  <SecondaryButton size="sm" icon={<ChevronRight size={14} />}>OPEN</SecondaryButton>
                </Link>
              </div>

              {/* Commander */}
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FDF3E3] transition-colors group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F5F1E8] border border-[#D9D8CE] flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-[#B69B63] transition-colors">
                    <Map size={16} className="text-[#344438]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#263229]">Commander</h3>
                    <p className="text-xs font-medium text-[#687066] mt-0.5">Enter active tactical simulations.</p>
                  </div>
                </div>
                <Link href="/commander">
                  <SecondaryButton size="sm" icon={<ChevronRight size={14} />}>OPEN</SecondaryButton>
                </Link>
              </div>

              {/* Team */}
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FDF3E3] transition-colors group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F5F1E8] border border-[#D9D8CE] flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-[#B69B63] transition-colors">
                    <Users size={16} className="text-[#344438]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#263229]">Team</h3>
                    <p className="text-xs font-medium text-[#687066] mt-0.5">Access team operations workspace.</p>
                  </div>
                </div>
                <Link href="/team">
                  <SecondaryButton size="sm" icon={<ChevronRight size={14} />}>OPEN</SecondaryButton>
                </Link>
              </div>

              {/* AAR */}
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FDF3E3] transition-colors group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F5F1E8] border border-[#D9D8CE] flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-[#B69B63] transition-colors">
                    <FileText size={16} className="text-[#344438]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#263229]">After Action Review</h3>
                    <p className="text-xs font-medium text-[#687066] mt-0.5">Review completed training exercises.</p>
                  </div>
                </div>
                <Link href="/aar/EX-001">
                  <SecondaryButton size="sm" icon={<ChevronRight size={14} />}>OPEN</SecondaryButton>
                </Link>
              </div>

            </div>
          </PanelCard>
        </div>

        {/* ── 4. SYSTEM ENVIRONMENT ── */}
        <PanelCard className="bg-[#EFE8D8] border-[#D8C7A5]">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-3 mb-2 sm:mb-0">
              <Info size={16} className="text-[#344438]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Training Environment</h2>
            </div>
            
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E]">Environment</span>
                <span className="text-xs font-black text-[#344438]">SIMULATION</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E]">System Status</span>
                <span className="text-xs font-black text-[#4A7A3A]">ONLINE</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E]">Data Source</span>
                <span className="text-xs font-black text-[#344438]">DEMO DATA</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E]">Connection</span>
                <span className="text-xs font-black text-[#344438]">LOCAL</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E]">Real-Time Data</span>
                <span className="text-xs font-black text-[#A94A3F]">NOT CONNECTED</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-[#D8C7A5]">
            <p className="text-[10px] font-medium text-[#7A6B4A]">
              All information currently displayed is simulated training data.
            </p>
          </div>
        </PanelCard>

      </div>
    </AppShell>
  );
}
