# Offline Chakravyuh map integration

## Commit review

Kakul's commits `4966ab0`, `980310e`, `5368262`, `dffeee6`, and `f953e37` build and merge the root Next.js application. The root app provides Chakravyuh's olive/cream design, navigation, role screens, Firebase/demo login, instructor screens, and presentation-oriented AAR. Before integration, the root Commander simulation had static map, situation, communication and decision components with an independent mock clock.

Vivek's commits `a5aa217` and `6a3f8cc` supply the separate `frontend/` application and backend prototype. They include SVG terrain/grid, units and activity markers, a local scenario engine, communication delay/loss/conflicts, decisions and rationale, instructor injects, and richer AAR components. The separate frontend attempts a WebSocket connection and falls back to its local engine. These features were not wired into the root app.

## Integration

Run the root app: `npm ci`, `npm run dev`. Open `/commander/simulation/ex-001` and press Start. This uses the existing fictional Operation Silent Link scenario as a two-minute offline demonstration. The URL ID identifies the local session; it does not load a different instructor-authored scenario.

The root Commander page retains Kakul's shell, navigation, command bar, desktop columns and mobile tabs. Its only changes connect those slots and indicators to `src/components/integration/OfflineExercise.tsx`. Kakul's shared components, authentication and other pages remain unchanged. The adapter reuses her PanelCard and Vivek's engine and tactical components. Most implementation changes are in Vivek's files.

The exercise clock, map, information feed, delivered reports and decisions now share one local engine. Start/pause/resume/reset/end and JSON AAR export are available. Rationale is required before selecting a scenario action. Dropped message contents are withheld from the trainee feed and remain in AAR evidence.

The map uses Chakravyuh colors, keyboard-selectable units, zoom controls, a collapsible legend, actual faction colors and a fictional local coordinate display rather than a fabricated MGRS reference. Current positions track simulation ground truth; outdated positions freeze; unavailable positions and activity markers are hidden. Freshness measures time since the last synchronized position update. Restoration and instructor movement synchronize immediately when the map is current. Scenario telemetry changes now exercise all three states and restore the feed before completion.

## Verification

- `node scripts/verify-offline-simulation.cjs`: movement, frozen stale map, freshness, unavailable/restore, instructor movement, delayed/dropped messages, rationale, AAR and reset.
- Root TypeScript check and targeted ESLint check passed.
- Root production build passed with network access for the existing Google font downloads. The application requires no backend for this offline exercise; a fresh production build still needs those fonts.
- Browser loaded the integrated Commander route and captured no console errors. Browser input and screenshot capture failed in the automation provider, so interactive browser and visual layout checks are unverified.

## Remaining platform scope

This integration is a single Commander session in browser memory. Reloading or leaving the route resets it. It does not implement synchronized multiplayer or connect the root instructor/team screens to this session. Those screens and the root AAR page retain their existing data; use Export AAR on the integrated screen for the actual session report. The separate backend/WebSocket and richer AAR UI remain available for a future shared-session integration. Exported AAR JSON includes decisions, rationale, communication evidence and the event timeline; no training-effectiveness scoring has been validated.
