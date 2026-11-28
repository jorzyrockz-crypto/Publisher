import React from 'react';
import { FileText } from 'lucide-react';
import { RecentDesign, formatEditedAgo } from '../../utils/recentDesigns';

/**
 * A saved design, as a card.
 *
 * The thumbnail is the JPEG the save wrote (page 1 through the canvas painter). When that could
 * not be made, the tile falls back to paper proportions drawn from the page size — the card still
 * says "this was landscape", which is what you need to tell two designs apart at a glance.
 */
export const RecentDesignCard: React.FC<{
  design: RecentDesign;
  onOpen: (design: RecentDesign) => void;
  /** Compact cards for the horizontal strip, larger ones for the My Projects grid. */
  layout?: 'strip' | 'grid';
}> = ({ design, onOpen, layout = 'strip' }) => {
  const isStrip = layout === 'strip';
  const aspect = design.width && design.height ? design.width / design.height : 1.414;

  return (
    <button
      type="button"
      onClick={() => onOpen(design)}
      className={`group flex cursor-pointer flex-col text-left ${
        isStrip ? 'w-[196px] flex-shrink-0' : 'w-full'
      }`}
      title={`Open ${design.name}`}
    >
      <span
        className={`relative flex items-center justify-center overflow-hidden rounded-tile border border-line bg-surface-sunken transition-[transform,box-shadow] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-elevated ${
          isStrip ? 'h-[124px]' : 'h-[150px]'
        }`}
      >
        {design.thumbnail ? (
          <img
            src={design.thumbnail}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <span
            className="flex items-center justify-center rounded-chip border border-line-soft bg-surface text-ink-faint"
            style={{
              aspectRatio: `${Math.max(0.4, Math.min(2.5, aspect))}`,
              height: '76%',
            }}
          >
            <FileText size={18} />
          </span>
        )}
        <span className="home-card-scrim pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/45">
          <span className="rounded-full bg-surface px-3 py-1 text-2xs font-semibold text-ink shadow-sm">
            Open
          </span>
        </span>
      </span>
      <span className="mt-2 block truncate text-meta font-semibold text-ink group-hover:text-accent-ink">
        {design.name}
      </span>
      <span className="block truncate text-2xs text-ink-muted">
        {formatEditedAgo(design.updatedAt)} · {design.pageCount} page
        {design.pageCount === 1 ? '' : 's'}
      </span>
    </button>
  );
};
