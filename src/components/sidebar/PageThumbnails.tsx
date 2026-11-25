import React, { useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import {
  Plus,
  Copy,
  Trash2,
  Layers,
  FileText,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Type,
  Square,
  Image as ImageIcon,
  Table as TableIcon,
  QrCode,
  Sparkles,
  Minus,
} from 'lucide-react';
import { PublisherElement } from '../../types/publisher';
import { ElementRenderer } from '../canvas/ElementRenderer';

export const PageThumbnails: React.FC = () => {
  const {
    project,
    activePage,
    selectedElementIds,
    isEditingMaster,
    setIsEditingMaster,
    toggleMasterPageVisibility,
    setActivePageIndex,
    addPage,
    duplicateActivePage,
    deleteActivePage,
    selectElement,
    toggleElementLock,
    toggleElementVisibility,
  } = usePublisher();

  const [sidebarTab, setSidebarTab] = useState<'pages' | 'layers'>('pages');

  const currentElements = isEditingMaster
    ? project.masterPage?.elements || []
    : activePage.elements;

  const sortedLayers = [...currentElements].sort((a, b) => b.zIndex - a.zIndex);

  const getLayerLabel = (el: PublisherElement) => {
    if (el.name) return el.name;
    switch (el.type) {
      case 'text':
        return el.text.slice(0, 18) || 'Text Box';
      case 'shape':
        return el.label || `Shape (${el.shapeType})`;
      case 'image':
        return 'Picture';
      case 'table':
        return `Table (${el.rows}×${el.cols})`;
      case 'accent':
        return el.title || `Block (${el.accentType})`;
      case 'line':
        return 'Divider Line';
      case 'qr':
        return `QR: ${el.value.slice(0, 14)}`;
    }
  };

  const getLayerIcon = (el: PublisherElement) => {
    switch (el.type) {
      case 'text':
        return <Type size={12} className="text-emerald-700" />;
      case 'shape':
        return <Square size={12} className="text-blue-600" />;
      case 'image':
        return <ImageIcon size={12} className="text-purple-600" />;
      case 'table':
        return <TableIcon size={12} className="text-amber-600" />;
      case 'qr':
        return <QrCode size={12} className="text-slate-800" />;
      case 'line':
        return <Minus size={12} className="text-slate-500" />;
      default:
        return <Sparkles size={12} className="text-amber-500" />;
    }
  };

  return (
    <div className="w-56 bg-white/95 backdrop-blur-md border-r border-slate-200 flex flex-col h-full select-none flex-shrink-0 z-20 shadow-2xs">
      {/* Segmented Header Tabs: Pages | Layers */}
      <div className="p-2 border-b border-slate-200/80 bg-slate-50/70 flex items-center gap-1.5">
        <div className="flex-1 grid grid-cols-2 bg-slate-200/70 p-0.5 rounded-xl">
          <button
            onClick={() => setSidebarTab('pages')}
            className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[11px] font-bold transition-all ${
              sidebarTab === 'pages'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={12} />
            <span>Pages ({project.pages.length})</span>
          </button>
          <button
            onClick={() => setSidebarTab('layers')}
            className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[11px] font-bold transition-all ${
              sidebarTab === 'layers'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={12} />
            <span>Layers ({currentElements.length})</span>
          </button>
        </div>

        {sidebarTab === 'pages' && (
          <button
            onClick={addPage}
            className="p-1.5 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 rounded-lg transition active:scale-95"
            title="Add Blank Page"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Tab 1: Pages Thumbnails */}
      {sidebarTab === 'pages' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
          {project.pages.map((page, idx) => {
            const isActive = !isEditingMaster && idx === project.activePageIndex;
            const thumbW = 128;
            const thumbScale = thumbW / page.width;
            const thumbH = Math.min(165, Math.round(page.height * thumbScale));
            const effectiveScale = Math.min(thumbScale, thumbH / page.height);
            const masterEls =
              project.masterPage?.showOnAllPages !== false
                ? project.masterPage?.elements || []
                : [];

            return (
              <div
                key={page.id}
                onClick={() => {
                  setIsEditingMaster(false);
                  setActivePageIndex(idx);
                }}
                className={`group flex flex-col items-center cursor-pointer p-2 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-emerald-50/60 ring-2 ring-emerald-600 shadow-xs'
                    : 'hover:bg-slate-100/70'
                }`}
              >
                <div
                  className="bg-white border border-slate-200/90 shadow-sm rounded-lg relative overflow-hidden transition-all group-hover:scale-[1.02]"
                  style={{
                    width: `${Math.round(page.width * effectiveScale)}px`,
                    height: `${Math.round(page.height * effectiveScale)}px`,
                    backgroundColor: page.backgroundColor,
                  }}
                >
                  {/* Live Scaled Page Preview (shows real text, shapes, images, tables & master elements) */}
                  <div
                    className="pointer-events-none select-none"
                    style={{
                      width: `${page.width}px`,
                      height: `${page.height}px`,
                      transform: `scale(${effectiveScale})`,
                      transformOrigin: 'top left',
                      position: 'relative',
                    }}
                  >
                    {[...masterEls, ...page.elements]
                      .filter((el) => el.visible !== false)
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
                          <ElementRenderer
                            element={el}
                            isSelected={false}
                            pageNumber={idx + 1}
                            totalPages={project.pages.length}
                          />
                        </div>
                      ))}
                  </div>

                  <div className="absolute bottom-1 right-1 bg-slate-900/60 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full pointer-events-none">
                    {idx + 1}
                  </div>
                </div>

                <div className="flex items-center justify-between w-full mt-2 px-1 text-xs text-slate-600">
                  <span
                    className={`truncate font-medium text-[11px] ${
                      isActive ? 'text-emerald-800 font-bold' : ''
                    }`}
                  >
                    {page.name || `Page ${idx + 1}`}
                  </span>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePageIndex(idx);
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
                          setActivePageIndex(idx);
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
      )}

      {/* Tab 2: Layers Inspector */}
      {sidebarTab === 'layers' && (
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {sortedLayers.length === 0 ? (
            <div className="text-center text-[11px] text-slate-400 py-8 px-2">
              No objects on this {isEditingMaster ? 'master page' : 'page'} yet.
            </div>
          ) : (
            sortedLayers.map((el) => {
              const isSelected = selectedElementIds.includes(el.id);
              const isHidden = el.visible === false;

              return (
                <div
                  key={el.id}
                  onClick={(e) => selectElement(el.id, e.shiftKey || e.ctrlKey)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer text-[11px] transition-all border ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold shadow-2xs'
                      : 'bg-white border-slate-200/70 hover:bg-slate-50 text-slate-700'
                  } ${isHidden ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="flex-shrink-0">{getLayerIcon(el)}</span>
                    <span className="truncate">{getLayerLabel(el)}</span>
                  </div>

                  <div className="flex items-center gap-1 ml-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleElementLock(el.id);
                      }}
                      className={`p-1 rounded-md transition ${
                        el.locked
                          ? 'text-amber-600 bg-amber-50'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title={el.locked ? 'Unlock Object' : 'Lock Object'}
                    >
                      {el.locked ? <Lock size={11} /> : <Unlock size={11} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleElementVisibility(el.id);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title={isHidden ? 'Show Object' : 'Hide Object'}
                    >
                      {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Bottom Interactive Master Page Controls */}
      <div className="p-2.5 border-t border-slate-200/80 bg-slate-50/80 text-[11px] flex items-center justify-between gap-1.5">
        <button
          onClick={() => setIsEditingMaster(!isEditingMaster)}
          className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition ${
            isEditingMaster
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
          }`}
          title="Edit Master Page (headers, footers, page numbers applied to all pages)"
        >
          <Layers size={11} />
          <span>{isEditingMaster ? 'Exit Master' : 'Master Page'}</span>
        </button>

        <button
          onClick={toggleMasterPageVisibility}
          className={`p-1.5 rounded-lg border transition ${
            project.masterPage?.showOnAllPages !== false
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-white border-slate-200 text-slate-400'
          }`}
          title="Toggle Master Page Elements Visibility"
        >
          {project.masterPage?.showOnAllPages !== false ? (
            <Eye size={12} />
          ) : (
            <EyeOff size={12} />
          )}
        </button>
      </div>
    </div>
  );
};
