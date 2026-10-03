const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, esModuleInterop: true } }).outputText, filename);
};
const { LocalSimulationEngine } = require("../src/simulation/lib/simulation.ts");
const { isExerciseState, parseSharedPacket, isServerAARReport } = require("../src/simulation/lib/sharedProtocol.ts");
const engine = new LocalSimulationEngine("protocol-example");
const state = engine.getState();
const copy = value => JSON.parse(JSON.stringify(value));
try {
  assert.equal(isExerciseState(state, state.exerciseId), true);
  assert.equal(parseSharedPacket(JSON.stringify({ type: "STATE_UPDATE", state }), state.exerciseId).type, "STATE_UPDATE");
  assert.equal(isExerciseState(state, "another-room"), false, "cross-room snapshots are rejected");
  for (const mutation of [
    value => { value.status = "UNKNOWN"; },
    value => { value.messages = [{ id: "broken", content: "Bad frame" }]; },
    value => { value.units[0].x = Infinity; },
    value => { value.trainingArea.latitude = NaN; },
    value => { value.activeDecisionPoint = { availableActions: [null] }; },
  ]) {
    const malformed = copy(state); mutation(malformed);
    assert.equal(isExerciseState(malformed, state.exerciseId), false);
  }
  const event = parseSharedPacket(JSON.stringify({ type: "SCENARIO_EVENT", event: "RADIO_DELAY", timestamp: 20, title: "Radio delayed", description: "Reports arrive later." }), state.exerciseId);
  assert.equal(event.notice.title, "Radio delayed");
  assert.equal(event.notice.timestamp, 20);
  assert.deepEqual(parseSharedPacket(JSON.stringify({ type: "ACK", requestId: "request-1", result: { deliveryStatus: "DELAYED" } }), state.exerciseId).result, { deliveryStatus: "DELAYED" });
  assert.throws(() => parseSharedPacket(JSON.stringify({ type: "ACK", requestId: "request-1", result: 4 }), state.exerciseId));
  assert.throws(() => parseSharedPacket(JSON.stringify({ type: "STATE_UPDATE", state: {} }), state.exerciseId));
  assert.throws(() => parseSharedPacket("not JSON", state.exerciseId));
  assert.equal(parseSharedPacket(JSON.stringify({ type: "TEAM_MESSAGE", sender: "Alpha", message: "Delivered report", timestamp: 21 }), state.exerciseId).type, "IGNORED", "delivery envelopes never duplicate authoritative messages");
  const report = { ...engine.generateAAR(), isFinal: false };
  assert.equal(isServerAARReport(report, state.exerciseId), true);
  assert.equal(isServerAARReport({ ...report, startedAt: null, completedAt: null }, state.exerciseId), true, "pending instructor previews have nullable timestamps");
  assert.equal(isServerAARReport({ ...report, startedAt: "yesterday" }, state.exerciseId), false);
  assert.equal(isServerAARReport({ ...report, stats: { ...report.stats, messagesDelivered: -1 } }, state.exerciseId), false);
  assert.equal(isServerAARReport(report, "another-room"), false);
  console.log("PASS: room/state validation, malformed-frame guards, scenario notices, ACKs, delivery-envelope deduplication and AAR validation.");
} finally { engine.dispose(); }

async function liveCheck(base) {
  const request = async (path, options = {}) => {
    const response = await fetch(`${base}/api${path}`, { ...options, headers: { "Content-Type": "application/json", ...options.headers }, signal: AbortSignal.timeout(10000) });
    assert.equal(response.ok, true, `live request ${path}: ${response.status}`);
    return response.json();
  };
  const room = await request("/exercises", { method: "POST", body: JSON.stringify({ teamName: "Frontend contract verification", isDemoMode: true }) });
  const id = room.exerciseId;
  const headers = { "X-Instructor-Key": room.instructorKey };
  try {
    assert.equal(isExerciseState(room, id), true, "actual FastAPI-created state matches the frontend contract");
    const preview = await request(`/exercises/${id}/aar`, { headers });
    assert.equal(isServerAARReport(preview, id), true);
    assert.equal(preview.startedAt, null);
    assert.equal(preview.isFinal, false);
    await request(`/exercises/${id}/end`, { method: "POST", headers });
    const final = await request(`/exercises/${id}/aar`);
    assert.equal(isServerAARReport(final, id), true);
    assert.equal(final.isFinal, true);
    console.log("PASS: real FastAPI create response, nullable instructor preview, ended-room final AAR and public review contract.");
  } finally { await request(`/exercises/${id}/end`, { method: "POST", headers }); }
}
if (process.argv.includes("--live")) liveCheck(process.argv[process.argv.indexOf("--live") + 1] || "http://127.0.0.1:8000").catch(error => { console.error(error.message); process.exitCode = 1; });
