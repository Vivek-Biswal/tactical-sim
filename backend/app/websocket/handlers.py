import time

from app.schemas.models import (
    ExerciseControl,
    InstructorInject,
    MovementInput,
    RadioInput,
    TraineeDecisionInput,
)
from app.service import control, get_session
from app.websocket.manager import ws_manager


async def handle_websocket_message(connection, exercise_id, data):
    kind = data.get("type", "")
    if not isinstance(kind, str):
        raise TypeError("Command type must be a string")
    kind = kind.upper()
    payload = data.get("payload", {})
    request_id = data.get("requestId")
    if not isinstance(request_id, str) or not 1 <= len(request_id) <= 80:
        raise ValueError("requestId is required (1–80 characters)")
    if request_id in connection["acks"]:
        await ws_manager.send(connection, connection["acks"][request_id])
        return
    now = time.monotonic()
    connection["commands"] = [t for t in connection["commands"] if now - t < 5]
    if len(connection["commands"]) >= 20:
        raise ValueError("Too many commands; wait a few seconds")
    connection["commands"].append(now)
    session = get_session(exercise_id)
    session.advance_wallclock()
    role, name = connection["role"], connection["name"]
    if kind in ("INSTRUCTOR_INJECT", "EXERCISE_CONTROL") and role != "INSTRUCTOR":
        raise ValueError("Instructor access required")
    if kind == "RADIO_MESSAGE":
        command = RadioInput.model_validate(
            {
                **payload,
                "sender": name,
                "senderRole": role if role != "INSTRUCTOR" else "COMMANDER",
            }
        )
        message = session.send_radio_message(name, role, command.content)
        result = {
            "messageId": message["id"],
            "deliveryStatus": message["deliveryStatus"],
        }
    elif kind == "DECISION_SUBMIT":
        if role != "COMMANDER":
            raise ValueError("Commander access required")
        command = TraineeDecisionInput.model_validate({**payload, "traineeId": name})
        decision = session.record_decision(
            command.decision,
            command.rationale,
            command.confidence,
            name,
            command.selectedActionId,
        )
        result = {"decisionId": decision["id"]}
    elif kind == "TEAM_MOVEMENT":
        command = MovementInput.model_validate(payload)
        if role.startswith("TEAM_") and command.unitId != "unit-" + role[5:].lower():
            raise ValueError("Team members can move only their own team")
        session.move_team(
            command.model_dump(), "instructor" if role == "INSTRUCTOR" else "commander"
        )
        result = {"unitId": command.unitId}
    elif kind == "INSTRUCTOR_INJECT":
        command = InstructorInject.model_validate(payload)
        session.apply_instructor_inject(command.action, command.payload)
        result = {"action": command.action}
    elif kind == "EXERCISE_CONTROL":
        session = control(session, ExerciseControl.model_validate(payload))
        result = {"status": session.status}
    elif kind == "REQUEST_STATE":
        result = {}
    else:
        raise ValueError("Unknown command type")
    acknowledgement = {"type": "ACK", "requestId": request_id, "result": result}
    connection["acks"][request_id] = acknowledgement
    if len(connection["acks"]) > 100:
        connection["acks"].pop(next(iter(connection["acks"])))
    await ws_manager.send(connection, acknowledgement)
    await ws_manager.broadcast_state(session)
