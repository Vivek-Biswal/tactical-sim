"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { SharedExercise } from "@/components/integration/SharedExercise";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { PanelCard } from "@/components/ui/PanelCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { StatusBadge, StatusVariant } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { 
  ArrowLeft, MonitorPlay, Pause, Play, Square, 
  Activity, Users, Radio, Clock, ShieldAlert,
  CheckCircle2, Plus
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ExerciseDetailPage({ params }: PageProps) {
  const { id } = use(params);
  if (/^ex-[a-f0-9]{12}$/.test(id)) return <SharedExercise key={id} id={id} initialRole="INSTRUCTOR" />;
  return <SampleExerciseDetail params={params} />;
}

function SampleExerciseDetail({ params }: PageProps) {
  const { id } = use(params);
  const { addToast } = useToast();

  const [exStatus, setExStatus] = useState<StatusVariant>("ACTIVE");
  const [events, setEvents] = useState([
    { time: "18:42", text: "Exercise started.", iconBg: "bg-[#4A7A3A]" },
    { time: "17:55", text: "Communication changed from NORMAL → DEGRADED.", iconBg: "bg-[#B87A3A]" },
    { time: "16:30", text: "Incoming report received.", iconBg: "bg-[#71805A]" },
    { time: "15:12", text: "Map update delayed.", iconBg: "bg-[#B87A3A]" },
    { time: "14:40", text: "Team Bravo acknowledged briefing.", iconBg: "bg-[#D9D8CE]" },
  ]);

  const handlePause = () => {
    setExStatus("PENDING");
    addToast({ variant: "warning", title: "Exercise Paused", message: "The exercise clock has been halted." });
    injectEvent("Exercise paused by instructor.", "bg-[#B87A3A]");
  };

  const handleResume = () => {
    setExStatus("ACTIVE");
    addToast({ variant: "success", title: "Exercise Resumed", message: "The exercise is now active." });
    injectEvent("Exercise resumed by instructor.", "bg-[#4A7A3A]");
  };

  const handleEnd = () => {
    setExStatus("OFFLINE");
    addToast({ variant: "error", title: "Exercise Ended", message: "The exercise has been terminated." });
    injectEvent("Exercise ended by instructor.", "bg-[#A94A3F]");
  };

  const handleInjectEvent = () => {
    injectEvent("Manual instructor injection deployed.", "bg-[#71805A]");
    addToast({ variant: "info", title: "Event Injected", message: "Event added to the timeline." });
  };

  const injectEvent = (text: string, iconBg: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setEvents((prev) => [{ time: timeStr, text, iconBg }, ...prev]);
  };

  return (
    <AppShell pageTitle="EXERCISE CONTROL" role="instructor">
      
      {/* ── TOP NAVIGATION ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Link href="/instructor/scenarios">
          <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#687066] hover:text-[#263229] transition-colors">
            <ArrowLeft size={14} /> BACK TO SCENARIOS
          </button>
        </Link>
        <Link href={`/commander/simulation/${id}`}>
          <SecondaryButton size="sm" icon={<MonitorPlay size={14} />}>
            VIEW COMMANDER SIMULATION
          </SecondaryButton>
        </Link>
      </div>

      {/* ── HEADER ── */}
      <div className="mb-8">
        <PageHeader
          label="EXERCISE CONTROL"
          title="Operation Silent Link"
          description="Decision-making under degraded communication conditions."
          action={
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
              <StatusBadge status={exStatus} className="text-sm px-3 py-1 scale-110 origin-right" />
              <div className="flex gap-2">
                {exStatus === "ACTIVE" ? (
                  <SecondaryButton size="sm" icon={<Pause size={14} />} onClick={handlePause}>
                    PAUSE
                  </SecondaryButton>
                ) : exStatus === "PENDING" ? (
                  <SecondaryButton size="sm" icon={<Play size={14} />} onClick={handleResume}>
                    RESUME
                  </SecondaryButton>
                ) : null}
                {exStatus !== "OFFLINE" && (
                  <PrimaryButton size="sm" icon={<Square size={14} />} onClick={handleEnd} className="bg-[#A94A3F] border-[#A94A3F] hover:bg-[#8B3A31]">
                    END EXERCISE
                  </PrimaryButton>
                )}
              </div>
            </div>
          }
        />
        <div className="mt-2 text-[10px] font-mono font-bold tracking-widest text-[#B69B63] uppercase">
          {id} | GRID 24A | TRAINING CYCLE 04
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
        
        {/* LEFT COLUMN (Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* EXERCISE STATUS */}
          <PanelCard accent="olive" header={<span className="text-xs font-black uppercase tracking-widest text-[#344438]">Exercise Status</span>}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#687066] mb-1">Status</div>
                <StatusBadge status={exStatus} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#687066] mb-1">Time Remaining</div>
                <div className="text-2xl font-black text-[#263229] flex items-center gap-2">
                  <Clock size={20} className="text-[#556B3F]" />
                  18:42
                </div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#687066] mb-1">Current Phase</div>
                <div className="text-sm font-bold text-[#344438] bg-[#F7F5EE] px-2 py-1 rounded inline-block border border-[#D9D8CE]">
                  DECISION PHASE
                </div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#687066] mb-1">Communication</div>
                <StatusBadge status="DEGRADED" showDot={false} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#687066] mb-1">Participants</div>
                <div className="text-lg font-black text-[#263229] flex items-center gap-2">
                  <Users size={16} className="text-[#687066]" />
                  08
                </div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#687066] mb-1">Grid / ID</div>
                <div className="text-sm font-mono font-bold text-[#687066]">24A / {id}</div>
              </div>
            </div>
          </PanelCard>

          {/* PARTICIPANTS */}
          <PanelCard header={<span className="text-xs font-black uppercase tracking-widest text-[#344438]">Participants</span>} noPadding>
            <div className="divide-y divide-[#D9D8CE]">
              {[
                { name: "Commander Alpha", role: "COMMANDER", status: "ACTIVE", conn: "DEGRADED" },
                { name: "Team Bravo", role: "TEAM MEMBER", status: "ACTIVE", conn: "DEGRADED" },
                { name: "Team Charlie", role: "TEAM MEMBER", status: "READY", conn: "NORMAL" },
                { name: "Observer 01", role: "OBSERVER", status: "MONITORING", conn: "NORMAL" },
              ].map((p, i) => (
                <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F7F5EE] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#EFE8D8] rounded flex items-center justify-center border border-[#D8C7A5] flex-shrink-0">
                      <span className="text-sm font-black text-[#344438]">
                        {p.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-black text-[#263229]">{p.name}</div>
                      <div className="text-[9px] font-black tracking-widest text-[#71805A] uppercase mt-0.5">{p.role}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-right">
                      <div className="text-[9px] font-black uppercase tracking-widest text-[#687066] mb-0.5">Status</div>
                      <StatusBadge status={p.status === "ACTIVE" ? "ACTIVE" : p.status === "READY" ? "READY" : "NORMAL"} showDot={false} />
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-black uppercase tracking-widest text-[#687066] mb-0.5">Connection</div>
                      <StatusBadge status={p.conn === "DEGRADED" ? "DEGRADED" : "NORMAL"} showDot={false} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PanelCard>

          {/* RECENT EVENTS */}
          <PanelCard header={<span className="text-xs font-black uppercase tracking-widest text-[#344438]">Recent Exercise Events</span>}>
            <div className="relative border-l border-[#D9D8CE] ml-2 space-y-6 pb-2">
              {events.map((item, i) => (
                <div key={i} className="relative pl-6">
                  <span className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${item.iconBg} ring-4 ring-white`} />
                  <div className="text-[10px] font-mono font-bold tracking-widest text-[#B69B63] mb-1">{item.time}</div>
                  <div className="text-sm font-medium text-[#263229] leading-relaxed">{item.text}</div>
                </div>
              ))}
            </div>
          </PanelCard>

          {/* EXERCISE CONTROLS */}
          <PanelCard accent="brass" header={<span className="text-xs font-black uppercase tracking-widest text-[#344438]">Exercise Controls</span>}>
            <div className="flex flex-wrap gap-3">
              <SecondaryButton icon={<Pause size={16} />} onClick={handlePause} disabled={exStatus !== "ACTIVE"}>
                PAUSE EXERCISE
              </SecondaryButton>
              <SecondaryButton icon={<Play size={16} />} onClick={handleResume} disabled={exStatus !== "PENDING"}>
                RESUME EXERCISE
              </SecondaryButton>
              <PrimaryButton icon={<Plus size={16} />} onClick={handleInjectEvent} disabled={exStatus === "OFFLINE"}>
                INJECT EVENT
              </PrimaryButton>
              <SecondaryButton icon={<Square size={16} />} onClick={handleEnd} disabled={exStatus === "OFFLINE"} className="text-[#A94A3F] hover:border-[#A94A3F] hover:bg-[#FAF0EF]">
                END EXERCISE
              </SecondaryButton>
            </div>
          </PanelCard>

        </div>

        {/* RIGHT COLUMN (Span 1) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* TRAINING PHASE */}
          <PanelCard header={<span className="text-xs font-black uppercase tracking-widest text-[#344438]">Training Phase</span>}>
            <div className="space-y-4">
              {[
                { num: "01", name: "BRIEFING", status: "Complete" },
                { num: "02", name: "SITUATION", status: "Complete" },
                { num: "03", name: "COMMUNICATION DISRUPTION", status: "ACTIVE" },
                { num: "04", name: "DECISION", status: "Pending" },
                { num: "05", name: "AFTER ACTION REVIEW", status: "Pending" },
              ].map((phase, i) => {
                const isActive = phase.status === "ACTIVE";
                const isComplete = phase.status === "Complete";
                
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-black flex-shrink-0
                        ${isActive ? "bg-[#556B3F] text-white" : isComplete ? "bg-[#EFE8D8] text-[#344438]" : "bg-white border border-[#D9D8CE] text-[#A0A59E]"}
                      `}>
                        {phase.num}
                      </div>
                      {i < 4 && <div className={`w-px h-full mt-2 ${isComplete ? "bg-[#B69B63]" : "bg-[#D9D8CE]"}`} />}
                    </div>
                    <div className="pb-4 pt-1.5">
                      <div className={`text-xs font-black uppercase tracking-widest mb-1 ${isActive ? "text-[#344438]" : isComplete ? "text-[#687066]" : "text-[#A0A59E]"}`}>
                        {phase.name}
                      </div>
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase ${isActive ? "text-[#556B3F]" : isComplete ? "text-[#B69B63]" : "text-[#A0A59E]"}`}>
                        {isComplete && <CheckCircle2 size={12} />}
                        {phase.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </PanelCard>

          {/* COMMUNICATION ENVIRONMENT */}
          <PanelCard accent="red" header={<span className="text-xs font-black uppercase tracking-widest text-[#344438]">Communication Environment</span>}>
            <div className="mb-5 border-b border-[#D9D8CE] pb-5">
              <div className="flex items-center gap-3 mb-2">
                <ShieldAlert size={20} className="text-[#8A5C2A]" />
                <span className="text-sm font-black text-[#263229]">DEGRADED</span>
              </div>
              <p className="text-xs text-[#687066] font-medium leading-relaxed">
                Communication is experiencing delays and incomplete transmission.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio size={14} className="text-[#687066]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#687066]">Radio</span>
                </div>
                <StatusBadge status="DEGRADED" showDot={false} label="DELAYED" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-[#687066]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#687066]">Data Link</span>
                </div>
                <StatusBadge status="PENDING" showDot={false} label="LIMITED" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MonitorPlay size={14} className="text-[#687066]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#687066]">Map Update</span>
                </div>
                <StatusBadge status="DEGRADED" showDot={false} label="DELAYED" />
              </div>
            </div>
          </PanelCard>
          
        </div>
      </div>
    </AppShell>
  );
}
