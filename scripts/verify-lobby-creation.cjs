const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const jsx = require("react/jsx-runtime");

function lobby() {
  const hooks = [];
  const requests = [];
  const writes = [];
  const navigations = [];
  let cursor = 0;
  const user = { uid: "instructor-one", displayName: "Instructor" };
  const auth = { currentUser: user };
  const context = { user, role: "instructor", loading: false, isFirebaseConfigured: true };
  const runtime = {
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
    useEffect(effect) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = { effect, ran: false };
    },
  };
  const passthrough = props => props.children;
  const modules = {
    react: runtime,
    "react/jsx-runtime": jsx,
    "next/link": { __esModule: true, default: passthrough },
    "next/navigation": { useRouter: () => ({ push: path => navigations.push(path) }) },
    "@/components/layout/AppShell": { AppShell: passthrough },
    "@/components/auth/AuthProvider": { useAuth: () => context },
    "@/components/auth/AuthGuard": { AuthGuard: passthrough },
    "@/components/ui/PanelCard": { PanelCard: passthrough },
    "@/simulation/components/geographic/TrainingAreaFields": { TrainingAreaFields: () => null },
    "@/simulation/lib/geography": { DEFAULT_TRAINING_AREA: { name: "Training fixture" }, trainingAreaError: () => null },
    "@/lib/roles": { accountRoleLabels: { instructor: "Instructor" } },
    "@/lib/firebase": { auth },
    "@/simulation/lib/backend": {
      keyStorage: id => `room:${auth.currentUser?.uid || "signed-out"}:${id}`,
      backendRequest(path, options = {}) {
        if (options.method !== "POST") return Promise.resolve([]);
        let resolve, reject;
        const pending = new Promise((yes, no) => { resolve = yes; reject = no; });
        requests.push({ options, resolve, reject });
        return pending;
      },
    },
  };
  const compiled = ts.transpileModule(fs.readFileSync("src/app/training/page.tsx", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: name => { assert.ok(name in modules, `Unexpected import ${name}`); return modules[name]; },
    AbortController, Boolean, JSON,
    setTimeout: () => 0, clearTimeout() {},
    localStorage: { setItem: (key, value) => writes.push({ key, value }) },
  });
  const Body = module.exports.default().props.children.type;
  const forms = element => {
    if (!element || typeof element !== "object") return [];
    const children = element.props?.children;
    return [...(element.type === "form" ? [element] : []), ...(Array.isArray(children) ? children : [children]).flatMap(forms)];
  };
  function render() {
    cursor = 0;
    const view = Body();
    for (const hook of hooks) if (hook.effect && !hook.ran) { hook.ran = true; hook.cleanup = hook.effect(); }
    return forms(view)[0];
  }
  render();
  return {
    auth, requests, writes, navigations,
    submit() { render().props.onSubmit({ preventDefault() {} }); },
    unmount() { for (const hook of hooks) if (hook.cleanup) hook.cleanup(); },
  };
}
const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };
const room = { exerciseId: "ex-12ab34cd56ef", instructorKey: "fixture-recovery-key" };
(async () => {
  const stable = lobby(); await flush(); stable.submit(); stable.submit();
  assert.equal(stable.requests.length, 1, "a pending room creation cannot submit twice");
  stable.requests[0].resolve(room); await flush();
  assert.equal(stable.writes.length, 1);
  assert.equal(stable.writes[0].key, "room:instructor-one:ex-12ab34cd56ef");
  assert.equal(stable.navigations[0], "/training/ex-12ab34cd56ef/controls");
  stable.unmount();
  for (const nextUser of [null, { uid: "instructor-two" }]) {
    const switched = lobby(); await flush(); switched.submit();
    switched.auth.currentUser = nextUser;
    switched.requests[0].resolve(room); await flush();
    assert.equal(switched.writes.length, 0, "a late creation response cannot save a key for another/signed-out account");
    assert.equal(switched.navigations.length, 0, "a late creation response cannot redirect another/signed-out account");
    switched.unmount();
  }
  const abandoned = lobby(); await flush(); abandoned.submit(); abandoned.unmount();
  assert.equal(abandoned.requests[0].options.signal.aborted, true, "leaving the account's lobby aborts its creation request");
  abandoned.requests[0].resolve(room); await flush();
  assert.equal(abandoned.writes.length, 0, "even a transport that completes after cancellation cannot publish the old key");
  assert.equal(abandoned.navigations.length, 0);
  const staleStart = lobby(); await flush(); staleStart.auth.currentUser = { uid: "instructor-two" }; staleStart.submit();
  assert.equal(staleStart.requests.length, 0, "stale account handlers cannot initiate room creation");
  staleStart.unmount();
  console.log("PASS: stable-account room creation; duplicate submission prevention; account-switch/sign-out key isolation; unmount cancellation; stale creation handlers.");
})().catch(error => { console.error(error); process.exitCode = 1; });
