import { COLLAGE_VIBE_PACKS, CollageMeta, CollagePlacedSticker } from './borderArtStyles';

/**
 * Applying a vibe pack is a pure transformation of a `CollageMeta`, so both the builder
 * modal and the on-canvas panel do it through this one function. A pack means the same
 * thing in both places or it means nothing.
 */

const STICKER_ANCHORS = [
  { x: 0.03, y: 0.03, rotation: -10 },
  { x: 0.85, y: 0.84, rotation: 8 },
  { x: 0.84, y: 0.04, rotation: 12 },
  { x: 0.04, y: 0.84, rotation: -8 },
];

function buildStickersFromIds(ids: string[] = []): CollagePlacedSticker[] {
  return ids.slice(0, 4).map((stickerId, i) => ({
    id: `col-stk-${Date.now()}-${i}`,
    stickerId,
    x: STICKER_ANCHORS[i % STICKER_ANCHORS.length].x,
    y: STICKER_ANCHORS[i % STICKER_ANCHORS.length].y,
    size: 56,
    rotation: STICKER_ANCHORS[i % STICKER_ANCHORS.length].rotation,
  }));
}

export interface ApplyVibeOptions {
  /** Packs that carry stickers get them; the modal exposes this as a checkbox. */
  includeStickers?: boolean;
}

/**
 * Pack style and backdrop replace the collage's own; photos, crops, slot framing and the
 * collage's position are untouched. Restyling must never re-frame someone's photographs.
 */
export function applyVibePack(
  prev: CollageMeta,
  packId: string,
  options: ApplyVibeOptions = {}
): CollageMeta {
  const pack = COLLAGE_VIBE_PACKS.find((candidate) => candidate.id === packId);
  if (!pack) return prev;

  const includeStickers = options.includeStickers ?? true;

  return {
    ...prev,
    vibePackId: pack.id,
    globalStyle: { ...prev.globalStyle, ...pack.style },
    backdrop: { ...pack.backdrop },
    stickers:
      includeStickers && pack.stickerIds?.length ? buildStickersFromIds(pack.stickerIds) : [],
    slots: prev.slots.map((slot, idx) => ({
      ...slot,
      caption: pack.enableCaptions && !slot.caption ? `Memory #${idx + 1}` : slot.caption,
    })),
  };
}
