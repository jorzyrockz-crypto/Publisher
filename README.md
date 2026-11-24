# Microsoft Publisher (Web Clone)

An authentic, modern, desktop-grade clone of **Microsoft Publisher** built with React 19, TypeScript, Tailwind CSS, and Vite.

![Publisher Ribbon & Canvas](public/favicon.svg)

---

## 🌟 Key Features

### 1. Authentic Office Ribbon Interface
- **Publisher Green Branding**: Classic Microsoft Publisher `#0f6b4e` signature visual theme.
- **Quick Access Toolbar**: Instant Save (.pub), Undo/Redo, Export to PDF, and Print buttons.
- **Ribbon Tabs**:
  - **FILE**: Fullscreen Backstage View (New, Open, Save As, Export, Print, Info).
  - **HOME**: Clipboard, Font styling, Paragraph formatting, Object insertion, and Z-Order arrangement.
  - **INSERT**: Pages, Tables (with visual grid picker), Pictures, Shapes, Dividers, WordArt, and Publisher Building Blocks.
  - **PAGE DESIGN**: Template gallery, Margins, Orientations (Portrait / Landscape), Page Sizes, Office Color Schemes, Background colors, and Snap toggles.
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
- **Image Export**: 300 DPI PNG and JPEG image exports.
- **Project File**: Save and reload `.pub` files directly to disk.
- **Print**: Direct browser print integration formatted for exact page sizes.

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
- `Ctrl + Z`: Undo
- `Ctrl + Y`: Redo
- `Ctrl + D`: Duplicate selected element
- `Ctrl + A`: Select all elements on active page
- `Delete` / `Backspace`: Delete selected element(s)
- `Arrow Keys`: Nudge element by 1px
- `Shift + Arrow Keys`: Nudge element by 10px
- `Escape`: Deselect all
