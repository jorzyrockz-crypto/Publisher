import { ShapeElement, ShapeType } from '../types/publisher';

export interface ShapeCatalogItem {
  type: ShapeType;
  label: string;
}

export const SHAPE_CATALOG: ShapeCatalogItem[] = [
  { type: 'rectangle', label: 'Rectangle' },
  { type: 'rounded-rect', label: 'Rounded Rect' },
  { type: 'circle', label: 'Oval / Circle' },
  { type: 'triangle', label: 'Triangle' },
  { type: 'star', label: '5-Point Star' },
  { type: 'badge-burst', label: 'Starburst Seal' },
  { type: 'hexagon', label: 'Hexagon' },
  { type: 'pentagon', label: 'Pentagon' },
  { type: 'diamond', label: 'Diamond' },
  { type: 'parallelogram', label: 'Parallelogram' },
  { type: 'trapezoid', label: 'Trapezoid' },
  { type: 'banner', label: 'Ribbon Banner' },
  { type: 'callout', label: 'Speech Callout' },
  { type: 'arrow-right', label: 'Block Arrow' },
  { type: 'arrow-double', label: 'Double Arrow' },
  { type: 'cross', label: 'Cross / Plus' },
  { type: 'cloud', label: 'Cloud' },
  { type: 'heart', label: 'Heart' },
];

/**
 * Generates an SVG path string for a rectangle with a wavy side (top, bottom, left, or right).
 */
export function buildWavyRectPath(
  width: number,
  height: number,
  strokeWidth: number,
  waveEdge: 'top' | 'bottom' | 'left' | 'right',
  amplitude = 18,
  frequency = 2
): string {
  const s = strokeWidth / 2;
  const w = Math.max(10, width - s * 2);
  const h = Math.max(10, height - s * 2);
  const amp = Math.min(amplitude, Math.min(w, h) * 0.4);
  const waves = Math.max(1, Math.round(frequency));

  if (waveEdge === 'top') {
    const baseY = s + amp;
    const segW = w / waves;
    let d = `M ${s} ${baseY}`;
    for (let i = 0; i < waves; i++) {
      const x0 = s + i * segW;
      const xMid = x0 + segW / 2;
      const x1 = x0 + segW;
      d += ` Q ${x0 + segW * 0.25} ${baseY - amp}, ${xMid} ${baseY}`;
      d += ` Q ${x0 + segW * 0.75} ${baseY + amp}, ${x1} ${baseY}`;
    }
    d += ` L ${s + w} ${s + h} L ${s} ${s + h} Z`;
    return d;
  }

  if (waveEdge === 'bottom') {
    const baseY = s + h - amp;
    const segW = w / waves;
    let d = `M ${s} ${s} L ${s + w} ${s} L ${s + w} ${baseY}`;
    for (let i = waves - 1; i >= 0; i--) {
      const x1 = s + i * segW;
      const xMid = x1 + segW / 2;
      const x0 = x1 + segW;
      d += ` Q ${x1 + segW * 0.75} ${baseY + amp}, ${xMid} ${baseY}`;
      d += ` Q ${x1 + segW * 0.25} ${baseY - amp}, ${x1} ${baseY}`;
    }
    d += ' Z';
    return d;
  }

  if (waveEdge === 'left') {
    const baseX = s + amp;
    const segH = h / waves;
    let d = `M ${baseX} ${s} L ${s + w} ${s} L ${s + w} ${s + h} L ${baseX} ${s + h}`;
    for (let i = waves - 1; i >= 0; i--) {
      const y1 = s + i * segH;
      const yMid = y1 + segH / 2;
      d += ` Q ${baseX + amp} ${y1 + segH * 0.75}, ${baseX} ${yMid}`;
      d += ` Q ${baseX - amp} ${y1 + segH * 0.25}, ${baseX} ${y1}`;
    }
    d += ' Z';
    return d;
  }

  // right
  const baseX = s + w - amp;
  const segH = h / waves;
  let d = `M ${s} ${s} L ${baseX} ${s}`;
  for (let i = 0; i < waves; i++) {
    const y0 = s + i * segH;
    const yMid = y0 + segH / 2;
    const y1 = y0 + segH;
    d += ` Q ${baseX + amp} ${y0 + segH * 0.25}, ${baseX} ${yMid}`;
    d += ` Q ${baseX - amp} ${y0 + segH * 0.75}, ${baseX} ${y1}`;
  }
  d += ` L ${s} ${s + h} Z`;
  return d;
}

/**
 * Converts any ShapeElement into an SVG path string in its local (0..width, 0..height) coordinate space.
 * Used both for preview thumbnails and for Merge Shapes boolean operations.
 */
export function getShapeSvgPath(el: {
  shapeType: ShapeType;
  width: number;
  height: number;
  strokeWidth?: number;
  adjustValue?: number;
  cornerRadius?: number;
  waveEdge?: 'none' | 'top' | 'bottom' | 'left' | 'right';
  waveAmplitude?: number;
  waveFrequency?: number;
}): string {
  const { width, height, shapeType } = el;
  const sw = el.strokeWidth ?? 0;
  const s = sw / 2;

  if (shapeType === 'rectangle' && el.waveEdge && el.waveEdge !== 'none') {
    return buildWavyRectPath(
      width,
      height,
      sw,
      el.waveEdge,
      el.waveAmplitude ?? 18,
      el.waveFrequency ?? 2
    );
  }

  switch (shapeType) {
    case 'rectangle':
      return `M ${s} ${s} H ${width - s} V ${height - s} H ${s} Z`;
    case 'rounded-rect': {
      const maxR = Math.min(width, height) / 2;
      const r = Math.min(
        maxR,
        el.adjustValue !== undefined ? el.adjustValue * maxR : el.cornerRadius ?? 12
      );
      const x = s;
      const y = s;
      const w = width - sw;
      const h = height - sw;
      return `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
    }
    case 'circle': {
      const rx = (width - sw) / 2;
      const ry = (height - sw) / 2;
      const cx = width / 2;
      const cy = height / 2;
      return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
    }
    case 'triangle': {
      const apexX = width * (el.adjustValue ?? 0.5);
      return `M ${apexX} ${sw} L ${width - sw} ${height - sw} L ${sw} ${height - sw} Z`;
    }
    case 'diamond':
      return `M ${width / 2} ${sw} L ${width - sw} ${height / 2} L ${width / 2} ${height - sw} L ${sw} ${height / 2} Z`;
    case 'star': {
      const cx = width / 2;
      const cy = height / 2;
      const outerR = Math.min(cx, cy) - sw;
      const innerR = outerR * (el.adjustValue ?? 0.45);
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        pts.push(`${i === 0 ? 'M' : 'L'} ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`);
      }
      return pts.join(' ') + ' Z';
    }
    case 'badge-burst': {
      const cx = width / 2;
      const cy = height / 2;
      const outerR = Math.min(cx, cy) - sw;
      const innerR = outerR * (el.adjustValue ?? 0.78);
      const pts: string[] = [];
      for (let i = 0; i < 24; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i * Math.PI) / 12;
        pts.push(`${i === 0 ? 'M' : 'L'} ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`);
      }
      return pts.join(' ') + ' Z';
    }
    case 'hexagon':
      return `M ${width * 0.25} ${sw} L ${width * 0.75} ${sw} L ${width - sw} ${height / 2} L ${width * 0.75} ${height - sw} L ${width * 0.25} ${height - sw} L ${sw} ${height / 2} Z`;
    case 'pentagon': {
      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(cx, cy) - sw;
      return (
        Array.from({ length: 5 }, (_, i) => {
          const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          return `${i === 0 ? 'M' : 'L'} ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
        }).join(' ') + ' Z'
      );
    }
    case 'parallelogram': {
      const skew = width * (el.adjustValue ?? 0.2);
      return `M ${skew} ${sw} L ${width - sw} ${sw} L ${width - skew} ${height - sw} L ${sw} ${height - sw} Z`;
    }
    case 'trapezoid': {
      const inset = width * (el.adjustValue ?? 0.18);
      return `M ${inset} ${sw} L ${width - inset} ${sw} L ${width - sw} ${height - sw} L ${sw} ${height - sw} Z`;
    }
    case 'banner': {
      const notch = width * (el.adjustValue ?? 0.12);
      return `M 0 0 L ${width} 0 L ${width - notch} ${height / 2} L ${width} ${height} L 0 ${height} L ${notch} ${height / 2} Z`;
    }
    case 'callout':
      return `M ${width * 0.12} ${height * 0.08} H ${width * 0.88} Q ${width} ${height * 0.08} ${width} ${height * 0.2} V ${height * 0.68} Q ${width} ${height * 0.8} ${width * 0.88} ${height * 0.8} H ${width * 0.42} L ${width * 0.22} ${height * 0.98} L ${width * 0.28} ${height * 0.8} H ${width * 0.12} Q 0 ${height * 0.8} 0 ${height * 0.68} V ${height * 0.2} Q 0 ${height * 0.08} ${width * 0.12} ${height * 0.08} Z`;
    case 'arrow-right': {
      const headW = width * (el.adjustValue ?? 0.32);
      const shaftH = height * 0.5;
      const shaftY = (height - shaftH) / 2;
      return `M 0 ${shaftY} L ${width - headW} ${shaftY} L ${width - headW} 0 L ${width} ${height / 2} L ${width - headW} ${height} L ${width - headW} ${shaftY + shaftH} L 0 ${shaftY + shaftH} Z`;
    }
    case 'arrow-double': {
      const headW = width * (el.adjustValue ?? 0.25);
      const shaftH = height * 0.45;
      const shaftY = (height - shaftH) / 2;
      return `M 0 ${height / 2} L ${headW} 0 L ${headW} ${shaftY} L ${width - headW} ${shaftY} L ${width - headW} 0 L ${width} ${height / 2} L ${width - headW} ${height} L ${width - headW} ${shaftY + shaftH} L ${headW} ${shaftY + shaftH} L ${headW} ${height} Z`;
    }
    case 'cross': {
      const arm = el.adjustValue ?? 0.35;
      const x1 = width * ((1 - arm) / 2);
      const x2 = width * ((1 + arm) / 2);
      const y1 = height * ((1 - arm) / 2);
      const y2 = height * ((1 + arm) / 2);
      return `M ${x1} ${sw} L ${x2} ${sw} L ${x2} ${y1} L ${width - sw} ${y1} L ${width - sw} ${y2} L ${x2} ${y2} L ${x2} ${height - sw} L ${x1} ${height - sw} L ${x1} ${y2} L ${sw} ${y2} L ${sw} ${y1} L ${x1} ${y1} Z`;
    }
    case 'cloud':
      return `M ${width * 0.25} ${height * 0.8} C ${width * 0.08} ${height * 0.8}, ${width * 0.04} ${height * 0.55}, ${width * 0.18} ${height * 0.45} C ${width * 0.16} ${height * 0.22}, ${width * 0.38} ${height * 0.12}, ${width * 0.52} ${height * 0.24} C ${width * 0.64} ${height * 0.1}, ${width * 0.88} ${height * 0.2}, ${width * 0.84} ${height * 0.44} C ${width * 0.96} ${height * 0.52}, ${width * 0.94} ${height * 0.8}, ${width * 0.75} ${height * 0.8} Z`;
    case 'heart':
      return `M ${width / 2} ${height * 0.85} C ${width * 0.15} ${height * 0.6}, 0 ${height * 0.35}, 0 ${height * 0.22} C 0 ${height * 0.08}, ${width * 0.2} 0, ${width * 0.38} 0 C ${width * 0.46} 0, ${width / 2} ${height * 0.12}, ${width / 2} ${height * 0.12} C ${width / 2} ${height * 0.12}, ${width * 0.54} 0, ${width * 0.62} 0 C ${width * 0.8} 0, ${width} ${height * 0.08}, ${width} ${height * 0.22} C ${width} ${height * 0.35}, ${width * 0.85} ${height * 0.6}, ${width / 2} ${height * 0.85} Z`;
    default:
      return `M 0 0 H ${width} V ${height} H 0 Z`;
  }
}

export function buildMergedPartFromShape(el: ShapeElement, originX: number, originY: number) {
  return {
    d: getShapeSvgPath(el),
    x: el.x - originX,
    y: el.y - originY,
    width: el.width,
    height: el.height,
    rotation: el.rotation || 0,
  };
}
