import type { TrainingArea } from "../types/geography";
import type { Point } from "./mapGeometry";
import { MAP_WIDTH, MAP_HEIGHT } from "./mapGeometry";

export const TRAINING_AREAS: readonly TrainingArea[] = [
  { id: "nilgiri-demo", name: "Nilgiri hills — demo", latitude: 11.42, longitude: 76.70, widthMeters: 8000, heightMeters: 6000 },
];
export const DEFAULT_TRAINING_AREA = TRAINING_AREAS[0];
const METERS_PER_DEGREE = 111319.49079327358;
export interface GeoPoint { latitude: number; longitude: number }

export function trainingAreaError(area: TrainingArea): string | null {
  if (!area.name.trim() || area.name.length > 80) return "Enter an area name (up to 80 characters).";
  if (![area.latitude, area.longitude, area.widthMeters, area.heightMeters].every(Number.isFinite)) return "Enter valid coordinates and dimensions.";
  if (Math.abs(area.latitude) > 75 || Math.abs(area.longitude) > 180) return "Latitude must be between −75 and 75, longitude between −180 and 180.";
  if (area.widthMeters < 200 || area.widthMeters > 20000 || area.heightMeters < 200 || area.heightMeters > 20000) return "Area dimensions must be between 200 and 20,000 metres.";
  const halfWidth = area.widthMeters / (2 * METERS_PER_DEGREE * Math.cos(area.latitude * Math.PI / 180));
  if (Math.abs(area.longitude) + halfWidth > 180) return "Choose an area that does not cross the antimeridian.";
  return null;
}

/** Small-area equirectangular placement; north is grid y=0. No new simulation coordinates. */
export function gridToGeo(point: Point, area: TrainingArea): GeoPoint {
  return {
    latitude: area.latitude + (0.5 - point.y / MAP_HEIGHT) * area.heightMeters / METERS_PER_DEGREE,
    longitude: area.longitude + (point.x / MAP_WIDTH - 0.5) * area.widthMeters / (METERS_PER_DEGREE * Math.cos(area.latitude * Math.PI / 180)),
  };
}
export function geoToGrid(point: GeoPoint, area: TrainingArea): Point {
  return {
    x: (0.5 + (point.longitude - area.longitude) * METERS_PER_DEGREE * Math.cos(area.latitude * Math.PI / 180) / area.widthMeters) * MAP_WIDTH,
    y: (0.5 - (point.latitude - area.latitude) * METERS_PER_DEGREE / area.heightMeters) * MAP_HEIGHT,
  };
}
export function inTrainingGrid(point: Point): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x <= MAP_WIDTH && point.y >= 0 && point.y <= MAP_HEIGHT;
}
