import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compare, DAY, forecast, keyOf, mergeRecords, normalize, parseDate } from './prices.mjs';
import { costEstimate } from './comparison.mjs';
import { distanceKm as distance } from './prices.mjs';

const NOW = Date.parse('2026-10-24T12:00:00Z');
const raw = overrides => ({ state: 'Test State', district: 'Test District', market: 'Test Market', commodity: 'Wheat', variety: 'Test Variety', grade: 'FAQ', arrival_date: '24/10/2026', min_price: '2000', max_price: '2400', modal_price: '2200', ...overrides });
const quote = overrides => normalize(raw(overrides), new Date(NOW).toISOString(), NOW);

test('validates source dates and price ordering; never invents prices or units', () => {
  assert.equal(parseDate('31/02/2026'), null);
  assert.equal(parseDate('24/10/2026'), '2026-10-24');
  for (const patch of [{ modal_price: '' }, { modal_price: '0' }, { modal_price: 'NaN' }, { modal_price: '2500' }, { min_price: null }, { unit: 'INR/kg' }, { arrival_date: '25/10/2026' }, { market: '' }]) assert.equal(quote(patch), null);
  assert.equal(quote({}).original.modal, 2200);
  assert.equal(quote({}).unit, 'INR/quintal');
});
test('deduplicates same-day revisions without mixing varieties', () => {
  const initial = quote({});
  const revision = quote({ modal_price: '2300' });
  const other = quote({ variety: 'Other' });
  const rows = mergeRecords([initial], [revision, other]);
  assert.equal(rows.length, 2);
  assert.equal(rows.find(r => r.variety === 'Test Variety').modal, 2300);
});
test('latest price per comparable series; stale and unknown distances stay explicit', () => {
  const rows = [quote({ arrival_date: '01/10/2026' }), quote({}), quote({ market: 'Old market', arrival_date: '01/10/2026' })];
  const result = compare(rows, { commodity: 'Wheat' }, [], null, null, NOW);
  assert.equal(result.length, 2);
  assert.equal(result[0].modal, 2200);
  assert.equal(result[0].distanceKm, null);
  assert.equal(result[1].stale, true);
  assert.equal(compare(rows, { commodity: 'Soybean' }, [], null, null, NOW).length, 0);
  assert.equal(compare(rows, {}, [], { lat: 20, lon: 73 }, 100, NOW).length, 0);
});
test('only sourced verified market coordinates support nearby radius', () => {
  const locations = [{ state: 'Test State', district: 'Test District', market: 'Test Market', lat: 20, lon: 73, sourceUrl: 'https://www.openstreetmap.org/node/1', verifiedOn: '2026-10-24' }];
  const rows = compare([quote({})], {}, locations, { lat: 20, lon: 73 }, 10, NOW);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].distanceKm, 0);
  assert.equal(compare([quote({})], {}, [{ ...locations[0], sourceUrl: '' }], { lat: 20, lon: 73 }, 10, NOW).length, 0);
  assert.ok(Math.abs(distance({ lat: 0, lon: 0 }, { lat: 1, lon: 0 }) - 111.2) < 0.2);
});
test('quantity conversion and total costs preserve unknowns and explicit zeros', () => {
  const row = quote({});
  assert.deepEqual(costEstimate(row, '100', 'kg', ['', '0', '0']), { gross: 2200, costs: null, remainder: null });
  assert.deepEqual(costEstimate(row, '100', 'kg', ['100', '0', '0']), { gross: 2200, costs: 100, remainder: 2100 });
  assert.equal(costEstimate(row, '1', 'quintal', ['100', '0', '0']).remainder, 2100);
  assert.equal(costEstimate(row, '-1', 'quintal', ['0', '0', '0']).gross, null);
  assert.equal(costEstimate(row, '1', 'quintal', ['-1', '0', '0']).remainder, null);
  assert.equal(costEstimate(row, '1', 'quintal', ['3000', '0', '0']).remainder, -800);
});

function history(count = 1200, kind = 'trend') {
  let seed = 31;
  return Array.from({ length: count }, (_, i) => {
    seed = (seed * 16807) % 2147483647;
    const noise = (seed / 2147483647 - 0.5) * 0.012;
    const modal = kind === 'flat' ? 2200 : Math.exp(Math.log(1700) + i * 0.0015 + noise);
    const date = new Date((Math.floor(NOW / DAY) - count + 1 + i) * DAY).toISOString().slice(0, 10);
    return quote({ arrival_date: date, modal_price: modal, min_price: modal * 0.9, max_price: modal * 1.1 });
  });
}
const policy = rows => ({ enabled: true, seriesKey: keyOf(rows[0]), horizonDays: 7, modelVersion: 'log-linear-28-v1', approvedBy: 'Test reviewer', approvedOn: '2026-10-24', expiresOn: '2026-11-24', minImprovement: 0.1, minCoverage: 0.7, maxCoverage: 0.95, maxRelativeWidth: 0.5 });
test('empty, sparse, stale and missing-comparability histories never show a forecast', () => {
  for (const rows of [[], history(60), history().slice(0, -10), history().map(r => ({ ...r, variety: '' })), history().filter((_, i) => i % 5 === 0)]) {
    const result = forecast(rows, 7, null, NOW);
    assert.equal(result.available, false);
    assert.equal(result.range, null);
    assert.ok(result.reasons.length);
  }
});
test('mixed series, duplicate dates and unsupported horizons are rejected', () => {
  assert.throws(() => forecast([quote({}), quote({ variety: 'Other' })], 7, null, NOW));
  assert.throws(() => forecast([quote({}), quote({})], 7, null, NOW));
  assert.throws(() => forecast(history(), 2, null, NOW));
});
test('good historical performance cannot open an unapproved or expired release gate', () => {
  const rows = history();
  for (const p of [null, { ...policy(rows), enabled: false }, { ...policy(rows), expiresOn: '2026-10-20' }, { ...policy(rows), horizonDays: 14 }, { ...policy(rows), seriesKey: 'different' }, { ...policy(rows), modelVersion: 'other' }]) {
    const result = forecast(rows, 7, p, NOW);
    assert.equal(result.available, false);
    assert.equal(result.range, null);
    assert.ok(result.reasons.includes('Release thresholds have not been approved for this series and horizon.'));
  }
});
test('constant prices cannot claim improvement over a perfect baseline', () => {
  const rows = history(1200, 'flat');
  const result = forecast(rows, 7, policy(rows), NOW);
  assert.equal(result.available, false);
  assert.equal(result.metrics.baselineMAE, 0);
  assert.equal(result.metrics.improvement, 0);
});
test('calibration and recent-performance thresholds suspend forecasts', () => {
  const rows = history();
  const result = forecast(rows, 7, { ...policy(rows), minImprovement: 0.99, minCoverage: 0.8, maxCoverage: 0.8 }, NOW);
  assert.equal(result.available, false);
  assert.equal(result.range, null);
  assert.ok(result.reasons.some(reason => /accuracy|calibration/.test(reason)));
});
test('long horizons require their own completed calibration and evaluation windows', () => {
  const rows = history(365);
  const result = forecast(rows, 30, null, NOW);
  assert.equal(result.available, false);
  assert.ok(result.reasons[0].includes('evaluation windows'));
});
test('approved calibrated series emits only a range with provenance and calendar target', () => {
  const rows = history();
  const result = forecast(rows, 7, policy(rows), NOW);
  assert.equal(result.available, true, JSON.stringify({ reasons: result.reasons, metrics: result.metrics }));
  assert.equal(result.targetDate, '2026-10-31');
  assert.ok(result.range.lower > 0 && result.range.upper > result.range.lower);
  assert.equal(result.metrics.windows, 12);
  assert.equal(result.metrics.calibrationWindows, 20);
  assert.equal(result.dataDigest.length, 64);
  assert.equal(result.history.length, 60);
});
