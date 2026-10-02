"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Compass, Play, Zap, Clock, Users, ArrowRight } from "lucide-react";
import { createExercise } from "../../lib/api";

export default function CommanderLobbyPage() {
  const router = useRouter();
  const [commanderCallsign, setCommanderCallsign] = useState("Viper Actual");
  const [loading, setLoading] = useState(false);

  const handleEnterSimulation = async () => {
    setLoading(true);
    try {
      const session = await createExercise("scenario-op-silent-link", "Task Force Alpha", true);
      router.push(`/commander/simulation/${session.exerciseId}`);
    } catch (e) {
      router.push("/commander/simulation/exercise-demo-1");
    }
  };

  return (
    <div className="min-h-screen bg-[#070a11] bg-tactical-grid text-slate-100 font-mono flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2 text-slate-200 hover:text-cyan-400 transition">
            <div className="p-1.5 bg-cyan-950 border border-cyan-500/50 rounded">
              <Compass className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wider">COMMAND-X // COMMANDER TERMINAL</span>
              <span className="text-[10px] text-slate-500 block">TACTICAL C2 PORTAL</span>
            </div>
          </Link>
        </div>

        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          Exit to Launchpad
        </Link>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
          <div className="text-center space-y-2">
            <div className="p-3 bg-cyan-950/70 border border-cyan-500/40 rounded-full w-fit mx-auto text-cyan-400">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-slate-100 uppercase tracking-wide">
              Commander Mission Briefing
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              You are assuming command of Task Force Alpha during Operation Silent Link. Prepare for electronic counter-measures and contested C2 links.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between text-slate-400">
              <span className="font-bold">SCENARIO:</span>
              <span className="text-cyan-400 font-bold">Operation Silent Link</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span className="font-bold">AREA OF OPERATIONS:</span>
              <span className="text-slate-200">Sector 7 (Obsidian Ridge)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span className="font-bold">ASSIGNED SUBUNITS:</span>
              <span className="text-slate-200">Team Alpha (Recon), Team Bravo (Support)</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                COMMANDER CALLSIGN / NAME:
              </label>
              <input
                type="text"
                value={commanderCallsign}
                onChange={(e) => setCommanderCallsign(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              onClick={handleEnterSimulation}
              disabled={loading}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-2 transition shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{loading ? "LINKING C2 STREAM..." : "ENTER COMMAND SIMULATION"}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
