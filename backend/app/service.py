import secrets

from fastapi import HTTPException

from app.scenario_engine.engine import engine_manager


def get_session(exercise_id):
    session = engine_manager.get_exercise(exercise_id)
    if not session:
        raise HTTPException(404, "Exercise not found")
    return session


def is_instructor(session, key):
    return (
        isinstance(key, str)
        and bool(key)
        and secrets.compare_digest(
            key.encode("utf-8"), session.instructor_key.encode("utf-8")
        )
    )


def require_instructor(session, key):
    if not is_instructor(session, key):
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
        engine_manager.exercises[session.exercise_id] = replacement
        return replacement
    if command.action == "set_training_area":
        if session.status != "pending":
            raise ValueError("Choose the training area before starting the exercise")
        if command.trainingArea is None:
            raise ValueError("trainingArea is required")
        session.set_training_area(command.trainingArea.model_dump())
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
