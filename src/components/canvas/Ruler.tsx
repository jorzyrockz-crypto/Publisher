import React from 'react';

interface HorizontalRulerProps {
  width: number;
  zoom: number;
  cursorX?: number;
  onAddGuide: (position: number) => void;
}

export const HorizontalRuler: React.FC<HorizontalRulerProps> = ({
  width,
  zoom,
  cursorX,
  onAddGuide,
}) => {
  const step = 96; // 1 inch = 96px
  const minorStep = 24; // 1/4 inch
  const numSteps = Math.ceil(width / step) + 1;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.round((e.clientX - rect.left) / zoom);
    onAddGuide(pos);
  };

  return (
    <div
      className="relative h-5 bg-white/80 backdrop-blur-xs border-b border-slate-200 select-none overflow-hidden cursor-row-resize"
      style={{ width: `${width * zoom}px` }}
      onMouseDown={handleMouseDown}
      title="Click and drag downwards to create a horizontal guide line"
    >
      {/* Ticks and inch numbers */}
      {Array.from({ length: numSteps }).map((_, i) => {
        const x = i * step * zoom;
        return (
          <React.Fragment key={i}>
            {/* Major tick (1 inch) */}
            <div
              className="absolute top-0 bottom-0 w-[1px] bg-slate-300"
              style={{ left: `${x}px` }}
            />
            <span
              className="absolute top-0.5 text-[8.5px] font-mono font-medium text-slate-400 pl-1 pointer-events-none"
              style={{ left: `${x}px` }}
            >
              {i}"
            </span>

            {/* Minor ticks */}
            {[1, 2, 3].map((sub) => {
              const subX = (i * step + sub * minorStep) * zoom;
              if (subX >= width * zoom) return null;
              return (
                <div
                  key={sub}
                  className="absolute bottom-0 w-[1px] bg-slate-200"
                  style={{
                    left: `${subX}px`,
                    height: sub === 2 ? '6px' : '3px',
                  }}
                />
              );
            })}
          </React.Fragment>
        );
      })}

      {/* Hairline cursor tracker */}
      {cursorX !== undefined && cursorX >= 0 && cursorX <= width && (
        <div
          className="absolute top-0 bottom-0 w-[1.5px] bg-indigo-600 pointer-events-none z-10 shadow-xs"
          style={{ left: `${cursorX * zoom}px` }}
        />
      )}
    </div>
  );
};

interface VerticalRulerProps {
  height: number;
  zoom: number;
  cursorY?: number;
  onAddGuide: (position: number) => void;
}

export const VerticalRuler: React.FC<VerticalRulerProps> = ({
  height,
  zoom,
  cursorY,
  onAddGuide,
}) => {
  const step = 96; // 1 inch = 96px
  const minorStep = 24; // 1/4 inch
  const numSteps = Math.ceil(height / step) + 1;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.round((e.clientY - rect.top) / zoom);
    onAddGuide(pos);
  };

  return (
    <div
      className="relative w-5 bg-white/80 backdrop-blur-xs border-r border-slate-200 select-none overflow-hidden cursor-col-resize"
      style={{ height: `${height * zoom}px` }}
      onMouseDown={handleMouseDown}
      title="Click and drag rightwards to create a vertical guide line"
    >
      {Array.from({ length: numSteps }).map((_, i) => {
        const y = i * step * zoom;
        return (
          <React.Fragment key={i}>
            <div
              className="absolute left-0 right-0 h-[1px] bg-slate-300"
              style={{ top: `${y}px` }}
            />
            <span
              className="absolute left-0.5 text-[8.5px] font-mono font-medium text-slate-400 pointer-events-none"
              style={{ top: `${y + 1}px` }}
            >
              {i}"
            </span>

            {[1, 2, 3].map((sub) => {
              const subY = (i * step + sub * minorStep) * zoom;
              if (subY >= height * zoom) return null;
              return (
                <div
                  key={sub}
                  className="absolute right-0 h-[1px] bg-slate-200"
                  style={{
                    top: `${subY}px`,
                    width: sub === 2 ? '6px' : '3px',
                  }}
                />
              );
            })}
          </React.Fragment>
        );
      })}

      {cursorY !== undefined && cursorY >= 0 && cursorY <= height && (
        <div
          className="absolute left-0 right-0 h-[1.5px] bg-indigo-600 pointer-events-none z-10 shadow-xs"
          style={{ top: `${cursorY * zoom}px` }}
        />
      )}
    </div>
  );
};
