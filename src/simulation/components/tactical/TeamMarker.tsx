import type { TacticalUnit } from "../../types/scenario";
interface Props { unit: TacticalUnit; isSelected?: boolean; onSelect?: () => void; isStale?: boolean }
export function TeamMarker({ unit, isSelected = false, onSelect, isStale = false }: Props) {
  const color = isStale ? "#687066" : { friendly:"#556B3F", hostile:"#A94A3F", neutral:"#486D87", unknown:"#B87A3A" }[unit.faction];
  const label = unit.callsign || unit.name;
  const left = unit.x > 640;
  return <g data-marker="unit" role="button" tabIndex={0} aria-label={`Select ${unit.name}`} aria-pressed={isSelected}
    style={{transform:`translate(${unit.x}px, ${unit.y}px)`}} className={`cursor-pointer ${isStale ? "" : "motion-safe:transition-transform motion-safe:duration-1000 motion-safe:ease-linear"}`}
    onClick={e=>{e.stopPropagation();onSelect?.();}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();onSelect?.();}}}>
    <title>{`${unit.name} · ${unit.faction} · ${unit.status}${isStale ? " · Last known position" : ""}`}</title>
    <circle r={isSelected?23:18} fill={isSelected?"#EFE8D8":"#FFFFFF"} fillOpacity={0.8} stroke={color} strokeWidth={isSelected?2:1} strokeDasharray={isStale?"4 4":undefined}/>
    {unit.heading!==undefined && <line x1={0} y1={0} x2={Math.sin(unit.heading*Math.PI/180)*29} y2={-Math.cos(unit.heading*Math.PI/180)*29} stroke={color} strokeWidth={2}/>}
    {unit.faction==="hostile" ? <path d="M0 -12 L12 0 L0 12 L-12 0 Z" fill="#FAF0EF" stroke={color} strokeWidth={2}/> : unit.faction==="unknown" ? <><path d="M0 -12 L12 10 L-12 10 Z" fill="#FDF3E3" stroke={color} strokeWidth={2}/><text y={6} textAnchor="middle" fontSize={14} fontWeight="bold" fill={color}>?</text></> : <><rect x={-12} y={-9} width={24} height={18} rx={2} fill="#EEF3E8" stroke={color} strokeWidth={2}/><path d="M-8 -5 L8 5 M-8 5 L8 -5" stroke={color} strokeWidth={1.5}/></>}
    <g transform={`translate(${left?-22:22},-5)`}><rect x={left?-(label.length*7+8):-3} y={-10} width={label.length*7+8} height={18} fill="white" fillOpacity={0.9} rx={3}/><text textAnchor={left?"end":"start"} y={3} fill={color} fontSize={11} fontWeight="bold">{label}</text><text textAnchor={left?"end":"start"} y={20} fill="#687066" fontSize={9}>{isStale?"LAST KNOWN":`${Math.round(unit.x)}, ${Math.round(unit.y)}`}</text></g>
  </g>;
}
