import { useState } from "react";
const entries = [
  ["✈", "Aircraft / drone", "#556B3F"], ["⚓", "Boat / ship", "#486D87"],
  ["▣", "Friendly team", "#556B3F"], ["◇", "Hostile contact", "#A94A3F"], ["△ ?", "Unknown contact", "#B87A3A"], ["▣", "Neutral unit", "#486D87"],
  ["⬡", "Checkpoint", "#556B3F"], ["⊕", "Objective", "#556B3F"], ["△ !", "Activity warning", "#B87A3A"], ["◇ EW", "Jammer activity", "#A94A3F"],
  ["━", "Training road / trail", "#71805A"], ["≈", "Blue areas = water", "#486D87"], ["◎", "Curved lines = slopes", "#71805A"], ["▱", "Exercise training zones", "#B69B63"], ["┄", "Planned route", "#556B3F"],
];
export function MapLegend() {
  const [open,setOpen]=useState(false);
  return <div className="border-t border-[#D9D8CE] bg-white px-3 py-2 text-[#344438]">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]"><span>▣ Ground team</span><span>✈ Aircraft</span><span>⚓ Boat / ship</span><button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} className="ml-auto font-black uppercase tracking-widest">{open?"−":"+"} Map legend</button></div>
    {open&&<ul className="mt-2 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-3">{entries.map(([symbol,label,color])=><li key={label} className="flex items-center gap-2"><span className="w-7 shrink-0 text-center font-mono font-bold" style={{color}}>{symbol}</span>{label}</li>)}</ul>}
  </div>;
}
