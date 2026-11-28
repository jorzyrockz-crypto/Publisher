/**
 * Every WordArt style is drawn for a typeface, and that typeface exists.
 *
 * Two failures this guards against, both silent:
 *
 *   1. A style with no face. It paints a gradient in whatever font the document used, which is how
 *      "a sticker" turns into "a gradient" and nobody can say why.
 *   2. A face the app cannot load. The browser falls back to a system font and the style looks
 *      broken rather than misconfigured. `Lilita One` and `Bangers` were mapped onto sticker and
 *      comic styles for a while before either was in the catalogue.
 *
 *   npm run check:wordart
 */
import { GOOGLE_FONTS_CATALOG, SYSTEM_FONTS } from '../src/constants/fonts.ts';
import {
  WORD_ART_STYLES,
  buildWordArtCssRule,
  wordArtDefaultFont,
  wordArtSpec,
} from '../src/utils/wordArt.ts';

let fail = 0;
const ok = (cond, msg) => {
  if (!cond) {
    fail += 1;
    console.log('FAIL', msg);
  }
};

const families = new Set([...GOOGLE_FONTS_CATALOG, ...SYSTEM_FONTS].map((font) => font.family));

const counts = new Map();
for (const style of WORD_ART_STYLES) {
  const family = wordArtDefaultFont(style.id);
  ok(!!family, `${style.id} has no default typeface`);
  if (!family) continue;
  ok(families.has(family), `${style.id} asks for “${family}”, which no catalogue offers`);
  counts.set(family, (counts.get(family) ?? 0) + 1);

  // The stylesheet is what a gallery tile renders with, so the family has to be in the rule or the
  // tile shows the style in the wrong font.
  const rule = buildWordArtCssRule(style.id);
  ok(rule.includes(`font-family: '${family}'`), `${style.id} rule does not set its face`);

  // And the spec, which is what an export paints with.
  ok(wordArtSpec(style.id).fontFamily === family, `${style.id} spec lost its face`);
}

const tally = [...counts.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([family, n]) => `${family} ${n}`)
  .join(', ');
console.log(`${WORD_ART_STYLES.length} styles, ${counts.size} faces: ${tally}`);
console.log(fail === 0 ? 'ALL CHECKS PASSED' : `${fail} FAILURES`);
process.exitCode = fail === 0 ? 0 : 1;
