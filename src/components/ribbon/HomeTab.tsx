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
    bringForward,
    sendBackward,
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
    <div className="flex items-center h-24 px-2 py-1 gap-2 text-xs text-slate-700 overflow-x-auto select-none">
      {/* 1. Clipboard Group */}
      <div className="flex flex-col items-center justify-between h-full px-2 border-r border-slate-300 flex-shrink-0">
        <div className="flex items-center gap-1 my-auto">
          <button
            onClick={duplicateSelectedElements}
            disabled={selectedElementIds.length === 0}
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded disabled:opacity-40 transition"
            title="Duplicate Selected (Ctrl+D)"
          >
            <Copy size={18} className="text-[#0f6b4e]" />
            <span className="text-[10px] mt-0.5">Duplicate</span>
          </button>
          <button
            onClick={deleteSelectedElements}
            disabled={selectedElementIds.length === 0}
            className="flex flex-col items-center p-1.5 hover:bg-red-50 rounded disabled:opacity-40 text-red-600 transition"
            title="Delete Selected"
          >
            <Trash2 size={18} />
            <span className="text-[10px] mt-0.5">Delete</span>
          </button>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">Clipboard</span>
      </div>

      {/* 2. Font Group */}
      <div className="flex flex-col justify-between h-full px-2 border-r border-slate-300 flex-shrink-0 min-w-[210px]">
        <div className="space-y-1">
          {/* Top row: Font family & Size */}
          <div className="flex items-center gap-1">
            <select
              className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs outline-none w-32 focus:border-[#0f6b4e]"
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
              className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs outline-none w-14 focus:border-[#0f6b4e]"
              value={selectedTextElement?.fontSize || 16}
              onChange={(e) => updateSelectedElements({ fontSize: Number(e.target.value) })}
            />
          </div>

          {/* Bottom row: Bold, Italic, Underline, Color, WordArt */}
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                updateSelectedElements({
                  fontWeight: selectedTextElement?.fontWeight === 'bold' ? 'normal' : 'bold',
                })
              }
              className={`p-1 rounded transition ${
                selectedTextElement?.fontWeight === 'bold' ? 'bg-slate-300 text-slate-900' : 'hover:bg-slate-200'
              }`}
              title="Bold"
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() =>
                updateSelectedElements({
                  fontStyle: selectedTextElement?.fontStyle === 'italic' ? 'normal' : 'italic',
                })
              }
              className={`p-1 rounded transition ${
                selectedTextElement?.fontStyle === 'italic' ? 'bg-slate-300 text-slate-900' : 'hover:bg-slate-200'
              }`}
              title="Italic"
            >
              <Italic size={14} />
            </button>
            <button
              onClick={() =>
                updateSelectedElements({
                  textDecoration:
                    selectedTextElement?.textDecoration === 'underline' ? 'none' : 'underline',
                })
              }
              className={`p-1 rounded transition ${
                selectedTextElement?.textDecoration === 'underline'
                  ? 'bg-slate-300 text-slate-900'
                  : 'hover:bg-slate-200'
              }`}
              title="Underline"
            >
              <Underline size={14} />
            </button>

            <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

            <div className="flex items-center gap-1 pl-1" title="Font Color">
              <input
                type="color"
                className="w-5 h-5 rounded border border-slate-300 cursor-pointer"
                value={selectedTextElement?.color || '#1e293b'}
                onChange={(e) => updateSelectedElements({ color: e.target.value })}
              />
            </div>

            <button
              onClick={() =>
                updateSelectedElements({
                  isWordArt: !selectedTextElement?.isWordArt,
                  wordArtStyle: selectedTextElement?.isWordArt ? 'none' : 'rainbow',
                })
              }
              className={`p-1 rounded transition flex items-center gap-0.5 ml-1 ${
                selectedTextElement?.isWordArt ? 'bg-amber-100 text-amber-800' : 'hover:bg-slate-200'
              }`}
              title="WordArt Styles"
            >
              <Sparkles size={14} className="text-amber-500" />
            </button>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Font</span>
      </div>

      {/* 3. Paragraph Group */}
      <div className="flex flex-col justify-between h-full px-2 border-r border-slate-300 flex-shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => updateSelectedElements({ textAlign: 'left' })}
              className={`p-1 rounded hover:bg-slate-200 transition ${
                selectedTextElement?.textAlign === 'left' ? 'bg-slate-200' : ''
              }`}
              title="Align Left"
            >
              <AlignLeft size={14} />
            </button>
            <button
              onClick={() => updateSelectedElements({ textAlign: 'center' })}
              className={`p-1 rounded hover:bg-slate-200 transition ${
                selectedTextElement?.textAlign === 'center' ? 'bg-slate-200' : ''
              }`}
              title="Center"
            >
              <AlignCenter size={14} />
            </button>
            <button
              onClick={() => updateSelectedElements({ textAlign: 'right' })}
              className={`p-1 rounded hover:bg-slate-200 transition ${
                selectedTextElement?.textAlign === 'right' ? 'bg-slate-200' : ''
              }`}
              title="Align Right"
            >
              <AlignRight size={14} />
            </button>
            <button
              onClick={() => updateSelectedElements({ textAlign: 'justify' })}
              className={`p-1 rounded hover:bg-slate-200 transition ${
                selectedTextElement?.textAlign === 'justify' ? 'bg-slate-200' : ''
              }`}
              title="Justify"
            >
              <AlignJustify size={14} />
            </button>
          </div>

          {/* Columns & Drop Cap */}
          <div className="flex items-center gap-1 pt-0.5">
            <button
              onClick={() =>
                updateSelectedElements({
                  columns: ((selectedTextElement?.columns || 1) % 3 + 1) as 1 | 2 | 3,
                })
              }
              className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border border-slate-300 hover:bg-slate-100"
              title="Toggle Multi-Columns"
            >
              <Columns size={12} />
              <span>{selectedTextElement?.columns || 1} Col</span>
            </button>
            <button
              onClick={() =>
                updateSelectedElements({ dropCap: !selectedTextElement?.dropCap })
              }
              className={`text-[11px] px-1.5 py-0.5 rounded border transition ${
                selectedTextElement?.dropCap
                  ? 'bg-emerald-50 border-[#0f6b4e] text-[#0f6b4e] font-bold'
                  : 'border-slate-300 hover:bg-slate-100'
              }`}
              title="Toggle Large Initial Drop Cap"
            >
              Drop Cap
            </button>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Paragraph</span>
      </div>

      {/* 4. Objects Group */}
      <div className="flex flex-col justify-between h-full px-2 border-r border-slate-300 flex-shrink-0">
        <div className="flex items-center gap-2 my-auto relative">
          {/* Draw Text Box */}
          <button
            onClick={() => addTextBox()}
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition group"
            title="Draw Text Box"
          >
            <div className="w-8 h-8 rounded bg-emerald-50 border border-[#0f6b4e] flex items-center justify-center group-hover:bg-[#0f6b4e] group-hover:text-white transition text-[#0f6b4e]">
              <Type size={18} />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Text Box</span>
          </button>

          {/* Shapes Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsShapesOpen(!isShapesOpen)}
              className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition group"
              title="Insert Shapes"
            >
              <div className="w-8 h-8 rounded bg-emerald-50 border border-[#0f6b4e] flex items-center justify-center group-hover:bg-[#0f6b4e] group-hover:text-white transition text-[#0f6b4e]">
                <Shapes size={18} />
              </div>
              <span className="text-[10px] mt-0.5 font-medium flex items-center">
                Shapes <ChevronDown size={10} className="ml-0.5" />
              </span>
            </button>

            {isShapesOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-300 shadow-xl rounded-md p-2 z-50 grid grid-cols-4 gap-1 w-48">
                {(
                  [
                    'rectangle',
                    'rounded-rect',
                    'circle',
                    'triangle',
                    'star',
                    'banner',
                    'callout',
                    'arrow-right',
                  ] as ShapeType[]
                ).map((shape) => (
                  <button
                    key={shape}
                    onClick={() => {
                      addShape(shape);
                      setIsShapesOpen(false);
                    }}
                    className="p-1.5 hover:bg-slate-100 rounded text-center text-[10px] capitalize font-medium text-slate-700 flex flex-col items-center gap-1"
                  >
                    <Square size={16} className="text-[#0f6b4e]" />
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
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition group"
            title="Insert Picture"
          >
            <div className="w-8 h-8 rounded bg-emerald-50 border border-[#0f6b4e] flex items-center justify-center group-hover:bg-[#0f6b4e] group-hover:text-white transition text-[#0f6b4e]">
              <ImageIcon size={18} />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Picture</span>
          </button>
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Objects</span>
      </div>

      {/* 5. Arrange Group */}
      <div className="flex flex-col justify-between h-full px-2 flex-shrink-0">
        <div className="space-y-1 my-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={bringToFront}
              disabled={selectedElementIds.length === 0}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-300 hover:bg-slate-100 text-[11px] disabled:opacity-40"
              title="Bring to Front"
            >
              <BringToFront size={13} />
              <span>Bring Forward</span>
            </button>
            <button
              onClick={sendToBack}
              disabled={selectedElementIds.length === 0}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-300 hover:bg-slate-100 text-[11px] disabled:opacity-40"
              title="Send to Back"
            >
              <SendToBack size={13} />
              <span>Send Backward</span>
            </button>
          </div>

          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => setIsAlignOpen(!isAlignOpen)}
              disabled={selectedElementIds.length === 0}
              className="flex items-center justify-between w-full px-2 py-0.5 rounded border border-slate-300 hover:bg-slate-100 text-[11px] disabled:opacity-40"
            >
              <span>Align Objects</span>
              <ChevronDown size={11} />
            </button>

            {isAlignOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-300 shadow-xl rounded-md p-1.5 z-50 w-36 space-y-1">
                {(['left', 'center', 'right', 'top', 'middle', 'bottom'] as const).map(
                  (alignment) => (
                    <button
                      key={alignment}
                      onClick={() => {
                        alignSelected(alignment);
                        setIsAlignOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 hover:bg-slate-100 rounded text-[11px] capitalize"
                    >
                      Align {alignment}
                    </button>
                  )
                )}
                <div className="border-t border-slate-200 my-1" />
                <button
                  onClick={() => {
                    distributeSelected('horizontal');
                    setIsAlignOpen(false);
                  }}
                  className="w-full text-left px-2 py-1 hover:bg-slate-100 rounded text-[11px]"
                >
                  Distribute Horizontally
                </button>
                <button
                  onClick={() => {
                    distributeSelected('vertical');
                    setIsAlignOpen(false);
                  }}
                  className="w-full text-left px-2 py-1 hover:bg-slate-100 rounded text-[11px]"
                >
                  Distribute Vertically
                </button>
              </div>
            )}
          </div>
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Arrange</span>
      </div>
    </div>
  );
};
