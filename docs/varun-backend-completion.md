# Varun backend work-file completion

Source: the user-supplied `Varun-work.txt`, “TACTICAL-SIM — PERSON 3 WORK FILE”, Backend + Scenario Engine. This checklist maps its requirements to the existing application and incremental additions. The work-file examples are conceptual; the integrated frontend's `/api` paths, lower-case state fields and existing socket commands remain supported.

## Scope and architecture

The backend is Python/FastAPI/Uvicorn with WebSockets. `backend/app/main.py`, the four route modules, `websocket/manager.py`, `websocket/handlers.py`, and `scenario_engine/engine.py`, `events.py`, `scheduler.py` match the requested structure. Memory remains the default storage mode. Optional Firestore checkpoints and the already existing SVG/Cesium views are retained; map rendering does not introduce another shared simulation engine.

FastAPI owns a shared room's elapsed time, event execution, radio queues, authoritative unit motion, displayed map snapshot and decision records. Browser-only practice remains separately labelled local practice. The exercise uses simulated information and units; this completion adds no combat/weapon model, live military network, live operational data, microservices or AI.

## Definition of done

“Implemented” below describes inspected code and named automated coverage. Final execution results and real-browser verification belong in the verification section; a test's existence alone is not a claim that it passed in this run.

| Work-file condition | Implementation evidence | Automated coverage |
| --- | --- | --- |
| FastAPI server runs | `app/main.py`, lifespan, root and `/api/health`; Uvicorn startup script | API `TestClient` startup; running-server smoke script |
| Scenario can start | `POST /api/exercises/start`, keyed room control `start`, socket `EXERCISE_CONTROL` | `test_validation_authority_and_missing_records`; `test_instructor_join_credential_and_csv_export` |
| Exercise timer works | Wall-clock scheduler updates running rooms; shared speed/pause | `test_scheduler_advances_real_clock`; `test_movement_pause_bounds_arrival_and_isolation` |
| Events trigger automatically | Operation Silent Link timeline, exact scheduled boundaries, duplicate suppression | `test_exact_timeline_and_no_duplicate_events` |
| Radio delay works | Simulation-time queue; delivered messages become reports | `test_delay_pause_and_dropout`; running-server delayed-radio smoke |
| Radio dropout works | New packets drop; queued packets flush; canonical `MESSAGE_DROPPED` records the work-file outcome without trainee body leakage | `test_delay_pause_and_dropout`; `test_queued_and_dropped_bodies_are_not_message_envelopes`; running-server smoke |
| Conflicting reports work | Two independent unverified reports with a conflict group; neither is declared correct | Exact timeline and decision-knowledge tests; scenario engine execute-event path |
| Map-outdated event works | Position/activity snapshot freezes; true motion continues privately | `test_stale_activity_and_positions_are_private`; `test_pause_and_degraded_feed_preserve_authoritative_air_and_boat_motion` |
| New intelligence works | Scheduled/injected observation arrives through the intelligence relay while radio can remain offline; message/content and reliability are retained | `test_work_file_compatible_payloads_and_public_map_aliases`; exact timeline/decision-knowledge tests |
| Instructor can trigger events | Keyed `/inject`, `/event`, `/control`; authenticated instructor socket role | API validation/key tests; instructor socket test |
| WebSocket connection works | Per-room sockets, join handshake, bounded sends, malformed-command errors | `test_two_clients_sync_permissions_ack_dedup_and_errors`; running-server smoke |
| Frontend receives live events | Shared client uses authoritative state/events, reconnects and waits for fresh state | Socket delivery tests; real-browser check recorded separately |
| Team messages transmit | Participant radio command, delayed delivery, drop status, delivered-state publication and `TEAM_MESSAGE` notification | `test_work_file_socket_aliases_and_delivered_message`; multi-client API test and two-socket running-server smoke |
| Commander decision reaches backend | `/decision` and Commander `DECISION_SUBMIT`; server generates identity/context/timestamps | `test_decision_captures_knowledge_at_submission`; multi-client API test |
| Exercise can end | Scheduled 120-second end, instructor manual end, final AAR | Timeline test; `test_standard_duration_and_early_end_flush`; CSV/AAR test |
| Covered workflows have no critical server errors | Validated requests, isolated rooms, errors without corruption, scheduler lifecycle | Complete backend suite and running-server smoke must pass; deployment checks remain separate |

All rows have implementation paths. See [the API reference](backend-api.md) for exact payloads, aliases, state visibility and access limitations.

## Required scenario and event behavior

Operation Silent Link runs for 120 simulation seconds in demo mode and 900 seconds in standard mode. The standard mode scales all scheduled boundaries together, preserving the same information sequence.

| Demo time | Event | Observable outcome |
| --- | --- | --- |
| 00:00 | `EXERCISE_STARTED` | Clock starts; friendly units move; radio initially normal |
| 00:20 | `RADIO_DELAY` | Radio delayed by ten simulation seconds |
| 00:40 | `CONFLICTING_REPORT` | Two conflicting, unverified reports become available |
| 01:00 | `MAP_OUTDATED` | Unit/activity feed becomes last-known information |
| 01:20 | `RADIO_DROPOUT` | Radio offline; pending/new radio packets drop |
| 01:40 | `NEW_INTELLIGENCE` | New observation arrives on the separate intelligence relay |
| 01:50 | `DECISION_REQUIRED` | Commander receives a rationale/confidence prompt |
| 02:00 | `EXERCISE_ENDED` | Clock ends and final AAR becomes available |

`TEAM_MOVEMENT` also exists as an instructor event or participant movement command; it uses the same clock, unit records and map visibility policy. Restoration, unavailable-map and pause/resume controls extend the required minimum. Instructor injects work during a running or paused exercise and retain the future scheduled timeline.

## Integration hand-offs

| Collaborator | Stable contract |
| --- | --- |
| Kakul — frontend/integration | `/api` scenario/exercise routes, predictable state, instructor-key lifecycle, socket command/result examples in `backend-api.md` |
| Vivek — tactical map | Filtered `units`/`teams`, `activityMarkers`/`activities`, `mapStatus`, headings/destinations and training-area metadata; SVG and 3D consume the same feed |
| Ashwin — decision/AAR | Server-recorded rationale/confidence, scenario and real timestamps, radio/map conditions, available/unavailable knowledge and immutable submitted snapshots; real JSON/CSV AAR |
| Sneha — multiplayer | Per-room join, role/name, live state/events/messages, request ACK/errors, own-team movement restrictions, disconnect/rejoin behavior |

Exercise REST/socket identity now comes from verified Firebase ID tokens and signed `tacticalRole` account claims. Instructor control/truth requires the Instructor account, creating UID and room key. Team bindings are fixed on first join. REST state/decision reads and participant commands require an existing membership; only room creation and WebSocket JOIN establish memberships. New joins stop after completion, while existing members can reconnect for the complete final debrief. Reset preserves creator and membership bindings. Self-selected roles remain only in explicit local `AUTH_MODE=demo`; the verification dated below preceded this account-authorization change and does not prove its live deployment. See [account roles](account-roles.md) and [the current API contract](backend-api.md).

Additive compatibility keeps existing consumers working: `JOIN_EXERCISE` aliases `JOIN`, `SEND_MESSAGE` aliases `RADIO_MESSAGE`, `message` aliases `content`, `activities` aliases the filtered `activityMarkers`, event records retain both `timestamp` and `second`, and confidence/reliability accept case-insensitive work-file values. Socket `SCENARIO_EVENT` adds title/description/source. Hidden UAV deployments follow the same degraded-map filtering as ground movement, covered by `test_socket_never_broadcasts_hidden_uav_positions`.

## Verification procedure and status

Run from the repository root:

```powershell
./scripts/test-backend.ps1
```

Run the real transport check with a separate backend process bound to the script's default local port 8000:

```powershell
$env:AUTH_MODE = "demo"
./scripts/start-backend.ps1
backend/.venv/Scripts/python.exe test_simulation.py
```

The transport harness uses the explicit local `AUTH_MODE=demo` backend setting. Firebase authorization needs separate account/token checks; a demo-mode passing test cannot prove production identity enforcement.

For the browser check, open `/training`, create a room, join Instructor and Commander/Team in separate browser contexts, start, inject delay/dropout/conflicts/map degradation, transmit radio, submit a decision, end and open/export the resulting AAR. Confirm every client uses the same room ID. The browser-only `/maps` page is not evidence of backend multiplayer integration.

Verified locally on 3 October 2026:

- All 28 backend tests passed. Ruff passed for the backend and transport test.
- The running-server transport test passed with two real WebSocket clients, delayed/dropped messages, hidden-data filtering, decision snapshots and final JSON AAR.
- The real scheduler test observed all eight scheduled boundaries and automatic completion at 120 simulation seconds, with a recorded decision, over HTTP/WebSocket at 10x speed.
- Three isolated browser contexts passed Instructor/Commander/Team room creation and joining, shared movement, pause/resume, disconnect/rejoin, delay/dropout, conflicting reports, stale/unavailable maps, hidden UAV deployment, intelligence relay, decision rationale, JSON export and the real AAR page. Unknown room IDs showed a server error without sample results. No browser page errors occurred.
- Frontend protocol checks passed for malformed packets, room identity, event notices, delivery deduplication and real pending/final AAR responses. TypeScript and the optimized Next.js production build passed.

These results cover local integration. No current deployed-backend, real cloud-credential roundtrip or production authentication claim is made by this checklist. Optional Firestore cloud verification remains the procedure in [firestore.md](firestore.md).

Review scope also includes the independent timeline/delivery/decision regression tests, geography and multi-terrain domain safety, large checkpoint publication/recovery, malformed socket input, request deduplication, CSV formula protection and missing-room AAR behavior. A running-server smoke proves HTTP/WebSocket transport; it does not prove every deployment provider or all possible network failures.
