from fastapi import APIRouter, Header, HTTPException, Request

from app.auth import (
    assign_owner,
    identity_for,
    is_demo,
    membership,
    require_account_role,
)
from app.persistence import persistence
from app.scenario_engine.engine import engine_manager
from app.schemas.models import (
    ExerciseControl,
    ExerciseCreate,
    InstructorInject,
    MovementInput,
    RadioInput,
    ScenarioEventInput,
)
from app.service import (
    authorize_movement,
    control,
    get_session,
    is_instructor,
    require_instructor,
    send_account_radio,
)
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/exercises", tags=["Exercises"])


def state(session, key=None, identity=None):
    if not is_demo():
        if membership(session, identity) is None:
            raise HTTPException(403, "Join this exercise before reading its state")
        if key and identity.role != "instructor":
            raise HTTPException(403, "Instructor account required to use the room key")
        if key:
            require_instructor(session, key, identity)
    result = session.get_state(is_instructor(session, key, identity))
    result["connectedTrainees"] = ws_manager.get_trainee_status(session.exercise_id)
    return result


@router.get("")
async def list_exercises(request: Request):
    identity = identity_for(request)
    rooms = engine_manager.list_exercises()
    if is_demo():
        return rooms
    return [
        room
        for room in rooms
        if identity.uid
        in engine_manager.get_exercise(room["exerciseId"])
        .scenario.get("_access", {})
        .get("memberships", {})
    ]


@router.post("", status_code=201)
async def create_exercise(data: ExerciseCreate, request: Request):
    identity = identity_for(request)
    require_account_role(identity, "instructor")
    session = engine_manager.create_exercise(
        is_demo=data.isDemoMode,
        team_name=data.teamName,
        training_area=data.trainingArea.model_dump(),
    )
    assign_owner(session, identity)
    session.speed_multiplier = data.speedMultiplier
    await persistence.save(session, force=True)
    return {
        **state(session, session.instructor_key, identity),
        "instructorKey": session.instructor_key,
    }


@router.post("/start", status_code=201)
async def start_exercise(data: ExerciseCreate, request: Request):
    result = await create_exercise(data, request)
    session = get_session(result["exerciseId"])
    session.start()
    await persistence.save(session, force=True)
    return {
        **state(session, session.instructor_key, identity_for(request)),
        "instructorKey": session.instructor_key,
    }


@router.get("/{exercise_id}")
async def get_exercise(
    exercise_id: str,
    request: Request,
    x_instructor_key: str | None = Header(default=None),
):
    return state(get_session(exercise_id), x_instructor_key, identity_for(request))


@router.get("/{exercise_id}/membership")
async def get_membership(exercise_id: str, request: Request):
    identity = identity_for(request)
    member = membership(get_session(exercise_id), identity)
    return {
        "exerciseId": exercise_id,
        "accountRole": identity.role,
        "role": member["role"] if member else None,
    }


@router.post("/{exercise_id}/control")
async def control_exercise(
    exercise_id: str,
    data: ExerciseControl,
    request: Request,
    x_instructor_key: str | None = Header(default=None),
):
    session = get_session(exercise_id)
    identity = identity_for(request)
    require_instructor(session, x_instructor_key, identity)
    session = control(session, data)
    await ws_manager.broadcast_state(session)
    return state(session, x_instructor_key, identity)


@router.post("/{exercise_id}/end")
async def end_exercise(
    exercise_id: str,
    request: Request,
    x_instructor_key: str | None = Header(default=None),
):
    return await control_exercise(
        exercise_id, ExerciseControl(action="end"), request, x_instructor_key
    )


@router.post("/{exercise_id}/inject")
async def inject_event(
    exercise_id: str,
    data: InstructorInject,
    request: Request,
    x_instructor_key: str | None = Header(default=None),
):
    session = get_session(exercise_id)
    identity = identity_for(request)
    require_instructor(session, x_instructor_key, identity)
    session.advance_wallclock()
    session.apply_instructor_inject(data.action, data.payload)
    await ws_manager.broadcast_state(session)
    return state(session, x_instructor_key, identity)


@router.post("/{exercise_id}/event")
async def scenario_event(
    exercise_id: str,
    data: ScenarioEventInput,
    request: Request,
    x_instructor_key: str | None = Header(default=None),
):
    session = get_session(exercise_id)
    identity = identity_for(request)
    require_instructor(session, x_instructor_key, identity)
    if session.status not in ("running", "paused"):
        raise ValueError("Start the exercise first")
    session.require_capacity()
    session.advance_wallclock()
    session.execute_event(data.type, data.payload, "instructor")
    await ws_manager.broadcast_state(session)
    return state(session, x_instructor_key, identity)


@router.post("/{exercise_id}/movement")
async def movement(
    exercise_id: str,
    data: MovementInput,
    request: Request,
    x_instructor_key: str | None = Header(default=None),
):
    session = get_session(exercise_id)
    identity = identity_for(request)
    source = authorize_movement(session, identity, data.unitId, x_instructor_key)
    session.advance_wallclock()
    session.move_team(data.model_dump(), source)
    await ws_manager.broadcast_state(session)
    return state(session, identity=identity)


@router.post("/{exercise_id}/messages")
async def message(
    exercise_id: str,
    data: RadioInput,
    request: Request,
    x_instructor_key: str | None = Header(default=None),
):
    session = get_session(exercise_id)
    identity = identity_for(request)
    if not is_demo() and identity.role == "instructor":
        require_instructor(session, x_instructor_key, identity)
    session.advance_wallclock()
    result = send_account_radio(session, identity, data)
    await ws_manager.broadcast_state(session)
    return result
