import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, Pipette, Plus, Search } from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import { useTextSelection } from '../../hooks/useTextSelection';
import { useCloseOnOutsideClick } from '../../hooks/useCloseOnOutsideClick';
import { TEXT_CONTROL_TITLES } from '../../constants/textControls';
import {
  GOOGLE_FONTS_CATALOG,
  SYSTEM_FONTS,
  getDownloadedGoogleFonts,
  loadGoogleFontStylesheet,
  type FontDefinition,
} from '../../constants/fonts';
import { useFontPreview } from '../../hooks/useFontPreview';
import { SmartPalette } from '../common/SmartPalette';
import type { ColorTarget } from '../../utils/documentPalette';
import type { TextElement } from '../../types/publisher';

const CATEGORIES: Array<{ id: 'all' | FontDefinition['category']; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'Sans-Serif', label: 'Sans' },
  { id: 'Serif', label: 'Serif' },
  { id: 'Display', label: 'Display' },
  { id: 'Script', label: 'Script' },
  { id: 'Monospace', label: 'Mono' },
];


/**
 * The same three targets the bar offers, read through the palette's eyes: body text has to
 * stay readable on the page, a highlight is a surface behind text, a stroke is an outline.
 */
const SMART_TARGET: Record<'fill' | 'highlight' | 'stroke', ColorTarget> = {
  fill: 'text',
  highlight: 'fill',
  stroke: 'stroke',
};

const RECENT_COLORS_KEY = 'ms_publisher_text_recent_colors_v1';

function readRecentColors(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_COLORS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((c) => typeof c === 'string').slice(0, 8) : [];
  } catch {
    return [];
  }
}

/**
 * One family in the list.
 *
 * Every family gets a row whether or not it is installed — the list exists to show faces you
 * do not have. The row fetches its own stylesheet when it comes near the viewport, so scrolling
 * the list is what downloads the previews and opening the panel costs one request, not sixty.
 */
const FontRow: React.FC<{
  family: string;
  isCurrent: boolean;
  previews: boolean;
  onPick: () => void;
}> = ({ family, isCurrent, previews, onPick }) => {
  const { nodeRef } = useFontPreview(family, previews);
  return (
    <button
      ref={nodeRef}
      type="button"
      onClick={onPick}
      aria-pressed={isCurrent}
      className={`w-full min-h-[52px] flex items-center justify-between gap-2 px-3 rounded-[12px] text-left transition cursor-pointer active:scale-[0.99] touch-manipulation ${
        isCurrent ? 'bg-[#efeafd] text-[#5c4bb8]' : 'bg-[#f8fafb] text-[#161a22]'
      }`}
      style={{ fontFamily: `"${family}", Inter, sans-serif` }}
    >
      <span className="text-[17px] leading-tight truncate">{family}</span>
      {isCurrent && <Check size={16} className="shrink-0" />}
    </button>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#6a7682] mb-1.5">
    {children}
  </div>
);

const PanelHeader: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
  <div className="flex items-center gap-1.5">
    <button
      type="button"
      onClick={onBack}
      aria-label="Back to the toolbar"
      className="w-9 h-9 flex items-center justify-center rounded-full text-[#4a5661] hover:bg-[#f4f2ff] hover:text-[#5c4bb8] transition cursor-pointer touch-manipulation"
    >
      <ChevronLeft size={15} />
    </button>
    <span className="text-[12.5px] font-bold text-[#161a22]">{title}</span>
  </div>
);

/**
 * The bar's font and text-colour chips land here.
 *
 * The bar is a row of entry points, not a rack of pickers: a family list and a colour palette
 * need room, a search box and a scrollbar, and a floating pill has none of those. This panel
 * is that room — one section at a time, the same way the collage bar hands off to its panel.
 */
export const TextControlsPanel: React.FC<{ variant?: 'card' | 'pane' }> = ({ variant = 'card' }) => {
  const {
    textControlSection,
    closeTextControl,
    activePage,
    updateElementsBatch,
  } = usePublisher();
  const selection = useTextSelection();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | FontDefinition['category']>('all');
  const [target, setTarget] = useState<'fill' | 'highlight' | 'stroke'>('fill');
  const [recentColors, setRecentColors] = useState<string[]>(readRecentColors);

  // The panel is about one selection; if it stops being text, so does the panel.
  useEffect(() => {
    if (!selection) closeTextControl();
  }, [selection, closeTextControl]);

  useCloseOnOutsideClick(rootRef, Boolean(textControlSection && selection), closeTextControl);

  const section = textControlSection;

  // Previews need a connection; say so instead of showing every row in the fallback face and
  // letting it look like the font list is broken.
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine !== false
  );
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!section || !selection) return null;

  const { elements, primary } = selection;
  const writable = target === 'fill' ? 'color' : target === 'highlight' ? 'backgroundColor' : 'textStrokeColor';
  const targetValue = (primary as unknown as Record<string, unknown>)[writable];
  const currentColor = typeof targetValue === 'string' && targetValue ? targetValue : 'transparent';

  const applyToAll = (patch: Partial<TextElement>) => {
    updateElementsBatch(Object.fromEntries(elements.map((el) => [el.id, patch])));
  };

  const applyColor = (hex: string) => {
    applyToAll({ [writable]: hex } as Partial<TextElement>);
    if (target === 'stroke' && !primary.textStrokeWidth) applyToAll({ textStrokeWidth: 2 });
    setRecentColors((prev) => {
      const next = [hex, ...prev.filter((c) => c.toLowerCase() !== hex.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(next));
      } catch {
        // storage is optional here
      }
      return next;
    });
  };

  const familiesInDesign = Array.from(
    new Set(
      activePage.elements
        .filter((el): el is TextElement => el.type === 'text')
        .map((el) => el.fontFamily)
        .filter(Boolean)
    )
  );

  const catalog = [...SYSTEM_FONTS, ...GOOGLE_FONTS_CATALOG];
  const downloaded = new Set(getDownloadedGoogleFonts());
  const q = query.trim().toLowerCase();
  const matches = catalog.filter(
    (font) =>
      (category === 'all' ? true : font.category === category) &&
      (q ? font.family.toLowerCase().includes(q) : true)
  );

  const renderFamilyRow = (family: string) => (
    <FontRow
      key={family}
      family={family}
      isCurrent={family === primary.fontFamily}
      previews={online}
      onPick={() => {
        if (!downloaded.has(family)) void loadGoogleFontStylesheet(family);
        applyToAll({ fontFamily: family });
      }}
    />
  );

  return (
    <div
      ref={rootRef}
      className={
        variant === 'card'
          ? 'rounded-[12px] border border-[#d3c9f9] bg-[#faf8ff] p-3 space-y-4'
          : 'space-y-5 pb-6'
      }
    >
      {variant === 'card' && (
        <PanelHeader title={TEXT_CONTROL_TITLES[section]} onBack={closeTextControl} />
      )}

      {section === 'type' && (
        <>
          {/* Search: 48px tall and 16px type, so it neither crowds a thumb nor zooms on iOS. */}
          <div className="flex items-center gap-2 h-12 px-3 rounded-[12px] border border-[#d3c9f9] bg-white">
            <Search size={17} className="text-[#6a7682] flex-shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fonts"
              inputMode="search"
              className="flex-1 min-w-0 bg-transparent text-[16px] outline-none placeholder:text-[#9aa4af]"
            />
          </div>

          {/* Chips wrap rather than scroll: a strip that scrolls invisibly is a place
              controls go to hide, and a fingertip cannot find what it cannot see. */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setCategory(option.id)}
                aria-pressed={category === option.id}
                className={`min-h-[38px] px-3.5 rounded-full text-[13px] font-semibold transition cursor-pointer active:scale-95 touch-manipulation ${
                  category === option.id
                    ? 'bg-[#e6e0fb] text-[#5c4bb8] border border-[#c9bcf5]'
                    : 'bg-white text-[#3f4a56] border border-[#e5e9ee]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {familiesInDesign.length > 0 && (
            <div>
              <SectionLabel>In this design</SectionLabel>
              <div className="space-y-1">
                {familiesInDesign.slice(0, 4).map((family) => renderFamilyRow(family))}
              </div>
            </div>
          )}

          <div>
            <SectionLabel>
              {query.trim() ? `Results · ${matches.length}` : `All fonts · ${matches.length}`}
            </SectionLabel>
            {!online && (
              <div className="mb-2 px-3 py-2 rounded-[10px] border border-[#f6d9a8] bg-[#fff8ec] text-[12px] text-[#8a5a12]">
                Offline — previews for fonts you have not downloaded will appear when you
                reconnect. You can still pick one.
              </div>
            )}
            <div className="max-h-[46vh] overflow-y-auto overscroll-contain -mx-1 px-1">
              {matches.length === 0 ? (
                <div className="px-2 py-4 text-[13px] text-[#6a7682]">
                  No font matches “{query}”.
                </div>
              ) : (
                <div className="space-y-1">{matches.map((font) => renderFamilyRow(font.family))}</div>
              )}
            </div>
          </div>
        </>
      )}

      {section === 'colour' && (
        <>
          {/* Three roles as a segmented control: 48px tall, one thumb each. */}
          <div>
            <SectionLabel>Applies to</SectionLabel>
            <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-[14px] bg-[#f1eff9] border border-[#e2dcf7]">
              {(
                [
                  { id: 'fill', label: 'Fill' },
                  { id: 'highlight', label: 'Highlight' },
                  { id: 'stroke', label: 'Stroke' },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTarget(option.id)}
                  aria-pressed={target === option.id}
                  className={`min-h-[48px] rounded-[10px] flex flex-col items-center justify-center gap-0.5 transition cursor-pointer active:scale-95 touch-manipulation ${
                    target === option.id
                      ? 'bg-white text-[#5c4bb8] shadow-xs'
                      : 'text-[#4a5661]'
                  }`}
                >
                  <span className="text-[17px] font-bold leading-none">Aa</span>
                  <span className="text-[11px] font-semibold">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Current colors</SectionLabel>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                title="Add this colour"
                aria-label="Add this colour"
                onClick={() => applyColor(currentColor === 'transparent' ? '#111827' : currentColor)}
                className="w-11 h-11 rounded-full border border-[#d3c9f9] bg-white flex items-center justify-center text-[#4a5661] active:scale-95 transition cursor-pointer touch-manipulation"
              >
                <Plus size={18} />
              </button>
              <button
                type="button"
                title="Pick a colour from the screen"
                aria-label="Pick a colour from the screen"
                onClick={() => {
                  const EyeDropperCtor = (
                    window as unknown as {
                      EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
                    }
                  ).EyeDropper;
                  if (!EyeDropperCtor) return;
                  void new EyeDropperCtor()
                    .open()
                    .then((result) => applyColor(result.sRGBHex))
                    .catch(() => undefined);
                }}
                className="w-11 h-11 rounded-full border border-[#d3c9f9] bg-white flex items-center justify-center text-[#4a5661] active:scale-95 transition cursor-pointer touch-manipulation"
              >
                <Pipette size={18} />
              </button>
              <span
                title={currentColor}
                aria-label={`Current colour ${currentColor}`}
                className="w-11 h-11 rounded-full border-2 border-white ring-2 ring-[#6e56cf]"
                style={{
                  background:
                    currentColor === 'transparent'
                      ? 'repeating-conic-gradient(#e5e9ee 0% 25%, #ffffff 0% 50%) 50% / 10px 10px'
                      : currentColor,
                }}
              />
              {recentColors.slice(0, 5).map((hex) => (
                <button
                  key={hex}
                  type="button"
                  title={hex}
                  aria-label={`Recent colour ${hex}`}
                  onClick={() => applyColor(hex)}
                  className="w-11 h-11 rounded-full border border-[#e5e9ee] active:scale-95 transition cursor-pointer touch-manipulation"
                  style={{ background: hex }}
                />
              ))}
            </div>
          </div>

          {/* The document's own palette, not a fixed list: mined colours, harmonies of its
              dominant hue, and — for text — only swatches that stay readable on this page. */}
          <div>
            <SectionLabel>Suggestions</SectionLabel>
            <SmartPalette
              value={currentColor}
              target={SMART_TARGET[target]}
              onSelect={applyColor}
              showHeader={false}
              size="touch"
              maxHeightClass="max-h-[46vh]"
            />
          </div>

          <div>
            <SectionLabel>Hex</SectionLabel>
            <input
              value={currentColor === 'transparent' ? '' : currentColor}
              onChange={(e) => {
                const value = e.target.value.trim();
                if (/^#[0-9a-fA-F]{6}$/.test(value)) applyColor(value);
              }}
              placeholder="#161A22"
              spellCheck={false}
              inputMode="text"
              aria-label="Hex colour value"
              className="w-full h-12 px-3 rounded-[12px] border border-[#d3c9f9] bg-white text-[16px] font-mono outline-none"
            />
          </div>
        </>
      )}
    </div>
  );
};
