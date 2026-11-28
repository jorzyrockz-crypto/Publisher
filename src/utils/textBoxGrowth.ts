import type { PublisherElement, TextElement } from '../types/publisher';
import { layoutText } from './textLayout';
import { TEXT_EFFECT_KEYS, fitTextBoxToEffects } from './textEffectsFit';

/**
 * How tall a text box has to be, and when it is allowed to get there.
 *
 * A text box that cannot hold the words typed into it has three ways out: clip them, shrink the
 * type, or get taller. The app used to pick the first two — `autoFit: 'shrink'` scaled the letters
 * down as you typed, and boxes without it simply cut the words off — and it only ever got taller
 * when something else asked it to, through one of four separate "the height the text needs"
 * formulas (side-handle resize, "Fit box to text", the layout generator, and the effect inset).
 *
 * The rule now, in one place: **a text box grows to hold its words.** Growth is downward only —
 * the top-left is where the box was put, and a box that gets taller from the middle moves the
 * words under the caret — and it never shrinks itself; getting smaller is what the one-shot
 * "Fit box to text" button is for.
 *
 * `autoSizeText === false` is the opt-out, and it is the same flag that already means "this frame
 * is a frame, do not scale the type with it".
 */

/** Shortest a grown box may become, in page pixels. */
export const TEXT_BOX_MIN_HEIGHT = 24;

/**
 * Element keys whose change can change how tall the words are. Deliberately excludes `height`
 * itself: growth must not feed itself, and a drag is not a text edit.
 */
export const TEXT_GROWTH_KEYS = [
  'text',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'letterSpacing',
  'wordSpacing',
  'lineHeight',
  'width',
  'padding',
  'columns',
  'columnGap',
  'textIndent',
  'listStyle',
  'listIndent',
  'hangingIndent',
  'tabStops',
  'dropCap',
  'textTransform',
  'fontVariant',
  'textStrokeWidth',
  'curve',
  'isWordArt',
  'wordArtStyle',
  'effectInset',
] as const;

/**
 * The height the words need, with the box's padding counted once on each side.
 *
 * Measured with `autoFit` off on purpose: asking "how tall is this text *at its own size*" is the
 * only question growth can answer. If the answer came back already shrunk, a box would be sized
 * for type it is not going to paint.
 */
export function textBoxContentHeight(el: TextElement): number {
  const laid = layoutText({ ...el, autoFit: 'none' });
  return Math.max(TEXT_BOX_MIN_HEIGHT, Math.ceil(laid.contentHeight + laid.padding * 2));
}

/**
 * How the extra room is taken, so the *words* stay where they were.
 *
 * A top-aligned box grows downward: its top edge is where it was put, and the first line does not
 * move. A centred or bottom-aligned box has to grow upward by part of the amount, or the text would
 * slide down the page every time a wrapped word was typed — the box moving is the cheaper of the two
 * lies, and the one you do not notice.
 */
export function growPatchToHold(el: TextElement, height: number): Partial<TextElement> {
  const delta = height - el.height;
  if (delta <= 0) return {};
  if (el.verticalAlign === 'middle') return { y: el.y - delta / 2, height };
  if (el.verticalAlign === 'bottom') return { y: el.y - delta, height };
  return { height };
}

/**
 * The height patch that holds the words, or null if the box already holds them.
 *
 * Grow-only. Called from the single element-write funnel, so typing, pasting a longer headline,
 * switching to a font with wider metrics and pasting a new size all end in the same arithmetic.
 */
export function growTextBoxToFitContent(el: TextElement): Partial<TextElement> | null {
  if (el.autoSizeText === false) return null;
  const needed = textBoxContentHeight(el);
  // Half a pixel of slack: `ceil` already over-estimates, and a box that grows by 1px on every
  // keystroke because of a rounding difference would creep down the page.
  if (needed <= el.height + 0.5) return null;
  return growPatchToHold(el, needed);
}

/**
 * The one place a text element's frame is allowed to change by itself.
 *
 * Runs over the elements about to be written and answers, for each text box, "does the frame still
 * hold what is going to be painted in it?" Two things can say no: paint that reaches outside the
 * glyphs (a shadow, a glow, a WordArt extrusion — it grows the box on every side and insets the
 * text by the same amount, so the letters do not move), and words that need more lines (it grows
 * the box downward, or upward for a centred box, so the letters do not move either).
 *
 * Kept separate from the React context so it can be tested — `npm run check:textbox` does.
 */
export function projectTextGeometry(
  nextElements: readonly PublisherElement[],
  previousElements: readonly PublisherElement[]
): PublisherElement[] {
  const previousById = new Map(previousElements.map((el) => [el.id, el]));

  return nextElements.map((el) => {
    if (el.type !== 'text') return el;
    const before = previousById.get(el.id) as TextElement | undefined;

    if (!before) {
      // A word-art box is born already wearing its paint, so it needs its inset now rather than on
      // the first edit — otherwise the style is clipped from the moment you insert it and looks
      // fine only after you pick it again. There is nothing to compare against and the fit is
      // idempotent, so it is safe to ask every time.
      if (!el.isWordArt) return el;
      const born = fitTextBoxToEffects(el);
      return born ? { ...el, ...born } : el;
    }

    const record = el as unknown as Record<string, unknown>;
    const previous = before as unknown as Record<string, unknown>;
    let next: PublisherElement = el;

    // 1. Paint outside the glyphs grows the box on every side.
    if (TEXT_EFFECT_KEYS.some((key) => record[key] !== previous[key])) {
      const fit = fitTextBoxToEffects(el);
      if (fit) next = { ...next, ...fit };
    }

    // 2. Words that need more room grow the box. Runs second, so the padding the fit just added
    //    is already counted. Same arithmetic as the resize handles and the panel's "Fit box to
    //    text", through the functions above.
    if (TEXT_GROWTH_KEYS.some((key) => record[key] !== previous[key])) {
      const grow = growTextBoxToFitContent(next as TextElement);
      if (grow) next = { ...next, ...grow };
    }

    return next;
  });
}
