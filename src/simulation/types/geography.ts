/** Placement of the shared 800 × 600 simulation grid over an Indian training area. */
export type ForceProfile = "army" | "air_force" | "navy" | "joint";
export type UnitDomain = "ground" | "air" | "sea";
export type TerrainKind = "mountain" | "hills" | "range" | "valley" | "volcano" | "sea" | "river" | "lake" | "desert" | "forest";
export interface TrainingArea {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  widthMeters: number;
  heightMeters: number;
  forceProfile?: ForceProfile;
}
export interface TrainingPreset extends TrainingArea {
  region: string;
  terrain: TerrainKind;
  description: string;
  learningGoal: string;
  defaultForce: ForceProfile;
  supportedForces: ForceProfile[];
  surface: "land" | "water" | "coast" | "river" | "lake" | "island";
  landPolygons: { x: number; y: number }[][];
  waterPolygons: { x: number; y: number }[][];
  routes: Record<UnitDomain, { x: number; y: number }[]>;
  sourceUrl: string;
}
