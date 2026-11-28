# Tarpapel: layout and printing

A plan for the poster path — where it is, what is actually broken, and the order to fix it in.
Written against the code as of `fd93ba5`.

## Where it stands

Three mechanisms currently serve one job:

| | what it does | file |
|---|---|---|
| **Engine** | `computeTarpapelMetrics` (printable area, overlap, assembled size in cm, scale %, DPI guess) and `slicePageIntoTarpapelTiles` (one page → N×M tile PNGs) | `src/utils/printUtils.ts:247`, `:319` |
| **Export** | `exportTarpapelPdf` — one PDF page per tile, tile image inset by `tarpapelMarginIn` | `src/utils/pdfExport.ts:203` |
| **UI** | grid presets 2×2…4×3, cols/rows 1–8, overlap 0/¼/½/¾ in, margin 0/¼/½ in, contain/cover, map vs tile preview, tile inspector, guides toggle, `matchPageToTarpapelRatio` | `BackstageModal.tsx:1184-1400`, `PublisherContext.tsx:3187` |
| **Template model** (new) | a `TarpapelTemplate` spec in mm + `tarpapelToProject`, which splits it into **one page per sheet** | `src/constants/champsTarpapel.ts` |

The engine is the right model — **one canvas, sliced at export**. The third row is a detour I made
before reading it: it duplicates the split, bakes its own seam labels beside the engine's trim marks,
and turns a poster into six pages you cannot edit as one picture. P1 below folds it back in.

## What is actually wrong

Ranked by what a teacher sees, not by how the code looks.

### 1. The alignment guides print **onto the artwork**

`tarpapelShowTileGuides` is drawn into the tile canvas *before* `toDataURL`
(`printUtils.ts:370-450`): an amber tint over the overlap strip, a dashed glue line, a dashed trim
border at 2 px inset, corner ticks and an `R1·C2 (2/6)` badge. `exportTarpapelPdf` then prints that
image inside the margin. Result: every sheet carries amber stripes and a dashed frame across the
middle of the banner, exactly where the neighbour will be glued.

Marks belong in the **non-printable margin**, drawn as vectors, or on a separate proof sheet.

### 2. The assembled size is 3 cm smaller than the design says

`computeTarpapelMetrics` subtracts the sheet margin *and* the overlaps, but a template authored at
"871 × 410 mm" ignores both:

| | declared | what the printer delivers | why |
|---|---|---|---|
| banner, 3 × 2 A4 landscape | 871 × 410 mm | **840 × 388 mm** | 3 × 297 − 2 × 10 mm glue − 2 × 6.35 mm printer margin |
| word wall, 2 × 2 A4 portrait | 396 × 567 mm | **388 × 562 mm** | same, two axes |

With `fitMode: 'contain'` the app then scales the canvas to 96 % and centres it, leaving white bands
top and bottom. The teacher approved one composition and hangs a slightly different one.

### 3. The DPI warning is a guess, not a measurement

```ts
const approxPx = 1200;                       // printUtils.ts:288 — for every image
const estDpi = printedElWIn > 0 ? Math.round(approxPx / printedElWIn) : settings.qualityDpi;
```

Every raster is assumed to be 1200 px wide, so `lowResImageCount` is decoration. Natural sizes are
known — pack manifests carry them, and decoded image elements know `naturalWidth`.

### 4. "300 dpi" is unreachable

```ts
const posterPxPerIn = Math.min(qualityDpi >= 300 ? 220 : 150, 7200 / Math.max(totalW, totalH));
```

A 3 × 2 banner is 33 in wide, so the cap pins it at ~217 px/in. A 4 × 3 never exceeds 7200 px on its
long side. Choosing 300 changes nothing above roughly 33 in, and nothing says so.

### 5. The poster is materialised as one huge raster, then copied

Poster canvas → 9 tile canvases → 9 PNG data URLs → jsPDF. At 3 × 3 and 220 px/in that is ~36 Mpx for
the poster plus 16 MB per tile in flight. On a school laptop or a tablet this is the step that
crashes, and the copying buys nothing.

### 6. Nothing in the layout knows where the seams are

`READING CORNER` at 108 pt spans x 0.10–0.90 and crosses both vertical seams. That is *fine* —
neighbouring sheets print identical pixels, so it joins — but a ±2 mm glue shift shows on the `E`
and the `N`, and no tool says so. The word wall's 16 mm gap between the card strips is safe by
accident, not by rule. There is no check, no gutter helper, no warning.

### 7. The PDF tells the teacher nothing about assembly

N pages of art. No sheet map, no glue order ("overlap *under* the left-hand sheet"), no "test print
sheet 1 first", no combined size on the page. Teachers assemble these on a classroom floor.

## Plan

### P0 — make the print honest (no visual change to any design)

**0.1 Marks out of the artwork. ✅ done** (`sheetMarkGeometry`) Split guides into `preview` (screen only) and `print` (vectors in
the margin). In `exportTarpapelPdf`, stop drawing into the tile raster; after `addImage`, use jsPDF
primitives to draw: trim ticks at the four corners *outside* `availableW/H`, `ROW 1 · COL 2 / 6` and
`GLUE 10 MM` labels in the margin, and a hairline registration cross at each glue edge.

- Files: `printUtils.ts` (`sheetMarkGeometry`), `pdfExport.ts` (slices with guides forced off, draws vectors), `BackstageModal.tsx` (toggle is now honestly labelled *in preview*).
- Verified in Node: 8 tick lines per sheet, none inside the image area; `SHEET 2 / 6` + `R1 C2`; glue labels on inner edges only; borderless prints no marks at all.

**0.2 Size computed, never typed.** One function, one source of truth:

```ts
export function tarpapelCanvas(intent: TarpapelIntent): { width: number; height: number; mm: [number, number] };
// = cols × printableW − (cols−1) × overlap, in inches, × 96
```

`computeTarpapelMetrics` calls it; templates size their page with it; the panel shows
`8 sheets · A4 · 84 × 39 cm`. A design can no longer be authored at a size the printer will not
produce.

- Files: `printUtils.ts`, `champsTarpapel.ts`, `BackstageModal.tsx`.
- Done when: banner and word wall report exactly the mm they print, and `matchPageToTarpapelRatio` becomes a no-op for templates that use it.

**0.3 Real DPI.** Use `naturalWidth` for image elements and manifest dimensions for pack assets; drop
the 1200 constant. Report per-element, not a count: "`bg-heritage-tree` prints at 96 dpi — 1470 px
across 15 in".

- Files: `printUtils.ts`, `TarpapelMetrics`.
- Done when: a deliberately over-scaled 512 px sticker is named in the panel before printing.

**0.4 Kill the 7200 cap by rendering per tile.** For each tile: create one canvas at
`printableW × dpi`, translate by `−sx, −sy`, draw the page model, export, release. The poster raster
never exists, so 300 dpi becomes real and peak memory is one tile.

- Files: `printUtils.ts` (`slicePageIntoTarpapelTiles` rewritten around `renderPageModelToCanvas`), `pdfExport.ts`.
- Done when: 3 × 3 A4 at 300 dpi completes, tiles are 3300 px wide, and no canvas exceeds one tile.

### P0.5 — "Print as Tarpaulin": every design, one door ✅ done

The philosophy settled the design: the modal is not an image tool, it is a **door onto the engine for
whatever is in the workspace**. Source is a chip row — every open tab, or an image from disk — plus a
page picker when the source has several. One `TarpapelModal`, three rows: *what are we printing*,
*how it is cut up*, *what comes out*.

Three decisions worth keeping:

- **The grid is suggested, not imposed.** `suggestTarpapelGrid(page, settings)` scores every grid up
  to 6 × 6 by how far the assembled poster's shape is from the design's, and breaks near-ties toward
  fewer sheets. A 3292 × 1550 banner suggests **3 × 2 · 84 × 39 cm**; a 4:5 post suggests 1 × 2.
  The teacher can override, and the offer disappears once they have.
- **The mismatch is shown, not hidden.** The sheet map draws the poster's proportions cut into its
  sheets with the design's silhouette over it, so "pad 5%" or "crop 5%" is a picture rather than a
  warning. Same numbers the engine will use.
- **Two doors, one setting.** Opening the modal seeds from the print panel's last tarpapel settings
  and writes them back on export, so the two surfaces can never disagree.

Reached from command search — **"Print as Tarpaulin"** — and implemented as `TarpapelModal.tsx` +
`isTarpapelModalOpen` in the context. It calls `computeTarpapelMetrics` and `exportTarpapelPdf`; it
owns no tiling code.

### P0.6 — image quick path (PaperTarp parity) ✅ folded into P0.5

[papertarp.com](https://www.papertarp.com/) is six inputs: upload an image, grid cols × rows, a
unified margin preset (0.3/0.5/0.75/1 in), paper (Letter/A4/Legal), orientation, then *Download PDF*
or *Print Poster* — with a sheet-map preview and `84 × 43 CM · 6 SHEETS` underneath.

Every one of those six already exists in this app, behind a panel. What does not exist is the **front
door**: tile a finished JPG — a Canva export, a DepEd memo, a photo of a hand-lettered banner —
without learning the editor first. That is the whole of the gap, and it is worth closing, because it
is the shortest path to a teacher printing something with this app at all.

**`QuickTarpapelModal`** — one screen, three rows:

1. **Image** — drop or pick one file; thumbnail plus `2400 × 1200 px · prints 108 dpi at 84 cm`.
2. **Layout** — the same controls the print panel has: 2×2/2×3/3×2/3×3/4×3 presets, cols/rows, overlap,
   margin, paper, orientation, contain/cover. Reuse `computeTarpapelMetrics`; do not re-derive.
3. **Preview + go** — the assembler map with sheet numbers and the honest assembled size, then
   *Download PDF* / *Print*.

Implementation is a borrow, not a build: wrap the image in a temporary single-page `DocumentProject`
(page sized by `tarpapelCanvas(intent)`, one `image` element at contain-fit) and hand it to the
existing `slicePageIntoTarpapelTiles` + `exportTarpapelPdf`. Entry points: **File → Tarpapel from
image…**, and a "use an image instead of this page" link inside the print panel's tarpapel section.

Two things to settle against PaperTarp's behaviour:

- **They do not subtract printer margins.** Their 3 × 2 A4 reads 84 × 43 cm; subtracting a 6.35 mm
  margin on both axes gives 84 × 39 cm. They tile the full sheet and trust the printer to scale. Offer
  both as a mode — `accurate` (subtract margins, what the engine does now) and `full-sheet` (tile the
  whole A4, warn that the printer will scale ~96 %). Default `accurate`.
- **Their preview is the map only**; the tile inspector here is better and should be reused, not
  reimplemented.

Constraint: the modal must call the engine, not grow its own tiler. A private copy would be the
**fourth** tarpapel mechanism in this repo, which is exactly the mistake `fd93ba5` made.

- Files: `QuickTarpapelModal.tsx`, `App.tsx` (lazy import), print-panel link, `PublisherContext` flag.
- Done when: a 2400 × 1200 JPG becomes a 6-sheet A4 PDF with no editor visit, and the same image
  through the print panel and through the modal produce byte-identical tiles.

### P1 — one layout model

**1.1 `TarpapelIntent` on the page.** `{ cols, rows, paper, orientation, overlapMm, marginMm, fitMode }`.
`PrintSettings` stays global for everything else, but when the active page carries an intent the print
panel opens pre-filled and the export reads it. Templates ship with it, so "3 × 2 · A4 landscape ·
10 mm" is part of the document, not something a teacher re-derives.

**1.2 Fold the template model back in.** `tarpapelToProject` → `tarpapelToPage`: **one page**, sized by
`tarpapelCanvas(intent)`, elements at absolute positions, no seam hairlines, no `SHEET n` labels, no
per-sheet split. Delete `tarpapelToProject`, `seamMarks`, and the 6-page/4-page output. Keep the spec,
`ASSET_ALIASES`, `withTarpapelTheme` and the layer types — they earned their place.

- Done when: the banner arrives as a single 3292 × 1492 px page; print settings open on 3 × 2 A4 with 10 mm overlap; the gallery thumbnail is unchanged.

**1.3 The canvas follows the intent.** Changing cols/rows/overlap in the panel offers "resize canvas
to match" with the new mm shown before it applies. This is `matchPageToTarpapelRatio` done properly:
it should run when the grid changes, not when the teacher remembers to press it.

### P2 — seam tooling (the part that makes tarpapel feel designed for the job)

**2.1 `seamBands(intent)`** → normalized `x`/`y` intervals where a cut will land, widened by a
`riskMm` (default 3 mm) for glue shift.

**2.2 `checkSeams(page, intent)`** → list of findings, shown in the print panel with "jump to":
- `wordart` or `fontSizePt ≥ 48` intersecting a band → *"`READING CORNER` crosses two seams; glue shift will show on two letters"* (warn, not block — a centred title is a legitimate choice).
- any element ending inside the glue strip → *"the trophy badge stops 2 mm from the seam"*.
- a card/text grid whose pitch straddles a band → *"18 cards at 6 per row puts card 4 on the seam; drop to 5 per row or add a gutter"*.

**2.3 `seamGutter` helper for grids.** `gridAcrossSeams(count, area, bands)` returns positions that
keep ≥ 6 mm clear each side. The word wall's accidental 16 mm gap becomes a property of the layout
function rather than a number I typed.

### P3 — assembly

**3.1 Assembly sheet** appended to the PDF: the grid drawn as rectangles with sheet numbers, arrows
for glue order (right-to-left, bottom-up so each glued edge is covered by the sheet already placed),
final size, and one line of instructions.

**3.2 Test print.** "Print sheet 1 only" — one tile, full trim marks, so a teacher can check colour,
scale and where the seam falls before committing ink to six sheets.

**3.3 Panel honest-y with count and cost.** `8 sheets · 84 × 39 cm · ~8 min assembly`, and a note when
the design is mostly ink-hungry full-bleed.

### P4 — polish

- Landscape/portrait mismatch warning (grid landscape, sheets portrait) with a one-click swap.
- Per-sheet effective overlap: edge tiles are clamped flush (`sx = min(posterW − tileW, …)`), so the
  last column's overlap is *larger* than the setting; report it instead of hiding it.
- "Light ground" theme variant for the banner — a full-bleed tarpapel drinks ink.

## Order and cost

| phase | why first | rough size |
|---|---|---|
| P0.1 ✅ + P0.5 ✅ | teachers were printing amber stripes, and had no door to tile anything at all | shipped |
| P0.2 + P0.3 | the panel still reports 871 mm for an 840 mm poster | one commit |
| P0.4 | the 300 dpi switch currently lies; also removes the OOM | one commit |
| P1.1–1.3 | stops the next template from repeating the 3 cm error | one commit, largest |
| P2 | the difference between "tiling" and "designed to be tiled" | one commit |
| P3 | assembly is where the paper actually gets wasted | one commit |

Recommended start: **P0.1–P0.3 in a single commit**, verified by exporting the banner at 3 × 2 and
checking that (a) no guide pixels appear in the tiles, (b) the panel reports 840 × 388 mm, (c) the
DPI line names a real image.

## Non-goals

- No SVG or true-vector PDF export — jsPDF here rasterises text, and that is a different project.
- No imposition of several documents onto one poster.
- No changes to `pagesPerSheet`, booklet or crop-mark paths; tarpapel stays its own export.
- No new asset packs.
