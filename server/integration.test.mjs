import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

test('backend integrations retain existing contracts and separate sourced data, reviews and private history', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'khetify-integration-'));
  process.env.PRICE_DATA_DIR = dir;
  process.env.PRICE_PROVIDER = 'local';
  delete process.env.DATA_GOV_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.CROP_VISION_MODEL;
  const { createPriceServer } = await import('./index.mjs');
  const { normalize } = await import('./prices.mjs');
  const { writeJson } = await import('./store.mjs');
  const { ARCHIVE_SOURCE, partitionName } = await import('./local-prices.mjs');
  const { appMarketState } = await import('./comparison.mjs');
  // These are test-only source rows, not production prices or model evidence.
  const makeRow = (commodity, modal, grade = 'Test grade') => ({ ...normalize({
    state: 'Test state', district: 'Test district', market: 'A new sourced market', commodity,
    variety: 'Test variety', grade, arrival_date: '2026-01-01', min_price: modal - 10,
    max_price: modal + 10, modal_price: modal,
  }, '2026-01-02T00:00:00Z'), source: ARCHIVE_SOURCE });
  const milletName = 'Bajra(Pearl Millet/Cumbu)', millet = makeRow(milletName, 200), wheat = makeRow('Wheat', 150);
  await writeJson(partitionName(millet.state, millet.commodity), [millet]);
  await writeJson(partitionName(wheat.state, wheat.commodity), [wheat]);
  await writeJson('local-catalog.json', [millet, wheat]);
  let modelCalls = 0, locationCalls = 0;
  const server = createPriceServer({ recognize: () => { modelCalls++; throw new Error('Manual confirmation must not call vision'); }, locate: async () => {
    locationCalls++;
    return [{ state: millet.state, district: millet.district, label: 'Test area' }];
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, body, token, method = 'POST') => {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() };
  };
  const query = { state: millet.state, district: millet.district, market: millet.market, commodity: millet.commodity, variety: millet.variety, grade: millet.grade };
  const selection = { query, cropConfirmed: true, varietyConfirmed: true, gradeConfirmed: true, horizonDays: 7,
    quantity: 250, unit: 'kg', costs: { [millet.id]: { transport: 10, handling: 0, fees: 0 } } };
  let crop, review;
  try {
    await t.test('source catalog expands manual price coverage without claiming automatic recognition', async () => {
      const result = await request('/api/crops', undefined, undefined, 'GET');
      assert.equal(result.status, 200);
      crop = result.body.crops.find(c => c.commodity === milletName);
      assert.ok(crop?.hasSourcedPrices);
      assert.ok(!result.body.automaticIdentificationCrops.some(c => c.id === crop.id));
      assert.equal((await request('/api/catalog?state=Test%20state', undefined, undefined, 'GET')).body.series.length, 2);
      review = { crop: crop.id, reviewed: true, counts: { grains: 100, broken: 5 } };
    });
    await t.test('comparison supplies existing field names, sourced dynamic IDs and exact kg/quintal costs', async () => {
      const result = await request('/api/compare', selection);
      assert.equal(result.status, 200);
      assert.equal(result.body.rows[0].estimate.gross, 500);
      assert.equal(result.body.rows[0].estimate.remainder, 490);
      const state = result.body.marketState;
      assert.equal(state.quantityQuintals, 2.5);
      assert.equal(state.quotes[0].id, millet.id);
      assert.equal(state.quotes[0].pricePerQuintal, 200);
      assert.equal(state.quotes[0].quotedOn, '2026-01-01');
      assert.equal(state.quotes[0].stale, true);
      assert.equal(state.quotes[0].source.id, ARCHIVE_SOURCE.id);
      const quote = state.quotes[0];
      // Same calculation used by the existing app selector.
      assert.equal(quote.pricePerQuintal * state.quantityQuintals - Object.values(quote.costs).reduce((a, b) => a + b), result.body.rows[0].estimate.remainder);
      const unknown = (await request('/api/compare', { ...selection, costs: { [millet.id]: { fees: 0 } } })).body;
      assert.equal(unknown.rows[0].estimate.remainder, null);
      assert.equal(unknown.marketState.quotes[0].costs.transport, null);
      assert.equal(appMarketState([millet, makeRow(milletName, 201, 'Other grade')], 1, 'quintal'), null);
      assert.equal(appMarketState([{ ...millet, grade: '' }], 1, 'quintal'), null);
    });
    await t.test('manually confirmed sourced crop bypasses the old five-crop restriction and needs no model key', async () => {
      const result = await request('/api/photo-prices', selection);
      assert.equal(result.status, 200);
      assert.equal(result.body.identification.status, 'farmer_confirmed');
      assert.equal(result.body.selectedCrop.id, crop.id);
      assert.equal(result.body.status, 'forecast_unavailable');
      assert.equal(result.body.reportedPrices.rows[0].modal, 200);
      assert.equal(modelCalls, 0);
      const caps = await request('/api/photo-prices/capabilities', undefined, undefined, 'GET');
      assert.equal(caps.body.recognitionConfigured, false);
      assert.ok(caps.body.priceCrops.some(c => c.id === crop.id));
    });
    await t.test('review links to the same sourced price and forecast gate without inventing a quality premium', async () => {
      const result = await request('/api/grain-screening/prices', { ...selection, review });
      assert.equal(result.status, 200);
      assert.equal(result.body.review.counts.discolored, null);
      assert.equal(result.body.review.moisture, null);
      assert.equal(result.body.qualityPriceAdjustment, null);
      assert.equal(result.body.reportedPrices.rows[0].modal, 200);
      assert.equal(result.body.reportedPrices.marketState.quotes[0].id, millet.id);
      assert.equal(result.body.forecast.available, false);
      assert.equal(result.body.forecast.range, null);
      assert.equal(result.body.forecast.history[0].date, '2026-01-01');
      const missingGrade = await request('/api/grain-screening/prices', { ...selection, review, gradeConfirmed: false });
      assert.deepEqual(missingGrade.body.requiresConfirmation, ['grade']);
      for (const patch of [{ cropConfirmed: false }, { review: { ...review, reviewed: false } }, { review: { ...review, crop: 'wheat' } }, { horizonDays: 3 }, { gradeConfirmed: 'true' }, { costs: { [millet.id]: { fees: -1 } } }]) {
        assert.equal((await request('/api/grain-screening/prices', { ...selection, review, ...patch })).status, 400);
      }
      assert.ok(!(await readdir(dir)).includes('grain-history'));
    });
    await t.test('reviewed crop price lookup respects approximate-location consent', async () => {
      const withoutArea = { ...selection, query: { ...query, state: '' }, review, origin: { lat: 20.014, lon: 73.789 } };
      const noConsent = await request('/api/grain-screening/prices', withoutArea);
      assert.equal(noConsent.body.status, 'location_required');
      assert.equal(locationCalls, 0);
      const withConsent = await request('/api/grain-screening/prices', { ...withoutArea, consentToLocationLookup: true });
      assert.equal(withConsent.status, 200);
      assert.equal(withConsent.body.query.state, millet.state);
      assert.equal(locationCalls, 1);
    });
    await t.test('history requires consent, isolates bearer scopes, survives server instances and deletes records', async () => {
      assert.equal((await request('/api/grain-history/session', {})).status, 400);
      assert.equal((await request('/api/grain-history', undefined, undefined, 'GET')).status, 401);
      const owner = (await request('/api/grain-history/session', { consentToStore: true })).body.token;
      const other = (await request('/api/grain-history/session', { consentToStore: true })).body.token;
      assert.equal((await request('/api/grain-history', { review }, owner)).status, 400);
      assert.equal((await request('/api/grain-history', { review: { ...review, image: {} }, consentToStore: true }, owner)).status, 400);
      const saves = await Promise.all([1, 2].map(() => request('/api/grain-history', { review, consentToStore: true }, owner)));
      assert.ok(saves.every(s => s.status === 201));
      const records = (await request('/api/grain-history', undefined, owner, 'GET')).body.records;
      assert.equal(records.length, 2);
      assert.equal(records[0].provenance, 'farmer-reviewed observations');
      assert.equal(records[0].moisture, null);
      assert.equal(records[0].stored, true);
      assert.deepEqual((await request('/api/grain-history', undefined, other, 'GET')).body.records, []);
      assert.equal((await request('/api/grain-history/' + records[0].id, undefined, other, 'DELETE')).status, 404);
      const second = createPriceServer();
      await new Promise(resolve => second.listen(0, '127.0.0.1', resolve));
      try {
        const persisted = await (await fetch(`http://127.0.0.1:${second.address().port}/api/grain-history`, { headers: { Authorization: 'Bearer ' + owner } })).json();
        assert.equal(persisted.records.length, 2);
      } finally { await new Promise(resolve => second.close(resolve)); }
      assert.equal((await request('/api/grain-history/' + records[0].id, undefined, owner, 'DELETE')).body.deleted, true);
      assert.equal((await request('/api/grain-history', undefined, owner, 'GET')).body.records.length, 1);
      assert.equal((await request('/api/grain-history', undefined, owner, 'DELETE')).body.tokenRevoked, true);
      assert.equal((await request('/api/grain-history', undefined, owner, 'GET')).status, 401);
      assert.equal((await request('/api/grain-history', undefined, other, 'DELETE')).status, 200);
      assert.deepEqual(await readdir(join(dir, 'grain-history')), []);
    });
  } finally {
    await new Promise(resolve => server.close(resolve));
    assert.equal(resolve(dirname(dir)), resolve(tmpdir()));
    await rm(dir, { recursive: true });
  }
});
