import type { ExerciseState } from "../types/exercise";

export function apiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return `http://${window.location.hostname}:8000/api`;
  }
  throw new Error("Configure NEXT_PUBLIC_API_BASE_URL for the simulation server.");
}

export function socketUrl(id: string): string {
  const configured = process.env.NEXT_PUBLIC_WS_BASE_URL?.replace(/\/$/, "");
  const base = configured || apiBase().replace(/\/api$/, "").replace(/^http/, "ws");
  return `${base}/ws/exercises/${encodeURIComponent(id)}`;
}

export async function backendRequest<T>(path: string, options: RequestInit = {}, timeoutMs = 15000): Promise<T> {
  const base = apiBase();
  const deadline = AbortSignal.timeout(timeoutMs);
  const signal = options.signal ? AbortSignal.any([options.signal, deadline]) : deadline;
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options, headers: { "Content-Type": "application/json", ...options.headers }, signal,
    });
  } catch (failure) {
    if (options.signal?.aborted) throw failure;
    const mutation = !["GET", "HEAD"].includes((options.method || "GET").toUpperCase());
    if (deadline.aborted) throw new Error(`The simulation server did not respond in time. It may still be starting.${mutation ? " The request may have reached the server; check the room list before submitting again." : " Retry the connection in a moment."}`);
    if (failure instanceof TypeError) throw new Error("Cannot reach the simulation server. Check your connection or ask the exercise organiser to check the backend URL and allowed website domain.");
    throw failure;
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = body.detail;
    throw new Error(typeof detail === "string" ? detail : [502, 503, 504].includes(response.status) ? "The simulation server is temporarily unavailable or still starting. Retry the connection shortly." : `Server rejected request (${response.status}). Check the submitted fields.`);
  }
  try { return await response.json() as T; }
  catch (failure) {
    if (options.signal?.aborted) throw failure;
    if (deadline.aborted) throw new Error("The simulation response timed out while loading. Retry the connection.");
    throw new Error("The backend did not return a valid simulation response. Ask the exercise organiser to check its URL and deployment.");
  }
}

export type RoomSummary = Pick<ExerciseState, "exerciseId" | "scenarioName" | "teamName" | "status" | "elapsedSeconds">;
export type RoomCreated = ExerciseState & { instructorKey: string };
export const keyStorage = (id: string) => `tactical-sim:v1:instructor:${id}`;

export async function downloadAAR(id: string, key: string, format: "json" | "csv") {
  const response = await fetch(`${apiBase()}/exercises/${encodeURIComponent(id)}/aar/export?format=${format}`, {
    headers: key ? { "X-Instructor-Key": key } : {}, signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || "Unable to export report.");
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url; link.download = `aar-${id}.${format}`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
