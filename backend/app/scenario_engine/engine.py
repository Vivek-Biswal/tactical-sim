import asyncio
import time
import uuid
from typing import Dict, List, Optional, Any
from app.schemas.models import (
    Scenario, ScenarioEvent, Message, Decision, InformationState, AARSummary
)
from app.scenario_engine.events import get_operation_silent_link

class ExerciseSession:
    def __init__(self, exercise_id: str, scenario: Scenario, team_name: str = "Task Force Alpha", is_demo: bool = True):
        self.exercise_id = exercise_id
        self.scenario = scenario
        self.team_name = team_name
        self.is_demo = is_demo
        self.speed_multiplier = 1.0
        
        self.status = "pending"  # "pending", "running", "paused", "completed"
        self.start_timestamp = time.time()
        self.elapsed_seconds = 0
        self.total_duration = scenario.durationSeconds
        
        # Operational Degradation States
        self.comms_status: str = "normal"  # "normal", "delayed", "offline"
        self.radio_delay_seconds: int = 0
        self.map_status: str = "current"    # "current", "outdated", "unavailable"
        self.map_last_updated_str: str = "Live Telemetry Active"
        self.map_stale_seconds: int = 0
        
        # Tactical Map State
        self.units = [dict(u) for u in scenario.initialUnits]
        self.reported_units = [dict(u) for u in scenario.initialUnits]  # Stale COP snapshot
        self.activity_markers: List[Dict[str, Any]] = [
            {
                "id": "act-1",
                "label": "Sector 3 Checkpoint",
                "x": 380,
                "y": 280,
                "type": "checkpoint",
                "status": "active"
            }
        ]
        
        # Information State snapshot
        self.available_information: List[str] = [
            "Satellite GPS Track (Normal)",
            "Direct VHF Radio Uplink (Clear)",
            "Pre-mission Area Reconnaissance"
        ]
        self.unavailable_information: List[str] = []
        
        # Logs and History
        self.messages: List[Message] = []
        self.delayed_message_queue: List[Dict[str, Any]] = []
        self.decisions: List[Decision] = []
        self.triggered_event_ids: set[str] = set()
        self.event_log: List[Dict[str, Any]] = []
        self.latest_decision_required: Optional[Dict[str, Any]] = None
        
        # Telemetry / AAR stats
        self.messages_sent_count = 0
        self.messages_delivered_count = 0
        self.messages_delayed_count = 0
        self.messages_dropped_count = 0

    def get_formatted_time(self) -> str:
        mins = int(self.elapsed_seconds // 60)
        secs = int(self.elapsed_seconds % 60)
        return f"{mins:02d}:{secs:02d}"

    def get_state(self) -> Dict[str, Any]:
        return {
            "exerciseId": self.exercise_id,
            "scenarioName": self.scenario.name,
            "scenarioCode": self.scenario.codeName,
            "teamName": self.team_name,
            "isDemo": self.is_demo,
            "status": self.status,
            "elapsedSeconds": self.elapsed_seconds,
            "totalDuration": self.total_duration,
            "formattedTime": self.get_formatted_time(),
            "progressPercent": min(100.0, round((self.elapsed_seconds / max(1, self.total_duration)) * 100, 1)),
            "speedMultiplier": self.speed_multiplier,
            "commsStatus": self.comms_status,
            "radioDelaySeconds": self.radio_delay_seconds,
            "mapStatus": self.map_status,
            "mapLastUpdated": self.map_last_updated_str,
            "units": self.reported_units if self.map_status == "outdated" else self.units,
            "trueUnits": self.units,
            "activityMarkers": self.activity_markers,
            "availableInformation": self.available_information,
            "unavailableInformation": self.unavailable_information,
            "messages": [m.model_dump() for m in self.messages[-25:]],
            "decisions": [d.model_dump() for d in self.decisions],
            "decisionRequired": self.latest_decision_required,
            "eventLog": self.event_log[-15:]
        }

    def start(self):
        if self.status in ["pending", "paused"]:
            self.status = "running"
            self.log_event("Exercise Started", f"Simulation commenced with {self.team_name}", "system")

    def pause(self):
        if self.status == "running":
            self.status = "paused"
            self.log_event("Exercise Paused", "Simulation clock suspended by instructor", "system")

    def resume(self):
        if self.status == "paused":
            self.status = "running"
            self.log_event("Exercise Resumed", "Simulation clock resumed", "system")

    def end(self):
        self.status = "completed"
        self.log_event("Exercise Completed", "Simulation reached end of training timeline", "system")

    def log_event(self, title: str, description: str, category: str = "general", payload: Optional[Dict[str, Any]] = None):
        entry = {
            "id": str(uuid.uuid4())[:8],
            "time": self.get_formatted_time(),
            "second": self.elapsed_seconds,
            "title": title,
            "description": description,
            "category": category,
            "payload": payload or {}
        }
        self.event_log.append(entry)

    def tick(self, delta_seconds: float = 1.0):
        if self.status != "running":
            return
        
        effective_delta = delta_seconds * self.speed_multiplier
        self.elapsed_seconds += effective_delta
        
        # Advance true unit positions gently along tactical route
        for u in self.units:
            if u["id"] == "unit-alpha":
                # Patrol moving generally toward NE (580, 210)
                if u["x"] < 520:
                    u["x"] += 0.8 * effective_delta
                if u["y"] > 240:
                    u["y"] -= 0.3 * effective_delta
            elif u["id"] == "unit-bravo":
                if u["x"] < 450:
                    u["x"] += 0.5 * effective_delta
                if u["y"] > 350:
                    u["y"] -= 0.35 * effective_delta
        
        # If map is current, mirror true units to reported units
        if self.map_status == "current":
            self.reported_units = [dict(u) for u in self.units]
            self.map_last_updated_str = "Live Telemetry Active"
        else:
            self.map_stale_seconds += int(effective_delta)
            mins = self.map_stale_seconds // 60
            secs = self.map_stale_seconds % 60
            self.map_last_updated_str = f"Last updated: {mins}m {secs}s ago (STALE)"

        # Process delayed message queue
        remaining_queue = []
        for item in self.delayed_message_queue:
            item["deliver_in"] -= effective_delta
            if item["deliver_in"] <= 0:
                msg = item["message"]
                msg.status = "delivered"
                self.messages.append(msg)
                self.messages_delivered_count += 1
                self.log_event("Delayed Message Delivered", f"From {msg.sender}: '{msg.content[:40]}...'", "comm")
            else:
                remaining_queue.append(item)
        self.delayed_message_queue = remaining_queue

        # Check scenario scheduled events
        for evt in self.scenario.events:
            if evt.id not in self.triggered_event_ids and self.elapsed_seconds >= evt.triggerTime:
                self.triggered_event_ids.add(evt.id)
                self.execute_scenario_event(evt)

        # Check completion
        if self.elapsed_seconds >= self.total_duration and self.status == "running":
            self.end()

    def execute_scenario_event(self, evt: ScenarioEvent):
        payload = evt.payload
        self.log_event(evt.title, evt.description, evt.type, payload)
        
        if "availableInfo" in payload:
            self.available_information = payload["availableInfo"]
        if "unavailableInfo" in payload:
            self.unavailable_information = payload["unavailableInfo"]

        if evt.type == "comms_degradation":
            if "commsStatus" in payload:
                self.comms_status = payload["commsStatus"]
                self.radio_delay_seconds = payload.get("radioDelaySeconds", 0)
            if "broadcastMessage" in payload:
                bm = payload["broadcastMessage"]
                self.inject_incoming_message(bm["sender"], bm["senderRole"], bm["content"])

        elif evt.type == "conflicting_report":
            if "reports" in payload:
                for rep in payload["reports"]:
                    self.inject_incoming_message(rep["source"], rep["senderRole"], rep["content"])
            # Add conflicting activity ping to map
            self.activity_markers.append({
                "id": "act-conflict-west",
                "label": "Alpha Scout Contact: Western Ridge",
                "x": 260,
                "y": 210,
                "type": "contact_warning",
                "status": "unverified"
            })
            self.activity_markers.append({
                "id": "act-conflict-east",
                "label": "SIGINT Triangulation: Eastern Canyon",
                "x": 710,
                "y": 320,
                "type": "contact_warning",
                "status": "unverified"
            })

        elif evt.type == "map_status":
            if "mapStatus" in payload:
                self.map_status = payload["mapStatus"]
                self.map_stale_seconds = payload.get("staleSinceSeconds", 60)

        elif evt.type == "intel_update":
            sender = payload.get("sender", "INTELLIGENCE")
            role = payload.get("senderRole", "INTELLIGENCE")
            content = payload.get("content", "New intelligence update received.")
            self.inject_incoming_message(sender, role, content)
            # Add hostile jammer location to map
            self.activity_markers.append({
                "id": "act-jammer",
                "label": "SIGINT Intercept: Mobile Jammer (EW)",
                "x": 560,
                "y": 180,
                "type": "hostile_jammer",
                "status": "high_threat"
            })

        elif evt.type == "decision_point":
            self.latest_decision_required = {
                "eventId": evt.id,
                "prompt": payload.get("prompt", "Commander Decision Required"),
                "options": payload.get("options", []),
                "timestamp": self.get_formatted_time(),
                "simulationSecond": self.elapsed_seconds
            }

    def inject_incoming_message(self, sender: str, role: str, content: str):
        self.messages_sent_count += 1
        msg = Message(
            id=str(uuid.uuid4())[:8],
            exerciseId=self.exercise_id,
            sender=sender,
            senderRole=role,
            recipient="ALL",
            content=content,
            timestamp=time.time(),
            formattedTime=self.get_formatted_time(),
            status="delivered",
            delayRemaining=0.0
        )
        self.messages.append(msg)
        self.messages_delivered_count += 1

    def send_radio_message(self, sender: str, role: str, content: str) -> Message:
        self.messages_sent_count += 1
        msg_id = str(uuid.uuid4())[:8]
        
        # Check radio status
        if self.comms_status == "offline":
            self.messages_dropped_count += 1
            msg = Message(
                id=msg_id,
                exerciseId=self.exercise_id,
                sender=sender,
                senderRole=role,
                content=f"[CARRIER LOST] {content}",
                timestamp=time.time(),
                formattedTime=self.get_formatted_time(),
                status="dropped"
            )
            self.messages.append(msg)
            self.log_event("Message Dropped (Radio Offline)", f"Attempted from {sender}: '{content[:30]}...'", "comm")
            return msg
        
        elif self.comms_status == "delayed":
            self.messages_delayed_count += 1
            delay = self.radio_delay_seconds or 8
            msg = Message(
                id=msg_id,
                exerciseId=self.exercise_id,
                sender=sender,
                senderRole=role,
                content=content,
                timestamp=time.time(),
                formattedTime=self.get_formatted_time(),
                status="delayed",
                delayRemaining=float(delay)
            )
            self.delayed_message_queue.append({
                "message": msg,
                "deliver_in": float(delay)
            })
            self.log_event("Message Queued (Radio Delayed)", f"From {sender}: delay {delay}s", "comm")
            return msg
        
        else: # Normal
            self.messages_delivered_count += 1
            msg = Message(
                id=msg_id,
                exerciseId=self.exercise_id,
                sender=sender,
                senderRole=role,
                content=content,
                timestamp=time.time(),
                formattedTime=self.get_formatted_time(),
                status="delivered"
            )
            self.messages.append(msg)
            return msg

    def record_decision(self, decision_text: str, rationale: str, confidence: str, trainee_id: str = "COMMANDER_1") -> Decision:
        dec = Decision(
            id=str(uuid.uuid4())[:8],
            exerciseId=self.exercise_id,
            traineeId=trainee_id,
            decision=decision_text,
            rationale=rationale,
            confidence=confidence,  # type: ignore
            timestamp=time.time(),
            simulationTime=self.get_formatted_time(),
            simulationSecond=int(self.elapsed_seconds),
            availableInformation=list(self.available_information),
            unavailableInformation=list(self.unavailable_information)
        )
        self.decisions.append(dec)
        self.latest_decision_required = None
        self.log_event(
            "Trainee Decision Logged",
            f"Action: {decision_text} | Confidence: {confidence.upper()}",
            "decision",
            payload={"decision": decision_text, "rationale": rationale, "confidence": confidence}
        )
        return dec

    def apply_instructor_inject(self, action: str, payload: Optional[Dict[str, Any]] = None):
        payload = payload or {}
        if action == "delay_radio":
            self.comms_status = "delayed"
            self.radio_delay_seconds = payload.get("delay", 10)
            self.log_event("Instructor Inject: Delay Radio", f"Forced radio latency to {self.radio_delay_seconds}s", "instructor")
            
        elif action == "drop_radio":
            self.comms_status = "offline"
            self.radio_delay_seconds = 9999
            self.log_event("Instructor Inject: Drop Radio", "Tactical net forced offline by instructor", "instructor")
            
        elif action == "restore_radio":
            self.comms_status = "normal"
            self.radio_delay_seconds = 0
            self.log_event("Instructor Inject: Restore Radio", "Communications returned to normal", "instructor")
            
        elif action == "conflicting_report":
            report_a = payload.get("reportA", "Alpha Team: Threat detected in Sector 2")
            report_b = payload.get("reportB", "SIGINT Relay: Sector 2 confirmed clear; threat in Sector 5")
            self.inject_incoming_message("Team Alpha Lead", "TEAM_ALPHA", report_a)
            self.inject_incoming_message("Signals Intelligence", "INTELLIGENCE", report_b)
            self.log_event("Instructor Inject: Conflicting Reports", "Dispatched contradictory SITREPs", "instructor")
            
        elif action == "outdate_map":
            self.map_status = "outdated"
            self.map_stale_seconds = 180
            self.map_last_updated_str = "Last updated: 3 minutes ago (STALE)"
            self.log_event("Instructor Inject: Outdate Map", "Tactical map telemetry frozen", "instructor")
            
        elif action == "restore_map":
            self.map_status = "current"
            self.map_stale_seconds = 0
            self.map_last_updated_str = "Live Telemetry Active"
            self.log_event("Instructor Inject: Restore Map", "COP GPS feed re-synchronized", "instructor")
            
        elif action == "new_intelligence":
            content = payload.get("content", "FLASH INTERCEPT: Hostile electronic jammer vehicle active at Choke Point Bravo.")
            self.inject_incoming_message("Strategic Intercept", "INTELLIGENCE", content)
            self.log_event("Instructor Inject: New Intel", content, "instructor")
            
        elif action == "custom_message":
            sender = payload.get("sender", "INSTRUCTOR_HQ")
            role = payload.get("role", "INSTRUCTOR")
            content = payload.get("content", "Instructional directive issued.")
            self.inject_incoming_message(sender, role, content)

    def generate_aar(self) -> AARSummary:
        timeline_events = []
        for evt in self.event_log:
            timeline_events.append({
                "time": evt["time"],
                "second": evt["second"],
                "title": evt["title"],
                "description": evt["description"],
                "category": evt["category"]
            })
            
        # Findings calculation
        findings = []
        if self.messages_delayed_count > 0:
            findings.append(f"Trainee operated through {self.messages_delayed_count} delayed transmission cycles.")
        if self.messages_dropped_count > 0:
            findings.append(f"Trainee experienced complete blackout with {self.messages_dropped_count} dropped outbound messages.")
        if len(self.decisions) > 0:
            findings.append(f"Total commander decisions logged: {len(self.decisions)} with average confidence recorded.")
        else:
            findings.append("No explicit commander decision was registered before exercise conclusion.")
            
        recommendations = [
            "Establish secondary couriers or predetermined rally azimuths prior to entering contested RF sectors.",
            "Verify contradictory tactical scout reports through cross-bearing acoustic or secondary observation posts.",
            "When Common Operating Picture telemetry freezes, transition immediately to terrain-association dead reckoning."
        ]
        
        stats = {
            "duration": self.get_formatted_time(),
            "messagesTotal": self.messages_sent_count,
            "messagesDelivered": self.messages_delivered_count,
            "messagesDelayed": self.messages_delayed_count,
            "messagesDropped": self.messages_dropped_count,
            "decisionsCount": len(self.decisions),
            "finalCommsStatus": self.comms_status,
            "finalMapStatus": self.map_status
        }
        
        return AARSummary(
            exerciseId=self.exercise_id,
            scenarioName=self.scenario.name,
            teamName=self.team_name,
            startedAt=self.start_timestamp,
            completedAt=time.time(),
            durationSeconds=int(self.elapsed_seconds),
            commsTimeline=timeline_events,
            decisions=self.decisions,
            messages=self.messages,
            stats=stats,
            analyticalFindings=findings,
            recommendations=recommendations
        )


class ScenarioEngineManager:
    _instance = None
    
    def __init__(self):
        self.exercises: Dict[str, ExerciseSession] = {}
        self._background_task = None
        # Create standard default demo exercise
        self.create_exercise("exercise-demo-1", is_demo=True)
        
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def create_exercise(self, exercise_id: Optional[str] = None, is_demo: bool = True, team_name: str = "Task Force Alpha") -> ExerciseSession:
        if not exercise_id:
            exercise_id = f"ex-{str(uuid.uuid4())[:6]}"
        scenario = get_operation_silent_link(is_demo=is_demo)
        session = ExerciseSession(exercise_id, scenario, team_name=team_name, is_demo=is_demo)
        self.exercises[exercise_id] = session
        return session

    def get_exercise(self, exercise_id: str) -> Optional[ExerciseSession]:
        return self.exercises.get(exercise_id)

    def list_exercises(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": ex.exercise_id,
                "scenarioName": ex.scenario.name,
                "teamName": ex.team_name,
                "status": ex.status,
                "elapsedSeconds": ex.elapsed_seconds,
                "totalDuration": ex.total_duration,
                "commsStatus": ex.comms_status,
                "mapStatus": ex.map_status,
                "decisionsCount": len(ex.decisions)
            }
            for ex in self.exercises.values()
        ]

    def tick_all(self, delta_seconds: float = 1.0):
        for session in list(self.exercises.values()):
            if session.status == "running":
                session.tick(delta_seconds)

engine_manager = ScenarioEngineManager.get_instance()
