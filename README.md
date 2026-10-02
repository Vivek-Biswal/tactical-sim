# COMMAND-X
### Immersive Multi-Domain Decision-Making Trainer for Degraded Communication Environments
**Problem Statement ID: 26248**

---

## 1. Problem Statement & Operational Challenge
In modern multi-domain tactical operations, commanders and small maneuvering units rarely operate with pristine satellite links, instantaneous voice radio, and flawless Common Operating Picture (COP) telemetry. Modern electronic warfare (EW) adversaries employ high-power RF jammers, spoofing, and cyber disruption that render communications:
- **Delayed**: Packet latency forces out-of-sync coordination.
- **Missing / Incomplete**: Sensor dropouts create critical blind spots.
- **Outdated / Stale**: Frozen GPS tracks mislead maneuver planning.
- **Contradictory**: Conflicting visual scout reports vs. signals intelligence (SIGINT) feeds confuse intent.
- **Severed / Offline**: Full electromagnetic blackout forces autonomous leadership.

Most existing military simulations focus excessively on 3D ballistics, weapons effects, or complex geospatial terrain (GIS), neglecting the **cognitive friction of decision-making under severe information degradation**.

---

## 2. Solution: COMMAND-X
**COMMAND-X** is a browser-based tactical decision-making simulator designed specifically for commanders, small teams, and instructors. It does not attempt to be a realistic combat game; instead, it is a disciplined **cognitive trainer for leadership under uncertainty**.

COMMAND-X allows:
1. **Instructors** to configure and run scenarios, inject real-time electronic counter-measures (`[DELAY RADIO]`, `[DROP RADIO]`, `[CONFLICTING REPORT]`, `[OUTDATE MAP]`), monitor trainee decisions, and evaluate responses.
2. **Commanders & Field Subunits** to collaborate via 2D SVG tactical maps, simulated VHF radio nets, and situational report feeds.
3. **Automated After Action Reviews (AAR)** that correlate every commander decision and rationale with the **exact information environment at that second (Verified vs. Denied facts)**.

---

## 3. Key Capabilities & Features

- **Interactive 2D SVG Tactical Map**: Fictional, fully controlled, zero-GIS dependency tactical map featuring elevation contours (Obsidian Ridge, Defile Bravo), road networks, friendly tracks, and activity pings.
- **Deterministic Information Degradation Engine**:
  - *Radio Delay*: Transmissions enter a time-delayed queue with countdown bars.
  - *Radio Dropout*: Full RF jamming causes transmissions to drop with `[SIGNAL LOST]` HUD alerts.
  - *COP Telemetry Decay*: Stale GPS snapshots freeze unit positions with visual timestamp warnings (`Last updated: 3 minutes ago`).
  - *Conflicting Feeds*: Simultaneous contradictory SITREPs test confirmation bias.
- **Rationale Capture System**: Prompts commanders at critical junctures with tactical options, requiring stated justification and subjective confidence rating (`LOW`, `MEDIUM`, `HIGH`).
- **Information Reality Matrix (Information State)**: Explicitly tracks what was available vs. unavailable at every decision point for debriefing.
- **Multiplayer / Dual-Role Architecture**: Real-time WebSocket connection enabling dual-browser participation (Commander in Browser 1, Field Team Scout in Browser 2).
- **Fast 2-Minute Demo Mode**: Optimized for hackathon evaluation and rapid judging walkthroughs.
- **Objective AAR Debrief**: Chronological timeline, message delivery audit (sent, delivered, delayed, dropped), and tailored doctrine recommendations.

---

## 4. Tech Stack

- **Frontend**:
  - [Next.js](https://nextjs.org/) (App Router, React, TypeScript)
  - [Tailwind CSS](https://tailwindcss.com/) (Tactical HUD styling, dark command console theme)
  - [Lucide React](https://lucide.dev/) (Tactical and communication iconography)
  - Custom SVG graphics engine (no external GIS/Mapbox/Google dependencies)
- **Backend**:
  - [FastAPI](https://fastapi.tiangolo.com/) (Python asynchronous REST API)
  - [WebSockets](https://websockets.readthedocs.io/) (Real-time exercise state broadcasting)
  - [Uvicorn](https://www.uvicorn.org/) (ASGI server)
- **Data & Persistence**:
  - Modular in-memory data store with immediate zero-configuration startup.
  - PostgreSQL architectural compatibility layer.

---

## 5. System Architecture

```
+-------------------------------------------------------------------------------+
|                               COMMAND-X CLIENT                                |
|                                                                               |
|  +---------------------+  +----------------------+  +-----------------------+ |
|  | Commander C2 Station|  | Field Team Terminal  |  | Instructor Controller | |
|  | - 2D SVG Map        |  | - Subunit SITREP Net |  | - Manual Degraders    | |
|  | - VHF Radio Net     |  | - Latency Visualizer |  | - Real-time Audit     | |
|  | - Decision Capture  |  | - Team Tracking      |  | - Speed / Pause / End | |
|  +---------------------+  +----------------------+  +-----------------------+ |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                   Zero-Failure Client Simulation Fallback               |  |
|  +-------------------------------------------------------------------------+  |
+---------------------------------------^---------------------------------------+
                                        |
                      WebSocket (ws://) & REST (http://)
                                        |
+---------------------------------------v---------------------------------------+
|                            FASTAPI CORE BACKEND                               |
|                                                                               |
|  +-------------------+  +-------------------------+  +----------------------+ |
|  | REST API Routers  |  | WebSocket Broadcast Hub |  | Scenario Ticker      | |
|  | - /api/scenarios  |  | - Client connections    |  | - Event Scheduler    | |
|  | - /api/exercises  |  | - Multi-role packets    |  | - Radio Delay Queue  | |
|  | - /api/decisions  |  | - Heartbeat sync        |  | - COP Stale Monitor  | |
|  | - /api/aar        |  |                         |  | - AAR Generator      | |
|  +-------------------+  +-------------------------+  +----------------------+ |
+-------------------------------------------------------------------------------+
```

---

## 6. How to Run the Application

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### A. Run Backend (FastAPI + WebSockets)
```bash
# Navigate to backend directory
cd backend

# Install dependencies
python -m pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API will be live at `http://localhost:8000` (docs at `http://localhost:8000/docs`).

### B. Run Frontend (Next.js)
```bash
# Navigate to frontend directory in another terminal
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Next.js development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 7. Fast 2-Minute Demo Scenario: Operation Silent Link

1. Open `http://localhost:3000` and click **"START 2-MINUTE DEMO EXERCISE"**.
2. **0:00 (Baseline)**: Notice normal VHF radio (`🟢 NORMAL`) and active GPS map (`🟢 CURRENT`).
3. **0:24 (Radio Delay)**: Electronic degradation triggers `🟡 DELAYED (+8s)`. Messages lag.
4. **0:48 (Conflicting Reports)**: Ground scout reports enemy on *Western Ridge*; SIGINT reports convoy on *Eastern Canyon*. Two yellow contact warning pins appear on the map.
5. **1:06 (Outdated Map)**: Satellite link denied (`🟡 OUTDATED`). Map freezes with banner *Last updated: 3 minutes ago (STALE)*.
6. **1:24 (Total Radio Dropout)**: Full RF jamming (`🔴 OFFLINE`). Outbound messages are dropped with `[SIGNAL LOST]`.
7. **1:38 (New Intelligence)**: Hardened acoustic relay intercept identifies an enemy EW mobile jammer at *Choke Point Bravo*.
8. **1:48 (Decision Point)**: Prompt triggers **DECISION REQUIRED**. Commander selects route diversion, provides justification in **"Why did you make this decision?"**, and sets confidence to `HIGH`.
9. **2:00 (AAR Generated)**: Automatically opens the **After Action Review** analyzing decisions against the Information State matrix.

---

## 8. Future Scope
- **Voice Synthesis & Acoustic Degradation**: Realistic RF static and signal-to-noise ratio audio filtering using Web Audio API.
- **PostgreSQL / TimescaleDB Persistence**: Long-term longitudinal training records and organizational telemetry.
- **ReportLab PDF Export**: Automated high-resolution mission debrief PDF generation.
- **Multi-Subunit Swarm Mode**: Expanding from 2 subunits to company-level maneuver elements with cascading relay networks.

---

## 9. Hackathon Team Contributions
- **Lead Full-Stack Architecture & Simulation Engine**: System design, state ticker, and degradation models.
- **Frontend & Tactical SVG Engine**: C2 dashboard, 2D custom SVG map, and HUD styling.
- **Backend & Real-Time Multiplayer**: FastAPI REST routes, WebSocket broadcasting, and radio delay queues.
- **Decision Matrix & AAR Analytics**: Information state tracking, decision logging, and debrief metrics.
- **Scenario Design & Documentation**: Operation Silent Link design, user experience testing, and demo workflow.
