import unittest
from copy import deepcopy

from app.scenario_engine.engine import ExerciseSession


class AARAnalysisTests(unittest.TestCase):
    def test_full_degradation_decision_and_final_review_flow(self):
        room = ExerciseSession("aar-analysis")
        room.start()
        room.tick(20)
        delayed = room.send_radio_message("Alpha", "TEAM_ALPHA", "Awaiting delivery")
        room.tick(90)
        self.assertEqual(delayed["generatedSecond"], 20)
        received = next(m for m in room.messages if m["id"] == delayed["id"])
        self.assertEqual(received["deliveredSecond"], 30)
        lost = room.send_radio_message("Bravo", "TEAM_BRAVO", "Unavailable report")
        room.tick(2.4)
        decision = room.record_decision("Hold", "Reports conflict; radio confirmation is unavailable.", "medium", "Commander", "hold")
        self.assertEqual(decision["decisionRequiredSecond"], 110)
        self.assertEqual(decision["decisionEventSecond"], 110)
        self.assertEqual(decision["responseLatencySeconds"], 2.4)
        self.assertEqual(decision["informationSnapshot"]["reliability"], "conflicting")
        self.assertNotIn(lost["id"], decision["informationSnapshot"]["reportIds"])
        self.assertNotIn("Unavailable report", str(decision["availableInformation"]))
        frozen = deepcopy(decision)
        room.apply_instructor_inject("restore_radio")
        room.apply_instructor_inject("new_intelligence")
        room.tick(7.6)
        final = room.generate_aar()
        self.assertTrue(final["isFinal"])
        self.assertEqual(final["decisions"][0], frozen)
        self.assertTrue(any(m["wasDelayed"] for m in final["messages"] if m.get("wasDelayed")))
        final["decisions"][0]["rationale"] = "Changed exported copy"
        self.assertEqual(room.decisions[0], frozen)

    def test_unprompted_decision_does_not_invent_response_latency(self):
        room = ExerciseSession("aar-unprompted")
        room.start()
        room.tick(1)
        decision = room.record_decision("Hold", "Keep current plan pending reports.", "low", "Commander")
        self.assertIsNone(decision["decisionRequiredSecond"])
        self.assertIsNone(decision["responseLatencySeconds"])


if __name__ == "__main__":
    unittest.main()
