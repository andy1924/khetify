const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');

// Exercise the actual Notice render tree with native host stubs: unlike a web
// export, this rejects raw strings under a View just as the native renderer does.
const source = fs.readFileSync(path.join(__dirname, '../src/ui/primitives.tsx'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true,
} }).outputText;
const mod = { exports: {} };
// `motion.ts` reads AccessibilityInfo at module load and `Toggle` animates with
// Animated; Notice does neither, so a minimal native surface is enough here.
const nativeStub = () => ({
  View: 'View',
  Pressable: 'Pressable',
  StyleSheet: { create: s => s },
  Animated: { View: 'Animated.View' },
});
// Shared reduced-motion store, exercised by the app's own animations.
const motionStub = { motion: { press: 90, release: 140, pressScale: 0.97, pressOpacity: 0.86 }, useReduceMotion: () => false };
// Session accent theme (owned by another module); tests pin the default forest
// accent so assertions only see the reference colour tokens.
const accentStub = { useAccent: () => ({ accent: { id: 'forest', label: 'Forest', strong: '#285B45', soft: '#BEDDA7', selected: 'rgba(209,229,213,0.62)', ink: '#263B29' }, setAccent: () => {} }) };
vm.runInNewContext(compiled, { exports: mod.exports, module: mod, require: name => {
  if (name === 'react') return React;
  if (name === 'react-native') return nativeStub();
  if (name === './Text') return { Text: 'Text', SectionLabel: 'Text' };
  if (name === './Icon') return { Icon: 'Icon' };
  if (name === './tokens') return { colors: {}, radii: {}, touchTarget: 48 };
  if (name === './motion') return motionStub;
  if (name === './AccentTheme') return accentStub;
  throw new Error(`Unexpected import: ${name}`);
} });

function nativeText(node, insideText = false) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(child => nativeText(child, insideText)).join('');
  if (typeof node === 'string' || typeof node === 'number') {
    assert.ok(insideText, 'Text strings must be rendered within a Text component');
    return String(node);
  }
  if (typeof node.type === 'function') return nativeText(node.type(node.props), insideText);
  return nativeText(node.props.children, node.type === 'Text' || (node.type === React.Fragment && insideText));
}

test('Notice safely renders interpolated sentences, arrays, fragments and zero', () => {
  const { Notice } = mod.exports;
  assert.equal(nativeText(Notice({ children: ['Phone accuracy: ', 12, ' m. Draw your field.'] })), 'Phone accuracy: 12 m. Draw your field.');
  assert.equal(nativeText(Notice({ children: React.createElement(React.Fragment, null, 'Clouds: ', 0, '%') })), 'Clouds: 0%');
  assert.equal(nativeText(Notice({ children: 0 })), '0');
  assert.equal(nativeText(Notice({ children: ['Start ', null, false, ['middle ', 3], ' end'] })), 'Start middle 3 end');
});

test('Notice preserves structured children and text around them', () => {
  const { Notice } = mod.exports;
  assert.equal(nativeText(Notice({ title: 'Location', children: ['Before ', React.createElement('Text', { key: 'detail' }, 'detail'), ' after'] })), 'LocationBefore detail after');
});

test('boundary taps produce finite native and web coordinates, never NaN points', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/features/tools/BoundaryMap.tsx'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
  const mapModule = { exports: {} };
  vm.runInNewContext(code, { exports: mapModule.exports, module: mapModule, require: name => {
    if (name === 'react') return { ...React, useState: value => [value, () => {}], useRef: value => ({ current: value }) };
    if (name === 'react-native') return { View: 'View', Pressable: 'Pressable', Image: 'Image' };
    if (name === 'react-native-svg') return { __esModule: true, default: 'Svg', Polygon: 'Polygon', Circle: 'Circle' };
    if (name === '../../ui') return { Button: 'Button', Text: 'Text' };
    throw new Error(`Unexpected import: ${name}`);
  } });
  const changes = [];
  const tree = mapModule.exports.BoundaryMap({ center: { latitude: 20, longitude: 75 }, points: [], onChange: points => changes.push(points) });
  const map = tree.props.children.find(child => child?.type === 'Pressable');
  map.props.onPressIn({ nativeEvent: { locationX: 150, locationY: 150 } });
  map.props.onPress({ nativeEvent: {} });
  assert.ok(Math.abs(changes[0][0].latitude - 20) < 1e-8);
  assert.ok(Math.abs(changes[0][0].longitude - 75) < 1e-8);
  map.props.onPress({ nativeEvent: { locationX: 100, locationY: 100 } });
  assert.ok(Number.isFinite(changes[1][0].latitude));
  assert.ok(Number.isFinite(changes[1][0].longitude));
  map.props.onPress({ nativeEvent: {} });
  map.props.onPress({ nativeEvent: { locationX: NaN, locationY: NaN } });
  map.props.onPress({ nativeEvent: { locationX: -1, locationY: 100 } });
  assert.equal(changes.length, 2);
});

test('Expo Go resolves development localhost to the LAN host without changing production or tunnel URLs', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/lib/api-url.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const resolverModule = { exports: {} };
  vm.runInNewContext(code, { exports: resolverModule.exports, module: resolverModule, URL });
  const { resolveApiUrl } = resolverModule.exports;
  assert.equal(resolveApiUrl('http://localhost:8787', 'ios', '192.168.1.10:8081', true), 'http://192.168.1.10:8787');
  assert.equal(resolveApiUrl('http://127.0.0.1:8787/api/', 'android', '10.0.0.8:8081', true), 'http://10.0.0.8:8787/api');
  assert.equal(resolveApiUrl('http://localhost:8787', 'web', '192.168.1.10:8081', true), 'http://localhost:8787');
  assert.equal(resolveApiUrl('https://fields.example.org', 'ios', '192.168.1.10:8081', true), 'https://fields.example.org');
  assert.equal(resolveApiUrl('http://localhost:8787', 'ios', '192.168.1.10:8081', false), 'http://localhost:8787');
  assert.equal(resolveApiUrl('http://localhost:8787', 'ios', 'sample.exp.direct:443', true), 'http://localhost:8787');
  assert.equal(resolveApiUrl('', 'ios', '192.168.1.10:8081', true), '');
  assert.equal(resolveApiUrl('invalid', 'ios', undefined, true), '');
  assert.equal(resolveApiUrl('https://secret:password@example.org', 'ios', undefined, true), '');
  class NativeLikeURL extends URL { get hostname() { return super.hostname; } }
  const nativeModule = { exports: {} };
  vm.runInNewContext(code, { exports: nativeModule.exports, module: nativeModule, URL: NativeLikeURL });
  assert.equal(nativeModule.exports.resolveApiUrl('http://localhost:8787', 'ios', '192.168.1.10:8081', true), 'http://192.168.1.10:8787');
  assert.equal(nativeModule.exports.resolveApiUrl('http://localhost:8787', 'ios', 'exp://192.168.1.10:8081', true), 'http://192.168.1.10:8787');
});

test('client rejects out-of-range NDVI and sends an explicit refresh flag', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/features/tools/satelliteProvider.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const providerModule = { exports: {} };
  let payload;
  vm.runInNewContext(code, { exports: providerModule.exports, module: providerModule, AbortSignal, require: name => {
    if (name === '../../lib/api') return { apiBase: 'http://test.local', connectionError: () => 'offline' };
    throw new Error(`Unexpected import: ${name}`);
  }, fetch: async (_url, options) => {
    payload = JSON.parse(options.body);
    return { ok: true, json: async () => ({ status: 'ready', observations: [1.3, -1.1, NaN, .64, 0, -1, 1, null].map(ndvi => ({ ndvi, confidence: 'moderate' })) }) };
  } });
  const data = await providerModule.exports.fieldMonitoringProvider.getObservations([], true);
  assert.equal(payload.refresh, true);
  assert.deepEqual(Array.from(data.observations, o => o.ndvi), [null, null, null, .64, 0, -1, 1, null]);
  assert.equal(data.observations[0].confidence, 'low');
});
