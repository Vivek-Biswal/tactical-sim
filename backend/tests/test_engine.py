import unittest
from copy import deepcopy

from pydantic import ValidationError

from app.scenario_engine.engine import ExerciseSession
from app.scenario_engine.events import get_operation_silent_link
from app.schemas.models import EventPayload, RadioInput, TraineeDecisionInput


class EngineTests(unittest.TestCase):
    def room(self):
        s = ExerciseSession("test")
        s.start()
        return s

    def test_exact_timeline_and_no_duplicate_events(self):
        s = self.room()
        s.tick(120)
        expected = [
            (0, "EXERCISE_STARTED"),
            (20, "RADIO_DELAY"),
            (40, "CONFLICTING_REPORT"),
            (60, "MAP_OUTDATED"),
            (80, "RADIO_DROPOUT"),
            (100, "NEW_INTELLIGENCE"),
            (110, "DECISION_REQUIRED"),
            (120, "EXERCISE_ENDED"),
        ]
        actual = [
            (e["second"], e["type"])
            for e in s.event_log
            if e["type"] in [kind for _, kind in expected]
        ]
        self.assertEqual(actual, expected)
        self.assertEqual(s.status, "completed")
        before = deepcopy(s.event_log)
        s.tick(500)
        self.assertEqual(s.event_log, before)
        self.assertEqual(
            [e["second"] for e in s.event_log], sorted(e["second"] for e in s.event_log)
        )

    def test_stale_activity_and_positions_are_private(self):
        s = self.room()
        s.tick(60)
        snapshot = deepcopy(s.get_state()["units"])
        s.tick(45)
        self.assertEqual(s.get_state()["units"], snapshot)
        self.assertNotEqual(s.units, snapshot)
        self.assertEqual(len(s.get_state()["activityMarkers"]), 3)
        self.assertEqual(len(s.activities), 4)
        self.assertNotIn("trueUnits", s.get_state())
        s.apply_instructor_inject("unavailable_map")
        self.assertEqual(s.get_state()["units"], [])
        self.assertEqual(s.get_state()["activityMarkers"], [])
        s.apply_instructor_inject("restore_map")
        self.assertEqual(s.get_state()["units"], s.units)
        self.assertEqual(s.get_state()["activityMarkers"], s.activities)

    def test_delay_pause_and_dropout(self):
        s = self.room()
        s.tick(20)
        message = s.send_radio_message("Alpha", "TEAM_ALPHA", "private delayed report")
        self.assertEqual(message["deliveryStatus"], "DELAYED")
        self.assertNotIn("private delayed report", str(s.get_state()))
        s.pause()
        s.tick(200)
        self.assertEqual(s.elapsed_seconds, 20)
        s.resume()
        s.tick(9)
        self.assertEqual(len(s.get_state()["messages"]), 0)
        s.tick(1)
        self.assertEqual(s.get_state()["messages"][0]["timestampDelivered"], 30)
        s.send_radio_message("Alpha", "TEAM_ALPHA", "private lost report")
        s.apply_instructor_inject("drop_radio")
        self.assertEqual(len(s.pending_messages), 0)
        self.assertNotIn("private lost report", str(s.get_state()))
        self.assertIn("private lost report", str(s.generate_aar()))
        self.assertEqual(s.generate_aar()["stats"]["messagesDropped"], 1)

    def test_decision_captures_knowledge_at_submission(self):
        s = self.room()
        s.tick(110)
        d = s.record_decision(
            "Hold", "Reports disagree; verify first", "medium", "Alice", "hold"
        )
        self.assertEqual(d["mapStatus"], "outdated")
        self.assertEqual(d["communicationState"], "offline")
        frozen = deepcopy(d)
        s.apply_instructor_inject("restore_map")
        s.apply_instructor_inject("restore_radio")
        self.assertEqual(s.decisions[0], frozen)
        self.assertIsNone(s.active_decision)
        self.assertIn("Current team positions", d["unavailableInformation"])
        self.assertEqual(len(d["informationSnapshot"]["reportIds"]), 3)

    def test_movement_pause_bounds_arrival_and_isolation(self):
        s = self.room()
        other = self.room()
        s.move_team({"unitId": "unit-alpha", "x": 300, "y": 380})
        s.tick(5)
        self.assertEqual(s.units[0]["x"], 260)
        s.pause()
        s.tick(40)
        self.assertEqual(s.units[0]["x"], 260)
        s.resume()
        s.tick(5)
        self.assertEqual(s.units[0]["x"], 300)
        self.assertEqual(s.units[0]["status"], "operational")
        self.assertEqual(other.units[0]["x"], 220)
        with self.assertRaises(ValueError):
            s.move_team({"unitId": "unit-alpha", "x": float("nan"), "y": 1})
        with self.assertRaises(ValueError):
            s.move_team({"unitId": "unit-alpha", "x": 801, "y": 1})

    def test_standard_duration_and_early_end_flush(self):
        s = ExerciseSession("normal", is_demo=False)
        self.assertEqual(s.total_duration, 900)
        s.start()
        s.tick(150)
        self.assertEqual(s.comms_status, "delayed")
        s.send_radio_message("Alpha", "TEAM_ALPHA", "waiting")
        s.end()
        self.assertEqual(s.generate_aar()["stats"]["messagesPending"], 0)
        self.assertIsNotNone(s.completed_at)

    def test_work_file_compatible_payloads_and_public_map_aliases(self):
        command = TraineeDecisionInput.model_validate(
            {
                "decision": "Hold",
                "rationale": "Confirm both reports",
                "confidence": " MEDIUM ",
            }
        )
        self.assertEqual(command.confidence, "medium")
        radio = RadioInput.model_validate({"message": "Team Alpha, report."})
        self.assertEqual(radio.content, "Team Alpha, report.")
        with self.assertRaises(ValidationError):
            RadioInput.model_validate({"content": "A", "message": "B"})
        with self.assertRaises(ValidationError):
            TraineeDecisionInput.model_validate(
                {"decision": "Hold", "rationale": "Confirm", "confidence": "certain"}
            )
        values = EventPayload.model_validate(
            {"message": "A new observation needs checking", "reliability": "HIGH"}
        )
        self.assertEqual(values.content, "A new observation needs checking")
        self.assertEqual(values.reliability, "high")
        with self.assertRaises(ValidationError):
            EventPayload.model_validate({"content": "A", "message": "B"})
        s = self.room()
        s.apply_instructor_inject(
            "new_intelligence", {"message": values.content, "reliability": "HIGH"}
        )
        self.assertEqual(s.reports[-1]["reliability"], "high")
        self.assertEqual(s.messages[-1]["reliability"], "high")
        self.assertIn("high reliability", s.activities[-1]["label"])
        decision = s.record_decision(
            command.decision, command.rationale, command.confidence
        )
        s.end()
        self.assertEqual(s.generate_aar()["messages"][-1]["reliability"], "high")
        self.assertEqual(s.generate_aar()["decisions"][0], decision)
        self.assertEqual(s.get_state()["activities"], s.get_state()["activityMarkers"])
        s.map_status = "unavailable"
        self.assertEqual(s.get_state()["activities"], [])

    def test_scenario_metadata_describes_actual_delay_and_report_payloads(self):
        scenario = get_operation_silent_link()
        by_type = {e["type"]: e for e in scenario["events"]}
        self.assertEqual(by_type["RADIO_DELAY"]["payload"]["delay"], 10)
        self.assertTrue(by_type["CONFLICTING_REPORT"]["payload"]["reportA"])
        self.assertTrue(by_type["CONFLICTING_REPORT"]["payload"]["reportB"])
        self.assertEqual(
            by_type["CONFLICTING_REPORT"]["payload"]["reliability"], "unverified"
        )
        self.assertEqual(
            by_type["NEW_INTELLIGENCE"]["payload"]["reliability"], "medium"
        )
        # Scenario catalog callers cannot mutate another room's payloads.
        by_type["RADIO_DELAY"]["payload"]["delay"] = 1
        other = get_operation_silent_link()
        self.assertEqual(
            next(e for e in other["events"] if e["type"] == "RADIO_DELAY")["payload"][
                "delay"
            ],
            10,
        )
