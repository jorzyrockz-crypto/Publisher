# Microsoft Publisher (Web Clone)

An authentic, modern, desktop-grade clone of **Microsoft Publisher** built with React 19, TypeScript, Tailwind CSS, and Vite.

![Publisher Ribbon & Canvas](public/favicon.svg)

---

## 🌟 Key Features

### 0. Home Screen (default view)
- **The app opens on Home, not on a blank page**: a navigation rail, a search-first hero, a Recent Designs strip and a visual template grid. See `docs/home-screen.md`.
- **Frosted chrome**: the top bar and rail are glass over four soft pastel blooms, and the gallery slides under the bar — with opaque fallbacks for engines without `backdrop-filter` and for `prefers-reduced-transparency`.
- **Six pastel shortcut cards** in the hero — Tarpapel (3×2), Reading Corner, A4 Poster, Photo Collage, Social Media, Blank Canvas — each with its own clay-rendered illustration, its own tint, hairline and coloured title, in light and dark.
- **Create a Design** popover: Blank A4, Tarpapel 3×2, Landscape Banner or a custom size — a tarpapel canvas arrives with its 3 × 2 print grid already set.
- **Recent Designs**: every save keeps a copy in IndexedDB (with a page-1 thumbnail) so it can be reopened from the strip or from My Projects.
- **Resume Editing** in the Home top bar returns to the exact document you left; the editor is unmounted while Home is on screen, so nothing is lost and nothing intercepts your typing.
- **Story Kits** shelf: the asset packs with their artwork, plus one-click `.zip` import and removal.
- The gallery is one scrollable category row plus a `Portrait / Landscape / Tiled` filter over a responsive four-column grid, with hairline cards, sheet badges and a hover `Use Template`.

### 1. Authentic Office Ribbon Interface
- **Publisher-style chrome**: the ribbon, Quick Access Toolbar and Backstage view follow Microsoft Publisher's layout, while the accent palette is StudioPress "Iris" violet (see §6) rather than Publisher green.
- **Quick Access Toolbar**: Instant Save (.pub), Undo/Redo, Export to PDF, and Print buttons.
- **Ribbon Tabs**:
  - **FILE**: Fullscreen Backstage View (Open, Save, Save As, Export, Print, Info). Starting a document is Home's job now, so the File menu is only about the one you already have.
  - **HOME**: Clipboard, Font styling, Paragraph formatting, Object insertion, and Z-Order arrangement.
  - **INSERT**: Pages, Tables (with visual grid picker), Pictures, Shapes, Dividers, WordArt, and Publisher Building Blocks.
  - **PAGE DESIGN**: Templates (opens Home ▸ Templates), Margins, Orientations (Portrait / Landscape), Page Sizes, Office Color Schemes, Background colors, and Snap toggles.
  - **MAILINGS**: Mail Merge wizard with recipient database, token replacement (`{{FirstName}}`, `{{Company}}`), and batch generation.
  - **VIEW**: Rulers, Guides, Gridlines toggles, and Zoom controls (100%, Fit to Page, +/- sliders).

### 2. Desktop Publishing Page Layout Engine
- **Multi-Page Management**: Add, duplicate, reorder, and delete pages with live miniature preview thumbnails.
- **Precision Rulers**: Dynamic horizontal and vertical rulers marked in inches with real-time mouse coordinate tracking.
- **Magnetic Snapping & Smart Guides**:
  - Drag from rulers to pull out custom cyan guide lines.
  - Magnetic alignment to page borders, margins, and center points.
  - Pink/cyan smart guide lines show up dynamically when elements align with one another.
- **Transform & Manipulation**:
  - 8-point bounding box resize handles.
  - 360-degree rotation handle with live angle readouts and snap increments.
  - Marquee drag selection to select multiple elements at once.
  - Arrow keys nudging (1px standard, 10px with Shift).

### 3. Classic Microsoft Publisher Elements
- **Text Boxes / Frames**:
  - Rich typography (font family, size, weights, line height, colors).
  - Multi-column layout (1, 2, or 3 columns with gutter spacing).
  - Drop Caps (classic large decorative initial letter).
  - WordArt styling (Rainbow Gradient, Gold 3D Extrusion, Cyan Outline, Retro Pop).
- **Geometric Vector Shapes**:
  - Rectangles, Rounded Rectangles (with corner radius), Circles, Triangles, Stars, Banners, Callouts, Block Arrows, Diamonds, Hearts.
  - Custom fills, stroke widths, dash patterns, drop shadows, and embedded text labels.
- **Picture Tools**:
  - Image insertion, aspect ratio lock, brightness/contrast adjustments.
  - Masking to shapes (Circle, Rounded, Star).
  - Publisher "BorderArt" decorative borders.
- **Interactive Tables**:
  - Editable cell contents, custom header and cell background colors, and border widths.
- **Stock Art Sources**: nine live sources (ten with a Pexels key), searched together:
  - **Built-in graphics**, **Iconify** (200k+ icons) and **Wikimedia Commons** — no key.
  - **Openverse** — keyless CC imagery that works on static hosts.
  - **Clipart.Free** — optional key, with a CORS proxy.
  - **Pixabay** — server-side `api/pixabay.js` relay with type/orientation filters, paging and photographer credits.
  - **Unsplash** — hotlinked photos with UTM-tagged attribution and the required download-event tracking.
  - **Public-domain museum art** — Art Institute of Chicago and the Cleveland Museum of Art via `api/openaccess.js`; keyless, CC0, and the best source for engravings, ornaments and botanical plates.
  - **Openclipart** — 100k+ CC0 SVGs via `api/openclipart.js`; the only true-vector source, so a drawing stays crisp at poster size.
  - **Pexels** — fully implemented behind `api/pexels.js`, but **self-hiding**: Pexels paused new key issuance in late 2026, so the tab appears only when a deployment already holds `PEXELS_API_KEY`.
- **Search that respects the network**: results are fetched on intent (Enter or a ~700 ms pause, never on a single character) and each query is cached for five minutes, so retyping is instant.
- **Building Blocks**:
  - Tear-off Coupons with dashed scissor lines.
  - Pull Quotes with large quotation marks.
  - Newspaper Mastheads with volume and date bars.
  - Award badges and ribbon seals.

### 4. Pre-Built Professional Templates
1. **Corporate Trifold Brochure**: 3-panel corporate layout with inside flaps, mission statements, and coupons.
2. **Global AI & Tech Summit Flyer**: Event flyer with banner, WordArt headline, agenda table, and register CTA.
3. **Award Certificate of Excellence**: Formal framed certificate with gold seal badge and signature lines.
4. **Executive Business Card**: Standard 3.5" × 2" format with modern typography and contact layout.
5. **Community Newsletter**: 2-page newspaper layout with 2-column article, drop cap, and event sidebars.
6. **Blank Publication**: Clean canvas ready for custom design.

### 5. Export & Publishing
- **PDF Export**: Generates multi-page vector PDF documents ready for printing.
- **Print-Shop Ready**: Optional **bleed** (0.125" / 0.25") with mirrored edge extension plus **crop marks and trim guides**, so files drop straight into a commercial press workflow.
- **Image Export**: 300 DPI PNG and JPEG image exports.
- **Batch Export**: **All Pages as PNG (ZIP)** renders every page at 300 DPI and packages them into a single download (JSZip loads on demand, with live progress).
- **Project File**: Save and reload `.pub` files directly to disk.
- **Print**: Direct browser print integration formatted for exact page sizes.

### 6. UI Shell & Design System
- **"Iris" accent palette**: a Radix-Violet design token set (`#6e56cf`) defined in `src/index.css` — deliberately distinct from Microsoft Publisher's green, with an ink ramp that meets WCAG AA (≥4.5:1) at 10–11px label sizes.
- **Tokens actually bound**: the same `--sp-*` set is exposed to Tailwind through an `@theme inline` block, so components write `text-accent-ink`, `bg-surface` and `border-line` instead of re-deriving hexes — one accent family, a four-step integer type scale (10/11/12/13 px), two radii and one elevation shadow. Changing the accent is one line in `src/index.css`.
- **Light and dark**: dark mode redefines those same tokens under `html.dark`, so every token-based surface, border and text adapts in one place while the paper canvas keeps its true print colours. The switcher lives in the Quick Access Toolbar.
- **Designer workspace**: a switchable Microsoft-Designer-style mode — labelled left rail, single drawer, floating contextual pill and touch-friendly panels — alongside the classic ribbon. Its **Visuals** drawer searches the same keyless-first photo sources (Pixabay, Unsplash, Openverse, museum art) with a 500 ms intent debounce and a five-minute cache, and the top bar carries the artboard size as a live chip with orientation and resize.
- **Installable**: PWA manifest and service worker (`public/manifest.webmanifest`, `public/sw.js`) with a splash screen, so it installs like a desktop app.
- **Compact chrome**: 46px quick-access bar, ribbon that folds itself on <820px-tall laptops (`Ctrl+F1`, chevron, or click the active tab), and a triaged status bar that drops non-essential metadata on narrow viewports.
- **Contextual selection toolbar**: align / distribute / z-order / group / duplicate / lock / delete float at the bottom of the canvas, so common object work never requires the inspector.
- **Collapsible inspector**: every inspector section is a fold-out card with a clickable header, and the sticky header shows the current selection type.
- **Consistent zoom**: one 20–300% range everywhere, with a click-to-type zoom percentage in the status bar.

### 7. Smart, Document-Aware Colour Picker
Every colour swatch in the app (37 of them — fill, stroke, text, table, page background, collage, brand kits) now opens a **smart palette** derived from the document you are editing:
- **Mined colours** — every fill, stroke, text and table colour in the project, weighted by page and by element area, so the palette reflects the artwork rather than a generic rainbow.
- **Harmonies** — complementary, split-complementary, analogous and triadic sets generated from the dominant hue, plus tints/shades and neutrals tuned to the page background.
- **Role-aware filtering** — text swatches are auto-adjusted until they clear **WCAG AA (4.5:1)** against the surface they land on, fills are rejected if they vanish into the background, and background swatches are only offered when the document's text stays readable on them.
- **Click the swatch itself** to open the palette (no extra badge crowding the control); a hex field and a **Custom colour…** button keep the system colour wheel one click away.
- Hollow dot markers flag swatches that were lightened/darkened to pass contrast; tooltips show the hex and the measured contrast ratio.

Logic lives in `src/utils/documentPalette.ts`; the UI is `src/components/common/ColorInput.tsx`, a drop-in replacement for `<input type="color">`.

### 8. Performance & Static Hosting
- **Code-split bundle**: the editor shell loads first; every modal (`Backstage`, `AI Image`, `Collage`, `Mail Merge`, `Brand Board/Kits`, `Shortcuts`) and the export stack (jsPDF, html2canvas, JSZip) are lazy chunks. Initial JS dropped from ~1.9 MB to ~0.9 MB (−52%).
- **Auto-fit on load**: the artboard measures the real viewport on first paint and zooms to frame Page 1 exactly — no clipped pages on 1280×800 laptops.
- **IndexedDB document storage**: projects save to IndexedDB, which (unlike `localStorage`'s ~5 MB) comfortably holds photo-heavy documents — a 1280px stock photo is ~550 KB as a data URL. `localStorage` keeps only a small mirror for instant boot, whichever copy has the newer timestamp wins, and `navigator.storage.persist()` asks the browser not to evict it. The status bar reports the backend and document size. Logic lives in `src/utils/workspaceStorage.ts`.
- **AI Type Studio (free, keyless)**: the WordArt gallery can write the headline and pick the treatment for you. A free text model suggests 3–4 display phrases with a matching one of the 20 WordArt styles, tuned by mood (elegant / bold / playful) and by whether the page is dark. Ideas land as **real editable text**, not a flattened image, so they stay sharp in PNG/PDF export and can be restyled afterwards. The model is reached through `api/ai.js`; when it is busy or unreachable the panel falls back to local suggestions and says so. Logic lives in `src/utils/aiTypeStudio.ts`.
- **Works on GitHub Pages and Vercel**: Cloud AI (Pollinations), Iconify, Wikimedia and Openverse are called directly from production builds (all CORS-enabled); Clipart.Free can use an optional CORS proxy, and Pixabay, museum art and Openclipart each need their bundled Vercel function (`api/pixabay.js`, `api/openaccess.js`, `api/openclipart.js`). See [docs/static-hosting.md](docs/static-hosting.md) and [`workers/clipart-proxy.js`](workers/clipart-proxy.js).
- **Vercel**: the `studiopress` project builds fine (`npm run build` → `dist/`), but push-to-deploy is disabled and Deployment Protection gates non-production URLs behind a Vercel login — see the [Vercel checklist](docs/static-hosting.md#vercel-checklist-project-studiopress) before assuming the deployment is broken.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## ⌨️ Keyboard Shortcuts

Press `?` (or the keyboard icon in the Quick Access Toolbar) for the in-app
cheatsheet with a live filter.

| Shortcut | Action |
| --- | --- |
| `Ctrl + S` | Save publication (`.pub`) |
| `Ctrl + P` | Open **File ▸ Print Publication** |
| `Ctrl + K` | Command search |
| `Ctrl + Z` / `Ctrl + Y` | Undo / Redo |
| `Ctrl + C` / `Ctrl + V` | Copy / Paste |
| `Ctrl + D` | Duplicate selected element |
| `Ctrl + A` | Select all elements on active page |
| `Delete` / `Backspace` | Delete selected element(s) |
| `Arrow Keys` | Nudge element by 1px |
| `Shift + Arrow Keys` | Nudge element by 10px |
| `Space` + drag | Pan the pasteboard |
| `H` / `V` | Hand (pan) / Select tool |
| `Ctrl + Wheel` | Zoom in / out |
| `Escape` | Deselect all / close dialog |
| `?` | Shortcuts cheatsheet |
