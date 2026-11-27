import React, { useEffect, useMemo, useState } from 'react';
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
  PanelLeftClose,
  PanelLeftOpen,
  GripVertical,
  ChevronRight,
  ChevronDown,
  Folder,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  ArrowDownToLine,
  Group,
  Ungroup,
  Edit3,
  Search,
} from 'lucide-react';
import { PublisherElement, Page } from '../../types/publisher';
import { ElementRenderer } from '../canvas/ElementRenderer';
import { buildPatternBackgroundStyle } from '../../utils/patternGenerator';
import { MASTER_PAGE_PRESETS } from '../../constants/masterPresets';
import { buildBookletSheets } from '../../utils/printUtils';
import { useResizablePanel, useWindowWidth } from '../../hooks/useResizablePanel';

const MemoThumbnailElements = React.memo(
  ({
    masterEls,
    pageElements,
    pageNumber,
    totalPages,
  }: {
    masterEls: PublisherElement[];
    pageElements: PublisherElement[];
    pageNumber: number;
    totalPages: number;
  }) => (
    <>
      {[...masterEls, ...pageElements]
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
              pageNumber={pageNumber}
              totalPages={totalPages}
            />
          </div>
        ))}
    </>
  )
);

export const PageThumbnails: React.FC = () => {
  const {
    project,
    workspaceMode,
    activePage,
    selectedElementIds,
    isLeftPanelOpen,
    setIsLeftPanelOpen,
    isEditingMaster,
    setIsEditingMaster,
    toggleMasterPageVisibility,
    masterPages,
    activeMasterId,
    getMasterElementsForPage,
    addMasterPage,
    selectMasterPage,
    renameMasterPage,
    deleteMasterPage,
    assignMasterToPage,
    applyMasterPreset,
    setActivePageIndex,
    addPage,
    addBookletSpread,
    padToBookletMultiple,
    reorderPage,
    renamePage,
    duplicateActivePage,
    deleteActivePage,
    selectElement,
    selectElements,
    toggleElementLock,
    toggleElementVisibility,
    setElementsVisibility,
    setElementsLocked,
    renameElement,
    reorderElementLayer,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    groupSelected,
    ungroupSelected,
    duplicateSelectedElements,
    deleteSelectedElements,
  } = usePublisher();

  const [sidebarTab, setSidebarTab] = useState<'pages' | 'layers'>(() =>
    workspaceMode === 'designer' ? 'layers' : 'pages'
  );

  useEffect(() => {
    setSidebarTab(workspaceMode === 'designer' ? 'layers' : 'pages');
  }, [workspaceMode]);
  const [pagesViewMode, setPagesViewMode] = useState<'list' | 'spreads' | 'sheets'>('list');
  const [layerSearch, setLayerSearch] = useState('');
  const [layerFilter, setLayerFilter] = useState<'all' | 'text' | 'image' | 'shape' | 'groups'>('all');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dropTargetLayerId, setDropTargetLayerId] = useState<string | null>(null);
  const [draggedPageIdx, setDraggedPageIdx] = useState<number | null>(null);
  const [dropTargetPageIdx, setDropTargetPageIdx] = useState<number | null>(null);
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const [renamePageDraft, setRenamePageDraft] = useState('');
  const [renamingMasterId, setRenamingMasterId] = useState<string | null>(null);
  const [renameMasterDraft, setRenameMasterDraft] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(MASTER_PAGE_PRESETS[0]?.id || 'booklet-footer');
  const [pageCtxMenu, setPageCtxMenu] = useState<{
    pageId: string;
    index: number;
    x: number;
    y: number;
  } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [layerCtxMenu, setLayerCtxMenu] = useState<{
    el: PublisherElement;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const closeMenu = () => {
      setLayerCtxMenu(null);
      setPageCtxMenu(null);
    };
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const activeMaster = masterPages.find((m) => m.id === activeMasterId) || masterPages[0];
  const currentElements: PublisherElement[] = isEditingMaster
    ? activeMaster?.elements || []
    : activePage.elements;

  const sortedLayers = [...currentElements].sort((a, b) => b.zIndex - a.zIndex);

  const getLayerLabel = (el: PublisherElement): string => {
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
      default:
        return 'Connector';
    }
  };

  const getLayerIcon = (el: PublisherElement) => {
    switch (el.type) {
      case 'text':
        return <Type size={12} className="text-[#5c4bb8]" />;
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

  const windowWidth = useWindowWidth();
  const isNarrowViewport = windowWidth < 1024;
  const {
    width: panelWidth,
    isDragging: isResizing,
    onMouseDown: handleResizeStart,
    resetWidth,
  } = useResizablePanel({
    storageKey: 'studiopress_left_panel_width',
    defaultWidth: 224,
    minWidth: 180,
    maxWidth: 360,
    edge: 'right',
  });

  if (!isLeftPanelOpen) {
    return (
      <div className="w-9 bg-white border-r border-[#e5e9ee] flex flex-col items-center py-2.5 gap-3 h-full select-none flex-shrink-0 z-20">
        <button
          onClick={() => setIsLeftPanelOpen(true)}
          className="p-1.5 rounded-[8px] text-[#4a5661] hover:text-[#5c4bb8] hover:bg-[#f4f2ff] transition cursor-pointer"
          title="Expand Pages & Layers Panel"
        >
          <PanelLeftOpen size={15} />
        </button>
        <div
          onClick={() => setIsLeftPanelOpen(true)}
          className="text-[10px] font-bold tracking-[0.09em] text-[#6a7682] uppercase cursor-pointer hover:text-[#5c4bb8] transition"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Pages & Layers
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ width: panelWidth }}
      className={`bg-white border-r border-[#e5e9ee] flex flex-col h-full select-none flex-shrink-0 ${
        isNarrowViewport ? 'absolute left-0 top-0 bottom-0 z-30 shadow-[0_8px_28px_rgba(28,44,58,0.12)]' : 'relative z-20'
      } ${isResizing ? '' : 'transition-[width] duration-150'}`}
    >
      {/* Drag-to-resize handle on right edge */}
      <div
        onMouseDown={handleResizeStart}
        onDoubleClick={resetWidth}
        title="Drag to resize • Double-click to reset"
        className={`absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize z-30 transition-colors ${
          isResizing ? 'bg-[#6e56cf]' : 'hover:bg-[#6e56cf]/50'
        }`}
      />
      {/* Segmented Header Tabs: Pages | Layers */}
      <div className="px-3 py-2.5 border-b border-[#e5e9ee] bg-white flex items-center gap-1.5">
        <div className="flex-1 grid grid-cols-2 bg-[#f3f5f7] p-0.5 rounded-[8px]">
          <button
            onClick={() => setSidebarTab('pages')}
            className={`flex items-center justify-center gap-1 py-1 rounded-[6px] text-[11px] font-semibold transition-all cursor-pointer ${
              sidebarTab === 'pages'
                ? 'bg-[#efeafd] text-[#5c4bb8]'
                : 'text-[#4a5661] hover:text-[#161a22]'
            }`}
          >
            <FileText size={11} />
            <span>Pages</span>
          </button>
          <button
            onClick={() => setSidebarTab('layers')}
            className={`flex items-center justify-center gap-1 py-1 rounded-[6px] text-[11px] font-semibold transition-all cursor-pointer ${
              sidebarTab === 'layers'
                ? 'bg-[#efeafd] text-[#5c4bb8]'
                : 'text-[#4a5661] hover:text-[#161a22]'
            }`}
          >
            <Layers size={11} />
            <span>Layers</span>
          </button>
        </div>

        {sidebarTab === 'pages' && (
          <button
            onClick={addPage}
            className="p-1.5 hover:bg-[#f4f2ff] hover:text-[#5c4bb8] text-[#4a5661] rounded-[8px] transition active:scale-95 cursor-pointer"
            title="Add Blank Page"
          >
            <Plus size={14} />
          </button>
        )}

        <button
          onClick={() => setIsLeftPanelOpen(false)}
          className="p-1 hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 rounded-lg transition"
          title="Collapse Left Panel"
        >
          <PanelLeftClose size={14} />
        </button>
      </div>

      {/* Tab 1: Pages Thumbnails */}
      {sidebarTab === 'pages' && (() => {
        const renderThumbCard = (page: Page, idx: number, compact = false) => {
          const isActive = !isEditingMaster && idx === project.activePageIndex;
          const thumbW = compact ? 74 : 128;
          const thumbScale = thumbW / page.width;
          const thumbH = Math.min(compact ? 98 : 165, Math.round(page.height * thumbScale));
          const effectiveScale = Math.min(thumbScale, thumbH / page.height);
          const masterEls = getMasterElementsForPage(page);
          const total = project.pages.length;
          const roleLabel =
            idx === 0
              ? 'Cover'
              : total >= 4 && total % 2 === 0 && idx === total - 1
              ? 'Back'
              : `P${idx + 1}`;
          const assignedMaster = page.hideMaster
            ? null
            : masterPages.find((m) => m.id === (page.masterId || masterPages[0]?.id));
          const isDropTarget = dropTargetPageIdx === idx && draggedPageIdx !== idx;

          return (
            <div
              key={`${page.id}-${compact ? 'c' : 'f'}`}
              draggable
              onDragStart={(e) => {
                setDraggedPageIdx(idx);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedPageIdx !== null && draggedPageIdx !== idx) {
                  setDropTargetPageIdx(idx);
                }
              }}
              onDragLeave={() => {
                if (dropTargetPageIdx === idx) setDropTargetPageIdx(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedPageIdx !== null && draggedPageIdx !== idx) {
                  reorderPage(draggedPageIdx, idx);
                }
                setDraggedPageIdx(null);
                setDropTargetPageIdx(null);
              }}
              onDragEnd={() => {
                setDraggedPageIdx(null);
                setDropTargetPageIdx(null);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActivePageIndex(idx);
                setPageCtxMenu({
                  pageId: page.id,
                  index: idx,
                  x: Math.min(e.clientX, 180),
                  y: Math.min(e.clientY, window.innerHeight - 260),
                });
              }}
              onClick={() => {
                setIsEditingMaster(false);
                setActivePageIndex(idx);
              }}
              className={`group flex flex-col items-center cursor-pointer ${
                compact ? 'p-1 rounded-xl' : 'p-2 rounded-2xl'
              } transition-all ${
                isActive
                  ? 'bg-[#efeafd] ring-2 ring-indigo-600 shadow-xs'
                  : 'hover:bg-slate-100/70'
              } ${isDropTarget ? 'border-t-2 border-indigo-600' : ''}`}
            >
              <div
                className="bg-white border border-slate-200/90 shadow-sm rounded-lg relative overflow-hidden transition-all group-hover:scale-[1.02]"
                style={{
                  width: `${Math.round(page.width * effectiveScale)}px`,
                  height: `${Math.round(page.height * effectiveScale)}px`,
                  backgroundColor: page.backgroundColor,
                  ...buildPatternBackgroundStyle(page.backgroundPattern, effectiveScale),
                }}
              >
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
                  <MemoThumbnailElements
                    masterEls={masterEls}
                    pageElements={page.elements}
                    pageNumber={idx + 1}
                    totalPages={project.pages.length}
                  />
                </div>

                <div className="absolute top-1 left-1 flex items-center gap-0.5 pointer-events-none">
                  <span
                    className={`${compact ? 'text-[7px] px-1' : 'text-[8px] px-1.5'} py-0.2 font-bold rounded-full ${
                      roleLabel === 'Cover'
                        ? 'bg-[#6e56cf]/85 text-white'
                        : roleLabel === 'Back'
                        ? 'bg-[#6e56cf]/85 text-white'
                        : 'bg-slate-900/55 text-white'
                    }`}
                  >
                    {roleLabel}
                  </span>
                  {!compact && page.hideMaster && (
                    <span className="text-[7.5px] font-bold px-1 py-0.2 rounded-full bg-amber-500/85 text-white">
                      No Master
                    </span>
                  )}
                  {!compact && !page.hideMaster && assignedMaster && masterPages.length > 1 && (
                    <span className="text-[7.5px] font-bold px-1 py-0.2 rounded-full bg-slate-700/75 text-white">
                      {assignedMaster.name}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-1 right-1 bg-slate-900/60 backdrop-blur-xs text-white text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded-full pointer-events-none">
                  {idx + 1}
                </div>
              </div>

              {!compact && (
                <div className="flex items-center justify-between w-full mt-2 px-1 text-xs text-slate-600">
                  {renamingPageId === page.id ? (
                    <input
                      autoFocus
                      value={renamePageDraft}
                      onChange={(e) => setRenamePageDraft(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => {
                        if (renamePageDraft.trim()) renamePage(page.id, renamePageDraft);
                        setRenamingPageId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (renamePageDraft.trim()) renamePage(page.id, renamePageDraft);
                          setRenamingPageId(null);
                        } else if (e.key === 'Escape') {
                          setRenamingPageId(null);
                        }
                      }}
                      className="flex-1 bg-white border border-[#d3c9f9] rounded px-1 py-0.5 text-[10.5px] outline-none"
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setRenamingPageId(page.id);
                        setRenamePageDraft(page.name || `Page ${idx + 1}`);
                      }}
                      className={`truncate font-medium text-[11px] ${
                        isActive ? 'text-[#5c4bb8] font-bold' : ''
                      }`}
                      title="Click to jump to page, double-click to rename, drag to reorder"
                    >
                      {page.name || `Page ${idx + 1}`}
                    </span>
                  )}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePageIndex(idx);
                        duplicateActivePage();
                      }}
                      className="p-1 hover:bg-slate-200/80 rounded-md text-slate-600 hover:text-[#5c4bb8] transition"
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
              )}
            </div>
          );
        };

        // Build Reading Spreads & Booklet Print Sheet Pairs
        const spreadPairs: { label: string; items: { page: Page; index: number }[] }[] = [];
        if (project.pages.length > 0) {
          spreadPairs.push({ label: 'Front Cover', items: [{ page: project.pages[0], index: 0 }] });
          for (let i = 1; i < project.pages.length; i += 2) {
            if (i === project.pages.length - 1) {
              spreadPairs.push({ label: 'Back Cover', items: [{ page: project.pages[i], index: i }] });
            } else {
              spreadPairs.push({
                label: `Spread P${i + 1}–${i + 2}`,
                items: [
                  { page: project.pages[i], index: i },
                  { page: project.pages[i + 1], index: i + 1 },
                ],
              });
            }
          }
        }
        const bookletPrintSheets = buildBookletSheets(project.pages, 'both');

        return (
          <div className="flex-1 overflow-y-auto p-3 space-y-3 relative">
            {/* View Options + Booklet Quick Tools Bar */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-1.5 space-y-1.5">
              <div className="grid grid-cols-3 gap-0.5 bg-slate-200/70 p-0.5 rounded-lg">
                {(
                  [
                    { id: 'list', label: 'List' },
                    { id: 'spreads', label: 'Spreads' },
                    { id: 'sheets', label: 'Print Pairs' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPagesViewMode(m.id)}
                    className={`py-1 rounded-md text-[9.5px] font-bold transition cursor-pointer ${
                      pagesViewMode === m.id
                        ? 'bg-white text-[#5c4bb8] shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-[9.5px] font-bold text-slate-500 px-1">
                <span>{project.pages.length} {project.pages.length === 1 ? 'page' : 'pages'}</span>
                <span className="text-[#5c4bb8]">
                  {Math.ceil(project.pages.length / 4)} booklet {Math.ceil(project.pages.length / 4) === 1 ? 'sheet' : 'sheets'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={addBookletSpread}
                  className="py-1 px-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#d3c9f9] hover:bg-[#efeafd] text-[9.5px] font-bold text-slate-700 hover:text-[#5c4bb8] transition"
                  title="Add 2 facing pages (1 spread)"
                >
                  +2 Spread
                </button>
                <button
                  type="button"
                  onClick={padToBookletMultiple}
                  disabled={project.pages.length % 4 === 0}
                  className={`py-1 px-1.5 rounded-lg border text-[9.5px] font-bold transition ${
                    project.pages.length % 4 === 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
                      : 'bg-white border-slate-200 hover:border-[#d3c9f9] hover:bg-[#efeafd] text-slate-700 hover:text-[#5c4bb8]'
                  }`}
                  title="Pad pages to a multiple of 4 for saddle-stitch booklet printing"
                >
                  {project.pages.length % 4 === 0 ? '4× Ready ✓' : 'Pad 4×'}
                </button>
              </div>
            </div>

            {pagesViewMode === 'list' &&
              project.pages.map((page, idx) => renderThumbCard(page, idx, false))}

            {pagesViewMode === 'spreads' &&
              spreadPairs.map((sp, spIdx) => (
                <div
                  key={spIdx}
                  className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-1.5 space-y-1"
                >
                  <div className="text-[9.5px] font-bold text-slate-500 text-center">
                    {sp.label}
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    {sp.items.map((item) => renderThumbCard(item.page, item.index, true))}
                  </div>
                </div>
              ))}

            {pagesViewMode === 'sheets' &&
              bookletPrintSheets.map((bs, bsIdx) => (
                <div
                  key={bsIdx}
                  className="bg-[#efeafd] border border-[#d3c9f9]/70 rounded-xl p-1.5 space-y-1"
                >
                  <div className="flex items-center justify-between text-[9px] font-bold text-[#5c4bb8] px-1">
                    <span>
                      Sheet {bs.sheetNumber} • {bs.side}
                    </span>
                    <span className="font-mono">
                      {bs.leftPageNum ? `P${bs.leftPageNum}` : 'Blank'} |{' '}
                      {bs.rightPageNum ? `P${bs.rightPageNum}` : 'Blank'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 place-items-center">
                    {bs.leftPage && bs.leftPageNum ? (
                      renderThumbCard(bs.leftPage, bs.leftPageNum - 1, true)
                    ) : (
                      <div className="w-[74px] h-[94px] border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[9px] text-slate-400">
                        Blank
                      </div>
                    )}
                    {bs.rightPage && bs.rightPageNum ? (
                      renderThumbCard(bs.rightPage, bs.rightPageNum - 1, true)
                    ) : (
                      <div className="w-[74px] h-[94px] border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[9px] text-slate-400">
                        Blank
                      </div>
                    )}
                  </div>
                </div>
              ))}

            {pageCtxMenu && (() => {
              const targetPg = project.pages[pageCtxMenu.index];
              if (!targetPg) return null;
              return (
                <div
                  style={{ top: `${pageCtxMenu.y}px`, left: `${pageCtxMenu.x}px` }}
                  onClick={(e) => e.stopPropagation()}
                  className="fixed z-50 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1 px-1 text-[11px] text-slate-700"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingPageId(targetPg.id);
                      setRenamePageDraft(targetPg.name || `Page ${pageCtxMenu.index + 1}`);
                      setPageCtxMenu(null);
                    }}
                    className="w-full px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium"
                  >
                    <Edit3 size={11} className="text-slate-500" />
                    <span>Rename Page</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePageIndex(pageCtxMenu.index);
                      duplicateActivePage();
                      setPageCtxMenu(null);
                    }}
                    className="w-full px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium"
                  >
                    <Copy size={11} className="text-slate-500" />
                    <span>Duplicate</span>
                  </button>
                  {pageCtxMenu.index > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        reorderPage(pageCtxMenu.index, pageCtxMenu.index - 1);
                        setPageCtxMenu(null);
                      }}
                      className="w-full px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium"
                    >
                      <ArrowUp size={11} className="text-slate-500" />
                      <span>Move Up</span>
                    </button>
                  )}
                  {pageCtxMenu.index < project.pages.length - 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        reorderPage(pageCtxMenu.index, pageCtxMenu.index + 1);
                        setPageCtxMenu(null);
                      }}
                      className="w-full px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium"
                    >
                      <ArrowDown size={11} className="text-slate-500" />
                      <span>Move Down</span>
                    </button>
                  )}
                  <div className="my-1 border-t border-slate-100" />
                  <div className="px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                    Assign Master
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      assignMasterToPage(targetPg.id, null);
                      setPageCtxMenu(null);
                    }}
                    className={`w-full px-2 py-1 rounded-lg hover:bg-amber-50 flex items-center justify-between font-medium ${
                      targetPg.hideMaster ? 'text-amber-700 font-bold bg-amber-50/70' : ''
                    }`}
                  >
                    <span>None (Cover)</span>
                    {targetPg.hideMaster && <span>✓</span>}
                  </button>
                  {masterPages.map((mp) => {
                    const isAssigned = !targetPg.hideMaster && (targetPg.masterId || masterPages[0]?.id) === mp.id;
                    return (
                      <button
                        key={mp.id}
                        type="button"
                        onClick={() => {
                          assignMasterToPage(targetPg.id, mp.id);
                          setPageCtxMenu(null);
                        }}
                        className={`w-full px-2 py-1 rounded-lg hover:bg-[#efeafd] flex items-center justify-between font-medium ${
                          isAssigned ? 'text-[#5c4bb8] font-bold bg-[#efeafd]' : ''
                        }`}
                      >
                        <span className="truncate">{mp.name}</span>
                        {isAssigned && <span>✓</span>}
                      </button>
                    );
                  })}
                  {project.pages.length > 1 && (
                    <>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        type="button"
                        onClick={() => {
                          setActivePageIndex(pageCtxMenu.index);
                          deleteActivePage();
                          setPageCtxMenu(null);
                        }}
                        className="w-full px-2 py-1 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-semibold"
                      >
                        <Trash2 size={11} />
                        <span>Delete Page</span>
                      </button>
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* Tab 2: Layers Inspector */}
      {sidebarTab === 'layers' && (() => {
        const q = layerSearch.trim().toLowerCase();
        const filteredLayers = sortedLayers.filter((el) => {
          if (layerFilter === 'text' && el.type !== 'text') return false;
          if (layerFilter === 'image' && el.type !== 'image') return false;
          if (layerFilter === 'shape' && el.type !== 'shape') return false;
          if (layerFilter === 'groups' && !el.groupId) return false;
          if (q) {
            const label = getLayerLabel(el).toLowerCase();
            return label.includes(q) || el.type.toLowerCase().includes(q);
          }
          return true;
        });

        const hiddenIds = currentElements.filter((el) => el.visible === false).map((el) => el.id);
        const lockedIds = currentElements.filter((el) => el.locked).map((el) => el.id);
        const hasGroupedSelection = selectedElementIds.some((id) =>
          Boolean(currentElements.find((el) => el.id === id)?.groupId)
        );

        // Build display rows (collapsible group headers + child/ungrouped rows)
        type LayerRow =
          | { kind: 'group'; groupId: string; members: PublisherElement[] }
          | { kind: 'item'; el: PublisherElement; inGroup: boolean };

        const rows: LayerRow[] = [];
        const seenGroups = new Set<string>();
        for (const el of filteredLayers) {
          if (el.groupId) {
            if (!seenGroups.has(el.groupId)) {
              seenGroups.add(el.groupId);
              const members = filteredLayers.filter((m) => m.groupId === el.groupId);
              rows.push({ kind: 'group', groupId: el.groupId, members });
              if (!collapsedGroups[el.groupId]) {
                members.forEach((m) => rows.push({ kind: 'item', el: m, inGroup: true }));
              }
            }
          } else {
            rows.push({ kind: 'item', el, inGroup: false });
          }
        }

        const commitLayerRename = () => {
          if (renamingId && renameDraft.trim()) {
            renameElement(renamingId, renameDraft.trim());
          }
          setRenamingId(null);
        };

        return (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search & Type Filter Header */}
            <div className="p-2 border-b border-slate-200/80 space-y-1.5 bg-slate-50/60">
              <div className="relative">
                <Search
                  size={11}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={layerSearch}
                  onChange={(e) => setLayerSearch(e.target.value)}
                  placeholder="Search layers..."
                  className="w-full pl-6 pr-2 py-1 rounded-lg border border-slate-200 bg-white text-[10.5px] outline-none focus:border-[#d3c9f9]"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'text', label: 'Text' },
                    { id: 'image', label: 'Img' },
                    { id: 'shape', label: 'Shape' },
                    { id: 'groups', label: 'Groups' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setLayerFilter(f.id)}
                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition cursor-pointer ${
                      layerFilter === f.id
                        ? 'bg-[#6e56cf] text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {(hiddenIds.length > 0 || lockedIds.length > 0) && (
                <div className="flex items-center gap-1 pt-0.5">
                  {hiddenIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setElementsVisibility(hiddenIds, true)}
                      className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9.5px] font-bold hover:bg-emerald-100 transition cursor-pointer"
                    >
                      Show All ({hiddenIds.length})
                    </button>
                  )}
                  {lockedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setElementsLocked(lockedIds, false)}
                      className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[9.5px] font-bold hover:bg-amber-100 transition cursor-pointer"
                    >
                      Unlock All ({lockedIds.length})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Layers List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {rows.length === 0 ? (
                <div className="text-center text-[11px] text-slate-400 py-8 px-2">
                  {sortedLayers.length === 0
                    ? `No objects on this ${isEditingMaster ? 'master page' : 'page'} yet.`
                    : 'No matching layers.'}
                </div>
              ) : (
                rows.map((row) => {
                  if (row.kind === 'group') {
                    const isCollapsed = Boolean(collapsedGroups[row.groupId]);
                    const memberIds = row.members.map((m) => m.id);
                    const allSelected = memberIds.every((id) => selectedElementIds.includes(id));
                    const allHidden = row.members.every((m) => m.visible === false);
                    const allLocked = row.members.every((m) => m.locked);
                    const isCollageGroup = row.groupId.startsWith('grp-collage-');

                    return (
                      <div
                        key={`grp-${row.groupId}`}
                        onClick={() => selectElements(memberIds)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-xl cursor-pointer text-[10.5px] border transition ${
                          allSelected
                            ? 'bg-[#efeafd]/80 border-[#d3c9f9] text-indigo-950 font-bold'
                            : 'bg-slate-100/80 border-slate-200/80 hover:bg-slate-200/60 text-slate-700 font-semibold'
                        }`}
                      >
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCollapsedGroups((prev) => ({
                                ...prev,
                                [row.groupId]: !prev[row.groupId],
                              }));
                            }}
                            className="p-0.5 rounded hover:bg-slate-300/60 text-slate-500"
                          >
                            {isCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                          </button>
                          <Folder size={11} className="text-[#5c4bb8] flex-shrink-0" />
                          <span className="truncate">
                            {isCollageGroup ? 'Collage' : 'Group'} ({row.members.length})
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setElementsLocked(memberIds, !allLocked);
                            }}
                            className={`p-1 rounded-md transition ${
                              allLocked ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-slate-700'
                            }`}
                            title={allLocked ? 'Unlock Group' : 'Lock Group'}
                          >
                            {allLocked ? <Lock size={10} /> : <Unlock size={10} />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setElementsVisibility(memberIds, allHidden);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 transition"
                            title={allHidden ? 'Show Group' : 'Hide Group'}
                          >
                            {allHidden ? <EyeOff size={10} /> : <Eye size={10} />}
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const { el, inGroup } = row;
                  const isSelected = selectedElementIds.includes(el.id);
                  const isHidden = el.visible === false;
                  const isDropTarget = dropTargetLayerId === el.id && draggedLayerId !== el.id;
                  const isRenaming = renamingId === el.id;

                  return (
                    <div
                      key={el.id}
                      draggable={!isRenaming}
                      onDragStart={() => setDraggedLayerId(el.id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dropTargetLayerId !== el.id) setDropTargetLayerId(el.id);
                      }}
                      onDragLeave={() => {
                        if (dropTargetLayerId === el.id) setDropTargetLayerId(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedLayerId && draggedLayerId !== el.id) {
                          reorderElementLayer(draggedLayerId, el.id);
                        }
                        setDraggedLayerId(null);
                        setDropTargetLayerId(null);
                      }}
                      onDragEnd={() => {
                        setDraggedLayerId(null);
                        setDropTargetLayerId(null);
                      }}
                      onClick={(e) => selectElement(el.id, e.shiftKey || e.ctrlKey)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(el.id);
                        setRenameDraft(getLayerLabel(el));
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!selectedElementIds.includes(el.id)) {
                          selectElement(el.id, false);
                        }
                        setLayerCtxMenu({
                          el,
                          x: Math.min(window.innerWidth - 190, e.clientX),
                          y: Math.min(window.innerHeight - 280, e.clientY),
                        });
                      }}
                      className={`group flex items-center justify-between px-1.5 py-1.5 rounded-xl cursor-pointer text-[11px] transition-all border ${
                        inGroup ? 'ml-3' : ''
                      } ${
                        isDropTarget ? 'border-t-2 border-t-indigo-600' : ''
                      } ${
                        isSelected
                          ? 'bg-[#efeafd] border-[#d3c9f9] text-indigo-900 font-semibold shadow-2xs'
                          : 'bg-white border-slate-200/70 hover:bg-slate-50 text-slate-700'
                      } ${isHidden ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <GripVertical
                          size={11}
                          className="text-slate-300 group-hover:text-slate-500 cursor-grab flex-shrink-0"
                        />
                        <span className="flex-shrink-0">{getLayerIcon(el)}</span>
                        {isRenaming ? (
                          <input
                            type="text"
                            autoFocus
                            value={renameDraft}
                            onChange={(e) => setRenameDraft(e.target.value)}
                            onBlur={commitLayerRename}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitLayerRename();
                              else if (e.key === 'Escape') setRenamingId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-1 py-0 text-[10.5px] bg-white border border-[#d3c9f9] rounded outline-none"
                          />
                        ) : (
                          <span className="truncate">{getLayerLabel(el)}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5 ml-1 flex-shrink-0">
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

            {/* Bottom Layer Selection Quick Action Bar */}
            {selectedElementIds.length > 0 && (
              <div className="px-2 py-1.5 border-t border-slate-200/80 bg-slate-50 flex items-center justify-between gap-1">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={bringForward}
                    className="p-1 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-600"
                    title="Bring Forward"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={sendBackward}
                    className="p-1 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-600"
                    title="Send Backward"
                  >
                    <ArrowDown size={12} />
                  </button>
                  {selectedElementIds.length >= 2 && (
                    <button
                      type="button"
                      onClick={groupSelected}
                      className="p-1 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-[#5c4bb8]"
                      title="Group Selected"
                    >
                      <Group size={12} />
                    </button>
                  )}
                  {hasGroupedSelection && (
                    <button
                      type="button"
                      onClick={ungroupSelected}
                      className="p-1 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-600"
                      title="Ungroup"
                    >
                      <Ungroup size={12} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={duplicateSelectedElements}
                    className="p-1 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-600"
                    title="Duplicate Selected"
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={deleteSelectedElements}
                    className="p-1 rounded-lg hover:bg-rose-50 text-rose-600"
                    title="Delete Selected"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Right-Click Layer Context Menu */}
            {layerCtxMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ left: `${layerCtxMenu.x}px`, top: `${layerCtxMenu.y}px` }}
                className="fixed w-44 bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 z-50 text-[11px] text-slate-700 space-y-0.5"
              >
                <button
                  type="button"
                  onClick={() => {
                    setRenamingId(layerCtxMenu.el.id);
                    setRenameDraft(getLayerLabel(layerCtxMenu.el));
                    setLayerCtxMenu(null);
                  }}
                  className="w-full px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium"
                >
                  <Edit3 size={11} className="text-slate-500" />
                  <span>Rename</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    duplicateSelectedElements();
                    setLayerCtxMenu(null);
                  }}
                  className="w-full px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium"
                >
                  <Copy size={11} className="text-slate-500" />
                  <span>Duplicate</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sameTypeIds = currentElements
                      .filter((m) => m.type === layerCtxMenu.el.type)
                      .map((m) => m.id);
                    selectElements(sameTypeIds);
                    setLayerCtxMenu(null);
                  }}
                  className="w-full px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium"
                >
                  <Layers size={11} className="text-[#5c4bb8]" />
                  <span>Select Same Type</span>
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => {
                    bringToFront();
                    setLayerCtxMenu(null);
                  }}
                  className="w-full px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium"
                >
                  <ArrowUpToLine size={11} className="text-slate-500" />
                  <span>Bring to Front</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sendToBack();
                    setLayerCtxMenu(null);
                  }}
                  className="w-full px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium"
                >
                  <ArrowDownToLine size={11} className="text-slate-500" />
                  <span>Send to Back</span>
                </button>
                {selectedElementIds.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      groupSelected();
                      setLayerCtxMenu(null);
                    }}
                    className="w-full px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium"
                  >
                    <Group size={11} className="text-[#5c4bb8]" />
                    <span>Group Selected</span>
                  </button>
                )}
                {layerCtxMenu.el.groupId && (
                  <button
                    type="button"
                    onClick={() => {
                      ungroupSelected();
                      setLayerCtxMenu(null);
                    }}
                    className="w-full px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium"
                  >
                    <Ungroup size={11} className="text-slate-500" />
                    <span>Ungroup</span>
                  </button>
                )}
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => {
                    deleteSelectedElements();
                    setLayerCtxMenu(null);
                  }}
                  className="w-full px-2 py-1 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-semibold"
                >
                  <Trash2 size={11} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Master Pages Drawer (visible when editing Master) */}
      {isEditingMaster && (
        <div className="p-2.5 border-t border-amber-200 bg-amber-50/70 space-y-2 text-[10.5px]">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 uppercase tracking-wider text-[9.5px]">
              Master Pages ({masterPages.length})
            </span>
            <button
              type="button"
              onClick={() => addMasterPage()}
              className="px-1.5 py-0.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-bold text-[9.5px] flex items-center gap-0.5 transition"
              title="Add New Master Page"
            >
              <Plus size={10} />
              <span>New</span>
            </button>
          </div>

          <div className="space-y-1 max-h-28 overflow-y-auto">
            {masterPages.map((mp) => {
              const isSelectedMaster = mp.id === activeMasterId;
              return (
                <div
                  key={mp.id}
                  onClick={() => selectMasterPage(mp.id)}
                  className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition ${
                    isSelectedMaster
                      ? 'bg-amber-500 text-white font-bold shadow-2xs'
                      : 'bg-white/80 hover:bg-white text-slate-700 border border-amber-200/70'
                  }`}
                >
                  {renamingMasterId === mp.id ? (
                    <input
                      autoFocus
                      value={renameMasterDraft}
                      onChange={(e) => setRenameMasterDraft(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => {
                        if (renameMasterDraft.trim()) renameMasterPage(mp.id, renameMasterDraft);
                        setRenamingMasterId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (renameMasterDraft.trim()) renameMasterPage(mp.id, renameMasterDraft);
                          setRenamingMasterId(null);
                        } else if (e.key === 'Escape') {
                          setRenamingMasterId(null);
                        }
                      }}
                      className="flex-1 bg-white text-slate-800 rounded px-1 py-0 text-[10px] outline-none"
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setRenamingMasterId(mp.id);
                        setRenameMasterDraft(mp.name);
                      }}
                      className="truncate flex-1"
                      title="Double-click to rename master"
                    >
                      {mp.name} ({mp.elements.length})
                    </span>
                  )}
                  {masterPages.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMasterPage(mp.id);
                      }}
                      className={`p-0.5 rounded transition ${
                        isSelectedMaster
                          ? 'hover:bg-amber-600 text-white/90'
                          : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                      }`}
                      title="Delete Master Page"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-1 pt-0.5">
            <select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              className="flex-1 bg-white border border-amber-200 rounded-lg px-1.5 py-1 text-[9.5px] font-medium text-slate-700 outline-none"
            >
              {MASTER_PAGE_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => applyMasterPreset(selectedPresetId)}
              className="px-2 py-1 rounded-lg bg-[#6e56cf] hover:bg-[#5c4bb8] text-white font-bold text-[9.5px] transition whitespace-nowrap"
              title="Apply selected preset elements to this Master Page"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Bottom Interactive Master Page Controls */}
      <div className="p-2.5 border-t border-slate-200/80 bg-slate-50/80 text-[11px] flex items-center justify-between gap-1.5">
        <button
          onClick={() => setIsEditingMaster(!isEditingMaster)}
          className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition ${
            isEditingMaster
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-[#efeafd] hover:text-[#5c4bb8]'
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
              ? 'bg-[#efeafd] border-[#d3c9f9] text-[#5c4bb8]'
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
