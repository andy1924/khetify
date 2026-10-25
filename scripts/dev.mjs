// Demo launcher: one terminal starts both the API and Expo. No credentials are
// copied to Expo; Node loads the backend's existing private environment file.
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const serverDir = join(root, 'server');
const readEnv = async path => { try { return parseEnv(await readFile(path, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return {}; throw e; } };
const serverEnv = await readEnv(join(serverDir, '.env.local'));
const appEnv = await readEnv(join(root, '.env.local'));
const port = process.env.PRICE_API_PORT || serverEnv.PRICE_API_PORT || '8787';
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
function launch(args, options) {
  const child = spawn(process.execPath, args, { stdio: 'inherit', ...options });
  children.push(child);
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => { if (!stopping) stop(code ?? 1); });
  return child;
}
async function healthy() {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(500) });
    return response.ok && (await response.json()).service === 'khetify-api';
  } catch { return false; }
}
if (await healthy()) console.log(`Using the running Khetify backend on port ${port}.`);
else {
  launch(['--env-file-if-exists=.env.local', 'index.mjs'], {
    cwd: serverDir, env: { ...process.env, PRICE_API_HOST: process.env.PRICE_API_HOST || serverEnv.PRICE_API_HOST || '0.0.0.0',
      PRICE_ALLOWED_ORIGIN: [process.env.PRICE_ALLOWED_ORIGIN || serverEnv.PRICE_ALLOWED_ORIGIN || 'http://localhost:8081', 'http://localhost:8082'].join(',') },
  });
  for (let i = 0; i < 20 && !stopping; i++) {
    if (await healthy()) break;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  if (!stopping && !await healthy()) { console.error('Backend did not start. Check the error above and server/.env.local.'); stop(1); }
}
if (!stopping) launch([join(root, 'node_modules/expo/bin/cli'), 'start', ...process.argv.slice(2)], {
  cwd: root, env: { ...process.env, EXPO_PUBLIC_FIELD_API_URL: process.env.EXPO_PUBLIC_FIELD_API_URL || appEnv.EXPO_PUBLIC_FIELD_API_URL || `http://localhost:${port}` },
});
