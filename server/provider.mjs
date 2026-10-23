import { normalize } from './prices.mjs';

export async function fetchPrices(query, fetcher = fetch) {
  if (!process.env.DATA_GOV_API_KEY) throw new Error('Government price feed is not configured. No sample prices are substituted.');
  if (process.env.PRICE_SOURCE_VERIFIED !== 'true') throw new Error('Price source access, units and terms must be verified by the operator before use.');
  const records = [], fetchedAt = new Date().toISOString();
  let total = Infinity, rejected = 0;
  for (let offset = 0; offset < total; offset += 1000) {
    if (offset >= 10000) throw new Error('Price query is too broad. Choose a district or market.');
    const url = new URL('https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070');
    url.searchParams.set('api-key', process.env.DATA_GOV_API_KEY);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1000');
    url.searchParams.set('offset', String(offset));
    for (const key of ['state', 'district', 'commodity', 'market', 'variety', 'grade']) if (query[key]) url.searchParams.set(`filters[${key}]`, query[key]);
    let response;
    try { response = await fetcher(url, { signal: AbortSignal.timeout(15000) }); }
    catch { throw new Error('Government price service could not be reached.'); }
    if (!response.ok) throw new Error(`Government price service returned HTTP ${response.status}.`);
    let body;
    try { body = await response.json(); } catch { throw new Error('Government price service returned an invalid response.'); }
    if (!Array.isArray(body.records) || (typeof body.total !== 'number' && !(typeof body.total === 'string' && /^\d+$/.test(body.total))) || !Number.isInteger(Number(body.total)) || Number(body.total) < 0 || body.error) throw new Error('Government price response did not match the expected schema.');
    total = Number(body.total);
    if (body.records.length !== Math.min(1000, Math.max(0, total - offset))) throw new Error('Government price response was incomplete.');
    for (const raw of body.records) {
      const row = normalize(raw, fetchedAt);
      if (row) records.push(row); else rejected++;
    }
  }
  return { records, rejected, fetchedAt };
}
