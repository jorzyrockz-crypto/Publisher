import type { ShapeElement } from '../types/publisher';
import { getShapeSvgPath } from './shapePaths';
import { flattenSvgPath, multiPolygonToPath, placeRing, type Ring } from './pathGeometry';

/**
 * Turns a shape — including a merged/unioned one — into outline rings in page
 * coordinates. This is what lets an image be clipped to any shape, not just the
 * preset masks.
 */
export function shapeOutlineRings(shape: ShapeElement): Ring[] {
  const place = {
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
    rotation: shape.rotation || 0,
  };

  if (shape.shapeType === 'merged' && shape.mergedPath) {
    const sx = shape.width / (shape.mergedBaseWidth || shape.width || 1);
    const sy = shape.height / (shape.mergedBaseHeight || shape.height || 1);
    return flattenSvgPath(shape.mergedPath).map((ring) =>
      placeRing(
        ring.map(([x, y]) => [x * sx, y * sy] as [number, number]),
        place
      )
    );
  }

  return flattenSvgPath(getShapeSvgPath(shape)).map((ring) => placeRing(ring, place));
}

/** Serialises rings into a path string, shifted so `origin` becomes 0,0. */
export function ringsToPath(rings: Ring[], originX = 0, originY = 0): string {
  return multiPolygonToPath(
    rings.map((ring) => [
      ring.map(([x, y]) => [
        Number((x - originX).toFixed(2)),
        Number((y - originY).toFixed(2)),
      ] as [number, number]),
    ])
  );
}

/** Scales a stored clip path when its frame has been resized since. */
export function scalePathData(d: string, sx: number, sy: number): string {
  if (!d || (sx === 1 && sy === 1)) return d;
  return multiPolygonToPath(
    flattenSvgPath(d, 0.2).map((ring) => [
      ring.map(([x, y]) => [
        Number((x * sx).toFixed(2)),
        Number((y * sy).toFixed(2)),
      ] as [number, number]),
    ])
  );
}

/** The clip path an image should use right now, in its own local pixels. */
export function imageClipPath(el: {
  width: number;
  height: number;
  clipPathD?: string;
  clipBaseWidth?: number;
  clipBaseHeight?: number;
}): string | undefined {
  if (!el.clipPathD) return undefined;
  const sx = el.width / (el.clipBaseWidth || el.width || 1);
  const sy = el.height / (el.clipBaseHeight || el.height || 1);
  return scalePathData(el.clipPathD, sx, sy);
}
