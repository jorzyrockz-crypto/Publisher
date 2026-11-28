import React, { useMemo } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import {
  analyzeDocument,
  buildSmartPalettes,
  formatRatio,
  type ColorTarget,
  type Swatch,
} from '../../utils/documentPalette';

interface SmartPaletteProps {
  /** The colour currently in use, so the palette can mark it. */
  value: string;
  /** What the colour is for — filters swatches by contrast for that role. */
  target: ColorTarget;
  /** Surface the colour lands on. Defaults to the page background. */
  surface?: string;
  onSelect: (hex: string) => void;
  /** The header says where the harmony comes from; hide it where a panel already says so. */
  showHeader?: boolean;
  /** Height of the scrolling swatch area. */
  maxHeightClass?: string;
  /**
   * `sm` is for a mouse-driven popover; `touch` gives every swatch a 40px target and spaces
   * the rows out, because a fingertip is not a cursor.
   */
  size?: 'sm' | 'touch';
}

const SwatchButton: React.FC<{
  swatch: Swatch;
  active: boolean;
  target: ColorTarget;
  onSelect: (hex: string) => void;
  size: 'sm' | 'touch';
}> = ({ swatch, active, target, onSelect, size }) => {
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
      className={`relative ${
        size === 'touch'
          ? 'w-10 h-10 rounded-[12px] active:scale-90 touch-manipulation'
          : 'w-6 h-6 rounded-[7px] hover:scale-110'
      } border transition-transform cursor-pointer ${
        active ? 'border-[#5c4bb8] ring-2 ring-[#d3c9f9]' : 'border-black/10'
      }`}
      style={{ backgroundColor: swatch.hex }}
    >
      {active && (
        <Check
          size={size === 'touch' ? 16 : 11}
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

/**
 * The smart palette: colours mined from the document, harmonies of its dominant hue, and
 * contrast-filtered for the role the colour is about to take.
 *
 * Extracted so the same palette serves every surface that asks for a colour — the inspector's
 * colour control and the drawer's text-colour panel. Two implementations would mean two
 * different sets of "suggestions", which is exactly what went wrong before.
 */
export const SmartPalette: React.FC<SmartPaletteProps> = ({
  value,
  target,
  surface,
  onSelect,
  showHeader = true,
  maxHeightClass = 'max-h-[236px]',
  size = 'sm',
}) => {
  const { project, activePage } = usePublisher();
  const palette = useMemo(() => analyzeDocument(project, activePage), [project, activePage]);
  const resolvedSurface = surface || palette.background;
  const groups = useMemo(
    () =>
      buildSmartPalettes(palette, {
        target,
        surface: target === 'background' ? palette.textColor : resolvedSurface,
      }),
    [palette, target, resolvedSurface]
  );

  return (
    <div className="space-y-2">
      {showHeader && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#161a22]">
          <Sparkles size={11} className="text-[#6e56cf]" />
          Smart colours
          <span className="flex items-center gap-1 font-normal text-[9.5px] text-[#5b6673] min-w-0">
            <span
              className="inline-block w-2 h-2 rounded-full border border-black/10 flex-shrink-0"
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
          </span>
        </div>
      )}

      <div className={`${maxHeightClass} overflow-y-auto space-y-2 pr-0.5`}>
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
            <div className={`flex flex-wrap ${size === 'touch' ? 'gap-2 mt-1.5' : 'gap-1 mt-1'}`}>
              {group.swatches.map((swatch) => (
                <SwatchButton
                  key={`${group.id}-${swatch.hex}`}
                  swatch={swatch}
                  active={swatch.hex.toLowerCase() === (value || '').toLowerCase()}
                  target={target}
                  onSelect={onSelect}
                  size={size}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
