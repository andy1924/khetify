import { cropScope, identifyCrop, PHOTO_LIMITATIONS, preparePhoto } from './crop-vision.mjs';
import { lookupPlace } from './osm.mjs';
import { enrichComparison } from './comparison.mjs';

const problem = message => Object.assign(new Error(message), { status: 400 });
export async function photoPrices(body, { tokens, parseInput, priceResult, forecastResult, recognize = identifyCrop, locate = lookupPlace }) {
  // Validate the whole request before any paid inference or location lookup.
  const input = parseInput({ ...body, query: body.query ?? {} });
  const horizon = body.horizonDays ?? 7;
  if (![7, 14, 30].includes(horizon)) throw problem('Choose a 7, 14 or 30 day forecast horizon.');
  for (const flag of ['cropConfirmed', 'varietyConfirmed', 'gradeConfirmed', 'consentToVision', 'consentToLocationLookup']) if (body[flag] !== undefined && typeof body[flag] !== 'boolean') throw problem(`${flag} must be true or false.`);
  if (body.analysisToken !== undefined && body.image !== undefined) throw problem('Supply either a new photo or an analysis token, not both.');
  const scope = await cropScope();
  if (body.cropConfirmed && (!input.query.commodity || !scope.some(c => c.commodity === input.query.commodity))) throw problem('Confirm one of the supported source commodity names.');
  let analysis;
  if (body.analysisToken !== undefined) analysis = tokens.verify(body.analysisToken);
  else {
    if (body.consentToVision !== true) throw problem('Photo recognition needs consentToVision=true to send the metadata-stripped photo to OpenAI. Manual price lookup remains available.');
    const photo = await preparePhoto(body.image);
    analysis = await recognize(photo, scope);
  }
  if (analysis.crop && !scope.some(c => c.id === analysis.crop.id && c.commodity === analysis.crop.commodity)) throw problem('The supported crop mapping changed. Upload the photo again.');
  const analysisToken = tokens.issue(analysis);
  const confirmedCrop = body.cropConfirmed === true ? scope.find(c => c.commodity === input.query.commodity) : null;
  const suggestedCrop = analysis.status === 'suggested' ? scope.find(c => c.id === analysis.crop?.id) : null;
  const selectedCrop = confirmedCrop ?? suggestedCrop;
  const base = {
    identification: analysis, analysisToken, identityBasis: confirmedCrop ? 'Farmer-confirmed crop' : 'Unconfirmed photo suggestion',
    photoDisagreesWithSelection: Boolean(confirmedCrop && analysis.crop?.id !== confirmedCrop.id),
    cropConfirmed: Boolean(confirmedCrop), forecast: { available: false, range: null, horizonDays: horizon, reasons: [], history: [] },
    reportedPrices: null, requiresConfirmation: [], nextAction: null, limitations: PHOTO_LIMITATIONS,
    imageStored: false, locationStored: false,
  };
  if (!selectedCrop) return { ...base, status: analysis.status === 'retake_required' ? 'retake_required' : 'unsupported',
    nextAction: 'Take a clear photo including the plant head or a representative grain sample, or confirm the crop manually.',
    requiresConfirmation: ['commodity'], forecast: { ...base.forecast, reasons: ['Crop identity is uncertain or outside the supported photo scope.'] } };
  const query = { ...input.query, commodity: selectedCrop.commodity };
  // An unconfirmed caller crop must never silently replace a different photo suggestion.
  if (!confirmedCrop && input.query.commodity && input.query.commodity !== selectedCrop.commodity) return { ...base, status: 'confirmation_required', requiresConfirmation: ['commodity'],
    nextAction: 'The entered crop differs from the photo suggestion. Confirm the correct source commodity before comparing prices.',
    forecast: { ...base.forecast, reasons: ['Crop identity requires confirmation.'] } };

  let areaSuggestion = null;
  if (!query.state && input.origin && body.consentToLocationLookup === true) {
    const candidates = await locate(new URLSearchParams({ lat: String(input.origin.lat), lon: String(input.origin.lon), zoom: '10' }));
    areaSuggestion = candidates[0] ?? null;
    if (areaSuggestion) { query.state = areaSuggestion.state; query.district = query.district || areaSuggestion.district.replace(/ District$/i, ''); }
  }
  if (!query.state) return { ...base, status: 'location_required', areaSuggestion,
    requiresConfirmation: ['state'], nextAction: 'Enter your state and district, or allow approximate-area lookup.',
    forecast: { ...base.forecast, reasons: ['A price market or area has not been selected.'] } };
  const fetched = await priceResult(query, input.origin, input.radius, input.locations);
  const reportedPrices = { ...fetched, ...enrichComparison(fetched.rows, input.quantity, input.unit, input.costs) };
  const requires = [];
  if (!confirmedCrop) requires.push('commodity');
  if (!query.district) requires.push('district');
  if (!query.market) requires.push('market');
  if (!query.variety || body.varietyConfirmed !== true) requires.push('variety');
  if (!query.grade || body.gradeConfirmed !== true) requires.push('grade');
  const seriesOptions = reportedPrices.rows.filter(r => r.variety && r.grade).map(r => ({ state: r.state, district: r.district, market: r.market, commodity: r.commodity, variety: r.variety, grade: r.grade, unit: r.unit }));
  const result = { ...base, areaSuggestion, selectedCrop, query, reportedPrices, seriesOptions, requiresConfirmation: requires };
  if (requires.length) return { ...result, status: 'confirmation_required', nextAction: `Confirm ${requires.join(', ')} using your crop records and a matching sourced market series.`,
    forecast: { ...base.forecast, reasons: ['A photo does not establish crop variety or official grade. Confirm the exact crop/variety/grade/market before requesting a forecast.'], history: reportedPrices.rows } };
  const forecast = await forecastResult(query, horizon);
  return { ...result, forecast, status: forecast.available ? 'forecast_available' : 'forecast_unavailable',
    nextAction: forecast.available ? 'Review the range, horizon, coverage and recent model performance.' : 'Use sourced historical prices; a forecast is unavailable for this selection.' };
}
