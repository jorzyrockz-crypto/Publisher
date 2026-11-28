import React from 'react';
import { ConnectorElement, Page } from '../../types/publisher';
import { ElementRenderer } from '../canvas/ElementRenderer';
import { buildPatternBackgroundStyle } from '../../utils/patternGenerator';

/**
 * A page drawn small, in the DOM.
 *
 * This is the gallery's proof: the same `ElementRenderer` the canvas uses, scaled into a box. A
 * thumbnail image would have to be re-exported every time a template changed, and would drift from
 * what the template actually is; this cannot drift, because it *is* the page.
 *
 * It used to live inside `BackstageModal`, where it was reachable only from File ▸ New. It now
 * lives here because the Home screen and the template preview dialog both need it, and a second
 * copy of the page-scaler is exactly how two galleries end up disagreeing about a template.
 */
export const TemplatePagePreview: React.FC<{
  page: Page;
  maxWidth: number;
  maxHeight: number;
  showMargins?: boolean;
  showCropMarks?: boolean;
  grayscale?: boolean;
}> = React.memo(({ page, maxWidth, maxHeight, showMargins, showCropMarks, grayscale }) => {
  const scale = Math.min(maxWidth / page.width, maxHeight / page.height);
  const scaledW = Math.round(page.width * scale);
  const scaledH = Math.round(page.height * scale);
  const connectors = page.elements.filter(
    (el): el is ConnectorElement => el.type === 'connector' && el.visible !== false
  );

  return (
    <div className={`relative flex-shrink-0 ${showCropMarks ? 'p-2.5' : ''}`}>
      {showCropMarks && (
        <>
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-r border-b border-slate-700 pointer-events-none" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-l border-b border-slate-700 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-r border-t border-slate-700 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-l border-t border-slate-700 pointer-events-none" />
        </>
      )}
      <div
        className="relative shadow-md border border-line overflow-hidden bg-white"
        style={{
          width: `${scaledW}px`,
          height: `${scaledH}px`,
          backgroundColor: page.backgroundColor || '#ffffff',
          ...buildPatternBackgroundStyle(page.backgroundPattern, scale),
          filter: grayscale ? 'grayscale(100%)' : undefined,
        }}
      >
        <div
          className="pointer-events-none select-none"
          style={{
            width: `${page.width}px`,
            height: `${page.height}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'relative',
          }}
        >
          {page.elements
            .filter((el) => el.visible !== false && el.type !== 'connector')
            .map((el) => (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  transform: `rotate(${el.rotation}deg)`,
                  transformOrigin: 'center center',
                  zIndex: el.zIndex,
                  opacity: el.opacity !== undefined ? el.opacity : 1,
                }}
              >
                <ElementRenderer element={el} isSelected={false} pageNumber={1} totalPages={1} />
              </div>
            ))}

          {connectors.length > 0 && (
            <svg
              className="absolute inset-0 pointer-events-none"
              width={page.width}
              height={page.height}
              style={{ zIndex: 45, overflow: 'visible' }}
            >
              {connectors.map((conn) => {
                const fromEl = page.elements.find((e) => e.id === conn.fromId);
                const toEl = page.elements.find((e) => e.id === conn.toId);
                if (!fromEl || !toEl) return null;
                const x1 = fromEl.x + fromEl.width / 2;
                const y1 = fromEl.y + fromEl.height / 2;
                const x2 = toEl.x + toEl.width / 2;
                const y2 = toEl.y + toEl.height / 2;
                return (
                  <line
                    key={conn.id}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={conn.strokeColor}
                    strokeWidth={conn.strokeWidth || 3}
                  />
                );
              })}
            </svg>
          )}

          {showMargins && (
            <div
              className="absolute border border-dashed border-sky-500/80 pointer-events-none"
              style={{
                left: `${page.margins.left}px`,
                top: `${page.margins.top}px`,
                right: `${page.margins.right}px`,
                bottom: `${page.margins.bottom}px`,
                zIndex: 90,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
});
