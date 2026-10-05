from copy import deepcopy

from fastapi import APIRouter, HTTPException

from app.scenario_engine.events import get_operation_silent_link
from app.scenario_engine.training import TRAINING_AREAS

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])


@router.get("")
async def list_scenarios():
    return [get_operation_silent_link()]


@router.get("/training-areas")
async def list_training_areas():
    return deepcopy(list(TRAINING_AREAS.values()))


@router.get("/{scenario_id}")
async def get_scenario(scenario_id: str):
    if scenario_id not in ("scenario-op-silent-link", "demo"):
        raise HTTPException(404, "Scenario not found")
    return get_operation_silent_link()
