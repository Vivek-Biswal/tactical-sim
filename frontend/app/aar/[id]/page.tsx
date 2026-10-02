"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { fetchAARReport } from "@/lib/api";
import { AARReportData, SimulationEventLog } from "@/types/exercise";
import { AARTimeline } from "@/components/aar/AARTimeline";
import { AARDecisionReview } from "@/components/aar/AARDecisionReview";
import { AARCommsReview } from "@/components/aar/AARCommsReview";
import { AARConflictReview } from "@/components/aar/AARConflictReview";
import { AARMapReplay } from "@/components/aar/AARMapReplay";
import { AARSummary } from "@/components/aar/AARSummary";
import {
  Shield, FileText, Compass, ArrowLeft, Clock,
  CheckCircle2, Radio, AlertTriangle, Map, Download,
  BarChart2, Info, X
} from "lucide-react";

type ActiveTab = "timeline" | "decisions" | "comms" | "conflicts" | "map" | "summary";

const TABS: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { key: "timeline",  label: "TIMELINE",      icon: <Clock className="w-3.5 h-3.5" /> },
  { key: "decisions", label: "DECISIONS",     icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { key: "comms",     label: "COMMS REVIEW",  icon: <Radio className="w-3.5 h-3.5" /> },
  { key: "conflicts", label: "INTEL CONFLICTS", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { key: "map",       label: "MAP REPLAY",    icon: <Map className="w-3.5 h-3.5" /> },
  { key: "summary",   label: "FINDINGS",      icon: <BarChart2 className="w-3.5 h-3.5" /> },
];

export default function AfterActionReviewPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const exerciseId = unwrappedParams.id;

  const [aar, setAar] = useState<AARReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("timeline");
  const [selectedEvent, setSelectedEvent] = useState<SimulationEventLog | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAARReport(exerciseId);
        setAar(data);
      } catch (e) {
        console.error("Failed to load AAR:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [exerciseId]);

  const handleExportJSON = () => {
    if (!aar) return;
    const blob = new Blob([JSON.stringify(aar, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aar-${aar.exerciseId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !aar) {
    return (
      <div className="min-h-screen bg-[#070a11] text-slate-100 font-mono flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Compiling After Action Review for {exerciseId}...</p>
        </div>
      </div>
    );
  }

  // Derive conflicting message count
  const conflictGroups = new Set(
    aar.messages.filter(m => m.isConflicting && m.conflictGroupId).map(m => m.conflictGroupId)
  );

  const eventLog = aar.fullEventLog ?? aar.commsTimeline.map((e, i) => ({
    id: String(i),
    ...e,
    payload: undefined
  }));

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 font-mono flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-1.5 text-slate-400 hover:text-cyan-400 transition text-xs">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Launchpad</span>
          </Link>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-sm text-slate-200">AFTER ACTION REVIEW //</span>
            <span className="text-cyan-400 font-bold text-xs">{aar.exerciseId}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={handleExportJSON}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT JSON</span>
          </button>
          <Link
            href={`/commander/simulation/${exerciseId}`}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 rounded font-bold transition"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>RE-ENTER SIM</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Title Banner */}
        <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-[10px] mb-1 uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            <span>Tactical Post-Exercise Analysis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 mb-3">
            {aar.scenarioName}
          </h1>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-500 text-[9px] uppercase mb-0.5">Unit</div>
              <div className="font-bold text-slate-200">{aar.teamName}</div>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-500 text-[9px] uppercase mb-0.5">Duration</div>
              <div className="font-bold text-cyan-400">{aar.stats.duration}</div>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-500 text-[9px] uppercase mb-0.5">Messages</div>
              <div className="font-bold text-slate-200">
                <span className="text-emerald-400">{aar.stats.messagesDelivered}</span>
                <span className="text-slate-600 mx-1">/</span>
                {aar.stats.messagesTotal} total
              </div>
              {aar.stats.messagesDropped > 0 && (
                <div className="text-rose-400 text-[10px]">{aar.stats.messagesDropped} dropped</div>
              )}
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-500 text-[9px] uppercase mb-0.5">Decisions</div>
              <div className="font-bold text-slate-200">{aar.stats.decisionsCount}</div>
              {conflictGroups.size > 0 && (
                <div className="text-yellow-400 text-[10px]">{conflictGroups.size} conflict{conflictGroups.size !== 1 ? "s" : ""}</div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap border-b border-slate-800 bg-slate-900/40 rounded-t-lg">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center space-x-1.5 py-2.5 px-3 text-[11px] font-bold border-b-2 transition ${
                activeTab === tab.key
                  ? "border-cyan-400 text-cyan-300 bg-slate-900/80"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.key === "conflicts" && conflictGroups.size > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-yellow-950 border border-yellow-800 text-yellow-400 text-[9px]">
                  {conflictGroups.size}
                </span>
              )}
              {tab.key === "decisions" && aar.stats.decisionsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[9px]">
                  {aar.stats.decisionsCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">

          {/* TIMELINE */}
          {activeTab === "timeline" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-lg p-4">
                <h2 className="font-bold text-slate-200 flex items-center space-x-2 mb-4">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>CHRONOLOGICAL EVENT SEQUENCE ({eventLog.length} events)</span>
                </h2>
                <AARTimeline
                  events={eventLog}
                  onSelectEvent={setSelectedEvent}
                  selectedEventId={selectedEvent?.id}
                />
              </div>

              {/* Event Detail Panel */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
                <h2 className="font-bold text-slate-200 mb-3 flex items-center space-x-2">
                  <Info className="w-4 h-4 text-purple-400" />
                  <span>EVENT DETAIL</span>
                </h2>
                {selectedEvent ? (
                  <div className="space-y-3 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-400 font-bold font-mono">T+{selectedEvent.time}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{selectedEvent.category}</span>
                    </div>
                    <div className="font-bold text-slate-100 text-sm">{selectedEvent.title}</div>
                    <p className="text-slate-300 leading-relaxed">{selectedEvent.description}</p>

                    {selectedEvent.payload && Object.keys(selectedEvent.payload).length > 0 && (
                      <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
                        <div className="text-slate-500 font-bold text-[10px] uppercase mb-2">Raw Payload</div>
                        <pre className="text-slate-400 text-[10px] overflow-auto max-h-40 whitespace-pre-wrap">
                          {JSON.stringify(selectedEvent.payload, null, 2)}
                        </pre>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="flex items-center space-x-1 text-slate-500 hover:text-slate-300 text-[10px] transition"
                    >
                      <X className="w-3 h-3" />
                      <span>Clear selection</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-600 italic text-xs py-4 text-center">
                    Select an event from the timeline to view its details.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DECISIONS */}
          {activeTab === "decisions" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
              <h2 className="font-bold text-slate-200 flex items-center space-x-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>TRAINEE DECISION ANALYSIS ({aar.decisions.length} recorded)</span>
              </h2>
              <AARDecisionReview decisions={aar.decisions} />
            </div>
          )}

          {/* COMMS */}
          {activeTab === "comms" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
              <h2 className="font-bold text-slate-200 flex items-center space-x-2 mb-4">
                <Radio className="w-4 h-4 text-amber-400" />
                <span>COMMUNICATION REVIEW</span>
              </h2>
              <AARCommsReview
                events={eventLog}
                messages={aar.messages}
                pendingMessages={aar.pendingMessages ?? []}
              />
            </div>
          )}

          {/* CONFLICTS */}
          {activeTab === "conflicts" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
              <h2 className="font-bold text-slate-200 flex items-center space-x-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span>CONFLICTING INTELLIGENCE REVIEW ({conflictGroups.size} conflict groups)</span>
              </h2>
              <AARConflictReview messages={aar.messages} />
            </div>
          )}

          {/* MAP REPLAY */}
          {activeTab === "map" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
              <h2 className="font-bold text-slate-200 flex items-center space-x-2 mb-4">
                <Map className="w-4 h-4 text-cyan-400" />
                <span>MAP REPLAY — Jump to Timestamp</span>
              </h2>
              {aar.initialUnits ? (
                <AARMapReplay
                  events={eventLog}
                  initialUnits={aar.initialUnits}
                  totalDurationSeconds={aar.durationSeconds}
                />
              ) : (
                <div className="text-slate-500 italic text-sm text-center py-6">
                  Map replay requires re-running the exercise — initial unit data not available for this session.
                </div>
              )}
            </div>
          )}

          {/* FINDINGS */}
          {activeTab === "summary" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
              <AARSummary aar={aar} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
