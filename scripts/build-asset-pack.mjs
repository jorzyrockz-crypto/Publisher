#!/usr/bin/env node
/**
 * Builds the shipped Storybook & Reading Corner asset pack.
 *
 * Source art lives in `.pack-src/<id>.png` (generated, not committed). This turns each piece into
 * the two sizes the picker needs — a 160px thumb and a full-size WebP — and writes the pack's
 * `manifest.json` from the table below, so the manifest cannot drift from the files:
 *
 *   public/asset-packs/storybook-reading-v1/
 *     manifest.json
 *     thumbs/<id>.webp     160px long edge, for the sidebar grid
 *     full/<id>.webp       full size, cut out and trimmed for frames and stickers
 *
 * Cutouts: frames and stickers are drawn on white, so the white is flood-filled from every corner
 * (connected only — an owl's glasses or a book's pages stay white) and the result is trimmed to its
 * ink. Backdrops are kept as painted, edge to edge.
 *
 * Requires ImageMagick (`convert`) on PATH. Run: npm run pack:storybook
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, '.pack-src');
const OUT = path.join(ROOT, 'public', 'asset-packs', 'storybook-reading-v1');

const PACK = {
  packId: 'storybook-reading-v1',
  name: 'Storybook & Reading Corner',
  version: '1.0.0',
};

/** `slot` is an addition to the published schema: a hint for where a frame wants to land. */
const ASSETS = [
  {
    id: 'bg-enchanted-forest',
    label: 'Enchanted Forest Clearing',
    layer: 'backdrop',
    tags: ['forest', 'storybook', 'nature', 'cover'],
    cutout: false,
  },
  {
    id: 'bg-cozy-reading-nook',
    label: 'Cozy Reading Nook',
    layer: 'backdrop',
    tags: ['classroom', 'reading', 'nook', 'interior'],
    cutout: false,
  },
  {
    id: 'bg-sunny-hilltop',
    label: 'Sunny Hilltop Meadow',
    layer: 'backdrop',
    tags: ['meadow', 'hills', 'sky', 'spring'],
    cutout: false,
  },
  {
    id: 'frame-top-canopy',
    label: 'Hanging Canopy Leaves',
    layer: 'frame',
    tags: ['leaves', 'border', 'top', 'frame'],
    cutout: true,
    slot: 'top',
  },
  {
    id: 'frame-bottom-grass',
    label: 'Grass & Wildflower Strip',
    layer: 'frame',
    tags: ['grass', 'flowers', 'border', 'bottom'],
    cutout: true,
    slot: 'bottom',
  },
  {
    id: 'frame-corner-vines',
    label: 'Corner Vines & Blossoms',
    layer: 'frame',
    tags: ['vines', 'corner', 'border', 'frame'],
    cutout: true,
    slot: 'corner',
  },
  {
    id: 'sticker-reading-kids',
    label: 'Kids Reading Together',
    layer: 'sticker',
    tags: ['kids', 'reading', 'books', 'mascot'],
    cutout: true,
  },
  {
    id: 'sticker-reading-owl',
    label: 'Reading Owl on Books',
    layer: 'sticker',
    tags: ['owl', 'books', 'clever', 'mascot'],
    cutout: true,
  },
  {
    id: 'sticker-playful-monkey',
    label: 'Playful Monkey',
    layer: 'sticker',
    tags: ['monkey', 'animal', 'leaf', 'mascot'],
    cutout: true,
  },
  {
    id: 'sticker-magic-book',
    label: 'Open Magic Book',
    layer: 'sticker',
    tags: ['book', 'magic', 'sparkles', 'story'],
    cutout: true,
  },
  {
    id: 'sticker-sun-cloud',
    label: 'Smiling Sun & Cloud',
    layer: 'sticker',
    tags: ['sun', 'cloud', 'weather', 'happy'],
    cutout: true,
  },
  {
    id: 'sticker-wooden-sign',
    label: 'Reading Corner Sign',
    layer: 'sticker',
    tags: ['sign', 'wood', 'label', 'blank'],
    cutout: true,
  },
];

const run = (args) => execFileSync('convert', args, { stdio: ['ignore', 'pipe', 'pipe'] });
const size = (file) => {
  const [w, h] = execFileSync('identify', ['-format', '%w %h', file]).toString().trim().split(' ').map(Number);
  return { width: w, height: h };
};

/**
 * Cut the white out of a drawing: flood-fill every corner, then trim to what is left. Doing it
 * connected-only is the whole point — a global `-transparent white` punches holes in exactly the
 * details a children's illustration is made of.
 */
function cutout(srcFile, dstFile) {
  const flood = (corner) => ['-fill', 'none', '-floodfill', corner, 'white'];
  const tmp = `${dstFile}.tmp.png`;
  run([
    srcFile,
    '-alpha', 'set',
    '-fuzz', '12%',
    ...flood('+0+0'),
    ...flood('+0+0'),
    ...flood('+0+0'),
    ...flood('+0+0'),
    '-trim', '+repage',
    tmp,
  ]);
  // Corners of a trimmed cutout can still be white if the ink touches the edge: repeat once.
  const { width, height } = size(tmp);
  run([
    tmp,
    '-alpha', 'set',
    '-fuzz', '12%',
    ...flood('+0+0'),
    ...flood(`+${width - 1}+0`),
    ...flood(`+0+${height - 1}`),
    ...flood(`+${width - 1}+${height - 1}`),
    '-trim', '+repage',
    '-bordercolor', 'none', '-border', '4',
    '-resize', '1024x1024>',
    '-strip',
    '-quality', '86',
    dstFile,
  ]);
  fs.rmSync(tmp, { force: true });
}

function paint(srcFile, dstFile) {
  run([srcFile, '-resize', '1400x1400>', '-strip', '-quality', '86', dstFile]);
}

function thumb(srcFile, dstFile) {
  run([srcFile, '-resize', '160x160', '-strip', '-quality', '72', dstFile]);
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`No source art in ${path.relative(ROOT, SRC)}/ — nothing to build.`);
    process.exit(1);
  }
  fs.mkdirSync(path.join(OUT, 'thumbs'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'full'), { recursive: true });

  const assets = [];
  const missing = [];

  for (const asset of ASSETS) {
    const srcFile = path.join(SRC, `${asset.id}.png`);
    if (!fs.existsSync(srcFile)) {
      missing.push(asset.id);
      continue;
    }
    const fullAbs = path.join(OUT, 'full', `${asset.id}.webp`);
    const thumbAbs = path.join(OUT, 'thumbs', `${asset.id}.webp`);
    if (asset.cutout) cutout(srcFile, fullAbs);
    else paint(srcFile, fullAbs);
    thumb(fullAbs, thumbAbs);
    const { width, height } = size(fullAbs);

    assets.push({
      id: asset.id,
      label: asset.label,
      layer: asset.layer,
      tags: asset.tags,
      ...(asset.slot ? { slot: asset.slot } : {}),
      thumb: `thumbs/${asset.id}.webp`,
      full: `full/${asset.id}.webp`,
      width,
      height,
    });
    console.log(
      `${asset.id.padEnd(24)} ${asset.layer.padEnd(8)} ${String(width).padStart(4)}x${String(height).padEnd(4)}`,
      `${(fs.statSync(fullAbs).size / 1024).toFixed(0)} kB`
    );
  }

  const manifest = { ...PACK, assets };
  fs.writeFileSync(path.join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const bytes = assets.reduce(
    (sum, a) => sum + fs.statSync(path.join(OUT, a.full)).size + fs.statSync(path.join(OUT, a.thumb)).size,
    0
  );
  console.log(`\n${assets.length} assets, ${(bytes / 1024 / 1024).toFixed(2)} MB total`);
  if (missing.length) console.log(`still to generate: ${missing.join(', ')}`);
}

main();
