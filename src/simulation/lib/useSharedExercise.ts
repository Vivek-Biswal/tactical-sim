"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ExerciseState } from "../types/exercise";
import { getBackendIdentityToken, socketUrl } from "./backend";
import { parseSharedPacket, type ScenarioNotice } from "./sharedProtocol";

export type ParticipantRole = "COMMANDER" | "TEAM_ALPHA" | "TEAM_BRAVO" | "TEAM_CHARLIE" | "INSTRUCTOR";
type Pending = { resolve: (value: Record<string, unknown>) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> };

export function useSharedExercise(id: string, role: ParticipantRole, name: string, instructorKey: string, identityUid?: string) {
  const [state, setState] = useState<ExerciseState | null>(null);
  const [connection, setConnection] = useState<"connecting" | "live" | "reconnecting" | "error">("connecting");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<ScenarioNotice | null>(null);
  const socket = useRef<WebSocket | null>(null);
  const pending = useRef(new Map<string, Pending>());

  useEffect(() => {
    let disposed = false;
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    let joinTimeout: ReturnType<typeof setTimeout> | undefined;
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
      setConnection(attempts ? "reconnecting" : "connecting");
      let ws: WebSocket;
      try { ws = new WebSocket(socketUrl(id)); } catch (failure) {
        setError(failure instanceof Error ? failure.message : "Unable to connect"); setConnection("error"); return;
      }
      let lastError = "";
      socket.current = ws;
      joinTimeout = setTimeout(() => {
        if (disposed) return;
        lastError = "The server has not joined this room yet. Retrying the connection…";
        setError(lastError);
        ws.close();
      }, 20000);
      ws.onopen = async () => {
        if (disposed) { ws.close(); return; }
        try {
          const idToken = await getBackendIdentityToken(identityUid);
          if (disposed || ws.readyState !== WebSocket.OPEN) return;
          ws.send(JSON.stringify({ type: "JOIN", role, name, idToken, instructorKey: role === "INSTRUCTOR" ? instructorKey : undefined }));
        } catch (failure) {
          lastError = failure instanceof Error ? failure.message : "Sign in again before joining this exercise.";
          setError(lastError); setConnection("error");
          ws.close(1008, "Sign-in required");
        }
      };
      ws.onmessage = event => {
        if (disposed) return;
        try {
          const packet = parseSharedPacket(event.data, id);
          if (packet.type === "STATE_UPDATE") {
            clearTimeout(joinTimeout);
            setState(packet.state); setConnection("live"); setError(""); attempts = 0;
          } else if (packet.type === "SCENARIO_EVENT") {
            if (!/^(TEAM_|MESSAGE_|UAV_)/.test(packet.notice.event)) setNotice(packet.notice);
          } else if (packet.type === "ACK" || packet.type === "ERROR") {
            const request = packet.requestId ? requests.get(packet.requestId) : undefined;
            if (request) {
              clearTimeout(request.timer); requests.delete(packet.requestId!);
              if (packet.type === "ACK") request.resolve(packet.result);
              else request.reject(new Error(packet.message));
            } else if (packet.type === "ERROR") { lastError = packet.message; setError(packet.message); setConnection("error"); }
          }
        } catch {
          lastError = "Invalid simulation update received. Controls are disabled while reconnecting.";
          setError(lastError); setConnection("error"); ws.close();
        }
      };
      ws.onclose = event => {
        if (disposed) return;
        clearTimeout(joinTimeout);
        rejectPending();
        if (event.code === 1008) { setError(lastError || event.reason || "Your account cannot join this room in the requested role. Check your account, room ID and instructor key."); setConnection("error"); return; }
        setConnection("reconnecting");
        setError(lastError || "Server connection lost. Controls are disabled while reconnecting.");
        reconnect = setTimeout(connect, Math.min(10000, 1000 * 2 ** Math.min(attempts++, 4)));
      };
      ws.onerror = () => { /* onclose supplies the visible error and reconnect path */ };
    }
    connect();
    return () => { disposed = true; clearTimeout(reconnect); clearTimeout(joinTimeout); rejectPending(); socket.current?.close(); socket.current = null; };
  }, [id, role, name, instructorKey, identityUid]);

  const command = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      if (socket.current?.readyState !== WebSocket.OPEN || connection !== "live") { reject(new Error("Connect to the server before issuing a command.")); return; }
      const requestId = crypto.randomUUID();
      const timer = setTimeout(() => {
        pending.current.delete(requestId);
        reject(new Error("Acknowledgement timed out. Check the timeline before retrying."));
      }, 8000);
      pending.current.set(requestId, { resolve, reject, timer });
      try { socket.current.send(JSON.stringify({ type, payload, requestId })); }
      catch {
        clearTimeout(timer); pending.current.delete(requestId);
        reject(new Error("The connection closed before this command was sent. Reconnect before retrying."));
      }
    });
  }, [connection]);
  return { state, connection, error, notice, command };
}
