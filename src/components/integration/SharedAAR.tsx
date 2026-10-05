"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PageHeader } from "@/components/ui/PageHeader";
import { PanelCard } from "@/components/ui/PanelCard";
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

  return <AppShell pageTitle={`AFTER-ACTION REVIEW — ${id}`} role={loadedKey ? "instructor" : "commander"}>
    <div className="mb-5 flex flex-wrap gap-3"><Link className={button} href="/training">← Exercise rooms</Link><Link className={button} href={`/training/${encodeURIComponent(id)}`}>Open this exercise</Link></div>
    <PageHeader label="SERVER EXERCISE RECORD" title={report?.scenarioName ?? "After-action review"} description={`${id} · ${report?.teamName ?? "Review recorded events, radio delivery and decisions."}`} />
    {error && <div role="alert" className="mt-5 rounded-lg border border-[#A94A3F] bg-[#FCECE8] p-4 text-sm text-[#A94A3F]">{error}<p className="mt-2 text-xs">Participants can read the final report after the exercise ends. Live previews require the room creator’s Instructor account and room key.</p></div>}
    <div className="my-5 flex flex-wrap items-end gap-3 rounded-xl border border-[#D9D8CE] bg-[#F7F5EE] p-4">
      {instructor && <label className="text-xs font-bold text-[#344438]">Room recovery key for a live preview<input className="mt-2 block w-full rounded-lg border border-[#D9D8CE] bg-white p-2 font-normal sm:w-80" type="password" autoComplete="off" value={instructorKey} onChange={event => setInstructorKey(event.target.value)} placeholder="Uses your saved room key on this browser" /></label>}
      <button className={button} disabled={loading} onClick={() => { setRequestedKey(instructorKey.trim()); setReload(value => value + 1); }}>{loading ? "Loading…" : "Refresh report"}</button>
      {report && <><button className={button} disabled={busy || loading} onClick={() => void exportReport("json")}>Export JSON</button><button className={button} disabled={busy || loading} onClick={() => void exportReport("csv")}>Export decisions CSV</button></>}
    </div>
    {loading && <p role="status" className="text-sm text-[#687066]">Loading the recorded exercise from the simulation server…</p>}
    {report && !loading && <div className="space-y-5">
      <p className="rounded-lg border border-[#D9D8CE] bg-[#EEF3E8] p-3 text-sm text-[#344438]"><strong>{report.isFinal ? "Final exercise record" : "Instructor preview — exercise still in progress"}</strong> · {report.stats.duration}{report.trainingArea && ` · ${report.trainingArea.name}`}<span className="mt-1 block text-xs">These are recorded outcomes. The prototype does not assign tactical correctness or performance scores.</span></p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
        ["Decisions recorded", report.stats.decisionsCount], ["Messages delivered", report.stats.messagesDelivered], ["Messages delayed", report.stats.messagesDelayed], ["Messages dropped", report.stats.messagesDropped],
      ].map(([label, value]) => <PanelCard key={label}><p className="text-xs text-[#687066]">{label}</p><p className="mt-2 text-2xl font-black text-[#263229]">{value}</p></PanelCard>)}</div>
      <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Individual and team decision timeline</span>}>
        {report.decisions.length ? <ol className="space-y-4">{report.decisions.map(decision => <li key={decision.id} className="rounded-lg border border-[#D9D8CE] bg-[#F7F5EE] p-4 text-sm text-[#344438]">
          <p className="font-black">{decision.simulationTime} · {decision.traineeId} · {decision.selectedActionLabel}</p><p className="mt-2">{decision.rationale}</p><p className="mt-2 text-xs text-[#687066]">Confidence: {decision.confidence ?? "Not recorded"} · Radio: {decision.communicationState} · Map: {decision.mapStatus ?? "Not recorded"}</p>
          <details className="mt-3 text-xs"><summary className="cursor-pointer font-bold">Information available when this decision was made</summary><div className="mt-3 grid gap-4 sm:grid-cols-2"><div><p className="font-bold">Available</p><ul className="mt-2 list-disc pl-5">{decision.availableInformation?.map((info, index) => <li key={index}>{info}</li>)}</ul></div><div><p className="font-bold">Unavailable</p>{decision.unavailableInformation?.length ? <ul className="mt-2 list-disc pl-5">{decision.unavailableInformation.map((info, index) => <li key={index}>{info}</li>)}</ul> : <p className="mt-2">None recorded.</p>}</div></div></details>
        </li>)}</ol> : <p className="text-sm text-[#687066]">No decisions were recorded in this exercise.</p>}
      </PanelCard>
      <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Full exercise timeline</span>}>
        <ol className="max-h-[480px] space-y-3 overflow-y-auto">{report.fullEventLog.map(event => <li key={event.id} className="border-l-2 border-[#D8C7A5] pl-3 text-sm text-[#344438]"><p className="font-bold"><span className="mr-2 font-mono text-[#71805A]">{event.time}</span>{event.title}</p><p className="mt-1 text-xs text-[#687066]">{event.description}</p></li>)}</ol>
      </PanelCard>
      <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Radio and intelligence delivery record</span>}>
        <p className="mb-4 text-xs text-[#687066]">Final reviews include undelivered attempts so teams can understand which information was missing during training.</p>
        {report.messages.length ? <ol className="max-h-[480px] space-y-3 overflow-y-auto">{report.messages.map(message => <li key={message.id} className="rounded-lg border border-[#D9D8CE] p-3 text-xs text-[#344438]"><p className="font-black">{message.formattedTime} · {message.sender} · {message.deliveryStatus}</p><p className="mt-2">{message.content}</p>{message.isConflicting && <p className="mt-2 font-bold text-[#8A5C2A]">Conflicting report</p>}</li>)}</ol> : <p className="text-sm text-[#687066]">No transmissions recorded.</p>}
      </PanelCard>
      <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Review findings</span>}><div className="space-y-2 text-sm text-[#344438]">{report.analyticalFindings.map((finding, index) => <p key={index}>{finding}</p>)}{report.recommendations.map((recommendation, index) => <p className="text-xs text-[#687066]" key={`recommendation-${index}`}>{recommendation}</p>)}</div></PanelCard>
    </div>}
  </AppShell>;
}
