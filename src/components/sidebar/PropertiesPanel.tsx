import React, { useRef } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import {
  TextElement,
  ShapeElement,
  ImageElement,
  TableElement,
  QRElement,
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
  QrCode,
  Lock,
  Unlock,
} from 'lucide-react';

export const PropertiesPanel: React.FC = () => {
  const {
    project,
    activePage,
    isEditingMaster,
    selectedElementIds,
    updateElement,
    toggleElementLock,
    setPageSize,
    setPageOrientation,
    setPageMargins,
    setPageBackgroundColor,
  } = usePublisher();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const elementsPool = isEditingMaster
    ? project.masterPage?.elements || []
    : activePage.elements;

  const selectedElement =
    selectedElementIds.length === 1
      ? elementsPool.find((el) => el.id === selectedElementIds[0])
      : null;

  return (
    <div className="w-72 bg-white/95 backdrop-blur-md border-l border-slate-200 flex flex-col h-full select-none flex-shrink-0 z-20 text-xs text-slate-700 overflow-y-auto shadow-2xs">
      {/* Header */}
      <div className="h-9 px-3.5 flex items-center gap-2 font-bold text-xs text-slate-700 border-b border-slate-200/80 bg-slate-50/70">
        <Sliders size={14} className="text-emerald-700" />
        <span>Inspector</span>
      </div>

      <div className="p-3.5 space-y-4">
        {/* Case 1: Page Properties (No Element Selected) */}
        {!selectedElement && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3.5 shadow-2xs">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Square size={14} className="text-emerald-700" />
                <span>Page Layout</span>
              </div>

              {/* Page Size */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Page Size
                </label>
                <select
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition cursor-pointer"
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
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Orientation
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                  <button
                    onClick={() => setPageOrientation('portrait')}
                    className={`py-1 px-2 rounded-lg text-xs font-semibold transition-all ${
                      activePage.orientation === 'portrait'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Portrait
                  </button>
                  <button
                    onClick={() => setPageOrientation('landscape')}
                    className={`py-1 px-2 rounded-lg text-xs font-semibold transition-all ${
                      activePage.orientation === 'landscape'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Landscape
                  </button>
                </div>
              </div>

              {/* Margins */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Margins
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() =>
                      setPageMargins({ top: 48, right: 48, bottom: 48, left: 48 })
                    }
                    className="py-1.5 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left font-medium text-[11px] transition shadow-2xs"
                  >
                    Normal (0.5")
                  </button>
                  <button
                    onClick={() =>
                      setPageMargins({ top: 24, right: 24, bottom: 24, left: 24 })
                    }
                    className="py-1.5 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left font-medium text-[11px] transition shadow-2xs"
                  >
                    Narrow (0.25")
                  </button>
                  <button
                    onClick={() =>
                      setPageMargins({ top: 96, right: 96, bottom: 96, left: 96 })
                    }
                    className="py-1.5 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left font-medium text-[11px] transition shadow-2xs"
                  >
                    Wide (1.0")
                  </button>
                  <button
                    onClick={() => setPageMargins({ top: 0, right: 0, bottom: 0, left: 0 })}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left font-medium text-[11px] transition shadow-2xs"
                  >
                    None (0")
                  </button>
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Canvas Background
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={activePage.backgroundColor}
                    onChange={(e) => setPageBackgroundColor(e.target.value)}
                    className="w-7 h-7 rounded-full border border-slate-200 cursor-pointer overflow-hidden p-0 shadow-2xs"
                  />
                  <span className="font-mono text-[11px] text-slate-600 font-semibold">
                    {activePage.backgroundColor.toUpperCase()}
                  </span>
                  <button
                    onClick={() => setPageBackgroundColor('#ffffff')}
                    className="ml-auto text-[11px] font-medium text-emerald-700 hover:underline"
                  >
                    White
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Case 2: Text Frame Properties */}
        {selectedElement && selectedElement.type === 'text' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3.5 shadow-2xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Type size={14} className="text-emerald-700" />
              <span>Typography</span>
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Font Family
              </label>
              <select
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition cursor-pointer"
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
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Size
                </label>
                <input
                  type="number"
                  min={8}
                  max={120}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition text-center"
                  value={(selectedElement as TextElement).fontSize}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      fontSize: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Color
                </label>
                <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <input
                    type="color"
                    className="w-6 h-6 rounded-full border border-slate-200 cursor-pointer overflow-hidden p-0 shadow-2xs"
                    value={(selectedElement as TextElement).color}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { color: e.target.value })
                    }
                  />
                  <span className="font-mono text-[10px] text-slate-600 font-semibold truncate">
                    {(selectedElement as TextElement).color}
                  </span>
                </div>
              </div>
            </div>

            {/* Alignment & Style Buttons */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Alignment & Format
              </label>
              <div className="flex items-center justify-between bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => updateElement(selectedElement.id, { textAlign: align })}
                    className={`p-1.5 rounded-lg transition-all ${
                      (selectedElement as TextElement).textAlign === align
                        ? 'bg-white shadow-xs text-emerald-800'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    {align === 'left' && <AlignLeft size={13} />}
                    {align === 'center' && <AlignCenter size={13} />}
                    {align === 'right' && <AlignRight size={13} />}
                    {align === 'justify' && <AlignJustify size={13} />}
                  </button>
                ))}
                <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />
                <button
                  onClick={() =>
                    updateElement(selectedElement.id, {
                      fontWeight:
                        (selectedElement as TextElement).fontWeight === 'bold' ? 'normal' : 'bold',
                    })
                  }
                  className={`p-1.5 rounded-lg transition-all ${
                    (selectedElement as TextElement).fontWeight === 'bold'
                      ? 'bg-white shadow-xs text-emerald-800 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
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
                  className={`p-1.5 rounded-lg transition-all ${
                    (selectedElement as TextElement).fontStyle === 'italic'
                      ? 'bg-white shadow-xs text-emerald-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
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
                  className={`p-1.5 rounded-lg transition-all ${
                    (selectedElement as TextElement).textDecoration === 'underline'
                      ? 'bg-white shadow-xs text-emerald-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Underline size={13} />
                </button>
              </div>
            </div>

            {/* Multi-Columns */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Columns
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                {([1, 2, 3] as const).map((col) => (
                  <button
                    key={col}
                    onClick={() => updateElement(selectedElement.id, { columns: col })}
                    className={`py-1 rounded-lg text-xs font-semibold transition-all ${
                      (selectedElement as TextElement).columns === col
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {col} {col === 1 ? 'Col' : 'Cols'}
                  </button>
                ))}
              </div>
            </div>

            {/* Drop Cap Toggle */}
            <div
              onClick={() =>
                updateElement(selectedElement.id, {
                  dropCap: !(selectedElement as TextElement).dropCap,
                })
              }
              className="flex items-center justify-between pt-1 cursor-pointer hover:opacity-90"
            >
              <div>
                <span className="font-semibold text-slate-800">Drop Cap</span>
                <p className="text-[10px] text-slate-400">Large decorative initial</p>
              </div>
              <div
                className={`fluent-switch ${
                  (selectedElement as TextElement).dropCap ? 'active' : ''
                }`}
              >
                <div className="fluent-switch-knob" />
              </div>
            </div>

            {/* WordArt Style */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                <Sparkles size={13} className="text-amber-500" />
                <span>WordArt Styling</span>
              </label>
              <select
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition cursor-pointer"
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
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3.5 shadow-2xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Square size={14} className="text-emerald-700" />
              <span>Shape Formatting</span>
            </div>

            {/* Shape Type Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Shape Geometry
              </label>
              <select
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition cursor-pointer"
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
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Fill Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(selectedElement as ShapeElement).fillColor}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { fillColor: e.target.value })
                  }
                  className="w-7 h-7 rounded-full border border-slate-200 cursor-pointer overflow-hidden p-0 shadow-2xs"
                />
                <span className="font-mono text-[11px] text-slate-600 font-semibold">
                  {(selectedElement as ShapeElement).fillColor}
                </span>
                <button
                  onClick={() =>
                    updateElement(selectedElement.id, { fillColor: 'transparent' })
                  }
                  className="ml-auto text-[11px] font-medium text-emerald-700 hover:underline"
                >
                  No Fill
                </button>
              </div>
            </div>

            {/* Stroke / Outline */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Outline
                </label>
                <input
                  type="color"
                  value={(selectedElement as ShapeElement).strokeColor}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { strokeColor: e.target.value })
                  }
                  className="w-7 h-7 rounded-full border border-slate-200 cursor-pointer overflow-hidden p-0 shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Width (px)
                </label>
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
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2 py-1 text-xs outline-none focus:bg-white text-center font-medium"
                />
              </div>
            </div>

            {/* Drop Shadow Switch */}
            <div
              onClick={() =>
                updateElement(selectedElement.id, {
                  shadow: !(selectedElement as ShapeElement).shadow,
                })
              }
              className="flex items-center justify-between pt-1 cursor-pointer hover:opacity-90"
            >
              <div>
                <span className="font-semibold text-slate-800">Drop Shadow</span>
                <p className="text-[10px] text-slate-400">Soft realistic depth</p>
              </div>
              <div
                className={`fluent-switch ${
                  (selectedElement as ShapeElement).shadow ? 'active' : ''
                }`}
              >
                <div className="fluent-switch-knob" />
              </div>
            </div>

            {/* Shape Label */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Center Label
              </label>
              <input
                type="text"
                placeholder="Optional text in shape..."
                value={(selectedElement as ShapeElement).label || ''}
                onChange={(e) =>
                  updateElement(selectedElement.id, { label: e.target.value })
                }
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:bg-white font-medium"
              />
            </div>
          </div>
        )}

        {/* Case 4: Image Properties */}
        {selectedElement && selectedElement.type === 'image' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3.5 shadow-2xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <ImageIcon size={14} className="text-emerald-700" />
              <span>Picture Tools</span>
            </div>

            {/* Replace image */}
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
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
              >
                <Upload size={13} />
                <span>Replace Picture...</span>
              </button>
            </div>

            {/* BorderArt */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                BorderArt Decorative Frame
              </label>
              <select
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:bg-white font-medium cursor-pointer"
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
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Crop to Shape
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                {(['none', 'rounded', 'circle'] as const).map((mask) => (
                  <button
                    key={mask}
                    onClick={() => updateElement(selectedElement.id, { maskShape: mask })}
                    className={`py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                      (selectedElement as ImageElement).maskShape === mask
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mask}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Adjustments */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="block text-slate-700 font-bold text-[11px]">
                Adjustments
              </label>
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-1">
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
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-1">
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
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Case 5: Table Properties */}
        {selectedElement && selectedElement.type === 'table' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3.5 shadow-2xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <TableIcon size={14} className="text-emerald-700" />
              <span>Table Tools</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Header Fill Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(selectedElement as TableElement).headerBg}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { headerBg: e.target.value })
                  }
                  className="w-7 h-7 rounded-full border border-slate-200 cursor-pointer overflow-hidden p-0 shadow-2xs"
                />
                <span className="font-mono text-[11px] text-slate-600 font-semibold">
                  {(selectedElement as TableElement).headerBg}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Table Border
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(selectedElement as TableElement).borderColor}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { borderColor: e.target.value })
                  }
                  className="w-7 h-7 rounded-full border border-slate-200 cursor-pointer overflow-hidden p-0 shadow-2xs"
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
                  className="w-14 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs outline-none text-center font-medium"
                />
                <span className="text-slate-400 text-[11px]">px</span>
              </div>
            </div>
          </div>
        )}

        {/* Case 6: QR Code Properties */}
        {selectedElement && selectedElement.type === 'qr' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3.5 shadow-2xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <QrCode size={14} className="text-emerald-700" />
              <span>QR Code Generator</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                URL or Text Content
              </label>
              <textarea
                rows={3}
                value={(selectedElement as QRElement).value}
                onChange={(e) =>
                  updateElement(selectedElement.id, { value: e.target.value })
                }
                placeholder="https://example.com"
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Foreground
                </label>
                <input
                  type="color"
                  value={(selectedElement as QRElement).fgColor}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { fgColor: e.target.value })
                  }
                  className="w-7 h-7 rounded-full border border-slate-200 cursor-pointer overflow-hidden p-0 shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Background
                </label>
                <input
                  type="color"
                  value={(selectedElement as QRElement).bgColor}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { bgColor: e.target.value })
                  }
                  className="w-7 h-7 rounded-full border border-slate-200 cursor-pointer overflow-hidden p-0 shadow-2xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Selected Geometry, Opacity, Rotation & Lock */}
        {selectedElement && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-700 text-[11px]">Transform & Opacity</div>
              <button
                onClick={() => toggleElementLock(selectedElement.id)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                  selectedElement.locked
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {selectedElement.locked ? <Lock size={10} /> : <Unlock size={10} />}
                <span>{selectedElement.locked ? 'Locked' : 'Lock'}</span>
              </button>
            </div>

            {/* Opacity Slider */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-1">
                <span>Opacity</span>
                <span>{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round((selectedElement.opacity ?? 1) * 100)}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    opacity: Number(e.target.value) / 100,
                  })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Rotation Input */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">Rotation (°)</span>
              <input
                type="number"
                min={0}
                max={360}
                value={Math.round(selectedElement.rotation)}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    rotation: Number(e.target.value) % 360,
                  })
                }
                className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs outline-none text-center font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
              <div className="bg-slate-50 px-2 py-1 rounded-lg">
                <span className="text-slate-400">X:</span>{' '}
                <span className="font-mono font-bold text-slate-700">{Math.round(selectedElement.x)}px</span>
              </div>
              <div className="bg-slate-50 px-2 py-1 rounded-lg">
                <span className="text-slate-400">Y:</span>{' '}
                <span className="font-mono font-bold text-slate-700">{Math.round(selectedElement.y)}px</span>
              </div>
              <div className="bg-slate-50 px-2 py-1 rounded-lg">
                <span className="text-slate-400">W:</span>{' '}
                <span className="font-mono font-bold text-slate-700">{Math.round(selectedElement.width)}px</span>
              </div>
              <div className="bg-slate-50 px-2 py-1 rounded-lg">
                <span className="text-slate-400">H:</span>{' '}
                <span className="font-mono font-bold text-slate-700">{Math.round(selectedElement.height)}px</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
