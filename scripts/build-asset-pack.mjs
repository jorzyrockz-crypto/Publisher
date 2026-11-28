#!/usr/bin/env node
/**
 * Builds the asset packs this repo authors: the Storybook & Reading Corner kit (shipped unpacked as
 * the built-in pack) and the Eco-Campaign & Fiesta Awards kit (shipped as a `.zip` you import).
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
 * Requires ImageMagick (`convert`) on PATH.
 *
 *   npm run pack:storybook      # built-in kit → public/asset-packs/storybook-reading-v1/
 *   npm run pack:eco            # eco kit → .pack-dist/ + public/asset-packs/eco-fiesta-v1.zip
 *   npm run pack:all            # both
 */
import { execFileSync } from 'node:child_process';
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

/** `slot` is an addition to the published schema: a hint for where a frame wants to land. */
const STORYBOOK_ASSETS = [
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

/** The eco kit: campaign backdrops on the one hand, fiesta and award pieces on the other. */
const ECO_ASSETS = [
  {
    id: 'bg-eco-hills',
    label: 'Tropical Hills & Valley',
    layer: 'backdrop',
    tags: ['eco', 'hills', 'valley', 'nature', 'campaign'],
    cutout: false,
  },
  {
    id: 'bg-fiesta-stage',
    label: 'Fiesta Night Lights',
    layer: 'backdrop',
    tags: ['fiesta', 'night', 'bokeh', 'award', 'celebration'],
    cutout: false,
  },
  {
    id: 'bg-mangrove-river',
    label: 'Mangrove River',
    layer: 'backdrop',
    tags: ['mangrove', 'river', 'water', 'eco', 'nature'],
    cutout: false,
    // The art came back with a paper margin; on a page it reads as a white frame.
    trimBorder: true,
  },
  {
    id: 'frame-tropical-leaves',
    label: 'Tropical Leaf Corners',
    layer: 'frame',
    tags: ['tropical', 'leaves', 'corner', 'frame', 'blossom'],
    cutout: true,
    slot: 'corner',
    // The leaves cover the corners themselves, so there is no corner to flood from.
    scanPockets: { cell: 16, min: 80 },
  },
  {
    id: 'frame-fiesta-bunting',
    label: 'Fiesta Banderitas',
    layer: 'frame',
    tags: ['bunting', 'banderitas', 'fiesta', 'garland', 'top'],
    cutout: true,
    slot: 'top',
  },
  {
    id: 'frame-soil-sprouts',
    label: 'Soil & Seedlings Strip',
    layer: 'frame',
    tags: ['soil', 'sprouts', 'seedling', 'bottom', 'eco'],
    cutout: true,
    slot: 'bottom',
    scanPockets: { cell: 16, min: 60 },
  },
  {
    id: 'sticker-planting-kids',
    label: 'Planting Together',
    layer: 'sticker',
    tags: ['kids', 'students', 'planting', 'eco', 'tree'],
    cutout: true,
    // Paper trapped between the two children, behind the seedling. Their white uniform shirts are
    // separate blobs, so seeding the middle clears the background and leaves the polo shirts alone.
    clearSeeds: [
      [0.426, 0.669],
      [0.42, 0.5],
      [0.44, 0.8],
      [0.45, 0.3],
      [0.5, 0.38],
      [0.48, 0.4],
      [0.52, 0.36],
    ],
  },
  {
    id: 'sticker-nipa-hut',
    label: 'Bahay Kubo',
    layer: 'sticker',
    tags: ['hut', 'bahay kubo', 'bamboo', 'fiesta', 'village'],
    cutout: true,
    scanPockets: { cell: 16, min: 70 },
  },
  {
    id: 'sticker-wood-plank',
    label: 'Wooden Signboard',
    layer: 'sticker',
    tags: ['plank', 'wood', 'sign', 'blank', 'label'],
    cutout: true,
  },
  {
    id: 'sticker-gold-laurel',
    label: 'Gold Laurel Frame',
    layer: 'badge',
    tags: ['laurel', 'gold', 'award', 'wreath', 'badge'],
    cutout: true,
    // The wreath is a ring: the circle inside it is background, and it is enclosed.
    clearSeeds: [
      [0.5, 0.5],
      [0.5, 0.42],
      [0.5, 0.58],
    ],
  },
];

/**
 * Two packs, one builder.
 *
 * The storybook kit ships unpacked under `public/asset-packs/` because it is the built-in pack the
 * app fetches piece by piece. The eco kit ships as a `.zip` under `public/asset-packs/`, is built
 * into `.pack-dist/` on the way, and reaches the app the same way any user's pack does — through
 * the import button. Two delivery routes, one set of rules, so a pack we author cannot be a
 * different kind of thing from a pack a teacher authors.
 */
const PACKS = [
  {
    packId: 'storybook-reading-v1',
    name: 'Storybook & Reading Corner',
    version: '1.1.0',
    src: '.pack-src',
    out: 'public/asset-packs/storybook-reading-v1',
    zip: null,
    assets: STORYBOOK_ASSETS,
  },
  {
    packId: 'eco-fiesta-v1',
    name: 'Eco-Campaign & Fiesta Awards',
    version: '1.0.0',
    src: '.pack-src-eco',
    out: '.pack-dist/eco-fiesta-v1',
    zip: 'public/asset-packs/eco-fiesta-v1.zip',
    assets: ECO_ASSETS,
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
  const work = path.join(path.dirname(dstFile), `.cutout-${path.basename(dstFile, '.webp')}.png`);

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

/**
 * A backdrop keeps its paint edge to edge. `trimBorder` is for the one case where the generator put a
 * flat paper margin around the picture: left alone it becomes a white frame on the poster.
 */
function paint(srcFile, dstFile, trimBorder = false) {
  run([
    srcFile,
    ...(trimBorder ? ['-fuzz', '8%', '-trim', '+repage'] : []),
    '-resize', '1400x1400>',
    '-strip',
    '-quality', '86',
    dstFile,
  ]);
}

function thumb(srcFile, dstFile) {
  run([srcFile, '-resize', '160x160', '-strip', '-quality', '72', dstFile]);
}

/**
 * Writes a DEFLATE zip with no dependency — the mirror image of the reader in
 * `src/utils/assetStore.ts`, which walks exactly this structure back out.
 */
function writeZip(zipFile, packDir, entries) {
  const crcTable = (() => {
    const table = new Int32Array(256);
    for (let i = 0; i < 256; i += 1) {
      let c = i;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c;
    }
    return table;
  })();
  const crc32 = (buf) => {
    let c = -1;
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };

  const locals = [];
  const central = [];
  let offset = 0;
  for (const name of entries) {
    const raw = fs.readFileSync(path.join(packDir, name));
    const deflated = zlib.deflateRawSync(raw, { level: 9 });
    const useDeflate = deflated.length < raw.length;
    const body = useDeflate ? deflated : raw;
    const nameBytes = Buffer.from(name, 'utf8');
    const crc = crc32(raw);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(useDeflate ? 8 : 0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBytes, body);

    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(0x0800, 8);
    entry.writeUInt16LE(useDeflate ? 8 : 0, 10);
    entry.writeUInt16LE(0, 12);
    entry.writeUInt16LE(0x21, 14);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(body.length, 20);
    entry.writeUInt32LE(raw.length, 24);
    entry.writeUInt16LE(nameBytes.length, 28);
    entry.writeUInt16LE(0, 30);
    entry.writeUInt16LE(0, 32);
    entry.writeUInt16LE(0, 34);
    entry.writeUInt16LE(0, 36);
    entry.writeUInt32LE(0, 38);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, nameBytes);

    offset += local.length + nameBytes.length + body.length;
  }

  const centralBytes = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBytes.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  fs.mkdirSync(path.dirname(zipFile), { recursive: true });
  fs.writeFileSync(zipFile, Buffer.concat([...locals, centralBytes, end]));
  return fs.statSync(zipFile).size;
}

function buildPack(pack, only) {
  const src = path.join(ROOT, pack.src);
  const out = path.join(ROOT, pack.out);
  if (!fs.existsSync(src)) {
    console.log(`${pack.packId}: no source art in ${pack.src}/ — skipped`);
    return;
  }
  fs.mkdirSync(path.join(out, 'thumbs'), { recursive: true });
  fs.mkdirSync(path.join(out, 'full'), { recursive: true });

  const assets = [];
  const missing = [];

  for (const asset of pack.assets) {
    const srcFile = path.join(src, `${asset.id}.png`);
    if (!fs.existsSync(srcFile)) {
      missing.push(asset.id);
      continue;
    }
    const fullAbs = path.join(out, 'full', `${asset.id}.webp`);
    const thumbAbs = path.join(out, 'thumbs', `${asset.id}.webp`);
    const rebuild = only.length === 0 || only.includes(asset.id);
    if (rebuild) {
      if (asset.cutout) cutout(srcFile, fullAbs, asset.clearSeeds, asset.scanPockets, asset.knockout);
      else paint(srcFile, fullAbs, asset.trimBorder);
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
      `${asset.id.padEnd(26)} ${asset.layer.padEnd(8)} ${String(width).padStart(4)}x${String(height).padEnd(4)}`,
      `${(fs.statSync(fullAbs).size / 1024).toFixed(0)} kB`
    );
  }

  const manifest = { packId: pack.packId, name: pack.name, version: pack.version, assets };
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  fs.writeFileSync(path.join(out, 'manifest.json'), manifestText);

  const bytes = assets.reduce(
    (sum, a) => sum + fs.statSync(path.join(out, a.full)).size + fs.statSync(path.join(out, a.thumb)).size,
    0
  );
  console.log(`\n${pack.packId} ${pack.version}: ${assets.length} assets, ${(bytes / 1024 / 1024).toFixed(2)} MB`);

  if (pack.zip) {
    const entries = ['manifest.json'];
    for (const asset of assets) entries.push(asset.thumb, asset.full);
    const zipBytes = writeZip(path.join(ROOT, pack.zip), out, entries);
    console.log(`packed ${pack.zip} — ${(zipBytes / 1024 / 1024).toFixed(2)} MB`);
  }
  if (missing.length) console.log(`still to generate: ${missing.join(', ')}`);
}

function main() {
  // PACK_ONLY=frame-side-ivy,sticker-wooden-sign re-cuts just those pieces and rewrites the whole
  // manifest from whatever is already on disk — the full run is minutes once the scanners kick in.
  const only = (process.env.PACK_ONLY ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  const wanted = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
  const packs = wanted.length ? PACKS.filter((pack) => wanted.includes(pack.packId)) : PACKS;
  if (!packs.length) {
    console.error(`Unknown pack. Try: ${PACKS.map((p) => p.packId).join(', ')}`);
    process.exit(1);
  }
  for (const pack of packs) {
    buildPack(pack, only);
  }
}

main();
