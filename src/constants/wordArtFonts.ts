import type { TextElement, WordArtStyle } from '../types/publisher';

/**
 * The face that makes a WordArt style look like its name.
 *
 * A style paints the letters — gradient, rim, keyline, shadow — but it does not choose the typeface,
 * and a gradient inside the wrong font is only half a look: "Fresh Leaf Sticker" is Kaushan Script
 * before it is a green ramp, and a bubble sign is a fat rounded face before it is a blue one. This
 * table is the missing half, applied when a style is picked (never on load, so a document keeps the
 * fonts it was designed with).
 *
 * The table is deliberately partial. Styles that are a *material* rather than a letterform —
 * Gold 3D, Chrome, Fire, Varsity — are happy in whatever font the document already uses, and saying
 * nothing here leaves their font alone.
 *
 * Nothing in the table may name a family that is not in `src/constants/fonts.ts`: a WordArt that
 * asks for a font the app cannot load fails silently, which is how a style ends up looking like a
 * bug. `checkWordArtFonts()` proves the two files still agree.
 */
export interface WordArtFace {
  family: string;
  weight: TextElement['fontWeight'];
  italic?: boolean;
}

export const WORDART_FONT_MAP: Partial<Record<WordArtStyle, WordArtFace>> = {
  // AI & metallic
  'synth-chrome': { family: 'Montserrat', weight: '900', italic: true },
  'liquid-glass': { family: 'Montserrat', weight: '900' },
  'rose-gold': { family: 'Playfair Display', weight: '900' },
  'cyber-acid': { family: 'Montserrat', weight: '900', italic: true },
  'obsidian-gold': { family: 'Playfair Display', weight: '800' },
  'candy-gloss': { family: 'Lilita One', weight: 'normal' },

  // Posters, eco & fiesta
  'sticker-royal': { family: 'Lilita One', weight: 'normal' },
  'sticker-forest': { family: 'Kaushan Script', weight: 'normal' },
  'sticker-coral': { family: 'Kaushan Script', weight: 'normal' },
  'sticker-teal': { family: 'Fredoka', weight: 'bold' },
  'brush-sunshine': { family: 'Kaushan Script', weight: 'normal' },
  'brush-blush': { family: 'Kaushan Script', weight: 'normal' },
  'eco-champion': { family: 'Lilita One', weight: 'normal' },
  'eco-leaf': { family: 'Lilita One', weight: 'normal' },
  'wood-plank-action': { family: 'Bangers', weight: 'normal' },
  'eco-ribbon': { family: 'Nunito', weight: '900' },
  'forest-script-sticker': { family: 'Pacifico', weight: 'normal' },
  'trophy-gold': { family: 'Bungee', weight: 'normal' },
  'fiesta-mosaic': { family: 'Lilita One', weight: 'normal' },
  'parchment-script': { family: 'Kaushan Script', weight: 'normal' },
  'folklore-wood': { family: 'Bungee', weight: 'normal' },

  // Champs Reading Corner & children's books
  'champs-basa-blue': { family: 'Fredoka', weight: 'bold' },
  'champs-kasadya-coral': { family: 'Fredoka', weight: 'bold' },
  'champs-gold-ribbon': { family: 'Nunito', weight: '900' },
  'storybook-crayon': { family: 'Baloo 2', weight: '800' },
  'fairytale-sparkle': { family: 'Chewy', weight: 'normal' },
  'reading-nook-sage': { family: 'Fredoka', weight: 'bold' },
  'storytime-banner': { family: 'Nunito', weight: '800' },
  'underwater-bubble': { family: 'Baloo 2', weight: '800' },
  'cultural-hablon': { family: 'Lilita One', weight: 'normal' },
  // The cartoon sign: the letterforms in the reference are a fat rounded face with a small x-height
  // and a big bowl — Baloo at 800 is the closest the catalogue has.
  'cartoon-bubble-blue': { family: 'Baloo 2', weight: '800' },
  'cartoon-bubble-pink': { family: 'Baloo 2', weight: '800' },

  // Portfolios & slideshows
  'portfolio-editorial': { family: 'Playfair Display', weight: '800' },
  'portfolio-indigo': { family: 'Plus Jakarta Sans', weight: '800' },
};

/** The face a style asks for, if it asks for one. */
export function wordArtFace(style: WordArtStyle | undefined): WordArtFace | undefined {
  if (!style) return undefined;
  return WORDART_FONT_MAP[style];
}

/** The element patch for picking a style: the face, or nothing at all for a typeface-free style. */
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
