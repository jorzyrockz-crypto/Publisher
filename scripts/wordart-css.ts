/*
 * Writes the `.wordart-*` block in src/index.css from the paint spec in
 * src/utils/wordArt.ts, so the gallery previews, the in-app painter and the
 * canvas exporter can never drift apart.
 *
 *   npm run wordart:css           # rewrite the block
 *   npm run wordart:css -- --check  # exit 1 if it is out of date
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { buildWordArtStylesheet } from '../src/utils/wordArt.ts';

const CSS_PATH = 'src/index.css';
const HEADER = [
  '/* WordArt styles — generated from src/utils/wordArt.ts by scripts/wordart-css.ts.',
  '   Do not edit by hand: run `npm run wordart:css`. */',
].join('\n');
const END = '/* end WordArt styles */';
const blockBounds = (text: string) => {
  const from = text.indexOf(HEADER);
  if (from === -1) return null;
  const to = text.indexOf(END, from);
  return to === -1 ? null : ([from, to + END.length] as const);
};

const css = readFileSync(CSS_PATH, 'utf8');
const body = `${HEADER}\n${buildWordArtStylesheet()}\n/* end WordArt styles */`;

let next: string;
const bounds = blockBounds(css);
if (bounds) {
  next = `${css.slice(0, bounds[0])}${body}${css.slice(bounds[1])}`;
} else {
  // First run: lift the hand-written rules out of wherever they sit.
  const rule = /\.wordart-[a-z0-9-]+\s*\{[^}]*\}\n?/g;
  const first = css.search(rule);
  if (first === -1) throw new Error('no .wordart-* rules to replace');
  const stripped = css.replace(rule, '').replace(/\n{3,}/g, '\n\n');
  next = `${stripped.slice(0, first)}${body}\n\n${stripped.slice(first)}`.replace(/\n{3,}/g, '\n\n');
}

if (next === css) {
  console.log('wordart css: up to date');
} else if (process.argv.includes('--check')) {
  console.error('wordart css: out of date — run `npm run wordart:css`');
  process.exit(1);
} else {
  writeFileSync(CSS_PATH, next);
  console.log('wordart css: rewritten');
}
