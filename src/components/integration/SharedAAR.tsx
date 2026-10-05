"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PageHeader } from "@/components/ui/PageHeader";
import { AARReview } from "@/components/aar/AARReview";
import { backendRequest, downloadAAR, keyStorage } from "@/simulation/lib/backend";
import { isServerAARReport, type ServerAARReport } from "@/simulation/lib/sharedProtocol";

const button = "inline-flex items-center rounded-lg border border-[#D9D8CE] bg-white px-3 py-2 text-xs font-bold text-[#344438] hover:bg-[#EEF3E8] disabled:opacity-40";

function savedKey(id: string) {
  try { return localStorage.getItem(keyStorage(id)) || sessionStorage.getItem(keyStorage(id)) || ""; }
  catch { return ""; }
}

export function SharedAAR({ id }: { id: string }) {
  const { user, role, isFirebaseConfigured } = useAuth();
  return <AuthGuard>{(!isFirebaseConfigured || (user && role)) && <RoomReview key={`${id}:${user?.uid || "local"}`} id={id} />}</AuthGuard>;
}

function RoomReview({ id }: { id: string }) {
  const { isFirebaseConfigured } = useAuth();
  const [access, setAccess] = useState<{ instructor: boolean } | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const controller = new AbortController();
    backendRequest<{ role: string | null }>(`/exercises/${encodeURIComponent(id)}/membership`, { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) { setAccess({ instructor: value.role === "INSTRUCTOR" }); setError(""); } })
      .catch(failure => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Unable to check room access."); });
    return () => controller.abort();
  }, [id, isFirebaseConfigured, attempt]);
  if (isFirebaseConfigured && !access) return <AppShell pageTitle="AFTER-ACTION REVIEW"><p role={error ? "alert" : "status"}>{error || "Checking your role in this room…"}</p>{error && <button className={button} onClick={() => setAttempt(value => value + 1)}>Retry</button>}</AppShell>;
  return <AccountReview id={id} instructor={!isFirebaseConfigured || Boolean(access?.instructor)} />;
}

function AccountReview({ id, instructor }: { id: string; instructor: boolean }) {
  const [report, setReport] = useState<ServerAARReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [instructorKey, setInstructorKey] = useState("");
  const [requestedKey, setRequestedKey] = useState("");
  const [loadedKey, setLoadedKey] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const key = instructor ? requestedKey || savedKey(id) : "";
    async function load() {
      setLoading(true); setError(""); setReport(null);
      try {
        const value = await backendRequest<unknown>(`/exercises/${encodeURIComponent(id)}/aar`, { headers: key ? { "X-Instructor-Key": key } : {}, signal: controller.signal });
        if (!isServerAARReport(value, id)) throw new Error("The server returned an incomplete review. Try refreshing the report.");
        if (!controller.signal.aborted) { setReport(value); setLoadedKey(key); }
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Unable to load this review.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [id, reload, requestedKey, instructor]);

  async function exportReport(format: "json" | "csv") {
    setBusy(true); setError("");
    try { await downloadAAR(id, loadedKey, format); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Export failed."); }
    finally { setBusy(false); }
  }

  return <AppShell pageTitle={`AFTER-ACTION REVIEW — ${id}`} role={instructor ? "instructor" : "commander"}>
    <div className="mb-5 flex flex-wrap gap-3"><Link className={button} href="/training">← Exercise rooms</Link><Link className={button} href={`/training/${encodeURIComponent(id)}`}>Open this exercise</Link></div>
    <PageHeader label="SERVER EXERCISE RECORD" title={report?.scenarioName ?? "After-action review"} description={`${id} · ${report?.teamName ?? "Review recorded events, radio delivery and decisions."}`} />
    {error && <div role="alert" className="mt-5 rounded-lg border border-[#A94A3F] bg-[#FCECE8] p-4 text-sm text-[#A94A3F]">{error}<p className="mt-2 text-xs">Participants can read the final report after the exercise ends. Live previews require the room creator’s Instructor account and room key.</p></div>}
    <div className="my-5 flex flex-wrap items-end gap-3 rounded-xl border border-[#D9D8CE] bg-[#F7F5EE] p-4">
      {instructor && <label className="text-xs font-bold text-[#344438]">Room recovery key for a live preview<input className="mt-2 block w-full rounded-lg border border-[#D9D8CE] bg-white p-2 font-normal sm:w-80" type="password" autoComplete="off" value={instructorKey} onChange={event => setInstructorKey(event.target.value)} placeholder="Uses your saved room key on this browser" /></label>}
      <button className={button} disabled={loading} onClick={() => { setRequestedKey(instructorKey.trim()); setReload(value => value + 1); }}>{loading ? "Loading…" : "Refresh report"}</button>
      {report && <><button className={button} disabled={busy || loading} onClick={() => void exportReport("json")}>Export JSON</button><button className={button} disabled={busy || loading} onClick={() => void exportReport("csv")}>Export decisions CSV</button></>}
    </div>
    {loading && <p role="status" className="text-sm text-[#687066]">Loading the recorded exercise from the simulation server…</p>}
    {report && !loading && <AARReview key={report.exerciseId} report={report} role={instructor ? "Instructor" : "Trainee"} />}
  </AppShell>;
}
