const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = readFileSync(path.join(__dirname, '../src/features/tools/locationArea.ts'), 'utf8');
const moduleResult = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { module: moduleResult, exports: moduleResult.exports, URLSearchParams });
const { locationArea, satelliteBasemap } = moduleResult.exports;

test('satellite sampling area is centered on the supplied GPS fix, not the sign-in fixture', () => {
  for (const point of [{ latitude: 19.08, longitude: 72.88 }, { latitude: 28.61, longitude: 77.21 }]) {
    const polygon = locationArea(point);
    assert.equal(polygon.length, 4);
    assert.ok(Math.abs(polygon.reduce((s, p) => s + p.latitude, 0) / 4 - point.latitude) < 1e-9);
    assert.ok(Math.abs(polygon.reduce((s, p) => s + p.longitude, 0) / 4 - point.longitude) < 1e-9);
    assert.ok(Math.abs((polygon[2].latitude - polygon[0].latitude) * 111320 - 500) < 1e-5);
    assert.ok(Math.abs((polygon[1].longitude - polygon[0].longitude) * 111320 * Math.cos(point.latitude * Math.PI / 180) - 500) < 1e-5);
  }
});
test('invalid or unsupported GPS fixes never silently use a sample location', () => {
  for (const p of [{ latitude: NaN, longitude: 75 }, { latitude: 0, longitude: 0 }]) assert.throws(() => locationArea(p));
});
test('real imagery fallback uses the GPS area and returns matching overlay bounds', () => {
  const point = { latitude: 19.08, longitude: 72.88 };
  const result = satelliteBasemap(locationArea(point));
  const url = new URL(result.url);
  assert.equal(url.hostname, 'services.arcgisonline.com');
  assert.equal(url.searchParams.get('size'), '768,768');
  assert.ok(result.bounds.west < point.longitude && result.bounds.east > point.longitude);
  assert.ok(result.bounds.south < point.latitude && result.bounds.north > point.latitude);
});
