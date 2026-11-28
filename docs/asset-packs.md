# Asset packs

A pack is a kit of pieces drawn to be used together — a backdrop, the frames that sit on it, the
stickers that go over both — plus one `manifest.json` that lists them. Two exist: the **Story Kit**
that ships inside the app, and whatever the user imports.

The Story Kit holds both of the registers we drew — storybook reading corners and the eco / fiesta
campaign pieces — because a teacher choosing a frame should not have to know which drawing session it
came from. The eco ten are *also* built as a standalone `.zip` (`sample pack`, one small link in the
picker), which is what you hand someone who wants a pack to copy, and what the import route is tested
against. Both come out of one table in the builder, so the built-in kit and the sample can never
disagree.

## The manifest

```json
{
  "packId": "storybook-reading-v1",
  "name": "Storybook & Reading Corner",
  "version": "1.0.0",
  "assets": [
    {
      "id": "frame-top-canopy",
      "label": "Hanging Canopy Leaves",
      "layer": "frame",
      "tags": ["leaves", "border", "top", "frame"],
      "slot": "top",
      "thumb": "thumbs/frame-top-canopy.webp",
      "full": "full/frame-top-canopy.webp",
      "width": 1024,
      "height": 408
    }
  ]
}
```

- **`thumb` and `full` are separate files.** A picker that decodes twelve 1200px images to draw a
  grid of chips is why a tablet feels slow; the thumb is 160px on its long edge and the full size is
  only read when a piece is placed.
- **`layer`** is the organising idea: `backdrop` fills a page and goes to the back, `frame` spans the
  width at an edge, `sticker` and `badge` arrive as small objects in the middle.
- **`slot`** (`top` | `bottom` | `left` | `right` | `corner`) is an addition to the published schema: a
  hint for where a frame piece wants to land. Unknown `slot` values are dropped rather than fatal.
  The vertical pair is real, not decoration: a `left`/`right` frame scales to the page *height* and
  pins to that edge, so a side border stays a border on a portrait poster.
- **`fit: 'page'`**, alongside `slot`, means the piece was drawn *as* a page: corner clusters that
  have to land on the page's own corners. It is placed stretched to the paper rather than fitted to
  the page width. A 4-corner frame fitted to the width of a portrait page puts its lower clusters
  halfway down the page, floating; stretched, the same leaves sit on the corners where they were
  drawn, and a bit of horizontal give in foliage is invisible. Also optional, also dropped if
  unknown.
- Paths are relative to the pack root and may not leave it — `../x.webp` is refused by name.

`parseManifest` is the only way in, and its errors name the offending asset: a pack author gets
*"assets[0].thumb must stay inside the pack ("../t.webp")"*, not *"invalid manifest"*. It refuses an
empty asset list, an unknown layer, a duplicate id, and a missing or non-positive width.

## The store (`src/utils/assetStore.ts`)

No dependency at all: IndexedDB is the store, `DecompressionStream` unpacks zips, and the only cache
is a `Map` of object URLs.

| function | what it does |
|---|---|
| `installAssetPack(manifest, files)` | writes the manifest and every `{ path → Blob }` in one transaction; checks first that every `thumb` and `full` is present |
| `listInstalledPacks()` | everything imported, newest first, as `PackSummary` with `source: 'installed'` |
| `listAssetPacks()` | the built-in kit first, then the imported ones — what the picker shows |
| `getAssetUrl(pack, entry, size)` | a display URL: a file URL for the built-in kit, a cached blob URL for an import |
| `getAssetDataUrl(pack, entry, size)` | the insert-time form — see below |
| `uninstallAssetPack(packId)` | removes the manifest, the blobs (by key range) and the cached URLs |
| `importAssetPackZip(file)` | unzip → validate → install, in one call |
| `filterAssets(assets, {layer, query})` | layer filter plus a match on label and tags |

### Why insert converts to a data URL

A blob URL is perfect for a picker and poison for a document: it dies with the tab, and a page that
references one exports blank. So `getAssetDataUrl` reads the blob, base64-encodes it in 32kB chunks
(one `String.fromCharCode` per byte overflows the argument limit on a 300kB image) and stamps the
right MIME type from the file name. What lands on the page is a normal `src`, indistinguishable from
an uploaded photo — it saves, duplicating works, and the PDF export sees bytes.

### Reading a zip

`readAssetPackZip` walks the central directory from the end-of-central-directory record, and inflates
with `new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))`. Stored (0) and
deflate (8) cover every zip of images; anything else, and zip64, is refused with a message that says
which. The manifest is inflated *before* it is parsed — the first version decoded the compressed
bytes and reported "manifest.json is not valid JSON", which is true and useless.

## In the app

Two doors, one panel, because both apps own the same space:

- **Designer** → rail item **Story kit** (`DesignerToolRail`, tab `packs`).
- **Publisher** → Insert ribbon → **Story Kit** (`InsertTab`), which opens the panel in the right-hand
  column. It and Stock Art are mutually exclusive, since they compete for that column.

The panel groups by layer with counts, searches label and tags, and shows transparent art on a
checkerboard so a cutout reads as a cutout. Placing obeys the layer: a backdrop is inserted page-sized
at `zIndex: 0` and locked; a frame spans the page width at its slot edge (or the page height, at a
side slot, or the whole page, when it is a `fit: 'page'` frame); a sticker arrives at 260px centred. Import is a `.zip` picker; the footer says what a pack is, because a file input with no
explanation is a puzzle.

### Placing a piece

A piece is *downloaded before it is inserted*, and that is on purpose: the document embeds the
full-size artwork as a data URL, so the tab closing or the pack being uninstalled cannot take the
picture with it. Two consequences:

- **There is a wait, so the tile says so.** The clicked tile dims, shows a spinner and *Placing*, and
  a four-segment pulse runs along its bottom edge. The whole grid ignores a second click while one
  is in flight, so a slow fetch cannot become two copies of the same sticker.
- **The wait is usually already over.** Pointing at a tile prefetches and encodes that piece, and the
  store keeps the last eight encoded pieces (`getAssetDataUrl`'s cache), so hover-then-click lands
  instantly and placing the same piece twice costs nothing. The largest backdrop in the kit is a
  378 kB fetch that becomes a 504 kB data URL — ~70 ms on localhost, and the thing that would
  otherwise look like a dead click on a phone.

A placed piece arrives **as itself**: `objectFit` from its layer, `imageScale` 1, no pan, no rotation,
no rounded plate, no border, and `isPlaceholder: false`. That last field is what the inspector asks
before offering **Detach** — it used to ask "does this have a `src`?", which is true of every
photograph ever inserted, so a sticker that had never been near a placeholder was offered a button to
detach it from one. Only an element that *started* as an empty picture placeholder can be detached,
and the detached copy comes out clean: no inherited radius, no inherited crop, `isPlaceholder: false`.

## The shipped kit

`public/asset-packs/storybook-reading-v1/` — **Story Kit, v1.2.0, 29 pieces, 4.5 MB**, built by
**`npm run pack:storybook`** from art in `.pack-src/` and `.pack-src-eco/` (generated, gitignored):

| piece | layer | slot | size |
|---|---|---|---|
| Enchanted Forest Clearing | backdrop | — | 896×1200 |
| Cozy Reading Nook | backdrop | — | 896×1200 |
| Starlit Night Sky | backdrop | — | 896×1200 |
| Underwater Light | backdrop | — | 896×1200 |
| Snowy Village Evening | backdrop | — | 896×1200 |
| Sunny Hilltop Meadow | backdrop | — | 896×1200 |
| Hanging Canopy Leaves | frame | top | 1024×408 |
| Grass & Wildflower Strip | frame | bottom | 1024×306 |
| Corner Vines & Blossoms | frame | corner | 1024×561 |
| Ivy Side Border | frame | left | 244×1024 |
| Bunting & Star Garland | frame | top | 1024×252 |
| Kids Reading Together | sticker | — | 904×643 |
| Reading Owl on Books | sticker | — | 614×667 |
| Playful Monkey | sticker | — | 712×573 |
| Open Magic Book | sticker | — | 1024×514 |
| Smiling Sun & Cloud | sticker | — | 894×596 |
| Reading Corner Sign | sticker | — | 559×696 |
| Rosette Award | badge | — | 520×697 |
| Star Medal | badge | — | 313×632 |

and the eco / fiesta ten, in the same kit:

| piece | layer | slot | size |
|---|---|---|---|
| Tropical Hills & Valley | backdrop | — | 768×1376 |
| Fiesta Night Lights | backdrop | — | 768×1376 |
| Mangrove River | backdrop | — | 848×1264 |
| Tropical Leaf Corners | frame | corner, page | 561×1024 |
| Fiesta Banderitas | frame | top | 1024×387 |
| Soil & Seedlings Strip | frame | bottom | 1024×363 |
| Planting Together | sticker | — | 1024×612 |
| Bahay Kubo | sticker | — | 947×701 |
| Wooden Signboard | sticker | — | 1024×380 |
| Gold Laurel Frame | badge | — | 782×713 |

The manifest is written in layer order — nine backdrops, eight frames, nine stickers, three badges —
rather than in the order the pieces were authored, because the picker's "All" list is what a reader
actually scrolls. An entry may name its own `src` folder, which is how one kit can be built from two
source trees.

Every piece in the builder's table is generated, so the run ends with a count and no "still to
generate" line. The script prints anything missing rather than writing a manifest that lies.

`PACK_ONLY=frame-side-ivy,sticker-wooden-sign npm run pack:storybook` re-cuts just those pieces and
rewrites the whole manifest from what is already on disk — worth knowing, because a scanned piece
takes a few seconds and a full rebuild of every cutout is closer to half a minute.

### The sample pack, and the zip it ships in

`public/asset-packs/eco-fiesta-v1.zip` — **Eco-Campaign & Fiesta Awards, v1.0.0, 10 pieces,
1.84 MB** — built by **`npm run pack:eco`** from the same table that puts those pieces in the built-in
kit. The unpacked build lands in `.pack-dist/eco-fiesta-v1/`, which is ignored: only the zip is
committed, because the zip is the deliverable.

It is not an "add this kit" button. The pieces are already in the Story Kit, so asking a reader to
import what they can already see would be busywork; the picker offers the file as *Sample pack to
copy from (.zip)* in one faint line, next to *Import a .zip pack*, which is where someone who wants
to author a pack is already looking.

Two things this kit needed that the first did not:

- **The zip writer.** `writeZip` is thirty lines of `zlib.deflateRawSync` and hand-written local
  headers, because the reader in `assetStore.ts` is hand-written too and a pack we author should not
  need a dependency the app does not have.
- **`trimBorder`.** One backdrop came back from the generator with a flat paper margin, which on a
  page reads as a white frame around the picture. Backdrops are otherwise left edge to edge; this
  trims the margin before the resize and nothing else.

An earlier revision shipped the eco pieces only as a zip, with an **Add the Eco & Fiesta kit** button
that fetched it and installed it in place. That was the right fix for a bad button — as a plain
`download` link it dropped a file in Downloads, changed nothing on screen, and left the reader to
find the import control and locate the file. It was the wrong shape for the product: a kit we drew
should simply be in the kit. The ten pieces are now part of the built-in Story Kit, the button is
gone, and the zip survives as the sample to copy from. Nothing is hotlinked and nothing is fetched
from a third party.

### Cutting the white out

Frames and stickers are drawn on white and must become transparent. The recipe has grown in three
steps, each one answering a way the previous step failed:

1. **Corner flood**, 12% fuzz, then trim to the ink.
2. **Corners again, plus the whole perimeter** (0.125/0.375/0.625/0.875 along each edge). A leaf that
   crosses an edge cuts the background into pockets and *none of them contains a corner* — which is
   why the canopy first shipped with white slivers between its leaves.
3. **Pockets no seed list anticipated**, by `clearSeeds` (fractions of the trimmed image) or
   `scanPockets: { cell, min }`, which bins paper-white pixels into a grid and floods one seed per
   occupied cell, then re-scans — clearing a channel can merge two others into a block that is
   finally worth opening. Seeds land on a white pixel the cell actually contains, not on its centre,
   because the centre of a cell in a narrow channel is usually a leaf.

Connected-only is still the whole point. `-transparent white` at the end would punch holes in exactly
the details a children's illustration is made of — the owl's glasses, the pages of the open book, the
whites of two children's eyes — so it appears only as an opt-in `knockout: <fuzz>` on pieces with no
white in the art at all: the jungle canopy, where hundreds of slivers are each too small to scan and a
soft 8% knock-out is the only finish that does not look ragged.

Sizes are capped at 1024px on the long edge, the ink gets a 4px transparent border so it never sits
flush against the page edge, and each piece is encoded to WebP at quality 86 with a 160px thumb beside
it — thumb and full are separate files so the picker never decodes a 1024px image to draw a chip.

## Verification

Store, zip and picker logic are exercised in Node with `fake-indexeddb`:

- the built-in kit is fetched and parsed as the app does it: **29 pieces**, layers 9 / 8 / 9 / 3,
  and every `thumb` and `full` the manifest names exists over HTTP with the thumb smaller than its
  full — the check that catches a manifest which has outrun the files;
- one piece from each register resolves to a `data:image/webp;base64,…` with real bytes — a storybook
  backdrop and an eco sticker through the same call, because to the store they are the same thing;
- the sample zip (DEFLATE, 1.84 MB) imports through `importAssetPackZip` into `fake-indexeddb`,
  installs as its own 10-piece pack, lists once, reads a thumb blob, and uninstalls back to zero;
- `filterAssets` over the merged list: `fiesta` → three pieces, layer `frame` → eight;
- four authoring mistakes are refused by name.

And a composed page — starlit sky, bunting at `top`, the ivy border at `left` (scaled to the page
height rather than its width), a rosette badge, a sticker or two — is inserted through
`getAssetDataUrl` and rendered by the app's own canvas renderer, which is what proves the framing
slots and the cut-outs work together and not just in a table.
