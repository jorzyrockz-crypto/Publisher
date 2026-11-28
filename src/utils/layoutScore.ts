import type { Page, PublisherElement, TextElement } from '../types/publisher';
import { contrastRatio } from './documentPalette';

/**
 * A designer's eye, written down.
 *
 * Suggestions used to be produced, not chosen: the panel emitted six layouts and you picked by
 * looking. Taste is not a mystery — it is a handful of things you can measure — so this module
 * scores a page on the properties people actually judge when they say a layout "looks better":
 *
 *   alignment    do things share edges, or does everything float a few pixels apart?
 *   rhythm       are the gaps the same family of numbers, or 11 / 17 / 23?
 *   hierarchy    is there one thing to read first, and is it clearly bigger?
 *   whitespace   is there room to breathe, without the page being empty?
 *   contrast     can every piece of text be read on what is behind it?
 *   collisions   does anything overlap what it should not, or fall off the margins?
 *   balance      does the weight sit on the page, or in one corner?
 *   measure      are the lines a comfortable length to read?
 *
 * Every metric is 0..1, the total is a weighted 0..100, and — as importantly as the number —
 * the score carries the *reason*: what is working, and what to fix first.
 */

export type LayoutGrade = 'A' | 'B' | 'C' | 'D';

export interface LayoutIssue {
  id: string;
  label: string;
  detail: string;
  severity: 'info' | 'warn' | 'bad';
}

export interface LayoutMetrics {
  alignment: number;
  rhythm: number;
  hierarchy: number;
  whitespace: number;
  contrast: number;
  collisions: number;
  balance: number;
  measure: number;
}

export interface LayoutScore {
  total: number;
  grade: LayoutGrade;
  metrics: LayoutMetrics;
  issues: LayoutIssue[];
  highlights: string[];
}

const WEIGHTS: Record<keyof LayoutMetrics, number> = {
  alignment: 0.16,
  rhythm: 0.12,
  hierarchy: 0.16,
  whitespace: 0.12,
  contrast: 0.16,
  collisions: 0.16,
  balance: 0.06,
  measure: 0.06,
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const EDGE_TOLERANCE = 2;

/**
 * Something that covers (nearly) the whole page is a background, not content: it should not
 * count as ink, it should not be dragged to the margins, and it must not decide where the weight
 * sits. That is true of a full-bleed shape and of a full-bleed photograph alike.
 */
function isPageBackground(el: PublisherElement, pageW: number, pageH: number): boolean {
  if (el.type !== 'shape' && el.type !== 'image') return false;
  return el.width * el.height >= pageW * pageH * 0.85 && el.width >= pageW * 0.9;
}

/** Left / centre / right and top / middle / bottom edges of every box. */
function edgesOf(el: PublisherElement) {
  return {
    x: [el.x, el.x + el.width / 2, el.x + el.width],
    y: [el.y, el.y + el.height / 2, el.y + el.height],
  };
}

/** Fraction of elements that share at least one edge with another element. */
function scoreAlignment(elements: PublisherElement[]): number {
  if (elements.length < 2) return 1;
  const seen: number[] = [];
  elements.forEach((el) => {
    const e = edgesOf(el);
    [...e.x, ...e.y].forEach((v) => seen.push(v));
  });

  let matched = 0;
  elements.forEach((el) => {
    const e = edgesOf(el);
    const own = [...e.x, ...e.y];
    const shares = own.some((v) => {
      const sameEdge = seen.filter((other) => Math.abs(other - v) <= EDGE_TOLERANCE).length;
      return sameEdge >= 2; // this value, plus at least one other box
    });
    if (shares) matched += 1;
  });
  return clamp01(matched / elements.length);
}

/** Gaps that land on a 4px module, and preferably on an 8px one. */
function scoreRhythm(elements: PublisherElement[]): number {
  const boxes = [...elements].sort((a, b) => a.y - b.y || a.x - b.x);
  const gaps: number[] = [];
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const dy = boxes[j].y - (boxes[i].y + boxes[i].height);
      const dx = boxes[j].x - (boxes[i].x + boxes[i].width);
      if (dy >= 2 && dy < 400) gaps.push(dy);
      if (dx >= 2 && dx < 400) gaps.push(dx);
    }
  }
  if (gaps.length === 0) return 0.8;

  const errors = gaps.map((gap) => {
    const mod8 = Math.abs(gap) % 8;
    const err8 = Math.min(mod8, 8 - mod8) / 4; // 0 on the module, 1 halfway
    return Math.min(1, err8);
  });
  return clamp01(1 - errors.reduce((a, b) => a + b, 0) / errors.length);
}

/** One clear first thing to read. */
function scoreHierarchy(elements: PublisherElement[]): number {
  const texts = elements.filter((el): el is TextElement => el.type === 'text');
  if (texts.length === 0) return 0.6;

  // Display type (WordArt) is a lockup, not a hierarchy: four sticker words at the same size are
  // one shout, and measuring them against each other would call every poster flat. What matters
  // there is that the body copy is clearly smaller than the shout.
  const isDisplay = (el: TextElement) => Boolean((el as { isWordArt?: boolean }).isWordArt);
  const display = texts.filter(isDisplay);
  const body = texts.filter((el) => !isDisplay(el));
  const ratioScore = (ratio: number) => {
    if (ratio >= 1.5 && ratio <= 3.2) return 1;
    if (ratio > 3.2) return clamp01(1 - (ratio - 3.2) / 4);
    return clamp01(0.45 + (ratio - 1) * 1.0); // 1.0x is flat, 1.5x is good
  };

  if (display.length > 0) {
    const shout = Math.max(...display.map((el) => el.fontSize));
    const next = body.length ? Math.max(...body.map((el) => el.fontSize)) : 0;
    if (!next) return 0.9;
    return ratioScore(shout / Math.max(1, next));
  }

  const sizes = texts.map((el) => el.fontSize).sort((a, b) => b - a);
  if (sizes.length === 1) return 0.75;
  return ratioScore(sizes[0] / Math.max(1, sizes[1]));
}

/** Room to breathe: 45–70% of the page covered is the comfortable band for print. */
function scoreWhitespace(elements: PublisherElement[], pageW: number, pageH: number): number {
  const pageArea = Math.max(1, pageW * pageH);
  let ink = 0;
  elements.forEach((el) => {
    if (el.visible === false) return;
    if (isPageBackground(el, pageW, pageH)) return;
    ink += Math.min(el.width, pageW) * Math.min(el.height, pageH);
  });
  const coverage = Math.min(1, ink / pageArea);
  const low = 0.35;
  const high = 0.72;
  if (coverage >= low && coverage <= high) return 1;
  if (coverage < low) return clamp01(coverage / low);
  return clamp01(1 - (coverage - high) / (1 - high));
}

/**
 * What is actually behind a text box: the highest object under its centre, not just the page.
 * A headline in white over a dark shape is legible; the same headline over the page would not be.
 * Pictures are photographed content, so their colour is unknown and the check stands down.
 */
export function textBackdrop(
  el: TextElement,
  elements: PublisherElement[],
  pageBackground: string
): string | null {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const behind = elements
    .filter((other) => other.id !== el.id && other.visible !== false && other.zIndex < el.zIndex)
    .filter((other) => {
      if (other.type === 'text') return false;
      return cx >= other.x && cx <= other.x + other.width && cy >= other.y && cy <= other.y + other.height;
    })
    .sort((a, b) => b.zIndex - a.zIndex);

  const top = behind[0];
  if (!top) return pageBackground;
  if (top.type === 'shape') {
    const shape = top as PublisherElement & { fillColor?: string; fillGradient?: unknown };
    if (shape.fillGradient) return null; // average of a gradient tells us nothing useful
    return shape.fillColor || pageBackground;
  }
  // An image: whatever is painted there is unknowable from the model.
  return null;
}

/** Every text element readable on whatever is behind it. */
function scoreContrast(
  elements: PublisherElement[],
  background: string,
  textElements: TextElement[]
): { score: number; worst: { ratio: number; text: string } | null } {
  if (textElements.length === 0) return { score: 1, worst: null };
  let worst: { ratio: number; text: string } | null = null;

  const ratios: number[] = [];
  textElements.forEach((el) => {
    const behind = el.highlightColor && el.highlightColor !== 'transparent'
      ? el.highlightColor
      : textBackdrop(el, elements, background);
    if (!behind) {
      ratios.push(1); // cannot be judged from the model — do not punish it
      return;
    }
    const ratio = contrastRatio(el.color || '#111827', behind);
    if (!worst || ratio < worst.ratio) worst = { ratio, text: (el.text || '').slice(0, 24) };
    // AA is 4.5:1 for body copy; anything above that is a bonus, not a penalty.
    ratios.push(clamp01(ratio / 4.5));
  });

  return { score: ratios.reduce((a, b) => a + b, 0) / ratios.length, worst };
}

/** Overlaps that a designer would call a mistake, and boxes that fall off the page. */
function scoreCollisions(
  elements: PublisherElement[],
  pageW: number,
  pageH: number,
  margins: { top: number; right: number; bottom: number; left: number }
): { score: number; count: number; offPage: number; outOfMargins: number } {
  const visible = elements.filter(
    (el) => el.visible !== false && !isPageBackground(el, pageW, pageH)
  );
  const texts = visible.filter((el): el is TextElement => el.type === 'text');
  let overlaps = 0;

  for (let i = 0; i < texts.length; i += 1) {
    for (let j = i + 1; j < texts.length; j += 1) {
      const a = texts[i];
      const b = texts[j];
      const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      // A couple of pixels of bleed is normal for text boxes; a real overlap is not.
      if (overlapX > 6 && overlapY > 6) overlaps += 1;
    }
  }

  let offPage = 0;
  let outOfMargins = 0;
  visible.forEach((el) => {
    // A shape running a little past the trim is a bleed, which is what print wants. Text and
    // pictures overhanging is a mistake, and so is anything overhanging by a lot.
    const bleed = el.type === 'shape' ? 24 : 2;
    if (el.x < -bleed || el.y < -bleed || el.x + el.width > pageW + bleed || el.y + el.height > pageH + bleed) {
      offPage += 1;
      return;
    }
    const outside =
      el.x < margins.left - 2 ||
      el.y < margins.top - 2 ||
      el.x + el.width > pageW - margins.right + 2 ||
      el.y + el.height > pageH - margins.bottom + 2;
    if (outside) outOfMargins += 1;
  });

  const penalty = overlaps * 0.28 + offPage * 0.35 + outOfMargins * 0.06;
  return { score: clamp01(1 - penalty), count: overlaps, offPage, outOfMargins };
}

/** Weight roughly where it should be: the middle third, not a corner. */
function scoreBalance(elements: PublisherElement[], pageW: number, pageH: number): number {
  const visible = elements.filter(
    (el) => el.visible !== false && !isPageBackground(el, pageW, pageH)
  );
  if (visible.length === 0) return 0.5;

  let mass = 0;
  let cx = 0;
  let cy = 0;
  visible.forEach((el) => {
    // Text carries more weight than empty space of the same size; it is what the eye lands on.
    const density = el.type === 'text' ? 1.6 : el.type === 'image' ? 1.3 : 0.9;
    const w = el.width * el.height * density;
    mass += w;
    cx += (el.x + el.width / 2) * w;
    cy += (el.y + el.height / 2) * w;
  });
  if (mass === 0) return 0.5;
  cx /= mass;
  cy /= mass;

  const dx = (cx - pageW / 2) / (pageW / 2);
  const dy = (cy - pageH / 2) / (pageH / 2);
  const off = Math.hypot(dx, dy);
  // A top-weighted editorial page is a convention, not a mistake: everything within a third of
  // centre is fine, and it only degrades past that.
  return clamp01(1 - Math.max(0, off - 0.34) / 0.66);
}

/** Lines a person can actually read: 45–75 characters. */
function scoreMeasure(elements: TextElement[]): number {
  const bodyish = elements.filter((el) => el.text && el.text.trim().length > 20);
  if (bodyish.length === 0) return 1;
  const scores = bodyish.map((el) => {
    const avgChar = Math.max(1, el.fontSize * 0.5);
    const chars = el.width / avgChar;
    if (chars >= 45 && chars <= 75) return 1;
    if (chars < 45) return clamp01(chars / 45);
    return clamp01(1 - (chars - 75) / 90);
  });
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export function scoreElements(
  elements: PublisherElement[],
  page: Pick<Page, 'width' | 'height' | 'margins'> & { backgroundColor?: string }
): LayoutScore {
  const visible = elements.filter((el) => el.visible !== false);
  const textElements = visible.filter((el): el is TextElement => el.type === 'text');
  const background = page.backgroundColor || '#ffffff';

  const content = visible.filter((el) => !isPageBackground(el, page.width, page.height));
  const alignment = scoreAlignment(content);
  const rhythm = scoreRhythm(content);
  const hierarchy = scoreHierarchy(content);
  const whitespace = scoreWhitespace(visible, page.width, page.height);
  const contrastResult = scoreContrast(visible, background, textElements);
  const collisionResult = scoreCollisions(visible, page.width, page.height, page.margins);
  const balance = scoreBalance(visible, page.width, page.height);
  const measure = scoreMeasure(textElements);

  const metrics: LayoutMetrics = {
    alignment,
    rhythm,
    hierarchy,
    whitespace,
    contrast: contrastResult.score,
    collisions: collisionResult.score,
    balance,
    measure,
  };

  const weighted = (Object.keys(WEIGHTS) as Array<keyof LayoutMetrics>).reduce(
    (sum, key) => sum + metrics[key] * WEIGHTS[key],
    0
  );
  const total = Math.round(weighted * 100);

  // What to say about it: the worst things first, then what is holding the layout up.
  const issues: LayoutIssue[] = [];
  if (collisionResult.count > 0) {
    issues.push({
      id: 'overlap',
      label: 'Text is overlapping',
      detail: `${collisionResult.count} pair${collisionResult.count === 1 ? '' : 's'} of text boxes sit on top of each other.`,
      severity: 'bad',
    });
  }
  if (collisionResult.offPage > 0) {
    issues.push({
      id: 'off-page',
      label: 'Something falls off the page',
      detail: `${collisionResult.offPage} object${collisionResult.offPage === 1 ? '' : 's'} extend past the trim edge and will be cut.`,
      severity: 'bad',
    });
  }
  if (contrastResult.worst && contrastResult.worst.ratio < 4.5) {
    issues.push({
      id: 'contrast',
      label: 'Low contrast',
      detail: `“${contrastResult.worst.text}…” sits at ${contrastResult.worst.ratio.toFixed(1)}:1 — below the 4.5:1 a body text needs.`,
      severity: contrastResult.worst.ratio < 3 ? 'bad' : 'warn',
    });
  }
  if (alignment < 0.6) {
    issues.push({
      id: 'alignment',
      label: 'Edges do not line up',
      detail: 'Most boxes share no edge with anything else; pick two edges and snap everything to them.',
      severity: 'warn',
    });
  }
  if (rhythm < 0.55) {
    issues.push({
      id: 'rhythm',
      label: 'Uneven spacing',
      detail: 'Gaps are not on a common step — try 8 / 16 / 24 instead of in-between numbers.',
      severity: 'warn',
    });
  }
  if (hierarchy < 0.55) {
    issues.push({
      id: 'hierarchy',
      label: 'Nothing leads',
      detail: 'The largest text is barely larger than the next; make the headline 1.5–3x the body.',
      severity: 'warn',
    });
  }
  if (whitespace < 0.55) {
    issues.push({
      id: 'whitespace',
      label: whitespace < 0.4 ? 'Too crowded' : 'Could breathe more',
      detail: 'Objects cover an uncomfortable share of the page; drop something or give the rest room.',
      severity: 'warn',
    });
  }
  if (collisionResult.outOfMargins > 0 && collisionResult.offPage === 0) {
    issues.push({
      id: 'margins',
      label: 'Outside the margins',
      detail: `${collisionResult.outOfMargins} object${collisionResult.outOfMargins === 1 ? '' : 's'} cross the margin guides — fine if it is deliberate, otherwise snap them in.`,
      severity: 'info',
    });
  }

  // Highlights in order of how well they are done, so two good layouts do not read the same.
  const highlightCandidates: Array<{ metric: number; text: string }> = [];
  if (alignment >= 0.8) {
    highlightCandidates.push({ metric: alignment, text: 'Edges line up across the layout' });
  }
  if (rhythm >= 0.75) {
    highlightCandidates.push({ metric: rhythm, text: 'Spacing follows a consistent step' });
  }
  if (hierarchy >= 0.9) {
    highlightCandidates.push({ metric: hierarchy, text: 'Clear first, second, third to read' });
  }
  if (contrastResult.score >= 0.95 && textElements.length > 0) {
    highlightCandidates.push({ metric: contrastResult.score, text: 'All text passes AA contrast' });
  }
  if (whitespace >= 0.9) {
    highlightCandidates.push({ metric: whitespace, text: 'Comfortable amount of space' });
  }
  if (collisionResult.score === 1) {
    highlightCandidates.push({ metric: 1, text: 'Nothing overlaps or falls off the page' });
  }
  if (measure >= 0.95 && textElements.some((el) => el.text.trim().length > 20)) {
    highlightCandidates.push({ metric: measure, text: 'Readable line length' });
  }
  const highlights = highlightCandidates
    .sort((a, b) => b.metric - a.metric)
    .map((item) => item.text);

  const grade: LayoutGrade = total >= 85 ? 'A' : total >= 72 ? 'B' : total >= 58 ? 'C' : 'D';

  return { total, grade, metrics, issues, highlights };
}

export function scoreLayout(page: Page): LayoutScore {
  return scoreElements(page.elements || [], page);
}

/** One line you can put on a card: the score, and the single most useful thing about it. */
export function describeScore(score: LayoutScore): string {
  const bad = score.issues.find((issue) => issue.severity === 'bad');
  // A good layout is sold by what it gets right; a poor one is only useful with the fix.
  if (score.total >= 80 && score.highlights.length > 0 && !bad) return score.highlights[0];
  if (bad) return bad.label;
  if (score.issues.length > 0) return score.issues[0].label;
  return score.highlights[0] || 'Balanced and legible';
}
