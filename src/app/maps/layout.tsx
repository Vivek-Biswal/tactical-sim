"use client";
import { useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";
import { OfflineWorkspace } from "@/components/integration/OfflineWorkspace";
import type { ExerciseSection } from "@/components/integration/ExerciseNavigation";
export default function Layout({ children }: { children: ReactNode }) {
  const section = (useSelectedLayoutSegment() ?? "map") as ExerciseSection;
  return <><OfflineWorkspace id="map-practice" role="COMMANDER" section={section} basePath="/maps" />{children}</>;
}
