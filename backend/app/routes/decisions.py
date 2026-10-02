from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.models import Decision, TraineeDecisionInput
from app.scenario_engine.engine import engine_manager
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/exercises/{exercise_id}", tags=["Decisions"])

@router.post("/decision", response_model=Decision)
async def submit_decision(exercise_id: str, data: TraineeDecisionInput):
    session = engine_manager.get_exercise(exercise_id)
    if not session:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    dec = session.record_decision(
        decision_text=data.decision,
        rationale=data.rationale,
        confidence=data.confidence
    )
    
    await ws_manager.broadcast_to_exercise(exercise_id, {
        "type": "state_update",
        "state": session.get_state()
    })
    return dec

@router.get("/decisions", response_model=List[Decision])
def get_decisions(exercise_id: str):
    session = engine_manager.get_exercise(exercise_id)
    if not session:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return session.decisions
