import type { WordArtStyle } from '../types/publisher';

/**
 * The WordArt catalogue — one list for the gallery, the inspector and the
 * renderer, so a style can never be offered without a class to paint it (the
 * bug that left "Emerald 3D Block" and "Deep Blue" as plain text).
 */
export interface WordArtOption {
  id: WordArtStyle;
  label: string;
  className: string;
  /** Preview needs a dark tile to read (glow styles). */
  dark?: boolean;
}

export const WORD_ART_STYLES: WordArtOption[] = [
  { id: 'gold3d', label: 'Gold 3D Extrusion', className: 'wordart-gold3d' },
  { id: 'rainbow', label: 'Rainbow Gradient', className: 'wordart-rainbow' },
  { id: 'outline', label: 'Cyan Bold Outline', className: 'wordart-outline' },
  { id: 'retro', label: 'Retro Pop 3D', className: 'wordart-retro' },
  { id: 'neon-glow', label: 'Neon Cyber Glow', className: 'wordart-neon-glow', dark: true },
  { id: 'chrome', label: 'Chrome Metallic', className: 'wordart-chrome' },
  { id: 'fire', label: 'Blazing Fire', className: 'wordart-fire' },
  { id: 'comic-pop', label: 'Comic Pop Art', className: 'wordart-comic-pop' },
  { id: 'emerald-3d', label: 'Emerald 3D Block', className: 'wordart-emerald-3d' },
  { id: 'sunset-gradient', label: 'Sunset Vibe', className: 'wordart-sunset-gradient' },
  { id: 'gradient-blue', label: 'Deep Blue Gradient', className: 'wordart-gradient-blue' },
];

const BY_ID = new Map<string, WordArtOption>(WORD_ART_STYLES.map((s) => [s.id, s]));

/** The CSS class that paints a style, or '' for plain text. */
export function wordArtClassName(style?: WordArtStyle): string {
  if (!style || style === 'none') return '';
  return BY_ID.get(style)?.className ?? '';
}

/** Every style the UI offers, with "none" first. */
export function wordArtPickerOptions(): WordArtOption[] {
  return [{ id: 'none', label: 'Standard Text', className: 'text-slate-700' }, ...WORD_ART_STYLES];
}

/* ------------------------------------------------------------------ *
 * Paint specs — the same numbers the CSS uses, so the canvas exporter
 * and the DOM paint identically. src/index.css keeps the rules only for
 * the gallery previews, and a test asserts the two never drift apart.
 * ------------------------------------------------------------------ */

export interface WordArtShadow {
  dx: number;
  dy: number;
  blur: number;
  color: string;
}

export interface WordArtGradient {
  /** CSS angle in degrees: 180 = top→bottom, 135 = down-right. */
  angle: number;
  stops: { offset: number; color: string }[];
}

export interface WordArtPaint {
  /** The style forces a heavier weight than the document's. */
  weight: '800' | '900';
  fill?: string;
  gradient?: WordArtGradient;
  stroke?: { width: number; color: string };
  shadows: WordArtShadow[];
}

const PAINT: Partial<Record<WordArtStyle, WordArtPaint>> = {
  rainbow: {
    weight: '900',
    gradient: {
      angle: 135,
      stops: [
        { offset: 0, color: '#f43f5e' },
        { offset: 0.25, color: '#fb923c' },
        { offset: 0.5, color: '#facc15' },
        { offset: 0.75, color: '#10b981' },
        { offset: 1, color: '#3b82f6' },
      ],
    },
    shadows: [{ dx: 0, dy: 2, blur: 4, color: 'rgba(0,0,0,0.15)' }],
  },
  gold3d: {
    weight: '800',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#fef08a' },
        { offset: 0.5, color: '#eab308' },
        { offset: 1, color: '#a16207' },
      ],
    },
    shadows: [
      { dx: 0, dy: 2, blur: 2, color: 'rgba(161,98,7,0.4)' },
      { dx: 0, dy: 4, blur: 8, color: 'rgba(0,0,0,0.2)' },
    ],
  },
  outline: {
    weight: '900',
    fill: '#ffffff',
    stroke: { width: 2, color: '#0f766e' },
    shadows: [{ dx: 2, dy: 3, blur: 0, color: 'rgba(15,118,110,0.3)' }],
  },
  retro: {
    weight: '800',
    fill: '#ec4899',
    shadows: [
      { dx: 3, dy: 3, blur: 0, color: '#06b6d4' },
      { dx: 5, dy: 5, blur: 0, color: '#3b82f6' },
    ],
  },
  'neon-glow': {
    weight: '900',
    fill: '#e0f2fe',
    shadows: [
      { dx: 0, dy: 0, blur: 6, color: '#38bdf8' },
      { dx: 0, dy: 0, blur: 14, color: '#0284c7' },
      { dx: 0, dy: 0, blur: 28, color: '#ec4899' },
    ],
  },
  chrome: {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#ffffff' },
        { offset: 0.45, color: '#cbd5e1' },
        { offset: 0.52, color: '#475569' },
        { offset: 1, color: '#e2e8f0' },
      ],
    },
    shadows: [{ dx: 0, dy: 2, blur: 3, color: 'rgba(15,23,42,0.45)' }],
  },
  fire: {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#fef08a' },
        { offset: 0.55, color: '#f97316' },
        { offset: 1, color: '#dc2626' },
      ],
    },
    shadows: [{ dx: 0, dy: 3, blur: 8, color: 'rgba(239,68,68,0.55)' }],
  },
  'comic-pop': {
    weight: '900',
    fill: '#facc15',
    stroke: { width: 2, color: '#0f172a' },
    shadows: [{ dx: 4, dy: 4, blur: 0, color: '#0f172a' }],
  },
  'emerald-3d': {
    weight: '900',
    fill: '#10b981',
    shadows: [
      { dx: 1, dy: 1, blur: 0, color: '#065f46' },
      { dx: 2, dy: 2, blur: 0, color: '#064e3b' },
      { dx: 3, dy: 3, blur: 0, color: '#022c22' },
      { dx: 4, dy: 5, blur: 8, color: 'rgba(0,0,0,0.35)' },
    ],
  },
  'sunset-gradient': {
    weight: '900',
    gradient: {
      angle: 135,
      stops: [
        { offset: 0, color: '#ec4899' },
        { offset: 0.55, color: '#f97316' },
        { offset: 1, color: '#facc15' },
      ],
    },
    shadows: [{ dx: 0, dy: 2, blur: 4, color: 'rgba(236,72,153,0.3)' }],
  },
  'gradient-blue': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#93c5fd' },
        { offset: 0.48, color: '#3b82f6' },
        { offset: 1, color: '#1d4ed8' },
      ],
    },
    shadows: [{ dx: 0, dy: 2, blur: 4, color: 'rgba(29,78,216,0.35)' }],
  },
};

/** Paint instructions for a style, or undefined for plain text. */
export function wordArtPaint(style?: WordArtStyle): WordArtPaint | undefined {
  if (!style || style === 'none') return undefined;
  return PAINT[style];
}

/** The weight a style forces on the type (layout must measure with it too). */
export function wordArtWeight(style?: WordArtStyle): '800' | '900' | undefined {
  return wordArtPaint(style)?.weight;
}

function shadowCss(s: WordArtShadow): string {
  return `${s.dx}px ${s.dy}px ${s.blur}px ${s.color}`;
}

/**
 * DOM paint for a style. `background`/`gradient` are returned separately
 * because a gradient has to be clipped to the glyphs on the glyph wrapper,
 * never on the element box (it would swallow the box fill).
 */
export interface WordArtCss {
  fontWeight?: '800' | '900';
  color?: string;
  /** `linear-gradient(...)` value, already ordered. */
  backgroundImage?: string;
  /** Glyphs must be transparent so the gradient shows through them. */
  textFillTransparent?: boolean;
  webkitTextStroke?: string;
  textShadow?: string;
}

export function wordArtCss(style?: WordArtStyle): WordArtCss {
  const paint = wordArtPaint(style);
  if (!paint) return {};
  const css: WordArtCss = { fontWeight: paint.weight };
  if (paint.fill) css.color = paint.fill;
  if (paint.gradient) {
    const stops = [...paint.gradient.stops]
      .sort((a, b) => a.offset - b.offset)
      .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
      .join(', ');
    css.backgroundImage = `linear-gradient(${paint.gradient.angle}deg, ${stops})`;
    css.textFillTransparent = true;
  }
  if (paint.stroke) css.webkitTextStroke = `${paint.stroke.width}px ${paint.stroke.color}`;
  if (paint.shadows.length) css.textShadow = paint.shadows.map(shadowCss).join(', ');
  return css;
}
