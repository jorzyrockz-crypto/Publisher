import React, { useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { PAGE_SIZES } from '../../constants/pageSizes';
import { COLOR_SCHEMES } from '../../constants/colorSchemes';
import {
  FileText,
  Palette,
  ChevronDown,
  Magnet,
  Grid,
} from 'lucide-react';

export const PageDesignTab: React.FC = () => {
  const {
    activePage,
    project,
    setPageSize,
    setPageOrientation,
    setPageMargins,
    setPageBackgroundColor,
    setColorScheme,
    setIsBackstageOpen,
    snapToGuides,
    setSnapToGuides,
    gridVisible,
    setGridVisible,
  } = usePublisher();

  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isMarginsDropdownOpen, setIsMarginsDropdownOpen] = useState(false);
  const [isSchemesDropdownOpen, setIsSchemesDropdownOpen] = useState(false);

  return (
    <div className="flex items-center h-24 px-3 py-1 gap-3 text-xs text-slate-700 overflow-x-auto select-none">
      {/* 1. Template Group */}
      <div className="flex flex-col justify-between h-full py-1 pr-3 border-r border-slate-200 flex-shrink-0">
        <div className="my-auto">
          <button
            onClick={() => setIsBackstageOpen(true)}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Browse Templates"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <FileText size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Templates</span>
          </button>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Library</span>
      </div>

      {/* 2. Page Setup Group */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-slate-200 flex-shrink-0">
        <div className="space-y-1.5 my-auto">
          <div className="flex items-center gap-2">
            {/* Margins Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsMarginsDropdownOpen(!isMarginsDropdownOpen)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-medium transition cursor-pointer"
              >
                <span>Margins</span>
                <ChevronDown size={10} className="text-slate-400" />
              </button>
              {isMarginsDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-xl p-1.5 z-50 w-36 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setPageMargins({ top: 48, right: 48, bottom: 48, left: 48 });
                      setIsMarginsDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg text-xs transition"
                  >
                    Normal (0.5")
                  </button>
                  <button
                    onClick={() => {
                      setPageMargins({ top: 24, right: 24, bottom: 24, left: 24 });
                      setIsMarginsDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg text-xs transition"
                  >
                    Narrow (0.25")
                  </button>
                  <button
                    onClick={() => {
                      setPageMargins({ top: 96, right: 96, bottom: 96, left: 96 });
                      setIsMarginsDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg text-xs transition"
                  >
                    Wide (1.0")
                  </button>
                  <button
                    onClick={() => {
                      setPageMargins({ top: 0, right: 0, bottom: 0, left: 0 });
                      setIsMarginsDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg text-xs transition"
                  >
                    None (0")
                  </button>
                </div>
              )}
            </div>

            {/* Orientation Segmented Control */}
            <div className="flex bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
              <button
                onClick={() => setPageOrientation('portrait')}
                className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
                  activePage.orientation === 'portrait'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Portrait
              </button>
              <button
                onClick={() => setPageOrientation('landscape')}
                className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
                  activePage.orientation === 'landscape'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Landscape
              </button>
            </div>
          </div>

          {/* Size Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
              className="flex items-center justify-between w-full px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-medium transition cursor-pointer"
            >
              <span className="truncate max-w-[140px]">
                {PAGE_SIZES.find(
                  (s) => s.width === activePage.width && s.height === activePage.height
                )?.displayName || 'Custom Size'}
              </span>
              <ChevronDown size={10} className="text-slate-400" />
            </button>
            {isSizeDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 z-50 w-52 max-h-60 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-100">
                {PAGE_SIZES.map((size) => (
                  <button
                    key={size.name}
                    onClick={() => {
                      setPageSize(size.name);
                      setIsSizeDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg text-xs transition"
                  >
                    {size.displayName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Setup</span>
      </div>

      {/* 3. Color Schemes Group */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-slate-200 flex-shrink-0 relative">
        <div className="my-auto">
          <button
            onClick={() => setIsSchemesDropdownOpen(!isSchemesDropdownOpen)}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Change Color Scheme"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <Palette size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600 flex items-center">
              Schemes <ChevronDown size={9} className="ml-0.5" />
            </span>
          </button>

          {isSchemesDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 z-50 w-56 space-y-1 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Palette Presets
              </div>
              {COLOR_SCHEMES.map((scheme) => (
                <button
                  key={scheme.id}
                  onClick={() => {
                    setColorScheme(scheme.id);
                    setIsSchemesDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-50 transition ${
                    project.colorScheme === scheme.id ? 'bg-emerald-50 ring-1 ring-emerald-300' : ''
                  }`}
                >
                  <span className="text-xs font-medium text-slate-700">{scheme.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded-full shadow-2xs" style={{ backgroundColor: scheme.primary }} />
                    <span className="w-3.5 h-3.5 rounded-full shadow-2xs" style={{ backgroundColor: scheme.secondary }} />
                    <span className="w-3.5 h-3.5 rounded-full shadow-2xs" style={{ backgroundColor: scheme.accent }} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Colors</span>
      </div>

      {/* 4. Canvas Background */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2 my-auto">
          <input
            type="color"
            value={activePage.backgroundColor}
            onChange={(e) => setPageBackgroundColor(e.target.value)}
            className="w-8 h-8 rounded-full border border-slate-200 cursor-pointer overflow-hidden p-0 shadow-2xs"
            title="Change Canvas Background Color"
          />
          <button
            onClick={() => setPageBackgroundColor('#ffffff')}
            className="text-[11px] font-medium px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition shadow-2xs"
          >
            White
          </button>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Canvas</span>
      </div>

      {/* 5. Snapping & Grid Switches */}
      <div className="flex flex-col justify-between h-full py-1 px-3 flex-shrink-0">
        <div className="space-y-1.5 my-auto">
          <div
            onClick={() => setSnapToGuides(!snapToGuides)}
            className="flex items-center justify-between gap-2.5 cursor-pointer hover:opacity-90"
          >
            <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
              <Magnet size={12} className="text-emerald-700" />
              <span>Snap</span>
            </span>
            <div className={`fluent-switch ${snapToGuides ? 'active' : ''}`}>
              <div className="fluent-switch-knob" />
            </div>
          </div>

          <div
            onClick={() => setGridVisible(!gridVisible)}
            className="flex items-center justify-between gap-2.5 cursor-pointer hover:opacity-90"
          >
            <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
              <Grid size={12} className="text-emerald-700" />
              <span>Grid</span>
            </span>
            <div className={`fluent-switch ${gridVisible ? 'active' : ''}`}>
              <div className="fluent-switch-knob" />
            </div>
          </div>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Guides</span>
      </div>
    </div>
  );
};
