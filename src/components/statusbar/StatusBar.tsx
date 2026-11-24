import React from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

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
    <div className="h-6 bg-[#0f6b4e] text-white flex items-center justify-between px-3 text-[11px] select-none z-30 flex-shrink-0">
      {/* Left: Page count & selection geometry */}
      <div className="flex items-center gap-4">
        <span className="font-medium">
          Page {project.activePageIndex + 1} of {project.pages.length}
        </span>

        <span className="text-white/60">|</span>

        <span className="text-white/80">
          {(activePage.width / 96).toFixed(1)}" × {(activePage.height / 96).toFixed(1)}" (
          {activePage.orientation})
        </span>

        {selectedElement && (
          <>
            <span className="text-white/60">|</span>
            <span className="font-mono text-emerald-200">
              Pos: ({Math.round(selectedElement.x)}, {Math.round(selectedElement.y)}) Size: (
              {Math.round(selectedElement.width)} × {Math.round(selectedElement.height)})
            </span>
          </>
        )}
      </div>

      {/* Right: Zoom slider & Fit Page */}
      <div className="flex items-center gap-2">
        <button
          onClick={zoomFit}
          className="hover:text-amber-300 p-0.5 rounded transition"
          title="Fit Page in Window"
        >
          <Maximize size={12} />
        </button>

        <button
          onClick={zoomOut}
          className="hover:text-amber-300 p-0.5 rounded transition"
          title="Zoom Out"
        >
          <ZoomOut size={12} />
        </button>

        <input
          type="range"
          min={25}
          max={250}
          value={Math.round(zoom * 100)}
          onChange={(e) => setZoom(Number(e.target.value) / 100)}
          className="w-20 h-1 accent-amber-300 cursor-pointer"
        />

        <button
          onClick={zoomIn}
          className="hover:text-amber-300 p-0.5 rounded transition"
          title="Zoom In"
        >
          <ZoomIn size={12} />
        </button>

        <span className="w-10 text-right font-mono font-semibold">
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
};
