import { ExerciseState, AARReportData } from "../types/exercise";
import { Scenario } from "../types/scenario";
import { getSimulationEngine } from "./simulation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function fetchScenarios(): Promise<Scenario[]> {
  try {
    const res = await fetch(`${API_BASE}/scenarios`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Backend API unavailable, using local scenario data:", e);
  }
  const engine = getSimulationEngine();
  return [engine.getState() as unknown as Scenario];
}

export async function fetchExerciseState(exerciseId: string): Promise<ExerciseState> {
  try {
    const res = await fetch(`${API_BASE}/exercises/${exerciseId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Backend API unavailable, falling back to local simulation:", e);
  }
  return getSimulationEngine(exerciseId).getState();
}

export async function createExercise(scenarioId: string, teamName: string = "Task Force Alpha", isDemo: boolean = true): Promise<ExerciseState> {
  try {
    const res = await fetch(`${API_BASE}/exercises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId, teamName, isDemoMode: isDemo })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Backend API unavailable, creating exercise locally:", e);
  }
  const engine = getSimulationEngine("exercise-demo-1", isDemo);
  engine.reset(isDemo);
  return engine.getState();
}

export async function controlExercise(exerciseId: string, action: string, speedMultiplier?: number): Promise<ExerciseState> {
  try {
    const res = await fetch(`${API_BASE}/exercises/${exerciseId}/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, speedMultiplier })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Backend API unavailable, executing control locally:", e);
  }

  const engine = getSimulationEngine(exerciseId);
  if (action === "start") engine.start();
  else if (action === "pause") engine.pause();
  else if (action === "resume") engine.resume();
  else if (action === "end") engine.end();
  else if (action === "reset") engine.reset();
  else if (action === "set_speed" && speedMultiplier) engine.setSpeed(speedMultiplier);

  return engine.getState();
}

export async function injectEvent(exerciseId: string, action: string, payload?: Record<string, unknown>) {
  try {
    const res = await fetch(`${API_BASE}/exercises/${exerciseId}/inject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Backend API unavailable, injecting locally:", e);
  }

  const engine = getSimulationEngine(exerciseId);
  engine.applyInstructorInject(action, payload);
  return { status: "injected_locally" };
}

export async function submitCommanderDecision(
  exerciseId: string,
  decision: string,
  rationale: string,
  confidence: "low" | "medium" | "high"
) {
  try {
    const res = await fetch(`${API_BASE}/exercises/${exerciseId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, rationale, confidence })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Backend API unavailable, recording decision locally:", e);
  }

  const engine = getSimulationEngine(exerciseId);
  return engine.submitDecision(decision, rationale, confidence);
}

export async function fetchAARReport(exerciseId: string): Promise<AARReportData> {
  try {
    const res = await fetch(`${API_BASE}/exercises/${exerciseId}/aar`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Backend API unavailable, generating AAR locally:", e);
  }

  const engine = getSimulationEngine(exerciseId);
  return engine.generateAAR();
}
