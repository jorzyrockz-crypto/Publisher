import React, { useState, useEffect } from 'react';
import type { PublisherElement, ShapeElement } from '../../types/publisher';
import { RotateCw } from 'lucide-react';

/** Extra context the canvas needs to resize text boxes intelligently. */
export interface ResizeMeta {
  handle: string;
  startWidth: number;
  startHeight: number;
  startFontSize?: number;
}

interface SelectionBoxProps {
  element: PublisherElement;
  zoom: number;
  onResize: (
    newX: number,
    newY: number,
    newWidth: number,
    newHeight: number,
    meta?: ResizeMeta
  ) => void;
  onRotate: (newRotation: number) => void;
  onMoveMouseDown?: (e: React.MouseEvent) => void;
  onAdjustShape?: (adjustValue: number) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  element,
  zoom,
  onResize,
  onRotate,
  onMoveMouseDown,
  onAdjustShape,
  onInteractionStart,
  onInteractionEnd,
}) => {
  const [isRotating, setIsRotating] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(element.rotation);

  useEffect(() => {
    setRotationAngle(element.rotation);
  }, [element.rotation]);

  const handleResizeMouseDown = (handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onInteractionStart?.();

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = element.x;
    const startY = element.y;
    const startW = element.width;
    const startH = element.height;
    const startFontSize = element.type === 'text' ? element.fontSize : undefined;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startMouseX) / zoom;
      const deltaY = (moveEvent.clientY - startMouseY) / zoom;

      let nextX = startX;
      let nextY = startY;
      let nextW = startW;
      let nextH = startH;

      if (handle.includes('e')) {
        nextW = Math.max(20, startW + deltaX);
      }
      if (handle.includes('s')) {
        nextH = Math.max(10, startH + deltaY);
      }
      if (handle.includes('w')) {
        const potentialW = startW - deltaX;
        if (potentialW > 20) {
          nextW = potentialW;
          nextX = startX + deltaX;
        }
      }
      if (handle.includes('n')) {
        const potentialH = startH - deltaY;
        if (potentialH > 10) {
          nextH = potentialH;
          nextY = startY + deltaY;
        }
      }

      // Shift-key locks aspect ratio (1:1 or original ratio) on corner handles
      if (moveEvent.shiftKey && handle.length === 2) {
        const ratio = startW / Math.max(1, startH);
        if (Math.abs(nextW - startW) > Math.abs(nextH - startH) * ratio) {
          const lockedH = Math.max(20, nextW / ratio);
          if (handle.includes('n')) nextY = startY + (startH - lockedH);
          nextH = lockedH;
        } else {
          const lockedW = Math.max(20, nextH * ratio);
          if (handle.includes('w')) nextX = startX + (startW - lockedW);
          nextW = lockedW;
        }
      }

      onResize(Math.round(nextX), Math.round(nextY), Math.round(nextW), Math.round(nextH), {
        handle,
        startWidth: startW,
        startHeight: startH,
        startFontSize,
      });
    };

    const handleMouseUp = () => {
      onInteractionEnd?.();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleRotateMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onInteractionStart?.();
    setIsRotating(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const elDom = document.getElementById(`element-${element.id}`);
      if (!elDom) return;
      const rect = elDom.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const rad = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
      let deg = Math.round(rad * (180 / Math.PI)) + 90;
      if (deg < 0) deg += 360;

      // Snap to 15° increments when Shift is held, or 45° when close
      if (moveEvent.shiftKey) {
        deg = Math.round(deg / 15) * 15;
      } else if (Math.abs(deg % 45) < 3 || Math.abs((deg % 45) - 45) < 3) {
        deg = Math.round(deg / 45) * 45;
      }

      setRotationAngle(deg);
      onRotate(deg);
    };

    const handleMouseUp = () => {
      setIsRotating(false);
      onInteractionEnd?.();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        border: '1.5px solid #059669',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.8), 0 0 8px rgba(5,150,105,0.25)',
      }}
    >
      {/* 4 Edge Drag Strips so you can always drag the border even while editing text */}
      {onMoveMouseDown && (
        <>
          <div
            className="absolute -top-1.5 left-2 right-2 h-3 cursor-move pointer-events-auto"
            onMouseDown={onMoveMouseDown}
            title="Drag border to move"
          />
          <div
            className="absolute -bottom-1.5 left-2 right-2 h-3 cursor-move pointer-events-auto"
            onMouseDown={onMoveMouseDown}
            title="Drag border to move"
          />
          <div
            className="absolute top-2 bottom-2 -left-1.5 w-3 cursor-move pointer-events-auto"
            onMouseDown={onMoveMouseDown}
            title="Drag border to move"
          />
          <div
            className="absolute top-2 bottom-2 -right-1.5 w-3 cursor-move pointer-events-auto"
            onMouseDown={onMoveMouseDown}
            title="Drag border to move"
          />
        </>
      )}

      {/* 8 Modern Circular Resize Handles */}
      <div
        className="resize-handle-modern pointer-events-auto -top-1.5 -left-1.5 cursor-nwse-resize"
        onMouseDown={(e) => handleResizeMouseDown('nw', e)}
      />
      <div
        className="resize-handle-modern pointer-events-auto -top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize"
        onMouseDown={(e) => handleResizeMouseDown('n', e)}
      />
      <div
        className="resize-handle-modern pointer-events-auto -top-1.5 -right-1.5 cursor-nesw-resize"
        onMouseDown={(e) => handleResizeMouseDown('ne', e)}
      />
      <div
        className="resize-handle-modern pointer-events-auto top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize"
        onMouseDown={(e) => handleResizeMouseDown('e', e)}
      />
      <div
        className="resize-handle-modern pointer-events-auto -bottom-1.5 -right-1.5 cursor-nwse-resize"
        onMouseDown={(e) => handleResizeMouseDown('se', e)}
      />
      <div
        className="resize-handle-modern pointer-events-auto -bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize"
        onMouseDown={(e) => handleResizeMouseDown('s', e)}
      />
      <div
        className="resize-handle-modern pointer-events-auto -bottom-1.5 -left-1.5 cursor-nesw-resize"
        onMouseDown={(e) => handleResizeMouseDown('sw', e)}
      />
      <div
        className="resize-handle-modern pointer-events-auto top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize"
        onMouseDown={(e) => handleResizeMouseDown('w', e)}
      />

      {/* Rotation Control with stem line */}
      <div className="absolute left-1/2 -top-7 -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-grab active:cursor-grabbing">
        <div
          className="w-5 h-5 bg-white border border-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-600 shadow-md group transition-all active:scale-95"
          onMouseDown={handleRotateMouseDown}
          title="Drag to Rotate"
        >
          <RotateCw size={10} className="text-indigo-700 group-hover:text-white" />
        </div>
        <div className="w-[1.5px] h-2 bg-indigo-600" />
      </div>

      {/* Floating Dimension or Angle Tooltip */}
      {isRotating && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-mono font-medium px-2 py-0.5 rounded-full shadow-lg pointer-events-none">
          {rotationAngle}°
        </div>
      )}

      {/* PowerPoint-style Yellow Diamond Adjustment Handle for Morphable Shapes */}
      {element.type === 'shape' &&
        onAdjustShape &&
        [
          'rounded-rect',
          'star',
          'badge-burst',
          'arrow-right',
          'arrow-double',
          'banner',
          'triangle',
          'parallelogram',
          'trapezoid',
          'cross',
        ].includes((element as ShapeElement).shapeType) && (() => {
          const shp = element as ShapeElement;
          const defaults: Record<string, { def: number; min: number; max: number }> = {
            'rounded-rect': { def: 0.25, min: 0, max: 1 },
            star: { def: 0.45, min: 0.15, max: 0.85 },
            'badge-burst': { def: 0.78, min: 0.4, max: 0.92 },
            'arrow-right': { def: 0.32, min: 0.1, max: 0.75 },
            'arrow-double': { def: 0.25, min: 0.1, max: 0.45 },
            banner: { def: 0.12, min: 0.02, max: 0.4 },
            triangle: { def: 0.5, min: 0.05, max: 0.95 },
            parallelogram: { def: 0.2, min: 0.02, max: 0.45 },
            trapezoid: { def: 0.18, min: 0.02, max: 0.45 },
            cross: { def: 0.35, min: 0.12, max: 0.75 },
          };
          const cfg = defaults[shp.shapeType];
          const val = shp.adjustValue ?? cfg.def;

          let handleLeft = '50%';
          let handleTop = '0px';

          if (shp.shapeType === 'rounded-rect') {
            const maxR = Math.min(shp.width, shp.height) / 2;
            handleLeft = `${Math.max(8, val * maxR)}px`;
            handleTop = '4px';
          } else if (shp.shapeType === 'star' || shp.shapeType === 'badge-burst') {
            handleLeft = `${50 + val * 30}%`;
            handleTop = '16%';
          } else if (shp.shapeType === 'arrow-right') {
            handleLeft = `${(1 - val) * 100}%`;
            handleTop = '22%';
          } else if (shp.shapeType === 'arrow-double') {
            handleLeft = `${val * 100}%`;
            handleTop = '22%';
          } else if (shp.shapeType === 'banner') {
            handleLeft = `${val * 100}%`;
            handleTop = '50%';
          } else if (shp.shapeType === 'triangle') {
            handleLeft = `${val * 100}%`;
            handleTop = '2px';
          } else if (shp.shapeType === 'parallelogram' || shp.shapeType === 'trapezoid') {
            handleLeft = `${val * 100}%`;
            handleTop = '2px';
          } else if (shp.shapeType === 'cross') {
            handleLeft = `${50 - (val * 50)}%`;
            handleTop = '6px';
          }

          const handleAdjustMouseDown = (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            setIsAdjusting(true);
            const startX = e.clientX;
            const startVal = val;

            const onMove = (me: MouseEvent) => {
              const dx = (me.clientX - startX) / (zoom * Math.max(40, shp.width));
              const direction =
                shp.shapeType === 'arrow-right' || shp.shapeType === 'cross' ? -1 : 1;
              const nextVal = Math.min(
                cfg.max,
                Math.max(cfg.min, Number((startVal + dx * direction * 1.5).toFixed(3)))
              );
              onAdjustShape(nextVal);
            };
            const onUp = () => {
              setIsAdjusting(false);
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          };

          return (
            <div
              onMouseDown={handleAdjustMouseDown}
              style={{ left: handleLeft, top: handleTop }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-400 border border-amber-700 rotate-45 cursor-ew-resize pointer-events-auto shadow-sm hover:scale-125 transition-transform z-50"
              title="Drag yellow handle to morph shape geometry"
            >
              {isAdjusting && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 -rotate-45 bg-slate-900 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none">
                  {Math.round(val * 100)}%
                </div>
              )}
            </div>
          );
        })()}
    </div>
  );
};
