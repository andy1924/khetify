import { createHash } from 'node:crypto';

export const SOURCE = {
  id: 'agmarknet-ogd', name: 'AGMARKNET / data.gov.in',
  url: 'https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi',
  license: 'Government Open Data License – India',
};
export const DAY = 86400000;
export const dayNumber = day => Date.parse(`${day}T00:00:00Z`) / DAY;
const clean = value => typeof value === 'string' ? value.trim() : '';
export const keyOf = row => JSON.stringify(['state', 'district', 'market', 'commodity', 'variety', 'grade', 'unit'].map(k => row[k]));
export const recordKey = row => `${keyOf(row)}|${row.date}`;

export function parseDate(value) {
  const raw = clean(value);
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  const day = match ? `${match[3]}-${match[2]}-${match[1]}` : raw;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const time = Date.parse(`${day}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === day ? day : null;
}

export function normalize(record, fetchedAt, now = Date.now()) {
  const date = parseDate(record.arrival_date);
  const text = Object.fromEntries(['state', 'district', 'market', 'commodity', 'variety', 'grade'].map(k => [k, clean(record[k])]));
  const number = key => {
    const raw = record[key];
    return (typeof raw === 'number' || (typeof raw === 'string' && /^\d+(\.\d+)?$/.test(raw.trim()))) ? Number(raw) : NaN;
  };
  const min = number('min_price'), max = number('max_price'), modal = number('modal_price');
  if (!date || dayNumber(date) > Math.floor(now / DAY) || !text.state || !text.district || !text.market || !text.commodity ||
      ![min, max, modal].every(n => Number.isFinite(n) && n > 0) || min > modal || modal > max) return null;
  // This adapter is exclusively for the documented AGMARKNET INR/quintal feed.
  // Unknown explicit units are never silently coerced.
  if (record.unit && record.unit !== 'INR/quintal') return null;
  const row = { ...text, date, min, max, modal, unit: 'INR/quintal', original: { min, max, modal, unit: 'INR/quintal' }, source: SOURCE, fetchedAt };
  return { ...row, id: createHash('sha256').update(recordKey(row)).digest('hex').slice(0, 24) };
}

export function mergeRecords(existing, incoming) {
  const rows = new Map(existing.map(row => [recordKey(row), row]));
  for (const row of incoming) rows.set(recordKey(row), row);
  return [...rows.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function matches(row, query) {
  return ['state', 'district', 'market', 'commodity', 'variety', 'grade'].every(k => !query[k] || row[k].toLowerCase() === query[k].toLowerCase());
}

export function distanceKm(a, b) {
  const rad = v => v * Math.PI / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

export function compare(rows, query, locations = [], origin = null, radius = null, now = Date.now()) {
  const latest = new Map();
  for (const row of rows.filter(r => matches(r, query))) {
    const key = keyOf(row);
    if (!latest.has(key) || latest.get(key).date < row.date) latest.set(key, row);
  }
  const result = [...latest.values()].map(row => {
    const location = locations.find(loc => ['state', 'district', 'market'].every(k => loc[k] === row[k]));
    const coords = location && Number.isFinite(location.lat) && Number.isFinite(location.lon) &&
      Math.abs(location.lat) <= 90 && Math.abs(location.lon) <= 180 && /^https:\/\//.test(location.sourceUrl) && parseDate(location.verifiedOn) ? location : null;
    const distance = origin && coords ? distanceKm(origin, coords) : null;
    return { ...row, stale: Math.floor(now / DAY) - dayNumber(row.date) > 3,
      comparable: Boolean(query.variety && query.grade && row.variety && row.grade),
      location: coords, distanceKm: distance === null ? null : Math.round(distance * 10) / 10 };
  }).filter(row => radius === null || (row.distanceKm !== null && row.distanceKm <= radius));
  return result.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || b.date.localeCompare(a.date) || a.market.localeCompare(b.market));
}

function estimate(train, targetDay) {
  const recent = train.slice(-28);
  const end = dayNumber(recent.at(-1).date);
  const x = recent.map(row => dayNumber(row.date) - end);
  const y = recent.map(row => Math.log(row.modal));
  const mean = list => list.reduce((sum, n) => sum + n, 0) / list.length;
  const mx = mean(x), my = mean(y);
  const denominator = x.reduce((sum, n) => sum + (n - mx) ** 2, 0);
  const slope = denominator ? x.reduce((sum, n, i) => sum + (n - mx) * (y[i] - my), 0) / denominator : 0;
  return Math.exp(my + slope * (targetDay - end - mx));
}
const quantile = (values, p) => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.ceil((values.length + 1) * p) - 1)];
const mean = list => list.reduce((sum, n) => sum + n, 0) / list.length;

// Fixed algorithm: no tuning or model selection against the reported test period.
export function forecast(input, horizon, policy = null, now = Date.now()) {
  const rows = [...input].sort((a, b) => a.date.localeCompare(b.date));
  if (![7, 14, 30].includes(horizon)) throw new Error('Choose a 7, 14 or 30 day horizon.');
  if (new Set(rows.map(keyOf)).size > 1 || new Set(rows.map(r => r.date)).size !== rows.length) throw new Error('Forecast requires one unique comparable series.');
  const first = rows[0]?.date ?? null, last = rows.at(-1)?.date ?? null;
  const spanDays = first ? dayNumber(last) - dayNumber(first) + 1 : 0;
  const gaps = rows.slice(1).map((r, i) => dayNumber(r.date) - dayNumber(rows[i].date));
  const coverage = { observations: rows.length, first, last, spanDays, density: spanDays ? rows.length / spanDays : 0, maxGapDays: Math.max(0, ...gaps) };
  const digest = createHash('sha256').update(JSON.stringify([rows[0] ? keyOf(rows[0]) : null, rows.map(r => [r.date, r.min, r.max, r.modal, r.source.id])])).digest('hex');
  const base = { available: false, horizonDays: horizon, generatedAt: new Date(now).toISOString(), coverage, modelVersion: 'log-linear-28-v1', dataDigest: digest, metrics: null, range: null, targetDate: null, reasons: [], history: rows.slice(-60) };
  const reasons = [];
  if (rows.length < 180 || spanDays < 365 || coverage.density < 0.45 || coverage.maxGapDays > 14) reasons.push('Historical coverage is sparse or has long gaps.');
  if (!last || Math.floor(now / DAY) - dayNumber(last) > 3) reasons.push('Latest reported price is missing or older than 3 days.');
  if (rows.some(r => !r.variety || !r.grade)) reasons.push('Comparable variety and grade are required.');
  if (reasons.length) return { ...base, reasons };

  // Non-overlapping calendar horizons. A fold is usable only with an exact target-day observation.
  const byDay = new Map(rows.map(row => [dayNumber(row.date), row]));
  const folds = [];
  let nextOrigin = -Infinity;
  for (let i = 59; i < rows.length; i++) {
    const origin = dayNumber(rows[i].date), target = origin + horizon;
    if (origin < nextOrigin || !byDay.has(target)) continue;
    const train = rows.slice(0, i + 1), predicted = estimate(train, target), actual = byDay.get(target).modal;
    const residual = Math.abs(Math.log(actual / predicted));
    // Calibration uses only earlier target outcomes known at this training cutoff.
    const known = folds.filter(f => f.target <= origin).slice(-20);
    const q = known.length >= 20 ? quantile(known.map(f => f.residual), 0.8) : null;
    folds.push({ origin, target, predicted, actual, residual, error: Math.abs(actual - predicted), baselineError: Math.abs(actual - rows[i].modal), q });
    nextOrigin = target;
  }
  const evaluated = folds.filter(f => f.q !== null && f.target >= dayNumber(last) - 365).slice(-12);
  if (evaluated.length < 12) return { ...base, reasons: ['Fewer than 12 recent independent evaluation windows after 20 calibration windows.'] };
  const mae = mean(evaluated.map(f => f.error)), baselineMAE = mean(evaluated.map(f => f.baselineError));
  const improvement = baselineMAE > 0 ? 1 - mae / baselineMAE : 0;
  const intervalCoverage = mean(evaluated.map(f => f.residual <= f.q ? 1 : 0));
  const recent = evaluated.slice(-6);
  const recentBaseline = mean(recent.map(f => f.baselineError));
  const recentImprovement = recentBaseline > 0 ? 1 - mean(recent.map(f => f.error)) / recentBaseline : 0;
  const q = quantile(folds.slice(-20).map(f => f.residual), 0.8);
  const target = dayNumber(last) + horizon, point = estimate(rows, target);
  const lower = point * Math.exp(-q), upper = point * Math.exp(q), relativeWidth = (upper - lower) / point;
  const metrics = { mae, baselineMAE, improvement, recentImprovement, intervalCoverage, nominalCoverage: 0.8, relativeWidth, windows: evaluated.length,
    evaluationFrom: new Date(evaluated[0].target * DAY).toISOString().slice(0, 10), evaluationTo: new Date(evaluated.at(-1).target * DAY).toISOString().slice(0, 10), baseline: 'Last observed modal price', calibrationWindows: 20 };
  // Policy must name this exact series/horizon and the reviewed model version.
  const validPolicy = policy?.enabled === true && policy.seriesKey === keyOf(rows[0]) && policy.horizonDays === horizon &&
    policy.modelVersion === base.modelVersion && Boolean(policy.approvedBy?.trim()) && parseDate(policy.approvedOn) &&
    dayNumber(policy.approvedOn) <= Math.floor(now / DAY) && parseDate(policy.expiresOn) && dayNumber(policy.expiresOn) >= Math.floor(now / DAY) &&
    Number.isFinite(policy.minImprovement) && policy.minImprovement > 0 && policy.minImprovement < 1 &&
    Number.isFinite(policy.minCoverage) && policy.minCoverage >= 0.7 && policy.minCoverage <= 0.8 &&
    Number.isFinite(policy.maxCoverage) && policy.maxCoverage >= 0.8 && policy.maxCoverage <= 0.95 &&
    Number.isFinite(policy.maxRelativeWidth) && policy.maxRelativeWidth > 0 && policy.maxRelativeWidth <= 0.5;
  if (!validPolicy) reasons.push('Release thresholds have not been approved for this series and horizon.');
  else {
    if (improvement < policy.minImprovement || recentImprovement < policy.minImprovement) reasons.push('Recent accuracy does not meet the improvement threshold against the baseline.');
    if (intervalCoverage < policy.minCoverage || intervalCoverage > policy.maxCoverage) reasons.push('Prediction interval calibration is outside the approved range.');
    if (relativeWidth > policy.maxRelativeWidth) reasons.push('Uncertainty is wider than the approved limit.');
  }
  if (![point, lower, upper].every(n => Number.isFinite(n) && n > 0)) reasons.push('Model output is invalid.');
  return { ...base, metrics, reasons, available: reasons.length === 0, policy: validPolicy ? policy : null,
    range: reasons.length ? null : { lower, upper, unit: 'INR/quintal', confidence: 0.8 },
    targetDate: reasons.length ? null : new Date(target * DAY).toISOString().slice(0, 10) };
}
