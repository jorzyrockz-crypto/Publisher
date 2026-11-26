import React, { useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { TextElement, ShapeType } from '../../types/publisher';
import { FloatingDropdown } from '../common/FloatingDropdown';
import { FontSelector } from '../common/FontSelector';
import { ShapePreviewIcon } from '../common/ShapePreviewIcon';
import { SHAPE_CATALOG } from '../../utils/shapePaths';
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
  ImagePlus,
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
    addPicturePlaceholder,
    setIsRightPanelOpen,
    setRightPanelTab,
  } = usePublisher();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const shapesBtnRef = useRef<HTMLButtonElement>(null);
  const alignBtnRef = useRef<HTMLButtonElement>(null);
  const [isShapesOpen, setIsShapesOpen] = useState(false);
  const [isAlignOpen, setIsAlignOpen] = useState(false);

  const selectedTextElement =
    selectedElementIds.length === 1
      ? (activePage.elements.find((el) => el.id === selectedElementIds[0] && el.type === 'text') as TextElement)
      : null;

  return (
    <div className="flex items-center h-20 px-3 py-1 gap-3 text-xs text-[#202833] overflow-x-auto select-none">
      {/* 1. Clipboard Group */}
      <div className="flex flex-col items-center justify-between h-full py-1 pr-3 border-r border-[#e5e9ee] flex-shrink-0">
        <div className="flex items-center gap-1 my-auto">
          <button
            onClick={duplicateSelectedElements}
            disabled={selectedElementIds.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-[#eef5f5] hover:text-[#087477] active:scale-95 rounded-[8px] disabled:opacity-40 text-xs font-medium text-[#202833] transition-all cursor-pointer"
            title="Duplicate Selected (Ctrl+D)"
          >
            <Copy size={15} className="text-[#087f83]" />
            <span>Duplicate</span>
          </button>

          <button
            onClick={deleteSelectedElements}
            disabled={selectedElementIds.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-red-50 active:scale-95 rounded-[8px] disabled:opacity-40 text-xs font-medium text-red-600 transition-all cursor-pointer"
            title="Delete Selected"
          >
            <Trash2 size={15} />
            <span>Delete</span>
          </button>
        </div>
        <span className="text-[10px] text-[#9aa4ae] font-bold uppercase tracking-[0.09em]">Clipboard</span>
      </div>

      {/* 2. Font Group */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-[#e5e9ee] flex-shrink-0 min-w-[220px]">
        <div className="space-y-1.5 my-auto">
          {/* Top row: Font family & Size */}
          <div className="flex items-center gap-1.5">
            <FontSelector
              value={selectedTextElement?.fontFamily || 'Inter'}
              onChange={(fontFamily) => updateSelectedElements({ fontFamily })}
              className="w-36"
            />

            <input
              type="number"
              min={8}
              max={120}
              className="bg-[#f8fafb] hover:bg-[#f3f5f7] border border-[#e5e9ee] rounded-[8px] px-2 py-1 text-xs outline-none w-14 focus:bg-white focus:border-[#73b9b7] font-medium transition text-center tabular-nums"
              value={selectedTextElement?.fontSize || 16}
              onChange={(e) => updateSelectedElements({ fontSize: Number(e.target.value) })}
            />
          </div>

          {/* Bottom row: Bold, Italic, Underline, Color, WordArt */}
          <div className="flex items-center gap-1">
            <div className="flex items-center bg-[#f3f5f7] p-0.5 rounded-[8px] border border-[#e5e9ee]">
              <button
                onClick={() =>
                  updateSelectedElements({
                    fontWeight: selectedTextElement?.fontWeight === 'bold' ? 'normal' : 'bold',
                  })
                }
                className={`p-1 rounded-[6px] transition-all cursor-pointer ${
                  selectedTextElement?.fontWeight === 'bold'
                    ? 'bg-[#e5f4f3] text-[#087477] font-bold'
                    : 'text-[#52606c] hover:text-[#202833] hover:bg-white/60'
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
                className={`p-1 rounded-[6px] transition-all cursor-pointer ${
                  selectedTextElement?.fontStyle === 'italic'
                    ? 'bg-[#e5f4f3] text-[#087477]'
                    : 'text-[#52606c] hover:text-[#202833] hover:bg-white/60'
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
                className={`p-1 rounded-[6px] transition-all cursor-pointer ${
                  selectedTextElement?.textDecoration === 'underline'
                    ? 'bg-[#e5f4f3] text-[#087477]'
                    : 'text-[#52606c] hover:text-[#202833] hover:bg-white/60'
                }`}
                title="Underline"
              >
                <Underline size={13} />
              </button>
            </div>

            <div className="w-[1px] h-4 bg-[#e5e9ee] mx-1" />

            {/* Modern color swatch */}
            <div className="flex items-center gap-1.5" title="Font Color">
              <div className="relative flex items-center justify-center">
                <input
                  type="color"
                  className="w-6 h-6 rounded-[6px] border border-[#e5e9ee] cursor-pointer overflow-hidden p-0"
                  value={selectedTextElement?.color || '#202833'}
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
              className={`p-1.5 rounded-[8px] transition-all flex items-center gap-1 ml-1 cursor-pointer ${
                selectedTextElement?.isWordArt
                  ? 'bg-[#e5f4f3] text-[#087477] border border-[#b7dddd]'
                  : 'hover:bg-[#eef5f5] text-[#52606c]'
              }`}
              title="WordArt Styles"
            >
              <Sparkles size={14} className="text-[#087f83]" />
            </button>
          </div>
        </div>
        <span className="text-[10px] text-[#9aa4ae] font-bold uppercase tracking-[0.09em] text-center">Font</span>
      </div>

      {/* 3. Paragraph Group */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-[#e5e9ee] flex-shrink-0">
        <div className="space-y-1.5 my-auto">
          {/* Alignment Segmented Control */}
          <div className="flex items-center bg-[#f3f5f7] p-0.5 rounded-[8px] border border-[#e5e9ee]">
            {(['left', 'center', 'right', 'justify'] as const).map((align) => (
              <button
                key={align}
                onClick={() => updateSelectedElements({ textAlign: align })}
                className={`p-1 rounded-[6px] transition-all cursor-pointer ${
                  selectedTextElement?.textAlign === align
                    ? 'bg-[#e5f4f3] text-[#087477]'
                    : 'text-[#52606c] hover:text-[#202833] hover:bg-white/60'
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
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#eef5f5] hover:text-[#087477] transition cursor-pointer tabular-nums"
              title="Toggle Multi-Columns"
            >
              <Columns size={12} className="text-[#087f83]" />
              <span>{selectedTextElement?.columns || 1} Col</span>
            </button>
            <button
              onClick={() =>
                updateSelectedElements({ dropCap: !selectedTextElement?.dropCap })
              }
              className={`text-[11px] font-medium px-2 py-0.5 rounded-[8px] border transition cursor-pointer ${
                selectedTextElement?.dropCap
                  ? 'bg-[#e5f4f3] border-[#b7dddd] text-[#087477] font-semibold'
                  : 'bg-[#f8fafb] border-[#e5e9ee] hover:bg-[#eef5f5] text-[#52606c]'
              }`}
              title="Toggle Large Initial Drop Cap"
            >
              Drop Cap
            </button>
          </div>
        </div>
        <span className="text-[10px] text-[#9aa4ae] font-bold uppercase tracking-[0.09em] text-center">Paragraph</span>
      </div>

      {/* 4. Objects Group */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-[#e5e9ee] flex-shrink-0">
        <div className="flex items-center gap-1 my-auto relative">
          {/* Draw Text Box */}
          <button
            onClick={() => addTextBox()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-[#eef5f5] hover:text-[#087477] active:scale-95 rounded-[8px] text-xs font-medium text-[#202833] transition-all cursor-pointer"
            title="Draw Text Box"
          >
            <Type size={15} className="text-[#087f83]" />
            <span>Text Box</span>
          </button>

          {/* Shapes Dropdown */}
          <div className="relative">
            <button
              ref={shapesBtnRef}
              onClick={() => setIsShapesOpen(!isShapesOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-[#eef5f5] hover:text-[#087477] active:scale-95 rounded-[8px] text-xs font-medium text-[#202833] transition-all cursor-pointer"
              title="Insert Shapes"
            >
              <Shapes size={15} className="text-[#087f83]" />
              <span>Shapes</span>
              <ChevronDown size={10} className="text-[#9aa4ae]" />
            </button>

            <FloatingDropdown
              isOpen={isShapesOpen}
              onClose={() => setIsShapesOpen(false)}
              anchorRef={shapesBtnRef}
              className="p-2.5 grid grid-cols-4 gap-1.5 w-72 max-h-72 overflow-y-auto"
            >
              {SHAPE_CATALOG.map((item) => (
                <button
                  key={item.type}
                  onClick={() => {
                    addShape(item.type);
                    setIsShapesOpen(false);
                  }}
                  className="p-2 hover:bg-[#eef5f5] hover:text-[#087477] rounded-[8px] text-center text-[10px] font-medium text-[#202833] flex flex-col items-center gap-1 transition cursor-pointer"
                >
                  <ShapePreviewIcon shapeType={item.type} size={24} />
                  <span className="truncate w-full">{item.label}</span>
                </button>
              ))}
            </FloatingDropdown>
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-[#eef5f5] hover:text-[#087477] active:scale-95 rounded-[8px] text-xs font-medium text-[#202833] transition-all cursor-pointer"
            title="Insert Picture"
          >
            <ImageIcon size={15} className="text-[#087f83]" />
            <span>Picture</span>
          </button>

          <button
            onClick={() => addPicturePlaceholder()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-[#eef5f5] hover:text-[#087477] active:scale-95 rounded-[8px] text-xs font-medium text-[#202833] transition-all cursor-pointer"
            title="Insert Picture Placeholder"
          >
            <ImagePlus size={15} className="text-[#087f83]" />
            <span>Placeholder</span>
          </button>
        </div>
        <span className="text-[10px] text-[#9aa4ae] font-bold uppercase tracking-[0.09em] text-center">Objects</span>
      </div>

      {/* 5. Arrange Group */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-[#e5e9ee] flex-shrink-0">
        <div className="space-y-1.5 my-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={bringToFront}
              disabled={selectedElementIds.length === 0}
              className="flex items-center gap-1 px-2 py-1 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#eef5f5] hover:text-[#087477] text-[11px] font-medium disabled:opacity-40 transition cursor-pointer"
              title="Bring to Front"
            >
              <BringToFront size={13} className="text-[#087f83]" />
              <span>Forward</span>
            </button>
            <button
              onClick={sendToBack}
              disabled={selectedElementIds.length === 0}
              className="flex items-center gap-1 px-2 py-1 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#eef5f5] hover:text-[#087477] text-[11px] font-medium disabled:opacity-40 transition cursor-pointer"
              title="Send to Back"
            >
              <SendToBack size={13} className="text-[#52606c]" />
              <span>Backward</span>
            </button>
          </div>

          <div className="flex items-center gap-1 relative">
            <button
              ref={alignBtnRef}
              onClick={() => setIsAlignOpen(!isAlignOpen)}
              disabled={selectedElementIds.length === 0}
              className="flex items-center justify-between w-full px-2.5 py-1 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#eef5f5] hover:text-[#087477] text-[11px] font-medium disabled:opacity-40 transition cursor-pointer"
            >
              <span>Align</span>
              <ChevronDown size={11} className="text-[#9aa4ae]" />
            </button>

            <FloatingDropdown
              isOpen={isAlignOpen}
              onClose={() => setIsAlignOpen(false)}
              anchorRef={alignBtnRef}
              className="p-1.5 w-44 space-y-0.5 text-xs text-[#202833]"
            >
              {(['left', 'center', 'right', 'top', 'middle', 'bottom'] as const).map(
                (alignment) => (
                  <button
                    key={alignment}
                    onClick={() => {
                      alignSelected(alignment);
                      setIsAlignOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-[#eef5f5] hover:text-[#087477] rounded-[8px] text-xs capitalize transition cursor-pointer"
                  >
                    Align {alignment}
                  </button>
                )
              )}
              <div className="border-t border-[#e5e9ee] my-1" />
              <button
                onClick={() => {
                  distributeSelected('horizontal');
                  setIsAlignOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 hover:bg-[#eef5f5] hover:text-[#087477] rounded-[8px] text-xs transition cursor-pointer"
              >
                Distribute Horizontally
              </button>
              <button
                onClick={() => {
                  distributeSelected('vertical');
                  setIsAlignOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 hover:bg-[#eef5f5] hover:text-[#087477] rounded-[8px] text-xs transition cursor-pointer"
              >
                Distribute Vertically
              </button>
            </FloatingDropdown>
          </div>
        </div>
        <span className="text-[10px] text-[#9aa4ae] font-bold uppercase tracking-[0.09em] text-center">Arrange</span>
      </div>

      {/* Design Ideas Group */}
      <div className="flex flex-col justify-between h-full py-1 px-2 flex-shrink-0">
        <div className="flex items-center my-auto">
          <button
            type="button"
            onClick={() => {
              setIsRightPanelOpen(true);
              setRightPanelTab('design-ideas');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e5f4f3] hover:bg-[#d5ecea] text-[#087477] border border-[#b7dddd] active:scale-95 rounded-[8px] text-xs font-semibold transition-all cursor-pointer"
            title="Open Design Recommendations Panel"
          >
            <Sparkles size={15} />
            <span>Design Ideas</span>
          </button>
        </div>
        <span className="text-[10px] text-[#9aa4ae] font-bold uppercase tracking-[0.09em] text-center">Designer</span>
      </div>
    </div>
  );
};
