> Current policy: every signed-in user can create a room as Instructor and join another as Trainee. Legacy account-role claims are ignored. See [room roles](room-roles.md). Earlier account-provisioning descriptions below are superseded.

# Shared simulation backend

FastAPI owns each shared exercise's clock, events, communication queues, movement, map snapshots and decision records. The root Next.js app connects at /training. Storage uses memory by default, with optional Firestore checkpoints, a two-minute demonstration and a 15-minute training mode. Firebase account authorization is enabled by default. No real military data, weapon effects, combat scoring or tactical correctness claims are included. See the [integration API reference](backend-api.md) for request/response examples, [account-role setup](account-roles.md) for Instructor provisioning, and the [Varun completion checklist](varun-backend-completion.md) for work-file coverage.

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

Configure the frontend's Firebase browser environment and sign in with a provisioned Instructor account. Open http://localhost:3100/training, create a room and connect as Instructor, then press Start. Open the participant link in separate signed-in Commander or Team account browsers and connect with the role permitted by each account. Participant links never include the instructor key. The key is saved under a versioned localStorage entry in the creator's browser; using it elsewhere additionally requires signing in as the same creator account. New accounts without a signed role claim receive Commander access; they cannot promote themselves through a role selector.

For a deliberate local prototype/test session only, set `$env:AUTH_MODE = "demo"` before starting that backend process. Production defaults to Firebase authorization, and demo authentication is refused in known deployed environments. Two-minute `isDemoMode` scenarios do not disable account authorization. A frontend demo session alone does not bypass a Firebase-mode backend.

The backend binds only to 127.0.0.1 by default. For a LAN demonstration, run ./scripts/start-backend.ps1 -BindAddress 0.0.0.0 and configure the following before starting/building the frontend:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://YOUR_LAN_IP:8000/api
NEXT_PUBLIC_WS_BASE_URL=ws://YOUR_LAN_IP:8000
```

Set CORS_ORIGINS in the backend process to the exact frontend origin(s), comma separated. The production CHAKRAVYUH origin is `https://chakravyuh01.vercel.app` (no trailing slash or URL path); append it to the existing Render CORS_ORIGINS value and redeploy the backend whenever the website domain changes. Firebase's authorized-domain list is a separate setting and does not authorize backend requests. Example for LAN practice: http://YOUR_LAN_IP:3100. Default allowed origins cover localhost and 127.0.0.1 on ports 3000 and 3100. WebSocket browser origins are also checked. The backend does not automatically load .env; set environment variables in the launching terminal or use uvicorn --env-file explicitly. A deployed frontend needs an HTTPS API and WSS backend that supports persistent WebSockets. Vercel hosts this Next.js frontend; the Python service runs separately. Run exactly one Uvicorn worker: room state is process-local.

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

Each room has an independent creator, key, event log and message queue. AAR endpoints return 404 for unknown rooms; they never manufacture completed exercises or decisions. Live AAR preview requires the creator's Instructor account and room key. After completion, authenticated fixed room members receive the full educational debrief, including missed/dropped transmissions and previously concealed events, so they can compare what they knew with what they missed. Those bodies/events remain hidden from active trainee state. Final AAR without fixed room membership returns 403. JSON contains the timeline, rationale/confidence, snapshots, initial units and factual metrics. CSV exports decisions with information context; formula-like values are escaped.

## HTTP contract

Swagger: http://localhost:8000/docs. All endpoints below have /api prefix.

| Endpoint | Purpose |
| --- | --- |
| GET /health | Health, storage mode, checkpoint status and loaded room count |
| GET /scenarios, /scenarios/{id} | Built-in scenario catalog |
| GET /scenarios/training-areas | Shared India training-area catalog |
| POST /exercises | Create a pending room; returns instructorKey once |
| POST /exercises/start | Create and immediately start |
| GET /exercises, /exercises/{id} | Room list / trainee state |
| GET /exercises/{id}/membership | Requesting account's assigned room role or null |
| POST /exercises/{id}/control | start, pause, resume, end, reset, set_speed, set_training_area |
| POST /exercises/{id}/inject | Instructor action plus payload |
| POST /exercises/{id}/event | Uppercase scenario event type plus payload |
| POST /exercises/{id}/messages | Participant radio message |
| POST /exercises/{id}/movement | unitId, x, y |
| POST /exercises/{id}/decision | decision, rationale, confidence, traineeId, selectedActionId |
| POST /exercises/{id}/end | End exercise |
| GET /exercises/{id}/decisions | Decision records |
| GET /exercises/{id}/aar | Actual AAR |
| GET /exercises/{id}/aar/export?format=json or csv | Download report |

Exercise endpoints require Authorization: Bearer with a verified Firebase ID token. Instructor controls/injects/events and privileged state/AAR requests additionally require the signed Instructor role, creator identity and X-Instructor-Key. State and decision reads require fixed membership (403 otherwise); participant movement/radio/decision commands require a prior JOIN (409 otherwise). REST requests never create memberships. Missing/expired/invalid tokens return 401, role/creator/key violations return 403, invalid exercise transitions return 409, invalid payloads return 422 and unknown rooms return 404. Reset requires a paused, pending or completed room, retains the creator, memberships and room key, and clears that exercise's history.

State keeps the existing frontend's lower-case status/commsStatus/mapStatus and ExerciseState names. Compatibility fields elapsedTime, radioStatus (uppercase), radioDelay, teams, reports and currentEvent are also provided.

## WebSocket contract

Connect to /ws/exercises/{exerciseId}; /ws/exercise/{exerciseId} is an alias. Send JOIN within ten seconds:

```json
{"type":"JOIN","role":"TEAM_ALPHA","name":"Alpha","idToken":"<fresh Team-account ID token>"}
```

Instructor JOIN also includes instructorKey and must use the creator's Instructor-account token. In Firebase mode, names derive from the account, and Team Alpha/Bravo/Charlie becomes fixed on first join. Receive JOINED, followed by STATE_UPDATE. Each client receives a filtered state and connectedTrainees. Commands use a unique requestId:

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

### Slow initial connection

The shared-exercise lobby allows up to 90 seconds for its first room-list request, to accommodate a hosted backend starting after inactivity. After five seconds it displays a startup hint. If the request fails, use **Retry connection**; room creation remains disabled until a successful room-list response. Local practice is available separately.

Other API requests have a 15-second deadline and readable timeout/network/startup errors. Requests that change state are never automatically retried: a timeout can occur after a room was created or a decision accepted, so inspect the server records before submitting again. Leaving the page cancels the connection request without surfacing a failure.

Run `node scripts/verify-backend-connection.cjs` for timeout, cancellation, transient-server errors, invalid responses, and mutation replay safeguards.

Signed account claims authorize REST/socket participants; client role choices cannot grant instructor access. Commander and Team accounts JOIN before accessing state/decisions or submitting HTTP commands. Team accounts command only their own team; Commander accounts submit decisions. Completed rooms reject new memberships, while existing members and the creator can reconnect. Reset retains these memberships and allows new first joins to the pending exercise. Socket close 4001 requires a refreshed ID token before reconnect; 1008 indicates failed access policy. Token revocation/live-disabled status is not checked, so an already issued token retains its role until expiry. See [account roles](account-roles.md) for provisioning and operational limits.

In memory mode, restarting the server clears rooms. Optional Firestore checkpoints restore saved rooms and AAR data; explicit Firestore configuration requires backend credentials, and a running restored room resumes as paused. Checkpoint acknowledgement is asynchronous, so abrupt termination can lose changes after the last successful write. See [Firestore setup](firestore.md). Run one backend worker and one service instance in either mode.

Completed/pending unconnected rooms leave memory after 24 hours; this does not delete Firestore records. Limits: 128 loaded rooms, 32 connected participants per room, 1000 messages, 200 decisions and 5000 log records for participant/inject commands. Export before reset, expiry or restart. End remains available at the record limit.

```powershell
./scripts/test-backend.ps1
node scripts/verify-offline-simulation.cjs
node scripts/verify-tactical-map.cjs
backend/.venv/Scripts/python.exe test_simulation.py # local demo transport harness; backend must explicitly use AUTH_MODE=demo
npx tsc --noEmit
npm run build
```

Tests cover exact scheduled timestamps, pause, real scheduler clock, delivery queues, dropout flushing, hidden map/activity and message data, per-room isolation, movement bounds/arrival, decision snapshots, multi-client WebSockets, command errors/deduplication, instructor privileges, CSV protection and real AAR exports. The browser-only map demo at /commander/simulation/ex-001 remains independent. Older role dashboard sample cards are presentation data; /training is the shared server workflow. Generated room IDs also open the live workspace through the existing commander/simulation/{id} and instructor/exercises/{id} routes.
