"use client";

import React from "react";
import Link from "next/link";
import { Shield, Layers, Play, FilePlus, Clock, Radio, ArrowLeft } from "lucide-react";
import { getDemoScenario } from "@/data/demoScenario";

export default function ScenariosListPage() {
  const opSilentLink = getDemoScenario(true);

  return (
    <div className="min-h-screen bg-[#070a11] bg-tactical-grid text-slate-100 font-mono flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <Link href="/instructor" className="flex items-center space-x-2 text-slate-400 hover:text-cyan-400 transition">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs">Instructor Console</span>
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-sm font-bold text-slate-200">TACTICAL SCENARIOS LIBRARY</span>
        </div>

        <Link
          href="/instructor/scenarios/create"
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition"
        >
          <FilePlus className="w-3.5 h-3.5" />
          <span>CREATE SCENARIO</span>
        </Link>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-black text-slate-100">Configured Training Scenarios</h1>
          <p className="text-xs text-slate-400 mt-1">
            Standard and custom training scenarios with defined degraded information triggers.
          </p>
        </div>

        {/* Primary Scenario Card */}
        <div className="p-6 rounded-lg bg-slate-900 border border-cyan-500/40 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-cyan-300">{opSilentLink.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-bold">
                  {opSilentLink.codeName}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                OPERATIONAL AREA: {opSilentLink.operationalArea}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Link
                href="/instructor"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs flex items-center space-x-1.5 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>LAUNCH EXERCISE</span>
              </Link>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {opSilentLink.description}
          </p>

          {/* Scenario Event Timeline Breakdown */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">
              SCHEDULED DEGRADATION PHASES ({opSilentLink.events.length} EVENTS):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {opSilentLink.events.map((evt, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px]">
                  <div className="flex justify-between text-slate-400 font-bold mb-0.5">
                    <span className="text-cyan-400">T+{evt.triggerTime}s</span>
                    <span className="text-[9px] uppercase text-slate-500">{evt.type}</span>
                  </div>
                  <div className="font-bold text-slate-200">{evt.title}</div>
                  <p className="text-slate-400 text-[10px] mt-0.5 leading-snug">{evt.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
