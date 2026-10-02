import { useEffect, useRef, useState, useCallback } from "react";
import { ExerciseState } from "../types/exercise";
import { getSimulationEngine } from "./simulation";

interface UseSimulationWebSocketOptions {
  exerciseId: string;
  role?: string;
  name?: string;
  onStateUpdate?: (state: ExerciseState) => void;
}

export function useSimulationWebSocket({
  exerciseId,
  role = "COMMANDER",
  name = "Commander 1",
  onStateUpdate
}: UseSimulationWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [state, setState] = useState<ExerciseState>(() => getSimulationEngine(exerciseId).getState());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fallback to local engine if offline
  const localEngine = getSimulationEngine(exerciseId);

  const updateState = useCallback(
    (newState: ExerciseState) => {
      setState(newState);
      if (onStateUpdate) {
        onStateUpdate(newState);
      }
    },
    [onStateUpdate]
  );

  useEffect(() => {
    // Subscribe to local engine events (fallback)
    const unsubscribeLocal = localEngine.subscribe((s) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        updateState(s);
      }
    });

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
    const endpoint = `${wsUrl}/exercise/${exerciseId}?role=${encodeURIComponent(role)}&name=${encodeURIComponent(name)}`;

    function connect() {
      try {
        const ws = new WebSocket(endpoint);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          ws.send(JSON.stringify({ type: "request_state" }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "state_update" && data.state) {
              updateState(data.state);
              // Also sync into local engine
              localEngine.setState(data.state);
            }
          } catch (e) {
            console.error("Error parsing WS packet:", e);
          }
        };

        ws.onerror = () => {
          // Graceful fallback to local engine
          setIsConnected(false);
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Try reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        };
      } catch (e) {
        setIsConnected(false);
      }
    }

    connect();

    return () => {
      unsubscribeLocal();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [exerciseId, role, name, updateState, localEngine]);

  const sendRadioMessage = useCallback(
    (content: string) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "radio_message",
            payload: { content }
          })
        );
      } else {
        localEngine.sendRadioMessage(name, role, content);
      }
    },
    [name, role, localEngine]
  );

  const submitDecision = useCallback(
    (decision: string, rationale: string, confidence: "low" | "medium" | "high", actionId?: string) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "decision_submit",
            payload: { decision, rationale, confidence, actionId }
          })
        );
      } else {
        localEngine.submitDecision(decision, rationale, confidence, name, actionId);
      }
    },
    [name, localEngine]
  );

  const sendInstructorInject = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "instructor_inject",
            payload: { action, payload }
          })
        );
      } else {
        localEngine.applyInstructorInject(action, payload);
      }
    },
    [localEngine]
  );

  const sendExerciseControl = useCallback(
    (action: string, speedMultiplier?: number) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "exercise_control",
            payload: { action, speedMultiplier }
          })
        );
      } else {
        if (action === "start") localEngine.start();
        else if (action === "pause") localEngine.pause();
        else if (action === "resume") localEngine.resume();
        else if (action === "end") localEngine.end();
        else if (action === "reset") localEngine.reset();
        else if (action === "set_speed" && speedMultiplier) localEngine.setSpeed(speedMultiplier);
      }
    },
    [localEngine]
  );

  return {
    state,
    isConnected,
    sendRadioMessage,
    submitDecision,
    sendInstructorInject,
    sendExerciseControl
  };
}
