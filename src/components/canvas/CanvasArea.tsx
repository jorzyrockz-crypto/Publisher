import React, { useState, useRef } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { PageCanvas } from './PageCanvas';
import { HorizontalRuler, VerticalRuler } from './Ruler';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export const CanvasArea: React.FC = () => {
  const {
    activePage,
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    zoomFit,
    rulerVisible,
    addGuide,
  } = usePublisher();

  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCursorMove = (x: number, y: number) => {
    setCursorPos({ x, y });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden pasteboard-bg relative select-none">
      {/* Top Header Strip: Corner + Top Ruler */}
      {rulerVisible && (
        <div className="flex h-5 w-full bg-white/90 border-b border-slate-200 z-30 flex-shrink-0 shadow-2xs">
          {/* Corner 0,0 box */}
          <div className="w-5 h-5 border-r border-slate-200 flex items-center justify-center bg-slate-50 text-[8px] font-mono font-medium text-slate-400 flex-shrink-0">
            in
          </div>
          {/* Horizontal Ruler */}
          <div className="flex-1 overflow-hidden relative">
            <div style={{ marginLeft: '40px' }}>
              <HorizontalRuler
                width={activePage.width}
                zoom={zoom}
                cursorX={cursorPos.x}
                onAddGuide={(pos) => addGuide('horizontal', pos)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Area: Left Ruler + Scrollable Pasteboard Canvas */}
      <div className="flex flex-1 w-full h-full overflow-hidden relative">
        {/* Vertical Left Ruler */}
        {rulerVisible && (
          <div className="w-5 bg-white/90 border-r border-slate-200 z-20 flex-shrink-0 overflow-hidden relative shadow-2xs">
            <div style={{ marginTop: '40px' }}>
              <VerticalRuler
                height={activePage.height}
                zoom={zoom}
                cursorY={cursorPos.y}
                onAddGuide={(pos) => addGuide('vertical', pos)}
              />
            </div>
          </div>
        )}

        {/* Scrollable Pasteboard Workspace */}
        <div
          ref={containerRef}
          className="flex-1 h-full overflow-auto p-12 flex items-start justify-center relative"
        >
          <div style={{ paddingBottom: '220px', paddingRight: '220px' }}>
            <PageCanvas onCursorMove={handleCursorMove} />
          </div>

          {/* Modern Floating Viewport / Zoom Pill (Figma / Canva style) */}
          <div className="fixed bottom-10 right-72 z-30 flex items-center gap-1 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/90 shadow-lg text-xs text-slate-700">
            <button
              onClick={zoomOut}
              className="p-1 hover:bg-slate-100 rounded-full transition active:scale-95 text-slate-600"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>

            <span className="font-mono font-semibold text-[11px] px-1 text-slate-800 min-w-[38px] text-center">
              {Math.round(zoom * 100)}%
            </span>

            <button
              onClick={zoomIn}
              className="p-1 hover:bg-slate-100 rounded-full transition active:scale-95 text-slate-600"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>

            <div className="w-[1px] h-3.5 bg-slate-200 mx-1" />

            <button
              onClick={zoomFit}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-emerald-50 hover:text-emerald-800 text-[11px] font-medium transition"
              title="Fit to Window"
            >
              <Maximize size={11} className="text-emerald-700" />
              <span>Fit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
