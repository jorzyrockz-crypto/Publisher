import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight, LayoutGrid, Package, Printer } from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import { AssetPackPanel } from './AssetPackPanel';

/**
 * Tools — the jobs that begin with material, not with a blank page.
 *
 * Collage Maker and Tarpaulin Printer open as modals: they are self-contained jobs with their own
 * preview and their own exit. Story Kit is different — it is a library you pick from while the page
 * stays visible — so it opens *in place*, as a panel inside this sidebar with a way back to Tools.
 * One list, two destinations, chosen by what the job needs rather than by taste.
 */

type Tone = 'violet' | 'amber' | 'teal';

interface ToolBannerProps {
  title: string;
  hint: string;
  Icon: typeof LayoutGrid;
  tone: Tone;
  onClick: () => void;
}

const TONES: Record<
  Tone,
  { card: string; chip: string; title: string; glow: string }
> = {
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
  teal: {
    card: 'border-[#d3ece8] hover:border-[#b3ded8] hover:bg-[#f4fbfa]',
    chip: 'bg-[#e2f4f1] text-[#0f766e]',
    title: 'text-[#0b5c56]',
    glow: 'shadow-[0_1px_0_rgba(15,118,110,0.06)]',
  },
};

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

interface SidebarToolsProps {
  compact?: boolean;
  /** The Designer drawer already prints "Tools" as its own header; the block does not repeat it. */
  showLabel?: boolean;
  /**
   * Told when Story Kit takes the whole sidebar, so Pages & Layers can step aside instead of being
   * squeezed into the bottom two centimetres.
   */
  onImmersiveChange?: (immersive: boolean) => void;
}

export const SidebarTools: React.FC<SidebarToolsProps> = ({
  compact = false,
  showLabel = true,
  onImmersiveChange,
}) => {
  const { setIsCollageModalOpen, setIsTarpapelModalOpen } = usePublisher();
  const [view, setView] = useState<'tools' | 'storykit'>('tools');

  useEffect(() => {
    onImmersiveChange?.(view === 'storykit');
  }, [view, onImmersiveChange]);

  if (view === 'storykit') {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <button
          type="button"
          onClick={() => setView('tools')}
          className="group flex items-center gap-1.5 px-3 h-9 shrink-0 border-b border-[#eef1f5] text-[11px] font-bold text-[#5c4bb8] hover:bg-[#f8f6ff] transition cursor-pointer"
        >
          <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
          Tools
        </button>
        <AssetPackPanel embedded />
      </div>
    );
  }

  return (
    <div className="px-3 pt-2.5 pb-2.5 border-b border-[#eef1f5] shrink-0">
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-bold uppercase tracking-[0.09em] text-[#9aa4b0]">
            Tools
          </span>
        </div>
      )}
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
        <ToolBanner
          title="Story Kit"
          hint={compact ? 'Art packs' : 'Backdrops, frames, stickers'}
          Icon={Package}
          tone="teal"
          onClick={() => setView('storykit')}
        />
      </div>
    </div>
  );
};
