import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const bytes = await sharp({ create: { width: 100, height: 100, channels: 3, background: 'green' } }).png().toBuffer();
const image = { mimeType: 'image/png', base64: bytes.toString('base64') };
test('HTTP photo → sourced price context → confirmed series → existing forecast gate; no image persistence', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'khetify-photo-test-'));
  process.env.PRICE_DATA_DIR = dir;
  delete process.env.DATA_GOV_API_KEY;
  const { createPriceServer } = await import('./index.mjs');
  const { normalize } = await import('./prices.mjs');
  const { saveRows } = await import('./store.mjs');
  let modelCalls = 0;
  let visionOutcome = 'suggested';
  let locationCalls = 0;
  const server = createPriceServer({ recognize: async (photo, scope) => {
    modelCalls++;
    assert.ok(photo.digest);
    return { status: visionOutcome, crop: visionOutcome === 'suggested' ? scope.find(c => c.id === 'wheat') : null, confidenceLabel: 'high', farmerConfirmationRequired: true, imageDigest: photo.digest, analyzedAt: new Date().toISOString() };
  }, locate: async params => {
    locationCalls++;
    assert.equal(params.get('lat'), '20.01');
    assert.equal(params.get('lon'), '73.79');
    return [{ state: 'Test', district: 'District', label: 'Public test town', lat: 20.01, lon: 73.79 }];
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = body => fetch(base + '/api/photo-prices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    const row = normalize({ state: 'Test', district: 'District', market: 'Market', commodity: 'Wheat', variety: 'Variety', grade: 'FAQ', arrival_date: '2026-01-01', min_price: 100, max_price: 200, modal_price: 150 }, new Date().toISOString());
    await saveRows([row]);
    const query = { state: 'Test', district: 'District' };
    assert.equal((await post({ image, query })).status, 400); // consent first
    assert.equal(modelCalls, 0);
    assert.equal((await post({ image, query, consentToVision: true, horizonDays: 3 })).status, 400);
    assert.equal(modelCalls, 0);
    const first = await post({ image, consentToVision: true, query, quantity: 100, unit: 'kg', costs: { [row.id]: { transport: 10, handling: 0, fees: 0 } } });
    const result = await first.json();
    assert.equal(first.status, 200);
    assert.equal(result.status, 'confirmation_required');
    assert.equal(result.identification.crop.commodity, 'Wheat');
    assert.equal(result.reportedPrices.rows[0].modal, 150);
    assert.equal(result.reportedPrices.rows[0].estimate.remainder, 140);
    assert.equal(result.forecast.available, false);
    assert.equal(result.forecast.range, null);
    assert.deepEqual(result.requiresConfirmation, ['commodity', 'market', 'variety', 'grade']);
    const confirmedQuery = { ...query, commodity: 'Wheat', market: 'Market', variety: 'Variety', grade: 'FAQ' };
    const confirmed = await (await post({ analysisToken: result.analysisToken, query: confirmedQuery, cropConfirmed: true, varietyConfirmed: true, gradeConfirmed: true, horizonDays: 7 })).json();
    assert.equal(confirmed.status, 'forecast_unavailable');
    assert.equal(confirmed.forecast.available, false);
    assert.equal(confirmed.forecast.range, null);
    assert.equal(confirmed.forecast.history.length, 1);
    assert.equal(modelCalls, 1); // token avoids another image/model call
    assert.deepEqual(confirmed.requiresConfirmation, []);
    assert.equal(confirmed.imageStored, false);
    assert.equal(confirmed.locationStored, false);
    const missingGrade = await (await post({ analysisToken: result.analysisToken, query: confirmedQuery, cropConfirmed: true, varietyConfirmed: true })).json();
    assert.equal(missingGrade.status, 'confirmation_required');
    assert.deepEqual(missingGrade.requiresConfirmation, ['grade']);
    const mismatch = await (await post({ analysisToken: result.analysisToken, query: { ...query, commodity: 'Maize' } })).json();
    assert.equal(mismatch.status, 'confirmation_required');
    assert.equal(mismatch.reportedPrices, null);
    assert.equal((await post({ analysisToken: 'forged', query })).status, 400);
    assert.equal((await post({ analysisToken: result.analysisToken, image, query })).status, 400);
    const capabilities = await (await fetch(base + '/api/photo-prices/capabilities')).json();
    assert.equal(capabilities.farmerConfirmationRequired, true);
    assert.ok(capabilities.supportedCrops.some(c => c.id === 'wheat'));
    const noArea = await (await post({ analysisToken: result.analysisToken })).json();
    assert.equal(noArea.status, 'location_required');
    assert.equal(noArea.reportedPrices, null);
    const origin = { lat: 20.01499, lon: 73.78888 };
    const noLocationConsent = await (await post({ analysisToken: result.analysisToken, origin })).json();
    assert.equal(noLocationConsent.status, 'location_required');
    assert.equal(locationCalls, 0);
    const areaLookup = await (await post({ analysisToken: result.analysisToken, origin, consentToLocationLookup: true })).json();
    assert.equal(areaLookup.query.state, 'Test');
    assert.equal(areaLookup.query.district, 'District');
    assert.equal(areaLookup.reportedPrices.rows[0].modal, 150);
    assert.equal(locationCalls, 1);
    for (const outcome of ['retake_required', 'unsupported']) {
      visionOutcome = outcome;
      const unclear = await (await post({ image, consentToVision: true, query })).json();
      assert.equal(unclear.status, outcome);
      assert.equal(unclear.reportedPrices, null);
      assert.equal(unclear.forecast.available, false);
    }
    // Caller confirmation cannot bypass the statistical gate. Here the same HTTP
    // flow opens only after full comparable synthetic history and an approved policy.
    const { keyOf, DAY } = await import('./prices.mjs');
    const { writeJson } = await import('./store.mjs');
    let seed = 31;
    const now = Date.now();
    const history = Array.from({ length: 1200 }, (_, i) => {
      seed = (seed * 16807) % 2147483647;
      const modal = Math.exp(Math.log(1700) + i * 0.0015 + (seed / 2147483647 - 0.5) * 0.012);
      return normalize({ state: 'Test', district: 'District', market: 'Market', commodity: 'Wheat', variety: 'Variety', grade: 'FAQ',
        arrival_date: new Date((Math.floor(now / DAY) - 1199 + i) * DAY).toISOString().slice(0, 10), min_price: modal * 0.9, modal_price: modal, max_price: modal * 1.1 }, new Date(now).toISOString());
    });
    await writeJson('prices.json', history);
    await writeJson('policies.json', [{ enabled: true, seriesKey: keyOf(history[0]), horizonDays: 7, modelVersion: 'log-linear-28-v1', approvedBy: 'Synthetic test reviewer',
      approvedOn: new Date(now).toISOString().slice(0, 10), expiresOn: new Date(now + 30 * DAY).toISOString().slice(0, 10), minImprovement: 0.1, minCoverage: 0.7, maxCoverage: 0.95, maxRelativeWidth: 0.5 }]);
    const released = await (await post({ analysisToken: result.analysisToken, query: confirmedQuery, cropConfirmed: true, varietyConfirmed: true, gradeConfirmed: true, horizonDays: 7 })).json();
    assert.equal(released.status, 'forecast_available');
    assert.equal(released.forecast.available, true);
    assert.ok(released.forecast.range.upper > released.forecast.range.lower);
    assert.equal(released.forecast.metrics.windows, 12);
    assert.equal(released.forecast.coverage.observations, 1200);
    assert.deepEqual((await readdir(dir)).sort(), ['policies.json', 'prices.json']);
  } finally {
    await new Promise(resolve => server.close(resolve));
    assert.equal(resolve(dirname(dir)), resolve(tmpdir()));
    await rm(dir, { recursive: true });
  }
});
