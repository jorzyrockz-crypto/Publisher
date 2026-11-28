/**
 * The six certificates, held to the rules the templates promise.
 *
 * A certificate is the one template a school prints and signs, so the failures that matter are the
 * quiet ones: a signature line typed as `'______\nPrincipal'`, a font that is not loaded (so the
 * browser silently substitutes), a logo frame that the design pass fills with stock art, or a WordArt
 * style whose own paint fails contrast against the band it sits on — `enhanceText` then repaints it
 * and the template no longer looks like the one that was designed.
 *
 * Every check below runs on the same object the app ships, and the pipeline checks run the real
 * `enhanceProject` → `polishProject` pair and compare the result to the authored geometry, because
 * "the layout agents must not move this" is a claim about code, not about coordinates.
 *
 *   npm run check:certs
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

const { CERTIFICATE_TEMPLATES } = await server.ssrLoadModule(
  '/src/constants/certificateTemplates.ts',
);
const { GOOGLE_FONTS_CATALOG, SYSTEM_FONTS } = await server.ssrLoadModule('/src/constants/fonts.ts');
const { enhanceProject } = await server.ssrLoadModule('/src/utils/templateEnhance.ts');
const { polishProject, polishPage, placeArtwork, TEMPLATE_POLISH_STATS } = await server.ssrLoadModule(
  '/src/utils/templatePolish.ts',
);
const { wordArtCarriesContrast, wordArtPaint } = await server.ssrLoadModule('/src/utils/wordArt.ts');
const { SAMPLE_GRAPHICS } = await server.ssrLoadModule('/src/constants/sampleGraphics.ts');
const { STICKER_CATALOG, getStickerById } = await server.ssrLoadModule(
  '/src/constants/stickerLibrary.ts',
);

let passed = 0;
const failures = [];
const check = (name, condition, detail = '') => {
  if (condition) {
    passed += 1;
    return;
  }
  failures.push(detail ? `${name} — ${detail}` : name);
};

/* ── colour ─────────────────────────────────────────────────────────────────────────────── */

const rgb = (hex) => {
  const clean = String(hex || '').replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  if (full.length !== 6) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

const luminance = (hex) => {
  const channels = rgb(hex);
  if (!channels) return null;
  const [r, g, b] = channels.map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100;
};

const mixRgb = (a, b, t) => {
  const ca = rgb(a);
  const cb = rgb(b);
  if (!ca || !cb) return a;
  const out = ca.map((v, i) => Math.round(v + (cb[i] - v) * Math.min(1, Math.max(0, t))));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

const centreOf = (el) => ({ x: el.x + el.width / 2, y: el.y + el.height / 2 });
const contains = (el, point) =>
  point.x >= el.x - 1 &&
  point.x <= el.x + el.width + 1 &&
  point.y >= el.y - 1 &&
  point.y <= el.y + el.height + 1;

/** What the letters actually sit on: the topmost shape under them, sampled where they sit. */
const backdropFor = (el, elements, page) => {
  const point = centreOf(el);
  const under = elements
    .filter((other) => other.id !== el.id && other.type === 'shape' && (other.zIndex ?? 0) < (el.zIndex ?? 0))
    .filter((other) => (other.width * other.height) < page.width * page.height * 0.85)
    .filter((other) => other.fillType === 'linear-gradient' || (other.fillColor && other.fillColor !== 'transparent'))
    .filter((other) => contains(other, point))
    .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));
  const top = under[0];
  if (!top) return page.backgroundColor || '#ffffff';
  if (top.fillType === 'linear-gradient') {
    const vertical = (top.gradientAngle ?? 90) % 180 === 90;
    const t = vertical
      ? (point.y - top.y) / Math.max(1, top.height)
      : (point.x - top.x) / Math.max(1, top.width);
    return mixRgb(top.fillColor || '#ffffff', top.gradientColor2 || '#ffffff', t);
  }
  if (top.fillType === 'pattern') return page.backgroundColor || '#ffffff';
  return top.fillColor || page.backgroundColor || '#ffffff';
};

const isBackground = (el, page) =>
  (el.type === 'shape' || el.type === 'image') &&
  el.width * el.height >= page.width * page.height * 0.85;

const signatureIds = (elements) =>
  [
    ...new Set(
      elements
        .filter((el) => el.type === 'text' && /-sig(?:-[lr])?-(name|role)$/.test(el.id))
        .map((el) => el.id.replace(/-(name|role)$/, '')),
    ),
  ];

/* ── what each certificate promises ─────────────────────────────────────────────────────── */

const SPECS = {
  'cert-school-honor-roll': {
    wordArt: { 'ch-title': ['trophy-gold', 'Playfair Display'] },
    gradients: [
      ['ch-banner', '#0f172a', '#1e3a8a'],
      ['ch-banner-rule', '#d97706', null],
    ],
    logoSlots: ['ch-logo-left', 'ch-logo-right'],
    script: { 'ch-student': ['Kaushan Script', 56] },
    qr: {},
    signatures: ['ch-sig-l', 'ch-sig-r'],
  },
  'cert-school-star-student': {
    wordArt: {
      'cs-title': ['champs-basa-blue', 'Fredoka'],
      'cs-ribbon': ['champs-gold-ribbon', 'Nunito'],
    },
    gradients: [['cs-card', '#ffffff', null]],
    logoSlots: [],
    script: {},
    qr: {},
    signatures: ['cs-sig-l', 'cs-sig-r'],
    confetti: ['cs-confetti-a', 'cs-confetti-b', 'cs-confetti-c', 'cs-confetti-d', 'cs-confetti-e', 'cs-confetti-f'],
  },
  'cert-school-stem': {
    wordArt: { 'st-title': ['portfolio-indigo', 'Montserrat'] },
    gradients: [
      ['st-sidebar', '#0f172a', '#0e7490'],
      ['st-side-rule', '#22d3ee', null],
    ],
    logoSlots: [],
    script: {},
    qr: { 'st-qr': 96 },
    signatures: ['st-sig'],
  },
  'cert-office-employee-month': {
    wordArt: { 'em-title': ['portfolio-editorial', 'Playfair Display'] },
    gradients: [
      ['em-gold-bar', '#f59e0b', '#fde047'],
      ['em-border', null, null],
    ],
    logoSlots: [],
    script: {},
    qr: {},
    signatures: ['em-sig-l', 'em-sig-r'],
  },
  'cert-office-training': {
    wordArt: { 'tr-title': ['portfolio-indigo', 'Plus Jakarta Sans'] },
    gradients: [['tr-header', '#0f766e', '#115e59']],
    logoSlots: [],
    script: {},
    qr: { 'tr-qr': 72 },
    signatures: ['tr-sig-l', 'tr-sig-r'],
  },
  'cert-service-appreciation': {
    wordArt: { 'ap-title': ['trophy-gold', 'Playfair Display'] },
    gradients: [
      ['ap-rule-a', null, null],
      ['ap-rule-b', null, null],
    ],
    logoSlots: [],
    script: { 'ap-name': ['Kaushan Script', 56] },
    qr: {},
    signatures: ['ap-sig-l', 'ap-sig-r'],
  },
};

const loadedFamilies = new Set(
  [...SYSTEM_FONTS, ...GOOGLE_FONTS_CATALOG].map((font) => font.family),
);

check(
  'six certificates are exported',
  CERTIFICATE_TEMPLATES.length === 6,
  `got ${CERTIFICATE_TEMPLATES.length}`,
);

for (const template of CERTIFICATE_TEMPLATES) {
  const spec = SPECS[template.id];
  const page = template.project.pages[0];
  const elements = page.elements;
  const byId = new Map(elements.map((el) => [el.id, el]));
  const label = template.id;

  check(`${label}: has a spec`, Boolean(spec));

  /* catalogue */
  check(`${label}: is a Certificate`, template.category === 'Certificate');
  check(`${label}: landscape 1056×816`, page.width === 1056 && page.height === 816 && page.orientation === 'landscape');
  check(`${label}: ids are unique`, byId.size === elements.length);
  check(`${label}: has elements`, elements.length >= 8, `${elements.length}`);

  /* no typed-in signature lines, anywhere */
  for (const el of elements) {
    if (el.type !== 'text') continue;
    check(`${label}:${el.id}: no typed signature`, !/_{3,}/.test(el.text), JSON.stringify(el.text));
  }

  /* fonts are loaded */
  for (const el of elements) {
    if (el.type !== 'text') continue;
    check(`${label}:${el.id}: font is loaded`, loadedFamilies.has(el.fontFamily), el.fontFamily);
  }

  /* paper tooth: the sheet's own pattern, at 5–7%, behind everything */
  const pattern = page.backgroundPattern;
  check(`${label}: paper has a pattern`, Boolean(pattern) && pattern.type !== 'none', String(pattern?.type));
  const patternOpacity = pattern?.opacity ?? 0;
  check(`${label}: paper pattern is 5–7%`, patternOpacity >= 0.05 && patternOpacity <= 0.07, `${patternOpacity}`);
  check(`${label}: paper pattern tiles`, (pattern?.scale ?? 0) >= 24, `${pattern?.scale}`);
  check(
    `${label}: no watermark shape spends an element`,
    elements.filter((el) => el.width === page.width && el.height === page.height).length === 0,
  );

  /* furniture is pinned: a border that the align pass can nudge is a border that drifts */
  for (const id of ['ch-outer', 'ch-inner', 'cs-card', 'st-sidebar', 'st-side-rule', 'em-border', 'tr-frame', 'tr-header', 'ap-card', 'ap-rule-a', 'ap-rule-b']) {
    const el = byId.get(id);
    if (!el) continue;
    check(`${label}:${id}: is pinned`, el.locked === true);
  }

  /* everything is on the page (a certificate has bleed, not overflow) */
  for (const el of elements) {
    check(
      `${label}:${el.id}: inside the sheet`,
      el.x >= 0 && el.y >= 0 && el.x + el.width <= page.width + 0.5 && el.y + el.height <= page.height + 0.5,
      `${el.x},${el.y} ${el.width}×${el.height}`,
    );
    check(`${label}:${el.id}: has area`, el.width > 0 && el.height > 0);
  }

  /* the six requested WordArt pieces: style, family, and paint that needs no rescue */
  for (const [id, [style, family]] of Object.entries(spec?.wordArt ?? {})) {
    const el = byId.get(id);
    check(`${label}:${id}: exists as WordArt`, Boolean(el) && el.isWordArt === true && el.wordArtStyle === style, el?.wordArtStyle);
    check(`${label}:${id}: keeps its face`, el?.fontFamily === family, el?.fontFamily);
    // A style survives `enhanceText` when it either supplies its own separation (rim, ground,
    // wide gradient) or its paint simply reads against what is behind it.
    const paint = wordArtPaint(style);
    const stops = paint?.gradient ? paint.gradient.stops.map((stop) => stop.color) : [paint?.fill].filter(Boolean);
    const ground = el ? backdropFor(el, elements, page) : '#ffffff';
    const worstStop = stops.length > 0 ? Math.min(...stops.map((stop) => ratio(stop, ground) ?? 1)) : 0;
    check(
      `${label}:${id}: reads on its ground`,
      wordArtCarriesContrast(style) || worstStop >= 3,
      `${style} on ${ground} = ${worstStop}:1`,
    );
  }

  /* gradients and accents */
  for (const [id, from, to] of spec?.gradients ?? []) {
    const el = byId.get(id);
    check(`${label}:${id}: exists`, Boolean(el));
    if (!el) continue;
    if (to) {
      check(
        `${label}:${id}: gradient ${from}→${to}`,
        el.fillType === 'linear-gradient' &&
          el.fillColor?.toLowerCase() === from &&
          el.gradientColor2?.toLowerCase() === to,
        `${el.fillType} ${el.fillColor}→${el.gradientColor2}`,
      );
    } else {
      check(`${label}:${id}: solid ${from ?? 'stroke'}`, el.fillColor?.toLowerCase() === from || Boolean(el.strokeColor), `${el.fillColor}`);
    }
  }

  /* logo slots: empty on purpose, and the design pass knows it */
  for (const id of spec?.logoSlots ?? []) {
    const el = byId.get(id);
    check(`${label}:${id}: is an image slot`, el?.type === 'image');
    check(`${label}:${id}: is empty`, el?.src === '', String(el?.src).slice(0, 24));
    check(`${label}:${id}: is 64px round`, el?.width === 64 && el?.height === 64 && el?.maskShape === 'circle');
    check(`${label}:${id}: is marked as a logo slot`, el?.slotKind === 'logo' && el?.isPlaceholder === true);
  }

  /* signatures: a real rule, a bold name, a muted small-caps role */
  const sigs = signatureIds(elements);
  for (const id of spec?.signatures ?? []) {
    check(`${label}:${id}: is a signature block`, sigs.includes(id), sigs.join(','));
    const rule = byId.get(`${id}-line`);
    const name = byId.get(`${id}-name`);
    const role = byId.get(`${id}-role`);
    check(`${label}:${id}: has a rule`, rule?.type === 'line' && rule?.strokeWidth === 1.5, `${rule?.type} ${rule?.strokeWidth}`);
    check(`${label}:${id}: name is bold`, name?.type === 'text' && name?.fontWeight === 'bold');
    check(
      `${label}:${id}: role is muted small caps`,
      role?.type === 'text' && role?.fontWeight === '600' && (role?.letterSpacing ?? 0) >= 1,
      `${role?.fontWeight} / ${role?.letterSpacing}`,
    );
    check(`${label}:${id}: rule sits above the name`, Boolean(rule && name) && rule.y < name.y);
  }

  /* script names stay script and stay big */
  for (const [id, [family, size]] of Object.entries(spec?.script ?? {})) {
    const el = byId.get(id);
    check(`${label}:${id}: ${family} ${size}`, el?.fontFamily === family && el?.fontSize === size, `${el?.fontFamily} ${el?.fontSize}`);
  }

  /* QR blocks are scannable, not decorative */
  for (const [id, size] of Object.entries(spec?.qr ?? {})) {
    const el = byId.get(id);
    check(`${label}:${id}: is a QR`, el?.type === 'qr' && el?.width === size && el?.height === size);
    check(`${label}:${id}: holds a URL`, /^https:\/\//.test(el?.value ?? ''), String(el?.value).slice(0, 32));
  }

  /* a band edge exists where the design claims one */
  if (template.id === 'cert-office-training') {
    const header = byId.get('tr-header');
    check(`${label}: header has a wave edge`, header?.waveEdge === 'bottom');
  }
  if (template.id === 'cert-service-appreciation') {
    const a = byId.get('ap-rule-a');
    const b = byId.get('ap-rule-b');
    check(
      `${label}: double gold rule`,
      a?.strokeColor === '#d97706' && a?.strokeWidth === 1 && b?.strokeColor === '#d97706' && b?.strokeWidth === 3,
    );
    check(
      `${label}: rule sits inside the frame`,
      Boolean(a && b) && a.x > 32 && b.x > a.x && b.width < a.width,
    );
  }
  if (template.id === 'cert-school-star-student') {
    const confetti = (spec?.confetti ?? []).filter((id) => byId.has(id));
    check(`${label}: confetti`, confetti.length === 6, `${confetti.length}`);
  }

  /* contrast of everything that is not carrying its own paint */
  for (const el of elements) {
    if (el.type !== 'text' || el.isWordArt) continue;
    if (!el.color || el.color === 'transparent') continue;
    const backdrop = backdropFor(el, elements, page);
    const value = ratio(el.color, backdrop);
    const large = el.fontSize >= 24 || Number(el.fontWeight) >= 700 || el.fontWeight === 'bold';
    const floor = large ? 3 : 4.5;
    check(
      `${label}:${el.id}: ${value}:1 on ${backdrop} (needs ${floor})`,
      value !== null && value >= floor,
      `${value} vs ${floor}`,
    );
  }

  /* the signature band belongs to the signatures */
  const band = (spec?.signatures ?? [])
    .map((id) => byId.get(`${id}-line`))
    .filter(Boolean);
  if (band.length === 2) {
    const [left, right] = band.sort((a, b) => a.x - b.x);
    check(`${label}: signature rules do not overlap`, left.x + left.width <= right.x);
    const box = {
      x: left.x,
      y: Math.min(left.y, right.y) - 2,
      width: right.x + right.width - left.x,
      height: 58,
    };
    const intruders = elements.filter(
      (el) =>
        el.type !== 'text' &&
        el.type !== 'line' &&
        !isBackground(el, page) &&
        (el.zIndex ?? 0) > 2 &&
        !el.id.startsWith('ch-sig') &&
        !el.id.startsWith('cs-sig') &&
        !el.id.startsWith('st-sig') &&
        !el.id.startsWith('em-sig') &&
        !el.id.startsWith('tr-sig') &&
        !el.id.startsWith('ap-sig') &&
        el.x < box.x + box.width &&
        el.x + el.width > box.x &&
        el.y < box.y + box.height &&
        el.y + el.height > box.y,
    );
    check(`${label}: signature band is clear`, intruders.length === 0, intruders.map((el) => el.id).join(','));
  }

  /* ── the pipeline ─────────────────────────────────────────────────────────────────────── */

  const before = JSON.parse(JSON.stringify(elements));
  const beforeIds = before.map((el) => el.id).join('|');

  const enhanced = enhanceProject(template.project, 'Certificate', '#6e56cf').project;

  // Ask the artwork pass directly: a page that keeps the authored candidate never shows what the
  // slot filler would have done, so "the slot was left alone" has to be measured on its own.
  const slotted = placeArtwork(
    { ...enhanced.pages[0], elements: enhanced.pages[0].elements },
    'Certificate',
    { artwork: 0, heroes: 0, masks: 0, rounded: 0, contrast: 0, lightened: 0, balanced: 0, snappedToMargins: 0, snappedToGrid: 0, rhythm: 0, tidied: 0, composed: 0, keptOriginal: 0 },
    '',
  );
  for (const id of spec?.logoSlots ?? []) {
    const el = slotted.find((other) => other.id === id);
    check(`${label}:${id}: artwork pass leaves it empty`, el?.src === '', String(el?.src).slice(0, 32));
  }
  const keptBefore = TEMPLATE_POLISH_STATS.keptOriginal;
  const tidiedBefore = TEMPLATE_POLISH_STATS.tidied;
  const composedBefore = TEMPLATE_POLISH_STATS.composed;
  const polished = polishProject(enhanced, 'Certificate');
  const winner =
    TEMPLATE_POLISH_STATS.tidied > tidiedBefore
      ? 'tidied'
      : TEMPLATE_POLISH_STATS.composed > composedBefore
        ? 'composed'
        : TEMPLATE_POLISH_STATS.keptOriginal > keptBefore
          ? 'original'
          : 'unchanged';

  /* The shipped page, and — separately — what the tidy pass alone would have made of it. The
     templates should rank as "original", but a page that only survives by winning the ranking is a
     page the next scoring tweak can ruin, so both are held to the same rules. */
  const stages = [
    ['shipped', polished.pages[0].elements],
    ['tidied', polishPage(enhanced.pages[0], 'Certificate').elements],
  ];

  for (const [stage, after] of stages) {
    const afterById = new Map(after.map((el) => [el.id, el]));

    check(`${label}:${stage}: keeps every element`, after.map((el) => el.id).join('|') === beforeIds);
    check(`${label}:${stage}: adds nothing`, after.length === before.length, `${before.length} → ${after.length}`);

    let worstMove = 0;
    let worstId = '';
    for (const el of before) {
      const next = afterById.get(el.id);
      if (!next) continue;
      const moved = Math.max(
        Math.abs(next.x - el.x),
        Math.abs(next.y - el.y),
        Math.abs(next.width - el.width),
        Math.abs(next.height - el.height),
      );
      if (moved > worstMove) {
        worstMove = moved;
        worstId = el.id;
      }
    }
    check(
      `${label}:${stage}: nothing moves more than the grid step`,
      worstMove <= 8,
      `${worstId} moved ${worstMove}px`,
    );
    console.log(
      `  · ${label}: ${stage === 'shipped' ? `shipped ${winner}` : 'tidied candidate'}${
        worstMove > 0 ? `, largest move ${worstMove}px on ${worstId}` : ', geometry untouched'
      }`,
    );

    for (const el of before) {
      if (el.type !== 'text') continue;
      const next = afterById.get(el.id);
      if (!next) continue;
      check(
        `${label}:${stage}:${el.id}: colour survives the contrast pass`,
        next.color === el.color,
        `${el.color} → ${next.color}`,
      );
      check(
        `${label}:${stage}:${el.id}: font survives`,
        next.fontFamily === el.fontFamily,
        `${el.fontFamily} → ${next.fontFamily}`,
      );
      if (el.isWordArt) {
        check(
          `${label}:${stage}:${el.id}: WordArt style survives`,
          next.wordArtStyle === el.wordArtStyle && next.isWordArt === true,
          `${el.wordArtStyle} → ${next.wordArtStyle}`,
        );
      }
    }
    for (const id of spec?.logoSlots ?? []) {
      const next = afterById.get(id);
      check(
        `${label}:${stage}:${id}: still empty after artwork placement`,
        next?.src === '',
        String(next?.src).slice(0, 24),
      );
    }
    for (const el of after) {
      check(
        `${label}:${stage}:${el.id}: still on the sheet`,
        el.x >= 0 && el.y >= 0 && el.x + el.width <= page.width + 0.5 && el.y + el.height <= page.height + 0.5,
        `${el.x},${el.y} ${el.width}×${el.height}`,
      );
    }
  }
}


/* ── the drawn assets ──────────────────────────────────────────────────────────────────── */

/** PNG header: width, height, and whether the file carries an alpha channel. */
const pngInfo = (buffer) => {
  const signature = buffer.toString('latin1', 1, 4);
  if (signature !== 'PNG') return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    hasAlpha: buffer[25] === 6,
  };
};

/** WebP header: RIFF/VP8X, VP8L or VP8. Enough to know the file's real size. */
const webpInfo = (buffer) => {
  if (buffer.toString('latin1', 0, 4) !== 'RIFF' || buffer.toString('latin1', 8, 12) !== 'WEBP') {
    return null;
  }
  const fourcc = buffer.toString('latin1', 12, 16);
  if (fourcc === 'VP8X') {
    return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 };
  }
  if (fourcc === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (fourcc === 'VP8 ') {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  return null;
};

/**
 * A real read of the pixels. A header tells you a file is 1600×1200 RGBA; it cannot tell you whether
 * the middle is actually transparent or whether the silhouette steps from opaque to clear in one
 * pixel (which is what makes a cut-out look saw-toothed on a dark page). Only 8-bit RGBA without
 * interlacing is supported, which is every file this folder ships.
 */
const readRgba8 = (file) => {
  const buffer = readFileSync(file);
  if (pngInfo(buffer) === null) return null;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const depth = buffer[24];
  const colorType = buffer[25];
  const interlace = buffer[28];
  if (depth !== 8 || colorType !== 6 || interlace !== 0) return null;

  const idat = [];
  let offset = 8;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('latin1', offset + 4, offset + 8);
    if (type === 'IDAT') idat.push(buffer.subarray(offset + 8, offset + 8 + length));
    if (type === 'IEND') break;
    offset += length + 12;
  }

  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = width * bpp;
  const data = Buffer.alloc(stride * height);
  let previous = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const row = data.subarray(y * stride, (y + 1) * stride);
    line.copy(row);
    for (let x = 0; x < stride; x += 1) {
      const left = x >= bpp ? row[x - bpp] : 0;
      const up = previous[x];
      const upLeft = x >= bpp ? previous[x - bpp] : 0;
      if (filter === 0) continue;
      if (filter === 1) row[x] = (row[x] + left) & 0xff;
      else if (filter === 2) row[x] = (row[x] + up) & 0xff;
      else if (filter === 3) row[x] = (row[x] + ((left + up) >> 1)) & 0xff;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        row[x] = (row[x] + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft)) & 0xff;
      } else return null;
    }
    previous = row;
  }
  return { width, height, data };
};

/**
 * The three things a transparent asset has to get right, whichever kind it is.
 * `kind` decides the extra promise: a frame owes you a hollow middle, a sticker owes you a clean
 * canvas edge (`kind: 'sticker'`), a rule is allowed to run off the sides.
 */
const checkCutout = (label, file, kind) => {
  const image = readRgba8(file);
  check(`${label}: pixels decode`, Boolean(image), file);
  if (!image) return;

  const { width, height, data } = image;
  let partial = 0;
  let hard = 0;
  let paper = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];
      if (alpha > 0 && alpha < 255) partial += 1;
      if (kind === 'frame' && alpha > 200) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (Math.min(r, g, b) > 230 && Math.max(r, g, b) - Math.min(r, g, b) < 26) paper += 1;
      }
      // a silhouette that goes 255 → 0 with nothing between is a jagged edge
      if (alpha === 255) {
        if (x + 1 < width && data[i + 7] === 0) hard += 1;
        if (y + 1 < height && data[i + width * 4 + 3] === 0) hard += 1;
      } else if (alpha === 0) {
        if (x + 1 < width && data[i + 7] === 255) hard += 1;
        if (y + 1 < height && data[i + width * 4 + 3] === 255) hard += 1;
      }
    }
  }

  const area = width * height;
  check(`${label}: the cut-out has soft pixels`, partial > area * 0.001, `${partial}`);
  check(`${label}: the silhouette is anti-aliased`, hard === 0, `${hard} hard 255↔0 steps`);

  if (kind === 'frame') {
    let interiorMax = 0;
    for (let y = Math.round(height * 0.3); y < Math.round(height * 0.7); y += 1) {
      for (let x = Math.round(width * 0.3); x < Math.round(width * 0.7); x += 1) {
        interiorMax = Math.max(interiorMax, data[(y * width + x) * 4 + 3]);
      }
    }
    check(`${label}: the middle is hollow so the paper shows through`, interiorMax === 0, `max alpha ${interiorMax}`);
    check(`${label}: no sheet of white paper is left behind`, paper <= area * 0.001, `${paper} px`);
  }

  if (kind === 'sticker') {
    let edgeMax = 0;
    for (let x = 0; x < width; x += 1) {
      for (const y of [0, 1, height - 2, height - 1]) {
        edgeMax = Math.max(edgeMax, data[(y * width + x) * 4 + 3]);
      }
    }
    for (let y = 0; y < height; y += 1) {
      for (const x of [0, 1, width - 2, width - 1]) {
        edgeMax = Math.max(edgeMax, data[(y * width + x) * 4 + 3]);
      }
    }
    check(`${label}: the canvas edge is clean, not a white frame`, edgeMax === 0, `max alpha ${edgeMax}`);
  }
};

const certificateAssets = SAMPLE_GRAPHICS.filter((g) => g.category === 'Certificates');
check('certificate assets are registered', certificateAssets.length >= 10, `${certificateAssets.length}`);
check(
  'certificate asset ids are unique',
  new Set(certificateAssets.map((g) => g.id)).size === certificateAssets.length,
);

for (const asset of certificateAssets) {
  const label = asset.id;
  const relative = String(asset.src).replace(/^\.\//, '');
  const file = `public/${relative}`;
  check(`${label}: ships in public/assets/certificates`, relative.startsWith('assets/certificates/'), relative);
  check(`${label}: file exists`, existsSync(file), file);
  if (!existsSync(file)) continue;
  const bytes = readFileSync(file);
  const info = relative.endsWith('.png') ? pngInfo(bytes) : webpInfo(bytes);
  check(`${label}: header parses`, Boolean(info), relative);
  if (!info) continue;
  check(
    `${label}: declared size matches the file`,
    info.width === asset.width && info.height === asset.height,
    `file ${info.width}×${info.height} vs declared ${asset.width}×${asset.height}`,
  );
  check(`${label}: is at least 1200px wide`, info.width >= 1200, `${info.width}`);
  check(
    `${label}: under the weight budget`,
    statSync(file).size <= 2_500_000,
    `${Math.round(statSync(file).size / 1024)} kB`,
  );
  if (relative.endsWith('.png')) {
    check(`${label}: PNG carries an alpha channel`, info.hasAlpha === true);
    check(`${label}: transparent art is page-sized`, asset.insertAs !== 'page' || info.width === 1600);
    checkCutout(label, file, label.startsWith('cert-border-') ? 'frame' : 'rule');
  } else {
    check(`${label}: WebP ground is page-sized`, info.width === 1600 && info.height === 1200);
    check(`${label}: ground inserts as the page`, asset.insertAs === 'page');
  }
}

// The seals and award stickers are drawn PNGs, registered in the sticker catalog so a template can
// reach them through `stickerUri()` exactly like a vector sticker.
const certificateStickers = STICKER_CATALOG.filter((s) => s.category === 'certificates');
check(
  'certificate seals and stickers are registered',
  certificateStickers.length === 5,
  `${certificateStickers.length}`,
);
check(
  'certificate sticker ids are unique',
  new Set(certificateStickers.map((s) => s.id)).size === certificateStickers.length,
);
check(
  'certificate stickers do not collide with vector stickers',
  new Set(STICKER_CATALOG.map((s) => s.id)).size === STICKER_CATALOG.length,
);

for (const sticker of certificateStickers) {
  const label = sticker.id;
  const relative = String(sticker.dataUri).replace(/^\.\//, '');
  const file = `public/${relative}`;
  check(`${label}: dataUri points at the drawn file`, relative.startsWith('assets/certificates/'), relative);
  check(`${label}: file exists`, existsSync(file), file);
  if (!existsSync(file)) continue;
  const bytes = readFileSync(file);
  const info = pngInfo(bytes);
  check(`${label}: PNG header parses`, Boolean(info), relative);
  if (!info) continue;
  check(`${label}: is a 512×512 seal`, info.width === 512 && info.height === 512, `${info.width}×${info.height}`);
  check(`${label}: PNG carries an alpha channel`, info.hasAlpha === true);
  check(
    `${label}: under the weight budget`,
    statSync(file).size <= 400_000,
    `${Math.round(statSync(file).size / 1024)} kB`,
  );
  checkCutout(label, file, 'sticker');
  check(`${label}: svg wrapper embeds the drawn file`, sticker.svg.includes(relative));
  check(`${label}: svg wrapper is a self-contained document`, sticker.svg.startsWith('<svg xmlns='));
  // `stickerUri()` in certificateTemplates.ts reaches a seal by id alone; this is that lookup.
  check(
    `${label}: resolves by id the way a template asks for it`,
    getStickerById(sticker.id)?.dataUri === sticker.dataUri,
  );
}

await server.close();

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed:\n`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error(`\n${passed} passed, ${failures.length} failed\n`);
  process.exit(1);
}
console.log(`\nAll ${passed} certificate checks passed.\n`);
