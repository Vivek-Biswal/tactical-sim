# COMMAND-X Hackathon Live Demo Script (2-Minute Walkthrough)

This script is designed for judges and evaluators to experience the full end-to-end flow of COMMAND-X within 2 minutes.

---

### Step 1: Open the Application
1. Navigate to `http://localhost:3000`.
2. Observe the dark tactical command-center interface.
3. Note the two primary portals: **Instructor C2 Console** and **Commander Tactical Station**, plus the **Field Team Link** and **AAR Archive**.

---

### Step 2: Instructor Setup
1. Click **Instructor Console** (or navigate to `/instructor`).
2. Select **Operation Silent Link** (`SILENT-LINK-26248`).
3. Verify **Demo Mode (2 minutes)** is toggled ON.
4. Click **[ START EXERCISE ]**.

---

### Step 3: Dual-Window Demonstration (Multiplayer / Dual Role)
1. In Window 1 (Left): Open **Commander Simulation** (`/commander/simulation/exercise-demo-1`).
2. In Window 2 (Right): Open **Field Team Terminal** (`/team`) or **Instructor Live Monitor** (`/instructor/exercises/exercise-demo-1`).
3. Observe real-time synchronization between both windows over WebSocket.

---

### Step 4: The 2-Minute Degradation Sequence
- **0:00 – Baseline**:
  - Point out the 2D Tactical Map: Terrain contours, Sector 7, road network, Team Alpha and Bravo moving in real time.
  - Radio status displays `🟢 NORMAL`. Messages transmit instantly.
- **0:24 – Radio Delay**:
  - Radio status shifts to `🟡 DELAYED (8s)`.
  - Type a message from Team Alpha or Commander: notice the transmission delay bar and latency countdown.
- **0:48 – Contradictory Intelligence**:
  - Two opposing messages appear on the comms log:
    - *Ground Scout*: "Hostile patrol sighted on Western Ridge."
    - *Divisional SIGINT*: "Hostile motorized convoy on Eastern Canyon."
  - Two unverified yellow contact ping markers appear on the tactical map!
- **1:06 – Outdated Map**:
  - Map status shifts to `🟡 OUTDATED`.
  - Notice the HUD banner: `Last updated: 3 minutes ago (STALE)`. Unit icons freeze to reflect stale telemetry.
- **1:24 – Total Radio Blackout**:
  - Radio status shifts to `🔴 OFFLINE`.
  - Try to send a radio message: system flags `[SIGNAL LOST / PACKET DROPPED]`.
- **1:38 – Emergent Intelligence**:
  - Flash acoustic relay intercept identifies an enemy EW mobile jammer at Choke Point Bravo.
- **1:48 – Critical Decision Point**:
  - Modal pops up: **DECISION REQUIRED**.
  - Select option: e.g., *"Divert Route via Western Ridge Pass"*.
  - Prompt opens: **"Why did you make this decision?"**
  - Trainee enters rationale: *"Hostile jammer at Choke Point Bravo poses unacceptable ambush risk; rerouting through western pass despite rough terrain."*
  - Select Confidence: `HIGH` or `MEDIUM` -> Click **Submit Decision**.

---

### Step 5: After Action Review (AAR)
1. At 2:00 (or by clicking **[ End Exercise & View AAR ]**), the simulation transitions to the **After Action Review** (`/aar/exercise-demo-1`).
2. Show the judges:
   - **Chronological Decision Timeline** with all degradation markers.
   - **Decision Analysis Deep-Dive**: Displays the commander's choice, rationale, and **what information was Available vs. Unavailable** at that exact second!
   - **Communications Degradation Breakdown**: Messages sent, delivered, delayed, and dropped.
   - **Analytical Findings & Training Recommendations**.
