# TACTICAL-SIM

Immersive decision-making training for degraded communication environments. Problem statement 26248.

## Frontend

Kakul's cream-and-olive TACTICAL-SIM application is the only frontend. Run all npm commands from the repository root. The former dark COMMAND-X app under `frontend/` has been removed. Its working tactical map, scenario data, simulation engine and types now live under `src/simulation/`, integrated into the Commander screen.

```powershell
npm ci
npm run dev
```

Open `http://localhost:3000` for the reference landing page, `/login` for role selection, and `/commander/simulation/ex-001` for the offline exercise. Start the exercise to run the two-minute timeline. Map selection, zoom, freshness states, degraded reports, decision rationale and JSON AAR export use one local engine.

The screenshots supplied by the user are the visual reference: cream grid backgrounds, olive navigation and buttons, white panels, gold metadata, and TACTICAL-SIM branding. The login elevation label has been moved away from the hero paragraph.

## Vercel

Deploy this repository with **Root Directory set to the repository root (blank or `.`), not `frontend`**. The root `vercel.json` identifies Next.js, `npm ci`, `npm run build` and `.next`. Root Directory is a Vercel project setting and cannot be overridden by that file. An existing deployment remains unchanged until the corrected root app is deployed.

## Verification

```powershell
node scripts/verify-offline-simulation.cjs
npm run build
```

The build fetches the existing Google fonts. Offline exercise runtime needs no backend. The session is in browser memory; refreshing resets it. Instructor and team screens are not synchronized with that local session. Export AAR from the Commander exercise for its actual decision and communication timeline.

## Backend

The FastAPI prototype remains under `backend/`. It is separate from the local offline session; this frontend change does not claim live multiplayer integration.
