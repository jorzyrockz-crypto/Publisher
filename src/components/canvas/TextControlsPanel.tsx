import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import type { TextElement } from '../../types/publisher';

const CATEGORIES: Array<{ id: 'all' | FontDefinition['category']; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'Sans-Serif', label: 'Sans' },
  { id: 'Serif', label: 'Serif' },
  { id: 'Display', label: 'Display' },
  { id: 'Script', label: 'Script' },
  { id: 'Monospace', label: 'Mono' },
];

const SUGGESTED_COLORS = [
  '#111827',
  '#374151',
  '#6b7280',
  '#9ca3af',
  '#d1d5db',
  '#f3f4f6',
  '#ffffff',
  '#be185d',
  '#dc2626',
  '#ea580c',
  '#d97706',
  '#65a30d',
  '#57534e',
  '#d6b28a',
  '#1c1917',
  '#b45309',
  '#78716c',
];

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

const PanelHeader: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
  <div className="flex items-center gap-1.5">
    <button
      type="button"
      onClick={onBack}
      aria-label="Back to the toolbar"
      className="w-6 h-6 flex items-center justify-center rounded-full text-[#4a5661] hover:bg-[#f4f2ff] hover:text-[#5c4bb8] transition cursor-pointer"
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

  const downloadsRequestedRef = useRef<Set<string>>(new Set());
  const section = textControlSection;

  // Preview faces: ask for the stylesheet of the rows about to be drawn, once, capped so a
  // 60-row list does not fire 60 requests. Already-cached families return immediately.
  const visibleFamilies = useMemo(() => {
    if (section !== 'type') return [] as string[];
    const q = query.trim().toLowerCase();
    return [...SYSTEM_FONTS, ...GOOGLE_FONTS_CATALOG]
      .filter((font) => (category === 'all' ? true : font.category === category))
      .filter((font) => (q ? font.family.toLowerCase().includes(q) : true))
      .slice(0, 12)
      .filter((font) => font.source === 'google')
      .map((font) => font.family);
  }, [section, query, category]);

  useEffect(() => {
    if (visibleFamilies.length === 0) return;
    visibleFamilies.forEach((family) => {
      if (downloadsRequestedRef.current.has(family)) return;
      downloadsRequestedRef.current.add(family);
      void loadGoogleFontStylesheet(family);
    });
  }, [visibleFamilies]);

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

  const renderFamilyRow = (family: string) => {
    const isCurrent = family === primary.fontFamily;
    return (
      <button
        key={family}
        type="button"
        onClick={() => {
          if (!downloaded.has(family)) void loadGoogleFontStylesheet(family);
          applyToAll({ fontFamily: family });
        }}
        className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[8px] text-left transition cursor-pointer ${
          isCurrent ? 'bg-[#efeafd] text-[#5c4bb8]' : 'hover:bg-[#f4f2ff] text-[#161a22]'
        }`}
        style={{ fontFamily: `"${family}", Inter, sans-serif` }}
      >
        <span className="text-[14px] leading-tight truncate">{family}</span>
        {isCurrent && <Check size={13} className="shrink-0" />}
      </button>
    );
  };

  return (
    <div
      ref={rootRef}
      className={
        variant === 'card'
          ? 'rounded-[10px] border border-[#d3c9f9] bg-[#faf8ff] p-2.5 space-y-2.5'
          : 'space-y-2.5'
      }
    >
      {variant === 'card' && (
        <PanelHeader title={TEXT_CONTROL_TITLES[section]} onBack={closeTextControl} />
      )}

      {section === 'type' && (
        <>
          <div className="flex items-center gap-1.5 h-8 px-2 rounded-[8px] border border-[#d3c9f9] bg-white">
            <Search size={13} className="text-[#6a7682]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="flex-1 min-w-0 bg-transparent text-[11.5px] outline-none placeholder:text-[#9aa4af]"
            />
          </div>

          {/* Chips wrap; a scroll strip with no visible scrollbar is a place controls go to hide. */}
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setCategory(option.id)}
                className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold transition cursor-pointer ${
                  category === option.id
                    ? 'bg-[#e6e0fb] text-[#5c4bb8] border border-[#d3c9f9]'
                    : 'bg-white text-[#3f4a56] border border-[#e5e9ee] hover:border-[#d3c9f9]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {familiesInDesign.length > 0 && (
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#6a7682] px-0.5">
                In this design
              </div>
              {familiesInDesign.slice(0, 4).map(renderFamilyRow)}
            </div>
          )}

          <div className="space-y-0.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#6a7682] px-0.5">
              {query.trim() ? 'Results' : 'Recommended fonts'}
            </div>
            <div className="max-h-[240px] overflow-y-auto pr-0.5">
              {matches.length === 0 ? (
                <div className="px-2 py-3 text-[11px] text-[#6a7682]">No font matches “{query}”.</div>
              ) : (
                matches.slice(0, 40).map((font) => renderFamilyRow(font.family))
              )}
            </div>
          </div>
        </>
      )}

      {section === 'colour' && (
        <>
          <div className="flex items-center gap-1">
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
                className={`flex items-center gap-1.5 px-2 py-1 rounded-[8px] border text-[10.5px] font-semibold transition cursor-pointer ${
                  target === option.id
                    ? 'border-[#6e56cf] bg-white text-[#5c4bb8]'
                    : 'border-[#e5e9ee] bg-white text-[#3f4a56] hover:border-[#d3c9f9]'
                }`}
              >
                <span
                  className="font-bold text-[13px] leading-none"
                  style={{
                    textDecorationLine: option.id === 'fill' ? 'underline' : undefined,
                    textDecorationColor: '#6e56cf',
                    textDecorationThickness: '2px',
                    borderBottom: option.id === 'highlight' ? '3px solid #6e56cf' : undefined,
                  }}
                >
                  Aa
                </span>
                {option.label}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#6a7682] px-0.5">
              Current colors
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                title="Add this colour"
                onClick={() => applyColor(currentColor === 'transparent' ? '#111827' : currentColor)}
                className="w-7 h-7 rounded-full border border-[#d3c9f9] bg-white flex items-center justify-center text-[#4a5661] hover:bg-[#f4f2ff] transition cursor-pointer"
              >
                <Plus size={13} />
              </button>
              <button
                type="button"
                title="Pick a colour from the screen"
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
                className="w-7 h-7 rounded-full border border-[#d3c9f9] bg-white flex items-center justify-center text-[#4a5661] hover:bg-[#f4f2ff] transition cursor-pointer"
              >
                <Pipette size={13} />
              </button>
              <span
                title={currentColor}
                className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-[#6e56cf]"
                style={{
                  background:
                    currentColor === 'transparent'
                      ? 'repeating-conic-gradient(#e5e9ee 0% 25%, #ffffff 0% 50%) 50% / 8px 8px'
                      : currentColor,
                }}
              />
              {recentColors.slice(0, 5).map((hex) => (
                <button
                  key={hex}
                  type="button"
                  title={hex}
                  onClick={() => applyColor(hex)}
                  className="w-7 h-7 rounded-full border border-[#e5e9ee] cursor-pointer"
                  style={{ background: hex }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#6a7682] px-0.5">
              Suggestions
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {SUGGESTED_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  title={hex}
                  aria-label={`Text colour ${hex}`}
                  onClick={() => applyColor(hex)}
                  className="aspect-square w-full rounded-full border border-[#e5e9ee] hover:scale-105 transition cursor-pointer"
                  style={{ background: hex }}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-1.5 text-[10.5px] text-[#3f4a56]">
            <span className="font-semibold">Hex</span>
            <input
              value={currentColor === 'transparent' ? '' : currentColor}
              onChange={(e) => {
                const value = e.target.value.trim();
                if (/^#[0-9a-fA-F]{6}$/.test(value)) applyColor(value);
              }}
              placeholder="#161A22"
              className="flex-1 min-w-0 h-7 px-2 rounded-[8px] border border-[#d3c9f9] bg-white text-[11px] font-mono outline-none"
            />
          </label>
        </>
      )}
    </div>
  );
};
