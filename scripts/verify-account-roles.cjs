const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const ts = require("typescript");
for (const extension of [".ts", ".tsx"]) {
  require.extensions[extension] = (module, filename) => {
    module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText, filename);
  };
}
const roles = require("../src/lib/roles.ts");
const accountRoles = ["instructor", "commander", "team"];
assert.equal(roles.accountRoleFromClaims({}), "commander", "normal registration cannot assign instructor access");
for (const role of accountRoles) assert.equal(roles.accountRoleFromClaims({ tacticalRole: role }), "commander");
for (const tacticalRole of [null, undefined, "", "admin", "INSTRUCTOR", " instructor ", true, 42, {}, ["instructor"]]) {
  assert.equal(roles.accountRoleFromClaims({ tacticalRole }), "commander", "legacy account claims cannot determine room permissions");
}
for (const role of accountRoles) {
  assert.equal(roles.accountHome(role), "/training");
  for (const routeRole of accountRoles) {
    for (const path of [`/${routeRole}`, `/${routeRole}/simulation/ex-test`, `/${routeRole}/scenarios/create`]) {
      assert.equal(roles.canAccessPath(role, path), true, `${role} access to ${path}`);
    }
  }
  for (const path of ["/maps", "/maps/communications", "/training", "/training/ex-test?role=INSTRUCTOR", "/training#server-exercises", "/aar/ex-test", "/dashboard"]) {
    assert.equal(roles.canAccessPath(role, path), true);
  }
  for (const path of ["https://example.com", "//example.com", "/\\example.com", "/%2fexample.com", "/%5cexample.com", "/%0atraining", "/%252ftraining", "/login", "/unknown"]) {
    assert.equal(roles.canAccessPath(role, path), false, `unsafe or unrecognised destination ${path}`);
    assert.equal(roles.accountDestination(role, path), roles.accountHome(role));
  }
}
for (const path of ["/instructor", "/instructor%2fscenarios", "/commander/../instructor", "/commander/%2e%2e/instructor", "/instructor?role=commander"]) {
  assert.equal(roles.canAccessPath("commander", path), true, "signed-in users can open all practice workspaces");
  assert.equal(roles.accountDestination("commander", path), path);
}
assert.equal(roles.canAccessPath(null, "/training"), false);
assert.equal(roles.accountParticipantRole("instructor", "TEAM_BRAVO"), "INSTRUCTOR");
assert.equal(roles.accountParticipantRole("commander", "TEAM_BRAVO"), "COMMANDER");
assert.equal(roles.accountParticipantRole("team", "TEAM_BRAVO"), "TEAM_BRAVO");
assert.equal(roles.accountParticipantRole("team"), "TEAM_ALPHA");
for (const hostname of ["localhost", "127.0.0.1"]) assert.equal(roles.isLocalPracticeHost(hostname), true);
for (const hostname of ["tactical-sim.vercel.app", "localhost.example.com", "127.0.0.1.example.com", "192.168.1.2", ""]) assert.equal(roles.isLocalPracticeHost(hostname), false);

// Render the actual guard and navigation with controlled account contexts.
// Firebase/network verification is separately enforced and tested by the backend.
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
let pathname = "/commander";
let session = {
  user: { uid: "test-user", displayName: "Training user", photoURL: null },
  role: "commander", roleError: "", loading: false,
  isFirebaseConfigured: true, isLocalPracticeAvailable: false,
  logout: async () => {}, refreshAccountAccess: async () => {},
};
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === "@/lib/roles") return roles;
  if (request === "@/components/auth/AuthProvider") return { useAuth: () => session };
  if (request === "@/components/ui/Toast") return { useToast: () => ({ addToast: () => {} }) };
  if (request === "next/navigation") return { usePathname: () => pathname, useRouter: () => ({ replace() {}, push() {} }) };
  if (request === "next/link") return { __esModule: true, default: props => React.createElement("a", props, props.children) };
  return originalLoad.call(this, request, parent, isMain);
};
try {
  const { AuthGuard } = require("../src/components/auth/AuthGuard.tsx");
  const { Sidebar } = require("../src/components/layout/Sidebar.tsx");
  const { TopBar } = require("../src/components/layout/TopBar.tsx");
  const protectedText = "PROTECTED WORKSPACE CONTENT";
  const renderGuard = () => renderToStaticMarkup(React.createElement(AuthGuard, null, protectedText));
  for (const role of accountRoles) {
    session = { ...session, role };
    for (const pathRole of accountRoles) {
      pathname = `/${pathRole}`;
      const markup = renderGuard();
      assert.equal(markup.includes(protectedText), true);
    }
    const sidebar = renderToStaticMarkup(React.createElement(Sidebar, { collapsed: false, onToggle() {} }));
    for (const linkRole of accountRoles) assert.equal(sidebar.includes(`href="/${linkRole}"`), true);
    assert.equal(sidebar.includes('href="/instructor/scenarios"'), true);
  }
  session = { ...session, role: "commander" };
  const topBar = renderToStaticMarkup(React.createElement(TopBar, { pageTitle: "Shared training", role: "instructor" }));
  assert.match(topBar, /Workspace: INSTRUCTOR/);
  session = { ...session, role: null, loading: true };
  assert.doesNotMatch(renderGuard(), new RegExp(protectedText), "claim loading never flashes privileged content");
  assert.match(renderGuard(), /Checking account access/);
  session = { ...session, role: null, loading: false, roleError: "Unsupported account role" };
  assert.match(renderGuard(), /Your access needs attention/);
  assert.doesNotMatch(renderGuard(), new RegExp(protectedText));
  session = { ...session, user: null, roleError: "" };
  assert.equal(renderGuard(), "", "configured deployments never show protected content to signed-out users");
  session = { ...session, isFirebaseConfigured: false, isLocalPracticeAvailable: false };
  assert.match(renderGuard(), /Account sign-in is unavailable/);
  assert.doesNotMatch(renderGuard(), new RegExp(protectedText), "unconfigured public deployments fail closed");
  session = { ...session, isLocalPracticeAvailable: true };
  assert.match(renderGuard(), new RegExp(protectedText), "only local practice can run without Firebase");
  assert.match(renderToStaticMarkup(React.createElement(TopBar, { pageTitle: "Practice", role: "instructor" })), /no authenticated account/);
  console.log("PASS: legacy claims ignored, signed-in workspaces, safe destinations, room-role mapping, local-only practice, guarded content and account navigation.");
} finally { Module._load = originalLoad; }

async function verifyProviderLifecycle() {
  const hooks = [];
  let cursor = 0;
  let tokenListener;
  const requests = [];
  const mockAuth = { currentUser: null };
  const hookRuntime = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = { value: initial };
      return [hooks[index].value, update => { hooks[index].value = typeof update === "function" ? update(hooks[index].value) : update; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = { current: initial };
      return hooks[index];
    },
    useSyncExternalStore() { return false; },
    useEffect(effect) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = { effect, ran: false };
    },
  };
  Module._load = function(request, parent, isMain) {
    if (request === "react" && parent.filename.endsWith("AuthProvider.tsx")) return hookRuntime;
    if (request === "@/lib/roles") return roles;
    if (request === "@/lib/firebase") return { auth: mockAuth, googleProvider: {}, isFirebaseConfigured: true };
    if (request === "@/lib/auth") return { resolveAuthError: () => "Sign-in failed" };
    if (request === "firebase/auth") return {
      onIdTokenChanged(auth, listener) { assert.equal(auth, mockAuth); tokenListener = listener; return () => {}; },
      getIdTokenResult(user, force = false) {
        let resolve, reject;
        const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
        requests.push({ uid: user.uid, force, resolve, reject });
        return promise;
      },
      signOut: async () => { mockAuth.currentUser = null; tokenListener(null); },
    };
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    const { AuthProvider } = require("../src/components/auth/AuthProvider.tsx");
    const read = () => {
      cursor = 0;
      const rendered = AuthProvider({ children: null });
      for (const hook of hooks) {
        if (hook.effect && !hook.ran) { hook.ran = true; hook.cleanup = hook.effect(); }
      }
      return rendered.props.value;
    };
    const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
    const notify = user => { mockAuth.currentUser = user; tokenListener(user); return requests.at(-1); };
    const instructor = { uid: "instructor-account" };
    const commander = { uid: "commander-account" };
    const team = { uid: "team-account" };
    assert.equal(read().loading, true);
    let request = notify(instructor);
    assert.equal(read().role, null);
    assert.equal(read().loading, true);
    request.resolve({ claims: { tacticalRole: "instructor" } }); await flush();
    assert.equal(read().role, "commander");
    assert.equal(read().loading, false);
    request = notify({ ...instructor });
    assert.equal(read().role, "commander", "routine token renewal retains the same account's verified role");
    assert.equal(read().loading, false, "routine token renewal keeps live exercise children mounted");
    request.resolve({ claims: { tacticalRole: "instructor" } }); await flush();
    assert.equal(read().role, "commander");

    const oldAccountRequest = notify(commander);
    assert.equal(read().role, null, "account switches immediately remove the previous role");
    assert.equal(read().loading, true);
    const newAccountRequest = notify(team);
    oldAccountRequest.resolve({ claims: { tacticalRole: "instructor" } }); await flush();
    assert.equal(read().user.uid, team.uid);
    assert.equal(read().role, null, "a late result for a previous account cannot grant its role");
    newAccountRequest.resolve({ claims: { tacticalRole: "team" } }); await flush();
    assert.equal(read().role, "commander");

    request = notify(instructor);
    mockAuth.currentUser = commander;
    request.resolve({ claims: { tacticalRole: "instructor" } }); await flush();
    assert.equal(read().role, null, "SDK current-user changes invalidate results even before the next listener callback");
    request = notify(commander);
    request.resolve({ claims: {} }); await flush();
    assert.equal(read().role, "commander");

    request = notify({ ...commander });
    request.reject(new Error("Network unavailable")); await flush();
    assert.equal(read().role, null, "failed token verification denies access");
    assert.match(read().roleError, /could not verify/);
    request = notify(commander);
    request.resolve({ claims: { tacticalRole: "administrator" } }); await flush();
    assert.equal(read().role, "commander");
    assert.equal(read().roleError, "");

    request = notify(commander);
    request.resolve({ claims: {} }); await flush();
    const refresh = read().refreshAccountAccess();
    const forcedRequest = requests.at(-1);
    assert.equal(forcedRequest.force, true, "the access button requests fresh server claims");
    assert.equal(read().loading, true);
    assert.equal(read().role, null);
    forcedRequest.resolve({ claims: { tacticalRole: "instructor" } }); await refresh; await flush();
    assert.equal(read().role, "commander");
    request = notify(instructor);
    await read().logout();
    request.resolve({ claims: { tacticalRole: "instructor" } }); await flush();
    assert.equal(read().user, null);
    assert.equal(read().role, null, "a token request completing after sign-out cannot restore access");
    for (const hook of hooks) if (hook.cleanup) hook.cleanup();
    console.log("PASS: actual AuthProvider token callbacks preserve same-account sessions, reject account-switch/sign-out races, deny failed tokens and refresh sign-in access.");
  } finally { Module._load = originalLoad; }
}
verifyProviderLifecycle().catch(error => { console.error(error); process.exitCode = 1; });
