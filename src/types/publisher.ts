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
  | 'sunset-gradient';

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
  opacity?: number;
  flipH?: boolean;
  flipV?: boolean;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken';
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
  isWordArt?: boolean;
  wordArtStyle?: WordArtStyle;
  dropCap?: boolean;
  linkedNextId?: string | null;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  fillColor: string;
  fillType?: 'solid' | 'linear-gradient';
  gradientColor2?: string;
  gradientAngle?: number;
  strokeColor: string;
  strokeWidth: number;
  strokeDash?: 'solid' | 'dashed' | 'dotted';
  cornerRadius?: number;
  adjustValue?: number; // PowerPoint yellow handle morph parameter (0 to 1)
  waveEdge?: 'none' | 'top' | 'bottom' | 'left' | 'right';
  waveAmplitude?: number;
  waveFrequency?: number;
  mergeOp?: 'union' | 'combine' | 'subtract' | 'intersect';
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
  panX?: number; // -50 to 50
  panY?: number; // -50 to 50
  shadow?: boolean;
  shadowBlur?: number;
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

export interface Page {
  id: string;
  name: string;
  x?: number; // artboard x on freeform canvas
  y?: number; // artboard y on freeform canvas
  width: number; // pixels
  height: number; // pixels
  orientation: 'portrait' | 'landscape';
  backgroundColor: string;
  backgroundPattern?: PageBackgroundPattern;
  margins: PageMargins;
  guides: PageGuide[];
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
