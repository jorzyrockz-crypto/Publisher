import React from 'react';
import { ChevronRight, LayoutGrid, Printer } from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';

/**
 * Tools — the two jobs that are not "edit this page".
 *
 * Both of these start with the work rather than with a blank canvas: the collage maker wants photos,
 * the tarpaulin printer wants a design that already exists. Sitting them at the top of the left
 * sidebar, above Pages & Layers, means a teacher finds them before they start drawing, and the rail
 * still collapses to a strip when the canvas needs the room.
 */

interface ToolBannerProps {
  title: string;
  hint: string;
  Icon: typeof LayoutGrid;
  tone: 'violet' | 'amber';
  onClick: () => void;
}

const TONES = {
  violet: {
    card: 'border-[#e3dcfb] hover:border-[#c9bcf5] hover:bg-[#f7f4ff]',
    chip: 'bg-[#efeafd] text-[#5c4bb8]',
    title: 'text-[#3c2f96]',
    glow: 'shadow-[0_1px_0_rgba(92,75,184,0.06)]',
  },
  amber: {
    card: 'border-[#f6e3c0] hover:border-[#eccf9a] hover:bg-[#fffaf1]',
    chip: 'bg-[#fdf0d8] text-[#a5691a]',
    title: 'text-[#8a5310]',
    glow: 'shadow-[0_1px_0_rgba(180,120,20,0.06)]',
  },
} as const;

const ToolBanner: React.FC<ToolBannerProps> = ({ title, hint, Icon, tone, onClick }) => {
  const t = TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      className={`group w-full flex items-center gap-2 px-2 py-2 rounded-[10px] border bg-white text-left transition cursor-pointer ${t.card} ${t.glow}`}
    >
      <span className={`w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 ${t.chip}`}>
        <Icon size={14} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[11px] font-bold leading-tight truncate ${t.title}`}>
          {title}
        </span>
        <span className="block text-[9px] leading-tight text-[#8a94a0] truncate">{hint}</span>
      </span>
      <ChevronRight
        size={12}
        className="shrink-0 text-[#c3ccd6] transition-transform group-hover:translate-x-0.5 group-hover:text-[#8a94a0]"
      />
    </button>
  );
};

export const SidebarTools: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { setIsCollageModalOpen, setIsTarpapelModalOpen } = usePublisher();

  return (
    <div className="px-3 pt-2.5 pb-2.5 border-b border-[#eef1f5]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-bold uppercase tracking-[0.09em] text-[#9aa4b0]">
          Tools
        </span>
      </div>
      <div className="space-y-1.5">
        <ToolBanner
          title="Collage Maker"
          hint={compact ? 'Grid of photos' : 'Photos into a grid'}
          Icon={LayoutGrid}
          tone="violet"
          onClick={() => setIsCollageModalOpen(true)}
        />
        <ToolBanner
          title={compact ? 'Tarpapel' : 'Tarpaulin Printer'}
          hint={compact ? 'A4 sheets' : 'Any design, on A4 sheets'}
          Icon={Printer}
          tone="amber"
          onClick={() => setIsTarpapelModalOpen(true)}
        />
      </div>
    </div>
  );
};
