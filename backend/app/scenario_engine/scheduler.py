import asyncio
import logging
import time

from app.config import settings
from app.persistence import persistence
from app.scenario_engine.engine import engine_manager
from app.websocket.manager import ws_manager

logger = logging.getLogger("chakravyuh.scheduler")


class SimulationScheduler:
    def __init__(self):
        self._task = None

    async def start(self):
        if self._task is None:
            self._task = asyncio.create_task(self._loop())

    async def stop(self):
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def _loop(self):
        while True:
            for room, session in list(engine_manager.exercises.items()):
                try:
                    if session.status == "running":
                        session.advance_wallclock()
                        await ws_manager.broadcast_state(session, persist=False)
                        await persistence.save(session, force=session.status == "completed")
                    if (
                        session.status in ("pending", "completed")
                        and time.time() - (session.completed_at or session.created_at)
                        > settings.ROOM_TTL_SECONDS
                        and not ws_manager.active_connections.get(room)
                    ):
                        engine_manager.exercises.pop(room, None)
                        ws_manager.forget(room)
                except Exception:
                    logger.exception("Room tick failed: %s", room)
            await asyncio.sleep(0.5)


scheduler = SimulationScheduler()
