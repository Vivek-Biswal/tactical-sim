"use client";

import { useEffect, useState } from "react";
import { LocalSimulationEngine } from "../../../frontend/lib/simulation";
import { ExerciseState } from "../../../frontend/types/exercise";
import { TacticalMap } from "../../../frontend/components/tactical/TacticalMap";
import { PanelCard } from "@/components/ui/PanelCard";

export function useOfflineExercise(id: string) {
  const [engine] = useState(() => new LocalSimulationEngine(id));
  const [state, setState] = useState<ExerciseState>(() => engine.getState());
  useEffect(() => {
    const unsubscribe = engine.subscribe(setState);
    return () => { unsubscribe(); engine.dispose(); };
  }, [engine]);
  return { engine, state };
}

const button = "rounded border border-[#D9D8CE] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#344438] hover:bg-[#EEF3E8] disabled:opacity-40";

export function OfflineMap({ state, engine }: { state: ExerciseState; engine: LocalSimulationEngine }) {
  function exportReport() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(engine.generateAAR(), null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `aar-${state.exerciseId}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="flex h-full min-h-[360px] flex-col gap-2">
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[9px] font-black uppercase tracking-widest text-[#687066]">Offline training · 2 min · {state.status}</span>
      <button className={button} disabled={state.status === "completed"} onClick={() => state.status === "pending" ? engine.start() : state.status === "running" ? engine.pause() : engine.resume()}>{state.status === "running" ? "Pause" : state.status === "paused" ? "Resume" : "Start"}</button>
      <button className={button} onClick={() => engine.reset()}>Reset</button>
      <button className={button} onClick={() => engine.end()} disabled={state.status === "completed"}>End</button>
      <button className={button} onClick={exportReport}>Export AAR</button>
    </div>
    <TacticalMap units={state.units} activityMarkers={state.activityMarkers} mapStatus={state.mapStatus} mapLastUpdated={state.mapLastUpdated} className="flex-1 min-h-0" />
    <p className="text-[10px] text-[#687066]">Fictional local grid. Select a unit for details. Movement and degradation follow the scenario timeline.</p>
  </div>;
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
    <ol className="mt-2 space-y-3 text-xs text-[#687066]">{state.eventLog.slice(-6).reverse().map(event => <li key={event.id}><span className="font-mono text-[#8A5C2A]">{event.time}</span> {event.title}</li>)}</ol>
  </PanelCard>;
}

export function OfflineComms({ state, engine }: { state: ExerciseState; engine: LocalSimulationEngine }) {
  const [message, setMessage] = useState("");
  return <PanelCard header={<span className="text-xs font-black uppercase tracking-widest text-[#344438]">Communication · {state.commsStatus}</span>}>
    <p className="text-xs text-[#687066]">Delay {state.radioDelaySeconds}s · loss {state.messageLossPercentage}%</p>
    <div className="my-4 space-y-3">{state.messages.filter(msg => msg.deliveryStatus === "DELIVERED").map(msg => <div key={msg.id} className="rounded border border-[#D9D8CE] bg-[#F7F5EE] p-3 text-xs text-[#263229]"><p className="mb-1 font-black text-[#556B3F]">{msg.formattedTimeDelivered} · {msg.sender}</p>{msg.content}{msg.isConflicting && <p className="mt-1 font-bold text-[#A94A3F]">Conflicting report — verify independently</p>}</div>)}</div>
    {!state.messages.some(msg => msg.deliveryStatus === "DELIVERED") && <p className="my-4 text-xs text-[#687066]">No reports received yet.</p>}
    <p className="text-[10px] text-[#8A5C2A]">{state.pendingMessages.length} transmissions pending. Dropped report contents are withheld; delivery outcomes are included in AAR.</p>
    <form className="mt-4 space-y-2" onSubmit={event => { event.preventDefault(); if (message.trim()) { engine.sendRadioMessage("Commander", "COMMANDER", message.trim()); setMessage(""); } }}>
      <label className="block text-[10px] font-black uppercase text-[#344438]" htmlFor="offline-radio">Transmit report</label>
      <textarea id="offline-radio" value={message} onChange={event => setMessage(event.target.value)} className="w-full rounded border border-[#D9D8CE] p-2 text-xs" />
      <button className={button} disabled={!message.trim() || state.status !== "running"}>Send</button>
    </form>
  </PanelCard>;
}

export function OfflineDecision({ state, engine }: { state: ExerciseState; engine: LocalSimulationEngine }) {
  const [rationale, setRationale] = useState("");
  const point = state.activeDecisionPoint;
  return <PanelCard header={<span className="text-xs font-black uppercase tracking-widest text-[#344438]">Commander Decision</span>}>
    {point ? <><h3 className="font-black text-[#263229]">{point.title}</h3><p className="my-3 text-xs text-[#687066]">{point.situation}</p>
      <label className="text-[10px] font-black uppercase text-[#344438]" htmlFor="decision-rationale">Decision rationale</label>
      <textarea id="decision-rationale" value={rationale} onChange={event => setRationale(event.target.value)} className="my-2 w-full rounded border border-[#D9D8CE] p-2 text-xs" placeholder="Explain your assessment using the available information" />
      <div className="space-y-2">{point.availableActions.map(action => <button key={action.id} className={`${button} w-full text-left`} disabled={!rationale.trim()} onClick={() => { engine.submitDecision(action.label, rationale.trim(), "medium", "COMMANDER_1", action.id); setRationale(""); }}><span className="block">{action.label}</span><span className="mt-1 block font-normal normal-case tracking-normal">{action.description}</span></button>)}</div>
    </> : <p className="text-xs text-[#687066]">{state.status === "pending" ? "Start the exercise to receive scenario events." : "No active decision point. Monitor the map and incoming reports."}</p>}
    <div className="mt-5 space-y-3">{state.decisions.map(decision => <div key={decision.id} className="rounded border border-[#D9D8CE] bg-[#EEF3E8] p-3 text-xs text-[#344438]"><p className="font-black">{decision.simulationTime} · {decision.selectedActionLabel}</p><p className="mt-1">{decision.rationale}</p></div>)}</div>
  </PanelCard>;
}
