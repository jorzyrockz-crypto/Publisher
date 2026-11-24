import React from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { saveProjectToFile, triggerPrint } from '../../utils/imageExport';
import { exportToPdf } from '../../utils/pdfExport';
import {
  Save,
  Undo2,
  Redo2,
  Printer,
  FileDown,
  LayoutTemplate,
  Sparkles,
} from 'lucide-react';

export const QuickAccessToolbar: React.FC = () => {
  const { project, canUndo, canRedo, undo, redo, setIsBackstageOpen } = usePublisher();

  return (
    <div className="h-9 bg-[#0f6b4e] text-white flex items-center justify-between px-3 select-none text-xs border-b border-[#0b533c]">
      {/* Left: Quick Access Toolbar items */}
      <div className="flex items-center gap-1">
        {/* Backstage File Button */}
        <button
          onClick={() => setIsBackstageOpen(true)}
          className="bg-[#0b533c] hover:bg-[#083e2d] text-white font-bold px-3 py-1 rounded text-xs flex items-center gap-1.5 transition mr-2 shadow-sm"
        >
          <LayoutTemplate size={13} />
          <span>FILE</span>
        </button>

        {/* Save */}
        <button
          onClick={() => saveProjectToFile(project)}
          className="p-1 hover:bg-white/20 rounded transition text-white/90 hover:text-white"
          title="Save Publication (.pub)"
        >
          <Save size={15} />
        </button>

        {/* Undo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-1 rounded transition ${
            canUndo
              ? 'hover:bg-white/20 text-white/90 hover:text-white'
              : 'text-white/40 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={15} />
        </button>

        {/* Redo */}
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-1 rounded transition ${
            canRedo
              ? 'hover:bg-white/20 text-white/90 hover:text-white'
              : 'text-white/40 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={15} />
        </button>

        <div className="w-[1px] h-4 bg-white/30 mx-1" />

        {/* Export PDF */}
        <button
          onClick={() => exportToPdf(project)}
          className="p-1 hover:bg-white/20 rounded transition text-white/90 hover:text-white flex items-center gap-1"
          title="Export to PDF"
        >
          <FileDown size={15} />
          <span className="text-[11px] font-medium hidden sm:inline">Export PDF</span>
        </button>

        {/* Print */}
        <button
          onClick={triggerPrint}
          className="p-1 hover:bg-white/20 rounded transition text-white/90 hover:text-white"
          title="Print Document"
        >
          <Printer size={15} />
        </button>
      </div>

      {/* Center: Document Title */}
      <div className="font-medium text-xs text-white/95 truncate max-w-md hidden md:flex items-center gap-2">
        <span>{project.name}</span>
        <span className="text-white/60 text-[11px]">— Microsoft Publisher</span>
      </div>

      {/* Right: Office Profile & Branding */}
      <div className="flex items-center gap-2 text-white/90">
        <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
          <Sparkles size={11} className="text-amber-300" />
          Publisher 365
        </span>
      </div>
    </div>
  );
};
