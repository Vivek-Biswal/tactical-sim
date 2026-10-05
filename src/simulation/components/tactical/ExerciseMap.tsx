"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { TacticalMap, type TacticalMapProps } from "./TacticalMap";
import { DEFAULT_TRAINING_AREA } from "../../lib/geography";
import type { TrainingArea } from "../../types/geography";
import type { SimulationEventLog } from "../../types/exercise";

const RealWorldMap = dynamic(() => import("../geographic/RealWorldMap"), {
  ssr: false,
  loading: () => <p role="status" className="p-5 text-sm text-[#687066]">Loading 3D map…</p>,
});
export interface ExerciseMapProps extends TacticalMapProps {
  trainingArea?: TrainingArea;
  eventLog?: SimulationEventLog[];
  mapSnapshotSecond?: number;
}
export function ExerciseMap({ trainingArea = DEFAULT_TRAINING_AREA, eventLog = [], mapSnapshotSecond, className = "", ...mapProps }: ExerciseMapProps) {
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const container = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === container.current);
    document.addEventListener("fullscreenchange", update);
    return () => { document.removeEventListener("fullscreenchange", update); };
  }, []);
  async function expand() {
    setFullscreenError("");
    try {
      if (document.fullscreenElement === container.current) await document.exitFullscreen();
      else if (container.current?.requestFullscreen) await container.current.requestFullscreen();
      else setFullscreenError("Fullscreen is unavailable in this browser. Collapse the sidebar for more map space.");
    } catch { setFullscreenError("This browser could not open fullscreen. Collapse the sidebar for more map space."); }
  }
  return <div ref={container} className={`exercise-map flex min-h-0 flex-col gap-2 ${className}`}>
    <div role="group" aria-label="Map mode" className="flex flex-wrap gap-1">
      {([["2d", "2D Tactical Map"], ["3d", "3D Real-World Map"]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)} className={`rounded-lg border px-3 py-2 text-[10px] font-black ${mode === id ? "border-[#556B3F] bg-[#556B3F] text-white" : "border-[#D9D8CE] bg-white text-[#344438] hover:bg-[#EEF3E8]"}`}>{label}</button>)}
      <span className="self-center text-[10px] text-[#687066]">Same exercise · same unit positions</span>
      <button type="button" onClick={() => void expand()} className="ml-auto rounded-lg border border-[#D9D8CE] bg-white px-3 py-2 text-[10px] font-bold text-[#344438]">{fullscreen ? "Exit fullscreen" : "Fullscreen map"}</button>
    </div>
    {fullscreenError && <p role="status" className="text-xs text-[#8A5C2A]">{fullscreenError}</p>}
    <div className="min-h-0 flex-1">{mode === "2d"
      ? <TacticalMap {...mapProps} trainingArea={trainingArea} className="h-full" />
      : <RealWorldMap {...mapProps} trainingArea={trainingArea} eventLog={eventLog} mapSnapshotSecond={mapSnapshotSecond} className="h-full" />}
    </div>
  </div>;
}
