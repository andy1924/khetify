// Provider implementation stays on the backend; never expose OAuth credentials to Expo.
import { createHash } from 'node:crypto';
const cache = new Map(), pending = new Map();
const CACHE_MS = 15 * 60000;
const base = 'https://sh.dataspace.copernicus.eu';
let token, expires = 0;
async function accessToken() {
  if (token && Date.now() < expires) return token;
  const response = await fetch('https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token', {
    method: 'POST', body: new URLSearchParams({ grant_type: 'client_credentials', client_id: process.env.CDSE_CLIENT_ID, client_secret: process.env.CDSE_CLIENT_SECRET }), signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error('Copernicus authentication failed.');
  const data = await response.json(); token = data.access_token; expires = Date.now() + Math.max(0, data.expires_in - 60) * 1000; return token;
}
async function post(path, body) {
  const response = await fetch(`${base}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('Copernicus request failed.');
  return response.json();
}
const imageScript = `//VERSION=3
function setup() { return { input: ['B02','B03','B04','dataMask'], output: { bands: 4 } }; }
function display(v) { return Math.pow(Math.max(0, Math.min(1, 2.5*v)), 1/1.4); }
function evaluatePixel(s) { return [display(s.B04), display(s.B03), display(s.B02), s.dataMask]; }`;
export function imageBoundsFor(geometry) {
  const ring = geometry.coordinates[0], xs = ring.map(p => p[0]), ys = ring.map(p => p[1]);
  const west = Math.min(...xs), east = Math.max(...xs), south = Math.min(...ys), north = Math.max(...ys);
  const latitude = (north + south) / 2, longitude = (west + east) / 2;
  const lonMeters = 111320 * Math.cos(latitude * Math.PI / 180);
  const halfMeters = Math.max(300, (east - west) * lonMeters * .7, (north - south) * 111320 * .7);
  return { west: longitude - halfMeters / lonMeters, east: longitude + halfMeters / lonMeters,
    south: latitude - halfMeters / 111320, north: latitude + halfMeters / 111320 };
}
async function fieldImage(geometry, from, to) {
  const imageBounds = imageBoundsFor(geometry);
  const response = await fetch(`${base}/process/v1`, {
    method: 'POST', headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json', Accept: 'image/png' },
    body: JSON.stringify({ input: { bounds: { bbox: [imageBounds.west, imageBounds.south, imageBounds.east, imageBounds.north], properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' } }, data: [{ type: 'sentinel-2-l2a', dataFilter: { timeRange: { from, to } }, processing: { upsampling: 'BILINEAR', downsampling: 'BILINEAR' } }] }, output: { width: 768, height: 768, responses: [{ identifier: 'default', format: { type: 'image/png' } }] }, evalscript: imageScript }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('Satellite image could not be loaded. Please retry.');
  return { imageUrl: `data:image/png;base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`, imageBounds };
}
export function geometryFor(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3 || polygon.length > 50 || polygon.some(p => !p || !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude) || p.latitude < 6 || p.latitude > 38 || p.longitude < 68 || p.longitude > 98)) throw Object.assign(new Error('Supply 3–50 field corners in the India service envelope (6–38 N, 68–98 E).'), { status: 400 });
  const coordinates = polygon.map(p => [p.longitude, p.latitude]);
  const xs = coordinates.map(p => p[0]), ys = coordinates.map(p => p[1]);
  if (Math.max(...xs) - Math.min(...xs) > .1 || Math.max(...ys) - Math.min(...ys) > .1) throw Object.assign(new Error('Boundary exceeds field request size limit.'), { status: 400 });
  const area = coordinates.reduce((a, p, i) => { const q = coordinates[(i + 1) % coordinates.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0);
  if (Math.abs(area) < 1e-10) throw Object.assign(new Error('Boundary must have nonzero area.'), { status: 400 });
  coordinates.push(coordinates[0]);
  return { type: 'Polygon', coordinates: [coordinates] };
}
const evalscript = `//VERSION=3
function setup() { return { input: [{ bands: ['B04','B08','SCL','dataMask'] }], output: [{ id:'ndvi', bands:1 },{ id:'quality', bands:1 },{ id:'dataMask', bands:['ndvi','quality'] }] }; }
function evaluatePixel(s) { let bad = [0,1,3,8,9,10,11].includes(s.SCL) || !Number.isFinite(s.B08) || !Number.isFinite(s.B04) || s.B08<0 || s.B04<0 || s.B08+s.B04<=0, valid = !bad; return { ndvi: [valid ? (s.B08-s.B04)/(s.B08+s.B04) : 0], quality:[bad ? 1 : 0], dataMask:[s.dataMask * (valid ? 1 : 0), s.dataMask] }; }`;
async function loadObservations(polygon) {
    const geometry = geometryFor(polygon);
    if (!process.env.CDSE_CLIENT_ID || !process.env.CDSE_CLIENT_SECRET) return { status: 'unconfigured', observations: [] };
    const to = new Date(), from = new Date(to.getTime() - 30 * 86400000);
    const catalog = await post('/catalog/v1/search', { collections: ['sentinel-2-l2a'], intersects: geometry, datetime: `${from.toISOString()}/${to.toISOString()}`, limit: 100 });
    // Adjacent catalog tiles can describe the same pass with timestamps seconds
    // apart. Request one daily mosaic instead of treating each tile as a capture.
    const days = new Map();
    for (const scene of (catalog.features || []).sort((a,b) => b.properties.datetime.localeCompare(a.properties.datetime))) {
      const day = scene.properties.datetime.slice(0, 10);
      if (!days.has(day)) days.set(day, scene);
    }
    const scenes = [...days.values()].slice(0, 3);
    if (!scenes.length) return { status: 'no-coverage', observations: [] };
    const observations = await Promise.all(scenes.map(async (scene, index) => {
      const capturedAt = scene.properties.datetime;
      const start = `${capturedAt.slice(0, 10)}T00:00:00.000Z`, end = new Date(Date.parse(start) + 86400000).toISOString();
      // A complete UTC day matches P1D and includes the actual pixel acquisition
      // times, which can differ from a catalog tile's nominal timestamp.
      const stats = await post('/statistics/v1', { input: { bounds: { geometry }, data: [{ type: 'sentinel-2-l2a' }] }, aggregation: { timeRange: { from: start, to: end }, aggregationInterval: { of: 'P1D' }, resx: 0.0001, resy: 0.0001, evalscript } });
      const outputs = stats.data?.[0]?.outputs;
      const n = outputs?.ndvi?.bands?.B0?.stats, q = outputs?.quality?.bands?.B0?.stats;
      // sampleCount includes the enclosing raster rectangle; noDataCount also
      // includes pixels outside the polygon. Only field pixels belong below.
      const fieldPixels = stats.geometryPixelCount;
      const observedPixels = q?.sampleCount - q?.noDataCount;
      const coverage = Number.isFinite(fieldPixels) && fieldPixels > 0 && Number.isFinite(observedPixels)
        ? Math.max(0, Math.min(100, 100 * observedPixels / fieldPixels)) : null;
      const cloud = Number.isFinite(q?.mean) && q.mean >= 0 && q.mean <= 1 ? q.mean * 100 : null;
      const validNdvi = Number.isFinite(n?.mean) && n.mean >= -1 && n.mean <= 1;
      const usable = validNdvi && coverage !== null && coverage >= 80 && cloud !== null && cloud < 30 && n?.sampleCount - n?.noDataCount >= 5;
      // Render the latest capture only; the remaining captures supply dated comparisons.
      const image = index === 0 ? await fieldImage(geometry, start, end).catch(() => ({ imageError: 'Image could not be loaded. Refresh to retry.' })) : {};
      return { ...image, capturedAt, source: 'Copernicus Sentinel-2 L2A · ~10 m sampling', cloudPercent: cloud, fieldCoveragePercent: coverage,
        confidence: usable ? 'moderate' : 'low', ndvi: usable && Number.isFinite(n?.mean) ? n.mean : null,
        summary: usable ? 'Vegetation signal for this capture. Compare dated values alongside field inspection; crop stage and soil background affect NDVI.' : Number.isFinite(n?.mean) && !validNdvi ? 'Invalid vegetation index outside −1 to 1 was rejected. No reliable reading is displayed.' : 'Cloudy image, invalid pixels, insufficient clear pixels or incomplete coverage. No reliable vegetation signal available.' };
    }));
    return { status: 'ready', observations };
}
export const copernicusProvider = {
  async getObservations(polygon, { refresh = false } = {}) {
    geometryFor(polygon);
    const key = createHash('sha256').update(JSON.stringify(polygon)).digest('hex');
    const existing = cache.get(key);
    if (!refresh && existing && Date.now() < existing.expiresAt) return { ...existing.data, cached: true, fetchedAt: existing.fetchedAt, expiresAt: existing.expiresAt };
    if (pending.has(key)) return pending.get(key);
    const operation = (async () => {
      const data = await loadObservations(polygon);
      if (data.status === 'unconfigured') return data;
      const fetchedAt = new Date().toISOString(), expiresAt = Date.now() + CACHE_MS;
      // In-memory only, bounded to 24 field previews. Do not retain precise boundaries on disk.
      if (data.observations.every(o => !o.imageError)) {
        if (cache.size >= 24) cache.delete(cache.keys().next().value);
        cache.set(key, { data, fetchedAt, expiresAt });
      }
      return { ...data, cached: false, fetchedAt, expiresAt };
    })();
    pending.set(key, operation);
    try { return await operation; } finally { pending.delete(key); }
  },
};
