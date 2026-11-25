import React, { useState, useEffect } from 'react';
import type { PublisherElement } from '../../types/publisher';
import { RotateCw } from 'lucide-react';

interface SelectionBoxProps {
  element: PublisherElement;
  zoom: number;
  onResize: (newX: number, newY: number, newWidth: number, newHeight: number) => void;
  onRotate: (newRotation: number) => void;
  onMoveMouseDown?: (e: React.MouseEvent) => void;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  element,
  zoom,
  onResize,
  onRotate,
  onMoveMouseDown,
}) => {
  const [isRotating, setIsRotating] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(element.rotation);

  useEffect(() => {
    setRotationAngle(element.rotation);
  }, [element.rotation]);

  const handleResizeMouseDown = (handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = element.x;
    const startY = element.y;
    const startW = element.width;
    const startH = element.height;

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

      onResize(Math.round(nextX), Math.round(nextY), Math.round(nextW), Math.round(nextH));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleRotateMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
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

      // Snap to 0, 45, 90, 180, 270 if close
      if (Math.abs(deg % 45) < 3 || Math.abs((deg % 45) - 45) < 3) {
        deg = Math.round(deg / 45) * 45;
      }

      setRotationAngle(deg);
      onRotate(deg);
    };

    const handleMouseUp = () => {
      setIsRotating(false);
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
          className="w-5 h-5 bg-white border border-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-600 shadow-md group transition-all active:scale-95"
          onMouseDown={handleRotateMouseDown}
          title="Drag to Rotate"
        >
          <RotateCw size={10} className="text-emerald-700 group-hover:text-white" />
        </div>
        <div className="w-[1.5px] h-2 bg-emerald-600" />
      </div>

      {/* Floating Dimension or Angle Tooltip */}
      {isRotating && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-mono font-medium px-2 py-0.5 rounded-full shadow-lg pointer-events-none">
          {rotationAngle}°
        </div>
      )}
    </div>
  );
};
