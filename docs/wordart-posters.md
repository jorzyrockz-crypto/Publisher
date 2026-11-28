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

## The reading corner poster

`poster-reading-corner` (816×1056, **97 / A**, zero warnings) is the page those six styles were
drawn for, and it is painted rather than photographed: a cartoon nook full bleed — sage wall, a
trailing plant, a sunlit window, a low bookcase and a child deep in an armchair — with **Reading
Corner** arched in sage over its cream die-cut rim, *Storytime at 4:00* on the terracotta ribbon, and
this week's shelf on a cream bookmark card over the bookcase.

The picture is the reason the layout changed. Two attempts before it:

- **A tall cream card across the bottom half** — the honest ground for the schedule — hid the child,
  who is the entire point of the drawing. A card that covers the subject is not a layout.
- **An illustration panel over a type panel** (art in the top 560px, words on paper below) read
  cleanly but scored **85**: a 640-wide panel is not a page background, so the layout model counted
  it as one very large object and `whitespace` collapsed to 0.17. The model was right about the
  consequence and wrong about the cause — a picture that stops at a hard edge does crowd the page.

What works: the art runs full bleed, and the shelf list becomes a **400px bookmark** over the
bookcase on the left. The card has a real fill, so every line on it is verifiable; the child stays
clear on the right; and the page keeps a page-shaped ground. Sizes were then cut to fit the narrower
card — the three titles at 24px Georgia, the schedule at 20px, the footer at 14px — and every box
moved onto the 8px module, which is what took `rhythm` from 0.55 to 1.0.

Three things the drafts taught, again:

- **An arched headline needs a smaller size than a flat one.** At 92px with `arc: 0.12` the arc ran
  past both margins and the R and r were clipped. 76px in a 168px box fits inside the margin with
  room for the smile.
- **Type over a picture is a guess.** Cream on the bright rug washed out; deep green on the dark rug
  was worse. Both are guesses about a photograph. A painted ground is a fact.
- **A line that fits the box in one renderer can wrap in the other.** 34px `The Nook` fell to a
  second line in the export and was clipped by its box; 28px fixed it, and the narrower bookmark
  card needed smaller again.

### Two contrast-model fixes this poster forced

The scorer called *Storytime at 4:00* illegible at 1.0:1 — it was comparing cream type against the
photograph behind the ribbon, not against the ribbon the style paints. Two corrections, both in
`layoutScore`:

1. **A backdrop style is judged against its own ground.** `wordArtBackdropColor` supplies the
   ribbon/plank/swipe colour, so a cream ribbon with cream type is scored against the terracotta,
   which is what a reader's eye does.
2. **A style that carries its own contrast is not judged against the page.** The arched sage header
   has a 6px cream rim; scoring `#059669` against the wood behind it ignores the border that makes
   it legible — and the design pass already knows that, via `wordArtCarriesContrast`. The two now
   agree, so a style cannot be "safe to keep" and "illegible" at the same time.

## Art direction: cartoon rooms, clay grounds, painted light

The four posters used to be photographed. They are now illustrated, in three registers kept
deliberately apart — a cartoon for a room with people in it, clay for a soft day, paint for weather
and light.

| register | files | used by | why this picture |
|---|---|---|---|
| cartoon | `cartoon-reading-nook.jpg` | reading corner | a child reading is a character, not a stock interior |
| cartoon | `cartoon-fiesta-dancers.jpg` | fiesta awards | dancers drawn as dancers, outlines that survive a scrim |
| cartoon | `cartoon-seedling-hands.jpg` | eco, the print | the hands are the message; paint flattens them kindly |
| clay | `clay-meadow.jpg` | wellness week | pastel matte shapes give four sticker words something soft |
| cinematic paint | `paint-forest-light.jpg` | eco champions | a shaft of light where the page needed drama, not detail |

They are ordinary image elements, referenced by path, croppable and deletable, like the photographs
before them. The photographs (`reading-nook-hero.jpg`, `fiesta-dancers-hero.jpg`,
`eco-planting-hero.jpg`, `eco-seedling-card.jpg`) are still in `public/templates/` — the pages no
longer use them, but nothing was thrown away either.

### The clay asset set

Six pieces now sit in the stock rail under a new **Clay** category (`Clay Sun`, `Clay Cloud`,
`Clay Leaf Sprig`, `Clay Star`, `Clay Heart`, `Clay Pebbles`). They are hand-built SVG, not images,
because an asset that can be recoloured and dropped on any page is worth more than a picture of a
clay sun.

Puffy, without filters:

- **bulk** is a radial gradient from a near-white highlight at 35% / 25% to a saturated middle to a
  darker rim — light from the upper left, the way every clay render is lit;
- **a second highlight** is an ellipse of white at 0.45-0.75 opacity sitting high on the form;
- **a flattened shadow** is an ellipse of the bulk colour at 0.2 opacity beneath it;
- **no `feGaussianBlur`, no `filter` at all.** The browser would render it and the canvas export
  would ignore it, and the same asset would look different in the PDF. Both renderers agree on
  gradients, so the pieces are built only from gradients.

### Grounds, not guesses

Illustrating the pages forced the same question twice, and both answers are now rules:

- **Where type sits over artwork, give it something painted.** The fiesta's date, gates and footer
  had no ground once the photograph became a drawing with ochre skirts behind them; the scrim could
  hide the art or save the type, not both. A **programme plate** — 600×144, aligned to the award
  card, deep brown at 0.92 with a gold edge — carries all three lines and costs 8% coverage. The
  card, the plate and the plank are the three grounds the page needs, and each one scores as a fill.
- **Keep the subject.** The reading corner's card moved left and narrowed so the child stays visible;
  the eco print stayed where the script line could straddle it.

### The 8px module is the whole of `rhythm`

Wellness Week read **90** with an "uneven spacing" warning and its boxes at 128/250/370/566/700/880.
Every gap was plausible on its own; the metric measures *every pair* of boxes, and a 6px gap next to
a 30px gap cannot average out. Putting every `x`, `y`, `width` and `height` on 8 — 128/256/384/560/
672/856, with a 120-tall sticker box instead of 116 — took `rhythm` to 1.0 and the page to **100**.
The same pass fixed the fiesta plate and the reading bookmark. It is not a trick to please a number:
8px spacing is the claim the design system already makes, and the scorer is how a page finds out it
was not keeping it.

Library-wide after all of it: 76 pages, 89.3 avg / 90 median / A 61 / B 15, no C or D. The four
posters: **100 / 97 / 93 / 91**, every one of them zero warnings.

## Children's books, reading corners and portfolios

Six themed styles, three moods, one spec.

| id | label | look |
|---|---|---|
| `storybook-crayon` | Storybook Crayon Pop | sunshine→coral ramp, 4px white die-cut rim, cobalt 4-step block |
| `fairytale-sparkle` | Fairytale Magic | lavender→periwinkle→sky, white rim, violet bloom, corner glints |
| `reading-nook-sage` | Cozy Sage Nook | emerald-sage, 6px cream die-cut rim, **arc 0.12** |
| `storytime-banner` | Storytime Ribbon | cream type on a terracotta swallowtail ribbon |
| `portfolio-editorial` | Editorial Slate & Gold | slate→charcoal face, 1.5px burnished-gold trim, soft lift |
| `portfolio-indigo` | Modern Indigo Ink | indigo→blue→teal diagonal, 1.5px white edge, airy shadow |

Three of the six are new compositions of old machinery: the ribbon is the `ribbon-banner` backdrop in
terracotta, the sage style carries its own `arc` (the reading-corner header arches because the *style*
says so, and the Curve control still overrides it), and the fairytale glints are the same three
anchors as the chrome styles. Only the crayon block and the two portfolio trims needed new numbers.

**Rim widths follow the die-cut rule.** `storybook-crayon` declares 4px and `reading-nook-sage` 6px,
both with `heavyStroke: true`, so the generated stylesheet emits 8px and 12px and the *visible* rim is
the width the style asked for. The two portfolio styles deliberately do not: a 1.5px gold hairline at
800 weight is the whole point of the pair, and doubling it would turn a trim into a border.

**Weight is part of the style.** The portfolios force `weight: '800'` rather than 900, so a serif
(`Playfair Display`, `Cinzel`) or a geometric sans keeps its counters instead of closing up. Every
other style in the catalogue forces 900.

**Where each one reads.** `storybook-crayon` and `reading-nook-sage` are self-contrasting (heavy
near-white rims), so they survive illustrated grounds and bulletin-board photos — the render sheet
puts both over a busy botanical image to prove it. `fairytale-sparkle` is *not*: its top stops are
near-white, so on a cream page the design pass repaints it, and that is correct — it belongs on a
mid-tone illustration or a coloured panel, which is where a fairy-tale title actually lives. The
portfolio pair is the mirror case: on a dark ground the pass replaces `portfolio-editorial` with
something that reads, because slate on forest green is invisible.

The seven font pairings the guide asks for are now in the Google catalogue —
Fredoka, Baloo 2, Quicksand, Nunito, Patrick Hand, Chewy and Plus Jakarta Sans — alongside the
Playfair Display, Cinzel, Pacifico and Montserrat that were already there. They load through the
same `preloadProjectFonts` path templates use, so a book cover set in Baloo 2 arrives in Baloo 2.

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

`poster-fiesta-awards` (816×1056, **93 / A**, zero warnings) puts them on a page: the full-bleed
street-dance illustration under a warm 24% scrim, BALETE sweeping six colours across the top, the
competition in parchment script, **6th Best** in trophy gold on a parchment card (gold needs paper —
a medal needs a sash), the troupe name on the plank, then date, time and footer at body scale.

The first draft was a photo band over a parchment panel and scored **80**: photo plus scrim plus nine
full-width boxes covered the page. The scorer's whitespace band tops out at 72%, and it was right —
the page was crowded. Full-bleeding the photograph makes it a page background (excluded from
coverage), a single local card gives the gold its ground, and the coverage lands inside the band.
Nothing was made smaller to please the metric; one element moved, the ground changed.

## The eco poster template

`poster-eco-champions` (816×1056, scores **91 / A**) puts the five styles on the page they were drawn
for: a full-bleed painted forest under a pine scrim, then CHAMPIONS in gold signwork, ECO in
emerald, IN ACTION on the plank, the date on a notched ribbon, and the script line straddling the top
edge of the seedling print — the "readable over the photos" case the white rim exists for.

Both pictures are ours (`public/templates/paint-forest-light.jpg`,
`cartoon-seedling-hands.jpg`) and are ordinary image elements: swappable, croppable, deletable.

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
