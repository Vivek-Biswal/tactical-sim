import type { ActivityMarker as Activity } from "../../types/scenario";
interface Props { marker: Activity; onSelect?: () => void; selected?: boolean; isStale?: boolean }
export function ActivityMarker({ marker, onSelect, selected, isStale }: Props) {
  const color = marker.status==="cleared" ? "#687066" : marker.type==="hostile_jammer" ? "#A94A3F" : marker.type==="contact_warning" ? "#B87A3A" : "#556B3F";
  const left = marker.x>600;
  return <g data-marker="activity" transform={`translate(${marker.x},${marker.y})`} role="button" tabIndex={0} aria-label={`Inspect ${marker.label}`} aria-pressed={!!selected} className="cursor-pointer"
    onClick={e=>{e.stopPropagation();onSelect?.();}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();onSelect?.();}}}>
    <title>{`${marker.label} · ${marker.type} · ${marker.status}${isStale?" · Last known":""}`}</title>
    <circle r={selected?28:22} fill={color} fillOpacity={0.08} stroke={color} strokeDasharray="3 4" />
    {marker.type==="hostile_jammer" ? <><circle r={38} fill="none" stroke={color} strokeOpacity={0.35}/><path d="M0 -13 L13 0 L0 13 L-13 0 Z" fill="#FAF0EF" stroke={color}/><text y={4} textAnchor="middle" fontSize={10} fontWeight="bold" fill={color}>EW</text></> : marker.type==="contact_warning" ? <><path d="M0 -12 L12 10 L-12 10 Z" fill="#FDF3E3" stroke={color}/><text y={6} textAnchor="middle" fontSize={13} fill={color}>!</text></> : marker.type==="objective" ? <><circle r={12} fill="white" stroke={color}/><path d="M-17 0 H17 M0 -17 V17" stroke={color}/></> : <><path d="M-10 -6 L0 -12 L10 -6 L10 6 L0 12 L-10 6 Z" fill="white" stroke={color}/><circle r={4} fill={color}/></>}
    <text x={left?-28:28} y={4} textAnchor={left?"end":"start"} fill={color} stroke="#F7F5EE" strokeWidth={3} paintOrder="stroke" fontSize={10} fontWeight="bold">{marker.label}</text>
  </g>;
}
