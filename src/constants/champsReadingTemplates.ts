/**
 * Champs Reading Corner — the three print forms a reading corner actually runs on.
 *
 * These are *forms*, not posters: every measurement comes from the school's own millimetre spec
 * (A4 at 96 dpi, 12 mm margins, folded spreads, 92 × 64 mm bin cards) so a photocopier reproduces
 * them at 100% with no scaling. That is why the geometry below is written in millimetres and
 * converted once, and why the tables are drawn as rules rather than as table elements — a printed
 * log needs column widths the table element cannot hold, and ruled lines survive a printer's
 * rounding better than a bordered cell.
 *
 * All three share one palette (school blue, coral, teal, gold) and the built-in storybook kit from
 * `public/asset-packs/storybook-reading-v1/`, so the passport cover and the bin cards look like
 * they came from the same shelf.
 */

import type {
  DocumentProject,
  ImageElement,
  Page,
  PublisherElement,
  ShapeElement,
  TextElement,
  WordArtStyle,
} from '../types/publisher';
import type { TemplateDefinition } from './templates';

/* ------------------------------------------------------------------ *
 * Paper
 * ------------------------------------------------------------------ */

const MM = 3.7795275591; // 96 dpi
const mm = (v: number) => Math.round(v * MM);

const A4_LAND_W = mm(297); // 1123
const A4_LAND_H = mm(210); // 794
const A4_PORT_W = mm(210); // 794
const A4_PORT_H = mm(297); // 1123

/** 12 mm print margin on the landscape forms, 10 mm on the cut sheet. */
const M_LAND = mm(12); // 45
const M_PORT = mm(10); // 38

const PAPER = '#fffdf7';
const WHITE = '#ffffff';
const INK = '#0f172a';
const SOFT = '#475569';
const MUTED = '#94a3b8';
const RULE = '#cbd5e1';
const FAINT = '#e6ebf1';

const GREEN = '#16a34a';
const BLUE = '#2563eb';
const AMBER = '#d97706';
const TEAL = '#0d9488';
const CORAL = '#e11d48';

const FONT_BODY = 'Inter';
const FONT_DISPLAY = 'Fredoka';

/* ------------------------------------------------------------------ *
 * Factories — every element states its own box, so the layers panel
 * reads like a form's contents page.
 * ------------------------------------------------------------------ */

let zCounter = 0;
let idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${(idCounter += 1)}`;

/** Each page builder resets the stack, so z-order always follows creation order. */
const startPage = () => {
  zCounter = 0;
};

interface TextSpec {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  size?: number;
  weight?: TextElement['fontWeight'];
  color?: string;
  align?: TextElement['textAlign'];
  valign?: TextElement['verticalAlign'];
  font?: string;
  lh?: number;
  ls?: number;
  name?: string;
  wordArt?: WordArtStyle;
  pad?: number;
}

const text = (s: TextSpec): TextElement => ({
  id: nextId('cr-t'),
  type: 'text',
  name: s.name,
  x: s.x,
  y: s.y,
  width: s.w,
  height: s.h,
  rotation: 0,
  zIndex: (zCounter += 1),
  text: s.text,
  fontFamily: s.font ?? FONT_BODY,
  fontSize: s.size ?? 12,
  fontWeight: s.weight ?? 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  letterSpacing: s.ls,
  color: s.color ?? INK,
  textAlign: s.align ?? 'left',
  verticalAlign: s.valign ?? 'top',
  columns: 1,
  columnGap: 12,
  lineHeight: s.lh ?? 1.3,
  padding: s.pad ?? 0,
  isWordArt: s.wordArt ? true : undefined,
  wordArtStyle: s.wordArt,
  autoFit: 'none',
  autoSizeText: true,
});

interface ShapeSpec {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  stroke?: string;
  width?: number;
  dash?: ShapeElement['strokeDash'];
  radius?: number;
  kind?: ShapeElement['shapeType'];
  name?: string;
}

const shape = (s: ShapeSpec): ShapeElement => ({
  id: nextId('cr-s'),
  type: 'shape',
  name: s.name,
  shapeType: s.kind ?? (s.radius ? 'rounded-rect' : 'rectangle'),
  x: s.x,
  y: s.y,
  width: s.w,
  height: s.h,
  rotation: 0,
  zIndex: (zCounter += 1),
  fillColor: s.fill ?? 'transparent',
  strokeColor: s.stroke ?? 'transparent',
  strokeWidth: s.width ?? 0,
  strokeDash: s.dash ?? 'solid',
  cornerRadius: s.radius,
});

/** A hairline. Rules are filled boxes, never one-pixel lines: they print identically everywhere. */
const rule = (x: number, y: number, w: number, color = RULE, thickness = 1): ShapeElement =>
  shape({ x, y, w, h: thickness, fill: color });

const vRule = (x: number, y: number, h: number, color = RULE, thickness = 1): ShapeElement =>
  shape({ x, y, w: thickness, h, fill: color });

const circle = (x: number, y: number, d: number, stroke = MUTED): ShapeElement =>
  shape({ x, y, w: d, h: d, kind: 'circle', stroke, width: 1.1 });

interface ImgSpec {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fit?: ImageElement['objectFit'];
  name?: string;
  opacity?: number;
}

const packUri = (id: string) => `./asset-packs/storybook-reading-v1/full/${id}.webp`;

const piece = (s: ImgSpec): ImageElement => ({
  id: nextId('cr-i'),
  type: 'image',
  name: s.name,
  src: packUri(s.id),
  alt: s.name ?? s.id,
  x: s.x,
  y: s.y,
  width: s.w,
  height: s.h,
  rotation: 0,
  zIndex: (zCounter += 1),
  objectFit: s.fit ?? 'contain',
  opacity: s.opacity,
  imageScale: 1,
  aspectRatioLocked: false,
});

const page = (p: {
  id: string;
  name: string;
  width: number;
  height: number;
  orientation: Page['orientation'];
  margin: number;
  elements: PublisherElement[];
}): Page => ({
  id: p.id,
  name: p.name,
  width: p.width,
  height: p.height,
  orientation: p.orientation,
  backgroundColor: PAPER,
  margins: { top: p.margin, right: p.margin, bottom: p.margin, left: p.margin },
  guides: [],
  elements: p.elements,
});

/* ------------------------------------------------------------------ *
 * Shared furniture
 * ------------------------------------------------------------------ */

/** Two symmetric hairline frames either side of the fold — the storybook edge, without a PNG. */
const halfFrames = (): PublisherElement[] => [
  shape({
    x: 28,
    y: 22,
    w: 515,
    h: A4_LAND_H - 44,
    stroke: FAINT,
    width: 1,
    name: 'Trim — left half',
  }),
  shape({
    x: A4_LAND_W - 543,
    y: 22,
    w: 515,
    h: A4_LAND_H - 44,
    stroke: FAINT,
    width: 1,
    name: 'Trim — right half',
  }),
  vRule(561, 30, A4_LAND_H - 60, '#eaeff5', 1),
];

/* ------------------------------------------------------------------ *
 * (a) Learner Reading Passport — two A4 landscape sheets, folded
 * ------------------------------------------------------------------ */

const FOLD = 561;
/** Usable box either side of the 20 mm centre gutter (10 mm each side of the fold). */
const L = { x: M_LAND, w: FOLD - mm(10) - M_LAND }; // 45 / 478
const R = { x: FOLD + mm(10), w: A4_LAND_W - M_LAND - (FOLD + mm(10)) }; // 599 / 479

/** Sheet 1 — the folded cover: front on the right half, home reflection on the left. */
function passportCoverPage(): Page {
  startPage();
  const el: PublisherElement[] = [];

  /* ---- right half: front cover ---- */
  el.push(
    piece({
      id: 'frame-storybook-border',
      x: R.x + 3,
      y: 34,
      w: R.w - 6,
      h: A4_LAND_H - 68,
      fit: 'fill',
      // A light accent, not a poster: the vines are a whisper behind the type.
      opacity: 0.62,
      name: 'Storybook Page Border',
    })
  );

  // The border art keeps a ~14% ornamental band; everything below sits inside it.
  const coverX = 672;
  const coverW = 380;

  el.push(
    text({
      x: coverX,
      y: 128,
      w: coverW,
      h: 96,
      text: 'MY READING\nPASSPORT',
      size: 37,
      weight: '900', // 28 pt, as the school's spec asks
      align: 'center',
      lh: 1.05,
      ls: 0.5,
      wordArt: 'champs-basa-blue',
      name: 'Cover title',
    })
  );

  el.push(
    piece({
      id: 'sticker-reading-passport',
      x: coverX + (coverW - 242) / 2,
      y: 236,
      w: 242,
      h: 242,
      name: 'Passport stamp',
    })
  );

  el.push(
    shape({
      x: coverX + 6,
      y: 488,
      w: coverW - 12,
      h: 190,
      radius: 10,
      stroke: '#a8a29e',
      width: 2,
      dash: 'dashed',
      name: 'Pupil details box',
    })
  );

  const fields = ['Name', 'Grade & Section', 'School', 'Adviser'];
  fields.forEach((label, i) => {
    const y = 496 + i * 34;
    el.push(
      text({ x: coverX + 18, y, w: 96, h: 20, text: `${label}:`, size: 10, weight: '600', color: SOFT })
    );
    el.push(rule(coverX + 120, y + 16, coverW - 138, RULE));
  });
  el.push(
    text({ x: coverX + 18, y: 632, w: 96, h: 20, text: 'School Year:', size: 10, weight: '600', color: SOFT })
  );
  el.push(
    text({ x: coverX + 120, y: 628, w: 238, h: 22, text: 'S.Y. 2026 – 2027', size: 11, weight: '600' })
  );

  /* ---- left half: back cover, the reflection the passport goes home with ---- */
  el.push(...halfFrames());

  el.push(
    text({
      x: L.x,
      y: 58,
      w: L.w,
      h: 46,
      text: 'Basa Kasadya Pamilya',
      size: 27,
      weight: '900',
      align: 'center',
      wordArt: 'champs-kasadya-coral',
      name: 'Back cover title',
    })
  );
  el.push(
    text({
      x: L.x,
      y: 108,
      w: L.w,
      h: 18,
      text: 'HOME READING REFLECTION',
      size: 10,
      weight: '600',
      ls: 2.2,
      color: '#78716c',
      align: 'center',
    })
  );
  el.push(rule(L.x + 118, 132, L.w - 236, '#d6d3d1'));

  const blockH = 145;
  const blockStep = 157;
  for (let i = 0; i < 4; i += 1) {
    const y = 148 + i * blockStep;
    el.push(
      shape({
        x: L.x,
        y,
        w: L.w,
        h: blockH,
        radius: 8,
        fill: WHITE,
        stroke: '#e7e5e4',
        width: 1,
        name: `Reflection ${i + 1}`,
      })
    );
    el.push(text({ x: L.x + 12, y: y + 8, w: 40, h: 13, text: 'Date:', size: 8.5, weight: '600', color: SOFT }));
    el.push(rule(L.x + 50, y + 17, 116, RULE));
    el.push(
      text({ x: L.x + 12, y: y + 30, w: 170, h: 13, text: 'Story Read at Home:', size: 8.5, weight: '600', color: SOFT })
    );
    el.push(rule(L.x + 12, y + 45, L.w - 24, RULE));
    el.push(
      text({ x: L.x + 12, y: y + 58, w: 170, h: 13, text: 'What I Liked Best:', size: 8.5, weight: '600', color: SOFT })
    );
    el.push(rule(L.x + 12, y + 75, L.w - 24, RULE));
    el.push(rule(L.x + 12, y + 96, L.w - 24, RULE));
    el.push(
      text({
        x: L.x + 12,
        y: y + 110,
        w: 150,
        h: 13,
        text: 'Parent / Guardian Signature:',
        size: 8.5,
        weight: '600',
        color: SOFT,
      })
    );
    el.push(rule(L.x + 170, y + 124, L.w - 182, RULE));
  }

  return page({
    id: 'page-champs-passport-cover',
    name: 'Sheet 1 — Cover & Reflection',
    width: A4_LAND_W,
    height: A4_LAND_H,
    orientation: 'landscape',
    margin: M_LAND,
    elements: el,
  });
}

/** One 10-row reading log, drawn as rules so the column widths are the spec's percentages. */
function readingLogHalf(x: number, w: number, top: number, rowsHeight: number): PublisherElement[] {
  const el: PublisherElement[] = [];
  const headerH = 30;
  const rowH = rowsHeight / 10;
  const bodyTop = top + headerH;

  const cols = [0.15, 0.4, 0.12, 0.18, 0.15];
  const cuts: number[] = [];
  let acc = x;
  cols.forEach((c) => {
    const width = Math.round(w * c);
    cuts.push(acc);
    acc += width;
  });
  cuts.push(x + w);

  el.push(
    shape({ x, y: top, w, h: headerH + rowsHeight, fill: WHITE, stroke: INK, width: 1.2, name: 'Log table' })
  );
  el.push(shape({ x, y: top, w, h: headerH, fill: '#f1f5f9', name: 'Log header band' }));

  const dots = 3;
  const dotD = 10;
  const dotGap = 5;
  const levelW = cuts[3] - cuts[2];
  const dotsStartX = cuts[2] + Math.round((levelW - (dots * dotD + (dots - 1) * dotGap)) / 2);

  const headers = ['DATE', 'BOOK TITLE & AUTHOR', 'LEVEL', 'RATING', 'INITIALS'];
  headers.forEach((label, i) => {
    el.push(
      text({
        x: cuts[i] + 2,
        y: top,
        w: cuts[i + 1] - cuts[i] - 4,
        h: headerH,
        text: label,
        size: 7.5,
        weight: '600',
        ls: 0.4,
        align: 'center',
        valign: 'middle',
      })
    );
  });

  // G / B / O sit exactly over the three dots beneath them, so the column needs no legend.
  ['G', 'B', 'O'].forEach((letter, i) => {
    el.push(
      text({
        x: dotsStartX + i * (dotD + dotGap) - 4,
        y: top + headerH - 14,
        w: dotD + 8,
        h: 10,
        text: letter,
        size: 8,
        weight: '600',
        color: MUTED,
        align: 'center',
      })
    );
  });

  // Header rules and body rules, then the column rules across both.
  for (let r = 1; r <= 9; r += 1) {
    el.push(rule(x, Math.round(bodyTop + r * rowH), w, RULE));
  }
  for (let c = 1; c < cuts.length - 1; c += 1) {
    el.push(vRule(cuts[c], top, headerH + rowsHeight, RULE));
  }

  const ratingLeft = cuts[3];
  const ratingW = cuts[4] - cuts[3];

  for (let r = 0; r < 10; r += 1) {
    const rowY = Math.round(bodyTop + r * rowH);
    // A single faint midline keeps the title column writable for a long title.
    el.push(rule(cuts[1] + 4, rowY + Math.round(rowH * 0.62), cuts[2] - cuts[1] - 8, '#eef2f7'));

    // Three hollow level dots — G / B / O — to colour in, one per book.
    const dotY = rowY + Math.round(rowH / 2) - dotD / 2;
    for (let k = 0; k < dots; k += 1) {
      el.push(circle(dotsStartX + k * (dotD + dotGap), dotY, dotD));
    }

    el.push(
      text({
        x: ratingLeft,
        y: rowY + 2,
        w: ratingW,
        h: Math.round(rowH - 4),
        text: '☆☆☆☆☆',
        size: 13,
        color: '#b3c0cf',
        align: 'center',
        valign: 'middle',
        ls: 0.5,
      })
    );
  }

  return el;
}

/** Sheet 2 — the inside spread: twenty books, ten per column. */
function passportLogPage(): Page {
  startPage();
  const el: PublisherElement[] = [];

  el.push(...halfFrames());

  el.push(
    text({
      x: L.x,
      y: 52,
      w: A4_LAND_W - M_LAND * 2,
      h: 28,
      text: 'MY READING CHALLENGE LOG',
      size: 19,
      weight: '800',
      ls: 1.2,
      align: 'center',
      name: 'Sheet 2 title',
    })
  );
  el.push(
    text({
      x: L.x,
      y: 82,
      w: A4_LAND_W - M_LAND * 2,
      h: 15,
      text: 'TWENTY BOOKS · TEN IN EACH COLUMN · COLOUR ONE LEVEL DOT AND THE STARS YOU EARN',
      size: 7.5,
      ls: 1.2,
      color: MUTED,
      align: 'center',
    })
  );

  const top = 108;
  const rowsHeight = 520;
  el.push(...readingLogHalf(L.x, L.w, top, rowsHeight));
  el.push(...readingLogHalf(R.x, R.w, top, rowsHeight));

  for (const side of [L, R]) {
    el.push(
      text({
        x: side.x,
        y: 672,
        w: side.w,
        h: 15,
        text: 'BOOKS READ:  ________ of 20',
        size: 9,
        weight: '600',
        color: SOFT,
        ls: 0.6,
      })
    );
    el.push(
      text({
        x: side.x,
        y: 692,
        w: side.w,
        h: 15,
        text: 'TEACHER SIGNATURE: ______________________',
        size: 9,
        weight: '600',
        color: SOFT,
        ls: 0.6,
      })
    );
    el.push(
      text({
        x: side.x,
        y: 718,
        w: side.w,
        h: 30,
        text:
          'LEVEL   G · green (emergent)   B · blue (beginning)   O · orange (transitional)\nRATING   colour one star for every part you loved',
        size: 7.5,
        lh: 1.55,
        color: MUTED,
      })
    );
  }

  return page({
    id: 'page-champs-passport-log',
    name: 'Sheet 2 — 20-Book Log',
    width: A4_LAND_W,
    height: A4_LAND_H,
    orientation: 'landscape',
    margin: M_LAND,
    elements: el,
  });
}

/* ------------------------------------------------------------------ *
 * (b) Book Circulation & Daily Usage Log — one A4 landscape sheet
 * ------------------------------------------------------------------ */

function circulationLogPage(): Page {
  startPage();
  const el: PublisherElement[] = [];
  const top = M_LAND;
  const right = A4_LAND_W - M_LAND;
  const contentW = right - top;

  el.push(
    shape({
      x: 28,
      y: 22,
      w: A4_LAND_W - 56,
      h: A4_LAND_H - 44,
      stroke: FAINT,
      width: 1,
      name: 'Trim',
    })
  );

  el.push(
    text({
      x: top,
      y: 44,
      w: contentW,
      h: 58,
      text: 'CHAMPS READING CORNER LOGBOOK',
      size: 29,
      weight: '900',
      align: 'center',
      wordArt: 'champs-gold-ribbon',
      name: 'Logbook title',
    })
  );

  const strip = [
    { x: top, w: 280, label: 'School' },
    { x: top + 300, w: 240, label: 'Grade & Section' },
    { x: top + 560, w: 190, label: 'Month' },
    { x: top + 770, w: contentW - 770, label: 'Teacher' },
  ];
  strip.forEach((f) => {
    el.push(text({ x: f.x, y: 122, w: f.w, h: 14, text: `${f.label}:`, size: 9, weight: '600', color: SOFT }));
    el.push(rule(f.x, 140, f.w, RULE));
  });

  /* ---- the daily log ---- */
  const tableTop = 170;
  const headerH = 32;
  const rowH = 34;
  const rows = 15;
  const tableBottom = tableTop + headerH + rowH * rows; // 712

  const cols = [0.09, 0.21, 0.24, 0.11, 0.15, 0.1, 0.1];
  const cuts: number[] = [];
  let acc = top;
  cols.forEach((c) => {
    cuts.push(acc);
    acc += Math.round(contentW * c);
  });
  cuts.push(right);

  el.push(
    shape({ x: top, y: tableTop, w: contentW, h: tableBottom - tableTop, fill: WHITE, stroke: INK, width: 1.2, name: 'Circulation table' })
  );
  el.push(shape({ x: top, y: tableTop, w: contentW, h: headerH, fill: '#f1f5f9', name: 'Header band' }));

  const headers = [
    { title: 'DATE', note: '' },
    { title: "LEARNER'S NAME", note: '' },
    { title: 'BOOK TITLE', note: '' },
    { title: 'LEVEL / LANG', note: 'E B T  ·  EN FIL' },
    { title: 'SESSION TYPE', note: '' },
    { title: 'RETURNED', note: 'DATE' },
    { title: 'CONDITION', note: 'G / D · INITIALS' },
  ];
  headers.forEach((h, i) => {
    const checkboxes = h.title === 'SESSION TYPE';
    el.push(
      text({
        x: cuts[i] + 3,
        y: checkboxes ? tableTop + 1 : tableTop,
        w: cuts[i + 1] - cuts[i] - 6,
        h: checkboxes ? 14 : headerH,
        text: h.note ? `${h.title}\n${h.note}` : h.title,
        size: h.note ? 7 : 7.5,
        weight: '600',
        ls: 0.3,
        lh: 1.45,
        align: 'center',
        valign: checkboxes ? 'top' : 'middle',
      })
    );
  });

  // Four tappable boxes per row — Free, Buddy, ARAL, Home — with F / B / A / H right above them.
  const boxStride = 14;
  const sessionLeft = cuts[4] + Math.round((cuts[5] - cuts[4] - (4 * 9 + 3 * (boxStride - 9))) / 2);
  ['F', 'B', 'A', 'H'].forEach((letter, i) => {
    el.push(
      text({
        x: sessionLeft + i * boxStride - 2,
        y: tableTop + 17,
        w: 13,
        h: 10,
        text: letter,
        size: 8,
        weight: '600',
        color: MUTED,
        align: 'center',
      })
    );
  });

  const bodyTop = tableTop + headerH;
  for (let r = 0; r < rows; r += 1) {
    const boxY = bodyTop + r * rowH + Math.round((rowH - 9) / 2);
    for (let k = 0; k < 4; k += 1) {
      el.push(shape({ x: sessionLeft + k * boxStride, y: boxY, w: 9, h: 9, stroke: '#a8b6c6', width: 1 }));
    }
  }

  for (let r = 1; r < rows; r += 1) {
    el.push(rule(top, bodyTop + r * rowH, contentW, RULE));
  }
  for (let c = 1; c < cuts.length - 1; c += 1) {
    el.push(vRule(cuts[c], tableTop, tableBottom - tableTop, RULE));
  }

  /* ---- footer: the two totals a coordinator asks for, and the two signatures ---- */
  el.push(rule(top, tableBottom + 8, contentW, '#dfe6ee'));

  const footY = tableBottom + 16;
  el.push(
    text({
      x: top,
      y: footY,
      w: 500,
      h: 15,
      text: 'TOTAL BOOKS CIRCULATED:  __________',
      size: 9,
      weight: '600',
      color: SOFT,
      ls: 0.6,
    })
  );
  el.push(
    text({
      x: top,
      y: footY + 20,
      w: 500,
      h: 15,
      text: 'TOTAL ARAL / REMEDIATION SESSIONS:  __________',
      size: 9,
      weight: '600',
      color: SOFT,
      ls: 0.6,
    })
  );
  el.push(
    text({
      x: top + 600,
      y: footY,
      w: contentW - 600,
      h: 15,
      text: 'PREPARED BY: ______________________    (Teacher)',
      size: 9,
      weight: '600',
      color: SOFT,
      ls: 0.6,
    })
  );
  el.push(
    text({
      x: top + 600,
      y: footY + 20,
      w: contentW - 600,
      h: 15,
      text: 'NOTED BY: ______________________    (Coordinator)',
      size: 9,
      weight: '600',
      color: SOFT,
      ls: 0.6,
    })
  );

  return page({
    id: 'page-champs-circulation',
    name: 'Daily Circulation Log',
    width: A4_LAND_W,
    height: A4_LAND_H,
    orientation: 'landscape',
    margin: M_LAND,
    elements: el,
  });
}

/* ------------------------------------------------------------------ *
 * (c) Colour-coded level labels & picture-labelled bin cards
 *     A4 portrait, 2 × 4 grid of 92 × 64 mm cards, dabbed cut lines
 * ------------------------------------------------------------------ */

const CARD_W = 347;
const CARD_H = 244;
const CARD_COLS = [M_PORT, M_PORT + CARD_W + 23];
const CARD_ROWS = [M_PORT, M_PORT + 267, M_PORT + 534, M_PORT + 801];

const cardAt = (index: number) => ({
  x: CARD_COLS[index % 2],
  y: CARD_ROWS[Math.floor(index / 2)],
});

const cutLine = (x: number, y: number): ShapeElement =>
  shape({
    x,
    y,
    w: CARD_W,
    h: CARD_H,
    fill: WHITE,
    stroke: MUTED,
    width: 1,
    dash: 'dashed',
    name: 'Cut line',
  });

const cardFooters = (x: number, y: number, label: string): PublisherElement[] => [
  text({ x: x + 16, y: y + 222, w: 150, h: 12, text: label, size: 7, ls: 1.3, color: MUTED }),
  text({
    x: x + 180,
    y: y + 222,
    w: 151,
    h: 12,
    text: 'CHAMPS READING CORNER',
    size: 7,
    ls: 1.3,
    color: MUTED,
    align: 'right',
  }),
];

const LEVEL_CARDS = [
  {
    color: GREEN,
    title: 'EMERGENT READERS',
    size: 25,
    wordArt: 'champs-level-emergent' as WordArtStyle,
    guide: 'Picture-heavy books, 1–2 simple lines per page.',
  },
  {
    color: GREEN,
    title: 'EMERGENT READERS',
    size: 25,
    wordArt: 'champs-level-emergent' as WordArtStyle,
    guide: 'Picture-heavy books, 1–2 simple lines per page.',
  },
  {
    color: BLUE,
    title: 'BEGINNING READERS',
    size: 25,
    wordArt: 'champs-level-beginning' as WordArtStyle,
    guide: 'Short sentences, high-frequency & decodable words.',
  },
  {
    color: BLUE,
    title: 'BEGINNING READERS',
    size: 25,
    wordArt: 'champs-level-beginning' as WordArtStyle,
    guide: 'Short sentences, high-frequency & decodable words.',
  },
  {
    color: AMBER,
    title: 'TRANSITIONAL READERS',
    size: 21,
    wordArt: 'champs-level-transitional' as WordArtStyle,
    guide: 'Longer stories, rich vocabulary, independent reading.',
  },
  {
    color: AMBER,
    title: 'TRANSITIONAL READERS',
    size: 21,
    wordArt: 'champs-level-transitional' as WordArtStyle,
    guide: 'Longer stories, rich vocabulary, independent reading.',
  },
  {
    color: TEAL,
    title: 'FILIPINO & LOCAL TALES',
    size: 21,
    guide: 'Mga kuwentong bayan at Akeanon tales, big type and local names.',
  },
  {
    color: CORAL,
    title: 'ENGLISH STORYBOOKS',
    size: 25,
    guide: 'English picture books for readers ready for more.',
  },
];

function levelCardsPage(): Page {
  startPage();
  const el: PublisherElement[] = [];

  LEVEL_CARDS.forEach((card, i) => {
    const { x, y } = cardAt(i);
    el.push(cutLine(x, y));
    el.push(shape({ x, y, w: CARD_W, h: 53, fill: card.color, name: `${card.title} colour bar` }));
    el.push(
      text({
        x: x + 12,
        y: y + 5,
        w: CARD_W - 24,
        h: 43,
        text: card.title,
        size: card.size,
        weight: '900',
        font: FONT_DISPLAY,
        color: WHITE,
        align: 'center',
        valign: 'middle',
        wordArt: card.wordArt,
        pad: 2,
        name: `${card.title} label`,
      })
    );
    el.push(
      // One line of copy leaves the card half empty: centre it in the colour field below the bar
      // so the label reads as a label rather than as orphaned text.
      text({
        x: x + 16,
        y: y + 60,
        w: CARD_W - 32,
        h: 146,
        text: card.guide,
        size: 12.5,
        lh: 1.45,
        color: INK,
        align: 'center',
        valign: 'middle',
      })
    );
    el.push(...cardFooters(x, y, `BIN ${i + 1} OF 8 · SHEET A`));
  });

  return page({
    id: 'page-champs-level-cards',
    name: 'Sheet A — Level Labels',
    width: A4_PORT_W,
    height: A4_PORT_H,
    orientation: 'portrait',
    margin: M_PORT,
    elements: el,
  });
}

const GENRE_CARDS = [
  { label: 'Storybooks', art: 'sticker-magic-book' },
  { label: 'Big Books', art: 'sticker-big-book-easel' },
  { label: 'Decodable Readers', art: 'sticker-abc-blocks' },
  { label: 'Pop-Up & Tactile', art: 'sticker-popup-book' },
  { label: 'Local / Akeanon Tales', art: 'sticker-nipa-hut' },
  { label: 'Audio Stories', art: 'sticker-audio-station' },
  { label: 'Puppets & Props', art: 'sticker-story-puppet' },
  { label: 'Book Return Bin', art: 'sticker-return-bin' },
];

function genreCardsPage(): Page {
  startPage();
  const el: PublisherElement[] = [];

  GENRE_CARDS.forEach((card, i) => {
    const { x, y } = cardAt(i);
    const boxX = x + 16;
    const boxY = y + 50;
    el.push(cutLine(x, y));
    el.push(
      shape({
        x: boxX,
        y: boxY,
        w: 144,
        h: 144,
        radius: 10,
        fill: '#f8fafc',
        stroke: FAINT,
        width: 1,
        name: `${card.label} icon box`,
      })
    );
    el.push(piece({ id: card.art, x: boxX, y: boxY, w: 144, h: 144, name: card.label }));
    el.push(
      text({
        x: x + 172,
        y: boxY,
        w: CARD_W - 188,
        h: 144,
        text: card.label,
        size: 24,
        weight: '800',
        font: FONT_DISPLAY,
        color: INK,
        valign: 'middle',
        lh: 1.2,
        name: `${card.label} label`,
      })
    );
    el.push(...cardFooters(x, y, `BIN ${i + 1} OF 8 · SHEET B`));
  });

  return page({
    id: 'page-champs-genre-cards',
    name: 'Sheet B — Genre Bins',
    width: A4_PORT_W,
    height: A4_PORT_H,
    orientation: 'portrait',
    margin: M_PORT,
    elements: el,
  });
}

/* ------------------------------------------------------------------ *
 * The three definitions
 * ------------------------------------------------------------------ */

const project = (id: string, name: string, pageSizeName: string, pages: Page[]): DocumentProject => ({
  id,
  name,
  pageSizeName,
  colorScheme: 'ocean-navy',
  activePageIndex: 0,
  masterPage: { elements: [], showOnAllPages: false },
  pages,
});

export const CHAMPS_READING_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'champs-passport-a4',
    name: 'Learner Reading Passport (Half-Fold)',
    description:
      'Half-fold A4 passport: cover with pupil details, home reading reflection on the back, and a 20-book log inside with G/B/O level dots and five-star ratings. Category 5B.',
    category: 'Champs Reading',
    thumbnailColor: '#1e3a8a',
    thumbnailGradient: 'linear-gradient(135deg, #1e3a8a 0%, #e11d48 55%, #0d9488 100%)',
    project: project('proj-champs-passport', 'Champs Reading Passport.pub', 'a4-landscape', [
      passportCoverPage(),
      passportLogPage(),
    ]),
  },
  {
    id: 'champs-circulation-log',
    name: 'Book Circulation & ARAL Usage Log',
    description:
      'One A4 sheet the reading corner can live on: gold ribbon with School / Grade / Month / Teacher, fifteen 9 mm rows with session checkboxes, and the circulated and ARAL totals at the foot. Category 5A & 5B.',
    category: 'Champs Reading',
    thumbnailColor: '#b45309',
    thumbnailGradient: 'linear-gradient(135deg, #0f766e 0%, #fbbf24 60%, #b45309 100%)',
    project: project('proj-champs-circulation', 'Book Circulation Log.pub', 'a4-landscape', [
      circulationLogPage(),
    ]),
  },
  {
    id: 'champs-level-labels',
    name: 'Color-Coded Leveling & Bin Labels (8-Up)',
    description:
      'Eight 92 × 64 mm cards per sheet on dashed cut lines: emergent green, beginning blue and transitional gold bands on sheet A, then picture-labelled genre bins for non-readers on sheet B. Category 2B & 3B.',
    category: 'Champs Reading',
    thumbnailColor: '#0d9488',
    thumbnailGradient: 'linear-gradient(135deg, #16a34a 0%, #2563eb 40%, #d97706 70%, #e11d48 100%)',
    project: project('proj-champs-labels', 'Reading Bin Cards.pub', 'a4', [
      levelCardsPage(),
      genreCardsPage(),
    ]),
  },
];
