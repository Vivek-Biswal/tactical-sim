import secrets
from copy import deepcopy

from fastapi import HTTPException

from app.auth import (
    http_room_role,
    is_demo,
    own_room,
    require_actor_value,
)
from app.scenario_engine.engine import engine_manager


def get_session(exercise_id):
    session = engine_manager.get_exercise(exercise_id)
    if not session:
        raise HTTPException(404, "Exercise not found")
    return session


def is_instructor(session, key, identity=None):
    valid_key = (
        isinstance(key, str)
        and bool(key)
        and secrets.compare_digest(
            key.encode("utf-8"), session.instructor_key.encode("utf-8")
        )
    )
    if not valid_key:
        return False
    if is_demo():
        return True
    if identity is None:
        return False
    try:
        own_room(session, identity)
    except HTTPException:
        return False
    return True


def require_instructor(session, key, identity=None):
    if not is_demo():
        if identity is None:
            raise HTTPException(401, "A valid Firebase sign-in is required")
        own_room(session, identity)
    if not is_instructor(session, key, identity):
        raise HTTPException(403, "Instructor room key required")


def control(session, command):
    session.advance_wallclock()
    if command.action not in ("end", "reset"):
        session.require_capacity()
    if command.action == "reset":
        if session.status == "running":
            raise ValueError("Pause or end before resetting")
        from app.scenario_engine.engine import ExerciseSession

        replacement = ExerciseSession(
            session.exercise_id,
            team_name=session.team_name,
            is_demo=session.is_demo,
            instructor_key=session.instructor_key,
            training_area=session.training_area,
        )
        replacement.speed_multiplier = session.speed_multiplier
        if "_access" in session.scenario:
            replacement.scenario["_access"] = deepcopy(session.scenario["_access"])
        engine_manager.exercises[session.exercise_id] = replacement
        return replacement
    if command.action == "set_training_area":
        if session.status != "pending":
            raise ValueError("Choose the training area before starting the exercise")
        if command.trainingArea is None:
            raise ValueError("trainingArea is required")
        access = deepcopy(session.scenario.get("_access"))
        session.set_training_area(command.trainingArea.model_dump())
        if access is not None:
            session.scenario["_access"] = access
    elif command.action == "set_speed":
        if command.speedMultiplier is None:
            raise ValueError("speedMultiplier is required")
        if session.status == "completed":
            raise ValueError("Exercise is completed")
        session.speed_multiplier = command.speedMultiplier
        session.log_event(
            "SPEED_CHANGED", payload={"speedMultiplier": session.speed_multiplier}
        )
    else:
        getattr(session, command.action)()
    return session


def authorize_movement(session, identity, unit_id, key=None):
    if is_demo():
        return "commander"
    role = http_room_role(session, identity)
    if role == "INSTRUCTOR":
        require_instructor(session, key, identity)
        return "instructor"
    if role.startswith("TEAM_") and unit_id != "unit-" + role[5:].lower():
        raise HTTPException(403, "Team members can move only their own team")
    return "commander"


def send_account_radio(session, identity, data):
    if is_demo():
        return session.send_radio_message(data.sender, data.senderRole, data.content)
    role = http_room_role(session, identity)
    require_actor_value(identity, data.sender, data.model_fields_set, "sender")
    if "senderRole" in data.model_fields_set and data.senderRole != role:
        raise HTTPException(403, "The message role must match the signed-in room role")
    result = session.send_radio_message(identity.name, role, data.content)
    session.messages[-1]["senderUid"] = identity.uid
    result["senderUid"] = identity.uid
    return result


def record_account_decision(session, identity, data):
    if not is_demo():
        if http_room_role(session, identity) != "COMMANDER":
            raise HTTPException(403, "Only the trainee Commander can record decisions")
        require_actor_value(
            identity, data.traineeId, data.model_fields_set, "traineeId"
        )
    result = session.record_decision(
        data.decision,
        data.rationale,
        data.confidence,
        data.traineeId if is_demo() else identity.name,
        data.selectedActionId,
    )
    if not is_demo():
        session.decisions[-1]["traineeUid"] = identity.uid
        result["traineeUid"] = identity.uid
    return result
