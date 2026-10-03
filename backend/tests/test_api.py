import json
import time
import unittest

from fastapi.testclient import TestClient

from app.main import app
from app.scenario_engine.engine import engine_manager
from app.websocket.manager import ws_manager


def packet(ws, kind, predicate=lambda p: True):
    for _ in range(200):
        value = ws.receive_json()
        if value["type"] == kind and predicate(value):
            return value
    raise AssertionError(f"Missing {kind}")


class ApiTests(unittest.TestCase):
    def setUp(self):
        engine_manager.exercises.clear()
        ws_manager.active_connections.clear()
        ws_manager.room_locks.clear()
        self.client = TestClient(app)
        self.client.__enter__()
        self.room = self.client.post("/api/exercises", json={}).json()
        self.id = self.room["exerciseId"]
        self.headers = {"X-Instructor-Key": self.room["instructorKey"]}

    def tearDown(self):
        self.client.__exit__(None, None, None)

    def post(self, path, body):
        return self.client.post(
            f"/api/exercises/{self.id}/{path}", json=body, headers=self.headers
        )

    def test_validation_authority_and_missing_records(self):
        self.assertEqual(
            self.client.post(
                "/api/exercises/start", json={"scenarioId": "missing"}
            ).status_code,
            422,
        )
        self.assertEqual(
            self.client.get("/api/exercises/does-not-exist/aar").status_code, 404
        )
        self.assertEqual(
            self.client.get(f"/api/exercises/{self.id}/aar").status_code, 409
        )
        self.assertEqual(
            self.client.post(
                f"/api/exercises/{self.id}/control", json={"action": "start"}
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.post(
                f"/api/exercises/{self.id}/decision",
                json={"decision": " ", "rationale": ""},
            ).status_code,
            422,
        )
        self.assertEqual(
            self.post("inject", {"action": "delay_radio"}).status_code, 409
        )
        self.assertEqual(self.post("control", {"action": "start"}).status_code, 200)
        self.assertEqual(self.post("control", {"action": "start"}).status_code, 409)
        self.assertEqual(
            self.post(
                "inject", {"action": "delay_radio", "payload": {"delay": -1}}
            ).status_code,
            422,
        )
        self.assertEqual(
            self.post(
                "control", {"action": "set_speed", "speedMultiplier": 100}
            ).status_code,
            422,
        )
        self.assertNotIn(
            "trueUnits", self.client.get(f"/api/exercises/{self.id}").json()
        )
        self.assertIn(
            "trueUnits",
            self.client.get(f"/api/exercises/{self.id}", headers=self.headers).json(),
        )

    def test_two_clients_sync_permissions_ack_dedup_and_errors(self):
        self.post("control", {"action": "start"})
        with self.client.websocket_connect(f"/ws/exercises/{self.id}") as commander:
            commander.send_json({"type": "JOIN", "role": "COMMANDER", "name": "Alice"})
            packet(commander, "JOINED")
            packet(commander, "STATE_UPDATE")
            with self.client.websocket_connect(f"/ws/exercises/{self.id}") as team:
                team.send_json({"type": "JOIN", "role": "TEAM_ALPHA", "name": "Alpha"})
                packet(team, "JOINED")
                self.assertEqual(
                    len(packet(team, "STATE_UPDATE")["state"]["connectedTrainees"]), 2
                )
                team.send_json(
                    {
                        "type": "RADIO_MESSAGE",
                        "requestId": "radio-1",
                        "payload": {"content": "Cross-client report"},
                    }
                )
                self.assertEqual(
                    packet(team, "ACK")["result"]["deliveryStatus"], "DELIVERED"
                )
                update = packet(
                    commander, "STATE_UPDATE", lambda p: bool(p["state"]["messages"])
                )
                self.assertEqual(
                    update["state"]["messages"][0]["content"], "Cross-client report"
                )
                team.send_json(
                    {
                        "type": "RADIO_MESSAGE",
                        "requestId": "radio-1",
                        "payload": {"content": "Duplicate"},
                    }
                )
                packet(team, "ACK", lambda p: p["requestId"] == "radio-1")
                self.assertEqual(len(engine_manager.get_exercise(self.id).messages), 1)
                commander.send_json(
                    {
                        "type": "INSTRUCTOR_INJECT",
                        "requestId": "forbidden",
                        "payload": {"action": "drop_radio"},
                    }
                )
                self.assertIn("Instructor", packet(commander, "ERROR")["message"])
                team.send_json(
                    {
                        "type": "TEAM_MOVEMENT",
                        "requestId": "foreign",
                        "payload": {"unitId": "unit-bravo", "x": 1, "y": 1},
                    }
                )
                self.assertIn("own team", packet(team, "ERROR")["message"])
                commander.send_text("not-json")
                packet(commander, "ERROR")
                commander.send_bytes(b"binary-not-allowed")
                packet(commander, "ERROR")
                commander.send_json(["not-an-object"])
                packet(commander, "ERROR")
                commander.send_json({"type": None, "requestId": "malformed"})
                packet(commander, "ERROR")
                commander.send_json({"type": "REQUEST_STATE", "requestId": "recovered"})
                packet(commander, "ACK", lambda p: p["requestId"] == "recovered")
                self.post("inject", {"action": "drop_radio"})
                packet(
                    team,
                    "STATE_UPDATE",
                    lambda p: p["state"]["commsStatus"] == "offline",
                )
                team.send_json(
                    {
                        "type": "RADIO_MESSAGE",
                        "requestId": "lost",
                        "payload": {"content": "WITHHELD_BODY"},
                    }
                )
                self.assertEqual(
                    packet(team, "ACK", lambda p: p["requestId"] == "lost")["result"][
                        "deliveryStatus"
                    ],
                    "DROPPED",
                )
                public = packet(
                    commander,
                    "STATE_UPDATE",
                    lambda p: any(
                        e["category"] == "MESSAGE_DROPPED"
                        for e in p["state"]["eventLog"]
                    ),
                )
                self.assertNotIn("WITHHELD_BODY", json.dumps(public))
                commander.send_json(
                    {
                        "type": "DECISION_SUBMIT",
                        "requestId": "decision",
                        "payload": {
                            "decision": "Hold",
                            "rationale": "Link unavailable",
                            "confidence": "low",
                        },
                    }
                )
                packet(commander, "ACK", lambda p: p["requestId"] == "decision")
                update = packet(
                    team, "STATE_UPDATE", lambda p: bool(p["state"]["decisions"])
                )
                self.assertEqual(update["state"]["decisions"][0]["traineeId"], "Alice")
        self.assertEqual(ws_manager.get_trainee_status(self.id), [])

    def test_instructor_join_credential_and_csv_export(self):
        with self.client.websocket_connect(f"/ws/exercises/{self.id}") as forged:
            forged.send_json(
                {
                    "type": "JOIN",
                    "role": "INSTRUCTOR",
                    "name": "Wrong",
                    "instructorKey": "invalid-☃",
                }
            )
            self.assertEqual(forged.receive_json()["type"], "ERROR")
        with self.client.websocket_connect(f"/ws/exercises/{self.id}") as instructor:
            instructor.send_json(
                {
                    "type": "JOIN",
                    "role": "INSTRUCTOR",
                    "name": "Varun",
                    "instructorKey": self.room["instructorKey"],
                }
            )
            packet(instructor, "JOINED")
            self.assertIn("trueUnits", packet(instructor, "STATE_UPDATE")["state"])
            instructor.send_json(
                {
                    "type": "EXERCISE_CONTROL",
                    "requestId": "start",
                    "payload": {"action": "start"},
                }
            )
            packet(instructor, "ACK")
            packet(
                instructor, "STATE_UPDATE", lambda p: p["state"]["status"] == "running"
            )
        self.client.post(
            f"/api/exercises/{self.id}/decision",
            json={
                "decision": "=formula",
                "rationale": "Verify sources",
                "confidence": "high",
            },
        )
        self.post("end", {})
        aar = self.client.get(f"/api/exercises/{self.id}/aar").json()
        self.assertTrue(aar["isFinal"])
        self.assertEqual(aar["stats"]["decisionsCount"], 1)
        csv = self.client.get(f"/api/exercises/{self.id}/aar/export?format=csv")
        self.assertIn("'=formula", csv.text)
        self.assertIn("attachment", csv.headers["content-disposition"])
        self.assertEqual(
            self.client.post(
                f"/api/exercises/{self.id}/messages", json={"content": "late"}
            ).status_code,
            409,
        )
        self.post("control", {"action": "reset"})
        state = self.client.get(f"/api/exercises/{self.id}").json()
        self.assertEqual(state["status"], "pending")
        self.assertEqual(state["decisions"], [])

    def test_scheduler_advances_real_clock(self):
        self.post("control", {"action": "start"})
        time.sleep(0.65)
        state = self.client.get(f"/api/exercises/{self.id}").json()
        self.assertGreater(state["elapsedSeconds"], 0.4)
        self.post("control", {"action": "pause"})
        before = self.client.get(f"/api/exercises/{self.id}").json()["elapsedSeconds"]
        time.sleep(0.65)
        self.assertEqual(
            self.client.get(f"/api/exercises/{self.id}").json()["elapsedSeconds"],
            before,
        )

    def test_work_file_socket_aliases_and_delivered_message(self):
        self.post("control", {"action": "start"})
        with self.client.websocket_connect(f"/ws/exercises/{self.id}") as commander:
            commander.send_json(
                {"type": "JOIN_EXERCISE", "role": "COMMANDER", "name": "Lead"}
            )
            packet(commander, "JOINED")
            packet(commander, "STATE_UPDATE")
            with self.client.websocket_connect(f"/ws/exercises/{self.id}") as team:
                team.send_json({"type": "JOIN", "role": "TEAM_ALPHA", "name": "Alpha"})
                packet(team, "JOINED")
                packet(team, "STATE_UPDATE")
                team.send_json(
                    {
                        "type": "SEND_MESSAGE",
                        "requestId": "work-file-message",
                        "payload": {"message": "Checkpoint reached"},
                    }
                )
                ack = packet(team, "ACK")
                self.assertEqual(ack["result"]["deliveryStatus"], "DELIVERED")
                event = packet(
                    commander,
                    "SCENARIO_EVENT",
                    lambda p: p["event"] == "MESSAGE_DELIVERED",
                )
                for field in ("title", "description", "source"):
                    self.assertIsInstance(event[field], str)
                delivered = packet(commander, "TEAM_MESSAGE")
                self.assertEqual(delivered["messageId"], ack["result"]["messageId"])
                self.assertEqual(delivered["sender"], "Alpha")
                self.assertEqual(delivered["senderRole"], "TEAM_ALPHA")
                self.assertEqual(delivered["message"], "Checkpoint reached")
                self.assertEqual(delivered["channel"], "TACTICAL_RADIO")
                self.assertIsInstance(delivered["timestamp"], (int, float))
                state = packet(commander, "STATE_UPDATE")
                self.assertEqual(
                    state["state"]["messages"][0]["id"], delivered["messageId"]
                )

    def test_socket_never_broadcasts_hidden_uav_positions(self):
        for mode in ("outdate_map", "unavailable_map"):
            with self.subTest(mode=mode):
                self.post("control", {"action": "reset"})
                self.post("control", {"action": "start"})
                self.post("control", {"action": "pause"})
                self.post("inject", {"action": mode})
                with self.client.websocket_connect(
                    f"/ws/exercises/{self.id}"
                ) as commander:
                    commander.send_json(
                        {"type": "JOIN", "role": "COMMANDER", "name": "Lead"}
                    )
                    packet(commander, "JOINED")
                    packet(commander, "STATE_UPDATE")
                    response = self.post("inject", {"action": "deploy_uav"})
                    self.assertEqual(response.status_code, 200)
                    self.assertIn("unit-uav", json.dumps(response.json()["trueUnits"]))
                    packets = []
                    while True:
                        value = commander.receive_json()
                        packets.append(value)
                        if (
                            value["type"] == "STATE_UPDATE"
                            and value["state"]["revision"]
                            >= response.json()["revision"]
                        ):
                            break
                    self.assertNotIn("unit-uav", json.dumps(packets))
                    self.assertFalse(
                        any(p.get("event") == "UAV_DEPLOYED" for p in packets)
                    )

    def test_queued_and_dropped_bodies_are_not_message_envelopes(self):
        self.post("control", {"action": "start"})
        self.post("inject", {"action": "delay_radio", "payload": {"delay": 10}})
        with self.client.websocket_connect(f"/ws/exercises/{self.id}") as commander:
            commander.send_json({"type": "JOIN", "role": "COMMANDER", "name": "Lead"})
            packet(commander, "JOINED")
            packet(commander, "STATE_UPDATE")
            response = self.client.post(
                f"/api/exercises/{self.id}/messages",
                json={"message": "QUEUED_PRIVATE_BODY"},
            )
            self.assertEqual(response.status_code, 200)
            packets = []
            while True:
                value = commander.receive_json()
                packets.append(value)
                if (
                    value["type"] == "STATE_UPDATE"
                    and value["state"]["pendingMessages"]
                ):
                    break
            self.assertNotIn("QUEUED_PRIVATE_BODY", json.dumps(packets))
            self.assertFalse(any(p["type"] == "TEAM_MESSAGE" for p in packets))
            response = self.post("inject", {"action": "drop_radio"})
            packets = []
            while True:
                value = commander.receive_json()
                packets.append(value)
                if (
                    value["type"] == "STATE_UPDATE"
                    and value["state"]["commsStatus"] == "offline"
                ):
                    break
            self.assertNotIn("QUEUED_PRIVATE_BODY", json.dumps(packets))
            self.assertFalse(any(p["type"] == "TEAM_MESSAGE" for p in packets))
