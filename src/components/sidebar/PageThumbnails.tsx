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
    <div className="w-48 bg-[#f8fafc] border-r border-slate-300 flex flex-col h-full select-none flex-shrink-0 z-20">
      {/* Header bar */}
      <div className="h-8 bg-[#f1f5f9] border-b border-slate-300 px-3 flex items-center justify-between text-xs font-semibold text-slate-700">
        <span className="flex items-center gap-1.5">
          <Layers size={13} className="text-[#0f6b4e]" />
          Pages ({project.pages.length})
        </span>
        <button
          onClick={addPage}
          className="p-1 hover:bg-slate-200 rounded text-slate-700 hover:text-[#0f6b4e] transition"
          title="Insert New Blank Page"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Thumbnails list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {project.pages.map((page, idx) => {
          const isActive = idx === project.activePageIndex;
          const aspectRatio = page.width / page.height;

          return (
            <div
              key={page.id}
              onClick={() => setActivePageIndex(idx)}
              className={`group flex flex-col items-center cursor-pointer p-1.5 rounded-md transition ${
                isActive
                  ? 'bg-emerald-50 ring-2 ring-[#0f6b4e]'
                  : 'hover:bg-slate-200/60'
              }`}
            >
              {/* Scaled Mini Thumbnail Canvas */}
              <div
                className="w-28 bg-white border border-slate-300 shadow-sm rounded-sm relative overflow-hidden flex items-center justify-center transition-transform group-hover:scale-[1.02]"
                style={{
                  height: `${28 / aspectRatio}rem`,
                  maxHeight: '140px',
                  backgroundColor: page.backgroundColor,
                }}
              >
                {/* Simplified visual representation of elements inside thumbnail */}
                {page.elements.map((el) => {
                  const scaleW = 112 / page.width; // 28rem ~ 112px in thumbnail
                  const scaleH = (112 / aspectRatio) / page.height;

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
                        borderRadius: el.type === 'shape' && el.shapeType === 'circle' ? '50%' : '1px',
                      }}
                    />
                  );
                })}

                {/* Page Number Watermark */}
                <span className="text-[10px] font-bold text-slate-400/40 select-none pointer-events-none">
                  {idx + 1}
                </span>
              </div>

              {/* Page Title & Controls */}
              <div className="flex items-center justify-between w-full mt-1.5 px-1 text-[11px] text-slate-600">
                <span className={`truncate font-medium ${isActive ? 'text-[#0f6b4e] font-bold' : ''}`}>
                  {page.name || `Page ${idx + 1}`}
                </span>

                {isActive && (
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateActivePage();
                      }}
                      className="hover:text-[#0f6b4e] p-0.5"
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
                        className="hover:text-red-600 p-0.5"
                        title="Delete Page"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Master Page Indicator */}
      <div className="p-2 border-t border-slate-200 bg-slate-100/60 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          Master Page Active
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          {Math.round(activePage.width)}×{Math.round(activePage.height)}
        </span>
      </div>
    </div>
  );
};
