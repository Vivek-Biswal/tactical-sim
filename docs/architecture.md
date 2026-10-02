# COMMAND-X Architecture Documentation

**Problem Statement 26248**: Immersive Multi-Domain Decision-Making Trainer for Degraded Communication Environments.

---

## 1. High-Level System Architecture

COMMAND-X is designed specifically for training military decision-makers and tactical teams in information-degraded, contested electromagnetic spectrum (EMS), and disrupted communication environments.

```
+-----------------------------------------------------------------------------------+
|                               COMMAND-X CLIENT                                    |
|                                                                                   |
|  +------------------------+  +--------------------------+  +--------------------+ |
|  |  Commander C2 Console  |  |  Field Team Terminal     |  | Instructor Control | |
|  |  - 2D SVG Tactical Map |  |  - Unit Observer         |  | - Scenario Inject  | |
|  |  - Radio Comms Console |  |  - Subunit SITREP Comms  |  | - Comms Degraders  | |
|  |  - Situation & Intel   |  |  - Latency/Drop Viewer   |  | - Real-time Logs   | |
|  |  - Decision & Rationale|  |                          |  | - Speed / Pause    | |
|  +------------------------+  +--------------------------+  +--------------------+ |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                     Client State & Offline Fallback Engine                  |  |
|  |                     (Zero-Failure Client Simulation Loop)                   |  |
|  +-----------------------------------------------------------------------------+  |
+----------------------------------------^------------------------------------------+
                                         |
                       WebSocket (ws://) & REST (http://)
                                         |
+----------------------------------------v------------------------------------------+
|                             FASTAPI CORE BACKEND                                  |
|                                                                                   |
|  +------------------------+  +--------------------------+  +--------------------+ |
|  | REST API Routers       |  | WebSocket Broadcast Hub  |  | Scenario Engine    | |
|  | - /api/scenarios       |  | - Multi-client sync      |  | - Timeline Ticker  | |
|  | - /api/exercises       |  | - Role-based packets     |  | - Radio Latency Q  | |
|  | - /api/decisions       |  | - Connection heartbeats  |  | - Stale COP Sync   | |
|  | - /api/aar             |  |                          |  | - Telemetry Tracks | |
|  +------------------------+  +--------------------------+  +--------------------+ |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                       In-Memory / Modular Data Layer                        |  |
|  |           (PostgreSQL compatible interface, zero blocking setup)            |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Key Architectural Pillars

### A. Information Degradation Modeling
1. **Radio Latency & Packet Queue**:
   When radio state transitions from `NORMAL` to `DELAYED`, transmissions enter a time-delayed queue where packets are throttled by an injected propagation delay (8–12 seconds).
2. **Total Radio Dropout**:
   When the carrier is jammed or dropped (`OFFLINE`), packets fail transmission immediately with explicit HUD alerts (`[SIGNAL LOST]`), simulating complete RF silence.
3. **Common Operating Picture (COP) Telemetry Decay**:
   When GPS or data telemetry link fails (`OUTDATED`), unit coordinates freeze at the last known timestamp. The user interface indicates timestamp staleness (e.g. `Last updated: 3 minutes ago`), forcing commanders to discern true positions from stale representations.
4. **Contradictory Situation Feeds**:
   The engine injects opposing ground scout vs. signals intelligence (SIGINT) reports to evaluate decision-making under uncertainty and verification bias.

### B. Information State Auditing & AAR Engine
At every decision trigger:
- The system captures a cryptographic snapshot of what facts were **Verified & Available** (e.g. initial scout report, acoustic intercept) vs. what was **Unavailable/Jammed** (two-way radio, real-time friendly track GPS).
- The After Action Review (AAR) correlates the commander's chosen course of action and stated rationale with this information state snapshot.

---

## 3. Communication Protocols

- **REST API**: Used for scenario definitions, exercise initialization, static report fetches, and HTTP fallback.
- **WebSocket Protocol (`/ws/exercise/{id}`)**:
  - `state_update`: Full synchronized state distributed to all subscribed roles.
  - `radio_message`: Inbound audio/text transmission evaluated against the current radio state.
  - `decision_submit`: Commander decision with rationale and subjective confidence level.
  - `instructor_inject`: Real-time tactical override commands (e.g. `delay_radio`, `drop_radio`, `outdate_map`, `conflicting_report`).
