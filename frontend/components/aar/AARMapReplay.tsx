"use client";
import React, { useState, useMemo } from "react";
import { TacticalUnit } from "../../types/scenario";
import { SimulationEventLog } from "../../types/exercise";
import { TacticalMap } from "../tactical/TacticalMap";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";

interface AARMapReplayProps {
  events: SimulationEventLog[];
  initialUnits: TacticalUnit[];
  totalDurationSeconds: number;
}

function reconstructUnitsAtSecond(
  initialUnits: TacticalUnit[],
  events: SimulationEventLog[],
  targetSecond: number
): TacticalUnit[] {
  // Deep copy initial state
  const units: TacticalUnit[] = JSON.parse(JSON.stringify(initialUnits));

  // Replay events up to and including targetSecond
  const relevantEvents = events.filter(e => e.second <= targetSecond);

  for (const evt of relevantEvents) {
    const payload = evt.payload as any;
    if (!payload) continue;

    // Handle unit moves / status changes
    const unitId = payload.targetUnitId as string | undefined;
    if (!unitId) continue;

    const unit = units.find(u => u.id === unitId);
    if (!unit) continue;

    if (evt.category === "UNIT_MOVE" || evt.title?.includes("Move Unit") || evt.title?.includes("moved")) {
      if (payload.x !== undefined) unit.x = payload.x;
      if (payload.y !== undefined) unit.y = payload.y;
      if (payload.heading !== undefined) unit.heading = payload.heading;
      if (payload.sector !== undefined) unit.sector = payload.sector;
    }

    if (payload.status) unit.status = payload.status;
    if (payload.faction) unit.faction = payload.faction;
  }

  return units;
}

export const AARMapReplay: React.FC<AARMapReplayProps> = ({
  events,
  initialUnits,
  totalDurationSeconds
}) => {
  const [targetSecond, setTargetSecond] = useState(0);

  // Get unique seconds with events for stepping
  const eventSeconds = useMemo(() =>
    [...new Set([0, ...events.map(e => Math.floor(e.second)), totalDurationSeconds])].sort((a, b) => a - b),
    [events, totalDurationSeconds]
  );

  const currentIdx = eventSeconds.findIndex(s => s >= targetSecond);
  const displaySecond = eventSeconds[currentIdx] ?? targetSecond;

  const units = useMemo(
    () => reconstructUnitsAtSecond(initialUnits, events, displaySecond),
    [initialUnits, events, displaySecond]
  );

  const eventsAtThisSecond = events.filter(e => Math.floor(e.second) === Math.floor(displaySecond));

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const goToPrev = () => {
    const prevIdx = currentIdx - 1;
    if (prevIdx >= 0) setTargetSecond(eventSeconds[prevIdx]);
  };

  const goToNext = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < eventSeconds.length) setTargetSecond(eventSeconds[nextIdx]);
  };

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center space-x-2 text-slate-400">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400 font-bold text-base">{formatTime(displaySecond)}</span>
          <span className="text-slate-600">/ {formatTime(totalDurationSeconds)}</span>
        </div>

        <div className="flex items-center space-x-2 ml-auto">
          <button
            onClick={goToPrev}
            disabled={currentIdx <= 0}
            className="p-1.5 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-slate-500 text-[10px]">
            Event {currentIdx + 1} / {eventSeconds.length}
          </span>
          <button
            onClick={goToNext}
            disabled={currentIdx >= eventSeconds.length - 1}
            className="p-1.5 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Slider */}
        <div className="w-full">
          <input
            type="range"
            min={0}
            max={totalDurationSeconds}
            step={1}
            value={targetSecond}
            onChange={e => setTargetSecond(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
        </div>
      </div>

      {/* Map */}
      <div className="h-[400px] rounded-lg overflow-hidden border border-slate-800">
        <TacticalMap
          units={units}
          activityMarkers={[]}
          mapStatus="current"
          mapLastUpdated={`Replay at T+${formatTime(displaySecond)}`}
        />
      </div>

      {/* Events at this second */}
      {eventsAtThisSecond.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1.5">
          <div className="text-slate-500 font-bold text-[10px] uppercase mb-2">Events at T+{formatTime(displaySecond)}:</div>
          {eventsAtThisSecond.map(e => (
            <div key={e.id} className="flex items-start space-x-2 text-[11px]">
              <span className="text-slate-600 shrink-0">[{e.category}]</span>
              <span className="text-slate-200 font-bold">{e.title}</span>
              <span className="text-slate-400 truncate">— {e.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
