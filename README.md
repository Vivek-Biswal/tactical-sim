# TACTICAL-SIM

Immersive decision-making training for degraded communication environments. Problem statement 26248.

Kakul's cream-and-olive Next.js application is the only frontend. The interactive React/TypeScript/SVG tactical map lives under src/simulation. The FastAPI backend now runs shared exercises with an authoritative clock, degraded radio, frozen map snapshots, team movement and actual decision/AAR records.

## Run locally

```powershell
npm ci
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements-dev.txt
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

Rooms are in server memory: export before restarting or resetting. Participant roles are self-selected; instructor controls require a separate room key. This is a local training prototype, without production identity authorization or persistent storage.

The independent browser-only demo remains at /commander/simulation/ex-001 and works without a backend. Its local state resets on refresh. Other pre-existing dashboard sample cards remain presentation data.

## Verification

```powershell
./scripts/test-backend.ps1
node scripts/verify-offline-simulation.cjs
node scripts/verify-tactical-map.cjs
npx tsc --noEmit
npm run build
```

The build fetches the existing Google fonts. Backend tests cover timeline and movement, degradation, private information, decisions, actual AAR, validation, room isolation and multiple WebSocket clients.

## Deployment

Vercel **Root Directory must be blank or .**, not frontend. The former duplicate frontend directory was removed. Root vercel.json builds Next.js.

Deploy FastAPI separately to a service that supports persistent WebSockets. Set NEXT_PUBLIC_API_BASE_URL and NEXT_PUBLIC_WS_BASE_URL for the frontend, and CORS_ORIGINS for the backend. Use HTTPS/WSS in deployment. Run one backend worker while storage is in memory. No deployment or GitHub push is performed by these local changes.
