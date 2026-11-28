import {
  CollageMeta,
  CustomCollageLayoutConfig,
  DynamicLayoutMode,
  SlotMaskShape,
} from './borderArtStyles';

export type LayoutCategory = 'classic' | 'bento' | 'scrapbook' | 'editorial';
export type SlotOrientation = 'landscape' | 'portrait' | 'square';

export interface CollageSlotSpec {
  x: number; // normalized 0-1
  y: number;
  width: number;
  height: number;
  rotation?: number; // degrees
  zIndex?: number; // stacking order for overlapping layouts
  defaultMask?: SlotMaskShape;
  preferredOrientation?: SlotOrientation;
}

export interface CollageLayoutDef {
  id: string;
  name: string;
  category: LayoutCategory;
  slotCount: number;
  slots: CollageSlotSpec[];
}

export interface ComputedCollageSlot {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export const COLLAGE_LAYOUTS: CollageLayoutDef[] = [
  // Classic (8 original)
  {
    id: '2-split-v',
    name: '2 Side-by-Side',
    category: 'classic',
    slotCount: 2,
    slots: [
      { x: 0, y: 0, width: 0.5, height: 1, preferredOrientation: 'portrait' },
      { x: 0.5, y: 0, width: 0.5, height: 1, preferredOrientation: 'portrait' },
    ],
  },
  {
    id: '2-split-h',
    name: '2 Stacked',
    category: 'classic',
    slotCount: 2,
    slots: [
      { x: 0, y: 0, width: 1, height: 0.5, preferredOrientation: 'landscape' },
      { x: 0, y: 0.5, width: 1, height: 0.5, preferredOrientation: 'landscape' },
    ],
  },
  {
    id: '3-left-2',
    name: '1 Big + 2 Right',
    category: 'classic',
    slotCount: 3,
    slots: [
      { x: 0, y: 0, width: 0.55, height: 1, preferredOrientation: 'portrait' },
      { x: 0.55, y: 0, width: 0.45, height: 0.5, preferredOrientation: 'square' },
      { x: 0.55, y: 0.5, width: 0.45, height: 0.5, preferredOrientation: 'square' },
    ],
  },
  {
    id: '3-top-2',
    name: '1 Top + 2 Bottom',
    category: 'classic',
    slotCount: 3,
    slots: [
      { x: 0, y: 0, width: 1, height: 0.55, preferredOrientation: 'landscape' },
      { x: 0, y: 0.55, width: 0.5, height: 0.45, preferredOrientation: 'square' },
      { x: 0.5, y: 0.55, width: 0.5, height: 0.45, preferredOrientation: 'square' },
    ],
  },
  {
    id: '3-cols',
    name: '3 Columns',
    category: 'classic',
    slotCount: 3,
    slots: [
      { x: 0, y: 0, width: 1 / 3, height: 1, preferredOrientation: 'portrait' },
      { x: 1 / 3, y: 0, width: 1 / 3, height: 1, preferredOrientation: 'portrait' },
      { x: 2 / 3, y: 0, width: 1 / 3, height: 1, preferredOrientation: 'portrait' },
    ],
  },
  {
    id: '4-grid',
    name: '2×2 Classic Grid',
    category: 'classic',
    slotCount: 4,
    slots: [
      { x: 0, y: 0, width: 0.5, height: 0.5, preferredOrientation: 'square' },
      { x: 0.5, y: 0, width: 0.5, height: 0.5, preferredOrientation: 'square' },
      { x: 0, y: 0.5, width: 0.5, height: 0.5, preferredOrientation: 'square' },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5, preferredOrientation: 'square' },
    ],
  },
  {
    id: '4-hero-3',
    name: '1 Hero + 3 Strip',
    category: 'classic',
    slotCount: 4,
    slots: [
      { x: 0, y: 0, width: 1, height: 0.62, preferredOrientation: 'landscape' },
      { x: 0, y: 0.62, width: 1 / 3, height: 0.38, preferredOrientation: 'square' },
      { x: 1 / 3, y: 0.62, width: 1 / 3, height: 0.38, preferredOrientation: 'square' },
      { x: 2 / 3, y: 0.62, width: 1 / 3, height: 0.38, preferredOrientation: 'square' },
    ],
  },
  {
    id: '6-grid',
    name: '3×2 Gallery',
    category: 'classic',
    slotCount: 6,
    slots: [
      { x: 0, y: 0, width: 1 / 3, height: 0.5, preferredOrientation: 'portrait' },
      { x: 1 / 3, y: 0, width: 1 / 3, height: 0.5, preferredOrientation: 'portrait' },
      { x: 2 / 3, y: 0, width: 1 / 3, height: 0.5, preferredOrientation: 'portrait' },
      { x: 0, y: 0.5, width: 1 / 3, height: 0.5, preferredOrientation: 'portrait' },
      { x: 1 / 3, y: 0.5, width: 1 / 3, height: 0.5, preferredOrientation: 'portrait' },
      { x: 2 / 3, y: 0.5, width: 1 / 3, height: 0.5, preferredOrientation: 'portrait' },
    ],
  },

  // Bento / Mosaic (+3)
  {
    id: '5-bento',
    name: '5-Photo Bento Mosaic',
    category: 'bento',
    slotCount: 5,
    slots: [
      { x: 0, y: 0, width: 0.56, height: 0.6, preferredOrientation: 'square', zIndex: 1 },
      { x: 0.56, y: 0, width: 0.44, height: 0.3, preferredOrientation: 'landscape', zIndex: 1 },
      { x: 0.56, y: 0.3, width: 0.44, height: 0.3, preferredOrientation: 'landscape', zIndex: 1 },
      { x: 0, y: 0.6, width: 0.38, height: 0.4, preferredOrientation: 'square', zIndex: 1 },
      { x: 0.38, y: 0.6, width: 0.62, height: 0.4, preferredOrientation: 'landscape', zIndex: 1 },
    ],
  },
  {
    id: '5-center-focus',
    name: 'Center Hero + 4 Corners',
    category: 'bento',
    slotCount: 5,
    slots: [
      { x: 0, y: 0, width: 0.48, height: 0.48, preferredOrientation: 'square', zIndex: 1 },
      { x: 0.52, y: 0, width: 0.48, height: 0.48, preferredOrientation: 'square', zIndex: 1 },
      { x: 0, y: 0.52, width: 0.48, height: 0.48, preferredOrientation: 'square', zIndex: 1 },
      { x: 0.52, y: 0.52, width: 0.48, height: 0.48, preferredOrientation: 'square', zIndex: 1 },
      { x: 0.25, y: 0.25, width: 0.5, height: 0.5, preferredOrientation: 'square', zIndex: 4 },
    ],
  },
  {
    id: '6-moodboard',
    name: 'Moodboard Editorial',
    category: 'bento',
    slotCount: 6,
    slots: [
      { x: 0.02, y: 0.03, width: 0.48, height: 0.56, rotation: -1.5, zIndex: 1, preferredOrientation: 'portrait' },
      { x: 0.46, y: 0.05, width: 0.5, height: 0.36, rotation: 1.5, zIndex: 2, preferredOrientation: 'landscape' },
      { x: 0.38, y: 0.34, width: 0.36, height: 0.34, rotation: -1, zIndex: 4, preferredOrientation: 'square' },
      { x: 0.68, y: 0.38, width: 0.3, height: 0.36, rotation: 2, zIndex: 3, preferredOrientation: 'portrait' },
      { x: 0.04, y: 0.57, width: 0.44, height: 0.4, rotation: 1, zIndex: 2, preferredOrientation: 'square' },
      { x: 0.45, y: 0.66, width: 0.5, height: 0.31, rotation: -1.5, zIndex: 5, preferredOrientation: 'landscape' },
    ],
  },

  // Editorial (+5)
  {
    id: '4-pillars',
    name: '4 Story Strips',
    category: 'editorial',
    slotCount: 4,
    slots: [
      { x: 0, y: 0, width: 0.25, height: 1, preferredOrientation: 'portrait' },
      { x: 0.25, y: 0, width: 0.25, height: 1, preferredOrientation: 'portrait' },
      { x: 0.5, y: 0, width: 0.25, height: 1, preferredOrientation: 'portrait' },
      { x: 0.75, y: 0, width: 0.25, height: 1, preferredOrientation: 'portrait' },
    ],
  },
  {
    id: '4-filmstrip',
    name: 'Cinema Filmstrip (4)',
    category: 'editorial',
    slotCount: 4,
    slots: [
      { x: 0.04, y: 0.05, width: 0.92, height: 0.21, preferredOrientation: 'landscape' },
      { x: 0.04, y: 0.28, width: 0.92, height: 0.21, preferredOrientation: 'landscape' },
      { x: 0.04, y: 0.51, width: 0.92, height: 0.21, preferredOrientation: 'landscape' },
      { x: 0.04, y: 0.74, width: 0.92, height: 0.21, preferredOrientation: 'landscape' },
    ],
  },
  {
    id: '5-magazine-cover',
    name: 'Magazine Feature',
    category: 'editorial',
    slotCount: 5,
    slots: [
      { x: 0, y: 0, width: 1, height: 1, zIndex: 1, preferredOrientation: 'portrait' },
      { x: 0.64, y: 0.06, width: 0.3, height: 0.2, zIndex: 3, preferredOrientation: 'landscape' },
      { x: 0.64, y: 0.28, width: 0.3, height: 0.2, zIndex: 3, preferredOrientation: 'landscape' },
      { x: 0.06, y: 0.72, width: 0.28, height: 0.22, zIndex: 3, preferredOrientation: 'square' },
      { x: 0.36, y: 0.72, width: 0.28, height: 0.22, zIndex: 3, preferredOrientation: 'square' },
    ],
  },
  {
    id: '8-story',
    name: '4×2 Story Wall',
    category: 'editorial',
    slotCount: 8,
    slots: [
      { x: 0, y: 0, width: 0.25, height: 0.5, preferredOrientation: 'portrait' },
      { x: 0.25, y: 0, width: 0.25, height: 0.5, preferredOrientation: 'portrait' },
      { x: 0.5, y: 0, width: 0.25, height: 0.5, preferredOrientation: 'portrait' },
      { x: 0.75, y: 0, width: 0.25, height: 0.5, preferredOrientation: 'portrait' },
      { x: 0, y: 0.5, width: 0.25, height: 0.5, preferredOrientation: 'portrait' },
      { x: 0.25, y: 0.5, width: 0.25, height: 0.5, preferredOrientation: 'portrait' },
      { x: 0.5, y: 0.5, width: 0.25, height: 0.5, preferredOrientation: 'portrait' },
      { x: 0.75, y: 0.5, width: 0.25, height: 0.5, preferredOrientation: 'portrait' },
    ],
  },
  {
    id: '9-grid',
    name: '3×3 Classic Grid',
    category: 'editorial',
    slotCount: 9,
    slots: Array.from({ length: 9 }).map((_, idx) => ({
      x: (idx % 3) / 3,
      y: Math.floor(idx / 3) / 3,
      width: 1 / 3,
      height: 1 / 3,
      preferredOrientation: 'square' as SlotOrientation,
    })),
  },

  // Scrapbook (+2)
  {
    id: '3-polaroid-fan',
    name: '3 Polaroid Fan',
    category: 'scrapbook',
    slotCount: 3,
    slots: [
      { x: 0.04, y: 0.14, width: 0.42, height: 0.66, rotation: -8, zIndex: 1, preferredOrientation: 'portrait' },
      { x: 0.29, y: 0.08, width: 0.42, height: 0.68, rotation: 0, zIndex: 3, preferredOrientation: 'portrait' },
      { x: 0.54, y: 0.16, width: 0.42, height: 0.66, rotation: 8, zIndex: 2, preferredOrientation: 'portrait' },
    ],
  },
  {
    id: '4-scatter',
    name: '4 Polaroid Scatter',
    category: 'scrapbook',
    slotCount: 4,
    slots: [
      { x: 0.04, y: 0.04, width: 0.45, height: 0.45, rotation: -4, zIndex: 1, preferredOrientation: 'square' },
      { x: 0.51, y: 0.05, width: 0.45, height: 0.45, rotation: 3, zIndex: 2, preferredOrientation: 'square' },
      { x: 0.05, y: 0.5, width: 0.45, height: 0.45, rotation: -2, zIndex: 3, preferredOrientation: 'square' },
      { x: 0.5, y: 0.49, width: 0.45, height: 0.45, rotation: 5, zIndex: 4, preferredOrientation: 'square' },
    ],
  },
];

const FALLBACK_TILTS = [-4, 3, -2, 5, -3, 4, -5, 2, -1];

/**
 * Computes pixel rectangles, rotation, and zIndex for each collage slot inside containerWidth x containerHeight.
 */
export function computeCollageSlots(
  layout: CollageLayoutDef,
  containerWidth: number,
  containerHeight: number,
  gap: number,
  applyScatterTilt = false,
  slotScale = 1,
  sizeSeed = 0
): ComputedCollageSlot[] {
  const halfGap = gap / 2;
  const eps = 0.001;
  const safeScale = Math.max(0.5, Math.min(1.3, slotScale || 1));
  const sizeFactors = [1.16, 0.84, 1.08, 0.82, 1.14, 0.88, 1.04, 0.86];

  return layout.slots.map((slot, index) => {
    const isOverlapping = layout.category === 'scrapbook' || (slot.zIndex ?? 1) > 1;
    // For overlapping/scatter layouts, positive gap shrinks inward slightly to increase visible spacing
    const overlapInset = isOverlapping ? Math.max(0, gap * 0.35) : 0;
    const insetLeft = !isOverlapping && slot.x > eps ? halfGap : overlapInset;
    const insetRight = !isOverlapping && slot.x + slot.width < 1 - eps ? halfGap : overlapInset;
    const insetTop = !isOverlapping && slot.y > eps ? halfGap : overlapInset;
    const insetBottom = !isOverlapping && slot.y + slot.height < 1 - eps ? halfGap : overlapInset;

    const baseX = slot.x * containerWidth + insetLeft;
    const baseY = slot.y * containerHeight + insetTop;
    const baseW = Math.max(16, slot.width * containerWidth - insetLeft - insetRight);
    const baseH = Math.max(16, slot.height * containerHeight - insetTop - insetBottom);

    const seedFactor =
      sizeSeed > 0 ? sizeFactors[(index + sizeSeed * 3) % sizeFactors.length] : 1;
    const effScale = safeScale * seedFactor;

    const cx = baseX + baseW / 2;
    const cy = baseY + baseH / 2;
    const width = Math.max(16, Math.round(baseW * effScale));
    const height = Math.max(16, Math.round(baseH * effScale));
    const x = Math.round(cx - width / 2);
    const y = Math.round(cy - height / 2);

    const rotation =
      slot.rotation !== undefined
        ? applyScatterTilt || layout.category === 'scrapbook'
          ? slot.rotation
          : 0
        : applyScatterTilt
        ? FALLBACK_TILTS[index % FALLBACK_TILTS.length]
        : 0;

    const baseZ = slot.zIndex ?? index + 1;
    const zBoost = sizeSeed > 0 && seedFactor > 1.05 ? 3 : 0;

    return {
      index,
      x,
      y,
      width,
      height,
      rotation,
      zIndex: baseZ + zBoost,
    };
  });
}

/**
 * Matches uploaded photos against curated or dynamic collage layouts by photo count and orientation.
 */
export function suggestBestLayout(photos: Array<{ width: number; height: number }>): string {
  const rawCount = photos.length || 4;
  if (rawCount === 1) return 'dynamic-smart-grid-1';
  if (rawCount === 7 || rawCount > 9) {
    return `dynamic-smart-grid-${Math.min(24, rawCount)}`;
  }

  const targetCount = Math.max(2, Math.min(9, rawCount));
  const orientations: SlotOrientation[] = photos.map((p) => {
    const ratio = (p.width || 1) / Math.max(1, p.height || 1);
    if (ratio > 1.18) return 'landscape';
    if (ratio < 0.85) return 'portrait';
    return 'square';
  });

  let bestId = '4-grid';
  let bestScore = -Infinity;

  for (const layout of COLLAGE_LAYOUTS) {
    const countDiff = Math.abs(layout.slotCount - targetCount);
    let score = 20 - countDiff * 8;

    const compareCount = Math.min(orientations.length, layout.slots.length);
    for (let i = 0; i < compareCount; i++) {
      const want = layout.slots[i].preferredOrientation || 'square';
      if (orientations[i] === want) score += 3;
      else if (want === 'square' || orientations[i] === 'square') score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestId = layout.id;
    }
  }

  return bestId;
}

function distributeIntoRows(
  count: number,
  forcedColumns?: number,
  containerAspect = 1
): number[] {
  if (count <= 1) return [1];
  if (forcedColumns && forcedColumns >= 1) {
    const cols = Math.min(count, Math.max(1, Math.round(forcedColumns)));
    const rows: number[] = [];
    let remaining = count;
    while (remaining > 0) {
      const take = Math.min(cols, remaining);
      rows.push(take);
      remaining -= take;
    }
    return rows;
  }

  // Size-aware column count based on container/paper aspect ratio
  const safeAspect = Math.max(0.45, Math.min(2.2, containerAspect || 1));
  const cols = Math.max(
    1,
    Math.min(count, Math.round(Math.sqrt(count * safeAspect)))
  );
  const rowCount = Math.ceil(count / cols);
  const base = Math.floor(count / rowCount);
  const extra = count % rowCount;
  const rows: number[] = [];
  for (let r = 0; r < rowCount; r++) {
    // Put slightly fuller rows at the bottom for visual stability
    rows.push(r >= rowCount - extra ? base + 1 : base);
  }
  return rows;
}

function orientationFromDims(w?: number, h?: number): SlotOrientation {
  const ratio = (w || 1) / Math.max(1, h || 1);
  if (ratio > 1.18) return 'landscape';
  if (ratio < 0.85) return 'portrait';
  return 'square';
}

export const DYNAMIC_MODE_LABELS: Record<DynamicLayoutMode, string> = {
  'smart-grid': 'Smart Fit',
  'mosaic-featured': 'Featured Sizes',
  'hero-plus': 'Hero + Rest',
  'aspect-masonry': 'Aspect Masonry',
  scatter: 'Scatter',
};

function buildFeaturedMosaicSlots(
  count: number,
  photos: Array<{ width?: number; height?: number }>,
  containerAspect = 1,
  sizeSeed = 0
): CollageSlotSpec[] {
  const baseCols = count <= 3 ? 2 : count <= 7 ? 3 : count <= 14 ? 4 : 5;
  const cols =
    containerAspect < 0.8
      ? Math.max(2, baseCols - 1)
      : containerAspect > 1.35
      ? Math.min(6, baseCols + 1)
      : baseCols;
  const grid: boolean[][] = [];

  const ensureRows = (neededRows: number) => {
    while (grid.length < neededRows) {
      grid.push(Array(cols).fill(false));
    }
  };

  const canPlace = (r: number, c: number, w: number, h: number): boolean => {
    if (c + w > cols) return false;
    ensureRows(r + h);
    for (let rr = r; rr < r + h; rr++) {
      for (let cc = c; cc < c + w; cc++) {
        if (grid[rr][cc]) return false;
      }
    }
    return true;
  };

  const placeAt = (r: number, c: number, w: number, h: number) => {
    ensureRows(r + h);
    for (let rr = r; rr < r + h; rr++) {
      for (let cc = c; cc < c + w; cc++) {
        grid[rr][cc] = true;
      }
    }
  };

  interface PlacedCell {
    r: number;
    c: number;
    w: number;
    h: number;
    orient: SlotOrientation;
  }

  const placed: PlacedCell[] = [];
  const heroIdx = sizeSeed > 0 ? sizeSeed % count : 0;

  for (let i = 0; i < count; i++) {
    const orient = orientationFromDims(photos[i]?.width, photos[i]?.height);
    let wantW = 1;
    let wantH = 1;
    if (i === heroIdx && count >= 3) {
      wantW = cols >= 2 ? 2 : 1;
      wantH = count >= 4 ? 2 : 1;
    } else if (count >= 6 && ((i + sizeSeed) % 4 === 3)) {
      if (orient === 'portrait') {
        wantW = 1;
        wantH = 2;
      } else {
        wantW = 2;
        wantH = 1;
      }
    }

    let placedOk = false;
    const candidates: Array<[number, number]> = [
      [wantW, wantH],
      ...(wantW !== 1 || wantH !== 1 ? ([[1, 1]] as Array<[number, number]>) : []),
    ];

    for (const [cw, ch] of candidates) {
      for (let r = 0; !placedOk && r < 30; r++) {
        for (let c = 0; !placedOk && c < cols; c++) {
          if (canPlace(r, c, cw, ch)) {
            placeAt(r, c, cw, ch);
            placed.push({ r, c, w: cw, h: ch, orient });
            placedOk = true;
          }
        }
      }
      if (placedOk) break;
    }
  }

  const totalRows = Math.max(1, grid.length);
  // Stretch rightmost tile on any incomplete bottom/middle row to eliminate trailing gaps
  for (let r = 0; r < totalRows; r++) {
    let emptyTail = 0;
    for (let c = cols - 1; c >= 0; c--) {
      if (!grid[r][c]) emptyTail++;
      else break;
    }
    if (emptyTail > 0 && emptyTail < cols) {
      const targetCol = cols - emptyTail;
      const owner = placed.find(
        (p) => p.r <= r && p.r + p.h > r && p.c + p.w === targetCol && p.h === 1
      );
      if (owner) {
        for (let cc = targetCol; cc < cols; cc++) grid[r][cc] = true;
        owner.w += emptyTail;
      }
    }
  }

  return placed.map((p) => ({
    x: p.c / cols,
    y: p.r / totalRows,
    width: p.w / cols,
    height: p.h / totalRows,
    zIndex: 1,
    preferredOrientation: p.w > p.h ? 'landscape' : p.h > p.w ? 'portrait' : p.orient,
  }));
}

/**
 * Generates a custom CollageLayoutDef dynamically for any number of photos (1..24).
 */
export function generateDynamicLayout(
  config: CustomCollageLayoutConfig,
  photos: Array<{ width?: number; height?: number }> = [],
  containerAspect = 1,
  sizeSeed = 0
): CollageLayoutDef {
  const count = Math.max(1, Math.min(24, Math.round(config.slotCount || 1)));
  const mode = config.mode || 'smart-grid';
  const safeAspect = Math.max(0.45, Math.min(2.2, containerAspect || 1));
  const slots: CollageSlotSpec[] = [];

  if (count === 1) {
    slots.push({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      rotation: mode === 'scatter' ? -2 : 0,
      zIndex: 1,
      preferredOrientation: orientationFromDims(photos[0]?.width, photos[0]?.height),
    });
  } else if (mode === 'mosaic-featured') {
    slots.push(...buildFeaturedMosaicSlots(count, photos, safeAspect, sizeSeed));
  } else if (mode === 'hero-plus') {
    const useTopHero = safeAspect < 1.1;
    if (useTopHero) {
      const heroH = count <= 4 ? 0.62 : 0.54;
      slots.push({
        x: 0,
        y: 0,
        width: 1,
        height: heroH,
        zIndex: 1,
        preferredOrientation: 'landscape',
      });
      const rows = distributeIntoRows(count - 1, undefined, safeAspect * 1.4);
      const rowH = (1 - heroH) / rows.length;
      rows.forEach((colsInRow, rIdx) => {
        const colW = 1 / colsInRow;
        for (let c = 0; c < colsInRow; c++) {
          slots.push({
            x: c * colW,
            y: heroH + rIdx * rowH,
            width: colW,
            height: rowH,
            zIndex: 1,
            preferredOrientation: 'square',
          });
        }
      });
    } else {
      const heroW = count <= 4 ? 0.58 : 0.52;
      slots.push({
        x: 0,
        y: 0,
        width: heroW,
        height: 1,
        zIndex: 1,
        preferredOrientation: 'portrait',
      });
      const rows = distributeIntoRows(count - 1, undefined, safeAspect * 0.75);
      const rowH = 1 / rows.length;
      rows.forEach((colsInRow, rIdx) => {
        const colW = (1 - heroW) / colsInRow;
        for (let c = 0; c < colsInRow; c++) {
          slots.push({
            x: heroW + c * colW,
            y: rIdx * rowH,
            width: colW,
            height: rowH,
            zIndex: 1,
            preferredOrientation: 'square',
          });
        }
      });
    }
  } else if (mode === 'aspect-masonry') {
    const aspects = Array.from({ length: count }).map((_, i) => {
      const p = photos[i];
      if (!p?.width || !p?.height) return 1;
      return Math.max(0.55, Math.min(1.9, p.width / p.height));
    });
    const targetRowAspect = Math.max(1.2, Math.min(4.2, Math.sqrt(count) * safeAspect * 1.15));
    const packedRows: Array<{ indices: number[]; aspectSum: number }> = [];
    let curIndices: number[] = [];
    let curSum = 0;

    for (let i = 0; i < count; i++) {
      const a = aspects[i];
      if (curIndices.length > 0 && curSum + a > targetRowAspect) {
        packedRows.push({ indices: curIndices, aspectSum: curSum });
        curIndices = [i];
        curSum = a;
      } else {
        curIndices.push(i);
        curSum += a;
      }
    }
    if (curIndices.length > 0) {
      packedRows.push({ indices: curIndices, aspectSum: curSum });
    }

    const invHeights = packedRows.map((r) => 1 / Math.max(0.5, r.aspectSum));
    const totalInvH = invHeights.reduce((acc, v) => acc + v, 0);
    let yCursor = 0;

    packedRows.forEach((row, rIdx) => {
      const rowH = invHeights[rIdx] / totalInvH;
      let xCursor = 0;
      row.indices.forEach((photoIdx) => {
        const w = aspects[photoIdx] / row.aspectSum;
        slots.push({
          x: xCursor,
          y: yCursor,
          width: w,
          height: rowH,
          zIndex: 1,
          preferredOrientation: orientationFromDims(photos[photoIdx]?.width, photos[photoIdx]?.height),
        });
        xCursor += w;
      });
      yCursor += rowH;
    });
  } else if (mode === 'scatter') {
    const cols = Math.max(1, Math.min(count, Math.round(Math.sqrt(count * safeAspect))));
    const rows = Math.ceil(count / cols);
    const cellW = 0.92 / cols;
    const cellH = 0.92 / rows;

    for (let i = 0; i < count; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const orient = orientationFromDims(photos[i]?.width, photos[i]?.height);
      const wScale = orient === 'landscape' ? 1.12 : orient === 'portrait' ? 0.92 : 1.04;
      const hScale = orient === 'portrait' ? 1.12 : orient === 'landscape' ? 0.92 : 1.04;
      const cardW = Math.min(0.68, cellW * wScale);
      const cardH = Math.min(0.68, cellH * hScale);
      const x = Math.max(0.02, Math.min(0.98 - cardW, 0.04 + c * cellW));
      const y = Math.max(0.02, Math.min(0.98 - cardH, 0.04 + r * cellH));
      slots.push({
        x,
        y,
        width: cardW,
        height: cardH,
        rotation: FALLBACK_TILTS[i % FALLBACK_TILTS.length],
        zIndex: i + 1,
        preferredOrientation: orient,
      });
    }
  } else {
    // smart-grid
    const rows = distributeIntoRows(count, config.columns, safeAspect);
    const rowH = 1 / rows.length;
    rows.forEach((colsInRow, rIdx) => {
      const colW = 1 / colsInRow;
      for (let c = 0; c < colsInRow; c++) {
        slots.push({
          x: c * colW,
          y: rIdx * rowH,
          width: colW,
          height: rowH,
          zIndex: 1,
          preferredOrientation:
            colW * safeAspect > rowH * 1.18
              ? 'landscape'
              : rowH > colW * safeAspect * 1.18
              ? 'portrait'
              : 'square',
        });
      }
    });
  }

  const colSuffix = config.columns ? `-c${config.columns}` : '';
  return {
    id: `dynamic-${mode}-${count}${colSuffix}`,
    name: `${DYNAMIC_MODE_LABELS[mode]} (${count})`,
    category: mode === 'scatter' ? 'scrapbook' : 'bento',
    slotCount: count,
    slots,
  };
}

/**
 * Resolves either a curated COLLAGE_LAYOUTS entry or a dynamic layout from CollageMeta.
 */
export function resolveCollageLayout(
  meta: Pick<CollageMeta, 'layoutId' | 'customLayout' | 'sizeSeed'>,
  photos: Array<{ width?: number; height?: number }> = [],
  containerAspect = 1
): CollageLayoutDef {
  if (meta.customLayout) {
    return generateDynamicLayout(meta.customLayout, photos, containerAspect, meta.sizeSeed ?? 0);
  }
  if (meta.layoutId.startsWith('dynamic-')) {
    const parts = meta.layoutId.replace('dynamic-', '').split('-');
    // e.g. dynamic-smart-grid-7 or dynamic-aspect-masonry-10-c3
    const lastPart = parts[parts.length - 1];
    const hasCol = lastPart.startsWith('c') && !Number.isNaN(Number(lastPart.slice(1)));
    const columns = hasCol ? Number(lastPart.slice(1)) : undefined;
    const countPart = hasCol ? parts[parts.length - 2] : lastPart;
    const slotCount = Math.max(1, Math.min(24, Number(countPart) || photos.length || 4));
    const modeStr = parts.slice(0, hasCol ? -2 : -1).join('-') as DynamicLayoutMode;
    const mode: DynamicLayoutMode =
      modeStr in DYNAMIC_MODE_LABELS ? modeStr : 'smart-grid';
    return generateDynamicLayout({ mode, slotCount, columns }, photos, containerAspect, meta.sizeSeed ?? 0);
  }
  return COLLAGE_LAYOUTS.find((l) => l.id === meta.layoutId) || COLLAGE_LAYOUTS[0];
}

/**
 * The clean preset for each photo count. Counts not listed fall back to the smallest
 * preset that still holds every photo, then to the largest preset there is.
 */
export const PRESET_FOR_COUNT: Record<number, string> = {
  2: '2-split-v',
  3: '3-cols',
  4: '4-grid',
  5: '5-bento',
  6: '6-grid',
  8: '8-story',
  9: '9-grid',
};

export const DEFAULT_COLLAGE_LAYOUT_ID = '2-split-v';

export function pickCollageLayoutForCount(count: number): string {
  if (count <= 0) return DEFAULT_COLLAGE_LAYOUT_ID;
  const exact = PRESET_FOR_COUNT[count];
  if (exact) return exact;
  const bySlots = [...COLLAGE_LAYOUTS].sort((a, b) => a.slotCount - b.slotCount);
  const fits = bySlots.find((item) => item.slotCount >= count);
  return (fits ?? bySlots[bySlots.length - 1]).id;
}
