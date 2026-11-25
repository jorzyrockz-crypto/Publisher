import React, { useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
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
  QrCode,
  Hash,
} from 'lucide-react';

export const InsertTab: React.FC = () => {
  const {
    addPage,
    duplicateActivePage,
    addShape,
    addImage,
    addTable,
    addAccent,
    addLine,
    addQRCode,
    addPageNumberToken,
    setIsWordArtModalOpen,
  } = usePublisher();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tableGridHover, setTableGridHover] = useState<{ r: number; c: number }>({ r: 3, c: 3 });
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);

  return (
    <div className="flex items-center h-24 px-3 py-1 gap-3 text-xs text-slate-700 overflow-x-auto select-none">
      {/* 1. Pages Group */}
      <div className="flex flex-col justify-between h-full py-1 pr-3 border-r border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          <button
            onClick={addPage}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Insert Blank Page"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <FilePlus size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">New Page</span>
          </button>

          <button
            onClick={duplicateActivePage}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Duplicate Current Page"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-200 transition-all shadow-xs">
              <Copy size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Duplicate</span>
          </button>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Pages</span>
      </div>

      {/* 2. Tables Group */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-slate-200 flex-shrink-0 relative">
        <div className="my-auto">
          <button
            onClick={() => setIsTableDropdownOpen(!isTableDropdownOpen)}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Insert Table"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <TableIcon size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Table</span>
          </button>

          {isTableDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl p-3 z-50 w-48 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[11px] font-semibold text-slate-700 mb-2">
                Insert Table ({tableGridHover.r} × {tableGridHover.c})
              </div>
              <div className="grid grid-cols-5 gap-1.5 mb-2.5">
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
                        className={`w-5 h-5 border rounded cursor-pointer transition ${
                          isHighlighted
                            ? 'bg-emerald-500 border-emerald-600 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-emerald-100'
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
                className="w-full text-center py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg text-xs font-medium text-slate-700 transition"
              >
                Insert 3×3 Grid
              </button>
            </div>
          )}
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Tables</span>
      </div>

      {/* 3. Illustrations & Media */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2 my-auto">
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
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Upload Picture"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <ImageIcon size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Picture</span>
          </button>

          {/* Quick Shapes */}
          <button
            onClick={() => addShape('rounded-rect')}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Add Rounded Rectangle"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-200 transition-all shadow-xs">
              <Square size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Shape</span>
          </button>

          {/* Line */}
          <button
            onClick={() => addLine()}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Insert Horizontal Divider Line"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-200 transition-all shadow-xs">
              <Minus size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Divider</span>
          </button>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Media</span>
      </div>

      {/* 4. Building Blocks */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2 my-auto">
          {/* Coupon */}
          <button
            onClick={() => addAccent('coupon')}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Insert Tear-off Special Coupon"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <Scissors size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Coupon</span>
          </button>

          {/* Pull Quote */}
          <button
            onClick={() => addAccent('pull-quote')}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Insert Large Pull Quote Accent"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <Quote size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Pull Quote</span>
          </button>

          {/* Masthead */}
          <button
            onClick={() => addAccent('masthead')}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Insert Newspaper / Newsletter Masthead"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <Layout size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Masthead</span>
          </button>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Blocks</span>
      </div>

      {/* 5. Typography Styles */}
      <div className="flex flex-col justify-between h-full py-1 px-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          {/* WordArt Gallery */}
          <button
            onClick={() => setIsWordArtModalOpen(true)}
            className="flex flex-col items-center p-1.5 hover:bg-amber-50 active:scale-95 rounded-xl transition-all group"
            title="Insert WordArt Styles"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all text-amber-600 shadow-xs">
              <Sparkles size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">WordArt</span>
          </button>

          {/* QR Code */}
          <button
            onClick={() => addQRCode()}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Insert Scannable QR Code"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-all text-slate-800 shadow-xs">
              <QrCode size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">QR Code</span>
          </button>

          {/* Page Number */}
          <button
            onClick={addPageNumberToken}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Insert Dynamic Page Number"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all text-slate-700 shadow-xs">
              <Hash size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Page #</span>
          </button>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Smart Tools</span>
      </div>
    </div>
  );
};
