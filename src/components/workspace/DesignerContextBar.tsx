import React from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { PAGE_SIZES } from '../../constants/pageSizes';
import { ColorInput } from '../common/ColorInput';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  ArrowDownToLine,
  Group,
  Ungroup,
  Copy,
  Trash2,
  Lock,
  Unlock,
  FlipHorizontal2,
  FlipVertical2,
  Combine,
  Scissors,
  Grid,
  Ruler,
  Magnet,
  LayoutDashboard,
  File,
  Files,
  BookOpen,
  RotateCw,
  Columns,
  Rows,
} from 'lucide-react';

export const DesignerContextBar: React.FC = () => {
  const {
    project,
    activePage,
    selectedElementIds,
    viewMode,
    setViewMode,
    rulerVisible,
    setRulerVisible,
    gridVisible,
    setGridVisible,
    snapToGuides,
    setSnapToGuides,
    snapToGrid,
    setSnapToGrid,
    setPageSize,
    setPageOrientation,
    setPageBackgroundColor,
    alignSelected,
    distributeSelected,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    groupSelected,
    ungroupSelected,
    mergeSelectedShapes,
    clipToShape,
    duplicateSelectedElements,
    deleteSelectedElements,
    toggleElementLock,
    updateSelectedElements,
  } = usePublisher();

  const selectedElements = activePage.elements.filter((el) =>
    selectedElementIds.includes(el.id)
  );
  const hasSelection = selectedElements.length > 0;
  const hasMulti = selectedElements.length >= 2;
  const hasThreePlus = selectedElements.length >= 3;
  const allShapes = hasMulti && selectedElements.every((el) => el.type === 'shape');
  const hasGroup = selectedElements.some((el) => Boolean(el.groupId));
  const anyLocked = selectedElements.some((el) => Boolean(el.locked));

  const btnCls =
    'p-1.5 rounded-[6px] text-[#4a5661] hover:text-[#5c4bb8] hover:bg-[#f4f2ff] active:scale-95 transition cursor-pointer disabled:opacity-35 disabled:pointer-events-none';
  const pillBtn = (active: boolean) =>
    `flex items-center gap-1 px-2 py-1 rounded-[6px] text-[11px] font-medium transition cursor-pointer ${
      active
        ? 'bg-[#efeafd] text-[#5c4bb8]'
        : 'text-[#4a5661] hover:text-[#161a22] hover:bg-[#f4f2ff]'
    }`;

  return (
    <div className="h-[38px] bg-white border-b border-[#e5e9ee] px-3 flex items-center justify-between gap-2 overflow-x-auto select-none flex-shrink-0 z-20">
      {!hasSelection ? (
        <>
          {/* Left: Document / Artboard Context */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6a7682] whitespace-nowrap">
              Document
            </span>
            <select
              value={project.pageSizeName}
              onChange={(e) => setPageSize(e.target.value)}
              className="h-6 px-2 rounded-[6px] border border-[#e5e9ee] bg-[#f8fafb] text-[11px] font-medium text-[#161a22] outline-none cursor-pointer"
              title="Page Size"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() =>
                setPageOrientation(
                  activePage.orientation === 'portrait' ? 'landscape' : 'portrait'
                )
              }
              className="flex items-center gap-1 h-6 px-2 rounded-[6px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] text-[11px] font-medium text-[#4a5661] hover:text-[#5c4bb8] transition cursor-pointer whitespace-nowrap"
              title="Toggle Portrait / Landscape"
            >
              <RotateCw size={11} />
              <span>{activePage.orientation === 'portrait' ? 'Portrait' : 'Landscape'}</span>
            </button>

            <div className="flex items-center gap-1.5 pl-1">
              <span className="text-[11px] text-[#6a7682]">Fill</span>
              <ColorInput
                value={activePage.backgroundColor || '#ffffff'}
                onChange={(e) => setPageBackgroundColor(e.target.value)}
                className="w-6 h-5 rounded border border-[#e5e9ee]"
              />
            </div>

            <div className="w-[1px] h-4 bg-[#e5e9ee] mx-0.5 flex-shrink-0" />

            {/* Canvas View Modes */}
            <div className="flex items-center gap-0.5 bg-[#f3f5f7] p-0.5 rounded-[7px] border border-[#e5e9ee]">
              <button
                type="button"
                onClick={() => setViewMode('artboard')}
                className={pillBtn(viewMode === 'artboard')}
                title="Artboard View (Freeform)"
              >
                <LayoutDashboard size={12} />
                <span className="hidden md:inline">Artboard</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={pillBtn(viewMode === 'single')}
                title="Single Page View"
              >
                <File size={12} />
                <span className="hidden lg:inline">Single</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('continuous')}
                className={pillBtn(viewMode === 'continuous')}
                title="Continuous Scroll View"
              >
                <Files size={12} />
                <span className="hidden lg:inline">Scroll</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('spread')}
                className={pillBtn(viewMode === 'spread')}
                title="2-Page Spread View"
              >
                <BookOpen size={12} />
                <span className="hidden lg:inline">Spread</span>
              </button>
            </div>
          </div>

          {/* Right: Guides & Snap */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setRulerVisible(!rulerVisible)}
              className={pillBtn(rulerVisible)}
              title="Toggle Rulers"
            >
              <Ruler size={12} />
              <span className="hidden md:inline">Rulers</span>
            </button>
            <button
              type="button"
              onClick={() => setGridVisible(!gridVisible)}
              className={pillBtn(gridVisible)}
              title="Toggle Grid"
            >
              <Grid size={12} />
              <span className="hidden md:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const next = !(snapToGuides || snapToGrid);
                setSnapToGuides(next);
                setSnapToGrid(next);
              }}
              className={pillBtn(snapToGuides || snapToGrid)}
              title="Toggle Smart Snapping"
            >
              <Magnet size={12} />
              <span className="hidden md:inline">Snap</span>
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Left: Selection Context Actions */}
          <div className="flex items-center gap-1 min-w-0">
            <span className="px-2 py-0.5 rounded-[6px] bg-[#efeafd] text-[#5c4bb8] text-[11px] font-semibold whitespace-nowrap mr-1">
              {selectedElements.length === 1
                ? selectedElements[0].type.toUpperCase()
                : `${selectedElements.length} Selected`}
            </span>

            {/* Alignment */}
            <button type="button" onClick={() => alignSelected('left')} className={btnCls} title="Align Left">
              <AlignLeft size={14} />
            </button>
            <button type="button" onClick={() => alignSelected('center')} className={btnCls} title="Align Center">
              <AlignCenter size={14} />
            </button>
            <button type="button" onClick={() => alignSelected('right')} className={btnCls} title="Align Right">
              <AlignRight size={14} />
            </button>
            <button type="button" onClick={() => alignSelected('top')} className={btnCls} title="Align Top">
              <AlignStartVertical size={14} />
            </button>
            <button type="button" onClick={() => alignSelected('middle')} className={btnCls} title="Align Middle">
              <AlignCenterVertical size={14} />
            </button>
            <button type="button" onClick={() => alignSelected('bottom')} className={btnCls} title="Align Bottom">
              <AlignEndVertical size={14} />
            </button>

            {hasThreePlus && (
              <>
                <div className="w-[1px] h-4 bg-[#e5e9ee] mx-0.5" />
                <button
                  type="button"
                  onClick={() => distributeSelected('horizontal')}
                  className={btnCls}
                  title="Distribute Horizontally"
                >
                  <Columns size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => distributeSelected('vertical')}
                  className={btnCls}
                  title="Distribute Vertically"
                >
                  <Rows size={14} />
                </button>
              </>
            )}

            <div className="w-[1px] h-4 bg-[#e5e9ee] mx-0.5" />

            {/* Z-Order */}
            <button type="button" onClick={bringToFront} className={btnCls} title="Bring to Front">
              <ArrowUpToLine size={14} />
            </button>
            <button type="button" onClick={bringForward} className={btnCls} title="Bring Forward">
              <ArrowUp size={14} />
            </button>
            <button type="button" onClick={sendBackward} className={btnCls} title="Send Backward">
              <ArrowDown size={14} />
            </button>
            <button type="button" onClick={sendToBack} className={btnCls} title="Send to Back">
              <ArrowDownToLine size={14} />
            </button>

            {/* Group / Boolean / Clip */}
            {(hasMulti || hasGroup) && (
              <>
                <div className="w-[1px] h-4 bg-[#e5e9ee] mx-0.5" />
                {hasMulti && (
                  <button type="button" onClick={groupSelected} className={btnCls} title="Group (Ctrl+G)">
                    <Group size={14} />
                  </button>
                )}
                {hasGroup && (
                  <button type="button" onClick={ungroupSelected} className={btnCls} title="Ungroup (Ctrl+Shift+G)">
                    <Ungroup size={14} />
                  </button>
                )}
              </>
            )}

            {allShapes && (
              <>
                <div className="w-[1px] h-4 bg-[#e5e9ee] mx-0.5" />
                <button
                  type="button"
                  onClick={() => mergeSelectedShapes('union')}
                  className="px-2 py-1 rounded-[6px] text-[11px] font-medium text-[#4a5661] hover:text-[#5c4bb8] hover:bg-[#f4f2ff] transition cursor-pointer flex items-center gap-1"
                  title="Boolean Union"
                >
                  <Combine size={12} />
                  <span>Union</span>
                </button>
                <button
                  type="button"
                  onClick={() => mergeSelectedShapes('subtract')}
                  className="px-2 py-1 rounded-[6px] text-[11px] font-medium text-[#4a5661] hover:text-[#5c4bb8] hover:bg-[#f4f2ff] transition cursor-pointer"
                  title="Boolean Subtract"
                >
                  Subtract
                </button>
                <button
                  type="button"
                  onClick={() => mergeSelectedShapes('intersect')}
                  className="px-2 py-1 rounded-[6px] text-[11px] font-medium text-[#4a5661] hover:text-[#5c4bb8] hover:bg-[#f4f2ff] transition cursor-pointer"
                  title="Boolean Intersect"
                >
                  Intersect
                </button>
              </>
            )}

            {hasMulti && (
              <button
                type="button"
                onClick={clipToShape}
                className="px-2 py-1 rounded-[6px] text-[11px] font-medium text-[#4a5661] hover:text-[#5c4bb8] hover:bg-[#f4f2ff] transition cursor-pointer flex items-center gap-1"
                title="Clip Image/Element to Shape"
              >
                <Scissors size={12} />
                <span className="hidden lg:inline">Clip</span>
              </button>
            )}
          </div>

          {/* Right: Flip, Lock, Duplicate, Delete */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() =>
                updateSelectedElements({ flipH: !selectedElements[0]?.flipH })
              }
              className={btnCls}
              title="Flip Horizontal"
            >
              <FlipHorizontal2 size={14} />
            </button>
            <button
              type="button"
              onClick={() =>
                updateSelectedElements({ flipV: !selectedElements[0]?.flipV })
              }
              className={btnCls}
              title="Flip Vertical"
            >
              <FlipVertical2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => selectedElements.forEach((el) => toggleElementLock(el.id))}
              className={pillBtn(anyLocked)}
              title={anyLocked ? 'Unlock Selected' : 'Lock Selected'}
            >
              {anyLocked ? <Lock size={13} /> : <Unlock size={13} />}
            </button>
            <button
              type="button"
              onClick={duplicateSelectedElements}
              className={btnCls}
              title="Duplicate (Ctrl+D)"
            >
              <Copy size={14} />
            </button>
            <button
              type="button"
              onClick={deleteSelectedElements}
              className="p-1.5 rounded-[6px] text-[#b42318] hover:bg-[#ffe4e7] active:scale-95 transition cursor-pointer"
              title="Delete Selected"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
