import React, { useEffect, useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { saveProjectToFile, triggerPrint } from '../../utils/imageExport';
import { exportToPdf } from '../../utils/pdfExport';
import { openShortcutsModal } from '../../utils/uiEvents';
import {
  Save,
  Undo2,
  Redo2,
  Printer,
  FileDown,
  LayoutGrid,
  Search,
  CheckCircle2,
  Keyboard,
} from 'lucide-react';

export const QuickAccessToolbar: React.FC = () => {
  const {
    project,
    canUndo,
    canRedo,
    undo,
    redo,
    setIsBackstageOpen,
    setActiveTab,
    addTextBox,
    addShape,
    addQRCode,
    addPageNumberToken,
    isEditingMaster,
    setIsEditingMaster,
    setIsMailMergeOpen,
    setIsWordArtModalOpen,
  } = usePublisher();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global app shortcuts that live in the shell: Ctrl+K command search,
  // Ctrl+S save (.pub) and Ctrl+P print — matching the cheatsheet.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = e.key.toLowerCase();

      if (key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        setIsSearchOpen(true);
      } else if (key === 's') {
        e.preventDefault();
        saveProjectToFile(project);
      } else if (key === 'p') {
        e.preventDefault();
        triggerPrint();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [project]);

  const quickActions = [
    { label: 'Add Text Box', icon: 'T', action: () => addTextBox() },
    { label: 'Insert Shape', icon: '◻', action: () => addShape('rounded-rect') },
    { label: 'Insert QR Code', icon: '⊞', action: () => addQRCode() },
    { label: 'Insert Page Number', icon: '#', action: () => addPageNumberToken() },
    { label: isEditingMaster ? 'Exit Master Page' : 'Edit Master Page', icon: '◫', action: () => setIsEditingMaster(!isEditingMaster) },
    { label: 'Mail Merge', icon: '✉', action: () => setIsMailMergeOpen(true) },
    { label: 'WordArt Gallery', icon: '✨', action: () => setIsWordArtModalOpen(true) },
    { label: 'Export to PDF', icon: '📄', action: () => exportToPdf(project) },
    { label: 'Keyboard Shortcuts', icon: '?', action: () => openShortcutsModal() },
  ];

  const filteredActions = quickActions.filter((a) =>
    a.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[58px] bg-white text-[#202833] flex items-center justify-between px-4 select-none text-xs border-b border-[#e5e9ee] relative z-40">
      {/* Left: Brand Emblem, Title, Document Name & Ghost Quick Actions */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Brand Emblem + Publisher Studio (opens Backstage / File) */}
        <button
          onClick={() => setIsBackstageOpen(true)}
          className="flex items-center gap-2.5 px-1.5 py-1 -ml-1.5 rounded-[8px] hover:bg-[#eef5f5] transition-colors group cursor-pointer"
          title="Open File & Templates (Backstage)"
        >
          <div className="w-[29px] h-[29px] rounded-[9px] bg-gradient-to-br from-[#0c9c9c] to-[#075f77] text-white flex items-center justify-center shadow-2xs flex-shrink-0">
            <LayoutGrid size={14} />
          </div>
          <span className="font-semibold text-[13px] tracking-[-0.01em] text-[#202833] group-hover:text-[#087477] whitespace-nowrap">
            Publisher Studio
          </span>
        </button>

        <div className="w-[1px] h-4 bg-[#e5e9ee] mx-0.5 flex-shrink-0" />

        {/* Document Title & Saved Locally */}
        <div className="hidden md:flex items-center gap-1.5 min-w-0">
          <span className="truncate max-w-[160px] font-medium text-[#46515e]">
            {project.name}
          </span>
          <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-[#87919b] whitespace-nowrap">
            <span>•</span>
            <CheckCircle2 size={11} className="text-[#087f83]" />
            <span>Saved locally</span>
          </span>
        </div>

        <div className="hidden md:block w-[1px] h-4 bg-[#e5e9ee] mx-0.5 flex-shrink-0" />

        {/* Save */}
        <button
          onClick={() => saveProjectToFile(project)}
          className="p-1.5 hover:bg-[#eef5f5] text-[#52606c] hover:text-[#087477] active:scale-95 rounded-[8px] transition-all cursor-pointer"
          title="Save Publication (.pub)"
        >
          <Save size={15} />
        </button>

        {/* Undo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-1.5 rounded-[8px] transition-all ${
            canUndo
              ? 'hover:bg-[#eef5f5] text-[#52606c] hover:text-[#087477] active:scale-95 cursor-pointer'
              : 'text-[#9aa4ae]/50 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={15} />
        </button>

        {/* Redo */}
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-1.5 rounded-[8px] transition-all ${
            canRedo
              ? 'hover:bg-[#eef5f5] text-[#52606c] hover:text-[#087477] active:scale-95 cursor-pointer'
              : 'text-[#9aa4ae]/50 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={15} />
        </button>
      </div>

      {/* Center: Calm Light Command Search Bar */}
      <div className="relative max-w-xs md:max-w-sm w-full mx-4">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9aa4ae] pointer-events-none"
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search commands, tools... (Ctrl+K)"
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            className="w-full bg-[#f8fafb] hover:bg-[#f3f5f7] focus:bg-white text-[#202833] placeholder-[#9aa4ae] pl-8 pr-12 py-1.5 rounded-[8px] text-[11.5px] outline-none border border-[#e5e9ee] focus:border-[#73b9b7] transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[9.5px] bg-[#f3f5f7] border border-[#e5e9ee] text-[#778391] px-1.5 py-0.5 rounded-[6px] font-mono pointer-events-none">
            <span>Ctrl+K</span>
          </div>
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#e5e9ee] rounded-[12px] shadow-[0_8px_28px_rgba(28,44,58,0.12)] p-1.5 z-50 text-[#202833] animate-in fade-in duration-100">
            <div className="text-[10px] font-bold text-[#9aa4ae] px-2 py-1 uppercase tracking-[0.09em]">
              Quick Commands
            </div>
            {filteredActions.map((item, idx) => (
              <button
                key={idx}
                onMouseDown={() => {
                  item.action();
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="w-full text-left px-2.5 py-1.5 hover:bg-[#eef5f5] hover:text-[#087477] rounded-[8px] text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <span className="w-5 h-5 rounded-[6px] bg-[#f3f5f7] flex items-center justify-center font-bold text-[#52606c] text-[11px]">
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Ghost Help + Print + Botanical Teal Export CTA */}
      <div className="flex items-center gap-2">
        <button
          onClick={openShortcutsModal}
          className="p-1.5 hover:bg-[#eef5f5] text-[#52606c] hover:text-[#087477] active:scale-95 rounded-[8px] transition-all cursor-pointer"
          title="Keyboard shortcuts (?)"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard size={16} />
        </button>

        <button
          onClick={triggerPrint}
          className="p-1.5 hover:bg-[#eef5f5] text-[#52606c] hover:text-[#087477] active:scale-95 rounded-[8px] transition-all cursor-pointer"
          title="Print Document"
        >
          <Printer size={16} />
        </button>

        <button
          onClick={() => exportToPdf(project)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#087f83] hover:bg-[#06696c] active:scale-95 text-white rounded-[8px] font-semibold text-xs transition shadow-2xs cursor-pointer"
          title="Export to PDF"
        >
          <FileDown size={14} />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
};
