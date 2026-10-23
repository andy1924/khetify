import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { preparePhoto } from './crop-vision.mjs';
import { readJson } from './store.mjs';

const traits = ['foreignMaterial', 'broken', 'discolored'];
const emptyCounts = () => ({ grains: null, foreignMaterial: null, broken: null, discolored: null });
const error = (status, message) => Object.assign(new Error(message), { status });
const validCrop = crop => typeof crop === 'string' && /^[a-z][a-z0-9_-]{1,63}$/.test(crop);

// Return a review record for the caller's storage; never persist photos or results here.
// User-entered observations cannot acquire model provenance or an official grade.
export function reviewGrainScreening(body, now = Date.now()) {
  if (!validCrop(body.crop)) throw error(400, 'Choose a grain crop identifier.');
  if (body.reviewed !== true) throw error(400, 'Inspect and confirm the observations before saving a review.');
  const cropName = typeof body.cropName === 'string' ? body.cropName.trim() : undefined;
  if ((body.cropName !== undefined && (typeof body.cropName !== 'string' || !cropName || cropName.length > 120 || /[\x00-\x1f]/.test(cropName))) || (body.crop === 'other' && !cropName)) throw error(400, 'Supply a valid grain name.');
  if (body.counts !== undefined && (!body.counts || typeof body.counts !== 'object' || Array.isArray(body.counts) || Object.keys(body.counts).some(k => !Object.hasOwn(emptyCounts(), k)))) throw error(400, 'Supply visible grain counts, or leave unknown observations null.');
  const counts = emptyCounts();
  for (const key of Object.keys(counts)) {
    const value = body.counts?.[key] ?? null;
    if (value !== null && (!Number.isSafeInteger(value) || value < 0 || value > 100000)) throw error(400, 'Counts must be whole numbers from 0 to 100000, or null for unknown.');
    counts[key] = value;
  }
  if (counts.grains !== null && ['broken', 'discolored'].some(k => counts[k] !== null && counts[k] > counts.grains)) throw error(400, 'Broken or discolored grain counts cannot exceed the grain count.');
  let moisture = null;
  if (body.moisture !== undefined && body.moisture !== null) {
    const m = body.moisture;
    if (!m || typeof m !== 'object' || Array.isArray(m) || m.calibrated !== true || !Number.isFinite(m.percent) || m.percent < 0 || m.percent > 100 ||
      typeof m.meter !== 'string' || !m.meter.trim() || m.meter.length > 120 || /[\x00-\x1f]/.test(m.meter) ||
      typeof m.measuredOn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(m.measuredOn) || !Number.isFinite(Date.parse(m.measuredOn)) ||
      new Date(m.measuredOn).toISOString().slice(0, 10) !== m.measuredOn || m.measuredOn > new Date(now).toISOString().slice(0, 10)) throw error(400, 'Moisture requires a calibrated meter, a reading from 0 to 100 percent and a valid measurement date that is not in the future.');
    moisture = { percent: m.percent, meter: m.meter.trim(), measuredOn: m.measuredOn, calibrated: true, basis: 'Farmer-reported calibrated meter reading; not independently verified' };
  }
  return { id: randomUUID(), crop: body.crop, cropName: cropName ?? null, reviewed: true, counts, moisture, moistureStatus: moisture ? 'manual_meter_reading' : 'not_measured',
    reviewedAt: new Date(now).toISOString(), provenance: 'farmer-reviewed observations', preliminary: true, officialGrade: null, summary: null, stored: false,
    warnings: ['Observations describe the visible sample only and are not an official mandi grade, lab test or price guarantee.', 'Manual observations and meter calibration are farmer-reported. No moisture is inferred from a photo.'] };
}

// An operator must deploy and validate a specialized grain object detector.
// A language model is never used to produce these counts or a grading criterion.
export async function detectorManifest(crop, now = Date.now()) {
  if (crop === 'other') return null; // A custom name is not one validated model class.
  const manifest = await readJson('grain-detector.json', null);
  const spec = manifest?.crops?.[crop];
  if (!manifest || manifest.validated !== true || typeof manifest.modelVersion !== 'string' || !manifest.modelVersion ||
      !/^https:\/\//.test(manifest.validationUrl) || !Number.isFinite(Date.parse(manifest.expiresOn)) || Date.parse(manifest.expiresOn) < now ||
      manifest.retention !== 'none' || !Number.isFinite(manifest.minConfidence) || manifest.minConfidence < 0.8 || manifest.minConfidence > 1 ||
      !spec || !traits.every(t => spec.traits?.includes(t))) return null;
  return manifest;
}

export function visualSummary(counts, criteria, crop) {
  if (!criteria || criteria.crop !== crop || criteria.basis !== 'visible-object-count' || typeof criteria.version !== 'string' || !criteria.version ||
      !/^https:\/\//.test(criteria.sourceUrl) || !Number.isInteger(criteria.minGrains) || criteria.minGrains < 1 ||
      !traits.every(t => Number.isFinite(criteria.maxFractions?.[t]) && criteria.maxFractions[t] >= 0 && criteria.maxFractions[t] <= 1) ||
      !Object.values(counts).every(n => Number.isInteger(n) && n >= 0) || counts.grains < criteria.minGrains || counts.broken > counts.grains || counts.discolored > counts.grains) return null;
  const fractions = { broken: counts.broken / counts.grains, discolored: counts.discolored / counts.grains,
    foreignMaterial: counts.foreignMaterial / (counts.grains + counts.foreignMaterial) };
  return { label: traits.some(t => fractions[t] > criteria.maxFractions[t]) ? 'Review visible defects' : 'Within configured visual screening limits',
    basis: 'Visible object counts in this photo only; not mass percentages or an official grade', criteria, fractions };
}

export function validateDetections(value, manifest, crop) {
  if (!value || value.crop !== crop || value.modelVersion !== manifest.modelVersion || !Array.isArray(value.objects) || value.objects.length > 1500 ||
      !['adequate', 'poor', 'unknown'].includes(value.lighting) || !['adequate', 'poor', 'unknown'].includes(value.focus) ||
      typeof value.referenceVisible !== 'boolean' || typeof value.plainBackground !== 'boolean') throw error(503, 'The grain detector returned an invalid result. Review manually or retry.');
  const ids = new Set();
  for (const item of value.objects) {
    if (!item || typeof item.id !== 'string' || !item.id || item.id.length > 64 || ids.has(item.id) || !['grain', 'foreign_material'].includes(item.kind) ||
      !Array.isArray(item.box) || item.box.length !== 4 || !item.box.every(n => Number.isFinite(n) && n >= 0 && n <= 1) ||
      item.box[2] <= 0 || item.box[3] <= 0 || item.box[0] + item.box[2] > 1.00001 || item.box[1] + item.box[3] > 1.00001 ||
      !Number.isFinite(item.confidence) || item.confidence < 0 || item.confidence > 1 ||
      (item.kind === 'grain' && ![item.broken, item.discolored].every(b => b === true || b === false || b === null))) throw error(503, 'The grain detector returned invalid regions. No measurements were accepted.');
    ids.add(item.id);
  }
  // Rebuild an allowlisted response: external moisture/grade/price claims are discarded.
  return { crop, modelVersion: value.modelVersion, lighting: value.lighting, focus: value.focus, referenceVisible: value.referenceVisible, plainBackground: value.plainBackground,
    objects: value.objects.map(o => ({ id: o.id, kind: o.kind, box: o.box, confidence: o.confidence, broken: o.kind === 'grain' ? o.broken : null, discolored: o.kind === 'grain' ? o.discolored : null })) };
}

export async function grainScreening(body, { fetcher = fetch, manifestReader = detectorManifest } = {}) {
  if (!validCrop(body.crop)) throw error(400, 'Choose a grain crop identifier.');
  if (body.consentToUpload !== true) throw error(400, 'Consent is required before uploading a photo for screening.');
  if (body.referenceConfirmed !== true) throw error(400, 'Include and confirm a reference object or scale card in the photo.');
  const photo = await preparePhoto(body.image);
  const { data, info } = await sharp(Buffer.from(photo.dataUrl.split(',')[1], 'base64')).resize({ width: 256, height: 256, fit: 'inside' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  let sum = 0, edge = 0, edgeSq = 0, pixels = 0;
  for (const n of data) sum += n;
  for (let y = 1; y < info.height - 1; y++) for (let x = 1; x < info.width - 1; x++) {
    const p = y * info.width + x, lap = 4 * data[p] - data[p - 1] - data[p + 1] - data[p - info.width] - data[p + info.width];
    edge += lap; edgeSq += lap * lap; pixels++;
  }
  const mean = sum / data.length, variance = edgeSq / pixels - (edge / pixels) ** 2;
  const warnings = ['Preliminary visual screening of this photo only. Not an official mandi grade, lab test or sale guarantee.', 'Moisture is not measured from a photo. Counts are not weight percentages and do not describe the entire lot.'];
  const base = { crop: body.crop, status: 'unavailable', counts: emptyCounts(), regions: [], summary: null, criteria: null, modelVersion: null,
    warnings, imageQuality: { lighting: mean < 35 || mean > 240 ? 'poor' : 'unknown', focus: variance < 12 ? 'poor' : 'unknown' },
    analyzedAt: new Date().toISOString(), imageStored: false, imageDigest: photo.digest };
  if (mean < 35 || mean > 240 || variance < 12) return { ...base, status: 'retake_required', warnings: [...warnings, 'Lighting or image detail is poor. Retake in even daylight, keep the camera steady and fill the frame.'] };
  const manifest = await manifestReader(body.crop);
  if (!manifest || !process.env.GRAIN_DETECTOR_URL) return { ...base, warnings: [...warnings, 'A validated specialized grain detector is not connected for this crop. Observations remain unknown; you may review manually.'] };
  const url = new URL(process.env.GRAIN_DETECTOR_URL);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))) throw error(503, 'The grain detector must use HTTPS or local loopback.');
  let response;
  try { response = await fetcher(url, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(25000), headers: { 'Content-Type': 'application/json', ...(process.env.GRAIN_DETECTOR_TOKEN ? { Authorization: `Bearer ${process.env.GRAIN_DETECTOR_TOKEN}` } : {}) },
    body: JSON.stringify({ crop: body.crop, image: photo.dataUrl, modelVersion: manifest.modelVersion, retention: 'none' }) }); }
  catch { throw error(503, 'Grain screening could not be reached. Retry or record your own observations without uploading.'); }
  if (!response.ok) throw error(503, 'The grain detector is unavailable. No measurements were estimated.');
  let result;
  try { result = validateDetections(await response.json(), manifest, body.crop); } catch (e) { if (e.status) throw e; throw error(503, 'The grain detector returned an unreadable result.'); }
  if (result.lighting !== 'adequate' || result.focus !== 'adequate' || !result.referenceVisible || !result.plainBackground) return { ...base, status: 'retake_required', warnings: [...warnings, 'The detector could not confirm sharp, well-lit grain on a plain surface with a reference object. Retake the photo.'] };
  if (!result.objects.length || result.objects.some(o => o.confidence < manifest.minConfidence)) return { ...base, status: 'low_confidence', regions: result.objects, modelVersion: manifest.modelVersion,
    warnings: [...warnings, 'Detection is uncertain or incomplete. Counts are withheld. Inspect the regions, retake or enter manual observations.'] };
  const grains = result.objects.filter(o => o.kind === 'grain');
  if (!grains.length) return { ...base, status: 'retake_required', warnings: [...warnings, 'No grain sample was identified. Retake a clear photo of the supported grain.'] };
  const counts = { grains: grains.length, foreignMaterial: result.objects.filter(o => o.kind === 'foreign_material').length,
    broken: grains.every(o => o.broken !== null) ? grains.filter(o => o.broken).length : null,
    discolored: grains.every(o => o.discolored !== null) ? grains.filter(o => o.discolored).length : null };
  const criteria = manifest.crops[body.crop].criteria ?? null;
  return { ...base, status: 'screened', counts, regions: result.objects, modelVersion: manifest.modelVersion, validationUrl: manifest.validationUrl, criteria,
    imageQuality: { lighting: 'adequate', focus: 'adequate' }, summary: visualSummary(counts, criteria, body.crop),
    warnings: [...warnings, 'Detector estimates can miss or confuse objects. Inspect and correct every observation before saving.'] };
}
