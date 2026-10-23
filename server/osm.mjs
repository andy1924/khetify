import { readJson, writeJson } from './store.mjs';

let queue = Promise.resolve(), lastCall = 0;
// One shared queue, persistent cache and identifying User-Agent for the public
// Nominatim policy. No autocomplete, bulk geocoding, or location logs.
export function lookupPlace(params) {
  const operation = queue.then(async () => {
    const cache = await readJson('places.json', {});
    const key = params.toString();
    if (cache[key] && Date.now() - cache[key].at < 30 * 86400000) return cache[key].places;
    const delay = Math.max(0, 1100 - (Date.now() - lastCall));
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    lastCall = Date.now();
    const reverse = params.has('lat');
    const url = new URL(reverse ? 'reverse' : 'search', process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org/');
    for (const [key, value] of params) url.searchParams.set(key, value);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('accept-language', 'en');
    if (!reverse) { url.searchParams.set('countrycodes', 'in'); url.searchParams.set('limit', '5'); }
    const response = await fetch(url, { headers: { 'User-Agent': process.env.OSM_USER_AGENT || 'Khetify/1.0 (https://github.com/andy1924/khetify)' }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('OpenStreetMap location lookup is temporarily unavailable. Enter your state and district manually.');
    const body = await response.json();
    const places = (reverse ? [body] : body).filter(p => p.address?.country_code === 'in' && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon))).map(p => ({
      id: `${p.osm_type}/${p.osm_id}`, label: p.display_name, lat: Number(p.lat), lon: Number(p.lon),
      state: p.address.state || '', district: p.address.state_district || p.address.county || p.address.city || '',
      sourceUrl: `https://www.openstreetmap.org/${p.osm_type}/${p.osm_id}`,
    }));
    // Reverse searches contain approximate device positions and are not persisted.
    if (!reverse) {
      cache[key] = { at: Date.now(), places };
      const bounded = Object.fromEntries(Object.entries(cache).sort((a, b) => b[1].at - a[1].at).slice(0, 500));
      await writeJson('places.json', bounded);
    }
    return places;
  });
  queue = operation.catch(() => {});
  return operation;
}
