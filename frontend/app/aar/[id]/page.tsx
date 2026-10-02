"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { fetchAARReport } from "@/lib/api";
import { AARReportData } from "@/types/exercise";
import { DecisionTimeline } from "@/components/aar/DecisionTimeline";
import { PerformanceMetrics } from "@/components/aar/PerformanceMetrics";
import { InformationState } from "@/components/aar/InformationState";
import { AARSummary } from "@/components/aar/AARSummary";
import {
  Shield,
  FileText,
  Printer,
  RotateCcw,
  Compass,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export default function AfterActionReviewPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const exerciseId = unwrappedParams.id;

  const [aar, setAar] = useState<AARReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "decisions" | "summary">("timeline");

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

  const handlePrint = () => {
    window.print();
  };

  if (loading || !aar) {
    return (
      <div className="min-h-screen bg-[#070a11] text-slate-100 font-mono flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Synthesizing After Action Review Report for {exerciseId}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a11] bg-tactical-grid text-slate-100 font-mono flex flex-col print:bg-white print:text-black">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 print:hidden">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2 text-slate-400 hover:text-cyan-400 transition">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs">Launchpad</span>
          </Link>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-sm text-slate-200">AFTER ACTION REVIEW (AAR) //</span>
            <span className="text-cyan-400 font-bold text-xs">{aar.exerciseId}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>EXPORT / PRINT</span>
          </button>

          <Link
            href={`/commander/simulation/${exerciseId}`}
            className="flex items-center space-x-1 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 rounded font-bold transition"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>RE-ENTER SIMULATION</span>
          </Link>
        </div>
      </header>

      {/* Main AAR Report Document */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Title Banner */}
        <div className="p-6 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
            <Shield className="w-4 h-4" />
            <span>TACTICAL SIMULATION POST-EXERCISE AUDIT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100">
            After Action Review: {aar.scenarioName}
          </h1>
          <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
            <span>UNIT: <strong className="text-slate-200">{aar.teamName}</strong></span>
            <span>DURATION: <strong className="text-cyan-400">{aar.stats.duration}</strong></span>
            <span>DECISIONS LOGGED: <strong className="text-slate-200">{aar.stats.decisionsCount}</strong></span>
            <span>TOTAL MESSAGES: <strong className="text-slate-200">{aar.stats.messagesTotal}</strong></span>
          </div>
        </div>

        {/* Factual Communication Performance Metrics */}
        <PerformanceMetrics stats={aar.stats} />

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 rounded-t-lg text-xs print:hidden">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`py-2.5 px-4 font-bold border-b-2 transition ${
              activeTab === "timeline"
                ? "border-cyan-400 text-cyan-300 bg-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            DECISION &amp; EVENT TIMELINE
          </button>
          <button
            onClick={() => setActiveTab("decisions")}
            className={`py-2.5 px-4 font-bold border-b-2 transition ${
              activeTab === "decisions"
                ? "border-cyan-400 text-cyan-300 bg-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            DECISION ANALYSIS (AVAILABLE VS UNAVAILABLE INFO)
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`py-2.5 px-4 font-bold border-b-2 transition ${
              activeTab === "summary"
                ? "border-cyan-400 text-cyan-300 bg-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            EXECUTIVE FINDINGS &amp; RECOMMENDATIONS
          </button>
        </div>

        {/* Tab 1: Chronological Decision & Degradation Timeline */}
        {(activeTab === "timeline" || typeof window === "undefined") && (
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-lg space-y-4">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold border-b border-slate-800 pb-2">
              <Clock className="w-4 h-4" />
              <h2 className="uppercase tracking-wider">CHRONOLOGICAL EVENT &amp; ACTION SEQUENCE</h2>
            </div>
            <DecisionTimeline
              timelineEvents={aar.commsTimeline}
              decisions={aar.decisions}
            />
          </div>
        )}

        {/* Tab 2: Decision Analysis with Information State Matrix */}
        {(activeTab === "decisions" || typeof window === "undefined") && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400">
              <span className="text-cyan-400 font-bold">AAR CORE CRITERIA:</span> Evaluates each decision against the exact information environment at that second (what was verified vs what was severed or unavailable).
            </div>
            <InformationState decisions={aar.decisions} />
          </div>
        )}

        {/* Tab 3: Summary & Training Recommendations */}
        {(activeTab === "summary" || typeof window === "undefined") && (
          <AARSummary aar={aar} />
        )}
      </main>
    </div>
  );
}
