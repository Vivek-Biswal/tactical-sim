const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText, filename);
};
const { DEFAULT_TRAINING_AREA: area, gridToGeo, geoToGrid, trainingAreaError, inTrainingGrid } = require("../src/simulation/lib/geography.ts");
const { geographicOverlay } = require("../src/simulation/lib/geographicOverlay.ts");
const { LocalSimulationEngine } = require("../src/simulation/lib/simulation.ts");
for (const p of [{x:0,y:0},{x:800,y:600},{x:400,y:300},{x:173.21,y:442.87}]) {
  const roundtrip = geoToGrid(gridToGeo(p,area),area);
  assert.ok(Math.abs(roundtrip.x-p.x)<1e-8 && Math.abs(roundtrip.y-p.y)<1e-8);
}
assert.deepEqual(gridToGeo({x:400,y:300},area),{latitude:area.latitude,longitude:area.longitude});
assert.ok(gridToGeo({x:0,y:0},area).latitude>gridToGeo({x:0,y:600},area).latitude);
assert.ok(trainingAreaError({...area,longitude:180}));
assert.ok(trainingAreaError({...area,latitude:NaN}));
assert.ok(trainingAreaError({...area,widthMeters:20001}));
assert.equal(inTrainingGrid({x:-1,y:300}),false);
const engine = new LocalSimulationEngine("geographic-test");
try {
  const start = engine.getState();
  const initial = geographicOverlay({...start,trainingArea:area});
  assert.equal(initial.units.length,start.units.length);
  assert.equal(initial.units[0].latitude,gridToGeo(start.units[0],area).latitude);
  assert.deepEqual(engine.getState(),start);
  engine.start();engine.dispose();engine.moveTeam("unit-alpha",{x:420,y:380});
  engine.applyInstructorInject("outdate_map");
  const stale=engine.getState();
  engine.tick(2);
  assert.deepEqual(geographicOverlay({...engine.getState(),trainingArea:area}).units,geographicOverlay({...stale,trainingArea:area}).units);
  const events=[{id:"known",second:1,time:"00:01",title:"Known",payload:{x:300,y:200}},{id:"hidden",second:10,payload:{x:600,y:400}},{id:"no-location",second:0,payload:{}}];
  assert.deepEqual(geographicOverlay({...stale,trainingArea:area,mapSnapshotSecond:2,eventLog:events}).events.map(e=>e.id),["known"]);
  engine.applyInstructorInject("unavailable_map");
  const unavailable=geographicOverlay({...engine.getState(),trainingArea:area,eventLog:events});
  assert.deepEqual(unavailable.units,[]);assert.deepEqual(unavailable.activities,[]);assert.deepEqual(unavailable.events,[]);
  engine.applyInstructorInject("restore_map");
  assert.notDeepEqual(geographicOverlay({...engine.getState(),trainingArea:area}).units,initial.units);
  const uav=geographicOverlay({trainingArea:area,units:[{id:"uav",name:"UAV",type:"UAV",x:400,y:300,faction:"friendly"}]}).units[0];
  assert.equal(uav.airborne,true);assert.equal(uav.latitude,area.latitude);
  console.log("Geographic roundtrip, shared-state rendering, stale/unavailable feeds, event privacy and UAV projection passed.");
} finally { engine.dispose(); }
