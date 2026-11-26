import React, { useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { saveProjectToFile, triggerPrint } from '../../utils/imageExport';
import { exportToPdf } from '../../utils/pdfExport';
import {
  Save,
  Undo2,
  Redo2,
  Printer,
  FileDown,
  LayoutGrid,
  Search,
  CheckCircle2,
  Sparkles,
  Command,
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

  const quickActions = [
    { label: 'Add Text Box', icon: 'T', action: () => addTextBox() },
    { label: 'Insert Shape', icon: '◻', action: () => addShape('rounded-rect') },
    { label: 'Insert QR Code', icon: '⊞', action: () => addQRCode() },
    { label: 'Insert Page Number', icon: '#', action: () => addPageNumberToken() },
    { label: isEditingMaster ? 'Exit Master Page' : 'Edit Master Page', icon: '◫', action: () => setIsEditingMaster(!isEditingMaster) },
    { label: 'Mail Merge', icon: '✉', action: () => setIsMailMergeOpen(true) },
    { label: 'WordArt Gallery', icon: '✨', action: () => setIsWordArtModalOpen(true) },
    { label: 'Export to PDF', icon: '📄', action: () => exportToPdf(project) },
  ];

  const filteredActions = quickActions.filter((a) =>
    a.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-10 bg-gradient-to-r from-[#312e81] via-[#4338ca] to-[#4f46e5] text-white flex items-center justify-between px-3 select-none text-xs border-b border-indigo-900/40 shadow-sm relative z-40">
      {/* Left: File & Quick Action Icons */}
      <div className="flex items-center gap-1.5">
        {/* Backstage File Button */}
        <button
          onClick={() => setIsBackstageOpen(true)}
          className="bg-white/15 hover:bg-white/25 active:scale-95 text-white font-semibold px-3 py-1 rounded-full text-xs flex items-center gap-1.5 transition-all shadow-xs backdrop-blur-md mr-1 border border-white/20"
        >
          <LayoutGrid size={13} className="text-indigo-200" />
          <span>File</span>
        </button>

        {/* Save */}
        <button
          onClick={() => saveProjectToFile(project)}
          className="p-1.5 hover:bg-white/15 active:scale-95 rounded-lg transition-all text-white/90 hover:text-white"
          title="Save Publication (.pub)"
        >
          <Save size={15} />
        </button>

        {/* Undo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-1.5 rounded-lg transition-all ${
            canUndo
              ? 'hover:bg-white/15 active:scale-95 text-white/90 hover:text-white'
              : 'text-white/35 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={15} />
        </button>

        {/* Redo */}
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-1.5 rounded-lg transition-all ${
            canRedo
              ? 'hover:bg-white/15 active:scale-95 text-white/90 hover:text-white'
              : 'text-white/35 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={15} />
        </button>

        <div className="w-[1px] h-3.5 bg-white/20 mx-1" />

        {/* Saved Status Indicator */}
        <div className="hidden lg:flex items-center gap-1 text-[11px] text-indigo-200/90 font-medium bg-indigo-900/40 px-2 py-0.5 rounded-full border border-indigo-700/50">
          <CheckCircle2 size={11} className="text-indigo-300" />
          <span>Saved</span>
        </div>
      </div>

      {/* Center: Interactive Search / Command Bar (Microsoft 365 style) */}
      <div className="relative max-w-xs md:max-w-md w-full mx-4">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
          <input
            type="text"
            placeholder="Search commands, templates, tools... (Ctrl+K)"
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            className="w-full bg-white/15 hover:bg-white/20 focus:bg-white text-white focus:text-slate-800 placeholder-white/60 focus:placeholder-slate-400 pl-8 pr-12 py-1 rounded-full text-[11px] outline-none border border-white/20 focus:border-indigo-600 transition-all shadow-inner"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[9px] bg-white/20 text-white/80 px-1.5 py-0.5 rounded font-mono pointer-events-none">
            <Command size={9} />
            <span>K</span>
          </div>
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl p-1.5 z-50 text-slate-800 animate-in fade-in duration-100">
            <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
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
                className="w-full text-left px-2.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-800 rounded-lg text-xs flex items-center gap-2 transition"
              >
                <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[11px]">
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Modern Actions & Document Title */}
      <div className="flex items-center gap-2">
        {/* Document Title */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-white/90 font-medium">
          <span className="truncate max-w-[150px]">{project.name}</span>
        </div>

        {/* Quick Export PDF pill */}
        <button
          onClick={() => exportToPdf(project)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-full font-medium text-[11px] transition border border-white/20 shadow-xs"
          title="Export to PDF"
        >
          <FileDown size={13} className="text-indigo-200" />
          <span>Export PDF</span>
        </button>

        {/* Print */}
        <button
          onClick={triggerPrint}
          className="p-1.5 hover:bg-white/15 active:scale-95 rounded-lg transition-all text-white/90 hover:text-white"
          title="Print Document"
        >
          <Printer size={15} />
        </button>

        {/* Studio Badge */}
        <div className="flex items-center gap-1 bg-indigo-950/40 border border-indigo-600/40 text-indigo-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
          <Sparkles size={10} className="text-amber-300" />
          <span>STUDIO</span>
        </div>
      </div>
    </div>
  );
};
