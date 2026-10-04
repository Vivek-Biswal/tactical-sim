# Account roles and instructor setup

TACTICAL-SIM assigns account permissions through the signed Firebase ID-token claim `tacticalRole`. Browser storage, a login form, a URL and a Firestore profile cannot grant instructor access.

| Account claim | Access |
| --- | --- |
| `instructor` | Create exercises; control, inspect and review exercises created by this account |
| `commander` | Join as Commander; view filtered exercise information, record decisions and coordinate units |
| `team` | Join as Team Alpha, Bravo or Charlie; send reports and move the assigned team |
| Claim absent | Commander access |
| Any other claim value | Access denied |

Claims use these exact lowercase values. An exercise's `INSTRUCTOR`, `COMMANDER` and `TEAM_ALPHA`/`TEAM_BRAVO`/`TEAM_CHARLIE` roles are room memberships, not authority to change an account's claim. A team's first join binds its team for that room; reconnecting cannot select a different team. Changing an account claim while a room is active can make its existing membership incompatible, so create or join an appropriate new room after a role change.

Live AAR preview requires the creating Instructor account and room key. Once the exercise is completed, authenticated fixed room members can read/export the full educational debrief, including missed transmissions and previously concealed events. This preserves decision review without exposing those records in active trainee feeds. An authenticated account without a fixed room membership cannot read its final AAR. New participants cannot join an exercise after completion; existing participants can reconnect to review their exercise.

The first user-confirmed, existing Google account has been provisioned as Instructor in `tactical-sim-d3bf4`. The change was checked with an Auth account lookup afterward; no other users were changed. Sign out and sign back in to receive the new claim. This confirms provisioning, not an end-to-end Google login or deployed-backend test.

## Assign another account safely

1. Have the person create their Firebase Auth account through the website. For an Instructor, verify the email first. The tool below requires an existing, enabled account and refuses to create accounts or enable disabled accounts.
2. Run the tool from the repository root using a trusted operator's Google Application Default Credentials (ADC), or a service-account credential available only on that operator's machine. Firebase CLI login and browser Firebase configuration are separate from ADC. The operator needs `firebaseauth.users.get` for the preview and `firebaseauth.users.update` for assignment. These are the documented IAM permissions for the [account lookup](https://docs.cloud.google.com/identity-platform/docs/reference/rest/v1/projects.accounts/lookup) and [account update](https://docs.cloud.google.com/identity-platform/docs/reference/rest/v1/projects.accounts/update) APIs.
3. Review the exact project, email/UID, previous role and proposed role in the preview. Add `--apply` only for that reviewed identity.
4. Ask the person to sign out and back in, then reconnect to the exercise. Where the website offers **Refresh account access**, it force-refreshes the claim. Their newly issued ID token carries the new role; an existing token does not change in place. A client can also call `getIdToken(true)` to request a fresh token. [Firebase custom claims](https://firebase.google.com/docs/auth/admin/custom-claims)

The commands below use `teacher@example.com` as a placeholder; replace it with the person's confirmed account email. The backend virtual environment contains the Google authentication dependencies through its existing requirements.

```powershell
# Read-only preview; no claim is written.
.\backend\.venv\Scripts\python.exe scripts/provision_account_role.py --project tactical-sim-d3bf4 --email teacher@example.com --role instructor

# Apply the reviewed role and confirm it with a second account lookup.
.\backend\.venv\Scripts\python.exe scripts/provision_account_role.py --project tactical-sim-d3bf4 --email teacher@example.com --role instructor --apply
```

Use `--uid <confirmed UID>` instead of `--email` when appropriate. Use `--role commander` or `--role team` for other assignments. The output contains account identifiers needed for review, but no credentials, passwords, ID tokens or unrelated claim values. Keep operator outputs private.

If Google Cloud CLI is already installed, its normal local ADC setup is:

```powershell
gcloud auth application-default login
```

This is an interactive operator sign-in, not the Firebase CLI login flow. [Google ADC setup](https://docs.cloud.google.com/docs/authentication/provide-credentials-adc)

Alternatively, point `GOOGLE_APPLICATION_CREDENTIALS` to a private, local service-account credential file. The tool also accepts the existing server-only `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable. Use an identity with the Auth permissions above; Firestore permissions alone do not permit role assignment. Never place these credentials in `NEXT_PUBLIC_*`, commit them, or paste them into a login page. Token verification by the simulation server does not require an Auth-admin credential.

The tool preserves other custom claims and refuses a combined payload larger than 1,000 bytes. Firebase custom claim updates replace the existing claim object, so preserving the other claims matters. [Firebase custom claims](https://firebase.google.com/docs/auth/admin/custom-claims)

It rechecks the account immediately before writing and confirms the result afterward. The REST operation is not a transaction: use one administrator at a time when editing an account's custom claims. If a concurrent edit or an unconfirmed write is reported, inspect the account before retrying. The tool never prints the raw authentication or HTTP error body.

## Backend enforcement and deployment

The backend defaults to `AUTH_MODE=firebase`. Configure the same `FIREBASE_PROJECT_ID` as the frontend (`tactical-sim-d3bf4` here), allow the frontend origin through `CORS_ORIGINS`, and keep Google public-certificate fetching available. Verification checks the ID-token signature, project audience/issuer, expiry, Firebase account identity and recognized claim. Anonymous accounts are rejected.

Exercise REST requests carry `Authorization: Bearer <Firebase ID token>`. WebSockets carry `idToken` in the initial `JOIN`/`JOIN_EXERCISE` packet, rather than in the URL. Instructor commands additionally need the room's `instructorKey`; the account must have the Instructor claim and be the account that created that room. Possessing a room key alone does not grant instructor access. Room IDs and participant links can be shared; keep the instructor key private.

```json
{
  "type": "JOIN",
  "role": "INSTRUCTOR",
  "name": "Exercise instructor",
  "idToken": "<fresh Firebase ID token>",
  "instructorKey": "<creator-only room key>"
}
```

This packet is an illustrative contract example. The server derives the account identity from the verified token. Commander accounts join as `COMMANDER`; Team accounts join as a supported team role, without an instructor key. Both must establish room membership through a successful socket JOIN before reading private state or decisions, or submitting movement, radio or decision requests over HTTP. Failed requests never create membership. Submitted sender/decision identities cannot impersonate another account.

Creator and membership records are stored in the checkpoint's private `scenario._access` field and excluded from trainee state. Legacy checkpoints without an authenticated creator fail closed in Firebase mode; create a new room instead of importing a room key into a different account.

`AUTH_MODE=demo` explicitly permits the existing local development/test role-selection flow. The backend refuses it when a known deployed environment (`RENDER`, `VERCEL`, `K_SERVICE`, or production/staging `ENVIRONMENT`) is detected. Set `AUTH_MODE=firebase` explicitly in production; do not depend only on environment detection. Demo mode is not account authorization.

The verifier currently does **not** consult Firebase token revocation or fetch the live account record on each request. Existing ID tokens can retain their previous role until they expire; WebSocket authority also expires with the presented token. A demotion or disabled account therefore is not an immediate termination mechanism for existing tokens. Operational revocation checks would be an additional backend feature. Reconnecting with a fresh token is necessary after a claim change.

## Firestore profile rules

The deployed and local Firestore rules match. `users/{uid}` accepts exactly six profile fields: `uid`, `email`, `displayName`, `photoURL`, `createdAt` and `lastLoginAt`. Both create and update reject additional fields, including `role`, `tacticalRole` and `isAdmin`. The browser profile transaction replaces this six-field document; it does not store account authority.

Reads and writes are limited to the signed-in account's own profile. Email must match the token, field types and lengths are checked, `createdAt` stays immutable, and login timestamps use server time. Profile listing/deletion and all direct browser access to exercise data are denied. Backend IAM access bypasses client Security Rules, so API and socket authorization remain necessary.

See [the rules review](account-role-rules-audit.json). The Firebase rule validator reported no syntax errors. This was a static role/profile-rule audit, not an emulator authorization test or a full security audit of the deployed application. No rule change was needed for signed roles.

## Verification performed

Six local provisioning tests cover claim preservation and payload limits, read-only previews, verified apply/read-back, wrong accounts, disabled/unverified accounts, concurrent changes and writes that do not persist. Ruff passed for the tool and its tests. These mocked API tests do not exercise ADC credentials or Google IAM. The initial live account assignment was independently confirmed through the connected Firebase Auth tool; subsequent Google sign-in and deployed REST/socket flows require their own checks.

```powershell
.\backend\.venv\Scripts\python.exe -m unittest discover -s backend/tests -p test_account_role_provisioning.py -v
.\backend\.venv\Scripts\python.exe -m ruff check scripts/provision_account_role.py backend/tests/test_account_role_provisioning.py
```
