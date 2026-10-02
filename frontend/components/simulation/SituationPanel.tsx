import React, { useState } from "react";
import { TacticalUnit } from "../../types/scenario";
import { Check, X, Shield, Info, Activity, Radio, AlertOctagon } from "lucide-react";

interface SituationPanelProps {
  availableInformation: string[];
  unavailableInformation: string[];
  units: TacticalUnit[];
  eventLog: Array<{
    id: string;
    time: string;
    title: string;
    description: string;
    category: string;
  }>;
  className?: string;
}

export const SituationPanel: React.FC<SituationPanelProps> = ({
  availableInformation,
  unavailableInformation,
  units,
  eventLog,
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState<"info_state" | "units" | "logs">("info_state");

  return (
    <div className={`flex flex-col bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden font-mono text-xs ${className}`}>
      {/* Panel Tab Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-950 text-slate-400">
        <button
          onClick={() => setActiveTab("info_state")}
          className={`flex-1 py-2 px-3 text-center border-b-2 transition flex items-center justify-center space-x-1.5 ${
            activeTab === "info_state"
              ? "border-cyan-400 text-cyan-300 bg-slate-900/60 font-bold"
              : "border-transparent hover:text-slate-200"
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>INFO STATE</span>
        </button>

        <button
          onClick={() => setActiveTab("units")}
          className={`flex-1 py-2 px-3 text-center border-b-2 transition flex items-center justify-center space-x-1.5 ${
            activeTab === "units"
              ? "border-cyan-400 text-cyan-300 bg-slate-900/60 font-bold"
              : "border-transparent hover:text-slate-200"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>SUBUNITS ({units.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`flex-1 py-2 px-3 text-center border-b-2 transition flex items-center justify-center space-x-1.5 ${
            activeTab === "logs"
              ? "border-cyan-400 text-cyan-300 bg-slate-900/60 font-bold"
              : "border-transparent hover:text-slate-200"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>SITREP LOG</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-3 overflow-y-auto max-h-[380px] space-y-3">
        {/* TAB 1: INFORMATION STATE (CORE FEATURE) */}
        {activeTab === "info_state" && (
          <div className="space-y-4">
            {/* Key pedagogical explanation */}
            <div className="p-2 bg-slate-950/80 rounded border border-slate-800/80 text-[11px] text-slate-400">
              <span className="text-cyan-400 font-bold">DECISION REALITY MATRIX:</span>{" "}
              Tracks what intelligence is verified vs. denied at current simulation timestamp.
            </div>

            {/* Verified / Available Information */}
            <div>
              <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px] mb-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>AVAILABLE INTEL // KNOWN FACTS</span>
              </div>
              <ul className="space-y-1">
                {availableInformation.length === 0 ? (
                  <li className="text-slate-500 italic text-[11px]">No verified streams available.</li>
                ) : (
                  availableInformation.map((item, idx) => (
                    <li
                      key={idx}
                      className="p-1.5 rounded bg-emerald-950/20 border border-emerald-900/40 text-emerald-200 text-[11px] flex items-start space-x-2"
                    >
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Degraded / Unavailable Information */}
            <div>
              <div className="flex items-center space-x-1.5 text-rose-400 font-bold text-[11px] mb-1.5">
                <X className="w-3.5 h-3.5" />
                <span>UNAVAILABLE // DENIED / JAMMED</span>
              </div>
              <ul className="space-y-1">
                {unavailableInformation.length === 0 ? (
                  <li className="text-slate-500 italic text-[11px]">All standard operational telemetry operational.</li>
                ) : (
                  unavailableInformation.map((item, idx) => (
                    <li
                      key={idx}
                      className="p-1.5 rounded bg-rose-950/20 border border-rose-900/40 text-rose-200 text-[11px] flex items-start space-x-2"
                    >
                      <span className="text-rose-400 font-bold">✗</span>
                      <span>{item}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: SUBUNITS STATUS */}
        {activeTab === "units" && (
          <div className="space-y-2">
            {units.map((unit) => (
              <div
                key={unit.id}
                className="p-2.5 rounded bg-slate-950/70 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-200 flex items-center space-x-2">
                    <span>{unit.name}</span>
                    <span className="text-[10px] text-cyan-400">[{unit.callsign}]</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{unit.role}</div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${
                      unit.status === "operational"
                        ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                        : "bg-amber-950 text-amber-400 border-amber-800"
                    }`}
                  >
                    {unit.status}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1">
                    GRID: {Math.round(unit.x)}, {Math.round(unit.y)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: SITREP CHRONOLOGICAL LOG */}
        {activeTab === "logs" && (
          <div className="space-y-1.5">
            {eventLog.slice().reverse().map((log) => (
              <div
                key={log.id}
                className="p-2 rounded bg-slate-950/70 border border-slate-800/80 text-[11px]"
              >
                <div className="flex items-center justify-between text-slate-400 font-bold mb-0.5">
                  <span className="text-cyan-400">{log.time}</span>
                  <span className="text-[10px] uppercase text-slate-500">{log.category}</span>
                </div>
                <div className="font-bold text-slate-200">{log.title}</div>
                <p className="text-slate-400 mt-0.5 leading-snug">{log.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
