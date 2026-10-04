const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function client(firebase, hostname = "localhost", fetchResponse) {
  const source = ts.transpileModule(fs.readFileSync("src/simulation/lib/backend.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const calls = [];
  const downloads = [];
  const blobUrls = [];
  const context = {
    module, exports: module.exports,
    require: name => { assert.equal(name, "../../lib/firebase"); return firebase; },
    process: { env: { NEXT_PUBLIC_API_BASE_URL: "http://localhost:8000/api" } },
    window: { location: { hostname } },
    Headers, AbortSignal, Promise,
    URL: { createObjectURL: blob => { blobUrls.push(blob); return "blob:test-review"; }, revokeObjectURL() {} },
    setTimeout: callback => { callback(); },
    document: { createElement: tag => { assert.equal(tag, "a"); const anchor = { click() { downloads.push({ href: anchor.href, download: anchor.download }); } }; return anchor; } },
    fetch: async (url, options) => { calls.push({ url, options }); return fetchResponse ? fetchResponse(url, options) : Response.json({ accepted: true }); },
  };
  vm.runInNewContext(source, context);
  return { ...module.exports, calls, downloads, blobUrls };
}

(async () => {
  const firebase = { isFirebaseConfigured: true, auth: { authStateReady: async () => {}, currentUser: { uid: "account-one", getIdToken: async () => "fixture-id-token" } } };
  const live = client(firebase);
  await live.backendRequest("/exercises", { headers: new Headers({ "Authorization": "forged", "X-Instructor-Key": "fixture-room-key" }) });
  assert.equal(live.calls[0].options.headers.get("Authorization"), "Bearer fixture-id-token");
  assert.equal(live.calls[0].options.headers.get("X-Instructor-Key"), "fixture-room-key");
  assert.equal(live.keyStorage("ex-123"), "tactical-sim:v1:instructor:account-one:ex-123");
  assert.ok(!live.socketUrl("ex-123").includes("token"), "Credentials must not appear in socket URLs");
  await assert.rejects(live.getBackendIdentityToken("another-account"), /Sign in again/);
  firebase.auth.currentUser = null;
  await assert.rejects(live.backendRequest("/exercises"), /Sign in again/);
  assert.equal(live.calls.length, 1, "A signed-out configured client must never fall back to unauthenticated requests");
  firebase.auth.currentUser = { uid: "account-two", getIdToken: async () => { firebase.auth.currentUser = { uid: "account-three" }; return "stale-token"; } };
  await assert.rejects(live.backendRequest("/exercises"), /account changed/);
  assert.equal(live.calls.length, 1, "Discard a token if the account changes while it is loading");
  firebase.auth.currentUser = { uid: "account-three", getIdToken: async () => { throw new Error("Fixture refresh failure"); } };
  await assert.rejects(live.backendRequest("/exercises"), /sign-in could not be verified/);
  assert.equal(live.calls.length, 1);
  firebase.auth.currentUser = { uid: "account-three", getIdToken: () => new Promise(() => {}) };
  // Keep Node alive while an AbortSignal deadline fires.
  const keepAlive = setTimeout(() => {}, 1000);
  try {
    await assert.rejects(live.backendRequest("/exercises", {}, 20), /did not respond in time/);
    const controller = new AbortController();
    const pending = live.backendRequest("/exercises", { signal: controller.signal });
    const cancelled = new Error("Left page");
    controller.abort(cancelled);
    await assert.rejects(pending, error => error === cancelled);
  } finally { clearTimeout(keepAlive); }
  const demo = client({ isFirebaseConfigured: false, auth: null });
  assert.equal(await demo.getBackendIdentityToken(), undefined);
  await demo.backendRequest("/exercises");
  assert.equal(demo.calls[0].options.headers.has("Authorization"), false);
  const publicMissingConfig = client({ isFirebaseConfigured: false, auth: null }, "tactical-sim.vercel.app");
  await assert.rejects(publicMissingConfig.backendRequest("/exercises"), /Sign-in is unavailable/);
  assert.equal(publicMissingConfig.calls.length, 0);
  const exportUser = { uid: "export-account", getIdToken: async () => "fixture-export-token" };
  const exportFirebase = { isFirebaseConfigured: true, auth: { authStateReady: async () => {}, currentUser: exportUser } };
  const validExport = client(exportFirebase);
  await validExport.downloadAAR("ex-123", "fixture-room-key", "json");
  assert.equal(validExport.downloads.length, 1);
  assert.equal(validExport.downloads[0].download, "aar-ex-123.json");
  assert.equal(validExport.calls[0].options.headers.get("Authorization"), "Bearer fixture-export-token");
  const staleBeforeFetch = client(exportFirebase);
  exportFirebase.auth.authStateReady = async () => { exportFirebase.auth.currentUser = { uid: "other-account", getIdToken: async () => "other-fixture-token" }; };
  await assert.rejects(staleBeforeFetch.downloadAAR("ex-123", "fixture-room-key", "json"), /account changed or signed out/);
  assert.equal(staleBeforeFetch.calls.length, 0, "never export with a new account's token for an old action");
  exportFirebase.auth.authStateReady = async () => {};
  for (const switchedAccount of [null, { uid: "other-account" }]) {
    exportFirebase.auth.currentUser = exportUser;
    const responseSwitch = client(exportFirebase, "localhost", async () => { exportFirebase.auth.currentUser = switchedAccount; return Response.json({ review: "fixture" }); });
    await assert.rejects(responseSwitch.downloadAAR("ex-123", "fixture-room-key", "csv"), /account changed or signed out/);
    assert.equal(responseSwitch.downloads.length, 0);
    assert.equal(responseSwitch.blobUrls.length, 0);
    exportFirebase.auth.currentUser = exportUser;
    const blobSwitch = client(exportFirebase, "localhost", async () => ({ ok: true, blob: async () => { exportFirebase.auth.currentUser = switchedAccount; return new Blob(["fixture review"]); } }));
    await assert.rejects(blobSwitch.downloadAAR("ex-123", "fixture-room-key", "json"), /account changed or signed out/);
    assert.equal(blobSwitch.downloads.length, 0, "an export completing after sign-out/account switching cannot start a file download");
    assert.equal(blobSwitch.blobUrls.length, 0, "stale report data never obtains a browser object URL");
  }
  console.log("PASS: authenticated HTTP transport, scoped keys, account switching, token failures, cancellation and public fail-closed behavior");
  console.log("PASS: report exports reject account changes before requests, after responses and while reading files; stable-account exports still download.");
})().catch(error => { console.error(error); process.exitCode = 1; });
