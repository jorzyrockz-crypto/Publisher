# Poster WordArt: stickers, brush swipes, and arched type

The template library had twenty WordArt styles, and almost all of them were metal: chrome horizons,
gold foil, liquid glass. What it had none of was the look every school tarpapel, wellness-week
poster and event banner actually uses — a chunky gradient word inside a fat white die-cut border,
sitting on a busy photograph, with the title painted over a yellow swipe.

Six styles close that gap, and two small features make them behave.

## The styles

| id | label | look |
|---|---|---|
| `sticker-royal` | Royal Sticker Pop | sky → royal → navy ramp, 6px white border |
| `sticker-forest` | Fresh Leaf Sticker | mint → green → forest, 7px border |
| `sticker-coral` | Warm Coral Sticker | amber → orange → red, 7px border |
| `sticker-teal` | Deep Teal Sticker | aqua → teal → deep teal, 6px border |
| `brush-highlight` | Painted Brush Highlight | navy ink on a rough yellow paint swipe |
| `pill-highlight` | Pastel Pill Highlight | indigo ink on a pastel pill |

All six go through the existing `PAINT` table, so the gallery, the inspector, the DOM painter and
the canvas exporter pick them up with no new plumbing. `npm run wordart:css` regenerates the
`.wordart-*` block in `src/index.css`; `-- --check` proves it is in sync.

### The border is the width you see

`-webkit-text-stroke` is centred on the glyph outline, and `paint-order: stroke fill` hides the
inner half under the fill — so a declared 6px border reads as 3px. A poster border is not a hairline
outline; it is the thing that keeps the word legible on a photograph. `heavyStroke: true` makes both
renderers double the declared width (`wordArtRimWidth`), so `stroke.width: 6` means six pixels of
white, on screen and in the PDF alike.

### Round joins, without a property that exists

The request was to add `stroke-linejoin: round`. CSS text stroke has no such property (that one is
SVG-only), so the fix has to be one both renderers can execute: for any border 4px or thicker,
`wordArtShadowChain` inserts a 2px-blurred copy of the glyph in the border colour, just under the
stroke. It rounds the outer edge — no more white spikes on A, M and W — and because it lives in the
shadow chain, the DOM's `drop-shadow` filter and the canvas painter produce the same silhouette.
The canvas additionally keeps `lineJoin = 'round'`, which it already had.

### Backdrops are geometry, not an image

`WordArtPaint.backdrop: 'yellow-brush' | 'pastel-pill'` adds a painted highlight behind the letters.
Both are described once, as a path in a 100×100 box (`WORD_ART_BACKDROPS` in `src/utils/wordArt.ts`):

- **canvas** fills the path with `Path2D`, scaled to the line's glyph box;
- **DOM** renders the same `d` inside an `<svg preserveAspectRatio="none">` sized to that box.

One path, two painters. A data-URI background in CSS and a hand-rolled rectangle on canvas would
disagree the moment the box changed shape — which is exactly the drift this codebase already avoids
elsewhere.

## Arched type already existed — and was broken in export

`textCurve` (Curve slider, presets) turns a line into glyphs along a circle, and both renderers
already understood it. What did not work was the *combination*: `renderWordArtCanvas` walked
`layout.lines`, and a curved element has no lines — the arc replaces them. A curved WordArt word
therefore painted nothing into an export while looking fine in the editor. The painter now treats
the curve as a single pseudo-line. The wellness-week template uses `textCurve: 14` on HEALTH, so the
case is exercised by a shipped template, not only by a test.

## Rules that had to learn about lettering

- **Don't repaint a sticker for low contrast.** `enhanceText` repaints an authored WordArt style
  whose fill scores badly against its background. A die-cut border *is* the contrast, so
  `wordArtSelfContained(style)` (border ≥ 4px, near-white) exempts those styles. Without it, the
  blue, green, coral and teal stickers were silently replaced by gold and candy the moment the
  template was loaded.
- **Don't recompose a lockup.** The editorial composition pass now skips a page with two or more
  WordArt lines, or a single one whose style is self-contained or carries a backdrop. A page with a
  single ordinary display title is still fair game.
- **Display type is a lockup, not a hierarchy.** `scoreHierarchy` compared the two largest text
  sizes, so four equal sticker words read as "Nothing leads". When the largest text is WordArt the
  ratio is now measured against the largest *plain* text — which is the question the eye actually
  asks: is the body copy clearly smaller than the shout?
- **One picture per page, not two.** The polish pass added a hero whenever it saw no *foreground*
  photo, so a template that already shipped a full-bleed image got a second one stacked on top of
  it, under a veil. Any existing `src` now counts.

## A template to prove it

`poster-wellness-week` — *Wellness Week Sticker Poster*: a foliage photograph, four sticker words,
the middle one arched, a brush-swipe title, a rule and a caption. It scores 92 and ships in the
Poster category. `src/constants/posterWordArtTemplates.ts` holds it.

## Verification

- Every page was rasterised through the **real** `renderPageModelToCanvas` (napi-canvas, with the
  DOM shimmed) and inspected: borders, gradients, the arched word, the swipe and the photo all land.
  That is how the curved-word export bug was found.
- The DOM was rendered under jsdom and asserted: a brush style emits an `<svg>` containing the shared
  swipe path with the yellow fill, a sticker emits none, and a curved WordArt word emits per-glyph
  spans. This also surfaced a real crash: before fonts are measured the glyph-box list is empty and
  the gradient/backdrop layer read `undefined.width`; it now falls back to the element box.
- `npx tsc -b` clean · `npx oxlint src` 0 errors / 37 warnings · `npx vite build` ✓ ·
  `npm run wordart:css -- --check` in sync.
- Library: **89.0 average, median 90, A 38, D 0**; 43 pages better than the authored version, 30
  unchanged, **0 worse**.
