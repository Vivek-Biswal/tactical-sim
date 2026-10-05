import asyncio
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.auth import (
    bind_role,
    identity_from_header,
    identity_from_token,
    is_demo,
    validate_auth_configuration,
)
from app.config import settings
from app.persistence import persistence
from app.routes import aar, decisions, exercises, scenarios
from app.scenario_engine.scheduler import scheduler
from app.service import get_session
from app.websocket.handlers import handle_websocket_message
from app.websocket.manager import ws_manager


@asynccontextmanager
async def lifespan(app):
    validate_auth_configuration()
    await persistence.start()
    await scheduler.start()
    try:
        yield
    finally:
        await scheduler.stop()
        await persistence.stop()


app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, lifespan=lifespan)
for module in (scenarios, exercises, decisions, aar):
    app.include_router(module.router, prefix=settings.API_PREFIX)


@app.middleware("http")
async def authenticate_and_restore_exercise(request, call_next):
    prefix = settings.API_PREFIX
    public = (
        request.url.path in ("/", f"{prefix}/health")
        or (
            request.method == "GET"
            and (
                request.url.path == f"{prefix}/scenarios"
                or request.url.path.startswith(f"{prefix}/scenarios/")
            )
        )
        or request.method == "OPTIONS"
    )
    if request.url.path.startswith(f"{prefix}/") and not public:
        try:
            request.state.identity = await identity_from_header(
                request.headers.get("authorization")
            )
        except HTTPException as error:
            return JSONResponse(
                status_code=error.status_code,
                content={"detail": error.detail},
                headers=error.headers,
            )
    parts = request.url.path.split("/")
    if (
        len(parts) >= 4
        and parts[1:3] == ["api", "exercises"]
        and parts[3].startswith("ex-")
    ):
        await persistence.load_archived(parts[3])
    return await call_next(request)


# CORS must wrap authentication so browsers can read its 401/403 responses.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Instructor-Key", "Authorization"],
)


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
        "authMode": settings.AUTH_MODE,
    }


@app.get("/api/health")
async def health():
    from app.scenario_engine.engine import engine_manager

    return {
        "status": "ok",
        "service": "chakravyuh",
        "storage": "firestore" if persistence.store else "in-memory",
        "persistenceStatus": persistence.state,
        "authMode": settings.AUTH_MODE,
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
    if any(
        key in websocket.query_params for key in ("token", "idToken", "access_token")
    ):
        await websocket.close(code=1008)
        return
    await websocket.accept()
    joined = False
    try:
        join = await asyncio.wait_for(receive_packet(websocket), timeout=10)
        if not isinstance(join, dict) or join.get("type") not in (
            "JOIN",
            "JOIN_EXERCISE",
        ):
            raise ValueError("Send JOIN before commands")
        identity = await identity_from_token(join.pop("idToken", None))
        await persistence.load_archived(exercise_id)
        session = get_session(exercise_id)
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
        if role == "INSTRUCTOR":
            from app.service import require_instructor

            require_instructor(session, join.get("instructorKey"), identity)
        if (
            len(ws_manager.active_connections.get(exercise_id, []))
            >= settings.MAX_CONNECTIONS_PER_ROOM
        ):
            raise ValueError("Room participant limit reached")
        bind_role(session, identity, role)
        if not is_demo():
            name = identity.name
        await ws_manager.connect(websocket, exercise_id, role, name.strip())
        joined = True
        connection = next(
            c
            for c in ws_manager.active_connections[exercise_id]
            if c["ws"] is websocket
        )
        connection.update(acks={}, commands=[], identity=identity)
        await ws_manager.send(
            connection, {"type": "JOINED", "exerciseId": exercise_id, "role": role}
        )
        await ws_manager.broadcast_state(session)
        while True:
            try:
                data = None
                if identity.expires_at is None:
                    data = await receive_packet(websocket)
                else:
                    import time

                    remaining = identity.expires_at - time.time()
                    if remaining <= 0:
                        raise HTTPException(
                            401, "Sign-in expired; reconnect after signing in"
                        )
                    try:
                        data = await asyncio.wait_for(
                            receive_packet(websocket), timeout=remaining
                        )
                    except asyncio.TimeoutError as error:
                        raise HTTPException(
                            401, "Sign-in expired; reconnect after signing in"
                        ) from error
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
                        "code": error.status_code
                        if isinstance(error, HTTPException)
                        else 400,
                    },
                )
                if isinstance(error, HTTPException) and error.status_code == 401:
                    await websocket.close(
                        code=4001,
                        reason="Sign-in expired; reconnect with a fresh token",
                    )
                    break
    except (WebSocketDisconnect, RuntimeError):
        pass
    except (ValueError, TypeError, HTTPException, asyncio.TimeoutError) as error:
        await websocket.send_json(
            {
                "type": "ERROR",
                "message": str(error),
                "code": error.status_code if isinstance(error, HTTPException) else 400,
            }
        )
        await websocket.close(code=1008)
    finally:
        if joined:
            ws_manager.disconnect(websocket, exercise_id)
            from app.scenario_engine.engine import engine_manager

            session = engine_manager.get_exercise(exercise_id)
            if session:
                await ws_manager.broadcast_state(session)
