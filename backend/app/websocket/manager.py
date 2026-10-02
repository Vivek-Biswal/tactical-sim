from typing import Dict, List, Any
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger("command-x.websocket")

class ConnectionManager:
    def __init__(self):
        # Maps exercise_id -> list of (WebSocket, metadata)
        self.active_connections: Dict[str, List[Dict[str, Any]]] = {}

    async def connect(self, websocket: WebSocket, exercise_id: str, role: str = "COMMANDER", name: str = "User"):
        await websocket.accept()
        if exercise_id not in self.active_connections:
            self.active_connections[exercise_id] = []
        self.active_connections[exercise_id].append({
            "ws": websocket,
            "role": role,
            "name": name
        })
        logger.info(f"WebSocket client connected: exercise={exercise_id}, role={role}, name={name}")

    def disconnect(self, websocket: WebSocket, exercise_id: str):
        if exercise_id in self.active_connections:
            self.active_connections[exercise_id] = [
                c for c in self.active_connections[exercise_id] if c["ws"] != websocket
            ]
            if not self.active_connections[exercise_id]:
                del self.active_connections[exercise_id]
        logger.info(f"WebSocket client disconnected from exercise={exercise_id}")

    async def broadcast_to_exercise(self, exercise_id: str, data: Dict[str, Any]):
        if exercise_id not in self.active_connections:
            return
        
        message_text = json.dumps(data)
        dead_connections = []
        for conn in self.active_connections[exercise_id]:
            try:
                await conn["ws"].send_text(message_text)
            except Exception as e:
                logger.warning(f"Error sending to WS: {e}")
                dead_connections.append(conn["ws"])
        
        for dead in dead_connections:
            self.disconnect(dead, exercise_id)

    def get_trainee_status(self, exercise_id: str) -> List[Dict[str, str]]:
        if exercise_id not in self.active_connections:
            return []
        return [
            {"role": c["role"], "name": c["name"]}
            for c in self.active_connections[exercise_id]
        ]

ws_manager = ConnectionManager()
