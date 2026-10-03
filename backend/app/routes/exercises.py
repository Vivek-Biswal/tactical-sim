from app.scenario_engine.engine import engine_manager
from app.schemas.models import (
    ExerciseControl,
    ExerciseCreate,
    InstructorInject,
    MovementInput,
    RadioInput,
    ScenarioEventInput,
)
from app.service import control, get_session, is_instructor, require_instructor
from app.websocket.manager import ws_manager
from fastapi import APIRouter, Header

router = APIRouter(prefix="/exercises", tags=["Exercises"])


def state(session, key=None):
    result = session.get_state(is_instructor(session, key))
    result["connectedTrainees"] = ws_manager.get_trainee_status(session.exercise_id)
    return result


@router.get("")
async def list_exercises():
    return engine_manager.list_exercises()


@router.post("", status_code=201)
async def create_exercise(data: ExerciseCreate):
    session = engine_manager.create_exercise(
        is_demo=data.isDemoMode,
        team_name=data.teamName,
        training_area=data.trainingArea.model_dump(),
    )
    session.speed_multiplier = data.speedMultiplier
    return {**state(session), "instructorKey": session.instructor_key}


@router.post("/start", status_code=201)
async def start_exercise(data: ExerciseCreate):
    result = await create_exercise(data)
    session = get_session(result["exerciseId"])
    session.start()
    return {**state(session), "instructorKey": session.instructor_key}


@router.get("/{exercise_id}")
async def get_exercise(
    exercise_id: str, x_instructor_key: str | None = Header(default=None)
):
    return state(get_session(exercise_id), x_instructor_key)


@router.post("/{exercise_id}/control")
async def control_exercise(
    exercise_id: str,
    data: ExerciseControl,
    x_instructor_key: str | None = Header(default=None),
):
    session = get_session(exercise_id)
    require_instructor(session, x_instructor_key)
    session = control(session, data)
    await ws_manager.broadcast_state(session)
    return state(session, x_instructor_key)


@router.post("/{exercise_id}/end")
async def end_exercise(
    exercise_id: str, x_instructor_key: str | None = Header(default=None)
):
    return await control_exercise(
        exercise_id, ExerciseControl(action="end"), x_instructor_key
    )


@router.post("/{exercise_id}/inject")
async def inject_event(
    exercise_id: str,
    data: InstructorInject,
    x_instructor_key: str | None = Header(default=None),
):
    session = get_session(exercise_id)
    require_instructor(session, x_instructor_key)
    session.advance_wallclock()
    session.apply_instructor_inject(data.action, data.payload)
    await ws_manager.broadcast_state(session)
    return state(session, x_instructor_key)


@router.post("/{exercise_id}/event")
async def scenario_event(
    exercise_id: str,
    data: ScenarioEventInput,
    x_instructor_key: str | None = Header(default=None),
):
    session = get_session(exercise_id)
    require_instructor(session, x_instructor_key)
    if session.status not in ("running", "paused"):
        raise ValueError("Start the exercise first")
    session.require_capacity()
    session.advance_wallclock()
    session.execute_event(data.type, data.payload, "instructor")
    await ws_manager.broadcast_state(session)
    return state(session, x_instructor_key)


@router.post("/{exercise_id}/movement")
async def movement(exercise_id: str, data: MovementInput):
    session = get_session(exercise_id)
    session.advance_wallclock()
    session.move_team(data.model_dump())
    await ws_manager.broadcast_state(session)
    return state(session)


@router.post("/{exercise_id}/messages")
async def message(exercise_id: str, data: RadioInput):
    session = get_session(exercise_id)
    session.advance_wallclock()
    result = session.send_radio_message(data.sender, data.senderRole, data.content)
    await ws_manager.broadcast_state(session)
    return result
