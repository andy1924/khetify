import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { analysisTokens, cropScope, identifyCrop, MAX_PHOTO_BYTES, preparePhoto } from './crop-vision.mjs';

const scope = await cropScope();
const imageBytes = await sharp({ create: { width: 100, height: 100, channels: 3, background: '#567832' } }).jpeg().withExif({ IFD0: { Artist: 'PRIVATE TEST METADATA' } }).toBuffer();
const image = { mimeType: 'image/jpeg', base64: imageBytes.toString('base64') };
const observation = { cropId: 'wheat', confidence: 'high', imageQuality: 'clear', mixedCrop: false, alternatives: ['maize'], visibleParts: ['ear'] };
const providerResult = value => ({ ok: true, json: async () => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] }) });

test('decodes image and strips metadata before the model receives it', async () => {
  const prepared = await preparePhoto(image);
  const sanitized = Buffer.from(prepared.dataUrl.split(',')[1], 'base64');
  const meta = await sharp(sanitized).metadata();
  assert.equal(meta.exif, undefined);
  assert.equal(meta.format, 'jpeg');
  assert.equal(prepared.digest.length, 64);
  assert.ok(!sanitized.includes(Buffer.from('PRIVATE TEST METADATA')));
});
test('rejects malformed, mislabeled, unsupported and oversized images', async () => {
  for (const input of [null, { mimeType: 'image/svg+xml', base64: 'AAAA' }, { mimeType: 'image/png', base64: image.base64 }, { ...image, base64: 'not base64' }, { ...image, base64: Buffer.from('not an image').toString('base64') }, { ...image, base64: 'A'.repeat(Math.ceil(MAX_PHOTO_BYTES / 3) * 4 + 4) }]) {
    await assert.rejects(preparePhoto(input), error => [400, 413].includes(error.status));
  }
  const tiny = await sharp({ create: { width: 10, height: 10, channels: 3, background: 'white' } }).png().toBuffer();
  await assert.rejects(preparePhoto({ mimeType: 'image/png', base64: tiny.toString('base64') }), /decoded/);
});
test('missing model credentials do not create a fake identification', async () => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.CROP_VISION_MODEL;
  await assert.rejects(identifyCrop(await preparePhoto(image), scope, () => { throw new Error('must not call'); }), /not configured/);
});
test('provider is asked only for identity and never for numeric price or quality grade', async () => {
  process.env.OPENAI_API_KEY = 'unit-test-placeholder';
  process.env.CROP_VISION_MODEL = 'test-vision-model';
  const result = await identifyCrop(await preparePhoto(image), scope, async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    const body = JSON.parse(options.body);
    assert.equal(body.store, false);
    assert.equal(body.text.format.type, 'json_schema');
    assert.equal(body.text.format.strict, true);
    assert.ok(!('price' in body.text.format.schema.properties));
    assert.ok(!('grade' in body.text.format.schema.properties));
    assert.equal(body.input[0].content[1].type, 'input_image');
    return providerResult(observation);
  });
  assert.equal(result.crop.commodity, 'Wheat');
  assert.equal(result.status, 'suggested');
  assert.equal(result.farmerConfirmationRequired, true);
  assert.equal(result.confidenceIsCalibrated, false);
  assert.ok(!('price' in result));
});
test('uncertain, mixed, dark and unsupported photos never become a confident crop match', async () => {
  const photo = await preparePhoto(image);
  for (const change of [{ confidence: 'low' }, { imageQuality: 'dark' }, { mixedCrop: true }]) {
    const result = await identifyCrop(photo, scope, async () => providerResult({ ...observation, ...change }));
    assert.equal(result.status, 'retake_required');
    assert.equal(result.crop, null);
  }
  assert.equal((await identifyCrop(photo, scope, async () => providerResult({ ...observation, cropId: 'unknown' }))).status, 'unsupported');
});
test('extra price fields, malformed JSON, refusal, partial output and network failures fail closed', async () => {
  const photo = await preparePhoto(image);
  for (const mock of [
    async () => providerResult({ ...observation, price: 9999 }),
    async () => providerResult({ ...observation, cropId: 'invented-crop' }),
    async () => ({ ok: true, json: async () => ({ status: 'incomplete', output: [] }) }),
    async () => ({ ok: true, json: async () => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal' }] }] }) }),
    async () => ({ ok: true, json: async () => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'not JSON' }] }] }) }),
    async () => ({ ok: false, status: 401 }),
    async () => { throw new Error('PRIVATE-API-KEY'); },
  ]) await assert.rejects(identifyCrop(photo, scope, mock), error => error.status === 503 && !error.message.includes('PRIVATE-API-KEY'));
});
test('analysis tokens cannot be tampered with, reused after expiry or accepted on another server', () => {
  let now = 1000000;
  const tokens = analysisTokens({ now: () => now });
  const token = tokens.issue({ crop: { id: 'wheat' } });
  assert.equal(tokens.verify(token).crop.id, 'wheat');
  assert.throws(() => tokens.verify(`X${token}`), /Invalid/);
  assert.throws(() => analysisTokens().verify(token), /Invalid/);
  now += 16 * 60000;
  assert.throws(() => tokens.verify(token), /expired/);
});
