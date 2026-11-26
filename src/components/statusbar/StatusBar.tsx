import React from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { ZoomIn, ZoomOut, Maximize, FileText, CheckCircle2 } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const {
    project,
    activePage,
    selectedElementIds,
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    zoomFit,
  } = usePublisher();

  const selectedElement =
    selectedElementIds.length === 1
      ? activePage.elements.find((el) => el.id === selectedElementIds[0])
      : null;

  return (
    <div className="h-6 bg-[#064e3b] text-indigo-100 flex items-center justify-between px-3 text-[11px] select-none z-30 flex-shrink-0 border-t border-indigo-900/50 shadow-inner">
      {/* Left: Page Info & Element Geometry */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 font-semibold text-white">
          <FileText size={11} className="text-indigo-300" />
          Page {project.activePageIndex + 1} of {project.pages.length}
        </span>

        <span className="text-indigo-400/40">|</span>

        <span className="text-indigo-200/80">
          {(activePage.width / 96).toFixed(1)}" × {(activePage.height / 96).toFixed(1)}" (
          {activePage.orientation})
        </span>

        {selectedElement && (
          <>
            <span className="text-indigo-400/40">|</span>
            <span className="font-mono text-indigo-300 bg-indigo-900/50 px-1.5 py-0.2 rounded text-[10px]">
              Pos: {Math.round(selectedElement.x)}, {Math.round(selectedElement.y)} • Size: {Math.round(selectedElement.width)}×{Math.round(selectedElement.height)}
            </span>
          </>
        )}
      </div>

      {/* Right: Zoom slider & Fit Page */}
      <div className="flex items-center gap-2">
        <button
          onClick={zoomFit}
          className="hover:text-white p-0.5 rounded transition text-indigo-200"
          title="Fit Page in Window"
        >
          <Maximize size={11} />
        </button>

        <button
          onClick={zoomOut}
          className="hover:text-white p-0.5 rounded transition text-indigo-200"
          title="Zoom Out"
        >
          <ZoomOut size={11} />
        </button>

        <input
          type="range"
          min={25}
          max={250}
          value={Math.round(zoom * 100)}
          onChange={(e) => setZoom(Number(e.target.value) / 100)}
          className="w-20 h-1 accent-indigo-400 cursor-pointer"
        />

        <button
          onClick={zoomIn}
          className="hover:text-white p-0.5 rounded transition text-indigo-200"
          title="Zoom In"
        >
          <ZoomIn size={11} />
        </button>

        <span className="w-9 text-right font-mono font-semibold text-white">
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
};
