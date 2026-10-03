from app.scenario_engine.events import get_operation_silent_link
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])


@router.get("")
async def list_scenarios():
    return [get_operation_silent_link()]


@router.get("/{scenario_id}")
async def get_scenario(scenario_id: str):
    if scenario_id not in ("scenario-op-silent-link", "demo"):
        raise HTTPException(404, "Scenario not found")
    return get_operation_silent_link()
