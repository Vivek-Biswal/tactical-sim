import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import scenarios, exercises, decisions, aar
from app.websocket.manager import ws_manager
from app.websocket.handlers import handle_websocket_message
from app.scenario_engine.scheduler import scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start background simulation ticker
    await scheduler.start()
    yield
    # Shutdown: Stop ticker
    await scheduler.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Immersive Multi-Domain Decision-Making Trainer for Degraded Communication Environments",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scenarios.router, prefix=settings.API_PREFIX)
app.include_router(exercises.router, prefix=settings.API_PREFIX)
app.include_router(decisions.router, prefix=settings.API_PREFIX)
app.include_router(aar.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "protocol": "Degraded Comms Tactical Decision Simulator"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "command-x-core"}

@app.websocket("/ws/exercise/{exercise_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    exercise_id: str,
    role: str = Query("COMMANDER"),
    name: str = Query("User")
):
    await ws_manager.connect(websocket, exercise_id, role, name)
    try:
        while True:
            raw_text = await websocket.receive_text()
            await handle_websocket_message(websocket, exercise_id, raw_text, role, name)
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, exercise_id)
    except Exception as e:
        ws_manager.disconnect(websocket, exercise_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
