const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, esModuleInterop: true } }).outputText, filename);
};
const { TRAINING_PRESETS, areaFromPreset, gridToGeo } = require("../src/simulation/lib/geography.ts");
const { createTrainingUnits, domainOf, movementError, isWater } = require("../src/simulation/lib/training.ts");
const { LocalSimulationEngine } = require("../src/simulation/lib/simulation.ts");
const { geographicOverlay } = require("../src/simulation/lib/geographicOverlay.ts");
assert.ok(TRAINING_PRESETS.length >= 10);
let combinations = 0;
for (const preset of TRAINING_PRESETS) {
  for (const force of preset.supportedForces) {
    const area = areaFromPreset(preset, force);
    const engine = new LocalSimulationEngine(`training-${preset.id}-${force}`);
    try {
      assert.equal(engine.setTrainingArea(area), true);
      const initial = engine.getState();
      assert.deepEqual(initial.units, createTrainingUnits(area));
      assert.deepEqual(engine.generateAAR().initialUnits, initial.units);
      const initialPositions = initial.units.map(unit => `${unit.x},${unit.y}`);
      assert.equal(new Set(initialPositions).size, initialPositions.length, `${preset.id}/${force}: labels start at distinct positions`);
      for (const unit of initial.units) {
        assert.equal(movementError(unit, unit, area), null, `${preset.id}/${force}: valid spawn ${unit.name}`);
        const route = unit.patrolRoute;
        assert.ok(route.length >= 2);
        for (let i = 0; i < route.length; i++) assert.equal(movementError({ ...unit, ...route[i] }, route[(i + 1) % route.length], area), null, `${preset.id}: patrol stays in its domain`);
      }
      engine.start(); engine.dispose();
      assert.equal(engine.setTrainingArea(area), false, "area is fixed during a run");
      engine.tick(1);
      const moving = engine.getState();
      for (const unit of moving.trueUnits) {
        const before = initial.units.find(value => value.id === unit.id);
        assert.ok(Math.hypot(unit.x - before.x, unit.y - before.y) > 0, `${unit.name} moves with the simulation clock`);
        assert.equal(movementError(unit, unit, area), null);
      }
      const geo = geographicOverlay(moving);
      for (const unit of geo.units) {
        const point = moving.units.find(value => value.id === unit.id);
        assert.equal(unit.latitude, gridToGeo(point, area).latitude, "2D and 3D read identical positions");
      }
      engine.pause();
      const paused = engine.getState();
      engine.tick(5);
      assert.deepEqual(engine.getState().trueUnits, paused.trueUnits, "pause stops every domain");
      engine.resume(); engine.setSpeed(2); engine.tick(1);
      assert.equal(engine.getState().elapsedSeconds, 3, "speed scales the shared clock");
      engine.applyInstructorInject("outdate_map");
      const stale = engine.getState();
      engine.tick(1);
      assert.deepEqual(engine.getState().units, stale.units);
      assert.notDeepEqual(engine.getState().trueUnits, stale.trueUnits, "patrol truth advances during a stale feed");
      assert.equal(engine.moveTeam("unit-alpha", { x: 400, y: 300 }), false);
      engine.applyInstructorInject("unavailable_map");
      engine.tick(1);
      assert.deepEqual(geographicOverlay(engine.getState()).units, [], "unavailable 3D feed hides positions");
      engine.applyInstructorInject("restore_map");
      assert.deepEqual(engine.getState().units, engine.getState().trueUnits);
      const alpha = engine.getState().trueUnits.find(unit => unit.id === "unit-alpha");
      const next = alpha.patrolRoute[alpha.patrolIndex];
      assert.equal(engine.moveTeam(alpha.id, next), true, "valid manual destination takes control");
      assert.equal(engine.getState().trueUnits.find(unit => unit.id === alpha.id).patrolRoute, undefined);
      assert.equal(engine.moveTeam("contact-1", next), false, "unknown contacts cannot be commanded");
      engine.applyInstructorInject("decision_point", { title: "Verify a report", options: [{ id: "hold", label: "Wait for confirmation" }] });
      engine.submitDecision("Wait", "Confirm the report first", "medium", "COMMANDER_1", "hold");
      assert.equal(engine.generateAAR().decisions[0].rationale, "Confirm the report first");
      engine.end();
      const ended = engine.getState(); engine.tick(5);
      assert.deepEqual(engine.getState().trueUnits, ended.trueUnits);
      engine.reset();
      assert.deepEqual(engine.getState().trainingArea, area, "reset preserves location and force");
      assert.deepEqual(engine.getState().units, initial.units);
      assert.equal(engine.getState().decisions.length, 0);
      combinations += 1;
    } finally { engine.dispose(); }
  }
}
const river = areaFromPreset(TRAINING_PRESETS.find(preset => preset.id === "brahmaputra-river"), "joint");
const riverUnits = createTrainingUnits(river);
const army = riverUnits.find(unit => domainOf(unit) === "ground");
const boat = riverUnits.find(unit => domainOf(unit) === "sea");
const aircraft = riverUnits.find(unit => domainOf(unit) === "air");
assert.equal(isWater(river, { x: 400, y: 300 }), true);
assert.match(movementError(army, { x: 400, y: 300 }, river), /Ground teams stay on land/);
assert.match(movementError(army, { x: 400, y: 100 }, river), /clear land route/, "land-to-land crossing water is rejected");
assert.match(movementError(boat, { x: 400, y: 500 }, river), /Boats stay on water/);
assert.equal(movementError(aircraft, { x: 400, y: 100 }, river), null);
assert.equal(movementError(aircraft, { x: 400, y: 300 }, river), null);
assert.match(movementError(aircraft, { x: NaN, y: 100 }, river), /inside the training area/);
console.log(`PASS: ${TRAINING_PRESETS.length} Indian maps, ${combinations} force combinations, valid patrols, clock/speed/pause, manual control, land/water constraints, 2D/3D parity, feed privacy, reset and AAR.`);
