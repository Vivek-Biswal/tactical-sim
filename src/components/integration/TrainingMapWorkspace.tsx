"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ClipboardList, FileText, Map, Radio, Settings2, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { DEFAULT_TRAINING_AREA } from "@/simulation/lib/geography";
import { formatExerciseTime, type ExerciseSection } from "./ExerciseNavigation";
import {
  useOfflineExercise,
  OfflineMap,
  OfflineSetup,
  OfflineSituation,
  OfflineComms,
  OfflineDecision,
  OfflineReview,
} from "./OfflineExercise";

type MapTool = Exclude<ExerciseSection, "map" | "controls">;

const tools = [
  { id: "setup", label: "Setup & controls", icon: Settings2 },
  { id: "situation", label: "Situation", icon: Activity },
  { id: "communications", label: "Communications", icon: Radio },
  { id: "decisions", label: "Decisions", icon: ClipboardList },
  { id: "review", label: "Review & export", icon: FileText },
] as const;

function toolForSection(section: ExerciseSection): MapTool | null {
  return section === "map" ? null : section === "controls" ? "setup" : section;
}

export function TrainingMapWorkspace({ section }: { section: ExerciseSection }) {
  const { user } = useAuth();
  return <PracticeMaps key={user?.uid ?? "local"} section={section} />;
}

function PracticeMaps({ section }: { section: ExerciseSection }) {
  const { state, engine } = useOfflineExercise("map-practice");
  // Legacy /maps/section links still open the corresponding tool. Tool buttons
  // stay on this page so the map, simulation and unsent drafts remain mounted.
  const [selection, setSelection] = useState({ route: section, tool: toolForSection(section) });
  const [radioDraft, setRadioDraft] = useState("");
  const [rationaleDraft, setRationaleDraft] = useState("");
  const scrollArea = useRef<HTMLDivElement>(null);
  const toolPanel = useRef<HTMLElement>(null);
  const activeTool = selection.route === section ? selection.tool : toolForSection(section);
  const toolLabel = tools.find(tool => tool.id === activeTool)?.label;
  const trainingArea = state.trainingArea ?? DEFAULT_TRAINING_AREA;

  useEffect(() => {
    // On narrower screens tools sit below the map. Bring the selected tool
    // into view instead of making the user search for it below the fold.
    if (activeTool && window.matchMedia("(max-width: 1279px)").matches) {
      toolPanel.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, [activeTool]);

  function closeTool() {
    setSelection({ route: section, tool: null });
    scrollArea.current?.scrollTo({ top: 0 });
    document.getElementById("training-map-only")?.focus();
  }

  return (
    <AppShell pageTitle="TRAINING MAPS" workspace>
      <section aria-label="Training map workspace" className="flex min-h-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-[#D9D8CE] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#263229] px-4 py-3 text-white">
            <div className="min-w-0">
              <h1 className="text-sm font-black">{state.scenarioName}</h1>
              <p className="mt-1 text-[10px] text-[#D8C7A5]">Local practice · {trainingArea.name}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="capitalize text-[#D8C7A5]">{state.status}</span>
              <span role="timer" aria-label="Exercise clock" className="whitespace-nowrap font-mono tabular-nums">
                <strong>{formatExerciseTime(state.elapsedSeconds)}</strong> / {formatExerciseTime(state.totalDuration)}
              </span>
              <span className="hidden whitespace-nowrap font-mono tabular-nums text-[#D8C7A5] sm:inline">
                {formatExerciseTime(state.totalDuration - state.elapsedSeconds, true)} left
              </span>
              <button
                type="button"
                disabled={state.status === "completed"}
                onClick={() => state.status === "pending" ? engine.start() : state.status === "running" ? engine.pause() : engine.resume()}
                className="rounded border border-[#71805A] px-4 py-2 text-[10px] font-black hover:bg-[#344438] focus-visible:outline-2 focus-visible:outline-white disabled:opacity-40"
              >
                {state.status === "running" ? "Pause" : state.status === "paused" ? "Resume" : state.status === "completed" ? "Completed" : "Start"}
              </button>
            </div>
          </div>
          <nav aria-label="Training map tools" className="flex gap-1 overflow-x-auto p-2 [scrollbar-width:thin]">
            <button
              id="training-map-only"
              type="button"
              aria-pressed={!activeTool}
              onClick={closeTool}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold focus-visible:outline-2 focus-visible:outline-[#556B3F] ${!activeTool ? "bg-[#EEF3E8] text-[#344438]" : "text-[#687066] hover:bg-[#F7F5EE]"}`}
            >
              <Map size={15} aria-hidden="true" />Tactical map
            </button>
            {tools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-expanded={activeTool === id}
                aria-controls={activeTool === id ? "training-map-tool-panel" : undefined}
                onClick={() => activeTool === id ? closeTool() : setSelection({ route: section, tool: id })}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold focus-visible:outline-2 focus-visible:outline-[#556B3F] ${activeTool === id ? "bg-[#556B3F] text-white" : "text-[#687066] hover:bg-[#F7F5EE]"}`}
              >
                <Icon size={15} aria-hidden="true" />{label}
                {id === "decisions" && state.activeDecisionPoint && <span className="rounded bg-[#A94A3F] px-1.5 py-0.5 text-[9px] text-white">Action needed</span>}
              </button>
            ))}
          </nav>
        </header>

        <div ref={scrollArea} className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className={`grid gap-3 ${activeTool ? "xl:h-full xl:min-h-[460px] xl:grid-cols-[minmax(0,1fr)_360px] xl:grid-rows-[minmax(0,1fr)]" : "h-full min-h-[460px] grid-cols-1 grid-rows-[minmax(0,1fr)]"}`}>
            <div className={`min-w-0 ${activeTool ? "h-[max(460px,55vh)] xl:h-full" : "h-full min-h-[460px]"}`}>
              <OfflineMap state={state} engine={engine} compact />
            </div>

            {activeTool && (
              <aside
                ref={toolPanel}
                id="training-map-tool-panel"
                aria-labelledby="training-map-tool-title"
                className="flex min-h-0 flex-col rounded-xl border border-[#D9D8CE] bg-[#F7F5EE] xl:h-full"
                onKeyDown={event => { if (event.key === "Escape") closeTool(); }}
              >
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#D9D8CE] px-4 py-3">
                  <h2 id="training-map-tool-title" className="text-sm font-black text-[#344438]">{toolLabel}</h2>
                  <button type="button" onClick={closeTool} aria-label="Close tool panel" title="Show map only" className="rounded p-1.5 text-[#687066] hover:bg-[#E7E7DF] focus-visible:outline-2 focus-visible:outline-[#556B3F]">
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="min-h-0 space-y-3 p-3 xl:flex-1 xl:overflow-y-auto">
                  {activeTool === "setup" && <OfflineSetup state={state} engine={engine} />}
                  {activeTool === "situation" && <OfflineSituation state={state} />}
                  {activeTool === "communications" && <OfflineComms state={state} engine={engine} draft={{ value: radioDraft, setValue: setRadioDraft }} />}
                  {activeTool === "decisions" && <OfflineDecision state={state} engine={engine} draft={{ value: rationaleDraft, setValue: setRationaleDraft }} />}
                  {activeTool === "review" && <OfflineReview state={state} engine={engine} />}
                </div>
              </aside>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
