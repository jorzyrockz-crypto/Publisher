import React, { useState, useRef, useEffect } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { SelectionToolbar } from './SelectionToolbar';
import { DesignerContextBar } from '../workspace/DesignerContextBar';
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
  LayoutDashboard,
  GripVertical,
  Trash2,
  Sparkles,
} from 'lucide-react';

export const CanvasArea: React.FC = () => {
  const {
    project,
    workspaceMode,
    activePage,
    isEditingMaster,
    setIsEditingMaster,
    masterPages,
    activeMasterId,
    viewMode,
    setViewMode,
    toolMode,
    setToolMode,
    isRightPanelOpen,
    addPage,
    deletePageById,
    setIsBrandBoardModalOpen,
    setActivePageIndex,
    updatePagePosition,
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
  const [spreadMode, setSpreadMode] = useState<'reading' | 'pairs'>('reading');
  const containerRef = useRef<HTMLDivElement>(null);
  const didInitialFitRef = useRef(false);
  /** Key of the view/page that was last auto-fitted, so a hand-set zoom is never stomped. */
  const fittedKeyRef = useRef('');

  // Auto-fit the artboard on first mount so Page 1 is fully framed between the
  // rulers and the floating zoom toolbar (critical on 1280x800 laptops where a
  // fixed 80% zoom used to clip the page top/bottom).
  useEffect(() => {
    if (didInitialFitRef.current) return;
    let cancelled = false;
    let frames = 0;

    const tryInitialFit = () => {
      if (cancelled || didInitialFitRef.current) return;
      const el = containerRef.current;
      if (el && el.clientWidth > 160 && el.clientHeight > 160) {
        didInitialFitRef.current = true;
        zoomFit();
        return;
      }
      if (frames++ < 60) {
        requestAnimationFrame(tryInitialFit);
      }
    };

    const raf = requestAnimationFrame(tryInitialFit);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // Only ever run once for the initial load; user zoom is never overridden.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fit whenever the view opens or the document/page changes in single view. Keyed on ids
  // rather than on `zoomFit` itself: that callback is re-created whenever the page object
  // changes, and re-firing for that reason would undo a zoom the user just set by hand.
  const zoomFitRef = useRef(zoomFit);
  useEffect(() => {
    zoomFitRef.current = zoomFit;
  }, [zoomFit]);
  useEffect(() => {
    if (viewMode !== 'single' || isEditingMaster) return;
    const key = `${viewMode}:${project.id}:${activePage.id}`;
    if (fittedKeyRef.current === key) return;
    fittedKeyRef.current = key;
    const raf = requestAnimationFrame(() => zoomFitRef.current());
    return () => cancelAnimationFrame(raf);
  }, [viewMode, project.id, activePage.id, isEditingMaster]);

  // Smoothly scroll canvas to active page whenever activePageIndex changes (e.g. clicking in Pages sidebar)
  useEffect(() => {
    if (isEditingMaster || viewMode === 'single') return;
    const container = containerRef.current;
    if (!container) return;
    const target = container.querySelector(
      `[data-canvas-page-id="${activePage.id}"]`
    ) as HTMLElement | null;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [project.activePageIndex, activePage.id, viewMode, isEditingMaster]);

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
    const clickedArtboardHandle = Boolean(target.closest('.artboard-drag-handle'));
    const clickedButton = Boolean(target.closest('button'));

    if (clickedButton || clickedArtboardHandle) return;

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

  // Helper to compute artboard default coordinates for pages without explicit x/y
  const getArtboardCoords = (idx: number) => {
    const pg = project.pages[idx];
    if (pg.x !== undefined && pg.y !== undefined) {
      return { x: pg.x, y: pg.y };
    }
    let autoX = 80;
    for (let i = 0; i < idx; i++) {
      const prev = project.pages[i];
      const prevX = prev.x ?? autoX;
      autoX = prevX + prev.width + 80;
    }
    return { x: autoX, y: 80 };
  };

  // Dragging a paper / artboard anywhere (left, right, top, bottom)
  const handleArtboardDragStart = (pageIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActivePageIndex(pageIndex);

    const initial = getArtboardCoords(pageIndex);
    const startClientX = e.clientX;
    const startClientY = e.clientY;

    const onMove = (me: MouseEvent) => {
      const dx = (me.clientX - startClientX) / zoom;
      const dy = (me.clientY - startClientY) / zoom;
      updatePagePosition(
        pageIndex,
        Math.max(20, initial.x + dx),
        Math.max(36, initial.y + dy)
      );
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Compute artboard canvas bounds
  let artboardMaxRight = 2400;
  let artboardMaxBottom = 1600;
  project.pages.forEach((pg, idx) => {
    const coords = getArtboardCoords(idx);
    artboardMaxRight = Math.max(artboardMaxRight, coords.x + pg.width + 600);
    artboardMaxBottom = Math.max(artboardMaxBottom, coords.y + pg.height + 500);
  });

  // Group pages into facing spreads ('reading': Cover, [2|3], [4|5], Back; or 'pairs': [1|2], [3|4])
  const spreadGroups: { label: string; pages: { page: typeof activePage; index: number; role: string }[] }[] = [];
  if (spreadMode === 'reading' && project.pages.length > 0) {
    spreadGroups.push({
      label: 'Front Cover',
      pages: [{ page: project.pages[0], index: 0, role: 'Cover' }],
    });
    for (let i = 1; i < project.pages.length; i += 2) {
      if (i === project.pages.length - 1) {
        spreadGroups.push({
          label: 'Back Cover',
          pages: [{ page: project.pages[i], index: i, role: 'Back Cover' }],
        });
      } else {
        spreadGroups.push({
          label: `Spread · Pages ${i + 1} – ${i + 2}`,
          pages: [
            { page: project.pages[i], index: i, role: `Page ${i + 1} (Left)` },
            { page: project.pages[i + 1], index: i + 1, role: `Page ${i + 2} (Right)` },
          ],
        });
      }
    }
  } else {
    for (let i = 0; i < project.pages.length; i += 2) {
      const pair = [{ page: project.pages[i], index: i, role: `Page ${i + 1}` }];
      if (i + 1 < project.pages.length) {
        pair.push({ page: project.pages[i + 1], index: i + 1, role: `Page ${i + 2}` });
      }
      spreadGroups.push({
        label: `Spread ${spreadGroups.length + 1} (Pages ${pair.map((p) => p.index + 1).join(' – ')})`,
        pages: pair,
      });
    }
  }

  const activeMasterName =
    masterPages.find((m) => m.id === activeMasterId)?.name || 'Master A';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden pasteboard-bg relative select-none">
      {/* Top Header Strip: Corner + Top Ruler */}
      {rulerVisible && (
        <div className="flex h-5 w-full bg-white/90 border-b border-slate-200 z-20 flex-shrink-0 shadow-2xs">
          <div className="w-5 h-5 border-r border-slate-200 flex items-center justify-center bg-slate-50 text-[8px] font-mono font-medium text-slate-400 flex-shrink-0">
            in
          </div>
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
          data-canvas-viewport="true"
          onWheel={handleWheel}
          onMouseDown={handleWorkspaceMouseDown}
          className={`flex-1 h-full overflow-auto relative ${
            viewMode !== 'artboard' || isEditingMaster
              ? 'px-32 py-16 flex flex-col items-center'
              : ''
          } ${
            isPanning
              ? 'cursor-grabbing'
              : effectivePanMode
              ? 'cursor-grab'
              : ''
          }`}
        >
          {/* Master Page Mode or Single Page View */}
          {(isEditingMaster || viewMode === 'single') && (
            <div className="flex flex-col items-center pb-36 gap-3">
              {isEditingMaster && (
                <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-amber-500 text-white shadow-md text-xs font-bold">
                  <Sparkles size={13} />
                  <span>Editing Master: {activeMasterName}</span>
                  <button
                    onClick={() => setIsEditingMaster(false)}
                    className="ml-1 px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold transition"
                  >
                    Exit Master
                  </button>
                </div>
              )}
              <PageCanvas onCursorMove={handleCursorMove} />
            </div>
          )}

          {/* Freeform Adobe-style Artboard Canvas (Move papers left/right/top/bottom + Mixed paper sizes!) */}
          {!isEditingMaster && viewMode === 'artboard' && (
            <div
              className="relative flex-shrink-0"
              style={{
                width: `${artboardMaxRight * zoom + 80}px`,
                height: `${artboardMaxBottom * zoom + 96}px`,
              }}
            >
              {project.pages.map((pg, idx) => {
                const isActive = idx === project.activePageIndex;
                const coords = getArtboardCoords(idx);

                return (
                  <div
                    key={pg.id}
                    data-canvas-page-id={pg.id}
                    style={{
                      position: 'absolute',
                      left: `${coords.x * zoom}px`,
                      top: `${coords.y * zoom}px`,
                    }}
                    className="flex flex-col items-start"
                  >
                    {/* Draggable Artboard Handle Pill (Grab to move paper anywhere!) */}
                    <div
                      onMouseDown={(e) => handleArtboardDragStart(idx, e)}
                      className={`artboard-drag-handle mb-1.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold cursor-grab active:cursor-grabbing transition shadow-xs ${
                        isActive
                          ? 'bg-[#6e56cf] text-white'
                          : 'bg-white/90 text-slate-600 border border-slate-200 hover:bg-white hover:border-[#d3c9f9]'
                      }`}
                      title="Drag to move this paper anywhere on the canvas"
                    >
                      <GripVertical size={11} className="opacity-75" />
                      <span>Page {idx + 1}</span>
                      {pg.name && <span className="opacity-80">• {pg.name}</span>}
                      <span
                        className={`ml-1 text-[9.5px] font-mono px-1.5 py-0.2 rounded-full ${
                          isActive ? 'bg-[#5c4bb8]/80 text-[#efeafd]' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {(pg.width / 96).toFixed(1)}"×{(pg.height / 96).toFixed(1)}"
                      </span>
                      {project.pages.length > 1 && (
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePageById(pg.id);
                          }}
                          title="Delete This Artboard"
                          className={`ml-1 p-0.5 rounded-full transition ${
                            isActive
                              ? 'hover:bg-rose-500 text-[#efeafd] hover:text-white'
                              : 'hover:bg-rose-100 text-slate-400 hover:text-rose-600'
                          }`}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>

                    <PageCanvas
                      page={pg}
                      pageIndex={idx}
                      onCursorMove={handleCursorMove}
                    />
                  </div>
                );
              })}

              {/* Quick + Add Artboard & + Brand Board buttons positioned near last page */}
              {(() => {
                const lastIdx = project.pages.length - 1;
                const lastPg = project.pages[lastIdx];
                const lastCoords = getArtboardCoords(lastIdx);
                return (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${(lastCoords.x + lastPg.width + 60) * zoom}px`,
                      top: `${(lastCoords.y + 36) * zoom}px`,
                    }}
                    className="flex flex-col gap-2"
                  >
                    <button
                      onClick={addPage}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border-2 border-dashed border-slate-300 bg-white/80 hover:bg-white hover:border-[#d3c9f9] text-slate-600 hover:text-[#5c4bb8] font-semibold text-xs transition-all shadow-xs active:scale-95"
                    >
                      <Plus size={15} />
                      <span>Add Artboard</span>
                    </button>
                    <button
                      onClick={() => setIsBrandBoardModalOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-[#d3c9f9] bg-[#efeafd] hover:bg-[#efeafd] text-[#5c4bb8] font-semibold text-xs transition-all shadow-xs active:scale-95"
                      title="Convert design to multiple sizes on Brand Board"
                    >
                      <Sparkles size={14} className="text-[#5c4bb8]" />
                      <span>Brand Multi-Size</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Continuous Multi-Page View (All Pages Stacked Vertically) */}
          {!isEditingMaster && viewMode === 'continuous' && (
            <div className="flex flex-col items-center gap-10 pb-36">
              {project.pages.map((pg, idx) => {
                const isActive = idx === project.activePageIndex;
                return (
                  <div key={pg.id} data-canvas-page-id={pg.id} className="flex flex-col items-start gap-1.5">
                    <div
                      onClick={() => setActivePageIndex(idx)}
                      className={`flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer transition ${
                        isActive
                          ? 'bg-[#6e56cf] text-white shadow-xs'
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

              <button
                onClick={addPage}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 hover:bg-white hover:border-[#d3c9f9] text-slate-600 hover:text-[#5c4bb8] font-semibold text-xs transition-all shadow-2xs active:scale-95"
              >
                <Plus size={15} />
                <span>Add New Page</span>
              </button>
            </div>
          )}

          {/* Two-Page Spread View (Side-by-Side) */}
          {!isEditingMaster && viewMode === 'spread' && (
            <div className="flex flex-col items-center gap-12 pb-36">
              <div className="flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-full border border-slate-200 shadow-xs text-[10.5px] font-bold">
                <button
                  onClick={() => setSpreadMode('reading')}
                  className={`px-3 py-1 rounded-full transition ${
                    spreadMode === 'reading'
                      ? 'bg-[#6e56cf] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Booklet Facing Spreads
                </button>
                <button
                  onClick={() => setSpreadMode('pairs')}
                  className={`px-3 py-1 rounded-full transition ${
                    spreadMode === 'pairs'
                      ? 'bg-[#6e56cf] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sequential Pairs
                </button>
              </div>

              {spreadGroups.map((group, gIdx) => (
                <div key={gIdx} className="flex flex-col items-center gap-2">
                  <div className="text-[11px] font-semibold text-slate-500 bg-white/80 px-3 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                    {group.label}
                  </div>
                  <div className="flex items-stretch gap-0">
                    {group.pages.map(({ page: pg, index: idx, role }, itemIdx) => (
                      <React.Fragment key={pg.id}>
                        {itemIdx === 1 && (
                          <div
                            className="w-0 border-l-2 border-dashed border-[#d3c9f9] mx-1 self-stretch relative"
                            title="Booklet Center Spine / Fold"
                          />
                        )}
                        <div key={pg.id} data-canvas-page-id={pg.id} className="flex flex-col items-start gap-1">
                          <span
                            onClick={() => setActivePageIndex(idx)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                              idx === project.activePageIndex
                                ? 'bg-[#6e56cf] text-white'
                                : 'bg-white/80 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {role}
                          </span>
                          <PageCanvas
                            page={pg}
                            pageIndex={idx}
                            onCursorMove={handleCursorMove}
                          />
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={addPage}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 hover:bg-white hover:border-[#d3c9f9] text-slate-600 hover:text-[#5c4bb8] font-semibold text-xs transition-all shadow-2xs active:scale-95"
              >
                <Plus size={15} />
                <span>Add New Page</span>
              </button>
            </div>
          )}

        </div>

        {/* Floating viewport / zoom pill. A sibling of the scrolling viewport,
            not a child: `position: absolute` inside a scroll container anchors to
            the content, so the old placement scrolled away with the page. */}
        <div
          className="absolute bottom-3 right-3 z-20 max-w-[calc(100%-24px)] overflow-x-auto no-scrollbar flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full border border-[#e5e9ee] shadow-[0_8px_28px_rgba(28,44,58,0.12)] text-xs text-[#202833] transition-all"
        >
          {/* Select vs Hand/Pan Tool Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-full mr-0.5">
            <button
              onClick={() => setToolMode('select')}
              className={`p-1 rounded-full transition ${
                !effectivePanMode
                  ? 'bg-white text-[#5c4bb8] shadow-2xs'
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
                  ? 'bg-[#6e56cf] text-white shadow-2xs'
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
              onClick={() => setViewMode('artboard')}
              className={`p-1 rounded-full transition ${
                viewMode === 'artboard'
                  ? 'bg-white text-[#5c4bb8] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Freeform Artboards (Move papers & mix sizes)"
            >
              <LayoutDashboard size={12} />
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`p-1 rounded-full transition ${
                viewMode === 'single'
                  ? 'bg-white text-[#5c4bb8] shadow-2xs'
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
                  ? 'bg-white text-[#5c4bb8] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="All Pages Vertical Scroll"
            >
              <Files size={12} />
            </button>
            <button
              onClick={() => setViewMode('spread')}
              className={`p-1 rounded-full transition ${
                viewMode === 'spread'
                  ? 'bg-white text-[#5c4bb8] shadow-2xs'
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
            className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-[#efeafd] hover:text-[#5c4bb8] text-[11px] font-medium transition"
            title="Fit to Window"
          >
            <Maximize size={11} className="text-[#5c4bb8]" />
            <span>Fit</span>
          </button>
        </div>
      </div>

      {/* Designer Mode: Floating Centered Contextual Pill Toolbar */}
      {workspaceMode === 'designer' && (
        <div
          className={`pointer-events-none absolute ${
            rulerVisible ? 'top-9' : 'top-3'
          } left-0 right-0 flex justify-center px-4 z-30`}
        >
          <DesignerContextBar />
        </div>
      )}

      {/* Contextual object toolbar (align / z-order / duplicate / lock / delete) in Publisher mode */}
      {workspaceMode !== 'designer' && <SelectionToolbar />}
    </div>
  );
};
