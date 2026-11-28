/**
 * Tarpapel — one banner, printed on a grid of A4 sheets and glued together.
 *
 * The spec below is authored in the school's own terms: a canvas in millimetres, a tile grid with a
 * glue overlap, and layers in **normalized coordinates** (0–1 of the assembled canvas). That is the
 * right unit for the job, because the artwork has to be laid out once and then cut into sheets — and
 * it is a different job from laying out a page, which is why this module exists instead of a page of
 * elements typed by hand.
 *
 * `tarpapelToProject` turns a spec into the document the app already knows how to print: **one page
 * per sheet**, each A4, each showing its own window of the canvas. Nothing needs to know it is a
 * tarpapel afterwards — the pages print through the ordinary pipeline, and the picture is built by
 * gluing the sheets in order.
 *
 * Two consequences worth knowing before editing a spec:
 *
 * - **Neighbouring sheets print identical pixels along an overlap**, because both show the same
 *   canvas window. That is what makes a seam invisible: the glue strip is duplicated artwork, not a
 *   guess.
 * - **A4 art cannot hold 871 mm.** A 1024px backdrop stretched across a 3292px canvas prints at
 *   ~30 dpi. So the backdrop layer is laid as a low-opacity wash (its blur becomes atmosphere), and
 *   the weight is carried by pieces at native size — frames across the top, stickers, and vector
 *   word art. Anything placed near full-canvas size is a smudge by definition.
 */

import type {
  DocumentProject,
  ImageElement,
  Page,
  PublisherElement,
  TextElement,
  WordArtStyle,
} from '../types/publisher';
import type { TemplateDefinition } from './templates';

/* ------------------------------------------------------------------ *
 * Paper
 * ------------------------------------------------------------------ */

const MM = 3.7795275591; // 96 dpi
const mm = (v: number) => Math.round(v * MM);
const PT = 96 / 72; // point → px

const SHEET = {
  landscape: { width: mm(297), height: mm(210) }, // 1123 × 794
  portrait: { width: mm(210), height: mm(297) }, // 794 × 1123
};

const PAPER = '#fbf7ee';
const INK = '#1f2937';

/** Built-in packs ship under these folders; `resolveAsset` maps the school's ids onto real pieces. */
const PACK_BASES = {
  storybook: './asset-packs/storybook-reading-v1/full/',
  underwater: './asset-packs/champs-underwater-v1/full/',
  cultural: './asset-packs/champs-cultural-v1/full/',
} as const;

/**
 * The spec was written against a `champs-reading-v1` pack that does not exist as a folder — its
 * pieces live in three packs now. Rather than rewrite the school's ids in the layout (which is what
 * makes the spec readable), the ids are aliased here, once, in one table.
 */
const ASSET_ALIASES: Record<string, { pack: keyof typeof PACK_BASES; id: string }> = {
  'bg-champs-nook': { pack: 'storybook', id: 'bg-cozy-reading-nook' },
  'frame-hanging-vines': { pack: 'storybook', id: 'frame-top-canopy' },
  'frame-top-leaves': { pack: 'storybook', id: 'frame-top-canopy' },
  'frame-corner-vines': { pack: 'storybook', id: 'frame-corner-vines' },
  'sticker-champs-trophy': { pack: 'storybook', id: 'badge-star-medal' },
  'sticker-inclusive-readers': { pack: 'storybook', id: 'sticker-reading-kids' },
  'sticker-reading-kids': { pack: 'storybook', id: 'sticker-reading-kids' },
  'sticker-reading-passport': { pack: 'storybook', id: 'sticker-reading-passport' },
  'sticker-gold-laurel': { pack: 'storybook', id: 'sticker-gold-laurel' },
  'bg-enchanted-forest': { pack: 'storybook', id: 'bg-enchanted-forest' },
  'bg-underwater-cove': { pack: 'underwater', id: 'bg-underwater-cove' },
  'frame-ocean-top': { pack: 'underwater', id: 'frame-ocean-top' },
  'frame-coral-bottom': { pack: 'underwater', id: 'frame-coral-bottom' },
  'sticker-reading-turtle': { pack: 'underwater', id: 'sticker-reading-turtle' },
  'bg-cultural-nook': { pack: 'cultural', id: 'bg-cultural-nook' },
  'bg-heritage-tree': { pack: 'cultural', id: 'bg-heritage-tree' },
  'frame-bamboo-top': { pack: 'cultural', id: 'frame-bamboo-top' },
  'frame-hablon-border': { pack: 'cultural', id: 'frame-hablon-border' },
  'frame-cultural-cards': { pack: 'cultural', id: 'frame-cultural-cards' },
  'sticker-banig-readers': { pack: 'cultural', id: 'sticker-banig-readers' },
  'sticker-kubo-shelf': { pack: 'cultural', id: 'sticker-kubo-shelf' },
  'sticker-reading-carabao': { pack: 'cultural', id: 'sticker-reading-carabao' },
};

const resolveAsset = (assetId: string): string | null => {
  const alias = ASSET_ALIASES[assetId];
  if (!alias) return null;
  return `${PACK_BASES[alias.pack]}${alias.id}.webp`;
};

/* ------------------------------------------------------------------ *
 * The spec
 * ------------------------------------------------------------------ */

export interface TarpapelTiling {
  paper: 'A4';
  orientation: 'landscape' | 'portrait';
  cols: number;
  rows: number;
  overlapMm: number;
  cropMarks: boolean;
}

interface LayerBase {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TarpapelAssetLayer extends LayerBase {
  type: 'asset';
  assetId: string;
  layerRole: 'backdrop' | 'frame' | 'sticker';
  opacity?: number;
  locked?: boolean;
  /**
   * Repeat the piece side by side, each copy the same width. This is how a 1024px frame covers an
   * 871 mm banner without being upscaled into a smear: three garlands at native size, not one giant.
   */
  repeatX?: number;
}

/** Flat or gradient fills — the banner's wash, the pills behind type, the footer bar. */
export interface TarpapelShapeLayer extends LayerBase {
  type: 'shape';
  fill: string;
  fillColor2?: string;
  gradientAngle?: number;
  radius?: number;
  opacity?: number;
  locked?: boolean;
}

export interface TarpapelWordArtLayer extends LayerBase {
  type: 'wordart';
  text: string;
  wordArtId: WordArtStyle;
  fontFamily: string;
  fontSizePt: number;
  align: 'left' | 'center' | 'right';
  arc?: number;
  editable?: boolean;
}

export interface TarpapelTextLayer extends LayerBase {
  type: 'text';
  text: string;
  fontFamily: string;
  fontWeight: TextElement['fontWeight'];
  fontSizePt: number;
  color: string;
  align: 'left' | 'center' | 'right';
  letterSpacing?: number;
  editable?: boolean;
}

export type TarpapelLayer =
  | TarpapelAssetLayer
  | TarpapelShapeLayer
  | TarpapelWordArtLayer
  | TarpapelTextLayer;

export interface TarpapelTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  packId: string;
  thumbnailColor: string;
  thumbnailGradient: string;
  tiling: TarpapelTiling;
  canvas: { widthMm: number; heightMm: number };
  /** Flat colour behind everything. A backdrop wash sits on top of it at low opacity. */
  background: string;
  layers: TarpapelLayer[];
}

/* ------------------------------------------------------------------ *
 * 3 × 2 A4 landscape — the main wall banner (871 × 410 mm)
 * ------------------------------------------------------------------ */

export const CHAMPS_TARPAPEL_BANNER: TarpapelTemplate = {
  id: 'champs-tarpapel-3x2',
  name: 'Champs Reading Corner Banner (3×2 Tarpapel)',
  description:
    'Six A4 landscape sheets, glued with a 10 mm overlap into an 871 × 410 mm wall banner: DepEd header strip on a cream pill, three garlands of hanging vines at native size, the arched THE CHAMPS / READING CORNER word art, the gold Basa Kasadya ribbon, both side badges kept inside their own column, and the readers group on the centre seam.',
  category: 'Champs Reading',
  packId: 'champs-reading-v1',
  thumbnailColor: '#1e3a8a',
  thumbnailGradient: 'linear-gradient(135deg, #1e3a8a 0%, #0d9488 50%, #e11d48 100%)',
  tiling: { paper: 'A4', orientation: 'landscape', cols: 3, rows: 2, overlapMm: 10, cropMarks: true },
  canvas: { widthMm: 871, heightMm: 410 },
  background: '#fdfaf2',
  layers: [
    // A painted wash, not a photograph: cream at the foot, sea-mist at the head. Vector, so it is
    // sharp at 871 mm where a 1024px backdrop would print at 30 dpi.
    {
      id: 'bg-wash',
      type: 'shape',
      fill: '#e9f6f0',
      fillColor2: '#fdfaf2',
      gradientAngle: 90,
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      locked: true,
    },
    // Three garlands, one per column, each at roughly its own pixel size.
    {
      id: 'frame-top',
      type: 'asset',
      assetId: 'frame-hanging-vines',
      layerRole: 'frame',
      // Trimmed slightly wider than the canvas so each garland laps its neighbour: three copies with
      // the drawing's own margins left showing would read as three separate posters.
      x: -0.02,
      y: 0,
      w: 1.04,
      h: 0.24,
      repeatX: 3,
    },
    {
      id: 'header-pill',
      type: 'shape',
      fill: '#fdfaf2',
      radius: 26,
      opacity: 0.94,
      x: 0.12,
      y: 0.035,
      w: 0.76,
      h: 0.075,
    },
    {
      id: 'header-school',
      type: 'text',
      text: 'DEPED REGION VI • SCHOOLS DIVISION OF AKLAN • [SCHOOL NAME]',
      fontFamily: 'Plus Jakarta Sans',
      fontWeight: '800',
      fontSizePt: 22,
      color: '#1e3a8a',
      align: 'center',
      x: 0.13,
      y: 0.035,
      w: 0.74,
      h: 0.075,
      letterSpacing: 1.2,
      editable: true,
    },
    {
      id: 'title-champs',
      type: 'wordart',
      text: 'THE CHAMPS',
      wordArtId: 'champs-basa-blue',
      fontFamily: 'Fredoka',
      fontSizePt: 92,
      align: 'center',
      x: 0.16,
      y: 0.14,
      w: 0.68,
      h: 0.2,
      arc: 0.08,
      editable: true,
    },
    {
      id: 'title-reading-corner',
      type: 'wordart',
      text: 'READING CORNER',
      wordArtId: 'champs-kasadya-coral',
      fontFamily: 'Fredoka',
      fontSizePt: 108,
      align: 'center',
      x: 0.1,
      y: 0.33,
      w: 0.8,
      h: 0.22,
      editable: true,
    },
    {
      id: 'ribbon-tagline',
      type: 'wordart',
      text: 'Champs Read, Learn, and Excel • Basa Kasadya Year 5',
      wordArtId: 'champs-gold-ribbon',
      fontFamily: 'Nunito',
      fontSizePt: 34,
      align: 'center',
      x: 0.235,
      y: 0.555,
      w: 0.53,
      h: 0.115,
      editable: true,
    },
    // Left column: badge above its pill, both inside column 1 so no seam crosses them.
    { id: 'sticker-trophy', type: 'asset', assetId: 'sticker-champs-trophy', layerRole: 'sticker', x: 0.045, y: 0.36, w: 0.075, h: 0.21 },
    // The level word art is cream — built for a colour band — so each pill gets its band.
    { id: 'pill-read-learn-bg', type: 'shape', fill: '#16a34a', radius: 78, x: 0.012, y: 0.598, w: 0.136, h: 0.104 },
    {
      id: 'pill-read-learn',
      type: 'wordart',
      text: 'Read, Learn, Grow',
      wordArtId: 'champs-level-emergent',
      fontFamily: 'Fredoka',
      fontSizePt: 26,
      align: 'center',
      x: 0.015,
      y: 0.6,
      w: 0.13,
      h: 0.1,
      editable: true,
    },
    { id: 'sticker-passport', type: 'asset', assetId: 'sticker-reading-passport', layerRole: 'sticker', x: 0.875, y: 0.35, w: 0.1, h: 0.22 },
    { id: 'pill-every-story-bg', type: 'shape', fill: '#2563eb', radius: 78, x: 0.852, y: 0.598, w: 0.136, h: 0.104 },
    {
      id: 'pill-every-story',
      type: 'wordart',
      text: 'Every Story Matters',
      wordArtId: 'champs-level-beginning',
      fontFamily: 'Fredoka',
      fontSizePt: 26,
      align: 'center',
      x: 0.855,
      y: 0.6,
      w: 0.13,
      h: 0.1,
      editable: true,
    },
    // The readers group is centred on the middle column, so the centre seam runs behind them.
    { id: 'sticker-readers', type: 'asset', assetId: 'sticker-inclusive-readers', layerRole: 'sticker', x: 0.35, y: 0.67, w: 0.3, h: 0.24 },
    // White type needs something to sit on: a teal bar, full width, at the foot.
    { id: 'footer-bar', type: 'shape', fill: '#0f766e', x: 0, y: 0.915, w: 1, h: 0.075 },
    {
      id: 'footer-section',
      type: 'text',
      text: 'Grade & Section: [Grade 1 - Section]  |  Adviser: [Teacher Name]',
      fontFamily: 'Plus Jakarta Sans',
      fontWeight: 'bold',
      fontSizePt: 18,
      color: '#ffffff',
      align: 'center',
      x: 0.22,
      y: 0.915,
      w: 0.56,
      h: 0.075,
      editable: true,
    },
  ],
};

/* ------------------------------------------------------------------ *
 * 2 × 2 A4 portrait — Tree of Knowledge interactive word wall (1550 × 2208 mm-px)
 * ------------------------------------------------------------------ */

export const CHAMPS_TARPAPEL_WORD_WALL: TarpapelTemplate = {
  id: 'champs-wordwall-2x2',
  name: 'Tree of Knowledge Word Wall (2×2 Tarpapel)',
  description:
    'Four A4 portrait sheets into a 396 × 567 mm word wall: hablon header, a grid of blank abaca and bubble word cards to write on with the class, and the Heritage Tree anchoring the foot. Cards sit at native size, so words stay crisp.',
  category: 'Champs Reading',
  packId: 'champs-reading-v1',
  thumbnailColor: '#0d9488',
  thumbnailGradient: 'linear-gradient(135deg, #0d9488 0%, #d97706 55%, #16a34a 100%)',
  tiling: { paper: 'A4', orientation: 'portrait', cols: 2, rows: 2, overlapMm: 10, cropMarks: true },
  canvas: { widthMm: 396, heightMm: 567 },
  background: PAPER,
  layers: [
    { id: 'frame-top', type: 'asset', assetId: 'frame-bamboo-top', layerRole: 'frame', x: 0, y: 0, w: 1, h: 0.105 },
    {
      id: 'title-tree',
      type: 'wordart',
      text: 'TREE OF KNOWLEDGE',
      wordArtId: 'cultural-hablon',
      fontFamily: 'Fredoka',
      fontSizePt: 86,
      align: 'center',
      x: 0.06,
      y: 0.112,
      w: 0.88,
      h: 0.1,
      editable: true,
    },
    {
      id: 'subtitle-word-wall',
      type: 'text',
      text: 'INTERACTIVE WORD WALL • BASA KASADYA',
      fontFamily: 'Plus Jakarta Sans',
      fontWeight: '800',
      fontSizePt: 22,
      color: '#7c2d12',
      align: 'center',
      x: 0.12,
      y: 0.2,
      w: 0.76,
      h: 0.04,
      letterSpacing: 2.4,
      editable: true,
    },
    // Cards at native size: 1024 px wide is 1/1.5 of the canvas, so a word written here is 10 mm tall
    // on paper — the size a child can read from a desk away.
    { id: 'cards-1', type: 'asset', assetId: 'frame-cultural-cards', layerRole: 'sticker', x: 0.03, y: 0.26, w: 0.45, h: 0.13 },
    { id: 'cards-2', type: 'asset', assetId: 'frame-cultural-cards', layerRole: 'sticker', x: 0.52, y: 0.26, w: 0.45, h: 0.13 },
    { id: 'cards-3', type: 'asset', assetId: 'frame-cultural-cards', layerRole: 'sticker', x: 0.03, y: 0.41, w: 0.45, h: 0.13 },
    { id: 'cards-4', type: 'asset', assetId: 'frame-cultural-cards', layerRole: 'sticker', x: 0.52, y: 0.41, w: 0.45, h: 0.13 },
    { id: 'cards-5', type: 'asset', assetId: 'frame-cultural-cards', layerRole: 'sticker', x: 0.03, y: 0.56, w: 0.45, h: 0.13 },
    { id: 'cards-6', type: 'asset', assetId: 'frame-cultural-cards', layerRole: 'sticker', x: 0.52, y: 0.56, w: 0.45, h: 0.13 },
    // The tree is a painted scene, so it is presented as a print — white mount, soft corner — rather
    // than pasted as a raw rectangle in the middle of a word wall.
    { id: 'tree-mount', type: 'shape', fill: '#ffffff', radius: 14, x: 0.235, y: 0.695, w: 0.53, h: 0.215 },
    {
      id: 'tree',
      type: 'asset',
      assetId: 'bg-heritage-tree',
      layerRole: 'backdrop',
      x: 0.248,
      y: 0.706,
      w: 0.504,
      h: 0.193,
    },
    { id: 'how-to-bar', type: 'shape', fill: '#7c2d12', x: 0, y: 0.93, w: 1, h: 0.055 },
    {
      id: 'how-to',
      type: 'text',
      text: 'WRITE THE WORD  ·  DRAW IT  ·  USE IT IN A SENTENCE',
      fontFamily: 'Plus Jakarta Sans',
      fontWeight: 'bold',
      fontSizePt: 16,
      color: '#ffffff',
      align: 'center',
      x: 0.1,
      y: 0.93,
      w: 0.8,
      h: 0.055,
      letterSpacing: 1.2,
      editable: true,
    },
  ],
};

/* ------------------------------------------------------------------ *
 * Theme swap — four keys, four themes
 * ------------------------------------------------------------------ */

export interface TarpapelTheme {
  id: string;
  label: string;
  backdrop: string;
  topFrame: string;
  titleWordArt: WordArtStyle;
  subtitleWordArt: WordArtStyle;
  /** Head → foot colours of the vector wash. A photo cannot hold 871 mm; a gradient can. */
  wash: [string, string];
}

/** The four Region VI looks, as the school's table has them — every asset id resolves above. */
export const TARPAPEL_THEMES: TarpapelTheme[] = [
  {
    id: 'champs-default',
    label: 'Champs Default',
    backdrop: 'bg-champs-nook',
    topFrame: 'frame-hanging-vines',
    titleWordArt: 'champs-basa-blue',
    subtitleWordArt: 'champs-kasadya-coral',
    wash: ['#e9f6f0', '#fdfaf2'],
  },
  {
    id: 'forest',
    label: 'Forest',
    backdrop: 'bg-enchanted-forest',
    topFrame: 'frame-top-leaves',
    titleWordArt: 'reading-nook-sage',
    subtitleWordArt: 'storybook-crayon',
    wash: ['#e7f2e3', '#fbf7ee'],
  },
  {
    id: 'underwater',
    label: 'Underwater',
    backdrop: 'bg-underwater-cove',
    topFrame: 'frame-ocean-top',
    titleWordArt: 'underwater-bubble',
    subtitleWordArt: 'champs-kasadya-coral',
    wash: ['#d8f3fb', '#eefaf6'],
  },
  {
    id: 'local-cultural',
    label: 'Local Cultural',
    backdrop: 'bg-cultural-nook',
    topFrame: 'frame-bamboo-top',
    titleWordArt: 'cultural-hablon',
    subtitleWordArt: 'eco-champion',
    wash: ['#fdf1d8', '#fbf7ee'],
  },
];

/**
 * Swaps the four keys and leaves every other layer — copy, sizes, positions — exactly where the
 * school put it. That is the whole point of naming art by id in the spec.
 */
export function withTarpapelTheme(spec: TarpapelTemplate, themeId: string): TarpapelTemplate {
  const theme = TARPAPEL_THEMES.find((t) => t.id === themeId);
  if (!theme) return spec;
  return {
    ...spec,
    layers: spec.layers.map((layer) => {
      if (layer.type === 'shape' && layer.id === 'bg-wash') {
        return { ...layer, fill: theme.wash[0], fillColor2: theme.wash[1] };
      }
      if (layer.type === 'asset' && layer.id === 'bg-main') return { ...layer, assetId: theme.backdrop };
      if (layer.type === 'asset' && layer.id === 'frame-top') return { ...layer, assetId: theme.topFrame };
      if (layer.type === 'wordart' && layer.id === 'title-champs') {
        return { ...layer, wordArtId: theme.titleWordArt };
      }
      if (layer.type === 'wordart' && layer.id === 'title-reading-corner') {
        return { ...layer, wordArtId: theme.subtitleWordArt };
      }
      return layer;
    }),
  };
}

/* ------------------------------------------------------------------ *
 * Canvas → sheets
 * ------------------------------------------------------------------ */

export interface TarpapelGeometry {
  canvasWidth: number;
  canvasHeight: number;
  sheetWidth: number;
  sheetHeight: number;
  overlap: number;
  /** Sheet origin in canvas px, row-major. */
  sheets: { col: number; row: number; x: number; y: number }[];
}

export function tarpapelGeometry(spec: TarpapelTemplate): TarpapelGeometry {
  const sheet = SHEET[spec.tiling.orientation];
  const overlap = mm(spec.tiling.overlapMm);
  const canvasWidth = spec.tiling.cols * sheet.width - (spec.tiling.cols - 1) * overlap;
  const canvasHeight = spec.tiling.rows * sheet.height - (spec.tiling.rows - 1) * overlap;
  const sheets: TarpapelGeometry['sheets'] = [];
  for (let row = 0; row < spec.tiling.rows; row += 1) {
    for (let col = 0; col < spec.tiling.cols; col += 1) {
      sheets.push({
        col,
        row,
        x: col * (sheet.width - overlap),
        y: row * (sheet.height - overlap),
      });
    }
  }
  return { canvasWidth, canvasHeight, sheetWidth: sheet.width, sheetHeight: sheet.height, overlap, sheets };
}

/** Every layer in canvas pixels — the geometry a preview or a test wants. */
export function tarpapelCanvasElements(spec: TarpapelTemplate): PublisherElement[] {
  const geo = tarpapelGeometry(spec);
  const out: PublisherElement[] = [];
  spec.layers.forEach((layer, index) => {
    const x = layer.x * geo.canvasWidth;
    const y = layer.y * geo.canvasHeight;
    const width = layer.w * geo.canvasWidth;
    const height = layer.h * geo.canvasHeight;
    const zIndex = index + 1;

    if (layer.type === 'shape') {
      const element: PublisherElement = {
        id: `tp-${layer.id}`,
        type: 'shape',
        name: layer.id,
        shapeType: layer.radius ? 'rounded-rect' : 'rectangle',
        x,
        y,
        width,
        height,
        rotation: 0,
        zIndex,
        fillColor: layer.fill,
        fillType: layer.fillColor2 ? 'linear-gradient' : 'solid',
        gradientColor2: layer.fillColor2,
        gradientAngle: layer.gradientAngle,
        strokeColor: 'transparent',
        strokeWidth: 0,
        cornerRadius: layer.radius,
        opacity: layer.opacity,
        locked: layer.locked,
      };
      out.push(element);
      return;
    }

    if (layer.type === 'asset') {
      const src = resolveAsset(layer.assetId);
      if (!src) return;
      const copies = Math.max(1, layer.repeatX ?? 1);
      if (copies > 1) {
        const copyWidth = width / copies;
        for (let i = 0; i < copies; i += 1) {
          out.push({
            id: `tp-${layer.id}-${i + 1}`,
            type: 'image',
            name: `${layer.id} ${i + 1}`,
            src,
            alt: layer.assetId,
            x: x + i * copyWidth,
            y,
            width: copyWidth,
            height,
            rotation: 0,
            zIndex,
            objectFit: layer.layerRole === 'backdrop' ? 'fill' : 'contain',
            opacity: layer.opacity,
            imageScale: 1,
            aspectRatioLocked: false,
            locked: layer.locked,
          });
        }
        return;
      }
      const element: ImageElement = {
        id: `tp-${layer.id}`,
        type: 'image',
        name: layer.id,
        src,
        alt: layer.assetId,
        x,
        y,
        width,
        height,
        rotation: 0,
        zIndex,
        // A frame or a sticker keeps its drawing; only the backdrop is stretched to the canvas.
        objectFit: layer.layerRole === 'backdrop' ? 'fill' : 'contain',
        opacity: layer.opacity,
        imageScale: 1,
        aspectRatioLocked: false,
        locked: layer.locked,
      };
      out.push(element);
      return;
    }

    const isWordArt = layer.type === 'wordart';
    const fontSize = layer.fontSizePt * PT;
    const element: TextElement = {
      id: `tp-${layer.id}`,
      type: 'text',
      name: layer.id,
      x,
      y,
      width,
      height,
      rotation: 0,
      zIndex,
      text: layer.text,
      fontFamily: layer.fontFamily,
      fontSize,
      fontWeight: isWordArt ? '900' : layer.fontWeight,
      fontStyle: 'normal',
      textDecoration: 'none',
      letterSpacing: isWordArt ? undefined : layer.letterSpacing,
      color: isWordArt ? INK : layer.color,
      textAlign: layer.align,
      verticalAlign: 'middle',
      columns: 1,
      columnGap: 12,
      // A banner title sits on one line: tight leading keeps the arc from clipping the box.
      lineHeight: isWordArt ? 1.02 : 1.25,
      padding: isWordArt ? Math.round(fontSize * 0.12) : 0,
      isWordArt,
      wordArtStyle: isWordArt ? layer.wordArtId : undefined,
      textCurve: isWordArt && layer.arc ? Math.round(layer.arc * 100) : undefined,
      autoFit: 'none',
      autoSizeText: true,
    };
    out.push(element);
  });
  return out;
}

function seamMarks(
  geo: TarpapelGeometry,
  sheet: { col: number; row: number },
  cols: number
): PublisherElement[] {
  const marks: PublisherElement[] = [];
  const { overlap } = geo;
  // The glue strip is duplicated artwork; a hairline just inside it tells the hand where to stop.
  if (sheet.col > 0) {
    marks.push({
      id: `tp-seam-l-${sheet.col}-${sheet.row}`,
      type: 'shape',
      shapeType: 'rectangle',
      x: 0,
      y: 0,
      width: 1,
      height: geo.sheetHeight,
      rotation: 0,
      zIndex: 9000,
      fillColor: '#94a3b8',
      strokeColor: 'transparent',
      strokeWidth: 0,
    });
  }
  if (sheet.row > 0) {
    marks.push({
      id: `tp-seam-t-${sheet.col}-${sheet.row}`,
      type: 'shape',
      shapeType: 'rectangle',
      x: 0,
      y: 0,
      width: geo.sheetWidth,
      height: 1,
      rotation: 0,
      zIndex: 9000,
      fillColor: '#94a3b8',
      strokeColor: 'transparent',
      strokeWidth: 0,
    });
  }
  // Sheet label lives in the bottom-left corner, where it is covered by the neighbour or trimmed.
  const label = `SHEET ${sheet.row * cols + sheet.col + 1} OF ${geo.sheets.length}`;
  marks.push({
    id: `tp-label-${sheet.col}-${sheet.row}`,
    type: 'text',
    name: label,
    x: 6,
    y: geo.sheetHeight - 16,
    width: 180,
    height: 11,
    rotation: 0,
    zIndex: 9001,
    text: `${label} · GLUE ${Math.round(overlap / MM)} MM OVERLAP`,
    fontFamily: 'Inter',
    fontSize: 7,
    fontWeight: '600',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#94a3b8',
    textAlign: 'left',
    verticalAlign: 'top',
    columns: 1,
    columnGap: 0,
    lineHeight: 1.2,
    padding: 0,
  });
  return marks;
}

/** The document the app prints: one page per sheet, each showing its window of the canvas. */
export function tarpapelToProject(spec: TarpapelTemplate): DocumentProject {
  const geo = tarpapelGeometry(spec);
  const canvasElements = tarpapelCanvasElements(spec);

  const pages: Page[] = geo.sheets.map((sheet) => {
    const elements: PublisherElement[] = canvasElements.map((element) => ({
      ...element,
      id: `${element.id}-s${sheet.col}${sheet.row}`,
      x: element.x - sheet.x,
      y: element.y - sheet.y,
    }));
    if (spec.tiling.cropMarks) elements.push(...seamMarks(geo, sheet, spec.tiling.cols));

    return {
      id: `page-${spec.id}-${sheet.col}-${sheet.row}`,
      name: `Sheet ${sheet.row * spec.tiling.cols + sheet.col + 1} — col ${sheet.col + 1}, row ${sheet.row + 1}`,
      width: geo.sheetWidth,
      height: geo.sheetHeight,
      orientation: spec.tiling.orientation,
      backgroundColor: spec.background,
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      guides: [],
      elements,
    };
  });

  return {
    id: `proj-${spec.id}`,
    name: `${spec.name.replace(/\s*\(.*\)$/, '')}.pub`,
    pages,
    activePageIndex: 0,
    pageSizeName: spec.tiling.orientation === 'landscape' ? 'a4-landscape' : 'a4',
    colorScheme: 'ocean-navy',
    masterPage: { elements: [], showOnAllPages: false },
  };
}

/* ------------------------------------------------------------------ *
 * Registry entries
 * ------------------------------------------------------------------ */

const definition = (spec: TarpapelTemplate): TemplateDefinition => ({
  id: spec.id,
  name: spec.name,
  description: spec.description,
  category: 'Champs Reading',
  thumbnailColor: spec.thumbnailColor,
  thumbnailGradient: spec.thumbnailGradient,
  project: tarpapelToProject(spec),
});

export const CHAMPS_TARPAPEL_TEMPLATES: TemplateDefinition[] = [
  definition(CHAMPS_TARPAPEL_BANNER),
  definition(CHAMPS_TARPAPEL_WORD_WALL),
];
