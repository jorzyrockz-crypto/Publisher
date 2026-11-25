import React, { useState, useRef, useEffect } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { PageCanvas } from './PageCanvas';
import { HorizontalRuler, VerticalRuler } from './Ruler';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Plus,
  File,
  Files,
  BookOpen,
  Hand,
  MousePointer2,
} from 'lucide-react';

export const CanvasArea: React.FC = () => {
  const {
    project,
    activePage,
    isEditingMaster,
    viewMode,
    setViewMode,
    toolMode,
    setToolMode,
    isRightPanelOpen,
    addPage,
    setActivePageIndex,
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    zoomFit,
    rulerVisible,
    addGuide,
  } = usePublisher();

  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Spacebar hold for temporary Hand/Pan tool, plus H (Hand) and V (Select) shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpaceHeld(true);
      } else if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey) {
        setToolMode('pan');
      } else if (e.key.toLowerCase() === 'v' && !e.ctrlKey && !e.metaKey) {
        setToolMode('select');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceHeld(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setToolMode]);

  const effectivePanMode = toolMode === 'pan' || isSpaceHeld;

  const handleCursorMove = (x: number, y: number) => {
    setCursorPos({ x, y });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      setZoom(Number((zoom + delta).toFixed(2)));
    }
  };

  const handleWorkspaceMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const target = e.target as HTMLElement;
    const clickedInsidePage = Boolean(target.closest('.print-page'));
    const clickedButton = Boolean(target.closest('button'));

    if (clickedButton) return;

    // Pan when: Hand tool active, Spacebar held, Middle-click (button === 1), or dragging on pasteboard outside pages
    const shouldPan = effectivePanMode || e.button === 1 || !clickedInsidePage;
    if (!shouldPan) return;

    e.preventDefault();
    setIsPanning(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startScrollLeft = containerRef.current.scrollLeft;
    const startScrollTop = containerRef.current.scrollTop;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      containerRef.current.scrollLeft = startScrollLeft - dx;
      containerRef.current.scrollTop = startScrollTop - dy;
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Group pages into pairs for 2-Page Spread view
  const spreadGroups: { page: typeof activePage; index: number }[][] = [];
  for (let i = 0; i < project.pages.length; i += 2) {
    const pair = [{ page: project.pages[i], index: i }];
    if (i + 1 < project.pages.length) {
      pair.push({ page: project.pages[i + 1], index: i + 1 });
    }
    spreadGroups.push(pair);
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden pasteboard-bg relative select-none">
      {/* Top Header Strip: Corner + Top Ruler */}
      {rulerVisible && (
        <div className="flex h-5 w-full bg-white/90 border-b border-slate-200 z-20 flex-shrink-0 shadow-2xs">
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
          <div className="w-5 bg-white/90 border-r border-slate-200 z-10 flex-shrink-0 overflow-hidden relative shadow-2xs">
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
          onWheel={handleWheel}
          onMouseDown={handleWorkspaceMouseDown}
          className={`flex-1 h-full overflow-auto px-32 py-16 flex flex-col items-center relative ${
            isPanning
              ? 'cursor-grabbing'
              : effectivePanMode
              ? 'cursor-grab'
              : ''
          }`}
        >
          {/* Master Page Mode or Single Page View */}
          {(isEditingMaster || viewMode === 'single') && (
            <div className="flex flex-col items-center pb-36">
              <PageCanvas onCursorMove={handleCursorMove} />
            </div>
          )}

          {/* Continuous Multi-Page View (All Pages Stacked Vertically) */}
          {!isEditingMaster && viewMode === 'continuous' && (
            <div className="flex flex-col items-center gap-10 pb-36">
              {project.pages.map((pg, idx) => {
                const isActive = idx === project.activePageIndex;
                return (
                  <div key={pg.id} className="flex flex-col items-start gap-1.5">
                    <div
                      onClick={() => setActivePageIndex(idx)}
                      className={`flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer transition ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white/80 text-slate-600 border border-slate-200 hover:bg-white'
                      }`}
                    >
                      <span>Page {idx + 1}</span>
                      {pg.name && <span className="opacity-75">• {pg.name}</span>}
                    </div>
                    <PageCanvas
                      page={pg}
                      pageIndex={idx}
                      onCursorMove={handleCursorMove}
                    />
                  </div>
                );
              })}

              {/* Quick Add Page Button at Bottom of Canvas */}
              <button
                onClick={addPage}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 hover:bg-white hover:border-emerald-500 text-slate-600 hover:text-emerald-700 font-semibold text-xs transition-all shadow-2xs active:scale-95"
              >
                <Plus size={15} />
                <span>Add New Page</span>
              </button>
            </div>
          )}

          {/* Two-Page Spread View (Side-by-Side) */}
          {!isEditingMaster && viewMode === 'spread' && (
            <div className="flex flex-col items-center gap-12 pb-36">
              {spreadGroups.map((group, gIdx) => (
                <div key={gIdx} className="flex flex-col items-center gap-2">
                  <div className="text-[11px] font-semibold text-slate-500 bg-white/80 px-3 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                    Spread {gIdx + 1} (Pages {group.map((item) => item.index + 1).join(' – ')})
                  </div>
                  <div className="flex items-start gap-4">
                    {group.map(({ page: pg, index: idx }) => (
                      <div key={pg.id} className="flex flex-col items-start gap-1">
                        <span
                          onClick={() => setActivePageIndex(idx)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                            idx === project.activePageIndex
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white/80 text-slate-500 border border-slate-200'
                          }`}
                        >
                          Page {idx + 1}
                        </span>
                        <PageCanvas
                          page={pg}
                          pageIndex={idx}
                          onCursorMove={handleCursorMove}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={addPage}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 hover:bg-white hover:border-emerald-500 text-slate-600 hover:text-emerald-700 font-semibold text-xs transition-all shadow-2xs active:scale-95"
              >
                <Plus size={15} />
                <span>Add New Page</span>
              </button>
            </div>
          )}

          {/* Modern Floating Viewport, Tool Mode, Page View & Zoom Pill */}
          <div
            className={`fixed bottom-10 z-30 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-slate-200/90 shadow-lg text-xs text-slate-700 transition-all ${
              isRightPanelOpen ? 'right-76' : 'right-14'
            }`}
          >
            {/* Select vs Hand/Pan Tool Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-full mr-0.5">
              <button
                onClick={() => setToolMode('select')}
                className={`p-1 rounded-full transition ${
                  !effectivePanMode
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Select Tool (V)"
              >
                <MousePointer2 size={12} />
              </button>
              <button
                onClick={() => setToolMode('pan')}
                className={`p-1 rounded-full transition ${
                  effectivePanMode
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Hand / Pan Canvas Tool (H or hold Space)"
              >
                <Hand size={12} />
              </button>
            </div>

            {/* Multi-page view mode switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-full mr-1">
              <button
                onClick={() => setViewMode('single')}
                className={`p-1 rounded-full transition ${
                  viewMode === 'single'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Single Page View"
              >
                <File size={12} />
              </button>
              <button
                onClick={() => setViewMode('continuous')}
                className={`p-1 rounded-full transition ${
                  viewMode === 'continuous'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="All Pages View"
              >
                <Files size={12} />
              </button>
              <button
                onClick={() => setViewMode('spread')}
                className={`p-1 rounded-full transition ${
                  viewMode === 'spread'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="2-Page Spread View"
              >
                <BookOpen size={12} />
              </button>
            </div>

            <div className="w-[1px] h-3.5 bg-slate-200 mr-0.5" />

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

            <div className="w-[1px] h-3.5 bg-slate-200 mx-0.5" />

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
