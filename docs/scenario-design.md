# COMMAND-X Scenario Design: Operation Silent Link

**Exercise Code**: `SILENT-LINK-26248`  
**Operational Area**: Sector 7 — Obsidian Ridge / Defile Bravo  
**Standard Duration**: 10 minutes (600s) | **Fast Demo Mode**: 2 minutes (120s)

---

## Scenario Narrative

Task Force Alpha is tasked with maneuvering two tactical subunits (**Team Alpha / Viper 1-1** and **Team Bravo / Ironclad 1-2**) through a rugged corridor toward **Objective Bravo (Choke Point Bravo)**. The operational area is suspected of harboring hostile electronic warfare (EW) reconnaissance detachments.

Initially, command-and-control links operate smoothly with live GPS telemetry, instant two-way radio comms, and verified reconnaissance. As the team advances into the canyon defile, the information environment rapidly degrades.

---

## Degradation Timeline & Triggers

| Timeline (Demo / Standard) | Phase / Event | Radio Status | Map Status | Tactical Stimulus & Cognitive Dilemma |
|---|---|---|---|---|
| **0:00 (0%) / 0:00** | **Phase 1: Baseline** | 🟢 NORMAL | 🟢 CURRENT | Normal C2 established. Full GPS and instant VHF radio. Trainee establishes baseline situational awareness. |
| **0:24 (20%) / 2:00** | **Phase 2: Propagation Latency** | 🟡 DELAYED (8s) | 🟢 CURRENT | Subunit reports lag by 8–12 seconds. Commander notices latency indicator and delayed message transmissions. |
| **0:48 (40%) / 4:00** | **Phase 3: Contradictory Feeds** | 🟡 DELAYED | 🟢 CURRENT | Ground scout reports hostiles on **Western Ridge**. Signals intelligence reports enemy convoy on **Eastern Canyon**. Trainee must weigh direct human observation vs. electronic sensor data. |
| **1:06 (55%) / 5:30** | **Phase 4: COP Telemetry Freeze** | 🟡 DELAYED | 🟡 OUTDATED (Stale 3m) | Satellite data link drops. Tactical map freezes on stale positions. Trainee must operate knowing unit icons do not reflect live coordinates. |
| **1:24 (70%) / 7:00** | **Phase 5: Total RF Blackout** | 🔴 OFFLINE | 🟡 OUTDATED | High-power RF jamming envelopes the defile. Radio net drops entirely. Outgoing messages fail with `[SIGNAL LOST]`. |
| **1:38 (82%) / 8:12** | **Phase 6: Emergent Intelligence** | 🔴 OFFLINE | 🟡 OUTDATED | Hardened emergency relay delivers acoustic intercept: mobile jammer vehicle identified at Choke Point Bravo. |
| **1:48 (90%) / 9:00** | **Phase 7: Critical Decision Point** | 🔴 OFFLINE | 🟡 OUTDATED | Mandatory commander decision required: continue current path, divert through western ridge pass, halt and fortify, or dispatch runner. Must record rationale & confidence. |
| **2:00 (100%) / 10:00**| **Phase 8: Exercise Complete & AAR** | Finalized | Finalized | System automatically generates After Action Review (AAR) assessing decisions against information reality. |

---

## Learning Objectives

1. **Mitigate Confirmation Bias**: Overcoming the tendency to trust familiar sources over contradictory sensor inputs without verification.
2. **Action Under Telemetry Latency**: Learning how to avoid making impulsive tactical adjustments based on outdated Common Operating Picture (COP) data.
3. **Decisive Command in RF Silence**: Executing mission command principles when severed from upper echelon guidance.
