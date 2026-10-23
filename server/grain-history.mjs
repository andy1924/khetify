import { createHash, randomBytes } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { dataDir, readJson, writeJson } from './store.mjs';
import { reviewGrainScreening } from './grain-screening.mjs';

const problem = (status, message) => Object.assign(new Error(message), { status });
const queues = new Map();
function queued(file, operation) {
  const task = (queues.get(file) ?? Promise.resolve()).catch(() => {}).then(operation);
  queues.set(file, task);
  return task.finally(() => { if (queues.get(file) === task) queues.delete(file); });
}
function sessionFile(token) {
  return 'grain-history/' + createHash('sha256').update(token).digest('hex') + '.json';
}
export async function createHistorySession(body) {
  if (body.consentToStore !== true) throw problem(400, 'Explicit consentToStore=true is required for backend result history. Photos are never stored.');
  const token = randomBytes(32).toString('hex');
  await writeJson(sessionFile(token), { version: 1, consentedAt: new Date().toISOString(), records: [] });
  return { token, retention: 'Reviewed observations and optional meter readings remain on this server until you delete this history. Photos are never stored.',
    maxRecords: 100, tokenNotice: 'Keep this bearer token private. It grants access to this history; deleting the history revokes it.' };
}
export async function grainHistory(authorization, method, body, recordId) {
  const token = /^Bearer ([a-f0-9]{64})$/.exec(authorization ?? '')?.[1];
  if (!token) throw problem(401, 'A private history bearer token is required.');
  if (recordId !== undefined && !/^[a-f0-9-]{36}$/.test(recordId)) throw problem(400, 'Invalid history record identifier.');
  const file = sessionFile(token);
  return queued(file, async () => {
    const session = await readJson(file, null);
    if (!session) throw problem(401, 'This history token is invalid or has been revoked.');
    if (method === 'GET') return { records: session.records, imagesStored: false, retention: 'Until this history is deleted' };
    if (method === 'DELETE' && recordId === undefined) {
      await unlink(resolve(dataDir, file));
      return { deleted: true, tokenRevoked: true };
    }
    if (method === 'DELETE') {
      const remaining = session.records.filter(r => r.id !== recordId);
      if (remaining.length === session.records.length) throw problem(404, 'History record not found.');
      await writeJson(file, { ...session, records: remaining });
      return { deleted: true, id: recordId };
    }
    if (method !== 'POST') throw problem(405, 'Use GET, POST or DELETE for history.');
    if (body.consentToStore !== true) throw problem(400, 'Confirm consentToStore=true for each saved review.');
    if (!body.review || typeof body.review !== 'object' || Array.isArray(body.review) || 'image' in body || 'image' in body.review) throw problem(400, 'Supply reviewed observations only. Images cannot be saved to history.');
    const review = reviewGrainScreening(body.review);
    if (session.records.length >= 100) throw problem(409, 'This history is full. Delete a record before saving another.');
    const record = { ...review, stored: true, savedAt: new Date().toISOString() };
    await writeJson(file, { ...session, records: [record, ...session.records] });
    return { record, imagesStored: false };
  });
}
