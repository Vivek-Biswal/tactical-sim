import React from "react";
import { ExerciseState } from "../../types/exercise";
import { CommunicationStatus } from "../communication/CommunicationStatus";
import { Clock, Shield, CheckCircle2, AlertCircle, Activity, UserCheck } from "lucide-react";

interface LiveMonitorProps {
  state: ExerciseState;
  className?: string;
}

export const LiveMonitor: React.FC<LiveMonitorProps> = ({ state, className = "" }) => {
  const latestDecision = state.decisions.length > 0
    ? state.decisions[state.decisions.length - 1]
    : null;

  return (
    <div className={`space-y-4 font-mono text-xs ${className}`}>
      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Active Exercise */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="text-[10px] text-slate-500 font-bold uppercase">EXERCISE SESSION</div>
          <div className="text-sm font-bold text-slate-100 truncate">{state.exerciseId}</div>
          <div className="text-[11px] text-cyan-400 mt-0.5 truncate">{state.scenarioName}</div>
        </div>

        {/* Trainee Team */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="text-[10px] text-slate-500 font-bold uppercase">TRAINEE TEAM</div>
          <div className="text-sm font-bold text-slate-100">{state.teamName}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>STATUS: {state.status.toUpperCase()}</span>
          </div>
        </div>

        {/* Exercise Timer */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="text-[10px] text-slate-500 font-bold uppercase">SIMULATION TIME</div>
          <div className="text-sm font-bold text-cyan-400">{state.formattedTime}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            PROGRESS: {state.progressPercent}% ({state.speedMultiplier}x)
          </div>
        </div>

        {/* Comms & Map Degradation Status */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">DEGRADATION AUDIT</div>
          <CommunicationStatus
            commsStatus={state.commsStatus}
            mapStatus={state.mapStatus}
            radioDelaySeconds={state.radioDelaySeconds}
          />
        </div>
      </div>

      {/* Trainee Decision & Action Audit Card */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
          <div className="font-bold text-slate-200 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>LATEST TRAINEE DECISION AUDIT</span>
          </div>
          <span className="text-[10px] text-slate-500">
            RECORDED DECISIONS: {state.decisions.length}
          </span>
        </div>

        {latestDecision ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-cyan-300 font-bold text-xs">{latestDecision.decision}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                  latestDecision.confidence === "high"
                    ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                    : latestDecision.confidence === "medium"
                    ? "bg-amber-950 text-amber-400 border-amber-800"
                    : "bg-rose-950 text-rose-400 border-rose-800"
                }`}
              >
                CONFIDENCE: {latestDecision.confidence}
              </span>
            </div>

            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                TRAINEE RATIONALE (RECORDED AT {latestDecision.simulationTime}):
              </span>
              <p className="text-slate-300 leading-relaxed italic">
                &ldquo;{latestDecision.rationale}&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
              <div className="text-slate-400">
                <span className="text-emerald-400 font-bold">INFO KNOWN:</span>{" "}
                {latestDecision.availableInformation.length} items
              </div>
              <div className="text-slate-400">
                <span className="text-rose-400 font-bold">INFO DENIED:</span>{" "}
                {latestDecision.unavailableInformation.length} items
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center bg-slate-950 rounded border border-slate-800 text-slate-500 italic">
            Standing by. Trainee has not yet been forced to submit an operational decision.
          </div>
        )}
      </div>

      {/* Live Event Timeline & Transmissions Stream */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Recent Events */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="font-bold text-slate-300 mb-2 flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>RECENT INJECT &amp; SYSTEM TIMELINE</span>
          </div>
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {state.eventLog.slice(-6).reverse().map((evt) => (
              <div key={evt.id} className="p-2 rounded bg-slate-950 border border-slate-800/80 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span className="text-cyan-400 font-bold">{evt.time}</span>
                  <span className="text-[9px] uppercase text-slate-500">{evt.category}</span>
                </div>
                <div className="font-bold text-slate-200 mt-0.5">{evt.title}</div>
                <p className="text-slate-400 text-[10px] mt-0.5">{evt.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Radio Log */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="font-bold text-slate-300 mb-2 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>LIVE RADIO COMM TRAFFIC</span>
          </div>
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {state.messages.slice(-5).reverse().map((msg) => (
              <div key={msg.id} className="p-2 rounded bg-slate-950 border border-slate-800/80 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span className="text-slate-500 font-bold">{msg.formattedTime}</span>
                  <span className="text-cyan-400 font-bold">[{msg.sender}]</span>
                  <span className="text-[10px] text-slate-500 uppercase">{msg.status}</span>
                </div>
                <p className="text-slate-300 mt-1 leading-snug">{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
