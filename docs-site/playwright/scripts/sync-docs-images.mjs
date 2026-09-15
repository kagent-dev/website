#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Publish Playwright baselines into the docs img tree (docs-site/assets/img).
 *
 *   node scripts/sync-docs-images.mjs            # copy captured baselines -> assets/img/
 *   node scripts/sync-docs-images.mjs --dry-run  # print what would be copied, copy nothing
 *
 * Baselines are named `<name>-<project>.png`, where the project is the theme, so each
 * image publishes twice: the `light` baseline to `light`, the `dark` one to `dark`.
 *
 * A missing baseline is a warning and a nonzero exit rather than a hard stop, because the
 * two capture sources are run separately — the live-cluster specs need a cluster and the
 * chat spec needs a mock dev server, so syncing after either one legitimately leaves the
 * other's images unrefreshed. The exit code still makes that visible in CI.
 */
const __dirname = dirname(fileURLToPath(import.meta.url));
const pwRoot = resolve(__dirname, '..');
// docs-site/, the Hugo root — `assets/` in the map is relative to this.
const siteRoot = resolve(pwRoot, '..');
const dryRun = process.argv.includes('--dry-run');

const map = JSON.parse(readFileSync(join(pwRoot, 'docs-image-map.json'), 'utf8')).images;
const snapDir = join(pwRoot, '__screenshots__');

/** Find the baseline PNG named `<name>-<project>.png` under any *-snapshots subdir. */
function findBaseline(name, project) {
  if (!existsSync(snapDir)) return null;
  const target = `${name.replace(/\.png$/, '')}-${project}.png`;
  const stack = [snapDir];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name === target) return full;
    }
  }
  return null;
}

let copied = 0;
let missing = 0;
for (const [name, entry] of Object.entries(map)) {
  for (const project of ['light', 'dark']) {
    const dest = entry[project];
    // A single-theme image is legitimate — omit the key rather than pointing both
    // themes at one file, so the map says which images genuinely have two variants.
    if (!dest) continue;

    const baseline = findBaseline(name, project);
    if (!baseline) {
      console.warn(`! missing ${project} baseline for ${name}`);
      missing++;
      continue;
    }
    const target = resolve(siteRoot, dest);
    console.log(`${dryRun ? '[dry-run] ' : ''}${basename(baseline)} -> ${dest}`);
    if (!dryRun) {
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(baseline, target);
    }
    copied++;
  }
}

console.log(`\n${dryRun ? 'would copy' : 'copied'} ${copied} image(s)` + (missing ? `, ${missing} missing` : ''));
if (missing) process.exitCode = 1;
