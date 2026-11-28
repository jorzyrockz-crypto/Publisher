import React, { useRef } from 'react';
import {
  Crop,
  LayoutGrid,
  Minus,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  Shuffle,
  Sparkles,
  SquareDashed,
  Images,
  SlidersHorizontal,
} from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import { useCollageSelection } from '../../hooks/useCollageSelection';
import { COLLAGE_PANEL_SECTIONS_ENABLED, type CollageControlSection } from '../../constants/collageControls';
import { COLLAGE_LAYOUTS } from '../../utils/collageLayouts';
import type { CollageBackdropConfig } from '../../utils/borderArtStyles';

const GAP_STEP = 2;
const GAP_MIN = 0;
const GAP_MAX = 40;
const CORNER_STEP = 2;
const CORNER_MIN = 0;
const CORNER_MAX = 48;

/**
 * Remembers the last real backdrop per collage, so the Backdrop toggle can turn it off and
 * back on without guessing what it used to be. A kraft-paper backdrop silently becoming a
 * flat colour is the kind of detail that makes a toolbar untrustworthy.
 */
const lastBackdrop = new Map<string, CollageBackdropConfig>();

/**
 * The collage's own toolbar, shown while a collage is selected.
 *
 * Two kinds of button, deliberately: the ones that do one thing act immediately, and the
 * ones that need a value picked open the context panel. A bar full of pickers is a modal
 * wearing a hat.
 *
 * Rendered by both the Publisher selection toolbar and the Designer context bar, so the
 * two modes cannot drift apart.
 */
export const CollageActionBar: React.FC = () => {
  const { patchCollageMeta, openCollageEditor, openCollageControl } = usePublisher();
  const collage = useCollageSelection();
  // Rounding carries a vibe pack's look, so a manual change clears the pack label; the ref
  // keeps that from re-rendering on every pointer move over the bar.
  const pendingRef = useRef(false);

  if (!collage) return null;

  const { groupId, meta, origin, filledSlots, slotCount } = collage;
  const gap = meta.globalStyle.gap;
  const corners = meta.globalStyle.cornerRadius;

  const patch = (next: Parameters<typeof patchCollageMeta>[1]) => patchCollageMeta(groupId, next);

  const setGap = (next: number) => {
    const clamped = Math.min(GAP_MAX, Math.max(GAP_MIN, Math.round(next)));
    if (clamped === gap) return;
    patch({ ...meta, globalStyle: { ...meta.globalStyle, gap: clamped }, vibePackId: undefined });
  };

  const setCorners = (next: number) => {
    const clamped = Math.min(CORNER_MAX, Math.max(CORNER_MIN, Math.round(next)));
    if (clamped === corners) return;
    patch({
      ...meta,
      globalStyle: { ...meta.globalStyle, cornerRadius: clamped },
      vibePackId: undefined,
    });
  };

  /** Next preset that still has room for every photo — a four-photo collage never shrinks
   *  into a two-slot layout, which would silently hide two of them. */
  const cycleLayout = () => {
    const candidates = COLLAGE_LAYOUTS.filter(
      (layout) => layout.slotCount >= Math.max(1, filledSlots)
    );
    if (candidates.length === 0) return;
    const current = candidates.findIndex((layout) => layout.id === meta.layoutId);
    // A dynamic or custom layout is not in the list: move to the first preset that fits.
    const nextIndex = current === -1 ? 0 : (current + 1) % candidates.length;
    patch({ ...meta, layoutId: candidates[nextIndex].id, customLayout: undefined });
  };

  /** Photos swap frames; the layout and every framing stay exactly where they are. */
  const shufflePhotos = () => {
    const filled = meta.slots.filter((slot) => slot.imageUrl);
    if (filled.length < 2) return;
    const rotated = [...filled.slice(1), filled[0]];
    let cursor = 0;
    patch({
      ...meta,
      slots: meta.slots.map((slot) => {
        if (!slot.imageUrl) return slot;
        const replacement = rotated[cursor++];
        return { ...slot, imageUrl: replacement.imageUrl, naturalWidth: replacement.naturalWidth, naturalHeight: replacement.naturalHeight };
      }),
      vibePackId: undefined,
    });
  };

  /** Puts every photo back to its full frame: no pan, no zoom. */
  const refitPhotos = () => {
    const hasFraming = meta.slots.some((slot) => slot.cropX !== 0 || slot.cropY !== 0 || slot.zoom !== 1);
    if (!hasFraming) return;
    patch({
      ...meta,
      slots: meta.slots.map((slot) => ({ ...slot, cropX: 0, cropY: 0, zoom: 1 })),
      vibePackId: undefined,
    });
  };

  const toggleBackdrop = () => {
    if (meta.backdrop.type !== 'none') {
      lastBackdrop.set(groupId, { ...meta.backdrop });
      patch({ ...meta, backdrop: { ...meta.backdrop, type: 'none' }, vibePackId: undefined });
      return;
    }
    const remembered = lastBackdrop.get(groupId);
    patch({
      ...meta,
      backdrop: remembered ?? { ...meta.backdrop, type: 'solid' },
      vibePackId: undefined,
    });
  };

  const openSection = (section: CollageControlSection) => {
    if (COLLAGE_PANEL_SECTIONS_ENABLED) {
      openCollageControl(section);
    } else {
      openCollageEditor({ meta, groupId, originX: origin.x, originY: origin.y });
    }
  };

  const iconButton =
    'p-1.5 rounded-full text-[#5b6673] hover:bg-[#f4f2ff] hover:text-[#5c4bb8] transition active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed';
  const sectionButton =
    'flex items-center gap-1 px-1.5 py-1 rounded-[8px] text-[10.5px] font-semibold text-[#5b6673] hover:bg-[#f4f2ff] hover:text-[#5c4bb8] transition active:scale-95';
  const divider = <div className="w-[1px] h-4 bg-[#e9edf2] mx-0.5 flex-shrink-0" />;
  const stepLabel = 'min-w-[20px] text-center text-[11px] font-mono font-semibold text-[#202833] tabular-nums';

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="flex max-w-[calc(100vw-40px)] flex-wrap items-center gap-0.5 px-1.5 py-1 bg-white/95 backdrop-blur border border-[#e5e9ee] rounded-[12px] shadow-[0_8px_28px_rgba(22,26,34,0.14)]">
        <span className="flex items-center gap-1 px-2 text-[10px] font-semibold text-[#5b6673] whitespace-nowrap">
          <LayoutGrid size={11} className="text-[#6e56cf]" />
          Collage
          <span className="text-[#8b95a1] tabular-nums font-medium">
            {filledSlots}/{slotCount}
          </span>
        </span>

        {divider}

        {/* Nested: pick a layout / manage photos in the panel */}
        <button type="button" onClick={() => openSection('layouts')} title="Layout presets" className={sectionButton}>
          <SquareDashed size={11} />
          Layout
        </button>
        <button type="button" onClick={() => openSection('photos')} title="Add or remove photos" className={sectionButton}>
          <Images size={11} />
          Photos
        </button>

        {divider}

        <span className="px-1 text-[10px] font-semibold text-[#8b95a1] whitespace-nowrap">Spacing</span>
        <button
          type="button"
          aria-label="Decrease collage spacing"
          title={`Less space between photos (now ${gap}px)`}
          onClick={() => setGap(gap - GAP_STEP)}
          disabled={gap <= GAP_MIN}
          className={iconButton}
        >
          <Minus size={13} />
        </button>
        <span className={stepLabel}>{gap}</span>
        <button
          type="button"
          aria-label="Increase collage spacing"
          title={`More space between photos (now ${gap}px)`}
          onClick={() => setGap(gap + GAP_STEP)}
          disabled={gap >= GAP_MAX}
          className={iconButton}
        >
          <Plus size={13} />
        </button>

        {divider}

        <span className="px-1 text-[10px] font-semibold text-[#8b95a1] whitespace-nowrap">Corners</span>
        <button
          type="button"
          aria-label="Decrease collage corner radius"
          title={`Sharper corners (now ${corners}px)`}
          onClick={() => setCorners(corners - CORNER_STEP)}
          disabled={corners <= CORNER_MIN}
          className={iconButton}
        >
          <Minus size={13} />
        </button>
        <span className={stepLabel}>{corners}</span>
        <button
          type="button"
          aria-label="Increase collage corner radius"
          title={`Rounder corners (now ${corners}px)`}
          onClick={() => setCorners(corners + CORNER_STEP)}
          disabled={corners >= CORNER_MAX}
          className={iconButton}
        >
          <Plus size={13} />
        </button>

        {divider}

        {/* Direct: one click, one known result */}
        <button
          type="button"
          aria-label="Cycle collage layout"
          title="Next layout that still holds every photo"
          onClick={cycleLayout}
          className={iconButton}
        >
          <RefreshCw size={13} />
        </button>
        <button
          type="button"
          aria-label="Shuffle collage photos"
          title="Swap photos between frames — layout and framings stay put"
          onClick={shufflePhotos}
          disabled={filledSlots < 2}
          className={iconButton}
        >
          <Shuffle size={13} />
        </button>
        <button
          type="button"
          aria-label="Re-fit collage photos"
          title="Put every photo back to its full frame"
          onClick={refitPhotos}
          className={iconButton}
        >
          <Crop size={13} />
        </button>
        <button
          type="button"
          aria-label="Toggle collage backdrop"
          aria-pressed={meta.backdrop.type !== 'none'}
          title="Backdrop on or off"
          onClick={toggleBackdrop}
          className={`${iconButton} ${
            meta.backdrop.type !== 'none' ? 'bg-[#efeafd] text-[#5c4bb8]' : ''
          }`}
        >
          <Palette size={13} />
        </button>
        <button
          type="button"
          aria-label="Backdrop and frame settings"
          title="Backdrop and frame settings"
          onClick={() => openSection('backdrop')}
          className={iconButton}
        >
          <SlidersHorizontal size={13} />
        </button>

        {divider}

        <button
          type="button"
          onClick={() => openSection('vibes')}
          title="Vibe packs — pick a look for this collage"
          className={sectionButton}
        >
          <Sparkles size={11} />
          Vibe
        </button>

        <button
          type="button"
          onClick={() => {
            if (pendingRef.current) return;
            pendingRef.current = true;
            openCollageEditor({ meta, groupId, originX: origin.x, originY: origin.y });
            setTimeout(() => {
              pendingRef.current = false;
            }, 300);
          }}
          title="Open the collage builder for photos, layouts, stickers and frames"
          className="flex items-center gap-1 px-2 py-1 rounded-[8px] text-[10.5px] font-semibold text-[#5c4bb8] hover:bg-[#efeafd] transition"
        >
          <Pencil size={11} />
          Edit
        </button>
      </div>
    </div>
  );
};
