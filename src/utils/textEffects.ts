import type { TextElement } from '../types/publisher';

/**
 * Text effects, defined once and consumed by both the DOM renderer and the
 * canvas exporter. Anything that can't be expressed as paint instructions here
 * would drift between screen and print, so effects stay declarative: shadows,
 * strokes, gradient fills and clipped "slice" copies.
 */

export type TextEffectId =
  | 'none'
  | 'shadow'
  | 'lift'
  | 'outline'
  | 'hollow'
  | 'echo'
  | 'splice'
  | 'neon'
  | 'fire'
  | 'glitch';

export interface EffectShadow {
  dx: number;
  dy: number;
  blur: number;
  color: string;
}

export interface EffectSlice {
  /** Clip fractions of the text box (0..1). */
  top: number;
  right: number;
  bottom: number;
  left: number;
  dx: number;
  dy: number;
  color: string;
  opacity?: number;
}

export interface TextEffectPaint {
  id: TextEffectId;
  shadows: EffectShadow[];
  /** Text fill replaced by the frame (outline / hollow looks). */
  fillTransparent: boolean;
  strokeWidth: number;
  strokeColor: string;
  gradient?: { from: string; to: string; angle: number };
  slices: EffectSlice[];
  /** Ready-made CSS value for the DOM renderer. */
  cssShadow: string;
}

export interface TextEffectDefinition {
  id: TextEffectId;
  label: string;
  description: string;
  /** Swatch pair used by the picker. */
  swatch: [string, string];
}

export const TEXT_EFFECTS: TextEffectDefinition[] = [
  { id: 'none', label: 'None', description: 'Flat type', swatch: ['#0f172a', '#ffffff'] },
  { id: 'shadow', label: 'Shadow', description: 'Soft drop shadow', swatch: ['#0f172a', '#94a3b8'] },
  { id: 'lift', label: 'Lift', description: 'Stacked card shadow', swatch: ['#0f172a', '#cbd5e1'] },
  { id: 'outline', label: 'Outline', description: 'Fill with a crisp stroke', swatch: ['#ffffff', '#0f172a'] },
  { id: 'hollow', label: 'Hollow', description: 'Stroke only, no fill', swatch: ['#0f172a', '#ffffff'] },
  { id: 'echo', label: 'Echo', description: 'Repeating offset copies', swatch: ['#6e56cf', '#c4b5fd'] },
  { id: 'splice', label: 'Splice', description: 'Top and bottom halves offset', swatch: ['#0f172a', '#f43f5e'] },
  { id: 'neon', label: 'Neon', description: 'Glowing tube light', swatch: ['#22d3ee', '#0f172a'] },
  { id: 'fire', label: 'Fire', description: 'Ember gradient with heat glow', swatch: ['#f59e0b', '#dc2626'] },
  { id: 'glitch', label: 'Glitch', description: 'RGB channel split', swatch: ['#06b6d4', '#ec4899'] },
];

const DEFAULT_EFFECT_COLORS: Record<TextEffectId, string> = {
  none: '#0f172a',
  shadow: 'rgba(15,23,42,0.35)',
  lift: 'rgba(15,23,42,0.22)',
  outline: '#0f172a',
  hollow: '#0f172a',
  echo: 'rgba(110,86,207,0.55)',
  splice: '#f43f5e',
  neon: '#22d3ee',
  fire: '#f97316',
  glitch: '#06b6d4',
};

function hexToRgba(color: string, alpha: number): string {
  const clean = color.trim();
  if (clean.startsWith('rgba') || clean.startsWith('rgb')) return clean;
  const hex = clean.replace('#', '');
  if (hex.length !== 6) return `rgba(15,23,42,${alpha})`;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function resolveTextEffectId(el: Pick<TextElement, 'textEffect' | 'shadow'>): TextEffectId {
  if (el.textEffect && el.textEffect !== 'none') return el.textEffect;
  if (el.shadow) return 'shadow';
  return 'none';
}

/**
 * Turns the effect name on an element into concrete paint instructions.
 */
export function buildTextEffectPainter(el: TextElement): TextEffectPaint {
  const id = resolveTextEffectId(el);
  const accent = el.textEffectColor || DEFAULT_EFFECT_COLORS[id];
  const strokeWidth = el.textStrokeWidth ?? 0;
  const strokeColor = el.textStrokeColor || '#000000';

  const paint: TextEffectPaint = {
    id,
    shadows: [],
    fillTransparent: false,
    strokeWidth,
    strokeColor,
    slices: [],
    cssShadow: '',
  };

  switch (id) {
    case 'shadow': {
      paint.shadows = [
        {
          dx: 2,
          dy: 3,
          blur: el.shadowBlur ?? 6,
          // Honour the pre-effects shadow colour so existing decks keep their look.
          color: el.shadowColor || accent,
        },
      ];
      break;
    }
    case 'lift': {
      paint.shadows = [
        { dx: 0, dy: 2, blur: 0, color: hexToRgba(accent, 0.18) },
        { dx: 0, dy: 5, blur: 2, color: hexToRgba(accent, 0.14) },
        { dx: 0, dy: 10, blur: 12, color: hexToRgba(accent, 0.1) },
      ];
      break;
    }
    case 'outline': {
      paint.strokeWidth = strokeWidth > 0 ? strokeWidth : 3;
      paint.strokeColor = strokeColor !== '#000000' ? strokeColor : accent;
      break;
    }
    case 'hollow': {
      paint.fillTransparent = true;
      paint.strokeWidth = strokeWidth > 0 ? strokeWidth : 2;
      paint.strokeColor = strokeColor !== '#000000' ? strokeColor : accent;
      break;
    }
    case 'echo': {
      paint.shadows = [
        { dx: 4, dy: 4, blur: 0, color: hexToRgba(accent, 0.45) },
        { dx: 8, dy: 8, blur: 0, color: hexToRgba(accent, 0.28) },
        { dx: 12, dy: 12, blur: 0, color: hexToRgba(accent, 0.14) },
      ];
      break;
    }
    case 'splice': {
      paint.slices = [
        { top: 0, right: 0, bottom: 0.5, left: 0, dx: -4, dy: -2, color: accent },
        { top: 0.5, right: 0, bottom: 0, left: 0, dx: 4, dy: 2, color: accent },
      ];
      break;
    }
    case 'neon': {
      paint.shadows = [
        { dx: 0, dy: 0, blur: 6, color: accent },
        { dx: 0, dy: 0, blur: 16, color: hexToRgba(accent, 0.8) },
        { dx: 0, dy: 0, blur: 34, color: hexToRgba(accent, 0.45) },
      ];
      paint.strokeWidth = strokeWidth > 0 ? strokeWidth : 1;
      paint.strokeColor = strokeColor !== '#000000' ? strokeColor : accent;
      break;
    }
    case 'fire': {
      paint.gradient = { from: '#fde047', to: '#dc2626', angle: 90 };
      paint.shadows = [
        { dx: 0, dy: 0, blur: 14, color: hexToRgba(accent, 0.7) },
        { dx: 0, dy: -4, blur: 26, color: 'rgba(251,146,60,0.35)' },
      ];
      break;
    }
    case 'glitch': {
      paint.slices = [
        { top: 0.18, right: 0, bottom: 0.42, left: 0, dx: -3, dy: 0, color: '#06b6d4' },
        { top: 0.38, right: 0, bottom: 0.12, left: 0, dx: 3, dy: 0, color: '#ec4899' },
      ];
      break;
    }
    default:
      break;
  }

  paint.cssShadow = paint.shadows
    .map((s) => `${s.dx}px ${s.dy}px ${s.blur}px ${s.color}`)
    .join(', ');

  return paint;
}

/** Curve presets surfaced as one-tap buttons next to the slider. */
export const TEXT_CURVE_PRESETS: { id: string; label: string; value: number }[] = [
  { id: 'flat', label: 'Flat', value: 0 },
  { id: 'arch', label: 'Arch', value: 35 },
  { id: 'bowl', label: 'Bowl', value: -35 },
  { id: 'bridge', label: 'Bridge', value: 65 },
  { id: 'ring', label: 'Ring', value: 100 },
  { id: 'circle-down', label: 'Trough', value: -100 },
];
