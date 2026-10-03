import asyncio

from app.config import settings
from fastapi import WebSocketDisconnect


class ConnectionManager:
    def __init__(self):
        self.active_connections = {}
        self.room_locks = {}

    async def connect(self, websocket, exercise_id, role="COMMANDER", name="User"):
        if (
            len(self.active_connections.get(exercise_id, []))
            >= settings.MAX_CONNECTIONS_PER_ROOM
        ):
            raise ValueError("Room participant limit reached")
        self.active_connections.setdefault(exercise_id, []).append(
            {"ws": websocket, "role": role, "name": name, "lock": asyncio.Lock()}
        )

    def disconnect(self, websocket, exercise_id):
        connections = self.active_connections.get(exercise_id, [])
        self.active_connections[exercise_id] = [
            c for c in connections if c["ws"] is not websocket
        ]
        if not self.active_connections[exercise_id]:
            self.active_connections.pop(exercise_id, None)

    def get_trainee_status(self, exercise_id):
        return [
            {"role": c["role"], "name": c["name"]}
            for c in self.active_connections.get(exercise_id, [])
        ]

    async def send(self, connection, data):
        async with connection["lock"]:
            await asyncio.wait_for(connection["ws"].send_json(data), timeout=2)

    async def broadcast_state(self, session):
        room = session.exercise_id
        async with self.room_locks.setdefault(room, asyncio.Lock()):
            events = session.event_log[session.broadcast_cursor :]
            session.broadcast_cursor = len(session.event_log)

            async def update(connection):
                try:
                    instructor = connection["role"] == "INSTRUCTOR"
                    state = session.get_state(instructor)
                    state["connectedTrainees"] = self.get_trainee_status(room)
                    for event in events:
                        if (
                            instructor
                            or session.map_status == "current"
                            or event["type"] not in ("TEAM_MOVEMENT", "TEAM_ARRIVED")
                        ):
                            await self.send(
                                connection,
                                {
                                    "type": "SCENARIO_EVENT",
                                    "event": event["type"],
                                    "timestamp": event["second"],
                                    "payload": event["payload"],
                                },
                            )
                    await self.send(
                        connection, {"type": "STATE_UPDATE", "state": state}
                    )
                except (
                    WebSocketDisconnect,
                    RuntimeError,
                    OSError,
                    asyncio.TimeoutError,
                ):
                    self.disconnect(connection["ws"], room)

            await asyncio.gather(
                *(update(c) for c in list(self.active_connections.get(room, [])))
            )

    def forget(self, room):
        self.room_locks.pop(room, None)


ws_manager = ConnectionManager()
