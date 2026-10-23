import { copernicusProvider } from './satellite.mjs';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { SOURCE, compare, forecast, keyOf, matches } from './prices.mjs';
import { readJson, saveRows, writeJson } from './store.mjs';
import { fetchPrices } from './provider.mjs';
import { lookupPlace } from './osm.mjs';
import { enrichComparison } from './comparison.mjs';
import { analysisTokens, cropScope, identifyCrop, PHOTO_BODY_LIMIT, PHOTO_LIMITATIONS } from './crop-vision.mjs';
import { photoPrices } from './photo-prices.mjs';

const refreshes = new Map();
async function refresh(query) {
  const key = JSON.stringify(query);
  if (refreshes.has(key)) return refreshes.get(key);
  const operation = (async () => {
    const metadata = await readJson('sync.json', {});
    if (metadata[key] && Date.now() - Date.parse(metadata[key].at) < 15 * 60000) return metadata[key];
    const result = await fetchPrices(query);
    await saveRows(result.records);
    // Merge at write time; unrelated query metadata must not be lost.
    const updated = await readJson('sync.json', {});
    updated[key] = { at: result.fetchedAt, rejected: result.rejected, count: result.records.length };
    await writeJson('sync.json', updated);
    return updated[key];
  })();
  refreshes.set(key, operation);
  try { return await operation; } finally { refreshes.delete(key); }
}
const fail = message => Object.assign(new Error(message), { status: 400 });
function queryFrom(params) {
  const query = {};
  for (const key of ['state', 'district', 'commodity', 'market', 'variety', 'grade']) {
    const value = params.get(key)?.trim();
    if (value) { if (value.length > 120 || /[\x00-\x1f]/.test(value)) throw fail('Invalid search field.'); query[key] = value; }
  }
  return query;
}
function originFrom(params) {
  if (!params.has('lat') && !params.has('lon')) return null;
  const lat = Number(params.get('lat')), lon = Number(params.get('lon'));
  if (!params.get('lat') || !params.get('lon') || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw fail('Invalid location.');
  return { lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100 };
}

async function priceResult(query, origin, radius, suppliedLocations = []) {
  if (!query.state || !query.commodity) throw fail('Choose a state and crop.');
  let warning = null, sync = null;
  try { sync = await refresh(query); } catch (error) { warning = error.message; }
  const stored = await readJson('prices.json', []);
  const locations = [...suppliedLocations, ...await readJson('markets.json', [])];
  const rows = compare(stored, query, locations, origin, radius);
  return { rows: rows.slice(0, 100), total: rows.length, truncated: rows.length > 100, source: SOURCE, sync, warning,
    servedAt: new Date().toISOString(), cached: Boolean(warning), locationCoverage: `${rows.filter(r => r.location).length}/${rows.length}` };
}
async function readBody(req, limit = 32768) {
  const chunks = [];
  let bytes = 0;
  if (Number(req.headers['content-length']) > limit) throw Object.assign(fail('Request body is too large.'), { status: 413 });
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > limit) throw Object.assign(fail('Request body is too large.'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error();
    return parsed;
  } catch { throw fail('Supply a JSON object.'); }
}

async function forecastResult(query, horizon) {
  const rows = (await readJson('prices.json', [])).filter(r => matches(r, query));
  const policies = await readJson('policies.json', []);
  const seriesKey = rows[0] ? keyOf(rows[0]) : null;
  const policy = policies.find(p => p.seriesKey === seriesKey && p.horizonDays === horizon);
  return forecast(rows, horizon, policy);
}
function comparisonInput(body) {
  const fields = new URLSearchParams();
  if (!body.query || typeof body.query !== 'object' || Array.isArray(body.query)) throw fail('Supply a price query.');
  for (const [k, v] of Object.entries(body.query)) {
    if (typeof v !== 'string') throw fail('Query fields must be text.');
    fields.set(k, v);
  }
  const query = queryFrom(fields);
  const coordinates = new URLSearchParams();
  if (body.origin !== undefined) {
    if (!body.origin || typeof body.origin.lat !== 'number' || typeof body.origin.lon !== 'number') throw fail('Supply numeric origin coordinates.');
    coordinates.set('lat', String(body.origin.lat)); coordinates.set('lon', String(body.origin.lon));
  }
  const origin = originFrom(coordinates), radius = body.radiusKm ?? null;
  if (radius !== null && (!origin || typeof radius !== 'number' || !Number.isFinite(radius) || radius <= 0 || radius > 500)) throw fail('Choose an origin and a radius of up to 500 km.');
  if (body.quantity !== undefined && (typeof body.quantity !== 'number' || !Number.isFinite(body.quantity) || body.quantity <= 0)) throw fail('Quantity must be a positive number.');
  const unit = body.unit || 'quintal';
  if (!['kg', 'quintal'].includes(unit)) throw fail('Unit must be kg or quintal.');
  const costs = body.costs || {};
  if (typeof costs !== 'object' || Array.isArray(costs)) throw fail('Costs must be keyed by sourced price record ID.');
  for (const record of Object.values(costs)) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) throw fail('Supply transport, handling and fees totals for each market record.');
    for (const [key, value] of Object.entries(record)) if (!['transport', 'handling', 'fees'].includes(key) || (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0))) throw fail('Costs must be non-negative numbers or null for unknown.');
  }
  const locations = body.marketLocations || [];
  if (!Array.isArray(locations) || locations.length > 100) throw fail('Supply up to 100 caller-confirmed market pins.');
  for (const loc of locations) {
    if (!loc || !['state', 'district', 'market'].every(k => typeof loc[k] === 'string' && loc[k].length > 0 && loc[k].length <= 120) ||
      !Number.isFinite(loc.lat) || !Number.isFinite(loc.lon) || Math.abs(loc.lat) > 90 || Math.abs(loc.lon) > 180 ||
      !/^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/\d+$/.test(loc.sourceUrl) || loc.confirmed !== true) throw fail('Each market pin requires a matching identity, valid coordinates, OSM object URL and confirmed=true.');
  }
  return { query, origin, radius, quantity: body.quantity, unit, costs, locations: locations.map(loc => ({ ...loc, verifiedOn: new Date().toISOString().slice(0, 10), basis: 'Caller-confirmed OSM pin; not independently verified' })) };
}

export function createPriceServer({ recognize = identifyCrop, locate = lookupPlace } = {}) {
  const rate = new Map();
  const tokens = analysisTokens();
  let activePhotos = 0;
  return createServer({ requestTimeout: 30000, headersTimeout: 10000 }, async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', process.env.PRICE_ALLOWED_ORIGIN || 'http://localhost:8081');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (code, body) => { res.writeHead(code); res.end(JSON.stringify(body)); };
    if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); return send(204, null); }
    if (req.method !== 'GET' && !(req.method === 'POST' && ['/api/compare', '/api/photo-prices', '/api/field-observations'].includes(req.url))) return send(405, { error: 'Use GET, POST /api/compare or POST /api/photo-prices.' });
    try {
      const address = req.socket.remoteAddress;
      const current = rate.get(address);
      const counter = current && Date.now() - current.at < 60000 ? current : { at: Date.now(), count: 0 };
      if (++counter.count > 60) return send(429, { error: 'Too many requests. Please wait a minute.' });
      rate.set(address, counter);
      if (rate.size > 10000) for (const [ip, value] of rate) if (Date.now() - value.at > 60000) rate.delete(ip);
      const url = new URL(req.url, 'http://localhost');
      const params = url.searchParams;
      if (url.pathname === '/api/field-observations') {
        if (req.method !== 'POST') return send(405, { error: 'Use POST.' });
        return send(200, await copernicusProvider.getObservations((await readBody(req)).polygon));
      }
      if (url.pathname === '/api/photo-prices/capabilities') return send(200, { supportedCrops: await cropScope(), recognitionConfigured: Boolean(process.env.OPENAI_API_KEY && process.env.CROP_VISION_MODEL),
        maxPhotoBytes: 5 * 1024 * 1024, acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'], farmerConfirmationRequired: true, limitations: PHOTO_LIMITATIONS });
      if (url.pathname === '/api/photo-prices') {
        if (req.method !== 'POST') return send(405, { error: 'Use POST with a crop photo or analysis token.' });
        if (activePhotos >= 2) return send(429, { error: 'Photo processing is busy. Please retry shortly.' });
        activePhotos++;
        try {
          const body = await readBody(req, PHOTO_BODY_LIMIT);
          return send(200, await photoPrices(body, { tokens, parseInput: comparisonInput, priceResult, forecastResult, recognize, locate }));
        } finally { activePhotos--; }
      }
      if (url.pathname === '/api/compare') {
        if (req.method !== 'POST') return send(405, { error: 'Use POST with a comparison JSON object.' });
        const input = comparisonInput(await readBody(req));
        const result = await priceResult(input.query, input.origin, input.radius, input.locations);
        return send(200, { ...result, ...enrichComparison(result.rows, input.quantity, input.unit, input.costs), locationAttribution: '© OpenStreetMap contributors, ODbL', originStored: false });
      }
      if (url.pathname === '/health') return send(200, { ok: true, priceFeedConfigured: Boolean(process.env.DATA_GOV_API_KEY), sourceVerified: process.env.PRICE_SOURCE_VERIFIED === 'true', visionConfigured: Boolean(process.env.OPENAI_API_KEY && process.env.CROP_VISION_MODEL) });
      if (url.pathname === '/api/places') {
        const q = params.get('q')?.trim();
        const origin = originFrom(params);
        if (!origin && (!q || q.length < 3 || q.length > 180)) throw fail('Enter a town or market name (3–180 characters).');
        const search = origin ? new URLSearchParams({ lat: String(origin.lat), lon: String(origin.lon), zoom: '10' }) : new URLSearchParams({ q });
        return send(200, { places: await lookupPlace(search), attribution: '© OpenStreetMap contributors, ODbL' });
      }
      if (!['/api/prices', '/api/catalog', '/api/forecast'].includes(url.pathname)) return send(404, { error: 'Not found.' });
      const query = queryFrom(params);
      if (url.pathname === '/api/catalog') {
        const rows = (await readJson('prices.json', [])).filter(r => matches(r, query));
        const series = [...new Map(rows.map(r => [keyOf(r), { state: r.state, district: r.district, market: r.market, commodity: r.commodity, variety: r.variety, grade: r.grade, unit: r.unit }])).values()];
        return send(200, { series });
      }
      if (!query.state || !query.commodity) throw fail('Choose a state and crop.');
      if (url.pathname === '/api/forecast') {
        if (!query.market || !query.district || !query.variety || !query.grade) throw fail('Choose an exact market, district, variety and grade from sourced records.');
        const horizon = Number(params.get('horizon'));
        if (![7, 14, 30].includes(horizon)) throw fail('Choose a 7, 14 or 30 day horizon.');
        return send(200, await forecastResult(query, horizon));
      }
      const origin = originFrom(params);
      const radius = params.has('radius') ? Number(params.get('radius')) : null;
      if (radius !== null && (!origin || !Number.isFinite(radius) || radius <= 0 || radius > 500)) throw fail('Choose a location and a radius of up to 500 km.');
      return send(200, await priceResult(query, origin, radius));
    } catch (error) {
      send(error.status || 503, { error: error.status ? error.message : 'Service temporarily unavailable. Retry or enter your area manually.' });
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createPriceServer();
  server.listen(Number(process.env.PRICE_API_PORT || 8787), process.env.PRICE_API_HOST || '127.0.0.1', () => console.log('Price API listening on port ' + (process.env.PRICE_API_PORT || 8787)));
}
