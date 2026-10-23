import { createHash } from 'node:crypto';
import { readJson } from './store.mjs';
import { matches } from './prices.mjs';

export const ARCHIVE_SOURCE = { id: 'krashimitra-agmarknet-archive', name: 'KrashiMitra archive · AGMARKNET / data.gov.in',
  url: 'https://github.com/kunal-rajput-317/mandi-data', license: 'CC BY 4.0 archive · underlying Government Open Data License – India',
  attribution: 'Mandi price data via KrashiMitra, sourced from Agmarknet / data.gov.in.' };
export const partitionName = (state, commodity) => 'local-prices/' + createHash('sha256').update(JSON.stringify([state.toLowerCase(), commodity.toLowerCase()])).digest('hex') + '.json';
export async function localPriceRows(query) {
  return (await readJson(partitionName(query.state, query.commodity), [])).filter(row => matches(row, query));
}
export function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (quoted) throw new Error('Archive CSV has an unterminated quoted field.');
  row.push(cell); if (row.some(Boolean)) rows.push(row);
  const headers = rows.shift()?.map(h => h.replace(/^\uFEFF/, '').trim());
  const needed = ['date', 'state', 'district', 'market', 'commodity', 'variety', 'grade', 'min_price', 'max_price', 'modal_price'];
  if (!headers || !needed.every(k => headers.includes(k))) throw new Error('Archive schema does not match its documented fields.');
  return rows.map(values => {
    if (values.length !== headers.length) throw new Error('Archive CSV row has an unexpected number of fields.');
    return Object.fromEntries(headers.map((key, i) => [key, values[i]]));
  });
}
