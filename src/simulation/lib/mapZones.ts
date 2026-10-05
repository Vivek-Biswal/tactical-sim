import type { TrainingArea } from "../types/geography";
import { getTrainingPreset } from "./geography";
import { DEFAULT_ZONES, type MapZone } from "./mapGeometry";

/** Exercise zones are schematic teaching overlays, never actual facilities. */
export function trainingZones(area?: TrainingArea): MapZone[] {
  const preset = area && getTrainingPreset(area);
  if (!preset) return DEFAULT_ZONES;
  const route = preset.routes[preset.defaultForce === "navy" || preset.surface === "island" ? "sea" : "ground"];
  const start = route[0] ?? { x: 120, y: 460 };
  const x = Math.max(5, Math.min(660, start.x - 50));
  const y = Math.max(5, Math.min(495, start.y - 40));
  return [
    { id: "meeting-area", label: "Team meeting area", type: "assembly", points: [{ x, y }, { x: x + 130, y }, { x: x + 130, y: y + 90 }, { x, y: y + 90 }] },
    { id: "observation-area", label: "Observation area", type: "observation", points: [{ x: 560, y: 50 }, { x: 750, y: 50 }, { x: 750, y: 130 }, { x: 560, y: 130 }] },
  ];
}
