from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
import time

class ScenarioEvent(BaseModel):
    id: str
    type: str  # "comms_degradation", "conflicting_report", "map_status", "intel_update", "decision_point", "checkpoint"
    triggerTime: int  # in seconds from start
    title: str
    description: str
    payload: Dict[str, Any] = Field(default_factory=dict)

class Scenario(BaseModel):
    id: str
    name: str
    codeName: str
    description: str
    durationSeconds: int = 120  # default demo 2 mins (120s), standard 600s
    operationalArea: str = "Sector 7 - Obsidian Ridge"
    initialUnits: List[Dict[str, Any]] = Field(default_factory=list)
    events: List[ScenarioEvent] = Field(default_factory=list)

class Message(BaseModel):
    id: str
    exerciseId: str
    sender: str
    senderRole: str  # "COMMANDER", "TEAM_ALPHA", "INTELLIGENCE", "INSTRUCTOR"
    recipient: str = "ALL"
    content: str
    timestamp: float = Field(default_factory=time.time)
    formattedTime: str = "00:00"
    status: Literal["sent", "delivered", "delayed", "dropped"] = "delivered"
    delayRemaining: float = 0.0

class Decision(BaseModel):
    id: str
    exerciseId: str
    traineeId: str = "COMMANDER_1"
    decision: str
    rationale: str
    confidence: Literal["low", "medium", "high"] = "medium"
    timestamp: float = Field(default_factory=time.time)
    simulationTime: str = "00:00"
    simulationSecond: int = 0
    availableInformation: List[str] = Field(default_factory=list)
    unavailableInformation: List[str] = Field(default_factory=list)

class InformationState(BaseModel):
    timestamp: float = Field(default_factory=time.time)
    simulationSecond: int = 0
    commsStatus: Literal["normal", "delayed", "offline"] = "normal"
    mapStatus: Literal["current", "outdated", "unavailable"] = "current"
    availableInfo: List[str] = Field(default_factory=list)
    unavailableInfo: List[str] = Field(default_factory=list)
    notes: Optional[str] = None

class ExerciseCreate(BaseModel):
    scenarioId: str
    teamName: str = "Task Force Alpha"
    isDemoMode: bool = True
    speedMultiplier: float = 1.0

class InstructorInject(BaseModel):
    action: Literal[
        "delay_radio",
        "drop_radio",
        "restore_radio",
        "conflicting_report",
        "outdate_map",
        "restore_map",
        "new_intelligence",
        "custom_message"
    ]
    payload: Optional[Dict[str, Any]] = None

class ExerciseControl(BaseModel):
    action: Literal["start", "pause", "resume", "end", "reset", "set_speed"]
    speedMultiplier: Optional[float] = None

class TraineeDecisionInput(BaseModel):
    decision: str
    rationale: str
    confidence: Literal["low", "medium", "high"]
    availableInformation: Optional[List[str]] = None
    unavailableInformation: Optional[List[str]] = None

class AARSummary(BaseModel):
    exerciseId: str
    scenarioName: str
    teamName: str
    startedAt: float
    completedAt: float
    durationSeconds: int
    commsTimeline: List[Dict[str, Any]]
    decisions: List[Decision]
    messages: List[Message]
    stats: Dict[str, Any]
    analyticalFindings: List[str]
    recommendations: List[str]
