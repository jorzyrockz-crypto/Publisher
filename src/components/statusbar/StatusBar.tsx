import React, { useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { useWindowWidth } from '../../hooks/useResizablePanel';
import { ZoomIn, ZoomOut, Maximize, FileText, CheckCircle2, Layers } from 'lucide-react';

const MIN_ZOOM = 20;
const MAX_ZOOM = 300;

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

  const windowWidth = useWindowWidth();
  const isCompact = windowWidth < 1180;
  const isVeryCompact = windowWidth < 900;

  const [zoomDraft, setZoomDraft] = useState<string | null>(null);

  const selectionCount = selectedElementIds.length;
  const selectedElement =
    selectionCount === 1
      ? activePage.elements.find((el) => el.id === selectedElementIds[0])
      : null;

  const commitZoomDraft = () => {
    if (zoomDraft === null) return;
    const parsed = parseFloat(zoomDraft.replace('%', '').trim());
    if (Number.isFinite(parsed)) {
      setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, parsed)) / 100);
    }
    setZoomDraft(null);
  };

  return (
    <div className="h-[34px] bg-white text-[#5b6673] flex items-center justify-between px-3 text-[11px] select-none z-30 flex-shrink-0 border-t border-[#e5e9ee] gap-3">
      {/* Left: page info, geometry, save state */}
      <div className="flex items-center gap-3 tabular-nums min-w-0">
        <span className="flex items-center gap-1.5 font-medium text-[#161a22] whitespace-nowrap">
          <FileText size={12} className="text-[#6e56cf]" />
          Page {project.activePageIndex + 1} of {project.pages.length}
        </span>

        {/* Page size is the first thing to go on narrow viewports */}
        {!isVeryCompact && (
          <>
            <span className="text-[#e5e9ee]">|</span>
            <span className="whitespace-nowrap">
              {(activePage.width / 96).toFixed(1)}″ × {(activePage.height / 96).toFixed(1)}″
              {!isCompact && ` (${activePage.orientation})`}
            </span>
          </>
        )}

        {selectedElement && !isVeryCompact && (
          <>
            <span className="text-[#e5e9ee]">|</span>
            <span className="font-mono text-[#5c4bb8] bg-[#efeafd] px-2 py-0.5 rounded-[6px] text-[10px] whitespace-nowrap">
              Pos: {Math.round(selectedElement.x)}, {Math.round(selectedElement.y)} • Size:{' '}
              {Math.round(selectedElement.width)}×{Math.round(selectedElement.height)}
            </span>
          </>
        )}

        {selectionCount > 1 && (
          <>
            <span className="text-[#e5e9ee]">|</span>
            <span className="flex items-center gap-1 font-medium text-[#5c4bb8] bg-[#efeafd] px-2 py-0.5 rounded-[6px] text-[10px] whitespace-nowrap">
              <Layers size={10} />
              {selectionCount} objects selected
            </span>
          </>
        )}

        {!isCompact && (
          <>
            <span className="text-[#e5e9ee]">|</span>
            <span className="flex items-center gap-1 text-[#5b6673] whitespace-nowrap">
              <CheckCircle2 size={11} className="text-[#6e56cf]" />
              Saved locally
            </span>
          </>
        )}
      </div>

      {/* Right: zoom controls (consistent 20–300% range everywhere) */}
      <div className="flex items-center gap-1.5 tabular-nums flex-shrink-0">
        <button
          onClick={zoomFit}
          className="hover:text-[#5c4bb8] hover:bg-[#f4f2ff] p-1 rounded-[6px] transition text-[#4a5661] cursor-pointer"
          title="Fit Page in Window"
        >
          <Maximize size={12} />
        </button>

        <button
          onClick={zoomOut}
          className="hover:text-[#5c4bb8] hover:bg-[#f4f2ff] p-1 rounded-[6px] transition text-[#4a5661] cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={12} />
        </button>

        {!isCompact && (
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={5}
            value={Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom * 100)))}
            onChange={(e) => setZoom(Number(e.target.value) / 100)}
            aria-label="Zoom level"
            className="w-24 h-1 accent-[#6e56cf] cursor-pointer"
          />
        )}

        <button
          onClick={zoomIn}
          className="hover:text-[#5c4bb8] hover:bg-[#f4f2ff] p-1 rounded-[6px] transition text-[#4a5661] cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={12} />
        </button>

        {zoomDraft !== null ? (
          <input
            autoFocus
            value={zoomDraft}
            onChange={(e) => setZoomDraft(e.target.value)}
            onBlur={commitZoomDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitZoomDraft();
              if (e.key === 'Escape') setZoomDraft(null);
            }}
            aria-label="Zoom percentage"
            className="w-12 text-right font-mono font-semibold text-[#161a22] bg-white border border-[#b3a4f2] rounded-[6px] px-1 py-0.5 outline-none text-[11px]"
          />
        ) : (
          <button
            onClick={() => setZoomDraft(String(Math.round(zoom * 100)))}
            title="Click to type a zoom level"
            className="w-11 text-right font-mono font-semibold text-[#161a22] hover:text-[#5c4bb8] hover:bg-[#f4f2ff] rounded-[6px] px-1 py-0.5 transition cursor-pointer"
          >
            {Math.round(zoom * 100)}%
          </button>
        )}
      </div>
    </div>
  );
};
