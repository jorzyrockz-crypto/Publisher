/**
 * Text-box growth, held to its one rule: **the box grows to hold its words, downward, and never
 * shrinks itself.**
 *
 * The layout engine has a headless fallback for glyph widths, so the arithmetic is checkable
 * without a browser — the numbers are approximate, the relationships are not.
 *
 *   npm run check:textbox
 */
import {
  growTextBoxToFitContent,
  projectTextGeometry,
  textBoxContentHeight,
} from '../src/utils/textBoxGrowth.ts';
import { resizeTextBox } from '../src/utils/textResize.ts';

let failures = 0;
const check = (name, condition, detail = '') => {
  if (condition) return;
  failures += 1;
  console.log('FAIL', name, detail);
};

/** @type {import('../src/types/publisher.ts').TextElement} */
const base = {
  id: 'txt-1',
  type: 'text',
  x: 100,
  y: 100,
  width: 320,
  height: 60,
  rotation: 0,
  zIndex: 1,
  text: 'Short',
  fontFamily: 'Inter',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#1e293b',
  textAlign: 'left',
  verticalAlign: 'top',
  columns: 1,
  columnGap: 12,
  lineHeight: 1.4,
  padding: 8,
};

const long =
  'A classroom bulletin needs a sentence long enough to wrap three or four times, because that is ' +
  'the case where the box used to cut the words off instead of getting taller.';

const grown = (patch) => ({ ...base, ...patch });

// 1. Words that do not fit grow the box …
const shortPatch = growTextBoxToFitContent(base);
check('short text in a tall-enough box does not grow', shortPatch === null);

const longNeeded = textBoxContentHeight(grown({ text: long }));
const longPatch = growTextBoxToFitContent(grown({ text: long }));
check('long text grows the box', longPatch !== null);
check('growth sets exactly the needed height', longPatch?.height === longNeeded, `${longPatch?.height} vs ${longNeeded}`);
check('growth only touches the height', longPatch !== null && Object.keys(longPatch).join(',') === 'height');
check('grown box is taller than the old one', (longPatch?.height ?? 0) > base.height);

// 2. … and never shrinks it.
const roomy = grown({ text: long, height: 4000 });
check('a box with room is left alone', growTextBoxToFitContent(roomy) === null);
check('the needed height is the same whatever the frame is', textBoxContentHeight(roomy) === longNeeded);

// 2b. The words stay put: a centred box grows upward by half, a bottom-aligned one by all of it.
const centred = growTextBoxToFitContent(grown({ text: long, verticalAlign: 'middle' }));
const centredBefore = base.y + base.height / 2;
const centredAfter = (centred?.y ?? 0) + (centred?.height ?? 0) / 2;
check('a centred box keeps its text centred', Math.abs(centredAfter - centredBefore) < 0.51, `${centredAfter} vs ${centredBefore}`);
const bottomed = growTextBoxToFitContent(grown({ text: long, verticalAlign: 'bottom' }));
check('a bottom-aligned box grows upward', bottomed?.y === base.y + base.height - (bottomed?.height ?? 0));
const topped = growTextBoxToFitContent(grown({ text: long }));
check('a top-aligned box does not move', topped !== null && !('y' in topped));

// 3. Growth is idempotent: apply it twice, nothing moves.
const once = grown({ text: long, ...longPatch });
check('growth is idempotent', growTextBoxToFitContent(once) === null);

// 4. The opt-out is honoured.
check(
  'autoSizeText === false is never grown',
  growTextBoxToFitContent(grown({ text: long, autoSizeText: false })) === null
);

// 5. A narrower measure needs more height, a wider one less — the same function decides both.
const narrow = textBoxContentHeight(grown({ text: long, width: 180 }));
const wide = textBoxContentHeight(grown({ text: long, width: 640 }));
check('narrower measure needs more height', narrow > longNeeded, `${narrow} vs ${longNeeded}`);
check('wider measure needs less height', wide < longNeeded, `${wide} vs ${longNeeded}`);

// 6. Dragging a side handle lands on the same number as typing would, because both ask the
//    same function. This is the whole point of the normalisation.
const resized = resizeTextBox(grown({ text: long }), { x: 100, y: 100, width: 320, height: 60 }, {
  handle: 'e',
  startWidth: 260,
  startHeight: 60,
});
check('side-handle resize agrees with typing', resized.height === longPatch?.height, `${resized.height} vs ${longPatch?.height}`);

// 7. A box that declares itself a fixed frame (autoSizeText false) still resizes by hand.
const fixedFrame = resizeTextBox(
  grown({ text: long, autoSizeText: false }),
  { x: 100, y: 100, width: 320, height: 60 },
  { handle: 'e', startWidth: 260, startHeight: 60 }
);
check('fixed frames resize to exactly what was dragged', fixedFrame.height === 60, String(fixedFrame.height));

// 8. The funnel itself: typing into a box grows it and leaves everything else alone.
const typed = projectTextGeometry([{ ...base, text: long }], [base]);
check('typing grows the box in the funnel', typed[0].height === longPatch?.height, String(typed[0].height));
check('typing leaves the position alone', typed[0].x === base.x && typed[0].y === base.y);
check('typing leaves the width alone', typed[0].width === base.width);

// 9. …and a move is not a text edit.
const moved = projectTextGeometry([{ ...base, x: 400, y: 300 }], [base]);
check('moving a box does not grow it', moved[0].height === base.height);

// 10. A new word-art box gets its effect inset on the way in, so its paint is not clipped on
//     insert; a new plain box is inserted exactly as authored (templates size their own frames).
const bornWordArt = projectTextGeometry(
  [{ ...base, isWordArt: true, wordArtStyle: 'cartoon-bubble-blue' }],
  []
);
check('a new word-art box is inset for its paint', (bornWordArt[0].effectInset ?? 0) > 0, String(bornWordArt[0].effectInset));
const bornPlain = projectTextGeometry([base], []);
check('a new plain box is inserted as authored', bornPlain[0].height === base.height);

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} FAILURES`);
process.exitCode = failures === 0 ? 0 : 1;
