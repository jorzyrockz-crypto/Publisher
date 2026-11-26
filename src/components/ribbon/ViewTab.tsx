import React from 'react';
import { usePublisher } from '../../context/PublisherContext';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  File,
  Files,
  BookOpen,
  LayoutDashboard,
} from 'lucide-react';

export const ViewTab: React.FC = () => {
  const {
    zoom,
    zoomIn,
    zoomOut,
    zoom100,
    zoomFit,
    viewMode,
    setViewMode,
    rulerVisible,
    setRulerVisible,
    guidesVisible,
    setGuidesVisible,
    gridVisible,
    setGridVisible,
    tarpapelOverlayVisible,
    setTarpapelOverlayVisible,
    printSettings,
  } = usePublisher();

  return (
    <div className="flex items-center h-[84px] px-2 py-1.5 gap-2 text-xs text-[#202833] overflow-x-auto select-none">
      {/* 1. Show / Hide Group with modern switches */}
      <div className="flex flex-col justify-between h-full py-1 pr-2 border-r border-[#e5e9ee] flex-shrink-0 min-w-[145px]">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 my-auto">
          <div
            onClick={() => setRulerVisible(!rulerVisible)}
            className="flex items-center justify-between gap-2 cursor-pointer hover:opacity-90"
          >
            <span className="text-[11px] font-medium text-[#52606c]">Rulers</span>
            <div className={`fluent-switch ${rulerVisible ? 'active' : ''}`}>
              <div className="fluent-switch-knob" />
            </div>
          </div>
          <div
            onClick={() => setGuidesVisible(!guidesVisible)}
            className="flex items-center justify-between gap-2 cursor-pointer hover:opacity-90"
          >
            <span className="text-[11px] font-medium text-[#52606c]">Guides</span>
            <div className={`fluent-switch ${guidesVisible ? 'active' : ''}`}>
              <div className="fluent-switch-knob" />
            </div>
          </div>
          <div
            onClick={() => setGridVisible(!gridVisible)}
            className="flex items-center justify-between gap-2 cursor-pointer hover:opacity-90"
          >
            <span className="text-[11px] font-medium text-[#52606c]">Grid</span>
            <div className={`fluent-switch ${gridVisible ? 'active' : ''}`}>
              <div className="fluent-switch-knob" />
            </div>
          </div>
          <div
            onClick={() => setTarpapelOverlayVisible(!tarpapelOverlayVisible)}
            className="flex items-center justify-between gap-2 cursor-pointer hover:opacity-90"
            title="Show Tarpapel poster tile lines (R1·C1) directly on the canvas so you can resize photos & graphics cleanly"
          >
            <span className="text-[11px] font-medium text-[#087477]">
              {tarpapelOverlayVisible ? `${printSettings.tarpapelCols}×${printSettings.tarpapelRows}` : 'Tiles'}
            </span>
            <div className={`fluent-switch ${tarpapelOverlayVisible ? 'active' : ''}`}>
              <div className="fluent-switch-knob" />
            </div>
          </div>
        </div>
        <span className="text-[10px] text-[#9aa4ae] font-bold uppercase tracking-[0.09em] text-center">Display</span>
      </div>

      {/* 2. Zoom Controls */}
      <div className="flex flex-col justify-between h-full py-1 px-2 border-r border-[#e5e9ee] flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          <button
            onClick={zoom100}
            className="flex items-center gap-1 px-2 py-1 hover:bg-[#eef5f5] hover:text-[#087477] active:scale-95 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] text-xs font-semibold text-[#202833] transition-all cursor-pointer tabular-nums"
            title="100% Actual Size"
          >
            100%
          </button>

          <button
            onClick={zoomFit}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#eef5f5] hover:text-[#087477] active:scale-95 rounded-[8px] text-xs font-medium text-[#202833] transition-all cursor-pointer"
            title="Fit Whole Page to Window"
          >
            <Maximize size={15} className="text-[#087f83]" />
            <span>Fit Page</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={zoomOut}
              className="p-1.5 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#eef5f5] hover:text-[#087477] text-[#52606c] transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <button
              onClick={zoomIn}
              className="p-1.5 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#eef5f5] hover:text-[#087477] text-[#52606c] transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>
        </div>
        <span className="text-[10px] text-[#9aa4ae] font-bold uppercase tracking-[0.09em] text-center tabular-nums">
          Zoom ({Math.round(zoom * 100)}%)
        </span>
      </div>

      {/* 3. Views */}
      <div className="flex flex-col justify-between h-full py-1 px-3 flex-shrink-0">
        <div className="flex items-center gap-1 bg-[#f3f5f7] p-1 rounded-[8px] my-auto">
          <button
            onClick={() => setViewMode('artboard')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-all cursor-pointer ${
              viewMode === 'artboard'
                ? 'bg-[#e5f4f3] text-[#087477]'
                : 'text-[#52606c] hover:text-[#202833] hover:bg-white/60'
            }`}
            title="Freeform Artboards (Move papers & mix sizes)"
          >
            <LayoutDashboard size={13} />
            <span>Artboard</span>
          </button>

          <button
            onClick={() => setViewMode('single')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-all cursor-pointer ${
              viewMode === 'single'
                ? 'bg-[#e5f4f3] text-[#087477]'
                : 'text-[#52606c] hover:text-[#202833] hover:bg-white/60'
            }`}
            title="Single Page View"
          >
            <File size={13} />
            <span>Single</span>
          </button>

          <button
            onClick={() => setViewMode('continuous')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-all cursor-pointer ${
              viewMode === 'continuous'
                ? 'bg-[#e5f4f3] text-[#087477]'
                : 'text-[#52606c] hover:text-[#202833] hover:bg-white/60'
            }`}
            title="All Pages Vertical Scroll"
          >
            <Files size={13} />
            <span>All Pages</span>
          </button>

          <button
            onClick={() => setViewMode('spread')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-all cursor-pointer ${
              viewMode === 'spread'
                ? 'bg-[#e5f4f3] text-[#087477]'
                : 'text-[#52606c] hover:text-[#202833] hover:bg-white/60'
            }`}
            title="Two-Page Spread View"
          >
            <BookOpen size={13} />
            <span>2-Page</span>
          </button>
        </div>
        <span className="text-[10px] text-[#9aa4ae] font-bold uppercase tracking-[0.09em] text-center">Page View</span>
      </div>
    </div>
  );
};
