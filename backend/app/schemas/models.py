"""Validated commands; public state uses the frontend's field names."""

import math
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class Command(BaseModel):
    model_config = ConfigDict(
        extra="forbid", str_strip_whitespace=True, allow_inf_nan=False
    )


class TrainingArea(Command):
    id: str = Field(default="nilgiri-demo", min_length=1, max_length=80)
    name: str = Field(default="Nilgiri hills — demo", min_length=1, max_length=80)
    latitude: float = Field(default=11.42, ge=-75, le=75)
    longitude: float = Field(default=76.70, ge=-180, le=180)
    widthMeters: float = Field(default=8000, ge=200, le=20000)
    heightMeters: float = Field(default=6000, ge=200, le=20000)

    @model_validator(mode="after")
    def check_bounds(self):
        half_width = self.widthMeters / (
            2 * 111319.49079327358 * math.cos(math.radians(self.latitude))
        )
        if abs(self.longitude) + half_width > 180:
            raise ValueError("Training area must not cross the antimeridian")
        return self


class ExerciseCreate(Command):
    scenarioId: Literal["scenario-op-silent-link", "demo"] = "scenario-op-silent-link"
    teamName: str = Field(default="Task Force Alpha", min_length=1, max_length=80)
    isDemoMode: bool = True
    speedMultiplier: float = Field(default=1, ge=0.25, le=10)
    trainingArea: TrainingArea = Field(default_factory=TrainingArea)


class ExerciseControl(Command):
    action: Literal[
        "start", "pause", "resume", "end", "reset", "set_speed", "set_training_area"
    ]
    speedMultiplier: float | None = Field(default=None, ge=0.25, le=10)
    trainingArea: TrainingArea | None = None


class InstructorInject(Command):
    action: Literal[
        "delay_radio",
        "drop_radio",
        "restore_radio",
        "conflicting_report",
        "outdate_map",
        "unavailable_map",
        "restore_map",
        "new_intelligence",
        "custom_message",
        "decision_required",
        "deploy_uav",
    ]
    payload: dict[str, Any] = Field(default_factory=dict)


class ScenarioEventInput(Command):
    type: Literal[
        "RADIO_DELAY",
        "RADIO_DROPOUT",
        "RADIO_RESTORED",
        "CONFLICTING_REPORT",
        "MAP_OUTDATED",
        "MAP_UNAVAILABLE",
        "MAP_RESTORED",
        "NEW_INTELLIGENCE",
        "DECISION_REQUIRED",
        "TEAM_MOVEMENT",
    ]
    payload: dict[str, Any] = Field(default_factory=dict)


class RadioInput(Command):
    content: str = Field(min_length=1, max_length=2000)
    sender: str = Field(default="Commander", min_length=1, max_length=80)
    senderRole: Literal["COMMANDER", "TEAM_ALPHA", "TEAM_BRAVO", "TEAM_CHARLIE"] = (
        "COMMANDER"
    )


class TraineeDecisionInput(Command):
    decision: str = Field(min_length=1, max_length=300)
    rationale: str = Field(min_length=1, max_length=4000)
    confidence: Literal["low", "medium", "high"] = "medium"
    traineeId: str = Field(default="Commander", min_length=1, max_length=80)
    selectedActionId: str = Field(default="", max_length=80)


class MovementInput(Command):
    unitId: str = Field(min_length=1, max_length=80)
    x: float = Field(ge=0, le=800)
    y: float = Field(ge=0, le=600)


class EventPayload(Command):
    delay: float = Field(default=10, ge=0, le=60)
    content: str = Field(
        default="Sector 4 activity reported. Reliability: medium. Verify independently.",
        min_length=1,
        max_length=2000,
    )
    reportA: str = Field(
        default="Alpha scout reports activity along the western ridge.",
        min_length=1,
        max_length=2000,
    )
    reportB: str = Field(
        default="Intelligence relay reports activity in the eastern sector; western ridge unconfirmed.",
        min_length=1,
        max_length=2000,
    )
    sender: str = Field(default="Instructor relay", min_length=1, max_length=80)
