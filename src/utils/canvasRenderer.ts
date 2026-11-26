import QRCode from 'qrcode';
import {
  AccentElement,
  ConnectorElement,
  ImageElement,
  LineElement,
  Page,
  PublisherElement,
  QRElement,
  ShapeElement,
  TableElement,
  TextElement,
} from '../types/publisher';
import { buildPatternSvg, buildShapePatternDataUri } from './patternGenerator';
import { buildWavyRectPath, getShapeSvgPath } from './shapePaths';
import { buildFontString, layoutText, measureTextWidth, verticalOffset } from './textLayout';
import type { TextLayoutResult } from './textLayout';
import { buildTextEffectPainter } from './textEffects';
import { elementClipPath } from './shapeClip';
import { imageContentRect, imageFit } from './imageFrame';
import { glintStarPoints, wordArtGlints, wordArtPaint, wordArtShadowChain } from './wordArt';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function createLinearGrad(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  angleDeg: number,
  c1: string,
  c2: string
): CanvasGradient {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.hypot(w, h) / 2;
  const grad = ctx.createLinearGradient(
    cx - Math.cos(rad) * r,
    cy - Math.sin(rad) * r,
    cx + Math.cos(rad) * r,
    cy + Math.sin(rad) * r
  );
  grad.addColorStop(0, c1 || '#4f46e5');
  grad.addColorStop(1, c2 || '#06b6d4');
  return grad;
}

function drawPolygonMask(ctx: CanvasRenderingContext2D, mask: string | undefined, w: number, h: number, radius?: number) {
  ctx.beginPath();
  if (mask === 'circle') {
    ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (mask === 'diamond') {
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w, h / 2);
    ctx.lineTo(w / 2, h);
    ctx.lineTo(0, h / 2);
    ctx.closePath();
  } else if (mask === 'hexagon') {
    ctx.moveTo(w * 0.25, 0);
    ctx.lineTo(w * 0.75, 0);
    ctx.lineTo(w, h * 0.5);
    ctx.lineTo(w * 0.75, h);
    ctx.lineTo(w * 0.25, h);
    ctx.lineTo(0, h * 0.5);
    ctx.closePath();
  } else if (mask === 'triangle') {
    ctx.moveTo(w * 0.5, 0);
    ctx.lineTo(0, h);
    ctx.lineTo(w, h);
    ctx.closePath();
  } else if (mask === 'star') {
    const pts = [
      [0.5, 0], [0.61, 0.35], [0.98, 0.35], [0.68, 0.57], [0.79, 0.91],
      [0.5, 0.7], [0.21, 0.91], [0.32, 0.57], [0.02, 0.35], [0.39, 0.35],
    ];
    pts.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(px * w, py * h);
      else ctx.lineTo(px * w, py * h);
    });
    ctx.closePath();
  } else if (mask === 'heart') {
    const pts = [
      [0.5, 0.88], [0.12, 0.52], [0.04, 0.28], [0.18, 0.1], [0.38, 0.1],
      [0.5, 0.24], [0.62, 0.1], [0.82, 0.1], [0.96, 0.28], [0.88, 0.52],
    ];
    pts.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(px * w, py * h);
      else ctx.lineTo(px * w, py * h);
    });
    ctx.closePath();
  } else {
    const r = mask === 'rounded' ? 24 : radius || 0;
    if (r > 0) ctx.roundRect(0, 0, w, h, r);
    else ctx.rect(0, 0, w, h);
  }
}

function drawTextElement(ctx: CanvasRenderingContext2D, el: TextElement) {
  const { width, height } = el;
  if (el.backgroundColor && el.backgroundColor !== 'transparent') {
    ctx.fillStyle = el.backgroundColor;
    if (el.borderRadius) {
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, el.borderRadius);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, width, height);
    }
  }
  if (el.borderWidth && el.borderStyle !== 'none') {
    ctx.strokeStyle = el.borderColor || '#000000';
    ctx.lineWidth = el.borderWidth;
    if (el.borderRadius) {
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, el.borderRadius);
      ctx.stroke();
    } else {
      ctx.strokeRect(0, 0, width, height);
    }
  }

  const layout = layoutText(el);
  const paint = buildTextEffectPainter(el);
  // WordArt styles carry their own fill, stroke, shadow stack and weight, so
  // the exported text looks like the canvas instead of falling back to el.color.
  const wa = el.isWordArt ? wordArtPaint(el.wordArtStyle) : undefined;
  const top = verticalOffset(layout, el);
  const letterSpacing = el.letterSpacing || 0;
  const wordSpacing = el.wordSpacing || 0;

  ctx.save();
  ctx.beginPath();
  if (el.borderRadius) ctx.roundRect(0, 0, width, height, el.borderRadius);
  else ctx.rect(0, 0, width, height);
  ctx.clip();

  if (el.highlightColor && el.highlightColor !== 'transparent') {
    ctx.fillStyle = el.highlightColor;
    for (const line of layout.lines) {
      for (const run of line.runs) {
        if (run.kind === 'marker') continue;
        ctx.fillRect(run.x, top + line.y, run.width, line.height);
      }
    }
  }

  if (el.kerning === false && 'fontKerning' in ctx) {
    (ctx as CanvasRenderingContext2D & { fontKerning: string }).fontKerning = 'none';
  }

  interface GlyphUnit {
    text: string;
    x: number;
    y: number;
    font: string;
    /** Rotation in radians (curved text). */
    angle: number;
    centred: boolean;
  }

  const units: GlyphUnit[] = [];
  if (layout.curve) {
    const font = buildFontString(el, layout.fontSize);
    for (const char of layout.curve.chars) {
      if (!char.text.trim()) continue;
      units.push({
        text: char.text,
        x: char.x,
        y: top + char.y,
        font,
        angle: (char.angle * Math.PI) / 180,
        centred: true,
      });
    }
  } else {
    for (const line of layout.lines) {
      for (const run of line.runs) {
        if (run.kind === 'leader' || !run.text || (run.kind === 'space' && !el.highlightColor)) {
          continue;
        }
        if (run.kind === 'space') continue;
        units.push({
          text: run.text,
          x: run.x,
          y: top + line.textTop + run.baselineShift,
          font: buildFontString(el, run.fontSize),
          angle: 0,
          centred: false,
        });
      }
    }
  }

  const baseFont = buildFontString(el, layout.fontSize);

  const drawUnits = (options: {
    color?: string | CanvasGradient;
    /**
     * Built per glyph from element-space coordinates, so a diagonal ramp runs
     * across the whole word instead of restarting inside every letter.
     */
    gradient?: {
      width: number;
      height: number;
      angle: number;
      stops: { offset: number; color: string }[];
      origin: { x: number; y: number };
    };
    strokeColor?: string;
    strokeWidth?: number;
    offsetX?: number;
    offsetY?: number;
    blur?: number;
    fill?: boolean;
  }) => {
    const {
      color,
      gradient,
      strokeColor,
      strokeWidth = 0,
      offsetX = 0,
      offsetY = 0,
      blur = 0,
      fill = true,
    } = options;

    for (const unit of units) {
      ctx.save();
      if (blur > 0 && 'filter' in ctx) {
        // Canvas `blur(r)` means σ = r; every CSS shadow (drop-shadow and
        // text-shadow) means σ = r/2. Halve it so the DOM and the export are
        // equally soft.
        ctx.filter = `blur(${blur / 2}px)`;
      }
      ctx.translate(unit.x + offsetX, unit.y + offsetY);
      if (unit.angle) ctx.rotate(unit.angle);
      ctx.font = unit.font;
      ctx.textBaseline = unit.centred ? 'middle' : 'top';
      ctx.textAlign = unit.centred ? 'center' : 'left';

      if (fill && (gradient || color !== undefined)) {
        ctx.fillStyle = gradient
          ? gradientFromStops(ctx, gradient.width, gradient.height, gradient.angle, gradient.stops, {
              x: gradient.origin.x - unit.x - offsetX,
              y: gradient.origin.y - unit.y - offsetY,
            })
          : (color as string | CanvasGradient);
        paintRun(ctx, unit.text, 0, 0, unit.font, letterSpacing, wordSpacing);
      }
      if (strokeWidth > 0 && strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        strokeRun(ctx, unit.text, 0, 0, unit.font, letterSpacing, wordSpacing);
      }
      ctx.restore();
    }
  };

  // 1. Everything behind the glyphs, in one chain shared with the CSS painter:
  // the extrusion marching copies, hand-authored shadows, the cast shadow and
  // the bloom. CSS lists the nearest layer first; canvas paints farthest-first,
  // so the chain is walked backwards and the crisp offsets land on top.
  for (const shadow of [...wordArtShadowChain(wa)].reverse().concat(paint.shadows)) {
    drawUnits({
      color: shadow.color,
      offsetX: shadow.dx,
      offsetY: shadow.dy,
      blur: shadow.blur,
    });
  }

  // CSS paints -webkit-text-stroke behind the fill, so the WordArt outline goes
  // down before the glyphs do.
  if (wa?.stroke) {
    drawUnits({ fill: false, strokeColor: wa.stroke.color, strokeWidth: wa.stroke.width });
  }

  // 2. Fill (gradient or flat), unless the effect is hollow.
  let fillStyle: string | CanvasGradient = el.color || '#0f172a';
  let waGradient:
    | {
        width: number;
        height: number;
        angle: number;
        stops: { offset: number; color: string }[];
        origin: { x: number; y: number };
      }
    | undefined;
  if (wa?.gradient) {
    const box = glyphBox(layout, top);
    waGradient = {
      width: box.width,
      height: box.height,
      angle: wa.gradient.angle,
      stops: wa.gradient.stops,
      origin: { x: box.x, y: box.y },
    };
  } else if (wa?.fill) {
    fillStyle = wa.fill;
  } else if (paint.gradient) {
    fillStyle = gradientForBox(
      ctx,
      width,
      height,
      paint.gradient.angle,
      paint.gradient.from,
      paint.gradient.to
    );
  } else if (el.textFillType === 'gradient') {
    fillStyle = gradientForBox(
      ctx,
      width,
      height,
      el.textGradientAngle ?? 90,
      el.color || '#0f172a',
      el.textGradientColor2 || '#6e56cf'
    );
  }
  if (!paint.fillTransparent || wa) {
    drawUnits(waGradient ? { gradient: waGradient, color: fillStyle } : { color: fillStyle });
  }

  // 3. Stroke (a WordArt outline has already been drawn underneath).
  if (!wa?.stroke && paint.strokeWidth > 0) {
    drawUnits({ fill: false, strokeColor: paint.strokeColor, strokeWidth: paint.strokeWidth });
  }

  // 4. Splice / glitch slices.
  for (const slice of paint.slices) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      width * slice.left,
      height * slice.top,
      width * (1 - slice.left - slice.right),
      height * (1 - slice.top - slice.bottom)
    );
    ctx.clip();
    drawUnits({ color: slice.color, offsetX: slice.dx, offsetY: slice.dy });
    ctx.restore();
  }

  // 5. Tab leaders (never shadowed or sliced).
  if (!layout.curve) {
    for (const line of layout.lines) {
      for (const run of line.runs) {
        if (run.kind !== 'leader') continue;
        const y = top + line.textTop;
        if (run.text === '─') {
          ctx.save();
          ctx.strokeStyle = el.color || '#0f172a';
          ctx.lineWidth = Math.max(1, layout.fontSize * 0.06);
          ctx.beginPath();
          ctx.moveTo(run.x, y + layout.fontSize * 0.72);
          ctx.lineTo(run.x + run.width, y + layout.fontSize * 0.72);
          ctx.stroke();
          ctx.restore();
        } else {
          const dash = run.text === '-' ? '-' : '.';
          const dashWidth = Math.max(1, measureTextWidth(dash, baseFont));
          const step = el.tabLeader === 'dash' ? dashWidth * 1.6 : dashWidth * 2.2;
          ctx.font = baseFont;
          ctx.textBaseline = 'top';
          ctx.textAlign = 'left';
          ctx.fillStyle = el.color || '#0f172a';
          let cursor = run.x;
          while (cursor + dashWidth <= run.x + run.width) {
            ctx.fillText(dash, cursor, y);
            cursor += step;
          }
        }
      }
    }
  }

  // 6. Drop cap on top, matching the DOM order.
  if (layout.dropCap) {
    const cap = layout.dropCap;
    const capFont = buildFontString(el, cap.size);
    ctx.save();
    ctx.font = capFont;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    for (const shadow of paint.shadows) {
      // same σ convention as drawUnits: CSS blur radius is twice the σ
      if ('filter' in ctx && shadow.blur > 0) ctx.filter = `blur(${shadow.blur / 2}px)`;
      ctx.fillStyle = shadow.color;
      paintRun(ctx, cap.char, cap.x + shadow.dx, top + cap.y + shadow.dy, capFont, 0, 0);
      if ('filter' in ctx) ctx.filter = 'none';
    }
    if (!paint.fillTransparent) {
      ctx.fillStyle = fillStyle;
      paintRun(ctx, cap.char, cap.x, top + cap.y, capFont, 0, 0);
    }
    if (paint.strokeWidth > 0) {
      ctx.strokeStyle = paint.strokeColor;
      ctx.lineWidth = paint.strokeWidth;
      strokeRun(ctx, cap.char, cap.x, top + cap.y, capFont, 0, 0);
    }
    ctx.restore();
  }

  // 6. Sparkles — the last thing on top, inside the element clip.
  for (const glint of wordArtGlints(wa ? el.wordArtStyle : undefined, width, height)) {
    ctx.save();
    ctx.globalAlpha = glint.opacity;
    const halo = ctx.createRadialGradient(glint.x, glint.y, 0, glint.x, glint.y, glint.radius * 2);
    halo.addColorStop(0, 'rgba(255,255,255,0.85)');
    halo.addColorStop(0.45, 'rgba(255,255,255,0.22)');
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(glint.x, glint.y, glint.radius * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    glintStarPoints(glint).forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/** Draws a run glyph by glyph so tracking survives export everywhere. */
function paintRun(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  letterSpacing: number,
  wordSpacing: number
) {
  if (!text) return;
  if (!letterSpacing && !wordSpacing) {
    ctx.fillText(text, x, y);
    return;
  }
  ctx.save();
  ctx.font = font;
  let cursor = x;
  for (const ch of text) {
    ctx.fillText(ch, cursor, y);
    cursor += measureTextWidth(ch, font) + letterSpacing + (ch === ' ' ? wordSpacing : 0);
  }
  ctx.restore();
}

function strokeRun(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  letterSpacing: number,
  wordSpacing: number
) {
  if (!text) return;
  if (!letterSpacing && !wordSpacing) {
    ctx.strokeText(text, x, y);
    return;
  }
  ctx.save();
  ctx.font = font;
  let cursor = x;
  for (const ch of text) {
    ctx.strokeText(ch, cursor, y);
    cursor += measureTextWidth(ch, font) + letterSpacing + (ch === ' ' ? wordSpacing : 0);
  }
  ctx.restore();
}

/** CSS-style gradient (0° = to top, 90° = to right) mapped onto a box. */
function gradientForBox(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  angleDeg: number,
  from: string,
  to: string
): CanvasGradient {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const length = Math.abs(width * dx) + Math.abs(height * dy);
  const cx = width / 2;
  const cy = height / 2;
  const g = ctx.createLinearGradient(
    cx - (dx * length) / 2,
    cy - (dy * length) / 2,
    cx + (dx * length) / 2,
    cy + (dy * length) / 2
  );
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  return g;
}

/**
 * The inline box the glyphs actually occupy. CSS clips a WordArt gradient to
 * the glyphs' own inline boxes, not to the element frame, so the exporter has
 * to measure the same rectangle or a horizon stop lands at a different height
 * in the editor than in the PNG.
 */
function glyphBox(
  layout: TextLayoutResult,
  top: number
): { x: number; y: number; width: number; height: number } {
  const lines = layout.lines.length ? layout.lines : [];
  if (!lines.length) return { x: 0, y: 0, width: 1, height: 1 };
  let x0 = Infinity;
  let x1 = -Infinity;
  for (const line of lines) {
    for (const run of line.runs) {
      if (!run.text.trim()) continue;
      x0 = Math.min(x0, run.x);
      x1 = Math.max(x1, run.x + run.width);
    }
  }
  if (!Number.isFinite(x0)) { x0 = 0; x1 = layout.columnWidth; }
  const first = lines[0];
  const last = lines[lines.length - 1];
  const y0 = top + first.textTop;
  const lastSize = last.runs.reduce((max, run) => Math.max(max, run.fontSize), layout.fontSize);
  const y1 = top + last.textTop + lastSize;
  return {
    x: x0,
    y: y0,
    width: Math.max(1, x1 - x0),
    height: Math.max(1, y1 - y0),
  };
}

/** Multi-stop version of `gradientForBox`, for WordArt palettes. */
function gradientFromStops(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  angleDeg: number,
  stops: { offset: number; color: string }[],
  origin: { x: number; y: number } = { x: 0, y: 0 }
): CanvasGradient {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const length = Math.abs(width * dx) + Math.abs(height * dy);
  const cx = origin.x + width / 2;
  const cy = origin.y + height / 2;
  const g = ctx.createLinearGradient(
    cx - (dx * length) / 2,
    cy - (dy * length) / 2,
    cx + (dx * length) / 2,
    cy + (dy * length) / 2
  );
  for (const stop of [...stops].sort((a, b) => a.offset - b.offset)) {
    g.addColorStop(Math.max(0, Math.min(1, stop.offset)), stop.color);
  }
  return g;
}

async function drawShapeElement(ctx: CanvasRenderingContext2D, el: ShapeElement) {
  const { width, height, fillColor, strokeColor, strokeWidth, strokeDash } = el;
  ctx.save();

  // "Clip to shape" applies to any element, shapes included.
  const shapeClip = elementClipPath(el);
  if (shapeClip) ctx.clip(new Path2D(shapeClip));

  if (el.shadow) {
    ctx.shadowColor = el.shadowColor || 'rgba(0,0,0,0.28)';
    ctx.shadowBlur = el.shadowBlur || 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;
  } else if (el.glow) {
    ctx.shadowColor = el.glowColor || '#38bdf8';
    ctx.shadowBlur = el.glowSize || 12;
  }

  const fillStyle: string | CanvasGradient | CanvasPattern =
    el.fillType === 'linear-gradient'
      ? createLinearGrad(ctx, width, height, el.gradientAngle ?? 90, fillColor, el.gradientColor2 || '#38bdf8')
      : fillColor || 'transparent';

  // Resolve pattern fill asynchronously
  let resolvedFillStyle: string | CanvasGradient | CanvasPattern = fillStyle;
  let patternBgGrad: CanvasGradient | null = null;
  if (el.fillType === 'pattern' && el.patternType && el.patternType !== 'none') {
    const isGradBg = el.patternBgType === 'gradient';
    if (isGradBg) {
      patternBgGrad = createLinearGrad(
        ctx,
        width,
        height,
        el.patternBgAngle ?? 135,
        el.patternBgColor || '#fdf2f8',
        el.patternBgColor2 || '#e0f2fe'
      );
    }
    const dataUri = buildShapePatternDataUri(
      el.patternType,
      el.patternColor ?? '#4f46e5',
      isGradBg ? 'transparent' : (el.patternBgColor ?? '#ffffff'),
      el.patternScale ?? 24,
      1.5,
      el.patternOpacity ?? 0.8,
    );
    const patImg = await loadImage(dataUri);
    if (patImg) {
      const canvasPat = ctx.createPattern(patImg, 'repeat');
      if (canvasPat) resolvedFillStyle = canvasPat;
    } else {
      resolvedFillStyle = fillColor || '#cccccc';
    }
  }

  if (el.shapeType === 'merged' && el.mergedPath) {
    // Export the same single path the canvas shows, scaled like the preview.
    const p2d = new Path2D(el.mergedPath);
    ctx.save();
    const baseW = el.mergedBaseWidth || width || 1;
    const baseH = el.mergedBaseHeight || height || 1;
    ctx.scale(width / baseW, height / baseH);
    if (strokeDash === 'dashed') ctx.setLineDash([8, 4]);
    else if (strokeDash === 'dotted') ctx.setLineDash([3, 3]);
    if (patternBgGrad) {
      ctx.fillStyle = patternBgGrad;
      ctx.fill(p2d);
    }
    ctx.fillStyle = resolvedFillStyle;
    ctx.fill(p2d);
    if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke(p2d);
    }
    ctx.restore();
  } else if (el.shapeType === 'merged' && el.mergedParts && el.mergedParts.length > 0) {
    ctx.strokeStyle = strokeColor || 'transparent';
    ctx.lineWidth = strokeWidth || 0;
    for (const part of el.mergedParts) {
      const p2d = new Path2D(part.d);
      ctx.save();
      ctx.translate(part.x, part.y);
      if (patternBgGrad) {
        ctx.fillStyle = patternBgGrad;
        ctx.fill(p2d);
      }
      ctx.fillStyle = resolvedFillStyle;
      ctx.fill(p2d);
      if (strokeWidth > 0 && strokeColor !== 'transparent') ctx.stroke(p2d);
      ctx.restore();
    }
  } else {
    let pathStr = '';
    if (el.shapeType === 'rectangle' && el.waveEdge && el.waveEdge !== 'none') {
      pathStr = buildWavyRectPath(
        width,
        height,
        strokeWidth || 0,
        el.waveEdge,
        el.waveAmplitude ?? 18,
        el.waveFrequency ?? 2
      );
    } else if (el.shapeType === 'rectangle' || el.shapeType === 'rounded-rect') {
      const sw = strokeWidth || 0;
      const r = el.shapeType === 'rounded-rect' ? el.cornerRadius ?? 12 : 0;
      ctx.beginPath();
      if (r > 0) ctx.roundRect(sw / 2, sw / 2, width - sw, height - sw, r);
      else ctx.rect(sw / 2, sw / 2, width - sw, height - sw);
    } else if (el.shapeType === 'circle') {
      const sw = strokeWidth || 0;
      ctx.beginPath();
      ctx.ellipse(width / 2, height / 2, (width - sw) / 2, (height - sw) / 2, 0, 0, Math.PI * 2);
    } else {
      pathStr = getShapeSvgPath(el);
    }

    if (strokeDash === 'dashed') ctx.setLineDash([8, 4]);
    else if (strokeDash === 'dotted') ctx.setLineDash([3, 3]);

    if (pathStr) {
      const p2d = new Path2D(pathStr);
      if (fillColor !== 'transparent' || el.fillType === 'pattern' || el.fillType === 'linear-gradient') {
        if (patternBgGrad) {
          ctx.fillStyle = patternBgGrad;
          ctx.fill(p2d);
        }
        ctx.fillStyle = resolvedFillStyle;
        ctx.fill(p2d);
      }
      if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke(p2d);
      }
    } else {
      if (fillColor !== 'transparent' || el.fillType === 'pattern' || el.fillType === 'linear-gradient') {
        if (patternBgGrad) {
          ctx.fillStyle = patternBgGrad;
          ctx.fill();
        }
        ctx.fillStyle = resolvedFillStyle;
        ctx.fill();
      }
      if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  if (el.label) {
    ctx.save();
    ctx.fillStyle = el.labelColor || '#ffffff';
    const fs = el.labelFontSize || 14;
    ctx.font = `700 ${fs}px sans-serif`;
    ctx.textBaseline = 'middle';
    const lines = el.label.split('\n');
    const lh = fs * 1.25;
    const startY = height / 2 - ((lines.length - 1) * lh) / 2;
    lines.forEach((line, i) => {
      const mw = ctx.measureText(line).width;
      ctx.fillText(line, (width - mw) / 2, startY + i * lh);
    });
    ctx.restore();
  }
}

async function drawImageElement(ctx: CanvasRenderingContext2D, el: ImageElement) {
  const { width, height } = el;

  // A custom "clip to shape" applies to everything this element paints.
  const customClip = elementClipPath(el);
  if (customClip) {
    ctx.save();
    ctx.clip(new Path2D(customClip));
  }
  const art = el.borderArt || 'none';
  const artColor = el.borderArtColor || el.borderColor || '#ffffff';
  const artColor2 = el.borderArtColor2 || '#4f46e5';
  const artWidth = el.borderArtWidth ?? (art !== 'none' ? 4 : 0);
  const artPad =
    el.borderArtPadding ??
    (art === 'polaroid'
      ? 10
      : art === 'stitched-scrapbook' || art === 'stamp-postage'
      ? 12
      : art !== 'none' && art !== 'dots-and-dashes'
      ? 6
      : 0);
  const effect = el.effectPreset || 'none';
  const isStickerMode = effect === 'sticker' || Boolean(el.isSticker);

  const cardRadius =
    effect === 'clay' || art === 'puffy-clay'
      ? 24
      : art === 'pastel-rainbow'
      ? 20
      : art === 'candy-stripe'
      ? 18
      : art === 'stitched-scrapbook' || art === 'dotted-double'
      ? 16
      : art === 'doodle-box'
      ? 18
      : el.borderRadius;

  // Offset solid shadows (doodle-box / puffy-clay) before drawing card body
  if (!isStickerMode && art === 'puffy-clay') {
    ctx.save();
    ctx.fillStyle = artColor2;
    drawPolygonMask(ctx, el.maskShape, width, height, cardRadius);
    ctx.translate(0, 8);
    ctx.fill();
    ctx.restore();
  } else if (art === 'doodle-box') {
    ctx.save();
    ctx.fillStyle = artColor2;
    drawPolygonMask(ctx, el.maskShape, width, height, cardRadius);
    ctx.translate(6, 6);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  if (!isStickerMode && (el.shadow || art === 'polaroid' || art === 'puffy-clay')) {
    ctx.shadowColor = art === 'puffy-clay' ? 'rgba(0,131,143,0.18)' : 'rgba(15,23,42,0.24)';
    ctx.shadowBlur = art === 'puffy-clay' ? 20 : 14;
    ctx.shadowOffsetY = art === 'puffy-clay' ? 10 : 6;
  }

  // Outer card background
  if (isStickerMode) {
    // Transparent frameless sticker: contour outline is drawn around alpha silhouette below
  } else if (art === 'candy-stripe') {
    ctx.save();
    drawPolygonMask(ctx, el.maskShape, width, height, cardRadius);
    ctx.clip();
    ctx.fillStyle = artColor2;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = artColor;
    ctx.lineWidth = 10;
    for (let i = -height; i < width + height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, height);
      ctx.lineTo(i + height, 0);
      ctx.stroke();
    }
    ctx.restore();
  } else if (art === 'pastel-rainbow') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, artColor);
    grad.addColorStop(0.33, '#fad0c4');
    grad.addColorStop(0.66, artColor2);
    grad.addColorStop(1, '#c2e9fb');
    ctx.fillStyle = grad;
    drawPolygonMask(ctx, el.maskShape, width, height, cardRadius);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.save();
    const bw = Math.max(3, artWidth);
    ctx.translate(bw, bw);
    drawPolygonMask(ctx, el.maskShape, Math.max(4, width - bw * 2), Math.max(4, height - bw * 2), Math.max(4, (cardRadius || 20) - bw));
    ctx.fill();
    ctx.restore();
  } else if (
    art === 'polaroid' ||
    art === 'classic-frame' ||
    art === 'stamp-postage' ||
    art === 'filmstrip' ||
    art === 'stitched-scrapbook' ||
    art === 'puffy-clay' ||
    art === 'doodle-box' ||
    art === 'dotted-double'
  ) {
    ctx.fillStyle = artColor;
    drawPolygonMask(ctx, el.maskShape, width, height, cardRadius);
    ctx.fill();
  }
  ctx.restore();

  // Inner image rectangle
  const padL = isStickerMode ? 0 : artPad + (art === 'candy-stripe' ? 4 : 0);
  const padT = isStickerMode ? 0 : artPad + (art === 'candy-stripe' ? 4 : 0);
  const padR = isStickerMode ? 0 : artPad + (art === 'candy-stripe' ? 4 : 0);
  const padB = isStickerMode
    ? 0
    : art === 'polaroid'
    ? Math.max(26, artPad * 2.8)
    : artPad + (art === 'candy-stripe' ? 4 : 0);
  const innerW = Math.max(10, width - padL - padR);
  const innerH = Math.max(10, height - padT - padB);

  const img = await loadImage(el.src);
  ctx.save();
  ctx.translate(padL, padT);
  if (!isStickerMode) {
    drawPolygonMask(
      ctx,
      el.maskShape,
      innerW,
      innerH,
      art === 'candy-stripe'
        ? 10
        : effect === 'clay' || art === 'puffy-clay'
        ? 18
        : art === 'stitched-scrapbook' || art === 'pastel-rainbow' || art === 'doodle-box' || art === 'dotted-double'
        ? 10
        : el.borderRadius
    );
    ctx.clip();
  }

  if (img) {
    const filters: string[] = [];
    if (el.brightness !== undefined && el.brightness !== 100) filters.push(`brightness(${el.brightness}%)`);
    if (el.contrast !== undefined && el.contrast !== 100) filters.push(`contrast(${el.contrast}%)`);
    if (el.saturate !== undefined && el.saturate !== 100) filters.push(`saturate(${el.saturate}%)`);
    if (el.grayscale) filters.push(`grayscale(${el.grayscale}%)`);
    if (el.sepia) filters.push(`sepia(${el.sepia}%)`);
    if (el.blur) filters.push(`blur(${el.blur}px)`);
    if (el.hueRotate) filters.push(`hue-rotate(${el.hueRotate}deg)`);
    if (el.effectPreset === 'retro-film') {
      filters.push('sepia(35%) contrast(112%) saturate(90%) brightness(102%)');
    } else if (el.effectPreset === 'duotone-pop') {
      filters.push('saturate(175%) contrast(125%) brightness(104%)');
    } else if (el.effectPreset === 'cartoon') {
      filters.push('contrast(130%) saturate(135%)');
    }
    if (filters.length > 0) ctx.filter = filters.join(' ');

    // Placement comes from the same helper the DOM renderer and the crop
    // gesture use, so the export cannot drift from what is on screen.
    const rect = imageContentRect(
      { width: innerW, height: innerH },
      { width: img.width, height: img.height },
      {
        fit: imageFit(el),
        scale: el.imageScale || 1,
        rotation: el.imageRotation,
        flipH: el.flipH,
        flipV: el.flipV,
      },
      { panX: el.panX || 0, panY: el.panY || 0 }
    );
    const drawW = rect.width;
    const drawH = rect.height;
    const dx = rect.left;
    const dy = rect.top;
    ctx.save();
    if (el.imageRotation || el.flipH || el.flipV) {
      ctx.translate(innerW / 2, innerH / 2);
      if (el.imageRotation) ctx.rotate((el.imageRotation * Math.PI) / 180);
      if (el.flipH || el.flipV) ctx.scale(el.flipH ? -1 : 1, el.flipV ? -1 : 1);
      ctx.translate(-innerW / 2, -innerH / 2);
    }

    if (isStickerMode) {
      const w1 = el.stickerOutlineWidth ?? 5;
      const c1 = el.stickerOutlineColor || '#ffffff';
      const w2 = el.stickerOutlineWidth2 ?? 0;
      const c2 = el.stickerOutlineColor2 || '#4f46e5';

      const stampContour = (radius: number, color: string) => {
        if (radius <= 0) return;
        const sil = document.createElement('canvas');
        sil.width = Math.max(2, Math.round(drawW));
        sil.height = Math.max(2, Math.round(drawH));
        const sCtx = sil.getContext('2d');
        if (!sCtx) return;
        sCtx.drawImage(img, 0, 0, sil.width, sil.height);
        sCtx.globalCompositeOperation = 'source-in';
        sCtx.fillStyle = color;
        sCtx.fillRect(0, 0, sil.width, sil.height);
        const steps = 12;
        for (let i = 0; i < steps; i++) {
          const ang = (i / steps) * Math.PI * 2;
          ctx.drawImage(
            sil,
            dx + Math.cos(ang) * radius,
            dy + Math.sin(ang) * radius,
            drawW,
            drawH
          );
        }
      };

      if (w2 > 0) stampContour(w1 + w2, c2);
      if (w1 > 0) stampContour(w1, c1);

      ctx.save();
      if (el.stickerFinish === 'neon') {
        ctx.shadowColor = el.stickerGlowColor || '#38bdf8';
        ctx.shadowBlur = 16;
      } else {
        ctx.shadowColor = 'rgba(15,23,42,0.24)';
        ctx.shadowBlur = el.stickerFinish === 'puffy' ? 12 : 8;
        ctx.shadowOffsetY = el.stickerFinish === 'puffy' ? 8 : 5;
      }
      ctx.drawImage(img, dx, dy, drawW, drawH);
      ctx.restore();
    } else {
      ctx.drawImage(img, dx, dy, drawW, drawH);
    }
    ctx.restore();
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, innerW, innerH);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(2, 2, Math.max(4, innerW - 4), Math.max(4, innerH - 4));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(innerW, innerH);
    ctx.moveTo(innerW, 0);
    ctx.lineTo(0, innerH);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  // Specialized Decorative Frame Strokes
  if (art === 'stitched-scrapbook') {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = artColor2;
    ctx.setLineDash([6, 4]);
    ctx.translate(8, 8);
    drawPolygonMask(ctx, el.maskShape, Math.max(4, width - 16), Math.max(4, height - 16), 10);
    ctx.stroke();
    ctx.restore();
  } else if (art === 'dotted-double') {
    ctx.save();
    ctx.lineWidth = Math.max(2, artWidth);
    ctx.strokeStyle = artColor2;
    drawPolygonMask(ctx, el.maskShape, width, height, cardRadius);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#d8b4fe';
    ctx.lineCap = 'round';
    ctx.setLineDash([1, 8]);
    ctx.translate(-6, -6);
    drawPolygonMask(ctx, el.maskShape, width + 12, height + 12, 20);
    ctx.stroke();
    ctx.restore();
  } else if (art === 'stamp-postage') {
    ctx.save();
    ctx.strokeStyle = artColor2;
    ctx.lineWidth = 2;
    drawPolygonMask(ctx, el.maskShape, width, height, 0);
    ctx.stroke();
    // Punch scalloped notches along perimeter
    ctx.fillStyle = '#ffffff';
    const step = 20;
    for (let x = 10; x < width; x += step) {
      ctx.beginPath();
      ctx.arc(x, 0, 6, 0, Math.PI * 2);
      ctx.arc(x, height, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let y = 10; y < height; y += step) {
      ctx.beginPath();
      ctx.arc(0, y, 6, 0, Math.PI * 2);
      ctx.arc(width, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (
    effect === 'cartoon' ||
    (art !== 'none' && art !== 'candy-stripe' && art !== 'pastel-rainbow' && artWidth > 0) ||
    (el.borderWidth && el.borderWidth > 0)
  ) {
    ctx.save();
    ctx.lineWidth =
      effect === 'cartoon'
        ? 3
        : art === 'puffy-clay'
        ? Math.max(2, artWidth)
        : art === 'doodle-box'
        ? Math.max(2, artWidth)
        : art !== 'none'
        ? artWidth
        : el.borderWidth || 1;
    ctx.strokeStyle =
      effect === 'cartoon'
        ? '#0f172a'
        : art === 'puffy-clay'
        ? '#ffffff'
        : art === 'doodle-box'
        ? '#3d348b'
        : art !== 'none'
        ? artColor
        : el.borderColor || '#cbd5e1';
    if (art === 'dots-and-dashes') ctx.setLineDash([8, 4]);
    drawPolygonMask(ctx, el.maskShape, width, height, cardRadius);
    ctx.stroke();
    ctx.restore();
  }

  if (art === 'polaroid' && el.borderArtCaption) {
    ctx.save();
    ctx.fillStyle = '#334155';
    ctx.font = '600 11px Georgia, serif';
    ctx.textBaseline = 'bottom';
    const mw = ctx.measureText(el.borderArtCaption).width;
    ctx.fillText(el.borderArtCaption, Math.max(8, (width - mw) / 2), height - 5);
    ctx.restore();
  }

  if (customClip) ctx.restore();
}

function drawTableElement(ctx: CanvasRenderingContext2D, el: TableElement) {
  const rows = el.data.length;
  const cols = el.data[0]?.length || 1;
  const cellW = el.width / cols;
  const cellH = el.height / Math.max(1, rows);
  const fs = el.fontSize ?? 12;

  ctx.font = `${fs}px sans-serif`;
  ctx.textBaseline = 'middle';

  el.data.forEach((row, r) => {
    const isHeader = el.showHeaderRow !== false && r === 0;
    const isAlt = !isHeader && el.bandedRows !== false && r % 2 === 0;
    const bg = isHeader ? el.headerBg : isAlt && el.altRowBg ? el.altRowBg : el.cellBg || '#ffffff';

    row.forEach((val, c) => {
      const x = c * cellW;
      const y = r * cellH;
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, cellW, cellH);
      ctx.strokeStyle = el.borderColor || '#cbd5e1';
      ctx.lineWidth = el.borderWidth || 1;
      ctx.strokeRect(x, y, cellW, cellH);

      ctx.fillStyle = isHeader ? el.headerColor || '#ffffff' : el.cellColor || '#1e293b';
      ctx.fillText(val, x + (el.cellPadding ?? 8), y + cellH / 2, Math.max(10, cellW - 12));
    });
  });
}

function drawAccentElement(ctx: CanvasRenderingContext2D, el: AccentElement) {
  const { width, height, accentColor, secondaryColor } = el;
  ctx.save();
  ctx.fillStyle = secondaryColor || '#f8fafc';
  ctx.strokeStyle = accentColor || '#4f46e5';
  ctx.lineWidth = 2;

  if (el.accentType === 'coupon') {
    ctx.setLineDash([6, 4]);
    ctx.fillRect(0, 0, width, height);
    ctx.strokeRect(0, 0, width, height);
    ctx.setLineDash([]);
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(el.title || 'SPECIAL OFFER', 16, 28);
    ctx.fillStyle = '#334155';
    ctx.font = '12px sans-serif';
    ctx.fillText(el.text || el.subtitle || '', 16, 52, width - 32);
  } else {
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'italic 600 15px Georgia, serif';
    const text = el.text || el.title || '';
    const maxW = width - 32;
    const lines: string[] = [];
    let currentLine = '';
    for (const word of text.split(/\s+/)) {
      const probe = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(probe).width > maxW && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = probe;
      }
    }
    if (currentLine) lines.push(currentLine);
    lines.forEach((line, idx) => {
      ctx.fillText(line, 16, 22 + idx * 20);
    });
  }
  ctx.restore();
}

function drawLineElement(ctx: CanvasRenderingContext2D, el: LineElement) {
  ctx.save();
  ctx.strokeStyle = el.strokeColor || '#0f172a';
  ctx.lineWidth = el.strokeWidth || 2;
  if (el.strokeDash === 'dashed') ctx.setLineDash([8, 4]);
  else if (el.strokeDash === 'dotted') ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.moveTo(0, el.height / 2);
  ctx.lineTo(el.width, el.height / 2);
  ctx.stroke();
  ctx.restore();
}

async function drawQRElement(ctx: CanvasRenderingContext2D, el: QRElement) {
  ctx.fillStyle = el.bgColor || '#ffffff';
  ctx.fillRect(0, 0, el.width, el.height);
  try {
    const url = await QRCode.toDataURL(el.value || 'https://example.com', {
      margin: 1,
      width: 256,
      color: {
        dark: el.fgColor || '#0f172a',
        light: el.bgColor || '#ffffff',
      },
    });
    const img = await loadImage(url);
    if (img) ctx.drawImage(img, 0, 0, el.width, el.height);
  } catch {
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(2, 2, el.width - 4, el.height - 4);
  }
}

function drawConnector(ctx: CanvasRenderingContext2D, conn: ConnectorElement, allElements: PublisherElement[]) {
  const fromEl = allElements.find((e) => e.id === conn.fromId);
  const toEl = allElements.find((e) => e.id === conn.toId);
  if (!fromEl || !toEl) return;

  const fromCx = fromEl.x + fromEl.width / 2;
  const fromCy = fromEl.y + fromEl.height / 2;
  const toCx = toEl.x + toEl.width / 2;
  const toCy = toEl.y + toEl.height / 2;
  const dx = toCx - fromCx;
  const dy = toCy - fromCy;

  const horizGap = dx >= 0 ? toEl.x - (fromEl.x + fromEl.width) : fromEl.x - (toEl.x + toEl.width);
  const vertGap = dy >= 0 ? toEl.y - (fromEl.y + fromEl.height) : fromEl.y - (toEl.y + toEl.height);
  const useHorizontal =
    horizGap > 12 && vertGap <= 12
      ? true
      : vertGap > 12 && horizGap <= 12
      ? false
      : Math.abs(dx) >= Math.abs(dy);

  let x1 = fromCx;
  let y1 = fromCy;
  let x2 = toCx;
  let y2 = toCy;
  let inDirX = 0;
  let inDirY = 0;

  if (useHorizontal) {
    if (dx >= 0) {
      x1 = fromEl.x + fromEl.width;
      x2 = toEl.x;
      inDirX = -1;
    } else {
      x1 = fromEl.x;
      x2 = toEl.x + toEl.width;
      inDirX = 1;
    }
  } else {
    if (dy >= 0) {
      y1 = fromEl.y + fromEl.height;
      y2 = toEl.y;
      inDirY = -1;
    } else {
      y1 = fromEl.y;
      y2 = toEl.y + toEl.height;
      inDirY = 1;
    }
  }

  ctx.save();
  ctx.strokeStyle = conn.strokeColor || '#0f172a';
  ctx.lineWidth = conn.strokeWidth || 2.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);

  if (conn.connectorStyle === 'elbow') {
    if (useHorizontal) {
      const midX = (x1 + x2) / 2;
      ctx.lineTo(midX, y1);
      ctx.lineTo(midX, y2);
      ctx.lineTo(x2, y2);
    } else {
      const midY = (y1 + y2) / 2;
      ctx.lineTo(x1, midY);
      ctx.lineTo(x2, midY);
      ctx.lineTo(x2, y2);
    }
  } else if (conn.connectorStyle === 'curved') {
    const handle = useHorizontal ? Math.max(36, Math.abs(x2 - x1) * 0.5) : Math.max(36, Math.abs(y2 - y1) * 0.5);
    const outDirX = -inDirX;
    const outDirY = -inDirY;
    ctx.bezierCurveTo(
      x1 + outDirX * handle,
      y1 + outDirY * handle,
      x2 + inDirX * handle,
      y2 + inDirY * handle,
      x2,
      y2
    );
  } else {
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();

  if (conn.arrowEnd !== false) {
    const angle = conn.connectorStyle === 'straight'
      ? Math.atan2(y2 - y1, x2 - x1)
      : Math.atan2(-inDirY, -inDirX);
    const headLen = 10;
    ctx.fillStyle = conn.strokeColor || '#0f172a';
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Pure native Canvas 2D renderer for any Page model.
 * Immune to CSS oklch() / CORS / viewport scaling issues and supports true alpha PNG export.
 */
export async function renderPageModelToCanvas(
  page: Page,
  scale = 2,
  transparent = false,
  masterElements: PublisherElement[] = []
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(page.width * scale);
  canvas.height = Math.round(page.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();
  ctx.scale(scale, scale);

  if (!transparent) {
    if (page.backgroundGradient) {
      ctx.fillStyle = createLinearGrad(
        ctx,
        page.width,
        page.height,
        page.backgroundGradient.angle ?? 135,
        page.backgroundGradient.color1,
        page.backgroundGradient.color2
      );
    } else {
      ctx.fillStyle = page.backgroundColor || '#ffffff';
    }
    ctx.fillRect(0, 0, page.width, page.height);

    if (page.backgroundPattern && page.backgroundPattern.type !== 'none') {
      const patSvg = buildPatternSvg(page.backgroundPattern);
      if (patSvg) {
        const patImg = await loadImage(`data:image/svg+xml,${encodeURIComponent(patSvg)}`);
        if (patImg) {
          const pattern = ctx.createPattern(patImg, 'repeat');
          if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, page.width, page.height);
          }
        }
      }
    }
  }

  const allItems = [...masterElements, ...page.elements]
    .filter((el) => el.visible !== false)
    .sort((a, b) => a.zIndex - b.zIndex);

  for (const el of allItems) {
    if (el.type === 'connector') continue;
    ctx.save();
    ctx.globalAlpha = el.opacity !== undefined ? el.opacity : 1;
    ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
    if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
    if (el.flipH || el.flipV) ctx.scale(el.flipH ? -1 : 1, el.flipV ? -1 : 1);
    ctx.translate(-el.width / 2, -el.height / 2);

    // Text, tables, QR codes etc. have no clip of their own — honour the frame
    // here so "clip to shape" means the same thing for every element type.
    if (el.type !== 'image' && el.type !== 'shape') {
      const localClip = elementClipPath(el);
      if (localClip) ctx.clip(new Path2D(localClip));
    }

    if (el.type === 'shape') await drawShapeElement(ctx, el);
    else if (el.type === 'text') drawTextElement(ctx, el);
    else if (el.type === 'image') await drawImageElement(ctx, el);
    else if (el.type === 'table') drawTableElement(ctx, el);
    else if (el.type === 'accent') drawAccentElement(ctx, el);
    else if (el.type === 'line') drawLineElement(ctx, el);
    else if (el.type === 'qr') await drawQRElement(ctx, el);

    ctx.restore();
  }

  // Draw Connectors on top
  for (const el of allItems) {
    if (el.type === 'connector') {
      drawConnector(ctx, el, allItems);
    }
  }

  ctx.restore();
  return canvas;
}
