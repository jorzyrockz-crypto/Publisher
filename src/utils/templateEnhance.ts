import type {
  DocumentProject,
  ImageElement,
  Page,
  PublisherElement,
  TableElement,
  TextElement,
} from '../types/publisher';
import type { TemplateCategory } from '../constants/templates';

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
};

/** WordArt palettes by purpose, split by how dark the page is. */
const LIGHT_PAGE_STYLES: Partial<Record<TemplateCategory, TextElement['wordArtStyle'][]>> = {
  Certificate: ['gold3d', 'chrome'],
  Poster: ['sunset-gradient', 'fire'],
  Tarpapel: ['sunset-gradient', 'fire', 'comic-pop'],
  Invitation: ['gold3d', 'sunset-gradient'],
  Card: ['sunset-gradient', 'gold3d', 'retro'],
  'Social Media': ['neon-glow', 'sunset-gradient'],
  'Hero Banner': ['gradient-blue', 'neon-glow'],
  Collage: ['retro', 'sunset-gradient'],
  Program: ['gold3d', 'emerald-3d'],
  Menu: ['gold3d', 'retro'],
  Flyer: ['fire', 'sunset-gradient'],
  Brochure: ['gradient-blue', 'emerald-3d'],
  Newsletter: ['gradient-blue', 'chrome'],
  Resume: ['gradient-blue', 'emerald-3d'],
  'Business Card': ['chrome', 'gradient-blue'],
  Postcard: ['sunset-gradient', 'retro'],
  Calendar: ['gradient-blue', 'gold3d'],
  'Cover Document': ['chrome', 'gradient-blue'],
  'Narrative Report': ['gradient-blue', 'emerald-3d'],
  Email: ['gradient-blue', 'emerald-3d'],
};

const DARK_PAGE_STYLES: TextElement['wordArtStyle'][] = ['chrome', 'neon-glow', 'gold3d', 'sunset-gradient'];

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
  const dark = hexLuminance(page.backgroundColor) < 0.42;
  const palette = dark
    ? DARK_PAGE_STYLES
    : LIGHT_PAGE_STYLES[category] ?? ['gradient-blue'];
  return palette.length > 0;
}

function wordArtChoice(el: TextElement, category: TemplateCategory, page: Page): TextElement['wordArtStyle'] {
  const dark = hexLuminance(page.backgroundColor) < 0.42;
  const palette = dark
    ? DARK_PAGE_STYLES
    : LIGHT_PAGE_STYLES[category] ?? ['gradient-blue'];
  // a deterministic pick, so thumbnails never shuffle between renders
  const seed = Array.from(el.id).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return palette[seed % palette.length];
}

const BULLET = /^[\u2022\u00b7\u25aa\u25e6]\s+/;

function enhanceText(el: TextElement, page: Page, category: TemplateCategory, taken: { dropCap: boolean }): {
  wordArt: number;
  list: number;
  dropCap: number;
  styleTag: number;
} {
  const result = { wordArt: 0, list: 0, dropCap: 0, styleTag: 0 };
  const headline = findHeadline(page.elements);
  const isHeadline = headline?.id === el.id;

  // Tag the block with a quick style so one click can restyle every block of
  // the same role in the document.
  if (!el.textStyleId) {
    el.textStyleId = roleStyle(el, isHeadline);
    result.styleTag = 1;
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
    const bullets = lines.filter((l) => BULLET.test(l));
    if (bullets.length >= 2) {
      el.text = lines.map((l) => l.replace(BULLET, '')).join('\n');
      el.listStyle = 'bullet';
      el.listIndent = el.listIndent ?? 18;
      result.list++;
    }
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

  const taken = { dropCap: false };
  for (const el of page.elements) {
    if (el.visible === false) continue;
    if (isText(el)) {
      const r = enhanceText(el, page, category, taken);
      stats.wordArt += r.wordArt;
      stats.lists += r.list;
      stats.dropCaps += r.dropCap;
      stats.styleTags += r.styleTag;
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
