/**
 * Turns an SVG path string into flat polygons so boolean set operations can be
 * computed on real geometry. Curves are sampled to a tolerance measured in
 * element pixels, which at design scale is visually indistinguishable from the
 * curve itself (0.35px by default).
 *
 * Supports the whole path language the shape library emits: M/L/H/V/C/S/Q/T/A/Z,
 * absolute and relative.
 */

export type Point = [number, number];
export type Ring = Point[];
/** Array of rings; the first is the outer boundary, the rest are holes. */
export type Polygon = Ring[];
export type MultiPolygon = Polygon[];

const NUMBER = /-?\d*\.?\d+(?:[eE][-+]?\d+)?/g;

function clampSegments(length: number, tolerance: number, min = 6, max = 64): number {
  const steps = Math.ceil(length / Math.max(0.05, tolerance));
  return Math.max(min, Math.min(max, steps));
}

function dist(a: Point, b: Point): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

function splitArgs(chunk: string): number[] {
  return (chunk.match(NUMBER) || []).map(Number);
}

/** Collapses duplicate and nearly-duplicate points so clipping stays stable. */
function tidy(ring: Ring, epsilon = 0.01): Ring {
  const out: Ring = [];
  for (const [x, y] of ring) {
    const last = out[out.length - 1];
    if (!last || Math.abs(last[0] - x) > epsilon || Math.abs(last[1] - y) > epsilon) {
      out.push([x, y]);
    }
  }
  if (out.length > 2) {
    const first = out[0];
    const last = out[out.length - 1];
    if (Math.abs(first[0] - last[0]) < epsilon && Math.abs(first[1] - last[1]) < epsilon) {
      out.pop();
    }
  }
  return out;
}

export function flattenSvgPath(d: string, tolerance = 0.35): Ring[] {
  const rings: Ring[] = [];
  if (!d) return rings;

  // Split into command chunks: a letter followed by its numbers.
  const chunks = d.match(/[a-zA-Z][^a-zA-Z]*/g) || [];
  let current: Ring = [];
  let cursor: Point = [0, 0];
  let subpathStart: Point = [0, 0];
  let lastCubicControl: Point | null = null;
  let lastQuadControl: Point | null = null;

  const pushPoint = (p: Point) => {
    current.push(p);
    cursor = p;
  };

  const finishRing = () => {
    const ring = tidy(current);
    if (ring.length >= 3) rings.push(ring);
    current = [];
  };

  for (const chunk of chunks) {
    const command = chunk[0];
    const args = splitArgs(chunk.slice(1));
    const relative = command === command.toLowerCase();
    const upper = command.toUpperCase();
    const baseX = relative ? cursor[0] : 0;
    const baseY = relative ? cursor[1] : 0;

    switch (upper) {
      case 'M': {
        if (current.length) finishRing();
        for (let i = 0; i + 1 < args.length; i += 2) {
          const p: Point = [baseX + args[i], baseY + args[i + 1]];
          if (i === 0) {
            current = [p];
            cursor = p;
            subpathStart = p;
          } else {
            pushPoint(p);
          }
        }
        lastCubicControl = null;
        lastQuadControl = null;
        break;
      }
      case 'L':
      case 'H':
      case 'V': {
        if (upper === 'H') {
          for (const value of args) pushPoint([baseX + value, cursor[1]]);
        } else if (upper === 'V') {
          for (const value of args) pushPoint([cursor[0], baseY + value]);
        } else {
          for (let i = 0; i + 1 < args.length; i += 2) {
            pushPoint([baseX + args[i], baseY + args[i + 1]]);
          }
        }
        lastCubicControl = null;
        lastQuadControl = null;
        break;
      }
      case 'C':
      case 'S': {
        const step = upper === 'C' ? 6 : 4;
        for (let i = 0; i + step - 1 < args.length; i += step) {
          const start = cursor;
          let c1: Point;
          let rest: number[];
          if (upper === 'C') {
            c1 = [baseX + args[i], baseY + args[i + 1]];
            rest = args.slice(i + 2, i + 6);
          } else {
            c1 = lastCubicControl
              ? [2 * start[0] - lastCubicControl[0], 2 * start[1] - lastCubicControl[1]]
              : start;
            rest = args.slice(i, i + 4);
          }
          const c2: Point = [baseX + rest[0], baseY + rest[1]];
          const end: Point = [baseX + rest[2], baseY + rest[3]];
          const approx = dist(start, c1) + dist(c1, c2) + dist(c2, end);
          const steps = clampSegments(approx, tolerance);
          for (let s = 1; s <= steps; s++) {
            const t = s / steps;
            const mt = 1 - t;
            const x =
              mt * mt * mt * start[0] +
              3 * mt * mt * t * c1[0] +
              3 * mt * t * t * c2[0] +
              t * t * t * end[0];
            const y =
              mt * mt * mt * start[1] +
              3 * mt * mt * t * c1[1] +
              3 * mt * t * t * c2[1] +
              t * t * t * end[1];
            current.push([x, y]);
          }
          cursor = end;
          lastCubicControl = c2;
          lastQuadControl = null;
        }
        break;
      }
      case 'Q':
      case 'T': {
        const step = upper === 'Q' ? 4 : 2;
        for (let i = 0; i + step - 1 < args.length; i += step) {
          const start = cursor;
          let control: Point;
          let end: Point;
          if (upper === 'Q') {
            control = [baseX + args[i], baseY + args[i + 1]];
            end = [baseX + args[i + 2], baseY + args[i + 3]];
          } else {
            control = lastQuadControl
              ? [2 * start[0] - lastQuadControl[0], 2 * start[1] - lastQuadControl[1]]
              : start;
            end = [baseX + args[i], baseY + args[i + 1]];
          }
          const approx = dist(start, control) + dist(control, end);
          const steps = clampSegments(approx, tolerance);
          for (let s = 1; s <= steps; s++) {
            const t = s / steps;
            const mt = 1 - t;
            const x = mt * mt * start[0] + 2 * mt * t * control[0] + t * t * end[0];
            const y = mt * mt * start[1] + 2 * mt * t * control[1] + t * t * end[1];
            current.push([x, y]);
          }
          cursor = end;
          lastQuadControl = control;
          lastCubicControl = null;
        }
        break;
      }
      case 'A': {
        for (let i = 0; i + 6 < args.length; i += 7) {
          const rx = Math.abs(args[i]);
          const ry = Math.abs(args[i + 1]);
          const rotation = (args[i + 2] * Math.PI) / 180;
          const largeArc = args[i + 3] !== 0;
          const sweep = args[i + 4] !== 0;
          const end: Point = [baseX + args[i + 5], baseY + args[i + 6]];
          const start = cursor;

          if (rx === 0 || ry === 0) {
            current.push(end);
            cursor = end;
            continue;
          }

          // Endpoint → centre parameterisation (SVG spec, appendix F.6.5).
          const dx2 = (start[0] - end[0]) / 2;
          const dy2 = (start[1] - end[1]) / 2;
          const cosPhi = Math.cos(rotation);
          const sinPhi = Math.sin(rotation);
          const x1p = cosPhi * dx2 + sinPhi * dy2;
          const y1p = -sinPhi * dx2 + cosPhi * dy2;

          const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
          let rxN = rx;
          let ryN = ry;
          if (lambda > 1) {
            const scale = Math.sqrt(lambda);
            rxN = rx * scale;
            ryN = ry * scale;
          }

          const sign = largeArc !== sweep ? 1 : -1;
          const numerator =
            rxN * rxN * ryN * ryN - rxN * rxN * y1p * y1p - ryN * ryN * x1p * x1p;
          const denominator = rxN * rxN * y1p * y1p + ryN * ryN * x1p * x1p;
          const coef = sign * Math.sqrt(Math.max(0, numerator / denominator));
          const cxp = (coef * (rxN * y1p)) / ryN;
          const cyp = (coef * -(ryN * x1p)) / rxN;
          const cx = cosPhi * cxp - sinPhi * cyp + (start[0] + end[0]) / 2;
          const cy = sinPhi * cxp + cosPhi * cyp + (start[1] + end[1]) / 2;

          const angle = (ux: number, uy: number, vx: number, vy: number) => {
            const dot = ux * vx + uy * vy;
            const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
            const a = Math.acos(Math.max(-1, Math.min(1, dot / (len || 1))));
            return ux * vy - uy * vx < 0 ? -a : a;
          };

          const theta1 = angle(1, 0, (x1p - cxp) / rxN, (y1p - cyp) / ryN);
          let delta = angle(
            (x1p - cxp) / rxN,
            (y1p - cyp) / ryN,
            (-x1p - cxp) / rxN,
            (-y1p - cyp) / ryN
          );
          if (!sweep && delta > 0) delta -= Math.PI * 2;
          if (sweep && delta < 0) delta += Math.PI * 2;

          const arcLength = Math.abs(delta) * Math.max(rxN, ryN);
          const steps = clampSegments(arcLength, tolerance, 12, 96);
          for (let s = 1; s <= steps; s++) {
            const t = theta1 + (delta * s) / steps;
            const x = cx + rxN * Math.cos(t) * cosPhi - ryN * Math.sin(t) * sinPhi;
            const y = cy + rxN * Math.cos(t) * sinPhi + ryN * Math.sin(t) * cosPhi;
            current.push([x, y]);
          }
          cursor = end;
          lastQuadControl = null;
          lastCubicControl = null;
        }
        break;
      }
      case 'Z': {
        if (current.length) {
          cursor = subpathStart;
          finishRing();
        }
        break;
      }
      default:
        break;
    }
  }

  if (current.length) finishRing();
  return rings;
}

/** Rotates a local-space ring about its own centre, then moves it into place. */
export function placeRing(
  ring: Ring,
  part: { x: number; y: number; width: number; height: number; rotation?: number }
): Ring {
  const cx = part.width / 2;
  const cy = part.height / 2;
  const rad = ((part.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return ring.map(([px, py]) => {
    const dx = px - cx;
    const dy = py - cy;
    return [
      Number((part.x + cx + dx * cos - dy * sin).toFixed(2)),
      Number((part.y + cy + dx * sin + dy * cos).toFixed(2)),
    ] as Point;
  });
}

/** Serialises a polygon set back into one SVG path (holes included). */
export function multiPolygonToPath(multi: MultiPolygon): string {
  let d = '';
  for (const polygon of multi) {
    for (const ring of polygon) {
      if (!ring || ring.length < 3) continue;
      d += `M ${ring[0][0]} ${ring[0][1]}`;
      for (let i = 1; i < ring.length; i++) d += ` L ${ring[i][0]} ${ring[i][1]}`;
      d += ' Z ';
    }
  }
  return d.trim();
}
