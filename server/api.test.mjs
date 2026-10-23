import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

test('HTTP API: real unavailable states, scoped history, safe validation, no demo fallback', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'khetify-price-test-'));
  process.env.PRICE_DATA_DIR = dir;
  delete process.env.DATA_GOV_API_KEY;
  const { createPriceServer } = await import('./index.mjs');
  const { saveRows } = await import('./store.mjs');
  const { normalize } = await import('./prices.mjs');
  const server = createPriceServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    let response = await fetch(base + '/api/prices?state=Test&commodity=Wheat');
    let data = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(data.rows, []);
    assert.match(data.warning, /not configured/);
    assert.equal(data.cached, true);
    const row = normalize({ state: 'Test', district: 'District', market: 'Market', commodity: 'Wheat', variety: 'Variety', grade: 'FAQ', arrival_date: '2026-01-01', min_price: '100', max_price: '200', modal_price: '150' }, '2026-01-02T00:00:00Z');
    await saveRows([row]);
    data = await (await fetch(base + '/api/prices?state=Test&commodity=Wheat')).json();
    assert.equal(data.rows[0].modal, 150);
    assert.equal(data.rows[0].stale, true);
    assert.equal(data.rows[0].distanceKm, null);
    assert.equal((await (await fetch(base + '/api/catalog')).json()).series.length, 1);
    const forecast = await (await fetch(base + '/api/forecast?state=Test&district=District&commodity=Wheat&market=Market&variety=Variety&grade=FAQ&horizon=7')).json();
    assert.equal(forecast.available, false);
    assert.equal(forecast.range, null);
    assert.equal(forecast.history.length, 1);
    const compareBody = { query: { state: 'Test', commodity: 'Wheat' }, origin: { lat: 20, lon: 73 }, radiusKm: 10, quantity: 100, unit: 'kg',
      costs: { [row.id]: { transport: 10, handling: 0, fees: 0 } },
      marketLocations: [{ state: 'Test', district: 'District', market: 'Market', lat: 20, lon: 73, sourceUrl: 'https://www.openstreetmap.org/node/1', confirmed: true }] };
    response = await fetch(base + '/api/compare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(compareBody) });
    const comparison = await response.json();
    assert.equal(response.status, 200);
    assert.equal(comparison.rows[0].distanceKm, 0);
    assert.equal(comparison.rows[0].estimate.gross, 150);
    assert.equal(comparison.rows[0].estimate.remainder, 140);
    assert.equal(comparison.comparable, false); // stale history is not a current comparison
    assert.equal(comparison.originStored, false);
    assert.match(comparison.rows[0].location.basis, /not independently verified/);
    for (const patch of [{ quantity: -1 }, { unit: 'tonne' }, { origin: { lat: 999, lon: 1 } }, { radiusKm: 501 }, { costs: { [row.id]: { fees: -1 } } }, { marketLocations: [{ ...compareBody.marketLocations[0], confirmed: false }] }]) {
      response = await fetch(base + '/api/compare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...compareBody, ...patch }) });
      assert.equal(response.status, 400, JSON.stringify(patch));
    }
    for (const path of ['/api/prices', '/api/places?q=x', '/api/places?lat=999&lon=2', '/api/forecast?state=Test&commodity=Wheat']) {
      response = await fetch(base + path);
      assert.equal(response.status, 400, path);
    }
    assert.equal((await fetch(base + '/api/prices', { method: 'POST' })).status, 405);
    response = await fetch(base + '/api/grain-screening/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ crop: 'pearl_millet', reviewed: true, counts: { grains: 25, broken: 2 } }) });
    const review = await response.json();
    assert.equal(response.status, 200);
    assert.equal(review.counts.broken, 2);
    assert.equal(review.counts.foreignMaterial, null);
    assert.equal(review.moisture, null);
    assert.equal(review.stored, false);
    assert.equal((await fetch(base + '/api/grain-screening/review')).status, 405);
    assert.equal((await fetch(base + '/api/grain-screening', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ crop: 'rice', consentToUpload: false }) })).status, 400);
    // An authorized local archive works without API credentials and keeps its source date.
    const { partitionName, ARCHIVE_SOURCE } = await import('./local-prices.mjs');
    const { writeJson } = await import('./store.mjs');
    await writeJson(partitionName('Test', 'Wheat'), [{ ...row, source: ARCHIVE_SOURCE }]);
    process.env.PRICE_PROVIDER = 'local';
    const local = await (await fetch(base + '/api/prices?state=Test&commodity=Wheat')).json();
    assert.equal(local.providerMode, 'local_archive');
    assert.equal(local.rows[0].date, '2026-01-01');
    assert.equal(local.rows[0].source.id, ARCHIVE_SOURCE.id);
    assert.equal(local.rows[0].stale, true);
    delete process.env.PRICE_PROVIDER;
  } finally {
    await new Promise(resolve => server.close(resolve));
    assert.equal(resolve(dirname(dir)), resolve(tmpdir()));
    await rm(dir, { recursive: true });
  }
});
