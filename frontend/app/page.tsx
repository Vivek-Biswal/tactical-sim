"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Radio,
  Cpu,
  Users,
  FileText,
  Play,
  Zap,
  WifiOff,
  AlertTriangle,
  Compass,
  ArrowRight,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { createExercise } from "../lib/api";

export default function HomePage() {
  const router = useRouter();
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleLaunchDemo = async () => {
    setLoadingDemo(true);
    try {
      const session = await createExercise("scenario-op-silent-link", "Task Force Alpha", true);
      router.push(`/commander/simulation/${session.exerciseId}`);
    } catch (e) {
      router.push("/commander/simulation/exercise-demo-1");
    }
  };

  return (
    <div className="min-h-screen bg-[#070a11] bg-tactical-grid text-slate-100 flex flex-col font-mono">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-950 border border-cyan-500/50 rounded shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-base font-black tracking-widest text-slate-100 flex items-center space-x-2">
              <span>COMMAND-X</span>
              <span className="text-[10px] px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded font-bold">
                PROBLEM 26248
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Immersive Multi-Domain Decision-Making Trainer
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-500 hidden md:inline">SYSTEM STATE:</span>
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>OPERATIONAL</span>
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 text-xs">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>DEGRADED &amp; CONTESTED ELECTROMAGNETIC ENVIRONMENT SIMULATION</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-100 tracking-tight leading-tight">
            Decision-Making Under <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300">
              Extreme Information Uncertainty
            </span>
          </h1>

          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            COMMAND-X prepares tactical commanders and teams to lead when communications are{" "}
            <span className="text-amber-300">delayed</span>, intelligence is{" "}
            <span className="text-amber-300">contradictory</span>, COP maps are{" "}
            <span className="text-amber-300">stale</span>, and radio nets fall{" "}
            <span className="text-rose-400">offline</span>.
          </p>

          {/* Primary Quickstart CTA */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleLaunchDemo}
              disabled={loadingDemo}
              className="px-6 py-3.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center space-x-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Zap className="w-4 h-4 fill-current text-amber-300" />
              <span>{loadingDemo ? "INITIALIZING EXERCISE..." : "START 2-MINUTE DEMO EXERCISE"}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <Link
              href="/instructor"
              className="px-5 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs flex items-center space-x-2 transition"
            >
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>INSTRUCTOR C2 CONSOLE</span>
            </Link>
          </div>
        </div>

        {/* 4 Core Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {/* Card 1: Commander Station */}
          <Link
            href="/commander"
            className="p-5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/70 hover:bg-slate-900 transition flex flex-col justify-between group shadow-sm"
          >
            <div>
              <div className="p-2.5 rounded bg-cyan-950/70 border border-cyan-800/80 w-fit text-cyan-400 mb-3 group-hover:scale-105 transition">
                <Compass className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition">
                COMMANDER SIMULATION
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Full-screen C2 tactical console with interactive 2D SVG map, radio net, situational reports, and decision rationale capture.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-bold text-cyan-400 flex items-center space-x-1">
              <span>ENTER C2 STATION</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* Card 2: Instructor Control */}
          <Link
            href="/instructor"
            className="p-5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-amber-500/70 hover:bg-slate-900 transition flex flex-col justify-between group shadow-sm"
          >
            <div>
              <div className="p-2.5 rounded bg-amber-950/70 border border-amber-800/80 w-fit text-amber-400 mb-3 group-hover:scale-105 transition">
                <Cpu className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition">
                INSTRUCTOR C2 CONSOLE
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Live exercise monitor with manual inject controls: delay radio, drop carrier, dispatch conflicting reports, and outdate COP map.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-bold text-amber-400 flex items-center space-x-1">
              <span>OPEN INSTRUCTOR CONSOLE</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* Card 3: Team Terminal (Multiplayer) */}
          <Link
            href="/team"
            className="p-5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-emerald-500/70 hover:bg-slate-900 transition flex flex-col justify-between group shadow-sm"
          >
            <div>
              <div className="p-2.5 rounded bg-emerald-950/70 border border-emerald-800/80 w-fit text-emerald-400 mb-3 group-hover:scale-105 transition">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition">
                FIELD TEAM LINK
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Dual-role multiplayer: Open in a 2nd browser tab as Team Alpha scout to send ground SITREPs and experience radio degradation firsthand.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
              <span>JOIN AS TEAM MEMBER</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* Card 4: After Action Review */}
          <Link
            href="/aar/exercise-demo-1"
            className="p-5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-purple-500/70 hover:bg-slate-900 transition flex flex-col justify-between group shadow-sm"
          >
            <div>
              <div className="p-2.5 rounded bg-purple-950/70 border border-purple-800/80 w-fit text-purple-400 mb-3 group-hover:scale-105 transition">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-100 group-hover:text-purple-300 transition">
                AAR REVIEW ARCHIVE
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Objective post-mission debriefing: Chronological decision timeline, information state audits (known vs denied), and packet delivery metrics.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-bold text-purple-400 flex items-center space-x-1">
              <span>VIEW AAR REPORT</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>

        {/* Tactical Pillars Banner */}
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">
            CORE DEGRADATION PROTOCOLS TESTED IN OPERATION SILENT LINK:
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
            <div className="flex items-center space-x-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Packet Propagation Delay (+8-12s)</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span>Contradictory Scout vs SIGINT</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Stale COP Telemetry Snapshot</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Full RF Jamming / Radio Silence</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-3 px-6 text-center text-xs text-slate-500 font-mono">
        COMMAND-X Prototype // Multi-Domain Decision-Making Trainer // Built for Problem Statement 26248
      </footer>
    </div>
  );
}
