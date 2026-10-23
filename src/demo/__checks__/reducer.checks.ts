/**
 * Focused checks for demo-store invariants. Run with:
 *   npx tsx src/demo/__checks__/reducer.checks.ts
 * No test runner dependency is added (dependency edits belong to the orchestrator).
 */
import { createInitialState, DEMO_OTP_CODE, SOIL_PARAMS } from '../fixtures';
import { demoReducer } from '../reducer';
import { selectMarketRows, selectRemainingBudget, selectSoilSummary } from '../selectors';
import { formatCountdown, formatIndianMobile, formatRupees, maskedMobile } from '../format';
import type { DemoAction, DemoState } from '../types';

let failures = 0;
function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) return;
  failures += 1;
  console.error(`FAIL ${name}`, detail ?? '');
}

function run(state: DemoState, ...actions: DemoAction[]): DemoState {
  return actions.reduce(demoReducer, state);
}

const base = createInitialState();

// Fixtures
check('remaining budget 24800', selectRemainingBudget(base) === 24800, selectRemainingBudget(base));
check('otp code 526448', DEMO_OTP_CODE === '526448');
check('mobile fixture', base.onboarding.mobile === '9876526448');
check('soil fixture 2 of 12', selectSoilSummary(base).enteredCount === 2);

// Market: unknown cost keeps net null and sorts last
const rows = selectMarketRows(base);
check('market 3 rows', rows.length === 3);
check('lasalgaon net 24350', rows[0].id === 'lasalgaon' && rows[0].net === 24350, rows[0]);
check('nashik net 24250', rows[1].id === 'nashik' && rows[1].net === 24250, rows[1]);
check('pimpalgaon incomplete last', rows[2].id === 'pimpalgaon' && rows[2].net === null);
check('incomplete not zero', rows[2].net !== 0);

// Market quantity recalculates locally
const qty = run(base, { type: 'market/quantity', quintals: 20 });
check(
  'qty recalculates net',
  selectMarketRows(qty).find(row => row.id === 'lasalgaon')?.net === 2520 * 20 - 850,
);
const missingStillNull = run(qty, { type: 'market/cost', marketId: 'pimpalgaon', field: 'transport', value: null });
check(
  'still null after edit',
  selectMarketRows(missingStillNull).find(row => row.id === 'pimpalgaon')?.net === null,
);

// Assessment draft isolation
const drafting = run(base, { type: 'assessment/begin' }, { type: 'assessment/update', patch: { budget: 99000 } });
check('draft applied', drafting.assessmentDraft?.budget === 99000);
const cancelled = run(drafting, { type: 'assessment/cancel' });
check('cancel clears draft', cancelled.assessmentDraft === null);
check('cancel keeps budget', cancelled.farm.budget === 30000 && cancelled.plan.budget === 30000);

const saved = run(drafting, { type: 'assessment/save' });
check('save commits budget', saved.farm.budget === 99000 && saved.plan.budget === 99000);
check('save clears draft', saved.assessmentDraft === null);

// Revision: sample delta 3200, budget cut 4000
const revising = run(base, { type: 'plan/revisionBegin' });
check('revision delta 3200', revising.plan.revisionDraft?.delta === 3200, revising.plan.revisionDraft);
check('revision from/to', revising.plan.revisionDraft?.fromBudget === 30000 && revising.plan.revisionDraft?.toBudget === 26000);
const revisionCancelled = run(revising, { type: 'plan/revisionCancel' });
check('revision cancel preserves budget', revisionCancelled.plan.budget === 30000 && revisionCancelled.farm.budget === 30000);
check('revision cancel preserves version', revisionCancelled.plan.version === 1);
check('revision cancel preserves committed', revisionCancelled.plan.committedCost === 5200);

const revisionConfirmed = run(revising, { type: 'plan/revisionConfirm' });
check('revision confirm budget', revisionConfirmed.plan.budget === 26000 && revisionConfirmed.farm.budget === 26000);
check('revision confirm cost delta 3200', revisionConfirmed.plan.committedCost === 2000, revisionConfirmed.plan.committedCost);
check('revision remaining', selectRemainingBudget(revisionConfirmed) === 24000);
check('revision version 2', revisionConfirmed.plan.version === 2);
check('revision history', revisionConfirmed.plan.revisionHistory.length === 1);
check('revision draft cleared', revisionConfirmed.plan.revisionDraft === null);

const editedBudget = run(revising, { type: 'plan/revisionBudget', budget: 24000 });
check('edited target budget', editedBudget.plan.revisionDraft?.toBudget === 24000);
check('edited delta unchanged', editedBudget.plan.revisionDraft?.delta === 3200);

// Stage quote: unknown stays unknown
const quoted = run(base, { type: 'plan/stageQuote', stageId: 'seed', quotePerKg: 42 });
check('quote saved', quoted.plan.stages[1].quotePerKg === 42);
const clearedQuote = run(quoted, { type: 'plan/stageQuote', stageId: 'seed', quotePerKg: 0 });
check('zero quote cleared', clearedQuote.plan.stages[1].quotePerKg === null);
check('seed fixture null', base.plan.stages[1].seedId === null);
const seeded = run(base, { type: 'plan/stageSeed', stageId: 'seed', seedId: 'seed-a' });
check('seed selected', seeded.plan.stages[1].seedId === 'seed-a');

// Stage completion advances exactly one step
const done = run(base, { type: 'plan/stageDone', stageId: 'seed' });
check('seed completed', done.plan.stages[1].status === 'completed');
check('preparation current', done.plan.stages[2].status === 'current');
check('nutrition untouched', done.plan.stages[3].status === 'locked');
const lockedNoop = run(base, { type: 'plan/stageDone', stageId: 'harvest' });
check('locked stage cannot complete', lockedNoop.plan.stages[4].status === 'locked');

// Soil import requires review and respects selected keys
const analyzed = run(base, { type: 'soil/analyze' });
check('analyze produces result', analyzed.soil.result?.enteredCount === 2);
const directImport = run(analyzed, { type: 'soil/importConfirm' });
check('import blocked before review', directImport.farm.soilTest === null && directImport.soil.imported === false);
const reviewing = run(analyzed, { type: 'soil/importBegin' });
const imported = run(reviewing, { type: 'soil/importConfirm' });
check('import commits reviewed', imported.farm.soilTest?.values.ph === '7.4');
check('import flag', imported.soil.imported === true && imported.soil.importDraft === false);
const partialImport = run(reviewing, { type: 'soil/importConfirm', keys: ['ph', 'nitrogen'] });
check('partial import only ph', partialImport.farm.soilTest?.values.ph === '7.4');
check('unknown key ignored', partialImport.farm.soilTest?.values.nitrogen === undefined);
check('import does not touch budget', partialImport.plan.budget === 30000);
const cancelledImport = run(reviewing, { type: 'soil/importCancel' });
check('import cancel leaves farm', cancelledImport.farm.soilTest === null);
check('import cancel closes draft', cancelledImport.soil.importDraft === false);

// Soil value clearing keeps unknown honest
const soilCleared = run(base, { type: 'soil/clear', key: 'ph' });
check('cleared value removed', soilCleared.soil.values.ph === undefined);
check('cleared summary 1 of 12', selectSoilSummary(soilCleared).enteredCount === 1);
const soilAllCleared = SOIL_PARAMS.reduce((state, key) => run(state, { type: 'soil/clear', key }), base);
const noValues = run(soilAllCleared, { type: 'soil/analyze' });
check('no values -> no result', noValues.soil.result === null);

// Community submit prepends a reported item and resets the draft
const submitted = run(
  base,
  { type: 'community/draft', patch: { notes: 'Small brown spots' } },
  { type: 'community/submit' },
);
check('feed grew', submitted.community.feed.length === 4);
check('new item reported', submitted.community.feed[0].status === 'reported');
check('draft reset', submitted.community.draft.notes === '');
check('submitted id tracked', submitted.community.submittedIds.length === 1);

// Profile edit isolation and commit
const profileDrafting = run(base, { type: 'profile/editBegin' }, { type: 'profile/editUpdate', patch: { farmerName: 'Meera Rao' } });
check('profile draft', profileDrafting.profileDraft?.farmerName === 'Meera Rao');
const profileCancelled = run(profileDrafting, { type: 'profile/editCancel' });
check('profile cancel keeps name', profileCancelled.farm.farmerName === 'Asha Patil');
const profileSaved = run(profileDrafting, { type: 'profile/editSave' });
check('profile save commits', profileSaved.farm.farmerName === 'Meera Rao');
check('profile initials recomputed', profileSaved.farm.initials === 'MR');

// Onboarding + reset semantics
const otp = run(base, { type: 'onboarding/otpSending' }, { type: 'onboarding/otpVerifying' }, { type: 'onboarding/otpSuccess' });
check('otp success signs in', otp.onboarding.signedIn && otp.onboarding.completed);
const failed = run(base, { type: 'onboarding/otpFailed' });
check('otp fail counts', failed.onboarding.otpStatus === 'error' && failed.onboarding.otpAttempts === 1);
const signedOut = run(
  profileSaved,
  { type: 'consent/set', key: 'notifications', value: true },
  { type: 'onboarding/signOut' },
);
check('signout clears mobile', signedOut.onboarding.mobile === '');
check('signout keeps fixtures', signedOut.farm.farmerName === 'Meera Rao');
check('signout consents off', signedOut.consents.notifications === false);
check('signout clears drafts', signedOut.profileDraft === null && signedOut.assessmentDraft === null);

const reset = run(revising, { type: 'demo/reset' });
check('reset restores fixture', reset.farm.budget === 30000 && reset.plan.committedCost === 5200);
check('reset clears revision', reset.plan.revisionDraft === null);
check('reset signed out', reset.onboarding.signedIn === false);

const firstVisit = run(base, { type: 'plan/startFirstVisit' });
check('first visit empty plan', firstVisit.plan.exists === false);
const afterAssessment = run(firstVisit, { type: 'assessment/begin' }, { type: 'assessment/save' });
check('assessment restores plan', afterAssessment.plan.exists === true && afterAssessment.plan.stages[1].status === 'current');

// Formatting
check('rupees 30,000', formatRupees(30000) === '30,000', formatRupees(30000));
check('rupees 24800', formatRupees(24800) === '24,800', formatRupees(24800));
check('rupees lakh grouping', formatRupees(1234567) === '12,34,567', formatRupees(1234567));
check('mobile format', formatIndianMobile('9876526448') === '98765 26448');
check('masked mobile', maskedMobile('9876526448') === '+91 ••••••6448');
check('countdown', formatCountdown(24) === '00:24' && formatCountdown(0) === '00:00');

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('demo store checks passed');
