export interface CollageSlotSpec {
  /** Normalized 0..1 coordinates within the collage bounding box */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CollageLayoutDefinition {
  id: string;
  name: string;
  count: number;
  slots: CollageSlotSpec[];
}

export const COLLAGE_LAYOUTS: CollageLayoutDefinition[] = [
  {
    id: '2-split-v',
    name: '2 Side-by-Side',
    count: 2,
    slots: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  {
    id: '2-split-h',
    name: '2 Stacked',
    count: 2,
    slots: [
      { x: 0, y: 0, w: 1, h: 0.5 },
      { x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  {
    id: '3-left-2',
    name: '1 Big + 2 Right',
    count: 3,
    slots: [
      { x: 0, y: 0, w: 0.55, h: 1 },
      { x: 0.55, y: 0, w: 0.45, h: 0.5 },
      { x: 0.55, y: 0.5, w: 0.45, h: 0.5 },
    ],
  },
  {
    id: '3-top-2',
    name: '1 Top + 2 Bottom',
    count: 3,
    slots: [
      { x: 0, y: 0, w: 1, h: 0.55 },
      { x: 0, y: 0.55, w: 0.5, h: 0.45 },
      { x: 0.5, y: 0.55, w: 0.5, h: 0.45 },
    ],
  },
  {
    id: '3-cols',
    name: '3 Columns',
    count: 3,
    slots: [
      { x: 0, y: 0, w: 1 / 3, h: 1 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
    ],
  },
  {
    id: '4-grid',
    name: '2×2 Classic Grid',
    count: 4,
    slots: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  {
    id: '4-hero-3',
    name: '1 Hero + 3 Strip',
    count: 4,
    slots: [
      { x: 0, y: 0, w: 1, h: 0.62 },
      { x: 0, y: 0.62, w: 1 / 3, h: 0.38 },
      { x: 1 / 3, y: 0.62, w: 1 / 3, h: 0.38 },
      { x: 2 / 3, y: 0.62, w: 1 / 3, h: 0.38 },
    ],
  },
  {
    id: '6-grid',
    name: '3×2 Gallery',
    count: 6,
    slots: [
      { x: 0, y: 0, w: 1 / 3, h: 0.5 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 0.5 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 0.5 },
      { x: 0, y: 0.5, w: 1 / 3, h: 0.5 },
      { x: 1 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
      { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
    ],
  },
];

export interface PixelBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Computes pixel rectangles for each slot inside a collage bounding box with even internal gaps.
 */
export function computeCollageSlots(
  layout: CollageLayoutDefinition,
  totalWidth: number,
  totalHeight: number,
  gap: number
): PixelBox[] {
  const halfGap = gap / 2;
  const eps = 0.001;

  return layout.slots.map((slot) => {
    const insetLeft = slot.x > eps ? halfGap : 0;
    const insetRight = slot.x + slot.w < 1 - eps ? halfGap : 0;
    const insetTop = slot.y > eps ? halfGap : 0;
    const insetBottom = slot.y + slot.h < 1 - eps ? halfGap : 0;

    const x = Math.round(slot.x * totalWidth + insetLeft);
    const y = Math.round(slot.y * totalHeight + insetTop);
    const width = Math.max(16, Math.round(slot.w * totalWidth - insetLeft - insetRight));
    const height = Math.max(16, Math.round(slot.h * totalHeight - insetTop - insetBottom));

    return { x, y, width, height };
  });
}
