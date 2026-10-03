"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ExerciseState } from "../types/exercise";
import { socketUrl } from "./backend";

export type ParticipantRole = "COMMANDER" | "TEAM_ALPHA" | "TEAM_BRAVO" | "TEAM_CHARLIE" | "INSTRUCTOR";
type Pending = { resolve: (value: Record<string, unknown>) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> };

export function useSharedExercise(id: string, role: ParticipantRole, name: string, instructorKey: string) {
  const [state, setState] = useState<ExerciseState | null>(null);
  const [connection, setConnection] = useState<"connecting" | "live" | "reconnecting" | "error">("connecting");
  const [error, setError] = useState("");
  const socket = useRef<WebSocket | null>(null);
  const pending = useRef(new Map<string, Pending>());

  useEffect(() => {
    let disposed = false;
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const requests = pending.current;
    function rejectPending() {
      for (const request of requests.values()) {
        clearTimeout(request.timer);
        request.reject(new Error("Connection lost. Check the timeline before retrying; the command may have reached the server."));
      }
      requests.clear();
    }
    function connect() {
      if (disposed) return;
      let ws: WebSocket;
      try { ws = new WebSocket(socketUrl(id)); } catch (failure) {
        setError(failure instanceof Error ? failure.message : "Unable to connect"); setConnection("error"); return;
      }
      socket.current = ws;
      ws.onopen = () => ws.send(JSON.stringify({ type: "JOIN", role, name, instructorKey: role === "INSTRUCTOR" ? instructorKey : undefined }));
      ws.onmessage = event => {
        if (disposed) return;
        try {
          const packet = JSON.parse(event.data);
          if (packet.type === "STATE_UPDATE") {
            setState(packet.state as ExerciseState); setConnection("live"); setError(""); attempts = 0;
          } else if (packet.type === "ACK" || packet.type === "ERROR") {
            const request = requests.get(packet.requestId);
            if (request) {
              clearTimeout(request.timer); requests.delete(packet.requestId);
              if (packet.type === "ACK") request.resolve(packet.result || {});
              else request.reject(new Error(packet.message));
            } else if (packet.type === "ERROR") { setError(packet.message); setConnection("error"); }
          }
        } catch { setError("Invalid simulation update received."); }
      };
      ws.onclose = event => {
        if (disposed) return;
        rejectPending();
        if (event.code === 1008) { setConnection("error"); return; }
        setConnection("reconnecting");
        setError("Server connection lost. Controls are disabled while reconnecting.");
        reconnect = setTimeout(connect, Math.min(10000, 1000 * 2 ** Math.min(attempts++, 4)));
      };
      ws.onerror = () => { /* onclose supplies the visible error and reconnect path */ };
    }
    connect();
    return () => { disposed = true; clearTimeout(reconnect); rejectPending(); socket.current?.close(); socket.current = null; };
  }, [id, role, name, instructorKey]);

  const command = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      if (socket.current?.readyState !== WebSocket.OPEN || connection !== "live") { reject(new Error("Connect to the server before issuing a command.")); return; }
      const requestId = crypto.randomUUID();
      const timer = setTimeout(() => {
        pending.current.delete(requestId);
        reject(new Error("Acknowledgement timed out. Check the timeline before retrying."));
      }, 8000);
      pending.current.set(requestId, { resolve, reject, timer });
      socket.current.send(JSON.stringify({ type, payload, requestId }));
    });
  }, [connection]);
  return { state, connection, error, command };
}
