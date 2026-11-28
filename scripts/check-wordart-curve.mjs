/**
 * Arched type, held to its two rules:
 *
 *  1. **A style's own `arc` is a one-line gesture.** If the headline wraps, or carries a `\n`, the
 *     arc is not applied — the block keeps its wrapping. An explicit `textCurve` (the slider) is a
 *     decision, so it is honoured either way.
 *  2. **A curved block keeps its lines.** Each line sits on its own arc, one line-height below the
 *     last, so multi-line arched text never unbreaks into a single overflowing row.
 *
 * The layout engine has a headless fallback for glyph widths, so all of this is checkable without a
 * browser: the numbers are approximate, the relationships are not.
 *
 *   npm run check:wordart-curve
 */
import { layoutText, resolveTextCurve } from '../src/utils/textLayout.ts';
import { wordArtStyleArc } from '../src/utils/wordArt.ts';

let failures = 0;
const check = (name, condition, detail = '') => {
  if (condition) return;
  failures += 1;
  console.log('FAIL', name, detail);
};

/** @type {import('../src/types/publisher.ts').TextElement} */
const base = {
  id: 'txt-curve',
  type: 'text',
  x: 60,
  y: 60,
  width: 900,
  height: 240,
  rotation: 0,
  zIndex: 1,
  text: 'READING',
  fontFamily: 'Fredoka',
  fontSize: 40,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#1e293b',
  textAlign: 'left',
  verticalAlign: 'top',
  columns: 1,
  columnGap: 12,
  lineHeight: 1.4,
  padding: 0,
  isWordArt: true,
  wordArtStyle: 'reading-nook-sage',
};

const el = (patch) => ({ ...base, ...patch });
const letters = (value) => value.replace(/[^\p{L}\p{N}]/gu, '');
const lineHeightOf = (element) => element.fontSize * (element.lineHeight || 1.4);

const styleArc = wordArtStyleArc('reading-nook-sage');
check('the style carries an arc', styleArc > 0, String(styleArc));
check('a style without an arc reports none', wordArtStyleArc('varsity') === 0);

// 1. One line takes the style's arc.
const oneLine = el({});
check('a single line takes the style arc', resolveTextCurve(oneLine) === styleArc, String(resolveTextCurve(oneLine)));
const oneLayout = layoutText(oneLine);
check('a single line is laid out on the arc', Boolean(oneLayout.curve), 'no curve');

// 2. A hard line break holds the arc back — and the block stays broken.
const broken = el({ text: 'READING\nNOOK' });
check('a line break drops the style arc', resolveTextCurve(broken) === 0, String(resolveTextCurve(broken)));
const brokenLayout = layoutText(broken);
check('a line-broken headline is not curved', !brokenLayout.curve);
check('a line-broken headline keeps both lines', brokenLayout.lines.length === 2, String(brokenLayout.lines.length));

// 3. So does wrapping. The box is narrow enough that the flat layout needs two lines.
const wrapping = el({ width: 380, text: 'READING NOOK OPEN AFTERNOONS' });
const flatLines = layoutText(wrapping, { ignoreCurve: true }).lines.length;
check('the wrap case really wraps', flatLines > 1, `flat lines ${flatLines}`);
check(
  'a wrapped headline drops the style arc',
  resolveTextCurve(wrapping) === 0,
  `${resolveTextCurve(wrapping)} over ${flatLines} flat lines`
);
check('a wrapped headline is not curved', !layoutText(wrapping).curve);

// 4. An explicit curve is the user's call: it survives a line break, and each line gets its arc.
const explicit = el({ text: 'READING\nNOOK', textCurve: 14 });
check('an explicit curve survives a line break', resolveTextCurve(explicit) === 14, String(resolveTextCurve(explicit)));
const explicitLayout = layoutText(explicit);
check('an explicitly curved block is laid out on the arc', Boolean(explicitLayout.curve));
const glyphs = explicitLayout.curve?.chars ?? [];
check(
  'an explicitly curved block keeps every letter',
  glyphs.map((glyph) => glyph.text).join('').replace(/\s/g, '') === letters(explicit.text),
  glyphs.map((glyph) => glyph.text).join('')
);

const firstRow = glyphs.slice(0, letters('READING').length);
const secondRow = glyphs.slice(letters('READING').length);
const rowText = (row) => row.map((glyph) => glyph.text).join('');
check('the first line is laid out as its own row', rowText(firstRow) === 'READING', rowText(firstRow));
check('the second line is laid out as its own row', rowText(secondRow) === 'NOOK', rowText(secondRow));
const minY = (row) => Math.min(...row.map((glyph) => glyph.y));
const rowGap = minY(secondRow) - minY(firstRow);
check(
  'the rows sit one line-height apart',
  Math.abs(rowGap - lineHeightOf(explicit)) < 2,
  `${rowGap.toFixed(2)} vs ${lineHeightOf(explicit)}`
);
check(
  'both rows are arcs, not flat type',
  Math.max(...firstRow.map((glyph) => glyph.y)) - minY(firstRow) > 1 &&
    Math.max(...secondRow.map((glyph) => glyph.y)) - minY(secondRow) > 1,
  'a row came out flat'
);
const spread = (row) => Math.max(...row.map((glyph) => glyph.x)) - Math.min(...row.map((glyph) => glyph.x));
check('the shorter row keeps its own, narrower arc', spread(secondRow) < spread(firstRow), `${spread(secondRow)} vs ${spread(firstRow)}`);
check(
  'the rows stay inside the frame',
  glyphs.every((glyph) => glyph.x >= 0 && glyph.x <= explicit.width),
  `${Math.min(...glyphs.map((g) => g.x)).toFixed(1)}..${Math.max(...glyphs.map((g) => g.x)).toFixed(1)}`
);

// 5. Wrapped multi-line curve: every word survives, and the block is never one long row.
const wrapped = el({ width: 380, text: 'The reading corner is open every afternoon', textCurve: 20 });
const wrappedLayout = layoutText(wrapped);
const wrappedGlyphs = wrappedLayout.curve?.chars ?? [];
const flatWrapLines = layoutText(wrapped, { ignoreCurve: true }).lines.length;
check('the wrapped curve case really wraps flat', flatWrapLines > 1, `flat lines ${flatWrapLines}`);
check(
  'a wrapped curved block keeps every letter',
  letters(wrappedGlyphs.map((glyph) => glyph.text).join('')) === letters(wrapped.text),
  `${letters(wrappedGlyphs.map((glyph) => glyph.text).join('')).length} vs ${letters(wrapped.text).length}`
);
const wrappedRows = new Set(wrappedGlyphs.map((glyph) => Math.round(glyph.y / lineHeightOf(wrapped)))).size;
check('a wrapped curved block keeps its rows', wrappedRows >= flatWrapLines, `${wrappedRows} rows vs ${flatWrapLines} lines`);
check(
  'a wrapped curved block grows to hold its rows',
  wrappedLayout.contentHeight > layoutText({ ...wrapped, text: 'The' }).contentHeight + lineHeightOf(wrapped) * (flatWrapLines - 2),
  `${wrappedLayout.contentHeight.toFixed(1)}`
);

// 6. A single line still covers the whole sweep — the arc did not shrink when it became per-line.
const sweepOf = (layout) => Math.max(...(layout.curve?.chars ?? []).map((glyph) => Math.abs(glyph.angle)));
const targetSweep = ((2 * Math.PI * 0.14) / 2) * (180 / Math.PI); // bend 14 → half its sweep
check(
  'a single line still spans the full sweep',
  sweepOf(explicitLayout) > targetSweep * 0.8,
  `${sweepOf(explicitLayout).toFixed(1)}° of ${targetSweep.toFixed(1)}°`
);

// 7. Nothing pre-resolves the curve any more: one resolver, so the editor, the export and the
//    properties panel cannot disagree about whether a headline is arched.
const rendererEdits = ['src/utils/canvasRenderer.ts', 'src/components/canvas/ElementRenderer.tsx'];
const { readFileSync } = await import('node:fs');
for (const file of rendererEdits) {
  const source = readFileSync(file, 'utf8');
  check(`${file} leaves curve resolution to layoutText`, !/wordArtCurve|textCurve:\s*styleCurve/.test(source));
}

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} FAILURES`);
process.exitCode = failures === 0 ? 0 : 1;
