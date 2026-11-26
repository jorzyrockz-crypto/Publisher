import * as polygonClipping from 'polygon-clipping';
import {
  flattenSvgPath,
  multiPolygonToPath,
  placeRing,
  type MultiPolygon,
  type Polygon,
} from './pathGeometry';

export type MergeOp = 'union' | 'combine' | 'subtract' | 'intersect';

export interface BooleanPart {
  d: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  /** Present when the part is a merged path that has since been resized. */
  scaleX?: number;
  scaleY?: number;
}

/**
 * Real boolean geometry for Merge Shapes.
 *
 * The previous implementation faked the result with SVG masks and clip paths:
 * the screen looked plausible, but every part was still stroked (union showed
 * seams), translucent fills doubled up, and the canvas exporter drew the raw
 * parts, so PNG/JPG/PDF ignored the operation entirely. Here each part is
 * flattened to polygons and clipped properly, producing one path that both the
 * DOM renderer and the exporter can draw.
 */
export function mergeShapeGeometry(parts: BooleanPart[], op: MergeOp): string | null {
  const polygons: Polygon[] = [];

  for (const part of parts) {
    const sx = part.scaleX ?? 1;
    const sy = part.scaleY ?? 1;
    for (const ring of flattenSvgPath(part.d)) {
      const scaled =
        sx === 1 && sy === 1
          ? ring
          : ring.map(([x, y]) => [x * sx, y * sy] as [number, number]);
      const placed = placeRing(scaled, part);
      if (placed.length >= 3) polygons.push([placed]);
    }
  }

  if (polygons.length < 2) return null;

  const geoms = polygons.map((polygon) => [polygon] as MultiPolygon);

  let result: MultiPolygon;
  try {
    switch (op) {
      case 'union':
        result = polygonClipping.union(geoms[0], ...geoms.slice(1));
        break;
      case 'combine':
        result = polygonClipping.xor(geoms[0], ...geoms.slice(1));
        break;
      case 'subtract':
        result = polygonClipping.difference(geoms[0], ...geoms.slice(1));
        break;
      case 'intersect':
        result = polygonClipping.intersection(geoms[0], ...geoms.slice(1));
        break;
      default:
        return null;
    }
  } catch {
    // Degenerate geometry (self-intersecting input, coincident edges) should
    // never break the document; the caller falls back to the mask preview.
    return null;
  }

  const path = multiPolygonToPath(result as MultiPolygon);
  return path || null;
}
