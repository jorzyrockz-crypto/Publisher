export interface RecolorPalettePreset {
  id: string;
  name: string;
  colors: [string, string, string, string]; // [primary, secondary, accent, dark/stroke]
}

export const RECOLOR_PALETTE_PRESETS: RecolorPalettePreset[] = [
  { id: 'navy-gold', name: 'Navy & Gold', colors: ['#1e3a8a', '#3b82f6', '#f59e0b', '#0f172a'] },
  { id: 'forest-sage', name: 'Forest Sage', colors: ['#15803d', '#86efac', '#f59e0b', '#14532d'] },
  { id: 'berry-pop', name: 'Berry Pop', colors: ['#db2777', '#fbcfe8', '#8b5cf6', '#500724'] },
  { id: 'sunset-warm', name: 'Sunset Warm', colors: ['#ea580c', '#fed7aa', '#facc15', '#7c2d12'] },
  { id: 'sky-mint', name: 'Sky & Mint', colors: ['#0284c7', '#bae6fd', '#10b981', '#0c4a6e'] },
  { id: 'mono-noir', name: 'Mono Noir', colors: ['#334155', '#cbd5e1', '#64748b', '#0f172a'] },
];

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
export function extractSvgPalette(src: string): string[] {
  if (!isSvgDataUri(src)) return [];
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
  return result;
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
