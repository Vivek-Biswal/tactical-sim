import { useState } from "react";
const entries = [
  ["▣", "Friendly team", "#556B3F"], ["◇", "Hostile contact", "#A94A3F"], ["△ ?", "Unknown contact", "#B87A3A"], ["▣", "Neutral unit", "#486D87"],
  ["⬡", "Checkpoint", "#556B3F"], ["⊕", "Objective", "#556B3F"], ["△ !", "Activity warning", "#B87A3A"], ["◇ EW", "Jammer activity", "#A94A3F"],
  ["━", "Road / dashed trail", "#71805A"], ["≈", "River / hill contours", "#486D87"], ["▱", "Restricted / assembly / observation zones", "#B69B63"],
];
export function MapLegend() {
  const [open,setOpen]=useState(false);
  return <div className="border-t border-[#D9D8CE] bg-white px-3 py-2 text-[#344438]">
    <button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} className="text-[10px] font-black uppercase tracking-widest">{open?"−":"+"} Map legend</button>
    {open&&<ul className="mt-2 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-3">{entries.map(([symbol,label,color])=><li key={label} className="flex items-center gap-2"><span className="w-7 shrink-0 text-center font-mono font-bold" style={{color}}>{symbol}</span>{label}</li>)}</ul>}
  </div>;
}
