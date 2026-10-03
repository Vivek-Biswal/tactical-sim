import json
import unittest
from copy import deepcopy

from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.persistence import checkpoint, restore_checkpoint
from app.scenario_engine.engine import ExerciseSession, engine_manager
from app.scenario_engine.training import (
    TRAINING_AREAS,
    heading_to,
    route_allows,
    surface_allows,
)
from app.schemas.models import TrainingArea
from app.websocket.manager import ws_manager


def area_for(preset, force):
    return TrainingArea.model_validate(
        {"id": preset["id"], "forceProfile": force}
    ).model_dump()


class TrainingMapsTests(unittest.TestCase):
    def test_compass_headings_match_svg_and_cesium_direction_contract(self):
        origin = {"x": 400, "y": 300}
        for destination, expected in [
            ({"x": 400, "y": 200}, 0),
            ({"x": 500, "y": 300}, 90),
            ({"x": 400, "y": 400}, 180),
            ({"x": 300, "y": 300}, 270),
        ]:
            self.assertEqual(heading_to(origin, destination), expected)
        area = area_for(TRAINING_AREAS["auli-mountains"], "air_force")
        session = ExerciseSession("heading", training_area=area)
        session.start()
        session.tick(0.1)
        # Clock-driven aircraft/contacts head east, south, west, west and north
        # along the shared preset used by the frontend offline engine.
        self.assertEqual([u["heading"] for u in session.units], [90, 180, 270, 270, 0])
        # Legacy direct orders use the same compass convention.
        legacy = ExerciseSession("legacy-heading")
        legacy.start()
        legacy.move_team({"unitId": "unit-alpha", "x": 220, "y": 300})
        legacy.tick(0.1)
        self.assertEqual(legacy.units[0]["heading"], 0)

    def test_every_india_preset_and_force_has_valid_initial_and_looping_routes(self):
        self.assertEqual(len(TRAINING_AREAS), 10)
        for preset in TRAINING_AREAS.values():
            for force in preset["supportedForces"]:
                with self.subTest(area=preset["id"], force=force):
                    area = area_for(preset, force)
                    session = ExerciseSession("training", training_area=area)
                    initial = deepcopy(session.units)
                    self.assertEqual(len(initial), 5)
                    self.assertEqual(
                        len({(u["x"], u["y"]) for u in initial}), len(initial)
                    )
                    self.assertEqual(
                        [u["id"] for u in initial if u["faction"] == "friendly"],
                        ["unit-alpha", "unit-bravo", "unit-charlie"],
                    )
                    for unit in initial:
                        self.assertTrue(surface_allows(area, unit["domain"], unit))
                        route = unit["patrolRoute"]
                        for start, end in zip(route, route[1:] + route[:1]):
                            self.assertTrue(
                                route_allows(area, unit["domain"], start, end)
                            )
                    session.start()
                    session.tick(55)
                    for before, after in zip(initial, session.units):
                        self.assertNotEqual(
                            (before["x"], before["y"]), (after["x"], after["y"])
                        )
                        self.assertTrue(surface_allows(area, after["domain"], after))
                    self.assertEqual(len(session.movements), 5)
                    # Patrol corners are integrated at exact arrival boundaries.
                    # A large tick and many small ticks must produce the same truth.
                    segmented = ExerciseSession("segmented", training_area=area)
                    segmented.start()
                    for _ in range(110):
                        segmented.tick(0.5)
                    for one, many in zip(session.units, segmented.units):
                        self.assertAlmostEqual(one["x"], many["x"], places=6)
                        self.assertAlmostEqual(one["y"], many["y"], places=6)
                        self.assertEqual(one["patrolIndex"], many["patrolIndex"])

    def test_canonical_preset_rejects_spoofed_coordinates_and_unsupported_force(self):
        with self.assertRaises(ValidationError):
            TrainingArea.model_validate({"id": "auli-mountains", "latitude": 10})
        with self.assertRaises(ValidationError):
            TrainingArea.model_validate({"id": "auli-mountains", "widthMeters": 8000})
        with self.assertRaises(ValidationError):
            TrainingArea.model_validate(
                {"id": "auli-mountains", "forceProfile": "navy"}
            )
        with self.assertRaises(ValidationError):
            TrainingArea.model_validate({"id": "custom", "forceProfile": "army"})
        area = TrainingArea.model_validate({"id": "chilika-lake"})
        self.assertEqual(area.latitude, 19.72)
        self.assertEqual(area.forceProfile, "navy")

    def test_domain_safe_manual_orders_override_patrol_without_crossing_land_or_water(
        self,
    ):
        river = area_for(TRAINING_AREAS["brahmaputra-river"], "joint")
        session = ExerciseSession("river", training_area=river)
        session.start()
        # Both ground endpoints are on land, but the route crosses the river.
        with self.assertRaisesRegex(ValueError, "Ground teams"):
            session.move_team({"unitId": "unit-alpha", "x": 100, "y": 100})
        with self.assertRaisesRegex(ValueError, "Boats"):
            session.move_team({"unitId": "unit-bravo", "x": 700, "y": 450})
        session.move_team({"unitId": "unit-alpha", "x": 110, "y": 480})
        session.tick(1)
        self.assertEqual(session.units[0]["x"], 110)
        self.assertEqual(session.units[0]["status"], "operational")
        self.assertNotIn("unit-alpha", session.movements)
        self.assertNotIn("patrolRoute", session.units[0])
        session.tick(1)
        self.assertEqual(session.units[0]["x"], 110)
        session.move_team({"unitId": "unit-charlie", "x": 100, "y": 100})
        with self.assertRaisesRegex(ValueError, "Friendly"):
            session.move_team({"unitId": "contact-1", "x": 100, "y": 100})

    def test_pause_and_degraded_feed_preserve_authoritative_air_and_boat_motion(self):
        area = area_for(TRAINING_AREAS["barren-volcano"], "joint")
        session = ExerciseSession("island", training_area=area)
        session.start()
        session.tick(2)
        session.pause()
        paused = deepcopy(session.units)
        session.tick(100)
        self.assertEqual(session.units, paused)
        # A UAV inserted while paused has its route ready but cannot move early.
        session.apply_instructor_inject("deploy_uav")
        uav = session.units[-1]
        uav_start = deepcopy(uav)
        session.tick(100)
        self.assertEqual(uav, uav_start)
        session.resume()
        session.apply_instructor_inject("outdate_map")
        frozen = deepcopy(session.get_state()["units"])
        session.tick(5)
        self.assertNotEqual(uav["x"], uav_start["x"])
        self.assertEqual(session.get_state()["units"], frozen)
        self.assertNotEqual(session.units, frozen)
        session.apply_instructor_inject("unavailable_map")
        self.assertEqual(session.get_state()["units"], [])
        self.assertEqual(session.get_state()["activityMarkers"], [])
        session.apply_instructor_inject("restore_map")
        self.assertEqual(session.get_state()["units"], session.units)
        # The existing checkpoint format captures patrol cursors and domain metadata.
        restored = restore_checkpoint(json.loads(json.dumps(checkpoint(session))))
        self.assertEqual(restored.status, "paused")
        self.assertEqual(restored.units, session.units)
        self.assertEqual(restored.movements, session.movements)
        restored.resume()
        restored.tick(1)
        self.assertNotEqual(restored.units, session.units)

    def test_api_area_selection_rebuilds_units_and_reset_and_aar_preserve_force(self):
        engine_manager.exercises.clear()
        ws_manager.active_connections.clear()
        ws_manager.room_locks.clear()
        with TestClient(app) as client:
            catalog = client.get("/api/scenarios/training-areas")
            self.assertEqual(catalog.status_code, 200)
            self.assertEqual(len(catalog.json()), 10)
            invalid = client.post(
                "/api/exercises",
                json={"trainingArea": {"id": "auli-mountains", "forceProfile": "navy"}},
            )
            self.assertEqual(invalid.status_code, 422)
            room = client.post(
                "/api/exercises",
                json={"trainingArea": {"id": "auli-mountains", "forceProfile": "army"}},
            ).json()
            path = "/api/exercises/" + room["exerciseId"]
            headers = {"X-Instructor-Key": room["instructorKey"]}
            changed = client.post(
                path + "/control",
                headers=headers,
                json={
                    "action": "set_training_area",
                    "trainingArea": {"id": "chilika-lake", "forceProfile": "navy"},
                },
            )
            self.assertEqual(changed.status_code, 200)
            self.assertTrue(all(u["domain"] == "sea" for u in changed.json()["units"]))
            self.assertEqual(changed.json()["trainingArea"]["latitude"], 19.72)
            started = client.post(
                path + "/control", headers=headers, json={"action": "start"}
            )
            self.assertEqual(started.status_code, 200)
            refused = client.post(
                path + "/control",
                headers=headers,
                json={
                    "action": "set_training_area",
                    "trainingArea": {"id": "thar-desert"},
                },
            )
            self.assertEqual(refused.status_code, 409)
            client.post(path + "/end", headers=headers)
            aar = client.get(path + "/aar").json()
            self.assertEqual(aar["trainingArea"]["forceProfile"], "navy")
            self.assertTrue(all(u["domain"] == "sea" for u in aar["initialUnits"]))
            reset = client.post(
                path + "/control", headers=headers, json={"action": "reset"}
            )
            self.assertEqual(reset.status_code, 200)
            self.assertEqual(
                reset.json()["trainingArea"], changed.json()["trainingArea"]
            )
            self.assertEqual(reset.json()["units"], changed.json()["units"])
            self.assertEqual(
                engine_manager.get_exercise(room["exerciseId"]).instructor_key,
                room["instructorKey"],
            )
