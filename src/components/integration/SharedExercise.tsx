"use client";
import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PanelCard } from "@/components/ui/PanelCard";
import { OfflineSituation } from "./OfflineExercise";
import { TacticalMap } from "@/simulation/components/tactical/TacticalMap";
import { backendRequest, downloadAAR, keyStorage } from "@/simulation/lib/backend";
import { useSharedExercise, type ParticipantRole } from "@/simulation/lib/useSharedExercise";

const button = "rounded-lg border border-[#D9D8CE] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#344438] hover:bg-[#EEF3E8] disabled:opacity-40";
const field = "mt-2 w-full rounded-lg border border-[#D9D8CE] bg-white p-3 text-sm text-[#344438]";
const roles: ParticipantRole[] = ["COMMANDER", "TEAM_ALPHA", "TEAM_BRAVO", "TEAM_CHARLIE", "INSTRUCTOR"];
const injections = [
  ["delay_radio", "Delay radio"], ["drop_radio", "Radio dropout"], ["restore_radio", "Restore radio"],
  ["conflicting_report", "Conflicting reports"], ["outdate_map", "Stale map"], ["unavailable_map", "Map unavailable"],
  ["restore_map", "Restore map"], ["new_intelligence", "New intelligence"], ["decision_required", "Decision prompt"],
] as const;
type Participant = { role: ParticipantRole; name: string; key: string };
type Review = { isFinal: boolean; stats: Record<string, string | number>; analyticalFindings: string[]; decisions: Array<{ id: string; traineeId: string; simulationTime: string; selectedActionLabel: string; rationale: string; communicationState: string; mapStatus: string; availableInformation: string[]; unavailableInformation: string[] }> };

export function SharedExercise({ id, initialRole }: { id: string; initialRole?: string }) {
  const [role, setRole] = useState<ParticipantRole>(roles.includes(initialRole as ParticipantRole) ? initialRole as ParticipantRole : "COMMANDER");
  const [name, setName] = useState("Trainee");
  const [key, setKey] = useState("");
  const [participant, setParticipant] = useState<Participant | null>(null);
  return <AppShell pageTitle={`SHARED EXERCISE — ${id}`} role={role === "INSTRUCTOR" ? "instructor" : role === "COMMANDER" ? "commander" : "team"}>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link href="/training" className="text-xs font-black uppercase tracking-widest text-[#556B3F]">← Exercise rooms</Link><span className="text-xs font-mono text-[#8A5C2A]">{id}</span></div>
    {participant ? <SharedSession key={JSON.stringify(participant)} id={id} participant={participant} leave={() => setParticipant(null)} /> :
      <div className="mx-auto max-w-xl"><PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Join Operation Silent Link</span>}>
        <form className="space-y-4" onSubmit={event => {
          event.preventDefault();
          setParticipant({ role, name: name.trim(), key: role === "INSTRUCTOR" ? key.trim() || localStorage.getItem(keyStorage(id)) || "" : "" });
        }}>
          <p className="text-sm text-[#687066]">Each browser joins the same server timeline. Choose your training role and callsign.</p>
          <label className="block text-xs font-bold text-[#344438]">Training role<select className={field} value={role} onChange={event => setRole(event.target.value as ParticipantRole)}>{roles.map(r => <option key={r} value={r}>{r.replaceAll("_", " ")}</option>)}</select></label>
          <label className="block text-xs font-bold text-[#344438]">Callsign<input className={field} value={name} onChange={event => setName(event.target.value)} required maxLength={80} /></label>
          {role === "INSTRUCTOR" && <label className="block text-xs font-bold text-[#344438]">Instructor key<input className={field} type="password" value={key} onChange={event => setKey(event.target.value)} placeholder="Uses the saved key in the creator’s browser" autoComplete="off" /><span className="mt-2 block font-normal text-[#687066]">Required on another browser. Keep it separate from participant links.</span></label>}
          <button className="rounded-lg bg-[#556B3F] px-4 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50" disabled={!name.trim()}>Connect to exercise</button>
        </form>
      </PanelCard></div>}
  </AppShell>;
}

function SharedSession({ id, participant, leave }: { id: string; participant: Participant; leave: () => void }) {
  const { state, connection, error, command } = useSharedExercise(id, participant.role, participant.name, participant.key);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [decision, setDecision] = useState("");
  const [actionId, setActionId] = useState("");
  const [rationale, setRationale] = useState("");
  const [confidence, setConfidence] = useState("medium");
  const [delay, setDelay] = useState(10);
  const [intel, setIntel] = useState("Sector 4 activity reported. Reliability: medium. Verify independently.");
  const [review, setReview] = useState<Review | null>(null);
  const instructor = participant.role === "INSTRUCTOR";
  const live = connection === "live";
  async function run(task: () => Promise<unknown>) {
    setBusy(true); setFeedback("");
    try { await task(); return true; }
    catch (failure) { setFeedback(failure instanceof Error ? failure.message : "Request failed"); return false; }
    finally { setBusy(false); }
  }
  const disabled = !live || busy;
  const running = state?.status === "running";
  function control(action: string, extra = {}) { void run(() => command("EXERCISE_CONTROL", { action, ...extra })); }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[#263229] p-5 text-white">
      <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B69B63]">{participant.role.replaceAll("_", " ")} · {participant.name}</p><h1 className="mt-1 text-xl font-black">{state?.scenarioName || "Connecting to simulation"}</h1><p className="mt-2 text-xs text-[#D8C7A5]">{connection.toUpperCase()} · {state?.status.toUpperCase() || "AWAITING STATE"} · {state?.connectedTrainees?.length || 0} connected</p></div>
      <div className="flex items-center gap-4"><p className="font-mono text-2xl font-black">{state?.formattedTime || "00:00"}<span className="ml-2 text-xs text-[#B69B63]">/ {state?.totalDuration || "—"}s</span></p><button className={button} onClick={leave}>Disconnect</button></div>
    </div>
    {(error || feedback) && <div role="alert" className="rounded-lg border border-[#A94A3F] bg-[#FCECE8] p-3 text-sm text-[#A94A3F]">{feedback || error}</div>}
    {!state && <p className="text-sm text-[#687066]">Waiting for the server. If the room has expired or the server restarted, create a new exercise from the rooms page.</p>}
    {state && <>
      {instructor && <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Instructor control</span>}>
        <div className="flex flex-wrap items-center gap-2">
          <button className={button} disabled={disabled || state.status !== "pending"} onClick={() => control("start")}>Start</button>
          <button className={button} disabled={disabled || !running} onClick={() => control("pause")}>Pause</button>
          <button className={button} disabled={disabled || state.status !== "paused"} onClick={() => control("resume")}>Resume</button>
          <button className={button} disabled={disabled || state.status === "completed"} onClick={() => control("end")}>End exercise</button>
          <button className={button} disabled={disabled || running} onClick={() => { setReview(null); control("reset"); }}>Reset room</button>
          <label className="text-xs font-bold text-[#687066]">Speed <select className="ml-2 rounded border border-[#D9D8CE] p-2" value={state.speedMultiplier} disabled={disabled || state.status === "completed"} onChange={event => control("set_speed", { speedMultiplier: Number(event.target.value) })}>{[0.25, 0.5, 1, 2, 5, 10].map(value => <option value={value} key={value}>{value}×</option>)}</select></label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-[#344438]">Radio delay (simulation seconds)<input className={field} type="number" min={0} max={60} value={delay} onChange={event => setDelay(Number(event.target.value))} /></label>
          <label className="text-xs font-bold text-[#344438]">Intelligence relay report<textarea className={field} maxLength={2000} value={intel} onChange={event => setIntel(event.target.value)} /></label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">{injections.map(([action, label]) => <button className={button} key={action} disabled={disabled || !["running", "paused"].includes(state.status) || (action === "new_intelligence" && !intel.trim())} onClick={() => void run(() => command("INSTRUCTOR_INJECT", { action, payload: action === "delay_radio" ? { delay } : action === "new_intelligence" ? { content: intel } : {} }))}>{label}</button>)}</div>
        <p className="mt-3 text-xs text-[#687066]">Participants: {state.connectedTrainees?.map(p => `${p.name} (${p.role})`).join(" · ") || "None"}</p>
      </PanelCard>}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="space-y-5">
          <div className="h-[570px] min-w-0 rounded-xl border border-[#D9D8CE] bg-white p-3">
            <TacticalMap units={state.units} activityMarkers={state.activityMarkers} mapStatus={live ? state.mapStatus : state.mapStatus === "unavailable" ? "unavailable" : "outdated"} mapLastUpdated={live ? state.mapLastUpdated : "Server disconnected — last received snapshot"} movementEnabled={!disabled && running} onUnitMove={(unitId, point) => { void run(() => command("TEAM_MOVEMENT", { unitId, x: point.x, y: point.y })); }} className="h-full" />
          </div>
          <p className="text-xs text-[#687066]">Fictional training grid · {state.mapStatus.toUpperCase()} · Movement follows the server clock. Team participants can move their own team. Offline radio drops transmissions; intelligence uses a separate relay.</p>
          <OfflineSituation state={state} />
          {(participant.role === "COMMANDER") && <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Commander decision</span>}>
            <p className="text-sm font-bold text-[#263229]">{state.activeDecisionPoint?.situation || "Record your assessment and rationale using the available information."}</p>
            <form className="mt-4 space-y-4" onSubmit={async event => {
              event.preventDefault();
              const accepted = await run(() => command("DECISION_SUBMIT", { decision, rationale, confidence, selectedActionId: state.activeDecisionPoint ? actionId : "" }));
              if (accepted) { setRationale(""); setDecision(""); setActionId(""); }
            }}>
              {state.activeDecisionPoint && <label className="block text-xs font-bold text-[#344438]">Suggested action<select className={field} value={actionId} onChange={event => { const action = state.activeDecisionPoint?.availableActions.find(a => a.id === event.target.value); setActionId(event.target.value); setDecision(action?.label || ""); }}><option value="">Write your own decision</option>{state.activeDecisionPoint.availableActions.map(action => <option key={action.id} value={action.id}>{action.label}</option>)}</select></label>}
              <label className="block text-xs font-bold text-[#344438]">Decision<input className={field} required maxLength={300} value={decision} onChange={event => { setDecision(event.target.value); setActionId(""); }} /></label>
              <label className="block text-xs font-bold text-[#344438]">Rationale<textarea className={field} required maxLength={4000} value={rationale} onChange={event => setRationale(event.target.value)} placeholder="What do you know, what is uncertain, and why take this action?" /></label>
              <label className="block text-xs font-bold text-[#344438]">Confidence<select className={field} value={confidence} onChange={event => setConfidence(event.target.value)}>{["low", "medium", "high"].map(level => <option key={level}>{level}</option>)}</select></label>
              <button className={button} disabled={disabled || !running || !decision.trim() || !rationale.trim()}>Record decision</button>
            </form>
          </PanelCard>}
        </div>
        <div className="space-y-5">
          <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Radio net · {state.commsStatus}</span>}>
            <p className="text-xs text-[#687066]">{state.radioDelaySeconds}s delay · {state.pendingMessages.length} queued · {state.commsStatus === "offline" ? "Transmissions will be dropped" : "Delivery follows simulation conditions"}</p>
            <div className="my-4 max-h-[420px] space-y-3 overflow-y-auto">{state.messages.filter(m => m.deliveryStatus === "DELIVERED").map(m => <div className="rounded-lg border border-[#D9D8CE] bg-[#F7F5EE] p-3 text-xs text-[#344438]" key={m.id}><p className="mb-2 font-black text-[#556B3F]">{m.formattedTimeDelivered} · {m.sender}</p><p>{m.content}</p>{m.isConflicting && <p className="mt-2 font-bold text-[#A94A3F]">Conflicting report — independently verify</p>}</div>)}</div>
            <form className="space-y-3" onSubmit={async event => {
              event.preventDefault();
              const accepted = await run(async () => {
                const result = await command("RADIO_MESSAGE", { content: message });
                if (result.deliveryStatus === "DROPPED") setFeedback("Transmission dropped: radio net offline. This attempt is logged for AAR.");
                else if (result.deliveryStatus === "DELAYED") setFeedback("Transmission queued. It will arrive after the simulation delay.");
              });
              if (accepted) setMessage("");
            }}>
              <label className="block text-xs font-bold text-[#344438]">Radio message<textarea className={field} value={message} onChange={event => setMessage(event.target.value)} required maxLength={2000} /></label>
              <button className={button} disabled={disabled || !running || !message.trim()}>Transmit</button>
            </form>
          </PanelCard>
          <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Decision records · {state.decisions.length}</span>}>
            <div className="space-y-3">{state.decisions.length ? state.decisions.map(d => <div key={d.id} className="rounded-lg bg-[#EEF3E8] p-3 text-xs text-[#344438]"><p className="font-black">{d.simulationTime} · {d.traineeId}</p><p className="mt-2 font-bold">{d.selectedActionLabel}</p><p className="mt-2">{d.rationale}</p><p className="mt-2 text-[#687066]">Confidence: {d.confidence} · Comms: {d.communicationState}</p></div>) : <p className="text-xs text-[#687066]">No decisions recorded yet.</p>}</div>
          </PanelCard>
        </div>
      </div>
      <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">After-action review</span>}>
        <p className="text-xs text-[#687066]">{state.status === "completed" ? "Final report available for all participants." : "Full review is available to the instructor during training, and to participants after the exercise ends."}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={button} disabled={disabled || (!instructor && state.status !== "completed")} onClick={() => void run(async () => { setReview(await backendRequest<Review>(`/exercises/${id}/aar`, { headers: participant.key ? { "X-Instructor-Key": participant.key } : {} })); })}>View AAR</button>
          {(["json", "csv"] as const).map(format => <button className={button} key={format} disabled={disabled || (!instructor && state.status !== "completed")} onClick={() => void run(() => downloadAAR(id, participant.key, format))}>Export {format.toUpperCase()}</button>)}
          <button className={button} onClick={() => void run(async () => { await navigator.clipboard.writeText(`${window.location.origin}/training/${id}`); setFeedback("Participant link copied. This link has no instructor key."); })}>Copy participant link</button>
        </div>
        {review && <div className="mt-5 space-y-4 text-sm text-[#344438]"><p className="font-black">{review.isFinal ? "Final AAR" : "Instructor preview"} · {review.stats.messagesDelivered} delivered · {review.stats.messagesDropped} dropped · {review.stats.decisionsCount} decisions</p>{review.analyticalFindings.map(f => <p key={f}>{f}</p>)}{review.decisions.map(d => <details key={d.id} className="rounded-lg border border-[#D9D8CE] p-3"><summary className="cursor-pointer font-bold">{d.simulationTime} · {d.traineeId} · {d.selectedActionLabel}</summary><p className="mt-3">{d.rationale}</p><p className="mt-3">Comms {d.communicationState} · Map {d.mapStatus}</p><p className="mt-3 font-bold">Available at decision</p><ul className="mt-2 list-disc pl-5">{d.availableInformation.map((info, i) => <li key={i}>{info}</li>)}</ul><p className="mt-3 font-bold">Unavailable at decision</p><ul className="mt-2 list-disc pl-5">{d.unavailableInformation.map((info, i) => <li key={i}>{info}</li>)}</ul></details>)}</div>}
      </PanelCard>
      <p className="text-[10px] text-[#687066]">Local training prototype: participant roles are self-selected, instructor controls require a room key, and records are held in server memory. This is separate from the browser-only offline demonstration.</p>
    </>}
  </div>;
}

