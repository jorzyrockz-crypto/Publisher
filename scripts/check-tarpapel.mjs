/**
 * The tarpapel specs, held to the rules the module promises.
 *
 * A tarpapel is printed on a grid of A4 sheets and glued, which puts a 10 mm glue strip down every
 * seam — and the printer repeats that strip on both sheets. So the three things that can go wrong
 * are geometric, and all three are checked here rather than trusted:
 *
 *   1. the grid must add up to the canvas, or the assembled poster is the wrong size;
 *   2. a template must open as ONE page the size of the poster, not as a quarter of it;
 *   3. no word may sit on a glue strip. Artwork may cross one; type may not.
 *
 * Plus the two things that go wrong quietly: an asset id that resolves to a file that is not there,
 * and a theme swap that changes nothing.
 *
 *   npm run check:tarpapel
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  CHAMPS_TARPAPEL_BANNER,
  CHAMPS_TARPAPEL_TREE,
  CHAMPS_TARPAPEL_WORD_WALL,
  tarpapelCanvasElements,
  tarpapelGeometry,
  tarpapelToProject,
  withTarpapelTheme,
} from '../src/constants/champsTarpapel.ts';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const PX_PER_MM = 794 / 210;
const specs = [CHAMPS_TARPAPEL_BANNER, CHAMPS_TARPAPEL_TREE, CHAMPS_TARPAPEL_WORD_WALL];

let fail = 0;
const ok = (cond, msg) => {
  if (!cond) {
    fail += 1;
    console.log('FAIL', msg);
  }
};

/* 1. the grid has to add up to the canvas, exactly */
for (const spec of specs) {
  const geo = tarpapelGeometry(spec);
  const xs = [...new Set(geo.sheets.map((s) => s.x))].sort((a, b) => a - b);
  const ys = [...new Set(geo.sheets.map((s) => s.y))].sort((a, b) => a - b);
  ok(xs[0] === 0 && ys[0] === 0, `${spec.id}: first window at 0`);
  for (let i = 1; i < xs.length; i += 1) {
    ok(xs[i] - xs[i - 1] === geo.sheetWidth - geo.overlap, `${spec.id}: column gap ${i}`);
  }
  for (let i = 1; i < ys.length; i += 1) {
    ok(ys[i] - ys[i - 1] === geo.sheetHeight - geo.overlap, `${spec.id}: row gap ${i}`);
  }
  ok(xs.at(-1) + geo.sheetWidth === geo.canvasWidth, `${spec.id}: last column ends on the edge`);
  ok(ys.at(-1) + geo.sheetHeight === geo.canvasHeight, `${spec.id}: last row ends on the edge`);
}

/* 2. a template is ONE page, the assembled poster */
for (const spec of specs) {
  const geo = tarpapelGeometry(spec);
  const proj = tarpapelToProject(spec);
  ok(proj.pages.length === 1, `${spec.id}: opens with ${proj.pages.length} pages, expected 1`);
  const page = proj.pages[0];
  ok(
    page.width === geo.canvasWidth && page.height === geo.canvasHeight,
    `${spec.id}: page ${page.width}×${page.height} ≠ canvas ${geo.canvasWidth}×${geo.canvasHeight}`
  );
  const mmW = geo.canvasWidth / PX_PER_MM;
  const mmH = geo.canvasHeight / PX_PER_MM;
  ok(
    Math.abs(mmW - spec.canvas.widthMm) < 2 && Math.abs(mmH - spec.canvas.heightMm) < 2,
    `${spec.id}: canvas says ${spec.canvas.widthMm}×${spec.canvas.heightMm} mm, grid adds up to ${mmW.toFixed(0)}×${mmH.toFixed(0)} mm`
  );
  ok(page.elements.length === tarpapelCanvasElements(spec).length, `${spec.id}: page lost elements`);
  console.log(
    `${spec.id}: 1 page ${page.width}×${page.height}px = ${mmW.toFixed(0)}×${mmH.toFixed(0)} mm from ${geo.sheets.length} sheets`
  );
}

/* 3. no letter on the glue strip — for every template, the banner included */
const seamBands = (geo) => {
  const bands = new Map();
  for (const sh of geo.sheets) {
    if (sh.col > 0) {
      bands.set(`x${sh.x}`, ['x', sh.x / geo.canvasWidth, (sh.x + geo.overlap) / geo.canvasWidth]);
    }
    if (sh.row > 0) {
      bands.set(`y${sh.y}`, ['y', sh.y / geo.canvasHeight, (sh.y + geo.overlap) / geo.canvasHeight]);
    }
  }
  return [...bands.values()];
};
for (const spec of specs) {
  const geo = tarpapelGeometry(spec);
  const bands = seamBands(geo);
  const hits = [];
  for (const el of tarpapelCanvasElements(spec)) {
    if (el.type !== 'text') continue;
    const x0 = el.x / geo.canvasWidth;
    const x1 = (el.x + el.width) / geo.canvasWidth;
    const y0 = el.y / geo.canvasHeight;
    const y1 = (el.y + el.height) / geo.canvasHeight;
    for (const [axis, b0, b1] of bands) {
      const lo = axis === 'x' ? x0 : y0;
      const hi = axis === 'x' ? x1 : y1;
      if (lo < b1 && hi > b0) hits.push(`${el.name}[${axis}]`);
    }
  }
  console.log(
    `${spec.id}: ${bands.length} seam bands, ${hits.length} text hits${hits.length ? ` — ${hits.join(', ')}` : ''}`
  );
  ok(hits.length === 0, `${spec.id}: type on the glue strip`);
}

/* 4. every asset id resolves to a file that is actually shipped */
for (const spec of specs) {
  for (const el of tarpapelCanvasElements(spec)) {
    if (el.type !== 'image') continue;
    const file = `${ROOT}public/${el.src.replace(/^\.\//, '')}`;
    ok(existsSync(file), `${spec.id}: ${el.alt} → ${el.src} is not in public/`);
  }
}

/* 5. the word wall's cards: 24 of them, none on a seam */
{
  const spec = CHAMPS_TARPAPEL_WORD_WALL;
  const geo = tarpapelGeometry(spec);
  const bands = seamBands(geo);
  const els = tarpapelCanvasElements(spec);
  const plates = els.filter((e) => /^card-\d+-plate$/.test(e.name));
  ok(plates.length === 24, `word wall: ${plates.length} cards, expected 24`);
  let crossing = 0;
  for (const el of plates) {
    const x0 = el.x / geo.canvasWidth;
    const x1 = (el.x + el.width) / geo.canvasWidth;
    const y0 = el.y / geo.canvasHeight;
    const y1 = (el.y + el.height) / geo.canvasHeight;
    for (const [axis, b0, b1] of bands) {
      const lo = axis === 'x' ? x0 : y0;
      const hi = axis === 'x' ? x1 : y1;
      if (lo < b1 && hi > b0) crossing += 1;
    }
  }
  ok(crossing === 0, `word wall: ${crossing} cards straddle a seam`);
  const mmW = ((plates[0].width / geo.canvasWidth) * spec.canvas.widthMm).toFixed(0);
  const mmH = ((plates[0].height / geo.canvasHeight) * spec.canvas.heightMm).toFixed(0);
  console.log('word wall: 24 cards,', `${mmW} × ${mmH} mm on paper`);
}

/* 6. the four-key theme swap still repaints what it should */
{
  const spec = CHAMPS_TARPAPEL_TREE;
  const a = tarpapelCanvasElements(spec);
  const b = tarpapelCanvasElements(withTarpapelTheme(spec, 'local-cultural'));
  const changed = a.filter((el, i) => JSON.stringify(el) !== JSON.stringify(b[i])).map((el) => el.name);
  ok(changed.length > 0, 'theme swap changed nothing');
  console.log('theme swap touched:', changed.join(', '));
}

console.log(fail === 0 ? 'ALL CHECKS PASSED' : `${fail} FAILURES`);
process.exitCode = fail === 0 ? 0 : 1;
