# Asset packs

A pack is a kit of pieces drawn to be used together — a backdrop, the frames that sit on it, the
stickers that go over both — plus one `manifest.json` that lists them. Two packs exist: the
**Storybook & Reading Corner** kit that ships with the app, and whatever the user imports.

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
- **`slot`** (`top` | `bottom` | `corner`) is an addition to the published schema: a hint for where a
  frame piece wants to land. Unknown `slot` values are dropped rather than fatal.
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
at `zIndex: 0` and locked; a frame spans the page width at its slot edge; a sticker arrives at 260px
centred. Import is a `.zip` picker; the footer says what a pack is, because a file input with no
explanation is a puzzle.

## The shipped kit

`public/asset-packs/storybook-reading-v1/` — 1.74 MB, ten pieces so far, built by
**`npm run pack:storybook`** from art in `.pack-src/` (generated, gitignored):

| piece | layer | size |
|---|---|---|
| Enchanted Forest Clearing | backdrop | 896×1200 |
| Cozy Reading Nook | backdrop | 896×1200 |
| Sunny Hilltop Meadow | backdrop | 896×1200 |
| Hanging Canopy Leaves | frame, top | 1024×408 |
| Grass & Wildflower Strip | frame, bottom | 1024×306 |
| Corner Vines & Blossoms | frame, corner | 1024×561 |
| Kids Reading Together | sticker | 904×643 |
| Reading Owl on Books | sticker | 614×667 |
| Playful Monkey | sticker | 712×573 |
| Open Magic Book | sticker | 1024×514 |

`Smiling Sun & Cloud` and `Reading Corner Sign` are in the builder's table but not yet generated —
the script prints what is missing at the end of a run rather than writing a manifest that lies.

### Cutting the white out

Frames and stickers are drawn on white and must become transparent. The recipe is a **flood fill from
every corner** with 12% fuzz, then a trim to the ink:

```
convert art.png -alpha set -fuzz 12% -fill none -floodfill +0+0 white … -trim +repage out.webp
```

Connected-only is the whole point. `-transparent white` would punch holes in exactly the details a
children's illustration is made of — the owl's glasses, the pages of the open book, the whites of two
children's eyes. The builder repeats the flood on the trimmed corners, because a cutout whose ink
touches the edge can still be white in the middle of an edge.

## Verification

Store, zip and picker logic are exercised in Node with `fake-indexeddb`:

- a real DEFLATE zip of three pieces imports, lists, resolves a cached blob URL (same URL on the
  second call), and yields a `data:image/webp;base64,…` with bytes;
- the built-in kit resolves over HTTP — thumb `200 image/webp`, full size as a data URL;
- `filterAssets`: `owl` → 1, `frame` + `leaves` → 1;
- uninstalling drops the manifest *and* the blobs (`getAssetBlob` → `null`);
- four authoring mistakes are refused by name.

And a composed page — backdrop + canopy + grass + vines + two stickers, every piece inserted through
`getAssetDataUrl` and rendered by the app's own canvas renderer — proves the kit layers as intended
with no white boxes around the cutouts.
