import { marketCropScope } from './market-crops.mjs';
import { reviewGrainScreening } from './grain-screening.mjs';
import { priceContext } from './photo-prices.mjs';

const problem = message => Object.assign(new Error(message), { status: 400 });
export async function grainPrices(body, { parseInput, priceResult, forecastResult, locate }) {
  if (!body.review || typeof body.review !== 'object' || Array.isArray(body.review)) throw problem('Supply reviewed grain observations.');
  const review = reviewGrainScreening(body.review);
  const input = parseInput(body);
  if (body.cropConfirmed !== true || !input.query.commodity) throw problem('Confirm a sourced commodity from /api/crops before linking observations to prices.');
  const scope = await marketCropScope();
  const selectedCrop = scope.find(c => c.commodity === input.query.commodity);
  if (!selectedCrop) throw problem('The selected commodity has no source catalog entry or configured mapping.');
  if (review.crop !== selectedCrop.id && review.crop !== 'other') throw problem('The reviewed crop does not match the selected commodity. Use its crop identifier from /api/crops, or explicitly review a named custom crop.');
  return { review, selectedCrop, identityBasis: 'Farmer-confirmed crop mapping', qualityPriceAdjustment: null,
    priceBasis: 'Unadjusted sourced market reports. Visual screening does not establish an official grade or lot price.',
    imageStored: false, locationStored: false,
    ...await priceContext(body, input, { priceResult, forecastResult, locate }) };
}
