import { SlotMaskShape } from './borderArtStyles';

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
  applyScatterTilt = false
): ComputedCollageSlot[] {
  const halfGap = gap / 2;
  const eps = 0.001;

  return layout.slots.map((slot, index) => {
    const isOverlapping = layout.category === 'scrapbook' || (slot.zIndex ?? 1) > 1;
    const insetLeft = !isOverlapping && slot.x > eps ? halfGap : 0;
    const insetRight = !isOverlapping && slot.x + slot.width < 1 - eps ? halfGap : 0;
    const insetTop = !isOverlapping && slot.y > eps ? halfGap : 0;
    const insetBottom = !isOverlapping && slot.y + slot.height < 1 - eps ? halfGap : 0;

    const x = Math.round(slot.x * containerWidth + insetLeft);
    const y = Math.round(slot.y * containerHeight + insetTop);
    const width = Math.max(16, Math.round(slot.width * containerWidth - insetLeft - insetRight));
    const height = Math.max(16, Math.round(slot.height * containerHeight - insetTop - insetBottom));

    const rotation =
      slot.rotation !== undefined
        ? applyScatterTilt || layout.category === 'scrapbook'
          ? slot.rotation
          : 0
        : applyScatterTilt
        ? FALLBACK_TILTS[index % FALLBACK_TILTS.length]
        : 0;

    return {
      index,
      x,
      y,
      width,
      height,
      rotation,
      zIndex: slot.zIndex ?? index + 1,
    };
  });
}

/**
 * Matches uploaded photos against the 18 collage layouts by photo count and orientation.
 */
export function suggestBestLayout(photos: Array<{ width: number; height: number }>): string {
  const targetCount = Math.max(2, Math.min(9, photos.length || 4));
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
