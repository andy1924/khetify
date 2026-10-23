import { readFile } from 'node:fs/promises';
import { normalize } from './prices.mjs';
import { saveRows } from './store.mjs';

const file = process.argv[2];
if (!file) throw new Error('Usage: npm run prices:import -- path/to/agmarknet-export.json');
if (process.env.PRICE_SOURCE_VERIFIED !== 'true') throw new Error('Verify source access, units and terms; set PRICE_SOURCE_VERIFIED=true before import.');
const body = JSON.parse(await readFile(file, 'utf8'));
const raw = Array.isArray(body) ? body : body.records;
if (!Array.isArray(raw) || raw.length > 100000) throw new Error('Expected an AGMARKNET records array with at most 100,000 rows.');
const rows = raw.map(r => normalize(r, new Date().toISOString()));
if (rows.some(r => !r)) throw new Error(`${rows.filter(r => !r).length} invalid records. Correct the export before importing; nothing was saved.`);
await saveRows(rows);
console.log(`Imported ${rows.length} sourced records. Forecast eligibility is evaluated separately.`);
