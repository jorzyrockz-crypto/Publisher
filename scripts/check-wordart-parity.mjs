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
  const ringRadius = `${Math.round((paint.outline.width / 72) * 1000) / 1000}em`;
  check(
    `${style.id} ring offset shows the ring's full width`,
    filters.some((f) => f.startsWith(`${ringRadius} 0em 0`)),
    filters.slice(0, 2).join(' | ')
  );
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
    `${style.id} keyline silhouette is rim + 2 × ring`,
    outlineStrokeCss(paint) === `${em(wordArtRimWidth(paint) + paint.outline.width * 2)} ${paint.outline.color}`,
    outlineStrokeCss(paint)
  );
  // What each surface *shows* past the rim, which is the thing a reader sees: half the stroke past
  // the glyph edge, less the rim's own half.
  const domVisible = (wordArtRimWidth(paint) + paint.outline.width * 2) / 2 - wordArtRimWidth(paint) / 2;
  const canvasVisible = (wordArtRimWidth(wordArtSpec(style.id)) + paint.outline.width * 2) / 2 - wordArtRimWidth(paint) / 2;
  check(
    `${style.id} keyline is the ring's full width on both`,
    Math.abs(domVisible - paint.outline.width) < 0.001 && Math.abs(canvasVisible - domVisible) < 0.001,
    `${domVisible} / ${canvasVisible}`
  );
}

// 6. Extrusion depth: CSS compounds its drop-shadow list, so each entry must be a single *step*.
for (const style of WORD_ART_STYLES) {
  const paint = wordArtPaint(style.id);
  if (!paint?.extrusion) continue;
  const { steps, dx, dy } = paint.extrusion;
  const chain = wordArtShadowChain(paint);
  const block = chain.slice(0, steps);
  check(`${style.id} extrusion lists one shadow per step`, chain.length >= steps);
  check(
    `${style.id} extrusion steps are single deltas, not running totals`,
    block.every((s) => s.dx === Math.round(dx * 100) / 100 && s.dy === Math.round(dy * 100) / 100),
    JSON.stringify(block.map((s) => [s.dx, s.dy]))
  );
  check(
    `${style.id} extrusion ramps from start to end colour`,
    block[0].color === paint.extrusion.startColor && block[steps - 1].color === paint.extrusion.endColor
  );
}

// 7. Every one of the styles, through the canvas default painter: strokes in their own colour,
//    drawn where the line says, blur scaled with the export multiplier.
function stubContext() {
  const calls = [];
  const filters = [];
  const state = { fillStyle: '#000000', strokeStyle: '#000000', lineWidth: 1, filter: 'unset' };
  const stack = [];
  const gradient = { addColorStop() {} };
  const target = {
    save() {
      stack.push({ ...state });
    },
    restore() {
      Object.assign(state, stack.pop() ?? state);
    },
    fillText(text, x, y) {
      calls.push({ mode: 'fill', style: state.fillStyle, text, x, y });
    },
    strokeText(text, x, y) {
      calls.push({ mode: 'stroke', style: state.strokeStyle, width: state.lineWidth, text, x, y });
    },
    createLinearGradient() {
      return gradient;
    },
    createRadialGradient() {
      return gradient;
    },
    createPattern() {
      return null;
    },
  };
  for (const key of ['fillStyle', 'strokeStyle', 'lineWidth', 'filter']) {
    Object.defineProperty(target, key, {
      get() {
        return state[key];
      },
      set(value) {
        state[key] = value;
        if (key === 'filter') filters.push(value);
      },
    });
  }
  // Anything else the painter reaches for (paths, clipping, dash patterns) is a no-op.
  const ctx = new Proxy(target, {
    get(t, prop) {
      if (prop in t) return t[prop];
      return () => undefined;
    },
  });
  return { ctx, calls, filters };
}

const ANCHOR = { x: 10, y: 20 };
const runStyle = (id, options = {}) => {
  const { ctx, calls, filters } = stubContext();
  renderWordArtCanvas(
    ctx,
    wordArtSpec(id),
    { text: 'Aa Bb', x: ANCHOR.x, y: ANCHOR.y, box: { x: 0, y: 0, width: 200, height: 100 } },
    options
  );
  return { calls, filters };
};

let audited = 0;
for (const style of WORD_ART_STYLES) {
  const spec = wordArtSpec(style.id);
  if (!spec) continue;
  audited += 1;
  const { calls, filters } = runStyle(style.id, { fontSize: 72 });

  check(`${style.id} paints something`, calls.length > 0);

  // Where it says it is.
  const misplaced = calls.filter((c) => c.x !== ANCHOR.x || c.y !== ANCHOR.y);
  check(`${style.id} draws at the line's anchor`, misplaced.length === 0, `${misplaced.length} off-anchor`);

  // Every stroke carries the pass's colour. `#000000` is only legal if the spec asks for black.
  const specColours = new Set(
    (JSON.stringify(spec).match(/"#[0-9a-fA-F]{3,8}"/g) ?? []).map((c) => c.replace(/"/g, '').toLowerCase())
  );
  const blackStrokes = calls.filter(
    (c) => c.mode === 'stroke' && String(c.style).toLowerCase() === '#000000' && !specColours.has('#000000')
  );
  check(`${style.id} never strokes in the context default`, blackStrokes.length === 0, `${blackStrokes.length} black strokes`);

  // The rim is the heavy width, at the reference type size.
  if (spec.stroke) {
    const rim = calls.find(
      (c) => c.mode === 'stroke' && String(c.style).toLowerCase() === spec.stroke.color.toLowerCase()
    );
    check(`${style.id} strokes its rim`, rim !== undefined);
    check(
      `${style.id} canvas rim is the heavy width`,
      Math.abs((rim?.width ?? 0) - wordArtRimWidth(spec)) < 0.001,
      `${rim?.width} vs ${wordArtRimWidth(spec)}`
    );
  }

  // Blur is scaled with the export multiplier.
  const oneX = filters.filter((f) => String(f).startsWith('blur('));
  const twoX = runStyle(style.id, { fontSize: 72, scale: 2 }).filters.filter((f) => String(f).startsWith('blur('));
  const radius = (f) => Number.parseFloat(String(f).replace(/[^0-9.]/g, ''));
  check(
    `${style.id} blur scales with the export multiplier`,
    oneX.length === twoX.length && oneX.every((f, i) => Math.abs(radius(f) * 2 - radius(twoX[i])) < 0.001),
    `${oneX[0]} vs ${twoX[0]}`
  );
}
console.log(`${audited} styles audited through the canvas painter`);

// 8. The bubble sign is the reference case for the keyline and the rim. Read the numbers off the
//    spec, not out of the test: these are a designer's dials, and a test pinned to 0.25em would go
//    red the day somebody tunes the rim rather than when something breaks.
const bubble = wordArtSpec('cartoon-bubble-blue');
const bubblePaint = wordArtPaint('cartoon-bubble-blue');
const bubbleRimEm = Math.round((wordArtRimWidth(bubble) / 72) * 1000) / 1000;
const strokeColour = bubble.stroke.color.toLowerCase();
const rimAt = (fontSize) => {
  const { calls } = runStyle('cartoon-bubble-blue', { fontSize });
  return calls.find((c) => c.mode === 'stroke' && String(c.style).toLowerCase() === strokeColour)?.width;
};
check('canvas rim is the heavy width at the reference size', rimAt(72) === wordArtRimWidth(bubble), String(rimAt(72)));
check('canvas rim grows with the type', rimAt(144) === wordArtRimWidth(bubble) * 2, String(rimAt(144)));
check(
  // The stylesheet writes the em to three decimals so the file can be checked in and diffed; the
  // canvas multiplies the unrounded ratio. A tenth of a pixel apart at a 138 px title is the same
  // rim, and the alternative is a stylesheet full of 0.16666666666666666em.
  'canvas rim matches the DOM em at a big title',
  Math.abs((rimAt(138) ?? 0) - bubbleRimEm * 138) < 0.1,
  `${rimAt(138)} vs ${bubbleRimEm * 138}`
);
const { calls: bubbleCalls } = runStyle('cartoon-bubble-blue', {});
check(
  'the keyline is stroked in its own colour',
  bubbleCalls.some((c) => c.mode === 'stroke' && String(c.style).toLowerCase() === bubblePaint.outline.color.toLowerCase()),
  bubblePaint.outline.color
);
// The lip: two steps of the same offset, which the CSS chain compounds into 1.5 and 3.0.
check(
  'the bubble sign has a two-step dark lip',
  bubblePaint.extrusion?.steps === 2 && bubblePaint.extrusion.dy === 1.5,
  JSON.stringify(bubblePaint.extrusion)
);
check('the bubble sign carries its own arc', (bubble.arc ?? 0) > 0, String(bubble.arc));

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} FAILURES`);
process.exitCode = failures === 0 ? 0 : 1;
