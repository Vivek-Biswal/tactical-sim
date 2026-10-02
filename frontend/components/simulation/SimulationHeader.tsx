import React from "react";
import { CommunicationStatus } from "../communication/CommunicationStatus";
import { CommsStatus, MapStatus } from "../../types/scenario";
import { Shield, Clock, Wifi, WifiOff, Play, Pause, Square, Zap } from "lucide-react";
import Link from "next/link";

interface SimulationHeaderProps {
  scenarioName: string;
  scenarioCode: string;
  formattedTime: string;
  progressPercent: number;
  commsStatus: CommsStatus;
  mapStatus: MapStatus;
  radioDelaySeconds?: number;
  isConnected: boolean;
  status: string;
  isDemo?: boolean;
  onControl?: (action: string) => void;
  onEndExercise?: () => void;
}

export const SimulationHeader: React.FC<SimulationHeaderProps> = ({
  scenarioName,
  scenarioCode,
  formattedTime,
  progressPercent,
  commsStatus,
  mapStatus,
  radioDelaySeconds = 0,
  isConnected,
  status,
  isDemo = true,
  onControl,
  onEndExercise
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-slate-100 font-mono select-none">
      {/* Brand & Scenario ID */}
      <div className="flex items-center space-x-3">
        <Link href="/" className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition">
          <div className="p-1.5 bg-cyan-950 border border-cyan-500/40 rounded">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="font-black text-sm tracking-widest text-slate-100 flex items-center space-x-2">
              <span>COMMAND-X</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-cyan-950/80 text-cyan-300 border border-cyan-800 rounded">
                SIMULATOR
              </span>
            </div>
            <div className="text-[10px] text-slate-400">DECISION-MAKING TRAINER</div>
          </div>
        </Link>

        <span className="text-slate-700 hidden sm:inline">|</span>

        {/* Scenario Name */}
        <div className="hidden md:block">
          <div className="text-xs font-bold text-slate-200">{scenarioName}</div>
          <div className="text-[10px] text-slate-500">{scenarioCode}</div>
        </div>
      </div>

      {/* Center: Mission Timer & Progress */}
      <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded">
        <div className="flex items-center space-x-1.5 text-cyan-400">
          <Clock className="w-4 h-4" />
          <span className="text-base font-bold tracking-wider">{formattedTime}</span>
        </div>

        {/* Progress bar */}
        <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden hidden sm:block">
          <div
            className="bg-cyan-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <span className="text-[10px] text-slate-400">{progressPercent}%</span>

        {isDemo && (
          <span className="flex items-center space-x-1 px-1.5 py-0.2 bg-amber-950/80 text-amber-400 border border-amber-800 text-[10px] rounded font-bold">
            <Zap className="w-3 h-3" />
            <span>DEMO (2m)</span>
          </span>
        )}
      </div>

      {/* Right: Degradation Statuses & Actions */}
      <div className="flex items-center space-x-3">
        <CommunicationStatus
          commsStatus={commsStatus}
          mapStatus={mapStatus}
          radioDelaySeconds={radioDelaySeconds}
        />

        {/* Connection Pulse */}
        <div
          className={`flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded border ${
            isConnected
              ? "bg-emerald-950/50 border-emerald-800 text-emerald-400"
              : "bg-slate-900 border-slate-800 text-slate-400"
          }`}
          title={isConnected ? "WebSocket Real-time Linked" : "Local Engine Active"}
        >
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span className="hidden lg:inline">{isConnected ? "SYNCED" : "LOCAL"}</span>
        </div>

        {/* Sim Controls */}
        {onControl && (
          <div className="flex items-center space-x-1">
            {status === "running" ? (
              <button
                onClick={() => onControl("pause")}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
                title="Pause simulation"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => onControl("resume")}
                className="p-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-700 transition"
                title="Resume simulation"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* End Exercise Button */}
        {onEndExercise && (
          <button
            onClick={onEndExercise}
            className="flex items-center space-x-1 px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 rounded text-xs transition"
          >
            <Square className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">END EXERCISE</span>
          </button>
        )}
      </div>
    </header>
  );
};
