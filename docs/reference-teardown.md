# Teardown: `publisher_studio.html` (reference prototype)

One 100 KB file, 2,798 lines, no build step: Inter + Playfair Display, a 3-column
studio layout, localStorage persistence, and `html2canvas` for a 2× PNG.
It is a *single-page poster tool*, not a multi-page document studio — which is
most of why it feels light. What we can take from it is a **visual language** and
**four features**, not its architecture.

---

## 1. Why it feels light (and what that costs)

| | Reference | StudioPress today |
| --- | --- | --- |
| Chrome colours | 8 CSS variables (`--bg`, `--panel`, `--line`, `--ink`, `--muted`, `--teal`, `--teal2`, `--shadow`) | **258 distinct hex values** in TSX |
| Brand colour | one teal family (`#087f83` + tint `#e5f4f3`) | **five purples**: `#5c4bb8` (351 uses), `#6e56cf` (213), `#efeafd` (145), `#d3c9f9` (111), `#4f46e5` (56) |
| Type scale | integers 9→16 px, base 13 px | **ten half-pixel sizes**: 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5 px |
| Radii | 6 / 7 / 8 / 9 / 10 / 99 | 8 (110×), 6 (42×), 5, 12, 15, 3, 4, 7 |
| Shadow | one soft shadow `0 8px 28px #1c2c3a12` | several ad-hoc |
| Top chrome | one 58 px bar | tabs bar + ribbon (`min-h-[80px]`) + 34 px status bar |
| Feedback | toast | silent (status bar only) |
| Persistence | localStorage autosave + projects + assets | IndexedDB document store, tabs, mirror |

**Diagnosis.** The "weight" is not what it prints — it is:

1. **Five purples that are meant to be one.** `#5c4bb8` and `#6e56cf` are visually
   indistinguishable at 10 px, but they sit next to each other in the same panel,
   so nothing reads as *the* accent.
2. **Sub-pixel type.** 10 vs 10.5 vs 11 px in the same card means no clear
   hierarchy — everything looks equally small and equally important.
3. **Candy accents** (`#f59e0b` amber, `#38bdf8` sky) competing with the brand.
4. **Stacked chrome**: tabs bar + 80 px ribbon + status bar leaves less canvas.

**Feasibility: yes, and it is not a rewrite.** It is a token pass:

```
--sp-accent:      #5c4bb8   (one accent; #6e56cf/#4f46e5 collapse into it)
--sp-accent-tint: #efeafd   (replaces #f4f2ff)
--sp-accent-line: #d3c9f9
--sp-ink / --sp-muted / --sp-line / --sp-bg / --sp-panel   (already #0f172a / #6a7682 / #e5e9ee / #f3f5f7 / #fff)
type:  9 / 10 / 11 / 12 px only (drop the .5 steps)
radii: 6 / 8 px only
shadow: one soft elevation token
```

Caveat worth stating plainly: **I cannot see the app** in this environment (no
headless browser), so a visual pass has to be verified by you on the preview.
That argues for phases, not one big blind diff — and for piloting on one surface
first (the Stock Art panel is the obvious pilot: it is small, I know it, and it
uses the worst of the type scale today).

---

## 2. What the reference actually contains

**Layout** — 58 px top bar (brand mark, inline-editable doc name, undo/redo, zoom,
export, preview) · left rail (nav) · centre canvas with rulers-free centred poster
and alignment guides · right inspector with tabs (Format / Effects / Layers) ·
34 px status bar.

**Data** — 8 background presets, 6–8 named palettes, 4 templates, 3 custom shapes,
3 background effects, localStorage keys for autosave / projects / assets.

**Feature list** (function-level, extracted):

undo/redo + history · autosave + restore · inline document rename · zoom
(+ / − / fit) · page sizes · alignment guides toggle · selectable text and shapes
· draggable custom elements with drag handlers · layers list with visibility and
reorder · inspector tabs · text formatting (size/weight/align/colour/tracking) ·
shape formatting · semantic palettes · schoolmark symbol (crest + size) ·
background library (8 scenes, categories) · background upload · logo/asset library
with reuse · 4 poster templates · named projects with recent label · full-screen
preview lightbox · print-specific CSS → PDF · 2× PNG via html2canvas · toast ·
keyboard: Esc closes overlays, Ctrl/⌘+Z, Ctrl/⌘+Shift+Z, Ctrl/⌘+Y.

---

## 3. Mapping: have / better / missing

| Reference feature | StudioPress | Verdict |
| --- | --- | --- |
| Undo/redo | present | keep ours |
| Autosave | IndexedDB + mirror + size in status bar | **ours is better** |
| Named projects + recent | Backstage + document tabs | **ours is better** |
| Templates | `designBlueprints` + certificate/program template constants | **ours is far richer** |
| 2× PNG via html2canvas | native canvas renderer at high DPI, plus PDF | **do not port** (html2canvas is slower and lower fidelity) |
| Print CSS → PDF | `pdfExport` + `printUtils` | keep ours |
| Schoolmark symbol | brand kits | **ours is better** |
| Alignment guides | `snapping.ts` | keep ours |
| Text/shape formatting | ribbon + PropertiesPanel | keep ours |
| **Semantic palettes** (title/accent/body/border roles) | maths exists in `documentPalette.ts`, **no UI** | **salvage — add the picker** |
| **Procedural scenic backgrounds** (clip-path mountains, gradient sky, blur/overlay/scene-opacity) | `patternGenerator.ts` makes patterns, **no scenes** | **salvage — biggest visual win per line** |
| **Full-screen preview lightbox** | none (`lightbox` appears only as a word in Backstage) | **salvage** |
| **Toast feedback** | none | **salvage (small)** |
| Layers panel | no dedicated list (layers exist in state) | consider later |
| Badge / divider / frame shapes | `shapePaths.ts` + `pathGeometry.ts` | already covered |
| Background library with categories | Insert tab patterns/frames | partially covered |

---

## 4. Salvage ranking

1. **Procedural scenic backgrounds** — pure CSS/SVG, zero asset weight, and it
   solves a real gap: our certificates/posters have flat or patterned backdrops
   but no *depth*. Reference recipe: gradient sky + two clip-path ridges +
   radial glow + `filter: blur()` + overlay opacity + scene opacity. ~1 utility
   module + a picker row; testable as pure string output.
2. **Semantic palette picker** — we already compute palettes and contrast; only
   the surface is missing. Recolours by role (title/accent/body/border), which is
   what makes the reference's posters look designed rather than assembled.
3. **Full-screen preview lightbox** — cheap, and it makes exports trustworthy:
   see the page without chrome or selection handles, Esc/←/→ to navigate.
4. **Toast feedback** — replaces silence after actions like "stock art inserted",
   "key copied", "export finished".
5. Layers panel — defer; it changes interaction model, not chrome.

---

## 5. Proposed order of work

| Phase | Scope | Risk | Verification |
| --- | --- | --- | --- |
| A | Scenic background generator + picker | low (new module) | unit tests on generated SVG/CSS + your eyes |
| B | Palette picker (role-based) | low–medium | unit tests on role mapping + your eyes |
| C | Preview lightbox + toasts | low | build + your eyes |
| D | Token pass: collapse purples, round type scale, one shadow | medium, wide diff | your eyes on preview, page by page |

Do A–C first: they add capability without touching existing surfaces. D is the
"feel" change and should land last, in slices (Stock Art panel → ribbon → modals
→ canvas chrome), so any regression is obvious and local.

### Phase D pilot — Stock Art panel (done)

Finding worth recording: **the design system already existed and nothing used it.**
`src/index.css` defines `--sp-accent`, `--sp-ink-*`, `--sp-line`, `--sp-surface*`
with documented contrast ratios, and `grep` found **zero** component references to
any `var(--sp-*)`. Every component re-derived its own hex — which is exactly how
`#5c4bb8` and `#6e56cf` both ended up as "the accent".

The fix is a binding, not a rewrite: an `@theme inline` block maps `--sp-*` onto
Tailwind names (`text-accent-ink`, `bg-surface`, `border-line`), adds a 4-step
integer type scale (`text-2xs/meta/body/lead`), two radii (`chip`, `tile`) and one
shadow (`elevated`). Because the utilities point at the variables, a colour change
is now one line in `:root`.

Pilot result on `StockArtPanel.tsx`:

| | before | after |
| --- | --- | --- |
| distinct hex values | 15 | **1** (a canvas argument, not a class) |
| font sizes | 6 (8, 9, 9.5, 10, 10.5, 11 px) | **4** (10, 11, 12, 13) |
| radii | 5–15 px, mixed | **2** (6, 8) |
| source badges | 9 pastel variants | 1 neutral chip (the label already names the source) |
| `slate-*` + custom neutrals | mixed in one file | one neutral ramp |
| header / card padding | 3.5 / 2 | 4 / 2.5 |

Roll-out order for the rest: ribbon → modals → canvas chrome → status bar, one
surface per commit so a regression is local.

---

## 6. Things in the reference we should *not* copy

- **localStorage as the document store** — we outgrew that (5 MB cap; hence our
  IndexedDB + mirror design).
- **`html2canvas`** — we already rasterise natively at higher fidelity.
- **Inner-HTML string rendering** (`renderAll()` rebuilds DOM) — our React state
  + canvas renderer is why the same document exports identically to PNG and PDF.
- **A single-page model** — ours is multi-page, and the template library assumes it.
