"use client";
import { use, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { SharedAAR } from "@/components/integration/SharedAAR";
import { AARReview } from "@/components/aar/AARReview";
import { localReportKey } from "@/simulation/lib/aar";
import { isServerAARReport, type ServerAARReport } from "@/simulation/lib/sharedProtocol";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("tactical-sim:aar-saved", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("tactical-sim:aar-saved", callback); };
}
const serverSnapshot = () => null;

export default function AARPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  return <AuthGuard><RecordedReview key={`${id}:${user?.uid ?? "local"}`} id={id} /></AuthGuard>;
}

function RecordedReview({ id }: { id: string }) {
  const { user } = useAuth();
  const raw = useSyncExternalStore(subscribe, () => {
    try { return localStorage.getItem(localReportKey(id, user?.uid ?? null)) ?? ""; }
    catch { return ""; }
  }, serverSnapshot);
  const saved = useMemo(() => {
    let report: ServerAARReport | null = null;
    try {
      const value: unknown = raw ? JSON.parse(raw) : null;
      if (value && typeof value === "object" && "exerciseId" in value && typeof value.exerciseId === "string" && value.exerciseId.toLowerCase() === id.toLowerCase() && isServerAARReport(value, value.exerciseId) && value.isFinal && value.reviewScope === "local") report = value;
    } catch { /* Missing, corrupt or disabled browser storage is an empty record. */ }
    return { report, checked: raw !== null };
  }, [id, raw]);
  if (!saved.checked) return <AppShell pageTitle="AFTER-ACTION REVIEW"><p role="status">Loading exercise record…</p></AppShell>;
  if (saved.report) return <AppShell pageTitle={`AFTER-ACTION REVIEW · ${id}`}><div className="mb-4 flex flex-wrap gap-3 text-xs text-[#556B3F]"><Link href="/maps">← Training maps</Link><Link href="/training">Shared exercise rooms</Link></div><p className="mb-4 text-xs text-[#687066]">Last completed local practice saved in this browser for your account. A new completed practice replaces this record; it is separate from server room records.</p><AARReview report={saved.report} local /></AppShell>;
  if (["ex-001", "scn-001", "map-practice"].includes(id.toLowerCase())) return <AppShell pageTitle={`AFTER-ACTION REVIEW · ${id}`}><div className="rounded-lg border border-[#D9D8CE] bg-white p-6 text-[#344438]"><h1 className="text-xl font-black">No completed practice record yet</h1><p className="mt-3 text-sm">Run a local exercise, record a decision and end the practice to generate its review.</p><div className="mt-5 flex gap-4 text-sm font-bold text-[#556B3F]"><Link href={id.toLowerCase() === "map-practice" ? "/maps" : `/commander/simulation/${encodeURIComponent(id)}`}>Open local practice →</Link><Link href="/training">Shared rooms →</Link></div></div></AppShell>;
  return <SharedAAR id={id} />;
}
