import type { TextElement } from '../types/publisher';

type FontWeight = TextElement['fontWeight'];

/**
 * The four places a text weight can be set from — the canvas bar, the Designer context bar, the
 * Home ribbon and the Text panel — were each doing their own arithmetic, and two of them disagreed
 * with the screen.
 *
 * `fontWeight === 'bold'` is the obvious test and the wrong one: the union carries `'600'`, `'800'`
 * and `'900'` as well, and a style or a template can set any of them. So a 900-weight title showed
 * its B button unpressed, and pressing B on it *lightened* the text to 700 — the control doing the
 * opposite of what its own state claimed.
 *
 * One rule now, for every surface: anything 600 and up is bold; switching bold off keeps the weight
 * you had so switching it back on returns to it rather than flattening a 900 poster title to 700.
 */
const HEAVY: ReadonlySet<FontWeight> = new Set(['600', '800', '900', 'bold']);

/** Weights that read as bold on screen, whatever put them there. */
export function isBoldWeight(weight: FontWeight | undefined): boolean {
  return Boolean(weight) && HEAVY.has(weight as FontWeight);
}

/**
 * The weight before each element was switched to non-bold, so the toggle is reversible in a
 * document full of 900-weight display type. Module-level on purpose: the memory belongs to the
 * element, not to whichever bar happened to be open when you pressed B.
 */
const weightBeforeUnbold = new Map<string, FontWeight>();

/** The weight B should produce for this element, and a note of what to come back to. */
export function toggleBoldWeight(id: string, current: FontWeight | undefined): FontWeight {
  if (isBoldWeight(current)) {
    if (current && current !== 'bold') weightBeforeUnbold.set(id, current!);
    return 'normal';
  }
  const remembered = weightBeforeUnbold.get(id);
  return remembered && isBoldWeight(remembered) ? remembered : 'bold';
}
