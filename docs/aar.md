# After-action review

The existing `/aar/[id]` route, shared-room review and local-practice review use the same components in `src/components/aar`. They consume simulation records; the analysis adapter in `src/simulation/lib/aar.ts` does not advance or replay a second simulation.

## Recorded context

- Decisions capture submission time, the linked prompt time, action, user-selected confidence, rationale, radio/map states, received report IDs and a copy of the visible map snapshot.
- `generatedSecond`, `deliveredSecond`, `decisionRequiredSecond` and `responseLatencySeconds` use **simulation seconds**, including accelerated practice and paused clocks. Start/end times use wall time. Local wall timestamps are milliseconds; backend wall timestamps are seconds.
- Later delivery and dropped attempts never become available in an earlier decision snapshot. Older records without snapshot IDs use delivery time and, for equal timestamps, recorded event order. Unresolved availability remains unknown.
- Latency is measured only against a recorded, linked decision prompt. Unprompted decisions and older records without that link show “Not available.”
- `wasDelayed` preserves delay history after successful delivery. Pending transmissions appear once even when both backend arrays reference them.
- Reliability and confirmation are recorded metadata. Conflict labels are not a correctness assessment. Information requests have no structured event type and remain “Not available”; they are not inferred from text.

## Access and storage

Shared records retain existing server authorization: only the room creator with the room key can preview a live AAR; joined participants can view the final report. Final debriefs release exercise truth while keeping original decision snapshots unchanged. Existing Firestore persistence continues to store server records.

Local practice saves its last completed report per exercise and Firebase account in browser storage (`tactical-sim:aar:v1:<account>:<exercise>`). Unauthenticated localhost practice uses a separate local namespace. Account changes remount practice engines. Reset clears the active practice but leaves its last completed review available until another completed practice replaces it. Disabled/full browser storage does not stop an exercise; export from the practice review if storage is unavailable. Local records do not sync to the server.

## Reviewing and exporting

The timeline supports category filters, expandable events, 50-event pages and a selected decision's ±20-second context. Reports have 30-item pages and display generation, receipt, delivery outcome, reliability, conflict links and availability at the selected decision.

JSON contains the exercise record plus derived review observations. CSV contains decision context and response times, with spreadsheet formula escaping. Existing backend export routes remain compatible and add timing/snapshot columns after the original columns. Print / Save PDF uses a complete, unfiltered print document with escaped recorded content and the browser print dialog; it does not require a PDF service.

## Validation

```powershell
node scripts/verify-aar.cjs
node scripts/verify-offline-simulation.cjs
node scripts/verify-shared-protocol.cjs
./scripts/test-backend.ps1
npm run build
```

Browser flow: start local practice → observe radio degradation → open Decisions → enter rationale and confidence → submit an action → Review & export → end practice → open full review. Select a decision, inspect its information snapshot and jump to surrounding events. Check narrow widths and both export formats. A final report can contain queued or dropped conflicting reports even when they were unavailable to the trainee at submission.
