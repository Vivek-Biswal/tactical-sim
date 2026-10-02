from fastapi import APIRouter, HTTPException
from app.schemas.models import AARSummary
from app.scenario_engine.engine import engine_manager

router = APIRouter(prefix="/exercises/{exercise_id}", tags=["AAR"])

@router.get("/aar", response_model=AARSummary)
def get_aar(exercise_id: str):
    session = engine_manager.get_exercise(exercise_id)
    if not session:
        # Create completed demo summary if requested directly
        session = engine_manager.create_exercise(exercise_id, is_demo=True)
        # Advance slightly to provide meaningful AAR data
        session.elapsed_seconds = 120
        session.record_decision(
            decision_text="Divert Route via Western Ridge Pass",
            rationale="Identified mobile EW jammer near Highway Choke Point Bravo. Bypassed direct line of fire despite rough terrain delay.",
            confidence="high"
        )
        session.end()

    return session.generate_aar()
