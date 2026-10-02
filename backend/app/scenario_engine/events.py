from typing import List
from app.schemas.models import Scenario, ScenarioEvent

def get_operation_silent_link(is_demo: bool = True) -> Scenario:
    # Scale times based on demo mode (120 seconds) vs full exercise (600 seconds)
    total_duration = 120 if is_demo else 600

    def t(percentage: float) -> int:
        return int((percentage / 100.0) * total_duration)

    events: List[ScenarioEvent] = [
        ScenarioEvent(
            id="evt-1-normal",
            type="comms_degradation",
            triggerTime=0,
            title="Initial Phase — Normal Communications",
            description="Exercise commences. Satellite link and VHF Tactical Radio net operational. All friendly tracks reporting current GPS telemetry.",
            payload={
                "commsStatus": "normal",
                "mapStatus": "current",
                "radioDelaySeconds": 0,
                "broadcastMessage": {
                    "sender": "COMMAND_HQ",
                    "senderRole": "INSTRUCTOR",
                    "content": "All stations, this is HQ. Operation Silent Link is green. Proceed towards Waypoint Charlie. Maintain standard SITREP intervals."
                },
                "availableInfo": [
                    "Full GPS Satellite Telemetry",
                    "Direct VHF Radio Uplink",
                    "Standard Operational Map (Grid 7)",
                    "Real-time friendly unit positions"
                ],
                "unavailableInfo": []
            }
        ),
        ScenarioEvent(
            id="evt-2-delay",
            type="comms_degradation",
            triggerTime=t(20),  # 24s in demo
            title="Radio Delay Detected",
            description="Atmospheric interference or early-stage electronic counter-measures detected. Transmission packets experiencing 8-12 second propagation latency.",
            payload={
                "commsStatus": "delayed",
                "radioDelaySeconds": 8,
                "broadcastMessage": {
                    "sender": "TEAM_ALPHA",
                    "senderRole": "TEAM_ALPHA",
                    "content": "[DELAYED] Alpha lead to Commander: Approaching Ridge junction. Terrain is narrowing. Radio ping latency rising."
                },
                "availableInfo": [
                    "High-latency tactical radio",
                    "Operational Map (Latency 10s)",
                    "Last known friendly positions"
                ],
                "unavailableInfo": [
                    "Instantaneous tactical acknowledgements",
                    "Live audio clarity"
                ]
            }
        ),
        ScenarioEvent(
            id="evt-3-conflicting",
            type="conflicting_report",
            triggerTime=t(40),  # 48s in demo
            title="Conflicting Situational Reports",
            description="Contradictory intelligence received simultaneously from tactical ground scouts and remote electronic surveillance.",
            payload={
                "reports": [
                    {
                        "source": "Team Alpha Scout",
                        "senderRole": "TEAM_ALPHA",
                        "content": "URGENT: Hostile patrol visual sighted advancing on WESTERN defile pass. Recommend holding position."
                    },
                    {
                        "source": "Divisional SIGINT",
                        "senderRole": "INTELLIGENCE",
                        "content": "ADVISORY: RF sensor triangulation places unidentified motorized convoy on EASTERN canyon flank. Western sector clear."
                    }
                ],
                "availableInfo": [
                    "Team Alpha ground scout report (Western side hostile)",
                    "Divisional SIGINT feed (Eastern flank motorized activity)",
                    "Delayed radio link (8s)"
                ],
                "unavailableInfo": [
                    "Overhead thermal confirmation (cloud/jammer mask)",
                    "Visual reconnaissance of Eastern defile"
                ]
            }
        ),
        ScenarioEvent(
            id="evt-4-outdated-map",
            type="map_status",
            triggerTime=t(55),  # 66s in demo
            title="Tactical Map Stale / GPS Feed Lost",
            description="Tactical COP (Common Operating Picture) link frozen. Displaying last valid telemetry from 3 minutes ago.",
            payload={
                "mapStatus": "outdated",
                "staleSinceSeconds": 180,
                "staleMessage": "COP synchronization timeout. Satellite uplink denied. Displaying stale telemetry snapshot.",
                "availableInfo": [
                    "Outdated map telemetry (3m stale)",
                    "Previous conflicting contact reports"
                ],
                "unavailableInfo": [
                    "Live friendly track coordinates",
                    "Real-time sensor overlays",
                    "Instantaneous route validation"
                ]
            }
        ),
        ScenarioEvent(
            id="evt-5-dropout",
            type="comms_degradation",
            triggerTime=t(70),  # 84s in demo
            title="Total Radio Blackout",
            description="Broadband RF jamming in effect. Tactical radio carrier dropped. All outgoing transmissions unacknowledged.",
            payload={
                "commsStatus": "offline",
                "radioDelaySeconds": 9999,
                "systemAlert": "TACTICAL NET OFFLINE — CARRIER FREQUENCY JAMMED — PACKETS DROPPED",
                "availableInfo": [
                    "Pre-jamming mission briefing",
                    "Stale map overlay (Sector 7)",
                    "Initial waypoint routes"
                ],
                "unavailableInfo": [
                    "Radio communications (ALL CHANNELS OFFLINE)",
                    "Live COP updates",
                    "Ground scout status"
                ]
            }
        ),
        ScenarioEvent(
            id="evt-6-intel",
            type="intel_update",
            triggerTime=t(82),  # 98s in demo
            title="High-Priority Electronic Intercept",
            description="Courier burst transmission or hardened acoustic beacon intercept arrives via auxiliary emergency relay.",
            payload={
                "sender": "HIGH_COMMAND_RELAY",
                "senderRole": "INTELLIGENCE",
                "content": "FLASH OVERRIDE: Low-band acoustic sensors confirm hostile mobile electronic warfare vehicle stationed at choke point Bravo (Northern Highway). Jamming radius estimated 2.5km.",
                "availableInfo": [
                    "Acoustic EW intercept report",
                    "Hostile jammer located at Choke Point Bravo",
                    "Pre-jamming scout reports"
                ],
                "unavailableInfo": [
                    "Radio contact with Team Alpha or Bravo",
                    "Live confirmation of jammer escort strength",
                    "Updated friendly unit positions"
                ]
            }
        ),
        ScenarioEvent(
            id="evt-7-decision",
            type="decision_point",
            triggerTime=t(90),  # 108s in demo
            title="Tactical Decision Point Required",
            description="Commander must commit to operational action under conditions of degraded comms, contradictory intel, and stale telemetry.",
            payload={
                "prompt": "With communications severed, conflicting enemy sightings, and mobile jammer pinpointed at Choke Point Bravo, specify your immediate order:",
                "options": [
                    {
                        "id": "opt-1",
                        "label": "Continue Current Route through Northern Defile",
                        "description": "Maintain original schedule and assault toward waypoint despite reported jammer."
                    },
                    {
                        "id": "opt-2",
                        "label": "Divert Route via Western Ridge Pass",
                        "description": "Bypass suspected jammer vehicle, accept rough terrain delay and risk of Western patrol."
                    },
                    {
                        "id": "opt-3",
                        "label": "Halt and Establish Defensive Perimeter",
                        "description": "Wait for communication recovery or courier contact before risking further advancement."
                    },
                    {
                        "id": "opt-4",
                        "label": "Dispatch Runner / Recon Scout toward Eastern Canyon",
                        "description": "Seek direct visual confirmation before moving main force."
                    }
                ],
                "availableInfo": [
                    "Team Alpha conflicting sighting (West)",
                    "Divisional SIGINT conflicting report (East)",
                    "Acoustic intercept locating EW vehicle at Choke Point Bravo",
                    "Stale COP map (3 min old)"
                ],
                "unavailableInfo": [
                    "Two-way tactical radio link (OFFLINE)",
                    "Real-time GPS track of friendly elements",
                    "Confirmation of jammer perimeter security"
                ]
            }
        ),
        ScenarioEvent(
            id="evt-8-end",
            type="checkpoint",
            triggerTime=total_duration,
            title="Exercise Complete",
            description="Simulation horizon reached. System locks state and synthesizes After Action Review (AAR).",
            payload={}
        )
    ]

    return Scenario(
        id="scenario-op-silent-link",
        name="Operation Silent Link",
        codeName="SILENT-LINK-26248",
        description="A multi-domain tactical maneuver exercise designed to evaluate commander decision-making and rationale when faced with progressive communication latency, RF jamming, stale telemetry, and conflicting situational intelligence.",
        durationSeconds=total_duration,
        operationalArea="Sector 7 - Obsidian Ridge / Defile Bravo",
        initialUnits=[
            {
                "id": "unit-alpha",
                "name": "Team Alpha",
                "callsign": "Viper 1-1",
                "role": "Lead Recon",
                "x": 220,
                "y": 380,
                "heading": 35,
                "status": "operational"
            },
            {
                "id": "unit-bravo",
                "name": "Team Bravo",
                "callsign": "Ironclad 1-2",
                "role": "Support Element",
                "x": 160,
                "y": 510,
                "heading": 25,
                "status": "operational"
            },
            {
                "id": "objective-bravo",
                "name": "Objective Bravo",
                "callsign": "Choke Point Bravo",
                "role": "Key Terrain",
                "x": 580,
                "y": 210,
                "heading": 0,
                "status": "contested"
            }
        ],
        events=events
    )
