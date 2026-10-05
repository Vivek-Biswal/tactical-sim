const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
for (const extension of [".ts", ".tsx"]) {
  require.extensions[extension] = (module, filename) => {
    module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText, filename);
  };
}
const roles = require("../src/lib/roles.ts");
let session = {
  user: { uid: "test-commander", displayName: "Training account", photoURL: null },
  role: "commander", roleError: "", loading: false,
  isFirebaseConfigured: true, isLocalPracticeAvailable: false,
  logout: async () => {}, refreshAccountAccess: async () => {},
};
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === "@/components/auth/AuthProvider") return { useAuth: () => session };
  if (request === "@/components/ui/Toast") return { useToast: () => ({ addToast: () => {} }) };
  if (request === "next/navigation") return { usePathname: () => "/training/ex-12ab34cd56ef", useRouter: () => ({ replace() {}, push() {} }) };
  if (request === "next/link") return { __esModule: true, default: ({ children, prefetch: _prefetch, scroll: _scroll, ...props }) => React.createElement("a", props, children) };
  if (request === "@/simulation/components/tactical/ExerciseMap") return { ExerciseMap: () => React.createElement("svg", { "data-testid": "map-leaf" }) };
  if (request === "@/simulation/components/geographic/TrainingAreaFields") return { TrainingAreaFields: () => React.createElement("div", { "data-testid": "training-area-fields" }, "Training area options") };
  if (request === "./OfflineExercise" && parent.filename.endsWith("SharedExercise.tsx")) return { OfflineSituation: () => null };
  if (request === "@/simulation/lib/useSharedExercise") return { useSharedExercise() { throw new Error("A socket must not start before the participant connects."); } };
  if (request === "@/simulation/lib/backend") return {
    backendRequest() { throw new Error("Server rendering must not send a backend request."); },
    downloadAAR() { throw new Error("Server rendering must not download a report."); },
    keyStorage: id => `test-room-key:${id}`,
  };
  if (request.startsWith("@/")) return originalLoad.call(this, path.join(__dirname, "../src", request.slice(2)), parent, isMain);
  return originalLoad.call(this, request, parent, isMain);
};
try {
  const { SharedExercise } = require("../src/components/integration/SharedExercise.tsx");
  const { default: TrainingLobby } = require("../src/app/training/page.tsx");
  const room = initialRole => renderToStaticMarkup(React.createElement(SharedExercise, { id: "ex-12ab34cd56ef", initialRole }));
  const selectOptions = markup => [...markup.matchAll(/<select\b[^>]*>(.*?)<\/select>/gs)].map(match => [...match[1].matchAll(/<option\b[^>]*value="([^"]*)"/g)].map(option => option[1]));

  for (const role of ["instructor", "commander", "team"]) {
    session = { ...session, role, user: { ...session.user, uid: `test-${role}` } };
    for (const suppliedRole of ["INSTRUCTOR", "COMMANDER", "TEAM_BRAVO", "unrecognised-role"]) {
      const markup = room(suppliedRole);
      assert.match(markup, /Checking your role in this room/);
      assert.doesNotMatch(markup, /Local test role|Training role<|Local development session/, "signed-in accounts never select their permission level");
      assert.equal(markup.includes("Room recovery key"), false, "server membership must resolve before revealing creator fields");
      const selectors = selectOptions(markup);
      assert.deepEqual(selectors, [], "room forms wait for the server membership response");
    }
    const lobby = renderToStaticMarkup(React.createElement(TrainingLobby));
    assert.equal(lobby.includes("Create instructor room"), true);
    assert.equal(lobby.includes(">Create room</button>"), true);
    assert.equal(lobby.includes('data-testid="training-area-fields"'), true);
    assert.match(lobby, /Join an exercise/);
    assert.doesNotMatch(lobby, /Local development|Local test lobby/);
  }

  session = { ...session, role: null, loading: true };
  assert.doesNotMatch(room("INSTRUCTOR"), /Exercise access|Room recovery key|Connect to exercise/, "claim loading keeps the room form hidden");
  session = { ...session, user: null, loading: false };
  assert.equal(room("INSTRUCTOR"), "", "signed-out users cannot render a role-selecting room form");
  session = { ...session, isFirebaseConfigured: false, isLocalPracticeAvailable: false };
  assert.match(room("INSTRUCTOR"), /Account sign-in is unavailable/);
  assert.doesNotMatch(room("INSTRUCTOR"), /Local test role|Connect to exercise/, "an unconfigured public website cannot expose the demo controls");
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(TrainingLobby)), /Create instructor room/);
  session = { ...session, isLocalPracticeAvailable: true };
  assert.match(room("INSTRUCTOR"), /Local development session/);
  assert.match(room("INSTRUCTOR"), /Local test role/);
  assert.match(room("INSTRUCTOR"), /no authenticated account/);
  console.log("PASS: server membership resolves before room controls; forged role parameters cannot grant access; every signed-in account can create and join; loading, sign-out and public missing-config guards; labelled local demo.");
} finally { Module._load = originalLoad; }
