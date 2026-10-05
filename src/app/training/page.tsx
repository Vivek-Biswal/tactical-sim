"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { auth } from "@/lib/firebase";
import { PanelCard } from "@/components/ui/PanelCard";
import { TrainingAreaFields } from "@/simulation/components/geographic/TrainingAreaFields";
import { DEFAULT_TRAINING_AREA, trainingAreaError } from "@/simulation/lib/geography";
import type { TrainingArea } from "@/simulation/types/geography";
import { backendRequest, keyStorage, type RoomCreated, type RoomSummary } from "@/simulation/lib/backend";

const button = "rounded-lg bg-[#556B3F] px-4 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50";
const field = "w-full rounded-lg border border-[#D9D8CE] bg-white p-3 text-sm text-[#344438]";

export default function TrainingLobby() {
  const { user, role } = useAuth();
  return <AuthGuard><AccountLobby key={`${user?.uid || "local"}:${role || "practice"}`} /></AuthGuard>;
}

function AccountLobby() {
  const router = useRouter();
  const { user, role, loading: authLoading, isFirebaseConfigured } = useAuth();
  const canCreate = true;
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [teamName, setTeamName] = useState("Task Force Alpha");
  const [demo, setDemo] = useState(true);
  const [trainingArea, setTrainingArea] = useState<TrainingArea>({ ...DEFAULT_TRAINING_AREA });
  const [roomId, setRoomId] = useState("");
  const [joinError, setJoinError] = useState("");
  const creation = useRef<{ disposed: boolean; controller: AbortController | null }>({ disposed: false, controller: null });
  useEffect(() => {
    const lifecycle = creation.current;
    lifecycle.disposed = false;
    return () => { lifecycle.disposed = true; lifecycle.controller?.abort(); };
  }, []);
  useEffect(() => {
    if (authLoading || (isFirebaseConfigured && (!user || !role))) return;
    const controller = new AbortController();
    const startupHint = setTimeout(() => { if (!controller.signal.aborted) setWaiting(true); }, 5000);
    backendRequest<RoomSummary[]>("/exercises", { signal: controller.signal }, 90000).then(rooms => {
      if (!controller.signal.aborted) { setRooms(rooms); setConnected(true); setError(""); }
    }).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Unable to load exercises");
    }).finally(() => { clearTimeout(startupHint); if (!controller.signal.aborted) { setLoading(false); setWaiting(false); } });
    return () => { clearTimeout(startupHint); controller.abort(); };
  }, [connectionAttempt, authLoading, isFirebaseConfigured, user, role]);

  function retryConnection() {
    setError(""); setConnected(false); setLoading(true); setWaiting(false);
    setConnectionAttempt(value => value + 1);
  }

  async function create() {
    const lifecycle = creation.current;
    if (lifecycle.disposed || lifecycle.controller) return;
    const initiatingUid = user?.uid;
    const sameAccount = () => !isFirebaseConfigured || Boolean(initiatingUid && auth?.currentUser?.uid === initiatingUid);
    if (!sameAccount()) { setError("Your account changed. Sign in again before creating an exercise."); return; }
    const areaError = trainingAreaError(trainingArea);
    if (areaError) { setError(areaError); return; }
    const controller = new AbortController();
    lifecycle.controller = controller;
    setBusy(true); setError("");
    try {
      const room = await backendRequest<RoomCreated>("/exercises", { method: "POST", signal: controller.signal, body: JSON.stringify({ teamName, isDemoMode: demo, trainingArea }) });
      if (lifecycle.disposed || controller.signal.aborted || !sameAccount()) return;
      localStorage.setItem(keyStorage(room.exerciseId), room.instructorKey);
      router.push(`/training/${room.exerciseId}${isFirebaseConfigured ? "/controls" : "/controls?role=INSTRUCTOR"}`);
    } catch (failure) {
      if (!lifecycle.disposed && !controller.signal.aborted && sameAccount()) setError(failure instanceof Error ? failure.message : "Unable to create exercise");
    } finally {
      if (lifecycle.controller === controller) lifecycle.controller = null;
      if (!lifecycle.disposed && !controller.signal.aborted && sameAccount()) setBusy(false);
    }
  }

  function join() {
    const id = roomId.trim().toLowerCase();
    if (!/^ex-[a-f0-9]{12}$/.test(id)) {
      setJoinError("Enter the full room ID shared by your instructor, for example ex-12ab34cd56ef. You can also open their invitation link.");
      return;
    }
    router.push(`/training/${encodeURIComponent(id)}`);
  }

  return <AppShell pageTitle="JOINT EXERCISE ROOMS" role={role || "commander"}>
    <div className="mb-8"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#71805A]">TRAIN TOGETHER</p><h1 className="mt-2 text-3xl font-black text-[#263229]">Create or join a training exercise.</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#687066]">Create a room to lead it as Instructor. Join someone else’s room to practise as a Trainee. The same account can do both in different rooms.</p></div>
    {!isFirebaseConfigured && <p className="mb-6 rounded-lg border border-[#D8C7A5] bg-[#FDF3E3] p-4 text-xs text-[#8A5C2A]">This local test lobby works with a server explicitly configured in demo mode. Configure Firebase sign-in to use separate accounts for live joint training.</p>}
    {loading && <div role="status" className="mb-6 rounded-lg border border-[#D9D8CE] bg-[#EEF3E8] p-4 text-sm text-[#344438]">{waiting ? "Still connecting. The simulation server may be starting; the first connection can take about a minute." : "Connecting to simulation server…"}<p className="mt-2 text-xs text-[#687066]">You can choose your training area while we connect.</p></div>}
    {error && <div role="alert" className="mb-6 rounded-lg border border-[#A94A3F] bg-[#FCECE8] p-4 text-sm text-[#A94A3F]">{error}<div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" className={button} disabled={loading || busy} onClick={retryConnection}>Retry connection</button><Link className="text-xs font-bold underline" href="/maps">Use local map practice</Link></div></div>}
    <div className={`grid gap-6 ${canCreate ? "lg:grid-cols-2" : "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"}`}>
      {canCreate &&
      <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Create instructor room</span>}>
        <form className="space-y-4" onSubmit={event => { event.preventDefault(); void create(); }}>
          <label className="block text-xs font-bold text-[#344438]">Team name<input className={field + " mt-2"} value={teamName} onChange={event => setTeamName(event.target.value)} required maxLength={80} /></label>
          <label className="block text-xs font-bold text-[#344438]">Exercise length<select className={field + " mt-2"} value={demo ? "demo" : "standard"} onChange={event => setDemo(event.target.value === "demo")}><option value="demo">2-minute demonstration</option><option value="standard">15-minute training</option></select></label>
          <TrainingAreaFields value={trainingArea} onChange={setTrainingArea} disabled={busy} />
          <button className={button} disabled={busy || !connected || loading || !teamName.trim() || Boolean(trainingAreaError(trainingArea))}>{busy ? "Creating…" : "Create room"}</button>
          <p className="text-xs leading-relaxed text-[#687066]">Your room recovery key is saved for this account on this browser. Participants only need the room ID or invitation link. Export the review before resetting your exercise.</p>
        </form>
      </PanelCard>}
      <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Join an exercise</span>}>
        <form className="space-y-4" onSubmit={event => { event.preventDefault(); join(); }}>
          <p className="text-sm leading-relaxed text-[#687066]">Enter a room ID or use an invitation link. You will be Instructor in your own room and Trainee in another person’s room.</p>
          <label className="block text-xs font-bold text-[#344438]">Room ID<input className={field + " mt-2 font-mono"} value={roomId} onChange={event => { setRoomId(event.target.value); setJoinError(""); }} placeholder="ex-12ab34cd56ef" autoComplete="off" spellCheck={false} aria-describedby={joinError ? "room-id-error" : undefined} aria-invalid={Boolean(joinError)} required maxLength={40} /></label>
          {joinError && <p role="alert" id="room-id-error" className="text-xs text-[#A94A3F]">{joinError}</p>}
          <button className={button} disabled={!roomId.trim()}>Join room</button>
          <p className="text-xs text-[#687066]">Trainees can choose Commander or a field team on first joining. That task stays fixed for this room.</p>
        </form>
      </PanelCard>
      {!canCreate && <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">What happens next</span>}><ol className="space-y-5 text-sm text-[#344438]"><li><strong>1. Connect to your room</strong><p className="mt-1 text-xs leading-relaxed text-[#687066]">Use your account and the ID your instructor shared.</p></li><li><strong>2. Wait for the exercise to start</strong><p className="mt-1 text-xs leading-relaxed text-[#687066]">Your instructor chooses the area and starts the shared clock.</p></li><li><strong>3. Train and review together</strong><p className="mt-1 text-xs leading-relaxed text-[#687066]">Use maps, radio and decisions. Review recorded events when the exercise ends.</p></li></ol></PanelCard>}
    </div>
    <div className="mt-6" id="server-exercises"><PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Your exercise rooms and reviews</span>}>
      {loading ? <p className="text-sm text-[#687066]">Loading exercise rooms…</p> : rooms.length ? <ul className="divide-y divide-[#D9D8CE]">{rooms.map(room => <li className="flex flex-wrap items-center justify-between gap-3 py-4" key={room.exerciseId}><div><p className="font-black text-[#344438]">{room.teamName}</p><p className="mt-1 text-xs font-mono text-[#687066]">{room.exerciseId} · {room.status.toUpperCase()}</p></div><div className="flex gap-2"><Link className={button} href={`/training/${room.exerciseId}`}>Open room</Link>{room.status === "completed" && <Link className={button} href={`/aar/${room.exerciseId}`}>Review AAR</Link>}</div></li>)}</ul> : <p className="text-sm text-[#687066]">{canCreate ? "No rooms available. Create a new exercise to begin." : "No rooms are available yet. Ask your instructor to create an exercise and share its room ID."}</p>}
    </PanelCard></div>
    <Link className="mt-6 inline-block text-xs font-bold text-[#556B3F] underline" href="/maps">Explore maps in a single-browser practice exercise</Link>
  </AppShell>;
}
