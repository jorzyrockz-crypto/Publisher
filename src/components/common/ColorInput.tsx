import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Pipette, ChevronDown } from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import {
  ColorTarget,
  analyzeDocument,
  contrastRatio,
  formatRatio,
  normalizeHex,
} from '../../utils/documentPalette';
import { SmartPalette } from './SmartPalette';

interface ColorInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** What the colour is used for — tunes filtering and contrast rules. */
  target?: ColorTarget;
  /** Surface the colour lands on. Defaults to the active page background. */
  surface?: string;
  /** Set false to render a plain native colour input (no smart palette). */
  smart?: boolean;
}

const HEX_RE = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i;

/**
 * Document-aware colour control.
 *
 * Renders a single, compact swatch (same size/classes the designer passed in)
 * that opens the smart palette: colours mined from the current document,
 * harmonies of its dominant hue, and role-aware contrast filtering. The OS
 * colour wheel is still available from inside the popover ("Custom colour…"),
 * so nothing is lost — but the default action is now the intelligent one and
 * there is no second badge crowding the swatch.
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
  const [hexDraft, setHexDraft] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const nativeInputRef = useRef<HTMLInputElement>(null);

  const normalizedValue = HEX_RE.test(value || '') ? value : '#ffffff';

  const palette = useMemo(() => analyzeDocument(project, activePage), [project, activePage]);
  const resolvedSurface = surface || palette.background;

  const positionPopover = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = 268;
    const estimatedHeight = 330;
    const left = Math.min(
      Math.max(8, rect.left - width + rect.width),
      window.innerWidth - width - 8
    );
    const openUpwards = rect.bottom + estimatedHeight > window.innerHeight - 8;
    const top = openUpwards ? Math.max(8, rect.top - estimatedHeight - 6) : rect.bottom + 6;
    setCoords({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (isOpen) positionPopover();
  }, [isOpen, positionPopover]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      const node = e.target as Node;
      if (popoverRef.current?.contains(node) || triggerRef.current?.contains(node)) return;
      setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
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

  const emitChange = (hex: string) => {
    const synthetic = { target: { value: hex } } as unknown as React.ChangeEvent<HTMLInputElement>;
    onChange(synthetic);
  };

  const applySwatch = (hex: string) => {
    emitChange(hex);
    setIsOpen(false);
  };

  const commitHexDraft = () => {
    const hex = normalizeHex(hexDraft.startsWith('#') ? hexDraft : `#${hexDraft}`);
    if (hex) {
      emitChange(hex);
      setHexDraft(hex.toUpperCase());
    } else {
      setHexDraft(normalizedValue.toUpperCase());
    }
  };

  const openNativePicker = () => {
    setIsOpen(false);
    // Defer so the popover unmounts before the OS picker steals focus
    window.setTimeout(() => nativeInputRef.current?.click(), 0);
  };

  /* ---------------------------------------------------------------- */
  /* Plain native input (smart palette disabled)                       */
  /* ---------------------------------------------------------------- */
  if (!smart) {
    return (
      <input
        {...rest}
        type="color"
        value={normalizedValue}
        onChange={onChange}
        title={title}
        disabled={disabled}
        className={className}
      />
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Seed the hex field from the current value each time it opens
          if (!isOpen) setHexDraft(normalizedValue.toUpperCase());
          setIsOpen((v) => !v);
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        title={`${title || 'Colour'} — pick from this document's palette`}
        aria-label={`${title || 'Colour'}: ${normalizedValue.toUpperCase()}. Opens smart palette`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        style={{ backgroundColor: normalizedValue }}
        className={`${className || ''} group/color relative disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/10" />
        <span className="pointer-events-none absolute inset-0 rounded-[inherit] flex items-end justify-end p-[1px]">
          <ChevronDown
            size={8}
            strokeWidth={3}
            className="text-white opacity-0 group-hover/color:opacity-90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] transition-opacity"
          />
        </span>
      </button>

      {/* Hidden native input: only used by the "Custom colour…" action */}
      <input
        {...rest}
        ref={nativeInputRef}
        type="color"
        value={normalizedValue}
        onChange={onChange}
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        className="absolute w-px h-px opacity-0 pointer-events-none"
      />

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Smart colour palette"
            style={{ top: coords.top, left: coords.left, width: 268 }}
            className="fixed z-[200] bg-white rounded-[12px] border border-[#e5e9ee] shadow-[0_12px_36px_rgba(22,26,34,0.18)] p-2.5 text-[11px] text-[#3d4854] animate-in fade-in duration-100"
          >
            <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-[#e5e9ee]">
              <div className="min-w-0 flex-1">
                <SmartPalette
                  value={normalizedValue}
                  target={target}
                  surface={surface}
                  onSelect={applySwatch}
                  maxHeightClass="max-h-[236px]"
                />
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

            {/* Current value + native wheel escape hatch */}
            <div className="mt-2 pt-2 border-t border-[#e5e9ee] space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-5 h-5 rounded-[5px] border border-black/10 flex-shrink-0"
                  style={{ backgroundColor: normalizedValue }}
                />
                <input
                  value={hexDraft}
                  onChange={(e) => setHexDraft(e.target.value)}
                  onBlur={commitHexDraft}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitHexDraft();
                    }
                    if (e.key === 'Escape') {
                      e.stopPropagation();
                      setIsOpen(false);
                    }
                  }}
                  spellCheck={false}
                  aria-label="Hex colour value"
                  className="flex-1 min-w-0 bg-white border border-[#e5e9ee] rounded-[6px] px-1.5 py-1 font-mono text-[10.5px] text-[#3d4854] outline-none focus:border-[#b3a4f2]"
                />
                <button
                  type="button"
                  onClick={openNativePicker}
                  title="Open the system colour wheel"
                  className="flex items-center gap-1 px-1.5 py-1 rounded-[6px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] hover:text-[#5c4bb8] text-[10px] font-semibold text-[#4a5661] transition cursor-pointer whitespace-nowrap"
                >
                  <Pipette size={10} />
                  Custom
                </button>
              </div>
              {target !== 'background' && (
                <div className="text-[9px] text-[#5b6673]">
                  Contrast with page: <span className="font-semibold">{formatRatio(contrastRatio(normalizedValue, resolvedSurface))}</span>
                  {target === 'text' && contrastRatio(normalizedValue, resolvedSurface) < 4.5 && (
                    <span className="text-[#b4364a] font-semibold"> · below AA</span>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
