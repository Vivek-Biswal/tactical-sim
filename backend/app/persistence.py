"""Firestore persistence; the existing simulation remains authoritative.

Run one backend worker. Checkpoints are compressed JSON, never executable pickle.
Firestore RPCs run in worker threads, away from the simulation event loop.
"""

import asyncio
import gzip
import json
import logging
import time
import uuid
from copy import deepcopy

from app.config import settings

logger = logging.getLogger("chakravyuh.persistence")
CHUNK_BYTES = 450_000


def checkpoint(session):
    state = deepcopy(vars(session))
    state.pop("last_wall")
    state.pop("broadcast_cursor")
    state["triggered_event_ids"] = sorted(state["triggered_event_ids"])
    return {"schemaVersion": 1, "state": state}


def restore_checkpoint(value):
    from app.scenario_engine.engine import ExerciseSession

    if value.get("schemaVersion") != 1:
        raise ValueError("Unsupported checkpoint version")
    state = deepcopy(value["state"])
    session = ExerciseSession(state["exercise_id"])
    expected = set(vars(session)) - {"last_wall", "broadcast_cursor"}
    if set(state) != expected or state["status"] not in (
        "pending",
        "running",
        "paused",
        "completed",
    ):
        raise ValueError("Invalid checkpoint structure")
    state["triggered_event_ids"] = set(state["triggered_event_ids"])
    state["pending_messages"] = {
        int(k): v for k, v in state["pending_messages"].items()
    }
    vars(session).update(state)
    session.last_wall = time.monotonic()
    session.broadcast_cursor = len(session.event_log)
    if session.status == "running":
        session.status = "paused"
        session.log_event(
            "EXERCISE_RECOVERED",
            "Server restarted; exercise restored paused. Resume when your team is ready.",
        )
    return session


class FirestoreStore:
    def __init__(self, client=None):
        if client is None:
            from google.cloud import firestore
            from google.oauth2 import service_account

            credentials = None
            if settings.FIREBASE_SERVICE_ACCOUNT_JSON:
                credentials = service_account.Credentials.from_service_account_info(
                    json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
                )
            client = firestore.Client(
                project=settings.FIREBASE_PROJECT_ID,
                database=settings.FIRESTORE_DATABASE_ID,
                credentials=credentials,
            )
        self.client = client

    def save(self, value):
        from google.cloud import firestore

        state = value["state"]
        root = self.client.collection("exercises").document(state["exercise_id"])
        previous = root.get(timeout=15).to_dict() or {}
        snapshot_id = uuid.uuid4().hex
        snapshot = root.collection("snapshots").document(snapshot_id)
        payload = gzip.compress(
            json.dumps(value, allow_nan=False, separators=(",", ":")).encode()
        )
        chunks = [
            payload[i : i + CHUNK_BYTES] for i in range(0, len(payload), CHUNK_BYTES)
        ]
        # Commit chunks before publishing their pointer. Incomplete snapshots are
        # never visible to recovery. Keep each write batch below the request limit.
        for start in range(0, len(chunks), 8):
            batch = self.client.batch()
            for index in range(start, min(start + 8, len(chunks))):
                batch.set(
                    snapshot.collection("chunks").document(f"{index:06d}"),
                    {"data": chunks[index]},
                )
            batch.commit(timeout=15)
        batch = self.client.batch()
        batch.set(
            snapshot,
            {"chunkCount": len(chunks), "codec": "gzip-json", "schemaVersion": 1},
        )
        batch.set(
            root,
            {
                "exerciseId": state["exercise_id"],
                "teamName": state["team_name"],
                "status": state["status"],
                "createdAt": state["created_at"],
                "elapsedSeconds": state["elapsed_seconds"],
                "snapshotId": snapshot_id,
                "updatedAt": firestore.SERVER_TIMESTAMP,
                "schemaVersion": 1,
            },
        )
        batch.commit(timeout=15)
        # Old snapshots are private and may be cleaned up after pointer publication.
        old = previous.get("snapshotId")
        if old and old != snapshot_id:
            old_ref = root.collection("snapshots").document(old)
            for chunk in old_ref.collection("chunks").stream(timeout=15):
                chunk.reference.delete(timeout=15)
            old_ref.delete(timeout=15)

    def load(self, exercise_id):
        root = self.client.collection("exercises").document(exercise_id)
        record = root.get(timeout=15).to_dict()
        if not record:
            return None
        snapshot = root.collection("snapshots").document(record["snapshotId"])
        meta = snapshot.get(timeout=15).to_dict()
        if not meta or meta.get("codec") != "gzip-json":
            raise ValueError("Invalid checkpoint metadata")
        chunks = []
        for index in range(meta["chunkCount"]):
            chunk = (
                snapshot.collection("chunks")
                .document(f"{index:06d}")
                .get(timeout=15)
                .to_dict()
            )
            if not chunk:
                raise ValueError("Incomplete checkpoint")
            chunks.append(chunk["data"])
        value = json.loads(gzip.decompress(b"".join(chunks)))
        if value["state"]["exercise_id"] != exercise_id:
            raise ValueError("Checkpoint identity mismatch")
        return value

    def recent_ids(self):
        from google.cloud.firestore_v1.base_query import FieldFilter

        query = (
            self.client.collection("exercises")
            .where(filter=FieldFilter("status", "in", ["pending", "running", "paused"]))
            .limit(settings.MAX_EXERCISES)
        )
        active = [document.id for document in query.stream(timeout=15)]
        if len(active) < settings.MAX_EXERCISES:
            completed = (
                self.client.collection("exercises")
                .where(filter=FieldFilter("status", "==", "completed"))
                .limit(settings.MAX_EXERCISES - len(active))
            )
            active.extend(document.id for document in completed.stream(timeout=15))
        return active


class Persistence:
    def __init__(self):
        self.store = None
        self.last_queued = {}
        self.pending = {}
        self.lock = None
        self.wake = None
        self.worker = None
        self.stopping = False
        self.state = "disabled"

    async def start(self):
        if settings.STORAGE_BACKEND not in ("memory", "firestore"):
            raise ValueError("STORAGE_BACKEND must be memory or firestore")
        if settings.STORAGE_BACKEND == "memory":
            self.state = "disabled"
            return
        # Explicit persistence must connect at startup; don't silently fall back.
        self.store = await asyncio.to_thread(FirestoreStore)
        self.lock = asyncio.Lock()
        self.wake = asyncio.Event()
        self.stopping = False
        from app.scenario_engine.engine import engine_manager

        for exercise_id in await asyncio.to_thread(self.store.recent_ids):
            value = await asyncio.to_thread(self.store.load, exercise_id)
            if (
                value
                and exercise_id not in engine_manager.exercises
                and len(engine_manager.exercises) < settings.MAX_EXERCISES
            ):
                engine_manager.exercises[exercise_id] = restore_checkpoint(value)
        self.state = "connected"
        self.worker = asyncio.create_task(self._write_loop())

    async def save(self, session, force=False):
        if self.store is None:
            return
        now = time.monotonic()
        if (
            not force
            and now - self.last_queued.get(session.exercise_id, 0)
            < settings.FIRESTORE_CHECKPOINT_SECONDS
        ):
            return
        # Coalesce newer snapshots per room; database latency cannot stall ticks,
        # radio delivery, movement or WebSocket acknowledgements.
        self.pending[session.exercise_id] = checkpoint(session)
        self.last_queued[session.exercise_id] = now
        self.wake.set()

    async def _write_loop(self):
        while True:
            await self.wake.wait()
            self.wake.clear()
            while self.pending:
                exercise_id = next(iter(self.pending))
                value = self.pending.pop(exercise_id)
                try:
                    async with self.lock:
                        await asyncio.to_thread(self.store.save, value)
                    self.state = "connected"
                except Exception:
                    self.state = "degraded"
                    self.pending.setdefault(exercise_id, value)
                    logger.exception(
                        "Firestore checkpoint failed for room %s; will retry",
                        exercise_id,
                    )
                    if self.stopping:
                        return
                    await asyncio.sleep(5)
            if self.stopping:
                return

    async def load_archived(self, exercise_id):
        if self.store is None:
            return
        from app.scenario_engine.engine import engine_manager

        if (
            exercise_id in engine_manager.exercises
            or len(engine_manager.exercises) >= settings.MAX_EXERCISES
        ):
            return
        async with self.lock:
            value = await asyncio.to_thread(self.store.load, exercise_id)
            if value and exercise_id not in engine_manager.exercises:
                engine_manager.exercises[exercise_id] = restore_checkpoint(value)

    async def stop(self):
        if self.store is not None:
            from app.scenario_engine.engine import engine_manager

            for session in list(engine_manager.exercises.values()):
                await self.save(session, force=True)
            self.stopping = True
            self.wake.set()
            if self.worker:
                # Firestore requests have deadlines; wait for the writer so a
                # background thread is never left publishing an older checkpoint.
                await self.worker
            if self.pending:
                logger.error(
                    "Shutdown left %s checkpoints unpersisted", len(self.pending)
                )
        self.store = None
        self.lock = None
        self.wake = None
        self.worker = None
        self.pending.clear()
        self.last_queued.clear()


persistence = Persistence()
