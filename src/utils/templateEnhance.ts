import type {
  DocumentProject,
  ImageElement,
  Page,
  PublisherElement,
  TableElement,
  TextElement,
} from '../types/publisher';
import type { TemplateCategory } from '../constants/templates';
import { WORD_ART_STYLES, wordArtPaint, wordArtSelfContained } from './wordArt';
import type { WordArtStyle } from '../types/publisher';

/**
 * Template design pass.
 *
 * The shipped templates were drawn when the app could not yet clip, crop,
 * curve, list, drop-cap or style type, so most of them use a fraction of what
 * the editor can do. Rather than hand-editing 93 layouts, every template is
 * put through this pass when it is loaded — the rules are role-based and
 * conservative, so a template always keeps its own composition.
 *
 * Rules, in order of visual impact:
 *  1. the page's headline becomes WordArt in a palette that suits its category
 *     (and reads against a dark page)
 *  2. runs of "•" lines become a real bulleted list with a hanging indent
 *  3. a long body block gets a drop cap
 *  4. a near-square portrait slot becomes a circular mask
 *  5. tables that never set a header row get a themed one, banded rows and
 *     hairline borders
 */

export interface EnhanceStats {
  wordArt: number;
  lists: number;
  dropCaps: number;
  masks: number;
  tables: number;
  roundedPhotos: number;
  gradients: number;
  styleTags: number;
  recolored: number;
  balanced: number;
}

const EMPTY_STATS: EnhanceStats = {
  wordArt: 0,
  lists: 0,
  dropCaps: 0,
  masks: 0,
  tables: 0,
  roundedPhotos: 0,
  gradients: 0,
  styleTags: 0,
  recolored: 0,
  balanced: 0,
};

/**
 * WordArt palettes by purpose. Order is a design preference — the first style
 * that actually reads on the page wins — so a certificate gets a deep blue
 * gradient before a chrome gimmick.
 */
const LIGHT_PAGE_STYLES: Partial<Record<TemplateCategory, WordArtStyle[]>> = {
  Certificate: ['gradient-blue', 'gold3d', 'rose-gold', 'chrome', 'comic-pop'],
  Poster: ['retro', 'cyber-acid', 'sunset-gradient', 'obsidian-gold', 'fire', 'comic-pop', 'cinematic', 'candy-gloss'],
  Tarpapel: ['comic-pop', 'varsity', 'obsidian-gold', 'fire', 'sunset-gradient', 'gradient-blue', 'cyber-acid'],
  Invitation: ['gradient-blue', 'rose-gold', 'sunset-gradient', 'gold3d', 'candy-gloss', 'retro'],
  Card: ['gradient-blue', 'rose-gold', 'sunset-gradient', 'candy-gloss', 'retro'],
  'Social Media': ['holographic', 'cyber-acid', 'gradient-blue', 'comic-pop', 'retro', 'sunset-gradient'],
  'Hero Banner': ['gradient-blue', 'obsidian-gold', 'retro', 'comic-pop'],
  Collage: ['retro', 'sunset-gradient', 'comic-pop', 'gradient-blue'],
  Program: ['gradient-blue', 'emerald-3d', 'gold3d', 'retro'],
  Menu: ['retro', 'cinematic', 'gold3d', 'rose-gold', 'gradient-blue'],
  Flyer: ['retro', 'cyber-acid', 'comic-pop', 'sunset-gradient', 'gradient-blue', 'candy-gloss'],
  Brochure: ['gradient-blue', 'emerald-3d', 'retro'],
  Newsletter: ['gradient-blue', 'retro', 'emerald-3d'],
  Resume: ['gradient-blue', 'emerald-3d', 'retro'],
  'Business Card': ['cinematic', 'obsidian-gold', 'gold3d', 'gradient-blue', 'chrome'],
  Postcard: ['retro', 'sunset-gradient', 'comic-pop'],
  Calendar: ['gradient-blue', 'retro', 'emerald-3d'],
  'Cover Document': ['cinematic', 'obsidian-gold', 'gradient-blue', 'chrome', 'emerald-3d'],
  'Narrative Report': ['gradient-blue', 'emerald-3d', 'retro'],
  Email: ['gradient-blue', 'emerald-3d', 'retro'],
  Logo: ['holographic', 'gradient-blue', 'gold3d', 'chrome'],
};

/** On a dark page the light-on-dark styles come first. */
const DARK_PAGE_STYLES: WordArtStyle[] = [
  'cinematic',
  'synth-chrome',
  'gold3d',
  'chrome',
  'liquid-glass',
  'neon-glow',
  'holographic',
  'fire',
  'rainbow',
  'sunset-gradient',
  'cyber-acid',
  'obsidian-gold',
];


export function hexLuminance(color?: string): number {
  if (!color) return 1;
  const hex = color.replace('#', '').trim();
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;
  if (full.length !== 6) return 1;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  // perceptual, not linear — indigo and plum read as "dark" to the eye
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Mix a colour towards white (amount 0..1) for tints. */
export function tint(color: string, amount: number): string {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return '#f1f5f9';
  const mix = (c: string) => {
    const v = parseInt(c, 16);
    return Math.round(v + (255 - v) * amount)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${mix(hex.slice(0, 2))}${mix(hex.slice(2, 4))}${mix(hex.slice(4, 6))}`;
}

/** Mix a colour towards black (amount 0..1). */
export function shade(color: string, amount: number): string {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return '#0f172a';
  const mix = (c: string) => {
    const v = parseInt(c, 16);
    return Math.round(v * (1 - amount))
      .toString(16)
      .padStart(2, '0');
  };
  return `#${mix(hex.slice(0, 2))}${mix(hex.slice(2, 4))}${mix(hex.slice(4, 6))}`;
}

/** Quick-style id for a block, so "apply to all of this style" works at once. */
function roleStyle(el: TextElement, isHeadline: boolean): string {
  if (isHeadline) return 'title';
  const size = el.fontSize;
  const plain = el.text.replace(/\s+/g, ' ').trim();
  if (size >= 20 && plain.length <= 42) return 'h1';
  if (size >= 16) return 'h2';
  if (size <= 11) return 'caption';
  if (el.fontStyle === 'italic' && size <= 16) return 'quote';
  return 'body';
}

function isText(el: PublisherElement): el is TextElement {
  return el.type === 'text';
}

/** The headline of a page: the largest type, ignoring curved/label noise. */
function findHeadline(elements: PublisherElement[]): TextElement | undefined {
  const texts = elements.filter(isText).filter((el) => el.visible !== false && el.text.trim().length > 0);
  if (!texts.length) return undefined;
  return [...texts].sort((a, b) => b.fontSize - a.fontSize || a.y - b.y)[0];
}

/** True when a photo sits behind this box, so the type must stay plain. */
function sitsOnPhoto(el: TextElement, page: Page): boolean {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  return page.elements.some(
    (other) =>
      other.type === 'image' &&
      !other.collageMeta &&
      other.visible !== false &&
      cx >= other.x &&
      cx <= other.x + other.width &&
      cy >= other.y &&
      cy <= other.y + other.height &&
      (other.width * other.height) / (page.width * page.height) >= 0.45
  );
}

function appliesWordArt(el: TextElement, category: TemplateCategory, page: Page): boolean {
  if (el.isWordArt || (el.wordArtStyle && el.wordArtStyle !== 'none')) return false;
  // White type over a full-bleed photo would vanish under a gradient paint.
  if (hexLuminance(el.color) > 0.85 && sitsOnPhoto(el, page)) return false;
  // below this the 3D/gradient paint reads as noise, not as a headline
  if (el.fontSize < 30) return false;
  if (el.listStyle && el.listStyle !== 'none') return false;
  const plain = el.text.replace(/\{\{[^}]+\}\}/g, '').replace(/\s+/g, ' ').trim();
  if (plain.length < 3 || plain.length > 48) return false;
  if (/[.!?]$/.test(plain) && plain.length > 24) return false; // a sentence, not a title
  void category;
  // the style picker returns undefined when nothing reads on this page
  return true;
}

/** A shape or page's own paint, as one colour to judge contrast against. */
function paintColor(el: PublisherElement): string | undefined {
  const any = el as unknown as {
    fill?: string;
    fillColor?: string;
    fillType?: string;
    gradientColor1?: string;
    gradientColor2?: string;
    backgroundColor?: string;
  };
  const base = any.fillColor || any.fill;
  if (any.fillType === 'linear-gradient') return any.gradientColor1 || base;
  if (base && base !== 'none' && base !== 'transparent') return base;
  if (any.backgroundColor && any.backgroundColor !== 'transparent') return any.backgroundColor;
  return undefined;
}

/**
 * What the element actually sits on. A page background is only half the
 * story — most covers put a coloured shape or band behind the headline, and
 * a style chosen against the page colour can land invisible on that band.
 */
export function effectiveBackground(el: PublisherElement, page: Page): string {
  let color = page.backgroundGradient?.color1 || page.backgroundColor || '#ffffff';
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const ordered = [...page.elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  for (const other of ordered) {
    if (other.id === el.id || other.visible === false) continue;
    if (other.type === 'text' || other.type === 'image' || other.type === 'table') continue;
    if (cx < other.x || cx > other.x + other.width || cy < other.y || cy > other.y + other.height) continue;
    const paint = paintColor(other);
    if (paint) color = paint;
  }
  return color;
}

/** Luminance of every colour a WordArt style puts on the page. */
function styleStops(style: WordArtStyle): number[] {
  const paint = wordArtPaint(style);
  if (!paint) return [0.5];
  if (paint.gradient) return paint.gradient.stops.map((stop) => hexLuminance(stop.color));
  return [hexLuminance(paint.fill)];
}

/**
 * How well a style reads on this background.
 *
 * Type reads if *either* half of its paint separates from the backdrop: a
 * dark outline rescues a pale gold fill on cream, and a bright gradient fill
 * rescues a dark edge on a night-time page. A gradient is only as legible as
 * its *worst* stop, so the fill side is measured there.
 */
function contrastScore(style: WordArtStyle, backgroundLum: number): number {
  const paint = wordArtPaint(style);
  const stops = styleStops(style);
  const fill = Math.min(...stops.map((stop) => Math.abs(stop - backgroundLum)));
  const edge = paint?.stroke ? Math.abs(hexLuminance(paint.stroke.color) - backgroundLum) : 0;
  return Math.max(fill, edge);
}

/** FNV-1a — small, stable, and identical on every run. */
function stableHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/** Styles that shout. Fine on a poster, wrong on a certificate. */
const PLAYFUL_STYLES = new Set<WordArtStyle>([
  'comic-pop',
  'cyber-acid',
  'candy-gloss',
  'varsity',
  'fire',
  'rainbow',
  'synth-chrome',
]);

/** Categories where a shout is the point. */
const PLAYFUL_CATEGORIES = new Set<TemplateCategory>([
  'Poster',
  'Tarpapel',
  'Social Media',
  'Collage',
  'Hero Banner',
  'Flyer',
  'Logo',
  'Invitation',
  'Card',
  'Postcard',
]);

const MIN_CONTRAST = 0.4;

function wordArtChoice(el: TextElement, category: TemplateCategory, page: Page): TextElement['wordArtStyle'] {
  const bgLum = hexLuminance(effectiveBackground(el, page));
  const dark = bgLum < 0.42;
  const palette = dark ? DARK_PAGE_STYLES : LIGHT_PAGE_STYLES[category] ?? ['gradient-blue', 'retro'];
  const playfulAllowed = PLAYFUL_CATEGORIES.has(category);
  const sober = (ids: WordArtStyle[]) =>
    playfulAllowed ? ids : ids.filter((id) => !PLAYFUL_STYLES.has(id));

  const readable = palette.filter((id) => contrastScore(id, bgLum) >= MIN_CONTRAST);
  // Design preference first, legibility second — then spread the choice across
  // the first few that read, so a catalogue of 72 pages doesn't keep landing on
  // the same style. Deterministic, so enhancing twice changes nothing.
  const shortlist = (sober(readable).length ? sober(readable) : readable).slice(0, 3);
  if (shortlist.length) {
    const seed = stableHash(`${page.id}:${el.id}:${el.text ?? ''}`);
    return shortlist[seed % shortlist.length];
  }

  // Nothing in the category palette reads here (gold on cream, sunset on
  // orange). Fall back to whatever paints clearest — but on a sober category
  // that must not be a comic pop-up, however well it scores.
  const scored = [...WORD_ART_STYLES]
    .map((option) => ({ id: option.id, score: contrastScore(option.id, bgLum) }))
    .sort((a, b) => b.score - a.score);
  const pool = scored.filter(
    (option) => option.score >= MIN_CONTRAST && (playfulAllowed || !PLAYFUL_STYLES.has(option.id))
  );

  return (pool[0] ?? scored[0]) && (pool[0] ?? scored[0]).score >= MIN_CONTRAST
    ? (pool[0] ?? scored[0]).id
    : undefined;
}

const BULLET = /^[\u2022\u00b7\u25aa\u25e6]\s+/;

function enhanceText(el: TextElement, page: Page, category: TemplateCategory, taken: { dropCap: boolean }): {
  wordArt: number;
  list: number;
  dropCap: number;
  styleTag: number;
  recolored: number;
} {
  const result = { wordArt: 0, list: 0, dropCap: 0, styleTag: 0, recolored: 0 };
  const headline = findHeadline(page.elements);
  const isHeadline = headline?.id === el.id;

  // Tag the block with a quick style so one click can restyle every block of
  // the same role in the document.
  if (!el.textStyleId) {
    el.textStyleId = roleStyle(el, isHeadline);
    result.styleTag = 1;
  }

  // WordArt paints heavier than the weight the layout was measured with, so
  // every styled line is allowed to shrink back into its box.
  if (el.isWordArt) {
    el.autoFit = el.autoFit ?? 'shrink';
    // An authored style that vanishes into its background is a bug, not a
    // choice (pink retro on a coral band) — repaint it with something that reads.
    const bgLum = hexLuminance(effectiveBackground(el, page));
    // A sticker border carries its own contrast: repainting a die-cut style because its *fill*
    // scores low against the page is exactly the wrong correction.
    if (
      el.wordArtStyle &&
      el.wordArtStyle !== 'none' &&
      !wordArtSelfContained(el.wordArtStyle) &&
      contrastScore(el.wordArtStyle, bgLum) < MIN_CONTRAST
    ) {
      const better = wordArtChoice(el, category, page);
      if (better && better !== el.wordArtStyle) {
        el.wordArtStyle = better;
        result.wordArt++;
      }
    }
  }

  // One WordArt moment per page: if the artwork already celebrates a line,
  // adding a second style would just fight it.
  const pageHasWordArt = page.elements.some((e) => isText(e) && e.isWordArt);

  if (!pageHasWordArt && isHeadline && appliesWordArt(el, category, page)) {
    const style = wordArtChoice(el, category, page);
    if (style && style !== 'none') {
      el.isWordArt = true;
      el.wordArtStyle = style;
      // WordArt paints bolder than the plain weight the layout was measured
      // with, so let the app's own autofit keep it inside its box.
      el.autoFit = el.autoFit ?? 'shrink';
      result.wordArt++;
    }
  }

  // "• line" runs become a real list, so the marker gutter and hanging indent
  // take over from hand-typed glyphs.
  if (!el.listStyle || el.listStyle === 'none') {
    const lines = el.text.split('\n');
    const filled = lines.filter((l) => l.trim().length > 0);
    const bullets = filled.filter((l) => BULLET.test(l));
    // only a clean run converts — mixed bullet/continuation lists (an event
    // line followed by a wrapped venue) must keep their hand-made layout
    if (filled.length >= 2 && bullets.length === filled.length) {
      el.text = lines.map((l) => l.replace(BULLET, '')).join('\n');
      el.listStyle = 'bullet';
      el.listIndent = el.listIndent ?? 18;
      result.list++;
    }
  }

  // Design QA: type that blends into what it sits on gets flipped to ink or
  // paper, whichever the background calls for.
  if (!el.isWordArt && !sitsOnPhoto(el, page) && !el.textFillType) {
    const bgLum = hexLuminance(el.backgroundColor && el.backgroundColor !== 'transparent'
      ? el.backgroundColor
      : effectiveBackground(el, page));
    const textLum = hexLuminance(el.color);
    if (Math.abs(textLum - bgLum) < 0.22) {
      el.color = bgLum < 0.5 ? '#ffffff' : '#0f172a';
      result.recolored = 1;
    }
  }

  // Justified type in narrow columns opens rivers between words; designers
  // leave it ragged instead.
  if (el.textAlign === 'justify') {
    const columnWidth = el.width / Math.max(1, el.columns ?? 1);
    if (columnWidth < 320 || el.fontSize < 13) el.textAlign = 'left';
  }

  const bodyLength = el.text.trim().length;
  if (
    !taken.dropCap &&
    !el.dropCap &&
    (!el.listStyle || el.listStyle === 'none') &&
    !isHeadline &&
    bodyLength >= 240 &&
    el.fontSize <= 15 &&
    el.height >= 90 &&
    (el.columns ?? 1) === 1 &&
    el.textAlign !== 'center' &&
    el.verticalAlign !== 'middle'
  ) {
    el.dropCap = true;
    // A drop cap rewraps the first lines — the box must be allowed to shrink.
    el.autoFit = el.autoFit ?? 'shrink';
    taken.dropCap = true;
    result.dropCap++;
  }

  return result;
}

const PORTRAIT_NAME = /portrait|headshot|speaker|avatar|profile|principal|mayor|student|host|faculty|employee/i;

function enhanceImage(el: ImageElement): { masks: number; rounded: number } {
  const result = { masks: 0, rounded: 0 };
  if (el.collageMeta || el.clipPathD) return result;
  if (el.maskShape && el.maskShape !== 'none') return result;
  const aspect = el.width / Math.max(1, el.height);

  // A portrait slot reads better in a circle.
  if (PORTRAIT_NAME.test(el.name || '') && aspect >= 0.8 && aspect <= 1.25) {
    el.maskShape = 'circle';
    result.masks = 1;
    return result;
  }

  // Wide photos get the soft-corner treatment the masks exist for.
  if (!el.borderArt && aspect > 1.3 && el.width >= 160) {
    el.maskShape = 'rounded';
    result.rounded = 1;
  }
  return result;
}

function enhanceTable(el: TableElement, accent: string): number {
  if (el.headerBg) return 0;
  el.headerBg = tint(accent, 0.82);
  el.headerColor = el.headerColor || '#0f172a';
  el.cellBg = el.cellBg || '#ffffff';
  el.altRowBg = el.altRowBg || tint(accent, 0.94);
  el.borderColor = el.borderColor || '#e2e8f0';
  el.borderWidth = el.borderWidth ?? 1;
  el.showHeaderRow = el.showHeaderRow ?? true;
  el.bandedRows = el.bandedRows ?? true;
  el.cellPadding = el.cellPadding ?? 8;
  return 1;
}


/**
 * Vertical balance. Templates were drawn tight to the top and left a hole at
 * the bottom of the sheet; Canva layouts breathe evenly all the way down.
 *
 * The page is cut into bands by anything structural (full-bleed art, panels,
 * rules). Inside a band, the content blocks are re-seated on even spacing, so
 * the spare room is shared between every gap instead of pooling at the bottom.
 * Even spacing is a fixed point: running the pass twice lands on the same
 * pixels, which keeps the whole enhancement idempotent.
 */
export function balancePage(page: Page, stats: EnhanceStats): void {
  if (page.elements.some((el) => (el as unknown as { collageMeta?: unknown }).collageMeta)) return;

  const pageArea = page.width * page.height;
  const visible = page.elements.filter((el) => el.visible !== false);
  const isStructural = (el: PublisherElement) => {
    const area = (el.width * el.height) / pageArea;
    return area > 0.3 || el.width > page.width * 0.85 || el.height > page.height * 0.85;
  };
  const anchors = visible.filter(isStructural);
  const movable = visible.filter((el) => !isStructural(el));
  if (movable.length < 2) return;

  const overlaps = (a: { x: number; y: number; width: number; height: number }, b: PublisherElement) =>
    a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

  // content blocks, grouped by vertical proximity
  const ordered = [...movable].sort((a, b) => a.y - b.y);
  const blocks: PublisherElement[][] = [];
  for (const el of ordered) {
    const last = blocks[blocks.length - 1];
    if (last && el.y <= Math.max(...last.map((e) => e.y + e.height)) + 22) {
      last.push(el);
      continue;
    }
    blocks.push([el]);
  }

  const box = (block: PublisherElement[]) => ({
    x: Math.min(...block.map((e) => e.x)),
    y: Math.min(...block.map((e) => e.y)),
    width: Math.max(...block.map((e) => e.x + e.width)) - Math.min(...block.map((e) => e.x)),
    height: Math.max(...block.map((e) => e.y + e.height)) - Math.min(...block.map((e) => e.y)),
    bottom: Math.max(...block.map((e) => e.y + e.height)),
  });
  // a block sitting on artwork or a panel is pinned to it
  const pinned = (block: PublisherElement[]) => anchors.some((anchor) => overlaps(box(block), anchor));

  const topLimit = page.margins?.top ?? 0;
  const bottomLimit = page.height - (page.margins?.bottom ?? 0);
  let moved = false;

  let index = 0;
  while (index < blocks.length) {
    if (pinned(blocks[index])) { index++; continue; }
    let end = index;
    while (end + 1 < blocks.length && !pinned(blocks[end + 1])) end++;

    if (end > index) {
      const run = blocks.slice(index, end + 1);
      const areas = run.map(box);
      const bandTop = index > 0 ? Math.max(topLimit, box(blocks[index - 1]).bottom) : topLimit;
      const bandBottom =
        end + 1 < blocks.length ? Math.min(bottomLimit, Math.min(...blocks[end + 1].map((e) => e.y))) : bottomLimit;
      const totalHeight = areas.reduce((sum, area) => sum + area.height, 0);
      const slots = run.length - 1;
      // already evenly spaced? then this run is a fixed point — leave it alone
      const gaps = areas.slice(1).map((area, i) => area.y - areas[i].bottom);
      if (Math.max(...gaps) - Math.min(...gaps) < 12) { index = end + 1; continue; }
      const gap = (bandBottom - bandTop - totalHeight) / slots;
      const currentGap = (areas[areas.length - 1].bottom - areas[0].y - totalHeight) / slots;
      // only spread when the room is real; never compress what is already tight
      if (gap > currentGap + 6 && gap > 0) {
        const capped = Math.min(gap, Math.max(120, currentGap * 2.2));
        // Work the moves out first: a run that would push its last block past the bottom
        // margin is not spread at all, because overflowing the page is worse than uneven space.
        const deltas: number[] = [];
        let cursor = bandTop;
        run.forEach((block, i) => {
          // Only ever push down. Pulling a block up to fill a band is how a subtitle ends up
          // sitting above the headline it belongs to: the band top is the previous block's
          // bottom, and a generous gap reads as "room to fill" rather than as deliberate space.
          const dy = Math.max(0, Math.round(cursor - areas[i].y));
          deltas.push(dy);
          cursor = areas[i].y + dy + areas[i].height + capped;
        });

        const fits = run.every(
          (block, i) => areas[i].bottom + deltas[i] <= bottomLimit + 1,
        );
        if (fits) {
          run.forEach((block, i) => {
            if (deltas[i] !== 0) {
              for (const el of block) el.y += deltas[i];
              moved = true;
            }
          });
        }
      }
    }
    index = end + 1;
  }
  if (moved) stats.balanced++;
}

export function enhancePage(page: Page, category: TemplateCategory, accent: string, stats: EnhanceStats): void {
  // Dark pages gain depth from a gradient in their own hue, which leaves the
  // contrast of every element exactly as designed.
  if (!page.backgroundGradient && (!page.backgroundPattern || page.backgroundPattern.type === 'none')) {
    const bg = page.backgroundColor;
    if (hexLuminance(bg) < 0.45) {
      page.backgroundGradient = { angle: 135, color1: tint(bg, 0.14), color2: shade(bg, 0.28) };
      stats.gradients++;
    }
  }

  balancePage(page, stats);

  // a page carries one drop cap, authored or added
  const taken = { dropCap: page.elements.some((el) => isText(el) && !!el.dropCap) };
  for (const el of page.elements) {
    if (el.visible === false) continue;
    if (isText(el)) {
      const r = enhanceText(el, page, category, taken);
      stats.wordArt += r.wordArt;
      stats.lists += r.list;
      stats.dropCaps += r.dropCap;
      stats.styleTags += r.styleTag;
      stats.recolored += r.recolored;
    } else if (el.type === 'image') {
      const img = enhanceImage(el);
      stats.masks += img.masks;
      stats.roundedPhotos += img.rounded;
    } else if (el.type === 'table') {
      stats.tables += enhanceTable(el, accent);
    }
  }
}

/**
 * Returns an enhanced copy of a template's project. Pure: the template
 * constants stay untouched, so the pass can be run on any list of templates.
 */
export function enhanceProject(
  project: DocumentProject,
  category: TemplateCategory,
  accent = '#6e56cf',
  stats: EnhanceStats = { ...EMPTY_STATS }
): { project: DocumentProject; stats: EnhanceStats } {
  const next: DocumentProject = JSON.parse(JSON.stringify(project));
  for (const page of next.pages) enhancePage(page, category, accent, stats);
  return { project: next, stats };
}
