/**
 * The WordArt font map, held to two promises.
 *
 *   1. Every style it names is a style that exists. A typo in an id is invisible at runtime — the
 *      face is simply never applied — so it has to be a build failure.
 *   2. Every family it names is in `src/constants/fonts.ts`. This one already bit us: `Lilita One`
 *      and `Bangers` were mapped onto sticker and comic styles while the catalogue had never heard
 *      of them, so the browser fell back to a system face and the style looked broken rather than
 *      misconfigured. A font the app cannot load is a bug, not a preference.
 *
 *   npm run check:wordart
 */
import { GOOGLE_FONTS_CATALOG, SYSTEM_FONTS } from '../src/constants/fonts.ts';
import { WORD_ART_STYLES } from '../src/utils/wordArt.ts';
import { WORDART_FONT_MAP } from '../src/constants/wordArtFonts.ts';

let fail = 0;
const ok = (cond, msg) => {
  if (!cond) {
    fail += 1;
    console.log('FAIL', msg);
  }
};

const styleIds = new Set(WORD_ART_STYLES.map((style) => style.id));
const families = new Set([...GOOGLE_FONTS_CATALOG, ...SYSTEM_FONTS].map((font) => font.family));

const entries = Object.entries(WORDART_FONT_MAP);
for (const [id, face] of entries) {
  ok(styleIds.has(id), `WORDART_FONT_MAP.${id} is not a WordArtStyle`);
  ok(!!face && families.has(face.family), `${id} asks for “${face?.family}”, which no catalogue offers`);
}

/* The reverse direction is a judgement call, not a rule: a style without a face keeps the
 * document's font on purpose. Report it, do not fail it. */
const withoutFace = WORD_ART_STYLES.filter((style) => !(style.id in WORDART_FONT_MAP));
console.log(
  `${entries.length} styled faces, ${withoutFace.length} styles keep the document font:`,
  withoutFace.map((style) => style.id).join(', ')
);
console.log(fail === 0 ? 'ALL CHECKS PASSED' : `${fail} FAILURES`);
process.exitCode = fail === 0 ? 0 : 1;
