# Templates: artwork, polish, and composition

The template library used to be hand-authored pages, each one laid out once and never looked at
again. That is how a gallery ends up with 63 templates where a third of them have type that sits
7px off the margin, three different gap sizes inside one text stack, and nothing but flat colour
behind a poster. None of it is *wrong*; all of it is unfinished.

This pass gives every template the same three things a studio would give it: real artwork, a
tidied grid, and — where the page is type-led — a composition.

## 1. Artwork is ours

Eight images were generated for the library and committed to `public/templates/` (1.3 MB total,
resized to a 1600px long edge, stripped, progressive).

| id | tone | orientation | made for |
|---|---|---|---|
| `abstract-violet-flow` | dark | landscape | posters, social, hero banners, email |
| `portrait-violet` | dark | portrait | posters, invitations, social |
| `editorial-desk-warm` | light | landscape | brochures, newsletters, covers, reports |
| `architecture-light` | mid | landscape | covers, newsletters, reports, programs |
| `botanical-shadow` | light | landscape | menus, cards, postcards, collages, calendars |
| `portrait-cream` | light | portrait | invitations, certificates, menus, cards |
| `coastline-duotone` | dark | landscape | flyers, tarpaulins, programs, hero banners |
| `golden-haze` | light | landscape | flyers, posters, invitations, cards, tarpaulins |

They are registered in `src/constants/generatedArtwork.ts` with their tone, orientation, the
categories they suit, and a keyword list. Templates reference them by path (`./templates/<id>.jpg`),
so:

- nothing is hotlinked — the files ship with the build, they cannot expire or 404 at a third party;
- duplicating or exporting a template keeps its artwork, because it is just an `src`;
- a template's artwork is a normal image element: it can be replaced, moved, cropped, or deleted.

**Picking.** `artworkFor(category, orientation, hint)` scores the candidates on three things: does
it have the orientation the frame needs, does it match the words the template uses (a "Sunset
Rooftop" flyer gets `golden-haze`, not polar water), and a stable jitter keyed on the hint so two
posters in the same category do not end up with the same photograph. The hint is the template's
name plus all of its copy — the artwork is chosen from what the page actually says.

Adding more art means dropping a file in `public/templates/` and adding one entry to
`GENERATED_ARTWORK`. Nothing else has to change.

## 2. Six rules (`src/utils/templatePolish.ts`)

| rule | what it does | how often it fires |
|---|---|---|
| artwork | fills placeholder image slots; adds a veiled hero on a page with no imagery | 77 slots, 31 heroes |
| margins | snaps edges to the page margins when within 24px | 227 |
| grid | snaps everything to the 8px step | 363 |
| rhythm | makes stacked gaps multiples of 8, moving the stack below with it | 94 |
| contrast | walks text colour toward ink/white until it clears 4.5:1 against *what is behind it* | 27 |
| density | shrinks the biggest decoration 0.88× while ink is over 72% | 55 |

Two of these are worth calling out.

**The hero is veiled.** A photograph dropped behind body copy makes the page unreadable — the copy
is already the colour it was designed for, and the backdrop is now texture. The veil is a
full-page shape in the page's own colour: 0.85 on a light page (the photo reads as a tinted panel),
0.50 on a dark one (white type on a dark photograph is readable already, and dimming it to nothing
loses the art). Because the veil is a shape, `textBackdrop` resolves through it, so the contrast
rule fixes any type that is still wrong.

**Stacking order is preserved, not flattened.** Elements are lifted above the hero by a constant,
never collapsed to one level. Collapsing them destroyed the ties that decide whether a heading sits
on its colour bar or behind it — which is how a white masthead on a green bar turned grey and
unreadable the first time it ran.

## 3. Composition (`src/utils/editorialComposition.ts`)

Tidying cannot rescue a page that was never composed. For **Poster, Flyer and Invitation** — the
big-format, type-led categories — the pass also builds an editorial candidate: a picture panel, a
type panel, an eyebrow, a headline, an accent rule, a measured body block, and a footer on the
baseline.

- **The template keeps its voice.** The headline keeps its family, weight, colour and alignment.
  A serif centred poster stays a serif centred poster; a crimson headline stays crimson. If the
  inherited ink cannot read on the panel it is replaced by true ink, never by the half-way grey a
  contrast walk alone would produce.
- **Nothing is lost.** Copy that does not earn a slot is appended to the body block, so a redesign
  never quietly deletes the RSVP line.
- **It fits.** The headline is measured pessimistically and shrunk until it wraps into the box; body
  copy comes down a point at a time until it clears the rule above the footer; if blocks still
  collide at every size the composition is abandoned rather than shipped overlapping.
- **Landscape canvases are left alone.** A side-by-side picture panel reads as a layout on a
  portrait page; on a 16:9 thumbnail it just looks like two rectangles.

## 4. Nothing gets worse

`polishPage` scores three candidates — the page as authored (post-`enhanceProject`), the tidied
version, and the composition — and keeps the best. A rule that helps most templates but hurts one
cannot ship on that one, and a template that was already right comes through untouched.

That guard is the reason this pass was safe to run across the whole library on a single commit.
It is also why the numbers below are honest: they are what the templates score, not what the rules
intended.

## 5. Forms are exempt

`TEMPLATES` pipes every project through `enhanceProject` and then `polishProject`. That is right for a
poster — the passes place artwork, tidy the grid and pick the better of three candidates — and wrong
for a form. A reading log's millimetre margins, its fifteen 9 mm rows and its percentage column widths
*are* the design; a pass that "improves the rhythm" by nudging a text frame 4px down silently moves the
row rules off the printing baseline, and the page is then no longer the document the school asked for.

So `category: 'Champs Reading'` returns the authored project untouched, and the three forms live in
`src/constants/champsReadingTemplates.ts`:

| template | paper | what it is |
|---|---|---|
| `champs-passport-a4` — Learner Reading Passport (Half-Fold) | A4 landscape, 2 sheets | folded cover + pupil details, home reflection on the back, 20-book log inside |
| `champs-circulation-log` — Book Circulation & ARAL Usage Log | A4 landscape, 1 sheet | gold ribbon, School/Grade/Month/Teacher strip, 15 borrow rows with session checkboxes, totals and signatures |
| `champs-level-labels` — Color-Coded Leveling & Bin Labels (8-Up) | A4 portrait, 2 sheets | 8-up 92 × 64 mm cards on dashed cut lines: green/blue/gold level bands, then picture-labelled genre bins |

The legend inside each form is part of the form, not decoration: the log's four `F B A H` checkboxes sit
under the letters that name them, and the passport's `G B O` dots sit under the letters that name them, so
a teacher never has to remember which box is which. The three level bands carry the
`champs-level-emergent` / `-beginning` / `-transitional` word-art styles — deliberately **stroked with
nothing but a two-tone cream**: at 25px inside a 14 mm band an outline eats the letterform, and these
cards are read from across a room and photocopied in mono.

Two things about the geometry are worth knowing before editing one:

- **Millimetres first.** Every measurement is `mm(n)` at 96 dpi (12 mm margin → 45px, 92 × 64 mm card
  → 347 × 244px), so a photocopier reproduces the sheet at 100% with no scaling. If a number in that
  file is not a millimetre conversion, it is an inset measured from one.
- **Rules, not tables.** The log's columns are 15 / 40 / 12 / 18 / 15 percent, which `TableElement`
  cannot express: it draws uniform cells and stamps a 6px corner radius on every one. The tables here
  are therefore drawn from `rule()` and `vRule()` — filled hairlines and thin rectangles — which land
  on exact pixel boundaries, print identically from the DOM and the canvas exporter, and keep the
  header, the column guides and the row rules in one coordinate system.

The colour-coded cards ship as the templates that fill them: the eight genre icons (big book, decodable
blocks, pop-up book, audio station, puppets, return bin, local tales, storybooks) are pieces in the
built-in Story Kit, so a teacher who renames a bin can swap the picture with art already on the shelf.

## 6. Tarpapel: one banner, six sheets

A tarpapel is not a big page. It is a canvas measured in millimetres, printed on a grid of A4 sheets
and glued together, and the app prints sheets, not canvases. `src/constants/champsTarpapel.ts` holds
both halves of that gap:

- **the spec**, authored the way the school writes it — a canvas in mm, a tile grid with a 10 mm glue
  overlap, and every layer in normalized 0–1 coordinates, so the layout survives any tile count;
- **`tarpapelToProject`**, which turns that into the document the app already knows how to print:
  **one page per sheet**, each A4, each showing its own window of the canvas.

Three templates ship from it:

| template | tiling | assembled | what it is |
|---|---|---|---|
| `champs-tarpapel-3x2` — Champs Reading Corner Banner | 3 × 2 A4 landscape | one 871 × 410 mm page | a wooden signboard hung in a bright sky: a fan of sun beams behind it, chunky `READING` / `CORNER` lettering on the board — one line above the middle seam, one below — a cartoon boy and girl reading on the ends of the board, the DepEd line on a cream plaque, a Grade & Section hem |
| `champs-tarpapel-tree` — Tree of Knowledge Tarpapel | 2 × 2 A4 portrait | one 410 × 584 mm page | one big cut-out tree with nine blank fruit to write words or names on; the headline is split `TREE OF` / `KNOWLEDGE` so the seam falls in the gap between the words; four editable subject tags, instruction strips and footer also split two-and-two. Hung alone |
| `champs-wordwall-2x2` — Word Wall | 2 × 2 A4 portrait | one 410 × 584 mm page | twenty-four blank cards, 83 × 53 mm on paper, in four 2 × 3 blocks with both glue seams landing in the wide central gutters. `WORD` / `WALL` headline, subject line and instruction footer split at the seam |

A tarpapel template opens as **one page the size of the assembled poster** — 410 × 584 mm for a 2 × 2.
The sheets are a print-time idea, not a document one: opening four pages shows a quarter of the poster
per page (and, untrimmed, four copies of it), while the gallery thumbnail shows a fragment. The
Tarpaulin Printer tiles the page and already suggests the right grid from its size.

The tree and the word wall used to be one template with a card grid above a mounted landscape print. They
are two jobs: the tree is a **poster to hang alone**, the word wall is **furniture that cards hang on**.
Separating them is what let the word wall grow from 18 cards to 24 at a readable size, and what let the
tree get the whole canvas.

Four things the code knows that a hand-typed page would get wrong:

- **A seam is not a cut, but it is a strip.** Neighbouring sheets print identical pixels along their
  overlap — sheet 2 covers x ≤ 1123 and sheet 3 covers 1085–2208, and the 38 px they share is
  duplicated artwork — so a *picture* may cross a seam and join cleanly. Type may not: a ±2 mm shift
  shows as a doubled letter. Every template, the banner included, keeps its text inside a column
  and off the horizontal strip, and `npm run check:tarpapel` fails if one does not.
- **A4 art cannot hold 871 mm.** A 1024 px backdrop stretched across 3293 px prints at ~30 dpi, so
  the banner's sky is a **vector wash**, its beams and clouds are vector shapes, and its board is
  vector joinery — gradient, keyline, grain. The only bitmaps on it are the two readers, cut-outs
  set at 150 mm tall, which is ~130 dpi: the honest limit of a 450 px drawing, and a size you can
  reach without turning a cartoon into a smudge.
- **White type needs a bar.** The footer line is white, so it gets a teal bar; the navy header gets a
  cream pill so it can sit over leaves.
- **The glue strip is the margin.** Seam hairlines and the `SHEET n OF 6 · GLUE 10 MM OVERLAP` label
  sit inside the 10 mm strip that the neighbouring sheet covers, so they vanish in the assembly.

**Theme swap.** Every visual layer names its art by id, so `withTarpapelTheme(spec, 'underwater')`
swaps four keys — wash colours, top frame, and both title word-art styles — and moves nothing else.
The four looks are Champs Default, Forest, Underwater and Local Cultural, one row each in
`TARPAPEL_THEMES`. Three of the word-art styles they name (`champs-basa-blue`, `-kasadya-coral`,
`-gold-ribbon`) shipped with the forms; `underwater-bubble` and `cultural-hablon` were added for this.

**Asset ids.** The school's spec names a `champs-reading-v1` pack that does not exist as a folder — the
pieces live across three packs. Rather than rewrite their layout, `ASSET_ALIASES` maps each id once
(`bg-champs-nook` → the Story Kit's `bg-cozy-reading-nook`, `frame-hanging-vines` → `frame-top-canopy`,
`sticker-champs-trophy` → `badge-star-medal`, and so on).

## Before / after

Measured with `scoreLayout` over all 72 pages of the 63 templates, same scorer both sides:

| | avg | median | A | B | C | D |
|---|---|---|---|---|---|---|
| before (enhance only) | 85.7 | 88 | 25 | 33 | 12 | 2 |
| after (enhance + polish) | **88.8** | **89** | **35** | 29 | 8 | **0** |

Per page: **41 better · 31 unchanged · 0 worse.** Issue frequency across the library fell from
rhythm 47 / margins 38 / whitespace 23 / contrast 12 to margins 29 / rhythm 24 / whitespace 18 /
contrast 2, with collisions at 1.

The two worst templates improved the most: Reading Corner Cinematic Poster 65 → 84 (it now takes
the composed layout, keeping its serif voice) and Certificate of Excellence 68 → 80.

## Also fixed: the balance pass no longer reorders a page

`balancePage` in `templateEnhance.ts` used to pull a block *up* to the top of its band to even out
the spacing. On "Neon Cyber Product Launch" that moved the subtitle from y330 to y84 — above the
headline it belonged under. It now only ever pushes down, and a run that would push its last block
past the bottom margin is not spread at all.

## Verification

- `npx tsc -b` clean.
- `npx oxlint src` — 0 errors.
- `npx vite build` succeeds; `public/templates/*.jpg` are copied as-is.
- Every page was rasterised (Pillow, DejaVu) and inspected page by page: the veils, the composed
  posters and invitations, and the pages the guard left alone all read correctly. The renderer
  lives outside the repo (it is a probe, not product code).

## The seam rule

A 2 × 2 tarpapel is four A4s glued with a 10 mm overlap. Anything printed across that strip is
printed twice, 10 mm apart, and arrives on the wall as a doubled, misaligned ghost. So the layout
rule for every poster here is simple and tested:

> **No letter may ever land on the glue strip. Art may.**

Everything that carries words is split at the seam and reads as one line after gluing — `TREE OF`
right-aligned to the strip, `KNOWLEDGE` left-aligned from it, and the same for the subtitle, the
instruction strips, the subject tags (two a side) and the footer (Grade & Section | Adviser).

The tree itself crosses both seams, and that is deliberate: a subject that fills four sheets cannot
avoid a strip running through it, and a cut trunk is a seam a teacher expects. A cut letter is not.
`/tmp`-style checks are not the guard — the check lives in the tarpapel test and fails the build if
any text box intersects a seam band.

## One page, not four

The document a tarpapel template hands over is a single page of 1550 × 2208 px (410 × 584 mm) holding
the whole poster. An earlier cut built one page per sheet, each carrying the whole canvas shifted by its
offset; with the paper edge not trimming, every sheet painted its neighbours' artwork over itself and
the workarea showed the same poster two, three, four times — which reads as "two identical tarpapels
inside one template".

Pages can carry `clipContent`, and the canvas trims to the paper when they do, but no tarpapel needs it
now: there is only ever one page. The check asserts a tarpapel project is exactly one page, and that
the page is the size the grid adds up to.
