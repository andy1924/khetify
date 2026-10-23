// All supplied costs are total rupees for the selected quantity, per market.
// Unknown and zero are distinct. No freight rates or market charges are assumed.
export function costEstimate(quote, quantity, unit, costs = []) {
  const valid = value => (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value.trim())) || (typeof value === 'number' && Number.isFinite(value) && value >= 0);
  if (!['kg', 'quintal'].includes(unit) || !valid(quantity) || Number(quantity) <= 0) return { gross: null, costs: null, remainder: null };
  const gross = Number(quantity) / (unit === 'kg' ? 100 : 1) * quote.modal;
  if (!Number.isFinite(gross) || costs.length !== 3 || !costs.every(valid)) return { gross: Number.isFinite(gross) ? gross : null, costs: null, remainder: null };
  const total = costs.reduce((sum, value) => sum + Number(value), 0);
  if (!Number.isFinite(total)) return { gross, costs: null, remainder: null };
  return { gross, costs: total, remainder: gross - total };
}

export function enrichComparison(rows, quantity, unit = 'quintal', costs = {}) {
  const groups = new Set(rows.map(r => JSON.stringify([r.commodity, r.variety, r.grade, r.unit, r.date])));
  return {
    comparable: rows.length > 0 && groups.size === 1 && rows.every(r => r.variety && r.grade && !r.stale),
    rows: rows.map(row => ({ ...row, estimate: costEstimate(row, quantity, unit, [costs[row.id]?.transport, costs[row.id]?.handling, costs[row.id]?.fees]),
      quantity: quantity ?? null, quantityUnit: unit, priceBasis: 'Reported modal price', costBasis: 'Caller-entered total INR per trip',
      unknownCosts: ['transport', 'handling', 'fees'].filter(k => costs[row.id]?.[k] === undefined || costs[row.id]?.[k] === null || costs[row.id]?.[k] === ''),
    })),
    limitation: 'Reported prices are not buyer offers. Distance is approximate straight-line distance, not road distance. Remainder subtracts only entered costs; other deductions may apply. It is not guaranteed net earnings.',
  };
}
