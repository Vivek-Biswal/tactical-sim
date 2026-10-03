"use client";
import Link from "next/link";
import { Settings2, Map, Activity, Radio, ClipboardList, FileText, SlidersHorizontal } from "lucide-react";

export type ExerciseSection = "map" | "setup" | "controls" | "situation" | "communications" | "decisions" | "review";
const sections = [
  { id: "setup", label: "Setup", icon: Settings2 },
  { id: "controls", label: "Exercise controls", icon: SlidersHorizontal },
  { id: "map", label: "Tactical map", icon: Map },
  { id: "situation", label: "Situation", icon: Activity },
  { id: "communications", label: "Communications", icon: Radio },
  { id: "decisions", label: "Decisions", icon: ClipboardList },
  { id: "review", label: "Review & export", icon: FileText },
] as const;

export function ExerciseNavigation({ basePath, section, instructor = false, offline = false, decisionRequired = false }: { basePath: string; section: ExerciseSection; instructor?: boolean; offline?: boolean; decisionRequired?: boolean }) {
  return <nav aria-label="Exercise pages" className="flex shrink-0 overflow-x-auto border-b border-[#D9D8CE] bg-white px-2">
    {sections.filter(item => item.id !== "controls" || instructor).filter(item => item.id !== "setup" || instructor || offline).map(({ id, label, icon: Icon }) => <Link key={id} prefetch={false} scroll={false} href={`${basePath}/${id}`} aria-current={section === id ? "page" : undefined} className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-[11px] font-bold ${section === id ? "border-[#556B3F] text-[#344438]" : "border-transparent text-[#687066] hover:bg-[#F7F5EE]"}`}><Icon size={14} aria-hidden="true" />{label}{id === "decisions" && decisionRequired && <span className="rounded bg-[#FAF0EF] px-1.5 text-[#A94A3F]">Action needed</span>}</Link>)}
  </nav>;
}

export function formatExerciseTime(seconds: number, roundUp = false) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const total = roundUp ? Math.ceil(safe) : Math.floor(safe);
  const hours = Math.floor(total / 3600);
  const clock = `${Math.floor(total % 3600 / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
  return hours ? `${hours.toString().padStart(2, "0")}:${clock}` : clock;
}
