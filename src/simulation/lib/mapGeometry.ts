import type { TacticalUnit } from "../types/scenario";

export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 600;
export interface Point { x: number; y: number }
export interface MapZone { id: string; label: string; type: "restricted" | "assembly" | "observation"; points: Point[] }
export const DEFAULT_ZONES: MapZone[] = [
  { id: "defile", label: "RESTRICTED · DEFILE BRAVO", type: "restricted", points: [{x:370,y:180},{x:490,y:140},{x:510,y:260},{x:390,y:300}] },
  { id: "rally", label: "ASSEMBLY · RALLY AREA", type: "assembly", points: [{x:40,y:465},{x:200,y:465},{x:200,y:585},{x:40,y:585}] },
  { id: "observe", label: "OBSERVATION · EAST RIDGE", type: "observation", points: [{x:560,y:60},{x:760,y:60},{x:760,y:160},{x:560,y:160}] },
];
export function clampPoint(point: Point): Point {
  return { x: Math.max(0, Math.min(MAP_WIDTH, point.x)), y: Math.max(0, Math.min(MAP_HEIGHT, point.y)) };
}
export function gridReference(point: Point) {
  const p = clampPoint(point);
  return `${String.fromCharCode(65 + Math.min(15, Math.floor(p.x / 50)))}${Math.min(12, Math.floor(p.y / 50) + 1)}`;
}
export function advanceUnit(unit: TacticalUnit, target: Point, distance: number): boolean {
  const dx = target.x - unit.x, dy = target.y - unit.y;
  const remaining = Math.hypot(dx, dy);
  if (remaining > 0) unit.heading = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
  if (remaining <= distance) {
    unit.x = target.x; unit.y = target.y; unit.status = "operational";
    delete unit.destination;
    return true;
  }
  unit.x += dx / remaining * distance; unit.y += dy / remaining * distance;
  unit.status = "moving";
  return false;
}
