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
  } = usePublisher();

  return (
    <div className="flex items-center h-24 px-3 py-1 gap-3 text-xs text-slate-700 overflow-x-auto select-none">
      {/* 1. Show / Hide Group with modern switches */}
      <div className="flex flex-col justify-between h-full py-1 pr-3 border-r border-slate-200 flex-shrink-0 min-w-[130px]">
        <div className="space-y-1.5 my-auto">
          <div
            onClick={() => setRulerVisible(!rulerVisible)}
            className="flex items-center justify-between gap-2 cursor-pointer hover:opacity-90"
          >
            <span className="text-[11px] font-medium text-slate-600">Rulers</span>
            <div className={`fluent-switch ${rulerVisible ? 'active' : ''}`}>
              <div className="fluent-switch-knob" />
            </div>
          </div>
          <div
            onClick={() => setGuidesVisible(!guidesVisible)}
            className="flex items-center justify-between gap-2 cursor-pointer hover:opacity-90"
          >
            <span className="text-[11px] font-medium text-slate-600">Guides</span>
            <div className={`fluent-switch ${guidesVisible ? 'active' : ''}`}>
              <div className="fluent-switch-knob" />
            </div>
          </div>
          <div
            onClick={() => setGridVisible(!gridVisible)}
            className="flex items-center justify-between gap-2 cursor-pointer hover:opacity-90"
          >
            <span className="text-[11px] font-medium text-slate-600">Gridlines</span>
            <div className={`fluent-switch ${gridVisible ? 'active' : ''}`}>
              <div className="fluent-switch-knob" />
            </div>
          </div>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Display</span>
      </div>

      {/* 2. Zoom Controls */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2 my-auto">
          <button
            onClick={zoom100}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="100% Actual Size"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 font-bold text-xs text-slate-700 flex items-center justify-center group-hover:bg-slate-200 transition-all shadow-xs">
              100%
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Actual</span>
          </button>

          <button
            onClick={zoomFit}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Fit Whole Page to Window"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
              <Maximize size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Fit Page</span>
          </button>

          <div className="flex flex-col gap-1">
            <button
              onClick={zoomIn}
              className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition shadow-2xs"
              title="Zoom In"
            >
              <ZoomIn size={13} className="text-slate-600" />
            </button>
            <button
              onClick={zoomOut}
              className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition shadow-2xs"
              title="Zoom Out"
            >
              <ZoomOut size={13} className="text-slate-600" />
            </button>
          </div>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">
          Zoom ({Math.round(zoom * 100)}%)
        </span>
      </div>

      {/* 3. Views */}
      <div className="flex flex-col justify-between h-full py-1 px-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          <button
            onClick={() => setViewMode('artboard')}
            className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${
              viewMode === 'artboard'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Freeform Artboards (Move papers & mix sizes)"
          >
            <LayoutDashboard size={16} />
            <span className="text-[10px] font-semibold mt-1">Artboard</span>
          </button>

          <button
            onClick={() => setViewMode('single')}
            className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${
              viewMode === 'single'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Single Page View"
          >
            <File size={16} />
            <span className="text-[10px] font-semibold mt-1">Single</span>
          </button>

          <button
            onClick={() => setViewMode('continuous')}
            className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${
              viewMode === 'continuous'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="All Pages Vertical Scroll"
          >
            <Files size={16} />
            <span className="text-[10px] font-semibold mt-1">All Pages</span>
          </button>

          <button
            onClick={() => setViewMode('spread')}
            className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${
              viewMode === 'spread'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Two-Page Spread View"
          >
            <BookOpen size={16} />
            <span className="text-[10px] font-semibold mt-1">2-Page</span>
          </button>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Page View</span>
      </div>
    </div>
  );
};
