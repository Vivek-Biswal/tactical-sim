import asyncio
import base64
import json
import os
import threading
import unittest
from copy import deepcopy
from unittest.mock import patch

from app.persistence import FirestoreStore, Persistence, checkpoint, restore_checkpoint
from app.scenario_engine.engine import ExerciseSession, engine_manager


class Snapshot:
    def __init__(self, reference, value):
        self.reference, self.value = reference, value

    def to_dict(self):
        return deepcopy(self.value)


class Document:
    def __init__(self, client, path):
        self.client, self.path = client, path

    def get(self, **kwargs):
        return Snapshot(self, self.client.data.get(self.path))

    def collection(self, name):
        return Collection(self.client, self.path + "/" + name)

    def delete(self, **kwargs):
        self.client.data.pop(self.path, None)


class Collection:
    def __init__(self, client, path):
        self.client, self.path = client, path

    def document(self, name):
        return Document(self.client, self.path + "/" + name)

    def stream(self, **kwargs):
        prefix = self.path + "/"
        return [
            Snapshot(Document(self.client, path), value)
            for path, value in list(self.client.data.items())
            if path.startswith(prefix) and "/" not in path[len(prefix) :]
        ]


class Batch:
    def __init__(self, client):
        self.client, self.writes = client, []

    def set(self, document, value):
        self.writes.append((document.path, deepcopy(value)))

    def commit(self, **kwargs):
        if self.client.fail_chunks and any(
            "/chunks/" in path for path, _ in self.writes
        ):
            raise RuntimeError("Simulated partial write")
        self.client.data.update(self.writes)


class Client:
    def __init__(self):
        self.data, self.fail_chunks = {}, False

    def collection(self, name):
        return Collection(self, name)

    def batch(self):
        return Batch(self)


class PersistenceTests(unittest.TestCase):
    def test_checkpoint_restores_private_truth_stale_feed_pending_radio_and_key(self):
        room = ExerciseSession("ex-recovery")
        room.start()
        room.tick(61)
        room.send_radio_message("Alpha", "TEAM_ALPHA", "private radio")
        value = json.loads(json.dumps(checkpoint(room)))
        restored = restore_checkpoint(value)
        self.assertEqual(restored.status, "paused")
        self.assertEqual(restored.elapsed_seconds, room.elapsed_seconds)
        self.assertEqual(restored.instructor_key, room.instructor_key)
        self.assertEqual(restored.units, room.units)
        self.assertEqual(restored.reported_units, room.reported_units)
        self.assertEqual(restored.pending_messages, room.pending_messages)
        self.assertEqual(restored.triggered_event_ids, room.triggered_event_ids)
        self.assertNotIn("trueUnits", restored.get_state())
        self.assertNotIn("private radio", json.dumps(restored.get_state()))
        restored.tick(100)
        self.assertEqual(restored.elapsed_seconds, 61)
        restored.resume()
        restored.tick(1)
        self.assertEqual(restored.elapsed_seconds, 62)

    def test_completed_aar_survives_restart(self):
        room = ExerciseSession("ex-aar")
        room.start()
        room.tick(110)
        room.record_decision("Wait", "Confirm before acting", 75, "Commander")
        room.end()
        restored = restore_checkpoint(json.loads(json.dumps(checkpoint(room))))
        self.assertEqual(restored.generate_aar(), room.generate_aar())
        value = checkpoint(room)
        value["state"]["team_name"] = "changed copy"
        self.assertNotEqual(room.team_name, value["state"]["team_name"])
        value["schemaVersion"] = 99
        with self.assertRaises(ValueError):
            restore_checkpoint(value)

    def test_large_checkpoints_are_chunked_and_partial_writes_keep_previous(self):
        room = ExerciseSession("ex-chunk-test")
        room.reports = [{"content": base64.b64encode(os.urandom(800000)).decode()}]
        client = Client()
        store = FirestoreStore(client)
        value = checkpoint(room)
        store.save(value)
        original_pointer = client.data["exercises/ex-chunk-test"]["snapshotId"]
        self.assertGreater(len([path for path in client.data if "/chunks/" in path]), 1)
        self.assertEqual(store.load(room.exercise_id), value)
        room.team_name = "New team"
        client.fail_chunks = True
        with self.assertRaises(RuntimeError):
            store.save(checkpoint(room))
        self.assertEqual(
            client.data["exercises/ex-chunk-test"]["snapshotId"], original_pointer
        )
        self.assertEqual(store.load(room.exercise_id), value)
        client.fail_chunks = False
        store.save(checkpoint(room))
        self.assertEqual(store.load(room.exercise_id)["state"]["team_name"], "New team")
        self.assertFalse(any(original_pointer in path for path in client.data))

    def test_background_writer_does_not_block_simulation_and_flushes_shutdown(self):
        class Store:
            def __init__(self):
                self.release = threading.Event()
                self.started = threading.Event()
                self.saved = []

            def recent_ids(self):
                return []

            def save(self, value):
                self.started.set()
                if not self.release.wait(3):
                    raise RuntimeError("Test writer timed out")
                self.saved.append(deepcopy(value))

        async def run():
            store = Store()
            service = Persistence()
            with (
                patch("app.persistence.settings.STORAGE_BACKEND", "firestore"),
                patch("app.persistence.FirestoreStore", return_value=store),
                patch.object(engine_manager, "exercises", {}),
            ):
                await service.start()
                room = ExerciseSession("ex-nonblocking")
                engine_manager.exercises[room.exercise_id] = room
                room.start()
                await asyncio.wait_for(service.save(room, force=True), 0.5)
                self.assertTrue(await asyncio.to_thread(store.started.wait, 1))
                room.tick(20)
                await asyncio.wait_for(service.save(room, force=True), 0.5)
                self.assertEqual(room.elapsed_seconds, 20)
                store.release.set()
                await service.stop()
                self.assertEqual(store.saved[-1]["state"]["elapsed_seconds"], 20)

        asyncio.run(run())


if __name__ == "__main__":
    unittest.main()
