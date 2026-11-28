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
| `brush-sunshine` | Sunshine Brush Swipe | navy → ink gradient on a ragged `#facc15` swipe |
| `brush-blush` | Pastel Blush Ribbon | rose → wine gradient on a `#fbcfe8` swipe, arched 0.12 |
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

`WordArtPaint.backdrop` is an object, not a choice of two hardcoded looks:

```ts
interface WordArtBackdrop {
  type: 'brush-swipe' | 'pastel-pill';
  color: string;
  paddingX?: number; // px the highlight runs past the glyph box, default 24
  paddingY?: number; // default 10
}
```

`wordArtBackdropLayers(style, box)` turns that into a padded box, a fill, and one to three layers —
and those layers are *path commands*, not an SVG string or a canvas call:

```ts
type WordArtPathCommand =
  | { c: 'M'; x: number; y: number }
  | { c: 'L'; x: number; y: number }
  | { c: 'Q'; cx: number; cy: number; x: number; y: number };
```

- the **exporter** traces them with `moveTo`/`lineTo`/`quadraticCurveTo` (`drawBrushBackdrop`);
- the **DOM** joins them into a `d` attribute (`pathCommandToSvg`), one `<path>` per layer.

A string path would have forced the canvas side to depend on `Path2D`, which is not global in every
runtime — and without it the highlight silently degraded to a rectangle. That is not hypothetical:
the first build of this feature exported a flat band while the editor showed a brush. Commands are
one description the two painters execute identically, so the preview and the PDF cannot drift.

**The swipe is three passes.** `SWIPE_LAYERS` paints the same ragged outline three times: full
strength, then two lighter, shorter, tilted copies (`dy 0/-2/+3`, `dh 0/-4/-6`, α .95/.75/.65,
tilt ∓0.012). Overlapping translucent passes give the dry-brush tooth that one flat shape cannot.
The bristle offsets are fixed fractions of the stroke height, not `Math.random()` — a rerender must
not twitch, and the editor and the export must agree glyph for glyph. The stroke starts slightly
inside the box, swells along the word, and lifts off at both ends instead of ending on a cut edge.

**The swipe has to be allowed out of the box.** The DOM text view clips its glyphs
(`overflow: hidden`) so an overflowing run cannot bleed onto the page — which also clipped the
highlight's padding, leaving the editor showing a band that stopped at the box while the PDF showed
paint running past it. The highlight now lives on an unclipped shell and the glyphs keep a clipped
inner box; the two renderers therefore agree on where the paint goes, down to the tail.

**One box to hug the word.** Curved text has no lines, so `lineGlyphBoxes` returns nothing and the
caller fell back to the whole element box. For a gradient that is loose; for a highlight it is
wrong — a 690×130 frame turned a swipe into a coloured panel. `curveGlyphBox` fits the arc's actual
glyphs (their advances and font sizes), and both painters use it, so an arched word gets an arched
word's highlight.

**The pill is the same machinery**, `pillCommands()`: a stadium with quarter-turn quadratics, so it
needs no `roundRect` and no CSS `border-radius`. (Typography rule from the earlier spec still applies:
the highlight must never be a `border-radius` blob, because that is the one shape the canvas cannot
reproduce from a box.)

### Arched type, from the style or from the element

`WordArtPaint.arc` (and therefore `WordArtSpec.arc`) is an arc on the Curve slider's scale, ÷100:
`0.15` is the gentle upward smile a banner header wants, `-0.15` the trough. `wordArtCurve(style,
elementCurve)` resolves it — **the element's own `textCurve` always wins**, so a template can arch
one line without forking the style, and nobody has to learn a second control. Both painters lay the
text out through that resolved value, so a style-carried arc arches in the editor and in the export.
`brush-blush` ships with `arc: 0.12`; the wellness-week HEALTH line keeps its explicit `textCurve: 14`.

## Eco campaign: pine, gold, wood and ribbon

Five more styles, same grammar as the stickers — an authored rim doing the contrast work — in a
forest palette rather than a candy one.

| id | label | look |
|---|---|---|
| `eco-champion` | Eco Champion Gold | cream→gold→amber ramp, 6px pine rim, 4-step pine block, long cast shadow |
| `eco-leaf` | Eco Leaf Block | emerald→pine ramp, white rim |
| `wood-plank-action` | Rustic Wood Plank | cream/italic on a sawn plank, espresso cast shadow |
| `eco-ribbon` | Forest Ribbon Banner | near-white type on a notched pine ribbon |
| `forest-script-sticker` | Pine Script Sticker | pine ramp, 6px white die-cut rim |

Two backdrops join `brush-swipe` and `pastel-pill`:

- **`ribbon-banner`** — the notches are part of the ribbon *outline* (six points), so it fills as one
  shape with no seams where the cuts meet the band.
- **`wood-plank`** — a six-point hand-cut silhouette (no parallel edges, the right end longer than
  the left) filled with a three-stop vertical ramp, plus four shallow grain streaks and a 2px espresso
  border. The grain and border are **stroke layers**: `WordArtBackdropLayer` now carries
  `fill? | gradient? | stroke?`, and both painters honour all three. Canvas strokes with
  `lineWidth`, the DOM with `stroke-width`; canvas fills the gradient with `createLinearGradient`,
  the DOM with a `<linearGradient>` built from the *same* angle vector.

**Why no `.wordart-backdrop-wood` / `-ribbon` CSS classes.** The sketch for this feature included
them, and they are exactly the drift the rest of this file is about: a `clip-path` polygon and a
`repeating-linear-gradient` in CSS cannot be reproduced from the canvas path, so the editor tile
would show a different ribbon than the PDF. The editor preview is the same SVG the exporter's
commands produce; `src/index.css` keeps only the text paint for the gallery tiles.

**One rule had to widen.** `wordArtSelfContained` used to mean "a rim ≥4px, near-white". A pine rim is
not white but it *is* the authored contrast device — without widening the rule, the contrast pass
repainted `eco-champion` and `forest-script-sticker` into gold and candy the moment a template
loaded. The rule now also accepts a declared `heavyStroke` of 5px or more. The four sticker styles
are white, so nothing that already existed changes behaviour; the library score is identical
(89.0 avg / 90 median / A 58 / B 15 / no C or D).

## Fiesta and award: metal, spectrum, parchment and wood

Four styles for an award night or a town fiesta.

| id | label | look |
|---|---|---|
| `trophy-gold` | Award Trophy Gold | champagne→gold→**bronze break**→amber→cream ramp, 5-step bronze block, warm bloom, corner glints |
| `fiesta-mosaic` | Fiesta Spectrum Sticker | six colours swept **horizontally**, 7px white die-cut rim |
| `parchment-script` | Parchment Brush Script | near-black ink on a cream dry-brush swipe |
| `folklore-wood` | Folklore Wood Sign | cream→amber type, espresso rim, on the sawn plank |

Two of these lean on things that already existed, which is the point of a single spec: `fiesta-mosaic`
is `angle: 90`, and both painters map that to a left-to-right sweep with no new code
(`createAngledGradient` on canvas, `linear-gradient(90deg, …)` in CSS); `folklore-wood` reuses the
`wood-plank` backdrop unchanged.

`trophy-gold` is the one style where a hard horizon break is right rather than an "AI chrome" tell: an
award seal *does* have a bronze reflection band, and the whole point is that the top half is lit. Its
glints come from the same `wordArtGlints` anchors as `synth-chrome` — three sparkles, shared geometry,
so the DOM and the export agree.

**Declared width is what you see.** `fiesta-mosaic` declares a 7px rim and sets
`heavyStroke: true`, so the generated stylesheet emits `-webkit-text-stroke: 14px` with the fill
covering the inner half — 7px of white, on screen and in the PDF, exactly like the sticker styles.
The sketch's hand-written rule said `7px` because CSS stroke is centred; pasting it would have given
a 3.5px border.

### The contrast pass needed a sharper question

`trophy-gold` and `parchment-script` were being repainted to `cyber-acid` and `liquid-glass` the
moment the template loaded. The old check asked "is there a die-cut border?" (`wordArtSelfContained`)
— too narrow for both: black script on a dark scrim *is* legible because it sits on its own cream
swipe, and award gold on parchment never dissolves because its ramp runs from near-white to bronze.

`wordArtCarriesContrast` answers the question the pass actually has — "does this style supply its own
ground?" — and is true when the style has a backdrop, a heavy rim, or a gradient whose luminance range
is 0.55 or wider. `wordArtSelfContained` keeps its original, narrower meaning because composability
depends on the border test, not this one. Library-wide the change is neutral to positive: 89.1 avg /
90 median / A 60 / B 15, no new warnings.

## The fiesta poster template

`poster-fiesta-awards` (816×1056, **97 / A**, zero warnings) puts them on a page: the full-bleed
street-dance photograph under a warm 34% scrim, BALETE sweeping six colours across the top, the
competition in parchment script, **6th Best** in trophy gold on a parchment card (gold needs paper —
a medal needs a sash), the troupe name on the plank, then date, time and footer at body scale.

The first draft was a photo band over a parchment panel and scored **80**: photo plus scrim plus nine
full-width boxes covered the page. The scorer's whitespace band tops out at 72%, and it was right —
the page was crowded. Full-bleeding the photograph makes it a page background (excluded from
coverage), a single local card gives the gold its ground, and the coverage lands inside the band.
Nothing was made smaller to please the metric; one element moved, the ground changed.

## The eco poster template

`poster-eco-champions` (816×1056, scores **91 / A**) puts the five styles on the page they were drawn
for: a full-bleed planting photograph under a pine scrim, then CHAMPIONS in gold signwork, ECO in
emerald, IN ACTION on the plank, the date on a notched ribbon, and the script line straddling the top
edge of the seedling print — the "readable over the photos" case the white rim exists for.

Two photographs are ours (`public/templates/eco-planting-hero.jpg`,
`eco-seedling-card.jpg`) and are ordinary image elements: swappable, croppable, deletable.

Things the first draft got wrong, kept here because they are the scoring model working:

- **A text-on-text overlap** (the script line clipping the ribbon by 18px) cost the page 18 points
  before anything else was looked at.
- **Display type all the way down.** Five WordArt lines and two 19px captions is not a hierarchy: the
  shout measured 5.5× the body and the scorer calls that a flat page. One plain 34px subtitle fixed
  it — and the poster is better for having a sentence in it.
- **Odd gaps.** Boxes off an 8px module drag `rhythm` down with every neighbouring pair. Snapping the
  stack to 8/16/24 took it from 0.54 to 1.0.
- **A white print border** through the script lettering looked like an accident rather than a layer.
  The card keeps its radius and shadow and drops the frame.

### Templates now arrive in their own typeface

The script line is Kaushan Script, and a document laid out before that face arrives is measured in
the fallback face — every box around it inherits the mistake. `loadTemplate` now awaits
`preloadProjectFonts(project)`, which fetches the stylesheets and then settles
`document.fonts.load` for the weights the page uses, racing a 1.5s timeout so a slow network never
blocks opening a template. System-font templates resolve immediately (an empty family list is a
no-op).

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
