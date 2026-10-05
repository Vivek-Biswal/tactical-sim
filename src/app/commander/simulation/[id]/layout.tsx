import { Suspense, type ReactNode } from "react";
import { ExerciseRouteLayout } from "@/components/integration/ExerciseRouteLayout";

export default function Layout({ params, children }: { params: Promise<{ id: string }>; children: ReactNode }) {
  return <Suspense fallback={<p className="p-5">Loading exercise workspace…</p>}><ExerciseRouteLayout params={params} role="COMMANDER" route="/commander/simulation">{children}</ExerciseRouteLayout></Suspense>;
}
