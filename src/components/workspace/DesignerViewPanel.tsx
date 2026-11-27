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
  Layers,
} from 'lucide-react';

export const DesignerViewPanel: React.FC = () => {
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
    isEditingMaster,
    setIsEditingMaster,
  } = usePublisher();

  const viewOptions = [
    { id: 'artboard', label: 'Artboard', icon: <LayoutDashboard size={14} /> },
    { id: 'single', label: 'Single Page', icon: <File size={14} /> },
    { id: 'continuous', label: 'Scroll', icon: <Files size={14} /> },
    { id: 'spread', label: '2-Page Spread', icon: <BookOpen size={14} /> },
  ] as const;

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4 touch-manipulation">
      {/* 1. Display Overlays */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-[#4a5661]">Display Overlays</p>
        <div className="space-y-1 p-2.5 rounded-[12px] border border-[#e5e9ee] bg-[#f8fafb]">
          {[
            { label: 'Rulers', active: rulerVisible, toggle: () => setRulerVisible(!rulerVisible) },
            { label: 'Guides', active: guidesVisible, toggle: () => setGuidesVisible(!guidesVisible) },
            { label: 'Grid', active: gridVisible, toggle: () => setGridVisible(!gridVisible) },
            {
              label: tarpapelOverlayVisible
                ? `Tarpapel Tiles (${printSettings.tarpapelCols}×${printSettings.tarpapelRows})`
                : 'Tarpapel Tiles',
              active: tarpapelOverlayVisible,
              toggle: () => setTarpapelOverlayVisible(!tarpapelOverlayVisible),
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.toggle}
              className="w-full min-h-[38px] flex items-center justify-between py-1.5 px-1 text-xs font-medium text-[#161a22] cursor-pointer touch-manipulation"
            >
              <span>{item.label}</span>
              <div className={`fluent-switch ${item.active ? 'active' : ''}`}>
                <div className="fluent-switch-knob" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Zoom Controls */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-[#4a5661]">Zoom</p>
          <span className="text-[11px] font-mono font-semibold text-[#5c4bb8]">
            {Math.round(zoom * 100)}%
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={zoomOut}
            className="flex items-center justify-center py-1.5 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] text-[#4a5661] hover:text-[#5c4bb8] cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={zoomIn}
            className="flex items-center justify-center py-1.5 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] text-[#4a5661] hover:text-[#5c4bb8] cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            onClick={zoom100}
            className="flex items-center justify-center py-1.5 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] text-[11px] font-semibold text-[#161a22] hover:text-[#5c4bb8] cursor-pointer"
            title="100% Actual Size"
          >
            100%
          </button>
          <button
            type="button"
            onClick={zoomFit}
            className="flex items-center justify-center gap-1 py-1.5 rounded-[8px] border border-[#d3c9f9] bg-[#f4f2ff] hover:bg-[#efeafd] text-[11px] font-semibold text-[#5c4bb8] cursor-pointer"
            title="Fit Page"
          >
            <Maximize size={12} />
            <span>Fit</span>
          </button>
        </div>
      </div>

      {/* 3. View Mode */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-[#4a5661]">Canvas Layout</p>
        <div className="grid grid-cols-2 gap-1.5">
          {viewOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setViewMode(opt.id)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-[8px] border text-[11px] font-medium transition cursor-pointer ${
                viewMode === opt.id
                  ? 'bg-[#efeafd] border-[#d3c9f9] text-[#5c4bb8] font-semibold'
                  : 'bg-[#f8fafb] border-[#e5e9ee] text-[#4a5661] hover:bg-[#f4f2ff]'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Master Page */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-[#4a5661]">Master Background</p>
        <button
          type="button"
          onClick={() => setIsEditingMaster(!isEditingMaster)}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[9px] border text-xs font-semibold transition cursor-pointer ${
            isEditingMaster
              ? 'bg-[#6e56cf] border-[#6e56cf] text-white'
              : 'bg-[#f8fafb] border-[#e5e9ee] text-[#161a22] hover:bg-[#f4f2ff] hover:text-[#5c4bb8]'
          }`}
        >
          <Layers size={14} />
          <span>{isEditingMaster ? 'Exit Master Page' : 'Edit Master Page'}</span>
        </button>
      </div>
    </div>
  );
};
