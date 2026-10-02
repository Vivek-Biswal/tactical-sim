from typing import Dict, Any
from fastapi import WebSocket
from app.websocket.manager import ws_manager
from app.scenario_engine.engine import engine_manager
import json
import logging

logger = logging.getLogger("command-x.handlers")

async def handle_websocket_message(websocket: WebSocket, exercise_id: str, raw_data: str, role: str, name: str):
    try:
        data: Dict[str, Any] = json.loads(raw_data)
        event_type = data.get("type")
        payload = data.get("payload", {})
        
        session = engine_manager.get_exercise(exercise_id)
        if not session:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Exercise {exercise_id} not found"
            }))
            return

        if event_type == "radio_message":
            content = payload.get("content", "").strip()
            if content:
                session.send_radio_message(sender=name, role=role, content=content)
                await ws_manager.broadcast_to_exercise(exercise_id, {
                    "type": "state_update",
                    "state": session.get_state()
                })

        elif event_type == "decision_submit":
            decision_text = payload.get("decision", "")
            rationale = payload.get("rationale", "")
            confidence = payload.get("confidence", "medium")
            if decision_text:
                session.record_decision(
                    decision_text=decision_text,
                    rationale=rationale,
                    confidence=confidence,
                    trainee_id=name
                )
                await ws_manager.broadcast_to_exercise(exercise_id, {
                    "type": "state_update",
                    "state": session.get_state()
                })

        elif event_type == "instructor_inject":
            action = payload.get("action")
            inject_payload = payload.get("payload", {})
            if action:
                session.apply_instructor_inject(action, inject_payload)
                await ws_manager.broadcast_to_exercise(exercise_id, {
                    "type": "state_update",
                    "state": session.get_state()
                })

        elif event_type == "exercise_control":
            action = payload.get("action")
            if action == "start":
                session.start()
            elif action == "pause":
                session.pause()
            elif action == "resume":
                session.resume()
            elif action == "end":
                session.end()
            elif action == "set_speed":
                session.speed_multiplier = float(payload.get("speedMultiplier", 1.0))
            
            await ws_manager.broadcast_to_exercise(exercise_id, {
                "type": "state_update",
                "state": session.get_state()
            })

        elif event_type == "request_state":
            await websocket.send_text(json.dumps({
                "type": "state_update",
                "state": session.get_state()
            }))

    except Exception as e:
        logger.error(f"Error handling WS message: {e}", exc_info=True)
