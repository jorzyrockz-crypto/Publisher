import type { CollageMeta } from '../utils/borderArtStyles';

export type ElementType = 'text' | 'shape' | 'image' | 'table' | 'accent' | 'line' | 'qr' | 'connector';

export type ShapeType =
  | 'rectangle'
  | 'rounded-rect'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'banner'
  | 'callout'
  | 'arrow-right'
  | 'arrow-double'
  | 'heart'
  | 'diamond'
  | 'hexagon'
  | 'badge-burst'
  | 'parallelogram'
  | 'trapezoid'
  | 'pentagon'
  | 'cross'
  | 'cloud'
  | 'merged';

export type WordArtStyle =
  | 'none'
  | 'rainbow'
  | 'gold3d'
  | 'outline'
  | 'retro'
  | 'gradient-blue'
  | 'neon-glow'
  | 'chrome'
  | 'fire'
  | 'comic-pop'
  | 'emerald-3d'
  | 'sunset-gradient'
  | 'cinematic'
  | 'holographic'
  | 'varsity'
  | 'synth-chrome'
  | 'liquid-glass'
  | 'rose-gold'
  | 'cyber-acid'
  | 'obsidian-gold'
  | 'candy-gloss'
  // Poster stickers: a chunky gradient face inside a fat rounded white border, with the paper-lift
  // shadow that keeps the word readable over a busy collage.
  | 'sticker-royal'
  | 'sticker-forest'
  | 'sticker-coral'
  | 'sticker-teal'
  // Flat ink on a painted highlight — the brush-swipe and pastel-pill poster looks.
  | 'brush-sunshine'
  | 'brush-blush'
  | 'pill-highlight'
  | 'eco-champion'
  | 'eco-leaf'
  | 'wood-plank-action'
  | 'eco-ribbon'
  | 'forest-script-sticker'
  | 'trophy-gold'
  | 'fiesta-mosaic'
  | 'parchment-script'
  | 'folklore-wood'
  | 'storybook-crayon'
  | 'fairytale-sparkle'
  | 'reading-nook-sage'
  | 'storytime-banner'
  | 'champs-basa-blue'
  | 'champs-kasadya-coral'
  | 'champs-gold-ribbon'
  | 'portfolio-editorial'
  | 'portfolio-indigo';

export type BorderArtStyle =
  | 'none'
  | 'polaroid'
  | 'washi-tape'
  | 'filmstrip'
  | 'stamp-postage'
  | 'stars'
  | 'classic-frame'
  | 'double-gold'
  | 'art-deco'
  | 'dots-and-dashes'
  | 'certificate-leaf'
  | 'neon-frame'
  | 'stitched-scrapbook'
  | 'candy-stripe'
  | 'puffy-clay'
  | 'pastel-rainbow'
  | 'doodle-box'
  | 'dotted-double';

export type ImageEffectPreset =
  | 'none'
  | 'sticker'
  | 'clay'
  | 'cartoon'
  | 'animation'
  | 'retro-film'
  | 'duotone-pop';

export interface BaseElement {
  id: string;
  type: ElementType;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
  groupId?: string;
  /** Clip this element to an arbitrary shape (path in its own local pixels). */
  clipPathD?: string;
  /** Frame the clip path was generated for, so later resizes scale it. */
  clipBaseWidth?: number;
  clipBaseHeight?: number;
  opacity?: number;
  flipH?: boolean;
  flipV?: boolean;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken';
  collageMeta?: CollageMeta;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: '300' | 'normal' | '500' | '600' | 'bold' | '800' | '900';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  fontVariant?: 'normal' | 'small-caps';
  letterSpacing?: number;
  wordSpacing?: number;
  baselineShift?: number;
  textIndent?: number;
  textStrokeWidth?: number;
  textStrokeColor?: string;
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  color: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRadius?: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  verticalAlign: 'top' | 'middle' | 'bottom';
  columns: 1 | 2 | 3;
  columnGap: number;
  lineHeight: number;
  padding: number;
  /**
   * How much of `padding` was added to make room for the text effect's paint (shadows, glows,
   * extrusions). Kept separately so the box can shrink back when the effect is removed.
   */
  effectInset?: number;
  isWordArt?: boolean;
  wordArtStyle?: WordArtStyle;
  dropCap?: boolean;
  linkedNextId?: string | null;
  /** Paragraph-level list rendering. */
  listStyle?: 'none' | 'bullet' | 'number';
  listIndent?: number;
  hangingIndent?: number;
  /** Tab stops measured from the column's left edge. */
  tabStops?: number[];
  tabLeader?: 'none' | 'dot' | 'dash' | 'line';
  /** Marker colour applied behind the glyphs. */
  highlightColor?: string;
  /** Shrink type until the block fits instead of clipping silently. */
  autoFit?: 'none' | 'shrink';
  /** Resizing the frame scales/rewraps the type instead of clipping it (default). */
  autoSizeText?: boolean;
  hyphenate?: boolean;
  /** Kerning + optional ligatures. */
  kerning?: boolean;
  ligatures?: boolean;
  /** Whole-box script treatment (a raised `st`/`th`), since runs are not styled. */
  script?: 'normal' | 'super' | 'sub';
  textFillType?: 'solid' | 'gradient';
  textGradientColor2?: string;
  textGradientAngle?: number;
  /** Quick style tag, used by "restyle all with this style". */
  textStyleId?: string;
  /** Canva-style text effect (shadow, lift, hollow, neon, fire, glitch...). */
  textEffect?: 'none' | 'shadow' | 'lift' | 'outline' | 'hollow' | 'echo' | 'splice' | 'neon' | 'fire' | 'glitch';
  textEffectColor?: string;
  /** Curved text: -100 (trough) .. 100 (full ring). */
  textCurve?: number;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  fillColor: string;
  fillType?: 'solid' | 'linear-gradient' | 'pattern';
  gradientColor2?: string;
  gradientAngle?: number;
  // Pattern fill fields (fillType === 'pattern')
  patternType?: BackgroundPatternType;
  patternColor?: string;      // pattern ink color
  patternBgColor?: string;    // pattern background color (or gradient color 1)
  patternBgType?: 'solid' | 'gradient';
  patternBgColor2?: string;   // pattern gradient color 2
  patternBgAngle?: number;    // pattern gradient angle
  patternScale?: number;      // tile size in px (10–80)
  patternOpacity?: number;    // 0.05–1
  strokeColor: string;
  strokeWidth: number;
  strokeDash?: 'solid' | 'dashed' | 'dotted';
  cornerRadius?: number;
  adjustValue?: number; // PowerPoint yellow handle morph parameter (0 to 1)
  waveEdge?: 'none' | 'top' | 'bottom' | 'left' | 'right';
  waveAmplitude?: number;
  waveFrequency?: number;
  mergeOp?: 'union' | 'combine' | 'subtract' | 'intersect';
  /** Boolean result baked into a single path (merged-local coordinates). */
  mergedPath?: string;
  /** Frame the merged path was generated for, so later resizes scale it. */
  mergedBaseWidth?: number;
  mergedBaseHeight?: number;
  mergedParts?: {
    d: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  }[];
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  glow?: boolean;
  glowColor?: string;
  glowSize?: number;
  label?: string;
  labelColor?: string;
  labelFontSize?: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt?: string;
  aspectRatioLocked?: boolean;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  borderArt?: BorderArtStyle;
  borderArtColor?: string;
  borderArtColor2?: string;
  borderArtWidth?: number;
  borderArtPadding?: number;
  borderArtCaption?: string;
  effectPreset?: ImageEffectPreset;
  maskShape?: 'none' | 'circle' | 'star' | 'rounded' | 'diamond' | 'hexagon' | 'triangle' | 'heart';
  brightness?: number; // 0 to 200
  contrast?: number; // 0 to 200
  saturate?: number; // 0 to 200
  grayscale?: number; // 0 to 100
  sepia?: number; // 0 to 100
  blur?: number; // 0 to 10
  hueRotate?: number; // 0 to 360
  objectFit?: 'cover' | 'contain' | 'fill';
  imageScale?: number; // 1 to 2.5
  imageRotation?: 0 | 90 | 180 | 270;
  panX?: number; // -50 to 50
  panY?: number; // -50 to 50
  shadow?: boolean;
  shadowBlur?: number;
  isSticker?: boolean;
  stickerOutlineColor?: string;
  stickerOutlineWidth?: number;
  stickerOutlineColor2?: string;
  stickerOutlineWidth2?: number;
  stickerFinish?: 'matte' | 'glossy' | 'puffy' | 'neon';
  stickerGlowColor?: string;
  originalSrc?: string;
  bgRemoved?: boolean;
  /**
   * True only for an element that *started life* as an empty picture placeholder. Without it the
   * sideways test — "has a src" — makes every inserted photograph look like a filled placeholder,
   * which is why the inspector used to offer **Detach** on a sticker that was never attached to
   * anything.
   */
  isPlaceholder?: boolean;
}

export interface TableElement extends BaseElement {
  type: 'table';
  rows: number;
  cols: number;
  data: string[][];
  themeId?: string;
  headerBg: string;
  headerColor: string;
  cellBg: string;
  altRowBg?: string;
  cellColor: string;
  borderColor: string;
  borderWidth: number;
  bandedRows?: boolean;
  showHeaderRow?: boolean;
  cellPadding?: number;
  fontSize?: number;
}

export interface AccentElement extends BaseElement {
  type: 'accent';
  accentType: 'coupon' | 'pull-quote' | 'masthead' | 'badge' | 'separator';
  title?: string;
  subtitle?: string;
  text?: string;
  badgeText?: string;
  accentColor: string;
  secondaryColor?: string;
}

export interface LineElement extends BaseElement {
  type: 'line';
  strokeColor: string;
  strokeWidth: number;
  strokeDash?: 'solid' | 'dashed' | 'dotted';
  arrowStart?: boolean;
  arrowEnd?: boolean;
}

export interface QRElement extends BaseElement {
  type: 'qr';
  value: string;
  fgColor: string;
  bgColor: string;
}

export interface ConnectorElement extends BaseElement {
  type: 'connector';
  fromId: string;
  toId: string;
  connectorStyle: 'straight' | 'elbow' | 'curved';
  strokeColor: string;
  strokeWidth: number;
  strokeDash?: 'solid' | 'dashed' | 'dotted';
  arrowEnd?: boolean;
  arrowStart?: boolean;
}

export type PublisherElement =
  | TextElement
  | ShapeElement
  | ImageElement
  | TableElement
  | AccentElement
  | LineElement
  | QRElement
  | ConnectorElement;

export interface PageGuide {
  id: string;
  orientation: 'horizontal' | 'vertical';
  position: number; // in pixels
}

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type BackgroundPatternType =
  | 'none'
  | 'dots'
  | 'grid'
  | 'diagonal-stripes'
  | 'chevron'
  | 'hexagon'
  | 'waves'
  | 'terrazzo'
  | 'isometric'
  | 'checker'
  | 'crosshatch';

export interface PageBackgroundPattern {
  type: BackgroundPatternType;
  color: string;
  opacity: number;
  scale: number;
  strokeWidth: number;
  rotation: number;
}

export interface PageBackgroundGradient {
  color1: string;
  color2: string;
  angle: number;
}

export interface Page {
  id: string;
  name: string;
  x?: number; // artboard x on freeform canvas
  y?: number; // artboard y on freeform canvas
  width: number; // pixels
  height: number; // pixels
  orientation: 'portrait' | 'landscape';
  backgroundColor: string;
  backgroundGradient?: PageBackgroundGradient;
  backgroundPattern?: PageBackgroundPattern;
  margins: PageMargins;
  guides: PageGuide[];
  elements: PublisherElement[];
  masterId?: string;
  hideMaster?: boolean;
}

export interface MasterPageDef {
  id: string;
  name: string;
  elements: PublisherElement[];
}

export interface BrandKit {
  id: string;
  name: string;
  logoSrc?: string;
  headingFont: string;
  bodyFont: string;
  isCustom?: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    dark: string;
    light: string;
    background: string;
  };
}

export interface DocumentProject {
  id: string;
  name: string;
  pages: Page[];
  activePageIndex: number;
  pageSizeName: string;
  colorScheme: string;
  activeBrandKitId?: string;
  masterPage?: {
    elements: PublisherElement[];
    showOnAllPages: boolean;
  };
  masterPages?: MasterPageDef[];
  activeMasterId?: string;
}

export interface ColorScheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
  light: string;
  background: string;
}

export interface PageSizeDefinition {
  name: string;
  width: number;
  height: number;
  displayName: string;
  category: 'Standard' | 'Marketing' | 'Card & Social' | 'Custom';
}

export interface HistoryState {
  past: DocumentProject[];
  future: DocumentProject[];
}

/** Sections available in the File (Backstage) view. */
export type BackstageSection = 'info' | 'new' | 'open' | 'save' | 'print' | 'export';
