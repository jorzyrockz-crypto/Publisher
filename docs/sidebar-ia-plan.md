# Sidebar IA: Media, Stock Art and Collage

**Status:** P2 (Collage drawer) shipped; P1/P3/P4 still plan
**Audited:** master `a01cb74`
**Requested:** move Collage and Stock Art into the sidebar as their own tools, because My media should be only the user's uploaded media.

---

## 1. What is actually there now

The Designer rail has eight destinations (`DesignerToolRail.tsx:36`). The `media` one is doing far too much:

| Rail item | What it actually contains |
|---|---|
| Edit | Page & canvas, page size, orientation, background |
| Text | Add heading/subheading/body, text & WordArt styles |
| **My media** | "Upload from device" + a 3-up row (**Frame**, **AI Image**, **Collage**) + `<StockArtPanel embedded />` filling the rest of the drawer |
| Visuals | Generate-your-own, shapes, graphics/icons, illustrations, scenes, QR, table — plus the **Photos** strip added in #21 |
| Brand / Layers / View / Settings | as labelled |

Two facts worth naming before planning:

1. **Stock Art is already in the sidebar.** `StockArtPanel` takes an `embedded` prop (`StockArtPanel.tsx:268`) and Designer renders it inside My media. It is not missing, it is mislabelled — a user looking for stock photos has no reason to open something called "My media".
2. **Collage is a modal with a 3-up thumbnail button as its only Designer entry.** The full builder is `CollageModal` (2,340 lines, 18 layouts, Vibe Packs, BorderArt frames) and it owns its own insertion path.

So "move Collage and Stock Art into the sidebar" is really: **give each job a drawer, and let My media be a media library.**

---

## 2. Target sidebar

```
 ┌──────┬──────────────────────┐
 │ Edit │                      │
 │ Text │   drawer (context)   │
 │ Media│   268–320 px         │
 │ Stock│                      │
 │Visual│      canvas          │
 │Collag│                      │
 │ Brand│                      │
 │Layers│                      │
 │ ⚙ Set│                      │
 └──────┴──────────────────────┘
```

| Drawer | Owns | Contents |
|---|---|---|
| **Media** | Uploaded user media, nothing else | Primary "Upload from device" (full width), drop zone, uploaded grid with "recent" and "used in this design" filters, empty state that explains the difference from Stock |
| **Stock** | Third-party imagery | `<StockArtPanel embedded />` unchanged: Pixabay, Unsplash, Openverse, museum, Openclipart, Iconify, Wikimedia, Clipart.Free, filters, keys, credits |
| **Visuals** | Vector + generated elements | Shapes, lines, graphics/icons, illustration scenes, table, QR, "Generate your own" |
| **Collage** | Composition | 18 `COLLAGE_LAYOUTS` as thumbnails, "Collage from selection", "Open full builder →" the existing modal |
| Everything else | unchanged | Edit, Text, Brand, Layers, Settings |

Nine rail items including Settings. That is the ceiling — at 10 the rail starts overflowing 700px-tall windows (see §5).

---

## 3. Responsibility matrix

| Thing | Today | After |
|---|---|---|
| User upload | My media (inserts immediately, no library) | **Media** (library + insert) |
| Stock photo | My media → embedded panel + Visuals → Photos strip | **Stock** |
| Vectors / icons | My media → embedded panel | **Stock** |
| Shape / line / table / QR | Visuals | Visuals |
| Illustration scenes | Visuals | Visuals |
| AI generation | Visuals ("Generate your own") + My media button | Visuals |
| Picture frame placeholder | My media | Visuals |
| Collage | My media button + Insert ribbon | **Collage** |
| View & display | View drawer | Settings (merged) |

The principle: **one drawer per intent.** Media is "my stuff", Stock is "their stuff", Visuals is "things that are not images", Collage is "composition".

---

## 4. Phases

### P1 — Split Media from Stock *(the ask, smallest diff)*
* `DesignerDrawerTab` gains `'stock'`; rail order becomes Edit, Text, **Media**, **Stock**, Visuals, Collage, Brand, Layers, Settings.
* My media drawer loses `<StockArtPanel embedded />`, the Collage button and the AI Image button. It keeps Upload and gains a real uploaded list.
* New `DesignerMediaPanel.tsx` to keep `DesignerToolRail` from growing: upload button, drop target, session library grid, and an empty state that says *"Your uploads live here. Looking for photos you didn't shoot? Open Stock."*
* Frame + AI Image move to Visuals (both are inserts, not media).
* Files: `DesignerToolRail.tsx`, new `DesignerMediaPanel.tsx`, `DesignerVisualsPanel.tsx`. `StockArtPanel` untouched — its `embedded` prop already fits the drawer.
* Risk: `StockArtPanel` has its own resizer (`useResizablePanel`, min 260). In the drawer it must render at the drawer width without a drag handle; the `embedded` prop already gates that today, so keep using it and verify the handle is absent.

### P2 — Collage as a drawer  ✅ shipped (see §9)
* New `DesignerCollagePanel.tsx`: grid of `COLLAGE_LAYOUTS` thumbnails (`utils/collageLayouts.ts`), a "From selection" row that appears when one or more images are selected, and a footer button opening the full builder.
* Cheap version (2a): every tile opens `CollageModal` with that layout preselected via `initialMeta` — no insertion logic duplicated.
* Better version (2b): tiles insert directly. That needs the modal's insertion path (groupId `grp-collage-*`, slots, backdrop) extracted into a context action `insertCollage(layoutId, images, style)`. This is a genuine refactor of a 2,340-line file and should be its own PR with its own review, not smuggled into the IA change.
* **Recommendation:** ship 2a now, schedule 2b only if the modal round-trip annoys you in practice.

### P3 — Visuals stops being a photo browser
* Remove `DesignerPhotoSection` from Visuals. It was the stopgap that unblocked Designer mode in #21; now Stock owns imagery, and two independent photo caches would mean two request sets and two sets of results for the same query.
* `utils/photoSearch.ts` and `DesignerPhotoSection.tsx` stay in the tree — Stock's embedded panel does not use them, so decision: keep the aggregate for the *Stock drawer's* "Photos" tab, or delete and let `StockArtPanel` own search entirely. **Recommend deleting `DesignerPhotoSection` and keeping `photoSearch.ts` only if Pilot Stock gets a compact mode; otherwise delete both.** Leaving dead code is how "feels heavy" starts.

### P4 — Rail economics
* Merge View into Settings as a "View & display" section (zoom, overlays, master background), keeping `DesignerViewPanel`'s markup as a section component rather than a drawer.
* Rail scrolls when the viewport is short; below 640px of height the labels hide and icons carry `title` + `aria-label`.
* `Alt+1…9` opens the matching drawer; the last drawer per workspace mode is remembered.

### P5 — Media library persistence *(optional, later)*
* Uploaded images currently insert and vanish. Store thumbnails (not full images) in IndexedDB — the document store already exists — with a "used in this design" flag derived from element sources.

---

## 5. Does the rail fit nine items?

Current rail item: `min-h-[50px]` + `gap-1.5` (6px) → 56px per item.

| Items | Height | Fits 800px window | Fits 700px | Fits 640px |
|---|---|---|---|---|
| 9 (target) | 504 + settings 56 + padding 20 = **580px** | yes | yes | tight |
| 10 | 636px | yes | no | no |

So nine is not a taste decision, it is the limit before compaction. Hence merging View into Settings rather than adding a tenth.

---

## 6. Performance note

`StockArtPanel` is mounted only while its drawer is open, so its `SearchSnapshot` cache dies on close and the next open costs fresh requests. Two fixes, in order of preference:

1. **Keep-alive:** after the first open, keep the drawer mounted with `display:none` so state, keys and results survive. One panel, small memory cost, instant reopen.
2. Hoist the snapshot cache to module scope, like `photoSearch`'s consumers do.

Prefer (1): it also preserves scroll position and the active source chip, which is what makes a tool feel fast.

---

## 7. Acceptance criteria

**P1:** Designer mode → Media shows only uploads (no stock grid, no collage button); Stock is its own rail item and searches Pixabay/Unsplash/museum/Openverse on the same intent debounce; closing and reopening Stock keeps the previous query and results (keep-alive). Dark mode clean in both.
**P2:** Collage rail item shows 18 layouts; clicking one opens the builder on that layout; "from selection" is disabled with a reason when nothing is selected.
**P3:** Exactly one photo search surface exists in Designer mode — grep for `DesignerPhotoSection` returns nothing under `src/`.
**P4:** At 1366×768 and 1280×720 the rail never clips the Settings button.

---

## 8. Open questions

1. **Collage tiles:** open the builder (2a) or insert instantly (2b)? I recommend 2a for this PR and revisit with real use.
2. **Merge View into Settings** — acceptable, or keep View as its own drawer and drop something else instead?
3. **AI generation home:** it sits in Visuals today. Designer puts "Create with AI" at the top level of the app. Does it deserve its own drawer eventually, or stay in Visuals?
4. **Publisher mode:** should it gain the same Stock entry point, or keep the right-hand panel it has now? (Current recommendation: keep — precision users expect a persistent panel.)

---

## 9. Shipped: Collage drawer

`DesignerCollagePanel` is a real panel, not a door to the modal. It reuses the builder's
own maths and conventions so its output is indistinguishable downstream:

* `computeCollageSlots` from `utils/collageLayouts` — the same slot geometry the builder
  uses, so spacing and layout behaviour match.
* `groupId = grp-collage-*` — the convention `PageThumbnails` already recognises, so the
  Layers list labels the result "Collage".
* `addElementsBatch` — which also selects the new elements, so the collage can be moved
  or restyled straight away.

What the panel does: photo tray (device upload, "use selection", "use page images"),
18 layout thumbnails rendered from their own slot geometry, spacing and corner sliders,
an optional backdrop card, and an insert button that names what it will do — "Insert 4
empty frames" when there are no photos yet, "Insert collage · 2/4 filled" otherwise.

What stays in the builder, because a 296 px drawer cannot hold it: Vibe Packs, BorderArt
frames, per-slot masks, scatter tilt, stickers, per-slot crop. The footer keeps a door to
it.

Deviation from §4: the plan's 2a (tiles open the builder) became a simplified direct
insert (2b-lite). Duplication is limited to element *assembly* — ~40 lines — while the
layout maths and group convention stay shared, so the two paths cannot drift
geometrically.

Two other changes:
* The Collage button is gone from My media's 3-up; the rail owns it now (grid is 2-up).
* `DesignerCollagePanel` is `React.lazy`: the layout catalogue is ~20 kB that the editor
  shell should not pay for. Main bundle 523.70 kB → 523.78 kB; the drawer is an 8.27 kB
  chunk loaded on first open.

Still open: P1 (split Media from Stock), P3 (drop the Photos strip from Visuals), P4
(merge View into Settings, `Alt+1…9`).
