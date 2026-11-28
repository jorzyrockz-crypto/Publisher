# Text controls on the canvas toolbar — plan

**Goal.** Select text and the workspace toolbar becomes *that text's* toolbar. The one-click
controls stay on the bar. The controls that are really a *picker* — the font, the text colour —
stop trying to be a picker inside a floating pill and open their full control in the edit panel
instead. The bar becomes a row of entry points that say what they will open, and the panel
shows the thing you came for.

This is the same rule the collage bar already runs on, and it fixes the same symptom: a
`<select>` and a colour popover crammed into a pill that has to scroll horizontally to fit them.

**The rule that decides direct vs nested:** does the button need a *choice*?
- One click, one known outcome → **direct** on the bar.
- Needs a value to be picked → **nested**: the button opens its section in the edit panel.

---

## 1. What the text bar does today

`src/components/workspace/DesignerContextBar.tsx`, the `isSingleText` block:

| control | today | verdict |
|---|---|---|
| text colour | `ColorInput` — popover with swatches + hex | **misfiled**: a picker in a pill. Nested. |
| font family | `<select>` of 8 `QUICK_FONTS` | **misfiled**, and lossy: the app has `SYSTEM_FONTS` + a Google Fonts catalog and this offers neither. Nested. |
| font size | − / value / + steppers | direct, keep |
| bold / italic / underline | toggles | direct, keep |
| alignment | click-to-cycle left → centre → right | direct, keep (and add the panel as the place to pick justify/vertical) |

Everything else that text can do — tracking, leading, case, columns, stroke, shadow, effects —
lives only in the inspector's Typography card today, reachable by opening the inspector and
finding it. That card stays; this plan adds the bar's route to the parts of it the bar is
about.

---

## 2. Infrastructure: one context panel, two kinds

The collage bar proved the mechanism (`collageControlSection` → `CollageControlsPanel`). Text
needs the same mechanism, not a second one.

### 2.1 Generalise the state (`PublisherContext`)

```ts
type ContextPanel =
  | { kind: 'collage'; section: CollageControlSection }
  | { kind: 'text'; section: TextControlSection }
  | null;

contextPanel: ContextPanel;
openContextPanel: (panel: ContextPanel) => void;   // also opens the inspector
closeContextPanel: () => void;
```

`collageControlSection` / `openCollageControl` / `closeCollageControl` stay as thin wrappers over
this, so nothing that uses them today has to change in the same commit.

### 2.2 Section registry (`src/constants/textControls.ts`)

Same shape as `collageControls.ts`, so the panel and the bar read their titles from one place:

```ts
export type TextControlSection = 'type' | 'colour' | 'align' | 'effects';

export const TEXT_CONTROL_TITLES: Record<TextControlSection, string> = {
  type: 'Type',
  colour: 'Text colour',
  align: 'Alignment',
  effects: 'Effects',
};
```

`TEXT_PANEL_SECTIONS_ENABLED` mirrors `COLLAGE_PANEL_SECTIONS_ENABLED`: the nested routing can be
switched off without touching the direct buttons, which do not depend on it.

### 2.3 What the selection is (`src/hooks/useTextSelection.ts`)

```ts
useTextSelection(): {
  elements: TextElement[];      // every text element selected (1 or many)
  primary: TextElement;         // the one the bar reads its labels from
  mixed: { fontFamily: boolean; color: boolean; ... };  // where the values disagree
} | null
```

Null unless **every** selected element is text. A text box plus an image is not a text
selection — the bar falls back to the generic one, the same way a collage does.

### 2.4 The panel (`src/components/canvas/TextControlsPanel.tsx`)

**In Designer it opens in the edit sidebar** — the drawer beside the toolbar, in the pane the
rail already calls Edit. That is the surface attached to the bar, and it is where a font list
belongs: it has the full height of the window and it is right next to the chips that opened it.
The drawer's header becomes the panel's header (back chevron + title), and the back chevron
returns to the pane you were on.

**In Publisher there is no drawer**, so the same component renders in the inspector above the
Typography card. One component, two destinations, chosen by `workspaceMode` in
`openTextControl`; the panel itself does not know the difference.

**And the collage panel now follows the same rule** (`CollageControlsPanel` gained the same
`card | pane` variant). Whatever the bar opens appears in the sidebar beside it: one nested
panel, one destination, no per-bar exceptions.

Shell reused from the collage panel: title + section chips (so you can switch Type ↔ Colour
without going back to the bar) + close (×). Body switches on the section.

**One transformation, two callers.** The panel and the Typography card both write through one
small hook (`useTextFormatting(elements)`), so a font chosen in the panel and a font chosen in
the card cannot land differently or produce different undo steps.

---

## 3. The sections

### 3.1 Type (the font)
Full family list, not eight names: a searchable list built from `SYSTEM_FONTS` +
`GOOGLE_FONTS_CATALOG` (reusing `FontSelector`'s data layer and its download-on-first-use
behaviour), each row rendered in its own face. Below it: weight/style, size, tracking, leading,
case — the fields the Typography card already has, in the same order, so the two read the same.

The bar's font chip shows the current family name (or `Mixed`) and opens here.

### 3.2 Text colour
The full picker: text-specific targets the popover had nowhere to put — **colour**,
**highlight** (`backgroundColor`), **stroke** (`textStrokeColor`) — plus current colours
(add / eyedropper / recent) and hex entry. The bar's swatch shows the current colour and
opens here.

**Suggestions are the document's own palette, not a fixed list.** The palette that was already
built for the colour control (`analyzeDocument` + `buildSmartPalettes`) is extracted as
`SmartPalette` and used by both, so the panel suggests colours mined from the artwork, harmonies
of its dominant hue, tints/shades and neutrals — contrast-filtered per role:

| panel target | palette target | rule |
|---|---|---|
| Colour | `text` | must stay AA on the page background |
| Highlight | `fill` | sits behind text |
| Stroke | `stroke` | outline |

Two implementations of "suggestions" is what produced a hardcoded list in the first place.

### 3.3 Alignment
Left / centre / right / justify, plus vertical top / middle / bottom and columns. The bar's
alignment button keeps cycling (one click, one outcome); this section is where you *choose*.

### 3.4 Effects
Shadow on/off, colour and blur; stroke width and colour; small caps. Curve presets and word art
stay where they are — they are a different kind of decision and belong in their own surface.

---

## 4. Invariants

1. **The panel is the destination, not a second implementation.** A nested button opens the
   panel; it never renders its own copy of the picker.
2. **The bar shows state.** A nested chip shows the current value (family name, colour swatch,
   alignment icon) and reads `Mixed` when the selection disagrees; it is highlighted while its
   section is open.
3. **The panel follows the selection.** Empty selection closes it (already true), a selection
   that is no longer all-text closes it, and clicking outside the panel closes it — the rule
   that just shipped for panels.
4. **Escape closes the panel first.** If a context panel is open, Escape closes it and leaves
   the selection alone; the next Escape clears the selection. Closing the panel must not be a
   way to lose your object.
5. **One interaction, one undo step.** Choosing a font, clicking a swatch, toggling a weight =
   one commit. Size and spacing use steppers, not sliders, or commit on release.
6. **No horizontally-scrolling strip with a hidden scrollbar.** The text bar shrinks from five
   controls to four chips (Type · Colour · Align · Effects) plus the direct toggles; if it
   still overflows on a narrow window it wraps, it does not scroll invisibly.
7. **Multi-select applies to all.** Every text element in the selection receives the change in
   one commit; mixed values never silently overwrite each other on open.

---

## 5. Slices

Each slice is independently shippable and leaves the app working.

### Slice A — the mechanism, one section
- Generic `contextPanel` state + `TextControlSection` constants + `useTextSelection`.
- `TextControlsPanel` shell with the Type section only.
- Bar: the `<select>` is replaced by a font chip that opens Type.
- **Gate:** pick a font in the panel → all selected text elements change, the chip label
  updates, one undo step restores the old family; clicking outside the panel closes it;
  selecting a photo closes it.

### Slice B — colour
- Colour section (colour / highlight / stroke) and the bar's swatch chip.
- Delete the `ColorInput` popover from the floating bar; keep `ColorInput` where it is a form
  field (shape fill, inspector).
- **Gate:** swatch → element colour, chip swatch follows, undo works, mixed colour reads
  `Mixed`.

### Slice C — alignment, spacing, effects
- The remaining sections; alignment button keeps cycling but its panel is the way to choose
  justify/vertical.
- **Gate:** justify applies and survives save/reload; the cycle button still cycles.

### Slice D — Publisher parity
- One shared `TextActionBar` (the way `CollageActionBar` is shared) used by both
  `DesignerContextBar` and `SelectionToolbar`, so text behaves the same in both workspaces.
- The Publisher ribbon's font controls are **not** touched: the ribbon is the ribbon.
- **Gate:** the same probe passes in both modes.

---

## 6. Verification harness

Driven with the existing jsdom probe approach (no headless browser available):

1. insert text → it is selected → bar shows `Type · Colour · Align` + B/I/U + size.
2. click **Type** → inspector opens, panel shows the font list, first row is the current family.
3. choose another family → `activePage.elements[i].fontFamily` changes; chip label changes;
   Ctrl+Z restores it (one step).
4. click **Colour** → swatch row appears; pick one → `color` changes; chip swatch changes.
5. click on the canvas pasteboard → panel closes, then the selection clears (existing rules).
6. select text + image → no text panel; the generic bar returns.
7. select two text boxes with different families → chip reads `Mixed`; choosing one applies to
   both in a single commit.
8. open a panel, press Escape → panel closes, selection survives; Escape again → selection
   clears.

---

## 7. Out of scope

- The Typography card's paragraph/tabs/columns deep editing. It stays the inspector's job.
- Word art and curve presets.
- The ribbon's text controls in Publisher mode.
- Any change to how text elements are stored or rendered.

## 8. Risks

- **Two surfaces, one truth.** The panel and the Typography card both show the font. Both must
  write through `useTextFormatting`, and the card must reflect a change made in the panel
  immediately (same state, so this is a matter of not caching values locally).
- **Font loading.** The catalog downloads a stylesheet per family on first use; the panel must
  not fire a download for every row it previews. Preview rows use `fontFamily` only for
  families already loaded, with a fallback face otherwise.
- **Bar width.** Four chips plus B/I/U/size is still wide on a small window; the wrap rule in
  invariant 6 is the answer, and it needs to be verified at 1024px, not just at desktop width.

---

## 9. Shipped (slices A, B, and D's parity), and what changed against this plan

Built against the two reference panels: **Fonts** (back chevron, search, category chips,
"In this design", "Recommended fonts", every row drawn in its own face) and **Text color**
(back chevron, Fill / Highlight / Stroke targets, "Current colors" with add + eyedropper,
"Suggestions" grid, hex).

What differs from the plan as written:

- **The drawer is the Designer destination.** The plan said inspector for both modes; the
  reference panels are left flyouts attached to the bar, and the drawer is this app's version of
  that. Publisher keeps the inspector, since it has no drawer to put it in.
- **No section chips inside the panel.** The references use a back chevron and one panel at a
  time, so that is what shipped: `TEXT_CONTROL_TITLES` names the panel, the chevron closes the
  section. Switching sections means going back to the bar's other chip, which is one click
  either way and keeps each panel the full width of the inspector.
- **The collage and text panels share one dismissal rule** — the click-outside hook
  (`useCloseOnOutsideClick`) — so "click outside the panel and it closes" is not one behaviour
  for text and another for collage.
- **The bar is shared from day one** (`TextActionBar`), used by both `DesignerContextBar` and
  `SelectionToolbar`, so publisher mode got the chips in the same commit rather than in slice D.

Still open from the plan: the **Alignment** and **Effects** sections (slice C). The alignment
button still cycles, which is the direct behaviour the rule asks for.
