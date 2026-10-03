"use client";

import React, { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PanelCard } from "@/components/ui/PanelCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { TeamMapPlaceholder } from "@/components/simulation/TeamMapPlaceholder";
import { TrainingExampleNotice } from "@/components/integration/TrainingExampleNotice";
import {
  Clock,
  Radio,
  Send,
  CheckCircle2,
  AlertTriangle,
  Eye,
  MapPin,
  Users,
  Shield,
  ClipboardList,
  FileText,
  ChevronRight,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface CommMessage {
  id: number;
  time: string;
  sender: string;
  text: string;
  type: "command" | "team" | "system";
}

interface Task {
  id: string;
  title: string;
  detail: string;
  status: "IN PROGRESS" | "PENDING" | "COMPLETED";
}

interface RecentReport {
  id: string;
  time: string;
  type: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  text: string;
}

/* ─────────────────────────────────────────────
   Initial mock data
───────────────────────────────────────────── */
const INIT_MESSAGES: CommMessage[] = [
  { id: 1, time: "16:32", sender: "COMMAND", text: "Maintain position at Grid 24A.", type: "command" },
  { id: 2, time: "16:34", sender: "BRAVO",   text: "Position confirmed. Grid 24A.", type: "team" },
  { id: 3, time: "16:36", sender: "COMMAND", text: "Report any verified movement.", type: "command" },
  { id: 4, time: "16:38", sender: "SYSTEM",  text: "Transmission delay detected.", type: "system" },
];

const INIT_TASKS: Task[] = [
  { id: "T1", title: "Monitor Grid 24A", detail: "Maintain continuous visual observation of assigned sector.", status: "IN PROGRESS" },
  { id: "T2", title: "Maintain Communication", detail: "Conduct comms check every 15 minutes on primary channel.", status: "IN PROGRESS" },
  { id: "T3", title: "Report Verified Activity", detail: "Submit verified observations to command on primary net.", status: "PENDING" },
];

const OBS_TYPES = ["Movement", "No Activity", "Communication Issue", "Environmental Change", "Other"] as const;
type ObsType = typeof OBS_TYPES[number];

const CONFIDENCE_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
type Confidence = typeof CONFIDENCE_LEVELS[number];

function getHHMM(): string {
  return new Date().toTimeString().slice(0, 5);
}

/* ─────────────────────────────────────────────
   Status colour helpers
───────────────────────────────────────────── */
function taskStatusClass(s: Task["status"]) {
  if (s === "COMPLETED")  return "text-[#4A7A3A] bg-[#EBF4E8] border-[#C4DAC0]";
  if (s === "IN PROGRESS") return "text-[#8A5C2A] bg-[#FDF3E3] border-[#E8D4B0]";
  return "text-[#687066] bg-[#F5F1E8] border-[#D9D8CE]";
}

function confidenceDot(c: Confidence) {
  if (c === "HIGH")   return "bg-[#4A7A3A]";
  if (c === "MEDIUM") return "bg-[#B87A3A]";
  return "bg-[#A0A59E]";
}

/* ─────────────────────────────────────────────
   Timer hook
───────────────────────────────────────────── */
function useCountdown(initialSeconds: number) {
  const [secs, setSecs] = useState(initialSeconds);
  useEffect(() => {
    const t = setInterval(() => setSecs((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function TeamPage() {
  const { addToast } = useToast();
  const remaining = useCountdown(18 * 60 + 42);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ── Order state ── */
  const [orderAcknowledged, setOrderAcknowledged] = useState(false);

  /* ── Comms state ── */
  const [messages, setMessages] = useState<CommMessage[]>(INIT_MESSAGES);
  const [chatInput, setChatInput] = useState("");

  /* ── Task state ── */
  const [tasks, setTasks] = useState<Task[]>(INIT_TASKS);

  /* ── Observation form state ── */
  const [obsType, setObsType] = useState<ObsType>("Movement");
  const [obsText, setObsText] = useState("");
  const [confidence, setConfidence] = useState<Confidence>("MEDIUM");
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [reportCount, setReportCount] = useState(18);

  /* Scroll comms to bottom on new message */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Handlers ── */
  function handleAcknowledgeOrder() {
    setOrderAcknowledged(true);
    addToast({ variant: "success", title: "Order acknowledged.", message: "ORDER 017 — confirmation sent to Command." });
  }

  function handleSendReport() {
    if (!chatInput.trim()) return;
    const next: CommMessage = {
      id: Date.now(),
      time: getHHMM(),
      sender: "BRAVO",
      text: chatInput.trim(),
      type: "team",
    };
    setMessages((p) => [...p, next]);
    setChatInput("");
    addToast({ variant: "success", title: "Report transmitted.", message: "Message sent on primary channel." });
  }

  function handleSubmitObservation() {
    if (!obsText.trim()) {
      addToast({ variant: "warning", title: "Observation required.", message: "Please describe what you observed." });
      return;
    }
    const newCount = reportCount + 1;
    setReportCount(newCount);
    const report: RecentReport = {
      id: `RPT-0${newCount}`,
      time: getHHMM(),
      type: obsType,
      confidence,
      text: obsText.trim(),
    };
    setRecentReports((p) => [report, ...p]);
    setObsText("");
    setConfidence("MEDIUM");
    addToast({ variant: "success", title: "Observation submitted to command.", message: `${obsType} — Confidence: ${confidence}` });
  }

  function handleCompleteTask(id: string) {
    setTasks((p) => p.map((t) => t.id === id ? { ...t, status: "COMPLETED" } : t));
    addToast({ variant: "success", title: "Task marked complete." });
  }

  return (
    <AppShell pageTitle="TEAM OPERATIONS" role="team">
      <TrainingExampleNotice />

      {/* ═══════════════════════════════════════════
          PAGE HEADER — custom (not PageHeader component)
      ═══════════════════════════════════════════ */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Left */}
          <div>
            <div className="text-[10px] font-black tracking-[0.25em] uppercase text-[#71805A] mb-1">
              TEAM OPERATIONS
            </div>
            <h1 className="text-2xl font-black text-[#263229] tracking-tight leading-tight">
              Operation Silent Link
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-sm font-bold text-[#687066]">Team Bravo</span>
              <span className="text-[#D9D8CE]">•</span>
              <span className="text-sm font-mono font-bold text-[#71805A]">EX-001</span>
              <span className="text-[#D9D8CE]">•</span>
              <span className="text-sm font-mono font-bold text-[#71805A]">GRID 24A</span>
            </div>
          </div>

          {/* Right — status strip */}
          <div className="flex items-center gap-3 flex-wrap sm:justify-end">
            <div className="flex items-center gap-2 bg-[#EBF4E8] border border-[#C4DAC0] rounded-lg px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-[#4A7A3A] animate-pulse" />
              <span className="text-[10px] font-black tracking-widest text-[#3A6B30]">EXERCISE ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 bg-[#F5F1E8] border border-[#D9D8CE] rounded-lg px-3 py-2">
              <Clock size={12} className="text-[#B69B63]" />
              <span className="text-[10px] font-black tracking-widest text-[#344438]">
                {remaining} REMAINING
              </span>
            </div>
            <div className="flex items-center gap-2 bg-[#FDF3E3] border border-[#E8D4B0] rounded-lg px-3 py-2">
              <Radio size={12} className="text-[#8A5C2A]" />
              <span className="text-[10px] font-black tracking-widest text-[#8A5C2A]">COMMS: DEGRADED</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── COMM STATUS ALERT BANNER ─── */}
      <div className="mb-6 bg-[#FDF3E3] border border-[#E8D4B0] rounded-xl px-5 py-3 flex items-start gap-3">
        <AlertTriangle size={15} className="text-[#8A5C2A] flex-shrink-0 mt-0.5" />
        <div>
          <span className="text-[10px] font-black tracking-widest text-[#8A5C2A] uppercase">Communication Status — Degraded</span>
          <p className="text-xs font-medium text-[#7A6040] mt-0.5">
            Messages may be delayed. Confirm important instructions when possible.
          </p>
        </div>
        <StatusBadge status="DEGRADED" showDot={false} className="ml-auto flex-shrink-0" />
      </div>

      {/* ═══════════════════════════════════════════
          ROW 1 — Mission Overview | Current Situation
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* MISSION OVERVIEW */}
        <PanelCard
          accent="olive"
          header={
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-[#556B3F]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Mission Overview</h2>
            </div>
          }
        >
          <div className="mb-5">
            <div className="text-[9px] font-black uppercase tracking-widest text-[#71805A] mb-2">Current Objective</div>
            <p className="text-sm font-medium text-[#263229] leading-relaxed bg-[#F7F5EE] border border-[#D9D8CE] rounded-lg p-4">
              Maintain observation of the assigned area and report verified information to command.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {[
              { label: "ASSIGNED GRID", value: "24A" },
              { label: "TEAM",          value: "BRAVO" },
              { label: "TEAM LEAD",     value: "BRAVO-01" },
              { label: "TRAINING CYCLE",value: "CYCLE 04" },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E] mb-1">{item.label}</div>
                <div className="text-sm font-black text-[#344438] font-mono">{item.value}</div>
              </div>
            ))}
            <div className="col-span-2">
              <div className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E] mb-1">CURRENT STATUS</div>
              <StatusBadge status="ACTIVE" />
            </div>
          </div>
        </PanelCard>

        {/* CURRENT SITUATION */}
        <PanelCard
          header={
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-[#344438]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Current Situation</h2>
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "COMMUNICATION", status: "DEGRADED" as const },
              { label: "MAP DATA",      status: "PENDING"  as const, label2: "DELAYED" },
              { label: "VISIBILITY",    status: "NORMAL"   as const },
              { label: "TEAM STATUS",   status: "READY"    as const },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-[#F7F5EE] border border-[#D9D8CE] rounded-xl p-4 flex flex-col gap-2"
              >
                <div className="text-[9px] font-black uppercase tracking-widest text-[#A0A59E]">
                  {item.label}
                </div>
                <StatusBadge
                  status={item.status}
                  label={(item as { label2?: string }).label2}
                  showDot={false}
                />
              </div>
            ))}
          </div>
        </PanelCard>
      </div>

      {/* ═══════════════════════════════════════════
          ROW 2 — Current Orders | Team Map
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* CURRENT ORDERS */}
        <PanelCard
          accent="brass"
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList size={14} className="text-[#B69B63]" />
                <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Current Orders</h2>
              </div>
              {!orderAcknowledged && (
                <span className="flex items-center gap-1.5 text-[9px] font-black tracking-widest text-[#A94A3F]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A94A3F] animate-pulse" />
                  ACTION REQUIRED
                </span>
              )}
            </div>
          }
        >
          {/* Order card */}
          <div className={`rounded-xl border-2 p-5 transition-all ${orderAcknowledged ? "border-[#C4DAC0] bg-[#F5FBF4]" : "border-[#E8D4B0] bg-[#FEFAF4]"}`}>
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div>
                <div className="text-[9px] font-black tracking-widest text-[#B69B63] mb-1">ORDER 017</div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-[#687066] flex items-center gap-1">
                    <Clock size={10} />16:32
                  </span>
                  <span className="text-[10px] font-black tracking-widest text-[#71805A]">FROM: COMMAND</span>
                </div>
              </div>
              {orderAcknowledged ? (
                <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-[#4A7A3A]">
                  <CheckCircle2 size={14} />
                  ACKNOWLEDGED
                </div>
              ) : (
                <span className="text-[9px] font-black tracking-widest text-[#8A5C2A] bg-[#FDF3E3] border border-[#E8D4B0] px-2 py-1 rounded">
                  PENDING
                </span>
              )}
            </div>

            <p className="text-sm font-bold text-[#263229] leading-relaxed mb-5 border-l-2 border-[#B69B63] pl-3">
              &ldquo;Maintain position at Grid 24A and report any confirmed movement.&rdquo;
            </p>

            {!orderAcknowledged && (
              <PrimaryButton
                onClick={handleAcknowledgeOrder}
                icon={<CheckCircle2 size={15} />}
                fullWidth
              >
                ACKNOWLEDGE ORDER
              </PrimaryButton>
            )}
          </div>

          {/* Meta */}
          <div className="mt-4 flex items-center gap-4 text-[9px] font-mono font-bold tracking-widest text-[#A0A59E]">
            <span>CHANNEL: PRIMARY</span>
            <span>•</span>
            <span>EX-001</span>
            <span>•</span>
            <span>TRAINING CYCLE 04</span>
          </div>
        </PanelCard>

        {/* TEAM MAP */}
        <PanelCard
          header={
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[#344438]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Team Map</h2>
              <span className="ml-auto text-[9px] font-mono font-bold tracking-widest text-[#A0A59E]">
                GRID 24A — ASSIGNED AREA
              </span>
            </div>
          }
          noPadding
          className="overflow-hidden"
        >
          <div className="p-4 h-[300px]">
            <TeamMapPlaceholder />
          </div>
        </PanelCard>
      </div>

      {/* ═══════════════════════════════════════════
          ROW 3 — COMMAND CHANNEL (full width)
      ═══════════════════════════════════════════ */}
      <div className="mb-6">
        <PanelCard
          noPadding
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-[#344438]" />
                <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Command Channel</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono font-bold text-[#687066]">PRIMARY CHANNEL</span>
                <StatusBadge status="DEGRADED" showDot={false} />
              </div>
            </div>
          }
        >
          {/* Message feed */}
          <div className="h-52 overflow-y-auto p-5 space-y-4 bg-[#FAFAF8]">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div className="flex-shrink-0 w-14 text-right">
                  <span className="text-[9px] font-mono font-bold text-[#B69B63]">{msg.time}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-[10px] font-black tracking-widest mr-2 ${
                    msg.type === "command" ? "text-[#344438]" :
                    msg.type === "team"    ? "text-[#556B3F]" :
                                             "text-[#A94A3F]"
                  }`}>
                    {msg.sender}
                  </span>
                  <span className={`text-sm font-medium ${
                    msg.type === "system"
                      ? "text-[#A94A3F] italic text-xs font-mono"
                      : "text-[#263229]"
                  }`}>
                    {msg.type === "system" ? msg.text : `"${msg.text}"`}
                  </span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input row */}
          <div className="border-t border-[#D9D8CE] p-4 flex gap-3 bg-white">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendReport()}
              placeholder="Enter observation or report..."
              className="flex-1 bg-[#F7F5EE] border border-[#D9D8CE] rounded-lg px-4 py-2.5 text-sm font-medium text-[#263229] placeholder:text-[#A0A59E] focus:outline-none focus:border-[#556B3F] focus:bg-white transition-colors font-mono"
            />
            <PrimaryButton
              onClick={handleSendReport}
              icon={<Send size={14} />}
              disabled={!chatInput.trim()}
            >
              SEND REPORT
            </PrimaryButton>
          </div>
        </PanelCard>
      </div>

      {/* ═══════════════════════════════════════════
          ROW 4 — Report Observation | Assigned Tasks
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* REPORT OBSERVATION */}
        <PanelCard
          accent="olive"
          header={
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[#556B3F]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Report Observation</h2>
            </div>
          }
        >
          <p className="text-xs font-medium text-[#687066] mb-5">
            Submit a field observation to the command channel.
          </p>

          {/* Observation Type */}
          <div className="mb-4">
            <label className="block text-[9px] font-black uppercase tracking-widest text-[#687066] mb-2">
              Observation Type
            </label>
            <div className="flex flex-wrap gap-2">
              {OBS_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setObsType(t)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide border transition-all ${
                    obsType === t
                      ? "bg-[#344438] text-white border-[#263229]"
                      : "bg-[#F7F5EE] text-[#687066] border-[#D9D8CE] hover:border-[#556B3F] hover:text-[#344438]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Observation text */}
          <div className="mb-4">
            <label className="block text-[9px] font-black uppercase tracking-widest text-[#687066] mb-2">
              Observation
            </label>
            <textarea
              rows={3}
              value={obsText}
              onChange={(e) => setObsText(e.target.value)}
              placeholder="Describe what you observed..."
              className="w-full bg-[#F7F5EE] border border-[#D9D8CE] rounded-lg px-4 py-3 text-sm font-medium text-[#263229] placeholder:text-[#A0A59E] focus:outline-none focus:border-[#556B3F] focus:bg-white transition-colors resize-none font-mono"
            />
          </div>

          {/* Confidence */}
          <div className="mb-5">
            <label className="block text-[9px] font-black uppercase tracking-widest text-[#687066] mb-2">
              Confidence
            </label>
            <div className="flex gap-2">
              {CONFIDENCE_LEVELS.map((c) => (
                <button
                  key={c}
                  onClick={() => setConfidence(c)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest border transition-all ${
                    confidence === c
                      ? c === "HIGH"
                        ? "bg-[#EBF4E8] text-[#3A6B30] border-[#4A7A3A]"
                        : c === "MEDIUM"
                        ? "bg-[#FDF3E3] text-[#8A5C2A] border-[#B87A3A]"
                        : "bg-[#F5F1E8] text-[#687066] border-[#A0A59E]"
                      : "bg-[#F7F5EE] text-[#A0A59E] border-[#D9D8CE] hover:border-[#A0A59E]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <PrimaryButton
            onClick={handleSubmitObservation}
            icon={<ChevronRight size={15} />}
            fullWidth
          >
            SUBMIT OBSERVATION
          </PrimaryButton>
        </PanelCard>

        {/* ASSIGNED TASKS */}
        <PanelCard
          header={
            <div className="flex items-center gap-2">
              <ClipboardList size={14} className="text-[#344438]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Assigned Tasks</h2>
            </div>
          }
          noPadding
        >
          <div className="divide-y divide-[#D9D8CE]">
            {tasks.map((task) => (
              <div key={task.id} className="p-5 flex items-start justify-between gap-4 hover:bg-[#F7F5EE]/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded border ${taskStatusClass(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  <div className="text-sm font-black text-[#263229] mb-1">{task.title}</div>
                  <div className="text-xs font-medium text-[#687066] leading-snug">{task.detail}</div>
                </div>
                {task.status !== "COMPLETED" && (
                  <SecondaryButton
                    size="sm"
                    icon={<CheckCircle2 size={13} />}
                    onClick={() => handleCompleteTask(task.id)}
                    className="flex-shrink-0"
                  >
                    COMPLETE
                  </SecondaryButton>
                )}
                {task.status === "COMPLETED" && (
                  <CheckCircle2 size={18} className="text-[#4A7A3A] flex-shrink-0 mt-1" />
                )}
              </div>
            ))}
          </div>
        </PanelCard>
      </div>

      {/* ═══════════════════════════════════════════
          ROW 5 — Recent Reports | Team Status
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* RECENT REPORTS */}
        <PanelCard
          header={
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[#344438]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Recent Reports</h2>
            </div>
          }
          noPadding
        >
          {recentReports.length === 0 ? (
            <div className="p-8 text-center">
              <FileText size={24} className="text-[#D9D8CE] mx-auto mb-2" />
              <p className="text-xs font-medium text-[#A0A59E]">No reports submitted yet.</p>
              <p className="text-xs font-medium text-[#A0A59E]">Use the form above to submit a field observation.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#D9D8CE] max-h-64 overflow-y-auto">
              {recentReports.map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <span className="text-[9px] font-mono font-bold text-[#B69B63]">{r.time}</span>
                    <span className="text-[9px] font-black tracking-widest text-[#71805A]">{r.id}</span>
                    <span className="text-[9px] font-black tracking-widest text-[#687066]">{r.type}</span>
                    <div className="flex items-center gap-1 ml-auto">
                      <span className={`w-2 h-2 rounded-full ${confidenceDot(r.confidence)}`} />
                      <span className="text-[9px] font-black tracking-widest text-[#687066]">{r.confidence}</span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-[#263229] leading-relaxed font-mono">{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </PanelCard>

        {/* TEAM STATUS */}
        <PanelCard
          header={
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[#344438]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-[#263229]">Team Status</h2>
              <span className="ml-auto text-[9px] font-mono font-bold text-[#A0A59E]">BRAVO ELEMENT</span>
            </div>
          }
        >
          <div className="space-y-3">
            {[
              { call: "BRAVO-01", role: "Team Lead",  status: "READY"  as const, initials: "B1" },
              { call: "BRAVO-02", role: "Observer",   status: "READY"  as const, initials: "B2" },
              { call: "BRAVO-03", role: "Observer",   status: "ACTIVE" as const, initials: "B3" },
              { call: "BRAVO-04", role: "Support",    status: "ACTIVE" as const, initials: "B4" },
            ].map((member) => (
              <div
                key={member.call}
                className="flex items-center gap-4 p-3 rounded-xl bg-[#F7F5EE] border border-[#D9D8CE]"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-[#344438] flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-black text-white tracking-wider">{member.initials}</span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-[#263229]">{member.call}</div>
                  <div className="text-[10px] font-medium text-[#687066]">{member.role}</div>
                </div>
                {/* Status */}
                <StatusBadge status={member.status} showDot />
              </div>
            ))}
          </div>

          {/* Channel info */}
          <div className="mt-4 pt-4 border-t border-[#D9D8CE] flex items-center gap-2 text-[9px] font-mono font-bold tracking-widest text-[#A0A59E]">
            <Radio size={10} />
            <span>PRIMARY NET — FREQ 4.625 MHz — NEXT COMMS: 16:50</span>
          </div>
        </PanelCard>
      </div>

    </AppShell>
  );
}
