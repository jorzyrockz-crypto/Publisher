import type { BrandKit } from '../types/publisher';

export function isSvgDataUri(src?: string): boolean {
  if (!src) return false;
  return src.startsWith('data:image/svg+xml');
}

export function decodeSvgDataUri(src: string): string {
  const commaIdx = src.indexOf(',');
  if (commaIdx === -1) return '';
  const meta = src.slice(0, commaIdx).toLowerCase();
  const body = src.slice(commaIdx + 1);
  if (meta.includes(';base64')) {
    try {
      return atob(body);
    } catch {
      return '';
    }
  }
  try {
    return decodeURIComponent(body);
  } catch {
    return body;
  }
}

export function encodeSvgDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function normalizeHex(hex: string): string {
  const clean = hex.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(clean)) {
    return `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`;
  }
  if (/^#[0-9a-f]{6}$/.test(clean)) {
    return clean;
  }
  return clean;
}

/**
 * Extracts up to 8 distinct hex colors from an SVG data URI in order of appearance.
 */
const svgPaletteCache = new Map<string, string[]>();
const svgColorRolesCache = new Map<string, SvgColorRole[]>();

function cacheSet<T>(cache: Map<string, T>, key: string, value: T): T {
  if (cache.size >= 64) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(key, value);
  return value;
}

export function extractSvgPalette(src: string): string[] {
  if (!isSvgDataUri(src)) return [];
  const cached = svgPaletteCache.get(src);
  if (cached) return cached;
  const svg = decodeSvgDataUri(src);
  if (!svg) return [];

  const matches = svg.match(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g) || [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const m of matches) {
    const norm = normalizeHex(m);
    if (!seen.has(norm)) {
      seen.add(norm);
      result.push(norm);
      if (result.length >= 8) break;
    }
  }
  return cacheSet(svgPaletteCache, src, result);
}

/**
 * Replaces source hex colors inside an SVG data URI with target colors cleanly.
 */
export function recolorSvgDataUri(
  src: string,
  colorMap: Record<string, string>
): string {
  if (!isSvgDataUri(src)) return src;
  const svg = decodeSvgDataUri(src);
  if (!svg) return src;

  const normalizedMap = new Map<string, string>();
  for (const [k, v] of Object.entries(colorMap)) {
    normalizedMap.set(normalizeHex(k), normalizeHex(v));
  }

  const updated = svg.replace(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, (match) => {
    const norm = normalizeHex(match);
    return normalizedMap.get(norm) || match;
  });

  return encodeSvgDataUri(updated);
}


/* ------------------------------------------------------------------------- */
/* Smart recolor                                                             */
/* ------------------------------------------------------------------------- */

export type SmartRecolorMode = 'brand' | 'mono' | 'tint';

export interface SvgColorRole {
  color: string;
  count: number;
  luminance: number;
  saturation: number;
  role: 'ink' | 'dominant' | 'secondary' | 'accent' | 'highlight' | 'compound';
}

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = normalizeHex(hex);
  if (!/^#[0-9a-f]{6}$/.test(clean)) return null;
  return [
    parseInt(clean.slice(1, 3), 16),
    parseInt(clean.slice(3, 5), 16),
    parseInt(clean.slice(5, 7), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('')}`;
}

/** WCAG relative luminance, 0 (black) .. 1 (white). */
export function relativeLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0.5;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function saturationOf(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const l = (max + min) / 2;
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

/** WCAG contrast ratio, 1 (identical) .. 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

function mixColors(a: string, b: string, weightB: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  if (!ca || !cb) return a;
  const w = Math.max(0, Math.min(1, weightB));
  return rgbToHex(
    ca[0] * (1 - w) + cb[0] * w,
    ca[1] * (1 - w) + cb[1] * w,
    ca[2] * (1 - w) + cb[2] * w
  );
}

function isNearWhite(color: string): boolean {
  return relativeLuminance(color) >= 0.94 && saturationOf(color) < 0.15;
}

function hasEmbeddedRaster(svg: string): boolean {
  return /<image[\s>]/i.test(svg) || /data:image\/png/i.test(svg) || /data:image\/jpe?g/i.test(svg);
}

/**
 * True when a source can be recolored: an inline SVG with hex fills, no embedded
 * raster and at least one colour to work with.
 */
export function isRecolorableSvg(src?: string): boolean {
  if (!src || !isSvgDataUri(src)) return false;
  const svg = decodeSvgDataUri(src);
  if (!svg || hasEmbeddedRaster(svg)) return false;
  return analyzeSvgColors(src).length > 0;
}

/**
 * Ranks the colours inside an SVG by how much of the artwork they cover, and
 * labels them so a brand palette can be applied meaningfully.
 */
export function analyzeSvgColors(src: string): SvgColorRole[] {
  if (!isSvgDataUri(src)) return [];
  const cached = svgColorRolesCache.get(src);
  if (cached) return cached;
  const svg = decodeSvgDataUri(src);
  if (!svg) return [];

  const counts = new Map<string, number>();
  const matches = svg.match(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g) || [];
  for (const raw of matches) {
    const norm = normalizeHex(raw);
    if (!/^#[0-9a-f]{6}$/.test(norm)) continue;
    counts.set(norm, (counts.get(norm) || 0) + 1);
  }

  const entries = Array.from(counts.entries())
    .map(([color, count]) => ({
      color,
      count,
      luminance: relativeLuminance(color),
      saturation: saturationOf(color),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  if (entries.length === 0) return [];

  // "Ink" is line work: near-neutral and dark. A saturated navy that happens to
  // be the darkest colour is artwork, not ink, and keeps a brand hue.
  const inkEntry =
    entries
      .filter((e) => (e.saturation < 0.3 && e.luminance < 0.4) || e.luminance < 0.02)
      .reduce<typeof entries[number] | null>(
        (acc, cur) => (!acc || cur.luminance < acc.luminance ? cur : acc),
        null
      ) ?? undefined;

  const chromatic = entries.filter(
    (e) => !isNearWhite(e.color) && e.color !== inkEntry?.color
  );
  const rankedChromatic = [...chromatic].sort((a, b) => b.count - a.count);

  return cacheSet(
    svgColorRolesCache,
    src,
    entries.map((entry) => {
      let role: SvgColorRole['role'] = 'compound';
      if (isNearWhite(entry.color)) role = 'highlight';
      else if (entry.color === inkEntry?.color) role = 'ink';
      else if (rankedChromatic[0]?.color === entry.color) role = 'dominant';
      else if (rankedChromatic[1]?.color === entry.color) role = 'secondary';
      else if (rankedChromatic[2]?.color === entry.color) role = 'accent';
      return { ...entry, role } as SvgColorRole;
    })
  );
}

interface SmartTargets {
  ink: string;
  dominant: string;
  secondary: string;
  accent: string;
  onDark: boolean;
}

function pickReadable(candidate: string, backdrop: string, minimum = 2.4): string {
  if (contrastRatio(candidate, backdrop) >= minimum) return candidate;
  const options = ['#ffffff', '#0f172a'];
  return options.sort((a, b) => contrastRatio(b, backdrop) - contrastRatio(a, backdrop))[0];
}

/**
 * Derives the ink / dominant / secondary targets from the active brand kit while
 * keeping the artwork readable on the surface it actually sits on.
 */
export function getSmartRecolorTargets(kit: BrandKit, backdrop: string): SmartTargets {
  const onDark = relativeLuminance(backdrop) < 0.45;
  const colors = kit.colors;
  // Brand hues are decorative, so they only need to separate from the backdrop
  // enough to read as art (not the 4.5:1 reserved for text). Ink is held higher.
  const inkMin = onDark ? 3 : 2.4;
  const primary = pickReadable(colors.primary, backdrop, 1.5);
  const secondary = pickReadable(colors.secondary, backdrop, 1.5);
  const accent = pickReadable(colors.accent, backdrop, 1.5);
  const ink = onDark
    ? pickReadable(
        colors.light && relativeLuminance(colors.light) > 0.6 ? colors.light : '#ffffff',
        backdrop,
        inkMin
      )
    : pickReadable(colors.dark, backdrop, inkMin);
  return { ink, dominant: primary, secondary, accent, onDark };
}

/**
 * Recolors an SVG against a brand kit and the colour behind it.
 *
 * - `brand` maps the artwork's dominant / secondary / accent / ink colours onto
 *   the kit, so old clip art adopts the new identity.
 * - `mono` collapses everything to one readable ink colour.
 * - `tint` keeps the artwork quiet by blending the brand primary into the
 *   backdrop, which suits watermarks and background art.
 */
export function smartRecolorSvg(
  src: string,
  kit: BrandKit,
  backdrop: string,
  mode: SmartRecolorMode = 'brand'
): string {
  const roles = analyzeSvgColors(src);
  if (roles.length === 0) return src;
  const targets = getSmartRecolorTargets(kit, backdrop);

  const map: Record<string, string> = {};
  for (const role of roles) {
    if (role.role === 'highlight') continue; // paper / highlights stay untouched
    if (mode === 'mono') {
      map[role.color] = targets.ink;
      continue;
    }
    if (mode === 'tint') {
      const weight = role.role === 'ink' ? 0.55 : role.role === 'dominant' ? 0.62 : 0.78;
      map[role.color] = mixColors(targets.dominant, backdrop, weight);
      continue;
    }
    switch (role.role) {
      case 'ink':
        map[role.color] = targets.ink;
        break;
      case 'accent':
        map[role.color] = targets.accent;
        break;
      case 'secondary':
        map[role.color] = targets.secondary;
        break;
      default:
        map[role.color] = targets.dominant;
    }
  }

  return recolorSvgDataUri(src, map);
}

/** Preview swatches for the UI: what `smartRecolorSvg` would paint the art with. */
export function getSmartRecolorPreview(
  src: string,
  kit: BrandKit,
  backdrop: string,
  mode: SmartRecolorMode = 'brand'
): string[] {
  const recolored = smartRecolorSvg(src, kit, backdrop, mode);
  return extractSvgPalette(recolored);
}
