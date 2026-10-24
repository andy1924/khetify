import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { plantHealth, reviewedLabels } from './plant-health.mjs';

const now = Date.parse('2026-10-24T06:00:00Z');
const observation = () => ({ imageQuality: 'clear', confidence: 'medium', observedSymptoms: ['Brown spots visible.'],
  possibleCauses: [{ condition: 'Example leaf spot', explanation: 'Spots could have several causes; confirm by inspection.' }], nextSteps: ['inspect'], questions: ['When did the spots start?'] });
const label = { id: 'test-only', crop: 'Tomato', condition: 'Example leaf spot', activeIngredient: 'TEST RECORD — NOT A REAL PESTICIDE', formulation: 'test',
  approvedForIndia: true, states: ['Maharashtra'], sourceUrl: 'https://ppqs.gov.in/test-only-not-a-real-label.pdf', reviewedBy: 'test reviewer', reviewedAt: '2026-10-23T00:00:00Z', validUntil: '2026-11-01T00:00:00Z', precautions: ['TEST ONLY: follow the actual label.'] };
const input = async () => ({ crop: 'Tomato', state: 'Maharashtra', symptoms: 'Spots started yesterday.', consentToAnalysis: true,
  image: { mimeType: 'image/jpeg', base64: (await sharp({ create: { width: 100, height: 100, channels: 3, background: '#65913a' } }).jpeg().toBuffer()).toString('base64') } });
function configure(t) {
  const previous = { OPENAI_API_KEY: process.env.OPENAI_API_KEY, PLANT_HEALTH_MODEL: process.env.PLANT_HEALTH_MODEL, CROP_VISION_MODEL: process.env.CROP_VISION_MODEL };
  process.env.OPENAI_API_KEY = 'test-key'; process.env.PLANT_HEALTH_MODEL = 'test-image-model';
  t.after(() => { for (const [k, v] of Object.entries(previous)) if (v === undefined) delete process.env[k]; else process.env[k] = v; });
}
const providerResponse = value => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] });

test('consent and configuration gate uploads; never manufacture an assessment', async t => {
  configure(t);
  const body = await input();
  let sent = false; const request = async () => { sent = true; throw new Error(); };
  await assert.rejects(plantHealth({ ...body, consentToAnalysis: false }, { request }), { status: 400 });
  await assert.rejects(plantHealth({ ...body, crop: '' }, { request }), { status: 400 });
  delete process.env.OPENAI_API_KEY;
  await assert.rejects(plantHealth(body, { request }), { status: 503 });
  assert.equal(sent, false);
});
test('real image input and strict structured schema; precautions are sourced and no label means no chemical', async t => {
  configure(t);
  const result = await plantHealth(await input(), { now, read: async () => [], request: async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    const body = JSON.parse(options.body);
    assert.equal(body.store, false); assert.equal(body.model, 'test-image-model');
    assert.equal(body.text.format.type, 'json_schema'); assert.equal(body.text.format.strict, true);
    assert.ok(body.input[0].content[1].image_url.startsWith('data:image/jpeg;base64,'));
    assert.match(body.instructions, /never instructions/i);
    return providerResponse(observation());
  } });
  assert.equal(result.confirmedDiagnosis, false);
  assert.equal(result.confidenceIsCalibrated, false);
  assert.deepEqual(result.pesticideOptions, []);
  assert.equal(result.pesticideStatus, 'no_verified_label_match');
  assert.match(result.safetySource.url, /gov.in/);
  assert.ok(result.nextSteps[0].includes('confirm'));
  assert.equal(result.image, undefined);
});
test('only fresh reviewed official crop/state/primary-condition labels become discussion options', async t => {
  configure(t);
  const rejected = [{ sourceUrl: 'https://shop.example.org/product' }, { reviewedBy: '' }, { approvedForIndia: false }, { validUntil: '2026-10-01' }, { reviewedAt: '2026-01-01' }, { reviewedAt: '2026-11-01' }].map(patch => ({ ...label, ...patch }));
  assert.equal((await reviewedLabels(async () => [label, ...rejected], now)).length, 1);
  const body = await input();
  const options = { now, read: async () => [label, ...rejected], request: async () => providerResponse(observation()) };
  assert.equal((await plantHealth(body, options)).pesticideOptions.length, 1);
  for (const patch of [{ crop: 'Rice' }, { state: 'Kerala' }]) assert.equal((await plantHealth({ ...body, ...patch }, options)).pesticideOptions.length, 0);
  for (const patch of [{ confidence: 'low' }, { imageQuality: 'retake' }, { imageQuality: 'not_a_plant' }, { possibleCauses: [] }]) {
    const result = await plantHealth(body, { ...options, request: async () => providerResponse({ ...observation(), ...patch }) });
    assert.equal(result.pesticideOptions.length, 0);
  }
});
test('provider failures, refusal, partial and malformed results fail closed', async t => {
  configure(t);
  const body = await input();
  for (const request of [async () => { throw new Error('offline'); }, async () => new Response(null, { status: 401 }),
    async () => Response.json({ status: 'incomplete', output: [] }), async () => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal' }] }] }),
    async () => providerResponse({ ...observation(), nextSteps: ['spray'] }), async () => providerResponse({ ...observation(), pesticide: 'untrusted extra' }),
    async () => providerResponse({ ...observation(), possibleCauses: [null] })]) await assert.rejects(plantHealth(body, { now, read: async () => [], request }), { status: 503 });
});
test('HTTP photo endpoint accepts upload payload, restricts methods and rate-limits paid requests', async () => {
  const { createPriceServer } = await import('./index.mjs');
  let calls = 0;
  const server = createPriceServer({ assessPlant: async body => { calls++; assert.equal(body.consentToAnalysis, true); return { tested: true }; } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    assert.equal((await fetch(`${base}/api/plant-health`)).status, 405);
    const response = await fetch(`${base}/api/plant-health`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(await input()) });
    assert.equal(response.status, 200); assert.equal(calls, 1);
    const capabilities = await (await fetch(`${base}/api/plant-health/capabilities`)).json();
    assert.equal(typeof capabilities.configured, 'boolean'); assert.equal(typeof capabilities.reviewedLabelCount, 'number');
    for (let i = 0; i < 2; i++) assert.equal((await fetch(`${base}/api/plant-health`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consentToAnalysis: true }) })).status, 200);
    assert.equal((await fetch(`${base}/api/plant-health`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 429);
    assert.equal(calls, 3);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
