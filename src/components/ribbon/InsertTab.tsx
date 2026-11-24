import React, { useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { ShapeType } from '../../types/publisher';
import {
  FilePlus,
  Copy,
  Table as TableIcon,
  Image as ImageIcon,
  Square,
  Sparkles,
  Scissors,
  Quote,
  Layout,
  Minus,
  Shapes,
  Calendar,
  Hash,
} from 'lucide-react';

export const InsertTab: React.FC = () => {
  const {
    addPage,
    duplicateActivePage,
    addTextBox,
    addShape,
    addImage,
    addTable,
    addAccent,
    addLine,
    setIsWordArtModalOpen,
    setIsBuildingBlocksModalOpen,
  } = usePublisher();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tableGridHover, setTableGridHover] = useState<{ r: number; c: number }>({ r: 3, c: 3 });
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);

  return (
    <div className="flex items-center h-24 px-2 py-1 gap-2 text-xs text-slate-700 overflow-x-auto select-none">
      {/* 1. Pages Group */}
      <div className="flex flex-col justify-between h-full px-2 border-r border-slate-300 flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          <button
            onClick={addPage}
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition group"
            title="Insert Blank Page"
          >
            <div className="w-8 h-8 rounded bg-emerald-50 border border-[#0f6b4e] flex items-center justify-center group-hover:bg-[#0f6b4e] group-hover:text-white transition text-[#0f6b4e]">
              <FilePlus size={18} />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Page</span>
          </button>

          <button
            onClick={duplicateActivePage}
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition"
            title="Duplicate Current Page"
          >
            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-700">
              <Copy size={16} />
            </div>
            <span className="text-[10px] mt-0.5">Duplicate</span>
          </button>
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Pages</span>
      </div>

      {/* 2. Tables Group */}
      <div className="flex flex-col justify-between h-full px-2 border-r border-slate-300 flex-shrink-0 relative">
        <div className="my-auto">
          <button
            onClick={() => setIsTableDropdownOpen(!isTableDropdownOpen)}
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition group"
            title="Insert Table"
          >
            <div className="w-8 h-8 rounded bg-emerald-50 border border-[#0f6b4e] flex items-center justify-center group-hover:bg-[#0f6b4e] group-hover:text-white transition text-[#0f6b4e]">
              <TableIcon size={18} />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Table</span>
          </button>

          {isTableDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-300 shadow-xl rounded-md p-3 z-50 w-44">
              <div className="text-[11px] font-semibold text-slate-600 mb-2">
                Insert Table ({tableGridHover.r} × {tableGridHover.c})
              </div>
              <div className="grid grid-cols-5 gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, r) =>
                  Array.from({ length: 5 }).map((_, c) => {
                    const isHighlighted = r < tableGridHover.r && c < tableGridHover.c;
                    return (
                      <div
                        key={`${r}-${c}`}
                        onMouseEnter={() => setTableGridHover({ r: r + 1, c: c + 1 })}
                        onClick={() => {
                          addTable(tableGridHover.r, tableGridHover.c);
                          setIsTableDropdownOpen(false);
                        }}
                        className={`w-5 h-5 border rounded-sm cursor-pointer transition ${
                          isHighlighted
                            ? 'bg-emerald-500 border-emerald-600'
                            : 'bg-slate-50 border-slate-200 hover:bg-emerald-200'
                        }`}
                      />
                    );
                  })
                )}
              </div>
              <button
                onClick={() => {
                  addTable(3, 3);
                  setIsTableDropdownOpen(false);
                }}
                className="w-full text-center py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] text-slate-700"
              >
                Insert 3×3 Table
              </button>
            </div>
          )}
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Tables</span>
      </div>

      {/* 3. Illustrations & Shapes */}
      <div className="flex flex-col justify-between h-full px-2 border-r border-slate-300 flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          {/* Picture */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  addImage(event.target?.result as string);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition group"
            title="Upload Picture"
          >
            <div className="w-8 h-8 rounded bg-emerald-50 border border-[#0f6b4e] flex items-center justify-center group-hover:bg-[#0f6b4e] group-hover:text-white transition text-[#0f6b4e]">
              <ImageIcon size={18} />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Picture</span>
          </button>

          {/* Quick Shapes */}
          <button
            onClick={() => addShape('rounded-rect')}
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition"
            title="Add Rounded Rectangle"
          >
            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-700">
              <Square size={16} />
            </div>
            <span className="text-[10px] mt-0.5">Shape</span>
          </button>

          {/* Line */}
          <button
            onClick={() => addLine()}
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition"
            title="Insert Horizontal Divider Line"
          >
            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-700">
              <Minus size={16} />
            </div>
            <span className="text-[10px] mt-0.5">Line</span>
          </button>
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Illustrations</span>
      </div>

      {/* 4. Building Blocks (MS Publisher Signature Accent Blocks) */}
      <div className="flex flex-col justify-between h-full px-2 border-r border-slate-300 flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          {/* Coupon */}
          <button
            onClick={() => addAccent('coupon')}
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition group"
            title="Insert Tear-off Special Coupon"
          >
            <div className="w-8 h-8 rounded bg-emerald-50 border border-[#0f6b4e] flex items-center justify-center group-hover:bg-[#0f6b4e] group-hover:text-white transition text-[#0f6b4e]">
              <Scissors size={18} />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Coupon</span>
          </button>

          {/* Pull Quote */}
          <button
            onClick={() => addAccent('pull-quote')}
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition group"
            title="Insert Large Pull Quote Accent"
          >
            <div className="w-8 h-8 rounded bg-emerald-50 border border-[#0f6b4e] flex items-center justify-center group-hover:bg-[#0f6b4e] group-hover:text-white transition text-[#0f6b4e]">
              <Quote size={18} />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Pull Quote</span>
          </button>

          {/* Masthead */}
          <button
            onClick={() => addAccent('masthead')}
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition group"
            title="Insert Newspaper / Newsletter Masthead"
          >
            <div className="w-8 h-8 rounded bg-emerald-50 border border-[#0f6b4e] flex items-center justify-center group-hover:bg-[#0f6b4e] group-hover:text-white transition text-[#0f6b4e]">
              <Layout size={18} />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Masthead</span>
          </button>
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Building Blocks</span>
      </div>

      {/* 5. Text & WordArt */}
      <div className="flex flex-col justify-between h-full px-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          {/* WordArt Gallery */}
          <button
            onClick={() => setIsWordArtModalOpen(true)}
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition group"
            title="Insert WordArt Styles"
          >
            <div className="w-8 h-8 rounded bg-amber-50 border border-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition text-amber-600">
              <Sparkles size={18} />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">WordArt</span>
          </button>
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Text Styles</span>
      </div>
    </div>
  );
};
