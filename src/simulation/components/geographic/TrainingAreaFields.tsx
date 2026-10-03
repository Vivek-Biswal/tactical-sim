"use client";
import { TRAINING_AREAS, trainingAreaError } from "../../lib/geography";
import type { TrainingArea } from "../../types/geography";

const field = "mt-1 w-full rounded border border-[#D9D8CE] bg-white p-2 text-xs text-[#344438]";
export function TrainingAreaFields({ value, onChange, disabled = false }: { value: TrainingArea; onChange: (area: TrainingArea) => void; disabled?: boolean }) {
  const error = trainingAreaError(value);
  return <fieldset disabled={disabled} className="space-y-3 rounded-lg border border-[#D9D8CE] bg-[#F7F5EE] p-3 text-xs text-[#344438]">
    <legend className="px-1 font-black">Geographic training area</legend>
    <label className="block font-bold">Location<select className={field} value={TRAINING_AREAS.some(a => a.id === value.id) ? value.id : "custom"} onChange={event => {
      const preset = TRAINING_AREAS.find(a => a.id === event.target.value);
      onChange(preset ? { ...preset } : { ...value, id: "custom", name: "Custom training area" });
    }}>{TRAINING_AREAS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}<option value="custom">Custom coordinates</option></select></label>
    {value.id === "custom" && <label className="block font-bold">Area name<input required maxLength={80} className={field} value={value.name} onChange={e => onChange({ ...value, name: e.target.value })} /></label>}
    <div className="grid grid-cols-2 gap-3">{([
      ["latitude", "Centre latitude", -75, 75, "any"],
      ["longitude", "Centre longitude", -180, 180, "any"],
      ["widthMeters", "East–west extent (m)", 200, 20000, "any"],
      ["heightMeters", "North–south extent (m)", 200, 20000, "any"],
    ] as const).map(([key, label, min, max, step]) => <label key={key} className="font-bold">{label}<input required type="number" min={min} max={max} step={step} className={field} value={Number.isNaN(value[key]) ? "" : value[key]} onChange={e => onChange({ ...value, id: "custom", [key]: e.target.valueAsNumber })} /></label>)}</div>
    {error ? <p role="alert" className="text-[#A94A3F]">{error}</p> : <p className="text-[#687066]">The same 800 × 600 training grid is placed over this area. Units and events are simulated.</p>}
  </fieldset>;
}
