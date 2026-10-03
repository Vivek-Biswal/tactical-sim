# Backend integration API

Use this document with [the runbook](backend.md) and the running server's `/docs` or `/openapi.json`. The examples are illustrative requests and response excerpts, not records of an actual exercise. The existing frontend contract remains canonical; the conceptual object names in Varun's work file do not require renaming existing fields.

## Addresses and room setup

Local HTTP base: `http://127.0.0.1:8000/api`. WebSocket base: `ws://127.0.0.1:8000`. Deployed addresses must use HTTPS/WSS. Paths below include `/api`; do not append a second `/api` when using `NEXT_PUBLIC_API_BASE_URL`.

1. `POST /api/exercises` creates a pending room. `POST /api/exercises/start` creates and starts one immediately.
2. Keep the returned `exerciseId` and the creator-only `instructorKey`. Share the room ID/participant link, not the key.
3. Connect participants to `/ws/exercises/{exerciseId}` and send `JOIN` within ten seconds.
4. The server owns the clock. Render `STATE_UPDATE.state`; use command acknowledgements to confirm mutations.
5. End the room, then fetch/export its AAR. Reset intentionally clears the room's history.

Creation body:

```json
{
  "scenarioId": "scenario-op-silent-link",
  "teamName": "Task Force Alpha",
  "isDemoMode": true,
  "speedMultiplier": 1,
  "trainingArea": {
    "id": "nilgiri-demo",
    "forceProfile": "army"
  }
}
```

All fields have defaults. The scenario ID also accepts `demo`. Demo duration is 120 simulation seconds; `isDemoMode: false` selects 900 seconds. Speed must be between 0.25 and 10. A known area ID supplies its canonical name, coordinates and dimensions; supported force profiles come from `GET /api/scenarios/training-areas`. A preset's bounds cannot be spoofed or changed. The legacy/default Nilgiri area without a force profile retains its original two-team setup.

Creation returns HTTP 201 with the state and `instructorKey`. The key is omitted from ordinary state reads and participant joins. Root health is `GET /`; detailed health is `GET /api/health` and includes `storage`, `persistenceStatus` and `rooms`.

## HTTP endpoints

| Method and path | Body or query | Access and result |
| --- | --- | --- |
| GET `/api/scenarios` | None | Scenario list |
| GET `/api/scenarios/{id}` | `scenario-op-silent-link` or `demo` | Scenario and scheduled events; unknown IDs return 404 |
| GET `/api/scenarios/training-areas` | None | The India location/terrain/profile catalog |
| POST `/api/exercises` | Creation object above | 201, pending state and creator key |
| POST `/api/exercises/start` | Same creation object | 201, running state and creator key |
| GET `/api/exercises` | None | Loaded-room summaries |
| GET `/api/exercises/{id}` | Optional `X-Instructor-Key` | Trainee state; a valid room key additionally permits instructor truth |
| POST `/api/exercises/{id}/control` | Control object below | Instructor key; updated state |
| POST `/api/exercises/{id}/inject` | `action`, optional `payload` | Instructor key; updated state |
| POST `/api/exercises/{id}/event` | Uppercase `type`, optional `payload` | Instructor key; updated state |
| POST `/api/exercises/{id}/messages` | `content`, optional `sender`/`senderRole` | Prototype participant endpoint; submitted radio record |
| POST `/api/exercises/{id}/movement` | `unitId`, `x`, `y` | Prototype participant endpoint; updated state |
| POST `/api/exercises/{id}/decision` | Decision object below | Prototype participant endpoint; 201, recorded decision |
| GET `/api/exercises/{id}/decisions` | None | Room's recorded decisions |
| POST `/api/exercises/{id}/end` | No body required | Instructor key; completed state |
| GET `/api/exercises/{id}/aar` | Optional `X-Instructor-Key` | Full AAR after completion; instructor key permits live review |
| GET `/api/exercises/{id}/aar/export` | `format=json` or `format=csv` | Same AAR access; attachment response |

Supply privileged requests with `X-Instructor-Key: <room key>`. Unknown rooms return 404. Invalid typed bodies return 422; invalid state transitions/domain movement return 409; privileged mutations without a valid key return 403. Full AAR requested by a participant before completion returns 409. An ordinary state request with an invalid key returns filtered participant state.

Control bodies:

```json
{"action":"start"}
{"action":"pause"}
{"action":"resume"}
{"action":"set_speed","speedMultiplier":2}
{"action":"set_training_area","trainingArea":{"id":"chilika-lake","forceProfile":"navy"}}
{"action":"end"}
{"action":"reset"}
```

Choose the training area while pending. Pause/resume affect timer, movement and delayed radio delivery together. Reset requires pending, paused or completed state and retains the room ID, instructor key, selected area and speed. End remains available at record limits. Scheduled events still occur after manual injects; an inject does not cancel the remainder of the scenario.

Instructor inject actions: `delay_radio`, `drop_radio`, `restore_radio`, `conflicting_report`, `outdate_map`, `unavailable_map`, `restore_map`, `new_intelligence`, `custom_message`, `decision_required`, `deploy_uav`.

```json
{"action":"delay_radio","payload":{"delay":3}}
{"action":"conflicting_report","payload":{"reportA":"Activity west of the route.","reportB":"Activity east of the route; first report unconfirmed."}}
{"action":"new_intelligence","payload":{"content":"New activity reported. Verify its identity independently."}}
{"action":"new_intelligence","payload":{"message":"New activity reported.","reliability":"MEDIUM"}}
```

The `/event` route accepts uppercase scenario types such as `RADIO_DELAY`, `RADIO_DROPOUT`, `CONFLICTING_REPORT`, `MAP_OUTDATED`, `NEW_INTELLIGENCE`, `DECISION_REQUIRED` and `TEAM_MOVEMENT`, plus radio/map restoration and unavailable-map types. End an exercise through `/end` or a control command. Radio delay uses simulation seconds. Delayed packets remain queued when paused. Radio dropout drops new packets and flushes queued packets; none of their bodies enter trainee state. The canonical drop log type is `MESSAGE_DROPPED`, representing the work file's radio-message-drop outcome without creating duplicate log records. Scenario intelligence uses a separate relay and does not restore the tactical radio.

Radio and intelligence payloads accept `message` as an alias for `content`. Send one name, not both. Intelligence reliability accepts `low`, `medium`, `high` or `unverified`, case-insensitively, and retains the normalized value in reports/messages/AAR. Reliability is a supplied exercise label, not a calculated truth score.

Participant examples:

```json
{"content":"Checkpoint reached","sender":"Alpha","senderRole":"TEAM_ALPHA"}
{"unitId":"unit-alpha","x":300,"y":380}
{"decision":"Hold and verify","rationale":"Reports disagree and the radio is offline.","confidence":"medium","traineeId":"Commander"}
```

Decision confidence accepts `low`, `medium` or `high` case-insensitively; responses retain the lower-case form. `selectedActionId` is optional and must name a currently active decision action when provided. The server generates timestamps, knowledge snapshots and communication/map context; client-supplied snapshots are rejected. Movement requires a running exercise and a friendly unit; participant movement additionally requires a current map. Coordinates are within the shared 800 × 600 grid. Training profiles validate the entire straight route against their schematic land/water mask; manual orders replace automatic patrols.

## State fields and visibility

| Existing frontend field | Meaning | Work-file compatibility |
| --- | --- | --- |
| `exerciseId` | Room ID | Same |
| `status` | `pending`, `running`, `paused`, `completed` | Existing lower-case values are retained |
| `elapsedSeconds` | Authoritative simulation time | `elapsedTime` alias |
| `commsStatus` | Lower-case communication condition | `radioStatus` uppercase alias |
| `radioDelaySeconds` | Delay in simulation seconds | `radioDelay` alias |
| `mapStatus` | `current`, `outdated`, `unavailable` | Existing lower-case values are retained |
| `units` | Received/last-known unit feed | `teams` alias with the same filtering |
| `activityMarkers` | Received/last-known activity feed | `activities` alias with the same filtering |
| `reports` | Delivered radio or relay observations | Same |
| `messages` | Delivered messages for trainees | Same |
| `pendingMessages` | Queued metadata/countdown, blank content | No withheld body |
| `currentEvent` | Latest visible event object or null | Object, not only an event-type string |
| `eventLog` | Latest 100 visible log records | Event history |
| `activeDecisionPoint` | Current prompt and available actions | Commander decision UI |
| `availableInformation`, `unavailableInformation` | Server's knowledge summary | Decision/AAR context |
| `trainingArea` | Selected location and force profile | Shared by SVG and Cesium |
| `revision` | State/event change counter | Helps clients observe updates |
| `connectedTrainees` | Joined roles/names in this room | Added by HTTP/WS integration |

Current maps update from authoritative positions. Outdated maps retain the last snapshot, including headings/status/destinations, while truth continues privately. Unavailable maps send empty unit and activity arrays. The instructor's state may include `trueUnits`; participant state excludes truth and hidden movement events while map information is degraded. Pending/dropped message bodies never enter trainee state. A sender's HTTP submission response may echo that sender's own packet; this does not constitute delivery to teammates.

Decision records retain `simulationSecond`, `realTimestamp`, rationale, confidence, communication/map state, available/unavailable information, received report IDs, and displayed-unit/location snapshots. Full AAR preserves the event and message-delivery timeline, initial units, decisions and factual counts. It supplies no tactical correctness or combat score. JSON is the full report; CSV exports decision rows with knowledge context and escapes formula-like values.

## WebSocket commands and responses

Canonical socket path: `/ws/exercises/{exerciseId}`. `/ws/exercise/{exerciseId}` is an existing alias. The first command is a join; it needs no request ID:

```json
{"type":"JOIN","role":"COMMANDER","name":"Alice"}
{"type":"JOIN","role":"TEAM_ALPHA","name":"Alpha"}
{"type":"JOIN","role":"INSTRUCTOR","name":"Instructor","instructorKey":"<room key>"}
```

`JOIN_EXERCISE` is a compatibility alias for `JOIN` with the same fields and access checks. Roles: `COMMANDER`, `TEAM_ALPHA`, `TEAM_BRAVO`, `TEAM_CHARLIE`, `INSTRUCTOR`. Names must be 1–80 characters. The server sends `JOINED`, then `STATE_UPDATE`. A room key is required for instructor joins. Team roles can move only their corresponding `unit-alpha`, `unit-bravo` or `unit-charlie`; Commander submits decisions and can command friendly units. Instructor performs controls/injects and can see private truth. A join does not create a unit absent from that scenario.

After joining, each command needs a unique `requestId` (1–80 characters):

```json
{"type":"RADIO_MESSAGE","requestId":"radio-1","payload":{"content":"Checkpoint reached"}}
{"type":"TEAM_MOVEMENT","requestId":"move-1","payload":{"unitId":"unit-alpha","x":300,"y":380}}
{"type":"DECISION_SUBMIT","requestId":"decision-1","payload":{"decision":"Hold","rationale":"Verify the conflicting observations","confidence":"medium"}}
{"type":"INSTRUCTOR_INJECT","requestId":"inject-1","payload":{"action":"drop_radio"}}
{"type":"EXERCISE_CONTROL","requestId":"control-1","payload":{"action":"pause"}}
{"type":"REQUEST_STATE","requestId":"state-1"}
{"type":"SEND_MESSAGE","requestId":"radio-2","payload":{"message":"Checkpoint reached"}}
```

`SEND_MESSAGE` is a compatibility alias for `RADIO_MESSAGE`; `payload.message` aliases `payload.content`. Radio sender/name and decision trainee identity are assigned from the joined socket, not accepted from client overrides. Instructor/control commands sent by another role are rejected. Accepted commands return an `ACK`; rejected commands return `ERROR` with the request ID when available. A radio ACK states `DELIVERED`, `DELAYED` or `DROPPED`; an ACK confirms application, not guaranteed eventual radio delivery.

```json
{"type":"JOINED","exerciseId":"ex-example","role":"COMMANDER"}
{"type":"ACK","requestId":"radio-1","result":{"messageId":"message-example","deliveryStatus":"DELAYED"}}
{"type":"ERROR","requestId":"inject-1","message":"Instructor access required"}
{"type":"SCENARIO_EVENT","event":"RADIO_DROPOUT","timestamp":80,"title":"Radio net offline","description":"Radio net offline","source":"scenario","payload":{"radioStatus":"OFFLINE","radioDelay":0,"mapStatus":"outdated"}}
{"type":"TEAM_MESSAGE","messageId":"message-example","sender":"Alpha","senderRole":"TEAM_ALPHA","message":"Checkpoint reached","timestamp":30,"channel":"TACTICAL_RADIO"}
```

`STATE_UPDATE` wraps the complete filtered state as `{"type":"STATE_UPDATE","state":{...}}`. Scheduled/scenario notifications use `SCENARIO_EVENT`, including title, description and source. Newly delivered messages also emit `TEAM_MESSAGE`; this includes both tactical-radio packets and intelligence relay reports, distinguished by `channel` (`TACTICAL_RADIO` or `INTELLIGENCE_RELAY`). Queued and dropped packets never emit a body-bearing `TEAM_MESSAGE` to trainees. A new connection receives delivered history in state rather than replaying all old message envelopes.

Event/message-envelope time is simulation time, not Unix time; event-log `second` and `timestamp` identify the same instant. Radio records additionally retain generated/delivered simulation time and real Unix time. Delivered messages appear in both envelopes and state, so consumers should deduplicate by `messageId`/record `id` rather than show two copies or treat every state update as a new packet.

Successful request IDs are remembered for the last 100 commands on each connection; a duplicate gets its previous ACK without applying the command again. This cache is not shared across reconnections. The connection limit is 32 per room; commands are limited to 20 per five seconds. Only JSON text objects up to 16,384 characters are accepted. Malformed commands return errors without replacing room state. Sends have a two-second timeout and dead/slow sockets are removed. A lost connection must rejoin and wait for fresh state. Do not automatically replay unacknowledged commands across reconnects: the first request may already have been applied.

## Prototype access and storage boundaries

Firebase login establishes frontend identity. The backend currently uses independently verified instructor room keys; it does not verify Firebase ID tokens. Participant roles/names are self-selected, and REST participant endpoints are open for prototype integration. These endpoints do not offer production membership authorization. CORS and WebSocket browser-origin checks restrict configured browser origins, not all nonbrowser clients. HTTPS/WSS and exact `CORS_ORIGINS` are required in deployment.

Memory mode loses rooms on process restart. Optional Firestore mode saves private checkpoints with backend IAM credentials; browser Firestore rules deny exercise-data access. Running recovered rooms are paused. Persistence is asynchronous: a command ACK does not prove a cloud write completed. Keep one Uvicorn worker and one service instance; shared simulation truth remains process-owned. See [Firestore setup](firestore.md) for credentials, recovery and deployment verification.
