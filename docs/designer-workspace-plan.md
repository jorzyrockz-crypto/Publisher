# Designer Mode: workspace study and plan

**Status:** Phase 1 in progress — D1 (photos in Visuals) and D10 (format chip) shipped; see §9
**Scope:** move the remaining tools from the Publisher ribbon mental model into the design-first workspace that already exists at `src/components/workspace/Designer*.tsx`.
**Last audited:** master `f4b544b`.

---

## 1. What Microsoft Designer actually is now

Microsoft replaced Designer's legacy visual editor in **October 2025** and, in doing so, *removed* two things people expect: brand kits and stock video. The new editor keeps stock **photos, illustrations and shapes** in one Visuals tab, and folds image work into an "Edit with AI" surface (remove background, erase, upscale, crop/rotate/adjust) [1].

The parts worth copying are structural, not feature-by-feature:

1. **The app opens on intent, not a blank page.** `designer.microsoft.com` leads with a search bar for templates and a three-way split — *Create with AI*, *Edit with AI*, *Design from scratch* (where you first "choose a layout option that matches the size and scope") [1]. The canvas is the second screen, not the first.
2. **A single left rail owns insertion.** Reviewers describe a vertical nav that sets "layouts, graphics, text, style and uploaded material" [2]. There is no second navigation system fighting it.
3. **Selection raises a contextual bar.** "The designer gives several customization choices via the top menu bar when you choose an object on your canvas" [2]. Formatting follows the object; it is never a permanent toolbar.
4. **AI is a resident panel, not a modal.** Suggestions and generation live in a right-hand region and stay available while the canvas is in play [2][3].
5. **Layers are reached through the object, not a separate tool.** You select, then send backward/forward [4]; stacking order is an object property.
6. **The canvas is unobstructed.** Chrome is thin, panels collapse, and nothing permanent is drawn over the artboard.

Our app already implements 1–4 in spirit. The gaps are in the details of each.

Sources:
[1] [Welcome to Microsoft Designer](https://support.microsoft.com/en-us/Designer/welcome-to-microsoft-designer)
[2] [Microsoft Designer UI vs Canva](https://techbehindit.com/software/microsoft-designer/)
[3] [Designer review 2026](https://whataidoineed.com/tool/microsoft-designer)
[4] [Insert visuals / adjust layers](https://www.chatplayground.ai/blog/unlock-your-creativity-with-microsoft-designer-a-complete-guide)

---

## 2. Audit: where Designer mode stands today

Designer mode switches at `App.tsx:103` (ribbon → `QuickAccessToolbar`), `:109` (`PageThumbnails` → `DesignerToolRail`), `:120`. Rail has 7 labelled tabs plus Settings (`DesignerToolRail.tsx:122-128`), a 70px touch-friendly rail and a 268–296px drawer (`:139`).

| Region | What we have | Verdict |
|---|---|---|
| Entry / templates | None. Opens the last document with a splash, then the canvas. Templates live in the Publisher-only *Page Design* tab. | **Missing** — this is the biggest structural gap |
| Top bar | The same `QuickAccessToolbar` as Publisher mode, minus the ribbon: logo, doc name, undo/redo, install, theme, mode toggle, shortcuts, print, PDF | Mixed office/consumer intent |
| Left rail | Edit · Text · My media · Visuals · Brand · Layers · View · Settings | Good shape, thin contents |
| **Visuals** | Filled/line shapes, graphics/icons, illustrations, scenes, QR code, table, "Generate your own" | **No stock photos at all** |
| Stock search | `App.tsx:120` renders `StockArtPanel` only when `workspaceMode !== 'designer'` — Pixabay, Unsplash, museum art, Openclipart are **unreachable from Designer mode** | **Broken by design, fix first** |
| Text | Formats the *selected* text element (`DesignerToolRail.tsx:420`, uses `selectedTextElement`) | No insert presets, no "add text" when nothing is selected |
| My media | Device upload → `addImage` | No library, no recents, no drag-drop |
| Layers | `:84` `setIsLeftPanelOpen(activeDrawer === 'layers')` — it re-opens the Publisher sidebar, which is the pages/layers list at `PageThumbnails.tsx:130-178` | **Wrong surface** — a Publisher panel wearing a Designer label |
| Brand | `DesignerBrandPanel` with layout style + schemes, better than MS's current app | Keep, differentiate |
| View / Settings | Zoom, overlays, masters / theme, grid, guides, snap, reset | Fine |
| Contextual pill | Text format+align, order, group/union, image replace + remove background, shape fill/stroke, delete/duplicate (`DesignerContextBar.tsx`) | Good start, missing position/spacing and an overflow |
| Right rail | `PropertiesPanel` (document setup: page size, margins, brand kit, background, patterns) — has **no `workspaceMode` awareness** | **Mismatch** — Designer's right side should be selection "Adjust/Effects" |
| Resize / format | Page size presets are in *Page Design* (Publisher only) | Missing in Designer |
| AI | `AIImageModal`, Collage, AI Type Studio, Design Ideas, one-click background removal | Scattered across modals |

Net: Designer mode is a convincing *shell* around a Publisher engine. Users can insert shapes and regenerate text, then hit a wall the moment they want a photograph, a layer list, or a different format.

---

## 3. The plan: ten moves

Ordered by leverage. Each lists the real file to touch.

### D1 — Visuals becomes the one search surface (stock + icons + shapes)  ✅ shipped (partial)
Designer's Visuals tab is photos + illustrations + shapes in one grid [1][4]. Ours is shapes only, and stock is disabled in this mode.

* Do: extract `StockArtPanel`'s data layer (sources, keyless-first fallbacks, `TYPING_IDLE_MS` intent search, `SearchSnapshot` 5-min cache) into `src/hooks/useStockSearch.ts`; consume it from both `StockArtPanel` and `DesignerVisualsPanel`.
* Then: filter chips *All · Photos · Illustrations · Icons · Shapes*, with the existing source badges (Pixabay, Unsplash, Openverse, museum, Openclipart) shown as provenance on each tile.
* Change `App.tsx:120` so the standalone panel stays Publisher-only but its **engine** is shared.
* Why first: it closes the "no photographs in design mode" hole and removes the duplicate network cache.
* Risk: medium (refactor). Mitigation: keep `StockArtPanel`'s behaviour byte-identical, verify with the request-count matrix already used for PR #19.

### D2 — A start surface before the canvas
* Do: `DesignerToolRail` gains a **Templates** tab as the first item, backed by the existing template gallery data, filtered by format (Post, Story, Poster, Flyer, Business card, Trifold). Plus an empty-state "Start from scratch" that offers the size picker inline.
* Also: when Designer mode is active and the document is untouched (no elements, no edits), render the start surface over the canvas instead of an empty page.
* Reuses: `Page Design → Templates` data and `BrandBoardModal`'s multi-size logic.
* Why: this is the single most Designer-like behaviour we lack — intent first, canvas second.

### D3 — Text as presets, not a formatting form
* Do: the Text drawer opens with *Add heading / subheading / body / quote / caption* cards (each inserts a pre-styled text element, sized off the page, using brand fonts), then a divider, then the formatting controls for the current selection.
* Reuses: `addTextElement` + brand kit fonts.
* Rule: when nothing is selected the drawer must never show empty formatting controls (today it renders the panel with a `selectedTextElement` guard — that is the failure mode to design out).

### D4 — The pill becomes a real format bar
* Add to `DesignerContextBar`: position/popover (align to page, distribute, spacing), a font-size stepper with a typeface menu, line-height and letter-spacing, and an overflow `⋯` that opens the full inspector section for that element.
* Keep it one row, max ~9 controls, everything else behind overflow — the current pill already respects this discipline; don't break it.

### D5 — Native Layers drawer
* Do: a real list inside the rail drawer — `zIndex`-sorted rows (`PageThumbnails.tsx:178` already sorts this way; move the pattern), thumbnail or type glyph, inline name, eye + lock toggles, drag to reorder, shift-click multi-select, group nesting.
* Keep right-click "send backward" on canvas as the shortcut path [4]; the drawer is for archaeology.
* Remove the `:84` shortcut that re-opens the Publisher sidebar from Designer mode.

### D6 — Right rail becomes "Adjust" in Designer mode
* Do: `PropertiesPanel` takes the mode. In Designer mode, section order is: **selected element** (fill/stroke/text/effects) → **Page** (background, pattern) → **Format** (size, orientation, margins) collapsed → **Brand**.
* Retire the page-setup-first ordering in this mode; it is the clearest remaining "Publisher in a trench coat" moment.

### D7 — My media as a library
* Device upload (exists), strip of recents in this session, "used in this design", drag-drop onto the canvas with a drop ghost, and a paste-from-clipboard handler.
* Persist small thumbnails in IndexedDB (we already store documents there) — not the full image.

### D8 — Edit-with-AI depth
* Respect the same surface Apple/Microsoft converged on: remove background (we have it), erase object, upscale, crop/rotate, filters [1].
* Wire the existing serverless relays; anything unavailable must self-hide per the keyless-first rule rather than showing a dead control.

### D9 — Resident AI entry point
* Put one **Ideas** button (sparkle) in the top bar that opens a right-hand panel exposing what we already built: Design Ideas, AI Type Studio, generate image, restyle with brand scheme. Today those are three separate modals; that fragmentation is why the app "feels heavy".

### D10 — Top bar speaks design  ✅ shipped (partial)
* In Designer mode: editable design name, **format chip** (e.g. `Story · 1080×1920`) that opens a resize popover (D11), Export as the single primary pill, and print/shortcuts demoted into `⋯`.
* Keep the Publisher → Designer toggle where it is (`QuickAccessToolbar.tsx:247-270`) but label it by outcome ("Precision layout" / "Design studio") rather than by internal mode name.

### D11 — Resize
* The format chip drives a size switcher: the 19 existing presets, plus "resize all artboards" reuse from Brand Studio. Designer positions resize as a first-class object attribute; we bury it in a tab that does not exist in this mode.

### D12 — Motion and restraint
* Drawer 180ms slide, pill 140ms scale-in from the selection, insertion ghost, panel collapse ease-out. No bounce, no parallax.
* Collapse `DocumentTabsBar` to a chip when one document is open (design tools show no tab strip until there are two).

---

## 4. Phasing

**Phase 1 — unblock the basics (one PR).** D1, D6, D10-lite (format chip, export pill), D4 (position + overflow).
Exit criteria: from Designer mode a user can search stock photos and insert one, see element properties on the right, and read the artboard size in the top bar.

**Phase 2 — creation flow (one PR).** D2, D3, D5, D7.
Exit criteria: opening a blank document offers templates and formats; text can be inserted without selecting something first; layers can be dragged.

**Phase 3 — AI depth (one or two PRs).** D8, D9, D11.
Exit criteria: one Ideas entry exposes all generated content; a design can be resized without visiting Publisher mode.

**Phase 4 — polish (one PR).** D12 plus a token sweep. The six Designer files carry 398 hex literals; most are legitimate *content* colour (Brand schemes, shape palettes, document swatches) and must stay. The *chrome* hexes must go: `DesignerToolRail.tsx`'s `pillToggle` and drawer surfaces (`#efeafd`, `#d3c9f9`, `#5c4bb8`, `#e5e9ee`, `#f8fafb`, `#4a5661`), plus the equivalent rail/pill hexes in `DesignerContextBar.tsx` and `DesignerSettingsPanel.tsx`.

Every phase: `tsc -b` clean, `oxlint` no new warnings, `vite build` ✓, `wordart:css --check` unchanged, and a dark-mode pass (Designer files use raw hexes today, so dark mode is currently handled by the legacy `html.dark .bg-*` selectors — moving to tokens removes that dependency, which is the same bug class fixed in #20).

---

## 5. Design-language guardrails

* **Tokens only.** No new hexes in Designer files; use `bg-surface`, `text-ink`, `border-line`, `accent-*` so dark mode keeps working for free.
* **Geometry.** 70px rail (labels under icons), 268px default drawer / 296px for media-heavy drawers, 8px outer padding, 4px internal grid, radius 12 for rail items and 8 for controls.
* **Type.** 10–13px only (the existing scale), medium weight for controls, one accent colour for active state.
* **Density.** One rail, one drawer, one contextual bar, one right panel. Never two of the same kind visible.
* **Touch parity.** Anything added must be reachable at 44px minimum and not depend on hover.
* **No feature loss.** Publisher mode keeps every precision tool — bleed, crop marks, mail merge, rulers, master pages. Designer mode is a different door into the same document, not a reduced app.

---

## 6. Deliberate non-goals

* **Do not remove Brand Studio** to mirror Microsoft's deprecation of brand kits [1] — ours is better and it is the reason a Publisher-shaped app can do design work.
* **Do not port precision tools into Designer mode.** Rulers, guides as first-class objects, bleed and crop marks stay in Publisher mode; Designer shows grid/snap as overlays only.
* **No stock video, no sticker store, no templates marketplace.**
* **No second navigation paradigm.** If a tool doesn't fit the rail, it goes in the pill's overflow or the right panel — not in a new bar.

---

## 7. How we verify without a browser

This sandbox has no headless browser, so verification is structural plus one human pass:

1. **Build gates** per phase (above).
2. **Request-count matrix** for D1 in both modes: type `c` → 0 requests, `ca` → 0, pause → 1 batch, Enter → 1, retype within 5 min → 0, empty → 0.
3. **Static layout asserts**: grep that no Designer file imports `StockArtPanel` directly (engine only), that `App.tsx` no longer gates stock on mode, that `DesignerToolRail` imports the new `LayersPanel`.
4. **Human pass on Vercel preview**: dark mode, narrow viewport (<1024), touch emulation for the pill, and a photo inserted from Pixabay in Designer mode. Two screenshots to the user at the end of each phase.

---

## 8. Open questions

1. Should **Designer mode become the default** for new documents (Publisher available from the toggle), or stay opt-in? Today `workspaceMode` defaults to publisher.
2. For D2, do we want a **true in-app start screen** (a route state before the canvas) or a lighter first-run overlay on an empty document? The overlay is cheaper and avoids touching routing.
3. Is **stock video** wanted eventually, given Microsoft removed it? (Current recommendation: no.)
4. For D8, which AI edit operations are acceptable cost-wise: erase/upscale through the existing relays, or only background removal for now?

---

## 9. Shipped so far

### Photos in Visuals (D1, partial)

`src/utils/photoSearch.ts` is a thin aggregate over the four photo sources — Pixabay,
Unsplash, Openverse and public-domain museum art — returning a common `PhotoHit` whose
`insert()` resolves a data URL at insert width. It searches all four in parallel with
`Promise.allSettled`, so a missing key costs one source, not the grid, and reports
`failures` explicitly instead of showing a quietly empty panel.

`src/components/workspace/DesignerPhotoSection.tsx` renders it at the top of the Visuals
drawer: 500 ms intent debounce, 2-character minimum, five-minute cache (24 entries,
oldest evicted), skeletons while loading, per-tile insert spinner, and a "Suggested"
grid (`abstract`) before the user types anything. It is tokenised — no raw hexes — so it
follows dark mode without touching the legacy `.bg-white` overrides.

**Deviation from the plan:** D1 originally proposed extracting `StockArtPanel`'s entire
state machine into `useStockSearch`. That component is 1,980 lines and carries key
management, connection diagnostics, paging and source chips that Visuals does not need;
rewriting it in one step was all risk and no user-visible gain. The shared *engine* is
what mattered, so the aggregate landed first. `StockArtPanel` still owns its own state
and is unchanged. Revisit the extraction only if the two diverge.

### Format chip (D10 + D11, partial)

`src/components/workspace/DesignerFormatChip.tsx` sits in the top bar in Designer mode:
artboard dimensions read live from `activePage`, a portrait/landscape toggle, and the
full preset list with in-place resize. Dimensions render in inches for inch-based
presets and in pixels for social sizes (816 px → `8.5″`, 1080 px → `1080 × 1080 px`),
because calling a phone asset "11.25 inches" is the kind of detail that makes a design
tool feel wrong.

### Still open in Phase 1
* D6 — the inspector still leads with page setup when nothing is selected.
* D4 — no position/spacing in the contextual pill, no overflow menu.
* D2/D3/D5/D7 — untouched (Phase 2).

## Moving papers on the artboard

A paper is dragged by the pill above its top-left corner. Two things went wrong there and are now
accounted for:

* **The pill was clipped off the viewport when zoomed out.** It was laid out in unscaled pixels above
  a paper whose screen offset shrinks with the zoom, so at 20% a paper at y = 80 sat 16 px down and a
  24 px handle above it started at −6 px — outside the scroll area, unreachable. The handle is now
  positioned instead of flowed, and rides up over the paper's top edge when there is no room above
  it, so a paper can always be grabbed.
* **Papers did not snap.** They do now: edges and centres pull to every other paper's edges and
  centres (and to the artboard origin), with a violet hairline showing what it snapped to. The pull
  radius is `8 / zoom` — eight *screen* pixels — for the same reason element snapping is now
  `6 / zoom`: a fixed radius in page pixels shrinks to nothing as you zoom out (at 20% it was
  1.2 screen pixels, i.e. it looked broken).
* **The pasteboard ended at the top-left corner.** Dragging was clamped at x = 20, y = 36, so a
  paper could never be parked above or left of its starting place — the canvas felt walled in. The
  clamps are gone; the artboard is drawn from an origin 360 px outside the papers' bounding box, so
  there is always pasteboard to drag into, and the origin grows as a carried paper approaches it.
  Growing the origin moves every paper the other way on screen, so the scroll travels with it —
  otherwise the paper under your cursor would stop dead, which is the same complaint in a new suit.
* **The handle said too much.** At 20% a paper is a postage stamp and the pill above it — page
  number, page name and a size badge — is bigger than the paper. Below 45% it collapses to a grip
  and a number; at any zoom only the **active** paper shows its name, size and menu.

## Which view a document opens in

The default view follows the papers. One paper opens as a fitted single page — that is what people
open a document to look at. Two or more papers open **Freeform**, because Single view shows one paper
and quietly hides the others, which reads as "the canvas only has one page".

An explicit choice from the view control wins, per document: pick Single and it stays Single, even
when you add pages. Choices are remembered per document, so switching tabs restores each one's view.
The mode is labelled *Freeform* everywhere now, not "Artboard" — the papers are the canvas.
