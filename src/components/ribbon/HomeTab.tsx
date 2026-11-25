import React, { useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { TextElement, ShapeType } from '../../types/publisher';
import {
  Copy,
  Trash2,
  Type,
  Square,
  Image as ImageIcon,
  BringToFront,
  SendToBack,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Sparkles,
  ChevronDown,
  Columns,
  Shapes,
} from 'lucide-react';

export const HomeTab: React.FC = () => {
  const {
    activePage,
    selectedElementIds,
    updateSelectedElements,
    deleteSelectedElements,
    duplicateSelectedElements,
    bringToFront,
    sendToBack,
    alignSelected,
    distributeSelected,
    addTextBox,
    addShape,
    addImage,
  } = usePublisher();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isShapesOpen, setIsShapesOpen] = useState(false);
  const [isAlignOpen, setIsAlignOpen] = useState(false);

  const selectedTextElement =
    selectedElementIds.length === 1
      ? (activePage.elements.find((el) => el.id === selectedElementIds[0] && el.type === 'text') as TextElement)
      : null;

  return (
    <div className="flex items-center h-24 px-3 py-1 gap-3 text-xs text-slate-700 overflow-x-auto select-none">
      {/* 1. Clipboard Group */}
      <div className="flex flex-col items-center justify-between h-full py-1 pr-3 border-r border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          <button
            onClick={duplicateSelectedElements}
            disabled={selectedElementIds.length === 0}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl disabled:opacity-40 transition-all group"
            title="Duplicate Selected (Ctrl+D)"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <Copy size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Duplicate</span>
          </button>

          <button
            onClick={deleteSelectedElements}
            disabled={selectedElementIds.length === 0}
            className="flex flex-col items-center p-1.5 hover:bg-red-50 active:scale-95 rounded-xl disabled:opacity-40 text-red-600 transition-all group"
            title="Delete Selected"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all shadow-xs text-slate-500">
              <Trash2 size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1">Delete</span>
          </button>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Clipboard</span>
      </div>

      {/* 2. Font Group */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-slate-200 flex-shrink-0 min-w-[220px]">
        <div className="space-y-1.5 my-auto">
          {/* Top row: Font family & Size */}
          <div className="flex items-center gap-1.5">
            <select
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none w-36 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition cursor-pointer"
              value={selectedTextElement?.fontFamily || 'Segoe UI'}
              onChange={(e) => updateSelectedElements({ fontFamily: e.target.value })}
            >
              <option value="Segoe UI">Segoe UI</option>
              <option value="Arial">Arial</option>
              <option value="Calibri">Calibri</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Trebuchet MS">Trebuchet MS</option>
              <option value="Impact">Impact</option>
              <option value="Courier New">Courier New</option>
            </select>

            <input
              type="number"
              min={8}
              max={120}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none w-14 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition text-center"
              value={selectedTextElement?.fontSize || 16}
              onChange={(e) => updateSelectedElements({ fontSize: Number(e.target.value) })}
            />
          </div>

          {/* Bottom row: Bold, Italic, Underline, Color, WordArt */}
          <div className="flex items-center gap-1">
            <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
              <button
                onClick={() =>
                  updateSelectedElements({
                    fontWeight: selectedTextElement?.fontWeight === 'bold' ? 'normal' : 'bold',
                  })
                }
                className={`p-1 rounded-md transition-all ${
                  selectedTextElement?.fontWeight === 'bold'
                    ? 'bg-white shadow-xs text-emerald-800 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                title="Bold"
              >
                <Bold size={13} />
              </button>
              <button
                onClick={() =>
                  updateSelectedElements({
                    fontStyle: selectedTextElement?.fontStyle === 'italic' ? 'normal' : 'italic',
                  })
                }
                className={`p-1 rounded-md transition-all ${
                  selectedTextElement?.fontStyle === 'italic'
                    ? 'bg-white shadow-xs text-emerald-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                title="Italic"
              >
                <Italic size={13} />
              </button>
              <button
                onClick={() =>
                  updateSelectedElements({
                    textDecoration:
                      selectedTextElement?.textDecoration === 'underline' ? 'none' : 'underline',
                  })
                }
                className={`p-1 rounded-md transition-all ${
                  selectedTextElement?.textDecoration === 'underline'
                    ? 'bg-white shadow-xs text-emerald-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                title="Underline"
              >
                <Underline size={13} />
              </button>
            </div>

            <div className="w-[1px] h-4 bg-slate-200 mx-1" />

            {/* Modern color swatch */}
            <div className="flex items-center gap-1.5" title="Font Color">
              <div className="relative flex items-center justify-center">
                <input
                  type="color"
                  className="w-6 h-6 rounded-full border border-slate-200 cursor-pointer overflow-hidden p-0"
                  value={selectedTextElement?.color || '#0f172a'}
                  onChange={(e) => updateSelectedElements({ color: e.target.value })}
                />
              </div>
            </div>

            {/* WordArt quick badge */}
            <button
              onClick={() =>
                updateSelectedElements({
                  isWordArt: !selectedTextElement?.isWordArt,
                  wordArtStyle: selectedTextElement?.isWordArt ? 'none' : 'rainbow',
                })
              }
              className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ml-1 ${
                selectedTextElement?.isWordArt
                  ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
              title="WordArt Styles"
            >
              <Sparkles size={14} className="text-amber-500" />
            </button>
          </div>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Font</span>
      </div>

      {/* 3. Paragraph Group */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-slate-200 flex-shrink-0">
        <div className="space-y-1.5 my-auto">
          {/* Alignment Segmented Control */}
          <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
            {(['left', 'center', 'right', 'justify'] as const).map((align) => (
              <button
                key={align}
                onClick={() => updateSelectedElements({ textAlign: align })}
                className={`p-1 rounded-md transition-all ${
                  selectedTextElement?.textAlign === align
                    ? 'bg-white shadow-xs text-emerald-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                title={`Align ${align}`}
              >
                {align === 'left' && <AlignLeft size={13} />}
                {align === 'center' && <AlignCenter size={13} />}
                {align === 'right' && <AlignRight size={13} />}
                {align === 'justify' && <AlignJustify size={13} />}
              </button>
            ))}
          </div>

          {/* Columns & Drop Cap pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                updateSelectedElements({
                  columns: (((selectedTextElement?.columns || 1) % 3) + 1) as 1 | 2 | 3,
                })
              }
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition shadow-2xs"
              title="Toggle Multi-Columns"
            >
              <Columns size={12} className="text-emerald-700" />
              <span>{selectedTextElement?.columns || 1} Col</span>
            </button>
            <button
              onClick={() =>
                updateSelectedElements({ dropCap: !selectedTextElement?.dropCap })
              }
              className={`text-[11px] font-medium px-2 py-0.5 rounded-lg border transition shadow-2xs ${
                selectedTextElement?.dropCap
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
              title="Toggle Large Initial Drop Cap"
            >
              Drop Cap
            </button>
          </div>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Paragraph</span>
      </div>

      {/* 4. Objects Group */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2 my-auto relative">
          {/* Draw Text Box */}
          <button
            onClick={() => addTextBox()}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Draw Text Box"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <Type size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Text Box</span>
          </button>

          {/* Shapes Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsShapesOpen(!isShapesOpen)}
              className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
              title="Insert Shapes"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
                <Shapes size={16} />
              </div>
              <span className="text-[10px] font-medium mt-1 text-slate-600 flex items-center">
                Shapes <ChevronDown size={9} className="ml-0.5" />
              </span>
            </button>

            {isShapesOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl p-2.5 z-50 grid grid-cols-4 gap-1.5 w-64 animate-in fade-in zoom-in-95 duration-100">
                {(
                  [
                    'rectangle',
                    'rounded-rect',
                    'circle',
                    'triangle',
                    'star',
                    'badge-burst',
                    'hexagon',
                    'diamond',
                    'heart',
                    'banner',
                    'callout',
                    'arrow-right',
                    'arrow-double',
                  ] as ShapeType[]
                ).map((shape) => (
                  <button
                    key={shape}
                    onClick={() => {
                      addShape(shape);
                      setIsShapesOpen(false);
                    }}
                    className="p-2 hover:bg-emerald-50 rounded-xl text-center text-[10px] capitalize font-medium text-slate-700 flex flex-col items-center gap-1 transition"
                  >
                    <Square size={16} className="text-emerald-700" />
                    <span className="truncate w-full">{shape.replace('-', ' ')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Picture Upload */}
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
            title="Insert Picture"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <ImageIcon size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Picture</span>
          </button>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Objects</span>
      </div>

      {/* 5. Arrange Group */}
      <div className="flex flex-col justify-between h-full py-1 px-3 flex-shrink-0">
        <div className="space-y-1.5 my-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={bringToFront}
              disabled={selectedElementIds.length === 0}
              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium disabled:opacity-40 transition shadow-2xs"
              title="Bring to Front"
            >
              <BringToFront size={13} className="text-emerald-700" />
              <span>Forward</span>
            </button>
            <button
              onClick={sendToBack}
              disabled={selectedElementIds.length === 0}
              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium disabled:opacity-40 transition shadow-2xs"
              title="Send to Back"
            >
              <SendToBack size={13} className="text-slate-600" />
              <span>Backward</span>
            </button>
          </div>

          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => setIsAlignOpen(!isAlignOpen)}
              disabled={selectedElementIds.length === 0}
              className="flex items-center justify-between w-full px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium disabled:opacity-40 transition shadow-2xs"
            >
              <span>Align</span>
              <ChevronDown size={11} className="text-slate-400" />
            </button>

            {isAlignOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-xl p-1.5 z-50 w-40 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                {(['left', 'center', 'right', 'top', 'middle', 'bottom'] as const).map(
                  (alignment) => (
                    <button
                      key={alignment}
                      onClick={() => {
                        alignSelected(alignment);
                        setIsAlignOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg text-xs capitalize transition"
                    >
                      Align {alignment}
                    </button>
                  )
                )}
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => {
                    distributeSelected('horizontal');
                    setIsAlignOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg text-xs transition"
                >
                  Distribute Horizontally
                </button>
                <button
                  onClick={() => {
                    distributeSelected('vertical');
                    setIsAlignOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg text-xs transition"
                >
                  Distribute Vertically
                </button>
              </div>
            )}
          </div>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Arrange</span>
      </div>
    </div>
  );
};
