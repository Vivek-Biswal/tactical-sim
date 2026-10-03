const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText, filename);
process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8000/api";
const { backendRequest } = require("../src/simulation/lib/backend.ts");
const originalFetch = global.fetch;
function pendingFetch(_url, { signal }) {
  return new Promise((resolve, reject) => {
    const keepAlive = setTimeout(() => resolve(Response.json([])), 10000);
    const abort = () => { clearTimeout(keepAlive); reject(signal.reason); };
    if (signal.aborted) abort(); else signal.addEventListener("abort", abort, { once: true });
  });
}
(async () => {
  try {
    global.fetch = pendingFetch;
    await assert.rejects(backendRequest("/exercises", {}, 20), /did not respond in time.*Retry the connection/);
    let calls = 0;
    global.fetch = (...args) => { calls++; return pendingFetch(...args); };
    await assert.rejects(backendRequest("/exercises", { method: "POST", body: "{}" }, 20), /may have reached the server; check the room list/);
    assert.equal(calls, 1, "Mutations must not be retried automatically");
    const controller = new AbortController();
    const reason = new Error("Page left");
    const request = backendRequest("/exercises", { signal: controller.signal }, 1000);
    controller.abort(reason);
    await assert.rejects(request, error => error === reason);
    global.fetch = async () => { throw new TypeError("Failed to fetch"); };
    await assert.rejects(backendRequest("/exercises"), /Cannot reach the simulation server/);
    global.fetch = async () => new Response("Starting", { status: 503 });
    await assert.rejects(backendRequest("/exercises"), /temporarily unavailable or still starting/);
    global.fetch = async () => new Response("<html>Hosting page</html>");
    await assert.rejects(backendRequest("/exercises"), /valid simulation response/);
    global.fetch = async () => Response.json({ detail: "Instructor key required" }, { status: 403 });
    await assert.rejects(backendRequest("/exercises"), /Instructor key required/);
    global.fetch = async (_url, { signal }) => {
      await new Promise(resolve => setTimeout(resolve, 40));
      assert.equal(signal.aborted, false);
      return Response.json([]);
    };
    assert.deepEqual(await backendRequest("/exercises", {}, 200), []);
    console.log("PASS: request deadlines, caller cancellation, startup/network/invalid-response errors, server validation and no mutation replay");
  } finally { global.fetch = originalFetch; }
})().catch(error => { console.error(error); process.exitCode = 1; });
