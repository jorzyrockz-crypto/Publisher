import {
  AccentElement,
  ConnectorElement,
  ImageElement,
  LineElement,
  Page,
  PublisherElement,
  QRElement,
  ShapeElement,
  TableElement,
  TextElement,
  WordArtStyle,
} from '../types/publisher';
import { classifyElements, fitTextToBox } from './designBlueprints';
import { GOOGLE_FONTS_CATALOG } from '../constants/fonts';
import { ensureContrast, mixHex, relativeLuminance } from './documentPalette';

/**
 * The Design Ideas panel's layout recipes.
 *
 * Every suggestion here is a *page*, and applying one replaces the page's elements wholesale. That
 * makes dropping an element the worst bug this module can have: a QR code, a table, a sticker or a
 * signature rule that is not in the recipe is gone from the document. So the recipes are written
 * against one rule — **the union of what the user has and what the layout wants** — and every
 * builder ends in `withExtras`, which walks the original page and anchors anything the builder did
 * not explicitly place. Nothing is ever dropped; the worst case is that something is anchored
 * conservatively at its old coordinates.
 *
 * The six recipes differ in *structure*, not in palette: a wave header over elevated content, a
 * framed centred certificate, a bento card grid, a playful classroom collage, an editorial split,
 * and a dark executive page. Palette variations of the same split is what the panel used to show,
 * and no one could tell the cards apart.
 */

export type DesignRecommendationCategory = 'all' | 'layouts' | 'color-dark' | 'photo';

/** The layout recipes, by the id the panel and the advice both use. */
export type DesignLayoutId =
  | 'wave-hero'
  | 'prestige-frame'
  | 'bento'
  | 'playful'
  | 'split-left'
  | 'split-right'
  | 'dark'
  | 'hero-overlay'
  /** Legacy advice values, kept so saved prompts and older model answers still land somewhere. */
  | 'centered'
  | 'swiss';

export interface DesignRecommendation {
  id: string;
  title: string;
  subtitle: string;
  category: Exclude<DesignRecommendationCategory, 'all'>;
  badge: string;
  previewPage: Page;
}

export interface AIDesignAdvice {
  vibeTitle: string;
  bg: string;
  primary: string;
  accent: string;
  text: string;
  headingFont: string;
  bodyFont: string;
  preferredLayout: DesignLayoutId;
  source: 'gemini' | 'local';
}

/** The palettes a builder needs. `bg` is the page ground the type has to read against. */
interface Palette {
  bg: string;
  text: string;
  muted: string;
  primary: string;
  accent: string;
  headingFont?: string;
  bodyFont?: string;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Where a builder leaves room for the things it does not own: the footer and the safety net. */
interface Zones {
  hero: Box;
  content: Box;
  footer: Box;
}

const MARGINS = (page: Page) => page.margins || { top: 48, right: 48, bottom: 48, left: 48 };

/* Faces the app actually loads. A recipe that names `Inter` on a page that never requests it is a
 * recipe that renders in the browser's default sans and looks nothing like the card. */
const BODY = 'Plus Jakarta Sans';
const DISPLAY = 'Playfair Display';
const GEO = 'Montserrat';
const ROUND = 'Fredoka';
const SOFT = 'Nunito';

const LOADED_FAMILIES = new Set(
  [BODY, DISPLAY, GEO, ROUND, SOFT, 'Inter', 'Poppins', 'Merriweather', 'Baloo 2', 'Lilita One']
);

const clamp = (value: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, value));
const round = (value: number) => Math.round(value);

/** A colour that reads on `ground`, so a palette swap cannot produce grey-on-grey. */
const ink = (color: string, ground: string, minRatio = 4.5) => ensureContrast(color, ground, minRatio);

/* ── element factories ──────────────────────────────────────────────────────────────────────── */

function shapeElement(id: string, box: Box, style: Partial<ShapeElement> = {}): ShapeElement {
  return {
    id,
    type: 'shape',
    name: 'Layout Panel',
    shapeType: 'rectangle',
    x: round(box.x),
    y: round(box.y),
    width: round(box.w),
    height: round(box.h),
    rotation: 0,
    zIndex: 1,
    fillColor: 'transparent',
    strokeColor: 'transparent',
    strokeWidth: 0,
    ...style,
  };
}

function lineElement(id: string, box: Box, strokeColor: string, strokeWidth = 3): LineElement {
  return {
    id,
    type: 'line',
    name: 'Divider',
    x: round(box.x),
    y: round(box.y),
    width: round(box.w),
    height: Math.max(2, round(box.h)),
    rotation: 0,
    zIndex: 6,
    strokeColor,
    strokeWidth,
    strokeDash: 'solid',
  };
}

/* ── reading the page ──────────────────────────────────────────────────────────────────────── */

interface PageRoles {
  hero: TextElement | null;
  kicker: TextElement | null;
  subs: TextElement[];
  ctas: ShapeElement[];
  visuals: PublisherElement[];
  backgrounds: PublisherElement[];
  edgeBands: PublisherElement[];
  badges: ShapeElement[];
  marks: PublisherElement[];
  /** Furniture that is content, and that a layout must carry rather than consume. */
  qrs: QRElement[];
  tables: TableElement[];
  stickers: ImageElement[];
  lines: LineElement[];
  accents: AccentElement[];
  connectors: ConnectorElement[];
  /** Every source element, in order — the ground truth `withExtras` checks against. */
  all: PublisherElement[];
}

/**
 * Splits a page into the parts a layout can place.
 *
 * `classifyElements` already decides hero/kicker/body from type size and tracking; it just cannot
 * tell a *sticker* from a photograph, or a QR code from a logo. Those are lifted out first, so the
 * classifier never mistakes a seal for a picture it may crop, and so the builder is handed the
 * things it must anchor deliberately.
 */
function readRoles(page: Page): PageRoles {
  const qrs: QRElement[] = [];
  const tables: TableElement[] = [];
  const stickers: ImageElement[] = [];
  const lines: LineElement[] = [];
  const accents: AccentElement[] = [];
  const connectors: ConnectorElement[] = [];
  const rest: PublisherElement[] = [];

  for (const el of page.elements) {
    if (el.type === 'qr') qrs.push(el);
    else if (el.type === 'table') tables.push(el);
    else if (el.type === 'connector') connectors.push(el);
    else if (el.type === 'image' && el.isSticker) stickers.push(el);
    else if (el.type === 'line') lines.push(el);
    else if (el.type === 'accent') accents.push(el);
    else rest.push(el);
  }

  const roles = classifyElements(rest, page.width, page.height);
  return {
    hero: roles.heroTitle,
    kicker: roles.kicker,
    subs: roles.subtitles.filter((el): el is TextElement => el.type === 'text'),
    ctas: roles.ctaPills,
    visuals: roles.visuals,
    backgrounds: roles.backgrounds,
    edgeBands: roles.edgeBands,
    badges: roles.cornerBadges,
    marks: roles.brandMarks,
    qrs,
    tables,
    stickers,
    lines,
    accents,
    connectors,
    all: page.elements,
  };
}

/* ── placing text ──────────────────────────────────────────────────────────────────────────── */

interface TextStyle {
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  minFontSize?: number;
  fontWeight?: TextElement['fontWeight'];
  letterSpacing?: number;
  lineHeight?: number;
  align?: TextElement['textAlign'];
  verticalAlign?: TextElement['verticalAlign'];
  zIndex?: number;
  isWordArt?: boolean;
  wordArtStyle?: WordArtStyle;
  textTransform?: TextElement['textTransform'];
  rotation?: number;
  /** Keep the box at the height the layout reserved instead of shrinking it to the type. */
  fillHeight?: boolean;
}

/**
 * Places a text element and sizes it to the box — never the other way round.
 *
 * The copy, its id and every attribute the user set that this call does not override survive
 * untouched: a recipe may restyle a headline, but it may not rewrite it.
 */
function placeText(el: TextElement, box: Box, style: TextStyle = {}): TextElement {
  const fontFamily = style.fontFamily ?? el.fontFamily;
  const fontWeight = style.fontWeight ?? el.fontWeight;
  const lineHeight = style.lineHeight ?? el.lineHeight ?? 1.25;
  const letterSpacing = style.letterSpacing ?? el.letterSpacing ?? 0;
  const { fontSize, neededHeight } = fitTextToBox(
    el.text,
    fontFamily,
    fontWeight,
    style.fontSize ?? el.fontSize ?? 24,
    style.minFontSize ?? 10,
    box.w,
    box.h,
    lineHeight,
    letterSpacing
  );
  const height = style.fillHeight ? round(box.h) : Math.max(20, round(Math.min(box.h, neededHeight)));

  return {
    ...el,
    x: round(box.x),
    y: round(box.y),
    width: round(box.w),
    height,
    fontSize,
    lineHeight,
    letterSpacing,
    color: style.color ?? el.color,
    fontFamily,
    fontWeight,
    textAlign: style.align ?? el.textAlign,
    verticalAlign: style.verticalAlign ?? el.verticalAlign ?? 'top',
    zIndex: style.zIndex ?? el.zIndex ?? 5,
    isWordArt: style.isWordArt ?? el.isWordArt,
    wordArtStyle: style.wordArtStyle ?? el.wordArtStyle,
    textTransform: style.textTransform ?? el.textTransform,
    rotation: style.rotation ?? el.rotation ?? 0,
  };
}

/**
 * A conservative line count for a display face, before anything is drawn.
 *
 * `fitTextToBox` measures with the browser's canvas when it can, and that measurement is good — but
 * it is a measurement of the space available, not a promise the headline will not reflow when the
 * webfont swaps in. Display faces run wider than body faces, so the headline gets its own cap: at
 * the size we choose, this estimate must fit, and the browser may only ever choose smaller.
 */
const DISPLAY_CHAR_EM = 0.6;

function conservativeLines(text: string, width: number, size: number, letterSpacing: number): number {
  const perChar = size * DISPLAY_CHAR_EM + Math.max(0, letterSpacing);
  const perLine = Math.max(3, Math.floor(width / Math.max(1, perChar)));
  let lines = 1;
  let used = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (used === 0) used = word.length;
    else if (used + 1 + word.length <= perLine) used += 1 + word.length;
    else {
      lines += 1;
      used = word.length;
    }
  }
  return lines;
}

/** The largest display size at which the headline still fits the box under a conservative wrap. */
function fitDisplay(
  text: string,
  maxFont: number,
  minFont: number,
  width: number,
  height: number,
  lineHeight: number,
  letterSpacing = 0
): number {
  let size = Math.round(maxFont);
  while (size > minFont) {
    const lines = conservativeLines(text, width, size, letterSpacing);
    if (lines * size * lineHeight + 6 <= height) return size;
    size -= 2;
  }
  return Math.max(8, Math.round(minFont));
}

/** Places a stack of body copy, each block sized to what is left and never overlapping the last. */
function placeStack(
  items: TextElement[],
  box: Box,
  style: TextStyle,
  gap: number
): { elements: TextElement[]; bottom: number } {
  const out: TextElement[] = [];
  let y = box.y;
  for (const item of items) {
    const remaining = Math.max(28, box.y + box.h - y);
    if (remaining < 28) break;
    const placed = placeText(item, { x: box.x, y, w: box.w, h: Math.min(remaining, round(box.h * 0.9)) }, style);
    out.push(placed);
    y += placed.height + gap;
  }
  return { elements: out, bottom: y - gap };
}

/** A picture in a frame, dropped into `box` without distorting it. */
function placeVisual(
  el: PublisherElement,
  box: Box,
  options: {
    radius?: number;
    shadow?: boolean;
    borderColor?: string;
    borderWidth?: number;
    borderArt?: ImageElement['borderArt'];
    rotation?: number;
    zIndex?: number;
  } = {}
): PublisherElement {
  if (el.type === 'image') {
    return {
      ...el,
      x: round(box.x),
      y: round(box.y),
      width: round(box.w),
      height: round(box.h),
      rotation: options.rotation ?? 0,
      zIndex: options.zIndex ?? 3,
      objectFit: el.objectFit ?? 'cover',
      borderRadius: options.radius ?? el.borderRadius ?? 0,
      shadow: options.shadow ?? el.shadow,
      shadowBlur: options.shadow ? 24 : el.shadowBlur,
      borderColor: options.borderColor ?? el.borderColor,
      borderWidth: options.borderWidth ?? el.borderWidth,
      borderArt: options.borderArt ?? el.borderArt,
    };
  }
  return {
    ...el,
    x: round(box.x),
    y: round(box.y),
    width: round(box.w),
    height: round(box.h),
    rotation: options.rotation ?? 0,
    zIndex: options.zIndex ?? 3,
  };
}

/* ── the safety net ───────────────────────────────────────────────────────────────────────── */

interface ExtrasOptions {
  zones: Zones;
  /** Slots the builder reserved for furniture. Anything unspecified falls back to a corner. */
  qr?: Box;
  tables?: Box[];
  seals?: Box[];
  rules?: Box[];
  qrFg?: string;
  qrBg?: string;
  ruleColor?: string;
  sealRotations?: number[];
}

/** How tall a table wants to be: its own rows decide, within the space the layout allows. */
function tableHeight(table: TableElement, maxH: number): number {
  const rows = Math.max(2, table.rows || table.data?.length || 2);
  const size = table.fontSize || 13;
  return clamp(round(rows * size * 2.1 + 24), 84, Math.max(84, maxH));
}

function dedupe(elements: PublisherElement[]): PublisherElement[] {
  const seen = new Set<string>();
  const out: PublisherElement[] = [];
  for (const el of elements) {
    if (seen.has(el.id)) continue;
    seen.add(el.id);
    out.push(el);
  }
  return out;
}

/**
 * Anchors everything the builder did not place, and returns the complete element list.
 *
 * The builders reserve slots for the furniture they know about — a QR code in the footer corner, a
 * table under the copy, a seal beside the headline — because where those things go is a design
 * decision. This pass handles what is left over, and its job is narrower and blunter: nothing the
 * user made may vanish. Furniture falls back to the footer, a panel keeps its coordinates, a
 * background stays a background. It is a net, not a layout.
 */
function withExtras(page: Page, placed: PublisherElement[], options: ExtrasOptions): PublisherElement[] {
  const out = dedupe(placed);
  const ids = new Set(out.map((el) => el.id));
  const { zones } = options;
  const m = MARGINS(page);
  const footerH = round(zones.footer.h);
  const fallbackSeals: Box[] = [
    { x: zones.footer.x, y: zones.footer.y, w: footerH, h: footerH },
    { x: zones.footer.x + footerH + 12, y: zones.footer.y, w: footerH, h: footerH },
  ];
  let sealIndex = 0;
  let qrIndex = 0;
  let tableIndex = 0;
  let ruleIndex = 0;

  for (const el of page.elements) {
    if (ids.has(el.id)) continue;
    ids.add(el.id);

    if (el.type === 'qr') {
      const size = clamp(round(footerH), 56, 104);
      const slot = options.qr && qrIndex === 0 ? options.qr : undefined;
      out.push({
        ...(el as QRElement),
        x: round(slot ? slot.x : page.width - m.right - size - qrIndex * (size + 8)),
        y: round(slot ? slot.y : page.height - m.bottom - size),
        width: round(slot ? Math.min(slot.w, size) : size),
        height: round(slot ? Math.min(slot.h, size) : size),
        fgColor: options.qrFg ?? el.fgColor,
        bgColor: options.qrBg ?? el.bgColor,
        zIndex: 8,
      });
      qrIndex += 1;
      continue;
    }

    if (el.type === 'table') {
      const table = el as TableElement;
      const slot = options.tables?.[tableIndex];
      const height = slot ? round(slot.h) : tableHeight(table, round(zones.content.h));
      const box: Box = slot ?? {
        x: zones.content.x,
        y: zones.content.y + zones.content.h - height,
        w: zones.content.w,
        h: height,
      };
      out.push({ ...table, x: round(box.x), y: round(box.y), width: round(box.w), height: round(box.h), zIndex: 4 });
      tableIndex += 1;
      continue;
    }

    if (el.type === 'image' && el.isSticker) {
      const slot = options.seals?.[sealIndex] ?? fallbackSeals[sealIndex % fallbackSeals.length];
      const size = clamp(round(Math.min(slot.w, slot.h)), 40, 104);
      out.push({
        ...el,
        x: round(slot.x),
        y: round(slot.y),
        width: size,
        height: size,
        rotation: options.sealRotations?.[sealIndex] ?? el.rotation ?? 0,
        zIndex: 9,
      });
      sealIndex += 1;
      continue;
    }

    if (el.type === 'line') {
      // Rules and signature lines read best in the band they were drawn for.
      const slot = options.rules?.[ruleIndex];
      const width = slot ? round(slot.w) : Math.round(zones.footer.w * 0.22);
      const x = slot ? slot.x : zones.footer.x + ruleIndex * Math.round(zones.footer.w * 0.26);
      const y = slot ? slot.y : zones.footer.y;
      out.push({
        ...(el as LineElement),
        x: round(x),
        y: round(y),
        width,
        height: Math.max(2, el.height),
        strokeColor: options.ruleColor ?? (el as LineElement).strokeColor,
        zIndex: 6,
      });
      ruleIndex += 1;
      continue;
    }

    if (el.type === 'accent') {
      out.push({ ...el, x: round(zones.content.x), y: round(zones.content.y), zIndex: 4 });
      continue;
    }

    if (el.type === 'connector') {
      out.push({ ...(el as ConnectorElement) });
      continue;
    }

    // Furniture: a whole-page panel stays a background, an edge band stays an edge band.
    const coversPage = el.width * el.height >= page.width * page.height * 0.6;
    const coversAxis = el.width >= page.width * 0.76 || el.height >= page.height * 0.76;
    if (coversPage) {
      out.push({ ...el, x: 0, y: 0, width: page.width, height: page.height, zIndex: 0 });
      continue;
    }
    if (coversAxis) {
      out.push({ ...el, x: 0, y: clamp(el.y, 0, page.height - el.height), width: page.width, zIndex: 1 });
      continue;
    }

    // Anything else keeps its geometry, nudged back onto the sheet so a stale coordinate cannot
    // hide it in the trim.
    out.push({
      ...el,
      x: clamp(el.x, m.left, Math.max(m.left, page.width - m.right - el.width)),
      y: clamp(el.y, m.top, Math.max(m.top, page.height - m.bottom - el.height)),
    });
  }

  return out;
}

/* ── furniture helpers the builders use to reserve slots ───────────────────────────────────── */

/** A table keeps a padded column: its own rule of air on every side, as a table needs. */
function placeSeal(sticker: ImageElement, box: Box, rotation: number): ImageElement {
  const size = round(Math.min(box.w, box.h));
  return {
    ...sticker,
    x: round(box.x),
    y: round(box.y),
    width: size,
    height: size,
    rotation,
    zIndex: 9,
  };
}
/* ── 1. Wave Banner Hero ───────────────────────────────────────────────────────────────────── */

const WAVE_PALETTE: Palette = {
  bg: '#f8fafc',
  text: '#0f172a',
  muted: '#475569',
  primary: '#4f46e5',
  accent: '#06b6d4',
};

/**
 * A gradient wave across the top, the headline riding inside it, everything else on elevated
 * cards below. The wave is a real `ShapeElement` with `waveEdge: 'bottom'`, so the curve is the
 * renderer's — not a picture of a curve that cannot be edited.
 */
function buildWaveHeroLayout(page: Page, palette: Palette = WAVE_PALETTE): Page {
  const roles = readRoles(page);
  const m = MARGINS(page);
  const cw = page.width - m.left - m.right;
  const headerH = clamp(round(page.height * 0.32), 168, 320);
  const next: PublisherElement[] = [];

  next.push(
    shapeElement(
      'rec-wave-header',
      { x: -8, y: -8, w: page.width + 16, h: headerH + 8 },
      {
        name: 'Wave Header',
        waveEdge: 'bottom',
        waveAmplitude: 24,
        waveFrequency: 1,
        fillType: 'linear-gradient',
        fillColor: palette.primary,
        gradientColor2: palette.accent,
        gradientAngle: 95,
        zIndex: 1,
      }
    )
  );

  const eyebrowY = round(headerH * 0.24);
  let headerCursor = eyebrowY;
  const accentInk = ink('#e0e7ff', palette.primary, 3);

  if (roles.kicker) {
    const kicker = placeText(
      roles.kicker,
      { x: m.left + 8, y: headerCursor, w: round(cw * 0.8), h: 22 },
      {
        color: accentInk,
        fontFamily: palette.bodyFont ?? BODY,
        fontSize: 12,
        minFontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2.5,
        lineHeight: 1.1,
        textTransform: 'uppercase',
        align: 'left',
        verticalAlign: 'middle',
        zIndex: 5,
        fillHeight: true,
        isWordArt: false,
      }
    );
    next.push(kicker);
    headerCursor += 26;
  }

  // The page's own rule, reused as a hairline under the eyebrow — the one place a header wants one.
  const headerRule = roles.lines[0];
  if (headerRule) {
    next.push({
      ...headerRule,
      x: m.left + 8,
      y: round(headerCursor + 8),
      width: Math.min(round(headerRule.width), 180),
      height: Math.max(2, headerRule.height),
      strokeColor: accentInk,
      zIndex: 5,
    });
    headerCursor += 16;
  }

  if (roles.hero) {
    const heroBox: Box = {
      x: m.left + 8,
      y: headerCursor + 12,
      w: round(cw * 0.78),
      // Stop well above the wave's trough: type that crosses the curve looks like an accident.
      h: Math.max(56, headerH - headerCursor - 36),
    };
  const hero = placeText(
    roles.hero,
    heroBox,
    {
      color: ink('#ffffff', palette.primary, 4.5),
      fontFamily: palette.headingFont ?? GEO,
      fontSize: fitDisplay(roles.hero.text, 66, 24, heroBox.w, heroBox.h, 1.08, -0.5),
      minFontSize: 24,
      fontWeight: '900',
      lineHeight: 1.08,
      letterSpacing: -0.5,
      align: 'left',
      verticalAlign: 'middle',
      zIndex: 6,
      fillHeight: true,
      isWordArt: true,
      wordArtStyle: 'sunset-gradient',
    }
  );
  next.push(hero);
  }

  const contentY = round(headerH + 28);
  const footerH = 96;
  const footerY = page.height - m.bottom - footerH;
  const contentH = Math.max(160, footerY - 16 - contentY);
  const hasVisual = roles.visuals.length > 0;
  const gap = 24;
  const textW = hasVisual ? round(cw * 0.52) : round(cw * 0.8);
  const visualX = m.left + textW + gap;
  const visualW = cw - textW - gap;
  const cardW = hasVisual ? visualX - 8 - m.left : textW + 48;

  next.push(
    shapeElement('rec-wave-content-card', { x: m.left, y: contentY, w: cardW, h: contentH }, {
      name: 'Content Card',
      shapeType: 'rounded-rect',
      cornerRadius: 24,
      fillColor: '#ffffff',
      shadow: true,
      shadowBlur: 24,
      shadowColor: 'rgba(15,23,42,0.08)',
      zIndex: 2,
    })
  );

  const inner: Box = { x: m.left + 24, y: contentY + 24, w: cardW - 48, h: contentH - 48 };
  // Reserve the table's band first, so the copy is measured against what is actually left.
  const reserve = roles.tables.length ? tableHeight(roles.tables[0], round(inner.h * 0.5)) : 0;
  const copyH = Math.max(48, inner.h - (reserve ? reserve + 20 : 0));
  let cursor = inner.y;

  if (roles.subs.length) {
    const stack = placeStack(
      roles.subs,
      { x: inner.x, y: cursor, w: inner.w, h: copyH },
      {
        color: ink(palette.muted, palette.bg, 4.5),
        fontFamily: palette.bodyFont ?? BODY,
        fontSize: 16,
        minFontSize: 11,
        lineHeight: 1.5,
        align: 'left',
        verticalAlign: 'top',
        zIndex: 5,
      },
      12
    );
    next.push(...stack.elements);
    cursor = stack.bottom + 20;
  }

  const cta = roles.ctas[0];
  const ctaH = cta ? clamp(round(cta.height || 52), 40, 64) : 0;
  if (cta) {
    const ctaW = Math.min(round(cta.width || 220), round(inner.w * 0.7));
    next.push({
      ...cta,
      x: round(inner.x),
      y: round(clamp(cursor, inner.y, inner.y + copyH - ctaH)),
      width: ctaW,
      height: ctaH,
      fillColor: palette.primary,
      labelColor: ink('#ffffff', palette.primary, 3),
      zIndex: 7,
    });
  }

  const tableBox: Box | undefined = reserve
    ? { x: inner.x, y: round(inner.y + inner.h - reserve), w: inner.w, h: reserve }
    : undefined;

  if (hasVisual) {
    const count = Math.min(2, roles.visuals.length);
    const eachH = round((contentH - (count - 1) * 16) / count);
    roles.visuals.slice(0, count).forEach((visual, index) => {
      next.push(
        placeVisual(
          visual,
          { x: visualX, y: contentY + index * (eachH + 16), w: visualW, h: eachH },
          { radius: 20, shadow: true, zIndex: 3 }
        )
      );
    });
  }

  const zones: Zones = {
    hero: { x: m.left + 8, y: eyebrowY, w: round(cw * 0.8), h: round(headerH * 0.5) },
    content: { x: inner.x, y: inner.y, w: inner.w, h: copyH },
    footer: { x: m.left, y: footerY, w: cw - 112, h: footerH - 8 },
  };

  return {
    ...page,
    backgroundColor: palette.bg,
    backgroundGradient: undefined,
    backgroundPattern: { type: 'dots', color: palette.primary, opacity: 0.05, scale: 32, strokeWidth: 1.5, rotation: 0 },
    elements: withExtras(page, next, {
      zones,
      qr: { x: page.width - m.right - 96, y: footerY + 8, w: 88, h: 88 },
      tables: tableBox ? [tableBox] : undefined,
      seals: [
        { x: m.left, y: footerY + 8, w: 80, h: 80 },
        { x: m.left + 92, y: footerY + 16, w: 64, h: 64 },
      ],
      sealRotations: [-7, 6],
      qrFg: palette.text,
      qrBg: '#ffffff',
      ruleColor: palette.accent,
    }),
  };
}

/* ── 2. Prestige Framed ────────────────────────────────────────────────────────────────────── */

const PRESTIGE_PALETTE: Palette = {
  bg: '#fdfbf7',
  text: '#1e293b',
  muted: '#57534e',
  primary: '#1e3a8a',
  accent: '#d97706',
  headingFont: DISPLAY,
  bodyFont: BODY,
};

/**
 * Ivory paper, a double frame and a centred column — the certificate grammar.
 *
 * The seal sits beside the headline where a seal is printed, the signature rules keep the footer,
 * and the gold divider is a real `line`, so it can be moved and restyled like anything else.
 */
function buildPrestigeFrameLayout(page: Page, palette: Palette = PRESTIGE_PALETTE): Page {
  const roles = readRoles(page);
  const m = MARGINS(page);
  const cw = page.width - m.left - m.right;
  const next: PublisherElement[] = [];
  const heading = palette.headingFont ?? DISPLAY;
  const centre = page.width / 2;

  next.push(
    shapeElement('rec-prestige-frame-outer', { x: 24, y: 24, w: page.width - 48, h: page.height - 48 }, {
      name: 'Outer Frame',
      strokeColor: palette.primary,
      strokeWidth: 6,
      zIndex: 2,
    }),
    shapeElement('rec-prestige-frame-inner', { x: 36, y: 36, w: page.width - 72, h: page.height - 72 }, {
      name: 'Inner Frame',
      strokeColor: palette.accent,
      strokeWidth: 1.5,
      zIndex: 2,
    })
  );

  const inner: Box = { x: 72, y: 72, w: page.width - 144, h: page.height - 232 };
  const footerH = 96;
  const footerY = page.height - m.bottom - footerH;
  let cursor = inner.y;

  if (roles.kicker) {
    const kicker = placeText(
      roles.kicker,
      { x: inner.x, y: cursor, w: inner.w, h: 20 },
      {
        color: ink(palette.accent, palette.bg, 4.5),
        fontFamily: palette.bodyFont ?? BODY,
        fontSize: 12,
        minFontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 3,
        lineHeight: 1.1,
        textTransform: 'uppercase',
        align: 'center',
        verticalAlign: 'middle',
        zIndex: 5,
        fillHeight: true,
        isWordArt: false,
      }
    );
    next.push(kicker);
    cursor += 30;
  }

  if (roles.hero) {
  const heroBox: Box = {
    x: inner.x + 32, y: cursor, w: inner.w - 64, h: 120 };
    const hero = placeText(
    roles.hero,
    heroBox,
    {
    color: ink(palette.primary, palette.bg, 7),
    fontFamily: heading,
    fontSize: fitDisplay(roles.hero.text, 60, 22, heroBox.w, heroBox.h, 1.1, 1),
    minFontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
    lineHeight: 1.1,
    align: 'center',
    verticalAlign: 'middle',
    zIndex: 6,
    fillHeight: true,
    isWordArt: true,
    wordArtStyle: 'trophy-gold',
    }
    );
    next.push(hero);
    cursor += 128;
    }
    const dividerW = round(cw * 0.34);
    const sourceLine = roles.lines[0];
    if (sourceLine) {
    next.push({
    ...sourceLine,
    x: round(centre - dividerW / 2),
    y: round(cursor),
    width: dividerW,
    height: Math.max(2, sourceLine.height),
    strokeColor: palette.accent,
    zIndex: 6,
    });
    } else {
    next.push(lineElement('rec-prestige-divider', { x: centre - dividerW / 2, y: cursor, w: dividerW, h: 3 }, palette.accent, 3));
    }
    cursor += 26;
    const bandTop = cursor;
    const bandBottom = footerY - 20;
    if (roles.subs.length) {
    const stack = placeStack(
    roles.subs,
    { x: inner.x + 56, y: cursor, w: inner.w - 112, h: Math.max(48, round((bandBottom - cursor) * 0.5)) },
    {
    color: ink(palette.muted, palette.bg, 4.5),
    fontFamily: palette.bodyFont ?? BODY,
    fontSize: 16,
    minFontSize: 11,
    lineHeight: 1.5,
    align: 'center',
    verticalAlign: 'top',
    zIndex: 5,
    },
    10
    );
    next.push(...stack.elements);
    cursor = stack.bottom + 24;
    }
    // A certificate's middle band carries the picture and the particulars side by side: the seal
    // photograph on the left, the table on the right, both centred in the band that is left over.
    const bandTopUsed = Math.max(cursor, bandTop);
    const bandH = Math.max(80, bandBottom - bandTopUsed);
    const hasVisual = roles.visuals.length > 0;
    const hasTable = roles.tables.length > 0;
    const gap = 28;
    let tableBox: Box | undefined;
    if (hasVisual && hasTable) {
    const visualW = round((inner.w - gap) * 0.42);
    const tableW = inner.w - visualW - gap;
    const shown = roles.visuals[0];
    const size = clamp(round(bandH * 0.94), 90, 240);
    next.push(
    placeVisual(shown, { x: inner.x + Math.round((visualW - size) / 2), y: bandTopUsed + Math.round((bandH - size) / 2), w: size, h: size }, {
    radius: 4,
    borderColor: palette.accent,
    borderWidth: 2,
    zIndex: 3,
    })
    );
    const tableH = tableHeight(roles.tables[0], bandH);
    tableBox = {
    x: inner.x + visualW + gap,
    y: bandTopUsed + Math.round((bandH - tableH) / 2),
    w: tableW,
    h: tableH,
  };
  } else if (hasVisual) {
    const count = Math.min(2, roles.visuals.length);
    const eachW = round(Math.min((inner.w - 112 - gap * (count - 1)) / count, bandH * 1.4));
    const totalW = count * eachW + (count - 1) * gap;
    roles.visuals.slice(0, count).forEach((visual, index) => {
      next.push(
        placeVisual(
          visual,
          { x: round(centre - totalW / 2 + index * (eachW + gap)), y: round(bandTopUsed + (bandH - Math.min(bandH, round(eachW / 1.4))) / 2), w: eachW, h: Math.min(bandH, round(eachW / 1.4)) },
          { radius: 6, borderColor: palette.accent, borderWidth: 2, zIndex: 3 }
        )
      );
    });
  } else if (hasTable) {
    const tableH = tableHeight(roles.tables[0], Math.min(bandH, 220));
    tableBox = { x: inner.x + 24, y: bandTopUsed + Math.round((bandH - tableH) / 2), w: inner.w - 48, h: tableH };
  }

  const cta = roles.ctas[0];
  const ctaH = cta ? clamp(round(cta.height || 52), 40, 60) : 0;
  if (cta) {
    const ctaW = Math.min(round(cta.width || 240), round(cw * 0.34));
    next.push({
      ...cta,
      x: round(centre - ctaW / 2),
      y: round(footerY + (footerH - ctaH) / 2),
      width: ctaW,
      height: ctaH,
      fillColor: palette.primary,
      labelColor: ink('#ffffff', palette.primary, 3),
      zIndex: 7,
    });
  }

  const zones: Zones = {
    hero: { x: inner.x, y: inner.y, w: inner.w, h: 160 },
    content: tableBox ?? { x: inner.x + 24, y: bandTopUsed, w: inner.w - 48, h: bandH },
    footer: { x: m.left + 16, y: footerY + 16, w: cw - 200, h: 72 },
  };

  return {
    ...page,
    backgroundColor: palette.bg,
    backgroundGradient: undefined,
    backgroundPattern: { type: 'dots', color: palette.primary, opacity: 0.05, scale: 34, strokeWidth: 1.4, rotation: 0 },
    elements: withExtras(page, next, {
      zones,
      qr: { x: page.width - m.right - 16 - 80, y: footerY + 8, w: 80, h: 80 },
      tables: tableBox ? [tableBox] : undefined,
      seals: [
        { x: m.left + 12, y: footerY + 4, w: 84, h: 84 },
        { x: m.left + 104, y: footerY + 12, w: 68, h: 68 },
      ],
      sealRotations: [-8, 8],
      qrFg: palette.primary,
      qrBg: '#ffffff',
      ruleColor: palette.accent,
    }),
  };
}

/* ── 3. Bento Card Studio ──────────────────────────────────────────────────────────────────── */

const BENTO_PALETTE: Palette = {
  bg: '#f1f5f9',
  text: '#0f172a',
  muted: '#475569',
  primary: '#4f46e5',
  accent: '#0ea5e9',
};

/**
 * A three-by-two grid of elevated cards: type in one, the picture in another, the details strip
 * underneath. Cards share edges by construction, which is also why the suggestion scores well —
 * alignment is measured, and a grid has it by definition.
 */
function buildBentoLayout(page: Page, palette: Palette = BENTO_PALETTE): Page {
  const roles = readRoles(page);
  const m = MARGINS(page);
  const cw = page.width - m.left - m.right;
  const ch = page.height - m.top - m.bottom;
  const gap = 20;
  const next: PublisherElement[] = [];

  const leftW = round(cw * 0.58);
  const rightW = cw - leftW - gap;
  const rowOneH = round(ch * 0.37);
  const rowTwoH = round(ch * 0.3);
  const rowThreeH = ch - rowOneH - rowTwoH - gap * 2;
  const rightX = m.left + leftW + gap;
  const rowTwoY = m.top + rowOneH + gap;
  const rowThreeY = rowTwoY + rowTwoH + gap;

  const card = (id: string, box: Box, fill = '#ffffff') =>
    shapeElement(id, box, {
      name: 'Card',
      shapeType: 'rounded-rect',
      cornerRadius: 20,
      fillColor: fill,
      shadow: true,
      shadowBlur: 18,
      shadowColor: 'rgba(15,23,42,0.08)',
      zIndex: 2,
    });

  next.push(
    card('rec-bento-type-card', { x: m.left, y: m.top, w: leftW, h: rowOneH }),
    card('rec-bento-visual-card', { x: rightX, y: m.top, w: rightW, h: rowOneH }, '#e2e8f0'),
    card('rec-bento-copy-card', { x: m.left, y: rowTwoY, w: leftW, h: rowTwoH }),
    card('rec-bento-detail-card', { x: rightX, y: rowTwoY, w: rightW, h: rowTwoH }),
    card('rec-bento-strip-card', { x: m.left, y: rowThreeY, w: cw, h: rowThreeH })
  );

  const pad = 24;
  let y = m.top + pad;
  if (roles.kicker) {
    const kicker = placeText(
      roles.kicker,
      { x: m.left + pad, y, w: leftW - pad * 2, h: 20 },
      {
        color: ink(palette.primary, palette.bg, 4.5),
        fontFamily: palette.bodyFont ?? BODY,
        fontSize: 12,
        minFontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2.4,
        lineHeight: 1.1,
        textTransform: 'uppercase',
        align: 'left',
        verticalAlign: 'middle',
        zIndex: 5,
        fillHeight: true,
        isWordArt: false,
      }
    );
    next.push(kicker);
    y += 28;
  }

  const heroRule = roles.lines[0];
  if (heroRule) {
    next.push({
      ...heroRule,
      x: m.left + pad,
      y: y + 6,
      width: Math.min(round(heroRule.width), 120),
      height: Math.max(2, heroRule.height),
      strokeColor: palette.accent,
      zIndex: 5,
    });
    y += 20;
  }

  if (roles.hero) {
    const heroBox: Box = {
      x: m.left + pad, y, w: leftW - pad * 2, h: m.top + rowOneH - pad - y };
      const hero = placeText(
      roles.hero,
      heroBox,
      {
      color: ink(palette.text, '#ffffff', 7),
      fontFamily: palette.headingFont ?? GEO,
      fontSize: fitDisplay(roles.hero.text, 50, 20, heroBox.w, heroBox.h, 1.1, -0.4),
      minFontSize: 20,
      fontWeight: '800',
      lineHeight: 1.1,
      letterSpacing: -0.4,
      align: 'left',
      verticalAlign: 'top',
      zIndex: 6,
      }
      );
      next.push(hero);
      }
      if (roles.visuals.length) {
      const count = Math.min(2, roles.visuals.length);
      const eachH = round((rowOneH - 20 - (count - 1) * gap) / count);
      roles.visuals.slice(0, count).forEach((visual, index) => {
      next.push(
      placeVisual(
      visual,
      { x: rightX + 10, y: m.top + 10 + index * (eachH + gap), w: rightW - 20, h: eachH },
      { radius: 16, zIndex: 3 }
      )
      );
      });
      }
      if (roles.subs.length) {
      const stack = placeStack(
      roles.subs,
      { x: m.left + pad, y: rowTwoY + pad, w: leftW - pad * 2, h: rowTwoH - pad * 2 },
      {
      color: ink(palette.muted, '#ffffff', 4.5),
      fontFamily: palette.bodyFont ?? BODY,
      fontSize: 15,
      minFontSize: 11,
      lineHeight: 1.5,
      align: 'left',
      verticalAlign: 'top',
      zIndex: 5,
      },
      10
      );
      next.push(...stack.elements);
      }
      const cta = roles.ctas[0];
      const ctaH = cta ? clamp(round(cta.height || 52), 40, 64) : 0;
      if (cta) {
      const ctaW = Math.min(round(cta.width || 220), round(cw * 0.42));
      next.push({
      ...cta,
      x: m.left + pad,
      y: round(rowThreeY + (rowThreeH - ctaH) / 2),
      width: ctaW,
      height: ctaH,
      fillColor: palette.primary,
      labelColor: ink('#ffffff', palette.primary, 3),
      zIndex: 7,
      });
      }
      // Stickers cling to the photo card's corner, where a sticker would actually be stuck.
      roles.stickers.slice(0, 2).forEach((sticker, index) => {
      const size = index === 0 ? 88 : 64;
      next.push(
      placeSeal(
      sticker,
      {
      x: rightX + rightW - size - 8 - index * 26,
      y: m.top + rowOneH - size - 4 + index * 18,
      w: size,
      h: size,
      },
      index === 0 ? -8 : 7
      )
      );
      });
      const tableBox: Box = {
      x: rightX + 16,
      y: rowTwoY + 16,
      w: rightW - 32,
      h: rowTwoH - 32,
    };

  const zones: Zones = {
    hero: { x: m.left + pad, y: m.top + pad, w: leftW - pad * 2, h: rowOneH - pad * 2 },
    content: tableBox,
    footer: { x: m.left + pad, y: rowThreeY + 16, w: cw - pad * 2 - 112, h: rowThreeH - 32 },
  };

  return {
    ...page,
    backgroundColor: palette.bg,
    backgroundGradient: undefined,
    backgroundPattern: undefined,
    elements: withExtras(page, next, {
      zones,
      qr: { x: page.width - m.right - pad - 80, y: round(rowThreeY + (rowThreeH - 80) / 2), w: 80, h: 80 },
      tables: [tableBox],
      seals: [
        { x: m.left + pad, y: round(rowThreeY + rowThreeH - 88), w: 72, h: 72 },
      ],
      sealRotations: [-6],
      qrFg: palette.text,
      qrBg: '#ffffff',
      ruleColor: palette.primary,
    }),
  };
}

/* ── 4. Playful Classroom ─────────────────────────────────────────────────────────────────── */

const PLAYFUL_PALETTE: Palette = {
  bg: '#fffbeb',
  text: '#1e3a8a',
  muted: '#78350f',
  primary: '#2563eb',
  accent: '#f59e0b',
  headingFont: ROUND,
  bodyFont: SOFT,
};

/**
 * Cream paper, chunky rounded type and photos pinned at a slight angle — the classroom wall.
 *
 * The tilt is ±2°, not a collage's ±8°: enough that the print reads as pinned rather than placed,
 * little enough that the type beside it does not look wrong.
 */
function buildPlayfulLayout(page: Page, palette: Palette = PLAYFUL_PALETTE): Page {
  const roles = readRoles(page);
  const m = MARGINS(page);
  const cw = page.width - m.left - m.right;
  const next: PublisherElement[] = [];
  const flow: PublisherElement[] = [];
  const centre = page.width / 2;
  const footerH = 96;
  const footerY = page.height - m.bottom - footerH;

  // A polaroid or a seal pinned to the top corner needs a gutter, or the centred type runs under it.
  const hasPhoto = roles.visuals.length > 0;
  const typeX = m.left;
  const typeW = hasPhoto || roles.stickers.length ? cw - (hasPhoto ? 200 : 96) : cw;

  // The picture is a print taped to the wall: framed in white, tilted a few degrees, top right.
  if (hasPhoto) {
    const count = Math.min(2, roles.visuals.length);
    const size = count > 1 ? 150 : 186;
    roles.visuals.slice(0, count).forEach((visual, index) => {
      next.push(
        placeVisual(
          visual,
          {
            x: page.width - m.right - size - index * 26,
            y: m.top - 6 + index * Math.round(size * 0.62),
            w: size,
            h: Math.round(size * 0.78),
          },
          {
            radius: 4,
            borderColor: '#ffffff',
            borderWidth: 7,
            shadow: true,
            borderArt: 'puffy-clay',
            rotation: index === 0 ? 3 : -4,
            zIndex: 6,
          }
        )
      );
    });
  }

  let y = m.top;
  const playRule = roles.lines[0];
  if (roles.kicker) {
    const kicker = placeText(
      roles.kicker,
      { x: typeX, y, w: typeW, h: 22 },
      {
        color: ink('#0f766e', palette.bg, 4.5),
        fontFamily: palette.headingFont ?? ROUND,
        fontSize: 13,
        minFontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2,
        lineHeight: 1.15,
        textTransform: 'uppercase',
        align: 'center',
        verticalAlign: 'middle',
        zIndex: 5,
        fillHeight: true,
        isWordArt: false,
      }
    );
    flow.push(kicker);
    y += 24;
    if (playRule) {
      flow.push({
        ...playRule,
        x: round(typeX + typeW / 2 - 32),
        y,
        width: 64,
        height: Math.max(3, playRule.height),
        strokeColor: palette.accent,
        zIndex: 5,
      });
      y += 12;
    }
    y += 8;
  }

  if (roles.hero) {
    const heroBox: Box = {
      x: typeX + 16, y, w: typeW - 32, h: 124 };
      const hero = placeText(
      roles.hero,
      heroBox,
      {
      color: ink(palette.text, palette.bg, 7),
      fontFamily: palette.headingFont ?? ROUND,
      fontSize: fitDisplay(roles.hero.text, 56, 22, heroBox.w, heroBox.h, 1.12, 0),
      minFontSize: 22,
      fontWeight: 'bold',
      lineHeight: 1.12,
      letterSpacing: 0,
      align: 'center',
      verticalAlign: 'middle',
      zIndex: 6,
      fillHeight: true,
      isWordArt: true,
      wordArtStyle: 'champs-basa-blue',
      rotation: -2,
      }
      );
      flow.push(hero);
      y += 136;
      }
      if (roles.subs.length) {
      const stack = placeStack(
      roles.subs,
      { x: typeX + 64, y, w: typeW - 128, h: 96 },
      {
      color: ink(palette.muted, palette.bg, 4.5),
      fontFamily: palette.bodyFont ?? SOFT,
      fontSize: 17,
      minFontSize: 11,
      lineHeight: 1.45,
      align: 'center',
      verticalAlign: 'top',
      zIndex: 5,
      },
      8
      );
      flow.push(...stack.elements);
      y = stack.bottom + 20;
      }
      const reserve = roles.tables.length ? tableHeight(roles.tables[0], 150) : 0;
      const tableBox: Box | undefined = reserve
      ? { x: m.left + 96, y: round(y), w: cw - 192, h: reserve }
      : undefined;
      if (reserve) y += reserve + 22;
      const cta = roles.ctas[0];
      const ctaH = cta ? clamp(round(cta.height || 52), 40, 62) : 0;
      if (cta) {
      const ctaW = Math.min(round(cta.width || 240), round(cw * 0.5));
      flow.push({
      ...cta,
      x: round(centre - ctaW / 2),
      y: round(Math.min(y, footerY - 12 - ctaH)),
      width: ctaW,
      height: ctaH,
      fillColor: palette.accent,
      labelColor: ink('#1c1917', palette.accent, 4.5),
      zIndex: 7,
      });
      }
      // Centre the column in the air it has: a classroom poster hangs in the middle of the wall.
      const lastBottom = flow.reduce((acc, el) => Math.max(acc, el.y + el.height), m.top);
      const dy = Math.round(clamp((footerY - 12 - lastBottom) / 2, 0, 96));
      next.push(...flow.map((el) => (dy ? { ...el, y: round(el.y + dy) } : el)));
      roles.stickers.slice(0, 2).forEach((sticker, index) => {
      const size = index === 0 ? 96 : 72;
      next.push(
      placeSeal(
      sticker,
      {
      x: hasPhoto ? m.left + 4 + index * (size + 10) : index === 0 ? page.width - m.right - size - 4 : m.left + 4,
      y: hasPhoto ? footerY + 4 : index === 0 ? m.top + 2 : footerY - size - 4,
      w: size,
      h: size,
      },
      index === 0 ? 6 : -7
      )
      );
      });
      const zones: Zones = {
      hero: { x: typeX + 16, y: m.top, w: typeW - 32, h: 150 },
      content: tableBox ? { ...tableBox, y: round(tableBox.y + dy) } : { x: m.left + 96, y: round(y + dy), w: cw - 192, h: 120 },
      footer: { x: m.left + 24, y: footerY + 8, w: cw - 48 - 96, h: 80 },
    };

  return {
    ...page,
    backgroundColor: palette.bg,
    backgroundGradient: undefined,
    backgroundPattern: { type: 'dots', color: palette.accent, opacity: 0.06, scale: 30, strokeWidth: 1.6, rotation: 0 },
    elements: withExtras(page, next, {
      zones,
      qr: { x: page.width - m.right - 4 - 80, y: footerY + 4, w: 80, h: 80 },
      tables: tableBox ? [zones.content] : undefined,
      qrFg: ink(palette.text, palette.bg, 7),
      qrBg: '#ffffff',
      ruleColor: palette.accent,
    }),
  };
}

/* ── 5. Editorial Split (both sides) ──────────────────────────────────────────────────────── */

/**
 * The split, rebuilt with a typographic hierarchy instead of three sizes of the same thing: a
 * tracked 11px eyebrow, a display headline at 1.08 line-height, and body copy at 1.45. The visual
 * column is a card — rounded, shadowed, over a colour block — so the picture reads as placed
 * rather than pasted.
 */
function buildSplitLayout(page: Page, side: 'left' | 'right', palette: Palette = WAVE_PALETTE): Page {
  const roles = readRoles(page);
  const m = MARGINS(page);
  const cw = page.width - m.left - m.right;
  const ch = page.height - m.top - m.bottom;
  const next: PublisherElement[] = [];

  const hasVisual = roles.visuals.length > 0;
  const colGap = 32;
  const visualW = hasVisual ? round(cw * 0.46) : 0;
  const textW = hasVisual ? cw - visualW - colGap : round(cw * 0.8);
  const visualX = side === 'left' ? m.left : page.width - m.right - visualW;
  const textX = side === 'left' ? m.left + visualW + colGap : m.left;
  const footerH = 88;
  const footerY = page.height - m.bottom - footerH;
  const limit = footerY - 16;

  let y = m.top;
  next.push(
    shapeElement('rec-split-rule', { x: textX, y, w: 56, h: 5 }, {
      name: 'Accent Rule',
      fillColor: palette.accent,
      zIndex: 6,
    })
  );
  y += 20;

  if (roles.kicker) {
    const kicker = placeText(
      roles.kicker,
      { x: textX, y, w: textW, h: 20 },
      {
        color: ink(palette.accent, palette.bg, 4),
        fontFamily: palette.bodyFont ?? BODY,
        fontSize: 11,
        minFontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2.5,
        lineHeight: 1.1,
        textTransform: 'uppercase',
        align: 'left',
        verticalAlign: 'middle',
        zIndex: 5,
        fillHeight: true,
        isWordArt: false,
      }
    );
    next.push(kicker);
    y += 26;
  }

  if (roles.hero) {
  const heroBox: Box = {
    x: textX, y, w: textW, h: round(ch * 0.4) };
    const hero = placeText(
    roles.hero,
    heroBox,
    {
    color: ink(palette.text, palette.bg, 7),
    fontFamily: palette.headingFont ?? DISPLAY,
    fontSize: fitDisplay(roles.hero.text, 62, 22, heroBox.w, heroBox.h, 1.08, -0.6),
    minFontSize: 22,
    fontWeight: 'bold',
    lineHeight: 1.08,
    letterSpacing: -0.6,
    align: 'left',
    verticalAlign: 'top',
    zIndex: 6,
    }
    );
    next.push(hero);
    y += hero.height + 18;
    }
    const divider = roles.lines[0];
    if (divider) {
    next.push({
    ...divider,
    x: textX,
    y: round(y),
    width: Math.min(textW, 220),
    height: Math.max(2, divider.height),
    strokeColor: palette.accent,
    zIndex: 6,
    });
    y += 20;
    }
    const reserve = roles.tables.length ? tableHeight(roles.tables[0], round(ch * 0.32)) : 0;
    const tableBox: Box | undefined = reserve
    ? { x: textX, y: round(limit - reserve), w: textW, h: reserve }
    : undefined;
    const copyLimit = tableBox ? tableBox.y - 20 : limit;
    if (roles.subs.length) {
    const stack = placeStack(
    roles.subs,
    { x: textX, y, w: textW, h: Math.max(48, copyLimit - y) },
    {
    color: ink(palette.muted, palette.bg, 4.5),
    fontFamily: palette.bodyFont ?? BODY,
    fontSize: 16,
    minFontSize: 11,
    lineHeight: 1.45,
    align: 'left',
    verticalAlign: 'top',
    zIndex: 5,
    },
    12
    );
    next.push(...stack.elements);
    y = stack.bottom + 22;
    }
    const cta = roles.ctas[0];
    const ctaH = cta ? clamp(round(cta.height || 52), 40, 62) : 0;
    if (cta) {
    const ctaW = Math.min(round(cta.width || 220), round(textW * 0.72));
    next.push({
    ...cta,
    x: textX,
    y: round(clamp(y, m.top, copyLimit - ctaH)),
    width: ctaW,
    height: ctaH,
    fillColor: palette.primary,
    labelColor: ink('#ffffff', palette.primary, 3),
    zIndex: 7,
    });
    }
    if (hasVisual) {
    next.push(
    shapeElement('rec-split-visual-backing', { x: visualX - 16, y: m.top - 16, w: visualW + 32, h: ch + 32 }, {
    name: 'Colour Block',
    shapeType: 'rounded-rect',
    cornerRadius: 28,
    fillColor: mixHex(palette.bg, palette.accent, 0.16),
    zIndex: 1,
    })
    );
    const count = Math.min(2, roles.visuals.length);
    const gap = 16;
    const totalH = round(ch * (count > 1 ? 0.72 : 0.84));
    const eachH = round((totalH - gap * (count - 1)) / count);
    const topOffset = round((ch - totalH) / 2);
    roles.visuals.slice(0, count).forEach((visual, index) => {
    next.push(
    placeVisual(
    visual,
    { x: visualX, y: m.top + topOffset + index * (eachH + gap), w: visualW, h: eachH },
    { radius: 16, shadow: true, zIndex: 3 }
    )
    );
    });
    }
    const zones: Zones = {
    hero: { x: textX, y: m.top, w: textW, h: Math.round(ch * 0.3) },
    content: tableBox ?? { x: textX, y: copyLimit - 120, w: textW, h: 110 },
    footer: { x: textX, y: footerY + 8, w: textW, h: 72 },
  };

  return {
    ...page,
    backgroundColor: palette.bg,
    backgroundGradient: undefined,
    backgroundPattern: undefined,
    elements: withExtras(page, next, {
      zones,
      qr: { x: textX + textW - 80, y: footerY + 8, w: 72, h: 72 },
      tables: tableBox ? [tableBox] : undefined,
      seals: [{ x: textX, y: footerY + 8, w: 72, h: 72 }],
      sealRotations: [-6],
      qrFg: palette.text,
      qrBg: '#ffffff',
      ruleColor: palette.accent,
    }),
  };
}

/* ── 6. Dark Executive ────────────────────────────────────────────────────────────────────── */

const DARK_PALETTE: Palette = {
  bg: '#0f172a',
  text: '#f8fafc',
  muted: '#cbd5e1',
  primary: '#6366f1',
  accent: '#38bdf8',
  headingFont: GEO,
  bodyFont: BODY,
};

/**
 * Deep slate, an accent bar down the left edge and a wash behind the type.
 *
 * The WordArt is only offered to short headlines: `synth-chrome` on a sentence is unreadable, and
 * a style that has to be explained is worse than none.
 */
function buildDarkExecutiveLayout(page: Page, palette: Palette = DARK_PALETTE): Page {
  const roles = readRoles(page);
  const m = MARGINS(page);
  const cw = page.width - m.left - m.right;
  const ch = page.height - m.top - m.bottom;
  const next: PublisherElement[] = [];

  next.push(
    shapeElement('rec-dark-accent-bar', { x: 0, y: 0, w: 12, h: page.height }, {
      name: 'Accent Bar',
      fillType: 'linear-gradient',
      fillColor: palette.accent,
      gradientColor2: palette.primary,
      gradientAngle: 180,
      zIndex: 2,
    }),
    // A full-bleed gradient rather than a panel: the light falls off instead of ending on an edge.
    shapeElement('rec-dark-wash', { x: 0, y: 0, w: page.width, h: page.height }, {
      name: 'Light Wash',
      fillType: 'linear-gradient',
      fillColor: mixHex(palette.bg, palette.accent, 0.22),
      gradientColor2: palette.bg,
      gradientAngle: 70,
      opacity: 0.7,
      zIndex: 1,
    })
  );

  const hasVisual = roles.visuals.length > 0;
  const gap = 32;
  const textW = hasVisual ? round(cw * 0.54) : round(cw * 0.76);
  const textX = m.left + 24;
  const visualW = hasVisual ? cw - textW - gap : 0;
  const visualX = page.width - m.right - visualW;
  const footerH = 88;
  const footerY = page.height - m.bottom - footerH;
  const limit = footerY - 16;

  let y = m.top + 8;
  if (roles.kicker) {
    const kicker = placeText(
      roles.kicker,
      { x: textX, y, w: textW, h: 20 },
      {
        color: ink('#fbbf24', palette.bg, 4.5),
        fontFamily: palette.bodyFont ?? BODY,
        fontSize: 12,
        minFontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2.4,
        lineHeight: 1.1,
        textTransform: 'uppercase',
        align: 'left',
        verticalAlign: 'middle',
        zIndex: 5,
        fillHeight: true,
        isWordArt: false,
      }
    );
    next.push(kicker);
    y += 28;
  }

  if (roles.hero) {
    const short = roles.hero.text.replace(/\s+/g, ' ').trim().length <= 30;
  const heroBox: Box = {
    x: textX, y, w: textW, h: round(ch * 0.38) };
    const hero = placeText(
    roles.hero,
    heroBox,
    {
    color: ink(palette.text, palette.bg, 7),
    fontFamily: palette.headingFont ?? GEO,
    fontSize: fitDisplay(roles.hero.text, 60, 20, heroBox.w, heroBox.h, 1.06, -0.8),
    minFontSize: 20,
    fontWeight: '900',
    lineHeight: 1.06,
    letterSpacing: -0.8,
    align: 'left',
    verticalAlign: 'top',
    zIndex: 6,
    isWordArt: short,
    // Neon is one of the styles the library flags for dark grounds; the chrome styles read as
    // ink on slate.
    wordArtStyle: short ? 'neon-glow' : undefined,
    }
    );
    next.push(hero);
    y += hero.height + 18;
    }
    const divider = roles.lines[0];
    if (divider) {
    next.push({
    ...divider,
    x: textX,
    y: round(y),
    width: Math.min(textW, 200),
    height: Math.max(2, divider.height),
    strokeColor: palette.accent,
    zIndex: 6,
    });
    y += 18;
    }
    const reserve = roles.tables.length ? tableHeight(roles.tables[0], round(ch * 0.3)) : 0;
    const tableBox: Box | undefined = reserve
    ? { x: textX, y: round(limit - reserve), w: textW, h: reserve }
    : undefined;
    const copyLimit = tableBox ? tableBox.y - 20 : limit;
    if (roles.subs.length) {
    const stack = placeStack(
    roles.subs,
    { x: textX, y, w: textW, h: Math.max(48, copyLimit - y) },
    {
    color: ink(palette.muted, palette.bg, 4.5),
    fontFamily: palette.bodyFont ?? BODY,
    fontSize: 16,
    minFontSize: 11,
    lineHeight: 1.5,
    align: 'left',
    verticalAlign: 'top',
    zIndex: 5,
    },
    12
    );
    next.push(...stack.elements);
    y = stack.bottom + 22;
    }
    const cta = roles.ctas[0];
    const ctaH = cta ? clamp(round(cta.height || 52), 40, 62) : 0;
    if (cta) {
    const ctaW = Math.min(round(cta.width || 220), round(textW * 0.72));
    next.push({
    ...cta,
    x: textX,
    y: round(clamp(y, m.top, copyLimit - ctaH)),
    width: ctaW,
    height: ctaH,
    fillColor: '#fbbf24',
    labelColor: ink('#111827', '#fbbf24', 4.5),
    zIndex: 7,
    });
    }
    if (hasVisual) {
    const count = Math.min(2, roles.visuals.length);
    const totalH = round(ch * (count > 1 ? 0.74 : 0.86));
    const eachH = round((totalH - (count - 1) * 16) / count);
    const topOffset = round((ch - totalH) / 2);
    roles.visuals.slice(0, count).forEach((visual, index) => {
    next.push(
    placeVisual(
    visual,
    { x: visualX, y: m.top + topOffset + index * (eachH + 16), w: visualW, h: eachH },
    { radius: 18, shadow: true, zIndex: 3 }
    )
    );
    });
    }
    const zones: Zones = {
    hero: { x: textX, y: m.top, w: textW, h: Math.round(ch * 0.3) },
    content: tableBox ?? { x: textX, y: copyLimit - 120, w: textW, h: 110 },
    footer: { x: textX, y: footerY + 8, w: textW, h: 72 },
  };

  return {
    ...page,
    backgroundColor: palette.bg,
    backgroundGradient: { color1: '#0f172a', color2: '#1e293b', angle: 135 },
    backgroundPattern: undefined,
    elements: withExtras(page, next, {
      zones,
      qr: { x: textX + textW - 72, y: footerY + 8, w: 72, h: 72 },
      tables: tableBox ? [tableBox] : undefined,
      seals: [{ x: textX, y: footerY + 8, w: 72, h: 72 }],
      sealRotations: [-6],
      qrFg: '#0f172a',
      qrBg: '#f8fafc',
      ruleColor: palette.accent,
    }),
  };
}

/* ── the full-bleed photo page (kept: the one recipe built around a photograph) ────────────── */

function buildHeroOverlayLayout(page: Page): Page | null {
  const roles = readRoles(page);
  if (roles.visuals.length === 0) return null;
  // A table would turn the card into a spreadsheet under a photograph; those pages have the grid
  // recipes instead, so this one only runs when the page really is a picture with words on it.
  if (roles.tables.length > 0) return null;

  const m = MARGINS(page);
  const cw = page.width - m.left - m.right;
  const next: PublisherElement[] = [];

  next.push(placeVisual(roles.visuals[0], { x: 0, y: 0, w: page.width, h: page.height }, { radius: 0, zIndex: 1 }));
  // A second picture rides above the card as a floating print.
  if (roles.visuals.length > 1) {
    const printW = round(page.width * 0.26);
    const printH = round(printW * 0.72);
    next.push(
      placeVisual(roles.visuals[1], { x: page.width - m.right - printW, y: m.top + 24, w: printW, h: printH }, {
        radius: 10,
        shadow: true,
        borderColor: '#ffffff',
        borderWidth: 6,
        rotation: 3,
        zIndex: 4,
      })
    );
  }

  const cardH = round(page.height * 0.5);
  const cardY = page.height - cardH - m.bottom;
  next.push(
    shapeElement('rec-hero-scrim', { x: m.left, y: cardY, w: cw, h: cardH }, {
      name: 'Overlay Scrim',
      shapeType: 'rounded-rect',
      cornerRadius: 20,
      fillColor: '#0b1220',
      opacity: 0.86,
      strokeColor: 'rgba(255,255,255,0.18)',
      strokeWidth: 1,
      zIndex: 2,
    })
  );

  let y = cardY + 32;
  if (roles.kicker) {
    next.push(
      placeText(
        roles.kicker,
        { x: m.left + 32, y, w: cw - 64, h: 20 },
        {
          color: '#fbbf24',
          fontFamily: BODY,
          fontSize: 12,
          minFontSize: 10,
          fontWeight: 'bold',
          letterSpacing: 2.4,
          lineHeight: 1.1,
          textTransform: 'uppercase',
          align: 'left',
          verticalAlign: 'middle',
          zIndex: 4,
          fillHeight: true,
          isWordArt: false,
        }
      )
    );
    y += 28;
  }

  const cta = roles.ctas[0];
  const ctaH = cta ? clamp(round(cta.height || 52), 40, 60) : 0;
  const ctaBand = cta ? ctaH + 24 : 0;
  const copyLimit = cardY + cardH - 28 - ctaBand;

  if (roles.hero) {
  const heroBox: Box = {
    x: m.left + 32, y, w: cw - 64, h: round(cardH * 0.36) };
    const hero = placeText(
    roles.hero,
    heroBox,
    {
    color: '#ffffff',
    fontFamily: GEO,
    fontSize: fitDisplay(roles.hero.text, 54, 20, heroBox.w, heroBox.h, 1.06, -0.5),
    minFontSize: 20,
    fontWeight: '900',
    lineHeight: 1.06,
    letterSpacing: -0.5,
    align: 'left',
    verticalAlign: 'top',
    zIndex: 5,
    }
    );
    next.push(hero);
    y += hero.height + 14;
    }
    if (roles.subs.length) {
    const stack = placeStack(
    roles.subs,
    { x: m.left + 32, y, w: round(cw * 0.62), h: Math.max(28, copyLimit - y) },
    {
    color: '#dbe3ee',
    fontFamily: BODY,
    fontSize: 15,
    minFontSize: 10,
    lineHeight: 1.45,
    align: 'left',
    verticalAlign: 'top',
    zIndex: 4,
    },
    8
    );
    next.push(...stack.elements);
    }
    if (cta) {
    const ctaW = Math.min(round(cta.width || 230), round(cw * 0.4));
    next.push({
    ...cta,
    x: m.left + 32,
    y: round(cardY + cardH - 28 - ctaH),
    width: ctaW,
    height: ctaH,
    fillColor: '#fbbf24',
    labelColor: ink('#111827', '#fbbf24', 4.5),
    zIndex: 7,
    });
    }
    const zones: Zones = {
    hero: { x: m.left + 32, y: cardY + 32, w: cw - 64, h: round(cardH * 0.4) },
    content: { x: m.left + 32, y: copyLimit - 90, w: round(cw * 0.62), h: 84 },
    footer: { x: m.left + 32, y: cardY + cardH - 96, w: 200, h: 72 },
  };

  return {
    ...page,
    backgroundColor: '#0b1220',
    backgroundGradient: undefined,
    backgroundPattern: undefined,
    elements: withExtras(page, next, {
      zones,
      // The code sits on its own white plate over the photograph, clear of the card.
      qr: { x: page.width - m.right - 16 - 84, y: m.top + 24, w: 84, h: 84 },
      seals: [
        { x: page.width - m.right - 96, y: cardY + cardH - 110, w: 88, h: 88 },
        { x: page.width - m.right - 190, y: cardY + cardH - 84, w: 60, h: 60 },
      ],
      sealRotations: [-9, 8],
      qrFg: '#0b1220',
      qrBg: '#ffffff',
      ruleColor: '#fbbf24',
    }),
  };
}

/* ── palette swaps ────────────────────────────────────────────────────────────────────────── */

/**
 * Recolours a page for a theme, without demolishing what makes it readable.
 *
 * Three rules, learned from what the old version got wrong:
 *   - a shape that only strokes is a **frame**, not a surface — it keeps its ink;
 *   - a near-white or very light fill is a **card**, so it is tinted with 7% of the accent rather
 *     than being painted over with the primary;
 *   - WordArt paints its own colour ramp, so recolouring the fallback `color` under it is what made
 *     theme swaps turn a gold award into mush. It is left alone, family included.
 */
function applyPaletteToElements(elements: PublisherElement[], palette: Palette): PublisherElement[] {
  return elements.map((el): PublisherElement => {
    if (el.type === 'text') {
      if (el.isWordArt) return el;
      const isHeading = (el.fontSize || 16) >= 22;
      const ground = palette.bg;
      const chosen = isHeading ? palette.text : palette.muted;
      return {
        ...el,
        color: ink(chosen, ground, isHeading ? 4.5 : 4.5),
        fontFamily: isHeading ? palette.headingFont || el.fontFamily : palette.bodyFont || el.fontFamily,
      };
    }

    if (el.type === 'shape') {
      const fill = el.fillColor;
      // Decoration: a frame or a rule that only strokes.
      if (!fill || fill === 'transparent' || fill === 'none') return el;
      // A gradient is its own colour decision; re-tinting it flattens it.
      if (el.fillType === 'linear-gradient' || el.fillType === 'pattern') return el;

      const area = el.width * el.height;
      const light = relativeLuminance(fill);

      if (light > 0.86) {
        // Card surface: a whisper of the accent, so white stays white and still belongs.
        return { ...el, fillColor: mixHex('#ffffff', palette.accent, 0.07) };
      }
      if (area > 120_000) {
        // Large panel: a tinted primary, not the pure brand colour.
        return { ...el, fillColor: mixHex(palette.primary, '#ffffff', 0.1) };
      }
      return { ...el, fillColor: palette.accent };
    }

    return el;
  });
}

/* ── the panel's list ─────────────────────────────────────────────────────────────────────── */

const PALETTES = {
  wave: WAVE_PALETTE,
  prestige: PRESTIGE_PALETTE,
  bento: BENTO_PALETTE,
  playful: PLAYFUL_PALETTE,
  splitLeft: { bg: '#ffffff', text: '#0f172a', muted: '#475569', primary: '#4f46e5', accent: '#4f46e5' },
  splitRight: { bg: '#f8fafc', text: '#1e293b', muted: '#64748b', primary: '#0284c7', accent: '#0ea5e9' },
  dark: DARK_PALETTE,
} as const;

export function generateDesignRecommendations(
  page: Page,
  advice?: AIDesignAdvice | null
): DesignRecommendation[] {
  const recs: DesignRecommendation[] = [
    {
      id: 'wave-hero',
      title: 'Wave Banner Hero',
      subtitle: 'Gradient wave header, headline riding inside it',
      category: 'layouts',
      badge: 'Hero',
      previewPage: buildWaveHeroLayout(page, PALETTES.wave),
    },
    {
      id: 'bento',
      title: 'Bento Card Studio',
      subtitle: 'Elevated cards: type, photo and a details strip',
      category: 'layouts',
      badge: 'Grid',
      previewPage: buildBentoLayout(page, PALETTES.bento),
    },
    {
      id: 'split-left',
      title: 'Editorial Split Left',
      subtitle: 'Picture left, a real typographic hierarchy right',
      category: 'layouts',
      badge: 'Layout',
      previewPage: buildSplitLayout(page, 'left', PALETTES.splitLeft),
    },
    {
      id: 'split-right',
      title: 'Editorial Split Right',
      subtitle: 'Headline-first left, framed picture right',
      category: 'layouts',
      badge: 'Layout',
      previewPage: buildSplitLayout(page, 'right', PALETTES.splitRight),
    },
    {
      id: 'prestige-frame',
      title: 'Prestige Framed',
      subtitle: 'Ivory paper, double frame, gold rule',
      category: 'color-dark',
      badge: 'Prestige',
      previewPage: buildPrestigeFrameLayout(page, PALETTES.prestige),
    },
    {
      id: 'playful',
      title: 'Playful Classroom',
      subtitle: 'Cream paper, chunky type, pinned photos',
      category: 'color-dark',
      badge: 'Playful',
      previewPage: buildPlayfulLayout(page, PALETTES.playful),
    },
    {
      id: 'dark',
      title: 'Midnight Executive',
      subtitle: 'Deep slate, accent bar, high-contrast type',
      category: 'color-dark',
      badge: 'Dark',
      previewPage: buildDarkExecutiveLayout(page, PALETTES.dark),
    },
  ];

  const overlay = buildHeroOverlayLayout(page);
  if (overlay) {
    recs.push({
      id: 'hero-overlay',
      title: 'Full-Bleed Hero',
      subtitle: 'Edge-to-edge photo with a contrast card',
      category: 'photo',
      badge: 'Photo',
      previewPage: overlay,
    });
  }

  if (advice) {
    const base: Palette = {
      bg: advice.bg,
      text: advice.text,
      muted: ink(mixHex(advice.text, advice.bg, 0.35), advice.bg, 4.5),
      primary: advice.primary,
      accent: advice.accent,
      headingFont: advice.headingFont,
      bodyFont: advice.bodyFont,
    };
    // If the advice landed on a recipe that is already on the shelf, the card would be a clone of
    // it. Nudge the palette along the advice's own accent so the custom take is visibly its own.
    const duplicate = recs.some((rec) => rec.id === advice.preferredLayout);
    const palette: Palette = duplicate
      ? {
          ...base,
          bg: mixHex(base.bg, base.accent, 0.05),
          primary: mixHex(base.primary, base.accent, 0.3),
          accent: mixHex(base.accent, base.primary, 0.25),
        }
      : base;
    recs.unshift({
      id: 'ai-custom-vibe',
      title: advice.vibeTitle,
      subtitle: `${advice.headingFont} + ${advice.bodyFont}`,
      category: 'color-dark',
      badge: advice.source === 'gemini' ? 'Gemini AI' : 'Smart Match',
      previewPage: buildAdvicePage(page, advice.preferredLayout, palette),
    });
  }

  return recs;
}

/** The advice's palette pushed through the layout it asked for. */
function buildAdvicePage(page: Page, layout: DesignLayoutId, palette: Palette): Page {
  switch (layout) {
    case 'prestige-frame':
    case 'centered':
      return buildPrestigeFrameLayout(page, palette);
    case 'bento':
    case 'swiss':
      return buildBentoLayout(page, palette);
    case 'playful':
      return buildPlayfulLayout(page, palette);
    case 'split-left':
      return buildSplitLayout(page, 'left', palette);
    case 'split-right':
      return buildSplitLayout(page, 'right', palette);
    case 'dark':
      return buildDarkExecutiveLayout(page, { ...palette, bg: palette.bg, text: palette.text });
    case 'hero-overlay': {
      const overlay = buildHeroOverlayLayout(page);
      if (overlay) return overlay;
      return buildWaveHeroLayout(page, palette);
    }
    case 'wave-hero':
    default:
      return buildWaveHeroLayout(page, palette);
  }
}

/* ── advice from keywords, and from a model ───────────────────────────────────────────────── */

const LAYOUT_IDS: DesignLayoutId[] = [
  'wave-hero',
  'prestige-frame',
  'bento',
  'playful',
  'split-left',
  'split-right',
  'dark',
  'hero-overlay',
];

const SAFE_FALLBACK_FONT = BODY;

/** A family the app actually loads, or the body face. */
function loadedFamily(candidate: string | undefined, fallback: string): string {
  if (!candidate) return fallback;
  const name = String(candidate).trim();
  if (LOADED_FAMILIES.has(name)) return name;
  const match = GOOGLE_FONTS_CATALOG.find((font) => font.family.toLowerCase() === name.toLowerCase());
  return match ? match.family : fallback;
}

/**
 * The keyless path: a keyword table that knows what school certificates, reading corners and dark
 * tech launches actually look like.
 *
 * Order matters — "DepEd reading certificate" is a certificate first, so the prestige rules are
 * tested before the playful ones and the playful ones before the generic moods.
 */
export function localKeywordDesignAdvice(prompt: string): AIDesignAdvice {
  const p = (prompt || '').toLowerCase();

  // Certificates, awards and anything a school signs: framed, serif, gold.
  if (/deped|certificat|cert\b|recognition|award|academic|honor|honour|graduat|commencement|school|teacher|adviser|principal|diploma/.test(p)) {
    return {
      vibeTitle: 'Academic Prestige',
      bg: '#fdfbf7',
      primary: '#1e3a8a',
      accent: '#d97706',
      text: '#1e293b',
      headingFont: DISPLAY,
      bodyFont: BODY,
      preferredLayout: /kid|child|kinder|grade [1-3]|playful|fun/.test(p) ? 'playful' : 'prestige-frame',
      source: 'local',
    };
  }
  // Reading corners, kids' pages, parties: cream, chunky rounded type, pinned pictures.
  if (/read|kid|child|classroom|playful|fun|birthday|party|festival|fiesta|nursery|toddler|sticker/.test(p)) {
    return {
      vibeTitle: 'Playful Classroom',
      bg: '#fffbeb',
      primary: '#2563eb',
      accent: '#f59e0b',
      text: '#1e3a8a',
      headingFont: ROUND,
      bodyFont: SOFT,
      preferredLayout: 'playful',
      source: 'local',
    };
  }
  if (/dark|tech|cyber|gaming|neon|night|startup|launch|saas|developer|ai\b/.test(p)) {
    return {
      vibeTitle: 'Midnight Cyber Tech',
      bg: '#0f172a',
      primary: '#6366f1',
      accent: '#38bdf8',
      text: '#f8fafc',
      headingFont: GEO,
      bodyFont: BODY,
      preferredLayout: 'dark',
      source: 'local',
    };
  }
  if (/product|app|catalog|menu|pricing|dashboard|feature|portfolio|case study|bento/.test(p)) {
    return {
      vibeTitle: 'Bento Product Studio',
      bg: '#f1f5f9',
      primary: '#4f46e5',
      accent: '#0ea5e9',
      text: '#0f172a',
      headingFont: GEO,
      bodyFont: BODY,
      preferredLayout: 'bento',
      source: 'local',
    };
  }
  if (/eco|nature|green|organic|garden|sustainab/.test(p)) {
    return {
      vibeTitle: 'Organic Botanical',
      bg: '#f0fdf4',
      primary: '#15803d',
      accent: '#65a30d',
      text: '#14532d',
      headingFont: 'Merriweather',
      bodyFont: BODY,
      preferredLayout: 'bento',
      source: 'local',
    };
  }
  if (/editorial|magazine|blog|article|profile|story|interview/.test(p)) {
    return {
      vibeTitle: 'Editorial Feature',
      bg: '#ffffff',
      primary: '#111827',
      accent: '#e11d48',
      text: '#0f172a',
      headingFont: DISPLAY,
      bodyFont: BODY,
      preferredLayout: 'split-right',
      source: 'local',
    };
  }
  return {
    vibeTitle: (prompt || '').trim().slice(0, 24) || 'Modern Studio',
    bg: '#f8fafc',
    primary: '#4f46e5',
    accent: '#06b6d4',
    text: '#0f172a',
    headingFont: GEO,
    bodyFont: BODY,
    preferredLayout: 'wave-hero',
    source: 'local',
  };
}

/** The instruction the model is given. Exported so the wording can be tested without a network. */
export function designAdvicePrompt(textSummary: string, prompt: string): string {
  return [
    'You are a graphic designer choosing a layout for a desktop publishing app.',
    `Page text: "${textSummary || 'Blank Poster'}".`,
    `User style request: "${prompt || 'Clean modern layout'}".`,
    'Return ONLY valid JSON with keys: vibeTitle (2-4 words), bg (hex), primary (hex), accent (hex),',
    'text (high-contrast hex against bg), headingFont, bodyFont, preferredLayout.',
    `preferredLayout must be one of: ${LAYOUT_IDS.join(', ')}.`,
    'Choose by structure, not by colour: prestige-frame for certificates, awards, school and DepEd',
    'documents; playful for reading corners, kids, parties; wave-hero for events and launches; bento',
    'for product, app and catalog pages; split-left/split-right for editorial; dark for tech and night.',
    `headingFont and bodyFont must be one of: ${[...LOADED_FAMILIES].join(', ')}.`,
  ].join(' ');
}

export async function fetchAIDesignAdvice(
  page: Page,
  prompt: string,
  apiKey?: string
): Promise<AIDesignAdvice> {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    return localKeywordDesignAdvice(prompt);
  }

  const textSummary = page.elements
    .filter((el): el is TextElement => el.type === 'text')
    .map((t) => t.text.slice(0, 60))
    .slice(0, 5)
    .join(' | ');

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        cleanKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: designAdvicePrompt(textSummary, prompt) }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!res.ok) return localKeywordDesignAdvice(prompt);
    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return localKeywordDesignAdvice(prompt);
    const parsed = JSON.parse(rawText);

    const layout = LAYOUT_IDS.includes(parsed?.preferredLayout as DesignLayoutId)
      ? (parsed.preferredLayout as DesignLayoutId)
      // A model that invents a layout name still gets a sensible page rather than a crash.
      : localKeywordDesignAdvice(prompt).preferredLayout;

    return {
      vibeTitle: parsed?.vibeTitle || 'AI Custom Style',
      bg: parsed?.bg || '#ffffff',
      primary: parsed?.primary || '#4f46e5',
      accent: parsed?.accent || '#0ea5e9',
      text: parsed?.text || '#0f172a',
      headingFont: loadedFamily(parsed?.headingFont, GEO),
      bodyFont: loadedFamily(parsed?.bodyFont, SAFE_FALLBACK_FONT),
      preferredLayout: layout,
      source: 'gemini',
    };
  } catch {
    return localKeywordDesignAdvice(prompt);
  }
}

/** Exported for the design-ideas probe: palette swaps are easiest to judge element by element. */
export { applyPaletteToElements, buildBentoLayout, buildDarkExecutiveLayout, buildPlayfulLayout, buildPrestigeFrameLayout, buildSplitLayout, buildWaveHeroLayout };
