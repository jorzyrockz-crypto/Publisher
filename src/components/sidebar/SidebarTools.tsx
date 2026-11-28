import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
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
  /** Clay render for the banner's right edge: the object, not an icon of the object. */
  art: string;
  tone: Tone;
  compact?: boolean;
  onClick: () => void;
}

const TONES: Record<Tone, { border: string; hover: string; title: string; glow: string }> = {
  violet: {
    border: 'border-[#e6dffb]',
    hover: 'hover:border-[#c9bcf5] hover:shadow-[0_6px_18px_-6px_rgba(92,75,184,0.35)]',
    title: 'text-[#3c2f96]',
    glow: 'shadow-[0_1px_2px_rgba(92,75,184,0.08)]',
  },
  amber: {
    border: 'border-[#f4e4c6]',
    hover: 'hover:border-[#e8cd97] hover:shadow-[0_6px_18px_-6px_rgba(180,120,20,0.35)]',
    title: 'text-[#8a5310]',
    glow: 'shadow-[0_1px_2px_rgba(180,120,20,0.08)]',
  },
  teal: {
    border: 'border-[#d6ece8]',
    hover: 'hover:border-[#b3ded8] hover:shadow-[0_6px_18px_-6px_rgba(15,118,110,0.35)]',
    title: 'text-[#0b5c56]',
    glow: 'shadow-[0_1px_2px_rgba(15,118,110,0.08)]',
  },
};

/**
 * A banner is a clay thumbnail with a label beside it, not an icon in a chip. The renders sit on
 * their own warm ground, so the card borrows that ground and lets the picture bleed to the edge —
 * masked on its left so it melts into the card instead of sitting in a box inside a box.
 */
const ToolBanner: React.FC<ToolBannerProps> = ({
  title,
  hint,
  art,
  tone,
  compact = false,
  onClick,
}) => {
  const t = TONES[tone];
  const artWidth = compact ? 58 : 84;
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      className={`group relative w-full h-[72px] rounded-[12px] overflow-hidden border bg-[#fbf8f3] text-left transition-all duration-150 cursor-pointer ${t.border} ${t.hover} ${t.glow}`}
    >
      <img
        src={art}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="absolute right-0 top-0 h-full object-cover object-center transition-transform duration-200 group-hover:scale-[1.06]"
        style={{
          width: `${artWidth}px`,
          maskImage: 'linear-gradient(to right, transparent 0%, black 34%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 34%)',
        }}
      />
      <span
        className="relative flex h-full flex-col justify-center gap-0.5 pl-3 pr-2"
        style={{ paddingRight: `${artWidth - 10}px` }}
      >
        <span className={`block text-[11.5px] font-bold leading-tight truncate ${t.title}`}>
          {title}
        </span>
        <span className="block text-[9.5px] leading-tight text-[#8a94a0] truncate">{hint}</span>
      </span>
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
          hint={compact ? 'Photo grid' : 'Photos into a grid'}
          art="./tool-art/collage-clay.webp"
          tone="violet"
          compact={compact}
          onClick={() => setIsCollageModalOpen(true)}
        />
        <ToolBanner
          title="Tarpaulin Printer"
          hint={compact ? 'A4 sheets' : 'Any design, on A4 sheets'}
          art="./tool-art/tarpapel-clay.webp"
          tone="amber"
          compact={compact}
          onClick={() => setIsTarpapelModalOpen(true)}
        />
        <ToolBanner
          title="Story Kit"
          hint={compact ? 'Art packs' : 'Backdrops, frames, stickers'}
          art="./tool-art/storykit-clay.webp"
          tone="teal"
          compact={compact}
          onClick={() => setView('storykit')}
        />
      </div>
    </div>
  );
};
