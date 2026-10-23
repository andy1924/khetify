import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { grainScreening, reviewGrainScreening, validateDetections, visualSummary } from './grain-screening.mjs';

// Synthetic image and detections exercise the contract, not model accuracy.
const pixels = Buffer.from(Array.from({ length: 128 * 128 * 3 }, (_, i) => (Math.floor(i / 3) % 2) ? 190 : 60));
const buffer = await sharp(pixels, { raw: { width: 128, height: 128, channels: 3 } }).png().toBuffer();
const body = { crop: 'wheat', consentToUpload: true, referenceConfirmed: true, image: { mimeType: 'image/png', base64: buffer.toString('base64') } };
const criteria = { crop: 'wheat', basis: 'visible-object-count', version: 'TEST-ONLY', sourceUrl: 'https://example.com/test-only-criteria', minGrains: 1, maxFractions: { foreignMaterial: 0.2, broken: 0.5, discolored: 0.5 } };
const manifest = { modelVersion: 'test-detector', minConfidence: 0.8, validationUrl: 'https://example.com/test-evaluation', crops: { wheat: { criteria } } };
const detection = { crop: 'wheat', modelVersion: 'test-detector', lighting: 'adequate', focus: 'adequate', referenceVisible: true, plainBackground: true,
  objects: [ { id: 'g1', kind: 'grain', box: [0.1, 0.1, 0.2, 0.2], confidence: 0.95, broken: true, discolored: false }, { id: 'g2', kind: 'grain', box: [0.5, 0.1, 0.2, 0.2], confidence: 0.9, broken: false, discolored: null }, { id: 'f1', kind: 'foreign_material', box: [0.3, 0.6, 0.1, 0.1], confidence: 0.9 } ] };
const run = value => grainScreening(body, { manifestReader: async () => manifest, fetcher: async () => ({ ok: true, json: async () => value }) });
test('invalid crop identifier, absent upload consent and missing reference fail before inference', async () => {
  for (const patch of [{ crop: '' }, { crop: '../invalid' }, { consentToUpload: false }, { referenceConfirmed: false }]) await assert.rejects(grainScreening({ ...body, ...patch }), e => e.status === 400);
});
test('missing detector leaves all traits unknown, never zero', async () => {
  const result = await grainScreening(body, { manifestReader: async () => null });
  assert.equal(result.status, 'unavailable');
  assert.deepEqual(result.counts, { grains: null, foreignMaterial: null, broken: null, discolored: null });
  assert.equal(result.summary, null);
  const rice = await grainScreening({ ...body, crop: 'rice' }, { manifestReader: async () => null });
  assert.equal(rice.status, 'unavailable');
  assert.equal(rice.counts.broken, null);
});
test('poor lighting or insufficient detail requests a retake before remote inference', async () => {
  const dark = await sharp({ create: { width: 100, height: 100, channels: 3, background: '#000000' } }).png().toBuffer();
  const result = await grainScreening({ ...body, image: { mimeType: 'image/png', base64: dark.toString('base64') } }, { manifestReader: () => { throw new Error('must not infer'); } });
  assert.equal(result.status, 'retake_required');
  assert.equal(result.counts.broken, null);
});
test('only specialized object observations are accepted; moisture, grades and prices are discarded', async () => {
  process.env.GRAIN_DETECTOR_URL = 'http://127.0.0.1:9000/infer';
  const result = await run({ ...detection, moisture: 12, grade: 'A', price: 9999 });
  assert.equal(result.status, 'screened');
  assert.deepEqual(result.counts, { grains: 2, foreignMaterial: 1, broken: 1, discolored: null });
  assert.equal(result.summary, null); // incomplete trait is never zero
  assert.equal(result.imageStored, false);
  assert.ok(!('moisture' in result) && !('grade' in result) && !('price' in result));
});
test('uncertain detections withhold counts; absent grain or reference requests retake', async () => {
  const uncertain = await run({ ...detection, objects: [{ ...detection.objects[0], confidence: 0.5 }] });
  assert.equal(uncertain.status, 'low_confidence');
  assert.equal(uncertain.counts.grains, null);
  assert.equal((await run({ ...detection, referenceVisible: false })).status, 'retake_required');
  assert.equal((await run({ ...detection, objects: [detection.objects[2]] })).status, 'retake_required');
});
test('malformed regions, wrong crop, duplicate IDs and wrong model version are rejected', () => {
  for (const change of [{ crop: 'soybean' }, { modelVersion: 'other' }, { objects: [{ ...detection.objects[0], box: [0.9, 0, 0.3, 0.1] }] }, { objects: [detection.objects[0], detection.objects[0]] }]) assert.throws(() => validateDetections({ ...detection, ...change }, manifest, 'wheat'));
});
test('summary needs supported explicit criteria and complete counts; never an official grade', () => {
  const counts = { grains: 10, foreignMaterial: 0, broken: 0, discolored: 0 };
  assert.equal(visualSummary(counts, null, 'wheat'), null);
  assert.equal(visualSummary(counts, criteria, 'soybean'), null);
  assert.equal(visualSummary({ ...counts, broken: null }, criteria, 'wheat'), null);
  assert.equal(visualSummary({ ...counts, broken: 11 }, criteria, 'wheat'), null);
  assert.match(visualSummary(counts, criteria, 'wheat').basis, /not mass percentages or an official grade/);
  assert.equal(visualSummary({ ...counts, broken: 6 }, criteria, 'wheat').label, 'Review visible defects');
});
test('provider failures return no fabricated measurements', async () => {
  await assert.rejects(grainScreening(body, { manifestReader: async () => manifest, fetcher: async () => { throw new Error('SECRET'); } }), e => e.status === 503 && !e.message.includes('SECRET'));
});

test('review accepts any named grain, preserves unknowns and cannot forge model measurements or grades', () => {
  const review = reviewGrainScreening({ crop: 'kodo_millet', reviewed: true, counts: { broken: 0 }, grade: 'A', summary: 'perfect', modelVersion: 'forged', moisturePercent: 12 });
  assert.deepEqual(review.counts, { grains: null, foreignMaterial: null, broken: 0, discolored: null });
  assert.equal(review.moisture, null);
  assert.equal(review.moistureStatus, 'not_measured');
  assert.equal(review.summary, null);
  assert.equal(review.officialGrade, null);
  assert.equal(review.provenance, 'farmer-reviewed observations');
  assert.equal(review.stored, false);
  assert.equal(reviewGrainScreening({ crop: 'other', cropName: ' Local grain ', reviewed: true }).cropName, 'Local grain');
});
test('review rejects unconfirmed, malformed or inconsistent corrections without converting unknown to zero', () => {
  const valid = { crop: 'rice', reviewed: true };
  for (const patch of [{ reviewed: false }, { crop: '' }, { crop: 'other' }, { cropName: 42 }, { counts: [] }, { counts: null },
    { counts: { grade: 1 } }, { counts: { grains: '10' } }, { counts: { grains: -1 } }, { counts: { grains: 1.5 } },
    { counts: { grains: 100001 } }, { counts: { grains: 2, broken: 3 } }, { counts: { grains: 0, discolored: 1 } }]) {
    assert.throws(() => reviewGrainScreening({ ...valid, ...patch }), e => e.status === 400, JSON.stringify(patch));
  }
});
test('moisture is optional and requires an explicitly calibrated meter and valid date', () => {
  const now = Date.parse('2026-10-24T12:00:00Z');
  const base = { crop: 'rice', reviewed: true };
  const moisture = { percent: 12.5, meter: 'Meter 1', measuredOn: '2026-10-24', calibrated: true };
  assert.equal(reviewGrainScreening({ ...base, moisture }, now).moisture.percent, 12.5);
  assert.equal(reviewGrainScreening(base, now).moisture, null);
  for (const patch of [{ calibrated: false }, { percent: '12' }, { percent: null }, { percent: 101 }, { percent: -1 }, { meter: '' },
    { measuredOn: '2026-02-30' }, { measuredOn: '2026-10-25' }, { measuredOn: 'nonsense' }]) {
    assert.throws(() => reviewGrainScreening({ ...base, moisture: { ...moisture, ...patch } }, now), e => e.status === 400);
  }
});
