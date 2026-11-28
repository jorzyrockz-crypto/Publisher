# Collage controls on the canvas — plan

**Goal.** Select a collage on the page and the workspace toolbar becomes *that collage's*
toolbar. Single-function buttons act immediately. Buttons that are really a picker (vibe
packs, layouts, photos) open the edit context panel instead. The builder modal stays for
deep work — per-slot crops, shapes, stickers — not for things you can see and want to
change in one click.

**The rule that decides direct vs nested:** does the button need a *choice*?
- One click, one known outcome → direct. `Spacing +`, `Shuffle layout`, `Re-fit photos`.
- Needs a value to be picked → nested. Vibe packs, layout catalogue, backdrop colours,
  border art, aspect ratio.

Experimental: the nested routing (part 2). Everything in part 1 ships without it.

---

## Why this is affordable now

Three pieces already exist and are unused from the toolbar:

1. **`replaceCollageGroup(nextElements, groupId, elementId)`** — in `PublisherContext`.
   Swaps a collage's elements in one commit, keeping z-order, and **sets the selection to
   the new elements**. That last part matters more than it looks: a toolbar that loses
   its selection after every click is a toolbar you can only use once.
2. **`CollageMeta` is self-contained** (`src/utils/borderArtStyles.ts`): layout id, aspect,
   vibe pack, global style, backdrop, stickers, and `slots[]` each carrying `imageUrl`,
   `naturalWidth`, `naturalHeight`, `cropX`, `cropY`, `zoom`, rotation, flips and style
   overrides. That is everything the save routine needs — no modal state required.
3. **`computeCollageSlots` / `resolveCollageLayout`** already take meta + photo dims.

The gap is only that the "meta → elements" build lives *inside* `CollageModal`'s save
handler, so nothing outside the modal can apply a change.

---

## Part 0 — The one piece of infrastructure

### 0.1 Extract the builder (`src/utils/collageBuild.ts`)

Move the body of the modal's save routine into a pure function:

```ts
export function buildCollageElements(opts: {
  meta: CollageMeta;
  origin: { x: number; y: number };
  page: { width: number; height: number; margins: Margins };
  /** Slot photo dims; falls back to 1:1 when a slot's natural size is unknown. */
  photoDims?: Array<{ width?: number; height?: number }>;
}): PublisherElement[]
```

The modal then *calls* it instead of owning it. This is the whole safety story: if the
modal and the toolbar built elements two different ways, the same collage would look
different depending on which door you came in. One builder, two callers.

Return `photoDims` defaulted from `meta.slots[].naturalWidth/naturalHeight`; slots without
dims get `1:1`, which is what the modal already produces for a missing photo.

### 0.2 Context API

```ts
// stable identity for "this collage", independent of selection order
patchCollageMeta: (groupId: string, nextMeta: CollageMeta) => void;   // build + replaceCollageGroup
```

`patchCollageMeta` reads the current group's bounding origin from the page (min x/min y of
members) so **patching never moves the collage**. Only the two calls that are *supposed*
to re-flow (layout change, aspect change) recompute origin from the new canvas dims.

### 0.3 Selection → collage (`src/hooks/useCollageSelection.ts`)

```ts
useCollageSelection(): {
  groupId: string;
  meta: CollageMeta;
  memberCount: number;
  origin: { x: number; y: number };
} | null
```

Returns non-null when: every selected element shares one `groupId`, that id starts with
`grp-collage-`, and exactly one member carries `collageMeta`. Strays (a single slot selected,
mixed selection, a non-collage group) return `null` so the generic object toolbar shows
instead. No `collageMeta` on a member → treat as legacy collage, offer "Edit…" only.

---

## Part 1 — The toolbar (direct wiring)

One component, `src/components/canvas/CollageActionBar.tsx`, rendered by **both**
`SelectionToolbar` (Publisher mode) and `DesignerContextBar` (Designer mode) when
`useCollageSelection()` is non-null. It replaces the generic object toolbar in that case —
align/group on a collage you can't meaningfully align is noise.

| Button | Class | Patch |
|---|---|---|
| `Spacing −` / `+` | direct | `globalStyle.gap ∓ 2`, clamped 0–40 |
| `Corners −` / `+` | direct | `globalStyle.cornerRadius ∓ 2`, clamped 0–48 |
| `Shuffle layout` | direct | next preset from `pickCollageLayoutForCount(nSlots)` |
| `Shuffle photos` | direct | permute `slots[].imageUrl` — layout and framing untouched |
| `Re-fit photos` | direct | reset every slot's `cropX/cropY/zoom` to 0/0/1 |
| `Backdrop` | direct | toggle `backdrop.type` between `none` and last used |
| `Edit…` | direct | `openCollageEditor(...)` — the modal, for deep work |

Every one of those is a single known outcome, so none of them needs a panel.

**Deliberately absent:** per-photo framing. Pan/zoom on a filled slot already exists as a
canvas gesture (double-click a slot). A second surface for the same job is the thing this
project keeps having to undo.

**Spacing and corner steppers, not sliders.** Each click is one `commitCurrentElements`,
so each click is one undo step. A live slider would write a history entry per animation
frame; if a slider is wanted later it has to use the `transient` commit path.

---

## Part 2 — Nested controls (experimental)

Routing one call from either mode:

```ts
openCollageControl(section: 'vibes' | 'layouts' | 'photos' | 'backdrop' | 'frame' | 'aspect'): void
```

- **Publisher mode** → open the right inspector on a Collage tab, scrolled to `section`.
- **Designer mode** → open the Collage rail drawer, scrolled to `section`.

Both need a `collagePanelSection` field in context, because the Designer drawer's open
state is local to `DesignerToolRail` today — the rail will need to react to the signal.

Order of work, first one is the requested experiment:

1. **Vibe packs** — the panel renders `COLLAGE_VIBE_PACKS` as a small grid of swatches;
   clicking one calls `patchCollageMeta` with the pack applied (reuse the modal's
   `handleApplyVibePack` body, which already exists and already keeps slots put).
2. **Layouts** — the preset grid from `DesignerCollagePanel`, sharing `pickCollageLayoutForCount`.
3. **Photos** — the tray (insert/replace/remove), reusing the count-driven resolution.
4. **Backdrop / frame / aspect** — the inspector sections, moved rather than rewritten.

Guard: `COLLAGE_PANEL_SECTIONS_ENABLED = true` in one place, so the experiment can be
switched off without touching the direct buttons.

---

## Invariants this must not break

- **Restyle never moves the collage.** Origin comes from the existing group bounds.
  Only layout and aspect changes re-flow, which is the user-stated rule.
- **Selection survives a patch.** `replaceCollageGroup` already reselects the new elements;
  the bar reads selection, so it must keep rendering after a click.
- **One click, one undo entry.** Verified per button.
- **The modal and the toolbar cannot disagree** — same builder (0.1).
- **No duplicated canvas gestures** — no second framing surface.
- **Cost per patch:** O(slots) builds; memoise on `meta` identity, and keep the panel lazy
  (the collage drawer is already `React.lazy`).

---

## Slices (each independently shippable)

| Slice | Contents | Proof |
|---|---|---|
| **A** | 0.1 builder extraction + 0.2 `patchCollageMeta` + 0.3 hook + **Spacing ±** only | select a collage, click `+`, gap changes on the page, origin unmoved, selection kept, one undo step |
| **B** | remaining direct buttons (corners, shuffle layout, shuffle photos, re-fit, backdrop toggle) | each asserted against element geometry/colors in a DOM run |
| **C** | 2.1 vibe packs through the context panel, behind the flag | select → Vibe → pick → collage restyles, slots stay put |
| **D** | 2.2–2.4 layouts/photos/backdrop; then delete the now-duplicated controls from the modal | modal slims to deep edit only |

Slice A is the whole proof of concept: if patching from the page works with the selection
intact and the collage not moving, the other buttons are a table of small deltas.

---

## Verification harness

jsdom has no layout, so canvas clicks cannot be hit-tested — the harness drives the app the
same way the Group/Ungroup work was proven:

1. Insert a collage through the modal (existing path).
2. Select its members via the Layers panel (`[draggable="true"]` rows, ctrl-click).
3. Click the toolbar button by accessible label.
4. Assert on the page's elements: `gap` changed, `x`/`y` of the group origin unchanged,
   `selectedElementIds` still covers the group, one undo step.

Plus the standing gates: `tsc -b`, `oxlint` (0 errors / 37 warnings baseline), `vite build`.
