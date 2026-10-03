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

export async function backendRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    ...options, headers: { "Content-Type": "application/json", ...options.headers },
    signal: options.signal ?? AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = body.detail;
    throw new Error(typeof detail === "string" ? detail : `Server rejected request (${response.status}). Check the submitted fields.`);
  }
  return response.json() as Promise<T>;
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
