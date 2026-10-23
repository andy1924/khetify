import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

test('OSM adapter identifies requests, caches town search, and never persists reverse location', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'khetify-osm-test-'));
  process.env.PRICE_DATA_DIR = dir;
  const { lookupPlace } = await import('./osm.mjs');
  const { readJson } = await import('./store.mjs');
  const originalFetch = globalThis.fetch;
  let calls = 0;
  const place = { osm_type: 'node', osm_id: 1, display_name: 'Test town, India', lat: '20', lon: '73', address: { country_code: 'in', state: 'Test', state_district: 'District' } };
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.match(options.headers['User-Agent'], /Khetify/);
    assert.equal(url.searchParams.get('format'), 'jsonv2');
    return { ok: true, json: async () => url.pathname.endsWith('reverse') ? place : [place] };
  };
  try {
    const query = new URLSearchParams({ q: 'Test town, India' });
    const first = await lookupPlace(query);
    const second = await lookupPlace(query);
    assert.deepEqual(first, second);
    assert.equal(calls, 1);
    assert.equal(first[0].state, 'Test');
    assert.equal(first[0].sourceUrl, 'https://www.openstreetmap.org/node/1');
    await lookupPlace(new URLSearchParams({ lat: '20', lon: '73', zoom: '10' }));
    const cache = await readJson('places.json', {});
    assert.equal(Object.keys(cache).length, 1);
    assert.ok(!Object.keys(cache).some(key => key.includes('lat=')));
  } finally {
    globalThis.fetch = originalFetch;
    assert.equal(resolve(dirname(dir)), resolve(tmpdir()));
    await rm(dir, { recursive: true });
  }
});
