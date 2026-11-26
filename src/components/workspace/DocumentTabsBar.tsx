import React, { useEffect, useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import {
  ChevronLeft,
  ChevronRight,
  List,
  Plus,
  X,
  LayoutTemplate,
  Copy,
  Edit3,
  ArrowLeft,
  ArrowRight,
  Trash2,
} from 'lucide-react';

const TAB_COLORS = [
  { label: 'Default', color: undefined },
  { label: 'Emerald', color: '#059669' },
  { label: 'Indigo', color: '#4f46e5' },
  { label: 'Rose', color: '#e11d48' },
  { label: 'Amber', color: '#d97706' },
  { label: 'Sky', color: '#0284c7' },
  { label: 'Violet', color: '#7c3aed' },
];

export const DocumentTabsBar: React.FC = () => {
  const {
    workspaceTabs,
    activeTabId,
    switchWorkspaceTab,
    createNewTab,
    closeWorkspaceTab,
    renameWorkspaceTab,
    duplicateWorkspaceTab,
    moveWorkspaceTab,
    setWorkspaceTabColor,
    setIsBackstageOpen,
  } = usePublisher();

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [isAllSheetsOpen, setIsAllSheetsOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    tabId: string;
    x: number;
    y: number;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeMenus = () => {
      setContextMenu(null);
      setIsAllSheetsOpen(false);
    };
    window.addEventListener('click', closeMenus);
    return () => window.removeEventListener('click', closeMenus);
  }, []);

  const commitRename = () => {
    if (editingTabId && draftName.trim()) {
      renameWorkspaceTab(editingTabId, draftName.trim());
    }
    setEditingTabId(null);
  };

  const scrollTabs = (dx: number) => {
    scrollRef.current?.scrollBy({ left: dx, behavior: 'smooth' });
  };

  const ctxIdx = contextMenu
    ? workspaceTabs.findIndex((t) => t.id === contextMenu.tabId)
    : -1;
  const ctxTab = ctxIdx >= 0 ? workspaceTabs[ctxIdx] : null;

  return (
    <div className="h-7 bg-slate-200/90 border-t border-slate-300/90 px-1.5 flex items-center gap-1 select-none flex-shrink-0 relative z-30">
      {/* Left: Excel-style Scroll Chevrons & All Sheets Button */}
      <div className="flex items-center border-r border-slate-300/80 pr-1 mr-0.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => scrollTabs(-160)}
          className="p-1 rounded hover:bg-slate-300/60 text-slate-600 transition cursor-pointer"
          title="Scroll sheet tabs left"
        >
          <ChevronLeft size={13} />
        </button>
        <button
          type="button"
          onClick={() => scrollTabs(160)}
          className="p-1 rounded hover:bg-slate-300/60 text-slate-600 transition cursor-pointer"
          title="Scroll sheet tabs right"
        >
          <ChevronRight size={13} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setContextMenu(null);
            setIsAllSheetsOpen((o) => !o);
          }}
          className="p-1 rounded hover:bg-slate-300/60 text-slate-600 transition cursor-pointer"
          title="All Sheets"
        >
          <List size={12} />
        </button>
      </div>

      {/* All Sheets Popover */}
      {isAllSheetsOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-8 left-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 space-y-0.5 max-h-64 overflow-y-auto"
        >
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Open Sheets ({workspaceTabs.length})
          </div>
          {workspaceTabs.map((t) => {
            const isCur = t.id === activeTabId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  switchWorkspaceTab(t.id);
                  setIsAllSheetsOpen(false);
                }}
                className={`w-full px-2 py-1.5 rounded-lg text-left text-[11px] flex items-center justify-between transition ${
                  isCur
                    ? 'bg-emerald-50 text-emerald-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: t.tabColor || '#059669' }}
                  />
                  <span className="truncate">{t.project.name.replace(/\.pub$/i, '')}</span>
                </span>
                <span className="text-[10px] text-slate-400">{t.project.pages.length}p</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Sheet Tabs Strip */}
      <div
        ref={scrollRef}
        className="flex items-stretch h-full overflow-x-auto flex-1 min-w-0 no-scrollbar"
      >
        {workspaceTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const displayName = tab.project.name.replace(/\.pub$/i, '');
          const isEditing = editingTabId === tab.id;
          const accentColor = tab.tabColor || '#059669';

          return (
            <div
              key={tab.id}
              onClick={() => switchWorkspaceTab(tab.id)}
              onDoubleClick={() => {
                setEditingTabId(tab.id);
                setDraftName(tab.project.name);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsAllSheetsOpen(false);
                setContextMenu({
                  tabId: tab.id,
                  x: Math.min(window.innerWidth - 210, e.clientX),
                  y: e.clientY,
                });
              }}
              title={`${tab.project.name} (${tab.project.pages.length}p) — Double-click to rename, Right-click for sheet options`}
              style={{
                borderBottom: isActive
                  ? `2.5px solid ${accentColor}`
                  : tab.tabColor
                  ? `2px solid ${tab.tabColor}`
                  : undefined,
              }}
              className={`group relative flex items-center gap-1.5 h-full px-3 text-[11px] cursor-pointer transition-colors max-w-[190px] flex-shrink-0 border-r border-slate-300/80 ${
                isActive
                  ? 'bg-white text-slate-900 font-bold shadow-[0_-1px_3px_rgba(0,0,0,0.06)] z-10'
                  : 'bg-slate-200/40 text-slate-600 font-medium hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              {isEditing ? (
                <input
                  type="text"
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    else if (e.key === 'Escape') setEditingTabId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-28 px-1 py-0 text-[11px] bg-emerald-50 border border-emerald-500 rounded outline-none text-slate-900 font-semibold"
                />
              ) : (
                <span className="truncate">{displayName}</span>
              )}
              <span
                className={`text-[9px] px-1 rounded ${
                  isActive ? 'bg-slate-100 text-slate-600' : 'text-slate-400'
                }`}
              >
                {tab.project.pages.length}p
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeWorkspaceTab(tab.id);
                }}
                className="p-0.5 rounded-full hover:bg-rose-100 hover:text-rose-600 text-slate-400 opacity-0 group-hover:opacity-100 transition"
                title={workspaceTabs.length > 1 ? 'Close sheet' : 'Reset to blank sheet'}
              >
                <X size={10} />
              </button>
            </div>
          );
        })}

        {/* Classic Excel Circular '+' New Sheet Button */}
        <div className="flex items-center px-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => createNewTab()}
            className="w-5 h-5 rounded-full border border-slate-400/80 bg-white/80 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white text-slate-600 flex items-center justify-center transition shadow-2xs cursor-pointer"
            title="New Sheet (Blank Publication)"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Right: Templates Shortcut */}
      <button
        type="button"
        onClick={() => setIsBackstageOpen(true)}
        className="h-5 px-2 rounded bg-white/80 hover:bg-white border border-slate-300/80 text-[10px] font-semibold text-slate-700 hover:text-emerald-700 flex items-center gap-1 transition flex-shrink-0 cursor-pointer"
        title="Open Templates Gallery or Saved Files"
      >
        <LayoutTemplate size={11} />
        <span>Templates</span>
      </button>

      {/* Excel-Style Sheet Context Menu */}
      {contextMenu && ctxTab && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ left: `${contextMenu.x}px`, bottom: '32px' }}
          className="fixed w-48 bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 z-50 text-[11px] text-slate-700 space-y-0.5"
        >
          <button
            type="button"
            onClick={() => {
              setEditingTabId(ctxTab.id);
              setDraftName(ctxTab.project.name);
              setContextMenu(null);
            }}
            className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium"
          >
            <Edit3 size={12} className="text-slate-500" />
            <span>Rename</span>
          </button>
          <button
            type="button"
            onClick={() => {
              duplicateWorkspaceTab(ctxTab.id);
              setContextMenu(null);
            }}
            className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium"
          >
            <Copy size={12} className="text-slate-500" />
            <span>Duplicate Sheet</span>
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            disabled={ctxIdx <= 0}
            onClick={() => {
              moveWorkspaceTab(ctxTab.id, 'left');
              setContextMenu(null);
            }}
            className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 flex items-center gap-2 font-medium"
          >
            <ArrowLeft size={12} className="text-slate-500" />
            <span>Move Left</span>
          </button>
          <button
            type="button"
            disabled={ctxIdx >= workspaceTabs.length - 1}
            onClick={() => {
              moveWorkspaceTab(ctxTab.id, 'right');
              setContextMenu(null);
            }}
            className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 flex items-center gap-2 font-medium"
          >
            <ArrowRight size={12} className="text-slate-500" />
            <span>Move Right</span>
          </button>
          <div className="my-1 border-t border-slate-100" />
          <div className="px-2.5 py-1 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Tab Color
            </span>
            <div className="flex items-center gap-1.5">
              {TAB_COLORS.map((tc) => (
                <button
                  key={tc.label}
                  type="button"
                  title={tc.label}
                  onClick={() => {
                    setWorkspaceTabColor(ctxTab.id, tc.color);
                    setContextMenu(null);
                  }}
                  className={`w-4 h-4 rounded-full border transition hover:scale-110 ${
                    ctxTab.tabColor === tc.color
                      ? 'border-slate-900 ring-1 ring-slate-400'
                      : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: tc.color || '#e2e8f0' }}
                />
              ))}
            </div>
          </div>
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            onClick={() => {
              closeWorkspaceTab(ctxTab.id);
              setContextMenu(null);
            }}
            className="w-full px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-semibold"
          >
            <Trash2 size={12} />
            <span>{workspaceTabs.length > 1 ? 'Close Sheet' : 'Reset Sheet'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
