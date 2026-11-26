import React from 'react';
import { BackgroundPatternType, PageBackgroundPattern } from '../types/publisher';

export const PATTERN_CATALOG: { id: BackgroundPatternType; label: string }[] = [
  { id: 'dots', label: 'Polka Dots' },
  { id: 'grid', label: 'Grid' },
  { id: 'diagonal-stripes', label: 'Stripes' },
  { id: 'chevron', label: 'Chevron' },
  { id: 'hexagon', label: 'Hexagon' },
  { id: 'waves', label: 'Waves' },
  { id: 'terrazzo', label: 'Terrazzo' },
  { id: 'isometric', label: 'Isometric' },
  { id: 'checker', label: 'Checker' },
  { id: 'crosshatch', label: 'Crosshatch' },
];

export const DEFAULT_BACKGROUND_PATTERN: PageBackgroundPattern = {
  type: 'dots',
  color: '#4f46e5',
  opacity: 0.2,
  scale: 32,
  strokeWidth: 2,
  rotation: 0,
};

/**
 * Generates a seamless, tileable SVG pattern string for a given PageBackgroundPattern.
 */
export function buildPatternSvg(pattern: PageBackgroundPattern): string {
  const { type, color, opacity, scale, strokeWidth, rotation } = pattern;
  if (type === 'none') return '';

  const s = Math.max(10, Math.round(scale));
  const sw = Math.max(0.5, strokeWidth);
  const op = Math.min(1, Math.max(0.02, opacity));
  const half = s / 2;
  const rotTransform = rotation ? ` transform="rotate(${rotation} ${half} ${half})"` : '';

  let inner = '';
  switch (type) {
    case 'dots': {
      const r = Math.max(1, sw * 1.4);
      inner = `<circle cx="${s * 0.25}" cy="${s * 0.25}" r="${r}" fill="${color}" fill-opacity="${op}"/>
               <circle cx="${s * 0.75}" cy="${s * 0.75}" r="${r}" fill="${color}" fill-opacity="${op}"/>`;
      break;
    }
    case 'grid':
      inner = `<path d="M ${s} 0 L 0 0 0 ${s}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-opacity="${op}"/>`;
      break;
    case 'diagonal-stripes':
      inner = `<path d="M -${s * 0.25} ${s * 0.25} L ${s * 0.25} -${s * 0.25} M 0 ${s} L ${s} 0 M ${s * 0.75} ${s * 1.25} L ${s * 1.25} ${s * 0.75}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-opacity="${op}"/>`;
      break;
    case 'chevron':
      inner = `<path d="M 0 ${s * 0.65} L ${half} ${s * 0.15} L ${s} ${s * 0.65} M 0 ${s * 1.15} L ${half} ${s * 0.65} L ${s} ${s * 1.15}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-opacity="${op}" stroke-linecap="square"/>`;
      break;
    case 'hexagon': {
      const w = s;
      const h = s;
      inner = `<path d="M ${w * 0.5} 0 L ${w} ${h * 0.25} L ${w} ${h * 0.75} L ${w * 0.5} ${h} L 0 ${h * 0.75} L 0 ${h * 0.25} Z" fill="none" stroke="${color}" stroke-width="${sw}" stroke-opacity="${op}"/>`;
      break;
    }
    case 'waves':
      inner = `<path d="M 0 ${half} Q ${s * 0.25} ${s * 0.2} ${half} ${half} T ${s} ${half}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-opacity="${op}"/>`;
      break;
    case 'terrazzo':
      inner = `<polygon points="${s * 0.15},${s * 0.2} ${s * 0.35},${s * 0.12} ${s * 0.28},${s * 0.38}" fill="${color}" fill-opacity="${op}"/>
               <polygon points="${s * 0.65},${s * 0.25} ${s * 0.85},${s * 0.32} ${s * 0.72},${s * 0.52} ${s * 0.58},${s * 0.42}" fill="${color}" fill-opacity="${op * 0.75}"/>
               <polygon points="${s * 0.25},${s * 0.72} ${s * 0.48},${s * 0.68} ${s * 0.38},${s * 0.9}" fill="${color}" fill-opacity="${op * 0.85}"/>
               <circle cx="${s * 0.8}" cy="${s * 0.8}" r="${Math.max(1.5, sw * 1.2)}" fill="${color}" fill-opacity="${op}"/>`;
      break;
    case 'isometric':
      inner = `<path d="M ${half} 0 L ${s} ${s * 0.28} L ${s} ${s * 0.72} L ${half} ${s} L 0 ${s * 0.72} L 0 ${s * 0.28} Z M ${half} ${half} L ${half} ${s} M ${half} ${half} L ${s} ${s * 0.28} M ${half} ${half} L 0 ${s * 0.28}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-opacity="${op}"/>`;
      break;
    case 'checker':
      inner = `<rect x="0" y="0" width="${half}" height="${half}" fill="${color}" fill-opacity="${op}"/>
               <rect x="${half}" y="${half}" width="${half}" height="${half}" fill="${color}" fill-opacity="${op}"/>`;
      break;
    case 'crosshatch':
      inner = `<path d="M 0 0 L ${s} ${s} M ${s} 0 L 0 ${s}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-opacity="${op}"/>`;
      break;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><g${rotTransform}>${inner}</g></svg>`;
}

/**
 * Builds an SVG data-URI for a shape pattern fill with an optional solid background colour.
 * Wraps buildPatternSvg to inject a background rect so the pattern reads against any bg.
 */
export function buildShapePatternDataUri(
  type: BackgroundPatternType,
  inkColor: string,
  bgColor: string,
  scale: number,
  strokeWidth: number,
  opacity: number
): string {
  const patternSpec: PageBackgroundPattern = {
    type,
    color: inkColor,
    opacity,
    scale,
    strokeWidth,
    rotation: 0,
  };
  const inner = buildPatternSvg(patternSpec);
  if (!inner) return '';

  const s = Math.max(10, Math.round(scale));
  const bg = bgColor && bgColor !== 'transparent' ? `<rect width="${s}" height="${s}" fill="${bgColor}"/>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">${bg}${inner}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Returns CSS backgroundImage/backgroundSize properties for a page or thumbnail preview.
 */
export function buildPatternBackgroundStyle(
  pattern?: PageBackgroundPattern,
  scaleMultiplier = 1
): React.CSSProperties {
  if (!pattern || pattern.type === 'none') return {};
  const svg = buildPatternSvg(pattern);
  if (!svg) return {};
  const tilePx = Math.max(4, Math.round(pattern.scale * scaleMultiplier));
  return {
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    backgroundRepeat: 'repeat',
    backgroundSize: `${tilePx}px ${tilePx}px`,
  };
}
