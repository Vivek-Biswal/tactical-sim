"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSimulationWebSocket } from "@/lib/websocket";
import { TacticalMap } from "@/components/tactical/TacticalMap";
import { RadioPanel } from "@/components/communication/RadioPanel";
import { CommunicationStatus } from "@/components/communication/CommunicationStatus";
import {
  Shield,
  Users,
  Radio,
  Wifi,
  WifiOff,
  Compass,
  Clock,
  Send,
  AlertTriangle
} from "lucide-react";

export default function TeamMemberTerminalPage() {
  const [exerciseId, setExerciseId] = useState("exercise-demo-1");
  const [callsign, setCallsign] = useState("Team Alpha Lead");

  const {
    state,
    isConnected,
    sendRadioMessage
  } = useSimulationWebSocket({
    exerciseId,
    role: "TEAM_ALPHA",
    name: callsign
  });

  return (
    <div className="min-h-screen bg-[#070a11] bg-tactical-grid text-slate-100 font-mono flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2 text-slate-200 hover:text-emerald-400 transition">
            <div className="p-1.5 bg-emerald-950/80 border border-emerald-500/50 rounded">
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wider">COMMAND-X // FIELD TEAM TERMINAL</span>
              <span className="text-[10px] text-slate-500 block">MULTIPLAYER SUBUNIT LINK</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <CommunicationStatus
            commsStatus={state.commsStatus}
            mapStatus={state.mapStatus}
            radioDelaySeconds={state.radioDelaySeconds}
          />

          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border text-[11px] font-bold ${
              isConnected
                ? "bg-emerald-950/60 border-emerald-700 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isConnected ? "NET LINKED" : "OFFLINE"}</span>
          </div>

          <Link href="/" className="text-slate-400 hover:text-slate-200 px-2">
            Exit
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Unit Info Strip */}
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold">
              VIPER 1-1
            </div>
            <div>
              <div className="font-bold text-slate-200 text-sm">Assigned Subunit: Team Alpha (Lead Recon)</div>
              <div className="text-[11px] text-slate-400">Mission: Point reconnaissance toward Choke Point Bravo</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-500 font-bold">EXERCISE:</span>
            <input
              type="text"
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-cyan-300 w-36 font-bold"
            />
          </div>
        </div>

        {/* Tactical Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Tactical Map (7 cols) */}
          <div className="lg:col-span-7 h-[420px] rounded-lg overflow-hidden border border-slate-800 shadow-md">
            <TacticalMap
              units={state.units}
              activityMarkers={state.activityMarkers}
              mapStatus={state.mapStatus}
              mapLastUpdated={state.mapLastUpdated}
            />
          </div>

          {/* Subunit Radio Net (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <RadioPanel
              messages={state.messages}
              commsStatus={state.commsStatus}
              radioDelaySeconds={state.radioDelaySeconds}
              userRole="TEAM_ALPHA"
              userName={callsign}
              onSendMessage={sendRadioMessage}
              className="flex-1"
            />

            {/* Subunit Quick Field Report Prompts */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                FIELD RECONNAISSANCE SHORTCUTS (TRANSMIT TO COMMANDER):
              </span>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  disabled={state.commsStatus === "offline"}
                  onClick={() =>
                    sendRadioMessage("Alpha Lead: Visual contact with unidentified vehicle patrol along Western Ridge.")
                  }
                  className="p-2 rounded bg-slate-950 hover:bg-slate-800 text-left border border-slate-800 text-slate-300 text-[11px] transition disabled:opacity-40"
                >
                  &ldquo;Visual contact with patrol along Western Ridge.&rdquo;
                </button>
                <button
                  type="button"
                  disabled={state.commsStatus === "offline"}
                  onClick={() =>
                    sendRadioMessage("Alpha Lead: Radio static and RF hash increasing. Suspect hostile jammer operating nearby.")
                  }
                  className="p-2 rounded bg-slate-950 hover:bg-slate-800 text-left border border-slate-800 text-slate-300 text-[11px] transition disabled:opacity-40"
                >
                  &ldquo;Radio hash increasing. Suspect jammer nearby.&rdquo;
                </button>
                <button
                  type="button"
                  disabled={state.commsStatus === "offline"}
                  onClick={() =>
                    sendRadioMessage("Alpha Lead: Reached Checkpoint Charlie. Holding position awaiting further guidance.")
                  }
                  className="p-2 rounded bg-slate-950 hover:bg-slate-800 text-left border border-slate-800 text-slate-300 text-[11px] transition disabled:opacity-40"
                >
                  &ldquo;Reached Checkpoint Charlie. Holding position.&rdquo;
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
