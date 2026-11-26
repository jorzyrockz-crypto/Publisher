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
  { id: 'cinematic', label: 'Cinematic Gold', className: 'wordart-cinematic', dark: true },
  { id: 'holographic', label: 'Holographic AI', className: 'wordart-holographic', dark: true },
  { id: 'varsity', label: 'Varsity Block', className: 'wordart-varsity' },
  { id: 'synth-chrome', label: 'Synthwave AI Chrome', className: 'wordart-synth-chrome', dark: true },
  { id: 'liquid-glass', label: 'Liquid Glass Chrome', className: 'wordart-liquid-glass', dark: true },
  { id: 'rose-gold', label: 'Molten Rose Gold', className: 'wordart-rose-gold' },
  { id: 'cyber-acid', label: 'Cyberpunk Acid', className: 'wordart-cyber-acid', dark: true },
  { id: 'obsidian-gold', label: 'Obsidian & Gold Foil', className: 'wordart-obsidian-gold' },
  { id: 'candy-gloss', label: 'Candy 3D Gloss', className: 'wordart-candy-gloss' },
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

/**
 * Programmatic 3D block: `steps` copies of the glyphs marching back along
 * (dx, dy), the colour running start→end. CSS gets the same marching copies
 * as a drop-shadow chain, so the DOM, the canvas and the PDF agree.
 */
export interface WordArtExtrusion {
  steps: number;
  dx: number;
  dy: number;
  startColor: string;
  endColor: string;
}

export interface WordArtPaint {
  /** The style forces a heavier weight than the document's. */
  weight: '800' | '900';
  /** Some styles are only right in italic (synthwave, liquid metal). */
  italic?: boolean;
  fill?: string;
  gradient?: WordArtGradient;
  stroke?: { width: number; color: string };
  shadows: WordArtShadow[];
  /** Marching 3D block, painted behind everything. */
  extrusion?: WordArtExtrusion;
  /** Soft light spills (painted furthest back). */
  bloom?: { blur: number; color: string }[];
  /** One long cast shadow, painted after the extrusion. */
  castShadow?: WordArtShadow;
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
        { offset: 0, color: '#fde68a' },
        { offset: 0.45, color: '#f59e0b' },
        { offset: 1, color: '#b45309' },
      ],
    },
    // the brown edge is what keeps gold legible on cream certificates
    stroke: { width: 2, color: '#7c2d12' },
    shadows: [
      { dx: 0, dy: 2, blur: 3, color: 'rgba(120,53,15,0.35)' },
      { dx: 0, dy: 4, blur: 10, color: 'rgba(0,0,0,0.18)' },
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
      // 49% → 50% is the horizon: a bright sky snapping into a dark reflection
      stops: [
        { offset: 0, color: '#ffffff' },
        { offset: 0.32, color: '#dbe3ec' },
        { offset: 0.49, color: '#93a4b8' },
        { offset: 0.5, color: '#38455c' },
        { offset: 0.62, color: '#7c8ba1' },
        { offset: 0.8, color: '#c3cedd' },
        { offset: 1, color: '#f2f6fa' },
      ],
    },
    stroke: { width: 1.5, color: '#1e293b' },
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
  // Film-title gold: warm rim light, a deep ink edge so it survives a pale
  // backdrop, and a long soft cast shadow for depth.
  cinematic: {
    weight: '900',
    gradient: {
      angle: 178,
      stops: [
        { offset: 0, color: '#fff4d6' },
        { offset: 0.34, color: '#f0b45a' },
        { offset: 0.62, color: '#c8842e' },
        { offset: 1, color: '#f7e2b2' },
      ],
    },
    stroke: { width: 3, color: '#1b1206' },
    shadows: [
      { dx: 0, dy: 3, blur: 10, color: 'rgba(255,176,74,0.45)' },
      { dx: 0, dy: 10, blur: 26, color: 'rgba(0,0,0,0.55)' },
    ],
  },
  // Iridescent foil — the "AI render" look: violet to cyan to pink, lifted by
  // a cool bloom and held together with a near-black edge.
  holographic: {
    weight: '900',
    gradient: {
      angle: 135,
      // the white stop at 44% is the specular glint that sells the foil
      stops: [
        { offset: 0, color: '#a78bfa' },
        { offset: 0.2, color: '#22d3ee' },
        { offset: 0.44, color: '#f8fafc' },
        { offset: 0.46, color: '#f472b6' },
        { offset: 0.7, color: '#fde68a' },
        { offset: 1, color: '#c4b5fd' },
      ],
    },
    stroke: { width: 2, color: '#160f2e' },
    shadows: [
      { dx: 0, dy: 0, blur: 12, color: 'rgba(34,211,238,0.5)' },
      { dx: 0, dy: 2, blur: 4, color: 'rgba(10,10,30,0.45)' },
    ],
  },
  // College block letters: crisp white edge, hard offset shadow, no gradient.
  varsity: {
    weight: '900',
    fill: '#dc2626',
    stroke: { width: 4, color: '#ffffff' },
    shadows: [{ dx: 4, dy: 4, blur: 0, color: '#1e293b' }],
  },
  // Horizon-break metal: gold sky, a hard snap into indigo, cyan bounce under
  // it, a six-step ember block and a violet bloom — the "AI render" look.
  'synth-chrome': {
    weight: '900',
    italic: true,
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#fff9c4' },
        { offset: 0.24, color: '#ffca3a' },
        { offset: 0.48, color: '#ff6ec7' },
        { offset: 0.5, color: '#1e1b4b' },
        { offset: 0.72, color: '#2563eb' },
        { offset: 0.9, color: '#38bdf8' },
        { offset: 1, color: '#e0f2fe' },
      ],
    },
    stroke: { width: 2, color: '#fef08a' },
    extrusion: { steps: 6, dx: 0.8, dy: 1.3, startColor: '#ff7b00', endColor: '#9a1c00' },
    bloom: [{ blur: 14, color: 'rgba(168,85,247,0.55)' }],
    castShadow: { dx: 0, dy: 10, blur: 16, color: 'rgba(0,0,0,0.65)' },
    shadows: [],
  },
  'liquid-glass': {
    weight: '900',
    gradient: {
      angle: 175,
      stops: [
        { offset: 0, color: '#ffffff' },
        { offset: 0.28, color: '#e0f2fe' },
        { offset: 0.47, color: '#94a3b8' },
        { offset: 0.5, color: '#1e293b' },
        { offset: 0.68, color: '#cbd5e1' },
        { offset: 0.86, color: '#f8fafc' },
        { offset: 1, color: '#c4b5fd' },
      ],
    },
    stroke: { width: 1.5, color: '#ffffff' },
    extrusion: { steps: 4, dx: 0, dy: 1.2, startColor: '#64748b', endColor: '#0f172a' },
    bloom: [{ blur: 12, color: 'rgba(125,211,252,0.45)' }],
    castShadow: { dx: 0, dy: 8, blur: 14, color: 'rgba(15,23,42,0.45)' },
    shadows: [],
  },
  'rose-gold': {
    weight: '900',
    gradient: {
      angle: 168,
      stops: [
        { offset: 0, color: '#fff3e4' },
        { offset: 0.25, color: '#f0c39b' },
        { offset: 0.43, color: '#fde4cf' },
        { offset: 0.45, color: '#8f5344' },
        { offset: 0.62, color: '#c9805f' },
        { offset: 0.82, color: '#f3c9ac' },
        { offset: 1, color: '#fff8f0' },
      ],
    },
    stroke: { width: 2, color: '#fff1e0' },
    extrusion: { steps: 5, dx: 0.6, dy: 1.4, startColor: '#8a4a34', endColor: '#4a1d16' },
    bloom: [{ blur: 10, color: 'rgba(255,196,150,0.4)' }],
    castShadow: { dx: 0, dy: 9, blur: 18, color: 'rgba(60,20,10,0.5)' },
    shadows: [],
  },
  'cyber-acid': {
    weight: '900',
    gradient: {
      angle: 135,
      stops: [
        { offset: 0, color: '#ccff00' },
        { offset: 0.55, color: '#22d3ee' },
        { offset: 1, color: '#a78bfa' },
      ],
    },
    stroke: { width: 3, color: '#0a0a0a' },
    extrusion: { steps: 4, dx: 2.4, dy: 2.4, startColor: '#ff2bd6', endColor: '#a600a6' },
    bloom: [{ blur: 18, color: 'rgba(163,230,53,0.5)' }],
    shadows: [],
  },
  // Self-contained on light or dark: a glossy charcoal face with a hard
  // diagonal sheen and a gold foil edge.
  'obsidian-gold': {
    weight: '900',
    gradient: {
      angle: 150,
      stops: [
        { offset: 0, color: '#34343e' },
        { offset: 0.32, color: '#6a6a78' },
        { offset: 0.5, color: '#f8fafc' },
        { offset: 0.56, color: '#26262e' },
        { offset: 0.78, color: '#565663' },
        { offset: 1, color: '#2c2c34' },
      ],
    },
    stroke: { width: 3, color: '#f59e0b' },
    castShadow: { dx: 0, dy: 4, blur: 10, color: 'rgba(0,0,0,0.55)' },
    shadows: [],
  },
  'candy-gloss': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#fff0f5' },
        { offset: 0.12, color: '#ffb3c7' },
        { offset: 0.5, color: '#ff5c8a' },
        { offset: 0.8, color: '#e11d48' },
        { offset: 1, color: '#be123c' },
      ],
    },
    stroke: { width: 4, color: '#ffffff' },
    extrusion: { steps: 5, dx: 1.2, dy: 1.6, startColor: '#be123c', endColor: '#7f1d1d' },
    bloom: [{ blur: 10, color: 'rgba(255,92,138,0.35)' }],
    castShadow: { dx: 0, dy: 8, blur: 16, color: 'rgba(127,29,29,0.45)' },
    shadows: [],
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

/** Linear mix of two hex colours, for the extrusion ramp. */
function mixHex(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const to = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${to(ar + (br - ar) * t)}${to(ag + (bg - ag) * t)}${to(ab + (bb - ab) * t)}`;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Every layer that sits *behind* the glyphs, nearest first — the order CSS
 * lists its drop-shadows in, and the order the exporter walks backwards.
 * Extrusion copies, hand-authored shadows, the cast shadow, then the bloom.
 */
export function wordArtShadowChain(paint?: WordArtPaint): WordArtShadow[] {
  if (!paint) return [];
  const chain: WordArtShadow[] = [];
  const extrusion = paint.extrusion;
  if (extrusion) {
    const { steps, dx, dy, startColor, endColor } = extrusion;
    for (let i = 1; i <= steps; i += 1) {
      chain.push({
        dx: round2(dx * i),
        dy: round2(dy * i),
        blur: 0,
        color: mixHex(startColor, endColor, steps === 1 ? 1 : (i - 1) / (steps - 1)),
      });
    }
  }
  chain.push(...paint.shadows);
  if (paint.castShadow) chain.push(paint.castShadow);
  for (const bloom of paint.bloom ?? []) {
    chain.push({ dx: 0, dy: 0, blur: bloom.blur, color: bloom.color });
  }
  return chain;
}

/** True when the style only looks right in italic. */
export function wordArtItalic(style?: WordArtStyle): boolean {
  return !!wordArtPaint(style)?.italic;
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
  /** drop-shadow chain for every layer behind the glyphs. */
  filter?: string;
  /** 'italic' when the style slant is part of the look. */
  fontStyle?: 'italic';
}

export function wordArtCss(style?: WordArtStyle): WordArtCss {
  const paint = wordArtPaint(style);
  if (!paint) return {};
  const css: WordArtCss = { fontWeight: paint.weight };
  if (paint.italic) css.fontStyle = 'italic';
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
  // `text-shadow` bleeds through a background-clipped fill and muddies the
  // metal; a drop-shadow filter paints behind the clipped glyphs instead.
  const chain = wordArtShadowChain(paint);
  if (chain.length) css.filter = chain.map((s) => `drop-shadow(${shadowCss(s)})`).join(' ');
  return css;
}
