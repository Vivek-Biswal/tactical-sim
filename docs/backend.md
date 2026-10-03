# Shared simulation backend

FastAPI owns each exercise's clock, events, communication queues, movement, map snapshots and decision records. The root Next.js app connects at /training. This is a local in-memory prototype, with a two-minute demonstration and a 15-minute training mode. No real military data, weapon effects, combat scoring or tactical correctness claims are included.

## Run on Windows

From the repository root, create an isolated Python 3.11+ environment once:

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements-dev.txt
```

Run these in two terminals:

```powershell
./scripts/start-backend.ps1
```

```powershell
npm run dev -- --port 3100
```

Open http://localhost:3100/training. Create a room, choose a callsign and connect as Instructor. Press Start. Open the participant link in other browser tabs or browsers, choose Commander / Team Alpha / Team Bravo, and connect. Participant links never include the instructor key. The key is saved under a versioned localStorage entry in the room creator's browser; enter it in the instructor join form when using a different browser. Instructor commands do not depend on the frontend's Firebase/demo login.

The backend binds only to 127.0.0.1 by default. For a LAN demonstration, run ./scripts/start-backend.ps1 -BindAddress 0.0.0.0 and configure the following before starting/building the frontend:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://YOUR_LAN_IP:8000/api
NEXT_PUBLIC_WS_BASE_URL=ws://YOUR_LAN_IP:8000
```

Set CORS_ORIGINS in the backend process to the exact frontend origin(s), comma separated. Example: http://YOUR_LAN_IP:3100. Default allowed origins cover localhost and 127.0.0.1 on ports 3000 and 3100. WebSocket browser origins are also checked. The backend does not automatically load .env; set environment variables in the launching terminal or use uvicorn --env-file explicitly. A deployed frontend needs an HTTPS API and WSS backend that supports persistent WebSockets. Vercel hosts this Next.js frontend; the Python service runs separately. Run exactly one Uvicorn worker: room state is process-local.

## Timeline

| Demo second | Event |
| --- | --- |
| 0 | EXERCISE_STARTED — clear radio and moving friendly teams |
| 20 | RADIO_DELAY — 10 simulation seconds |
| 40 | CONFLICTING_REPORT — western/eastern reports, both unverified |
| 60 | MAP_OUTDATED — freeze displayed positions and activity |
| 80 | RADIO_DROPOUT — drop new messages and flush queued transmissions |
| 100 | NEW_INTELLIGENCE — medium-reliability Sector 4 report |
| 110 | DECISION_REQUIRED |
| 120 | EXERCISE_ENDED |

The 15-minute mode scales these times by 7.5. Speed changes scale movement, delays and timeline together. Pause stops all three. Large clock steps are segmented at event, arrival and delivery boundaries; events retain their scheduled timestamps. Instructor injects apply immediately, including while paused, and do not cancel future scheduled events.

The intelligence relay is a distinct exercise channel: it delivers scenario intelligence and contradictory reports while the tactical radio can remain offline. Regular participant reports always follow radio delay/dropout. No report is silently declared the correct answer.

## Map and information boundaries

CURRENT mirrors authoritative units and activities. OUTDATED freezes both, including headings, status and destinations; movement continues privately. UNAVAILABLE sends empty unit/activity arrays. Restoration refreshes the snapshot immediately. Friendly manual movement requires a running exercise and a current map; team WebSocket roles may command only their own team.

Trainee HTTP/WebSocket state excludes trueUnits and queued/dropped message bodies. Pending messages expose metadata and delivery countdowns. Instructor state may include trueUnits. Decision snapshots are taken by the server: received report IDs, available/unavailable information, radio/map condition and the displayed positions. Clients cannot submit their own information snapshots.

Each room has an independent key, event log and message queue. AAR endpoints return 404 for unknown rooms; they never manufacture completed exercises or decisions. Full AAR is instructor-only during an exercise and available to participants after completion. JSON contains the full event and delivery timeline, decision rationale/confidence, snapshots, initial units and factual metrics. CSV exports decisions with information context; formula-like values are escaped.

## HTTP contract

Swagger: http://localhost:8000/docs. All endpoints below have /api prefix.

| Endpoint | Purpose |
| --- | --- |
| GET /health | Health and in-memory room count |
| GET /scenarios, /scenarios/{id} | Built-in scenario catalog |
| POST /exercises | Create a pending room; returns instructorKey once |
| POST /exercises/start | Create and immediately start |
| GET /exercises, /exercises/{id} | Room list / trainee state |
| POST /exercises/{id}/control | start, pause, resume, end, reset, set_speed |
| POST /exercises/{id}/inject | Instructor action plus payload |
| POST /exercises/{id}/event | Uppercase scenario event type plus payload |
| POST /exercises/{id}/messages | Participant radio message |
| POST /exercises/{id}/movement | unitId, x, y |
| POST /exercises/{id}/decision | decision, rationale, confidence, traineeId, selectedActionId |
| POST /exercises/{id}/end | End exercise |
| GET /exercises/{id}/decisions | Decision records |
| GET /exercises/{id}/aar | Actual AAR |
| GET /exercises/{id}/aar/export?format=json or csv | Download report |

Instructor controls/injects/events and privileged state/AAR requests require X-Instructor-Key. Mutations are validated and return 409 for invalid exercise transitions, 422 for invalid payloads, 403 for an absent/wrong key and 404 for unknown rooms. Reset requires a paused, pending or completed room, retains the room key, and clears that exercise's records.

State keeps the existing frontend's lower-case status/commsStatus/mapStatus and ExerciseState names. Compatibility fields elapsedTime, radioStatus (uppercase), radioDelay, teams, reports and currentEvent are also provided.

## WebSocket contract

Connect to /ws/exercises/{exerciseId}; /ws/exercise/{exerciseId} is an alias. Send JOIN within ten seconds:

```json
{"type":"JOIN","role":"TEAM_ALPHA","name":"Alpha"}
```

Instructor JOIN also includes instructorKey. Receive JOINED, followed by STATE_UPDATE. Each client receives a filtered state and connectedTrainees. Commands use a unique requestId:

```json
{"type":"RADIO_MESSAGE","requestId":"example-1","payload":{"content":"Checkpoint reached"}}
{"type":"DECISION_SUBMIT","requestId":"example-2","payload":{"decision":"Hold and verify","rationale":"Reports disagree","confidence":"medium"}}
{"type":"EXERCISE_CONTROL","requestId":"example-3","payload":{"action":"pause"}}
{"type":"INSTRUCTOR_INJECT","requestId":"example-4","payload":{"action":"delay_radio","payload":{"delay":3}}}
{"type":"TEAM_MOVEMENT","requestId":"example-5","payload":{"unitId":"unit-alpha","x":340,"y":300}}
```

ACK confirms application; ERROR explains rejection. SCENARIO_EVENT has event, timestamp and payload. STATE_UPDATE is authoritative; clients do not tick their own simulation. Duplicate requestIds are deduplicated for the last 100 commands on a connection. Command rate is limited to 20 per five seconds. Malformed input receives an error without corrupting the room. Dead/slow sockets are removed; bounded sends prevent indefinite broadcast blocking.

The frontend disables controls when disconnected, marks its retained map as outdated, reconnects with backoff and waits for a fresh state. It does not replay unacknowledged commands: a timeout may mean a command reached the server, so the UI asks the participant to check the timeline before retrying.

## Limits and verification

Participant identity/roles are self-selected in this prototype; this is not production identity authorization. REST participant endpoints support local integration without participant tokens. Instructor keys protect privileged operations independently. Firebase auth is not connected to backend permissions.

Records are not durable: restarting the server clears rooms. Completed/pending unconnected rooms expire after 24 hours. Limits: 128 rooms, 32 connected participants per room, 1000 messages, 200 decisions and 5000 log records for participant/inject commands. Export before reset, expiry or restart. End remains available at the record limit.

```powershell
./scripts/test-backend.ps1
node scripts/verify-offline-simulation.cjs
node scripts/verify-tactical-map.cjs
backend/.venv/Scripts/python.exe test_simulation.py # real HTTP + WebSocket check, backend running
npx tsc --noEmit
npm run build
```

Tests cover exact scheduled timestamps, pause, real scheduler clock, delivery queues, dropout flushing, hidden map/activity and message data, per-room isolation, movement bounds/arrival, decision snapshots, multi-client WebSockets, command errors/deduplication, instructor privileges, CSV protection and real AAR exports. The browser-only map demo at /commander/simulation/ex-001 remains independent. Older role dashboard sample cards are presentation data; /training is the shared server workflow. Generated room IDs also open the live workspace through the existing commander/simulation/{id} and instructor/exercises/{id} routes.
