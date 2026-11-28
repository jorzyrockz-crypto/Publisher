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
  version: '1.1.0',
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
    id: 'bg-starlit-night',
    label: 'Starlit Storybook Night',
    layer: 'backdrop',
    tags: ['night', 'moon', 'stars', 'bedtime'],
    cutout: false,
  },
  {
    id: 'bg-underwater',
    label: 'Under the Sea',
    layer: 'backdrop',
    tags: ['sea', 'ocean', 'water', 'fish', 'coral'],
    cutout: false,
  },
  {
    id: 'bg-snowy-village',
    label: 'Snowy Village',
    layer: 'backdrop',
    tags: ['winter', 'snow', 'holiday', 'december'],
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
    // Dense foliage: hundreds of slivers of paper between overlapping leaves, too many to seed and
    // too small to scan cleanly, and nothing in the art is white. A soft knock-out is the finish.
    knockout: 8,
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
    id: 'frame-side-ivy',
    label: 'Side Ivy Border',
    layer: 'frame',
    tags: ['ivy', 'side', 'border', 'frame'],
    cutout: true,
    slot: 'left',
    // The vine spirals close around long paper channels the corners cannot reach, and they move
    // whenever the art is redrawn — so this piece is scanned rather than hand-seeded.
    scanPockets: { cell: 16, min: 80 },
  },
  {
    id: 'frame-bunting-stars',
    label: 'Bunting & Star Garland',
    layer: 'frame',
    tags: ['bunting', 'flags', 'stars', 'top', 'party'],
    cutout: true,
    slot: 'top',
    // The swag between the string and the flags is a hole the corner flood cannot reach.
    clearSeeds: [
      [0.5, 0.14],
      [0.35, 0.2],
      [0.65, 0.2],
      [0.5, 0.3],
      [0.24, 0.3],
      [0.76, 0.3],
    ],
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
    // The gap between the board and the crossbar is paper in a rectangle; seeded rather than
    // scanned so the white blossoms at the base of the post stay white.
    clearSeeds: [
      [0.3, 0.33],
      [0.45, 0.35],
      [0.55, 0.37],
      [0.39, 0.3],
    ],
  },
  {
    id: 'badge-rosette',
    label: 'Rosette Award',
    layer: 'badge',
    tags: ['award', 'rosette', 'ribbon', 'prize', 'blank'],
    cutout: true,
  },
  {
    id: 'badge-star-medal',
    label: 'Star Medal',
    layer: 'badge',
    tags: ['medal', 'star', 'ribbon', 'award'],
    cutout: true,
    // The inside of the neck ribbon is open sky, not paper.
    clearSeeds: [
      [0.5, 0.18],
      [0.42, 0.26],
      [0.58, 0.26],
    ],
  },
];

const run = (args) => execFileSync('convert', args, { stdio: ['ignore', 'pipe', 'pipe'] });
const size = (file) => {
  const [w, h] = execFileSync('identify', ['-format', '%w %h', file]).toString().trim().split(' ').map(Number);
  return { width: w, height: h };
};

/**
 * Measures the opaque white that survived the corner and perimeter floods and returns seeds at the
 * centre of the big blocks.
 *
 * A hand-written seed list rots the moment the art is redrawn, so a piece can ask for this instead:
 * the cutout is scanned on a 40px grid and only cells that are mostly white become seeds. A cream
 * flower is not mostly white at that scale, so it survives; a paper channel between two vines is.
 */
function measureWhiteSeeds(imgFile, { cell = 40, min = 600 } = {}) {
  const text = execFileSync('convert', [imgFile, '-depth', '8', 'txt:-'], {
    maxBuffer: 1 << 28,
  }).toString();
  const [width, height] = execFileSync('identify', ['-format', '%w %h', imgFile]).toString().trim().split(' ').map(Number);
  const counts = new Map();
  // A seed has to land *on* white to do anything, and the centre of a grid cell in a narrow
  // channel is usually a leaf — so each cell remembers one of its own white pixels instead.
  const sample = new Map();
  for (const line of text.split('\n')) {
    const match = /^(\d+),(\d+): \((\d+),(\d+),(\d+),(\d+)\)/.exec(line);
    if (!match) continue;
    const [, xs, ys, r, g, b, a] = match;
    // "White" here means paper-white, not #ffffff: the channel left behind after a flood is often
    // one or two points off warm. A loose neutral test catches that without catching cream.
    if (Number(a) < 200) continue;
    if (Math.min(Number(r), Number(g), Number(b)) < 224) continue;
    if (Math.max(Number(r), Number(g), Number(b)) - Math.min(Number(r), Number(g), Number(b)) > 22) continue;
    const key = `${Math.floor(Number(xs) / cell)}:${Math.floor(Number(ys) / cell)}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (!sample.has(key)) sample.set(key, [Number(xs), Number(ys)]);
  }
  const seeds = [];
  for (const [key, count] of counts) {
    if (count < min) continue;
    const [x, y] = sample.get(key);
    seeds.push([(x + 0.5) / width, (y + 0.5) / height]);
  }
  return seeds;
}

/**
 * Cut the white out of a drawing: flood-fill every corner, then trim to what is left. Doing it
 * connected-only is the whole point — a global `-transparent white` punches holes in exactly the
 * details a children's illustration is made of.
 */
function cutout(srcFile, dstFile, clearSeeds = [], scanPockets = null, knockout = 0) {
  const flood = (point) => ['-fill', 'none', '-floodfill', point, 'white'];
  const work = path.join(OUT, `.cutout-${path.basename(dstFile, '.webp')}.png`);

  // Pass 1 — the background: flood the corner, trim what is left.
  run([srcFile, '-alpha', 'set', '-fuzz', '12%', ...flood('+0+0'), ...flood('+0+0'), '-trim', '+repage', work]);

  const dims = () => size(work);
  const at = (fx, fy, { width, height }) =>
    `+${Math.min(width - 1, Math.max(0, Math.round(fx * width)))}+${Math.min(height - 1, Math.max(0, Math.round(fy * height)))}`;

  // Pass 2 — corners, then the whole perimeter: a leaf that crosses an edge cuts the background
  // into pockets and none of them contains a corner.
  const first = dims();
  const perimeter = [0.125, 0.375, 0.625, 0.875].flatMap((f) => [
    at(f, 0, first),
    at(f, 1, first),
    at(0, f, first),
    at(1, f, first),
  ]);
  const s1 = `${work}.1.png`;
  run([
    work,
    '-alpha', 'set',
    '-fuzz', '12%',
    ...flood('+0+0'),
    ...flood(`+${first.width - 1}+0`),
    ...flood(`+0+${first.height - 1}`),
    ...flood(`+${first.width - 1}+${first.height - 1}`),
    ...perimeter.flatMap(flood),
    ...clearSeeds.map(([fx, fy]) => at(fx, fy, first)).flatMap(flood),
    '-trim', '+repage',
    s1,
  ]);
  fs.rmSync(work, { force: true });
  fs.renameSync(s1, work);

  // Pass 3 — pockets no seed list anticipated: scanned, flooded, and re-scanned, because clearing
  // one channel can merge two others into a block that is finally big enough to be worth opening.
  if (scanPockets) {
    for (let round = 0; round < 3; round += 1) {
      const seeds = measureWhiteSeeds(work, scanPockets);
      if (seeds.length === 0) break;
      const d = dims();
      const next = `${work}.${round}.png`;
      run([work, '-alpha', 'set', '-fuzz', '12%', ...seeds.map(([fx, fy]) => at(fx, fy, d)).flatMap(flood), next]);
      fs.rmSync(work, { force: true });
      fs.renameSync(next, work);
    }
  }

  // Final: an opt-in paper knock-out (safe only where the art has no white in it — foliage and
  // trellis frames, never a sticker with a white cloud or a badge with a cream centre), then a
  // hairline of padding so the ink is never flush with the canvas, and the shipped sizes.
  run([
    work,
    ...(knockout ? ['-alpha', 'set', '-fuzz', `${knockout}%`, '-transparent', 'white'] : []),
    '-trim', '+repage',
    '-bordercolor', 'none', '-border', '4',
    '-resize', '1024x1024>',
    '-strip',
    '-quality', '86',
    dstFile,
  ]);
  fs.rmSync(work, { force: true });
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

  // PACK_ONLY=frame-side-ivy,sticker-wooden-sign re-cuts just those pieces and rewrites the whole
  // manifest from whatever is already on disk — the full run is minutes once the scanners kick in.
  const only = (process.env.PACK_ONLY ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
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
    const rebuild = only.length === 0 || only.includes(asset.id);
    if (rebuild) {
      if (asset.cutout) cutout(srcFile, fullAbs, asset.clearSeeds, asset.scanPockets, asset.knockout);
      else paint(srcFile, fullAbs);
      thumb(fullAbs, thumbAbs);
    } else if (!fs.existsSync(fullAbs) || !fs.existsSync(thumbAbs)) {
      missing.push(asset.id);
      continue;
    }
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
