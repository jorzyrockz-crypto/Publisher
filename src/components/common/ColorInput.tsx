import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Check } from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import {
  ColorTarget,
  Swatch,
  analyzeDocument,
  buildSmartPalettes,
  contrastRatio,
  formatRatio,
} from '../../utils/documentPalette';

interface ColorInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** What the colour is used for — tunes filtering and contrast rules. */
  target?: ColorTarget;
  /** Surface the colour lands on. Defaults to the active page background. */
  surface?: string;
  /** Hide the smart-palette affordance (for dense inline swatch rows). */
  smart?: boolean;
}

/**
 * Drop-in replacement for `<input type="color">` that adds a document-aware
 * smart palette:
 *
 *  - colours already used in the document (weighted by area, page first)
 *  - complementary / split / analogous / triadic harmonies of the dominant hue
 *  - tints, shades and neutrals tuned to the page
 *
 * Swatches are filtered for the role they will play, so text picks always clear
 * WCAG AA against their surface, fills never vanish into the background, and
 * background picks keep the document's text readable.
 */
export const ColorInput: React.FC<ColorInputProps> = ({
  value,
  onChange,
  target = 'fill',
  surface,
  smart = true,
  className,
  title,
  disabled,
  ...rest
}) => {
  const { project, activePage } = usePublisher();
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const normalizedValue = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(value || '') ? value : '#ffffff';

  const palette = useMemo(
    () => analyzeDocument(project, activePage),
    [project, activePage]
  );

  const resolvedSurface = surface || palette.background;

  const groups = useMemo(
    () =>
      buildSmartPalettes(palette, {
        target,
        surface: target === 'background' ? palette.textColor : resolvedSurface,
      }),
    [palette, target, resolvedSurface]
  );

  const positionPopover = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = 268;
    const estimatedHeight = 300;
    const left = Math.min(
      Math.max(8, rect.left - width + rect.width),
      window.innerWidth - width - 8
    );
    const openUpwards = rect.bottom + estimatedHeight > window.innerHeight - 8;
    const top = openUpwards
      ? Math.max(8, rect.top - estimatedHeight - 6)
      : rect.bottom + 6;
    setCoords({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (isOpen) positionPopover();
  }, [isOpen, positionPopover]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      const targetNode = e.target as Node;
      if (popoverRef.current?.contains(targetNode) || triggerRef.current?.contains(targetNode)) return;
      setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    // Close on scroll/resize: the panel is a scroll container and a fixed popover
    // would otherwise drift away from its trigger.
    const onScroll = (e: Event) => {
      if (popoverRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [isOpen]);

  const applySwatch = (hex: string) => {
    const synthetic = { target: { value: hex } } as unknown as React.ChangeEvent<HTMLInputElement>;
    onChange(synthetic);
    setIsOpen(false);
  };

  return (
    <>
      <span className="relative inline-flex flex-shrink-0">
        <input
          {...rest}
          type="color"
          value={normalizedValue}
          onChange={onChange}
          title={title || 'Pick a colour'}
          disabled={disabled}
          className={className}
        />
        {smart && (
          <button
            ref={triggerRef}
            type="button"
            disabled={disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen((v) => !v);
            }}
            title="Smart colours from this document"
            aria-label="Smart colours from this document"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className="absolute -bottom-1 -right-1 w-[13px] h-[13px] rounded-full bg-[#6e56cf] ring-[1.5px] ring-white shadow-2xs flex items-center justify-center text-white hover:bg-[#5c4bb8] hover:scale-110 transition-transform cursor-pointer disabled:opacity-40"
          >
            <Sparkles size={7} strokeWidth={3} />
          </button>
        )}
      </span>

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Smart colour palette"
            style={{ top: coords.top, left: coords.left, width: 268 }}
            className="fixed z-[200] bg-white rounded-[12px] border border-[#e5e9ee] shadow-[0_12px_36px_rgba(22,26,34,0.18)] p-2.5 text-[11px] text-[#3d4854] animate-in fade-in duration-100"
          >
            <div className="flex items-start justify-between gap-2 pb-1.5 mb-1.5 border-b border-[#e5e9ee]">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-[#161a22] text-[11.5px]">
                  <Sparkles size={11} className="text-[#6e56cf]" />
                  Smart colours
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-[9.5px] text-[#5b6673]">
                  <span
                    className="inline-block w-2 h-2 rounded-full border border-black/10"
                    style={{ backgroundColor: palette.anchor }}
                  />
                  <span className="truncate">
                    Harmony of {palette.anchor.toUpperCase()} ·{' '}
                    {target === 'background'
                      ? 'keeps text readable'
                      : target === 'text'
                        ? `AA on ${resolvedSurface.toUpperCase()}`
                        : `on ${resolvedSurface.toUpperCase()}`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-0.5 rounded-[5px] text-[#8d99a5] hover:text-[#161a22] hover:bg-[#f4f2ff] cursor-pointer flex-shrink-0"
                aria-label="Close palette"
              >
                <X size={12} />
              </button>
            </div>

            <div className="max-h-[268px] overflow-y-auto space-y-2 pr-0.5">
              {groups.map((group) => (
                <div key={group.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.07em] text-[#5b6673]">
                      {group.label}
                    </span>
                    {group.hint && (
                      <span className="text-[8.5px] text-[#8d99a5] truncate">{group.hint}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {group.swatches.map((swatch) => (
                      <SwatchButton
                        key={`${group.id}-${swatch.hex}`}
                        swatch={swatch}
                        active={swatch.hex.toLowerCase() === normalizedValue.toLowerCase()}
                        target={target}
                        onSelect={applySwatch}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {target !== 'background' && (
                <div className="pt-1 mt-1 border-t border-[#e5e9ee] text-[9.5px] text-[#5b6673]">
                  Page background{' '}
                  <span className="font-mono font-semibold text-[#3d4854]">
                    {palette.background.toUpperCase()}
                  </span>{' '}
                  · contrast{' '}
                  <span className="font-semibold">
                    {formatRatio(contrastRatio(normalizedValue, resolvedSurface))}
                  </span>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

const SwatchButton: React.FC<{
  swatch: Swatch;
  active: boolean;
  target: ColorTarget;
  onSelect: (hex: string) => void;
}> = ({ swatch, active, target, onSelect }) => {
  const tooltip = [
    swatch.hex.toUpperCase(),
    swatch.ratio ? `${formatRatio(swatch.ratio)} contrast` : null,
    swatch.adjusted ? (target === 'text' ? 'adjusted for AA' : 'adjusted') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <button
      type="button"
      onClick={() => onSelect(swatch.hex)}
      title={tooltip}
      aria-label={tooltip}
      className={`relative w-6 h-6 rounded-[7px] border transition-transform hover:scale-110 cursor-pointer ${
        active ? 'border-[#5c4bb8] ring-2 ring-[#d3c9f9]' : 'border-black/10'
      }`}
      style={{ backgroundColor: swatch.hex }}
    >
      {active && (
        <Check
          size={11}
          strokeWidth={3}
          className="absolute inset-0 m-auto text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
        />
      )}
      {swatch.adjusted && !active && (
        <span className="absolute -top-1 -right-1 w-[7px] h-[7px] rounded-full bg-white ring-1 ring-[#6e56cf]" />
      )}
    </button>
  );
};
