"use client";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PanelCard } from "@/components/ui/PanelCard";
import { useOfflineExercise, OfflineMap, OfflineSituation, OfflineComms, OfflineDecision, OfflineSetup, OfflineControls, OfflineReview } from "./OfflineExercise";
import { ExerciseNavigation, formatExerciseTime, type ExerciseSection } from "./ExerciseNavigation";

export function OfflineWorkspace({ id, role, section, basePath }: { id: string; role: string; section: ExerciseSection; basePath: string }) {
  const { state, engine } = useOfflineExercise(id);
  const [radioDraft, setRadioDraft] = useState("");
  const [rationaleDraft, setRationaleDraft] = useState("");
  const instructor = role === "INSTRUCTOR";
  const team = role.startsWith("TEAM");
  const title = id === "map-practice" ? "Training maps" : instructor ? "Instructor" : team ? "Field team" : "Commander";
  return <AppShell pageTitle={`${title.toUpperCase()} · ${id}`} role={instructor ? "instructor" : team ? "team" : "commander"} workspace>
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 bg-[#263229] px-4 py-3 text-white">
      <div className="min-w-0"><Link href={instructor ? "/instructor" : team ? "/team" : "/commander"} className="text-[10px] text-[#D8C7A5]">← {title} overview</Link><h1 className="mt-1 text-sm font-black">{state.scenarioName}<span className="ml-2 font-normal text-[#D8C7A5]">· Local practice</span></h1></div>
      <div className="flex flex-wrap items-center gap-3 text-xs"><span className="capitalize text-[#D8C7A5]">{state.status}</span><span role="timer" aria-label="Exercise clock" className="whitespace-nowrap font-mono tabular-nums"><strong>{formatExerciseTime(state.elapsedSeconds)}</strong> / {formatExerciseTime(state.totalDuration)}</span><span className="hidden whitespace-nowrap font-mono tabular-nums text-[#D8C7A5] sm:inline">{formatExerciseTime(state.totalDuration - state.elapsedSeconds, true)} left</span>{section === "map" && <button className="rounded border border-[#71805A] px-3 py-2 text-xs font-bold disabled:opacity-40" disabled={state.status === "completed"} onClick={() => state.status === "pending" ? engine.start() : state.status === "running" ? engine.pause() : engine.resume()}>{state.status === "running" ? "Pause" : state.status === "paused" ? "Resume" : "Start"}</button>}</div>
    </header>
    <ExerciseNavigation basePath={basePath} section={section} instructor={instructor} offline decisionRequired={Boolean(state.activeDecisionPoint)} />
    <div className={`min-h-0 flex-1 ${section === "map" ? "overflow-y-auto p-3" : "overflow-y-auto p-4 md:p-6"}`}>
      {section === "map" ? <div className="h-full min-h-[500px]"><OfflineMap state={state} engine={engine} compact /></div> : <div className="mx-auto max-w-4xl space-y-5">
        {section === "setup" && <OfflineSetup state={state} engine={engine} />}
        {section === "controls" && <OfflineControls state={state} engine={engine} instructor={instructor} />}
        {section === "situation" && <OfflineSituation state={state} />}
        {section === "communications" && <OfflineComms state={state} engine={engine} draft={{ value: radioDraft, setValue: setRadioDraft }} sender={title} senderRole={role} />}
        {section === "decisions" && (team || instructor ? <PanelCard header="Recorded decisions"><p className="text-sm text-[#687066]">Commander decisions are recorded in this exercise’s review.</p><Link href={`${basePath}/review`} className="mt-4 inline-block text-sm font-bold text-[#556B3F]">Open review →</Link></PanelCard> : <OfflineDecision state={state} engine={engine} draft={{ value: rationaleDraft, setValue: setRationaleDraft }} />)}
        {section === "review" && <OfflineReview state={state} engine={engine} role={title} />}
      </div>}
    </div>
  </AppShell>;
}
