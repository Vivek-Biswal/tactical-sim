import asyncio
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.config import settings
from app.persistence import persistence
from app.routes import aar, decisions, exercises, scenarios
from app.scenario_engine.scheduler import scheduler
from app.service import get_session, is_instructor
from app.websocket.handlers import handle_websocket_message
from app.websocket.manager import ws_manager


@asynccontextmanager
async def lifespan(app):
    await persistence.start()
    await scheduler.start()
    try:
        yield
    finally:
        await scheduler.stop()
        await persistence.stop()


app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Instructor-Key"],
)
for module in (scenarios, exercises, decisions, aar):
    app.include_router(module.router, prefix=settings.API_PREFIX)


@app.middleware("http")
async def restore_archived_exercise(request, call_next):
    parts = request.url.path.split("/")
    if len(parts) >= 4 and parts[1:3] == ["api", "exercises"] and parts[3].startswith("ex-"):
        await persistence.load_archived(parts[3])
    return await call_next(request)


@app.exception_handler(ValueError)
async def bad_command(request, error):
    return JSONResponse(
        status_code=422 if isinstance(error, ValidationError) else 409,
        content={"detail": str(error)},
    )


@app.get("/")
async def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "storage": "firestore" if persistence.store else "in-memory",
        "persistenceStatus": persistence.state,
    }


@app.get("/api/health")
async def health():
    from app.scenario_engine.engine import engine_manager

    return {
        "status": "ok",
        "service": "tactical-sim",
        "storage": "firestore" if persistence.store else "in-memory",
        "persistenceStatus": persistence.state,
        "rooms": len(engine_manager.exercises),
    }


async def receive_packet(websocket):
    message = await websocket.receive()
    if message["type"] == "websocket.disconnect":
        raise WebSocketDisconnect(message.get("code", 1000))
    text = message.get("text")
    if not isinstance(text, str) or len(text) > 16384:
        raise ValueError("Send a JSON text command of at most 16384 characters")
    packet = json.loads(text)
    if not isinstance(packet, dict):
        raise TypeError("Command must be a JSON object")
    return packet


@app.websocket("/ws/exercise/{exercise_id}")
@app.websocket("/ws/exercises/{exercise_id}")
async def websocket_endpoint(websocket: WebSocket, exercise_id: str):
    origin = websocket.headers.get("origin")
    if origin and origin not in settings.CORS_ORIGINS:
        await websocket.close(code=1008)
        return
    await websocket.accept()
    joined = False
    try:
        await persistence.load_archived(exercise_id)
        session = get_session(exercise_id)
        join = await asyncio.wait_for(receive_packet(websocket), timeout=10)
        if not isinstance(join, dict) or join.get("type") != "JOIN":
            raise ValueError("Send JOIN before commands")
        role, name = join.get("role", "COMMANDER"), join.get("name", "User")
        if role not in (
            "COMMANDER",
            "TEAM_ALPHA",
            "TEAM_BRAVO",
            "TEAM_CHARLIE",
            "INSTRUCTOR",
        ):
            raise ValueError("Invalid role")
        if not isinstance(name, str) or not name.strip() or len(name) > 80:
            raise ValueError("Name must be 1–80 characters")
        if role == "INSTRUCTOR" and not is_instructor(
            session, join.get("instructorKey")
        ):
            raise ValueError("Instructor room key required")
        await ws_manager.connect(websocket, exercise_id, role, name.strip())
        joined = True
        connection = next(
            c
            for c in ws_manager.active_connections[exercise_id]
            if c["ws"] is websocket
        )
        connection.update(acks={}, commands=[])
        await ws_manager.send(
            connection, {"type": "JOINED", "exerciseId": exercise_id, "role": role}
        )
        await ws_manager.broadcast_state(session)
        while True:
            try:
                data = None
                data = await receive_packet(websocket)
                if not isinstance(data, dict):
                    raise TypeError("Command must be a JSON object")
                await handle_websocket_message(connection, exercise_id, data)
            except (ValueError, HTTPException, TypeError) as error:
                await ws_manager.send(
                    connection,
                    {
                        "type": "ERROR",
                        "requestId": data.get("requestId")
                        if isinstance(data, dict)
                        else None,
                        "message": str(error),
                    },
                )
    except (WebSocketDisconnect, RuntimeError):
        pass
    except (ValueError, TypeError, HTTPException, asyncio.TimeoutError) as error:
        await websocket.send_json({"type": "ERROR", "message": str(error)})
        await websocket.close(code=1008)
    finally:
        if joined:
            ws_manager.disconnect(websocket, exercise_id)
            session = get_session(exercise_id)
            await ws_manager.broadcast_state(session)
