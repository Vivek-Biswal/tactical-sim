"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Cpu,
  Play,
  Zap,
  Clock,
  Radio,
  FilePlus,
  Compass,
  ArrowRight,
  ExternalLink,
  Layers
} from "lucide-react";
import { createExercise } from "../../lib/api";

export default function InstructorDashboardPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("Task Force Alpha");
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  const handleStartExercise = async () => {
    setIsStarting(true);
    try {
      const session = await createExercise("scenario-op-silent-link", teamName, isDemoMode);
      router.push(`/instructor/exercises/${session.exerciseId}`);
    } catch (e) {
      router.push("/instructor/exercises/exercise-demo-1");
    }
  };

  return (
    <div className="min-h-screen bg-[#070a11] bg-tactical-grid text-slate-100 font-mono flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2 text-slate-200 hover:text-cyan-400 transition">
            <div className="p-1.5 bg-amber-950/80 border border-amber-500/50 rounded">
              <Cpu className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wider">COMMAND-X // INSTRUCTOR C2</span>
              <span className="text-[10px] text-slate-500 block">EXERCISE CONTROLLER</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <Link
            href="/instructor/scenarios/create"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded transition font-bold"
          >
            <FilePlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>BUILD SCENARIO</span>
          </Link>

          <Link
            href="/"
            className="text-slate-400 hover:text-slate-200 px-2 py-1"
          >
            Return to Launchpad
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Banner */}
        <div className="p-6 rounded-lg bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 text-[11px] font-bold">
              <Zap className="w-3 h-3" />
              <span>SIMULATION CONTROLLER HUB</span>
            </div>
            <h1 className="text-2xl font-black text-slate-100">
              Configure &amp; Launch Exercise
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Launch a scenario for trainees to join as commanders or field subunits. During execution, use real-time inject controls to dynamically degrade communications and observe decision rationale.
            </p>
          </div>
        </div>

        {/* Start Exercise Configuration Card */}
        <div className="p-6 rounded-lg bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold border-b border-slate-800 pb-3">
            <Play className="w-4 h-4" />
            <h2 className="text-sm uppercase tracking-wider">EXERCISE LAUNCH PARAMETERS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scenario Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                SELECTED SCENARIO:
              </label>
              <div className="p-3 rounded bg-slate-950 border border-cyan-500/40 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 text-sm">Operation Silent Link</span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-bold">
                    PRIMARY DEMO
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Sector 7 Obsidian Ridge: progressive latency, contradictory scout/SIGINT feeds, stale COP telemetry snapshot, full RF jamming, and critical commander decision point.
                </p>
                <div className="text-[10px] text-slate-500 pt-1">
                  CODE: SILENT-LINK-26248 // 7 DEGRADATION PHASES
                </div>
              </div>
            </div>

            {/* Team & Duration Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  PARTICIPATING TRAINEE UNIT / CALLSIGN:
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  placeholder="e.g. Task Force Alpha"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  SIMULATION DURATION MODE:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDemoMode(true)}
                    className={`p-3 rounded border text-left transition ${
                      isDemoMode
                        ? "bg-amber-950/80 border-amber-500 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-bold text-xs">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>DEMO MODE (2 MIN)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                      High-tempo evaluation sequence ideal for hackathon presentation and quick judging.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDemoMode(false)}
                    className={`p-3 rounded border text-left transition ${
                      !isDemoMode
                        ? "bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-bold text-xs">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>STANDARD (10 MIN)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                      Full-length classroom training tempo with extended observation intervals.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Launch Buttons */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              Starts both the live instructor control monitor and trainee C2 broadcast.
            </span>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleStartExercise}
                disabled={isStarting}
                className="px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center space-x-2 transition shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isStarting ? "COMMENCING EXERCISE..." : "COMMENCE EXERCISE"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links & Shortcuts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/instructor/scenarios"
            className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
          >
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs mb-1">
              <Layers className="w-4 h-4" />
              <span>SCENARIOS LIBRARY</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Browse pre-configured degraded comms training scenarios and templates.
            </p>
          </Link>

          <Link
            href="/commander/simulation/exercise-demo-1"
            className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
          >
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs mb-1">
              <Compass className="w-4 h-4" />
              <span>COMMANDER VIEW</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Directly view the simulation from the commander&apos;s tactical perspective.
            </p>
          </Link>

          <Link
            href="/team"
            className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
          >
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs mb-1">
              <Radio className="w-4 h-4" />
              <span>TEAM MEMBER TERMINAL</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Open a 2nd browser tab to test real-time subunit message latency.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
