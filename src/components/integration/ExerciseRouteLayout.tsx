"use client";
import { use, type ReactNode } from "react";
import { useSearchParams, useSelectedLayoutSegment } from "next/navigation";
import { SharedExercise } from "./SharedExercise";
import { OfflineWorkspace } from "./OfflineWorkspace";
import type { ExerciseSection } from "./ExerciseNavigation";

export function ExerciseRouteLayout({ params, children, role = "COMMANDER", route }: { params: Promise<{ id: string }>; children: ReactNode; role?: string; route: string }) {
  const { id } = use(params);
  const segment = useSelectedLayoutSegment();
  const query = useSearchParams();
  const section = (segment ?? "map") as ExerciseSection;
  const basePath = `${route}/${encodeURIComponent(id)}`;
  return <>{route === "/training" || /^ex-[a-f0-9]{12}$/.test(id)
    ? <SharedExercise key={id} id={id} initialRole={query.get("role") ?? role} section={section} basePath={basePath} />
    : <OfflineWorkspace key={id} id={id} role={role} section={section} basePath={basePath} />}{children}</>;
}
