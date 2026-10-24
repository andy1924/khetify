import { readJson } from './store.mjs';

const DAY = 86400000;
const WEATHER_SOURCE = { name: 'Open-Meteo', url: 'https://open-meteo.com/', basis: 'Weather model estimates · not an official warning' };
// App advisory thresholds, not official IMD warning categories or crop diagnoses.
const rules = [
  { id: 'rain', title: 'Heavy rain possible', hourly: 'precipitation', daily: 'precipitation_sum', threshold: 10, dailyThreshold: 20, unit: 'mm', past: 'Rainy day estimated' },
  { id: 'wind', title: 'Strong gusts possible', hourly: 'wind_gusts_10m', daily: 'wind_gusts_10m_max', threshold: 50, unit: 'km/h', past: 'Strong gusts estimated' },
  { id: 'heat', title: 'High temperature possible', hourly: 'temperature_2m', daily: 'temperature_2m_max', threshold: 40, unit: '°C', past: 'High temperature estimated' },
  { id: 'cold', title: 'Low temperature possible', hourly: 'temperature_2m', daily: 'temperature_2m_min', threshold: 2, low: true, unit: '°C', past: 'Low temperature estimated' },
];
const exceeds = (value, rule, daily = false) => Number.isFinite(value) && (rule.low ? value <= rule.threshold : value >= (daily ? rule.dailyThreshold ?? rule.threshold : rule.threshold));
const validPoint = p => p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && p.latitude >= 6 && p.latitude <= 38 && p.longitude >= 68 && p.longitude <= 98;
function distance(a, b) {
  const rad = v => v * Math.PI / 180;
  const h = Math.sin(rad(a.latitude - b.latitude) / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(a.longitude - b.longitude) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function weatherAlerts(data, now) {
  if (!Array.isArray(data.hourly?.time) || !Array.isArray(data.daily?.time)) throw new Error('Weather data unavailable.');
  const warnings = [], events = [];
  const startOfDay = Math.floor(now / DAY) * DAY;
  for (const rule of rules) {
    const upcoming = data.hourly.time.map((time, index) => ({ time: time * 1000, value: data.hourly[rule.hourly]?.[index] }))
      .filter(row => row.time >= now - 3600000 && row.time <= now + DAY && exceeds(row.value, rule));
    const peak = upcoming.sort((a, b) => rule.low ? a.value - b.value : b.value - a.value)[0];
    if (peak) warnings.push({ id: `weather-${rule.id}`, title: rule.title, category: 'weather', severity: 'advisory',
      occurredAt: new Date(peak.time).toISOString(), expiresAt: new Date(now + DAY).toISOString(),
      detail: `${peak.value.toFixed(1)} ${rule.unit}${rule.id === 'rain' ? ' in one hour' : ''} forecast in the next 24 hours. Check local official updates before planning field work.`, source: WEATHER_SOURCE });
    for (let i = 0; i < data.daily.time.length; i++) {
      const time = data.daily.time[i] * 1000, value = data.daily[rule.daily]?.[i];
      if (time < startOfDay && time >= startOfDay - 7 * DAY && exceeds(value, rule, true)) events.push({ id: `weather-${rule.id}-${time}`, title: rule.past, category: 'weather', severity: 'information',
        occurredAt: new Date(time).toISOString(), detail: `${value.toFixed(1)} ${rule.unit}${rule.id === 'rain' ? ' daily total' : ''}. Historical model estimate, not a verified damage report.`, source: WEATHER_SOURCE });
    }
  }
  return { warnings, events: events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)) };
}

export function publishedIncidents(records, origin, radiusKm, now) {
  if (!Array.isArray(records)) return { warnings: [], events: [] };
  const warnings = [], events = [];
  for (const record of records) {
    if (!record || !['reviewed', 'confirmed'].includes(record.status) || record.sharingConsent !== true || record.published !== true ||
      !validPoint(record.location) || distance(record.location, origin) > radiusKm ||
      typeof record.id !== 'string' || typeof record.title !== 'string' || record.title.length > 200 || typeof record.detail !== 'string' || record.detail.length > 3000 ||
      !record.source?.name || typeof record.source.url !== 'string' || !record.source.url.startsWith('https://')) continue;
    const occurred = Date.parse(record.occurredAt), expires = Date.parse(record.expiresAt);
    if (!Number.isFinite(occurred) || occurred > now || occurred < now - 30 * DAY) continue;
    const entry = { id: record.id, title: record.title, detail: record.detail, category: 'incident', severity: record.status,
      occurredAt: record.occurredAt, source: { name: record.source.name, url: record.source.url, basis: 'Reviewed public incident' },
      distanceKm: Math.round(distance(record.location, origin)) };
    // Never return coordinates, owner identity or private review metadata.
    events.push(entry);
    if (Number.isFinite(expires) && expires > now) warnings.push({ ...entry, expiresAt: record.expiresAt });
  }
  return { warnings, events: events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 100) };
}

export function createAreaAlerts({ request = (...args) => fetch(...args), read = readJson, clock = () => Date.now() } = {}) {
  const cache = new Map();
  return async params => {
    const rawLat = params.get('lat'), rawLon = params.get('lon');
    const origin = { latitude: Number(rawLat), longitude: Number(rawLon) }, radiusKm = Number(params.get('radius') || 10);
    if (!rawLat || !rawLon || !validPoint(origin) || !Number.isFinite(radiusKm) || radiusKm < 1 || radiusKm > 50) throw Object.assign(new Error('Choose an Indian field location and a radius of 1–50 km.'), { status: 400 });
    const now = clock();
    const latitude = Number(origin.latitude.toFixed(2)), longitude = Number(origin.longitude.toFixed(2));
    const key = `${latitude}:${longitude}`;
    const weather = async () => {
      const existing = cache.get(key);
      if (existing && now - existing.at < 10 * 60000) return existing.data;
      const query = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude),
        hourly: 'temperature_2m,precipitation,wind_gusts_10m', daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max',
        past_days: '7', forecast_days: '2', timezone: 'UTC', timeformat: 'unixtime', wind_speed_unit: 'kmh', temperature_unit: 'celsius', precipitation_unit: 'mm' });
      const response = await request(`https://api.open-meteo.com/v1/forecast?${query}`, { signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error('Weather source unavailable.');
      const data = await response.json();
      // A malformed response is not evidence that there are no warnings.
      for (const [section, fields] of [['hourly', ['temperature_2m', 'precipitation', 'wind_gusts_10m']], ['daily', ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'wind_gusts_10m_max']]]) {
        if (!Array.isArray(data[section]?.time) || !data[section].time.length || fields.some(field => !Array.isArray(data[section][field]) || data[section][field].length !== data[section].time.length || data[section][field].some(v => !Number.isFinite(v)))) throw new Error('Incomplete weather data.');
      }
      if (cache.size >= 200) cache.delete(cache.keys().next().value);
      cache.set(key, { at: now, data });
      return data;
    };
    const [forecast, feed] = await Promise.allSettled([weather(), read('area-incidents.json', null)]);
    const modeled = forecast.status === 'fulfilled' ? weatherAlerts(forecast.value, now) : { warnings: [], events: [] };
    const records = feed.status === 'fulfilled' ? feed.value : null;
    const incidents = publishedIncidents(records, origin, radiusKm, now);
    return { checkedAt: new Date(now).toISOString(), radiusKm,
      weatherStatus: forecast.status === 'fulfilled' ? 'ready' : 'unavailable', incidentStatus: Array.isArray(records) ? 'ready' : 'unconfigured',
      warnings: [...incidents.warnings, ...modeled.warnings], events: [...incidents.events, ...modeled.events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
      attribution: 'Weather data by Open-Meteo (CC BY 4.0). Advisories use app thresholds; they are not official IMD alerts. Approximate area only; no location is stored.' };
  };
}
export const areaAlerts = createAreaAlerts();
