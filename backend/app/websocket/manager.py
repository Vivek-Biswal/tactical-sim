import asyncio

from fastapi import WebSocketDisconnect

from app.config import settings


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

    async def broadcast_state(self, session, persist=True):
        if persist:
            from app.persistence import persistence

            await persistence.save(session, force=True)
        room = session.exercise_id
        async with self.room_locks.setdefault(room, asyncio.Lock()):
            events = session.event_log[session.broadcast_cursor :]
            session.broadcast_cursor = len(session.event_log)
            delivered = {
                m["id"]: m for m in session.messages if m["status"] == "delivered"
            }

            async def update(connection):
                try:
                    instructor = connection["role"] == "INSTRUCTOR"
                    state = session.get_state(instructor)
                    state["connectedTrainees"] = self.get_trainee_status(room)
                    for event in events:
                        if (
                            instructor
                            or session.map_status == "current"
                            or event["type"]
                            not in ("TEAM_MOVEMENT", "TEAM_ARRIVED", "UAV_DEPLOYED")
                        ):
                            await self.send(
                                connection,
                                {
                                    "type": "SCENARIO_EVENT",
                                    "event": event["type"],
                                    "timestamp": event["second"],
                                    "title": event["title"],
                                    "description": event["description"],
                                    "source": event.get("source", "system"),
                                    "payload": event["payload"],
                                },
                            )
                        if event["type"] == "MESSAGE_DELIVERED":
                            message = delivered.get(event["payload"].get("messageId"))
                            if message:
                                await self.send(
                                    connection,
                                    {
                                        "type": "TEAM_MESSAGE",
                                        "messageId": message["id"],
                                        "sender": message["sender"],
                                        "senderRole": message["senderRole"],
                                        "message": message["content"],
                                        "timestamp": message["timestampDelivered"],
                                        "channel": message.get(
                                            "channel", "TACTICAL_RADIO"
                                        ),
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
