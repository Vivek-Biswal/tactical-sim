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
        type: "Recon Infantry",
        faction: "friendly",
        x: 220,
        y: 380,
        heading: 35,
        status: "operational",
        sector: "Sector 7",
        communicationStatus: "NORMAL"
      },
      {
        id: "unit-bravo",
        name: "Team Bravo",
        callsign: "Ironclad 1-2",
        role: "Heavy Support",
        type: "Mechanized Infantry",
        faction: "friendly",
        x: 160,
        y: 510,
        heading: 25,
        status: "operational",
        sector: "Sector 7",
        communicationStatus: "NORMAL"
      },
      {
        id: "unit-charlie",
        name: "Team Charlie",
        callsign: "Ghost 1-3",
        role: "Flank Security",
        type: "Infantry",
        faction: "friendly",
        x: 100,
        y: 560,
        heading: 45,
        status: "moving",
        sector: "Sector 7",
        communicationStatus: "DELAYED"
      },
      {
        id: "contact-1",
        name: "Unknown Contact 1",
        callsign: "Unknown 1",
        role: "Unidentified Motorized",
        type: "Motorized",
        faction: "unknown",
        x: 710,
        y: 320,
        heading: 180,
        status: "unknown",
        sector: "Sector 8",
        communicationStatus: "LOST"
      },
      {
        id: "contact-2",
        name: "Unknown Contact 2",
        callsign: "Unknown 2",
        role: "Suspected Infantry",
        type: "Infantry",
        faction: "hostile",
        x: 260,
        y: 210,
        heading: 90,
        status: "unknown",
        sector: "Sector 7",
        communicationStatus: "LOST"
      }
    ],
    events: [
      {
        id: "evt-start",
        type: "STATUS_CHANGE",
        triggerTime: 0,
        title: "Scenario Started",
        description: "Operation Silent Link initiates.",
        payload: {
          targetUnitId: "unit-alpha",
          status: "operational"
        }
      },
      {
        id: "evt-alpha-move",
        type: "UNIT_MOVE",
        triggerTime: t(16.66), // ~20 seconds if duration is 120s
        title: "Team Alpha Moving",
        description: "Team Alpha begins movement.",
        payload: {
          targetUnitId: "unit-alpha",
          status: "moving",
          x: 280,
          y: 350
        }
      },
      {
        id: "evt-uav-detect",
        type: "CONTACT_DETECTED",
        triggerTime: t(33.33), // ~40 seconds if duration is 120s
        title: "UAV Detection",
        description: "UAV detects unknown contact.",
        payload: {
          targetUnitId: "contact-2",
          status: "unknown",
          x: 270,
          y: 220
        }
      },
      {
        id: "evt-intel",
        type: "INTEL_REPORT",
        triggerTime: t(41.66), // ~50 seconds if duration is 120s
        title: "Intel Report Generated",
        description: "Intel report is generated.",
        payload: {
          sender: "UAV REPORT",
          senderRole: "INTELLIGENCE",
          content: "Unknown activity detected in Sector C."
        }
      },
      // ── Phase 4: Communication Degradation Timeline ──
      {
        id: "evt-comms-delayed",
        type: "comms_degradation",
        triggerTime: t(45),
        title: "Comms Degradation: DELAYED",
        description: "Electronic interference detected. Radio latency increasing.",
        payload: {
          commsStatus: "delayed",
          radioDelaySeconds: 8,
          messageLossPercentage: 0,
          allowIncompleteReports: false,
          broadcastMessage: {
            sender: "SIGINT WARNING",
            senderRole: "INTELLIGENCE",
            content: "WARNING: Electronic emission spike detected bearing 045°. Expect radio propagation delay. All stations maintain transmission discipline."
          },
          availableInfo: [
            "Satellite GPS Track (Normal)",
            "Pre-mission Area Reconnaissance"
          ],
          unavailableInfo: [
            "Real-time VHF Radio (Delayed +8s)"
          ]
        }
      },
      {
        id: "evt-contact-active",
        type: "STATUS_CHANGE",
        triggerTime: t(50),
        title: "Contact 1 Active",
        description: "Unknown Contact 1 becomes active.",
        payload: {
          targetUnitId: "contact-1",
          status: "operational",
          faction: "hostile"
        }
      },
      {
        id: "evt-comms-degraded",
        type: "comms_degradation",
        triggerTime: t(60),
        title: "Comms Degradation: DEGRADED",
        description: "Hostile jammer activation suspected. Partial signal loss and garbled transmissions.",
        payload: {
          commsStatus: "degraded",
          mapStatus: "outdated",
          radioDelaySeconds: 15,
          messageLossPercentage: 30,
          allowIncompleteReports: true,
          broadcastMessage: {
            sender: "EW WARNING",
            senderRole: "HQ",
            content: "CRITICAL: Hostile electronic warfare jammer active. 30% packet loss. Expect incomplete/garbled transmissions. Verify all intel before acting."
          },
          availableInfo: [
            "Pre-mission Area Reconnaissance",
            "Last known GPS positions (stale)"
          ],
          unavailableInfo: [
            "Real-time VHF Radio (Degraded — 30% loss)",
            "Satellite GPS Track (Intermittent)"
          ]
        }
      },
      {
        id: "evt-conflicting-reports",
        type: "CONFLICTING_REPORT",
        triggerTime: t(65),
        title: "Conflicting Intelligence Reports",
        description: "Two sources provide contradictory information about hostile positions.",
        payload: {
          reports: [
            {
              source: "Team Alpha Scout",
              senderRole: "TEAM_ALPHA",
              content: "CONTACT REPORT: 3 hostile dismounts observed at grid 047-218, moving southeast toward our position. Request immediate fire support."
            },
            {
              source: "SIGINT Intercept",
              senderRole: "INTELLIGENCE",
              content: "SIGINT ADVISORY: Acoustic arrays show NO activity at grid 047-218. Hostile main body concentrated at grid 092-315. Alpha scout report may be misidentified civilians."
            }
          ]
        }
      },
      {
        id: "evt-decision-under-degraded",
        type: "decision_point",
        triggerTime: t(70),
        title: "Commander Decision Required",
        description: "Conflicting intel under degraded comms — commander must decide.",
        payload: {
          prompt: "Conflicting reports received under degraded communications. Alpha scout reports hostile dismounts at grid 047-218. SIGINT says that grid is clear and hostiles are at grid 092-315. What is your order?",
          options: [
            {
              id: "trust-alpha",
              label: "Trust Alpha Scout — Redirect fire support to grid 047-218",
              description: "Forward observers have direct visual. Prioritize eyes-on-target over remote SIGINT.",
              consequence: { type: "move_unit", targetUnitId: "unit-alpha", sector: "Sector B", status: "moving", x: 180, y: 150 }
            },
            {
              id: "trust-sigint",
              label: "Trust SIGINT — Reorient toward grid 092-315",
              description: "Acoustic arrays are more reliable than visual in degraded conditions. Redirect main effort.",
              consequence: { type: "move_unit", targetUnitId: "unit-alpha", sector: "Sector D", status: "moving", x: 450, y: 400 }
            },
            {
              id: "hold-verify",
              label: "Hold Position — Request verification from both sources",
              description: "Do not commit forces until conflicting reports are reconciled. Risk: delay may allow hostile repositioning.",
              consequence: { type: "move_unit", targetUnitId: "unit-alpha", status: "operational" }
            }
          ]
        }
      },
      {
        id: "evt-comms-lost",
        type: "comms_degradation",
        triggerTime: t(80),
        title: "Comms LOST — Full Blackout",
        description: "All radio communications severed. Hostile jammer at full power.",
        payload: {
          commsStatus: "offline",
          mapStatus: "unavailable",
          radioDelaySeconds: 0,
          messageLossPercentage: 100,
          allowIncompleteReports: false,
          broadcastMessage: {
            sender: "SYSTEM",
            senderRole: "INSTRUCTOR",
            content: "⚠ TOTAL COMMS BLACKOUT — All VHF/UHF carriers offline. You are operating without external communication. Rely on last known positions and pre-mission briefing."
          },
          availableInfo: [
            "Pre-mission Area Reconnaissance",
            "Last known unit positions (STALE)"
          ],
          unavailableInfo: [
            "VHF/UHF Radio (LOST — jammer active)",
            "Satellite GPS Track (LOST)",
            "UAV Telemetry Feed (LOST)",
            "Real-time Intelligence Updates (LOST)"
          ]
        }
      },
      {
        id: "evt-comms-restored",
        type: "comms_degradation",
        triggerTime: t(92),
        title: "Comms Restored — Normal",
        description: "Counter-EW measures effective. Radio net re-established.",
        payload: {
          commsStatus: "normal",
          mapStatus: "current",
          radioDelaySeconds: 0,
          messageLossPercentage: 0,
          allowIncompleteReports: false,
          broadcastMessage: {
            sender: "EW COUNTER",
            senderRole: "HQ",
            content: "ADVISORY: Counter-electronic warfare measures successful. Hostile jammer neutralized. All stations, re-establish net and transmit backlogged SITREPs."
          },
          availableInfo: [
            "Satellite GPS Track (Restored)",
            "Direct VHF Radio Uplink (Restored)",
            "Pre-mission Area Reconnaissance",
            "UAV Telemetry (Restored)"
          ],
          unavailableInfo: []
        }
      },
      {
        id: "evt-end",
        type: "STATUS_CHANGE",
        triggerTime: durationSeconds,
        title: "Exercise Completed",
        description: "Simulation duration reached.",
        payload: {}
      }
    ]
  };
}
