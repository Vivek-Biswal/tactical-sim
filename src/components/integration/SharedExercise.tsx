"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ExerciseNavigation, type ExerciseSection } from "./ExerciseNavigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { auth } from "@/lib/firebase";
import { accountParticipantRole, accountRoleLabels, type AccountRole } from "@/lib/roles";
import { PanelCard } from "@/components/ui/PanelCard";
import { OfflineSituation } from "./OfflineExercise";
import { ExerciseMap } from "@/simulation/components/tactical/ExerciseMap";
import { TrainingAreaFields } from "@/simulation/components/geographic/TrainingAreaFields";
import { DEFAULT_TRAINING_AREA, trainingAreaError } from "@/simulation/lib/geography";
import type { TrainingArea } from "@/simulation/types/geography";
import { backendRequest, downloadAAR, keyStorage } from "@/simulation/lib/backend";
import { AARReview } from "@/components/aar/AARReview";
import { isServerAARReport, type ServerAARReport } from "@/simulation/lib/sharedProtocol";
import { useSharedExercise, type ParticipantRole } from "@/simulation/lib/useSharedExercise";

const button = "rounded-lg border border-[#D9D8CE] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#344438] hover:bg-[#EEF3E8] disabled:opacity-40";
const field = "mt-2 w-full rounded-lg border border-[#D9D8CE] bg-white p-3 text-sm text-[#344438]";
const roles: ParticipantRole[] = ["COMMANDER", "TEAM_ALPHA", "TEAM_BRAVO", "TEAM_CHARLIE", "INSTRUCTOR"];
const injections = [
  ["delay_radio", "Delay radio"], ["drop_radio", "Radio dropout"], ["restore_radio", "Restore radio"],
  ["conflicting_report", "Conflicting reports"], ["outdate_map", "Stale map"], ["unavailable_map", "Map unavailable"],
  ["deploy_uav", "Deploy simulated UAV"], ["restore_map", "Restore map"], ["new_intelligence", "New intelligence"], ["decision_required", "Decision prompt"],
] as const;
type Participant = { role: ParticipantRole; name: string; key: string; uid?: string };
type RoomMembership = { role: ParticipantRole | null; instructorKey?: string };


export function SharedExercise({ id, initialRole, section = "map", basePath = `/training/${encodeURIComponent(id)}` }: { id: string; initialRole?: string; section?: ExerciseSection; basePath?: string }) {
  const { user, role, isFirebaseConfigured } = useAuth();
  // Discard the previous account's participant and socket, even inside a persistent route layout.
  return <AuthGuard>{(!isFirebaseConfigured || (user && role)) && <ResolveRoomAccess key={`${id}:${user?.uid || "local"}`} id={id} uid={user?.uid} accountName={(user?.displayName || user?.email || user?.uid)?.replace(/\s+/g, " ").trim().slice(0, 80)} initialRole={initialRole} section={section} basePath={basePath} />}</AuthGuard>;
}

function ResolveRoomAccess(props: { id: string; uid?: string; accountName?: string; initialRole?: string; section: ExerciseSection; basePath: string }) {
  const { isFirebaseConfigured } = useAuth();
  const [membership, setMembership] = useState<RoomMembership | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [choice, setChoice] = useState<"commander" | "team">("commander");
  const onJoined = useCallback((role: ParticipantRole) => setMembership(previous => previous?.role === role ? previous : { role }), []);
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const controller = new AbortController();
    backendRequest<RoomMembership>(`/exercises/${encodeURIComponent(props.id)}/membership`, { signal: controller.signal }, 90000)
      .then(value => {
        if (controller.signal.aborted || auth?.currentUser?.uid !== props.uid) return;
        if (value.role === "INSTRUCTOR" && value.instructorKey) {
          try { localStorage.setItem(keyStorage(props.id), value.instructorKey); } catch { /* Keep the recovered key in this account's mounted session. */ }
        }
        setMembership(value); setError("");
      })
      .catch(failure => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Unable to check room access."); });
    return () => controller.abort();
  }, [props.id, props.uid, isFirebaseConfigured, attempt]);
  if (isFirebaseConfigured && !membership) return <AppShell pageTitle="EXERCISE ACCESS"><div className="p-6">{error ? <div role="alert">{error}<button className={`${button} ml-3`} onClick={() => setAttempt(value => value + 1)}>Retry</button></div> : <p role="status">Checking your role in this room…</p>}</div></AppShell>;
  const assigned = membership?.role;
  const resolvedRole = !isFirebaseConfigured ? null : assigned === "INSTRUCTOR" ? "instructor" : assigned?.startsWith("TEAM_") ? "team" : assigned === "COMMANDER" ? "commander" : choice;
  const taskSelector = isFirebaseConfigured && !assigned ? <div className="shrink-0 border-b border-[#D9D8CE] bg-[#EEF3E8] p-3 text-sm text-[#344438]"><label htmlFor="trainee-task" className="mr-3 font-bold">Your trainee task</label><select id="trainee-task" value={choice} onChange={event => setChoice(event.target.value as typeof choice)} className="rounded border border-[#D9D8CE] bg-white p-2"><option value="commander">Commander · coordinate and record decisions</option><option value="team">Field team · send reports and move your team</option></select></div> : null;
  return <RoomAccess key={resolvedRole || "practice"} {...props} recoveredKey={assigned === "INSTRUCTOR" ? membership?.instructorKey : undefined} accountRole={resolvedRole} onJoined={onJoined} taskSelector={taskSelector} />;
}

function RoomAccess({ id, accountRole, uid, accountName, initialRole, section, basePath, onJoined, taskSelector, recoveredKey }: { id: string; accountRole: AccountRole | null; uid?: string; accountName?: string; initialRole?: string; section: ExerciseSection; basePath: string; onJoined: (role: ParticipantRole) => void; taskSelector?: ReactNode; recoveredKey?: string }) {
  const [role, setRole] = useState<ParticipantRole>(roles.includes(initialRole as ParticipantRole) ? initialRole as ParticipantRole : "COMMANDER");
  const [team, setTeam] = useState<"TEAM_ALPHA" | "TEAM_BRAVO" | "TEAM_CHARLIE">("TEAM_ALPHA");
  const [name, setName] = useState(accountName || "Trainee");
  const [key, setKey] = useState("");
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [boundTeam, setBoundTeam] = useState<"TEAM_ALPHA" | "TEAM_BRAVO" | "TEAM_CHARLIE" | null>(null);
  const [membershipReady, setMembershipReady] = useState(accountRole !== "team");
  const [membershipError, setMembershipError] = useState("");
  const [membershipAttempt, setMembershipAttempt] = useState(0);
  useEffect(() => {
    if (accountRole !== "team" || participant) return;
    const controller = new AbortController();
    backendRequest<{ role: ParticipantRole | null }>(`/exercises/${encodeURIComponent(id)}/membership`, { signal: controller.signal }, 90000).then(value => {
      if (controller.signal.aborted) return;
      if (value.role === "TEAM_ALPHA" || value.role === "TEAM_BRAVO" || value.role === "TEAM_CHARLIE") {
        setTeam(value.role); setBoundTeam(value.role);
      }
      setMembershipReady(true); setMembershipError("");
    }).catch(failure => {
      if (!controller.signal.aborted) setMembershipError(failure instanceof Error ? failure.message : "Unable to check your team assignment.");
    });
    return () => controller.abort();
  }, [accountRole, id, membershipAttempt, participant]);
  const roomRole = accountRole ? accountParticipantRole(accountRole, team) : role;
  return <AppShell pageTitle={`JOINT EXERCISE — ${id}`} role={roomRole === "INSTRUCTOR" ? "instructor" : roomRole === "COMMANDER" ? "commander" : "team"} workspace>
    {taskSelector}
    {participant ? <SharedSession key={JSON.stringify(participant)} id={id} participant={participant} section={section} basePath={basePath} onJoined={onJoined} leave={() => { setMembershipReady(accountRole !== "team"); setMembershipError(""); setParticipant(null); }} /> :
      <div className="overflow-y-auto p-4 md:p-8"><div className="mx-auto max-w-xl"><Link href="/training" className="mb-5 inline-block text-xs font-bold text-[#556B3F]">← Exercise rooms</Link><div className="mb-6"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#71805A]">One room · One shared timeline</p><h1 className="mt-2 text-2xl font-black text-[#263229]">Connect with your team.</h1><p className="mt-2 text-sm text-[#687066]">Your instructor runs the exercise. Each participant sees the same simulation through their own account.</p></div><PanelCard header={<div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-black uppercase text-[#344438]">Exercise access</span><span className="rounded bg-[#EEF3E8] px-2 py-1 font-mono text-xs text-[#556B3F]">{id}</span></div>}>
        <form className="space-y-4" onSubmit={event => {
          event.preventDefault();
          if (!membershipReady) return;
          let saved = "";
          try { saved = localStorage.getItem(keyStorage(id)) || ""; } catch { /* Explicit key entry remains available. */ }
          setParticipant({ role: roomRole, name: name.trim(), uid, key: roomRole === "INSTRUCTOR" ? recoveredKey || key.trim() || saved : "" });
        }}>
          {accountRole ? <div className="rounded-lg border border-[#D9D8CE] bg-[#EEF3E8] p-4 text-sm text-[#344438]"><p className="font-black">{accountRole === "instructor" ? "Instructor · room creator" : `Trainee · ${accountRoleLabels[accountRole]}` }</p><p className="mt-1 text-xs text-[#687066]">{accountRole === "instructor" ? "Manage the room you created. Only this room’s creator can use Instructor controls." : accountRole === "commander" ? "Coordinate teams and record decisions. Your instructor manages exercise settings." : "Send field reports and move your own team. Choose your team below."}</p><span className="mt-3 inline-block text-[10px] font-bold uppercase tracking-widest text-[#556B3F]">Assigned for this exercise room</span></div> : <><p className="rounded-lg bg-[#FDF3E3] p-3 text-xs text-[#8A5C2A]">Local development session. Test roles work only with a backend explicitly running in demo mode. Live joint exercises require sign-in.</p><label className="block text-xs font-bold text-[#344438]">Local test role<select className={field} value={role} onChange={event => setRole(event.target.value as ParticipantRole)}>{roles.map(r => <option key={r} value={r}>{r.replaceAll("_", " ")}</option>)}</select></label></>}
          {accountRole === "team" && <><div><label htmlFor="room-team" className="block text-xs font-bold text-[#344438]">Your team</label><select id="room-team" className={field} aria-describedby="room-team-help" disabled={!membershipReady || Boolean(boundTeam)} value={team} onChange={event => setTeam(event.target.value as typeof team)}><option value="TEAM_ALPHA">Team Alpha</option><option value="TEAM_BRAVO">Team Bravo</option><option value="TEAM_CHARLIE">Team Charlie</option></select><p id="room-team-help" className="mt-2 text-xs text-[#687066]">{boundTeam ? "Your account is assigned to this team for this room." : membershipReady ? "Your first join assigns your account to this team for the room. Reconnect using the same team." : "Checking your team assignment…"}</p></div>{membershipError && <div role="alert" className="rounded-lg bg-[#FCECE8] p-3 text-xs text-[#A94A3F]">{membershipError}<button type="button" className={`${button} mt-3 block`} onClick={() => setMembershipAttempt(value => value + 1)}>Retry team check</button></div>}</>}
          <div><label className="block text-xs font-bold text-[#344438]">{uid ? "Account name" : "Callsign"}<input className={field} aria-describedby={uid ? "room-account-help" : undefined} value={name} readOnly={Boolean(uid)} onChange={event => setName(event.target.value)} required maxLength={80} /></label>{uid && <p id="room-account-help" className="mt-2 text-xs text-[#687066]">Messages and decisions are recorded against your signed-in account.</p>}</div>
          {roomRole === "INSTRUCTOR" && (recoveredKey ? <p className="text-xs text-[#556B3F]">Instructor access restored securely for your signed-in account.</p> : <div><label className="block text-xs font-bold text-[#344438]">Room recovery key<input className={field} aria-describedby="room-key-help" type="password" value={key} onChange={event => setKey(event.target.value)} placeholder="Uses your saved key on this browser" autoComplete="off" /></label><p id="room-key-help" className="mt-2 text-xs text-[#687066]">On another browser, enter the key and sign in to the same account that created this room.</p></div>)}
          <button className="rounded-lg bg-[#556B3F] px-4 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50" disabled={!name.trim() || !membershipReady}>Connect to exercise</button>
        </form>
      </PanelCard></div></div>}
  </AppShell>;
}

function SharedSession({ id, participant, leave, section, basePath, onJoined }: { id: string; participant: Participant; leave: () => void; section: ExerciseSection; basePath: string; onJoined: (role: ParticipantRole) => void }) {
  const { state, connection, error, notice, command } = useSharedExercise(id, participant.role, participant.name, participant.key, participant.uid);
  const [feedback, setFeedback] = useState("");
  const [feedbackKind, setFeedbackKind] = useState<"info" | "warning" | "error">("info");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [decision, setDecision] = useState("");
  const [actionId, setActionId] = useState("");
  const [rationale, setRationale] = useState("");
  const [areaDraft, setAreaDraft] = useState<TrainingArea | null>(null);
  const [confidence, setConfidence] = useState("medium");
  const [delay, setDelay] = useState(10);
  const [intel, setIntel] = useState("Sector 4 activity reported. Reliability: medium. Verify independently.");
  const [review, setReview] = useState<ServerAARReport | null>(null);
  const instructor = participant.role === "INSTRUCTOR";
  const live = connection === "live";
  useEffect(() => { if (live) onJoined(participant.role); }, [live, onJoined, participant.role]);
  async function run(task: () => Promise<unknown>) {
    setBusy(true); setFeedback(""); setFeedbackKind("info");
    try { await task(); return true; }
    catch (failure) { setFeedbackKind("error"); setFeedback(failure instanceof Error ? failure.message : "Request failed"); return false; }
    finally { setBusy(false); }
  }
  const disabled = !live || busy;
  const running = state?.status === "running";
  function control(action: string, extra = {}) { void run(() => command("EXERCISE_CONTROL", { action, ...extra })); }

  return <div className="flex h-full min-h-0 flex-col">
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 bg-[#263229] px-4 py-3 text-white">
      <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B69B63]">{participant.role.replaceAll("_", " ")} · {participant.name}</p><h1 className="mt-1 text-sm font-black">{state?.scenarioName || "Connecting to simulation"}</h1><p className="mt-1 text-[10px] text-[#D8C7A5]">{connection.toUpperCase()} · {state?.status.toUpperCase() || "AWAITING STATE"} · {state?.connectedTrainees?.length || 0} connected</p></div>
      <div className="flex items-center gap-4"><p className="font-mono text-2xl font-black">{state?.formattedTime || "00:00"}<span className="ml-2 text-xs text-[#B69B63]">/ {state?.totalDuration || "—"}s</span></p><button className={button} onClick={leave}>Disconnect</button></div>
    </div>
    <ExerciseNavigation basePath={basePath} section={section} instructor={instructor} decisionRequired={Boolean(state?.activeDecisionPoint)} />
    <div className={`min-h-0 flex-1 overflow-y-auto p-3 ${section === "map" ? "" : "space-y-5 md:p-6"}`}>
    {error && <div role="alert" className="rounded-lg border border-[#A94A3F] bg-[#FCECE8] p-3 text-sm text-[#A94A3F]">{error}</div>}
    {feedback && <div role={feedbackKind === "error" ? "alert" : "status"} className={`rounded-lg border p-3 text-sm ${feedbackKind === "error" ? "border-[#A94A3F] bg-[#FCECE8] text-[#A94A3F]" : feedbackKind === "warning" ? "border-[#D8C7A5] bg-[#FDF3E3] text-[#8A5C2A]" : "border-[#D9D8CE] bg-[#EEF3E8] text-[#344438]"}`}>{feedback}</div>}
    {notice && live && section !== "map" && <div role="status" aria-live="polite" className="rounded-lg border border-[#D9D8CE] bg-[#F7F5EE] p-3 text-sm text-[#344438]"><p className="font-black">Latest exercise update · {Math.floor(notice.timestamp / 60).toString().padStart(2, "0")}:{Math.floor(notice.timestamp % 60).toString().padStart(2, "0")} · {notice.title}</p><p className="mt-1 text-xs text-[#687066]">{notice.description}</p></div>}
    {!state && <p className="text-sm text-[#687066]">Waiting for the server. If the room has expired or the server restarted, create a new exercise from the rooms page.</p>}
    {state && <>
      {!instructor && (section === "setup" || section === "controls") && <PanelCard header="Instructor-managed settings"><p className="text-sm text-[#687066]">Your instructor chooses the training area and controls the shared exercise. Use the tactical map, situation and communications pages to follow the exercise.</p></PanelCard>}
      {instructor && (section === "controls" || section === "setup") && <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Instructor control</span>}>
        {section === "controls" && <div className="flex flex-wrap items-center gap-2">
          <button className={button} disabled={disabled || state.status !== "pending"} onClick={() => control("start")}>Start</button>
          <button className={button} disabled={disabled || !running} onClick={() => control("pause")}>Pause</button>
          <button className={button} disabled={disabled || state.status !== "paused"} onClick={() => control("resume")}>Resume</button>
          <button className={button} disabled={disabled || state.status === "completed"} onClick={() => control("end")}>End exercise</button>
          <button className={button} disabled={disabled || running} onClick={() => { setReview(null); setAreaDraft(null); control("reset"); }}>Reset room</button>
          <label className="text-xs font-bold text-[#687066]">Speed <select className="ml-2 rounded border border-[#D9D8CE] p-2" value={state.speedMultiplier} disabled={disabled || state.status === "completed"} onChange={event => control("set_speed", { speedMultiplier: Number(event.target.value) })}>{[0.25, 0.5, 1, 2, 5, 10].map(value => <option value={value} key={value}>{value}×</option>)}</select></label>
        </div>}
        {section === "setup" && <details open className="mt-4 rounded border border-[#D9D8CE] p-3 text-xs text-[#344438]">
          <summary className="cursor-pointer font-bold">Training area · {state.trainingArea?.name || DEFAULT_TRAINING_AREA.name}</summary>
          <div className="mt-3 max-w-xl space-y-3">
            <TrainingAreaFields value={areaDraft || state.trainingArea || DEFAULT_TRAINING_AREA} onChange={setAreaDraft} disabled={disabled || state.status !== "pending"} />
            <button className={button} disabled={disabled || state.status !== "pending" || !areaDraft || Boolean(trainingAreaError(areaDraft))} onClick={() => void run(async () => { await command("EXERCISE_CONTROL", { action: "set_training_area", trainingArea: areaDraft }); setAreaDraft(null); })}>Apply training area</button>
            <p>Choose the area before starting. Reset the exercise to change its geographic placement.</p>
          </div>
        </details>}
        {section === "controls" && <><div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-[#344438]">Radio delay (simulation seconds)<input className={field} type="number" min={0} max={60} value={delay} onChange={event => setDelay(Number(event.target.value))} /></label>
          <label className="text-xs font-bold text-[#344438]">Intelligence relay report<textarea className={field} maxLength={2000} value={intel} onChange={event => setIntel(event.target.value)} /></label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">{injections.map(([action, label]) => <button className={button} key={action} disabled={disabled || !["running", "paused"].includes(state.status) || (action === "new_intelligence" && !intel.trim())} onClick={() => void run(() => command("INSTRUCTOR_INJECT", { action, payload: action === "delay_radio" ? { delay } : action === "new_intelligence" ? { content: intel } : {} }))}>{label}</button>)}</div>
        <p className="mt-3 text-xs text-[#687066]">Participants: {state.connectedTrainees?.map(p => `${p.name} (${p.role})`).join(" · ") || "None"}</p></>}
      </PanelCard>}
      {section === "map" && <div className="h-full min-h-[520px] min-w-0">
            <ExerciseMap compact trainingArea={state.trainingArea} eventLog={state.eventLog} mapSnapshotSecond={state.mapSnapshotSecond} units={state.units} activityMarkers={state.activityMarkers} mapStatus={live ? state.mapStatus : state.mapStatus === "unavailable" ? "unavailable" : "outdated"} mapLastUpdated={live ? state.mapLastUpdated : "Server disconnected — last received snapshot"} movementEnabled={!disabled && running} movableUnitIds={participant.role.startsWith("TEAM_") ? [`unit-${participant.role.slice(5).toLowerCase()}`] : undefined} onUnitMove={(unitId, point) => { void run(() => command("TEAM_MOVEMENT", { unitId, x: point.x, y: point.y })); }} className="h-full" />
          </div>}
          {section === "situation" && <><p className="text-xs text-[#687066]">Simulated training grid · {state.trainingArea?.name || DEFAULT_TRAINING_AREA.name} · {state.mapStatus.toUpperCase()} · Movement follows the server clock. Team participants can move their own team. Offline radio drops transmissions; intelligence uses a separate relay.</p>
          <OfflineSituation state={state} /></>}
          {section === "decisions" && (participant.role === "COMMANDER") && <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Commander decision</span>}>
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
          {section === "communications" && <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Radio net · {state.commsStatus}</span>}>
            <p className="text-xs text-[#687066]">{state.radioDelaySeconds}s delay · {state.pendingMessages.length} queued · {state.commsStatus === "offline" ? "Transmissions will be dropped" : "Delivery follows simulation conditions"}</p>
            <div className="my-4 max-h-[420px] space-y-3 overflow-y-auto">{state.messages.filter(m => m.deliveryStatus === "DELIVERED").map(m => <div className="rounded-lg border border-[#D9D8CE] bg-[#F7F5EE] p-3 text-xs text-[#344438]" key={m.id}><p className="mb-2 font-black text-[#556B3F]">{m.formattedTimeDelivered} · {m.sender}</p><p>{m.content}</p>{m.isConflicting && <p className="mt-2 font-bold text-[#A94A3F]">Conflicting report — independently verify</p>}</div>)}</div>
            <form className="space-y-3" onSubmit={async event => {
              event.preventDefault();
              const accepted = await run(async () => {
                const result = await command("RADIO_MESSAGE", { content: message });
                if (result.deliveryStatus === "DROPPED") { setFeedbackKind("warning"); setFeedback("Transmission dropped: radio net offline. This attempt is logged for AAR."); }
                else if (result.deliveryStatus === "DELAYED") setFeedback("Transmission queued. It will arrive after the simulation delay.");
              });
              if (accepted) setMessage("");
            }}>
              <label className="block text-xs font-bold text-[#344438]">Radio message<textarea className={field} value={message} onChange={event => setMessage(event.target.value)} required maxLength={2000} /></label>
              <button className={button} disabled={disabled || !running || !message.trim()}>Transmit</button>
            </form>
          </PanelCard>}
          {section === "decisions" && <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Decision records · {state.decisions.length}</span>}>
            <div className="space-y-3">{state.decisions.length ? state.decisions.map(d => <div key={d.id} className="rounded-lg bg-[#EEF3E8] p-3 text-xs text-[#344438]"><p className="font-black">{d.simulationTime} · {d.traineeId}</p><p className="mt-2 font-bold">{d.selectedActionLabel}</p><p className="mt-2">{d.rationale}</p><p className="mt-2 text-[#687066]">Confidence: {d.confidence} · Comms: {d.communicationState}</p></div>) : <p className="text-xs text-[#687066]">No decisions recorded yet.</p>}</div>
          </PanelCard>}
      {section === "review" && <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">After-action review</span>}>
        <p className="text-xs text-[#687066]">{state.status === "completed" ? "Final report available for all participants." : "Full review is available to the instructor during training, and to participants after the exercise ends."}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={button} disabled={disabled || (!instructor && state.status !== "completed")} onClick={() => void run(async () => { const value = await backendRequest<unknown>(`/exercises/${id}/aar`, { headers: participant.key ? { "X-Instructor-Key": participant.key } : {} }); if (!isServerAARReport(value, id)) throw new Error("The server returned an incomplete review."); setReview(value); })}>View AAR</button>
          <Link className={`${button} inline-block`} href={`/aar/${encodeURIComponent(id)}`}>Open full review page</Link>
          {(["json", "csv"] as const).map(format => <button className={button} key={format} disabled={disabled || (!instructor && state.status !== "completed")} onClick={() => void run(() => downloadAAR(id, participant.key, format))}>Export {format.toUpperCase()}</button>)}
          <button className={button} onClick={() => void run(async () => { await navigator.clipboard.writeText(`${window.location.origin}/training/${id}`); setFeedback("Participant link copied. This link has no instructor key."); })}>Copy participant link</button>
        </div>
        {review && <div className="mt-5"><AARReview report={review} role={instructor ? "Instructor" : "Trainee"} /></div>}
      </PanelCard>}
      {section !== "map" && <p className="text-[10px] text-[#687066]">{participant.uid ? "Your room role controls access. Only the room creator can change exercise settings; team accounts move their assigned team." : "Local development test session. Live joint exercises require authenticated accounts."} Export the review before resetting the room.</p>}
    </>}
    </div>
  </div>;
}

