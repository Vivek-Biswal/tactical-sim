import type { TrainingArea, UnitDomain } from "../types/geography";
import type { ActivityMarker, TacticalUnit } from "../types/scenario";
import { DEFAULT_TRAINING_AREA, getTrainingPreset, inTrainingGrid } from "./geography";
import type { Point } from "./mapGeometry";

/** Rendering and movement share the same domain metadata, including legacy units. */
export function domainOf(unit: TacticalUnit): UnitDomain {
  if (unit.domain) return unit.domain;
  if (/uav|aircraft|helicopter|drone/i.test(unit.type)) return "air";
  if (/ship|boat|vessel/i.test(unit.type)) return "sea";
  return "ground";
}

function inPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j], b = polygon[i];
    const cross = (point.x - a.x) * (b.y - a.y) - (point.y - a.y) * (b.x - a.x);
    if (Math.abs(cross) < 1e-8 && point.x >= Math.min(a.x, b.x) && point.x <= Math.max(a.x, b.x) && point.y >= Math.min(a.y, b.y) && point.y <= Math.max(a.y, b.y)) return true;
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** Fictional, shared exercise water mask; this is not a nautical chart. */
export function isWater(area: TrainingArea, point: Point): boolean {
  const preset = getTrainingPreset(area);
  if (!preset) return false;
  if (preset.surface === "water") return true;
  if (preset.surface === "coast" || preset.surface === "island") return !preset.landPolygons.some(polygon => inPolygon(point, polygon));
  return preset.waterPolygons.some(polygon => inPolygon(point, polygon));
}

export function movementError(unit: TacticalUnit, destination: Point, area: TrainingArea = DEFAULT_TRAINING_AREA): string | null {
  if (!inTrainingGrid(destination)) return "Choose a destination inside the training area.";
  const domain = domainOf(unit);
  if (domain === "air") return null;
  const needsWater = domain === "sea";
  const error = needsWater ? "Boats stay on water. Choose a water destination with a clear water route." : "Ground teams stay on land. Choose a land destination with a clear land route.";
  if (isWater(area, destination) !== needsWater) return error;
  // Check every crossing of the polygon edges, then each intervening segment.
  // Unlike fixed sampling this also rejects routes crossing narrow water strips.
  const preset = getTrainingPreset(area);
  const crossings = [0, 1];
  const dx = destination.x - unit.x, dy = destination.y - unit.y;
  for (const polygon of [...(preset?.landPolygons ?? []), ...(preset?.waterPolygons ?? [])]) {
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i], b = polygon[(i + 1) % polygon.length];
      const ex = b.x - a.x, ey = b.y - a.y;
      const denominator = dx * ey - dy * ex;
      if (Math.abs(denominator) < 1e-10) continue;
      const ax = a.x - unit.x, ay = a.y - unit.y;
      const t = (ax * ey - ay * ex) / denominator;
      const u = (ax * dy - ay * dx) / denominator;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) crossings.push(t);
    }
  }
  crossings.sort((a, b) => a - b);
  for (let i = 1; i < crossings.length; i++) {
    const t = (crossings[i] + crossings[i - 1]) / 2;
    if (isWater(area, { x: unit.x + dx * t, y: unit.y + dy * t }) !== needsWater) return error;
  }
  return null;
}

const NAMES: Record<UnitDomain, string[]> = {
  ground: ["Army Team Alpha", "Army Team Bravo", "Army Observer"],
  air: ["Aircraft Alpha", "Aircraft Bravo", "UAV Observer"],
  sea: ["Patrol Boat Alpha", "Patrol Boat Bravo", "Rescue Boat"],
};
const SPEED: Record<UnitDomain, number> = { ground: 10, sea: 15, air: 35 };

export function createTrainingUnits(area: TrainingArea, originalUnits: TacticalUnit[] = []): TacticalUnit[] {
  const preset = getTrainingPreset(area);
  if (!preset) return structuredClone(originalUnits);
  const force = area.forceProfile ?? preset.defaultForce;
  const hasGround = preset.routes.ground.length > 1;
  const hasSea = ["water", "coast", "river", "lake", "island"].includes(preset.surface) && preset.routes.sea.length > 1;
  let domains: UnitDomain[];
  if (force === "air_force") domains = ["air", "air", "air"];
  else if (force === "navy") domains = ["sea", "sea", "sea"];
  else if (force === "joint") domains = [hasGround ? "ground" : "sea", hasSea ? "sea" : "ground", "air"];
  else domains = ["ground", "ground", "ground"];
  const create = (id: string, domain: UnitDomain, index: number, contact = false): TacticalUnit => {
    const route = structuredClone(preset.routes[domain]);
    const spawnIndex = index % Math.max(1, route.length);
    const vertex = route[spawnIndex] ?? { x: 400, y: 300 };
    const nextVertex = route[(spawnIndex + 1) % Math.max(1, route.length)] ?? vertex;
    // Contacts start between patrol waypoints so the first frame is readable.
    const spawn = contact ? { x: (vertex.x + nextVertex.x) / 2, y: (vertex.y + nextVertex.y) / 2 } : vertex;
    const original = originalUnits.find(unit => unit.id === id);
    const airborneObserver = domain === "air" && (id === "unit-charlie");
    return {
      ...original,
      id,
      name: contact ? `Unknown ${domain === "sea" ? "Boat" : domain === "air" ? "Aircraft" : "Contact"} ${id.endsWith("1") ? "1" : "2"}` : NAMES[domain][index],
      callsign: contact ? "Unidentified" : ["Alpha", "Bravo", "Observer"][index],
      role: contact ? "Unidentified simulated activity" : ["Lead patrol", "Support patrol", domain === "sea" ? "Rescue support" : "Observation"][index],
      type: domain === "air" ? airborneObserver ? "UAV" : "Aircraft" : domain === "sea" ? "Boat" : "Infantry",
      faction: contact ? "unknown" : "friendly",
      x: spawn.x,
      y: spawn.y,
      heading: 0,
      domain,
      speedGridPerSecond: SPEED[domain] * (contact ? 0.8 : 1),
      patrolRoute: route,
      patrolIndex: (spawnIndex + 1) % Math.max(1, route.length),
      status: contact ? "unknown" : "operational",
      sector: area.name,
      communicationStatus: contact ? "LOST" : "NORMAL",
      ...(domain === "air" ? { altitudeMeters: airborneObserver ? 150 : index === 0 ? 400 : 600 } : {}),
    };
  };
  return [
    ...["unit-alpha", "unit-bravo", "unit-charlie"].map((id, index) => create(id, domains[index], index)),
    create("contact-1", domains[0], 2, true),
    create("contact-2", domains[2], 3, true),
  ];
}

export function trainingActivities(area: TrainingArea): ActivityMarker[] {
  const preset = getTrainingPreset(area);
  if (!preset) return [];
  const force = area.forceProfile ?? preset.defaultForce;
  const domain = force === "air_force" ? "air" : force === "navy" ? "sea" : preset.routes.ground.length ? "ground" : "sea";
  const route = preset.routes[domain];
  const checkpoint = route[1] ?? { x: 400, y: 300 }, objective = route[2] ?? checkpoint;
  return [
    { id: "checkpoint-7a", label: domain === "air" ? "Flight waypoint" : domain === "sea" ? "Water checkpoint" : "Route checkpoint", ...checkpoint, type: "checkpoint", status: "active" },
    { id: "objective-7", label: "Observation area", ...objective, type: "objective", status: "active" },
  ];
}
