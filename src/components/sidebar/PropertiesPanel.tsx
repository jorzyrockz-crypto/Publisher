import React, { useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import {
  TextElement,
  ShapeElement,
  ImageElement,
  TableElement,
  QRElement,
  ConnectorElement,
  WordArtStyle,
  BorderArtStyle,
  ShapeType,
} from '../../types/publisher';
import { PAGE_SIZES } from '../../constants/pageSizes';
import { TABLE_THEMES } from '../../constants/tableThemes';
import { FontSelector } from '../common/FontSelector';
import { FloatingDropdown } from '../common/FloatingDropdown';
import { ShapePreviewIcon } from '../common/ShapePreviewIcon';
import { SHAPE_CATALOG } from '../../utils/shapePaths';
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
  FlipHorizontal2,
  FlipVertical2,
  RotateCcw,
  PanelRightClose,
  PanelRightOpen,
  ChevronDown,
  GitMerge,
  Workflow,
  Waves,
  Group,
  Ungroup,
  Copy,
  Trash2,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Layers,
} from 'lucide-react';

export const PropertiesPanel: React.FC = () => {
  const {
    project,
    activePage,
    isEditingMaster,
    isRightPanelOpen,
    setIsRightPanelOpen,
    selectedElementIds,
    updateElement,
    updateSelectedElements,
    deleteSelectedElements,
    duplicateSelectedElements,
    toggleElementLock,
    groupSelected,
    ungroupSelected,
    alignSelected,
    distributeSelected,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    mergeSelectedShapes,
    autoConnectSelectedShapes,
    disconnectSelectedShapes,
    addConnectedDiagramStep,
    setPageSize,
    setPageOrientation,
    setPageMargins,
    setPageBackgroundColor,
  } = usePublisher();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const shapePickerBtnRef = useRef<HTMLButtonElement>(null);
  const [isShapePickerOpen, setIsShapePickerOpen] = useState(false);
  const [typoTab, setTypoTab] = useState<'character' | 'paragraph' | 'effects'>('character');

  const elementsPool = isEditingMaster
    ? project.masterPage?.elements || []
    : activePage.elements;

  const selectedElements = elementsPool.filter((el) => selectedElementIds.includes(el.id));
  const hasGroupedItem = selectedElements.some((el) => Boolean(el.groupId));
  const isUnifiedGroup =
    selectedElements.length >= 2 &&
    Boolean(selectedElements[0]?.groupId) &&
    selectedElements.every((el) => el.groupId === selectedElements[0]?.groupId);
  const allSelectedLocked =
    selectedElements.length > 0 && selectedElements.every((el) => Boolean(el.locked));
  const avgGroupOpacity =
    selectedElements.length > 0
      ? Math.round(
          (selectedElements.reduce((sum, el) => sum + (el.opacity ?? 1), 0) /
            selectedElements.length) *
            100
        )
      : 100;

  const selectedElement =
    selectedElementIds.length === 1
      ? elementsPool.find((el) => el.id === selectedElementIds[0])
      : null;

  if (!isRightPanelOpen) {
    return (
      <div className="w-9 bg-white border-l border-slate-200 flex flex-col items-center py-2.5 gap-3 h-full select-none flex-shrink-0 z-20 shadow-2xs">
        <button
          onClick={() => setIsRightPanelOpen(true)}
          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 transition"
          title="Expand Inspector Panel"
        >
          <PanelRightOpen size={15} />
        </button>
        <div
          onClick={() => setIsRightPanelOpen(true)}
          className="text-[10px] font-bold tracking-widest text-slate-400 uppercase cursor-pointer hover:text-emerald-700 transition"
          style={{ writingMode: 'vertical-rl' }}
        >
          Inspector
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white border-l border-slate-200 flex flex-col h-full select-none flex-shrink-0 z-20 text-xs text-slate-700 overflow-y-auto shadow-2xs transition-all">
      {/* Header */}
      <div className="h-9 px-3.5 flex items-center justify-between font-bold text-xs text-slate-700 border-b border-slate-200/80 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <Sliders size={14} className="text-emerald-700" />
          <span>Inspector</span>
        </div>
        <button
          onClick={() => setIsRightPanelOpen(false)}
          className="p-1 hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 rounded-lg transition"
          title="Collapse Right Panel"
        >
          <PanelRightClose size={14} />
        </button>
      </div>

      <div className="p-3.5 space-y-4">
        {/* Multi-Selection: Group, Align, Merge Shapes & Diagram Auto-Connect */}
        {selectedElementIds.length >= 2 && (
          <div className="space-y-4">
            {/* Group & Selection Actions */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3 shadow-2xs">
              <div className="font-bold text-slate-800 flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Group size={14} className="text-emerald-700" />
                  <span>Group ({selectedElementIds.length} items)</span>
                </div>
                {isUnifiedGroup && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Grouped
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={groupSelected}
                  disabled={isUnifiedGroup}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition ${
                    isUnifiedGroup
                      ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400'
                  }`}
                >
                  <Group size={13} />
                  <span>Group</span>
                </button>
                <button
                  onClick={ungroupSelected}
                  disabled={!hasGroupedItem}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition ${
                    !hasGroupedItem
                      ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800'
                  }`}
                >
                  <Ungroup size={13} />
                  <span>Ungroup</span>
                </button>
              </div>

              {/* Quick Group Actions */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={duplicateSelectedElements}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 text-[11px] font-semibold transition"
                  title="Duplicate Selection"
                >
                  <Copy size={12} />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={() => updateSelectedElements({ locked: !allSelectedLocked })}
                  className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border text-[11px] font-semibold transition ${
                    allSelectedLocked
                      ? 'border-amber-300 bg-amber-50 text-amber-800'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                  title={allSelectedLocked ? 'Unlock Group' : 'Lock Group'}
                >
                  {allSelectedLocked ? <Unlock size={12} /> : <Lock size={12} />}
                  <span>{allSelectedLocked ? 'Unlock' : 'Lock'}</span>
                </button>
                <button
                  onClick={deleteSelectedElements}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-[11px] font-semibold transition"
                  title="Delete Selection"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              </div>

              {/* Align & Distribute */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Align & Distribute
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {(
                    [
                      { key: 'left', label: 'Left' },
                      { key: 'center', label: 'Center' },
                      { key: 'right', label: 'Right' },
                      { key: 'top', label: 'Top' },
                      { key: 'middle', label: 'Middle' },
                      { key: 'bottom', label: 'Bottom' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.key}
                      onClick={() => alignSelected(item.key)}
                      className="py-1 px-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 text-[10.5px] font-semibold transition"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                {selectedElementIds.length >= 3 && (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => distributeSelected('horizontal')}
                      className="py-1 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 text-[10.5px] font-semibold transition"
                    >
                      Distribute Horiz.
                    </button>
                    <button
                      onClick={() => distributeSelected('vertical')}
                      className="py-1 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 text-[10.5px] font-semibold transition"
                    >
                      Distribute Vert.
                    </button>
                  </div>
                )}
              </div>

              {/* Layer Order & Group Opacity */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1">
                    <Layers size={11} /> Arrange Order
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    onClick={bringToFront}
                    className="flex flex-col items-center py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-[9.5px] font-semibold transition"
                    title="Bring to Front"
                  >
                    <ArrowUpToLine size={12} />
                    <span>Front</span>
                  </button>
                  <button
                    onClick={bringForward}
                    className="flex flex-col items-center py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-[9.5px] font-semibold transition"
                    title="Bring Forward"
                  >
                    <ArrowUp size={12} />
                    <span>Fwd</span>
                  </button>
                  <button
                    onClick={sendBackward}
                    className="flex flex-col items-center py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-[9.5px] font-semibold transition"
                    title="Send Backward"
                  >
                    <ArrowDown size={12} />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={sendToBack}
                    className="flex flex-col items-center py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-[9.5px] font-semibold transition"
                    title="Send to Back"
                  >
                    <ArrowDownToLine size={12} />
                    <span>Bottom</span>
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-0.5">
                    <span>Group Opacity</span>
                    <span>{avgGroupOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={avgGroupOpacity}
                    onChange={(e) =>
                      updateSelectedElements({ opacity: Number(e.target.value) / 100 })
                    }
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3 shadow-2xs">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <GitMerge size={14} className="text-emerald-700" />
                <span>Merge Shapes ({selectedElementIds.length} selected)</span>
              </div>
              <p className="text-[10.5px] text-slate-500">
                Combine overlapping shapes just like PowerPoint:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { op: 'union', label: 'Union' },
                    { op: 'combine', label: 'Combine' },
                    { op: 'subtract', label: 'Subtract' },
                    { op: 'intersect', label: 'Intersect' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.op}
                    onClick={() => mergeSelectedShapes(item.op)}
                    className="py-1.5 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-800 text-xs font-semibold transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const idSet = new Set(selectedElementIds);
              const existingConnectors = elementsPool.filter(
                (el): el is ConnectorElement =>
                  el.type === 'connector' && idSet.has(el.fromId) && idSet.has(el.toId)
              );
              const activeConnectorStyle = existingConnectors[0]?.connectorStyle;

              return (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3 shadow-2xs">
                  <div className="font-bold text-slate-800 flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Workflow size={14} className="text-emerald-700" />
                      <span>Diagram Auto-Connect</span>
                    </div>
                    {existingConnectors.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-500">
                    {existingConnectors.length > 0
                      ? 'Switch connector style between selected objects (no duplicates):'
                      : 'Connect selected objects with smart arrows that auto-follow when moved:'}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'straight', label: 'Straight' },
                        { id: 'elbow', label: 'Elbow' },
                        { id: 'curved', label: 'Curved' },
                      ] as const
                    ).map((style) => (
                      <button
                        key={style.id}
                        onClick={() => autoConnectSelectedShapes(style.id)}
                        className={`py-1.5 px-2 rounded-xl border text-[11px] font-semibold transition ${
                          activeConnectorStyle === style.id
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs'
                            : 'border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                  {existingConnectors.length > 0 && (
                    <button
                      onClick={disconnectSelectedShapes}
                      className="w-full py-1.5 px-2.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition"
                    >
                      Disconnect Arrow
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Case 1: Page Properties (No Element Selected) */}
        {selectedElementIds.length === 0 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3.5 shadow-2xs">
              <div className="font-bold text-slate-800 flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Square size={14} className="text-emerald-700" />
                  <span>Page {project.activePageIndex + 1} Setup</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {(activePage.width / 96).toFixed(1)}"×{(activePage.height / 96).toFixed(1)}"
                </span>
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

        {/* Case 2: Text Frame Properties (Adobe-style Character, Paragraph & Effects) */}
        {selectedElement && selectedElement.type === 'text' && (() => {
          const textEl = selectedElement as TextElement;
          return (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3.5 shadow-2xs">
              <div className="font-bold text-slate-800 flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Type size={14} className="text-emerald-700" />
                  <span>Typography</span>
                </div>
                <span className="text-[10px] font-medium text-slate-400">Adobe Pro</span>
              </div>

              {/* Adobe-style Panel Switcher: Character | Paragraph | Frame */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
                {(
                  [
                    { id: 'character', label: 'Character' },
                    { id: 'paragraph', label: 'Paragraph' },
                    { id: 'effects', label: 'Effects' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTypoTab(tab.id)}
                    className={`py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      typoTab === tab.id
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {typoTab === 'character' && (
                <div className="space-y-3">
                  {/* Font Family */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Font Family
                    </label>
                    <FontSelector
                      value={textEl.fontFamily}
                      onChange={(fontFamily) =>
                        updateElement(textEl.id, { fontFamily })
                      }
                      className="w-full rounded-xl px-2.5 py-1.5"
                    />
                  </div>

                  {/* Font Weight & Size */}
                  <div className="grid grid-cols-5 gap-2">
                    <div className="col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Weight / Style
                      </label>
                      <select
                        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition cursor-pointer"
                        value={textEl.fontWeight}
                        onChange={(e) =>
                          updateElement(textEl.id, {
                            fontWeight: e.target.value as TextElement['fontWeight'],
                          })
                        }
                      >
                        <option value="300">Light (300)</option>
                        <option value="normal">Regular (400)</option>
                        <option value="500">Medium (500)</option>
                        <option value="600">SemiBold (600)</option>
                        <option value="bold">Bold (700)</option>
                        <option value="800">ExtraBold (800)</option>
                        <option value="900">Black (900)</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Size (px)
                      </label>
                      <input
                        type="number"
                        min={6}
                        max={240}
                        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition text-center"
                        value={textEl.fontSize}
                        onChange={(e) =>
                          updateElement(textEl.id, {
                            fontSize: Math.max(6, Number(e.target.value) || 12),
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Leading (Line Height) & Tracking (Letter Spacing) */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <div className="flex justify-between text-[10.5px] text-slate-500 font-semibold mb-1">
                        <span title="Leading (Line Height)">A/A Leading</span>
                        <span className="font-mono">{(textEl.lineHeight ?? 1.4).toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={0.75}
                        max={3}
                        step={0.05}
                        value={textEl.lineHeight ?? 1.4}
                        onChange={(e) =>
                          updateElement(textEl.id, { lineHeight: Number(e.target.value) })
                        }
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10.5px] text-slate-500 font-semibold mb-1">
                        <span title="Tracking (Letter Spacing)">VA Tracking</span>
                        <span className="font-mono">{textEl.letterSpacing ?? 0}px</span>
                      </div>
                      <input
                        type="range"
                        min={-4}
                        max={24}
                        step={0.5}
                        value={textEl.letterSpacing ?? 0}
                        onChange={(e) =>
                          updateElement(textEl.id, { letterSpacing: Number(e.target.value) })
                        }
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Word Spacing & Baseline Shift */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between text-[10.5px] text-slate-500 font-semibold mb-1">
                        <span>Word Space</span>
                        <span className="font-mono">{textEl.wordSpacing ?? 0}px</span>
                      </div>
                      <input
                        type="range"
                        min={-4}
                        max={24}
                        step={1}
                        value={textEl.wordSpacing ?? 0}
                        onChange={(e) =>
                          updateElement(textEl.id, { wordSpacing: Number(e.target.value) })
                        }
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10.5px] text-slate-500 font-semibold mb-1">
                        <span>Baseline</span>
                        <span className="font-mono">
                          {(textEl.baselineShift ?? 0) > 0 ? `+${textEl.baselineShift}` : textEl.baselineShift ?? 0}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-16}
                        max={16}
                        step={1}
                        value={textEl.baselineShift ?? 0}
                        onChange={(e) =>
                          updateElement(textEl.id, { baselineShift: Number(e.target.value) })
                        }
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Style & OpenType Case Buttons */}
                  <div className="pt-1 border-t border-slate-100 space-y-1.5">
                    <label className="block text-[10.5px] font-semibold text-slate-500">
                      Format & Case
                    </label>
                    <div className="grid grid-cols-4 gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                      <button
                        onClick={() =>
                          updateElement(textEl.id, {
                            fontWeight: textEl.fontWeight === 'bold' ? 'normal' : 'bold',
                          })
                        }
                        title="Bold"
                        className={`py-1 rounded-lg flex items-center justify-center transition ${
                          textEl.fontWeight === 'bold' || textEl.fontWeight === '800' || textEl.fontWeight === '900'
                            ? 'bg-white shadow-xs text-emerald-800 font-bold'
                            : 'text-slate-600 hover:bg-white/60'
                        }`}
                      >
                        <Bold size={13} />
                      </button>
                      <button
                        onClick={() =>
                          updateElement(textEl.id, {
                            fontStyle: textEl.fontStyle === 'italic' ? 'normal' : 'italic',
                          })
                        }
                        title="Italic"
                        className={`py-1 rounded-lg flex items-center justify-center transition ${
                          textEl.fontStyle === 'italic'
                            ? 'bg-white shadow-xs text-emerald-800'
                            : 'text-slate-600 hover:bg-white/60'
                        }`}
                      >
                        <Italic size={13} />
                      </button>
                      <button
                        onClick={() =>
                          updateElement(textEl.id, {
                            textDecoration:
                              textEl.textDecoration === 'underline' ? 'none' : 'underline',
                          })
                        }
                        title="Underline"
                        className={`py-1 rounded-lg flex items-center justify-center transition ${
                          textEl.textDecoration === 'underline'
                            ? 'bg-white shadow-xs text-emerald-800'
                            : 'text-slate-600 hover:bg-white/60'
                        }`}
                      >
                        <Underline size={13} />
                      </button>
                      <button
                        onClick={() =>
                          updateElement(textEl.id, {
                            textDecoration:
                              textEl.textDecoration === 'line-through' ? 'none' : 'line-through',
                          })
                        }
                        title="Strikethrough"
                        className={`py-1 rounded-lg text-xs font-bold line-through transition ${
                          textEl.textDecoration === 'line-through'
                            ? 'bg-white shadow-xs text-emerald-800'
                            : 'text-slate-600 hover:bg-white/60'
                        }`}
                      >
                        S
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                      <button
                        onClick={() =>
                          updateElement(textEl.id, {
                            textTransform:
                              textEl.textTransform === 'uppercase' ? 'none' : 'uppercase',
                            fontVariant: 'normal',
                          })
                        }
                        title="All Caps (TT)"
                        className={`py-1 rounded-lg text-[10.5px] font-bold transition ${
                          textEl.textTransform === 'uppercase'
                            ? 'bg-white shadow-xs text-emerald-800'
                            : 'text-slate-600 hover:bg-white/60'
                        }`}
                      >
                        TT
                      </button>
                      <button
                        onClick={() =>
                          updateElement(textEl.id, {
                            fontVariant:
                              textEl.fontVariant === 'small-caps' ? 'normal' : 'small-caps',
                            textTransform: 'none',
                          })
                        }
                        title="Small Caps"
                        className={`py-1 rounded-lg text-[10.5px] font-bold transition ${
                          textEl.fontVariant === 'small-caps'
                            ? 'bg-white shadow-xs text-emerald-800'
                            : 'text-slate-600 hover:bg-white/60'
                        }`}
                      >
                        Tt<span className="text-[8px]">CAP</span>
                      </button>
                      <button
                        onClick={() =>
                          updateElement(textEl.id, {
                            textTransform:
                              textEl.textTransform === 'capitalize' ? 'none' : 'capitalize',
                            fontVariant: 'normal',
                          })
                        }
                        title="Title Case"
                        className={`py-1 rounded-lg text-[10.5px] font-bold transition ${
                          textEl.textTransform === 'capitalize'
                            ? 'bg-white shadow-xs text-emerald-800'
                            : 'text-slate-600 hover:bg-white/60'
                        }`}
                      >
                        Aa
                      </button>
                      <button
                        onClick={() =>
                          updateElement(textEl.id, {
                            textTransform:
                              textEl.textTransform === 'lowercase' ? 'none' : 'lowercase',
                            fontVariant: 'normal',
                          })
                        }
                        title="Lowercase"
                        className={`py-1 rounded-lg text-[10.5px] font-bold transition ${
                          textEl.textTransform === 'lowercase'
                            ? 'bg-white shadow-xs text-emerald-800'
                            : 'text-slate-600 hover:bg-white/60'
                        }`}
                      >
                        tt
                      </button>
                    </div>
                  </div>

                  {/* Fill Color & Text Stroke */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <label className="block text-[10.5px] font-semibold text-slate-500 mb-1">
                        Fill Color
                      </label>
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <input
                          type="color"
                          className="w-6 h-6 rounded-full border border-slate-200 cursor-pointer overflow-hidden p-0"
                          value={textEl.color}
                          onChange={(e) =>
                            updateElement(textEl.id, { color: e.target.value })
                          }
                        />
                        <span className="font-mono text-[10px] text-slate-600 font-semibold truncate">
                          {textEl.color}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-semibold text-slate-500 mb-1">
                        Outline ({textEl.textStrokeWidth ?? 0}px)
                      </label>
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <input
                          type="color"
                          className="w-6 h-6 rounded-full border border-slate-200 cursor-pointer overflow-hidden p-0"
                          value={textEl.textStrokeColor || '#000000'}
                          onChange={(e) =>
                            updateElement(textEl.id, {
                              textStrokeColor: e.target.value,
                              textStrokeWidth: textEl.textStrokeWidth || 1,
                            })
                          }
                        />
                        <input
                          type="number"
                          min={0}
                          max={8}
                          step={0.5}
                          value={textEl.textStrokeWidth ?? 0}
                          onChange={(e) =>
                            updateElement(textEl.id, {
                              textStrokeWidth: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="w-full bg-transparent text-[11px] font-mono text-slate-700 outline-none text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {typoTab === 'paragraph' && (
                <div className="space-y-3">
                  {/* Horizontal Alignment */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                      Horizontal Alignment
                    </label>
                    <div className="grid grid-cols-4 gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                      {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                        <button
                          key={align}
                          onClick={() => updateElement(textEl.id, { textAlign: align })}
                          className={`py-1.5 rounded-lg flex items-center justify-center transition-all ${
                            textEl.textAlign === align
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
                    </div>
                  </div>

                  {/* Vertical Frame Alignment */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                      Vertical Frame Alignment
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                      {(['top', 'middle', 'bottom'] as const).map((vAlign) => (
                        <button
                          key={vAlign}
                          onClick={() => updateElement(textEl.id, { verticalAlign: vAlign })}
                          className={`py-1 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                            textEl.verticalAlign === vAlign
                              ? 'bg-white text-emerald-800 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {vAlign}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* First-Line Indent */}
                  <div>
                    <div className="flex justify-between text-[10.5px] text-slate-500 font-semibold mb-1">
                      <span>First-Line Indent</span>
                      <span className="font-mono">{textEl.textIndent ?? 0}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={64}
                      step={2}
                      value={textEl.textIndent ?? 0}
                      onChange={(e) =>
                        updateElement(textEl.id, { textIndent: Number(e.target.value) })
                      }
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  {/* Multi-Columns & Column Gap */}
                  <div className="pt-1 border-t border-slate-100 space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-500">
                      Columns & Gutter
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                      {([1, 2, 3] as const).map((col) => (
                        <button
                          key={col}
                          onClick={() => updateElement(textEl.id, { columns: col })}
                          className={`py-1 rounded-lg text-xs font-semibold transition-all ${
                            textEl.columns === col
                              ? 'bg-white text-emerald-800 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {col} {col === 1 ? 'Col' : 'Cols'}
                        </button>
                      ))}
                    </div>
                    {textEl.columns > 1 && (
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-0.5">
                          <span>Column Gutter</span>
                          <span>{textEl.columnGap ?? 16}px</span>
                        </div>
                        <input
                          type="range"
                          min={4}
                          max={48}
                          value={textEl.columnGap ?? 16}
                          onChange={(e) =>
                            updateElement(textEl.id, { columnGap: Number(e.target.value) })
                          }
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Drop Cap Toggle */}
                  <div
                    onClick={() =>
                      updateElement(textEl.id, { dropCap: !textEl.dropCap })
                    }
                    className="flex items-center justify-between pt-2 border-t border-slate-100 cursor-pointer hover:opacity-90"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">Drop Cap</span>
                      <p className="text-[10px] text-slate-400">Large decorative initial</p>
                    </div>
                    <div className={`fluent-switch ${textEl.dropCap ? 'active' : ''}`}>
                      <div className="fluent-switch-knob" />
                    </div>
                  </div>
                </div>
              )}

              {typoTab === 'effects' && (
                <div className="space-y-3">
                  {/* WordArt Style */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                      <Sparkles size={13} className="text-amber-500" />
                      <span>WordArt Styling</span>
                    </label>
                    <select
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition cursor-pointer"
                      value={textEl.wordArtStyle || 'none'}
                      onChange={(e) => {
                        const style = e.target.value as WordArtStyle;
                        updateElement(textEl.id, {
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
                      <option value="neon-glow">Neon Cyber Glow</option>
                      <option value="chrome">Chrome Metallic</option>
                      <option value="fire">Blazing Fire</option>
                      <option value="comic-pop">Comic Pop Art</option>
                      <option value="emerald-3d">Emerald 3D Block</option>
                      <option value="sunset-gradient">Sunset Vibe</option>
                    </select>
                  </div>

                  {/* Text Drop Shadow */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div
                      onClick={() => updateElement(textEl.id, { shadow: !textEl.shadow })}
                      className="flex items-center justify-between cursor-pointer hover:opacity-90"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">Text Drop Shadow</span>
                        <p className="text-[10px] text-slate-400">Soft depth behind characters</p>
                      </div>
                      <div className={`fluent-switch ${textEl.shadow ? 'active' : ''}`}>
                        <div className="fluent-switch-knob" />
                      </div>
                    </div>
                    {textEl.shadow && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                          <input
                            type="color"
                            className="w-5 h-5 rounded-full border border-slate-200 cursor-pointer p-0"
                            value={textEl.shadowColor || '#000000'}
                            onChange={(e) =>
                              updateElement(textEl.id, { shadowColor: e.target.value })
                            }
                          />
                          <span className="text-[10px] text-slate-600 font-semibold">Shadow</span>
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Blur</span>
                            <span>{textEl.shadowBlur ?? 6}px</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={24}
                            value={textEl.shadowBlur ?? 6}
                            onChange={(e) =>
                              updateElement(textEl.id, { shadowBlur: Number(e.target.value) })
                            }
                            className="w-full accent-emerald-600 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Text Frame Inset, Fill & Border */}
                  <div className="pt-2 border-t border-slate-100 space-y-2.5">
                    <label className="block text-[11px] font-semibold text-slate-500">
                      Text Frame Box
                    </label>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-0.5">
                        <span>Frame Inset (Padding)</span>
                        <span>{textEl.padding ?? 8}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={48}
                        value={textEl.padding ?? 8}
                        onChange={(e) =>
                          updateElement(textEl.id, { padding: Number(e.target.value) })
                        }
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          Frame Fill
                        </label>
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                          <input
                            type="color"
                            className="w-5 h-5 rounded-full border border-slate-200 cursor-pointer p-0"
                            value={
                              textEl.backgroundColor && textEl.backgroundColor !== 'transparent'
                                ? textEl.backgroundColor
                                : '#ffffff'
                            }
                            onChange={(e) =>
                              updateElement(textEl.id, { backgroundColor: e.target.value })
                            }
                          />
                          <button
                            onClick={() =>
                              updateElement(textEl.id, { backgroundColor: 'transparent' })
                            }
                            className="text-[10px] text-slate-500 hover:text-slate-800 px-1 font-medium"
                            title="Clear Fill"
                          >
                            None
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          Border ({textEl.borderWidth ?? 0}px)
                        </label>
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                          <input
                            type="color"
                            className="w-5 h-5 rounded-full border border-slate-200 cursor-pointer p-0"
                            value={textEl.borderColor || '#cbd5e1'}
                            onChange={(e) =>
                              updateElement(textEl.id, {
                                borderColor: e.target.value,
                                borderWidth: textEl.borderWidth || 1,
                              })
                            }
                          />
                          <input
                            type="number"
                            min={0}
                            max={12}
                            value={textEl.borderWidth ?? 0}
                            onChange={(e) =>
                              updateElement(textEl.id, {
                                borderWidth: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="w-full bg-transparent text-[11px] font-mono text-slate-700 outline-none text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-0.5">
                        <span>Frame Corner Radius</span>
                        <span>{textEl.borderRadius ?? 0}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={40}
                        value={textEl.borderRadius ?? 0}
                        onChange={(e) =>
                          updateElement(textEl.id, { borderRadius: Number(e.target.value) })
                        }
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Case 3: Shape Properties */}
        {selectedElement && selectedElement.type === 'shape' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3.5 shadow-2xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Square size={14} className="text-emerald-700" />
              <span>Shape Formatting</span>
            </div>

            {/* Visual Shape Geometry Preview Picker */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Shape Geometry
              </label>
              <button
                ref={shapePickerBtnRef}
                type="button"
                onClick={() => setIsShapePickerOpen(!isShapePickerOpen)}
                className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShapePreviewIcon
                    shapeType={
                      (selectedElement as ShapeElement).shapeType === 'merged'
                        ? 'star'
                        : (selectedElement as ShapeElement).shapeType
                    }
                    size={20}
                  />
                  <span>
                    {SHAPE_CATALOG.find(
                      (c) => c.type === (selectedElement as ShapeElement).shapeType
                    )?.label ||
                      ((selectedElement as ShapeElement).shapeType === 'merged'
                        ? 'Merged Shape'
                        : (selectedElement as ShapeElement).shapeType)}
                  </span>
                </div>
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              <FloatingDropdown
                isOpen={isShapePickerOpen}
                onClose={() => setIsShapePickerOpen(false)}
                anchorRef={shapePickerBtnRef}
                className="p-2.5 w-64 grid grid-cols-3 gap-1.5 max-h-72 overflow-y-auto"
              >
                {SHAPE_CATALOG.map((item) => {
                  const isCurrent = (selectedElement as ShapeElement).shapeType === item.type;
                  return (
                    <button
                      key={item.type}
                      onClick={() => {
                        updateElement(selectedElement.id, { shapeType: item.type });
                        setIsShapePickerOpen(false);
                      }}
                      className={`p-2 rounded-xl flex flex-col items-center gap-1 text-[10px] font-semibold transition border ${
                        isCurrent
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'border-transparent hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <ShapePreviewIcon shapeType={item.type} size={24} />
                      <span className="truncate w-full text-center">{item.label}</span>
                    </button>
                  );
                })}
              </FloatingDropdown>
            </div>

            {/* Wavy Side Edge (e.g. Make Rectangle Top Side a Wave) */}
            {(selectedElement as ShapeElement).shapeType === 'rectangle' && (
              <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900">
                  <Waves size={13} className="text-emerald-700" />
                  <span>Wave Side Edge</span>
                </div>
                <div className="grid grid-cols-5 gap-1 bg-white p-0.5 rounded-lg border border-emerald-200/60">
                  {(['none', 'top', 'bottom', 'left', 'right'] as const).map((edge) => (
                    <button
                      key={edge}
                      onClick={() =>
                        updateElement(selectedElement.id, { waveEdge: edge })
                      }
                      className={`py-1 rounded text-[10px] font-semibold capitalize transition ${
                        ((selectedElement as ShapeElement).waveEdge || 'none') === edge
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {edge}
                    </button>
                  ))}
                </div>

                {(selectedElement as ShapeElement).waveEdge &&
                  (selectedElement as ShapeElement).waveEdge !== 'none' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <div className="flex justify-between text-[9.5px] text-slate-500 font-medium">
                          <span>Height</span>
                          <span>{(selectedElement as ShapeElement).waveAmplitude ?? 18}px</span>
                        </div>
                        <input
                          type="range"
                          min={4}
                          max={60}
                          value={(selectedElement as ShapeElement).waveAmplitude ?? 18}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              waveAmplitude: Number(e.target.value),
                            })
                          }
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[9.5px] text-slate-500 font-medium">
                          <span>Waves</span>
                          <span>{(selectedElement as ShapeElement).waveFrequency ?? 2}</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={8}
                          value={(selectedElement as ShapeElement).waveFrequency ?? 2}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              waveFrequency: Number(e.target.value),
                            })
                          }
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Quick Diagram Next Step */}
            <button
              onClick={() => addConnectedDiagramStep('elbow')}
              className="w-full py-1.5 px-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
              title="Spawn a connected diagram node with an auto-following arrow"
            >
              <Workflow size={13} />
              <span>+ Add Connected Diagram Step</span>
            </button>

            {/* PowerPoint Quick Shape Styles */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Quick Shape Styles
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  {
                    name: 'Outline',
                    bg: 'transparent',
                    border: '#0f6b4e',
                    apply: { fillType: 'solid' as const, fillColor: 'transparent', strokeColor: '#0f6b4e', strokeWidth: 2.5, shadow: false, glow: false },
                  },
                  {
                    name: 'Emerald',
                    bg: '#0f6b4e',
                    border: '#064e3b',
                    apply: { fillType: 'solid' as const, fillColor: '#0f6b4e', strokeColor: '#064e3b', strokeWidth: 2, shadow: true, glow: false },
                  },
                  {
                    name: 'Gradient',
                    bg: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                    border: '#0369a1',
                    apply: { fillType: 'linear-gradient' as const, fillColor: '#0284c7', gradientColor2: '#38bdf8', gradientAngle: 135, strokeColor: '#0369a1', strokeWidth: 1.5, shadow: true, glow: false },
                  },
                  {
                    name: 'Sunset',
                    bg: 'linear-gradient(135deg, #ec4899, #f59e0b)',
                    border: '#be185d',
                    apply: { fillType: 'linear-gradient' as const, fillColor: '#ec4899', gradientColor2: '#f59e0b', gradientAngle: 135, strokeColor: '#be185d', strokeWidth: 1.5, shadow: true, glow: false },
                  },
                  {
                    name: 'Neon Glow',
                    bg: '#0f172a',
                    border: '#38bdf8',
                    apply: { fillType: 'solid' as const, fillColor: '#0f172a', strokeColor: '#38bdf8', strokeWidth: 2, shadow: false, glow: true, glowColor: '#38bdf8', glowSize: 14 },
                  },
                  {
                    name: 'Gold Seal',
                    bg: 'linear-gradient(135deg, #facc15, #b45309)',
                    border: '#92400e',
                    apply: { fillType: 'linear-gradient' as const, fillColor: '#facc15', gradientColor2: '#b45309', gradientAngle: 135, strokeColor: '#92400e', strokeWidth: 2, shadow: true, glow: false },
                  },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => updateElement(selectedElement.id, preset.apply)}
                    className="p-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50/70 flex flex-col items-center gap-1 transition"
                  >
                    <div
                      className="w-full h-4 rounded-md"
                      style={{
                        background: preset.bg,
                        border: `2px solid ${preset.border}`,
                      }}
                    />
                    <span className="text-[9.5px] font-semibold text-slate-700">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fill Mode: Solid vs Linear Gradient */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Fill Type
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                <button
                  onClick={() =>
                    updateElement(selectedElement.id, { fillType: 'solid' })
                  }
                  className={`py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    ((selectedElement as ShapeElement).fillType || 'solid') === 'solid'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Solid Fill
                </button>
                <button
                  onClick={() =>
                    updateElement(selectedElement.id, {
                      fillType: 'linear-gradient',
                      gradientColor2:
                        (selectedElement as ShapeElement).gradientColor2 || '#38bdf8',
                    })
                  }
                  className={`py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    (selectedElement as ShapeElement).fillType === 'linear-gradient'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Gradient
                </button>
              </div>
            </div>

            {/* Fill Color(s) */}
            <div className="space-y-2">
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
                {(selectedElement as ShapeElement).fillType === 'linear-gradient' ? (
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">End:</span>
                    <input
                      type="color"
                      value={(selectedElement as ShapeElement).gradientColor2 || '#38bdf8'}
                      onChange={(e) =>
                        updateElement(selectedElement.id, { gradientColor2: e.target.value })
                      }
                      className="w-6 h-6 rounded-full border border-slate-200 cursor-pointer overflow-hidden p-0 shadow-2xs"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      updateElement(selectedElement.id, { fillColor: 'transparent' })
                    }
                    className="ml-auto text-[11px] font-medium text-emerald-700 hover:underline"
                  >
                    No Fill
                  </button>
                )}
              </div>

              {(selectedElement as ShapeElement).fillType === 'linear-gradient' && (
                <div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-1">
                    <span>Gradient Angle</span>
                    <span>{(selectedElement as ShapeElement).gradientAngle ?? 90}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={(selectedElement as ShapeElement).gradientAngle ?? 90}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        gradientAngle: Number(e.target.value),
                      })
                    }
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Corner Radius for Rounded Rect */}
            {(selectedElement as ShapeElement).shapeType === 'rounded-rect' && (
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-1">
                  <span>Corner Radius</span>
                  <span>{(selectedElement as ShapeElement).cornerRadius ?? 12}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={(selectedElement as ShapeElement).cornerRadius ?? 12}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      cornerRadius: Number(e.target.value),
                    })
                  }
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            )}

            {/* Stroke / Outline & Dash */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
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
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Width
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
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Style
                </label>
                <select
                  value={(selectedElement as ShapeElement).strokeDash || 'solid'}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      strokeDash: e.target.value as 'solid' | 'dashed' | 'dotted',
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-1 text-[11px] outline-none font-medium"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dash</option>
                  <option value="dotted">Dot</option>
                </select>
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

            {/* Outer Glow Switch & Color */}
            <div className="space-y-2 pt-1">
              <div
                onClick={() =>
                  updateElement(selectedElement.id, {
                    glow: !(selectedElement as ShapeElement).glow,
                    glowColor: (selectedElement as ShapeElement).glowColor || '#38bdf8',
                  })
                }
                className="flex items-center justify-between cursor-pointer hover:opacity-90"
              >
                <div>
                  <span className="font-semibold text-slate-800">Outer Glow</span>
                  <p className="text-[10px] text-slate-400">PowerPoint aura effect</p>
                </div>
                <div
                  className={`fluent-switch ${
                    (selectedElement as ShapeElement).glow ? 'active' : ''
                  }`}
                >
                  <div className="fluent-switch-knob" />
                </div>
              </div>

              {(selectedElement as ShapeElement).glow && (
                <div className="flex items-center gap-2 pl-1">
                  <input
                    type="color"
                    value={(selectedElement as ShapeElement).glowColor || '#38bdf8'}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { glowColor: e.target.value })
                    }
                    className="w-6 h-6 rounded-full border border-slate-200 cursor-pointer overflow-hidden p-0"
                  />
                  <input
                    type="range"
                    min={4}
                    max={30}
                    value={(selectedElement as ShapeElement).glowSize || 12}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { glowSize: Number(e.target.value) })
                    }
                    className="flex-1 accent-emerald-600 cursor-pointer"
                  />
                </div>
              )}
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
              <div className="grid grid-cols-4 gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                {(
                  ['none', 'rounded', 'circle', 'star', 'diamond', 'hexagon', 'triangle', 'heart'] as const
                ).map((mask) => (
                  <button
                    key={mask}
                    onClick={() => updateElement(selectedElement.id, { maskShape: mask })}
                    className={`py-1 rounded-lg text-[10px] font-semibold capitalize transition-all ${
                      ((selectedElement as ImageElement).maskShape || 'none') === mask
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mask}
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Fit, Zoom & Pan */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-bold text-[11px]">Crop & Frame Fit</label>
                <button
                  onClick={() =>
                    updateElement(selectedElement.id, {
                      imageScale: 1,
                      panX: 0,
                      panY: 0,
                      objectFit: 'cover',
                    })
                  }
                  className="text-[10px] text-emerald-700 hover:underline flex items-center gap-0.5"
                >
                  <RotateCcw size={10} /> Reset
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                {(['cover', 'contain', 'fill'] as const).map((fit) => (
                  <button
                    key={fit}
                    onClick={() => updateElement(selectedElement.id, { objectFit: fit })}
                    className={`py-1 rounded-lg text-[10px] font-semibold capitalize transition-all ${
                      ((selectedElement as ImageElement).objectFit || 'cover') === fit
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {fit}
                  </button>
                ))}
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-0.5">
                  <span>Image Zoom</span>
                  <span>{((selectedElement as ImageElement).imageScale ?? 1).toFixed(2)}×</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={250}
                  value={Math.round(((selectedElement as ImageElement).imageScale ?? 1) * 100)}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      imageScale: Number(e.target.value) / 100,
                    })
                  }
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                    <span>Pan X</span>
                    <span>{(selectedElement as ImageElement).panX ?? 0}%</span>
                  </div>
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    value={(selectedElement as ImageElement).panX ?? 0}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { panX: Number(e.target.value) })
                    }
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                    <span>Pan Y</span>
                    <span>{(selectedElement as ImageElement).panY ?? 0}%</span>
                  </div>
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    value={(selectedElement as ImageElement).panY ?? 0}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { panY: Number(e.target.value) })
                    }
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Filter Presets */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="block text-slate-700 font-bold text-[11px]">
                Quick Filter Presets
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  {
                    name: 'Original',
                    vals: { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, blur: 0, hueRotate: 0 },
                  },
                  {
                    name: 'B&W',
                    vals: { brightness: 105, contrast: 120, saturate: 100, grayscale: 100, sepia: 0, blur: 0, hueRotate: 0 },
                  },
                  {
                    name: 'Vintage',
                    vals: { brightness: 105, contrast: 95, saturate: 85, grayscale: 0, sepia: 65, blur: 0, hueRotate: 0 },
                  },
                  {
                    name: 'Vivid',
                    vals: { brightness: 108, contrast: 118, saturate: 155, grayscale: 0, sepia: 0, blur: 0, hueRotate: 0 },
                  },
                  {
                    name: 'Cool',
                    vals: { brightness: 102, contrast: 110, saturate: 110, grayscale: 0, sepia: 0, blur: 0, hueRotate: 195 },
                  },
                  {
                    name: 'Soft Blur',
                    vals: { brightness: 108, contrast: 95, saturate: 95, grayscale: 0, sepia: 0, blur: 3, hueRotate: 0 },
                  },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => updateElement(selectedElement.id, preset.vals)}
                    className="py-1 px-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 text-[10px] font-semibold transition"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Adjustments */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-slate-700 font-bold text-[11px]">
                Color & Tone Adjustments
              </label>
              {[
                { label: 'Brightness', key: 'brightness', min: 30, max: 180, def: 100, unit: '%' },
                { label: 'Contrast', key: 'contrast', min: 30, max: 180, def: 100, unit: '%' },
                { label: 'Saturation', key: 'saturate', min: 0, max: 200, def: 100, unit: '%' },
                { label: 'Grayscale', key: 'grayscale', min: 0, max: 100, def: 0, unit: '%' },
                { label: 'Sepia', key: 'sepia', min: 0, max: 100, def: 0, unit: '%' },
                { label: 'Blur', key: 'blur', min: 0, max: 10, def: 0, unit: 'px' },
                { label: 'Hue Shift', key: 'hueRotate', min: 0, max: 360, def: 0, unit: '°' },
              ].map((slider) => {
                const val =
                  ((selectedElement as ImageElement)[slider.key as keyof ImageElement] as number | undefined) ??
                  slider.def;
                return (
                  <div key={slider.key}>
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-0.5">
                      <span>{slider.label}</span>
                      <span>
                        {val}
                        {slider.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      value={val}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          [slider.key]: Number(e.target.value),
                        })
                      }
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            {/* Image Drop Shadow Switch */}
            <div
              onClick={() =>
                updateElement(selectedElement.id, {
                  shadow: !(selectedElement as ImageElement).shadow,
                })
              }
              className="flex items-center justify-between pt-1 cursor-pointer hover:opacity-90"
            >
              <div>
                <span className="font-semibold text-slate-800">Drop Shadow</span>
                <p className="text-[10px] text-slate-400">Elevate image off page</p>
              </div>
              <div
                className={`fluent-switch ${
                  (selectedElement as ImageElement).shadow ? 'active' : ''
                }`}
              >
                <div className="fluent-switch-knob" />
              </div>
            </div>
          </div>
        )}

        {/* Case 5: Table Properties & Themes */}
        {selectedElement && selectedElement.type === 'table' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3.5 shadow-2xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <TableIcon size={14} className="text-emerald-700" />
              <span>Table Design & Themes</span>
            </div>

            {/* Table Theme Swatches */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Table Themes
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {TABLE_THEMES.map((theme) => {
                  const isActive = (selectedElement as TableElement).themeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() =>
                        updateElement(selectedElement.id, {
                          themeId: theme.id,
                          headerBg: theme.headerBg,
                          headerColor: theme.headerColor,
                          cellBg: theme.cellBg,
                          altRowBg: theme.altRowBg,
                          cellColor: theme.cellColor,
                          borderColor: theme.borderColor,
                          borderWidth: theme.borderWidth,
                          bandedRows: true,
                          showHeaderRow: true,
                        })
                      }
                      className={`p-1.5 rounded-xl border text-left transition-all hover:scale-[1.02] ${
                        isActive
                          ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50/40'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
                      }`}
                    >
                      <div className="w-full h-5 rounded-md overflow-hidden border border-slate-200/70 flex flex-col mb-1">
                        <div className="h-2 w-full" style={{ backgroundColor: theme.headerBg }} />
                        <div className="h-1.5 w-full" style={{ backgroundColor: theme.cellBg }} />
                        <div className="h-1.5 w-full" style={{ backgroundColor: theme.altRowBg }} />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-700 truncate block">
                        {theme.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Header Row & Banded Rows Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div
                onClick={() =>
                  updateElement(selectedElement.id, {
                    showHeaderRow: (selectedElement as TableElement).showHeaderRow === false,
                  })
                }
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="text-[11px] font-semibold text-slate-700">Header Row</span>
                <div
                  className={`fluent-switch ${
                    (selectedElement as TableElement).showHeaderRow !== false ? 'active' : ''
                  }`}
                >
                  <div className="fluent-switch-knob" />
                </div>
              </div>

              <div
                onClick={() =>
                  updateElement(selectedElement.id, {
                    bandedRows: (selectedElement as TableElement).bandedRows === false,
                  })
                }
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="text-[11px] font-semibold text-slate-700">Banded Rows</span>
                <div
                  className={`fluent-switch ${
                    (selectedElement as TableElement).bandedRows !== false ? 'active' : ''
                  }`}
                >
                  <div className="fluent-switch-knob" />
                </div>
              </div>
            </div>

            {/* Add / Remove Rows & Columns */}
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const tbl = selectedElement as TableElement;
                  const newRow = Array.from({ length: tbl.cols }, (_, c) => `Data ${tbl.rows},${c + 1}`);
                  updateElement(tbl.id, {
                    rows: tbl.rows + 1,
                    data: [...tbl.data, newRow],
                    height: tbl.height + 36,
                  });
                }}
                className="py-1 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-[10px] font-semibold transition"
              >
                + Add Row
              </button>
              <button
                onClick={() => {
                  const tbl = selectedElement as TableElement;
                  const newData = tbl.data.map((r, idx) => [
                    ...r,
                    idx === 0 ? `Header ${tbl.cols + 1}` : `Data ${idx},${tbl.cols + 1}`,
                  ]);
                  updateElement(tbl.id, {
                    cols: tbl.cols + 1,
                    data: newData,
                  });
                }}
                className="py-1 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-[10px] font-semibold transition"
              >
                + Add Col
              </button>
            </div>

            {/* Custom Colors & Border */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Header Fill
                </label>
                <input
                  type="color"
                  value={(selectedElement as TableElement).headerBg}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { headerBg: e.target.value })
                  }
                  className="w-7 h-7 rounded-full border border-slate-200 cursor-pointer overflow-hidden p-0 shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Alt Row Fill
                </label>
                <input
                  type="color"
                  value={(selectedElement as TableElement).altRowBg || '#f1f5f9'}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { altRowBg: e.target.value })
                  }
                  className="w-7 h-7 rounded-full border border-slate-200 cursor-pointer overflow-hidden p-0 shadow-2xs"
                />
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
                  min={0}
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

            {/* Rotation & Flip Controls */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">Rotation & Flip</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    updateElement(selectedElement.id, { flipH: !selectedElement.flipH })
                  }
                  className={`p-1 rounded-lg border transition ${
                    selectedElement.flipH
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Flip Horizontal"
                >
                  <FlipHorizontal2 size={13} />
                </button>
                <button
                  onClick={() =>
                    updateElement(selectedElement.id, { flipV: !selectedElement.flipV })
                  }
                  className={`p-1 rounded-lg border transition ${
                    selectedElement.flipV
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Flip Vertical"
                >
                  <FlipVertical2 size={13} />
                </button>
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
                  className="w-14 bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-1 text-xs outline-none text-center font-mono font-bold"
                />
              </div>
            </div>

            {/* Blend Mode */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">Blend Mode</span>
              <select
                value={selectedElement.blendMode || 'normal'}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    blendMode: e.target.value as
                      | 'normal'
                      | 'multiply'
                      | 'screen'
                      | 'overlay'
                      | 'darken',
                  })
                }
                className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-[11px] outline-none font-medium capitalize"
              >
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
              </select>
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
