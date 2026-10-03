# Focused exercise pages

Each exercise has separate URLs for Setup, Tactical map, Situation, Communications, Decisions, and Review & export. Instructors also have an Exercise controls page. Role landing pages remain entry points; the Team page now links to shared training and local practice rather than combining sample chat, tasks, reports and a map.

Examples:

- `/commander/simulation/EX-001/map`
- `/commander/simulation/EX-001/communications`
- `/instructor/exercises/EX-001/controls`
- `/team/simulation/EX-001/map`
- `/training/{roomId}/decisions`
- `/maps/setup` and `/maps/map`

Existing exercise URLs without a section still open the map. Shared room IDs on Commander and Instructor routes retain their server connection and initial role. Shared participants join once per workspace; instructor-only settings remain protected by the existing backend room key.

The `[id]/layout.tsx` boundaries own the session through `ExerciseRouteLayout`. Child pages change the selected view without replacing its local engine or shared WebSocket hook. Form drafts live above the view switch. A full refresh clears local practice, as before; shared rooms remain server-owned and may be rejoined. Different exercise IDs create different workspace sessions.

Map workspaces have a compact header, an initially collapsed sidebar, a dedicated map area and native fullscreen with an accessible fallback message. The 2D SVG and Cesium views still consume the same simulation state. Setup fields and expanded guidance are kept off the map page. Clock output uses whole seconds with fixed-width digits; fractional engine time remains intact for movement and event execution.

Locally verified on 3 October 2026: route navigation preserved the offline clock, sent reports and unsent drafts; pause held the clock; AAR download contained the recorded report. Map sizing passed at 1102×682 and 390×844, and fullscreen expanded the SVG canvas. Three isolated browser participants passed shared navigation, movement, pause/resume, reconnect, delayed/dropped radio, conflicting reports, stale/unavailable feeds, hidden UAV deployment, intelligence, decisions and final AAR/export. No page errors occurred. Simulation, SVG, and geographic regression checks, targeted ESLint, TypeScript and the optimized production build passed.
