from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.models import Scenario
from app.scenario_engine.events import get_operation_silent_link

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])

# In-memory scenarios storage
_SCENARIOS = {
    "scenario-op-silent-link": get_operation_silent_link(is_demo=True)
}

@router.get("", response_model=List[Scenario])
def list_scenarios():
    return list(_SCENARIOS.values())

@router.get("/{scenario_id}", response_model=Scenario)
def get_scenario(scenario_id: str):
    if scenario_id in _SCENARIOS:
        return _SCENARIOS[scenario_id]
    if scenario_id == "demo":
        return get_operation_silent_link(is_demo=True)
    raise HTTPException(status_code=404, detail="Scenario not found")

@router.post("", response_model=Scenario)
def create_scenario(scenario: Scenario):
    _SCENARIOS[scenario.id] = scenario
    return scenario
