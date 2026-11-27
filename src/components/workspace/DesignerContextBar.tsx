import React from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { PAGE_SIZES } from '../../constants/pageSizes';
import { ColorInput } from '../common/ColorInput';
import type { ShapeElement, TextElement } from '../../types/publisher';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUp,
  ArrowDown,
  Bold,
  Italic,
  Underline,
  Copy,
  Trash2,
  Lock,
  Unlock,
  FlipHorizontal2,
  FlipVertical2,
  Sparkles,
  Grid,
  Ruler,
  Magnet,
  LayoutDashboard,
  File,
  Files,
  BookOpen,
  RotateCw,
  Minus,
  Plus,
  Group,
  Ungroup,
  Combine,
} from 'lucide-react';

const QUICK_FONTS = [
  'Inter',
  'Playfair Display',
  'Montserrat',
  'Poppins',
  'Lora',
  'Oswald',
  'Georgia',
  'Arial',
];

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
    isRightPanelOpen,
    setIsRightPanelOpen,
    setRightPanelTab,
    updateElement,
    updateSelectedElements,
    alignSelected,
    bringForward,
    sendBackward,
    groupSelected,
    ungroupSelected,
    mergeSelectedShapes,
    duplicateSelectedElements,
    deleteSelectedElements,
    toggleElementLock,
  } = usePublisher();

  const selectedElements = activePage.elements.filter((el) =>
    selectedElementIds.includes(el.id)
  );
  const hasSelection = selectedElements.length > 0;
  const primary = selectedElements[0];
  const isSingleText = selectedElements.length === 1 && primary?.type === 'text';
  const isSingleShape = selectedElements.length === 1 && primary?.type === 'shape';
  const hasMulti = selectedElements.length >= 2;
  const allShapes = hasMulti && selectedElements.every((el) => el.type === 'shape');
  const hasGroup = selectedElements.some((el) => Boolean(el.groupId));
  const anyLocked = selectedElements.some((el) => Boolean(el.locked));

  const iconBtn = (active = false) =>
    `p-1.5 rounded-[7px] transition cursor-pointer active:scale-95 ${
      active
        ? 'bg-[#efeafd] text-[#5c4bb8]'
        : 'text-[#4a5661] hover:text-[#161a22] hover:bg-[#f4f2ff]'
    }`;

  const toggleEffectsInspector = () => {
    setRightPanelTab('inspector');
    setIsRightPanelOpen(!isRightPanelOpen);
  };

  return (
    <div className="pointer-events-auto max-w-[94%] bg-white/95 backdrop-blur-md border border-[#e5e9ee] rounded-[14px] shadow-[0_6px_24px_rgba(22,26,34,0.08)] px-2.5 py-1 flex items-center gap-1.5 overflow-x-auto select-none">
      {!hasSelection ? (
        <>
          <select
            value={project.pageSizeName}
            onChange={(e) => setPageSize(e.target.value)}
            className="h-7 px-2 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] text-[11px] font-medium text-[#161a22] outline-none cursor-pointer"
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
            className="flex items-center gap-1 h-7 px-2 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] text-[11px] font-medium text-[#4a5661] hover:text-[#5c4bb8] transition cursor-pointer whitespace-nowrap"
            title="Toggle Orientation"
          >
            <RotateCw size={11} />
            <span>{activePage.orientation === 'portrait' ? 'Portrait' : 'Landscape'}</span>
          </button>

          <div className="flex items-center gap-1 px-1" title="Page Fill">
            <ColorInput
              value={activePage.backgroundColor || '#ffffff'}
              onChange={(e) => setPageBackgroundColor(e.target.value)}
              className="w-6 h-6 rounded-full border border-[#e5e9ee]"
            />
          </div>

          <div className="w-[1px] h-4 bg-[#e5e9ee]" />

          <div className="flex items-center gap-0.5 bg-[#f3f5f7] p-0.5 rounded-[8px]">
            <button
              type="button"
              onClick={() => setViewMode('artboard')}
              className={iconBtn(viewMode === 'artboard')}
              title="Artboard View"
            >
              <LayoutDashboard size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={iconBtn(viewMode === 'single')}
              title="Single Page View"
            >
              <File size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('continuous')}
              className={iconBtn(viewMode === 'continuous')}
              title="Continuous Scroll"
            >
              <Files size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('spread')}
              className={iconBtn(viewMode === 'spread')}
              title="2-Page Spread"
            >
              <BookOpen size={13} />
            </button>
          </div>

          <div className="w-[1px] h-4 bg-[#e5e9ee]" />

          <button
            type="button"
            onClick={() => setRulerVisible(!rulerVisible)}
            className={iconBtn(rulerVisible)}
            title="Toggle Rulers"
          >
            <Ruler size={13} />
          </button>
          <button
            type="button"
            onClick={() => setGridVisible(!gridVisible)}
            className={iconBtn(gridVisible)}
            title="Toggle Grid"
          >
            <Grid size={13} />
          </button>
          <button
            type="button"
            onClick={() => {
              const next = !(snapToGuides || snapToGrid);
              setSnapToGuides(next);
              setSnapToGrid(next);
            }}
            className={iconBtn(snapToGuides || snapToGrid)}
            title="Toggle Snap"
          >
            <Magnet size={13} />
          </button>
        </>
      ) : (
        <>
          {/* Single Text Formatting Controls (Microsoft Designer Pill Style) */}
          {isSingleText && (
            <>
              <ColorInput
                value={(primary as TextElement).color || '#161a22'}
                onChange={(e) =>
                  updateElement(primary.id, { color: e.target.value })
                }
                className="w-6 h-6 rounded-full border border-[#e5e9ee]"
                title="Text Color"
              />

              <select
                value={(primary as TextElement).fontFamily || 'Inter'}
                onChange={(e) =>
                  updateElement(primary.id, { fontFamily: e.target.value })
                }
                className="h-7 max-w-[120px] px-2 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] text-[11px] font-medium text-[#161a22] outline-none cursor-pointer"
                title="Font Family"
              >
                {!QUICK_FONTS.includes((primary as TextElement).fontFamily) && (
                  <option value={(primary as TextElement).fontFamily}>
                    {(primary as TextElement).fontFamily}
                  </option>
                )}
                {QUICK_FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>

              <div className="flex items-center border border-[#e5e9ee] rounded-[8px] bg-[#f8fafb] h-7 px-1 gap-1">
                <button
                  type="button"
                  onClick={() =>
                    updateElement(primary.id, {
                      fontSize: Math.max(8, ((primary as TextElement).fontSize || 16) - 2),
                    })
                  }
                  className="p-0.5 text-[#4a5661] hover:text-[#5c4bb8] cursor-pointer"
                  title="Decrease Font Size"
                >
                  <Minus size={11} />
                </button>
                <span className="text-[11px] font-semibold min-w-[22px] text-center text-[#161a22]">
                  {Math.round((primary as TextElement).fontSize || 16)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateElement(primary.id, {
                      fontSize: Math.min(200, ((primary as TextElement).fontSize || 16) + 2),
                    })
                  }
                  className="p-0.5 text-[#4a5661] hover:text-[#5c4bb8] cursor-pointer"
                  title="Increase Font Size"
                >
                  <Plus size={11} />
                </button>
              </div>

              <div className="w-[1px] h-4 bg-[#e5e9ee]" />

              <button
                type="button"
                onClick={() =>
                  updateElement(primary.id, {
                    fontWeight:
                      (primary as TextElement).fontWeight === 'bold' ? 'normal' : 'bold',
                  })
                }
                className={iconBtn((primary as TextElement).fontWeight === 'bold')}
                title="Bold"
              >
                <Bold size={13} />
              </button>
              <button
                type="button"
                onClick={() =>
                  updateElement(primary.id, {
                    fontStyle:
                      (primary as TextElement).fontStyle === 'italic' ? 'normal' : 'italic',
                  })
                }
                className={iconBtn((primary as TextElement).fontStyle === 'italic')}
                title="Italic"
              >
                <Italic size={13} />
              </button>
              <button
                type="button"
                onClick={() =>
                  updateElement(primary.id, {
                    textDecoration:
                      (primary as TextElement).textDecoration === 'underline'
                        ? 'none'
                        : 'underline',
                  })
                }
                className={iconBtn((primary as TextElement).textDecoration === 'underline')}
                title="Underline"
              >
                <Underline size={13} />
              </button>

              <button
                type="button"
                onClick={() => {
                  const order: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];
                  const cur = (primary as TextElement).textAlign || 'left';
                  const next = order[(order.indexOf(cur as 'left' | 'center' | 'right') + 1) % order.length];
                  updateElement(primary.id, { textAlign: next });
                }}
                className={iconBtn(false)}
                title="Cycle Text Alignment"
              >
                {(primary as TextElement).textAlign === 'center' ? (
                  <AlignCenter size={13} />
                ) : (primary as TextElement).textAlign === 'right' ? (
                  <AlignRight size={13} />
                ) : (
                  <AlignLeft size={13} />
                )}
              </button>

              <div className="w-[1px] h-4 bg-[#e5e9ee]" />
            </>
          )}

          {/* Single Shape Quick Fill */}
          {isSingleShape && (
            <>
              <ColorInput
                value={(primary as ShapeElement).fillColor || '#6e56cf'}
                onChange={(e) => updateElement(primary.id, { fillColor: e.target.value })}
                className="w-6 h-6 rounded-full border border-[#e5e9ee]"
                title="Shape Fill"
              />
              <ColorInput
                value={(primary as ShapeElement).strokeColor || '#5c4bb8'}
                onChange={(e) => updateElement(primary.id, { strokeColor: e.target.value })}
                className="w-6 h-6 rounded-full border border-[#e5e9ee]"
                title="Shape Stroke"
              />
              <div className="w-[1px] h-4 bg-[#e5e9ee]" />
            </>
          )}

          {/* Multi-select Align / Group / Boolean */}
          {hasMulti && (
            <>
              <button type="button" onClick={() => alignSelected('left')} className={iconBtn()} title="Align Left">
                <AlignLeft size={13} />
              </button>
              <button type="button" onClick={() => alignSelected('center')} className={iconBtn()} title="Align Center">
                <AlignCenter size={13} />
              </button>
              <button type="button" onClick={() => alignSelected('right')} className={iconBtn()} title="Align Right">
                <AlignRight size={13} />
              </button>
              <button type="button" onClick={groupSelected} className={iconBtn()} title="Group">
                <Group size={13} />
              </button>
              {hasGroup && (
                <button type="button" onClick={ungroupSelected} className={iconBtn()} title="Ungroup">
                  <Ungroup size={13} />
                </button>
              )}
              {allShapes && (
                <button
                  type="button"
                  onClick={() => mergeSelectedShapes('union')}
                  className={iconBtn()}
                  title="Union Shapes"
                >
                  <Combine size={13} />
                </button>
              )}
              <div className="w-[1px] h-4 bg-[#e5e9ee]" />
            </>
          )}

          {/* Effects / Inspector Pill (Microsoft Designer signature purple-outlined pill) */}
          <button
            type="button"
            onClick={toggleEffectsInspector}
            className={`flex items-center gap-1 px-2.5 h-7 rounded-[8px] border text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
              isRightPanelOpen
                ? 'border-[#6e56cf] bg-[#efeafd] text-[#5c4bb8]'
                : 'border-[#6e56cf]/70 bg-white hover:bg-[#f4f2ff] text-[#5c4bb8]'
            }`}
            title="Toggle Effects & Full Inspector"
          >
            <Sparkles size={12} />
            <span>Effects</span>
          </button>

          <button type="button" onClick={bringForward} className={iconBtn()} title="Bring Forward">
            <ArrowUp size={13} />
          </button>
          <button type="button" onClick={sendBackward} className={iconBtn()} title="Send Backward">
            <ArrowDown size={13} />
          </button>

          <button
            type="button"
            onClick={() => updateSelectedElements({ flipH: !primary?.flipH })}
            className={iconBtn()}
            title="Flip Horizontal"
          >
            <FlipHorizontal2 size={13} />
          </button>
          <button
            type="button"
            onClick={() => updateSelectedElements({ flipV: !primary?.flipV })}
            className={iconBtn()}
            title="Flip Vertical"
          >
            <FlipVertical2 size={13} />
          </button>

          <button
            type="button"
            onClick={() => selectedElements.forEach((el) => toggleElementLock(el.id))}
            className={iconBtn(anyLocked)}
            title={anyLocked ? 'Unlock' : 'Lock'}
          >
            {anyLocked ? <Lock size={13} /> : <Unlock size={13} />}
          </button>
          <button type="button" onClick={duplicateSelectedElements} className={iconBtn()} title="Duplicate">
            <Copy size={13} />
          </button>
          <button
            type="button"
            onClick={deleteSelectedElements}
            className="p-1.5 rounded-[7px] text-[#b42318] hover:bg-[#ffe4e7] active:scale-95 transition cursor-pointer"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </>
      )}
    </div>
  );
};
