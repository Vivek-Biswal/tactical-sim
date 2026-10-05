from copy import deepcopy

from fastapi import APIRouter, HTTPException, Request

from app.auth import identity_for, is_demo, membership
from app.schemas.models import TraineeDecisionInput
from app.service import get_session, record_account_decision
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/exercises/{exercise_id}", tags=["Decisions"])


@router.post("/decision", status_code=201)
async def submit_decision(
    exercise_id: str, data: TraineeDecisionInput, request: Request
):
    session = get_session(exercise_id)
    session.advance_wallclock()
    result = record_account_decision(session, identity_for(request), data)
    await ws_manager.broadcast_state(session)
    return result


@router.get("/decisions")
async def decisions(exercise_id: str, request: Request):
    session = get_session(exercise_id)
    member = membership(session, identity_for(request))
    if not is_demo() and member is None:
        raise HTTPException(403, "Join this exercise before reading its decisions")
    return deepcopy(session.decisions)
