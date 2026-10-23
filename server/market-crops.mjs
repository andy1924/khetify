import { createHash } from 'node:crypto';
import { cropScope } from './crop-vision.mjs';
import { readJson } from './store.mjs';
import { keyOf, matches } from './prices.mjs';

export async function sourceCatalog(query = {}) {
  const rows = process.env.PRICE_PROVIDER === 'local'
    ? await readJson('local-catalog.json', []) : await readJson('prices.json', []);
  return [...new Map(rows.filter(r => matches(r, query)).map(r => [keyOf(r),
    Object.fromEntries(['state', 'district', 'market', 'commodity', 'variety', 'grade', 'unit'].map(k => [k, r[k]]))])).values()];
}

// Commodity coverage comes from stored source records. It is not detector coverage.
export async function marketCropScope(query = {}) {
  const configured = await cropScope(), catalog = await sourceCatalog(query);
  const commodities = [...new Set(catalog.map(r => r.commodity))];
  const scope = new Map(configured.map(c => [c.commodity.toLowerCase(), { ...c, hasSourcedPrices: false }]));
  for (const commodity of commodities) {
    const existing = scope.get(commodity.toLowerCase());
    scope.set(commodity.toLowerCase(), { ...(existing ?? {
      id: 'commodity_' + createHash('sha256').update(commodity.toLowerCase()).digest('hex').slice(0, 24),
      name: commodity, commodity,
    }), hasSourcedPrices: true });
  }
  return [...scope.values()].sort((a, b) => a.name.localeCompare(b.name));
}
