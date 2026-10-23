// Exercise cross-screen state contracts without loading React Native.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
const { createInitialState } = require('../src/demo/fixtures.ts');
const { demoReducer: reduce } = require('../src/demo/reducer.ts');
const { selectMarketRows, selectRemainingBudget } = require('../src/demo/selectors.ts');
let passed = 0;
const check = (name, run) => { run(); passed++; console.log(`PASS ${name}`); };

check('fixture budget and sorted markets retain unknown cost', () => {
  const state = createInitialState();
  assert.equal(selectRemainingBudget(state), 24800);
  const rows = selectMarketRows(state);
  assert.deepEqual(rows.map(row => row.net), [24350, 24250, null]);
  assert.equal(rows[2].incomplete, true);
});

check('cancelling revision preserves committed plan', () => {
  const initial = createInitialState();
  const draft = reduce(initial, { type: 'plan/revisionBegin' });
  assert.equal(draft.plan.budget, 30000);
  const cancelled = reduce(draft, { type: 'plan/revisionCancel' });
  assert.deepEqual(cancelled.plan, initial.plan);
});

check('confirmed revision uses reference estimate and increments version once', () => {
  let state = reduce(createInitialState(), { type: 'plan/revisionBegin' });
  assert.equal(state.plan.revisionDraft.delta, 3200);
  state = reduce(state, { type: 'plan/revisionConfirm' });
  assert.equal(state.plan.version, 2);
  assert.equal(state.plan.budget, 26000);
  assert.equal(state.farm.budget, 26000);
  assert.equal(state.plan.committedCost, 2000);
  assert.equal(reduce(state, { type: 'plan/revisionConfirm' }).plan.version, 2);
});

check('assessment cancellation cannot change farm values', () => {
  const initial = createInitialState();
  let state = reduce(initial, { type: 'assessment/begin' });
  state = reduce(state, { type: 'assessment/update', patch: { farmName: 'Draft field', budget: 20000 } });
  assert.deepEqual(state.farm, initial.farm);
  state = reduce(state, { type: 'assessment/cancel' });
  assert.deepEqual(state.farm, initial.farm);
  assert.equal(state.assessmentDraft, null);
});

check('soil result and cancelled import cannot mutate plan or farm', () => {
  const initial = createInitialState();
  let state = reduce(initial, { type: 'soil/analyze' });
  assert.equal(state.soil.result.enteredCount, 2);
  assert.equal(state.farm.soilTest, null);
  state = reduce(state, { type: 'soil/importBegin' });
  state = reduce(state, { type: 'soil/importCancel' });
  assert.equal(state.farm.soilTest, null);
  assert.deepEqual(state.plan, initial.plan);
});

check('explicit selected soil import adds only selected records', () => {
  let state = createInitialState();
  const initialPlan = state.plan;
  state = reduce(state, { type: 'soil/analyze' });
  const withoutReview = reduce(state, { type: 'soil/importConfirm', keys: ['ph'] });
  assert.equal(withoutReview.farm.soilTest, null);
  state = reduce(state, { type: 'soil/importBegin' });
  state = reduce(state, { type: 'soil/importConfirm', keys: ['ph'] });
  assert.deepEqual(state.farm.soilTest.values, { ph: '7.4' });
  assert.deepEqual(state.plan, initialPlan);
});

check('market quantity recalculates known nets without filling unknown values', () => {
  const state = reduce(createInitialState(), { type: 'market/quantity', quintals: 5 });
  assert.deepEqual(selectMarketRows(state).map(row => row.net), [11750, 11450, null]);
});

check('locked stages cannot be completed out of order', () => {
  const initial = createInitialState();
  const state = reduce(initial, { type: 'plan/stageDone', stageId: 'harvest' });
  assert.deepEqual(state.plan.stages, initial.plan.stages);
});

check('profile cancellation preserves farm and budget', () => {
  const initial = createInitialState();
  let state = reduce(initial, { type: 'profile/editBegin' });
  state = reduce(state, { type: 'profile/editUpdate', patch: { farmerName: 'Draft', budget: 1000 } });
  state = reduce(state, { type: 'profile/editCancel' });
  assert.deepEqual(state.farm, initial.farm);
  assert.deepEqual(state.plan, initial.plan);
});

check('reset restores deterministic fixtures after edits', () => {
  let state = reduce(createInitialState(), { type: 'locale/set', locale: 'hi' });
  state = reduce(state, { type: 'consent/set', key: 'approximateLocation', value: true });
  state = reduce(state, { type: 'demo/reset' });
  assert.deepEqual(state, createInitialState());
});
check('tool history shares reset semantics and deduplicates tools', () => {
  let state = reduce(createInitialState(), { type: 'tool/record', tool: 'soil', labelKey: 'tools.soil.title', summary: 'Two test values' });
  state = reduce(state, { type: 'tool/record', tool: 'soil', labelKey: 'tools.soil.title', summary: 'Updated values' });
  assert.equal(state.toolHistory.length, 1);
  assert.equal(state.toolHistory[0].summary, 'Updated values');
  assert.equal(reduce(state, { type: 'demo/reset' }).toolHistory.length, 0);
});
check('soil units survive result snapshots and selected import', () => {
  let state = reduce(createInitialState(), { type: 'soil/unit', key: 'organicCarbon', unit: 'g/kg' });
  state = reduce(state, { type: 'soil/analyze' });
  state = reduce(state, { type: 'soil/unit', key: 'organicCarbon', unit: '%' });
  assert.equal(state.soil.result.units.organicCarbon, 'g/kg');
  state = reduce(state, { type: 'soil/importBegin' });
  state = reduce(state, { type: 'soil/importConfirm', keys: ['organicCarbon'] });
  assert.equal(state.farm.soilTest.units.organicCarbon, 'g/kg');
  assert.equal(state.farm.soilTest.units.ph, undefined);
});
check('a new soil snapshot cannot retain a prior import claim', () => {
  let state = reduce(createInitialState(), { type: 'soil/analyze' });
  state = reduce(state, { type: 'soil/importBegin' });
  state = reduce(state, { type: 'soil/importConfirm' });
  const imported = state.farm.soilTest;
  state = reduce(state, { type: 'soil/context', patch: { crop: 'Soybean' } });
  state = reduce(state, { type: 'soil/value', key: 'ph', value: '6.9' });
  state = reduce(state, { type: 'soil/analyze' });
  assert.equal(state.soil.imported, false);
  assert.equal(state.soil.importDraft, false);
  assert.equal(state.soil.result.crop, 'Soybean');
  assert.deepEqual(state.farm.soilTest, imported);
});
console.log(`${passed} meaningful state checks passed.`);
