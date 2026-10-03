"use client";
import Link from "next/link";
import { Play, Pause, RotateCcw, ArrowRight, MapPinned, Clock, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useOfflineExercise } from "@/components/integration/OfflineExercise";
import { TrainingAreaFields } from "@/simulation/components/geographic/TrainingAreaFields";
import { ExerciseMap } from "@/simulation/components/tactical/ExerciseMap";
import { DEFAULT_TRAINING_AREA, FORCE_LABELS } from "@/simulation/lib/geography";

const secondary = "inline-flex items-center gap-2 rounded-lg border border-[#D9D8CE] bg-white px-3 py-2 text-xs font-bold text-[#344438] hover:bg-[#EEF3E8] focus-visible:outline-2 focus-visible:outline-[#556B3F] disabled:opacity-40";

export default function TrainingMapsPage() {
  const { state, engine } = useOfflineExercise("map-practice");
  const area = state.trainingArea ?? DEFAULT_TRAINING_AREA;
  const running = state.status === "running";
  function exportReview() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(engine.generateAAR(), null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = "training-map-review.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <AppShell pageTitle="TRAINING MAPS" role="commander">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#71805A]">India · land, air & water</p><h1 className="mt-2 text-3xl font-black text-[#263229]">Find your training ground.</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#687066]">Explore ten environments, watch your units move, and practise making decisions when information changes.</p></div>
      <Link href="/training" className={secondary}>Create a shared exercise <ArrowRight size={14} aria-hidden="true" /></Link>
    </div>
    <div className="mb-5 grid gap-2 rounded-xl border border-[#D9D8CE] bg-white p-4 text-xs text-[#687066] sm:grid-cols-3">
      <p className="flex items-center gap-2"><MapPinned size={17} className="text-[#556B3F]" aria-hidden="true" /><span><strong className="text-[#344438]">1. Choose</strong> terrain and your training force.</span></p>
      <p className="flex items-center gap-2"><Play size={17} className="text-[#556B3F]" aria-hidden="true" /><span><strong className="text-[#344438]">2. Start</strong> to see live simulated movement.</span></p>
      <p className="flex items-center gap-2"><CheckCircle2 size={17} className="text-[#556B3F]" aria-hidden="true" /><span><strong className="text-[#344438]">3. Explore</strong> 2D/3D and select a unit to move it.</span></p>
    </div>
    <div className="grid items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <TrainingAreaFields value={area} onChange={next => engine.setTrainingArea(next)} disabled={state.status !== "pending"} />
        {state.status !== "pending" && <p className="rounded-lg border border-[#D9D8CE] bg-[#EEF3E8] p-3 text-xs text-[#344438]">Reset this practice exercise to choose another terrain or force.</p>}
        <div className="rounded-xl border border-[#D9D8CE] bg-white p-4 text-xs text-[#687066]">
          <h2 className="font-black text-[#344438]">What the map status means</h2>
          <p className="mt-3"><strong className="text-[#3A6B30]">Current:</strong> received unit positions update.</p>
          <p className="mt-2"><strong className="text-[#8A5C2A]">Outdated:</strong> last received positions stay frozen.</p>
          <p className="mt-2"><strong className="text-[#A94A3F]">Unavailable:</strong> position markers are hidden.</p>
          <p className="mt-3 border-t border-[#E7E7DF] pt-3 leading-relaxed">Single-browser practice · 2 minutes. Refresh clears this exercise. Use a shared exercise for multiplayer coordination and instructor controls.</p>
        </div>
      </aside>
      <div className="min-w-0 space-y-4">
        <div className="overflow-hidden rounded-xl border border-[#D9D8CE] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9D8CE] bg-[#F7F5EE] p-4">
            <div><p className="text-sm font-black text-[#263229]">{area.name}</p><p className="mt-1 text-[10px] text-[#687066]">{FORCE_LABELS[area.forceProfile ?? "army"]} · {state.status}</p></div>
            <div className="flex items-center gap-3"><span role="timer" className="flex items-center gap-1.5 font-mono text-sm font-bold text-[#344438]"><Clock size={14} aria-hidden="true" />{state.formattedTime} / 02:00</span>
              <button type="button" disabled={state.status === "completed"} onClick={() => running ? engine.pause() : state.status === "paused" ? engine.resume() : engine.start()} className="inline-flex items-center gap-2 rounded-lg bg-[#556B3F] px-4 py-2.5 text-xs font-black text-white hover:bg-[#465A33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#556B3F] disabled:opacity-40">{running ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}{running ? "Pause" : state.status === "paused" ? "Resume" : "Start practice"}</button>
              <button type="button" onClick={() => engine.reset()} className={secondary}><RotateCcw size={14} aria-hidden="true" />Reset</button></div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-b border-[#D9D8CE] px-4 py-3 text-xs text-[#687066]">
            <label className="font-bold">Speed<select aria-label="Practice speed" value={state.speedMultiplier} disabled={state.status === "completed"} onChange={event => engine.setSpeed(Number(event.target.value))} className="ml-2 rounded border border-[#D9D8CE] bg-white p-1.5">{[0.5, 1, 2, 5].map(speed => <option key={speed} value={speed}>{speed}×</option>)}</select></label>
            <label className="font-bold">Position updates<select aria-label="Position updates" value={state.mapStatus} disabled={state.status === "pending" || state.status === "completed"} onChange={event => engine.applyInstructorInject(event.target.value === "current" ? "restore_map" : event.target.value === "outdated" ? "outdate_map" : "unavailable_map")} className="ml-2 rounded border border-[#D9D8CE] bg-white p-1.5"><option value="current">Current · updating</option><option value="outdated">Outdated · frozen</option><option value="unavailable">Unavailable · hidden</option></select></label>
            <button type="button" className={`${secondary} ml-auto`} onClick={exportReview}>Export practice review</button>
          </div>
          <div className="h-[620px] min-w-0 p-3 sm:h-[760px]">
            <ExerciseMap trainingArea={area} eventLog={state.eventLog} mapSnapshotSecond={state.mapSnapshotSecond} units={state.units} activityMarkers={state.activityMarkers} mapStatus={state.mapStatus} mapLastUpdated={state.mapLastUpdated} movementEnabled={running} onUnitMove={(id, point) => { engine.moveTeam(id, point); }} className="h-full" />
          </div>
        </div>
        <section className="rounded-xl border border-[#D9D8CE] bg-white p-4" aria-label="Exercise activity">
          <h2 className="text-xs font-black text-[#344438]">Exercise activity</h2>
          <ol className="mt-3 space-y-2 text-xs text-[#687066]">{state.eventLog.slice(-4).reverse().map(event => <li key={event.id} className="flex gap-3"><span className="shrink-0 font-mono text-[#71805A]">{event.time}</span><span>{event.title}</span></li>)}</ol>
        </section>
      </div>
    </div>
  </AppShell>;
}
