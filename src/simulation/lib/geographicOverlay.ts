import type { TacticalMapProps } from "../components/tactical/TacticalMap";
import type { TrainingArea } from "../types/geography";
import type { SimulationEventLog } from "../types/exercise";
import { DEFAULT_ZONES } from "./mapGeometry";
import { gridToGeo, inTrainingGrid } from "./geography";

export interface GeographicOverlayInput extends TacticalMapProps {
  trainingArea: TrainingArea;
  eventLog?: SimulationEventLog[];
  mapSnapshotSecond?: number;
}
export function geographicOverlay(input: GeographicOverlayInput) {
  const { trainingArea: area, mapStatus = "current" } = input;
  const unavailable = mapStatus === "unavailable";
  return {
    units: unavailable ? [] : input.units.filter(inTrainingGrid).map(unit => ({
      ...unit, ...gridToGeo(unit, area),
      airborne: /uav|drone|aircraft|helicopter/i.test(unit.type),
      destinationGeo: unit.destination && inTrainingGrid(unit.destination) ? gridToGeo(unit.destination, area) : undefined,
    })),
    activities: unavailable ? [] : (input.activityMarkers ?? []).filter(inTrainingGrid).map(marker => ({ ...marker, ...gridToGeo(marker, area) })),
    zones: (input.zones ?? DEFAULT_ZONES).map(zone => ({ ...zone, coordinates: zone.points.map(p => gridToGeo(p, area)) })),
    // Positionless events belong in the timeline, never at an invented map location.
    events: unavailable ? [] : (input.eventLog ?? []).filter(event => {
      if (mapStatus === "outdated" && (input.mapSnapshotSecond === undefined || event.second > input.mapSnapshotSecond)) return false;
      const p = event.payload;
      return p && typeof p.x === "number" && typeof p.y === "number" && inTrainingGrid({ x: p.x, y: p.y });
    }).slice(-20).map(event => ({ ...event, ...gridToGeo({ x: event.payload!.x as number, y: event.payload!.y as number }, area) })),
  };
}
