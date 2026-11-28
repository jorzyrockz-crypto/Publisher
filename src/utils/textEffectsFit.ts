import type { TextElement } from '../types/publisher';
import { buildTextEffectPainter } from './textEffects';
import { wordArtPaint, wordArtRimWidth, wordArtShadowChain } from './wordArt';

/**
 * Text effects draw outside the glyphs: a shadow lands a few pixels below the baseline, a glow
 * blooms twenty pixels past the last letter, a WordArt extrusion walks away in steps. The text
 * box, however, clips — so the moment one of those styles is applied the effect loses its
 * edges to the box.
 *
 * The fix is geometric: when a style is applied, the *box* grows by exactly the depth the
 * effect needs and the text is inset by the same amount, so the letters do not move and the
 * effect now has room inside the box. `effectInset` records what was added, which is what makes
 * it reversible — removing the effect shrinks the box back, and re-applying the same style
 * twice changes nothing.
 */

/** Element keys whose change can alter how far the paint reaches outside the glyphs. */
export const TEXT_EFFECT_KEYS = [
  'textEffect',
  'textEffectColor',
  'shadow',
  'shadowBlur',
  'shadowColor',
  'textStrokeWidth',
  'textStrokeColor',
  'isWordArt',
  'wordArtStyle',
  'fontSize',
] as const;

/** How far, in page pixels, this element's paint reaches beyond its glyphs. */
export function textEffectBleed(el: TextElement): number {
  let bleed = 0;
  const consider = (extent: number) => {
    if (Number.isFinite(extent)) bleed = Math.max(bleed, extent);
  };

  // Declarative text effects (shadow, lift, neon, fire, echo, outline…)
  const paint = buildTextEffectPainter(el as TextElement);
  for (const shadow of paint.shadows) {
    // CSS blurs reach roughly 1.5x their radius before they fade out completely.
    consider(Math.hypot(shadow.dx, shadow.dy) + shadow.blur * 1.5);
  }
  for (const slice of paint.slices) {
    consider(Math.abs(slice.dx) + 2);
    consider(Math.abs(slice.dy) + 2);
  }
  // A stroke is centred on the glyph edge, so half of it is outside. No stroke, no bleed —
  // plain text must not grow a box it does not need.
  if (paint.strokeWidth > 0) consider(paint.strokeWidth * 0.5 + 1);

  // WordArt stacks its own shadows, extrusion steps and blooms on top.
  const wordArt = el.isWordArt ? wordArtPaint(el.wordArtStyle) : undefined;
  if (wordArt) {
    for (const shadow of wordArtShadowChain(wordArt)) {
      consider(Math.hypot(shadow.dx, shadow.dy) + (shadow.blur || 0) * 1.5);
    }
    for (const bloom of wordArt.bloom ?? []) consider(bloom.blur * 1.5);
    if (wordArt.castShadow) {
      const cast = wordArt.castShadow;
      consider(Math.hypot(cast.dx || 0, cast.dy || 0) + (cast.blur || 0) * 1.5);
    }
    // The rim and its keyline are written in `em` (see strokeCss), so how far they reach outside the
    // glyphs depends on the type size: 17 px of die-cut on a 138 px title, 2 px on a gallery-sized
    // one. Counting the authored pixel width instead under-inset a big title and let the box clip the
    // very border that makes the style legible.
    if (wordArt.stroke) {
      const emScale = (el.fontSize || 72) / 72;
      const reach = wordArtRimWidth(wordArt) * 0.5 + (wordArt.outline?.width ?? 0);
      consider(reach * emScale);
    }
  }

  // Nothing to do for plain text; a couple of pixels of slack for antialiasing once we do have
  // an effect, so the very edge of a blur is not shaved by the box.
  return bleed > 0 ? Math.ceil(bleed) + 2 : 0;
}

/**
 * The geometry a text box needs for its current style: grown by the missing depth on every
 * side, with the letters kept exactly where they were. Returns null when nothing has to change.
 */
export function fitTextBoxToEffects(el: TextElement): Partial<TextElement> | null {
  const needed = textEffectBleed(el);
  const current = el.effectInset ?? 0;
  if (needed === current) return null;

  const grow = needed - current;
  // Whatever padding the user set keeps its meaning: only the part that belongs to the effect
  // is recalculated.
  const userPadding = Math.max(0, (el.padding || 0) - current);

  return {
    x: el.x - grow,
    y: el.y - grow,
    width: Math.max(4, el.width + grow * 2),
    height: Math.max(4, el.height + grow * 2),
    padding: userPadding + needed,
    effectInset: needed,
  };
}
