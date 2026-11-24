export type ElementType = 'text' | 'shape' | 'image' | 'table' | 'accent' | 'line';

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
  | 'diamond';

export type WordArtStyle = 'none' | 'rainbow' | 'gold3d' | 'outline' | 'retro' | 'gradient-blue';

export type BorderArtStyle =
  | 'none'
  | 'stars'
  | 'classic-frame'
  | 'double-gold'
  | 'art-deco'
  | 'dots-and-dashes'
  | 'certificate-leaf';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
  zIndex: number;
  locked?: boolean;
  opacity?: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '600' | '800';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
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
  strokeColor: string;
  strokeWidth: number;
  strokeDash?: 'solid' | 'dashed' | 'dotted';
  cornerRadius?: number;
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
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
  maskShape?: 'none' | 'circle' | 'star' | 'rounded';
  brightness?: number; // 0 to 200
  contrast?: number; // 0 to 200
  grayscale?: number; // 0 to 100
}

export interface TableElement extends BaseElement {
  type: 'table';
  rows: number;
  cols: number;
  data: string[][];
  headerBg: string;
  headerColor: string;
  cellBg: string;
  cellColor: string;
  borderColor: string;
  borderWidth: number;
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

export type PublisherElement =
  | TextElement
  | ShapeElement
  | ImageElement
  | TableElement
  | AccentElement
  | LineElement;

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

export interface Page {
  id: string;
  name: string;
  width: number; // pixels
  height: number; // pixels
  orientation: 'portrait' | 'landscape';
  backgroundColor: string;
  margins: PageMargins;
  guides: PageGuide[];
  elements: PublisherElement[];
}

export interface DocumentProject {
  id: string;
  name: string;
  pages: Page[];
  activePageIndex: number;
  pageSizeName: string;
  colorScheme: string;
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
