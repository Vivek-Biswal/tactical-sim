"""Fictional coordination exercise; conflicting reports have no hidden correct answer."""

from copy import deepcopy

INITIAL_UNITS = [
    {
        "id": "unit-alpha",
        "name": "Team Alpha",
        "callsign": "Alpha",
        "role": "Recon",
        "type": "infantry",
        "faction": "friendly",
        "x": 220,
        "y": 380,
        "heading": 35,
        "status": "operational",
        "communicationStatus": "NORMAL",
    },
    {
        "id": "unit-bravo",
        "name": "Team Bravo",
        "callsign": "Bravo",
        "role": "Support",
        "type": "infantry",
        "faction": "friendly",
        "x": 160,
        "y": 510,
        "heading": 25,
        "status": "operational",
        "communicationStatus": "NORMAL",
    },
]
TIMELINE = [
    (0, "EXERCISE_STARTED"),
    (20, "RADIO_DELAY"),
    (40, "CONFLICTING_REPORT"),
    (60, "MAP_OUTDATED"),
    (80, "RADIO_DROPOUT"),
    (100, "NEW_INTELLIGENCE"),
    (110, "DECISION_REQUIRED"),
    (120, "EXERCISE_ENDED"),
]
TITLES = {
    "EXERCISE_STARTED": "Operation Silent Link started",
    "RADIO_DELAY": "Radio propagation delay",
    "RADIO_DROPOUT": "Radio net offline",
    "RADIO_RESTORED": "Radio net restored",
    "CONFLICTING_REPORT": "Contradictory reports received",
    "MAP_OUTDATED": "Map telemetry frozen",
    "MAP_UNAVAILABLE": "Map feed unavailable",
    "MAP_RESTORED": "Map telemetry restored",
    "NEW_INTELLIGENCE": "New intelligence received",
    "DECISION_REQUIRED": "Commander decision required",
    "EXERCISE_ENDED": "Exercise ended",
    "TEAM_MOVEMENT": "Team movement ordered",
}


def get_operation_silent_link(is_demo: bool = True) -> dict:
    duration = 120 if is_demo else 900
    return {
        "id": "scenario-op-silent-link",
        "name": "Operation Silent Link",
        "codeName": "SILENT-LINK-26248",
        "description": "Multi-domain coordination under incomplete, delayed and conflicting information.",
        "durationSeconds": duration,
        "operationalArea": "Obsidian Ridge — fictional training grid",
        "initialUnits": deepcopy(INITIAL_UNITS),
        "events": [
            {
                "id": f"scheduled-{second}",
                "type": kind,
                "triggerTime": second * duration / 120,
                "title": TITLES[kind],
                "description": TITLES[kind],
                "payload": {},
            }
            for second, kind in TIMELINE
        ],
    }
