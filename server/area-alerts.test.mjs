import test from 'node:test';
import assert from 'node:assert/strict';
import { createAreaAlerts, weatherAlerts, publishedIncidents } from './area-alerts.mjs';

const now = Date.parse('2026-10-24T06:00:00Z');
const forecast = () => ({
  hourly: { time: [now / 1000, now / 1000 + 3600], temperature_2m: [29, 41], precipitation: [0, 12], wind_gusts_10m: [15, 55] },
  daily: { time: [Date.parse('2026-10-23') / 1000, Date.parse('2026-10-24') / 1000], temperature_2m_max: [30, 41], temperature_2m_min: [18, 20], precipitation_sum: [25, 30], wind_gusts_10m_max: [20, 55] },
});
const origin = { latitude: 20, longitude: 75 };
const incident = { id: 'public-1', title: 'Reviewed crop concern', detail: 'Reported for expert follow-up.', status: 'confirmed', published: true, sharingConsent: true,
  location: origin, ownerId: 'private-owner', reviewedBy: 'private-reviewer', occurredAt: '2026-10-23T08:00:00Z', expiresAt: '2026-10-25T08:00:00Z', source: { name: 'Test source', url: 'https://example.org/report' } };

test('weather separates upcoming advisories from past events and labels modeled data', () => {
  const result = weatherAlerts(forecast(), now);
  assert.equal(result.warnings.length, 3);
  assert.ok(result.warnings.some(item => item.id === 'weather-rain'));
  assert.ok(result.warnings.every(item => item.source.basis.includes('not an official warning')));
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].title, 'Rainy day estimated');
  assert.equal(result.events[0].occurredAt, '2026-10-23T00:00:00.000Z');
});

test('area feed excludes private, withdrawn, future, stale and distant incidents and redacts location', () => {
  const excluded = [{ status: 'reported' }, { status: 'withdrawn' }, { sharingConsent: false }, { published: false },
    { occurredAt: '2026-10-25T00:00:00Z' }, { occurredAt: '2026-08-01T00:00:00Z' }, { location: { latitude: 25, longitude: 75 } }].map(patch => ({ ...incident, ...patch }));
  const result = publishedIncidents([incident, ...excluded], origin, 10, now);
  assert.equal(result.events.length, 1);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.events[0].distanceKm, 0);
  for (const key of ['location', 'ownerId', 'reviewedBy']) assert.equal(result.events[0][key], undefined);
  const expired = publishedIncidents([{ ...incident, expiresAt: '2026-10-24T00:00:00Z' }], origin, 10, now);
  assert.equal(expired.warnings.length, 0);
  assert.equal(expired.events.length, 1);
});

test('area API uses rounded location, caches weather and keeps unconfigured incident feeds explicit', async () => {
  let calls = 0;
  const handler = createAreaAlerts({ clock: () => now, read: async () => null, request: async url => {
    calls++;
    const query = new URL(url).searchParams;
    assert.equal(query.get('latitude'), '20.01');
    assert.equal(query.get('longitude'), '75.01');
    assert.equal(query.get('timeformat'), 'unixtime');
    return Response.json(forecast());
  } });
  const params = new URLSearchParams({ lat: '20.01234', lon: '75.01234', radius: '10' });
  const result = await handler(params);
  assert.equal(result.weatherStatus, 'ready');
  assert.equal(result.incidentStatus, 'unconfigured');
  assert.equal(result.warnings.length, 3);
  await handler(params);
  assert.equal(calls, 1);
  params.set('refresh', 'true');
  await handler(params);
  assert.equal(calls, 2);
  for (const values of [{ lat: '', lon: '75' }, { lat: '0', lon: '0' }, { lat: '20', lon: '75', radius: '0' }]) {
    await assert.rejects(handler(new URLSearchParams(values)), { status: 400 });
  }
});

test('weather errors or missing measurements never become an all-clear or erase valid incidents', async () => {
  for (const request of [async () => { throw new Error('offline'); }, async () => Response.json({ hourly: {}, daily: {} })]) {
    const handler = createAreaAlerts({ clock: () => now, read: async () => [incident], request });
    const result = await handler(new URLSearchParams({ lat: '20', lon: '75' }));
    assert.equal(result.weatherStatus, 'unavailable');
    assert.equal(result.incidentStatus, 'ready');
    assert.equal(result.warnings.length, 1);
    assert.equal(result.warnings[0].category, 'incident');
  }
});

test('missing samples remain explicit; benign forecasts still show sourced weather data', async () => {
  const partial = forecast(); partial.hourly.precipitation[0] = null;
  const handler = createAreaAlerts({ clock: () => now, read: async () => null, request: async () => Response.json(partial) });
  const result = await handler(new URLSearchParams({ lat: '20', lon: '75' }));
  assert.equal(result.weatherStatus, 'partial');
  assert.equal(result.outlook.rainTotal, null);
  assert.equal(result.outlook.temperature, 29);
  const calm = forecast();
  calm.hourly.temperature_2m = [25, 26]; calm.hourly.precipitation = [0, 0]; calm.hourly.wind_gusts_10m = [10, 12];
  const benign = weatherAlerts(calm, now);
  assert.equal(benign.warnings.length, 0);
  assert.equal(benign.outlook.temperature, 25);
  assert.equal(benign.outlook.rainTotal, 0);
  assert.equal(benign.outlook.hours, 2);
});

test('HTTP alerts endpoint preserves independent source states and validates request methods', async () => {
  const { createPriceServer } = await import('./index.mjs');
  const handler = createAreaAlerts({ clock: () => now, read: async () => [incident], request: async () => Response.json(forecast()) });
  const server = createPriceServer({ alerts: handler });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const response = await fetch(base + '/api/area-alerts?lat=20&lon=75&radius=10');
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(result.warnings.length, 4);
    assert.equal(result.events.length, 2);
    assert.equal((await fetch(base + '/api/area-alerts')).status, 400);
    assert.equal((await fetch(base + '/api/area-alerts', { method: 'POST' })).status, 405);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
