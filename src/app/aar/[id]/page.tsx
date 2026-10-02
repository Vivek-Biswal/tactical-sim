"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { PanelCard } from "@/components/ui/PanelCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import {
  ArrowLeft,
  Download,
  Clock,
  Users,
  Radio,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Target,
  FileText,
  BookOpen,
  MessageSquare,
  Zap,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════════════════ */
const MOCK_AAR: Record<string, AARRecord> = {
  "ex-001": {
    aarId: "AAR-001",
    exerciseId: "EX-001",
    name: "Operation Silent Link",
    type: "COMMANDER",
    difficulty: "ADVANCED",
    completedDate: "02 OCT 2026",
    completedTime: "16:45",
    duration: "45:18",
    participants: 8,
    commCondition: "DEGRADED" as const,
    role: "COMMANDER",

    performanceMetrics: [
      { id: "p1", label: "Decision Response",       sublabel: "Decision quality",           value: 82 },
      { id: "p2", label: "Situational Awareness",   sublabel: "Information interpretation",  value: 76 },
      { id: "p3", label: "Communication",            sublabel: "Communication handling",      value: 88 },
      { id: "p4", label: "Response Time",           sublabel: "Decision response timing",    value: 79 },
    ],

    timeline: [
      { time: "16:00", title: "Exercise Started",          detail: "Initial briefing completed.",                                    type: "system"   },
      { time: "16:12", title: "Communication Degraded",    detail: "Primary communication channel experienced delays.",              type: "warning"  },
      { time: "16:18", title: "Report 017 Received",       detail: "Alpha reported movement near Grid 24A.",                        type: "intel"    },
      { time: "16:21", title: "Conflicting Report",        detail: "Bravo reported no activity.",                                   type: "warning"  },
      { time: "16:27", title: "Map Update Delayed",        detail: "Updated map information became unavailable.",                   type: "warning"  },
      { time: "16:32", title: "Commander Decision",        detail: "Commander selected: REQUEST CONFIRMATION.",                     type: "decision" },
      { time: "16:40", title: "New Intelligence Received", detail: "Additional information became available.",                      type: "intel"    },
      { time: "16:45", title: "Exercise Completed",        detail: "Final decision submitted.",                                     type: "system"   },
    ],

    decision: {
      id: "DECISION 01",
      selected: "REQUEST CONFIRMATION",
      situation: "Conflicting reports were received from Alpha and Bravo.",
      rationale: "Additional confirmation was requested before changing the team's position.",
      outcome: "Additional information was received before the exercise concluded.",
    },

    commReview: {
      channels: [
        { name: "PRIMARY RADIO",      status: "DEGRADED" as const },
        { name: "SECONDARY CHANNEL",  status: "PENDING"  as const, label: "LIMITED" },
        { name: "DATA LINK",          status: "PENDING"  as const, label: "DELAYED" },
      ],
      log: [
        { time: "16:12", text: "Primary radio delay detected." },
        { time: "16:18", text: "Report transmission delayed." },
        { time: "16:27", text: "Map update delayed." },
        { time: "16:35", text: "Communication restored partially." },
      ],
    },

    keyEvents: [
      { icon: "radio",   title: "Communication Disruption", detail: "Primary communication became delayed." },
      { icon: "conflict",title: "Conflicting Information",  detail: "Two reports provided different observations." },
      { icon: "map",     title: "Delayed Map Update",       detail: "Updated map information was temporarily unavailable." },
      { icon: "intel",   title: "New Intelligence",         detail: "Additional information changed the available situation picture." },
    ],

    wentWell: [
      "Communication was monitored continuously.",
      "Conflicting reports were identified.",
      "The decision was based on available information.",
      "Team instructions remained clear.",
    ],
    toReview: [
      "Confirmation requests could be initiated earlier.",
      "Delayed information should be identified quickly.",
      "Communication fallback procedures should be considered.",
    ],

    nextFocus: [
      {
        title: "Communication Management",
        detail: "Practice decision-making when communication is delayed.",
        icon: "radio",
      },
      {
        title: "Information Validation",
        detail: "Practice handling conflicting reports.",
        icon: "conflict",
      },
      {
        title: "Time-Constrained Decisions",
        detail: "Practice selecting responses with incomplete information.",
        icon: "clock",
      },
    ],
  },
};

interface AARRecord {
  aarId: string;
  exerciseId: string;
  name: string;
  type: string;
  difficulty: string;
  completedDate: string;
  completedTime: string;
  duration: string;
  participants: number;
  commCondition: "DEGRADED" | "NORMAL" | "OFFLINE";
  role: string;
  performanceMetrics: { id: string; label: string; sublabel: string; value: number }[];
  timeline: { time: string; title: string; detail: string; type: string }[];
  decision: { id: string; selected: string; situation: string; rationale: string; outcome: string };
  commReview: {
    channels: { name: string; status: "DEGRADED" | "PENDING" | "NORMAL"; label?: string }[];
    log: { time: string; text: string }[];
  };
  keyEvents: { icon: string; title: string; detail: string }[];
  wentWell: string[];
  toReview: string[];
  nextFocus: { title: string; detail: string; icon: string }[];
}

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════ */

/* Circular metric gauge */
function MetricGauge({ value, label, sublabel }: { value: number; label: string; sublabel: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const colour = value >= 85 ? "#4A7A3A" : value >= 70 ? "#B69B63" : "#A94A3F";

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-24 h-24 mb-3">
        <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#EFE8D8" strokeWidth="8" />
          {/* Fill */}
          <circle
            cx="48" cy="48" r={radius}
            fill="none"
            stroke={colour}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-[#263229]">{value}</span>
          <span className="text-[9px] font-black text-[#A0A59E]">/ 100</span>
        </div>
      </div>
      <div className="text-xs font-black uppercase tracking-widest text-[#344438]">{label}</div>
      <div className="text-[10px] font-medium text-[#687066] mt-0.5">{sublabel}</div>
    </div>
  );
}

/* Timeline item */
function TimelineItem({
  item,
  isLast,
}: {
  item: AARRecord["timeline"][0];
  isLast: boolean;
}) {
  const dot =
    item.type === "system"   ? "bg-[#344438]" :
    item.type === "decision" ? "bg-[#4A7A3A]" :
    item.type === "intel"    ? "bg-[#B69B63]" :
    item.type === "warning"  ? "bg-[#A94A3F]" :
    "bg-[#71805A]";

  const titleClass =
    item.type === "decision"
      ? "text-sm font-black text-[#263229]"
      : "text-sm font-bold text-[#344438]";

  return (
    <div className="relative flex gap-4 pb-6">
      {/* Stem */}
      {!isLast && (
        <div className="absolute left-[15px] top-7 bottom-0 w-px bg-[#D9D8CE]" />
      )}
      {/* Dot */}
      <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full ${dot} flex items-center justify-center shadow-sm`}>
        <span className="text-[8px] font-black text-white font-mono">
          {item.time.slice(3)}
        </span>
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0 pt-1">
        <div className="text-[9px] font-mono font-bold tracking-widest text-[#B69B63] mb-0.5">{item.time}</div>
        <div className={titleClass}>{item.title}</div>
        <div className="text-xs font-medium text-[#687066] mt-0.5 leading-relaxed">{item.detail}</div>
        {item.type === "decision" && (
          <div className="mt-2 inline-flex items-center gap-1.5 bg-[#EFE8D8] border border-[#D8C7A5] rounded px-2.5 py-1 text-[10px] font-black tracking-widest text-[#344438]">
            <Target size={10} />
            REQUEST CONFIRMATION
          </div>
        )}
      </div>
    </div>
  );
}

/* Key event icon */
function EventIcon({ type }: { type: string }) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0";
  if (type === "radio")    return <div className={`${base} bg-[#FDF3E3]`}><Radio size={14} className="text-[#8A5C2A]" /></div>;
  if (type === "conflict") return <div className={`${base} bg-[#FAF0EF]`}><AlertTriangle size={14} className="text-[#A94A3F]" /></div>;
  if (type === "map")      return <div className={`${base} bg-[#F5F1E8]`}><FileText size={14} className="text-[#7A6B4A]" /></div>;
  return                          <div className={`${base} bg-[#EEF3E8]`}><Zap size={14} className="text-[#556B3F]" /></div>;
}

/* Focus icon */
function FocusIcon({ type }: { type: string }) {
  if (type === "radio")    return <Radio size={20} className="text-[#556B3F]" />;
  if (type === "conflict") return <AlertTriangle size={20} className="text-[#B69B63]" />;
  return <Clock size={20} className="text-[#71805A]" />;
}

/* Collapsible section toggle */
function SectionToggle({
  label,
  open,
  onToggle,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 text-[9px] font-black tracking-widest text-[#A0A59E] hover:text-[#687066] transition-colors"
    >
      {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      {open ? "COLLAPSE" : "EXPAND"}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AARPage({ params }: PageProps) {
  const { id } = use(params);
  const { addToast } = useToast();

  const aar =
    MOCK_AAR[id.toLowerCase() as keyof typeof MOCK_AAR] ?? MOCK_AAR["ex-001"];

  const [decisionOpen, setDecisionOpen]   = useState(true);
  const [commOpen,     setCommOpen]       = useState(true);
  const [focusOpen,    setFocusOpen]      = useState(true);

  function handleExport() {
    addToast({
      variant: "info",
      title: "Export not yet available.",
      message: "AAR report export will be available after system integration.",
    });
  }

  return (
    <AppShell pageTitle={`AAR — ${aar.exerciseId}`} role="instructor">

      {/* ── PAGE HEADER ── */}
      <PageHeader
        label="AFTER ACTION REVIEW"
        title={aar.name}
        description={`${aar.exerciseId} • ${aar.type} • Completed ${aar.completedDate} at ${aar.completedTime}`}
        action={
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-2">
              <StatusBadge status="READY" label="COMPLETED" />
              <span className="text-[9px] font-black tracking-widest text-[#687066]">
                {aar.aarId} — TRAINING CYCLE 04
              </span>
            </div>
            <Link href="/instructor/scenarios">
              <SecondaryButton size="sm" icon={<ArrowLeft size={14} />}>
                BACK TO EXERCISES
              </SecondaryButton>
            </Link>
            <PrimaryButton size="sm" icon={<Download size={14} />} onClick={handleExport}>
              EXPORT REPORT
            </PrimaryButton>
          </div>
        }
      />

      <div className="mt-8 flex flex-col gap-6">

        {/* ══════════════════════════════════════════════
            1. EXERCISE SUMMARY
        ══════════════════════════════════════════════ */}
        <PanelCard
          accent="olive"
          header={
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[#556B3F]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Exercise Summary</h2>
              <span className="ml-auto text-[9px] font-mono font-bold text-[#A0A59E]">
                REVIEW STATUS: COMPLETE
              </span>
            </div>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { label: "DURATION",       value: aar.duration },
              { label: "PARTICIPANTS",   value: `0${aar.participants}` },
              { label: "TRAINING TYPE",  value: aar.type },
              { label: "DIFFICULTY",     value: aar.difficulty },
              { label: "COMMUNICATION",  badge: aar.commCondition },
              { label: "FINAL STATUS",   badge: "READY" as const, badgeLabel: "COMPLETED" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E]">
                  {item.label}
                </div>
                {item.badge ? (
                  <StatusBadge
                    status={item.badge as "DEGRADED" | "READY"}
                    label={item.badgeLabel}
                    showDot={false}
                  />
                ) : (
                  <div className="text-base font-black text-[#344438] font-mono">{item.value}</div>
                )}
              </div>
            ))}
          </div>
          {/* Scenario label */}
          <div className="mt-5 pt-5 border-t border-[#D9D8CE] flex items-center gap-3">
            <div className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E]">SCENARIO</div>
            <div className="text-sm font-black text-[#263229]">{aar.name}</div>
            <div className="ml-auto text-[9px] font-mono font-bold text-[#A0A59E]">
              {aar.exerciseId} — OPERATION SILENT LINK
            </div>
          </div>
        </PanelCard>

        {/* ══════════════════════════════════════════════
            2. PERFORMANCE OVERVIEW — gauge cards
        ══════════════════════════════════════════════ */}
        <PanelCard
          header={
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-[#344438]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Performance Overview</h2>
              <span className="ml-auto text-[9px] font-mono font-bold text-[#A0A59E]">MOCK DEMO VALUES ONLY</span>
            </div>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {aar.performanceMetrics.map((m) => (
              <MetricGauge key={m.id} value={m.value} label={m.label} sublabel={m.sublabel} />
            ))}
          </div>
          {/* Disclaimer */}
          <div className="mt-6 pt-4 border-t border-[#D9D8CE]">
            <p className="text-[10px] font-medium text-[#A0A59E] leading-relaxed">
              These indicators are demo values for training purposes only. They do not represent a formal assessment or ranking of any individual.
            </p>
          </div>
        </PanelCard>

        {/* ══════════════════════════════════════════════
            3. EXERCISE TIMELINE (full width)
        ══════════════════════════════════════════════ */}
        <PanelCard
          header={
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[#344438]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Exercise Timeline</h2>
              {/* Legend */}
              <div className="ml-auto hidden sm:flex items-center gap-4 text-[9px] font-mono font-bold text-[#687066]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#344438] inline-block" />System</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#4A7A3A] inline-block" />Decision</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#B69B63] inline-block" />Intel</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#A94A3F] inline-block" />Warning</span>
              </div>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            {aar.timeline.map((item, i) => (
              <TimelineItem key={i} item={item} isLast={i === aar.timeline.length - 1} />
            ))}
          </div>
        </PanelCard>

        {/* ══════════════════════════════════════════════
            4. DECISION REVIEW | COMMUNICATION REVIEW
        ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* DECISION REVIEW */}
          <PanelCard
            accent="olive"
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-[#556B3F]" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Decision Review</h2>
                </div>
                <SectionToggle label="" open={decisionOpen} onToggle={() => setDecisionOpen((p) => !p)} />
              </div>
            }
          >
            {decisionOpen && (
              <div className="space-y-5">
                {/* Decision ID + Selection */}
                <div className="bg-[#F7F5EE] rounded-xl border border-[#D9D8CE] p-5">
                  <div className="text-[9px] font-black tracking-widest text-[#B69B63] mb-2">{aar.decision.id}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E] mb-1">SELECTED RESPONSE</div>
                  <div className="inline-flex items-center gap-2 bg-[#EFE8D8] border border-[#D8C7A5] rounded px-3 py-2 text-sm font-black tracking-widest text-[#344438]">
                    <Target size={13} />
                    {aar.decision.selected}
                  </div>
                </div>

                {[
                  { label: "SITUATION",  text: aar.decision.situation  },
                  { label: "RATIONALE",  text: aar.decision.rationale  },
                  { label: "OUTCOME",    text: aar.decision.outcome    },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E] mb-1.5">{row.label}</div>
                    <p className="text-sm font-medium text-[#263229] leading-relaxed border-l-2 border-[#D9D8CE] pl-3">
                      {row.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </PanelCard>

          {/* COMMUNICATION REVIEW */}
          <PanelCard
            accent="brass"
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio size={14} className="text-[#B69B63]" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Communication Review</h2>
                </div>
                <SectionToggle label="" open={commOpen} onToggle={() => setCommOpen((p) => !p)} />
              </div>
            }
            noPadding
          >
            {commOpen && (
              <>
                {/* Channel status */}
                <div className="divide-y divide-[#D9D8CE]">
                  {aar.commReview.channels.map((ch, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Radio size={12} className="text-[#687066]" />
                        <span className="text-[10px] font-black tracking-widest text-[#344438]">{ch.name}</span>
                      </div>
                      <StatusBadge status={ch.status} label={ch.label} showDot={false} />
                    </div>
                  ))}
                </div>

                {/* Comm log */}
                <div className="p-6 border-t border-[#D9D8CE]">
                  <div className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E] mb-3">Communication Log</div>
                  <div className="space-y-3">
                    {aar.commReview.log.map((entry, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="text-[9px] font-mono font-bold text-[#B69B63] w-10 flex-shrink-0">{entry.time}</span>
                        <p className="text-xs font-medium text-[#263229] leading-relaxed">{entry.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </PanelCard>
        </div>

        {/* ══════════════════════════════════════════════
            5. KEY EVENTS (full width)
        ══════════════════════════════════════════════ */}
        <PanelCard
          header={
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-[#344438]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Key Events</h2>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {aar.keyEvents.map((ev, i) => (
              <div
                key={i}
                className="bg-[#F7F5EE] border border-[#D9D8CE] rounded-xl p-5 flex flex-col gap-3 hover:border-[#B69B63] transition-colors"
              >
                <EventIcon type={ev.icon} />
                <div className="text-sm font-black text-[#344438]">{ev.title}</div>
                <p className="text-xs font-medium text-[#687066] leading-relaxed">{ev.detail}</p>
              </div>
            ))}
          </div>
        </PanelCard>

        {/* ══════════════════════════════════════════════
            6. TRAINING OBSERVATIONS — WHAT WENT WELL | AREAS TO REVIEW
        ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* WHAT WENT WELL */}
          <PanelCard
            accent="olive"
            header={
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#4A7A3A]" />
                <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">What Went Well</h2>
              </div>
            }
          >
            <ul className="space-y-4">
              {aar.wentWell.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#EBF4E8] border border-[#C4DAC0] flex-shrink-0 flex items-center justify-center mt-0.5">
                    <CheckCircle2 size={11} className="text-[#4A7A3A]" />
                  </span>
                  <span className="text-sm font-medium text-[#263229] leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[9px] font-medium text-[#A0A59E] border-t border-[#D9D8CE] pt-4">
              These are training observations for discussion purposes only.
            </p>
          </PanelCard>

          {/* AREAS TO REVIEW */}
          <PanelCard
            accent="brass"
            header={
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-[#8A5C2A]" />
                <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Areas to Review</h2>
              </div>
            }
          >
            <ul className="space-y-4">
              {aar.toReview.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#FDF3E3] border border-[#E8D4B0] flex-shrink-0 flex items-center justify-center mt-0.5">
                    <AlertTriangle size={11} className="text-[#8A5C2A]" />
                  </span>
                  <span className="text-sm font-medium text-[#263229] leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[9px] font-medium text-[#A0A59E] border-t border-[#D9D8CE] pt-4">
              These are fictional demo observations and do not represent actual performance conclusions.
            </p>
          </PanelCard>
        </div>

        {/* ══════════════════════════════════════════════
            7. NEXT TRAINING FOCUS
        ══════════════════════════════════════════════ */}
        <PanelCard
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#344438]" />
                <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Recommended Training Focus</h2>
              </div>
              <SectionToggle label="" open={focusOpen} onToggle={() => setFocusOpen((p) => !p)} />
            </div>
          }
        >
          {focusOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {aar.nextFocus.map((focus, i) => (
                <div
                  key={i}
                  className="bg-[#F7F5EE] border border-[#D9D8CE] rounded-xl p-6 flex flex-col gap-4 hover:border-[#556B3F] hover:bg-[#EFE8D8] transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#EEF3E8] border border-[#D9D8CE] flex items-center justify-center group-hover:bg-white transition-colors">
                    <FocusIcon type={focus.icon} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-[#344438] mb-1.5">{focus.title}</div>
                    <p className="text-xs font-medium text-[#687066] leading-relaxed">{focus.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PanelCard>

        {/* ══════════════════════════════════════════════
            8. INSTRUCTOR NOTES (role-aware — visible to instructor only)
        ══════════════════════════════════════════════ */}
        <PanelCard
          header={
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-[#344438]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Instructor Notes</h2>
              <span className="ml-auto flex items-center gap-1.5 text-[9px] font-black tracking-widest text-[#A0A59E]">
                <Users size={10} />
                INSTRUCTOR VIEW ONLY — NOT SHARED WITH TRAINEES
              </span>
            </div>
          }
        >
          <textarea
            rows={4}
            placeholder="Add debrief notes here. Use this section to record key discussion points for the team debrief session. These notes are not visible to trainees..."
            className="w-full bg-[#F7F5EE] border border-[#D9D8CE] rounded-xl px-4 py-3.5 text-sm font-medium text-[#263229] placeholder:text-[#A0A59E] focus:outline-none focus:border-[#556B3F] focus:bg-white transition-colors resize-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-[#A0A59E]">
              {aar.exerciseId} — {aar.aarId} — TRAINING CYCLE 04
            </span>
            <SecondaryButton size="sm" icon={<FileText size={13} />}>
              SAVE NOTES
            </SecondaryButton>
          </div>
        </PanelCard>

        {/* ── Footer metadata strip ── */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-[9px] font-mono font-bold tracking-widest text-[#A0A59E] pb-4">
          <span>{aar.aarId} — {aar.exerciseId} — OPERATION SILENT LINK</span>
          <span>TRAINING CYCLE 04 — REVIEW STATUS: COMPLETE — ROLE: {aar.role}</span>
        </div>

      </div>
    </AppShell>
  );
}
