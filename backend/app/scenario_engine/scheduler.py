import asyncio
import logging
from app.scenario_engine.engine import engine_manager
from app.websocket.manager import ws_manager

logger = logging.getLogger("command-x.scheduler")

class SimulationScheduler:
    def __init__(self):
        self._running = False
        self._task = None

    async def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop())
        logger.info("Simulation background scheduler started.")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Simulation background scheduler stopped.")

    async def _loop(self):
        while self._running:
            try:
                # Tick running exercises by 1 second
                engine_manager.tick_all(delta_seconds=1.0)
                
                # Broadcast updates to all connected exercise clients
                for exercise_id, session in engine_manager.exercises.items():
                    if session.status in ["running", "completed"]:
                        state = session.get_state()
                        # Also include list of active trainees
                        state["connectedTrainees"] = ws_manager.get_trainee_status(exercise_id)
                        await ws_manager.broadcast_to_exercise(exercise_id, {
                            "type": "state_update",
                            "state": state
                        })
            except Exception as e:
                logger.error(f"Error in scheduler tick: {e}", exc_info=True)
            
            await asyncio.sleep(1.0)

scheduler = SimulationScheduler()
