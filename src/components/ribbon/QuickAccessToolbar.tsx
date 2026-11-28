import React, { useEffect, useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { DesignerFormatChip } from '../workspace/DesignerFormatChip';
import { saveProjectToFile } from '../../utils/imageExport';
import { exportToPdf } from '../../utils/pdfExport';
import { openShortcutsModal } from '../../utils/uiEvents';
import { StudioPressLogo } from '../common/StudioPressLogo';
import {
  Save,
  Undo2,
  Redo2,
  Printer,
  FileDown,
  Search,
  Keyboard,
  Download,
  Sun,
  Moon,
  PenTool,
  LayoutGrid,
} from 'lucide-react';

export const QuickAccessToolbar: React.FC = () => {
  const {
    project,
    workspaceMode,
    setWorkspaceMode,
    theme,
    toggleTheme,
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
    openBackstage,
  } = usePublisher();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<
    (Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }) | null
  >(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(
        e as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
      );
    };
    const onAppInstalled = () => setInstallPromptEvent(null);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

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
        // Print publication: open the File ▸ Print tab rather than the bare
        // browser dialog, so page ranges / booklet / bleed settings are reachable.
        e.preventDefault();
        openBackstage('print');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [project, openBackstage]);

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
    <div
      className="h-[46px] bg-white text-[#161a22] flex items-center justify-between px-3 select-none text-xs border-b border-[#e5e9ee] relative z-40"
      data-quick-access="true"
    >
      {/* Left: Brand Emblem, Title, Document Name & Ghost Quick Actions */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Brand Emblem + Publisher Studio (opens Backstage / File) */}
        <button
          onClick={() => setIsBackstageOpen(true)}
          className="flex items-center gap-2.5 px-1.5 py-1 -ml-1.5 rounded-[8px] hover:bg-[#f4f2ff] transition-colors group cursor-pointer"
          title="Open File & Templates (Backstage)"
        >
          <StudioPressLogo size={26} />
          <span className="font-semibold text-[12.5px] tracking-[-0.01em] text-[#161a22] group-hover:text-[#5c4bb8] whitespace-nowrap">
            Publisher Studio
          </span>
        </button>

        <div className="w-[1px] h-4 bg-[#e5e9ee] mx-0.5 flex-shrink-0" />

        {/* Document Title (save state now lives in the status bar) */}
        <div className="hidden lg:flex items-center gap-1.5 min-w-0">
          <span className="truncate max-w-[220px] font-medium text-[#3d4854]">
            {project.name}
          </span>
        </div>

        {/* Artboard identity — design mode reads size at a glance and can resize in place */}
        {workspaceMode === 'designer' && <DesignerFormatChip />}

        <div className="hidden md:block w-[1px] h-4 bg-[#e5e9ee] mx-0.5 flex-shrink-0" />

        {/* Save */}
        <button
          onClick={() => saveProjectToFile(project)}
          className="p-1.5 hover:bg-[#f4f2ff] text-[#4a5661] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] transition-all cursor-pointer"
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
              ? 'hover:bg-[#f4f2ff] text-[#4a5661] hover:text-[#5c4bb8] active:scale-95 cursor-pointer'
              : 'text-[#6a7682]/50 cursor-not-allowed'
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
              ? 'hover:bg-[#f4f2ff] text-[#4a5661] hover:text-[#5c4bb8] active:scale-95 cursor-pointer'
              : 'text-[#6a7682]/50 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={15} />
        </button>
      </div>

      {/* Center: Calm Light Command Search Bar */}
      <div className="hidden sm:block relative flex-1 max-w-[170px] md:max-w-[260px] lg:max-w-sm mx-2 lg:mx-4">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6a7682] pointer-events-none"
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
            className="w-full bg-[#f8fafb] hover:bg-[#f3f5f7] focus:bg-white text-[#161a22] placeholder-[#6a7682] pl-8 pr-12 py-1 rounded-[8px] text-[11.5px] outline-none border border-[#e5e9ee] focus:border-[#b3a4f2] transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[9.5px] bg-[#f3f5f7] border border-[#e5e9ee] text-[#5b6673] px-1.5 py-0.5 rounded-[6px] font-mono pointer-events-none">
            <span>Ctrl+K</span>
          </div>
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#e5e9ee] rounded-[12px] shadow-[0_8px_28px_rgba(28,44,58,0.12)] p-1.5 z-50 text-[#161a22] animate-in fade-in duration-100">
            <div className="text-[10px] font-bold text-[#6a7682] px-2 py-1 uppercase tracking-[0.09em]">
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
                className="w-full text-left px-2.5 py-1.5 hover:bg-[#f4f2ff] hover:text-[#5c4bb8] rounded-[8px] text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <span className="w-5 h-5 rounded-[6px] bg-[#f3f5f7] flex items-center justify-center font-bold text-[#4a5661] text-[11px]">
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Install PWA + Ghost Help + Print + Export CTA */}
      <div className="flex items-center gap-2">
        {installPromptEvent && (
          <button
            onClick={async () => {
              await installPromptEvent.prompt();
              await installPromptEvent.userChoice;
              setInstallPromptEvent(null);
            }}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-[8px] border border-[#d3c9f9] bg-[#f4f2ff] hover:bg-[#efeafd] text-[#5c4bb8] text-[11px] font-semibold transition cursor-pointer"
            title="Install StudioPress as a desktop/mobile app"
          >
            <Download size={13} />
            <span>Install App</span>
          </button>
        )}

        <div
          className="hidden sm:flex items-center bg-[#f3f5f7] p-0.5 rounded-[8px] border border-[#e5e9ee]"
          role="group"
          aria-label="Workspace mode"
        >
          <button
            type="button"
            onClick={() => setWorkspaceMode('publisher')}
            className={`flex items-center gap-1 px-2 py-1 rounded-[6px] text-[11px] font-semibold transition cursor-pointer ${
              workspaceMode === 'publisher'
                ? 'bg-white text-[#5c4bb8] shadow-2xs'
                : 'text-[#4a5661] hover:text-[#161a22]'
            }`}
            title="Publisher Workspace (Office Ribbon)"
          >
            <LayoutGrid size={12} />
            <span>Publisher</span>
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceMode('designer')}
            className={`flex items-center gap-1 px-2 py-1 rounded-[6px] text-[11px] font-semibold transition cursor-pointer ${
              workspaceMode === 'designer'
                ? 'bg-white text-[#5c4bb8] shadow-2xs'
                : 'text-[#4a5661] hover:text-[#161a22]'
            }`}
            title="Designer Workspace (Left Tool Rail + Contextual Bar)"
          >
            <PenTool size={12} />
            <span>Designer</span>
          </button>
        </div>

        <button
          onClick={toggleTheme}
          className="p-1.5 hover:bg-[#f4f2ff] text-[#4a5661] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] transition-all cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          onClick={openShortcutsModal}
          className="p-1.5 hover:bg-[#f4f2ff] text-[#4a5661] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] transition-all cursor-pointer"
          title="Keyboard shortcuts (?)"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard size={16} />
        </button>

        <button
          onClick={() => openBackstage('print')}
          className="p-1.5 hover:bg-[#f4f2ff] text-[#4a5661] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] transition-all cursor-pointer"
          title="Print publication — opens File ▸ Print (Ctrl+P)"
          aria-label="Print publication"
        >
          <Printer size={16} />
        </button>

        <button
          onClick={() => exportToPdf(project)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6e56cf] hover:bg-[#5c4bb8] active:scale-95 text-white rounded-[8px] font-semibold text-xs transition shadow-2xs cursor-pointer"
          title="Export to PDF"
        >
          <FileDown size={14} />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
};
