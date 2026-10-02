"use client";

import React, { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSimulationWebSocket } from "@/lib/websocket";
import { InstructorControls } from "@/components/instructor/InstructorControls";
import { InstructorInjectPanel } from "@/components/instructor/InstructorInjectPanel";
import { LiveMonitor } from "@/components/instructor/LiveMonitor";
import { TraineeStatus } from "@/components/instructor/TraineeStatus";
import { TacticalMap } from "@/components/tactical/TacticalMap";
import {
  Shield,
  Cpu,
  Compass,
  FileText,
  Radio,
  ExternalLink,
  ArrowLeft,
  Zap,
  Users
} from "lucide-react";

export default function InstructorExerciseControlPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const exerciseId = unwrappedParams.id;
  const router = useRouter();

  const {
    state,
    isConnected,
    sendInstructorInject,
    sendExerciseControl
  } = useSimulationWebSocket({
    exerciseId,
    role: "INSTRUCTOR",
    name: "Lead Instructor"
  });

  const handleEndExercise = () => {
    sendExerciseControl("end");
    router.push(`/aar/${exerciseId}`);
  };

  return (
    <div className="min-h-screen bg-[#070a11] bg-tactical-grid text-slate-100 font-mono flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <Link href="/instructor" className="flex items-center space-x-2 text-slate-400 hover:text-cyan-400 transition">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs">Setup</span>
          </Link>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm text-slate-200">INSTRUCTOR LIVE CONTROL //</span>
            <span className="text-cyan-400 font-bold text-xs">{state.exerciseId}</span>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center space-x-3 text-xs">
          <Link
            href={`/commander/simulation/${exerciseId}`}
            target="_blank"
            className="flex items-center space-x-1 px-3 py-1.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-bold transition"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>OPEN COMMANDER VIEW</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </Link>

          <Link
            href="/team"
            target="_blank"
            className="flex items-center space-x-1 px-3 py-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold transition"
          >
            <Users className="w-3.5 h-3.5" />
            <span>OPEN TEAM TERMINAL</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </Link>

          <button
            onClick={handleEndExercise}
            className="flex items-center space-x-1 px-3 py-1.5 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-300 font-bold transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>AAR REVIEW</span>
          </button>
        </div>
      </header>

      {/* Main Instructor Operations Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <InstructorControls
              commsStatus={state.commsStatus}
              mapStatus={state.mapStatus}
              simStatus={state.status}
              speedMultiplier={state.speedMultiplier}
              onInject={sendInstructorInject}
              onControl={sendExerciseControl}
            />
            {/* Live Exercise Telemetry Monitor */}
            <LiveMonitor state={state} />
          </div>
          <div>
            <InstructorInjectPanel onInject={sendInstructorInject} />
          </div>
        </div>

        {/* Bottom Split: Tactical Map Mirror + Trainee Presence */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Tactical Map Mirror (2 cols) */}
          <div className="lg:col-span-2 h-[420px] rounded-lg overflow-hidden border border-slate-800 shadow-md">
            <TacticalMap
              units={state.units}
              activityMarkers={state.activityMarkers}
              mapStatus={state.mapStatus}
              mapLastUpdated={state.mapLastUpdated}
            />
          </div>

          {/* Connected Trainees & System Audit (1 col) */}
          <div className="space-y-4">
            <TraineeStatus trainees={state.connectedTrainees} />

            {/* Quick Tactical Inject Instructions */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-2">
              <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
                <Zap className="w-3.5 h-3.5" />
                <span>TRAINING EVALUATION OBJECTIVES</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Observe trainee reaction when communications degrade. Do they blindly follow stale coordinates or challenge contradictory reports?
              </p>
              <div className="p-2 rounded bg-slate-950 border border-slate-800/80 text-[10px] text-slate-500">
                Tip: Press <span className="text-amber-300">[ DELAY RADIO ]</span> to force 10-second message queues, or <span className="text-yellow-300">[ CONFLICTING REPORT ]</span> to test confirmation bias.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
