> Current policy: every signed-in user can create a room as Instructor and join another as Trainee. Legacy account-role claims are ignored. See [room roles](room-roles.md). Earlier account-provisioning descriptions below are superseded.

# Backend integration API

Use this document with [the runbook](backend.md) and the running server's `/docs` or `/openapi.json`. The examples are illustrative requests and response excerpts, not records of an actual exercise. The existing frontend contract remains canonical; the conceptual object names in Varun's work file do not require renaming existing fields.

## Addresses and room setup

Local HTTP base: `http://127.0.0.1:8000/api`. WebSocket base: `ws://127.0.0.1:8000`. Deployed addresses must use HTTPS/WSS. Paths below include `/api`; do not append a second `/api` when using `NEXT_PUBLIC_API_BASE_URL`.

The default `AUTH_MODE=firebase` requires a verified Firebase ID token for exercise requests. Send it as `Authorization: Bearer <ID token>` over HTTP, or as `idToken` in the first socket JOIN packet. Tokens in socket URLs are rejected. Account permissions come from the signed `tacticalRole` claim: `instructor`, `commander`, or `team`; a missing claim defaults to Commander and an unknown value is denied. See [account setup and role provisioning](account-roles.md). The explicit, local-only `AUTH_MODE=demo` retains prototype role selection for tests/development; it is refused in known deployed environments.

1. Sign in with any account. `POST /api/exercises` creates a pending room; `POST /api/exercises/start` creates and starts one immediately. The server records that account as its creator.
2. Keep the returned `exerciseId` and the creator-only `instructorKey`. Share the room ID/participant link, not the key.
3. Connect participants to `/ws/exercises/{exerciseId}` and send `JOIN` with a fresh ID token within ten seconds. The creator joins as INSTRUCTOR; all others join as COMMANDER or a field team, fixed after first joining.
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

Creation returns HTTP 201 with the state and `instructorKey`. The key is omitted from ordinary state reads and participant joins. Root health is `GET /`; detailed health is `GET /api/health` and includes `storage`, `persistenceStatus`, `authMode` and `rooms`. `isDemoMode` selects the scenario duration; it does not bypass Firebase account authorization.

## HTTP endpoints

| Method and path | Body or query | Access and result |
| --- | --- | --- |
| GET `/api/scenarios` | None | Public scenario list |
| GET `/api/scenarios/{id}` | `scenario-op-silent-link` or `demo` | Public scenario/events; unknown IDs return 404 |
| GET `/api/scenarios/training-areas` | None | Public India location/terrain/profile catalog |
| POST `/api/exercises` | Creation object above | Any signed-in account; creator becomes Instructor; 201, pending state and creator key |
| POST `/api/exercises/start` | Same creation object | Any signed-in account; creator becomes Instructor; 201, running state and creator key |
| GET `/api/exercises` | None | Signed account's loaded-room memberships, including its created rooms |
| GET `/api/exercises/{id}` | Optional `X-Instructor-Key` | Fixed room member's filtered state; creator Instructor + valid key permits truth |
| GET `/api/exercises/{id}/membership` | None | Signed account's `accountRole` and fixed room `role` (or null before joining) |
| POST `/api/exercises/{id}/control` | Control object below | Creator Instructor + room key; updated state |
| POST `/api/exercises/{id}/inject` | `action`, optional `payload` | Creator Instructor + room key; updated state |
| POST `/api/exercises/{id}/event` | Uppercase `type`, optional `payload` | Creator Instructor + room key; updated state |
| POST `/api/exercises/{id}/messages` | `content`, optional `sender`/`senderRole` | Fixed room member; Instructor also requires creator/key; submitted radio record |
| POST `/api/exercises/{id}/movement` | `unitId`, `x`, `y` | Joined Commander friendly units; joined Team own unit; creator Instructor + key; updated state |
| POST `/api/exercises/{id}/decision` | Decision object below | Joined Commander account only; 201, recorded decision |
| GET `/api/exercises/{id}/decisions` | None | Fixed room member's decision records |
| POST `/api/exercises/{id}/end` | No body required | Creator Instructor + room key; completed state |
| GET `/api/exercises/{id}/aar` | Optional `X-Instructor-Key` | Creator Instructor + key for live preview; full final debrief for authenticated fixed room members |
| GET `/api/exercises/{id}/aar/export` | `format=json` or `format=csv` | Same AAR access; attachment response |

Exercise routes require `Authorization: Bearer <ID token>`; root/health and GET scenario catalog routes are public. Supply privileged requests with `X-Instructor-Key: <room key>` in addition to the creator's Instructor token. Unknown rooms return 404. Missing/invalid/expired tokens return 401; temporary verification failure returns 503. Invalid typed bodies return 422; invalid state transitions/domain movement and participant HTTP commands before joining return 409; role/creator/key violations return 403. State/decision reads and final AAR without fixed room membership return 403. Trainee AAR before completion returns 409. Providing an invalid or unauthorized instructor key for state/AAR returns 403 rather than silently granting or falling back from truth access.

Membership example after a Team Alpha join:

```json
{"exerciseId":"ex-example","accountRole":"trainee","role":"TEAM_ALPHA"}
```

Membership is private to the requesting account; it is not a directory of user claims. Commander and Team accounts use a known room ID to JOIN before reading state/decisions or sending HTTP commands; they cannot list every server room. Room creation binds the creator, and WebSocket JOIN establishes participant memberships. REST commands never create memberships, including rejected commands. Completed rooms reject first joins but permit existing members to reconnect and review their final AAR. Reset preserves memberships and reopens the pending exercise to new participants. Instructor accounts can access only their own rooms. Changing claims does not reassign a room's fixed membership. Explicit HTTP sender/decision identity fields must match the verified account; omitting them lets the server assign them.

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

Participant examples (the server assigns sender/decision identity from the verified account):

```json
{"content":"Checkpoint reached"}
{"unitId":"unit-alpha","x":300,"y":380}
{"decision":"Hold and verify","rationale":"Reports disagree and the radio is offline.","confidence":"medium"}
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

Decision records retain `simulationSecond`, `realTimestamp`, rationale, confidence, communication/map state, available/unavailable information, received report IDs, and displayed-unit/location snapshots. Firebase-mode records also retain the signed `traineeUid`; radio records retain `senderUid`. During an exercise, live AAR preview requires the creator's Instructor account and room key. After completion, authenticated fixed room members receive the full educational debrief: event and message-delivery timeline, missed/dropped transmissions, previously concealed events, initial units, decisions and factual counts. This lets participants compare what they knew with what they missed; these bodies/events remain hidden from active trainee state. A final member review has `reviewScope: "participant"`; a creator/key preview or review uses `instructor` (`demo` in explicit local demo mode). Reports supply no tactical correctness or combat score. JSON exports the accessible report; CSV exports decision rows with knowledge context and escapes formula-like values.

## WebSocket commands and responses

Canonical socket path: `/ws/exercises/{exerciseId}`. `/ws/exercise/{exerciseId}` is an existing alias. The first command is a join; it needs no request ID:

```json
{"type":"JOIN","role":"COMMANDER","name":"Alice","idToken":"<Commander ID token>"}
{"type":"JOIN","role":"TEAM_ALPHA","name":"Alpha","idToken":"<Team ID token>"}
{"type":"JOIN","role":"INSTRUCTOR","name":"Instructor","idToken":"<Instructor ID token>","instructorKey":"<creator-only room key>"}
```

`JOIN_EXERCISE` is a compatibility alias for `JOIN` with the same fields and access checks. Roles: `COMMANDER`, `TEAM_ALPHA`, `TEAM_BRAVO`, `TEAM_CHARLIE`, `INSTRUCTOR`. Names must be 1–80 characters; in Firebase mode the server uses the verified account's name rather than this client label. The server sends `JOINED`, then `STATE_UPDATE`. Instructor joins require the signed Instructor role, room creator identity and room key. Commander accounts can join only as `COMMANDER`; Team accounts can select a supported team on their first join, then keep that team on reconnect. Team roles can move only their corresponding `unit-alpha`, `unit-bravo` or `unit-charlie`; Commander submits decisions and can command friendly units. Instructor performs controls/injects and can see private truth. A join does not create a unit absent from that scenario.

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
{"type":"ERROR","requestId":"inject-1","message":"Instructor access required","code":403}
{"type":"SCENARIO_EVENT","event":"RADIO_DROPOUT","timestamp":80,"title":"Radio net offline","description":"Radio net offline","source":"scenario","payload":{"radioStatus":"OFFLINE","radioDelay":0,"mapStatus":"outdated"}}
{"type":"TEAM_MESSAGE","messageId":"message-example","sender":"Alpha","senderRole":"TEAM_ALPHA","message":"Checkpoint reached","timestamp":30,"channel":"TACTICAL_RADIO"}
```

`STATE_UPDATE` wraps the complete filtered state as `{"type":"STATE_UPDATE","state":{...}}`. Scheduled/scenario notifications use `SCENARIO_EVENT`, including title, description and source. Newly delivered messages also emit `TEAM_MESSAGE`; this includes both tactical-radio packets and intelligence relay reports, distinguished by `channel` (`TACTICAL_RADIO` or `INTELLIGENCE_RELAY`). Queued and dropped packets never emit a body-bearing `TEAM_MESSAGE` to trainees. A new connection receives delivered history in state rather than replaying all old message envelopes.

Event/message-envelope time is simulation time, not Unix time; event-log `second` and `timestamp` identify the same instant. Radio records additionally retain generated/delivered simulation time and real Unix time. Delivered messages appear in both envelopes and state, so consumers should deduplicate by `messageId`/record `id` rather than show two copies or treat every state update as a new packet.

Successful request IDs are remembered for the last 100 commands on each connection; a duplicate gets its previous ACK without applying the command again. This cache is not shared across reconnections. The connection limit is 32 per room; commands are limited to 20 per five seconds. Only JSON text objects up to 16,384 characters are accepted. Malformed commands return errors without replacing room state. Sends have a two-second timeout and dead/slow sockets are removed. A lost connection must rejoin and wait for fresh state. Do not automatically replay unacknowledged commands across reconnects: the first request may already have been applied.

Socket access expires with the ID token supplied at JOIN. Close code `4001` means refresh the Firebase token before reconnecting; close code `1008` means the join/access policy failed (for example a forbidden account role, creator/key mismatch or invalid identity). An `ERROR` can also include its HTTP-style `code`, such as 401 or 403. Do not repeatedly reconnect a forbidden role or reuse an expired token. Successful reconnect still uses the same fixed room/team membership and starts with a fresh server state.

## Authorization and storage boundaries

Firebase ID-token verification establishes backend identity independently of the browser UI. Instructor privilege additionally requires the creating account and room key; editing storage or presenting a key from another account cannot promote a participant. The private checkpoint `scenario._access` retains creator UID and fixed memberships; it is not exposed in trainee state. Ownerless legacy checkpoints fail closed in Firebase mode and need a new room.

CORS and WebSocket browser-origin checks restrict configured browser origins, not all nonbrowser clients. HTTPS/WSS and exact `CORS_ORIGINS` are required in deployment. The verifier checks signature, project issuer/audience, timestamps, UID and supported role; it currently does not consult token revocation or the live disabled-account record. Previously issued tokens retain their authority until expiry. Sign out/in or force-refresh the ID token and reconnect after a role change; see [the role runbook](account-roles.md) for this operational limitation.

Memory mode loses rooms on process restart. Optional Firestore mode saves private checkpoints with backend IAM credentials; browser Firestore rules deny exercise-data access. Running recovered rooms are paused. Persistence is asynchronous: a command ACK does not prove a cloud write completed. Keep one Uvicorn worker and one service instance; shared simulation truth remains process-owned. See [Firestore setup](firestore.md) for credentials, recovery and deployment verification.
