import React, { useState, useRef } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { PageCanvas } from './PageCanvas';
import { HorizontalRuler, VerticalRuler } from './Ruler';

export const CanvasArea: React.FC = () => {
  const { activePage, zoom, rulerVisible, addGuide } = usePublisher();

  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCursorMove = (x: number, y: number) => {
    setCursorPos({ x, y });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#e5e7eb] relative select-none">
      {/* Top Header Strip: Corner + Top Ruler */}
      {rulerVisible && (
        <div className="flex h-6 w-full bg-[#f3f4f6] border-b border-slate-300 z-30 flex-shrink-0">
          {/* Corner 0,0 box */}
          <div className="w-6 h-6 border-r border-slate-300 flex items-center justify-center bg-[#eaeaea] text-[8px] font-mono text-slate-500 flex-shrink-0">
            in
          </div>
          {/* Horizontal Ruler */}
          <div className="flex-1 overflow-hidden relative">
            <div
              style={{
                marginLeft: '40px', // matches canvas offset padding
              }}
            >
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
          <div className="w-6 bg-[#f3f4f6] border-r border-slate-300 z-20 flex-shrink-0 overflow-hidden relative">
            <div
              style={{
                marginTop: '40px', // matches canvas offset padding
              }}
            >
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
          className="flex-1 h-full overflow-auto p-10 flex items-start justify-center bg-[#d1d5db]"
        >
          <div
            style={{
              paddingBottom: '200px',
              paddingRight: '200px',
            }}
          >
            <PageCanvas onCursorMove={handleCursorMove} />
          </div>
        </div>
      </div>
    </div>
  );
};
