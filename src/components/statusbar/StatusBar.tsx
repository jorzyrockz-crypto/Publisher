import React from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { ZoomIn, ZoomOut, Maximize, FileText } from 'lucide-react';

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
    <div className="h-[34px] bg-white text-[#778391] flex items-center justify-between px-4 text-[11px] select-none z-30 flex-shrink-0 border-t border-[#e5e9ee]">
      {/* Left: Page Info & Element Geometry */}
      <div className="flex items-center gap-3 tabular-nums">
        <span className="flex items-center gap-1.5 font-medium text-[#202833]">
          <FileText size={12} className="text-[#087f83]" />
          Page {project.activePageIndex + 1} of {project.pages.length}
        </span>

        <span className="text-[#e5e9ee]">|</span>

        <span className="text-[#778391]">
          {(activePage.width / 96).toFixed(1)}" × {(activePage.height / 96).toFixed(1)}" (
          {activePage.orientation})
        </span>

        {selectedElement && (
          <>
            <span className="text-[#e5e9ee]">|</span>
            <span className="font-mono text-[#087477] bg-[#e5f4f3] px-2 py-0.5 rounded-[6px] text-[10px]">
              Pos: {Math.round(selectedElement.x)}, {Math.round(selectedElement.y)} • Size:{' '}
              {Math.round(selectedElement.width)}×{Math.round(selectedElement.height)}
            </span>
          </>
        )}
      </div>

      {/* Right: Zoom slider & Fit Page */}
      <div className="flex items-center gap-2 tabular-nums">
        <button
          onClick={zoomFit}
          className="hover:text-[#087477] hover:bg-[#eef5f5] p-1 rounded-[6px] transition text-[#52606c] cursor-pointer"
          title="Fit Page in Window"
        >
          <Maximize size={12} />
        </button>

        <button
          onClick={zoomOut}
          className="hover:text-[#087477] hover:bg-[#eef5f5] p-1 rounded-[6px] transition text-[#52606c] cursor-pointer"
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
          className="w-24 h-1 accent-[#087f83] cursor-pointer"
        />

        <button
          onClick={zoomIn}
          className="hover:text-[#087477] hover:bg-[#eef5f5] p-1 rounded-[6px] transition text-[#52606c] cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={12} />
        </button>

        <span className="w-10 text-right font-mono font-semibold text-[#202833]">
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
};
