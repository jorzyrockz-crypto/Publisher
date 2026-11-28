import {
  CollageMeta,
  CollageSlotState,
  toPublisherBorderArt,
  toPublisherEffect,
  toPublisherMask,
} from './borderArtStyles';
import { computeCollageSlots, resolveCollageLayout } from './collageLayouts';
import { getStickerById } from '../constants/stickerLibrary';
import type {
  BackgroundPatternType,
  ImageElement,
  PublisherElement,
  ShapeElement,
} from '../types/publisher';

/**
 * One builder for a collage, used by the builder modal *and* by the on-canvas controls.
 *
 * It used to live inside `CollageModal`'s save handler, which meant nothing outside the
 * modal could apply a change to a collage that was already on the page — and, worse, that
 * any second caller would have had to reimplement it. Two implementations of "meta →
 * elements" would disagree, and the same collage would look different depending on which
 * door you came in through.
 */

export const createEmptySlot = (): CollageSlotState => ({
  imageUrl: null,
  cropX: 0,
  cropY: 0,
  zoom: 1,
  imageRotation: 0,
  flipH: false,
});

/**
 * Canvas size for an aspect ratio. Deliberately the same maths the modal already used
 * (`maxBox` is the only bound), so a collage rebuilt from the canvas is the same size as
 * one the modal would have written.
 */
export function getAspectDimensions(
  aspect: CollageMeta['aspectRatio'],
  availW: number,
  availH: number,
  paperW: number,
  paperH: number,
  maxBox: number
): { width: number; height: number } {
  let ratio = 1;
  if (aspect === '4:3') ratio = 4 / 3;
  else if (aspect === '3:4') ratio = 3 / 4;
  else if (aspect === '16:9') ratio = 16 / 9;
  else if (aspect === '9:16') ratio = 9 / 16;
  else if (aspect === 'page-margin') ratio = availW / Math.max(1, availH);
  else if (aspect === 'full-paper') ratio = paperW / Math.max(1, paperH);

  let width = maxBox;
  let height = Math.round(maxBox / ratio);
  if (height > maxBox) {
    height = maxBox;
    width = Math.round(maxBox * ratio);
  }
  return { width: Math.max(120, width), height: Math.max(120, height) };
}

/** The canvas a collage of this meta occupies, and where it starts on a blank page. */
export function resolveCollageCanvas(
  meta: CollageMeta,
  pageWidth: number,
  pageHeight: number,
  margins: { left: number; right: number; top: number; bottom: number }
): { width: number; height: number; defaultX: number; defaultY: number } {
  const availW = Math.max(220, pageWidth - margins.left - margins.right);
  const availH = Math.max(220, pageHeight - margins.top - margins.bottom);
  const dims =
    meta.aspectRatio === 'page-margin'
      ? { width: availW, height: availH }
      : meta.aspectRatio === 'full-paper'
      ? { width: pageWidth, height: pageHeight }
      : getAspectDimensions(
          meta.aspectRatio,
          availW,
          availH,
          pageWidth,
          pageHeight,
          Math.min(availW, availH, 680)
        );
  const defaultX =
    meta.aspectRatio === 'full-paper'
      ? 0
      : meta.aspectRatio === 'page-margin'
      ? margins.left
      : Math.round((pageWidth - dims.width) / 2);
  const defaultY =
    meta.aspectRatio === 'full-paper'
      ? 0
      : meta.aspectRatio === 'page-margin'
      ? margins.top
      : Math.round((pageHeight - dims.height) / 2);
  return { ...dims, defaultX, defaultY };
}

export interface PageBackdropPatch {
  backgroundColor: string;
  backgroundGradient?: {
    color1: string;
    color2: string;
    angle: number;
  };
  backgroundPattern?: {
    type: BackgroundPatternType;
    color: string;
    opacity: number;
    scale: number;
    strokeWidth: number;
    rotation: number;
  };
}

export interface CollageBuildInput {
  meta: CollageMeta;
  /** Top-left of the collage canvas on the page, in page pixels. */
  originX: number;
  originY: number;
  pageWidth: number;
  pageHeight: number;
  margins: { left: number; right: number; top: number; bottom: number };
  /** Group stamped on every element. Omit for a loose insert. */
  groupId?: string;
  /** Variation seed for the scatter tilt. */
  tiltSeed?: number;
  /**
   * Stamp `collageMeta` on the slot images too, which is what makes a collage editable
   * later. Matches the modal's "group the slots" option; the backdrop card always carries
   * it so a collage is never unreachable.
   */
  groupSlots?: boolean;
}

export interface CollageBuildResult {
  elements: PublisherElement[];
  /** Page background the collage wants applied (only when it covers the page). */
  pageBackdrop: PageBackdropPatch | null;
}

export function buildCollageElements(input: CollageBuildInput): CollageBuildResult {
  const { meta, originX, originY, pageWidth, pageHeight, margins, groupId } = input;
  const groupSlots = input.groupSlots ?? true;
  const tiltSeed = input.tiltSeed ?? 0;

  const canvasDims = resolveCollageCanvas(meta, pageWidth, pageHeight, margins);

  const slotPhotoDims = meta.slots.map((slot) => ({
    width: slot.naturalWidth,
    height: slot.naturalHeight,
  }));

  const aspect = canvasDims.width / Math.max(1, canvasDims.height);
  const layout = resolveCollageLayout(meta, slotPhotoDims, aspect);

  const canvasPad = meta.backdrop.type === 'none' ? 0 : Math.round(meta.backdrop.padding * 1.4);
  const slotCanvasW = Math.max(120, canvasDims.width - canvasPad * 2);
  const slotCanvasH = Math.max(120, canvasDims.height - canvasPad * 2);
  const canvasSlots = computeCollageSlots(
    layout,
    slotCanvasW,
    slotCanvasH,
    Math.round(meta.globalStyle.gap * 1.3),
    meta.globalStyle.scatterTilt,
    meta.globalStyle.slotScale ?? 1,
    meta.sizeSeed ?? 0
  );

  // Deep copy: the caller (and the caller's caller) must not be able to mutate the meta
  // through the elements we hand back.
  const serializedMeta: CollageMeta = JSON.parse(JSON.stringify(meta));
  // Minted once, at insert: every element of this collage carries it from then on, so the
  // collage can be found again whatever happens to its group.
  if (!serializedMeta.collageId) {
    serializedMeta.collageId = `col-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
  const elements: PublisherElement[] = [];
  let pageBackdrop: PageBackdropPatch | null = null;

  if (meta.coverDocumentBackground && meta.backdrop.type !== 'none') {
    const overlayPat =
      meta.backdrop.patternType && meta.backdrop.patternType !== 'none'
        ? {
            type: meta.backdrop.patternType as BackgroundPatternType,
            color: meta.backdrop.patternColor || '#4f46e5',
            opacity: meta.backdrop.patternOpacity ?? 0.25,
            scale: 22,
            strokeWidth: 1.5,
            rotation: 0,
          }
        : undefined;

    if (meta.backdrop.type === 'pastel-gradient') {
      pageBackdrop = {
        backgroundColor: meta.backdrop.color || '#fdf2f8',
        backgroundGradient: {
          color1: meta.backdrop.color || '#fdf2f8',
          color2: meta.backdrop.gradientColor2 || '#e0f2fe',
          angle: meta.backdrop.gradientAngle ?? 135,
        },
        backgroundPattern: overlayPat,
      };
    } else if (meta.backdrop.type === 'dot-grid') {
      pageBackdrop = {
        backgroundColor: meta.backdrop.color || '#f8fafc',
        backgroundPattern: overlayPat || {
          type: 'dots',
          color: '#64748b',
          opacity: 0.25,
          scale: 22,
          strokeWidth: 1.5,
          rotation: 0,
        },
      };
    } else if (meta.backdrop.type === 'kraft-paper') {
      pageBackdrop = {
        backgroundColor: meta.backdrop.color || '#e6ccb2',
        backgroundPattern: overlayPat || {
          type: 'terrazzo',
          color: '#785028',
          opacity: 0.14,
          scale: 26,
          strokeWidth: 1.5,
          rotation: 0,
        },
      };
    } else {
      pageBackdrop = {
        backgroundColor: meta.backdrop.color || '#f1f5f9',
        backgroundPattern: overlayPat,
      };
    }
  }

  // Optional backdrop card behind the slots.
  if (meta.backdrop.type !== 'none' && !meta.coverDocumentBackground) {
    const backdropFill =
      meta.backdrop.type === 'pastel-gradient'
        ? meta.backdrop.color || '#fdf2f8'
        : meta.backdrop.color || '#f8fafc';
    const backdropEl: ShapeElement = {
      id: `shp-col-bg-${Date.now()}`,
      type: 'shape',
      name: 'Collage Backdrop Card',
      groupId,
      collageMeta: serializedMeta,
      shapeType: 'rounded-rect',
      cornerRadius: 18,
      fillColor: backdropFill,
      fillType: meta.backdrop.type === 'pastel-gradient' ? 'linear-gradient' : 'solid',
      gradientColor2:
        meta.backdrop.type === 'pastel-gradient'
          ? meta.backdrop.gradientColor2 || '#e0f2fe'
          : undefined,
      gradientAngle: meta.backdrop.gradientAngle ?? 135,
      strokeColor: meta.backdrop.type === 'kraft-paper' ? '#d4a373' : '#e2e8f0',
      strokeWidth: 1,
      x: originX,
      y: originY,
      width: canvasDims.width,
      height: canvasDims.height,
      rotation: 0,
      zIndex: 1,
      shadow: true,
      shadowBlur: 14,
    };
    elements.push(backdropEl);
  }

  canvasSlots.forEach((slot, idx) => {
    const slotState = meta.slots[idx] || createEmptySlot();
    const effBorderArt = slotState.styleOverride?.borderArt ?? meta.globalStyle.borderArt;
    const effFrameColor = slotState.styleOverride?.frameColor ?? meta.globalStyle.frameColor;
    const effAccentColor = slotState.styleOverride?.accentColor ?? meta.globalStyle.accentColor;
    const effThickness = slotState.styleOverride?.frameThickness ?? meta.globalStyle.frameThickness;
    const effEffect = slotState.styleOverride?.effect ?? meta.globalStyle.effect;
    const effMask = slotState.styleOverride?.mask ?? meta.globalStyle.mask;

    const tiltOffset =
      tiltSeed > 0 && meta.globalStyle.scatterTilt
        ? ((idx + tiltSeed) % 2 === 0 ? 1 : -1) * (((idx * 3 + tiltSeed) % 5) + 1)
        : 0;
    const finalRotation = meta.globalStyle.scatterTilt ? slot.rotation + tiltOffset : slot.rotation;

    const imgEl: ImageElement = {
      id: `img-col-${Date.now()}-${idx}`,
      type: 'image',
      name: slotState.imageUrl ? `Collage Photo ${idx + 1}` : `Photo Slot ${idx + 1}`,
      groupId,
      collageMeta: groupSlots ? serializedMeta : undefined,
      src: slotState.imageUrl || '',
      x: originX + canvasPad + slot.x,
      y: originY + canvasPad + slot.y,
      width: slot.width,
      height: slot.height,
      rotation: finalRotation,
      zIndex: 2 + (slotState.zIndexOverride ?? slot.zIndex),
      objectFit: 'cover',
      aspectRatioLocked: false,
      borderRadius: meta.globalStyle.cornerRadius,
      borderArt: toPublisherBorderArt(effBorderArt),
      borderArtColor: effFrameColor,
      borderArtColor2: effAccentColor,
      borderArtWidth: effThickness,
      borderArtCaption: slotState.caption,
      effectPreset: toPublisherEffect(effEffect),
      maskShape: toPublisherMask(effMask),
      panX: slotState.cropX,
      panY: slotState.cropY,
      imageScale: slotState.zoom,
      imageRotation: slotState.imageRotation,
      flipH: slotState.flipH,
    };
    elements.push(imgEl);
  });

  // Placed vibe stickers, layered on top.
  (meta.stickers || []).forEach((placed, idx) => {
    const def = getStickerById(placed.stickerId);
    if (!def) return;
    const stickerPx = Math.round(
      (placed.size / 450) * Math.min(canvasDims.width, canvasDims.height)
    );
    const stickerEl: ImageElement = {
      id: `img-col-stk-${Date.now()}-${idx}`,
      type: 'image',
      name: `${def.name} Sticker`,
      groupId,
      collageMeta: groupSlots ? serializedMeta : undefined,
      src: def.dataUri,
      x: Math.round(originX + placed.x * canvasDims.width),
      y: Math.round(originY + placed.y * canvasDims.height),
      width: Math.max(32, stickerPx),
      height: Math.max(32, stickerPx),
      rotation: placed.rotation,
      zIndex: 40 + idx,
      objectFit: 'contain',
      aspectRatioLocked: true,
      effectPreset: 'sticker',
    };
    elements.push(stickerEl);
  });

  return { elements, pageBackdrop };
}

/** Where a collage of this meta should start when it is being placed for the first time. */
export function defaultCollageOrigin(
  meta: CollageMeta,
  pageWidth: number,
  pageHeight: number,
  margins: { left: number; right: number; top: number; bottom: number }
): { x: number; y: number; width: number; height: number } {
  const canvas = resolveCollageCanvas(meta, pageWidth, pageHeight, margins);
  return { x: canvas.defaultX, y: canvas.defaultY, width: canvas.width, height: canvas.height };
}
