# Tactical map

The Commander exercise uses the React/TypeScript/SVG map in `src/simulation/components/tactical/TacticalMap.tsx`. It follows CHAKRAVYUH's cream and olive design and requires no external map service.

## Use

Open `/commander/simulation/ex-001`, start the exercise, and select a friendly team. Use **Move team** and click a destination, or enter local X/Y coordinates and select **Set destination**. The engine moves teams at a fictional 20 grid units per simulation second; scenario events may specify a movement duration. Pause stops the clock and movement. Orders and arrivals are recorded in the AAR event log.

Drag empty terrain to pan after zooming. Arrow keys pan; +/− zoom; Escape cancels movement selection. Toolbar buttons reset the view and toggle grid and zones. Markers support mouse and Enter/Space selection. Marker details and the collapsible legend sit below the canvas, keeping terrain unobstructed. Reduced-motion preferences disable visual position transitions.

## Layers

- Local grid A1–P12, sector labels, north arrow and cursor coordinates.
- Fictional hills/contours, forest, river, road, trail, settlement, bridge and headquarters.
- Configurable restricted, assembly and observation polygons via the `zones` prop.
- Friendly, hostile, neutral and unknown units with distinct symbols, heading, position and planned movement route.
- Checkpoint, objective, contact warning and jammer activity with status details. Scenario reports add activity; restoration reflects updated/cleared markers.

## Feed contract

`mapStatus` accepts `current`, `outdated` or `unavailable`; the display labels are uppercase. `units` and `activityMarkers` represent the trainee's visible snapshot, supplied by the simulation engine rather than live ground truth.

- CURRENT: synchronize units and activity from the engine's ground truth.
- OUTDATED: freeze the last synchronized snapshot, show its age, disable new movement orders and hide live positional events from the situation timeline. Ground-truth movement continues during feed loss.
- UNAVAILABLE: hide all positional and activity markers, routes and detail controls; static terrain remains visible.
- Restoring CURRENT synchronizes positions and activity immediately. Reset clears movement plans, decisions and injected state.

The Map feed selector is an offline demonstration control. Scheduled scenario degradation still occurs while the exercise runs. This remains a single browser session; multiplayer synchronization is outside this component's scope.

## Component API

`TacticalMap` accepts `units`, `activityMarkers`, optional `zones`, `mapStatus`, `mapLastUpdated`, `movementEnabled`, `onUnitSelect`, `onUnitMove` and `className`. `onUnitMove(id, {x,y})` delegates the order to the simulation engine. Movement is enabled only for friendly teams in a running exercise with CURRENT feed. SVG definition IDs are scoped with React `useId`, so desktop/mobile maps can coexist.

## Verification

Run `node scripts/verify-tactical-map.cjs` and `node scripts/verify-offline-simulation.cjs`. Checks cover movement and arrival, pause, invalid commands, stale/restore behavior, scenario activity, coordinate bounds, all status renderings, hiding unavailable data and unique SVG IDs. The production build and targeted map/integration ESLint checks also passed. Browser verification covered coordinate movement, arrival after restoration, activity selection, feed switching, zoom and keyboard pan.
