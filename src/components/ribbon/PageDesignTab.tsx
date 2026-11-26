import React, { useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { PAGE_SIZES } from '../../constants/pageSizes';
import { COLOR_SCHEMES } from '../../constants/colorSchemes';
import { FloatingDropdown } from '../common/FloatingDropdown';
import {
  FileText,
  Palette,
  ChevronDown,
  Magnet,
  Grid,
  LayoutGrid,
  Sparkles,
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
    setIsBrandBoardModalOpen,
    setIsBrandKitModalOpen,
    activeBrandKit,
    applyBrandKit,
    snapToGuides,
    setSnapToGuides,
    gridVisible,
    setGridVisible,
  } = usePublisher();

  const marginsBtnRef = useRef<HTMLButtonElement>(null);
  const sizeBtnRef = useRef<HTMLButtonElement>(null);
  const schemesBtnRef = useRef<HTMLButtonElement>(null);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isMarginsDropdownOpen, setIsMarginsDropdownOpen] = useState(false);
  const [isSchemesDropdownOpen, setIsSchemesDropdownOpen] = useState(false);

  return (
    <div className="flex items-center h-[84px] px-2 py-1.5 gap-2 text-xs text-[#202833] overflow-x-auto select-none">
      {/* 1. Template Group */}
      <div className="flex flex-col justify-between h-full py-1 pr-2 border-r border-[#e5e9ee] flex-shrink-0">
        <div className="my-auto flex items-center gap-1">
          <button
            onClick={() => setIsBackstageOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#eef5f5] hover:text-[#087477] active:scale-95 rounded-[8px] text-xs font-medium text-[#202833] transition-all cursor-pointer"
            title="Browse Templates"
          >
            <FileText size={15} className="text-[#087f83]" />
            <span>Templates</span>
          </button>

          <button
            onClick={() => setIsBrandBoardModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#eef5f5] hover:text-[#087477] active:scale-95 rounded-[8px] text-xs font-medium text-[#202833] transition-all cursor-pointer"
            title="Generate Multiple Brand Sizes on Artboard"
          >
            <LayoutGrid size={15} className="text-[#087f83]" />
            <span>Brand Board</span>
          </button>
        </div>
        <span className="text-[10px] text-[#9aa4ae] font-bold uppercase tracking-[0.09em] text-center">Library</span>
      </div>

      {/* 2. Page Setup Group */}
      <div className="flex flex-col justify-between h-full py-1 px-2 border-r border-[#e5e9ee] flex-shrink-0">
        <div className="space-y-1.5 my-auto">
          <div className="flex items-center gap-2">
            {/* Margins Dropdown */}
            <div className="relative">
              <button
                ref={marginsBtnRef}
                onClick={() => setIsMarginsDropdownOpen(!isMarginsDropdownOpen)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#eef5f5] hover:text-[#087477] text-[11px] font-medium transition cursor-pointer"
              >
                <span>Margins</span>
                <ChevronDown size={10} className="text-[#9aa4ae]" />
              </button>
              <FloatingDropdown
                isOpen={isMarginsDropdownOpen}
                onClose={() => setIsMarginsDropdownOpen(false)}
                anchorRef={marginsBtnRef}
                className="p-1.5 w-40 space-y-0.5 text-[#202833]"
              >
                <button
                  onClick={() => {
                    setPageMargins({ top: 48, right: 48, bottom: 48, left: 48 });
                    setIsMarginsDropdownOpen(false);
                  }}
                  className="w-full text-left px-2 py-1 hover:bg-[#eef5f5] hover:text-[#087477] rounded-[8px] text-xs transition cursor-pointer"
                >
                  Normal (0.5")
                </button>
                <button
                  onClick={() => {
                    setPageMargins({ top: 24, right: 24, bottom: 24, left: 24 });
                    setIsMarginsDropdownOpen(false);
                  }}
                  className="w-full text-left px-2 py-1 hover:bg-[#eef5f5] hover:text-[#087477] rounded-[8px] text-xs transition cursor-pointer"
                >
                  Narrow (0.25")
                </button>
                <button
                  onClick={() => {
                    setPageMargins({ top: 96, right: 96, bottom: 96, left: 96 });
                    setIsMarginsDropdownOpen(false);
                  }}
                  className="w-full text-left px-2 py-1 hover:bg-[#eef5f5] hover:text-[#087477] rounded-[8px] text-xs transition cursor-pointer"
                >
                  Wide (1.0")
                </button>
                <button
                  onClick={() => {
                    setPageMargins({ top: 0, right: 0, bottom: 0, left: 0 });
                    setIsMarginsDropdownOpen(false);
                  }}
                  className="w-full text-left px-2 py-1 hover:bg-[#eef5f5] hover:text-[#087477] rounded-[8px] text-xs transition cursor-pointer"
                >
                  None (0")
                </button>
              </FloatingDropdown>
            </div>

            {/* Orientation Segmented Control */}
            <div className="flex bg-[#f3f5f7] p-0.5 rounded-[8px] border border-[#e5e9ee]">
              <button
                onClick={() => setPageOrientation('portrait')}
                className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-[6px] transition-all cursor-pointer ${
                  activePage.orientation === 'portrait'
                    ? 'bg-[#e5f4f3] text-[#087477]'
                    : 'text-[#52606c] hover:text-[#202833]'
                }`}
              >
                Portrait
              </button>
              <button
                onClick={() => setPageOrientation('landscape')}
                className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-[6px] transition-all cursor-pointer ${
                  activePage.orientation === 'landscape'
                    ? 'bg-[#e5f4f3] text-[#087477]'
                    : 'text-[#52606c] hover:text-[#202833]'
                }`}
              >
                Landscape
              </button>
            </div>
          </div>

          {/* Size Dropdown */}
          <div className="relative">
            <button
              ref={sizeBtnRef}
              onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
              className="flex items-center justify-between w-full px-2.5 py-1 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#eef5f5] hover:text-[#087477] text-[11px] font-medium transition cursor-pointer"
            >
              <span className="truncate max-w-[140px]">
                {PAGE_SIZES.find(
                  (s) => s.width === activePage.width && s.height === activePage.height
                )?.displayName || 'Custom Size'}
              </span>
              <ChevronDown size={10} className="text-[#9aa4ae]" />
            </button>
            <FloatingDropdown
              isOpen={isSizeDropdownOpen}
              onClose={() => setIsSizeDropdownOpen(false)}
              anchorRef={sizeBtnRef}
              className="p-2 w-56 max-h-64 overflow-y-auto space-y-0.5 text-[#202833]"
            >
              {PAGE_SIZES.map((size) => (
                <button
                  key={size.name}
                  onClick={() => {
                    setPageSize(size.name);
                    setIsSizeDropdownOpen(false);
                  }}
                  className="w-full text-left px-2 py-1 hover:bg-[#eef5f5] hover:text-[#087477] rounded-[8px] text-xs transition cursor-pointer"
                >
                  {size.displayName}
                </button>
              ))}
            </FloatingDropdown>
          </div>
        </div>
        <span className="text-[10px] text-[#9aa4ae] font-bold uppercase tracking-[0.09em] text-center">Setup</span>
      </div>

      {/* 3. Brand Kit & Color Schemes Group */}
      <div className="flex flex-col justify-between h-full py-1 px-2 border-r border-[#e5e9ee] flex-shrink-0 relative">
        <div className="my-auto flex items-center gap-1">
          <button
            onClick={() => setIsBrandKitModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#eef5f5] hover:text-[#087477] active:scale-95 rounded-[8px] text-xs font-medium text-[#202833] transition-all cursor-pointer"
            title={`Open Brand Kit Studio (Active: ${activeBrandKit.name})`}
          >
            <Sparkles size={15} className="text-[#087f83]" />
            <span>Brand Kit</span>
          </button>

          <button
            ref={schemesBtnRef}
            onClick={() => setIsSchemesDropdownOpen(!isSchemesDropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#eef5f5] hover:text-[#087477] active:scale-95 rounded-[8px] text-xs font-medium text-[#202833] transition-all cursor-pointer"
            title="Change Color Scheme"
          >
            <Palette size={15} className="text-[#087f83]" />
            <span>Schemes</span>
            <ChevronDown size={10} className="text-[#9aa4ae]" />
          </button>

          <button
            onClick={() => applyBrandKit(activeBrandKit, 'all')}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 hover:bg-[#eef5f5] hover:text-[#087477] active:scale-95 rounded-[8px] text-xs font-medium text-[#202833] transition-all cursor-pointer"
            title={`Apply "${activeBrandKit.name}" to all artboards`}
          >
            <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
              <span className="rounded-xs" style={{ backgroundColor: activeBrandKit.colors.primary }} />
              <span className="rounded-xs" style={{ backgroundColor: activeBrandKit.colors.secondary }} />
              <span className="rounded-xs" style={{ backgroundColor: activeBrandKit.colors.accent }} />
              <span className="rounded-xs" style={{ backgroundColor: activeBrandKit.colors.dark }} />
            </div>
            <span>Rebrand All</span>
          </button>

          <FloatingDropdown
            isOpen={isSchemesDropdownOpen}
            onClose={() => setIsSchemesDropdownOpen(false)}
            anchorRef={schemesBtnRef}
            className="p-2 w-56 space-y-1 text-[#202833]"
          >
            <div className="text-[10px] font-bold text-[#9aa4ae] px-2 py-1 uppercase tracking-[0.09em]">
              Palette Presets
            </div>
            {COLOR_SCHEMES.map((scheme) => (
              <button
                key={scheme.id}
                onClick={() => {
                  setColorScheme(scheme.id);
                  setIsSchemesDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[8px] hover:bg-[#eef5f5] transition cursor-pointer ${
                  project.colorScheme === scheme.id ? 'bg-[#e5f4f3] text-[#087477]' : ''
                }`}
              >
                <span className="text-xs font-medium">{scheme.name}</span>
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-full border border-[#e5e9ee]" style={{ backgroundColor: scheme.primary }} />
                  <span className="w-3.5 h-3.5 rounded-full border border-[#e5e9ee]" style={{ backgroundColor: scheme.secondary }} />
                  <span className="w-3.5 h-3.5 rounded-full border border-[#e5e9ee]" style={{ backgroundColor: scheme.accent }} />
                </div>
              </button>
            ))}
          </FloatingDropdown>
        </div>
        <span className="text-[10px] text-[#9aa4ae] font-bold uppercase tracking-[0.09em] text-center">Colors</span>
      </div>

      {/* 4. Canvas Background */}
      <div className="flex flex-col justify-between h-full py-1 px-2 border-r border-[#e5e9ee] flex-shrink-0">
        <div className="flex items-center gap-2 my-auto">
          <input
            type="color"
            value={activePage.backgroundColor}
            onChange={(e) => setPageBackgroundColor(e.target.value)}
            className="w-7 h-7 rounded-[8px] border border-[#e5e9ee] cursor-pointer overflow-hidden p-0"
            title="Change Canvas Background Color"
          />
          <button
            onClick={() => setPageBackgroundColor('#ffffff')}
            className="text-[11px] font-medium px-2.5 py-1 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#eef5f5] hover:text-[#087477] transition cursor-pointer"
          >
            White
          </button>
        </div>
        <span className="text-[10px] text-[#9aa4ae] font-bold uppercase tracking-[0.09em] text-center">Canvas</span>
      </div>

      {/* 5. Snapping & Grid Switches */}
      <div className="flex flex-col justify-between h-full py-1 px-3 flex-shrink-0">
        <div className="space-y-1.5 my-auto">
          <div
            onClick={() => setSnapToGuides(!snapToGuides)}
            className="flex items-center justify-between gap-2.5 cursor-pointer hover:opacity-90"
          >
            <span className="text-[11px] font-medium text-[#52606c] flex items-center gap-1">
              <Magnet size={12} className="text-[#087f83]" />
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
            <span className="text-[11px] font-medium text-[#52606c] flex items-center gap-1">
              <Grid size={12} className="text-[#087f83]" />
              <span>Grid</span>
            </span>
            <div className={`fluent-switch ${gridVisible ? 'active' : ''}`}>
              <div className="fluent-switch-knob" />
            </div>
          </div>
        </div>
        <span className="text-[10px] text-[#9aa4ae] font-bold uppercase tracking-[0.09em] text-center">Guides</span>
      </div>
    </div>
  );
};
