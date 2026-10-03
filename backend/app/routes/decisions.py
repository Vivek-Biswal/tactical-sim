from copy import deepcopy

from fastapi import APIRouter

from app.schemas.models import TraineeDecisionInput
from app.service import get_session
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/exercises/{exercise_id}", tags=["Decisions"])


@router.post("/decision", status_code=201)
async def submit_decision(exercise_id: str, data: TraineeDecisionInput):
    session = get_session(exercise_id)
    session.advance_wallclock()
    result = session.record_decision(
        data.decision,
        data.rationale,
        data.confidence,
        data.traineeId,
        data.selectedActionId,
    )
    await ws_manager.broadcast_state(session)
    return result


@router.get("/decisions")
async def decisions(exercise_id: str):
    return deepcopy(get_session(exercise_id).decisions)
