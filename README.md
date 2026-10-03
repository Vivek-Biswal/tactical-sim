# TACTICAL-SIM

Immersive decision-making training for degraded communication environments. Problem statement 26248.

Kakul's cream-and-olive Next.js application is the only frontend. The interactive React/TypeScript/SVG tactical map lives under src/simulation. The FastAPI backend now runs shared exercises with an authoritative clock, degraded radio, frozen map snapshots, team movement and actual decision/AAR records.

## Run locally

```powershell
npm ci
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements-dev.txt
```

Copy and populate the environment file:

```powershell
Copy-Item .env.local.example .env.local
# Then edit .env.local and fill in your Firebase values (see FIREBASE AUTH SETUP below)
```

Start the backend and frontend in separate terminals:

```powershell
./scripts/start-backend.ps1
```

```powershell
npm run dev -- --port 3100
```

Open http://localhost:3100/training. Create an instructor room and connect. Share its participant link with commander/team browsers, then press Start. Every participant joins the same simulation state. Manual injects, pause/resume, two-minute/15-minute modes and speed controls are available to the instructor. After ending, view/export real AAR records as JSON or CSV.

API documentation: http://localhost:8000/docs. See [backend runbook and contracts](docs/backend.md) for LAN configuration, API/WebSocket examples, data boundaries and prototype limits.

Rooms are in server memory: export before restarting or resetting. Participant roles are self-selected; instructor controls require a separate room key.

The independent browser-only demo remains at /commander/simulation/ex-001 and works without a backend. Its local state resets on refresh. Other pre-existing dashboard sample cards remain presentation data.

When Firebase environment variables are not set the application runs in **demo mode** — users enter a display name and select a role without requiring authentication. Demo mode is the default for local development without Firebase credentials.

## FIREBASE AUTH SETUP

Firebase provides identity (Google Sign-In) and lightweight user records (Firestore). The FastAPI backend continues to own all live simulation state.

### 1. Create / select a Firebase project

1. Go to https://console.firebase.google.com and create (or open) a project.
2. Add a **Web App** inside the project settings and copy the config values.

### 2. Enable Authentication

1. In the Firebase Console → **Authentication** → **Sign-in method**.
2. Enable the **Google** provider.
3. Add your development and production domains to the **Authorised domains** list:
   - `localhost` (for local development)
   - Your Vercel deployment domain (e.g. `tactical-sim.vercel.app`)

### 3. Enable Firestore (optional but recommended)

1. In the Firebase Console → **Firestore Database** → **Create database**.
2. Start in **test mode** for development (add security rules before going to production).
3. User records are written to `users/{uid}` on every successful sign-in.

### 4. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the values from your Firebase Web App config:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abc123
```

> **Security note**: `NEXT_PUBLIC_*` variables are embedded in the browser bundle. Firebase browser SDK configuration (API key, project ID, etc.) is designed to be public. Never place service-account private keys or any server-only secrets in `NEXT_PUBLIC_*` variables.

### 5. Start the application

```powershell
npm run dev -- --port 3100
```

Navigate to http://localhost:3100/login and click **Continue with Google**.

### 6. Vercel / production deployment

Add the same environment variables in the Vercel project dashboard under **Settings → Environment Variables**. The build will pick them up automatically.

Also set:
- `NEXT_PUBLIC_API_BASE_URL` — your deployed FastAPI base URL (e.g. `https://api.your-domain.com/api`)
- `NEXT_PUBLIC_WS_BASE_URL` — your deployed FastAPI WebSocket URL (e.g. `wss://api.your-domain.com`)

## Verification

```powershell
./scripts/test-backend.ps1
node scripts/verify-offline-simulation.cjs
node scripts/verify-tactical-map.cjs
node scripts/verify-geographic-map.cjs
npx tsc --noEmit
npm run build
```

The build fetches the existing Google fonts. Backend tests cover timeline and movement, degradation, private information, decisions, actual AAR, validation, room isolation and multiple WebSocket clients.

## Deployment

Vercel **Root Directory must be blank or .**, not frontend. The former duplicate frontend directory was removed. Root vercel.json builds Next.js.

Deploy FastAPI separately to a service that supports persistent WebSockets. Set NEXT_PUBLIC_API_BASE_URL and NEXT_PUBLIC_WS_BASE_URL for the frontend, and CORS_ORIGINS for the backend. Use HTTPS/WSS in deployment. Run one backend worker while storage is in memory. No deployment or GitHub push is performed by these local changes.

## Real-world 3D map

Shared and offline exercises now offer a 2D / 3D toggle. CesiumJS projects the same reported simulation state onto an instructor-selected geographic area. Add NEXT_PUBLIC_CESIUM_ION_TOKEN to enable Cesium World Terrain and imagery. Without a token the 3D view is clearly labelled as an ellipsoid preview. See [setup and architecture](docs/real-world-map.md).
