// Provider implementation stays on the backend; never expose OAuth credentials to Expo.
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
function evaluatePixel(s) { return [2.5*s.B04, 2.5*s.B03, 2.5*s.B02, s.dataMask]; }`;
async function fieldImage(geometry, from, to) {
  const response = await fetch(`${base}/process/v1`, {
    method: 'POST', headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json', Accept: 'image/png' },
    body: JSON.stringify({ input: { bounds: { geometry }, data: [{ type: 'sentinel-2-l2a', dataFilter: { timeRange: { from, to } } }] }, output: { width: 256, height: 256, responses: [{ identifier: 'default', format: { type: 'image/png' } }] }, evalscript: imageScript }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('Satellite image could not be loaded. Please retry.');
  return `data:image/png;base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`;
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
function setup() { return { input: [{ bands: ['B04','B08','SCL','dataMask'] }], output: [{ id:'ndvi', bands:1 },{ id:'quality', bands:1 },{ id:'dataMask', bands:1 }] }; }
function evaluatePixel(s) { let bad = [0,1,3,8,9,10,11].includes(s.SCL); return { ndvi: [bad || s.B08+s.B04===0 ? NaN : (s.B08-s.B04)/(s.B08+s.B04)], quality:[bad ? 1 : 0], dataMask:[s.dataMask] }; }`;
export const copernicusProvider = {
  async getObservations(polygon) {
    const geometry = geometryFor(polygon);
    if (!process.env.CDSE_CLIENT_ID || !process.env.CDSE_CLIENT_SECRET) return { status: 'unconfigured', observations: [] };
    const to = new Date(), from = new Date(to.getTime() - 30 * 86400000);
    const catalog = await post('/catalog/v1/search', { collections: ['sentinel-2-l2a'], intersects: geometry, datetime: `${from.toISOString()}/${to.toISOString()}`, limit: 100 });
    const scenes = [...new Map((catalog.features || []).sort((a,b) => b.properties.datetime.localeCompare(a.properties.datetime)).map(f => [f.properties.datetime, f])).values()].slice(0, 3);
    if (!scenes.length) return { status: 'no-coverage', observations: [] };
    const observations = await Promise.all(scenes.map(async (scene, index) => {
      const capturedAt = scene.properties.datetime;
      const start = new Date(Date.parse(capturedAt) - 1000).toISOString(), end = new Date(Date.parse(capturedAt) + 1000).toISOString();
      const stats = await post('/statistics/v1', { input: { bounds: { geometry }, data: [{ type: 'sentinel-2-l2a' }] }, aggregation: { timeRange: { from: start, to: end }, aggregationInterval: { of: 'P1D' }, resx: 0.0001, resy: 0.0001, evalscript } });
      const outputs = stats.data?.[0]?.outputs;
      const n = outputs?.ndvi?.bands?.B0?.stats, q = outputs?.quality?.bands?.B0?.stats;
      const coverage = q?.sampleCount > 0 ? 100 * (1 - q.noDataCount / q.sampleCount) : null;
      const cloud = Number.isFinite(q?.mean) ? q.mean * 100 : null;
      const usable = coverage !== null && coverage >= 80 && cloud !== null && cloud < 30 && n?.sampleCount - n?.noDataCount >= 5;
      // Render the latest capture only; the remaining captures supply dated comparisons.
      const image = index === 0 ? await fieldImage(geometry, start, end).then(imageUrl => ({ imageUrl }), () => ({ imageError: 'Image could not be loaded. Refresh to retry.' })) : {};
      return { ...image, capturedAt, source: 'Copernicus Sentinel-2 L2A · ~10 m sampling', cloudPercent: cloud, fieldCoveragePercent: coverage,
        confidence: usable ? 'moderate' : 'low', ndvi: usable && Number.isFinite(n?.mean) ? n.mean : null,
        summary: usable ? 'Vegetation signal for this capture. Compare dated values alongside field inspection; crop stage and soil background affect NDVI.' : 'Cloudy image, insufficient clear pixels or incomplete coverage. No reliable vegetation signal available.' };
    }));
    return { status: 'ready', observations };
  },
};
