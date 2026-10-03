import type { TacticalUnit } from "../../types/scenario";
import { domainOf } from "../../lib/training";
interface Props { unit: TacticalUnit; isSelected?: boolean; onSelect?: () => void; isStale?: boolean; markerScale?: number }
export function TeamMarker({ unit, isSelected = false, onSelect, isStale = false, markerScale = 1 }: Props) {
  const color = isStale ? "#687066" : { friendly:"#556B3F", hostile:"#A94A3F", neutral:"#486D87", unknown:"#B87A3A" }[unit.faction];
  const contactNumber = unit.name.match(/\d+$/)?.[0] ?? unit.id.match(/\d+$/)?.[0];
  const label = unit.faction === "unknown" ? contactNumber ? `Unknown ${contactNumber}` : unit.name : unit.callsign || unit.name;
  const left = unit.x + (label.length * 7 + 8 + 22) * markerScale > 800;
  const domain = domainOf(unit);
  return <g data-marker="unit" role="button" tabIndex={0} aria-label={`Select ${unit.name}`} aria-pressed={isSelected}
    style={{transform:`translate(${unit.x}px, ${unit.y}px)`}} className={`cursor-pointer ${isStale ? "" : "motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-linear"}`}
    onClick={e=>{e.stopPropagation();onSelect?.();}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();onSelect?.();}}}>
    <title>{`${unit.name} · ${domain === "air" ? "Aircraft" : domain === "sea" ? "Boat / ship" : "Ground team"} · ${unit.faction} · ${unit.status}${isStale ? " · Last known position" : ""}`}</title>
    <g transform={`scale(${markerScale})`}>
    <circle r={isSelected?23:18} fill={isSelected?"#EFE8D8":"#FFFFFF"} fillOpacity={0.8} stroke={color} strokeWidth={isSelected?2:1} strokeDasharray={isStale?"4 4":undefined}/>
    {domain === "air" ? <g transform={`rotate(${unit.heading ?? 0})`}><path d="M0-14l3 10L15 2v4L3 3v8l4 3v2l-7-2-7 2v-2l4-3V3L-15 6V2l12-6z" fill={color} stroke="white" strokeWidth={1}/></g> : domain === "sea" ? <g transform={`rotate(${unit.heading ?? 0})`}><path d="M0-14l8 9v13l-8 7-8-7V-5z" fill={color} stroke="white" strokeWidth={1.5}/><path d="M-3-4h6v8h-6z" fill="white" fillOpacity={0.8}/></g> : <>
      {unit.heading!==undefined && <line x1={0} y1={0} x2={Math.sin(unit.heading*Math.PI/180)*29} y2={-Math.cos(unit.heading*Math.PI/180)*29} stroke={color} strokeWidth={2}/>}
      {unit.faction==="hostile" ? <path d="M0 -12 L12 0 L0 12 L-12 0 Z" fill="#FAF0EF" stroke={color} strokeWidth={2}/> : unit.faction==="unknown" ? <><path d="M0 -12 L12 10 L-12 10 Z" fill="#FDF3E3" stroke={color} strokeWidth={2}/><text y={6} textAnchor="middle" fontSize={14} fontWeight="bold" fill={color}>?</text></> : <><rect x={-12} y={-9} width={24} height={18} rx={2} fill="#EEF3E8" stroke={color} strokeWidth={2}/><path d="M-8 -5 L8 5 M-8 5 L8 -5" stroke={color} strokeWidth={1.5}/></>}
    </>}
    {unit.faction === "unknown" && domain !== "ground" && <text x={11} y={-8} fill={color} fontWeight="bold" fontSize={13}>?</text>}
    <g transform={`translate(${left?-22:22},-5)`}><rect x={left?-(label.length*7+8):-3} y={-10} width={label.length*7+8} height={18} fill="white" fillOpacity={0.9} rx={3}/><text textAnchor={left?"end":"start"} y={3} fill={color} fontSize={11} fontWeight="bold">{label}</text><text textAnchor={left?"end":"start"} y={20} fill="#687066" fontSize={9}>{isStale?"LAST KNOWN":`${Math.round(unit.x)}, ${Math.round(unit.y)}`}</text></g>
    </g>
  </g>;
}
