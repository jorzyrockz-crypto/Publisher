import React, { useRef, useState } from 'react';
import { ChevronDown, FileText, LayoutGrid, Monitor, Plus, Ruler } from 'lucide-react';
import { useCloseOnOutsideClick } from '../../hooks/useCloseOnOutsideClick';
import { A4_POSTER, LANDSCAPE_BANNER, clampCustomSize } from '../../utils/blankDesign';
import { useDesignLauncher } from './useDesignLauncher';

/**
 * `+ Create a Design` — the rail's primary action.
 *
 * The four formats are the ones the app is opened for, not a size table: A4 (the school default),
 * 3 × 2 tarpapel (the classroom poster), a landscape banner, and "type your own". Everything else
 * lives in the Templates gallery, which is one click away and shows you what you are getting.
 */
export const CreateDesignButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { startBlank, startTarpapel, startCustom } = useDesignLauncher();
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customW, setCustomW] = useState('1080');
  const [customH, setCustomH] = useState('1080');

  const rootRef = useRef<HTMLDivElement>(null);
  useCloseOnOutsideClick(rootRef, isOpen, () => setIsOpen(false));

  const close = () => {
    setIsOpen(false);
    setIsCustomOpen(false);
  };

  const size = clampCustomSize(Number(customW), Number(customH));

  const itemClass =
    'flex w-full items-start gap-2.5 rounded-chip px-2 py-2 text-left transition-colors hover:bg-accent-soft cursor-pointer';

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Create a design"
        className={`flex w-full items-center gap-2 rounded-tile bg-accent px-3 py-2.5 text-body font-semibold text-white shadow-xs transition-colors hover:bg-accent-hover active:scale-[0.99] cursor-pointer ${
          compact ? 'justify-center px-0' : 'justify-between'
        }`}
      >
        <span className="flex items-center gap-2">
          <Plus size={16} strokeWidth={2.5} />
          {!compact && <span className="whitespace-nowrap">Create a Design</span>}
        </span>
        {!compact && (
          <ChevronDown
            size={13}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          data-floating-panel="create-design"
          className={`absolute top-full z-50 mt-1.5 w-72 rounded-tile border border-line bg-surface p-1.5 shadow-elevated ${
            compact ? 'left-0' : 'left-0'
          }`}
        >
          <div className="px-2 pb-1 pt-0.5 text-2xs font-bold uppercase tracking-[0.09em] text-ink-muted">
            Start from blank
          </div>

          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              startBlank(A4_POSTER);
              close();
            }}
          >
            <FileText size={16} className="mt-0.5 flex-shrink-0 text-accent-ink" />
            <span className="min-w-0">
              <span className="block text-body font-semibold text-ink">Blank A4</span>
              <span className="block text-meta text-ink-muted">210 × 297 mm · 794 × 1123 px</span>
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              startTarpapel();
              close();
            }}
          >
            <LayoutGrid size={16} className="mt-0.5 flex-shrink-0 text-accent-ink" />
            <span className="min-w-0">
              <span className="block text-body font-semibold text-ink">Tarpapel 3×2</span>
              <span className="block text-meta text-ink-muted">
                Six A4 sheets, tiled · print setup included
              </span>
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              startBlank(LANDSCAPE_BANNER);
              close();
            }}
          >
            <Monitor size={16} className="mt-0.5 flex-shrink-0 text-accent-ink" />
            <span className="min-w-0">
              <span className="block text-body font-semibold text-ink">Landscape Banner</span>
              <span className="block text-meta text-ink-muted">1920 × 640 px · web and print</span>
            </span>
          </button>

          <div className="my-1 h-px bg-line" />

          <button
            type="button"
            role="menuitem"
            className={itemClass}
            aria-expanded={isCustomOpen}
            onClick={() => setIsCustomOpen((v) => !v)}
          >
            <Ruler size={16} className="mt-0.5 flex-shrink-0 text-accent-ink" />
            <span className="min-w-0">
              <span className="block text-body font-semibold text-ink">Custom Size</span>
              <span className="block text-meta text-ink-muted">Type the width and height</span>
            </span>
          </button>

          {isCustomOpen && (
            <form
              className="mt-1 space-y-2 rounded-chip bg-surface-sunken p-2"
              onSubmit={(e) => {
                e.preventDefault();
                startCustom(size.width, size.height);
                close();
              }}
            >
              <div className="flex items-center gap-1.5">
                <label className="flex-1">
                  <span className="mb-0.5 block text-2xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
                    Width
                  </span>
                  <input
                    type="number"
                    min={200}
                    max={4000}
                    value={customW}
                    onChange={(e) => setCustomW(e.target.value)}
                    className="w-full rounded-chip border border-line bg-surface px-2 py-1 text-body text-ink outline-none focus:border-accent-focus"
                  />
                </label>
                <label className="flex-1">
                  <span className="mb-0.5 block text-2xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
                    Height
                  </span>
                  <input
                    type="number"
                    min={200}
                    max={4000}
                    value={customH}
                    onChange={(e) => setCustomH(e.target.value)}
                    className="w-full rounded-chip border border-line bg-surface px-2 py-1 text-body text-ink outline-none focus:border-accent-focus"
                  />
                </label>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-2xs text-ink-muted">
                  {size.width} × {size.height} px
                </span>
                <button
                  type="submit"
                  className="rounded-chip bg-accent px-2.5 py-1 text-meta font-semibold text-white transition-colors hover:bg-accent-hover cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
