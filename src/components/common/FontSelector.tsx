import React, { useEffect, useRef, useState } from 'react';
import {
  SYSTEM_FONTS,
  GOOGLE_FONTS_CATALOG,
  getDownloadedGoogleFonts,
  saveDownloadedGoogleFonts,
  loadGoogleFontStylesheet,
} from '../../constants/fonts';
import { FloatingDropdown } from './FloatingDropdown';
import { ChevronDown, Download, Check, Type, Search } from 'lucide-react';

interface FontSelectorProps {
  value: string;
  onChange: (fontFamily: string) => void;
  className?: string;
}

export const FontSelector: React.FC<FontSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'all' | 'system' | 'google'>('all');
  const [search, setSearch] = useState('');
  const [downloadedFonts, setDownloadedFonts] = useState<string[]>(() =>
    getDownloadedGoogleFonts()
  );
  const [downloading, setDownloading] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Preload saved Google Fonts on mount
  useEffect(() => {
    downloadedFonts.forEach((f) => {
      loadGoogleFontStylesheet(f);
    });
  }, []);

  const handleDownloadFont = async (family: string, applyImmediately = true) => {
    setDownloading(family);
    await loadGoogleFontStylesheet(family);
    const updated = downloadedFonts.includes(family)
      ? downloadedFonts
      : [...downloadedFonts, family];
    setDownloadedFonts(updated);
    saveDownloadedGoogleFonts(updated);
    setDownloading(null);
    if (applyImmediately) {
      onChange(family);
      setIsOpen(false);
    }
  };

  const customFontName = search.trim();
  const isCustomMatch =
    customFontName.length > 1 &&
    !SYSTEM_FONTS.some((f) => f.family.toLowerCase() === customFontName.toLowerCase()) &&
    !GOOGLE_FONTS_CATALOG.some((f) => f.family.toLowerCase() === customFontName.toLowerCase());

  const filteredSystem = SYSTEM_FONTS.filter((f) =>
    f.family.toLowerCase().includes(search.toLowerCase())
  );

  // Include any custom downloaded Google fonts not in the default catalog
  const allGoogle = [
    ...GOOGLE_FONTS_CATALOG,
    ...downloadedFonts
      .filter((name) => !GOOGLE_FONTS_CATALOG.some((g) => g.family === name))
      .map((name) => ({ family: name, category: 'Display' as const, source: 'google' as const })),
  ];

  const filteredGoogle = allGoogle.filter((f) =>
    f.family.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition cursor-pointer ${className}`}
        style={{ fontFamily: value }}
        title="Choose System or Downloadable Google Font"
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={11} className="text-slate-400 ml-1 flex-shrink-0" />
      </button>

      <FloatingDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={triggerRef}
        className="p-2.5 w-72 text-xs text-slate-700"
      >
        {/* Search Bar */}
        <div className="relative mb-2">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search or enter any Google Font..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-[11px] outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-xl mb-2">
          {(
            [
              { id: 'all', label: 'All Fonts' },
              { id: 'system', label: 'System' },
              { id: 'google', label: 'Google Fonts' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-1 rounded-lg text-[10px] font-bold transition ${
                tab === t.id
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Custom Google Font Download Option */}
        {isCustomMatch && (
          <button
            onClick={() => handleDownloadFont(customFontName, true)}
            className="w-full mb-2 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold text-[11px] flex items-center justify-between transition"
          >
            <span>Download "{customFontName}" from Google Fonts</span>
            <Download size={12} />
          </button>
        )}

        {/* Font List */}
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {/* System Fonts Section */}
          {(tab === 'all' || tab === 'system') && filteredSystem.length > 0 && (
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-1.5 mb-1">
                System Fonts ({filteredSystem.length})
              </div>
              <div className="space-y-0.5">
                {filteredSystem.map((font) => (
                  <button
                    key={font.family}
                    onClick={() => {
                      onChange(font.family);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition ${
                      value === font.family
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <span style={{ fontFamily: font.family }} className="text-xs truncate">
                      {font.family}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">
                      {font.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Downloadable Google Fonts Section */}
          {(tab === 'all' || tab === 'google') && filteredGoogle.length > 0 && (
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-1.5 mb-1">
                Google Fonts ({filteredGoogle.length})
              </div>
              <div className="space-y-0.5">
                {filteredGoogle.map((font) => {
                  const isDownloaded = downloadedFonts.includes(font.family);
                  const isBusy = downloading === font.family;
                  return (
                    <div
                      key={font.family}
                      onClick={() => handleDownloadFont(font.family, true)}
                      className={`w-full px-2 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition ${
                        value === font.family
                          ? 'bg-emerald-50 text-emerald-800 font-bold'
                          : 'hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Type size={11} className="text-slate-400 flex-shrink-0" />
                        <span
                          style={{
                            fontFamily: isDownloaded ? font.family : 'inherit',
                          }}
                          className="text-xs truncate"
                        >
                          {font.family}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[9px] text-slate-400">{font.category}</span>
                        {isBusy ? (
                          <span className="text-[9px] text-emerald-700 font-bold animate-pulse">
                            ...
                          </span>
                        ) : isDownloaded ? (
                          <span
                            className="p-0.5 rounded-full bg-emerald-100 text-emerald-700"
                            title="Downloaded"
                          >
                            <Check size={10} />
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFont(font.family, false);
                            }}
                            className="p-1 rounded-md bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-600 transition"
                            title={`Download ${font.family}`}
                          >
                            <Download size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </FloatingDropdown>
    </>
  );
};
