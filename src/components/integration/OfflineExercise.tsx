"use client";

import { useEffect, useState } from "react";
import { LocalSimulationEngine } from "@/simulation/lib/simulation";
import { ExerciseState } from "@/simulation/types/exercise";
import { ExerciseMap } from "@/simulation/components/tactical/ExerciseMap";
import { TrainingAreaFields } from "@/simulation/components/geographic/TrainingAreaFields";
import { DEFAULT_TRAINING_AREA } from "@/simulation/lib/geography";
import { PanelCard } from "@/components/ui/PanelCard";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { AARReview } from "@/components/aar/AARReview";
import { saveLocalReport } from "@/simulation/lib/aar";

export function useOfflineExercise(id: string) {
  const { user } = useAuth();
  const [engine] = useState(() => new LocalSimulationEngine(id));
  const [state, setState] = useState<ExerciseState>(() => engine.getState());
  useEffect(() => {
    const unsubscribe = engine.subscribe(setState);
    return () => { unsubscribe(); engine.dispose(); };
  }, [engine]);
  useEffect(() => {
    if (state.status === "completed") saveLocalReport(engine.generateAAR(), user?.uid ?? null);
  }, [engine, state.status, user?.uid]);
  return { engine, state };
}

const button = "rounded border border-[#D9D8CE] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#344438] hover:bg-[#EEF3E8] disabled:opacity-40";

export function OfflineMap({ state, engine, compact = false }: { state: ExerciseState; engine: LocalSimulationEngine; compact?: boolean }) {
  function exportReport() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(engine.generateAAR(), null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `aar-${state.exerciseId}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="flex h-full min-h-[360px] flex-col gap-2">
    {!compact && <div className="flex flex-wrap items-center gap-2">
      <span className="text-[9px] font-black uppercase tracking-widest text-[#687066]">Offline training · {Math.round(state.totalDuration / 60)} min · {state.status}</span>
      <button className={button} disabled={state.status === "completed"} onClick={() => state.status === "pending" ? engine.start() : state.status === "running" ? engine.pause() : engine.resume()}>{state.status === "running" ? "Pause" : state.status === "paused" ? "Resume" : "Start"}</button>
      {!compact && <><button className={button} onClick={() => engine.reset()}>Reset</button>
      <button className={button} onClick={() => engine.end()} disabled={state.status === "completed"}>End</button>
      <button className={button} onClick={exportReport}>Export AAR</button></>}
      <label className="text-[10px] font-bold text-[#687066]">Speed <select aria-label="Simulation speed" value={state.speedMultiplier} onChange={event => engine.setSpeed(Number(event.target.value))} className="ml-1 rounded border border-[#D9D8CE] bg-white p-2"><option value={0.5}>Slow · 0.5×</option><option value={1}>Normal · 1×</option><option value={2}>Fast · 2×</option><option value={4}>Very fast · 4×</option></select></label>
      {!compact && <label className="text-[10px] font-bold text-[#687066]">Map feed <select aria-label="Map feed" disabled={state.status === "completed"} value={state.mapStatus} onChange={event => engine.applyInstructorInject(event.target.value === "current" ? "restore_map" : event.target.value === "outdated" ? "outdate_map" : "unavailable_map")} className="ml-1 rounded border border-[#D9D8CE] bg-white p-2"><option value="current">Current · live positions</option><option value="outdated">Outdated · last known positions</option><option value="unavailable">Unavailable · no positions</option></select></label>}
    </div>}
    {!compact && <details open={state.status === "pending"} className="flex-shrink-0 rounded-lg border border-[#D9D8CE] bg-white px-3 py-2 text-xs text-[#344438]">
      <summary className="cursor-pointer font-bold">Training area and forces · {state.trainingArea?.name ?? DEFAULT_TRAINING_AREA.name}</summary>
      <div className="mt-2 max-h-[240px] overflow-y-auto"><TrainingAreaFields value={state.trainingArea ?? DEFAULT_TRAINING_AREA} onChange={area => engine.setTrainingArea(area)} disabled={state.status !== "pending"} /></div>
      {state.status !== "pending" && <p className="mt-2 text-[10px] text-[#687066]">Reset the exercise to choose another area or force.</p>}
    </details>}
    <ExerciseMap compact={compact} trainingArea={state.trainingArea} eventLog={state.eventLog} mapSnapshotSecond={state.mapSnapshotSecond} units={state.units} activityMarkers={state.activityMarkers} mapStatus={state.mapStatus} mapLastUpdated={state.mapLastUpdated} movementEnabled={state.status === "running"} onUnitMove={(id, point) => { engine.moveTeam(id, point); }} className="flex-1 min-h-0" />
    {!compact && <p className="text-[10px] text-[#687066]">Start to watch simulated patrols. Select a friendly unit, then choose a destination to take control. Ground teams stay on land; boats stay on water; aircraft fly over both. Pause freezes the exercise. Both map views use the same positions.</p>}
  </div>;
}

export function OfflineSetup({ state, engine }: { state: ExerciseState; engine: LocalSimulationEngine }) {
  return <PanelCard header="Training setup"><p className="mb-4 text-sm text-[#687066]">Choose your training area and force before starting. Switching exercise tools keeps your practice running; a full browser refresh starts a new practice.</p><TrainingAreaFields value={state.trainingArea ?? DEFAULT_TRAINING_AREA} onChange={area => engine.setTrainingArea(area)} disabled={state.status !== "pending"} /><div className="mt-5"><OfflineControls state={state} engine={engine} /></div></PanelCard>;
}

export function OfflineControls({ state, engine, instructor = false }: { state: ExerciseState; engine: LocalSimulationEngine; instructor?: boolean }) {
  return <PanelCard header="Practice controls">
    <div className="flex flex-wrap gap-2"><button className={button} disabled={state.status === "completed"} onClick={() => state.status === "pending" ? engine.start() : state.status === "running" ? engine.pause() : engine.resume()}>{state.status === "running" ? "Pause" : state.status === "paused" ? "Resume" : "Start"}</button><button className={button} onClick={() => engine.reset()}>Reset practice</button><button className={button} disabled={state.status === "completed"} onClick={() => engine.end()}>End practice</button></div>
    <div className="mt-5 flex flex-wrap gap-4"><label className="text-xs font-bold text-[#344438]">Speed<select aria-label="Simulation speed" value={state.speedMultiplier} disabled={state.status === "completed"} onChange={event => engine.setSpeed(Number(event.target.value))} className="ml-2 rounded border border-[#D9D8CE] bg-white p-2">{[0.5, 1, 2, 4].map(speed => <option key={speed} value={speed}>{speed}×</option>)}</select></label>
    <label className="text-xs font-bold text-[#344438]">Map feed<select aria-label="Map feed" disabled={state.status === "completed"} value={state.mapStatus} onChange={event => engine.applyInstructorInject(event.target.value === "current" ? "restore_map" : event.target.value === "outdated" ? "outdate_map" : "unavailable_map")} className="ml-2 rounded border border-[#D9D8CE] bg-white p-2"><option value="current">Current · live positions</option><option value="outdated">Outdated · last known positions</option><option value="unavailable">Unavailable · no positions</option></select></label></div>
    {instructor && <div className="mt-5 flex flex-wrap gap-2"><button className={button} disabled={!["running", "paused"].includes(state.status)} onClick={() => engine.applyInstructorInject("set_comms", { status: "delayed", delay: 10 })}>Delay radio</button><button className={button} disabled={!["running", "paused"].includes(state.status)} onClick={() => engine.applyInstructorInject("set_comms", { status: "offline", loss: 100 })}>Radio dropout</button><button className={button} disabled={!["running", "paused"].includes(state.status)} onClick={() => engine.applyInstructorInject("set_comms", { status: "normal" })}>Restore radio</button><button className={button} disabled={!["running", "paused"].includes(state.status)} onClick={() => engine.applyInstructorInject("conflicting_report")}>Conflicting reports</button></div>}
    <p className="mt-3 text-xs text-[#687066]">Reset clears this practice’s decisions and timeline. Export your review first.</p>
  </PanelCard>;
}

export function OfflineReview({ state, engine, role = "Commander" }: { state: ExerciseState; engine: LocalSimulationEngine; role?: string }) {
  const report = engine.generateAAR();
  if (!report.isFinal) {
    // Live local review must respect the same denied feeds as the trainee screens.
    const receivedIds = new Set(report.messages.filter(m => m.deliveryStatus === "DELIVERED").map(m => m.id));
    report.messages = report.messages.filter(m => receivedIds.has(m.id));
    report.pendingMessages = [];
    report.fullEventLog = report.fullEventLog.filter(event => (!event.payload?.messageId || receivedIds.has(String(event.payload.messageId))) && (state.mapStatus === "current" || !["UNIT_MOVE", "CONTACT_DETECTED", "STATUS_CHANGE"].includes(event.category)));
  }
  return <div className="space-y-4"><div className="flex flex-wrap items-center gap-2"><button className={button} disabled={state.status === "completed"} onClick={() => engine.end()}>End practice</button>{state.status === "completed" && <Link className={button} href={`/aar/${encodeURIComponent(state.exerciseId)}`}>Open full review</Link>}<span className="text-xs text-[#687066]">{state.status === "completed" ? "Final local record" : "Live preview · undelivered content withheld"}</span></div><AARReview report={report} role={role} local /></div>;
}

export function OfflineSituation({ state }: { state: ExerciseState }) {
  return <PanelCard header={<span className="text-xs font-black uppercase tracking-widest text-[#344438]">Current Situation</span>}>
    <p className="text-sm font-black uppercase text-[#263229]">Comms: {state.commsStatus}</p>
    <p className="mt-2 text-xs text-[#687066]">Map: {state.mapStatus} · {state.mapLastUpdated}</p>
    <h3 className="mt-5 text-[10px] font-black uppercase text-[#556B3F]">Available information</h3>
    <ul className="mt-2 space-y-2 text-xs text-[#344438]">{state.availableInformation.map(info => <li key={info}>{info}</li>)}</ul>
    <h3 className="mt-5 text-[10px] font-black uppercase text-[#A94A3F]">Unavailable information</h3>
    <ul className="mt-2 space-y-2 text-xs text-[#687066]">{state.unavailableInformation.length ? state.unavailableInformation.map(info => <li key={info}>{info}</li>) : <li>None reported</li>}</ul>
    <h3 className="mt-5 text-[10px] font-black uppercase text-[#344438]">Exercise timeline</h3>
    <ol className="mt-2 space-y-3 text-xs text-[#687066]">{state.eventLog.filter(event => state.mapStatus === "current" || !["UNIT_MOVE", "CONTACT_DETECTED", "STATUS_CHANGE"].includes(event.category)).slice(-6).reverse().map(event => <li key={event.id}><span className="font-mono text-[#8A5C2A]">{event.time}</span> {event.title}</li>)}</ol>
  </PanelCard>;
}

export function OfflineComms({ state, engine, draft, sender = "Commander", senderRole = "COMMANDER" }: { state: ExerciseState; engine: LocalSimulationEngine; draft?: { value: string; setValue: (value: string) => void }; sender?: string; senderRole?: string }) {
  const [localMessage, setLocalMessage] = useState("");
  const message = draft?.value ?? localMessage;
  const setMessage = draft?.setValue ?? setLocalMessage;
  return <PanelCard header={<span className="text-xs font-black uppercase tracking-widest text-[#344438]">Communication · {state.commsStatus}</span>}>
    <p className="text-xs text-[#687066]">Delay {state.radioDelaySeconds}s · loss {state.messageLossPercentage}%</p>
    <div className="my-4 space-y-3">{state.messages.filter(msg => msg.deliveryStatus === "DELIVERED").map(msg => <div key={msg.id} className="rounded border border-[#D9D8CE] bg-[#F7F5EE] p-3 text-xs text-[#263229]"><p className="mb-1 font-black text-[#556B3F]">{msg.formattedTimeDelivered} · {msg.sender}</p>{msg.content}{msg.isConflicting && <p className="mt-1 font-bold text-[#A94A3F]">Conflicting report — verify independently</p>}</div>)}</div>
    {!state.messages.some(msg => msg.deliveryStatus === "DELIVERED") && <p className="my-4 text-xs text-[#687066]">No reports received yet.</p>}
    <p className="text-[10px] text-[#8A5C2A]">{state.pendingMessages.length} transmissions pending. Dropped report contents are withheld; delivery outcomes are included in AAR.</p>
    <form className="mt-4 space-y-2" onSubmit={event => { event.preventDefault(); if (message.trim()) { engine.sendRadioMessage(sender, senderRole, message.trim()); setMessage(""); } }}>
      <label className="block text-[10px] font-black uppercase text-[#344438]" htmlFor="offline-radio">Transmit report</label>
      <textarea id="offline-radio" value={message} onChange={event => setMessage(event.target.value)} className="w-full rounded border border-[#D9D8CE] p-2 text-xs" />
      <button className={button} disabled={!message.trim() || state.status !== "running"}>Send</button>
    </form>
  </PanelCard>;
}

export function OfflineDecision({ state, engine, draft }: { state: ExerciseState; engine: LocalSimulationEngine; draft?: { value: string; setValue: (value: string) => void } }) {
  const [localRationale, setLocalRationale] = useState("");
  const [confidence, setConfidence] = useState<"low" | "medium" | "high">("medium");
  const rationale = draft?.value ?? localRationale;
  const setRationale = draft?.setValue ?? setLocalRationale;
  const point = state.activeDecisionPoint;
  return <PanelCard header={<span className="text-xs font-black uppercase tracking-widest text-[#344438]">Commander Decision</span>}>
    {point ? <><h3 className="font-black text-[#263229]">{point.title}</h3><p className="my-3 text-xs text-[#687066]">{point.situation}</p>
      <label className="text-[10px] font-black uppercase text-[#344438]" htmlFor="decision-rationale">Decision rationale</label>
      <textarea id="decision-rationale" value={rationale} onChange={event => setRationale(event.target.value)} className="my-2 w-full rounded border border-[#D9D8CE] p-2 text-xs" placeholder="Explain your assessment using the available information" />
      <label className="mb-3 block text-xs text-[#344438]">Your confidence<select aria-label="Decision confidence" className="ml-2 rounded border border-[#D9D8CE] bg-white p-2" value={confidence} onChange={event => setConfidence(event.target.value as "low" | "medium" | "high")}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
      <div className="space-y-2">{point.availableActions.map(action => <button key={action.id} className={`${button} w-full text-left`} disabled={!rationale.trim() || !["running", "paused"].includes(state.status)} onClick={() => { engine.submitDecision(action.label, rationale.trim(), confidence, "COMMANDER_1", action.id); setRationale(""); }}><span className="block">{action.label}</span><span className="mt-1 block font-normal normal-case tracking-normal">{action.description}</span></button>)}</div>
    </> : <p className="text-xs text-[#687066]">{state.status === "pending" ? "Start the exercise to receive scenario events." : "No active decision point. Monitor the map and incoming reports."}</p>}
    <div className="mt-5 space-y-3">{state.decisions.map(decision => <div key={decision.id} className="rounded border border-[#D9D8CE] bg-[#EEF3E8] p-3 text-xs text-[#344438]"><p className="font-black">{decision.simulationTime} · {decision.selectedActionLabel}</p><p className="mt-1">{decision.rationale}</p></div>)}</div>
  </PanelCard>;
}
