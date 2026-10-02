"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge, StatusVariant } from "@/components/ui/StatusBadge";
import { TacticalMapPlaceholder } from "@/components/simulation/TacticalMapPlaceholder";
import { SituationPanel } from "@/components/simulation/SituationPanel";
import { CommunicationPanel } from "@/components/simulation/CommunicationPanel";
import { DecisionPanel } from "@/components/simulation/DecisionPanel";
import {
  ArrowLeft,
  Clock,
  Shield,
  Users,
  Activity,
  ChevronRight,
  LayoutGrid,
  Map,
  Radio,
  Crosshair,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Mock exercise data keyed by ID
───────────────────────────────────────────── */
const MOCK_EXERCISES: Record<
  string,
  {
    id: string;
    name: string;
    scenario: string;
    status: StatusVariant;
    phase: string;
    elapsed: number; // seconds
    duration: number; // seconds
    participants: number;
    commCondition: StatusVariant;
    commLabel: string;
    role: string;
  }
> = {
  "ex-001": {
    id: "EX-001",
    name: "Operation Silent Link",
    scenario: "Commander Decision Exercise",
    status: "ACTIVE",
    phase: "PHASE 2 — DECISION POINT",
    elapsed: 4920, // 1h 22m
    duration: 7200, // 2h
    participants: 8,
    commCondition: "DEGRADED",
    commLabel: "DEGRADED",
    role: "COMMANDER",
  },
  "ex-002": {
    id: "EX-002",
    name: "Exercise Iron Horizon",
    scenario: "Degraded Communication Exercise",
    status: "DEGRADED",
    phase: "PHASE 1 — SITUATIONAL AWARENESS",
    elapsed: 1935,
    duration: 5400,
    participants: 6,
    commCondition: "OFFLINE",
    commLabel: "OFFLINE",
    role: "COMMANDER",
  },
  "ex-003": {
    id: "EX-003",
    name: "Exercise Field Echo",
    scenario: "Command Training Exercise",
    status: "ACTIVE",
    phase: "PHASE 3 — DEBRIEF",
    elapsed: 6720,
    duration: 7200,
    participants: 10,
    commCondition: "NORMAL",
    commLabel: "NORMAL",
    role: "COMMANDER",
  },
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/* ─────────────────────────────────────────────
   Tab navigation
───────────────────────────────────────────── */
type TabKey = "map" | "situation" | "comms" | "decision";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "map",      label: "Tactical Map",   icon: <Map size={14} /> },
  { key: "situation",label: "Situation",      icon: <Activity size={14} /> },
  { key: "comms",    label: "Communications", icon: <Radio size={14} /> },
  { key: "decision", label: "Decision",       icon: <Crosshair size={14} /> },
];

/* ─────────────────────────────────────────────
   Page component
───────────────────────────────────────────── */
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CommanderSimulationPage({ params }: PageProps) {
  const { id } = use(params);
  const exercise = MOCK_EXERCISES[id.toLowerCase()] ?? MOCK_EXERCISES["ex-001"];

  const [elapsed, setElapsed] = useState(exercise.elapsed);
  const [activeTab, setActiveTab] = useState<TabKey>("map");
  const [decisionSubmitted, setDecisionSubmitted] = useState(false);

  /* Tick the exercise timer */
  useEffect(() => {
    const t = setInterval(() => setElapsed((prev) => Math.min(prev + 1, exercise.duration)), 1000);
    return () => clearInterval(t);
  }, [exercise.duration]);

  const remaining = exercise.duration - elapsed;
  const progressPct = Math.min(100, (elapsed / exercise.duration) * 100);

  const handleDecisionSubmit = (optionId: string) => {
    console.log("Decision submitted:", optionId);
    setDecisionSubmitted(true);
  };

  return (
    <AppShell pageTitle={`LIVE — ${exercise.id}`} role="commander">
      {/* ─── Custom full-height layout — no extra vertical scroll ─── */}
      <div className="flex flex-col h-full -mt-8 -mx-8 overflow-hidden">

        {/* ═══════════════════════════════════════════════
            COMMAND BAR
        ═══════════════════════════════════════════════ */}
        <div className="flex-shrink-0 bg-[#263229] text-white px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#344438]">
          
          {/* Left: Back + Exercise title */}
          <div className="flex items-center gap-4">
            <Link
              href="/commander"
              className="flex items-center gap-1.5 text-[#A0A59E] hover:text-white text-[11px] font-black tracking-widest uppercase transition-colors"
            >
              <ArrowLeft size={14} />
              EXIT
            </Link>
            <div className="h-5 w-px bg-[#344438]" />
            <div>
              <div className="text-[9px] font-black tracking-[0.2em] uppercase text-[#71805A]">
                {exercise.role} — {exercise.scenario}
              </div>
              <div className="text-base font-black tracking-wide text-white leading-tight">
                {exercise.name}
              </div>
            </div>
          </div>

          {/* Right: Live indicators */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Live pulse */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4A7A3A] animate-pulse" />
              <span className="text-[10px] font-black tracking-widest text-[#71805A]">LIVE</span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2 bg-[#1A2520] rounded px-3 py-1.5 border border-[#344438]">
              <Clock size={12} className="text-[#B69B63]" />
              <span className="text-sm font-mono font-black text-white">{formatTime(elapsed)}</span>
              <span className="text-[9px] font-mono text-[#687066]">/ {formatTime(exercise.duration)}</span>
            </div>

            {/* Remaining */}
            <div className="text-[10px] font-mono font-bold text-[#A0A59E]">
              <span className="text-[#B69B63]">{formatTime(remaining)}</span> REMAINING
            </div>

            {/* Status badges */}
            <StatusBadge status={exercise.status} />
            <div className="hidden sm:flex items-center gap-2">
              <Users size={12} className="text-[#71805A]" />
              <span className="text-[10px] font-black tracking-widest text-[#A0A59E]">{exercise.participants} PARTICIPANTS</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Shield size={12} className="text-[#71805A]" />
              <span className="text-[10px] font-black tracking-widest text-[#A0A59E]">COMMS: </span>
              <StatusBadge status={exercise.commCondition} label={exercise.commLabel} showDot={false} />
            </div>
          </div>
        </div>

        {/* ─── Progress bar ─── */}
        <div className="flex-shrink-0 h-1 bg-[#1A2520]">
          <div
            className="h-full bg-[#556B3F] transition-all duration-1000"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* ─── Phase banner ─── */}
        <div className="flex-shrink-0 bg-[#EFE8D8] border-b border-[#D8C7A5] px-6 py-2 flex items-center gap-3">
          <LayoutGrid size={13} className="text-[#71805A]" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-[#344438]">{exercise.phase}</span>
          {decisionSubmitted && (
            <span className="ml-auto text-[9px] font-black tracking-widest text-[#4A7A3A] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A7A3A]" />
              DECISION LOGGED
            </span>
          )}
          {!decisionSubmitted && (
            <button
              onClick={() => setActiveTab("decision")}
              className="ml-auto flex items-center gap-1.5 text-[9px] font-black tracking-widest text-[#A94A3F] hover:text-[#7A2A20] transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#A94A3F] animate-pulse" />
              ACTION REQUIRED
              <ChevronRight size={10} />
            </button>
          )}
        </div>

        {/* ═══════════════════════════════════════════════
            MOBILE TAB BAR
        ═══════════════════════════════════════════════ */}
        <div className="flex-shrink-0 flex xl:hidden border-b border-[#D9D8CE] bg-white overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-[10px] font-black tracking-widest uppercase whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.key
                  ? "border-[#556B3F] text-[#344438]"
                  : "border-transparent text-[#A0A59E] hover:text-[#687066]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════
            MAIN CONTENT AREA
        ═══════════════════════════════════════════════ */}
        <div className="flex-1 overflow-hidden">

          {/* ─── DESKTOP: 4-panel grid ─── */}
          <div className="hidden xl:grid xl:grid-cols-[1fr_280px_280px_340px] h-full divide-x divide-[#D9D8CE]">
            {/* Col 1: Tactical Map */}
            <div className="overflow-hidden p-4 bg-[#F7F5EE]">
              <TacticalMapPlaceholder />
            </div>

            {/* Col 2: Situation */}
            <div className="overflow-y-auto p-4 bg-white">
              <SituationPanel />
            </div>

            {/* Col 3: Communications */}
            <div className="overflow-y-auto p-4 bg-white">
              <CommunicationPanel />
            </div>

            {/* Col 4: Decision */}
            <div className="overflow-y-auto p-4 bg-[#F7F5EE]">
              <DecisionPanel
                onDecisionSubmit={handleDecisionSubmit}
                submitted={decisionSubmitted}
              />
            </div>
          </div>

          {/* ─── MOBILE: Single tab view ─── */}
          <div className="xl:hidden h-full overflow-y-auto p-4 bg-[#F7F5EE]">
            {activeTab === "map" && (
              <div className="h-[480px]">
                <TacticalMapPlaceholder />
              </div>
            )}
            {activeTab === "situation" && <SituationPanel />}
            {activeTab === "comms" && <CommunicationPanel />}
            {activeTab === "decision" && (
              <DecisionPanel
                onDecisionSubmit={handleDecisionSubmit}
                submitted={decisionSubmitted}
              />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
