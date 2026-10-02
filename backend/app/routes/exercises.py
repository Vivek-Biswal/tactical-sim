from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.schemas.models import ExerciseCreate, ExerciseControl, InstructorInject
from app.scenario_engine.engine import engine_manager
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/exercises", tags=["Exercises"])

@router.get("", response_model=List[Dict[str, Any]])
def list_exercises():
    return engine_manager.list_exercises()

@router.post("")
def create_exercise(data: ExerciseCreate):
    session = engine_manager.create_exercise(
        is_demo=data.isDemoMode,
        team_name=data.teamName
    )
    if data.speedMultiplier and data.speedMultiplier > 0:
        session.speed_multiplier = data.speedMultiplier
    return session.get_state()

@router.get("/{exercise_id}")
def get_exercise_state(exercise_id: str):
    session = engine_manager.get_exercise(exercise_id)
    if not session:
        # Auto-create if demo
        if exercise_id in ["exercise-demo-1", "demo"]:
            session = engine_manager.create_exercise("exercise-demo-1", is_demo=True)
        else:
            raise HTTPException(status_code=404, detail="Exercise not found")
    state = session.get_state()
    state["connectedTrainees"] = ws_manager.get_trainee_status(exercise_id)
    return state

@router.post("/{exercise_id}/control")
async def control_exercise(exercise_id: str, control: ExerciseControl):
    session = engine_manager.get_exercise(exercise_id)
    if not session:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    if control.action == "start":
        session.start()
    elif control.action == "pause":
        session.pause()
    elif control.action == "resume":
        session.resume()
    elif control.action == "end":
        session.end()
    elif control.action == "reset":
        # Reset exercise
        new_session = engine_manager.create_exercise(exercise_id, is_demo=session.is_demo, team_name=session.team_name)
        session = new_session
    elif control.action == "set_speed":
        if control.speedMultiplier:
            session.speed_multiplier = control.speedMultiplier

    await ws_manager.broadcast_to_exercise(exercise_id, {
        "type": "state_update",
        "state": session.get_state()
    })
    return session.get_state()

@router.post("/{exercise_id}/inject")
async def instructor_inject(exercise_id: str, inject: InstructorInject):
    session = engine_manager.get_exercise(exercise_id)
    if not session:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    session.apply_instructor_inject(inject.action, inject.payload)
    await ws_manager.broadcast_to_exercise(exercise_id, {
        "type": "state_update",
        "state": session.get_state()
    })
    return {"status": "injected", "action": inject.action}
