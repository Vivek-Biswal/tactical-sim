import unittest
from copy import deepcopy
from unittest.mock import patch

from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.config import settings
from app.main import app
from app.scenario_engine.engine import ExerciseSession, engine_manager
from app.schemas.models import ExerciseControl, TrainingArea
from app.service import control
from app.websocket.manager import ws_manager

AREA = {
    "id": "custom",
    "name": "Test hills",
    "latitude": 12.0,
    "longitude": 77.0,
    "widthMeters": 4000,
    "heightMeters": 3000,
}


class GeographyTests(unittest.TestCase):
    def test_area_validation_and_reset_preservation(self):
        for field, value in [
            ("latitude", 76),
            ("longitude", 180),
            ("widthMeters", 10),
            ("heightMeters", 20001),
            ("latitude", float("nan")),
        ]:
            with self.assertRaises(ValidationError):
                TrainingArea.model_validate({**AREA, field: value})
        session = ExerciseSession("geo", training_area=AREA)
        control(
            session,
            ExerciseControl(
                action="set_training_area", trainingArea={**AREA, "latitude": 13}
            ),
        )
        self.assertEqual(session.get_state()["trainingArea"]["latitude"], 13)
        other = ExerciseSession("other")
        self.assertNotEqual(other.training_area, session.training_area)
        session.start()
        with self.assertRaises(ValueError):
            control(
                session, ExerciseControl(action="set_training_area", trainingArea=AREA)
            )
        session.pause()
        replacement = control(session, ExerciseControl(action="reset"))
        self.assertEqual(replacement.training_area, session.training_area)

    def test_uav_uses_existing_clock_and_degraded_feed(self):
        session = ExerciseSession("geo")
        session.start()
        session.apply_instructor_inject("deploy_uav")
        unit = next(u for u in session.units if u["id"] == "unit-uav")
        initial = deepcopy(unit)
        spawn = next(e for e in session.event_log if e["type"] == "UAV_DEPLOYED")
        self.assertEqual(spawn["payload"]["unit"]["x"], 400)
        self.assertEqual(spawn["payload"]["unit"]["altitudeMeters"], 150)
        session.tick(2)
        self.assertNotEqual(unit["x"], initial["x"])
        self.assertEqual(unit["altitudeMeters"], 150)
        session.pause()
        position = deepcopy(unit)
        session.tick(4)
        self.assertEqual(unit, position)
        session.resume()
        session.apply_instructor_inject("outdate_map")
        visible = session.get_state()["units"]
        session.tick(2)
        self.assertEqual(session.get_state()["units"], visible)
        self.assertNotEqual(session.units, visible)
        session.apply_instructor_inject("unavailable_map")
        self.assertEqual(session.get_state()["units"], [])
        session.apply_instructor_inject("restore_map")
        self.assertEqual(session.get_state()["units"], session.units)
        with self.assertRaises(ValueError):
            session.apply_instructor_inject("deploy_uav")
        record = session.record_decision("Verify", "Confirm independently", "medium")
        self.assertEqual(
            record["informationSnapshot"]["trainingArea"], session.training_area
        )
        record["informationSnapshot"]["trainingArea"]["latitude"] = 0
        self.assertEqual(session.training_area["latitude"], 11.42)
        session.end()
        self.assertEqual(session.generate_aar()["trainingArea"], session.training_area)
        self.assertTrue(
            any(
                e["type"] == "UAV_DEPLOYED"
                for e in session.generate_aar()["fullEventLog"]
            )
        )

    def test_http_and_websocket_share_instructor_selected_area(self):
        engine_manager.exercises.clear()
        ws_manager.active_connections.clear()
        with patch.object(settings, "AUTH_MODE", "demo"), TestClient(app) as client:
            invalid = client.post(
                "/api/exercises", json={"trainingArea": {**AREA, "longitude": 180}}
            )
            self.assertEqual(invalid.status_code, 422)
            response = client.post("/api/exercises", json={"trainingArea": AREA})
            self.assertEqual(response.status_code, 201)
            room = response.json()
            self.assertEqual(room["trainingArea"], AREA)
            path = "/api/exercises/" + room["exerciseId"]
            payload = {
                "action": "set_training_area",
                "trainingArea": {**AREA, "latitude": 13},
            }
            self.assertEqual(
                client.post(path + "/control", json=payload).status_code, 403
            )
            headers = {"X-Instructor-Key": room["instructorKey"]}
            self.assertEqual(
                client.post(
                    path + "/control", json=payload, headers=headers
                ).status_code,
                200,
            )
            with client.websocket_connect("/ws/exercises/" + room["exerciseId"]) as ws:
                ws.send_json(
                    {"type": "JOIN", "role": "COMMANDER", "name": "Geo trainee"}
                )
                ws.receive_json()
                shared = ws.receive_json()
                self.assertEqual(shared["type"], "STATE_UPDATE")
                self.assertEqual(shared["state"]["trainingArea"]["latitude"], 13)
                self.assertNotIn("trueUnits", shared["state"])
            client.post(path + "/control", json={"action": "start"}, headers=headers)
            self.assertEqual(
                client.post(
                    path + "/control", json=payload, headers=headers
                ).status_code,
                409,
            )
            self.assertEqual(
                client.post(
                    path + "/inject", json={"action": "deploy_uav"}, headers=headers
                ).status_code,
                200,
            )
            client.post(path + "/end", json={}, headers=headers)
            report = client.get(path + "/aar").json()
            self.assertEqual(report["trainingArea"]["latitude"], 13)
