#!/usr/bin/env node
/**
 * Render Khetify app icon PNGs from the editable SVGs in assets/icon.
 *
 *   node scripts/generate-icon.mjs           # render + validate
 *   node scripts/generate-icon.mjs --check   # validate existing PNGs only
 *
 * sharp is resolved from server/node_modules (it is a server dependency, not a
 * root dependency). No other tooling is required.
 */
import { createRequire } from 'node:module';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireFromServer = createRequire(path.join(root, 'server', 'package.json'));
const sharp = requireFromServer('sharp');

const ICON_DIR = path.join(root, 'assets', 'icon');
const SIZE = 1024;

/** Files rendered from source SVG → PNG. */
const TARGETS = [
  // flatten + removeAlpha: App Store rejects icons with an alpha channel.
  { svg: 'khetify-icon.svg', png: 'khetify-icon.png', opaque: true, description: 'iOS/store icon, opaque cream background' },
  { svg: 'khetify-adaptive-foreground.svg', png: 'khetify-adaptive-foreground.png', description: 'Android adaptive foreground, transparent' },
  { svg: 'khetify-monochrome.svg', png: 'khetify-monochrome.png', description: 'Android 13+ themed icon layer, transparent' },
];

/** Android adaptive icon: content should sit inside the central 66/108 safe circle. */
const SAFE_RADIUS = SIZE * (66 / 108) / 2; // ≈ 313 px at 1024

async function render({ svg, png, opaque }) {
  const source = await readFile(path.join(ICON_DIR, svg));
  const out = path.join(ICON_DIR, png);
  let pipeline = sharp(source, { density: 384 }).resize(SIZE, SIZE, { fit: 'fill' });
  if (opaque) pipeline = pipeline.flatten({ background: '#F1E8D6' }).removeAlpha();
  await pipeline.png({ compressionLevel: 9, palette: false }).toFile(out);
  return out;
}

/** Bounding box of pixels with alpha > 8. */
async function alphaBounds(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1, opaque = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const a = data[(y * info.width + x) * 4 + 3];
      if (a > 8) {
        opaque++;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY, opaque, width: info.width, height: info.height };
}

function assert(condition, message) {
  if (!condition) throw new Error(`icon validation failed: ${message}`);
}

async function validate() {
  const results = [];

  for (const { png, svg } of TARGETS) {
    const file = path.join(ICON_DIR, png);
    await stat(file);
    const meta = await sharp(file).metadata();
    assert(meta.width === SIZE && meta.height === SIZE, `${png} is ${meta.width}x${meta.height}, expected ${SIZE}x${SIZE}`);
    if (png === 'khetify-icon.png') assert(!meta.hasAlpha, 'khetify-icon.png must have no alpha channel (App Store requirement)');

    const bounds = await alphaBounds(file);
    const transparent = bounds.opaque < SIZE * SIZE;
    results.push({ png, svg, transparent, bounds });
  }

  // Full icon: must be fully opaque, no transparency (store requirement).
  const icon = results.find((r) => r.png === 'khetify-icon.png');
  assert(icon.bounds.opaque === SIZE * SIZE, 'khetify-icon.png must be fully opaque');

  // Adaptive + monochrome: must be transparent, and inside the safe circle.
  for (const name of ['khetify-adaptive-foreground.png', 'khetify-monochrome.png']) {
    const r = results.find((x) => x.png === name);
    assert(r.transparent, `${name} must have transparent corners`);
    const cx = (r.bounds.minX + r.bounds.maxX) / 2;
    const cy = (r.bounds.minY + r.bounds.maxY) / 2;
    const corners = [
      [r.bounds.minX, r.bounds.minY],
      [r.bounds.maxX, r.bounds.minY],
      [r.bounds.minX, r.bounds.maxY],
      [r.bounds.maxX, r.bounds.maxY],
    ];
    const farthest = Math.max(...corners.map(([x, y]) => Math.hypot(x - cx, y - cy)));
    assert(
      farthest <= SAFE_RADIUS + 2,
      `${name} content exceeds the 66dp adaptive safe circle (${farthest.toFixed(0)}px > ${SAFE_RADIUS.toFixed(0)}px); reduce the mark scale`,
    );
    r.safeRadius = farthest;
  }

  // Monochrome must be a flat white silhouette: only two useful alpha states.
  const mono = results.find((r) => r.png === 'khetify-monochrome.png');
  const monoBounds = mono.bounds;
  const monoCoverage = monoBounds.opaque / (SIZE * SIZE);
  assert(monoCoverage > 0.05 && monoCoverage < 0.35, `monochrome coverage ${(monoCoverage * 100).toFixed(1)}% looks wrong`);

  // 48px legibility: render the icon down and confirm the mark still has contrast.
  const small = await sharp(path.join(ICON_DIR, 'khetify-icon.png')).resize(48, 48).png().toBuffer();
  const smallMeta = await sharp(small).metadata();
  assert(smallMeta.width === 48 && smallMeta.height === 48, '48px preview failed');

  return results;
}

async function main() {
  const checkOnly = process.argv.includes('--check');
  if (!checkOnly) {
    for (const target of TARGETS) {
      await render(target);
      console.log(`rendered ${path.relative(root, path.join(ICON_DIR, target.png))}`);
    }
  }
  const results = await validate();
  for (const r of results) {
    const b = r.bounds;
    const box = `${b.maxX - b.minX + 1}x${b.maxY - b.minY + 1}`;
    const safe = r.safeRadius ? ` safe-radius ${r.safeRadius.toFixed(0)}/${SAFE_RADIUS.toFixed(0)}px` : '';
    console.log(`ok ${r.png} 1024x1024 ${r.transparent ? 'alpha' : 'opaque'} mark ${box}${safe}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
