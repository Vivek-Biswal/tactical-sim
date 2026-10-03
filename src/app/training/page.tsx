"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PanelCard } from "@/components/ui/PanelCard";
import { TrainingAreaFields } from "@/simulation/components/geographic/TrainingAreaFields";
import { DEFAULT_TRAINING_AREA, trainingAreaError } from "@/simulation/lib/geography";
import type { TrainingArea } from "@/simulation/types/geography";
import { backendRequest, keyStorage, type RoomCreated, type RoomSummary } from "@/simulation/lib/backend";

const button = "rounded-lg bg-[#556B3F] px-4 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50";
const field = "w-full rounded-lg border border-[#D9D8CE] bg-white p-3 text-sm text-[#344438]";

export default function TrainingLobby() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState("Task Force Alpha");
  const [demo, setDemo] = useState(true);
  const [trainingArea, setTrainingArea] = useState<TrainingArea>({ ...DEFAULT_TRAINING_AREA });
  const [roomId, setRoomId] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    backendRequest<RoomSummary[]>("/exercises", { signal: controller.signal }).then(setRooms).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Unable to load exercises");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function create() {
    const areaError = trainingAreaError(trainingArea);
    if (areaError) { setError(areaError); return; }
    setBusy(true); setError("");
    try {
      const room = await backendRequest<RoomCreated>("/exercises", { method: "POST", body: JSON.stringify({ teamName, isDemoMode: demo, trainingArea }) });
      localStorage.setItem(keyStorage(room.exerciseId), room.instructorKey);
      router.push(`/training/${room.exerciseId}?role=INSTRUCTOR`);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to create exercise"); }
    finally { setBusy(false); }
  }

  return <AppShell pageTitle="SHARED EXERCISES" role="instructor">
    <div className="mb-8"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#71805A]">LIVE TRAINING</p><h1 className="mt-2 text-3xl font-black text-[#263229]">One exercise. Shared decisions.</h1><p className="mt-3 max-w-2xl text-sm text-[#687066]">Create Operation Silent Link, then invite a commander and field teams using the same room ID. The simulation server controls the clock, communication failures and map updates.</p></div>
    {error && <div role="alert" className="mb-6 rounded-lg border border-[#A94A3F] bg-[#FCECE8] p-4 text-sm text-[#A94A3F]">{error}<p className="mt-2">Start the FastAPI server on port 8000, or configure the backend URL for this frontend.</p></div>}
    <div className="grid gap-6 lg:grid-cols-2">
      <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Create instructor room</span>}>
        <form className="space-y-4" onSubmit={event => { event.preventDefault(); void create(); }}>
          <label className="block text-xs font-bold text-[#344438]">Team name<input className={field + " mt-2"} value={teamName} onChange={event => setTeamName(event.target.value)} required maxLength={80} /></label>
          <label className="block text-xs font-bold text-[#344438]">Exercise length<select className={field + " mt-2"} value={demo ? "demo" : "standard"} onChange={event => setDemo(event.target.value === "demo")}><option value="demo">2-minute demonstration</option><option value="standard">15-minute training</option></select></label>
          <TrainingAreaFields value={trainingArea} onChange={setTrainingArea} disabled={busy} />
          <button className={button} disabled={busy || !teamName.trim() || Boolean(trainingAreaError(trainingArea))}>{busy ? "Creating…" : "Create room"}</button>
          <p className="text-xs text-[#687066]">Your instructor key stays in this browser. Room records stay in server memory until restart or expiry; export your AAR before then.</p>
        </form>
      </PanelCard>
      <PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Join an exercise</span>}>
        <form className="space-y-4" onSubmit={event => { event.preventDefault(); if (roomId.trim()) router.push(`/training/${encodeURIComponent(roomId.trim())}`); }}>
          <label className="block text-xs font-bold text-[#344438]">Room ID<input className={field + " mt-2"} value={roomId} onChange={event => setRoomId(event.target.value)} placeholder="ex-…" required /></label>
          <button className={button} disabled={!roomId.trim()}>Join room</button>
          <p className="text-xs text-[#687066]">Select Commander or Team Alpha/Bravo when joining. Another computer must reach both the frontend and backend.</p>
        </form>
      </PanelCard>
    </div>
    <div className="mt-6"><PanelCard header={<span className="text-xs font-black uppercase text-[#344438]">Server exercises</span>}>
      {loading ? <p className="text-sm text-[#687066]">Connecting to simulation server…</p> : rooms.length ? <ul className="divide-y divide-[#D9D8CE]">{rooms.map(room => <li className="flex flex-wrap items-center justify-between gap-3 py-4" key={room.exerciseId}><div><p className="font-black text-[#344438]">{room.teamName}</p><p className="mt-1 text-xs font-mono text-[#687066]">{room.exerciseId} · {room.status.toUpperCase()}</p></div><Link className={button} href={`/training/${room.exerciseId}`}>Join / review</Link></li>)}</ul> : <p className="text-sm text-[#687066]">No rooms available. Create a new exercise to begin.</p>}
    </PanelCard></div>
    <Link className="mt-6 inline-block text-xs font-bold text-[#556B3F] underline" href="/commander/simulation/ex-001">Open the separate offline map demonstration</Link>
  </AppShell>;
}
