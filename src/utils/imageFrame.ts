import { elementClipPath } from './shapeClip';

/**
 * Frames: an image can be cropped to a preset mask or to any shape. Everything
 * that needs to know that boundary — the renderer, the crop guide and the
 * canvas exporter — asks here so they can never disagree.
 */

export interface FramedImage {
  width: number;
  height: number;
  maskShape?:
    | 'none'
    | 'circle'
    | 'star'
    | 'rounded'
    | 'diamond'
    | 'hexagon'
    | 'triangle'
    | 'heart';
  clipPathD?: string;
  clipBaseWidth?: number;
  clipBaseHeight?: number;
}

const MASK_POLYGONS: Record<string, string> = {
  star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
  diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  hexagon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)',
  heart:
    'polygon(50% 88%, 12% 52%, 4% 28%, 18% 10%, 38% 10%, 50% 24%, 62% 10%, 82% 10%, 96% 28%, 88% 52%)',
};

/** True when this image is showing through a frame of some kind. */
export function imageHasFrame(el: FramedImage): boolean {
  return Boolean(el.clipPathD) || Boolean(el.maskShape && el.maskShape !== 'none');
}

/** The CSS clip value for the frame, or undefined for an uncropped image. */
export function imageMaskClip(el: FramedImage): string | undefined {
  if (el.clipPathD) {
    const clip = elementClipPath(el);
    if (clip) return `path("${clip}")`;
  }
  switch (el.maskShape) {
    case 'circle':
      // matches border-radius: 50% — an ellipse when the frame isn't square
      return 'ellipse(50% 50% at 50% 50%)';
    case 'rounded':
      return 'inset(0 round 24px)';
    case 'star':
    case 'diamond':
    case 'hexagon':
    case 'triangle':
    case 'heart':
      return MASK_POLYGONS[el.maskShape];
    default:
      return undefined;
  }
}

/**
 * How the picture is fitted in its box. Clipart and stickers default to
 * `contain` (the whole drawing must stay visible), photos to `cover`.
 */
export function imageFit(el: {
  objectFit?: 'cover' | 'contain' | 'fill';
  isSticker?: boolean;
  effectPreset?: string;
}): 'cover' | 'contain' | 'fill' {
  if (el.objectFit) return el.objectFit;
  const sticker = Boolean(el.isSticker) || el.effectPreset === 'sticker';
  return sticker ? 'contain' : 'cover';
}

export interface ContentRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Size the picture takes inside the box under `object-fit`, before transforms. */
export function fittedSize(
  box: { width: number; height: number },
  natural: { width: number; height: number },
  fit: 'cover' | 'contain' | 'fill' = 'cover'
): { width: number; height: number } {
  const imgRatio = natural.width / Math.max(1, natural.height);
  const boxRatio = box.width / Math.max(1, box.height);
  if (fit === 'fill') return { width: box.width, height: box.height };
  if (fit === 'contain') {
    return imgRatio > boxRatio
      ? { width: box.width, height: box.width / imgRatio }
      : { width: box.height * imgRatio, height: box.height };
  }
  return imgRatio > boxRatio
    ? { width: box.height * imgRatio, height: box.height }
    : { width: box.width, height: box.width / imgRatio };
}

/**
 * Where the picture actually lands inside its box, matching how the DOM paints
 * it: `object-fit` sizes the content, `object-position` slides it, and the
 * element transform scales/rotates **about the centre** of the box. The canvas
 * exporter asks for the same rect, so a dragged photo exports exactly as it
 * looks on screen.
 */
export function imageContentRect(
  box: { width: number; height: number },
  natural: { width: number; height: number },
  frame: PanFrame = {},
  pan: PanResult = { panX: 0, panY: 0 }
): ContentRect {
  const scale = frame.scale && frame.scale > 0 ? frame.scale : 1;
  const fitted = fittedSize(box, natural, frame.fit);
  const width = fitted.width * scale;
  const height = fitted.height * scale;
  return {
    left: (box.width - width) * ((50 + pan.panX) / 100),
    top: (box.height - height) * ((50 + pan.panY) / 100),
    width,
    height,
  };
}

/**
 * How far the picture can slide on each axis, in px. Zero means it already
 * fills the frame on that axis, so panning there cannot do anything — zooming
 * in is what creates room.
 */
export function panRoom(
  box: { width: number; height: number },
  natural: { width: number; height: number } | null,
  frame: PanFrame = {}
): { x: number; y: number } {
  if (!natural || !natural.width || !natural.height) return { x: 0, y: 0 };
  const scale = frame.scale && frame.scale > 0 ? frame.scale : 1;
  const fitted = fittedSize(box, natural, frame.fit);
  const round = (v: number) => (Math.abs(v) < 0.5 ? 0 : Math.round(v));
  // magnitude: how much slack the axis has, in px (0 = locked)
  return {
    x: round(Math.abs(box.width - fitted.width * scale)),
    y: round(Math.abs(box.height - fitted.height * scale)),
  };
}

export interface PanResult {
  panX: number;
  panY: number;
}

export interface PanFrame {
  fit?: 'cover' | 'contain' | 'fill';
  /** imageScale — the picture is drawn this much larger, then positioned. */
  scale?: number;
  /** imageRotation in degrees (multiples of 90). */
  rotation?: number;
  flipH?: boolean;
  flipV?: boolean;
}

/**
 * Converts a mouse drag of the picture into pan percentages.
 *
 * The picture is drawn at `fitted × scale` and placed by `pan` within whatever
 * room is left, then rotated about the centre of the box — so this undoes the
 * rotation and inverts the placement, keeping the picture under the cursor for
 * photos and clip art alike.
 */
export function panFromDrag(
  current: PanResult,
  delta: { x: number; y: number },
  box: { width: number; height: number },
  natural: { width: number; height: number } | null,
  frame: PanFrame = {}
): PanResult {
  const clamp = (v: number) => Math.max(-50, Math.min(50, v));
  const rot = ((((frame.rotation || 0) % 360) + 360) % 360) * (Math.PI / 180);

  // Undo the rotation and mirroring, so a drag still follows the cursor when
  // the picture is turned or flipped.
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const unrotX = delta.x * cos + delta.y * sin;
  const unrotY = -delta.x * sin + delta.y * cos;
  const dx = frame.flipH ? -unrotX : unrotX;
  const dy = frame.flipV ? -unrotY : unrotY;

  if (!natural || !natural.width || !natural.height || !box.width || !box.height) {
    // Without the intrinsic size we can still move, just more conservatively.
    return {
      panX: clamp(current.panX + (dx / Math.max(1, box.width)) * 100),
      panY: clamp(current.panY + (dy / Math.max(1, box.height)) * 100),
    };
  }

  const scale = frame.scale && frame.scale > 0 ? frame.scale : 1;
  const fitted = fittedSize(box, natural, frame.fit);

  /** Invert `left = (size - fitted * scale) * p` for one axis. */
  const axis = (pan: number, d: number, size: number, fittedAxis: number): number => {
    const room = size - fittedAxis * scale;
    if (Math.abs(room) < 0.5) return pan; // no slack, keep the axis put
    const left = room * ((50 + pan) / 100) + d;
    return (left / room) * 100 - 50;
  };

  return {
    panX: clamp(axis(current.panX, dx, box.width, fitted.width)),
    panY: clamp(axis(current.panY, dy, box.height, fitted.height)),
  };
}
