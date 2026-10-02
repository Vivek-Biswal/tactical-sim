import React from "react";
import { CommsStatus, MapStatus } from "../../types/scenario";
import {
  WifiOff,
  Clock,
  Radio,
  FileWarning,
  HelpCircle,
  ShieldAlert,
  Play,
  Pause,
  Square,
  RotateCcw,
  Zap,
  AlertOctagon
} from "lucide-react";

interface InstructorControlsProps {
  commsStatus: CommsStatus;
  mapStatus: MapStatus;
  simStatus: string;
  speedMultiplier: number;
  onInject: (action: string, payload?: Record<string, unknown>) => void;
  onControl: (action: string, speedMultiplier?: number) => void;
  className?: string;
}

export const InstructorControls: React.FC<InstructorControlsProps> = ({
  commsStatus,
  mapStatus,
  simStatus,
  speedMultiplier,
  onInject,
  onControl,
  className = ""
}) => {
  return (
    <div className={`bg-slate-900/90 border border-slate-800 rounded-lg p-4 font-mono text-xs ${className}`}>
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="font-bold text-slate-200 flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>INSTRUCTOR TACTICAL INJECTS &amp; CONTROLS</span>
        </div>
        <span className="text-[10px] text-slate-500">REAL-TIME OVERRIDE BUS</span>
      </div>

      <div className="mb-4">
        <div className="text-[10px] text-slate-500 font-bold mb-2">COMMUNICATION DEGRADATION CONTROLS</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* COMMS: NORMAL */}
          <button
            type="button"
            onClick={() => onInject("set_comms", { status: "normal", delay: 0, loss: 0, incomplete: false })}
            className={`p-2 rounded border text-left font-bold transition flex flex-col justify-between ${
              commsStatus === "normal"
                ? "bg-emerald-950 text-emerald-400 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-emerald-500/50 hover:text-emerald-300"
            }`}
          >
            <div className="flex items-center space-x-1.5 mb-1">
              <Radio className="w-3 h-3" />
              <span>NORMAL</span>
            </div>
            <span className="text-[9px] font-normal opacity-70">0s delay, 0% loss</span>
          </button>

          {/* COMMS: DELAYED */}
          <button
            type="button"
            onClick={() => onInject("set_comms", { status: "delayed", delay: 10, loss: 0, incomplete: false })}
            className={`p-2 rounded border text-left font-bold transition flex flex-col justify-between ${
              commsStatus === "delayed"
                ? "bg-yellow-950 text-yellow-400 border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.2)]"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-yellow-500/50 hover:text-yellow-300"
            }`}
          >
            <div className="flex items-center space-x-1.5 mb-1">
              <Clock className="w-3 h-3" />
              <span>DELAYED</span>
            </div>
            <span className="text-[9px] font-normal opacity-70">+10s latency, full intact</span>
          </button>

          {/* COMMS: DEGRADED */}
          <button
            type="button"
            onClick={() => onInject("set_comms", { status: "degraded", delay: 15, loss: 30, incomplete: true })}
            className={`p-2 rounded border text-left font-bold transition flex flex-col justify-between ${
              commsStatus === "degraded"
                ? "bg-orange-950 text-orange-400 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.2)]"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-orange-500/50 hover:text-orange-300"
            }`}
          >
            <div className="flex items-center space-x-1.5 mb-1">
              <AlertOctagon className="w-3 h-3" />
              <span>DEGRADED</span>
            </div>
            <span className="text-[9px] font-normal opacity-70">+15s delay, 30% loss, static</span>
          </button>

          {/* COMMS: LOST */}
          <button
            type="button"
            onClick={() => onInject("set_comms", { status: "offline", delay: 0, loss: 100, incomplete: false })}
            className={`p-2 rounded border text-left font-bold transition flex flex-col justify-between ${
              commsStatus === "offline"
                ? "bg-rose-950 text-rose-400 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-rose-500/50 hover:text-rose-300"
            }`}
          >
            <div className="flex items-center space-x-1.5 mb-1">
              <WifiOff className="w-3 h-3" />
              <span>LOST</span>
            </div>
            <span className="text-[9px] font-normal opacity-70">Carrier severed (100% loss)</span>
          </button>
        </div>
      </div>

      {/* Scenario Events Injects Grid */}
      <div className="text-[10px] text-slate-500 font-bold mb-2 mt-4">SCENARIO EVENTS</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
        {/* CONFLICTING REPORT */}
        <button
          type="button"
          onClick={() => onInject("conflicting_report")}
          className="p-2.5 rounded border text-left font-bold transition flex flex-col justify-between bg-slate-950 text-yellow-300 border-slate-800 hover:border-yellow-500/50"
        >
          <div className="flex items-center space-x-1.5 mb-1">
            <HelpCircle className="w-3.5 h-3.5 text-yellow-400" />
            <span>[ CONFLICTING REPORT ]</span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal">
            Dispatch opposing scout vs SIGINT SITREPs
          </span>
        </button>

        {/* MAKE MAP OUTDATED */}
        <button
          type="button"
          onClick={() => onInject(mapStatus === "outdated" ? "restore_map" : "outdate_map")}
          className={`p-2.5 rounded border text-left font-bold transition flex flex-col justify-between ${
            mapStatus === "outdated"
              ? "bg-amber-950 text-amber-300 border-amber-500"
              : "bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-500/50"
          }`}
        >
          <div className="flex items-center space-x-1.5 mb-1">
            <FileWarning className="w-3.5 h-3.5 text-amber-400" />
            <span>[ OUTDATE MAP ]</span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal">
            {mapStatus === "outdated" ? "Map Stale (3m)" : "Freeze COP satellite telemetry"}
          </span>
        </button>

        {/* NEW INTELLIGENCE */}
        <button
          type="button"
          onClick={() => onInject("new_intelligence")}
          className="p-2.5 rounded border text-left font-bold transition flex flex-col justify-between bg-slate-950 text-purple-300 border-slate-800 hover:border-purple-500/50"
        >
          <div className="flex items-center space-x-1.5 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span>[ NEW INTELLIGENCE ]</span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal">
            Broadcast hostile jammer intercept
          </span>
        </button>
      </div>

      {/* Simulation Execution Controls */}
      <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Pause / Resume */}
        <div className="flex items-center space-x-2">
          {simStatus === "running" ? (
            <button
              type="button"
              onClick={() => onControl("pause")}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-950 text-amber-300 border border-amber-700 rounded hover:bg-amber-900 transition font-bold"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>[ PAUSE ]</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onControl("resume")}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-950 text-emerald-300 border border-emerald-700 rounded hover:bg-emerald-900 transition font-bold"
            >
              <Play className="w-3.5 h-3.5" />
              <span>[ RESUME ]</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onControl("reset")}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded hover:bg-slate-700 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET</span>
          </button>

          <button
            type="button"
            onClick={() => onControl("end")}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-950 text-rose-300 border border-rose-800 rounded hover:bg-rose-900 transition font-bold"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>[ END EXERCISE ]</span>
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 px-1 font-bold">SPEED:</span>
          {[1.0, 2.0, 5.0].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => onControl("set_speed", spd)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                speedMultiplier === spd
                  ? "bg-cyan-600 text-white shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
