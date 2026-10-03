# Firestore persistence

## Provisioned database

Project: `tactical-sim-d3bf4` (TACTICAL-SIM). Default database: `(default)`, Standard edition, Native mode, Mumbai `asia-south1`.

Rules and indexes are deployed. The browser may read and update only its own validated `users/{uid}` profile. Profile creation time is immutable; login timestamps use server time. All exercise data is denied to browser SDKs. Backend IAM credentials bypass these rules.

## Enable on Render

1. In Google Cloud IAM for this project, create a dedicated backend service account with **Cloud Datastore User** (`roles/datastore.user`). Do not give it Owner or Editor.
2. Create its JSON key and upload it directly as a Render **Secret File** named `firebase-service-account.json`. Do not paste the key into chat, commit it, or add it to Vercel/browser variables.
3. Set these backend environment variables:

```text
STORAGE_BACKEND=firestore
FIREBASE_PROJECT_ID=tactical-sim-d3bf4
FIRESTORE_DATABASE_ID=(default)
FIRESTORE_CHECKPOINT_SECONDS=5
GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/firebase-service-account.json
```

Alternatively, a server-only secret `FIREBASE_SERVICE_ACCOUNT_JSON` may contain the complete JSON credential. Use one credential method.

4. Deploy this backend code with `pip install -r requirements.txt`; keep **one** Uvicorn worker and one service instance. The existing simulation engine is in-process and must not have multiple authoritative writers.
5. Redeploy the frontend to include the corrected profile transaction. Existing `NEXT_PUBLIC_FIREBASE_*` variables remain browser configuration.
6. Check backend `/api/health`: expect `storage: firestore` and `persistenceStatus: connected`. Create an exercise, run it, submit a decision and end it. Confirm an `exercises/{id}` document exists in Firebase Console. Restart Render, reopen that room and verify its AAR. A running exercise should reopen paused, with its original instructor key retained in the original browser.

The cloud database and rules are ready. Deployed backend persistence is **not enabled** until these credentials, environment variables and code are deployed. Without configuration, the backend deliberately remains in memory mode. Explicit Firestore mode fails startup if it cannot connect.

## Storage and recovery

FastAPI remains the single source of truth. Both SVG and Cesium views use its existing simulation state. Browser-only offline exercises remain local and are not uploaded.

`exercises/{id}` stores metadata and the current snapshot pointer. `exercises/{id}/snapshots/{snapshotId}/chunks/{index}` stores compressed JSON, split into 450 KB chunks to avoid Firestore document limits. Chunks are written before publishing the pointer; incomplete writes cannot replace the last complete checkpoint. Old published snapshots are cleaned after replacement. A crash during publication can leave orphan snapshots; there is no automatic retention/cleanup job yet.

Checkpoints preserve simulation truth, stale reported state, delayed messages, movement, scenario events, decisions, rationale and the private instructor key. AAR JSON/CSV is regenerated through the existing engine. Database latency does not block simulation ticks: a background writer coalesces checkpoints and retries failures. Health reports `degraded` after a write failure. Abrupt termination can lose changes since the last successful write; this is checkpoint persistence, not synchronous durable acknowledgement of every action.

Startup restores active rooms first, then completed rooms, up to the existing 128-room capacity. Archived rooms can be loaded by their ID when capacity is available. Running rooms recover paused; no offline elapsed time is simulated. Reset intentionally replaces the exercise history. In-memory expiry does not delete Firestore records.

Firebase sign-in currently provides frontend identity. Backend endpoints retain their existing participant and instructor-room-key policy; this change does not add Firebase ID-token enforcement to the API.

## Validation

Backend tests cover recovery of private truth versus stale feeds, delayed radio, instructor keys, completed AARs, large chunked checkpoints, failed publication and nonblocking background writes. Frontend production build and targeted lint pass. Remote database edition/location and deployed rules were verified. A real backend credential-based cloud roundtrip remains a deployment check. Firestore emulator rule tests were not run because the installed Java runtime is Java 8.

To redeploy rules/indexes:

```powershell
npx firebase-tools deploy --only firestore --project tactical-sim-d3bf4
```
