# Real-world 3D map

The **2D Tactical Map / 3D Real-World Map** toggle is available in shared exercise rooms (including generated Commander and Instructor routes) and the existing offline Commander demo. 2D remains the default and its SVG renderer is unchanged.

## Enable real elevation

1. Create a Cesium ion account at https://ion.cesium.com/.
2. Create a public access token with access to **Cesium World Terrain (asset 1)** and **World Imagery (asset 2)**. Restrict it to your frontend origins, including localhost if you test locally.
3. Add this to the root `.env.local`:
   ```env
   NEXT_PUBLIC_CESIUM_ION_TOKEN=your_public_scoped_token
   ```
4. Restart development, or rebuild production. In Vercel add the same variable as **Config**, select the relevant environments, and redeploy. This browser token is intentionally public; do not use a private upload/write token.
5. Deploy the updated FastAPI backend too. Its environment variables and start command stay the same.

Without a token, Cesium renders an explicitly labelled **ellipsoid preview** using the local, low-resolution earth basemap. It does not claim real elevation. Terrain or imagery failures show a separate service warning, and the 2D simulation remains available. Actual World Terrain needs internet access and WebGL.

Node.js **22 or newer** is required by the pinned CesiumJS 1.146.0 dependency. Runtime, workers and assets are copied from npm into `public/cesium` automatically during installation, development startup and production build. Generated assets are ignored by Git. Cesium itself loads only after switching to 3D; viewer resources are destroyed on leaving that view. Provider credits remain visible.

## Instructor workflow

Open `/training`. Choose the **Nilgiri hills** demo or custom coordinates, set the area extent (200–20,000 metres each way), and create a room. Coordinates describe a geographic centre, not a real deployment or facility. All unit positions, contacts and tactical zones remain fictional exercise overlays.

Connect as Instructor. Before starting, **Training area** can update the geographic placement through the existing authenticated exercise control channel. Once started, the area is fixed for the run. Reset to change it; reset retains the current area and room key.

Start the exercise and switch to 3D. **Deploy simulated UAV** adds one UAV through the existing server engine; it uses the existing clock, movement queue, pause/resume, map degradation and event log. Its altitude is 150 metres above terrain. Repeated deployment is rejected. In a paused exercise the UAV is stationary until movement is ordered after resuming.

Select a unit in the map or unit list. While the exercise is running and the feed is CURRENT, choose **Move on terrain**, then click inside the training boundary, or enter a latitude/longitude destination. The geographic destination is converted back to the existing grid and sent through the same `TEAM_MOVEMENT` command as 2D. Team members retain their existing own-unit permissions.

**OUTDATED** uses the server's last-reported unit/activity snapshot and hides later spatial events. **UNAVAILABLE** hides units, routes, activities and spatial events; static terrain, exercise boundary and training zones remain visible. Returning to CURRENT catches up to the server's latest snapshot. The renderer never reads `trueUnits`. Losing the participant connection retains only the last received snapshot.

## Architecture

- `src/simulation/lib/geography.ts`: location registry, validation, grid ⇄ geographic conversion.
- `src/simulation/lib/geographicOverlay.ts`: a pure projection of reported units, activities, routes, zones and located events. Events without coordinates stay in the existing timeline; no position is invented.
- `src/simulation/components/tactical/ExerciseMap.tsx`: toggle around the untouched SVG renderer and a client-only lazy-loaded Cesium renderer.
- `src/simulation/components/geographic/RealWorldMap.tsx`: Cesium lifecycle, terrain/imagery, entity rendering and geographic movement input.
- `backend/app/schemas/models.py`: additive `TrainingArea` metadata and validated control command.
- Existing FastAPI room state and JSON AAR include `trainingArea`; decision information snapshots also retain it. Existing CSV exports and decision/comms workflows are preserved.

The 800 × 600 grid maps linearly into a small regional area using an equirectangular approximation. North corresponds to y=0. Positions stay canonical grid coordinates in the engine, so both views show the same scenario and clock. Area size changes the geographic scale, not the existing simulation speeds. This addition does not model slope-dependent movement, terrain occlusion of intelligence, flight dynamics or terrain-dependent radio physics.

To add presets, append entries to `TRAINING_AREAS`. Each room stores the selected area's complete metadata, so changing the registry does not move existing exercises. The backend accepts validated custom coordinates rather than depending on frontend preset IDs.

## Verification

```powershell
./scripts/test-backend.ps1
node scripts/verify-geographic-map.cjs
node scripts/verify-tactical-map.cjs
node scripts/verify-offline-simulation.cjs
npx tsc --noEmit
npm run build
```

Tests cover geographic round trips, bounds, coordinate orientation, shared area state over HTTP/WebSocket, instructor authorization, area locking/reset, UAV movement/pause/degradation, AAR metadata, private map state and the original simulation regressions. A live ion token is required to verify actual streamed elevation.
