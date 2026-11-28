import type { TextElement, WordArtStyle } from '../types/publisher';
import { wordArtDefaultFont, wordArtPaint } from '../utils/wordArt';

/**
 * The face a WordArt style brings with it when you pick it.
 *
 * The typeface itself lives on the paint spec (`WordArtPaint.fontFamily`), because the stylesheet
 * needs it too — a gallery tile should be set in the font the style was drawn for, not in whatever
 * the page happens to use. This module is only the *element patch*: what to write on a text element
 * so the canvas matches the tile the moment the style lands.
 *
 * Applied when a style is picked, never on load. A document keeps the fonts it was designed with,
 * and changing the font by hand afterwards is not undone by anything.
 */
export interface WordArtFace {
  family: string;
  weight: TextElement['fontWeight'];
  italic?: boolean;
}

/** The face a style asks for, if it asks for one. */
export function wordArtFace(style: WordArtStyle | undefined): WordArtFace | undefined {
  const family = wordArtDefaultFont(style);
  if (!family) return undefined;
  const paint = wordArtPaint(style);
  // The paint's own weight and slant, mapped onto the element's union (`'300' | '500' | '600' |
  // 'bold' | '800' | '900'`). A style painted at 900 must not be *stored* as 400 and re-weighted by
  // CSS on every render: the layout engine measures the font string, so the stored weight and the
  // painted weight would wrap the same words into different lines.
  return {
    family,
    weight: paint?.weight === '800' ? '800' : '900',
    italic: paint?.italic,
  };
}

/** The element patch for picking a style: the face, or nothing at all for a faceless style. */
export function wordArtFacePatch(
  style: WordArtStyle | undefined
): Pick<TextElement, 'fontFamily' | 'fontWeight' | 'fontStyle'> | undefined {
  const face = wordArtFace(style);
  if (!face) return undefined;
  return {
    fontFamily: face.family,
    fontWeight: face.weight,
    fontStyle: face.italic ? 'italic' : 'normal',
  };
}
