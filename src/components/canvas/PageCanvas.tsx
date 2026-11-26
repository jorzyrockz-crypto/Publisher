import React, { useState, useRef, useEffect } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { ElementRenderer } from './ElementRenderer';
import { SelectionBox } from './SelectionBox';
import { calculateSnap } from '../../utils/snapping';
import { buildPatternBackgroundStyle } from '../../utils/patternGenerator';
import { PublisherElement, Page, ConnectorElement } from '../../types/publisher';
import {
  Copy,
  Clipboard,
  Trash2,
  Lock,
  Unlock,
  BringToFront,
  SendToBack,
  Type,
  QrCode,
  Layers,
} from 'lucide-react';

interface PageCanvasProps {
  page?: Page;
  pageIndex?: number;
  cursorX?: number;
  cursorY?: number;
  onCursorMove?: (x: number, y: number) => void;
}

export const PageCanvas: React.FC<PageCanvasProps> = ({
  page,
  pageIndex,
  onCursorMove,
}) => {
  const {
    project,
    activePage,
    setActivePageIndex,
    selectedElementIds,
    isEditingMaster,
    setIsEditingMaster,
    toolMode,
    hasClipboard,
    zoom,
    guidesVisible,
    gridVisible,
    snapToGuides,
    selectElement,
    selectElements,
    clearSelection,
    updateElement,
    updateElementsBatch,
    deleteSelectedElements,
    duplicateSelectedElements,
    copySelectedElements,
    pasteElements,
    toggleElementLock,
    bringToFront,
    sendToBack,
    addTextBox,
    addQRCode,
    selectAll,
    undo,
    redo,
    removeGuide,
  } = usePublisher();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    elementId?: string;
  } | null>(null);

  const [activeAlignGuideH, setActiveAlignGuideH] = useState<number | undefined>();
  const [activeAlignGuideV, setActiveAlignGuideV] = useState<number | undefined>();
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const targetPage = page || activePage;
  const targetPageIndex = pageIndex !== undefined ? pageIndex : project.activePageIndex;
  const isActivePage = targetPageIndex === project.activePageIndex;

  const canvasRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcuts (Arrows to nudge, Delete to remove, Ctrl+D duplicate, etc.)
  useEffect(() => {
    if (!isActivePage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an active contentEditable or input
      const target = e.target as HTMLElement;
      if (
        target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          deleteSelectedElements();
        }
      } else if (e.key === 'Escape') {
        clearSelection();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAll();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          copySelectedElements();
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteElements();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelectedElements();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          selectedElementIds.forEach((id) => {
            const el = targetPage.elements.find((item) => item.id === id);
            if (!el) return;
            let nx = el.x;
            let ny = el.y;
            if (e.key === 'ArrowUp') ny -= step;
            if (e.key === 'ArrowDown') ny += step;
            if (e.key === 'ArrowLeft') nx -= step;
            if (e.key === 'ArrowRight') nx += step;
            updateElement(id, { x: nx, y: ny });
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isActivePage,
    selectedElementIds,
    targetPage,
    deleteSelectedElements,
    clearSelection,
    selectAll,
    duplicateSelectedElements,
    undo,
    redo,
    copySelectedElements,
    pasteElements,
    updateElement,
  ]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / zoom);
    const y = Math.round((e.clientY - rect.top) / zoom);
    if (onCursorMove) onCursorMove(x, y);

    if (marquee) {
      setMarquee((prev) => (prev ? { ...prev, currentX: x, currentY: y } : null));
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only start marquee on left-click on background canvas
    if (e.button !== 0) return;
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      setEditingTextId(null);
      const isAdditive = e.shiftKey || e.ctrlKey || e.metaKey;
      if (!isAdditive) {
        clearSelection();
      }

      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const startX = Math.round((e.clientX - rect.left) / zoom);
      const startY = Math.round((e.clientY - rect.top) / zoom);
      setMarquee({ startX, startY, currentX: startX, currentY: startY });

      const handleWindowMouseMove = (moveEvent: MouseEvent) => {
        if (!canvasRef.current) return;
        const moveRect = canvasRef.current.getBoundingClientRect();
        const currentX = Math.round((moveEvent.clientX - moveRect.left) / zoom);
        const currentY = Math.round((moveEvent.clientY - moveRect.top) / zoom);
        setMarquee((prev) => (prev ? { ...prev, currentX, currentY } : null));
      };

      const handleWindowMouseUp = () => {
        setMarquee((current) => {
          if (current) {
            const minX = Math.min(current.startX, current.currentX);
            const maxX = Math.max(current.startX, current.currentX);
            const minY = Math.min(current.startY, current.currentY);
            const maxY = Math.max(current.startY, current.currentY);

            // Select all visible, unlocked elements intersecting marquee
            if (maxX - minX > 4 || maxY - minY > 4) {
              const pool = isEditingMaster
                ? project.masterPage?.elements || []
                : targetPage.elements;
              const intersectingIds = pool
                .filter(
                  (el) =>
                    el.visible !== false &&
                    !el.locked &&
                    el.x < maxX &&
                    el.x + el.width > minX &&
                    el.y < maxY &&
                    el.y + el.height > minY
                )
                .map((el) => el.id);
              selectElements(intersectingIds, isAdditive);
            }
          }
          return null;
        });
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
      };

      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }
  };

  const handleElementMouseDown = (element: PublisherElement, e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenu(null);

    if (!isActivePage && !isEditingMaster) {
      setActivePageIndex(targetPageIndex);
    }

    const isMulti = e.shiftKey || e.ctrlKey;
    if (!selectedElementIds.includes(element.id)) {
      selectElement(element.id, isMulti);
    }

    if (element.locked) return;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const pool = isEditingMaster ? project.masterPage?.elements || [] : targetPage.elements;
    const initialElementsPos = pool
      .filter(
        (el) =>
          selectedElementIds.includes(el.id) ||
          el.id === element.id ||
          (element.groupId && el.groupId === element.groupId)
      )
      .map((el) => ({ id: el.id, startX: el.x, startY: el.y, width: el.width, height: el.height }));

    let rafId: number | null = null;
    let latestMoveEvent: MouseEvent | null = null;

    const applyDragMove = () => {
      rafId = null;
      const moveEvent = latestMoveEvent;
      if (!moveEvent) return;

      const deltaX = (moveEvent.clientX - startClientX) / zoom;
      const deltaY = (moveEvent.clientY - startClientY) / zoom;

      // Primary element snap calculation
      const primary = initialElementsPos.find((p) => p.id === element.id);
      if (!primary) return;

      const rawNextX = primary.startX + deltaX;
      const rawNextY = primary.startY + deltaY;

      const snap = calculateSnap(
        element.id,
        rawNextX,
        rawNextY,
        primary.width,
        primary.height,
        targetPage,
        snapToGuides,
        true
      );

      setActiveAlignGuideH(snap.horizontalGuide);
      setActiveAlignGuideV(snap.verticalGuide);

      const effectiveDeltaX = snap.x - primary.startX;
      const effectiveDeltaY = snap.y - primary.startY;

      const updatesById: Record<string, { x: number; y: number }> = {};
      initialElementsPos.forEach((item) => {
        updatesById[item.id] = {
          x: Math.round(item.startX + effectiveDeltaX),
          y: Math.round(item.startY + effectiveDeltaY),
        };
      });
      updateElementsBatch(updatesById);
    };

    const handleWindowMouseMove = (moveEvent: MouseEvent) => {
      latestMoveEvent = moveEvent;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(applyDragMove);
      }
    };

    const handleWindowMouseUp = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      setActiveAlignGuideH(undefined);
      setActiveAlignGuideV(undefined);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  const displayedElements = isEditingMaster
    ? project.masterPage?.elements || []
    : targetPage.elements;

  const masterElements =
    !isEditingMaster && project.masterPage?.showOnAllPages
      ? project.masterPage.elements
      : [];

  return (
    <div
      style={{
        width: `${targetPage.width * zoom}px`,
        height: `${targetPage.height * zoom}px`,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        id={`print-page-${targetPage.id}`}
        ref={canvasRef}
        className={`relative select-none print-page transition-shadow duration-150 ${
          toolMode === 'pan' ? 'pointer-events-none' : ''
        } ${
          isEditingMaster
            ? 'ring-4 ring-amber-400/70'
            : isActivePage
            ? 'ring-2 ring-indigo-500/70'
            : 'hover:ring-2 hover:ring-slate-300'
        }`}
        style={{
          width: `${targetPage.width}px`,
          height: `${targetPage.height}px`,
          backgroundColor: targetPage.backgroundColor,
          ...buildPatternBackgroundStyle(targetPage.backgroundPattern),
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
        onMouseMove={handleCanvasMouseMove}
        onMouseDown={(e) => {
          setContextMenu(null);
          if (!isActivePage && !isEditingMaster) {
            setActivePageIndex(targetPageIndex);
          }
          handleCanvasMouseDown(e);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          if (!isActivePage && !isEditingMaster) {
            setActivePageIndex(targetPageIndex);
          }
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        {/* Master Page Mode Banner */}
        {isEditingMaster && (
          <div className="no-print absolute -top-7 left-0 bg-amber-500 text-white text-[11px] font-bold px-3 py-0.5 rounded-t-lg shadow flex items-center gap-2 z-50">
            <Layers size={12} />
            <span>EDITING MASTER PAGE (Applies to all pages)</span>
            <button
              onClick={() => setIsEditingMaster(false)}
              className="ml-2 underline text-amber-100 hover:text-white"
            >
              Exit Master
            </button>
          </div>
        )}
      {/* Optional Grid Overlay */}
      {gridVisible && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, #0078d4 1px, transparent 1px), linear-gradient(to bottom, #0078d4 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      )}

      {/* Margins Boundary Line (MS Publisher Classic Cyan/Blue Guides) */}
      <div
        className="absolute pointer-events-none no-print border border-dashed border-[#0078d4]/40"
        style={{
          top: `${targetPage.margins.top}px`,
          left: `${targetPage.margins.left}px`,
          right: `${targetPage.margins.right}px`,
          bottom: `${targetPage.margins.bottom}px`,
        }}
      />

      {/* User Guides */}
      {guidesVisible &&
        targetPage.guides?.map((guide) => (
          <div
            key={guide.id}
            className={`absolute no-print z-40 group ${
              guide.orientation === 'horizontal'
                ? 'w-full h-[1px] border-b border-cyan-500 cursor-row-resize'
                : 'h-full w-[1px] border-r border-cyan-500 cursor-col-resize'
            }`}
            style={{
              top: guide.orientation === 'horizontal' ? `${guide.position}px` : 0,
              left: guide.orientation === 'vertical' ? `${guide.position}px` : 0,
            }}
            title="Double-click to remove guide"
            onDoubleClick={() => removeGuide(guide.id)}
          >
            <div className="hidden group-hover:block absolute bg-cyan-600 text-white text-[9px] px-1 py-0.5 rounded shadow pointer-events-none">
              {guide.position}px
            </div>
          </div>
        ))}

      {/* Smart Alignment Guides (Horizontal & Vertical Pink/Cyan lines during dragging) */}
      {activeAlignGuideH !== undefined && (
        <div
          className="absolute left-0 right-0 h-[1.5px] bg-pink-500 z-50 pointer-events-none shadow-[0_0_4px_#ec4899]"
          style={{ top: `${activeAlignGuideH}px` }}
        />
      )}
      {activeAlignGuideV !== undefined && (
        <div
          className="absolute top-0 bottom-0 w-[1.5px] bg-pink-500 z-50 pointer-events-none shadow-[0_0_4px_#ec4899]"
          style={{ left: `${activeAlignGuideV}px` }}
        />
      )}

      {/* Marquee Drag Selection Box */}
      {marquee && (
        <div
          className="selection-marquee absolute z-50 pointer-events-none border-[1.5px] border-indigo-500 bg-indigo-500/12 rounded-[2px]"
          style={{
            left: `${Math.min(marquee.startX, marquee.currentX)}px`,
            top: `${Math.min(marquee.startY, marquee.currentY)}px`,
            width: `${Math.abs(marquee.currentX - marquee.startX)}px`,
            height: `${Math.abs(marquee.currentY - marquee.startY)}px`,
          }}
        />
      )}

      {/* Render Master Page Elements behind regular page elements */}
      {masterElements
        .filter((el) => el.visible !== false)
        .map((element) => (
          <div
            key={`master-${element.id}`}
            className="absolute pointer-events-none"
            style={{
              left: `${element.x}px`,
              top: `${element.y}px`,
              width: `${element.width}px`,
              height: `${element.height}px`,
              transform: `rotate(${element.rotation}deg)`,
              transformOrigin: 'center center',
              zIndex: element.zIndex,
              opacity: element.opacity !== undefined ? element.opacity : 1,
            }}
          >
            <ElementRenderer
              element={element}
              isSelected={false}
              pageNumber={targetPageIndex + 1}
              totalPages={project.pages.length}
            />
          </div>
        ))}

      {/* Live Auto-Connect Diagram Connectors Overlay */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={targetPage.width}
        height={targetPage.height}
        style={{ zIndex: 45, overflow: 'visible' }}
      >
        <defs>
          {displayedElements
            .filter((el): el is ConnectorElement => el.type === 'connector' && el.visible !== false)
            .map((conn) => (
              <marker
                key={`mk-${conn.id}`}
                id={`arrow-${conn.id}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill={conn.strokeColor} />
              </marker>
            ))}
        </defs>
        {displayedElements
          .filter((el): el is ConnectorElement => el.type === 'connector' && el.visible !== false)
          .map((conn) => {
            const fromEl = displayedElements.find((e) => e.id === conn.fromId);
            const toEl = displayedElements.find((e) => e.id === conn.toId);
            if (!fromEl || !toEl) return null;

            const fromCx = fromEl.x + fromEl.width / 2;
            const fromCy = fromEl.y + fromEl.height / 2;
            const toCx = toEl.x + toEl.width / 2;
            const toCy = toEl.y + toEl.height / 2;
            const dx = toCx - fromCx;
            const dy = toCy - fromCy;

            // Compute actual edge-to-edge gaps so overlapping axes never force awkward side ports
            const horizGap =
              dx >= 0
                ? toEl.x - (fromEl.x + fromEl.width)
                : fromEl.x - (toEl.x + toEl.width);
            const vertGap =
              dy >= 0
                ? toEl.y - (fromEl.y + fromEl.height)
                : fromEl.y - (toEl.y + toEl.height);

            const useHorizontal =
              horizGap > 12 && vertGap <= 12
                ? true
                : vertGap > 12 && horizGap <= 12
                ? false
                : Math.abs(dx) >= Math.abs(dy);

            let x1 = fromCx;
            let y1 = fromCy;
            let x2 = toCx;
            let y2 = toCy;
            let outDirX = 0;
            let outDirY = 0;
            let inDirX = 0;
            let inDirY = 0;

            if (useHorizontal) {
              if (dx >= 0) {
                x1 = fromEl.x + fromEl.width;
                x2 = toEl.x;
                outDirX = 1;
                inDirX = -1;
              } else {
                x1 = fromEl.x;
                x2 = toEl.x + toEl.width;
                outDirX = -1;
                inDirX = 1;
              }
            } else {
              if (dy >= 0) {
                y1 = fromEl.y + fromEl.height;
                y2 = toEl.y;
                outDirY = 1;
                inDirY = -1;
              } else {
                y1 = fromEl.y;
                y2 = toEl.y + toEl.height;
                outDirY = -1;
                inDirY = 1;
              }
            }

            let d = `M ${x1} ${y1} L ${x2} ${y2}`;
            if (conn.connectorStyle === 'elbow') {
              if (useHorizontal) {
                const midX = (x1 + x2) / 2;
                d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
              } else {
                const midY = (y1 + y2) / 2;
                d = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
              }
            } else if (conn.connectorStyle === 'curved') {
              const handle = useHorizontal
                ? Math.max(36, Math.abs(x2 - x1) * 0.5)
                : Math.max(36, Math.abs(y2 - y1) * 0.5);
              const c1x = x1 + outDirX * handle;
              const c1y = y1 + outDirY * handle;
              const c2x = x2 + inDirX * handle;
              const c2y = y2 + inDirY * handle;
              d = `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
            }

            const isConnSelected = selectedElementIds.includes(conn.id);
            const dash =
              conn.strokeDash === 'dashed'
                ? '7 4'
                : conn.strokeDash === 'dotted'
                ? '2 4'
                : undefined;

            return (
              <g
                key={conn.id}
                className="pointer-events-auto cursor-pointer"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  selectElement(conn.id, e.shiftKey || e.ctrlKey);
                }}
              >
                {/* Invisible wider hit target */}
                <path d={d} fill="none" stroke="transparent" strokeWidth={14} />
                <path
                  d={d}
                  fill="none"
                  stroke={isConnSelected ? '#059669' : conn.strokeColor}
                  strokeWidth={isConnSelected ? conn.strokeWidth + 1.5 : conn.strokeWidth}
                  strokeDasharray={dash}
                  markerEnd={conn.arrowEnd !== false ? `url(#arrow-${conn.id})` : undefined}
                />
              </g>
            );
          })}
      </svg>

      {/* Render Document Elements */}
      {displayedElements
        .filter((el) => el.visible !== false && el.type !== 'connector')
        .map((element) => {
        const isSelected = selectedElementIds.includes(element.id);
        const isEditingThisText =
          element.type === 'text' && isSelected && isActivePage && !element.locked && editingTextId === element.id;

        return (
          <div
            key={element.id}
            id={`element-${element.id}`}
            className={`absolute ${
              element.locked
                ? 'cursor-not-allowed'
                : isEditingThisText
                ? 'cursor-text'
                : element.type === 'text' && isSelected && isActivePage
                ? 'cursor-text'
                : 'cursor-move'
            }`}
            style={{
              left: `${element.x}px`,
              top: `${element.y}px`,
              width: `${element.width}px`,
              height: `${element.height}px`,
              transform: `rotate(${element.rotation}deg)`,
              transformOrigin: 'center center',
              zIndex: element.zIndex,
              opacity: element.opacity !== undefined ? element.opacity : 1,
            }}
            onDoubleClick={(e) => {
              if (element.type === 'text' && !element.locked) {
                e.stopPropagation();
                if (!isActivePage && !isEditingMaster) {
                  setActivePageIndex(targetPageIndex);
                }
                selectElement(element.id, false);
                setEditingTextId(element.id);
              }
            }}
            onMouseDown={(e) => {
              // If already selected text box or in text edit mode, allow native I-beam caret & text selection!
              if (
                element.type === 'text' &&
                !element.locked &&
                (editingTextId === element.id || (isSelected && isActivePage && e.button === 0))
              ) {
                setEditingTextId(element.id);
                e.stopPropagation();
                return;
              }
              setEditingTextId(null);
              handleElementMouseDown(element, e);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!selectedElementIds.includes(element.id)) {
                selectElement(element.id, false);
              }
              setContextMenu({ x: e.clientX, y: e.clientY, elementId: element.id });
            }}
          >
            <ElementRenderer
              element={element}
              isSelected={isSelected && isActivePage && !element.locked}
              pageNumber={targetPageIndex + 1}
              totalPages={project.pages.length}
              onTextChange={(newText) => updateElement(element.id, { text: newText })}
              onTableCellChange={(row, col, val) => {
                if (element.type === 'table') {
                  const newData = element.data.map((r, rIdx) =>
                    rIdx === row ? r.map((c, cIdx) => (cIdx === col ? val : c)) : r
                  );
                  updateElement(element.id, { data: newData });
                }
              }}
            />

            {/* Transform Controls & Handles when Selected */}
            {isSelected && isActivePage && !element.locked && (
              <SelectionBox
                element={element}
                zoom={zoom}
                onMoveMouseDown={(e) => {
                  setEditingTextId(null);
                  handleElementMouseDown(element, e);
                }}
                onResize={(nx, ny, nw, nh) =>
                  updateElement(element.id, { x: nx, y: ny, width: nw, height: nh })
                }
                onRotate={(nrot) => updateElement(element.id, { rotation: nrot })}
                onAdjustShape={(adjustValue) =>
                  updateElement(element.id, { adjustValue })
                }
              />
            )}

            {/* Locked Badge when Selected */}
            {isSelected && element.locked && (
              <div className="absolute inset-0 border-2 border-amber-500/80 pointer-events-none flex items-start justify-end p-1">
                <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow">
                  <Lock size={9} /> Locked
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>

    {/* Right-Click Context Menu */}
    {contextMenu && (
      <div
        className="fixed z-50 bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-1.5 w-48 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100"
        style={{
          left: Math.min(contextMenu.x, window.innerWidth - 200),
          top: Math.min(contextMenu.y, window.innerHeight - 280),
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {contextMenu.elementId ? (
          <>
            <button
              onClick={() => {
                copySelectedElements();
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-800 rounded-xl flex items-center gap-2 transition"
            >
              <Copy size={13} /> <span>Copy</span>
              <span className="ml-auto text-[10px] text-slate-400">Ctrl+C</span>
            </button>
            <button
              onClick={() => {
                duplicateSelectedElements();
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-800 rounded-xl flex items-center gap-2 transition"
            >
              <Copy size={13} /> <span>Duplicate</span>
              <span className="ml-auto text-[10px] text-slate-400">Ctrl+D</span>
            </button>
            <div className="border-t border-slate-100 my-1" />
            <button
              onClick={() => {
                bringToFront();
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-800 rounded-xl flex items-center gap-2 transition"
            >
              <BringToFront size={13} /> <span>Bring to Front</span>
            </button>
            <button
              onClick={() => {
                sendToBack();
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-800 rounded-xl flex items-center gap-2 transition"
            >
              <SendToBack size={13} /> <span>Send to Back</span>
            </button>
            <button
              onClick={() => {
                if (contextMenu.elementId) toggleElementLock(contextMenu.elementId);
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-amber-50 hover:text-amber-800 rounded-xl flex items-center gap-2 transition"
            >
              {displayedElements.find((el) => el.id === contextMenu.elementId)?.locked ? (
                <>
                  <Unlock size={13} /> <span>Unlock Object</span>
                </>
              ) : (
                <>
                  <Lock size={13} /> <span>Lock Object</span>
                </>
              )}
            </button>
            <div className="border-t border-slate-100 my-1" />
            <button
              onClick={() => {
                deleteSelectedElements();
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-red-50 text-red-600 rounded-xl flex items-center gap-2 transition"
            >
              <Trash2 size={13} /> <span>Delete</span>
              <span className="ml-auto text-[10px] text-red-300">Del</span>
            </button>
          </>
        ) : (
          <>
            <button
              disabled={!hasClipboard}
              onClick={() => {
                pasteElements();
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-800 rounded-xl flex items-center gap-2 disabled:opacity-40 transition"
            >
              <Clipboard size={13} /> <span>Paste</span>
              <span className="ml-auto text-[10px] text-slate-400">Ctrl+V</span>
            </button>
            <div className="border-t border-slate-100 my-1" />
            <button
              onClick={() => {
                addTextBox();
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-800 rounded-xl flex items-center gap-2 transition"
            >
              <Type size={13} /> <span>Insert Text Box</span>
            </button>
            <button
              onClick={() => {
                addQRCode();
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-800 rounded-xl flex items-center gap-2 transition"
            >
              <QrCode size={13} /> <span>Insert QR Code</span>
            </button>
            <div className="border-t border-slate-100 my-1" />
            <button
              onClick={() => {
                setIsEditingMaster(!isEditingMaster);
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-amber-50 hover:text-amber-800 rounded-xl flex items-center gap-2 transition"
            >
              <Layers size={13} />{' '}
              <span>{isEditingMaster ? 'Exit Master Page' : 'Edit Master Page'}</span>
            </button>
          </>
        )}
      </div>
    )}
    </div>
  );
};
