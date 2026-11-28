import React from 'react';
import { BorderArtStyle, ImageEffectPreset, ImageElement, BackgroundPatternType } from '../types/publisher';
import { buildPatternSvg } from './patternGenerator';

export type BorderArtId =
  | 'none'
  | 'stitched-scrapbook'
  | 'candy-stripe'
  | 'puffy-clay'
  | 'pastel-rainbow'
  | 'postage-stamp'
  | 'offset-doodle'
  | 'dotted-double'
  | 'polaroid'
  | 'washi-tape'
  | 'gold-foil'
  | 'confetti-pop'
  | 'film-negative';

export type StyleEffectId =
  | 'none'
  | 'sticker'
  | 'clay'
  | 'cartoon'
  | 'retro-film'
  | 'duotone-pop';

export type SlotMaskShape =
  | 'rounded'
  | 'circle'
  | 'hexagon'
  | 'diamond'
  | 'heart'
  | 'star';

export type CollageBackdropType =
  | 'none'
  | 'solid'
  | 'pastel-gradient'
  | 'kraft-paper'
  | 'dot-grid';

export interface BorderArtOption {
  id: BorderArtId;
  label: string;
  defaultFrameColor: string;
  defaultAccentColor: string;
  defaultThickness: number; // px
  supportsCaption?: boolean;
  /** Returns inline React.CSSProperties using --frame-color, --accent-color, --frame-thickness */
  getContainerStyle: (params: {
    frameColor: string;
    accentColor: string;
    thickness: number;
    cornerRadius: number;
    densityScale?: number;
  }) => React.CSSProperties;
  /** Optional inner wrapper style (e.g., for candy-stripe or polaroid chin) */
  getInnerStyle?: (params: {
    frameColor: string;
    accentColor: string;
    thickness: number;
    cornerRadius: number;
    densityScale?: number;
  }) => React.CSSProperties;
}

export interface CollageStyleConfig {
  borderArt: BorderArtId;
  frameColor: string;
  accentColor: string;
  frameThickness: number;
  effect: StyleEffectId;
  mask: SlotMaskShape;
  gap: number; // -16 to 40px
  cornerRadius: number; // 0-32px
  scatterTilt: boolean;
  slotScale?: number; // 0.6 to 1.25 (default 1.0)
}

export interface CollageBackdropConfig {
  type: CollageBackdropType;
  color: string;
  gradientColor2?: string;
  gradientAngle?: number;
  patternType?: BackgroundPatternType;
  patternColor?: string;
  patternOpacity?: number;
  padding: number; // 0-40px
}

export interface CollageVibePack {
  id: string;
  label: string;
  description: string;
  category?: 'classic' | 'occasion';
  badgeEmoji?: string;
  stickerIds?: string[];
  style: Partial<CollageStyleConfig>;
  backdrop: CollageBackdropConfig;
  enableCaptions?: boolean;
}

export interface CollageSlotState {
  imageUrl: string | null;
  naturalWidth?: number;
  naturalHeight?: number;
  cropX: number; // -50 to 50 (%)
  cropY: number; // -50 to 50 (%)
  zoom: number; // 1.0 to 2.5
  imageRotation: 0 | 90 | 180 | 270;
  flipH: boolean;
  caption?: string;
  zIndexOverride?: number;
  styleOverride?: Partial<
    Pick<
      CollageStyleConfig,
      'borderArt' | 'frameColor' | 'accentColor' | 'frameThickness' | 'effect' | 'mask'
    >
  >;
}

export interface CollagePlacedSticker {
  id: string;
  stickerId: string;
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  size: number; // px relative to 450px stage
  rotation: number; // degrees
}

export type DynamicLayoutMode =
  | 'smart-grid'
  | 'mosaic-featured'
  | 'hero-plus'
  | 'aspect-masonry'
  | 'scatter';

export interface CustomCollageLayoutConfig {
  mode: DynamicLayoutMode;
  slotCount: number;
  columns?: number;
}

export interface CollageMeta {
  /**
   * Stable identity, minted when the collage is inserted. Group ids are rewritten by
   * Group/Ungroup and can be cleared entirely, so they cannot identify a collage; this can.
   * Optional because collages made before this existed adopt one on their first edit.
   */
  collageId?: string;
  layoutId: string;
  customLayout?: CustomCollageLayoutConfig;
  aspectRatio: '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | 'page-margin' | 'full-paper';
  vibePackId?: string;
  sizeSeed?: number;
  coverDocumentBackground?: boolean;
  stickers?: CollagePlacedSticker[];
  globalStyle: CollageStyleConfig;
  backdrop: CollageBackdropConfig;
  slots: CollageSlotState[];
}

/**
 * Print/export-safe inline SVG data URI mask for postage-stamp perforations.
 */
export function getPostageStampSvgMask(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><defs><mask id="m"><rect width="20" height="20" fill="white"/><circle cx="0" cy="0" r="6.5" fill="black"/><circle cx="20" cy="0" r="6.5" fill="black"/><circle cx="0" cy="20" r="6.5" fill="black"/><circle cx="20" cy="20" r="6.5" fill="black"/><circle cx="10" cy="0" r="5.5" fill="black"/><circle cx="10" cy="20" r="5.5" fill="black"/><circle cx="0" cy="10" r="5.5" fill="black"/><circle cx="20" cy="10" r="5.5" fill="black"/></mask></defs><rect width="20" height="20" fill="black" mask="url(#m)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export const COLLAGE_BORDER_ART_OPTIONS: BorderArtOption[] = [
  {
    id: 'none',
    label: 'None (Clean)',
    defaultFrameColor: '#ffffff',
    defaultAccentColor: '#cbd5e1',
    defaultThickness: 0,
    getContainerStyle: ({ cornerRadius }) => ({
      borderRadius: `${cornerRadius}px`,
      overflow: 'hidden',
    }),
  },
  {
    id: 'stitched-scrapbook',
    label: 'Stitched Scrapbook',
    defaultFrameColor: '#fff0f5',
    defaultAccentColor: '#ff8fab',
    defaultThickness: 6,
    getContainerStyle: ({ frameColor, accentColor, thickness, cornerRadius }) =>
      ({
        '--frame-color': frameColor,
        '--accent-color': accentColor,
        '--frame-thickness': `${Math.max(4, thickness)}px`,
        backgroundColor: 'var(--frame-color)',
        border: 'var(--frame-thickness) solid var(--frame-color)',
        outline: '2px dashed var(--accent-color)',
        outlineOffset: '-8px',
        borderRadius: `${Math.max(8, cornerRadius)}px`,
        padding: `${Math.max(8, thickness + 4)}px`,
        boxSizing: 'border-box',
      }) as React.CSSProperties,
    getInnerStyle: ({ cornerRadius }) => ({
      borderRadius: `${Math.max(6, cornerRadius - 4)}px`,
      overflow: 'hidden',
    }),
  },
  {
    id: 'candy-stripe',
    label: 'Candy-Stripe Frame',
    defaultFrameColor: '#ffffff',
    defaultAccentColor: '#ffb3c6',
    defaultThickness: 8,
    getContainerStyle: ({ frameColor, accentColor, thickness, cornerRadius }) =>
      ({
        '--frame-color': frameColor,
        '--accent-color': accentColor,
        '--frame-thickness': `${Math.max(6, thickness)}px`,
        backgroundImage:
          'repeating-linear-gradient(45deg, var(--accent-color) 0 10px, var(--frame-color) 10px 20px)',
        padding: 'var(--frame-thickness)',
        borderRadius: `${Math.max(10, cornerRadius)}px`,
        boxSizing: 'border-box',
      }) as React.CSSProperties,
    getInnerStyle: ({ frameColor, cornerRadius }) => ({
      backgroundColor: frameColor,
      borderRadius: `${Math.max(4, cornerRadius - 6)}px`,
      padding: '3px',
      overflow: 'hidden',
    }),
  },
  {
    id: 'puffy-clay',
    label: 'Puffy Clay / Kawaii 3D',
    defaultFrameColor: '#e0f7fa',
    defaultAccentColor: '#80deea',
    defaultThickness: 4,
    getContainerStyle: ({ frameColor, accentColor, thickness, cornerRadius }) =>
      ({
        '--frame-color': frameColor,
        '--accent-color': accentColor,
        '--frame-thickness': `${Math.max(3, thickness)}px`,
        backgroundColor: 'var(--frame-color)',
        border: 'var(--frame-thickness) solid #ffffff',
        borderRadius: `${Math.max(18, cornerRadius)}px`,
        padding: '6px',
        boxShadow: '0 8px 0 var(--accent-color), 0 12px 20px rgba(0, 131, 143, 0.16)',
        boxSizing: 'border-box',
      }) as React.CSSProperties,
    getInnerStyle: ({ cornerRadius }) => ({
      borderRadius: `${Math.max(12, cornerRadius - 6)}px`,
      overflow: 'hidden',
    }),
  },
  {
    id: 'pastel-rainbow',
    label: 'Pastel Rainbow Gradient',
    defaultFrameColor: '#ffffff',
    defaultAccentColor: '#a1c4fd',
    defaultThickness: 5,
    getContainerStyle: ({ frameColor, accentColor, thickness, cornerRadius }) =>
      ({
        '--frame-color': frameColor,
        '--accent-color': accentColor,
        '--frame-thickness': `${Math.max(4, thickness)}px`,
        border: 'var(--frame-thickness) solid transparent',
        borderRadius: `${Math.max(12, cornerRadius)}px`,
        padding: '5px',
        background: `linear-gradient(var(--frame-color), var(--frame-color)) padding-box, linear-gradient(135deg, #ff9a9e, #fad0c4, var(--accent-color), #c2e9fb) border-box`,
        boxSizing: 'border-box',
      }) as React.CSSProperties,
    getInnerStyle: ({ cornerRadius }) => ({
      borderRadius: `${Math.max(8, cornerRadius - 6)}px`,
      overflow: 'hidden',
    }),
  },
  {
    id: 'postage-stamp',
    label: 'Postage Stamp Edge',
    defaultFrameColor: '#fff8e7',
    defaultAccentColor: '#f4a261',
    defaultThickness: 3,
    getContainerStyle: ({ frameColor, accentColor, thickness }) =>
      ({
        '--frame-color': frameColor,
        '--accent-color': accentColor,
        '--frame-thickness': `${Math.max(2, thickness)}px`,
        backgroundColor: 'var(--frame-color)',
        border: 'var(--frame-thickness) solid var(--accent-color)',
        padding: '12px',
        maskImage: 'radial-gradient(7px at 7px 7px, #0000 98%, #000)',
        WebkitMaskImage: 'radial-gradient(7px at 7px 7px, #0000 98%, #000)',
        maskPosition: '-7px -7px',
        WebkitMaskPosition: '-7px -7px',
        maskSize: '18px 18px',
        WebkitMaskSize: '18px 18px',
        boxSizing: 'border-box',
      }) as React.CSSProperties,
    getInnerStyle: () => ({
      borderRadius: '2px',
      overflow: 'hidden',
    }),
  },
  {
    id: 'offset-doodle',
    label: 'Offset Doodle / Sticker',
    defaultFrameColor: '#ffd166',
    defaultAccentColor: '#3d348b',
    defaultThickness: 3,
    getContainerStyle: ({ frameColor, accentColor, thickness }) =>
      ({
        '--frame-color': frameColor,
        '--accent-color': accentColor,
        '--frame-thickness': `${Math.max(2, thickness)}px`,
        backgroundColor: '#fffdf5',
        border: 'var(--frame-thickness) solid var(--accent-color)',
        borderRadius: '16px 22px 18px 24px',
        padding: '7px',
        boxShadow: '6px 6px 0 var(--frame-color)',
        boxSizing: 'border-box',
      }) as React.CSSProperties,
    getInnerStyle: () => ({
      borderRadius: '10px',
      overflow: 'hidden',
    }),
  },
  {
    id: 'dotted-double',
    label: 'Dotted Double Frame',
    defaultFrameColor: '#f3e8ff',
    defaultAccentColor: '#a855f7',
    defaultThickness: 3,
    getContainerStyle: ({ frameColor, accentColor, thickness, cornerRadius }) =>
      ({
        '--frame-color': frameColor,
        '--accent-color': accentColor,
        '--frame-thickness': `${Math.max(2, thickness)}px`,
        backgroundColor: 'var(--frame-color)',
        border: 'var(--frame-thickness) solid var(--accent-color)',
        borderRadius: `${Math.max(10, cornerRadius)}px`,
        padding: '7px',
        outline: '4px dotted var(--accent-color)',
        outlineOffset: '4px',
        boxSizing: 'border-box',
      }) as React.CSSProperties,
    getInnerStyle: ({ cornerRadius }) => ({
      borderRadius: `${Math.max(6, cornerRadius - 4)}px`,
      overflow: 'hidden',
    }),
  },
  {
    id: 'polaroid',
    label: 'Polaroid Instant',
    defaultFrameColor: '#ffffff',
    defaultAccentColor: '#cbd5e1',
    defaultThickness: 2,
    supportsCaption: true,
    getContainerStyle: ({ frameColor, accentColor, densityScale = 1 }) => {
      const sidePad = Math.max(3, Math.round(8 * densityScale));
      const chinPad = Math.max(10, Math.round(30 * densityScale));
      return {
        '--frame-color': frameColor,
        '--accent-color': accentColor,
        backgroundColor: 'var(--frame-color)',
        border: '1px solid var(--accent-color)',
        borderRadius: '4px',
        padding: `${sidePad}px ${sidePad}px ${chinPad}px ${sidePad}px`,
        boxShadow: '0 8px 20px rgba(15, 23, 42, 0.2)',
        boxSizing: 'border-box',
      } as React.CSSProperties;
    },
    getInnerStyle: () => ({
      borderRadius: '2px',
      overflow: 'hidden',
    }),
  },
  {
    id: 'washi-tape',
    label: 'Washi Tape Scrapbook',
    defaultFrameColor: '#fffdf7',
    defaultAccentColor: '#fda4af',
    defaultThickness: 3,
    getContainerStyle: ({ frameColor, thickness, cornerRadius, densityScale = 1 }) =>
      ({
        '--frame-color': frameColor,
        backgroundColor: 'var(--frame-color)',
        border: `${Math.max(2, Math.round(thickness * densityScale))}px solid #ffffff`,
        borderRadius: `${Math.max(4, cornerRadius)}px`,
        padding: `${Math.max(2, Math.round(6 * densityScale))}px`,
        boxShadow: '0 6px 14px rgba(15, 23, 42, 0.14)',
        boxSizing: 'border-box',
        position: 'relative',
      }) as React.CSSProperties,
    getInnerStyle: ({ cornerRadius }) => ({
      borderRadius: `${Math.max(2, cornerRadius - 4)}px`,
      overflow: 'hidden',
    }),
  },
  {
    id: 'gold-foil',
    label: 'Gold Foil Elegance',
    defaultFrameColor: '#fffbeb',
    defaultAccentColor: '#d4af37',
    defaultThickness: 4,
    getContainerStyle: ({ frameColor, accentColor, thickness, cornerRadius, densityScale = 1 }) =>
      ({
        '--frame-color': frameColor,
        '--accent-color': accentColor,
        backgroundColor: 'var(--frame-color)',
        border: `${Math.max(2, Math.round(thickness * densityScale))}px solid var(--accent-color)`,
        outline: `${Math.max(1, Math.round(2 * densityScale))}px solid #fde68a`,
        outlineOffset: `${-Math.max(3, Math.round(5 * densityScale))}px`,
        borderRadius: `${Math.max(4, cornerRadius)}px`,
        padding: `${Math.max(3, Math.round(7 * densityScale))}px`,
        boxShadow: '0 8px 18px rgba(180, 130, 20, 0.18)',
        boxSizing: 'border-box',
      }) as React.CSSProperties,
    getInnerStyle: ({ cornerRadius }) => ({
      borderRadius: `${Math.max(2, cornerRadius - 4)}px`,
      overflow: 'hidden',
    }),
  },
  {
    id: 'confetti-pop',
    label: 'Confetti Celebration',
    defaultFrameColor: '#ffffff',
    defaultAccentColor: '#f43f5e',
    defaultThickness: 4,
    getContainerStyle: ({ frameColor, accentColor, thickness, cornerRadius, densityScale = 1 }) =>
      ({
        '--frame-color': frameColor,
        '--accent-color': accentColor,
        background: `linear-gradient(${frameColor}, ${frameColor}) padding-box, repeating-linear-gradient(60deg, ${accentColor} 0 8px, #fbbf24 8px 16px, #38bdf8 16px 24px, #a855f7 24px 32px) border-box`,
        border: `${Math.max(2, Math.round((thickness + 2) * densityScale))}px solid transparent`,
        borderRadius: `${Math.max(8, cornerRadius)}px`,
        padding: `${Math.max(2, Math.round(4 * densityScale))}px`,
        boxShadow: '0 6px 14px rgba(15, 23, 42, 0.12)',
        boxSizing: 'border-box',
      }) as React.CSSProperties,
    getInnerStyle: ({ cornerRadius }) => ({
      borderRadius: `${Math.max(4, cornerRadius - 4)}px`,
      overflow: 'hidden',
    }),
  },
  {
    id: 'film-negative',
    label: 'Cinema Film Frame',
    defaultFrameColor: '#18181b',
    defaultAccentColor: '#e4e4e7',
    defaultThickness: 4,
    getContainerStyle: ({ frameColor, accentColor, densityScale = 1 }) => {
      const pad = Math.max(3, Math.round(7 * densityScale));
      return {
        '--frame-color': frameColor,
        '--accent-color': accentColor,
        backgroundColor: 'var(--frame-color)',
        border: '2px solid #09090b',
        outline: '2px dashed rgba(255,255,255,0.45)',
        outlineOffset: `${-Math.max(2, Math.round(4 * densityScale))}px`,
        borderRadius: '4px',
        padding: `${pad}px`,
        boxShadow: '0 8px 18px rgba(0, 0, 0, 0.28)',
        boxSizing: 'border-box',
      } as React.CSSProperties;
    },
    getInnerStyle: () => ({
      borderRadius: '2px',
      overflow: 'hidden',
    }),
  },
];

export const COLLAGE_VIBE_PACKS: CollageVibePack[] = [
  {
    id: 'cozy-scrapbook',
    label: 'Cozy Scrapbook',
    description: 'Stitched cream & kraft paper',
    category: 'classic',
    badgeEmoji: '🧵',
    stickerIds: ['stk-washi', 'stk-flower'],
    style: {
      borderArt: 'stitched-scrapbook',
      frameColor: '#fff8f0',
      accentColor: '#f4845f',
      frameThickness: 6,
      effect: 'none',
      mask: 'rounded',
      gap: 14,
      cornerRadius: 16,
      scatterTilt: true,
      slotScale: 1,
    },
    backdrop: {
      type: 'kraft-paper',
      color: '#e6ccb2',
      padding: 20,
    },
  },
  {
    id: 'kawaii-sticker',
    label: 'Kawaii Sticker',
    description: 'Puffy Clay 3D pastel frames',
    category: 'classic',
    badgeEmoji: '🫧',
    stickerIds: ['stk-bow', 'stk-sparkle', 'stk-cloud'],
    style: {
      borderArt: 'puffy-clay',
      frameColor: '#fce7f3',
      accentColor: '#f9a8d4',
      frameThickness: 4,
      effect: 'sticker',
      mask: 'rounded',
      gap: 16,
      cornerRadius: 24,
      scatterTilt: true,
      slotScale: 1,
    },
    backdrop: {
      type: 'solid',
      color: '#fff1f2',
      padding: 18,
    },
  },
  {
    id: 'retro-polaroid',
    label: 'Retro Polaroid',
    description: 'Classic Polaroids & captions',
    category: 'classic',
    badgeEmoji: '📷',
    stickerIds: ['stk-camera', 'stk-washi'],
    style: {
      borderArt: 'polaroid',
      frameColor: '#ffffff',
      accentColor: '#e2e8f0',
      frameThickness: 2,
      effect: 'retro-film',
      mask: 'rounded',
      gap: 14,
      cornerRadius: 4,
      scatterTilt: true,
      slotScale: 1,
    },
    backdrop: {
      type: 'dot-grid',
      color: '#f8fafc',
      padding: 20,
    },
    enableCaptions: true,
  },
  {
    id: 'editorial-minimal',
    label: 'Editorial Clean',
    description: 'Sharp 0px gallery grid',
    category: 'classic',
    badgeEmoji: '🖼️',
    style: {
      borderArt: 'none',
      frameColor: '#ffffff',
      accentColor: '#0f172a',
      frameThickness: 0,
      effect: 'none',
      mask: 'rounded',
      gap: 6,
      cornerRadius: 0,
      scatterTilt: false,
      slotScale: 1,
    },
    backdrop: {
      type: 'none',
      color: '#ffffff',
      padding: 0,
    },
  },
  {
    id: 'pastel-zine',
    label: 'Pastel Zine',
    description: 'Doodle sticker + Duotone Pop',
    category: 'classic',
    badgeEmoji: '🎨',
    stickerIds: ['stk-crown', 'stk-lightning', 'stk-confetti-burst'],
    style: {
      borderArt: 'offset-doodle',
      frameColor: '#ffd166',
      accentColor: '#3d348b',
      frameThickness: 3,
      effect: 'duotone-pop',
      mask: 'rounded',
      gap: 14,
      cornerRadius: 16,
      scatterTilt: false,
      slotScale: 1,
    },
    backdrop: {
      type: 'dot-grid',
      color: '#fefce8',
      padding: 18,
    },
  },
  // Special Occasions
  {
    id: 'birthday-bash',
    label: 'Birthday Bash',
    description: 'Confetti frames & party pop',
    category: 'occasion',
    badgeEmoji: '🎂',
    stickerIds: ['stk-cake', 'stk-balloon', 'stk-confetti-burst'],
    style: {
      borderArt: 'confetti-pop',
      frameColor: '#ffffff',
      accentColor: '#f43f5e',
      frameThickness: 5,
      effect: 'none',
      mask: 'rounded',
      gap: 14,
      cornerRadius: 16,
      scatterTilt: true,
      slotScale: 0.96,
    },
    backdrop: {
      type: 'dot-grid',
      color: '#fff1f2',
      padding: 20,
    },
  },
  {
    id: 'wedding-romance',
    label: 'Wedding & Gold',
    description: 'Ivory & gold foil elegance',
    category: 'occasion',
    badgeEmoji: '💍',
    stickerIds: ['stk-rings', 'stk-gold-heart', 'stk-sparkle'],
    style: {
      borderArt: 'gold-foil',
      frameColor: '#fffdf9',
      accentColor: '#d4af37',
      frameThickness: 4,
      effect: 'none',
      mask: 'rounded',
      gap: 12,
      cornerRadius: 8,
      scatterTilt: false,
      slotScale: 1,
    },
    backdrop: {
      type: 'solid',
      color: '#fdf8f0',
      padding: 22,
    },
  },
  {
    id: 'holiday-festive',
    label: 'Holiday Festive',
    description: 'Peppermint candy-stripe joy',
    category: 'occasion',
    badgeEmoji: '🎄',
    stickerIds: ['stk-tree', 'stk-snowflake', 'stk-gift'],
    style: {
      borderArt: 'candy-stripe',
      frameColor: '#ffffff',
      accentColor: '#e11d48',
      frameThickness: 5,
      effect: 'none',
      mask: 'rounded',
      gap: 14,
      cornerRadius: 14,
      scatterTilt: true,
      slotScale: 0.98,
    },
    backdrop: {
      type: 'solid',
      color: '#ecfdf5',
      padding: 20,
    },
  },
  {
    id: 'baby-milestone',
    label: 'Baby Milestone',
    description: 'Soft dreamy clouds & captions',
    category: 'occasion',
    badgeEmoji: '🍼',
    stickerIds: ['stk-cloud', 'stk-moon', 'stk-bow'],
    style: {
      borderArt: 'puffy-clay',
      frameColor: '#e0f2fe',
      accentColor: '#7dd3fc',
      frameThickness: 4,
      effect: 'clay',
      mask: 'rounded',
      gap: 14,
      cornerRadius: 22,
      scatterTilt: false,
      slotScale: 1,
    },
    backdrop: {
      type: 'pastel-gradient',
      color: '#eff6ff',
      padding: 20,
    },
    enableCaptions: true,
  },
  {
    id: 'travel-journal',
    label: 'Travel Journal',
    description: 'Postage stamps & kraft diary',
    category: 'occasion',
    badgeEmoji: '✈️',
    stickerIds: ['stk-plane', 'stk-compass', 'stk-camera'],
    style: {
      borderArt: 'postage-stamp',
      frameColor: '#fffbeb',
      accentColor: '#0ea5e9',
      frameThickness: 4,
      effect: 'retro-film',
      mask: 'rounded',
      gap: 14,
      cornerRadius: 6,
      scatterTilt: true,
      slotScale: 0.98,
    },
    backdrop: {
      type: 'kraft-paper',
      color: '#ebd5b3',
      padding: 22,
    },
    enableCaptions: true,
  },
  {
    id: 'graduation-honors',
    label: 'Graduation',
    description: 'Classic gold & cinema pride',
    category: 'occasion',
    badgeEmoji: '🎓',
    stickerIds: ['stk-grad-cap', 'stk-trophy', 'stk-sparkle'],
    style: {
      borderArt: 'gold-foil',
      frameColor: '#f8fafc',
      accentColor: '#ca8a04',
      frameThickness: 4,
      effect: 'none',
      mask: 'rounded',
      gap: 10,
      cornerRadius: 6,
      scatterTilt: false,
      slotScale: 1,
    },
    backdrop: {
      type: 'solid',
      color: '#e2e8f0',
      padding: 20,
    },
  },
  {
    id: 'autumn-harvest',
    label: 'Autumn Warmth',
    description: 'Terracotta stitch & film glow',
    category: 'occasion',
    badgeEmoji: '🍂',
    stickerIds: ['stk-autumn-leaf', 'stk-flower'],
    style: {
      borderArt: 'stitched-scrapbook',
      frameColor: '#fff7ed',
      accentColor: '#ea580c',
      frameThickness: 5,
      effect: 'retro-film',
      mask: 'rounded',
      gap: 14,
      cornerRadius: 14,
      scatterTilt: true,
      slotScale: 1,
    },
    backdrop: {
      type: 'kraft-paper',
      color: '#fed7aa',
      padding: 20,
    },
  },
];

export function getMaskClipPath(mask: SlotMaskShape): string | undefined {
  switch (mask) {
    case 'circle':
      return 'circle(50% at 50% 50%)';
    case 'hexagon':
      return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
    case 'diamond':
      return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
    case 'heart':
      return 'polygon(50% 88%, 12% 52%, 4% 28%, 18% 10%, 38% 10%, 50% 24%, 62% 10%, 82% 10%, 96% 28%, 88% 52%)';
    case 'star':
      return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
    default:
      return undefined;
  }
}

export function getBackdropPreviewStyle(backdrop: CollageBackdropConfig): React.CSSProperties {
  if (backdrop.type === 'none') {
    return { backgroundColor: '#ffffff' };
  }

  const patSvg =
    backdrop.patternType && backdrop.patternType !== 'none'
      ? buildPatternSvg({
          type: backdrop.patternType,
          color: backdrop.patternColor || '#4f46e5',
          opacity: backdrop.patternOpacity ?? 0.25,
          scale: 22,
          strokeWidth: 1.5,
          rotation: 0,
        })
      : '';
  const patLayer = patSvg
    ? `url("data:image/svg+xml,${encodeURIComponent(patSvg)}")`
    : undefined;

  if (backdrop.type === 'pastel-gradient') {
    const c1 = backdrop.color || '#fdf2f8';
    const c2 = backdrop.gradientColor2 || '#e0f2fe';
    const angle = backdrop.gradientAngle ?? 135;
    const grad = `linear-gradient(${angle}deg, ${c1}, ${c2})`;
    return patLayer
      ? {
          backgroundImage: `${patLayer}, ${grad}`,
          backgroundRepeat: 'repeat, no-repeat',
          backgroundSize: '22px 22px, 100% 100%',
        }
      : { backgroundImage: grad };
  }
  if (backdrop.type === 'kraft-paper') {
    return {
      backgroundColor: backdrop.color || '#e6ccb2',
      backgroundImage: patLayer
        ? `${patLayer}, radial-gradient(rgba(120, 80, 40, 0.14) 1px, transparent 1px)`
        : 'radial-gradient(rgba(120, 80, 40, 0.14) 1px, transparent 1px), radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)',
      backgroundSize: patLayer ? '22px 22px, 14px 14px' : '14px 14px',
      backgroundPosition: patLayer ? '0 0, 0 0' : '0 0, 7px 7px',
    };
  }
  if (backdrop.type === 'dot-grid') {
    return {
      backgroundColor: backdrop.color || '#f8fafc',
      backgroundImage: patLayer
        ? `${patLayer}, radial-gradient(rgba(100, 116, 139, 0.28) 1.2px, transparent 1.2px)`
        : 'radial-gradient(rgba(100, 116, 139, 0.28) 1.2px, transparent 1.2px)',
      backgroundSize: patLayer ? '22px 22px, 14px 14px' : '14px 14px',
    };
  }
  return patLayer
    ? {
        backgroundColor: backdrop.color || '#f1f5f9',
        backgroundImage: patLayer,
        backgroundRepeat: 'repeat',
        backgroundSize: '22px 22px',
      }
    : {
        backgroundColor: backdrop.color || '#f1f5f9',
      };
}

export function getEffectCssFilter(effect: StyleEffectId): string | undefined {
  switch (effect) {
    case 'retro-film':
      return 'sepia(35%) contrast(112%) saturate(90%) brightness(102%)';
    case 'duotone-pop':
      return 'saturate(175%) contrast(125%) brightness(104%)';
    case 'cartoon':
      return 'contrast(130%) saturate(135%)';
    default:
      return undefined;
  }
}

export function toPublisherBorderArt(id: BorderArtId): BorderArtStyle {
  if (id === 'postage-stamp') return 'stamp-postage';
  if (id === 'offset-doodle') return 'doodle-box';
  if (id === 'gold-foil') return 'double-gold';
  if (id === 'confetti-pop') return 'dots-and-dashes';
  if (id === 'film-negative') return 'filmstrip';
  return id;
}

export function fromPublisherBorderArt(style?: BorderArtStyle): BorderArtId {
  if (!style) return 'none';
  if (style === 'stamp-postage') return 'postage-stamp';
  if (style === 'doodle-box') return 'offset-doodle';
  if (style === 'double-gold') return 'gold-foil';
  if (style === 'dots-and-dashes') return 'confetti-pop';
  if (style === 'filmstrip') return 'film-negative';
  const valid = COLLAGE_BORDER_ART_OPTIONS.some((o) => o.id === style);
  return valid ? (style as BorderArtId) : 'none';
}

export function toPublisherEffect(effect: StyleEffectId): ImageEffectPreset {
  return effect;
}

export function toPublisherMask(mask: SlotMaskShape): ImageElement['maskShape'] {
  return mask;
}
