import type { ExerciseState } from "../types/exercise";
import { auth, isFirebaseConfigured } from "../../lib/firebase";

/** Always obtain the token from Firebase; browser role labels are never credentials. */
export async function getBackendIdentityToken(expectedUid?: string): Promise<string | undefined> {
  if (!isFirebaseConfigured || !auth) {
    // Unauthenticated practice is only useful against an explicitly configured local demo server.
    if (typeof window !== "undefined" && !["localhost", "127.0.0.1"].includes(window.location.hostname)) {
      throw new Error("Sign-in is unavailable on this deployment. Ask your exercise organiser to configure Firebase.");
    }
    return undefined;
  }
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user || (expectedUid && user.uid !== expectedUid)) throw new Error("Sign in again before connecting to this exercise.");
  let token: string;
  try { token = await user.getIdToken(); }
  catch { throw new Error("Your sign-in could not be verified. Check your connection, then sign in again."); }
  if (auth.currentUser?.uid !== user.uid) throw new Error("Your account changed. Reconnect to the exercise with your current account.");
  return token;
}

async function requestHeaders(initial?: HeadersInit, signal?: AbortSignal): Promise<Headers> {
  const identity = getBackendIdentityToken();
  const token = signal ? await new Promise<string | undefined>((resolve, reject) => {
    const abort = () => reject(signal.reason);
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
    identity.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  }) : await identity;
  signal?.throwIfAborted();
  const headers = new Headers(initial);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

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
    const headers = await requestHeaders(options.headers, signal);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    response = await fetch(`${base}${path}`, {
      ...options, headers, signal,
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
export const keyStorage = (id: string) => `tactical-sim:v1:instructor:${isFirebaseConfigured ? `${auth?.currentUser?.uid || "signed-out"}:` : ""}${id}`;

export async function downloadAAR(id: string, key: string, format: "json" | "csv") {
  const initiatingUid = auth?.currentUser?.uid;
  const checkAccount = () => {
    if (isFirebaseConfigured && (!initiatingUid || auth?.currentUser?.uid !== initiatingUid)) {
      throw new Error("Your account changed or signed out. Open the review with your current account and export again.");
    }
  };
  checkAccount();
  const signal = AbortSignal.timeout(15000);
  const headers = await requestHeaders(key ? { "X-Instructor-Key": key } : {}, signal);
  checkAccount();
  const response = await fetch(`${apiBase()}/exercises/${encodeURIComponent(id)}/aar/export?format=${format}`, {
    headers, signal,
  });
  checkAccount();
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    checkAccount();
    throw new Error(body.detail || "Unable to export report.");
  }
  const blob = await response.blob();
  checkAccount(); signal.throwIfAborted();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = `aar-${id}.${format}`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
