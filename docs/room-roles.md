# Roles belong to exercise rooms

Every signed-in user can create an exercise or join another person's exercise. Firebase verifies the user's identity; the simulation server determines their role separately for each room.

| Action | Role in that room |
| --- | --- |
| Create a room | Instructor, bound to the creator's Firebase UID |
| Join another person's room | Trainee: Commander or Team Alpha/Bravo/Charlie |
| Reconnect | The same fixed room role |

The same account may be Instructor in one room and Trainee in another. Legacy `tacticalRole` Firebase claims do not grant or restrict room authority. Administrator provisioning is no longer required to become a room creator.

The creator controls setup, exercise clock, disruption injections and live AAR preview. Privileged requests require the creator's verified identity and private room recovery key. A copied key, URL role parameter, browser preference or account claim cannot turn another user into this room's Instructor. Creator and membership records survive checkpoint restoration, reset and training-area changes.

New joining users choose Commander (coordinate units and record decisions) or a field team (report observations and move their team's unit). The first successful socket JOIN fixes that task for the room. Reconnecting cannot switch teams or gain Instructor controls. Failed requests never create membership. HTTP state/decision reads and commands require existing membership.

Completed rooms refuse new participants. Existing participants can reconnect and read/export the full final educational AAR. During training, the full review is restricted to the creator. Reset preserves memberships and reopens the pending exercise to new joins.

## Authentication and deployment

Set `AUTH_MODE=firebase`, the matching `FIREBASE_PROJECT_ID`, and allowed frontend `CORS_ORIGINS` on the backend. HTTP requests use `Authorization: Bearer <Firebase ID token>`; WebSockets send the token in the first JOIN packet, never in the URL. Verification checks Google's signature, Firebase audience/issuer, identity and lifetime. Anonymous users are rejected.

The frontend checks server membership before showing creator controls or recovery-key fields. The authenticated membership response restores the private instructor key only for the verified room creator and uses `Cache-Control: no-store`; trainee responses never contain the key. This lets the creator reconnect after browser storage is cleared or on another browser. The recovered key is retained in the current account's mounted session even when browser storage is unavailable. Account switching discards room sessions/reports, and asynchronous creation/recovery/export handlers cannot write keys or download reports under a different account. Room keys remain scoped to the creator's UID in browser storage.

Explicit local `AUTH_MODE=demo` retains local practice and is refused in recognized deployed environments. Production pages fail closed when Firebase configuration is missing. Legacy checkpoints without an authenticated owner require a new room.

The backend checks expiry but does not consult live token revocation/disabled-account records. Already issued valid tokens may continue until expiry. Firebase profile rules remain unchanged; the server's private checkpoint `scenario._access` stores creators and memberships, omitted from trainee state.

## Verification

Backend tests cover one account creating its own room and joining another, rejection of Instructor impersonation with a copied key, fixed teams, private reads, signed message/decision identity, reset/checkpoint preservation, completed-room membership and actual signature tampering. Frontend checks cover safe destinations, signed-out/public configuration guards, server-membership loading, authenticated transport and account-switch races. Local tests do not prove real Google login or a production deployment.
