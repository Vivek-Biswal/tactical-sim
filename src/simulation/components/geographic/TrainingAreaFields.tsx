"use client";
import { Mountain, Waves, Trees, Compass, Plane, Anchor, Users, MapPin } from "lucide-react";
import { TRAINING_PRESETS, FORCE_LABELS, areaFromPreset, getTrainingPreset, trainingAreaError } from "../../lib/geography";
import type { TrainingArea, ForceProfile, TerrainKind } from "../../types/geography";

const field = "mt-1.5 w-full rounded-lg border border-[#D9D8CE] bg-white p-2.5 text-sm font-medium text-[#344438] focus-visible:outline-2 focus-visible:outline-[#556B3F]";
const terrainNames: Record<TerrainKind, string> = { mountain: "Mountain", hills: "Hills", range: "Mountain range", valley: "Valley", volcano: "Volcano island", sea: "Sea & coast", river: "River", lake: "Lake", desert: "Desert", forest: "Forest" };

export function TrainingAreaFields({ value, onChange, disabled = false }: { value: TrainingArea; onChange: (area: TrainingArea) => void; disabled?: boolean }) {
  const error = trainingAreaError(value);
  const preset = getTrainingPreset(value);
  const force = value.forceProfile ?? preset?.defaultForce ?? "army";
  const Icon = preset && ["sea", "river", "lake"].includes(preset.terrain) ? Waves : preset?.terrain === "forest" ? Trees : Mountain;
  const ForceIcon = force === "navy" ? Anchor : force === "air_force" ? Plane : force === "joint" ? Users : Compass;
  return <fieldset disabled={disabled} className="rounded-xl border border-[#D9D8CE] bg-[#F7F5EE] p-4 text-[#344438] disabled:opacity-75">
    <legend className="px-2 text-xs font-black">Choose your training environment</legend>
    <div className="grid gap-3">
      <label className="text-xs font-bold">1. Terrain & location in India
        <select className={field} value={preset?.id ?? "legacy"} onChange={event => {
          const next = TRAINING_PRESETS.find(area => area.id === event.target.value);
          if (next) onChange(areaFromPreset(next, next.supportedForces.includes(force) ? force : next.defaultForce));
        }}>
          {!preset && <option value="legacy">{value.name} · existing area</option>}
          {TRAINING_PRESETS.map(area => <option key={area.id} value={area.id}>{terrainNames[area.terrain]} · {area.name}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold">2. Training force
        <select className={field} value={force} onChange={event => onChange({ ...value, forceProfile: event.target.value as ForceProfile })}>
          {(preset?.supportedForces ?? ["army", "air_force", "joint"] as ForceProfile[]).map(profile => <option key={profile} value={profile}>{FORCE_LABELS[profile]}{profile === preset?.defaultForce ? " · recommended" : ""}</option>)}
        </select>
      </label>
    </div>
    {preset && <div className="mt-4 overflow-hidden rounded-lg border border-[#D9D8CE] bg-white">
      <div className="flex items-start gap-3 p-4">
        <div className="rounded-lg bg-[#EEF3E8] p-3 text-[#556B3F]"><Icon size={24} aria-hidden="true" /></div>
        <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#71805A]">{terrainNames[preset.terrain]} · India</p><h3 className="mt-1 text-base font-black text-[#263229]">{preset.name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-[#687066]"><MapPin size={12} aria-hidden="true" />{preset.region}</p><p className="mt-2 text-xs leading-relaxed text-[#687066]">{preset.description}</p></div>
      </div>
      <div className="border-t border-[#E7E7DF] bg-[#FAFAF6] p-4 text-xs">
        <p className="flex items-center gap-2 font-bold"><ForceIcon size={15} aria-hidden="true" />{FORCE_LABELS[force]}</p>
        <p className="mt-2 leading-relaxed"><span className="font-bold">What you will practise: </span>{preset.learningGoal}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-[#687066]">{force === "air_force" ? "Aircraft and UAVs follow simulated flight routes above the terrain." : force === "navy" ? "Boats follow simulated water routes. Choose a new destination to change their course." : force === "joint" ? "Coordinate ground, water and air units available in this environment." : "Ground teams follow simulated patrol routes. Select a team to change its destination."}</p>
      </div>
    </div>}
    <details className="mt-3">
      <summary className="cursor-pointer text-xs font-bold text-[#556B3F]">Browse all 10 terrain types</summary>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {TRAINING_PRESETS.map(area => {
          const selected = area.id === value.id;
          const AreaIcon = ["sea", "river", "lake"].includes(area.terrain) ? Waves : area.terrain === "forest" ? Trees : Mountain;
          return <button key={area.id} type="button" aria-pressed={selected} onClick={() => onChange(areaFromPreset(area, area.supportedForces.includes(force) ? force : area.defaultForce))} className={`rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#556B3F] ${selected ? "border-[#556B3F] bg-[#EEF3E8]" : "border-[#D9D8CE] bg-white hover:bg-[#FAFAF6]"}`}>
            <AreaIcon size={18} className="mb-2 text-[#71805A]" aria-hidden="true" /><span className="block text-xs font-black">{terrainNames[area.terrain]}</span><span className="mt-1 block text-[10px] text-[#687066]">{area.name}</span>
          </button>;
        })}
      </div>
    </details>
    {error ? <p role="alert" className="mt-3 text-xs text-[#A94A3F]">{error}</p> : <p className="mt-3 text-[10px] leading-relaxed text-[#687066]">Choose before starting. 2D shows a simplified training diagram; 3D uses the selected real location. All units, routes and events are simulated.</p>}
  </fieldset>;
}
