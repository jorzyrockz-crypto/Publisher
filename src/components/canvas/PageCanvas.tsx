import React, { useState, useRef, useEffect } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { ElementRenderer } from './ElementRenderer';
import { SelectionBox } from './SelectionBox';
import { calculateSnap } from '../../utils/snapping';
import { PublisherElement } from '../../types/publisher';

interface PageCanvasProps {
  cursorX?: number;
  cursorY?: number;
  onCursorMove?: (x: number, y: number) => void;
}

export const PageCanvas: React.FC<PageCanvasProps> = ({ onCursorMove }) => {
  const {
    activePage,
    selectedElementIds,
    zoom,
    guidesVisible,
    gridVisible,
    snapToGuides,
    selectElement,
    clearSelection,
    updateElement,
    deleteSelectedElements,
    duplicateSelectedElements,
    selectAll,
    undo,
    redo,
    addGuide,
    removeGuide,
  } = usePublisher();

  const [activeAlignGuideH, setActiveAlignGuideH] = useState<number | undefined>();
  const [activeAlignGuideV, setActiveAlignGuideV] = useState<number | undefined>();
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcuts (Arrows to nudge, Delete to remove, Ctrl+D duplicate, etc.)
  useEffect(() => {
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
            const el = activePage.elements.find((item) => item.id === id);
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
    selectedElementIds,
    activePage,
    deleteSelectedElements,
    clearSelection,
    selectAll,
    duplicateSelectedElements,
    undo,
    redo,
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
    // Clicked directly on background canvas
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      clearSelection();

      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const startX = Math.round((e.clientX - rect.left) / zoom);
      const startY = Math.round((e.clientY - rect.top) / zoom);
      setMarquee({ startX, startY, currentX: startX, currentY: startY });

      const handleWindowMouseUp = () => {
        setMarquee((current) => {
          if (current) {
            const minX = Math.min(current.startX, current.currentX);
            const maxX = Math.max(current.startX, current.currentX);
            const minY = Math.min(current.startY, current.currentY);
            const maxY = Math.max(current.startY, current.currentY);

            // Select all elements intersecting marquee
            if (maxX - minX > 5 && maxY - minY > 5) {
              const intersecting = activePage.elements.filter((el) => {
                return (
                  el.x < maxX &&
                  el.x + el.width > minX &&
                  el.y < maxY &&
                  el.y + el.height > minY
                );
              });
              intersecting.forEach((el) => selectElement(el.id, true));
            }
          }
          return null;
        });
        window.removeEventListener('mouseup', handleWindowMouseUp);
      };

      window.addEventListener('mouseup', handleWindowMouseUp);
    }
  };

  const handleElementMouseDown = (element: PublisherElement, e: React.MouseEvent) => {
    e.stopPropagation();

    const isMulti = e.shiftKey || e.ctrlKey;
    if (!selectedElementIds.includes(element.id)) {
      selectElement(element.id, isMulti);
    }

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const initialElementsPos = activePage.elements
      .filter((el) => selectedElementIds.includes(el.id) || el.id === element.id)
      .map((el) => ({ id: el.id, startX: el.x, startY: el.y, width: el.width, height: el.height }));

    let hasMoved = false;

    const handleWindowMouseMove = (moveEvent: MouseEvent) => {
      hasMoved = true;
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
        activePage,
        snapToGuides,
        true
      );

      setActiveAlignGuideH(snap.horizontalGuide);
      setActiveAlignGuideV(snap.verticalGuide);

      const effectiveDeltaX = snap.x - primary.startX;
      const effectiveDeltaY = snap.y - primary.startY;

      initialElementsPos.forEach((item) => {
        updateElement(item.id, {
          x: Math.round(item.startX + effectiveDeltaX),
          y: Math.round(item.startY + effectiveDeltaY),
        });
      });
    };

    const handleWindowMouseUp = () => {
      setActiveAlignGuideH(undefined);
      setActiveAlignGuideV(undefined);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  return (
    <div
      id={`print-page-${activePage.id}`}
      ref={canvasRef}
      className="relative select-none print-page transition-shadow duration-150"
      style={{
        width: `${activePage.width}px`,
        height: `${activePage.height}px`,
        backgroundColor: activePage.backgroundColor,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
      }}
      onMouseMove={handleCanvasMouseMove}
      onMouseDown={handleCanvasMouseDown}
    >
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
          top: `${activePage.margins.top}px`,
          left: `${activePage.margins.left}px`,
          right: `${activePage.margins.right}px`,
          bottom: `${activePage.margins.bottom}px`,
        }}
      />

      {/* User Guides */}
      {guidesVisible &&
        activePage.guides?.map((guide) => (
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
          className="selection-marquee absolute z-50 pointer-events-none"
          style={{
            left: `${Math.min(marquee.startX, marquee.currentX)}px`,
            top: `${Math.min(marquee.startY, marquee.currentY)}px`,
            width: `${Math.abs(marquee.currentX - marquee.startX)}px`,
            height: `${Math.abs(marquee.currentY - marquee.startY)}px`,
          }}
        />
      )}

      {/* Render Document Elements */}
      {activePage.elements.map((element) => {
        const isSelected = selectedElementIds.includes(element.id);

        return (
          <div
            key={element.id}
            id={`element-${element.id}`}
            className="absolute cursor-move"
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
            onMouseDown={(e) => handleElementMouseDown(element, e)}
          >
            <ElementRenderer
              element={element}
              isSelected={isSelected}
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
            {isSelected && (
              <SelectionBox
                element={element}
                zoom={zoom}
                onResize={(nx, ny, nw, nh) =>
                  updateElement(element.id, { x: nx, y: ny, width: nw, height: nh })
                }
                onRotate={(nrot) => updateElement(element.id, { rotation: nrot })}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
