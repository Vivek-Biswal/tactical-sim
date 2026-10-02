import { Scenario } from "../types/scenario";

export function getDemoScenario(isDemo: boolean = true): Scenario {
  const durationSeconds = isDemo ? 120 : 600;

  const t = (pct: number) => Math.floor((pct / 100) * durationSeconds);

  return {
    id: "scenario-op-silent-link",
    name: "Operation Silent Link",
    codeName: "SILENT-LINK-26248",
    description:
      "A high-stress multi-domain tactical scenario testing commander situational awareness, hypothesis testing, and decisive leadership during electromagnetic interference, conflicting subunit SITREPs, and COP telemetry failure.",
    durationSeconds: durationSeconds,
    operationalArea: "Sector 7 - Obsidian Ridge / Defile Bravo",
    initialUnits: [
      {
        id: "unit-alpha",
        name: "Team Alpha",
        callsign: "Viper 1-1",
        role: "Lead Recon Point",
        x: 220,
        y: 380,
        heading: 35,
        status: "operational"
      },
      {
        id: "unit-bravo",
        name: "Team Bravo",
        callsign: "Ironclad 1-2",
        role: "Heavy Support / Security",
        x: 160,
        y: 510,
        heading: 25,
        status: "operational"
      },
      {
        id: "objective-bravo",
        name: "Objective Bravo",
        callsign: "Choke Point Bravo",
        role: "Tactical Waypoint",
        x: 580,
        y: 210,
        heading: 0,
        status: "contested"
      }
    ],
    events: [
      {
        id: "evt-1-normal",
        type: "comms_degradation",
        triggerTime: 0,
        title: "Normal Communications Baseline",
        description: "Operation initiates. Satellite and tactical VHF networks operational. Real-time telemetry feed active.",
        payload: {
          commsStatus: "normal",
          mapStatus: "current",
          radioDelaySeconds: 0,
          broadcastMessage: {
            sender: "COMMAND_HQ",
            senderRole: "INSTRUCTOR",
            content: "All callsigns: Operation Silent Link is GREEN. Advance toward Waypoint Charlie via primary road corridor. Maintain standard radio protocols."
          },
          availableInfo: [
            "Real-time GPS satellite telemetry",
            "Clear VHF voice/data carrier",
            "Pre-mission reconnaissance chart"
          ],
          unavailableInfo: []
        }
      },
      {
        id: "evt-2-delay",
        type: "comms_degradation",
        triggerTime: t(20), // 24s in demo
        title: "Radio Latency & Packet Delay",
        description: "Atmospheric or electronic degradation causes 8-10 second transmission latency on tactical net.",
        payload: {
          commsStatus: "delayed",
          radioDelaySeconds: 8,
          broadcastMessage: {
            sender: "TEAM_ALPHA",
            senderRole: "TEAM_ALPHA",
            content: "[DELAYED REPORT] Alpha Lead to Command: Entering Defile approach. Terrain is funneling. Signal latency degrading."
          },
          availableInfo: [
            "Delayed tactical radio net (8s)",
            "Common Operating Picture (COP)",
            "Last reported subunit coordinates"
          ],
          unavailableInfo: [
            "Instantaneous tactical acknowledgements",
            "Real-time voice verification"
          ]
        }
      },
      {
        id: "evt-3-conflicting",
        type: "conflicting_report",
        triggerTime: t(40), // 48s in demo
        title: "Contradictory Reconnaissance Feeds",
        description: "Conflicting intelligence received simultaneously from tactical ground scouts and divisional SIGINT.",
        payload: {
          reports: [
            {
              source: "Team Alpha Scout",
              senderRole: "TEAM_ALPHA",
              content: "URGENT CONTACT: Hostile patrol sighted on WESTERN defile ridge! Recommend holding at tree line."
            },
            {
              source: "Divisional SIGINT",
              senderRole: "INTELLIGENCE",
              content: "ADVISORY INTERCEPT: RF sensor array pinpoints hostile motorized convoy along EASTERN canyon flank. Western sector clear."
            }
          ],
          availableInfo: [
            "Team Alpha visual scout report (Western flank hostile)",
            "Divisional SIGINT feed (Eastern flank motorized activity)",
            "Delayed radio link (8s)"
          ],
          unavailableInfo: [
            "Overhead thermal confirmation (cloud/electronic mask)",
            "Visual verification of Eastern canyon"
          ]
        }
      },
      {
        id: "evt-4-outdated-map",
        type: "map_status",
        triggerTime: t(55), // 66s in demo
        title: "COP Telemetry Stale / GPS Feed Lost",
        description: "Tactical Common Operating Picture loses satellite uplink. Map position data freezes at last verified ping.",
        payload: {
          mapStatus: "outdated",
          staleSinceSeconds: 180,
          staleMessage: "COP synchronization timeout. Displaying stale telemetry snapshot.",
          availableInfo: [
            "Outdated map positions (3m stale)",
            "Previous contradictory intelligence"
          ],
          unavailableInfo: [
            "Live friendly track coordinates",
            "Real-time sensor overlays",
            "GPS precision targeting"
          ]
        }
      },
      {
        id: "evt-5-dropout",
        type: "comms_degradation",
        triggerTime: t(70), // 84s in demo
        title: "Total Radio Blackout",
        description: "Full-spectrum RF jamming in effect. Tactical radio carrier dropped. All outgoing transmissions unacknowledged.",
        payload: {
          commsStatus: "offline",
          radioDelaySeconds: 9999,
          systemAlert: "SIGNAL LOST — TACTICAL NET OFFLINE — PACKETS DROPPED",
          availableInfo: [
            "Pre-jamming mission briefing",
            "Stale map overlay (Sector 7)",
            "Last known unit azimuths"
          ],
          unavailableInfo: [
            "Radio communications (ALL CHANNELS OFFLINE)",
            "Live COP telemetry",
            "Subunit status reports"
          ]
        }
      },
      {
        id: "evt-6-intel",
        type: "intel_update",
        triggerTime: t(82), // 98s in demo
        title: "High-Priority Electronic Intercept",
        description: "Emergency acoustic relay intercept reports enemy electronic warfare vehicle operating near Choke Point Bravo.",
        payload: {
          sender: "ACOUSTIC_RELAY",
          senderRole: "INTELLIGENCE",
          content: "FLASH OVERRIDE: Low-band acoustic sensors confirm hostile mobile electronic warfare vehicle stationed at choke point Bravo (Northern Highway). Jamming radius estimated 2.5km.",
          availableInfo: [
            "Acoustic EW intercept report",
            "Hostile jammer located at Choke Point Bravo",
            "Pre-jamming scout reports"
          ],
          unavailableInfo: [
            "Two-way contact with Team Alpha or Bravo",
            "Confirmation of jammer escort strength",
            "Updated friendly unit positions"
          ]
        }
      },
      {
        id: "evt-7-decision",
        type: "decision_point",
        triggerTime: t(90), // 108s in demo
        title: "Critical Tactical Decision Point",
        description: "Commander must commit to operational action under conditions of degraded comms, contradictory intel, and stale telemetry.",
        payload: {
          prompt: "With communications severed, conflicting enemy sightings, and mobile jammer pinpointed at Choke Point Bravo, specify your immediate order:",
          options: [
            {
              id: "opt-1",
              label: "Continue Current Route through Northern Defile",
              description: "Maintain original schedule and assault toward waypoint despite reported jammer."
            },
            {
              id: "opt-2",
              label: "Divert Route via Western Ridge Pass",
              description: "Bypass suspected jammer vehicle, accept rough terrain delay and risk of Western patrol."
            },
            {
              id: "opt-3",
              label: "Halt and Establish Defensive Perimeter",
              description: "Wait for communication recovery or courier contact before risking further advancement."
            },
            {
              id: "opt-4",
              label: "Dispatch Runner / Recon Scout toward Eastern Canyon",
              description: "Seek direct visual confirmation before moving main force."
            }
          ],
          availableInfo: [
            "Team Alpha conflicting sighting (West)",
            "Divisional SIGINT conflicting report (East)",
            "Acoustic intercept locating EW vehicle at Choke Point Bravo",
            "Stale COP map (3 min old)"
          ],
          unavailableInfo: [
            "Two-way tactical radio link (OFFLINE)",
            "Real-time GPS track of friendly elements",
            "Confirmation of jammer perimeter security"
          ]
        }
      },
      {
        id: "evt-8-end",
        type: "checkpoint",
        triggerTime: durationSeconds,
        title: "Exercise Completed",
        description: "Simulation duration reached. Preparing After Action Review (AAR).",
        payload: {}
      }
    ]
  };
}
