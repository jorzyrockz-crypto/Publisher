import React, { useRef } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import {
  TextElement,
  ShapeElement,
  ImageElement,
  TableElement,
  AccentElement,
  WordArtStyle,
  BorderArtStyle,
  ShapeType,
} from '../../types/publisher';
import { PAGE_SIZES } from '../../constants/pageSizes';
import {
  Type,
  Square,
  Image as ImageIcon,
  Table as TableIcon,
  Palette,
  Columns,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Sparkles,
  Sliders,
  Upload,
} from 'lucide-react';

export const PropertiesPanel: React.FC = () => {
  const {
    activePage,
    selectedElementIds,
    updateElement,
    setPageSize,
    setPageOrientation,
    setPageMargins,
    setPageBackgroundColor,
  } = usePublisher();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedElement =
    selectedElementIds.length === 1
      ? activePage.elements.find((el) => el.id === selectedElementIds[0])
      : null;

  return (
    <div className="w-64 bg-[#f8fafc] border-l border-slate-300 flex flex-col h-full select-none flex-shrink-0 z-20 text-xs text-slate-700 overflow-y-auto">
      {/* Header */}
      <div className="h-8 bg-[#f1f5f9] border-b border-slate-300 px-3 flex items-center gap-1.5 font-semibold text-slate-700">
        <Sliders size={13} className="text-[#0f6b4e]" />
        <span>Format & Properties</span>
      </div>

      <div className="p-3 space-y-5">
        {/* Case 1: Page Properties (No Element Selected) */}
        {!selectedElement && (
          <div className="space-y-4">
            <div className="font-bold text-slate-800 flex items-center gap-1 pb-1 border-b border-slate-200">
              <Square size={13} className="text-[#0f6b4e]" />
              <span>Page Setup</span>
            </div>

            {/* Page Size */}
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Page Size</label>
              <select
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:border-[#0f6b4e]"
                value={
                  PAGE_SIZES.find(
                    (s) => s.width === activePage.width && s.height === activePage.height
                  )?.name || 'custom'
                }
                onChange={(e) => setPageSize(e.target.value)}
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size.name} value={size.name}>
                    {size.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Orientation */}
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Orientation</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPageOrientation('portrait')}
                  className={`py-1.5 px-2 rounded border text-center transition ${
                    activePage.orientation === 'portrait'
                      ? 'bg-emerald-50 border-[#0f6b4e] text-[#0f6b4e] font-semibold'
                      : 'bg-white border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Portrait
                </button>
                <button
                  onClick={() => setPageOrientation('landscape')}
                  className={`py-1.5 px-2 rounded border text-center transition ${
                    activePage.orientation === 'landscape'
                      ? 'bg-emerald-50 border-[#0f6b4e] text-[#0f6b4e] font-semibold'
                      : 'bg-white border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>

            {/* Margins */}
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Margins</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    setPageMargins({ top: 48, right: 48, bottom: 48, left: 48 })
                  }
                  className="py-1 px-2 rounded bg-white border border-slate-300 hover:bg-slate-50 text-left"
                >
                  Normal (0.5")
                </button>
                <button
                  onClick={() =>
                    setPageMargins({ top: 24, right: 24, bottom: 24, left: 24 })
                  }
                  className="py-1 px-2 rounded bg-white border border-slate-300 hover:bg-slate-50 text-left"
                >
                  Narrow (0.25")
                </button>
                <button
                  onClick={() =>
                    setPageMargins({ top: 96, right: 96, bottom: 96, left: 96 })
                  }
                  className="py-1 px-2 rounded bg-white border border-slate-300 hover:bg-slate-50 text-left"
                >
                  Wide (1.0")
                </button>
                <button
                  onClick={() => setPageMargins({ top: 0, right: 0, bottom: 0, left: 0 })}
                  className="py-1 px-2 rounded bg-white border border-slate-300 hover:bg-slate-50 text-left"
                >
                  None (0")
                </button>
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Background Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={activePage.backgroundColor}
                  onChange={(e) => setPageBackgroundColor(e.target.value)}
                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                />
                <span className="font-mono text-[11px] text-slate-600">
                  {activePage.backgroundColor.toUpperCase()}
                </span>
                <button
                  onClick={() => setPageBackgroundColor('#ffffff')}
                  className="ml-auto text-[10px] text-slate-500 hover:underline"
                >
                  Reset White
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Case 2: Text Frame Properties */}
        {selectedElement && selectedElement.type === 'text' && (
          <div className="space-y-4">
            <div className="font-bold text-slate-800 flex items-center gap-1 pb-1 border-b border-slate-200">
              <Type size={13} className="text-[#0f6b4e]" />
              <span>Text Format</span>
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Font Family</label>
              <select
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none"
                value={(selectedElement as TextElement).fontFamily}
                onChange={(e) =>
                  updateElement(selectedElement.id, { fontFamily: e.target.value })
                }
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
            </div>

            {/* Font Size & Color */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 mb-1 font-medium">Font Size</label>
                <input
                  type="number"
                  min={8}
                  max={120}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none"
                  value={(selectedElement as TextElement).fontSize}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      fontSize: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-medium">Text Color</label>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                    value={(selectedElement as TextElement).color}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { color: e.target.value })
                    }
                  />
                  <span className="font-mono text-[10px] text-slate-500 truncate">
                    {(selectedElement as TextElement).color}
                  </span>
                </div>
              </div>
            </div>

            {/* Alignment & Style Buttons */}
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Alignment & Style</label>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200">
                {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => updateElement(selectedElement.id, { textAlign: align })}
                    className={`p-1 rounded transition ${
                      (selectedElement as TextElement).textAlign === align
                        ? 'bg-white shadow text-[#0f6b4e]'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {align === 'left' && <AlignLeft size={13} />}
                    {align === 'center' && <AlignCenter size={13} />}
                    {align === 'right' && <AlignRight size={13} />}
                    {align === 'justify' && <AlignJustify size={13} />}
                  </button>
                ))}
                <div className="w-[1px] h-4 bg-slate-300 mx-1" />
                <button
                  onClick={() =>
                    updateElement(selectedElement.id, {
                      fontWeight:
                        (selectedElement as TextElement).fontWeight === 'bold' ? 'normal' : 'bold',
                    })
                  }
                  className={`p-1 rounded transition ${
                    (selectedElement as TextElement).fontWeight === 'bold'
                      ? 'bg-white shadow text-[#0f6b4e]'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Bold size={13} />
                </button>
                <button
                  onClick={() =>
                    updateElement(selectedElement.id, {
                      fontStyle:
                        (selectedElement as TextElement).fontStyle === 'italic'
                          ? 'normal'
                          : 'italic',
                    })
                  }
                  className={`p-1 rounded transition ${
                    (selectedElement as TextElement).fontStyle === 'italic'
                      ? 'bg-white shadow text-[#0f6b4e]'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Italic size={13} />
                </button>
                <button
                  onClick={() =>
                    updateElement(selectedElement.id, {
                      textDecoration:
                        (selectedElement as TextElement).textDecoration === 'underline'
                          ? 'none'
                          : 'underline',
                    })
                  }
                  className={`p-1 rounded transition ${
                    (selectedElement as TextElement).textDecoration === 'underline'
                      ? 'bg-white shadow text-[#0f6b4e]'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Underline size={13} />
                </button>
              </div>
            </div>

            {/* Multi-Columns */}
            <div>
              <label className="block text-slate-500 mb-1 font-medium flex items-center justify-between">
                <span>Columns</span>
                <span className="text-[10px] text-slate-400">Multi-column layout</span>
              </label>
              <div className="grid grid-cols-3 gap-1">
                {([1, 2, 3] as const).map((col) => (
                  <button
                    key={col}
                    onClick={() => updateElement(selectedElement.id, { columns: col })}
                    className={`py-1 rounded border text-center transition ${
                      (selectedElement as TextElement).columns === col
                        ? 'bg-emerald-50 border-[#0f6b4e] text-[#0f6b4e] font-bold'
                        : 'bg-white border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {col} {col === 1 ? 'Col' : 'Cols'}
                  </button>
                ))}
              </div>
            </div>

            {/* Drop Cap Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="font-medium text-slate-700">Drop Cap</span>
                <p className="text-[10px] text-slate-400">Large decorative first letter</p>
              </div>
              <input
                type="checkbox"
                checked={(selectedElement as TextElement).dropCap || false}
                onChange={(e) =>
                  updateElement(selectedElement.id, { dropCap: e.target.checked })
                }
                className="w-4 h-4 accent-[#0f6b4e] cursor-pointer"
              />
            </div>

            {/* WordArt Style */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-slate-500 mb-1 font-medium flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500" />
                <span>WordArt Styling</span>
              </label>
              <select
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none"
                value={(selectedElement as TextElement).wordArtStyle || 'none'}
                onChange={(e) => {
                  const style = e.target.value as WordArtStyle;
                  updateElement(selectedElement.id, {
                    isWordArt: style !== 'none',
                    wordArtStyle: style,
                  });
                }}
              >
                <option value="none">Standard Text</option>
                <option value="gold3d">Gold 3D Extrusion</option>
                <option value="rainbow">Rainbow Gradient</option>
                <option value="outline">Cyan Bold Outline</option>
                <option value="retro">Retro Pop 3D</option>
              </select>
            </div>
          </div>
        )}

        {/* Case 3: Shape Properties */}
        {selectedElement && selectedElement.type === 'shape' && (
          <div className="space-y-4">
            <div className="font-bold text-slate-800 flex items-center gap-1 pb-1 border-b border-slate-200">
              <Square size={13} className="text-[#0f6b4e]" />
              <span>Shape Formatting</span>
            </div>

            {/* Shape Type Selector */}
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Shape Geometry</label>
              <select
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none"
                value={(selectedElement as ShapeElement).shapeType}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    shapeType: e.target.value as ShapeType,
                  })
                }
              >
                <option value="rectangle">Rectangle</option>
                <option value="rounded-rect">Rounded Rectangle</option>
                <option value="circle">Oval / Circle</option>
                <option value="triangle">Triangle</option>
                <option value="star">5-Point Star</option>
                <option value="banner">Ribbon Banner</option>
                <option value="callout">Speech Callout</option>
                <option value="arrow-right">Block Arrow</option>
                <option value="diamond">Diamond</option>
                <option value="heart">Heart</option>
              </select>
            </div>

            {/* Fill Color */}
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Shape Fill</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(selectedElement as ShapeElement).fillColor}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { fillColor: e.target.value })
                  }
                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                />
                <span className="font-mono text-[11px] text-slate-600">
                  {(selectedElement as ShapeElement).fillColor}
                </span>
                <button
                  onClick={() =>
                    updateElement(selectedElement.id, { fillColor: 'transparent' })
                  }
                  className="ml-auto text-[10px] text-slate-500 hover:underline"
                >
                  No Fill
                </button>
              </div>
            </div>

            {/* Stroke / Outline */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 mb-1 font-medium">Outline Color</label>
                <input
                  type="color"
                  value={(selectedElement as ShapeElement).strokeColor}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { strokeColor: e.target.value })
                  }
                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-medium">Stroke Width</label>
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={(selectedElement as ShapeElement).strokeWidth}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      strokeWidth: Number(e.target.value),
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none"
                />
              </div>
            </div>

            {/* Drop Shadow */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="font-medium text-slate-700">Drop Shadow</span>
                <p className="text-[10px] text-slate-400">Soft realistic depth shadow</p>
              </div>
              <input
                type="checkbox"
                checked={(selectedElement as ShapeElement).shadow || false}
                onChange={(e) =>
                  updateElement(selectedElement.id, { shadow: e.target.checked })
                }
                className="w-4 h-4 accent-[#0f6b4e] cursor-pointer"
              />
            </div>

            {/* Shape Label */}
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Center Text Label</label>
              <input
                type="text"
                placeholder="Optional text in shape..."
                value={(selectedElement as ShapeElement).label || ''}
                onChange={(e) =>
                  updateElement(selectedElement.id, { label: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none"
              />
            </div>
          </div>
        )}

        {/* Case 4: Image Properties */}
        {selectedElement && selectedElement.type === 'image' && (
          <div className="space-y-4">
            <div className="font-bold text-slate-800 flex items-center gap-1 pb-1 border-b border-slate-200">
              <ImageIcon size={13} className="text-[#0f6b4e]" />
              <span>Picture Tools</span>
            </div>

            {/* Upload or replace image */}
            <div>
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
                      updateElement(selectedElement.id, {
                        src: event.target?.result as string,
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-1.5 px-3 bg-[#0f6b4e] text-white rounded font-medium flex items-center justify-center gap-1.5 hover:bg-[#0c533c] transition shadow-sm"
              >
                <Upload size={13} />
                <span>Replace Picture...</span>
              </button>
            </div>

            {/* BorderArt */}
            <div>
              <label className="block text-slate-500 mb-1 font-medium">BorderArt Decorative Frame</label>
              <select
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none"
                value={(selectedElement as ImageElement).borderArt || 'none'}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    borderArt: e.target.value as BorderArtStyle,
                  })
                }
              >
                <option value="none">No BorderArt</option>
                <option value="double-gold">Double Gold Frame</option>
                <option value="art-deco">Art Deco Slate</option>
                <option value="dots-and-dashes">Dashed Green Trim</option>
              </select>
            </div>

            {/* Mask Shape */}
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Crop to Shape</label>
              <div className="grid grid-cols-3 gap-1">
                {(['none', 'rounded', 'circle'] as const).map((mask) => (
                  <button
                    key={mask}
                    onClick={() => updateElement(selectedElement.id, { maskShape: mask })}
                    className={`py-1 rounded border text-center transition capitalize ${
                      (selectedElement as ImageElement).maskShape === mask
                        ? 'bg-emerald-50 border-[#0f6b4e] text-[#0f6b4e] font-bold'
                        : 'bg-white border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {mask}
                  </button>
                ))}
              </div>
            </div>

            {/* Adjustments: Brightness & Contrast */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="block text-slate-700 font-semibold">Image Adjustments</label>
              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Brightness</span>
                  <span>{(selectedElement as ImageElement).brightness || 100}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={(selectedElement as ImageElement).brightness || 100}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      brightness: Number(e.target.value),
                    })
                  }
                  className="w-full accent-[#0f6b4e] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Contrast</span>
                  <span>{(selectedElement as ImageElement).contrast || 100}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={(selectedElement as ImageElement).contrast || 100}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      contrast: Number(e.target.value),
                    })
                  }
                  className="w-full accent-[#0f6b4e] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Case 5: Table Properties */}
        {selectedElement && selectedElement.type === 'table' && (
          <div className="space-y-4">
            <div className="font-bold text-slate-800 flex items-center gap-1 pb-1 border-b border-slate-200">
              <TableIcon size={13} className="text-[#0f6b4e]" />
              <span>Table Tools</span>
            </div>

            <div>
              <label className="block text-slate-500 mb-1 font-medium">Header Fill Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(selectedElement as TableElement).headerBg}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { headerBg: e.target.value })
                  }
                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                />
                <span className="font-mono text-[11px] text-slate-600">
                  {(selectedElement as TableElement).headerBg}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-500 mb-1 font-medium">Table Border</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(selectedElement as TableElement).borderColor}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { borderColor: e.target.value })
                  }
                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                />
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={(selectedElement as TableElement).borderWidth}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      borderWidth: Number(e.target.value),
                    })
                  }
                  className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none"
                />
                <span className="text-slate-400">px</span>
              </div>
            </div>
          </div>
        )}

        {/* Multi-Selection or Generic Dimensions */}
        {selectedElement && (
          <div className="pt-3 border-t border-slate-200">
            <div className="font-semibold text-slate-700 mb-2">Size & Position</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400">X:</span>{' '}
                <span className="font-mono font-semibold">{Math.round(selectedElement.x)}px</span>
              </div>
              <div>
                <span className="text-slate-400">Y:</span>{' '}
                <span className="font-mono font-semibold">{Math.round(selectedElement.y)}px</span>
              </div>
              <div>
                <span className="text-slate-400">W:</span>{' '}
                <span className="font-mono font-semibold">{Math.round(selectedElement.width)}px</span>
              </div>
              <div>
                <span className="text-slate-400">H:</span>{' '}
                <span className="font-mono font-semibold">{Math.round(selectedElement.height)}px</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
