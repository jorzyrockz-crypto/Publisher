import React from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { Plus, Copy, Trash2, Layers } from 'lucide-react';

export const PageThumbnails: React.FC = () => {
  const {
    project,
    activePage,
    setActivePageIndex,
    addPage,
    duplicateActivePage,
    deleteActivePage,
  } = usePublisher();

  return (
    <div className="w-52 bg-white/95 backdrop-blur-md border-r border-slate-200 flex flex-col h-full select-none flex-shrink-0 z-20 shadow-2xs">
      {/* Header bar */}
      <div className="h-9 px-3.5 flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70">
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Layers size={14} className="text-emerald-700" />
          <span>Pages</span>
          <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.2 rounded-full font-mono">
            {project.pages.length}
          </span>
        </span>
        <button
          onClick={addPage}
          className="p-1 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 rounded-lg transition active:scale-95"
          title="Add Blank Page"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Thumbnails list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {project.pages.map((page, idx) => {
          const isActive = idx === project.activePageIndex;
          const aspectRatio = page.width / page.height;

          return (
            <div
              key={page.id}
              onClick={() => setActivePageIndex(idx)}
              className={`group flex flex-col items-center cursor-pointer p-2 rounded-2xl transition-all ${
                isActive
                  ? 'bg-emerald-50/60 ring-2 ring-emerald-600 shadow-xs'
                  : 'hover:bg-slate-100/70'
              }`}
            >
              {/* Scaled Mini Thumbnail Canvas */}
              <div
                className="w-32 bg-white border border-slate-200/90 shadow-sm rounded-lg relative overflow-hidden flex items-center justify-center transition-all group-hover:scale-[1.02]"
                style={{
                  height: `${32 / aspectRatio}rem`,
                  maxHeight: '145px',
                  backgroundColor: page.backgroundColor,
                }}
              >
                {/* Visual miniature representation */}
                {page.elements.map((el) => {
                  const scaleW = 128 / page.width; // 32rem ~ 128px
                  const scaleH = (128 / aspectRatio) / page.height;

                  return (
                    <div
                      key={el.id}
                      className="absolute opacity-80"
                      style={{
                        left: `${el.x * scaleW}px`,
                        top: `${el.y * scaleH}px`,
                        width: `${Math.max(2, el.width * scaleW)}px`,
                        height: `${Math.max(2, el.height * scaleH)}px`,
                        backgroundColor:
                          el.type === 'shape'
                            ? el.fillColor
                            : el.type === 'text'
                            ? el.color
                            : '#94a3b8',
                        borderRadius:
                          el.type === 'shape' && el.shapeType === 'circle' ? '50%' : '1px',
                      }}
                    />
                  );
                })}

                {/* Page Number Badge */}
                <div className="absolute bottom-1 right-1 bg-slate-900/60 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full pointer-events-none">
                  {idx + 1}
                </div>
              </div>

              {/* Page Title & Controls */}
              <div className="flex items-center justify-between w-full mt-2 px-1 text-xs text-slate-600">
                <span className={`truncate font-medium text-[11px] ${isActive ? 'text-emerald-800 font-bold' : ''}`}>
                  {page.name || `Page ${idx + 1}`}
                </span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateActivePage();
                    }}
                    className="p-1 hover:bg-slate-200/80 rounded-md text-slate-600 hover:text-emerald-700 transition"
                    title="Duplicate Page"
                  >
                    <Copy size={11} />
                  </button>
                  {project.pages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteActivePage();
                      }}
                      className="p-1 hover:bg-red-50 rounded-md text-slate-500 hover:text-red-600 transition"
                      title="Delete Page"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Footer Info */}
      <div className="p-2.5 border-t border-slate-200/80 bg-slate-50/60 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          Master Active
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          {Math.round(activePage.width)}×{Math.round(activePage.height)}
        </span>
      </div>
    </div>
  );
};
