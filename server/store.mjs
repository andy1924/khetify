import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { mergeRecords } from './prices.mjs';

export const dataDir = resolve(process.env.PRICE_DATA_DIR || '.price-data');
export async function readJson(name, fallback) {
  try { return JSON.parse(await readFile(resolve(dataDir, name), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}
export async function writeJson(name, value) {
  const path = resolve(dataDir, name);
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value));
  await rename(temp, path);
}
let queue = Promise.resolve();
export function saveRows(incoming) {
  const operation = queue.then(async () => {
    const rows = mergeRecords(await readJson('prices.json', []), incoming);
    await writeJson('prices.json', rows);
    return rows;
  });
  queue = operation.catch(() => {});
  return operation;
}
