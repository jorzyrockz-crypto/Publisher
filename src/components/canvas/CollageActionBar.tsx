import React from 'react';
import { LayoutGrid, Minus, Pencil, Plus } from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import { useCollageSelection } from '../../hooks/useCollageSelection';

const GAP_STEP = 2;
const GAP_MIN = 0;
const GAP_MAX = 40;

/**
 * The collage's own toolbar, shown while a collage is selected.
 *
 * Single-function buttons act immediately on the collage on the page — no modal, no
 * confirmation. Anything that needs a value picked belongs in the context panel instead;
 * that split is deliberate, because a bar full of pickers is a modal wearing a hat.
 *
 * Rendered by both the Publisher selection toolbar and the Designer context bar, so the
 * two modes cannot drift apart.
 */
export const CollageActionBar: React.FC = () => {
  const { patchCollageMeta, openCollageEditor } = usePublisher();
  const collage = useCollageSelection();

  if (!collage) return null;

  const { groupId, meta, origin, filledSlots, slotCount } = collage;
  const gap = meta.globalStyle.gap;

  const setGap = (next: number) => {
    const clamped = Math.min(GAP_MAX, Math.max(GAP_MIN, Math.round(next)));
    if (clamped === gap) return;
    patchCollageMeta(groupId, {
      ...meta,
      globalStyle: { ...meta.globalStyle, gap: clamped },
      // A hand-set value is no longer purely the pack's, so the pack label goes away.
      vibePackId: undefined,
    });
  };

  const buttonClass =
    'p-1.5 rounded-full text-[#5b6673] hover:bg-[#f4f2ff] hover:text-[#5c4bb8] transition active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed';

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="flex items-center gap-0.5 px-1.5 py-1 bg-white/95 backdrop-blur border border-[#e5e9ee] rounded-[12px] shadow-[0_8px_28px_rgba(22,26,34,0.14)]">
        <span className="flex items-center gap-1 px-2 text-[10px] font-semibold text-[#5b6673] whitespace-nowrap">
          <LayoutGrid size={11} className="text-[#6e56cf]" />
          Collage
          <span className="text-[#8b95a1] tabular-nums font-medium">
            {filledSlots}/{slotCount}
          </span>
        </span>

        <div className="w-[1px] h-4 bg-[#e9edf2] mx-0.5" />

        <span className="px-1 text-[10px] font-semibold text-[#8b95a1] whitespace-nowrap">
          Spacing
        </span>
        <button
          type="button"
          aria-label="Decrease collage spacing"
          title={`Less space between photos (now ${gap}px)`}
          onClick={() => setGap(gap - GAP_STEP)}
          disabled={gap <= GAP_MIN}
          className={buttonClass}
        >
          <Minus size={13} />
        </button>
        <span className="min-w-[22px] text-center text-[11px] font-mono font-semibold text-[#202833] tabular-nums">
          {gap}
        </span>
        <button
          type="button"
          aria-label="Increase collage spacing"
          title={`More space between photos (now ${gap}px)`}
          onClick={() => setGap(gap + GAP_STEP)}
          disabled={gap >= GAP_MAX}
          className={buttonClass}
        >
          <Plus size={13} />
        </button>

        <div className="w-[1px] h-4 bg-[#e9edf2] mx-0.5" />

        <button
          type="button"
          onClick={() =>
            openCollageEditor({
              meta,
              groupId,
              originX: origin.x,
              originY: origin.y,
            })
          }
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
