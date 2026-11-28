/**
 * WordArt parity, held to the things that actually go wrong.
 *
 * The styles are painted three times over — the generated stylesheet (gallery tiles), the DOM
 * renderer (the editor) and the canvas painter (every export) — and the failure mode is never a
 * crash. It is a rim that is 9 px in one place and 18 px in another, a keyline stamped around a
 * blurred shadow instead of around the letters, or a stroke painted in whatever colour the canvas
 * context happened to be holding.
 *
 *   npm run check:wordart-parity
 */
import { readFileSync } from 'node:fs';
import {
  WORD_ART_STYLES,
  buildWordArtCssRule,
  outlineStrokeCss,
  strokeCss,
  wordArtCss,
  wordArtPaint,
  wordArtRimWidth,
  wordArtShadowChain,
  wordArtSpec,
} from '../src/utils/wordArt.ts';
import { renderWordArtCanvas } from '../src/utils/wordArtCanvas.ts';

let failures = 0;
const check = (name, condition, detail = '') => {
  if (condition) return;
  failures += 1;
  console.log('FAIL', name, detail);
};

const em = (px) => `${Math.round((px / 72) * 1000) / 1000}em`;
const css = readFileSync('src/index.css', 'utf8');

/** The declarations of one `.wordart-*` rule, as written into index.css. */
function ruleFor(className) {
  const start = css.indexOf(`.${className} {`);
  if (start === -1) return null;
  const end = css.indexOf('}', start);
  return css.slice(start, end);
}

// 1. Every rim in the stylesheet is em, and equals the paint spec's rim on the 72 px reference.
for (const style of WORD_ART_STYLES) {
  const rule = ruleFor(style.className);
  check(`${style.id} has a rule`, rule !== null);
  if (!rule) continue;
  const paint = wordArtPaint(style.id);
  if (!paint?.stroke) {
    check(`${style.id} has no stroke and no stroke declaration`, !/text-stroke:/.test(rule));
    continue;
  }
  const declared = /-webkit-text-stroke:\s*([^;]+);/.exec(rule)?.[1]?.trim();
  check(`${style.id} declares the rim in em`, /^-?[\d.]+em /.test(declared ?? ''), declared);
  check(`${style.id} rim matches the spec`, declared === strokeCss(paint), `${declared} vs ${strokeCss(paint)}`);
  check(
    `${style.id} rim is the heavy width, not half of it`,
    declared?.startsWith(em(wordArtRimWidth(paint))),
    `${declared} vs ${em(wordArtRimWidth(paint))}`
  );
}

// 2. The DOM's inline paint is the same value as the stylesheet's.
for (const style of WORD_ART_STYLES) {
  const paint = wordArtPaint(style.id);
  if (!paint?.stroke) continue;
  check(
    `${style.id} DOM stroke matches the sheet`,
    wordArtCss(style.id).webkitTextStroke === strokeCss(paint),
    `${wordArtCss(style.id).webkitTextStroke} vs ${strokeCss(paint)}`
  );
}

// 3. The keyline ring is listed before any blurred shadow — a blurred filter listed first would
//    stamp the ring around the blur instead of around the letters.
for (const style of WORD_ART_STYLES) {
  const paint = wordArtPaint(style.id);
  if (!paint?.outline) continue;
  const rule = buildWordArtCssRule(style.id);
  const filters = [...rule.matchAll(/drop-shadow\(([^)]*)\)/g)].map((m) => m[1]);
  const firstBlurred = filters.findIndex((f) => !/ 0 #/.test(f) && !/(rgba|rgb|#)[^)]*$/.test(f.split(' ').slice(2).join(' ')));
  const ringIndexes = filters
    .map((f, i) => (f.includes(paint.outline.color) ? i : -1))
    .filter((i) => i >= 0);
  check(`${style.id} paints the keyline ring`, ringIndexes.length > 0);
  const lastRing = Math.max(...ringIndexes);
  const blurred = filters.findIndex((f) => {
    const parts = f.split(' ');
    const blur = Number.parseFloat(parts[2]);
    return Number.isFinite(blur) && blur > 0;
  });
  check(
    `${style.id} ring comes before the blurred shadows`,
    blurred === -1 || lastRing < blurred,
    `last ring ${lastRing}, first blur ${blurred}`
  );
  check(`${style.id} ring offsets are em, not px`, filters.every((f) => !/drop-shadow\(-?[\d.]+px -?[\d.]+px 0 #/.test(f) || lastRing === -1));
  void firstBlurred;
}

// 4. No blurred stand-in for the rim: a thick border in the stroke colour with a blur is the halo
//    hack that made every die-cut look out of focus.
for (const style of WORD_ART_STYLES) {
  const paint = wordArtPaint(style.id);
  if (!paint?.stroke) continue;
  const halo = wordArtShadowChain(paint).filter(
    (s) => s.blur > 0 && s.blur <= 2 && s.color === paint.stroke.color && s.dx === 0 && s.dy === 0
  );
  check(`${style.id} has no blurred rim halo`, halo.length === 0);
}

// 5. The keyline silhouette clears the whole rim.
for (const style of WORD_ART_STYLES) {
  const paint = wordArtPaint(style.id);
  if (!paint?.outline) continue;
  check(
    `${style.id} keyline silhouette is rim + ring`,
    outlineStrokeCss(paint) === `${em(wordArtRimWidth(paint) + paint.outline.width)} ${paint.outline.color}`,
    outlineStrokeCss(paint)
  );
}

// 6. The canvas painter strokes in the pass's colour, at a rim that scales with the type.
function stubContext() {
  const calls = [];
  const state = { fillStyle: '#000000', strokeStyle: '#000000', lineWidth: 1 };
  const stack = [];
  const ctx = {
    calls,
    filter: 'none',
    lineJoin: 'miter',
    lineCap: 'butt',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    font: '',
    save() {
      stack.push({ ...state });
    },
    restore() {
      Object.assign(state, stack.pop() ?? state);
    },
    translate() {},
    get fillStyle() {
      return state.fillStyle;
    },
    set fillStyle(value) {
      state.fillStyle = value;
    },
    get strokeStyle() {
      return state.strokeStyle;
    },
    set strokeStyle(value) {
      state.strokeStyle = value;
    },
    get lineWidth() {
      return state.lineWidth;
    },
    set lineWidth(value) {
      state.lineWidth = value;
    },
    createLinearGradient() {
      return { addColorStop() {} };
    },
    createPattern() {
      return null;
    },
    beginPath() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    bezierCurveTo() {},
    closePath() {},
    fill() {},
    stroke() {},
    arc() {},
    ellipse() {},
    rect() {},
    fillRect() {},
    strokeRect() {},
    roundRect() {},
    clip() {},
    fillText(text) {
      calls.push({ mode: 'fill', style: state.fillStyle, text });
    },
    strokeText(text) {
      calls.push({ mode: 'stroke', style: state.strokeStyle, width: state.lineWidth, text });
    },
  };
  return { ctx, calls };
}

const bubble = wordArtSpec('cartoon-bubble-blue');
const rimAt = (fontSize) => {
  const { ctx, calls } = stubContext();
  renderWordArtCanvas(ctx, bubble, { text: 'Aa', x: 0, y: 0, box: { x: 0, y: 0, width: 200, height: 100 } }, { fontSize });
  const white = calls.filter((c) => c.mode === 'stroke' && String(c.style).toLowerCase() === '#ffffff');
  return white[0]?.width;
};

check('canvas rim is the heavy width at the reference size', rimAt(72) === wordArtRimWidth(bubble), String(rimAt(72)));
check('canvas rim grows with the type', rimAt(144) === wordArtRimWidth(bubble) * 2, String(rimAt(144)));
check('canvas rim matches the DOM em at a big title', Math.abs((rimAt(138) ?? 0) - 0.25 * 138) < 0.001, String(rimAt(138)));

const { ctx: stubCtx, calls: stubCalls } = stubContext();
renderWordArtCanvas(stubCtx, bubble, { text: 'Aa', x: 0, y: 0, box: { x: 0, y: 0, width: 200, height: 100 } }, {});
const blackStrokes = stubCalls.filter((c) => c.mode === 'stroke' && String(c.style).toLowerCase() === '#000000');
check('no stroke pass falls back to the context default', blackStrokes.length === 0, `${blackStrokes.length} black strokes`);
const keylineStroke = stubCalls.find((c) => c.mode === 'stroke' && String(c.style) === '#0b2f6e');
check('the keyline is stroked in its own colour', keylineStroke !== undefined);

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} FAILURES`);
process.exitCode = failures === 0 ? 0 : 1;
