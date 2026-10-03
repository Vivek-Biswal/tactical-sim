"""Authoritative in-memory room simulation. All writes run on the ASGI event loop."""

import math
import secrets
import time
import uuid
from copy import deepcopy

from app.config import settings
from app.scenario_engine.events import TITLES, get_operation_silent_link
from app.schemas.models import EventPayload, MovementInput, TrainingArea

INJECT_TYPES = {
    "delay_radio": "RADIO_DELAY",
    "drop_radio": "RADIO_DROPOUT",
    "restore_radio": "RADIO_RESTORED",
    "conflicting_report": "CONFLICTING_REPORT",
    "outdate_map": "MAP_OUTDATED",
    "unavailable_map": "MAP_UNAVAILABLE",
    "restore_map": "MAP_RESTORED",
    "new_intelligence": "NEW_INTELLIGENCE",
    "decision_required": "DECISION_REQUIRED",
    "deploy_uav": "UAV_DEPLOYED",
}


def uid():
    return uuid.uuid4().hex


def clock(second):
    return f"{int(second) // 60:02d}:{int(second) % 60:02d}"


class ExerciseSession:
    def __init__(
        self,
        exercise_id,
        scenario=None,
        team_name="Task Force Alpha",
        is_demo=True,
        instructor_key=None,
        training_area=None,
    ):
        self.exercise_id = exercise_id
        self.training_area = TrainingArea.model_validate(
            training_area or {}
        ).model_dump()
        self.scenario = scenario or get_operation_silent_link(is_demo)
        self.team_name, self.is_demo = team_name, is_demo
        self.instructor_key = instructor_key or secrets.token_urlsafe(32)
        self.created_at = time.time()
        self.started_at = self.completed_at = None
        self.last_wall = time.monotonic()
        self.speed_multiplier, self.elapsed_seconds = 1.0, 0.0
        self.total_duration = self.scenario["durationSeconds"]
        self.status, self.comms_status, self.map_status = "pending", "normal", "current"
        self.radio_delay_seconds, self.map_snapshot_second = 0, 0
        self.units = deepcopy(self.scenario["initialUnits"])
        self.activities = [
            {
                "id": "checkpoint",
                "label": "Sector 3 checkpoint",
                "x": 380,
                "y": 280,
                "type": "checkpoint",
                "status": "active",
            }
        ]
        self.reported_units, self.reported_activities = (
            deepcopy(self.units),
            deepcopy(self.activities),
        )
        self.messages, self.decisions, self.event_log, self.reports = [], [], [], []
        self.pending_messages, self.movements = {}, {}
        self.triggered_event_ids = set()
        self.active_decision = None
        self.broadcast_cursor, self.revision = 0, 0

    def require_running(self):
        if self.status != "running":
            raise ValueError("Exercise must be running")

    def require_capacity(self):
        if (
            len(self.event_log) >= 5000
            or len(self.messages) >= 1000
            or len(self.decisions) >= 200
        ):
            raise ValueError("Room record limit reached; end and export this exercise")

    def information(self):
        available = ["Pre-exercise briefing", *[r["content"] for r in self.reports]]
        unavailable = []
        if self.comms_status == "normal":
            available.append("Two-way radio available")
        elif self.comms_status == "delayed":
            available.append(f"Radio delayed by {self.radio_delay_seconds:g}s")
        else:
            unavailable.append("Two-way radio unavailable")
        if self.map_status == "current":
            available.append("Current team telemetry")
        elif self.map_status == "outdated":
            available.append(
                f"Last known map snapshot at {clock(self.map_snapshot_second)}"
            )
            unavailable.append("Current team positions")
        else:
            unavailable.append("Map feed and team positions")
        return available, unavailable

    def log_event(self, kind, description=None, payload=None, source="system"):
        self.revision += 1
        self.event_log.append(
            {
                "id": uid(),
                "type": kind,
                "timestamp": self.elapsed_seconds,
                "second": self.elapsed_seconds,
                "time": clock(self.elapsed_seconds),
                "title": TITLES.get(kind, kind.replace("_", " ").title()),
                "description": description or TITLES.get(kind, kind),
                "category": kind,
                "payload": deepcopy(payload or {}),
                "source": source,
            }
        )

    def sync_map(self):
        if self.map_status == "current":
            self.reported_units, self.reported_activities = (
                deepcopy(self.units),
                deepcopy(self.activities),
            )
            self.map_snapshot_second = self.elapsed_seconds

    def get_state(self, instructor=False):
        available, unavailable = self.information()
        visible_log = [
            e
            for e in self.event_log
            if instructor
            or (
                e["type"] not in ("TEAM_MOVEMENT", "TEAM_ARRIVED", "UAV_DEPLOYED")
                or self.map_status == "current"
            )
        ]
        # Queued/dropped content never enters trainee state, including the event log.
        result = {
            "exerciseId": self.exercise_id,
            "scenarioName": self.scenario["name"],
            "scenarioCode": self.scenario["codeName"],
            "teamName": self.team_name,
            "isDemo": self.is_demo,
            "status": self.status,
            "elapsedSeconds": round(self.elapsed_seconds, 3),
            "elapsedTime": round(self.elapsed_seconds, 3),
            "totalDuration": self.total_duration,
            "formattedTime": clock(self.elapsed_seconds),
            "progressPercent": min(
                100, self.elapsed_seconds / self.total_duration * 100
            ),
            "speedMultiplier": self.speed_multiplier,
            "commsStatus": self.comms_status,
            "radioStatus": self.comms_status.upper(),
            "radioDelaySeconds": self.radio_delay_seconds,
            "radioDelay": self.radio_delay_seconds,
            "messageLossPercentage": 100 if self.comms_status == "offline" else 0,
            "allowIncompleteReports": False,
            "mapStatus": self.map_status,
            "trainingArea": deepcopy(self.training_area),
            "mapSnapshotSecond": self.map_snapshot_second,
            "mapLastUpdated": "Live telemetry"
            if self.map_status == "current"
            else f"Last snapshot {clock(self.map_snapshot_second)} — {int(self.elapsed_seconds - self.map_snapshot_second)}s ago",
            "units": []
            if self.map_status == "unavailable"
            else deepcopy(self.reported_units),
            "activityMarkers": []
            if self.map_status == "unavailable"
            else deepcopy(self.reported_activities),
            "availableInformation": available,
            "unavailableInformation": unavailable,
            "reports": deepcopy(self.reports),
            "messages": deepcopy(
                self.messages
                if instructor
                else [m for m in self.messages if m["status"] == "delivered"]
            ),
            "pendingMessages": [
                {
                    **deepcopy(self.messages[i]),
                    "content": "",
                    "delayRemaining": max(0, due - self.elapsed_seconds),
                }
                for i, due in self.pending_messages.items()
            ],
            "decisions": deepcopy(self.decisions),
            "activeDecisionPoint": deepcopy(self.active_decision),
            "eventLog": deepcopy(visible_log[-100:]),
            "currentEvent": deepcopy(visible_log[-1]) if visible_log else None,
            "revision": self.revision,
        }
        result["teams"] = deepcopy(result["units"])
        if instructor:
            result["trueUnits"] = deepcopy(self.units)
        return result

    def start(self):
        if self.status != "pending":
            raise ValueError("Only a pending exercise can start")
        self.status, self.started_at, self.last_wall = (
            "running",
            time.time(),
            time.monotonic(),
        )
        self.tick(0)

    def pause(self):
        self.require_running()
        self.status = "paused"
        self.log_event("EXERCISE_PAUSED")

    def resume(self):
        if self.status != "paused":
            raise ValueError("Only a paused exercise can resume")
        self.status, self.last_wall = "running", time.monotonic()
        self.log_event("EXERCISE_RESUMED")

    def end(self):
        if self.status == "completed":
            return
        self.status, self.completed_at = "completed", time.time()
        for index in list(self.pending_messages):
            self.drop_message(index, "Exercise ended before delivery")
        self.active_decision = None
        self.log_event("EXERCISE_ENDED")

    def advance_wallclock(self):
        now = time.monotonic()
        delta, self.last_wall = max(0, now - self.last_wall), now
        self.tick(delta)

    def tick(self, delta_seconds=1.0):
        if self.status != "running":
            return
        target = min(
            self.total_duration,
            self.elapsed_seconds + max(0, delta_seconds) * self.speed_multiplier,
        )
        # Segment time at event/delivery boundaries so a large tick preserves causal ordering.
        while self.status == "running":
            due_events = [
                e
                for e in self.scenario["events"]
                if e["id"] not in self.triggered_event_ids
                and e["triggerTime"] <= self.elapsed_seconds + 1e-8
            ]
            for event in due_events:
                self.triggered_event_ids.add(event["id"])
                self.execute_event(event["type"], event["payload"])
            for index, due in list(self.pending_messages.items()):
                if due <= self.elapsed_seconds + 1e-8:
                    if self.comms_status == "offline":
                        self.drop_message(index, "Carrier lost before delivery")
                    else:
                        self.deliver_message(index)
            if self.status != "running" or self.elapsed_seconds >= target - 1e-8:
                break
            boundaries = [target]
            boundaries += [
                e["triggerTime"]
                for e in self.scenario["events"]
                if e["id"] not in self.triggered_event_ids
                and e["triggerTime"] > self.elapsed_seconds
            ]
            boundaries += [
                due
                for due in self.pending_messages.values()
                if due > self.elapsed_seconds
            ]
            boundaries += [
                self.elapsed_seconds
                + math.hypot(order["x"] - unit["x"], order["y"] - unit["y"])
                / order.get("speed", 8)
                for unit in self.units
                if (order := self.movements.get(unit["id"]))
                and math.hypot(order["x"] - unit["x"], order["y"] - unit["y"]) > 1e-8
            ]
            next_second = min(boundaries)
            self.advance_movement(next_second - self.elapsed_seconds)
            self.elapsed_seconds = next_second
            self.sync_map()
        for index, due in self.pending_messages.items():
            self.messages[index]["delayRemaining"] = max(0, due - self.elapsed_seconds)
        self.revision += 1

    def advance_movement(self, delta):
        for unit in self.units:
            order = self.movements.get(unit["id"])
            if not order:
                continue
            dx, dy = order["x"] - unit["x"], order["y"] - unit["y"]
            speed = order.get("speed", 8)
            distance, step = math.hypot(dx, dy), speed * delta
            unit["heading"] = math.degrees(math.atan2(dy, dx)) % 360
            if distance <= step:
                unit.update(x=order["x"], y=order["y"], status="operational")
                unit.pop("destination", None)
                del self.movements[unit["id"]]
                # Arrival time is interpolated inside this segment.
                previous = self.elapsed_seconds
                self.elapsed_seconds += distance / speed
                self.log_event(
                    "TEAM_ARRIVED",
                    payload={"unitId": unit["id"], "x": unit["x"], "y": unit["y"]},
                )
                self.elapsed_seconds = previous
            elif distance:
                unit["x"] += dx / distance * step
                unit["y"] += dy / distance * step

    def move_team(self, command, source="commander"):
        self.require_running()
        self.require_capacity()
        command = MovementInput.model_validate(command)
        if source != "instructor" and self.map_status != "current":
            raise ValueError("A current map is required to order movement")
        unit = next((u for u in self.units if u["id"] == command.unitId), None)
        if not unit or unit["faction"] != "friendly":
            raise ValueError("Friendly team not found")
        order = {"x": command.x, "y": command.y}
        self.movements[unit["id"]] = order
        unit.update(destination=order, status="moving")
        self.log_event("TEAM_MOVEMENT", payload=command.model_dump(), source=source)
        self.sync_map()

    def execute_event(self, kind, payload=None, source="scenario"):
        payload = payload or {}
        if kind == "TEAM_MOVEMENT":
            self.move_team(payload, "instructor")
            return
        values = EventPayload.model_validate(payload)
        if kind == "EXERCISE_ENDED":
            self.end()
            return
        if kind == "EXERCISE_STARTED":
            self.movements = {
                "unit-alpha": {"x": 650, "y": 240, "speed": 2},
                "unit-bravo": {"x": 550, "y": 350, "speed": 2},
            }
            for unit in self.units:
                unit.update(
                    destination={
                        k: v
                        for k, v in self.movements[unit["id"]].items()
                        if k != "speed"
                    },
                    status="moving",
                )
        elif kind == "UAV_DEPLOYED":
            if any(u["id"] == "unit-uav" for u in self.units):
                raise ValueError("The simulated UAV is already deployed")
            self.units.append(
                {
                    "id": "unit-uav",
                    "name": "Training UAV",
                    "callsign": "UAV-1",
                    "role": "Simulated aerial observer",
                    "type": "UAV",
                    "faction": "friendly",
                    "x": 400,
                    "y": 300,
                    "altitudeMeters": 150,
                    "status": "operational",
                    "communicationStatus": "NORMAL",
                }
            )
            # The existing movement loop, clock and stale-feed policy handle this unit.
            if self.status == "running":
                self.move_team({"unitId": "unit-uav", "x": 600, "y": 120}, "instructor")
        elif kind == "RADIO_DELAY":
            self.comms_status, self.radio_delay_seconds = "delayed", values.delay
        elif kind == "RADIO_DROPOUT":
            self.comms_status, self.radio_delay_seconds = "offline", 0
            for index in list(self.pending_messages):
                self.drop_message(index, "Radio dropout flushed queued transmission")
        elif kind == "RADIO_RESTORED":
            self.comms_status, self.radio_delay_seconds = "normal", 0
        elif kind in ("MAP_OUTDATED", "MAP_UNAVAILABLE", "MAP_RESTORED"):
            self.map_status = {
                "MAP_OUTDATED": "outdated",
                "MAP_UNAVAILABLE": "unavailable",
                "MAP_RESTORED": "current",
            }[kind]
        elif kind == "CONFLICTING_REPORT":
            group = uid()
            for sender, role, content, x, y in [
                ("Alpha scout", "TEAM_ALPHA", values.reportA, 260, 210),
                ("Intelligence relay", "INTELLIGENCE", values.reportB, 710, 320),
            ]:
                self.receive_report(sender, role, content, group)
                self.activities.append(
                    {
                        "id": uid(),
                        "label": "Western ridge — Alpha scout"
                        if x == 260
                        else "Eastern sector — intelligence",
                        "x": x,
                        "y": y,
                        "type": "contact_warning",
                        "status": "unverified",
                    }
                )
        elif kind == "NEW_INTELLIGENCE":
            # Separate intelligence relay: radio blackout does not magically restore the radio.
            self.receive_report("Intelligence relay", "INTELLIGENCE", values.content)
            self.activities.append(
                {
                    "id": uid(),
                    "label": "Sector 4 activity — medium reliability",
                    "x": 560,
                    "y": 180,
                    "type": "contact_warning",
                    "status": "unverified",
                }
            )
        elif kind == "DECISION_REQUIRED":
            self.active_decision = {
                "id": uid(),
                "timestamp": self.elapsed_seconds,
                "simulationSecond": self.elapsed_seconds,
                "title": "Coordination under uncertainty",
                "situation": "Radio is degraded and reports disagree. Explain how you will coordinate your teams and verify the information.",
                "availableActions": [
                    {
                        "id": "hold",
                        "label": "Hold and verify",
                        "description": "Pause movement and seek independent confirmation.",
                    },
                    {
                        "id": "runner",
                        "label": "Use an alternate communication channel",
                        "description": "Arrange a runner or pre-agreed rendezvous.",
                    },
                    {
                        "id": "plan",
                        "label": "Follow the last agreed plan",
                        "description": "Continue with explicit assumptions and a review point.",
                    },
                ],
                "status": "active",
            }
        for unit in self.units:
            unit["communicationStatus"] = {
                "normal": "NORMAL",
                "delayed": "DELAYED",
                "offline": "LOST",
            }[self.comms_status]
        self.sync_map()
        # Avoid copying new report content or hidden coordinates into a generic event.
        self.log_event(
            kind,
            payload={
                "radioStatus": self.comms_status.upper(),
                "radioDelay": self.radio_delay_seconds,
                "mapStatus": self.map_status,
                **(
                    {
                        "unit": deepcopy(
                            next(u for u in self.units if u["id"] == "unit-uav")
                        )
                    }
                    if kind == "UAV_DEPLOYED"
                    else {}
                ),
            },
            source=source,
        )

    def apply_instructor_inject(self, action, payload=None):
        if self.status not in ("running", "paused"):
            raise ValueError("Start the exercise before injecting events")
        self.require_capacity()
        if action == "custom_message":
            values = EventPayload.model_validate(payload or {})
            self.receive_report(values.sender, "INSTRUCTOR", values.content)
        else:
            self.execute_event(INJECT_TYPES[action], payload, "instructor")

    def receive_report(self, sender, role, content, conflict=None):
        message = self.make_message(sender, role, content)
        message.update(
            isConflicting=bool(conflict),
            conflictGroupId=conflict,
            messageType="CONFLICTING_REPORT" if conflict else "INTEL_REPORT",
            channel="INTELLIGENCE_RELAY",
        )
        self.messages.append(message)
        self.deliver_message(len(self.messages) - 1)

    def make_message(self, sender, role, content):
        return {
            "id": uid(),
            "exerciseId": self.exercise_id,
            "sender": sender,
            "senderRole": role,
            "recipient": "ALL",
            "content": content,
            "timestamp": time.time(),
            "timestampGenerated": self.elapsed_seconds,
            "formattedTime": clock(self.elapsed_seconds),
            "status": "sent",
            "deliveryStatus": "PENDING",
            "communicationState": self.comms_status,
            "delayRemaining": 0,
        }

    def send_radio_message(self, sender, role, content):
        self.require_running()
        self.require_capacity()
        message = self.make_message(sender, role, content)
        self.messages.append(message)
        index = len(self.messages) - 1
        if self.comms_status == "offline":
            self.drop_message(index, "Radio net offline")
        elif self.comms_status == "delayed" and self.radio_delay_seconds:
            message.update(
                status="delayed",
                deliveryStatus="DELAYED",
                wasDelayed=True,
                delayRemaining=self.radio_delay_seconds,
            )
            self.pending_messages[index] = (
                self.elapsed_seconds + self.radio_delay_seconds
            )
            self.log_event(
                "MESSAGE_QUEUED",
                payload={
                    "messageId": message["id"],
                    "sender": sender,
                    "delay": self.radio_delay_seconds,
                },
            )
        else:
            self.deliver_message(index)
        return deepcopy(message)

    def deliver_message(self, index):
        message = self.messages[index]
        self.pending_messages.pop(index, None)
        message.update(
            status="delivered",
            deliveryStatus="DELIVERED",
            timestampDelivered=self.elapsed_seconds,
            formattedTimeDelivered=clock(self.elapsed_seconds),
            delayRemaining=0,
        )
        self.reports.append(
            {
                "id": message["id"],
                "source": message["sender"],
                "content": message["content"],
                "timestamp": self.elapsed_seconds,
                "reliability": "unverified"
                if message.get("isConflicting")
                else "medium",
                "conflictGroupId": message.get("conflictGroupId"),
            }
        )
        self.log_event(
            "MESSAGE_DELIVERED",
            payload={"messageId": message["id"], "sender": message["sender"]},
        )

    def drop_message(self, index, reason):
        self.pending_messages.pop(index, None)
        message = self.messages[index]
        message.update(
            status="dropped",
            deliveryStatus="DROPPED",
            delayRemaining=0,
            dropReason=reason,
        )
        self.log_event(
            "MESSAGE_DROPPED",
            reason,
            {"messageId": message["id"], "sender": message["sender"]},
        )

    def record_decision(
        self,
        decision_text,
        rationale,
        confidence,
        trainee_id="Commander",
        selected_action_id="",
    ):
        self.require_running()
        self.require_capacity()
        available, unavailable = self.information()
        point = self.active_decision
        if selected_action_id and (
            not point
            or selected_action_id not in [a["id"] for a in point["availableActions"]]
        ):
            raise ValueError("Decision action is not active")
        decision = {
            "id": uid(),
            "exerciseId": self.exercise_id,
            "traineeId": trainee_id,
            "decision": decision_text,
            "selectedActionLabel": decision_text,
            "decisionPointId": point["id"] if point else "",
            "selectedActionId": selected_action_id,
            "rationale": rationale,
            "confidence": confidence,
            "scenarioTimestamp": self.elapsed_seconds,
            "simulationSecond": self.elapsed_seconds,
            "simulationTime": clock(self.elapsed_seconds),
            "realTimestamp": time.time(),
            "communicationState": self.comms_status,
            "mapStatus": self.map_status,
            "availableInformation": available,
            "unavailableInformation": unavailable,
            "informationSnapshot": {
                "reportIds": [r["id"] for r in self.reports],
                "units": []
                if self.map_status == "unavailable"
                else deepcopy(self.reported_units),
                "mapSnapshotSecond": self.map_snapshot_second,
                "trainingArea": deepcopy(self.training_area),
            },
        }
        self.decisions.append(decision)
        self.active_decision = None
        self.log_event(
            "DECISION_SUBMITTED",
            payload={"decisionId": decision["id"], "traineeId": trainee_id},
        )
        return deepcopy(decision)

    def generate_aar(self):
        delivered = sum(m["status"] == "delivered" for m in self.messages)
        dropped = sum(m["status"] == "dropped" for m in self.messages)
        delayed = sum(bool(m.get("wasDelayed")) for m in self.messages)
        return {
            "exerciseId": self.exercise_id,
            "scenarioName": self.scenario["name"],
            "teamName": self.team_name,
            "startedAt": self.started_at,
            "completedAt": self.completed_at,
            "durationSeconds": self.elapsed_seconds,
            "isFinal": self.status == "completed",
            "trainingArea": deepcopy(self.training_area),
            "commsTimeline": deepcopy(self.event_log),
            "fullEventLog": deepcopy(self.event_log),
            "decisions": deepcopy(self.decisions),
            "messages": deepcopy(self.messages),
            "pendingMessages": [
                deepcopy(self.messages[i]) for i in self.pending_messages
            ],
            "initialUnits": deepcopy(self.scenario["initialUnits"]),
            "stats": {
                "duration": clock(self.elapsed_seconds),
                "messagesTotal": len(self.messages),
                "messagesDelivered": delivered,
                "messagesDelayed": delayed,
                "messagesDropped": dropped,
                "messagesPending": len(self.pending_messages),
                "decisionsCount": len(self.decisions),
                "finalCommsStatus": self.comms_status,
                "finalMapStatus": self.map_status,
            },
            "analyticalFindings": [
                f"{len(self.decisions)} decisions recorded with information snapshots.",
                f"{delivered} delivered, {dropped} dropped, {len(self.pending_messages)} pending transmissions.",
            ],
            "recommendations": [
                "Compare each rationale with information received at that time.",
                "Review assumptions and alternate coordination channels. No tactical correctness score is assigned.",
            ],
        }


class EngineManager:
    def __init__(self):
        self.exercises = {}

    def create_exercise(
        self,
        exercise_id=None,
        is_demo=True,
        team_name="Task Force Alpha",
        training_area=None,
    ):
        if len(self.exercises) >= settings.MAX_EXERCISES:
            raise ValueError(
                "Room capacity reached; completed rooms expire after 24 hours"
            )
        exercise_id = exercise_id or "ex-" + uuid.uuid4().hex[:12]
        if exercise_id in self.exercises:
            raise ValueError("Exercise already exists")
        session = ExerciseSession(
            exercise_id,
            team_name=team_name,
            is_demo=is_demo,
            training_area=training_area,
        )
        self.exercises[exercise_id] = session
        return session

    def get_exercise(self, exercise_id):
        return self.exercises.get(exercise_id)

    def list_exercises(self):
        return [
            {
                "exerciseId": s.exercise_id,
                "scenarioName": s.scenario["name"],
                "teamName": s.team_name,
                "status": s.status,
                "elapsedSeconds": s.elapsed_seconds,
            }
            for s in self.exercises.values()
        ]


engine_manager = EngineManager()
