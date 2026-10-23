import { createHash } from 'node:crypto';
import { ARCHIVE_SOURCE, parseCsv, partitionName } from './local-prices.mjs';
import { keyOf, mergeRecords, normalize } from './prices.mjs';
import { readJson, writeJson } from './store.mjs';

// Publicly licensed archive, not a scraped credential or generated price engine.
const headers = { 'User-Agent': 'Khetify-public-market-archive (https://github.com/andy1924/khetify)' };
async function get(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Public archive request failed: HTTP ${response.status}`);
  return response;
}
const repo = 'https://api.github.com/repos/kunal-rajput-317/mandi-data';
const commit = (await (await get(repo + '/commits/main')).json()).sha;
if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Archive revision could not be pinned.');
const tree = await (await get(`${repo}/git/trees/${commit}?recursive=1`)).json();
if (tree.truncated || !Array.isArray(tree.tree)) throw new Error('Archive listing is incomplete.');
const files = tree.tree.filter(f => /^data\/\d{4}\/\d{2}\/\d{4}-\d{2}-\d{2}\.csv$/.test(f.path));
if (!files.length || files.length > 366 || files.some(f => f.size > 10 * 1024 * 1024)) throw new Error('Archive size requires an explicit collection review.');
const fetchedAt = new Date().toISOString(), partitions = new Map(), audit = [];
let rejected = 0, accepted = 0;
for (const file of files) {
  const url = `https://raw.githubusercontent.com/kunal-rajput-317/mandi-data/${commit}/${file.path}`;
  const csv = await (await get(url)).text();
  if (Buffer.byteLength(csv) > 10 * 1024 * 1024) throw new Error('Archive file exceeded its limit.');
  const raw = parseCsv(csv);
  for (const item of raw) {
    const row = normalize({ ...item, arrival_date: item.date, unit: 'INR/quintal' }, fetchedAt);
    if (!row) { rejected++; continue; }
    row.source = ARCHIVE_SOURCE; row.archiveRevision = commit;
    const partition = partitionName(row.state, row.commodity);
    if (!partitions.has(partition)) partitions.set(partition, []);
    partitions.get(partition).push(row); accepted++;
  }
  audit.push({ url, sha256: createHash('sha256').update(csv).digest('hex'), rows: raw.length });
  console.log(`Collected ${file.path}: ${raw.length} source rows`);
}
const catalog = new Map();
for (const [file, incoming] of partitions) {
  const rows = mergeRecords(await readJson(file, []), incoming);
  await writeJson(file, rows);
  for (const r of rows) catalog.set(keyOf(r), { state: r.state, district: r.district, market: r.market, commodity: r.commodity, variety: r.variety, grade: r.grade, unit: r.unit });
}
await writeJson('local-catalog.json', [...catalog.values()]);
await writeJson('local-price-provenance.json', { source: ARCHIVE_SOURCE, revision: commit, collectedAt: fetchedAt, accepted, rejected, files: audit });
console.log(JSON.stringify({ accepted, rejected, files: files.length, partitions: partitions.size, series: catalog.size, source: ARCHIVE_SOURCE.name }));
