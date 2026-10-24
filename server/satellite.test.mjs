import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { geometryFor, copernicusProvider } from './satellite.mjs';
import { deliverReviewedAlerts } from './pest-alerts.mjs';
test('invalid and oversized field requests rejected', () => {
  for (const p of [[], [{latitude:NaN,longitude:0}], [{latitude:0,longitude:0},{latitude:1,longitude:0},{latitude:0,longitude:1}]]) assert.throws(() => geometryFor(p));
  assert.throws(() => geometryFor([{latitude:0,longitude:0},{latitude:0,longitude:.01},{latitude:0,longitude:.02}]));
});
test('missing credentials never produces observations', async () => {
  if (process.env.CDSE_CLIENT_ID || process.env.CDSE_CLIENT_SECRET) return;
  assert.deepEqual(await copernicusProvider.getObservations([{latitude:20,longitude:75},{latitude:20.001,longitude:75},{latitude:20,longitude:75.001}]), {status:'unconfigured',observations:[]});
});
test('capture tiles use complete daily intervals without duplicates and preserve NDVI quality gates', async t => {
  const previous = { CDSE_CLIENT_ID: process.env.CDSE_CLIENT_ID, CDSE_CLIENT_SECRET: process.env.CDSE_CLIENT_SECRET };
  process.env.CDSE_CLIENT_ID = 'test-client';
  process.env.CDSE_CLIENT_SECRET = 'test-secret';
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  let cloud = 0.1, clearPixels = 50, observedPixels = 55, empty = false, calls = 0, imageCalls = 0, imageFails = false, mean = .64;
  const capturedAt = '2026-10-22T05:43:32.768Z';
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.includes('/token')) return Response.json({ access_token: 'test-token', expires_in: 3600 });
    if (url.includes('/catalog/')) return Response.json({ features: [
      { properties: { datetime: '2026-10-22T05:43:29.336Z' } },
      { properties: { datetime: capturedAt } },
    ] });
    if (url.endsWith('/process/v1')) {
      imageCalls++;
      const body = JSON.parse(options.body);
      assert.deepEqual(body.input.data[0].dataFilter.timeRange, {
        from: '2026-10-22T00:00:00.000Z', to: '2026-10-23T00:00:00.000Z',
      });
      assert.equal(options.headers.Accept, 'image/png');
      assert.equal(body.output.width, 768);
      assert.equal(body.input.data[0].processing.upsampling, 'BILINEAR');
      assert.equal(body.input.bounds.geometry, undefined);
      assert.ok(body.input.bounds.bbox[0] < 75 && body.input.bounds.bbox[2] > 75.001);
      return imageFails ? new Response(null, { status: 503 }) : new Response(new Uint8Array([137, 80, 78, 71]), { headers: { 'Content-Type': 'image/png' } });
    }
    assert.ok(url.endsWith('/statistics/v1'));
    const body = JSON.parse(options.body), { timeRange, aggregationInterval } = body.aggregation;
    assert.equal(timeRange.from, '2026-10-22T00:00:00.000Z');
    assert.equal(timeRange.to, '2026-10-23T00:00:00.000Z');
    assert.ok(Date.parse(timeRange.from) < Date.parse(capturedAt));
    assert.ok(Date.parse(timeRange.to) > Date.parse(capturedAt));
    assert.equal(aggregationInterval.of, 'P1D');
    const script = runInNewContext(body.aggregation.evalscript + '; ({ setup, evaluatePixel })');
    assert.deepEqual(Array.from(script.setup().output[2].bands), ['ndvi', 'quality']);
    const cloudy = script.evaluatePixel({ B04: 0.1, B08: 0.5, SCL: 9, dataMask: 1 });
    assert.deepEqual(Array.from(cloudy.dataMask), [0, 1]);
    assert.equal(cloudy.quality[0], 1);
    const clear = script.evaluatePixel({ B04: 0.1, B08: 0.5, SCL: 4, dataMask: 1 });
    assert.deepEqual(Array.from(clear.dataMask), [1, 1]);
    assert.ok(Math.abs(clear.ndvi[0] - 2 / 3) < 1e-6);
    assert.equal(script.evaluatePixel({ B04: 0, B08: 0, SCL: 4, dataMask: 1 }).dataMask[0], 0);
    assert.equal(script.evaluatePixel({ B04: -.1, B08: .5, SCL: 4, dataMask: 1 }).dataMask[0], 0);
    assert.equal(script.evaluatePixel({ B04: .1, B08: NaN, SCL: 4, dataMask: 1 }).dataMask[0], 0);
    calls++;
    return Response.json({ status: 'OK', geometryPixelCount: 55, data: empty ? [] : [{ outputs: {
      ndvi: { bands: { B0: { stats: { mean, sampleCount: 100, noDataCount: 100 - clearPixels } } } },
      quality: { bands: { B0: { stats: { mean: cloud, sampleCount: 100, noDataCount: 100 - observedPixels } } } },
    } }] });
  });
  const { copernicusProvider: provider } = await import('./satellite.mjs?partial-interval-test');
  const polygon = [{ latitude: 20, longitude: 75 }, { latitude: 20.001, longitude: 75 }, { latitude: 20, longitude: 75.001 }];
  const read = async () => {
    const result = await provider.getObservations(polygon, { refresh: true });
    assert.equal(result.observations.length, 1);
    assert.equal(result.observations[0].capturedAt, capturedAt);
    return result.observations[0];
  };
  const clear = await read();
  assert.equal(clear.ndvi, 0.64);
  assert.equal(clear.cloudPercent, 10);
  assert.equal(clear.fieldCoveragePercent, 100);
  assert.equal(clear.confidence, 'moderate');
  assert.equal(clear.imageUrl, 'data:image/png;base64,iVBORw==');
  const cached = await provider.getObservations(polygon);
  assert.equal(cached.cached, true);
  assert.ok(cached.fetchedAt && cached.expiresAt > Date.now());
  assert.deepEqual(cached.observations[0].imageBounds, clear.imageBounds);
  assert.equal(calls, 1);
  assert.equal(imageCalls, 1);
  imageFails = true;
  const noImage = await read();
  assert.equal(noImage.ndvi, 0.64);
  assert.equal(noImage.imageUrl, undefined);
  assert.ok(noImage.imageError);
  imageFails = false;
  cloud = 0.8;
  assert.equal((await read()).ndvi, null);
  cloud = 0.1; clearPixels = 4;
  assert.equal((await read()).ndvi, null);
  clearPixels = 40; observedPixels = 40;
  const partial = await read();
  assert.equal(partial.ndvi, null);
  assert.ok(partial.fieldCoveragePercent < 80);
  empty = true;
  const missing = await read();
  assert.equal(missing.ndvi, null);
  assert.equal(missing.fieldCoveragePercent, null);
  assert.equal(missing.confidence, 'low');
  assert.equal(calls, 6);
  assert.equal(imageCalls, 6);
  empty = false; observedPixels = 55; clearPixels = 50;
  for (const invalid of [1.3, -1.1]) {
    mean = invalid;
    const rejected = await read();
    assert.equal(rejected.ndvi, null);
    assert.equal(rejected.confidence, 'low');
  }
  mean = .5;
  const before = calls;
  await Promise.all([provider.getObservations(polygon, { refresh: true }), provider.getObservations(polygon, { refresh: true })]);
  assert.equal(calls, before + 1, 'in-flight requests are deduplicated');
});
test('only reviewed, consented, nearby opted-in fields receive redacted alerts', async () => {
  const now = Date.now(), location = {latitude:20,longitude:75};
  const report = {id:'r',ownerId:'a',status:'confirmed',reviewedBy:'expert',sharingConsent:true,date:new Date(now).toISOString(),location,crop:'wheat'};
  const field = {id:'f',ownerId:'b',alertsOptIn:true,radiusKm:5,polygon:[location]};
  const messages=[];const options={now,send:async (_,m)=>messages.push(m)};
  for (const patch of [{status:'pending-review'},{status:'withdrawn'},{sharingConsent:false},{reviewedBy:null}]) assert.deepEqual(await deliverReviewedAlerts({...report,...patch},[field],options),[]);
  assert.deepEqual(await deliverReviewedAlerts(report,[{...field,alertsOptIn:false},{...field,polygon:[{latitude:25,longitude:75}]}],options),[]);
  assert.deepEqual(await deliverReviewedAlerts(report,[field],options),['f']);
  assert.equal(messages[0].location,undefined);
});
