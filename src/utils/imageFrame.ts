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

export interface PanResult {
  panX: number;
  panY: number;
}

/**
 * Converts a drag of the photo into pan percentages. Both painters place the
 * image at `object-position: 50 + pan` (canvas: `(box - drawn) * (50+pan)/100`),
 * so this inverts exactly that, then clamps so the photo always fills the frame.
 */
export function panFromDrag(
  current: PanResult,
  delta: { x: number; y: number },
  box: { width: number; height: number },
  natural: { width: number; height: number } | null,
  fit: 'cover' | 'contain' = 'cover'
): PanResult {
  const clamp = (v: number) => Math.max(-50, Math.min(50, v));

  if (!natural || !natural.width || !natural.height || !box.width || !box.height) {
    // Without the intrinsic size we can still move, just more conservatively.
    return {
      panX: clamp(current.panX - (delta.x / box.width) * 100),
      panY: clamp(current.panY - (delta.y / box.height) * 100),
    };
  }

  const scaleX = box.width / natural.width;
  const scaleY = box.height / natural.height;
  const scale = fit === 'contain' ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);
  const drawW = natural.width * scale;
  const drawH = natural.height * scale;
  const overflowX = box.width - drawW;
  const overflowY = box.height - drawH;

  const nextX =
    overflowX === 0
      ? current.panX
      : ((overflowX * ((50 + current.panX) / 100) + delta.x) / overflowX) * 100 - 50;
  const nextY =
    overflowY === 0
      ? current.panY
      : ((overflowY * ((50 + current.panY) / 100) + delta.y) / overflowY) * 100 - 50;

  return { panX: clamp(nextX), panY: clamp(nextY) };
}
