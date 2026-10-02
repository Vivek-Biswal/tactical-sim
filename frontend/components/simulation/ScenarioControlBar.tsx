"use client";

import React from "react";
import { Play, Pause, RotateCcw, Square } from "lucide-react";

interface ScenarioControlBarProps {
  status: string;
  formattedTime: string;
  progressPercent: number;
  elapsedSeconds?: number;
  totalDuration?: number;
  onControl: (action: string) => void;
  className?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "NOT STARTED", color: "text-slate-400 bg-slate-800 border-slate-600" },
  running: { label: "RUNNING", color: "text-emerald-400 bg-emerald-950 border-emerald-600" },
  paused: { label: "PAUSED", color: "text-amber-400 bg-amber-950 border-amber-600" },
  completed: { label: "COMPLETED", color: "text-cyan-400 bg-cyan-950 border-cyan-600" },
};

export const ScenarioControlBar: React.FC<ScenarioControlBarProps> = ({
  status,
  formattedTime,
  progressPercent,
  onControl,
  className = "",
}) => {
  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.pending;

  return (
    <div className={`flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-lg text-xs font-mono ${className}`}>
      {/* Left: Status Badge */}
      <div className="flex items-center space-x-3">
        <span className={`px-2.5 py-1 rounded border font-bold tracking-wider text-[11px] ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
        <span className="text-slate-300">
          TIME: <span className="text-cyan-400 font-bold">{formattedTime}</span>
        </span>
      </div>

      {/* Center: Progress Bar */}
      <div className="flex-1 mx-6 max-w-md">
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPercent}%`,
              background: status === "running"
                ? "linear-gradient(90deg, #06b6d4, #3b82f6)"
                : status === "paused"
                ? "#f59e0b"
                : "#475569"
            }}
          />
        </div>
        <div className="text-center text-slate-500 mt-0.5 text-[10px]">
          {progressPercent}% COMPLETE
        </div>
      </div>

      {/* Right: Control Buttons */}
      <div className="flex items-center space-x-2">
        {status === "pending" && (
          <button
            onClick={() => onControl("start")}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-600 text-emerald-400 rounded transition"
          >
            <Play className="w-3.5 h-3.5" />
            <span>START</span>
          </button>
        )}

        {status === "running" && (
          <button
            onClick={() => onControl("pause")}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-900/60 hover:bg-amber-800/80 border border-amber-600 text-amber-400 rounded transition"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>PAUSE</span>
          </button>
        )}

        {status === "paused" && (
          <button
            onClick={() => onControl("resume")}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-600 text-emerald-400 rounded transition"
          >
            <Play className="w-3.5 h-3.5" />
            <span>RESUME</span>
          </button>
        )}

        {(status === "running" || status === "paused") && (
          <button
            onClick={() => onControl("end")}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-900/60 hover:bg-red-800/80 border border-red-600 text-red-400 rounded transition"
          >
            <Square className="w-3.5 h-3.5" />
            <span>END</span>
          </button>
        )}

        <button
          onClick={() => onControl("reset")}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET</span>
        </button>
      </div>
    </div>
  );
};
