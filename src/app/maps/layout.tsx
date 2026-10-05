"use client";
import { useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";
import { TrainingMapWorkspace } from "@/components/integration/TrainingMapWorkspace";
import type { ExerciseSection } from "@/components/integration/ExerciseNavigation";
export default function Layout({ children }: { children: ReactNode }) {
  const section = (useSelectedLayoutSegment() ?? "map") as ExerciseSection;
  return <><TrainingMapWorkspace section={section} />{children}</>;
}
