import React from 'react';
import { usePublisher } from '../../context/PublisherContext';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  CheckSquare,
  Square,
  BookOpen,
  File,
} from 'lucide-react';

export const ViewTab: React.FC = () => {
  const {
    zoom,
    zoomIn,
    zoomOut,
    zoom100,
    zoomFit,
    rulerVisible,
    setRulerVisible,
    guidesVisible,
    setGuidesVisible,
    gridVisible,
    setGridVisible,
  } = usePublisher();

  return (
    <div className="flex items-center h-24 px-2 py-1 gap-2 text-xs text-slate-700 overflow-x-auto select-none">
      {/* 1. Show / Hide Group */}
      <div className="flex flex-col justify-between h-full px-2 border-r border-slate-300 flex-shrink-0">
        <div className="space-y-1 my-auto">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={rulerVisible}
              onChange={(e) => setRulerVisible(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#0f6b4e]"
            />
            <span className="text-[11px]">Rulers</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={guidesVisible}
              onChange={(e) => setGuidesVisible(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#0f6b4e]"
            />
            <span className="text-[11px]">Guides</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={gridVisible}
              onChange={(e) => setGridVisible(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#0f6b4e]"
            />
            <span className="text-[11px]">Gridlines</span>
          </label>
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Show</span>
      </div>

      {/* 2. Zoom Group */}
      <div className="flex flex-col justify-between h-full px-2 border-r border-slate-300 flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          <button
            onClick={zoom100}
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition"
            title="100% Actual Size"
          >
            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
              100%
            </div>
            <span className="text-[10px] mt-0.5">100%</span>
          </button>

          <button
            onClick={zoomFit}
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition group"
            title="Fit Whole Page to Window"
          >
            <div className="w-8 h-8 rounded bg-emerald-50 border border-[#0f6b4e] flex items-center justify-center group-hover:bg-[#0f6b4e] group-hover:text-white transition text-[#0f6b4e]">
              <Maximize size={18} />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Whole Page</span>
          </button>

          <div className="flex flex-col gap-1">
            <button
              onClick={zoomIn}
              className="p-1 rounded border border-slate-300 hover:bg-slate-100"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={zoomOut}
              className="p-1 rounded border border-slate-300 hover:bg-slate-100"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">
          Zoom ({Math.round(zoom * 100)}%)
        </span>
      </div>

      {/* 3. Views */}
      <div className="flex flex-col justify-between h-full px-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          <button
            className="flex flex-col items-center p-1.5 bg-emerald-50 border border-[#0f6b4e] rounded text-[#0f6b4e]"
            title="Single Page View"
          >
            <File size={16} />
            <span className="text-[10px] mt-0.5 font-semibold">Single Page</span>
          </button>
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Views</span>
      </div>
    </div>
  );
};
