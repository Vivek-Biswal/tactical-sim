import type { MapZone } from "../../lib/mapGeometry";
const colors = { restricted: "#A94A3F", assembly: "#556B3F", observation: "#B69B63" };
export function TacticalZones({ zones }: { zones: MapZone[] }) {
  return <g aria-label="Training zones" className="pointer-events-none">{zones.map(zone => {
    const x = zone.points.reduce((sum,p) => sum+p.x,0)/zone.points.length;
    const y = Math.min(...zone.points.map(p=>p.y))+20;
    return <g key={zone.id}><title>{zone.label}</title><polygon points={zone.points.map(p=>`${p.x},${p.y}`).join(" ")} fill={colors[zone.type]} fillOpacity={0.07} stroke={colors[zone.type]} strokeWidth={1.5} strokeDasharray="6 4" /><text x={x} y={y} textAnchor="middle" fill={colors[zone.type]} fontSize={9} fontWeight="bold">{zone.label}</text></g>;
  })}</g>;
}
