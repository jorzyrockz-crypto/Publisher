# The Home screen

**Status:** shipped
**Replaces:** the Templates Gallery that lived in `File ▸ New`, and the indigo File-menu sidebar it sat in.

The app used to open on a blank page. That is a strange thing for a publishing tool to do: the
blank page answers "what am I making?" with silence, and the 73 templates that could answer it were
two levels down a File menu — the same menu a 1998 desktop publisher used, in the same shape, with
the same words about documents that do not exist yet (New, Save As, Print, Export).

Home is the new first screen, and the gallery is its content rather than a mode inside it.

---

## 1. Where the app starts

`PublisherContext` owns `view: 'home' | 'editor'`, and it starts on `'home'`.

The document is *not* part of `view`. Projects, tabs, selection, zoom, pan and open panels all live
in the context already; switching views only decides which shell is on screen. That is what makes
"Resume Editing" instant and lossless.

The editor is **unmounted** while Home is showing, not hidden with `display:none`. Two reasons, both
found by reading the canvas rather than by guessing:

- `CanvasArea` fits the artboard on first mount and retries for 60 frames if the container is
  smaller than 160px. A `display:none` editor would spend those 60 frames at 0 × 0, give up, and
  never fit again — the document would open at a stale zoom.
- The canvas listens for keys on `window` (`CanvasArea`, `PageCanvas`, the ribbon). A hidden editor
  still receives them, so typing in the Home search would delete elements and Ctrl+P would print.

Nothing is lost by unmounting: every piece of document state is in the context. What *is* lost is
in-component state — a drag in progress, the ribbon's folded/unfolded state — which is not worth
keeping. Zoom is deliberately re-fitted when you return, because you have been away.

### `hasActiveDocument`

The "Resume Editing" pill only appears when there is something to resume. The workspace hands you a
blank `proj-blank` at boot; "resume the empty page you never started" is a lie, so a tab counts as
work only when it is not that blank, or the blank has artwork on it.

---

## 2. The rail

`HomeNavRail` — `w-56` on desktop, an icon rail below 1100px, and collapsible by hand.

| | |
|---|---|
| Brand | logo, name, "Freedom to Paint" |
| **+ Create a Design** | popover: Blank A4 · Tarpapel 3×2 · Landscape Banner · Custom Size |
| Home | hero, recents, a taste of the gallery |
| Templates | the whole gallery, with its own search field |
| My Projects | documents open now, documents saved on this device, Open File |
| Story Kits | the asset packs, thumbnails first, import/remove |

`Save As`, `Print` and `Export` were **removed** from this rail. They act on a document; on a screen
whose job is to choose one, they were the three buttons that always had nothing to act on. They are
still in the editor's File menu, which now opens from a plain **File** button in the Quick Access
Toolbar — the brand emblem next to it goes Home instead.

`BackstageSection` therefore dropped `'new'`. File is about the document you already have.

Everything in the rail is written against the tokens (`bg-surface`, `border-line`, `text-ink`,
`bg-accent`, `bg-accent-soft`…), so `html.dark` restyles it by redefining the variables — no
second set of selectors, and no white card glowing on a dark ground.

---

## 3. Hero and search

`HomeHero` is the headline, the field and the shortcut row — and nothing else. No card around them:
a bordered, tinted panel on a page that is already a surface is a box inside a box, and the
`overflow: hidden` that came with its rounded corner was what clipped the shortcut cards' hover
shadow at the top and bottom edge. The page's warm ground (`.home-ground`, below) is the only
background, and `.home-hero-wash` is gone with the panel.

No sentence above the field and no caption under it either. The headline carries the question, the
gallery's own heading counts what matched, and the count otherwise survives as a polite live region
(`role="status"` + `sr-only`) — so "7 templates match tarpapel" still reaches a screen reader
without a second line of grey type between the field and the cards.

The search **is** the hero's function: `onChange` sets the same filter state the grid below uses, so
results change as you type. There is no submit button, and the placeholder quotes the real template
count (`TEMPLATES.length`, 73) so it can never claim a library size the build does not have.

The six ways to start live under the field as mini cards rather than chips; see §4.

---

## 4. The six ways to start

`HomeShortcuts` (markup) reads `HOME_SHORTCUTS` from `shortcutCatalog.ts` (data) and renders one row
of mini cards inside the hero, on the line where the pills used to be:

| card | opens | built or from the library |
|---|---|---|
| Tarpapel (3×2) | a tarpapel canvas with its 3 × 2 grid already set | built |
| Reading Corner | the first `Champs Reading` sign | library |
| A4 Poster | the first A4 portrait poster | library |
| Photo Collage | the first collage layout | library |
| Social Media | a 1080 × 1080 square post | built |
| Blank Canvas | a blank A4 | built |

A pill labels a thing; a card shows it. The row keeps the pills' behaviour exactly — every card
**starts a document**, and where a format has a design worth starting from it opens that design, so
the next screen is always the editor. What changed is that the row now speaks the same language as
the rest of Home: tinted ground, hairline, a bold colour-matched title, one line of hint under it,
and a clay object on the right.

The list is data rather than six copies of the same JSX because `check:home` loads it: it asserts
each card's destination still exists (the group still has templates in it, the search still finds a
result, the blank size is one the builder knows, the tarpapel builder still makes a landscape
sheet), that the artwork is in `public/home/` and under 40 kB, that no two cards wear the same
pastel, and that a subtitle still fits one line on a 200 px card.

There is one row of cards on Home, not two. A big three-card row under the hero and a second row of
mini cards inside it read as the same idea twice, and pushed the gallery below the fold on a laptop.

### Colour

A card carries four variables — `--sp-tone-glow`, `--sp-tone-ink`, `--sp-tone-sub` and
`--sp-tone-line` — and both tints are mixed from the glow into `--sp-surface`. That is why dark mode
is a small block of the same four rather than a second set of rules, and why the border, the hover
shadow and the lift all follow the tone without being restated. Six tones: violet, amber, teal, rose,
sky, slate. Title and subtitle clear WCAG AA on the card's own ground in both themes — 6.6 / 4.8,
5.7 / 5.4, 5.8 / 5.6, 6.7 / 5.5, 6.5 / 4.9, 7.9 / 4.9 on light; 7.6 / 6.1, 7.8 / 5.7, 8.2 / 7.0,
7.3 / 5.9, 7.7 / 6.7, 7.8 / 6.1 on dark.

The row is centred and scrolls sideways rather than wrapping: a second line of cards under the
search box is the one thing that would push the gallery out of the first screenful. `justify-content:
safe center` centres it when it fits and falls back to left alignment when it overflows, so the
first card is never stranded outside the reach of the scroll box. The strip carries vertical padding
of its own (offset with a negative margin, so the layout does not move) because `overflow-x: auto`
clips on both axes — without it every lifted card loses its top and bottom edge.

### Artwork

Six clay renders in `public/home/mini-*.webp`, 300 px wide with alpha, 6.6–27.6 kB each, on the same
pastel ground as the UI so the cut-out sits *on* the tint instead of in a white box.

They are matted off a white background with a **border-plane cutout**: fit a plane through the
frame's edge pixels per channel, take each pixel's distance from it as the matte, then flood the
background in from the border and *fill every hole the flood cannot reach*. That last step is the
whole reason it works — a plain white key eats the tape strips holding the tarpapel together and the
sign face in the reading corner. The matte is eroded a pixel and feathered so no white fringe
survives on a tinted card, the image is trimmed to its content, and the **baked drop shadow is faded
rather than cut**: grey, unsaturated and darker than the paper gets reduced alpha, so the object
keeps its contact with the ground without dragging a grey slab onto the card. `.home-shortcut-art`
then adds a drop shadow that follows the cut-out silhouette.

---

## 5. Recent Designs

`RecentDesignsStrip` — a horizontal strip under the hero, hidden entirely while there are no saved
designs (an empty shelf with a label on it is worse than no shelf).

The data comes from `src/utils/recentDesigns.ts`:

| store | holds | read when |
|---|---|---|
| `meta` | id, name, page size, page count, timestamp, thumbnail | every time Home opens |
| `projects` | the document JSON | only when a card is clicked |

Splitting them is the whole point: rendering eight cards must not mean deserialising eight
documents. The thumbnail is page 1 through `renderPageModelToCanvas` — the same painter the PNG and
PDF exports use, so the card shows the artwork rather than a DOM screenshot that disagrees with it.

**When entries are written.** On `Save As` (`saveProjectToFile`) and on opening a `.spress`/`.pub`
file. Not on using a template: the strip is "your work", and a template you looked at once is not
your work yet.

**What is deliberately not offered:** a card for a document that could not be cached. The body is
written before the card; if the body does not fit, the card is never created. A card that opens
nothing is worse than no card.

The `.spress`/`.pub` file is still the source of truth; this is a convenience cache, pruned to eight.

---

## 6. The gallery

`TemplateGallery` + `TemplateCard`.

**One taxonomy, one control.** The old gallery printed fourteen wrapping category pills *and* the
fourteen headed sections they filtered to — the same taxonomy twice, both of which pushed the first
row of artwork below the fold. Now the groups are a single scrollable pill row (`.home-strip`, ends
faded by `.home-fade-x`, no scrollbar) and the results are one flat grid, sorted by the catalogue.

A format filter sits beside the count: `All · Portrait · Landscape · Tiled`. *Tiled* is a job rather
than a shape — a tarpapel is one poster printed across a sheet grid — so it is classified by
category, and everything else by which way up its page is.

**The card.** Preview, one title, one muted subtitle. Gone: the two-line description (nine words
that do not help anyone choose between two posters) and the "Create Publication →" footer (a second,
quieter copy of the whole card). What is left:

- `bg-surface-sunken` ground with generous padding, a hairline border, and the page drawn on it;
- a pill badge top-left with the sheet — `A4`, `Tabloid`, `3×2 Tarpapel`, or the measurements when
  the page has no name;
- hover: `-translate-y-0.5` + `shadow-elevated` on the preview, and a scrim with a `Use Template`
  pill;
- a preview (eye) button top-right on hover, for the page-by-page dialog.

Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5`.

**Preview cost.** A preview is not an image — it is a live page: every text box, shape and WordArt
sign, rendered by the same `ElementRenderer` the canvas uses. Seventy-three of those on mount is
several thousand elements before the hero paints, so each card builds its page only when it comes
within 320px of the viewport (`useInView`), and shows a paper-shaped placeholder until then. The
gallery therefore degrades to "everything renders" where `IntersectionObserver` is missing.

`TemplatePagePreview` was extracted from `BackstageModal` into `components/templates/` so the card,
the dialog and the File menu's print sheets all draw a page the same way.

---

## 7. Blank formats

`src/utils/blankDesign.ts`. A blank document is built, never cloned from a template — a clone drags
in whichever page size, scheme and background that template happened to have, and the first thing a
blank page does is quietly stop being blank.

| format | page | notes |
|---|---|---|
| Blank A4 | 794 × 1123 px | the school default; margins scale with the sheet |
| Tarpapel 3×2 | assembled 3 × 2 A4-landscape poster | canvas takes the *poster's* proportions, and the print settings are set to the same grid so what is drawn is what tiles |
| Landscape Banner | 1920 × 640 px | the strip above a web fold |
| Custom Size | 200–4000 px per side, clamped | named `Custom W × H` |

The tarpapel margin is a whole glue-strip wide (`7%` of the short side) rather than the usual 5.5%:
a tarpapel is taped together from overlapping sheets, and anything within a few centimetres of a
seam gets cut and doubled.

---

## 8. What did not change

- the 73 templates and the two design passes (`templateEnhance`, `templatePolish`);
- `loadTemplate`'s font preload — it now also sets `view = 'editor'`, which is the only change;
- Save / Print / Export themselves, and the File menu's sections for them.

## 9. Checks

`npm run check:home` (488 assertions over the pure parts, through Vite's module graph):

- every template belongs to exactly one group, and the group counts add up to the catalogue;
- every card can name its sheet and its subtitle;
- `Portrait + Landscape + Tiled` partitions the library (39 / 30 / 4 of 73) without losing anything;
- search finds `tarpapel`, `reading corner`, `a4`, multi-word queries in any order, and returns
  nothing for nonsense;
- blank documents are blank, one page, the size they claim, with margins that scale;
- a 3 × 2 tarpapel canvas is the *assembled poster's* ratio (~2.2:1) and its margin clears a glue
  strip;
- custom sizes clamp to 200–4000 px and round;
- each of the six shortcut cards opens something that exists, ships artwork under 40 kB, wears a
  tone the stylesheet defines, and keeps its subtitle to one line on a 200 px card.

Navigation and rendering were walked end to end in a jsdom harness during development: landing on
Home, live filtering, the Templates destination, template → editor, chip → editor, Resume Editing,
the Create popover's four formats, My Projects and Story Kits — plus the six shortcut cards, four of
which must land in the editor on the document they name (a tarpapel, a square post, a collage, a
blank A4). That harness needs jsdom, which this
repo does not depend on, so it is not committed; `check:home` covers everything below it.

## 10. Known limits

- Returning from Home re-fits the artboard. The zoom and pan a user set by hand live in the context
  and survive, but `CanvasArea`'s fit-on-mount wins on the way back in single view.
- `Recent Designs` needs IndexedDB. Where it is unavailable (or blocked), the strip stays hidden and
  My Projects shows only what is open — no error, because there is nothing the user can do about it.
- Home is in the initial bundle on purpose: it is the landing screen, so lazy-loading it would put a
  spinner where the app should already be.
