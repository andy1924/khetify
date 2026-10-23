import { fetchPrices } from './provider.mjs';
import { saveRows } from './store.mjs';

const query = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i].replace(/^--/, '');
  if (!['state', 'district', 'commodity', 'market', 'variety', 'grade'].includes(key) || !process.argv[i + 1]) throw new Error('Use --state, --district, --commodity, --market, --variety, --grade followed by a value.');
  query[key] = process.argv[i + 1];
}
if (!query.state || !query.commodity) throw new Error('State and commodity are required.');
const { records, rejected } = await fetchPrices(query);
await saveRows(records);
console.log(`Stored ${records.length} sourced prices; rejected ${rejected} invalid records. Existing history is retained.`);
