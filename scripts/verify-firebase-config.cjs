const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { deleteApp } = require('firebase/app');
const variables = ['NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID'];
const saved = Object.fromEntries(variables.map(name => [name, process.env[name]]));
const compiled = ts.transpileModule(fs.readFileSync('src/lib/firebase.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
function load(overrides) {
  for (const name of variables) delete process.env[name];
  Object.assign(process.env, overrides);
  const exports = {};
  vm.runInNewContext(compiled, { exports, require, process, console }, { filename: 'firebase-config.js' });
  return exports;
}
(async () => {
  try {
    const required = { NEXT_PUBLIC_FIREBASE_API_KEY: 'configuration-test-key', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'configuration-test.firebaseapp.com', NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'configuration-test' };
    const configured = load(required);
    assert.equal(configured.isFirebaseConfigured, true);
    assert.ok(configured.auth, 'The actual Firebase SDK must initialize Auth without appId');
    assert.equal(configured.app.options.appId, undefined);
    await deleteApp(configured.app);
    for (const name of variables.slice(0, 3)) {
      const config = { ...required };
      delete config[name];
      const missing = load(config);
      assert.equal(missing.isFirebaseConfigured, false);
      assert.equal(missing.auth, null);
      assert.equal(missing.missingFirebaseConfiguration[0], name);
    }
    const whitespace = load({ ...required, NEXT_PUBLIC_FIREBASE_API_KEY: '   ' });
    assert.equal(whitespace.isFirebaseConfigured, false);
    const padded = load(Object.fromEntries(Object.entries(required).map(([name,value]) => [name, `  ${value}  `])));
    assert.equal(padded.isFirebaseConfigured, true);
    assert.equal(padded.auth.config.apiKey, required.NEXT_PUBLIC_FIREBASE_API_KEY);
    await deleteApp(padded.app);
    console.log('Firebase configuration checks passed: actual SDK Auth initializes without appId; missing and blank required fields stay disabled; whitespace is trimmed. No sign-in requests were sent.');
  } finally {
    for (const name of variables) {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
