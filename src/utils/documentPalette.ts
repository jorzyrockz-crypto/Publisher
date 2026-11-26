/**
 * Document-aware colour intelligence for StudioPress.
 *
 * The colour picker should not offer an arbitrary rainbow: it should offer
 * colours that belong to *the document you are working on*. This module mines
 * the active page (plus the rest of the project, weighted lower) for the colours
 * actually in use, picks a dominant "anchor" hue, and derives classical harmony
 * sets (complementary, split-complementary, analogous, triadic, tints/shades)
 * from that anchor.
 *
 * Generated swatches are also filtered for the role they will play, so text
 * swatches always clear WCAG AA against the surface they land on, fills never
 * disappear into the page background, and background swatches keep the existing
 * text readable.
 */

import { DocumentProject, Page, PublisherElement } from '../types/publisher';
import { COLOR_SCHEMES } from '../constants/colorSchemes';

/* ------------------------------------------------------------------ */
/* Colour primitives                                                   */
/* ------------------------------------------------------------------ */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function normalizeHex(input: string | undefined | null): string | null {
  if (!input) return null;
  const value = input.trim().toLowerCase();
  if (!value || value === 'transparent' || value === 'none' || value === 'currentcolor') return null;

  if (value.startsWith('#')) {
    const hex = value.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      const expanded = hex
        .slice(0, 3)
        .split('')
        .map((c) => c + c)
        .join('');
      return `#${expanded}`;
    }
    if (hex.length === 6 || hex.length === 8) return `#${hex.slice(0, 6)}`;
    return null;
  }

  const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(/[,/\s]+/).filter(Boolean).map(Number);
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n))) {
      return rgbToHex({ r: parts[0], g: parts[1], b: parts[2] });
    }
  }

  // Named colours used in the codebase
  const named: Record<string, string> = {
    white: '#ffffff',
    black: '#000000',
    red: '#ff0000',
    transparent: '',
  };
  return named[value] || null;
}

export function hexToRgb(hex: string): RGB {
  const normalized = normalizeHex(hex) || '#000000';
  const int = parseInt(normalized.slice(1), 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) =>
    clamp(Math.round(n), 0, 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h, s: clamp(s, 0, 1), l: clamp(l, 0, 1) };
}

export function hslToHex({ h, s, l }: HSL): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 1);
  const light = clamp(l, 0, 1);
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;

  let rgb: RGB;
  if (hue < 60) rgb = { r: c, g: x, b: 0 };
  else if (hue < 120) rgb = { r: x, g: c, b: 0 };
  else if (hue < 180) rgb = { r: 0, g: c, b: x };
  else if (hue < 240) rgb = { r: 0, g: x, b: c };
  else if (hue < 300) rgb = { r: x, g: 0, b: c };
  else rgb = { r: c, g: 0, b: x };

  return rgbToHex({ r: (rgb.r + m) * 255, g: (rgb.g + m) * 255, b: (rgb.b + m) * 255 });
}

export function hexToHsl(hex: string): HSL {
  return rgbToHsl(hexToRgb(hex));
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const w = clamp(t, 0, 1);
  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * w,
    g: ca.g + (cb.g - ca.g) * w,
    b: ca.b + (cb.b - ca.b) * w,
  });
}

/** Nudges `fg` lighter/darker until it clears `minRatio` against `bg`. */
export function ensureContrast(fg: string, bg: string, minRatio = 4.5): string {
  if (contrastRatio(fg, bg) >= minRatio) return fg;

  const hsl = hexToHsl(fg);
  // On a light surface we darken; on a dark surface we lighten.
  const darken = relativeLuminance(bg) > 0.4;
  let passes = darken ? 0 : 1; // endpoint guaranteed to pass
  let fails = hsl.l; // original lightness (by definition fails here)

  for (let i = 0; i < 20; i++) {
    const mid = (passes + fails) / 2;
    const candidate = hslToHex({ ...hsl, l: mid });
    if (contrastRatio(candidate, bg) >= minRatio) passes = mid;
    else fails = mid;
  }

  return hslToHex({ ...hsl, l: passes });
}

/** Perceived difference used to drop near-duplicate swatches. */
function colorDistance(a: string, b: string): number {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const dr = (ca.r - cb.r) / 255;
  const dg = (ca.g - cb.g) / 255;
  const db = (ca.b - cb.b) / 255;
  return Math.sqrt(dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11);
}

/* ------------------------------------------------------------------ */
/* Document palette extraction                                         */
/* ------------------------------------------------------------------ */

export interface DocumentPalette {
  /** Ranked colours actually present in the document. */
  colors: string[];
  /** Dominant chromatic colour used as the harmony anchor. */
  anchor: string;
  /** Surface colours (page background / gradient start). */
  background: string;
  /** Most common text colour, used to keep backgrounds readable. */
  textColor: string;
  /** True when the palette came from real artwork (not just the scheme). */
  hasArtworkColors: boolean;
}

function elementColors(el: PublisherElement): string[] {
  const out: string[] = [];
  const raw = el as unknown as Record<string, unknown>;

  const push = (key: string) => {
    const value = raw[key];
    if (typeof value === 'string') {
      const hex = normalizeHex(value);
      if (hex) out.push(hex);
    }
  };

  push('fillColor');
  push('gradientColor2');
  push('strokeColor');
  push('borderColor');
  push('color');
  push('accentColor');
  push('backgroundColor');
  push('headerBg');
  push('cellBg');
  push('altRowBg');
  push('textColor');

  return out;
}

function collectFromPage(page: Page, weight: number, weights: Map<string, number>) {
  const bump = (hex: string | null, extra = 1) => {
    if (!hex) return;
    weights.set(hex, (weights.get(hex) || 0) + weight * extra);
  };

  bump(normalizeHex(page.backgroundColor), 3);
  if (page.backgroundGradient) {
    bump(normalizeHex(page.backgroundGradient.color1), 2);
    bump(normalizeHex(page.backgroundGradient.color2), 2);
  }
  if (page.backgroundPattern) {
    bump(normalizeHex(page.backgroundPattern.color), 1.5);
  }

  page.elements.forEach((el) => {
    // Bigger blocks read as the dominant brand colour, so weight by area.
    const area = (el.width * el.height) / (page.width * page.height);
    const areaWeight = Math.max(1, Math.min(4, area * 8));
    elementColors(el).forEach((hex) => bump(hex, areaWeight));
  });
}

const paletteCache = new WeakMap<object, Map<string, DocumentPalette>>();

/**
 * Public entry point — memoised per project revision so the ~30 mounted colour
 * inputs share a single document analysis.
 */
export function analyzeDocument(
  project: DocumentProject | null | undefined,
  page?: Page | null
): DocumentPalette {
  if (!project || typeof project !== 'object') return computeDocumentPalette(project, page);

  const pageKey = page?.id || `page-index:${project.activePageIndex ?? 0}`;
  let perProject = paletteCache.get(project);
  if (!perProject) {
    perProject = new Map();
    paletteCache.set(project, perProject);
  }
  const cached = perProject.get(pageKey);
  if (cached) return cached;

  const computed = computeDocumentPalette(project, page);
  perProject.set(pageKey, computed);
  return computed;
}

function computeDocumentPalette(
  project: DocumentProject | null | undefined,
  page?: Page | null
): DocumentPalette {
  const scheme =
    COLOR_SCHEMES.find((s) => s.id === project?.colorScheme) || COLOR_SCHEMES[0];

  const activePage = page || project?.pages?.[project?.activePageIndex ?? 0] || null;
  const weights = new Map<string, number>();

  if (activePage) collectFromPage(activePage, 3, weights);
  project?.pages?.forEach((pg) => {
    if (activePage && pg.id === activePage.id) return;
    collectFromPage(pg, 0.6, weights);
  });

  const artworkColors = Array.from(weights.keys());

  // Scheme colours seed the palette so a blank page still produces good output
  [
    scheme.primary,
    scheme.secondary,
    scheme.accent,
    scheme.dark,
    scheme.light,
  ].forEach((c, i) => {
    const hex = normalizeHex(c);
    if (!hex) return;
    if (!weights.has(hex)) weights.set(hex, 0.8 - i * 0.12);
  });

  const ranked = Array.from(weights.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex);

  const background =
    normalizeHex(activePage?.backgroundColor) ||
    normalizeHex(activePage?.backgroundGradient?.color1) ||
    normalizeHex(scheme.background) ||
    '#ffffff';

  // Dominant chromatic colour = highest ranked with real saturation
  const anchor =
    ranked.find((hex) => {
      const { s, l } = hexToHsl(hex);
      return s >= 0.18 && l > 0.12 && l < 0.88;
    }) ||
    normalizeHex(scheme.primary) ||
    '#6e56cf';

  const textColor =
    ranked.find((hex) => {
      const { l } = hexToHsl(hex);
      return contrastRatio(hex, background) >= 4.5 && l < 0.45;
    }) ||
    (contrastRatio('#161a22', background) >= 4.5 ? '#161a22' : '#ffffff');

  return {
    colors: dedupeColors(ranked).slice(0, 12),
    anchor,
    background,
    textColor,
    hasArtworkColors: artworkColors.length > 0,
  };
}

function dedupeColors(list: string[], threshold = 0.06): string[] {
  const kept: string[] = [];
  list.forEach((hex) => {
    if (kept.some((k) => colorDistance(k, hex) < threshold)) return;
    kept.push(hex);
  });
  return kept;
}

/* ------------------------------------------------------------------ */
/* Harmony generation                                                  */
/* ------------------------------------------------------------------ */

export type ColorTarget = 'fill' | 'stroke' | 'text' | 'background';

export interface Swatch {
  hex: string;
  /** Contrast against the surface this colour will sit on (when known). */
  ratio?: number;
  /** True when the swatch was auto-adjusted to stay accessible. */
  adjusted?: boolean;
  label?: string;
}

export interface SwatchGroup {
  id: string;
  label: string;
  hint?: string;
  swatches: Swatch[];
}

interface BuildOptions {
  target?: ColorTarget;
  /** Surface the colour will be applied on (page background, shape fill…). */
  surface?: string;
  /** Cap per group. */
  limit?: number;
}

/** Keeps generated harmonies out of neon territory. */
function toneDown(hsl: HSL): HSL {
  return {
    h: hsl.h,
    s: Math.min(hsl.s, 0.82),
    l: clamp(hsl.l, 0.26, 0.82),
  };
}

function rotate(anchorHsl: HSL, degrees: number, tweaks?: Partial<HSL>): string {
  return hslToHex(toneDown({ ...anchorHsl, h: anchorHsl.h + degrees, ...tweaks }));
}

/** Small lightness ladder so a hue group isn't just three identical chips. */
function ladder(hex: string, lightnesses: number[]): string[] {
  const hsl = hexToHsl(hex);
  return lightnesses.map((l) => hslToHex(toneDown({ ...hsl, l })));
}

function scoreSwatch(hex: string, options: BuildOptions): Swatch | null {
  const surface = options.surface;
  const target = options.target || 'fill';
  const ratio = surface ? contrastRatio(hex, surface) : undefined;

  if (!surface || !ratio) return { hex, ratio };

  if (target === 'text') {
    if (ratio >= 4.5) return { hex, ratio };
    const fixed = ensureContrast(hex, surface, 4.5);
    const fixedRatio = contrastRatio(fixed, surface);
    if (fixedRatio < 4.5) return null;
    return { hex: fixed, ratio: fixedRatio, adjusted: true };
  }

  if (target === 'background') {
    // `surface` is the document's text colour for background picks, so the
    // candidate is only offered when that text stays readable on it.
    if (ratio >= 4.5) return { hex, ratio };
    const fixed = ensureContrast(hex, surface, 4.5);
    const fixedRatio = contrastRatio(fixed, surface);
    if (fixedRatio < 4.5) return null;
    return { hex: fixed, ratio: fixedRatio, adjusted: true };
  }

  if (target === 'stroke') {
    if (ratio < 1.8) return null;
    return { hex, ratio };
  }

  // fill
  if (ratio < 1.15) return null;
  return { hex, ratio };
}

function toGroup(
  id: string,
  label: string,
  hexes: string[],
  options: BuildOptions,
  hint?: string
): SwatchGroup {
  const limit = options.limit ?? 8;
  const swatches: Swatch[] = [];
  dedupeColors(hexes, 0.045).forEach((hex) => {
    if (swatches.length >= limit) return;
    const scored = scoreSwatch(hex, options);
    if (!scored) return;
    if (swatches.some((s) => colorDistance(s.hex, scored.hex) < 0.05)) return;
    swatches.push(scored);
  });
  return { id, label, hint, swatches };
}

/**
 * Builds the smart palette shown in the picker: document colours first, then
 * harmonies derived from the document's dominant hue.
 */
export function buildSmartPalettes(
  palette: DocumentPalette,
  options: BuildOptions = {}
): SwatchGroup[] {
  const anchorHsl = hexToHsl(palette.anchor);
  const surface = options.surface || palette.background;

  const docColors = palette.colors;
  const complementary = [
    rotate(anchorHsl, 180),
    ...ladder(rotate(anchorHsl, 180), [0.32, 0.46, 0.62, 0.76]),
  ];
  const split = [
    rotate(anchorHsl, 150),
    rotate(anchorHsl, 210),
    ...ladder(rotate(anchorHsl, 150), [0.4, 0.6]),
    ...ladder(rotate(anchorHsl, 210), [0.4, 0.6]),
  ];
  const analogous = [
    rotate(anchorHsl, -30),
    rotate(anchorHsl, 30),
    rotate(anchorHsl, -15),
    rotate(anchorHsl, 15),
  ];
  const triadic = [rotate(anchorHsl, 120), rotate(anchorHsl, 240)];
  const tintsShades = [
    ...ladder(palette.anchor, [0.22, 0.36, 0.72, 0.86]),
    ...ladder(palette.anchor, [0.46, 0.58]),
  ];
  const neutrals = [
    palette.background,
    palette.textColor,
    mixHex(palette.anchor, '#ffffff', 0.9),
    mixHex(palette.anchor, '#000000', 0.78),
    mixHex(palette.anchor, palette.background, 0.75),
  ];

  const groups: SwatchGroup[] = [
    toGroup(
      'document',
      'In this document',
      docColors,
      { ...options, surface },
      palette.hasArtworkColors ? 'Mined from your artwork' : 'From the active colour scheme'
    ),
    toGroup('complementary', 'Complementary', complementary, { ...options, surface },
      `Opposite ${palette.anchor.toUpperCase()}`),
    toGroup('split', 'Split complementary', split, { ...options, surface }),
    toGroup('analogous', 'Analogous', analogous, { ...options, surface }),
    toGroup('triadic', 'Triadic', triadic, { ...options, surface }),
    toGroup('tones', 'Tints & shades', tintsShades, { ...options, surface }),
    toGroup('neutrals', 'Neutrals', neutrals, { ...options, surface }),
  ];

  return groups.filter((g) => g.swatches.length > 0);
}

/** Convenience: the 8 best swatches across all groups (for compact strips). */
export function topSmartSwatches(
  palette: DocumentPalette,
  options: BuildOptions = {},
  max = 8
): Swatch[] {
  const groups = buildSmartPalettes(palette, options);
  const out: Swatch[] = [];
  const pools = groups.map((g) => g.swatches.slice());
  let index = 0;
  while (out.length < max && pools.some((p) => p.length > 0)) {
    for (const pool of pools) {
      if (out.length >= max) break;
      const next = pool.shift();
      if (!next) continue;
      if (out.some((s) => colorDistance(s.hex, next.hex) < 0.05)) continue;
      out.push(next);
    }
    index++;
    if (index > 40) break;
  }
  return out;
}

export function formatRatio(ratio?: number): string {
  if (!ratio) return '';
  return `${ratio.toFixed(1)}:1`;
}
