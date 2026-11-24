import React, { useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { PAGE_SIZES } from '../../constants/pageSizes';
import { COLOR_SCHEMES } from '../../constants/colorSchemes';
import {
  FileText,
  Palette,
  Maximize2,
  ChevronDown,
  Compass,
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
    addGuide,
    snapToGuides,
    setSnapToGuides,
    gridVisible,
    setGridVisible,
  } = usePublisher();

  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isMarginsDropdownOpen, setIsMarginsDropdownOpen] = useState(false);
  const [isSchemesDropdownOpen, setIsSchemesDropdownOpen] = useState(false);

  return (
    <div className="flex items-center h-24 px-2 py-1 gap-2 text-xs text-slate-700 overflow-x-auto select-none">
      {/* 1. Template Group */}
      <div className="flex flex-col justify-between h-full px-2 border-r border-slate-300 flex-shrink-0">
        <div className="my-auto">
          <button
            onClick={() => setIsBackstageOpen(true)}
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition group"
            title="Change Template"
          >
            <div className="w-8 h-8 rounded bg-emerald-50 border border-[#0f6b4e] flex items-center justify-center group-hover:bg-[#0f6b4e] group-hover:text-white transition text-[#0f6b4e]">
              <FileText size={18} />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Templates</span>
          </button>
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Template</span>
      </div>

      {/* 2. Page Setup Group */}
      <div className="flex flex-col justify-between h-full px-2 border-r border-slate-300 flex-shrink-0">
        <div className="space-y-1 my-auto">
          <div className="flex items-center gap-1.5">
            {/* Margins Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsMarginsDropdownOpen(!isMarginsDropdownOpen)}
                className="flex items-center gap-1 px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-[11px]"
              >
                <span>Margins</span>
                <ChevronDown size={10} />
              </button>
              {isMarginsDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-300 shadow-xl rounded-md p-1.5 z-50 w-36 space-y-1">
                  <button
                    onClick={() => {
                      setPageMargins({ top: 48, right: 48, bottom: 48, left: 48 });
                      setIsMarginsDropdownOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 hover:bg-slate-100 rounded text-[11px]"
                  >
                    Normal (0.5")
                  </button>
                  <button
                    onClick={() => {
                      setPageMargins({ top: 24, right: 24, bottom: 24, left: 24 });
                      setIsMarginsDropdownOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 hover:bg-slate-100 rounded text-[11px]"
                  >
                    Narrow (0.25")
                  </button>
                  <button
                    onClick={() => {
                      setPageMargins({ top: 96, right: 96, bottom: 96, left: 96 });
                      setIsMarginsDropdownOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 hover:bg-slate-100 rounded text-[11px]"
                  >
                    Wide (1.0")
                  </button>
                  <button
                    onClick={() => {
                      setPageMargins({ top: 0, right: 0, bottom: 0, left: 0 });
                      setIsMarginsDropdownOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 hover:bg-slate-100 rounded text-[11px]"
                  >
                    None (0")
                  </button>
                </div>
              )}
            </div>

            {/* Orientation Toggle */}
            <div className="flex border border-slate-300 rounded overflow-hidden">
              <button
                onClick={() => setPageOrientation('portrait')}
                className={`px-2 py-1 text-[11px] font-medium transition ${
                  activePage.orientation === 'portrait'
                    ? 'bg-emerald-50 text-[#0f6b4e] font-bold'
                    : 'bg-white hover:bg-slate-100 text-slate-600'
                }`}
                title="Portrait"
              >
                Portrait
              </button>
              <button
                onClick={() => setPageOrientation('landscape')}
                className={`px-2 py-1 text-[11px] font-medium transition ${
                  activePage.orientation === 'landscape'
                    ? 'bg-emerald-50 text-[#0f6b4e] font-bold'
                    : 'bg-white hover:bg-slate-100 text-slate-600'
                }`}
                title="Landscape"
              >
                Landscape
              </button>
            </div>
          </div>

          {/* Size Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
              className="flex items-center justify-between w-full px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-[11px]"
            >
              <span className="truncate max-w-[130px]">
                {PAGE_SIZES.find(
                  (s) => s.width === activePage.width && s.height === activePage.height
                )?.displayName || 'Custom Size'}
              </span>
              <ChevronDown size={10} />
            </button>
            {isSizeDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-300 shadow-xl rounded-md p-1.5 z-50 w-48 max-h-56 overflow-y-auto space-y-1">
                {PAGE_SIZES.map((size) => (
                  <button
                    key={size.name}
                    onClick={() => {
                      setPageSize(size.name);
                      setIsSizeDropdownOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 hover:bg-slate-100 rounded text-[11px]"
                  >
                    {size.displayName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Page Setup</span>
      </div>

      {/* 3. Color Schemes Group */}
      <div className="flex flex-col justify-between h-full px-2 border-r border-slate-300 flex-shrink-0 relative">
        <div className="my-auto">
          <button
            onClick={() => setIsSchemesDropdownOpen(!isSchemesDropdownOpen)}
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition group"
            title="Change Color Scheme"
          >
            <div className="w-8 h-8 rounded bg-emerald-50 border border-[#0f6b4e] flex items-center justify-center group-hover:bg-[#0f6b4e] group-hover:text-white transition text-[#0f6b4e]">
              <Palette size={18} />
            </div>
            <span className="text-[10px] mt-0.5 font-medium flex items-center">
              Schemes <ChevronDown size={10} className="ml-0.5" />
            </span>
          </button>

          {isSchemesDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-300 shadow-xl rounded-md p-2 z-50 w-52 space-y-2">
              <div className="text-[11px] font-semibold text-slate-600">Office Schemes</div>
              {COLOR_SCHEMES.map((scheme) => (
                <button
                  key={scheme.id}
                  onClick={() => {
                    setColorScheme(scheme.id);
                    setIsSchemesDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-1.5 rounded hover:bg-slate-100 transition ${
                    project.colorScheme === scheme.id ? 'bg-emerald-50 font-bold' : ''
                  }`}
                >
                  <span className="text-[11px] text-slate-700">{scheme.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: scheme.primary }} />
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: scheme.secondary }} />
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: scheme.accent }} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Schemes</span>
      </div>

      {/* 4. Page Background */}
      <div className="flex flex-col justify-between h-full px-2 border-r border-slate-300 flex-shrink-0">
        <div className="flex items-center gap-2 my-auto">
          <input
            type="color"
            value={activePage.backgroundColor}
            onChange={(e) => setPageBackgroundColor(e.target.value)}
            className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
            title="Change Canvas Background Color"
          />
          <button
            onClick={() => setPageBackgroundColor('#ffffff')}
            className="text-[11px] px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50"
          >
            White
          </button>
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Background</span>
      </div>

      {/* 5. Layout & Snapping */}
      <div className="flex flex-col justify-between h-full px-2 flex-shrink-0">
        <div className="space-y-1 my-auto">
          <button
            onClick={() => setSnapToGuides(!snapToGuides)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition text-[11px] ${
              snapToGuides
                ? 'bg-emerald-50 border-[#0f6b4e] text-[#0f6b4e] font-semibold'
                : 'border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Magnet size={12} />
            <span>Snap to Guides</span>
          </button>
          <button
            onClick={() => setGridVisible(!gridVisible)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition text-[11px] ${
              gridVisible
                ? 'bg-emerald-50 border-[#0f6b4e] text-[#0f6b4e] font-semibold'
                : 'border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Grid size={12} />
            <span>Show Grid</span>
          </button>
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Layout</span>
      </div>
    </div>
  );
};
