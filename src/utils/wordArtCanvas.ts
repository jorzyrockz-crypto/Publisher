import { glintStarPoints, lerpHex, wordArtGlints } from './wordArt';
import type { WordArtGlint, WordArtSpec } from './wordArt';

/**
 * One painting pass over a line of WordArt. The caller decides *how* the text
 * goes down (glyph by glyph, so tracking survives; or a plain fillText), and
 * this module decides *what* goes down and in which order.
 */
export interface WordArtPass {
  mode: 'fill' | 'stroke';
  /** A colour, or a gradient built for this pass. */
  style: string | CanvasGradient;
  /** Stroke width in canvas units, already doubled for the rim. */
  lineWidth?: number;
  offsetX: number;
  offsetY: number;
  /** Blur radius in CSS units (σ = blur / 2). */
  blur: number;
  /**
   * Present on the face pass when the fill is a gradient: a glyph-wise painter
   * has to rebuild it inside each glyph's transform, or the ramp restarts
   * inside every letter.
   */
  gradient?: {
    angle: number;
    stops: { offset: number; color: string }[];
    box: { x: number; y: number; width: number; height: number };
  };
}

export interface WordArtLine {
  /** The text of this line, for the default painter. */
  text: string;
  /** Anchor, in the same space as ctx.textAlign / ctx.textBaseline. */
  x: number;
  y: number;
  /** Glyph box of this line: the CSS inline box the gradient is clipped to. */
  box: { x: number; y: number; width: number; height: number };
}

export interface WordArtCanvasOptions {
  /**
   * Export multiplier. Pass 1 when the context is already scaled (the page
   * renderer scales once for the whole sheet); pass the DPI factor when it is
   * not, so rims, extrusion depth and sparkles stay proportional.
   */
  scale?: number;
  /** Custom painter; defaults to fillText / strokeText. */
  paint?: (pass: WordArtPass) => void;
  /** Override the sparkle geometry (the DOM overlay uses the same list). */
  glints?: WordArtGlint[];
}

/**
 * A four-point star glint — soft halo, sharp star. Geometry comes from
 * `wordArtGlints` / `glintStarPoints` so the DOM overlay draws the same star.
 */
function drawSparkleGlint(
  ctx: CanvasRenderingContext2D,
  glint: WordArtGlint,
  scale = 1
): void {
  const radius = glint.radius * scale;
  ctx.save();
  ctx.translate(glint.x, glint.y);

  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  halo.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  halo.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)');
  halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = glint.opacity;
  ctx.beginPath();
  glintStarPoints({ ...glint, radius, x: 0, y: 0 }).forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * A CanvasLinearGradient that matches CSS `linear-gradient(<angle>deg, ...)`
 * over the given box: 0deg points up, 90deg points right, and the ramp spans
 * the box's diagonal projection, exactly like the CSS gradient line.
 */
export function createAngledGradient(
  ctx: CanvasRenderingContext2D,
  spec: WordArtSpec,
  box: { x: number; y: number; width: number; height: number }
): CanvasGradient {
  const rad = ((spec.angle - 90) * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const half = (Math.abs(box.width * dx) + Math.abs(box.height * dy)) / 2;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const gradient = ctx.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half);
  for (const stop of [...spec.stops].sort((a, b) => a.offset - b.offset)) {
    gradient.addColorStop(Math.max(0, Math.min(1, stop.offset)), stop.color);
  }
  return gradient;
}

/**
 * Renders one line of WordArt with the same paint order the CSS uses:
 *
 *   bloom → cast shadow → authored shadows → extrusion → rim stroke → fill
 *
 * `paint-order: stroke fill` means the rim sits *under* the fill, so the
 * outline is drawn first and the fill covers its inner half — that is why the
 * rim is stroked at twice its CSS width.
 */
/**
 * `-webkit-text-stroke` is centred on the glyph outline, and `paint-order:
 * stroke fill` hides the inner half under the fill — so the rim that reads on
 * screen is half the declared width. Canvas lineWidth is centred too and the
 * fill covers its inner half, so the canvas width is the declared width.
 * Kept as a named constant: if the editor and an export ever disagree about rim
 * thickness, this is the one number to turn.
 */
const RIM_MULTIPLIER = 1;

export function renderWordArtCanvas(
  ctx: CanvasRenderingContext2D,
  spec: WordArtSpec,
  line: WordArtLine,
  options: WordArtCanvasOptions = {}
): void {
  const scale = options.scale ?? 1;
  const paint =
    options.paint ??
    ((pass: WordArtPass) => {
      ctx.save();
      if (pass.blur > 0 && 'filter' in ctx) ctx.filter = `blur(${pass.blur / 2}px)`;
      ctx.translate(pass.offsetX, pass.offsetY);
      ctx.fillStyle = pass.style;
      if (pass.mode === 'stroke') {
        ctx.lineWidth = pass.lineWidth ?? 1;
        ctx.strokeText(line.text, 0, 0);
      } else {
        ctx.fillText(line.text, 0, 0);
      }
      ctx.restore();
    });

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const rimWidth = spec.stroke ? spec.stroke.width * RIM_MULTIPLIER * scale : 0;
  const gradient = createAngledGradient(ctx, spec, line.box);

  // 1. Light behind the letters, furthest first: the bloom, then the long cast
  // shadow, then any authored shadows. Each is a blurred copy, which is what
  // `drop-shadow()` paints — not a solid duplicate.
  for (const bloom of spec.bloom ?? []) {
    paint({ mode: 'fill', style: bloom.color, offsetX: 0, offsetY: 0, blur: bloom.blur });
  }
  if (spec.castShadow) {
    paint({
      mode: 'fill',
      style: spec.castShadow.color,
      offsetX: spec.castShadow.dx * scale,
      offsetY: spec.castShadow.dy * scale,
      blur: spec.castShadow.blur,
    });
  }
  for (const shadow of spec.shadows) {
    paint({
      mode: 'fill',
      style: shadow.color,
      offsetX: shadow.dx * scale,
      offsetY: shadow.dy * scale,
      blur: shadow.blur,
    });
  }

  // 2. The 3D block, back to front. Each copy carries the rim as well, so the
  // side walls of the block are as thick as the face's edge.
  if (spec.extrusion) {
    const { steps, dx, dy, startColor, endColor } = spec.extrusion;
    for (let i = steps; i >= 1; i -= 1) {
      const colour = lerpHex(startColor, endColor, steps === 1 ? 0 : (i - 1) / (steps - 1));
      const offsetX = dx * i * scale;
      const offsetY = dy * i * scale;
      paint({ mode: 'fill', style: colour, offsetX, offsetY, blur: 0 });
      if (rimWidth > 0) {
        paint({ mode: 'stroke', style: colour, lineWidth: rimWidth, offsetX, offsetY, blur: 0 });
      }
    }
  }

  // 3. Rim, under the fill.
  if (spec.stroke) {
    paint({ mode: 'stroke', style: spec.stroke.color, lineWidth: rimWidth, offsetX: 0, offsetY: 0, blur: 0 });
  }

  // 4. The face.
  paint({
    mode: 'fill',
    style: gradient,
    offsetX: 0,
    offsetY: 0,
    blur: 0,
    gradient: { angle: spec.angle, stops: spec.stops, box: line.box },
  });

  // 5. Sparkles, on top.
  const glints = options.glints ?? wordArtGlints(spec.id, line.box.width, line.box.height);
  for (const glint of glints) {
    drawSparkleGlint(
      ctx,
      { ...glint, x: line.box.x + glint.x, y: line.box.y + glint.y },
      scale
    );
  }

  ctx.restore();
}
