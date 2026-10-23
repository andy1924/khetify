import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchPrices } from './provider.mjs';

test('unconfigured provider fails closed and does not call upstream', async () => {
  delete process.env.DATA_GOV_API_KEY;
  await assert.rejects(fetchPrices({}, () => { throw new Error('must not call'); }), /not configured/);
});
test('source verification is required before connecting a key', async () => {
  process.env.DATA_GOV_API_KEY = 'unit-test-placeholder';
  process.env.PRICE_SOURCE_VERIFIED = 'false';
  await assert.rejects(fetchPrices({}, () => { throw new Error('must not call'); }), /verified/);
});
test('provider paginates and encodes filters; invalid rows are counted', async () => {
  process.env.DATA_GOV_API_KEY = 'unit-test-placeholder';
  process.env.PRICE_SOURCE_VERIFIED = 'true';
  let calls = 0;
  const result = await fetchPrices({ state: 'Test & State', commodity: 'Test Crop' }, async url => {
    assert.equal(url.searchParams.get('filters[state]'), 'Test & State');
    assert.equal(url.searchParams.get('filters[commodity]'), 'Test Crop');
    assert.equal(url.searchParams.get('offset'), String(calls * 1000));
    calls++;
    return { ok: true, json: async () => ({ total: 1001, records: Array.from({ length: calls === 1 ? 1000 : 1 }, () => ({})) }) };
  });
  assert.equal(calls, 2);
  assert.equal(result.records.length, 0);
  assert.equal(result.rejected, 1001);
});
test('malformed schema, provider denial and network failures never return fake rates', async () => {
  for (const mock of [async () => ({ ok: false, status: 403 }), async () => ({ ok: true, json: async () => ({ error: 'invalid key' }) }), async () => { throw new Error('url-with-secret'); }]) {
    await assert.rejects(fetchPrices({}, mock), error => !error.message.includes('url-with-secret'));
  }
});
test('partial responses are rejected instead of silently showing an incomplete comparison', async () => {
  await assert.rejects(fetchPrices({}, async () => ({ ok: true, json: async () => ({ total: 30, records: [] }) })), /incomplete/);
  await assert.rejects(fetchPrices({}, async () => ({ ok: true, json: async () => ({ total: 1001, records: Array.from({ length: 500 }, () => ({})) }) })), /incomplete/);
});
