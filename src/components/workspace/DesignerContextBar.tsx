import React, { useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { CollageActionBar } from '../canvas/CollageActionBar';
import { TextActionBar } from '../canvas/TextActionBar';
import { useCollageSelection } from '../../hooks/useCollageSelection';
import { removeImageBackground } from '../../utils/bgRemoval';
import { ColorInput } from '../common/ColorInput';
import type { ImageElement, ShapeElement } from '../../types/publisher';
import {
  ArrowUp,
  ArrowDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  Lock,
  Unlock,
  FlipHorizontal2,
  FlipVertical2,
  Sparkles,
  Group,
  Ungroup,
  Combine,
  Crop,
  SlidersHorizontal,
  Eraser,
  ImagePlus,
  Loader2,
} from 'lucide-react';


export const DesignerContextBar: React.FC = () => {
  const {
    activePage,
    selectedElementIds,
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

  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [removingBg, setRemovingBg] = useState(false);

  const selectedElements = activePage.elements.filter((el) =>
    selectedElementIds.includes(el.id)
  );
  const collageSelection = useCollageSelection();

  if (selectedElements.length === 0) return null;

  // One collage, one bar — the same component Publisher mode uses.
  if (collageSelection) return <CollageActionBar />;

  const primary = selectedElements[0];
  const isSingleShape = selectedElements.length === 1 && primary?.type === 'shape';
  const isSingleImage = selectedElements.length === 1 && primary?.type === 'image';
  const hasMulti = selectedElements.length >= 2;
  const allShapes = hasMulti && selectedElements.every((el) => el.type === 'shape');
  const hasGroup = selectedElements.some((el) => Boolean(el.groupId));
  const anyLocked = selectedElements.some((el) => Boolean(el.locked));

  const iconBtn = (active = false) =>
    `min-w-[36px] min-h-[36px] p-2 rounded-[10px] flex items-center justify-center transition cursor-pointer active:scale-95 touch-manipulation ${
      active
        ? 'bg-[#efeafd] text-[#5c4bb8]'
        : 'text-[#4a5661] hover:text-[#161a22] hover:bg-[#f4f2ff]'
    }`;

  const labeledBtn = (active = false) =>
    `min-h-[36px] px-3 py-1.5 rounded-[10px] flex items-center gap-1.5 text-xs font-medium transition cursor-pointer active:scale-95 whitespace-nowrap touch-manipulation ${
      active
        ? 'bg-[#efeafd] text-[#5c4bb8]'
        : 'text-[#161a22] hover:bg-[#f4f2ff] hover:text-[#5c4bb8]'
    }`;

  const openInspector = () => {
    setRightPanelTab('inspector');
    setIsRightPanelOpen(true);
  };

  const toggleEffectsInspector = () => {
    setRightPanelTab('inspector');
    setIsRightPanelOpen(!isRightPanelOpen);
  };

  const handleReplaceImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isSingleImage) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateElement(primary.id, { src: reader.result });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveBg = async () => {
    if (!isSingleImage || removingBg) return;
    const imgEl = primary as ImageElement;
    if (!imgEl.src) return;
    setRemovingBg(true);
    try {
      const cleaned = await removeImageBackground(imgEl.src);
      updateElement(primary.id, { src: cleaned });
    } catch {
      // fallback to inspector if removal fails
      openInspector();
    } finally {
      setRemovingBg(false);
    }
  };

  return (
    <div className="pointer-events-auto max-w-[96%] min-h-[46px] bg-white/95 backdrop-blur-md border border-[#e5e9ee] rounded-2xl shadow-[0_8px_28px_rgba(22,26,34,0.10)] px-2.5 py-1 flex items-center gap-1 overflow-x-auto select-none touch-manipulation">
      {/* Text formatting: one shared bar, in both workspaces. It shows itself only when
          every selected element is text, so this needs no condition of its own. */}
      <TextActionBar />

      {/* Single Image Controls (Microsoft Designer Image Pill Style) */}
      {isSingleImage && (
        <>
          <button
            type="button"
            onClick={() => updateElement(primary.id, { rotation: ((primary.rotation || 0) + 90) % 360 })}
            className={labeledBtn()}
            title="Rotate 90° (or open Inspector for Crop)"
          >
            <Crop size={14} />
            <span>Crop &amp; rotate</span>
          </button>
          <button
            type="button"
            onClick={openInspector}
            className={labeledBtn(isRightPanelOpen)}
            title="Image Adjustments & Filters"
          >
            <SlidersHorizontal size={14} />
            <span>Adjustments</span>
          </button>
          <button
            type="button"
            onClick={handleRemoveBg}
            disabled={removingBg}
            className={labeledBtn(false)}
            title="Remove Image Background"
          >
            {removingBg ? <Loader2 size={14} className="animate-spin" /> : <Eraser size={14} />}
            <span>{removingBg ? 'Removing…' : 'Remove BG'}</span>
          </button>
          <input
            ref={replaceInputRef}
            type="file"
            accept="image/*"
            onChange={handleReplaceImage}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => replaceInputRef.current?.click()}
            className={iconBtn()}
            title="Replace Image"
          >
            <ImagePlus size={15} />
          </button>
          <div className="w-[1px] h-5 bg-[#e5e9ee] mx-0.5" />
        </>
      )}

      {/* Single Shape Quick Fill */}
      {isSingleShape && (
        <>
          <ColorInput
            value={(primary as ShapeElement).fillColor || '#6e56cf'}
            onChange={(e) => updateElement(primary.id, { fillColor: e.target.value })}
            className="w-8 h-8 rounded-full border border-[#e5e9ee] flex-shrink-0 touch-manipulation"
            title="Shape Fill"
          />
          <ColorInput
            value={(primary as ShapeElement).strokeColor || '#5c4bb8'}
            onChange={(e) => updateElement(primary.id, { strokeColor: e.target.value })}
            className="w-8 h-8 rounded-full border border-[#e5e9ee] flex-shrink-0 touch-manipulation"
            title="Shape Stroke"
          />
          <div className="w-[1px] h-5 bg-[#e5e9ee] mx-0.5" />
        </>
      )}

      {/* Multi-select Align / Group / Boolean */}
      {hasMulti && (
        <>
          <button type="button" onClick={() => alignSelected('left')} className={iconBtn()} title="Align Left">
            <AlignLeft size={15} />
          </button>
          <button type="button" onClick={() => alignSelected('center')} className={iconBtn()} title="Align Center">
            <AlignCenter size={15} />
          </button>
          <button type="button" onClick={() => alignSelected('right')} className={iconBtn()} title="Align Right">
            <AlignRight size={15} />
          </button>
          <button type="button" onClick={groupSelected} className={iconBtn()} title="Group">
            <Group size={15} />
          </button>
          {hasGroup && (
            <button type="button" onClick={ungroupSelected} className={iconBtn()} title="Ungroup">
              <Ungroup size={15} />
            </button>
          )}
          {allShapes && (
            <button
              type="button"
              onClick={() => mergeSelectedShapes('union')}
              className={iconBtn()}
              title="Union Shapes"
            >
              <Combine size={15} />
            </button>
          )}
          <div className="w-[1px] h-5 bg-[#e5e9ee] mx-0.5" />
        </>
      )}

      {/* Effects / Inspector Pill */}
      <button
        type="button"
        onClick={toggleEffectsInspector}
        className={`flex items-center gap-1.5 px-3 min-h-[36px] rounded-[10px] border text-xs font-semibold transition cursor-pointer whitespace-nowrap touch-manipulation ${
          isRightPanelOpen
            ? 'border-[#6e56cf] bg-[#efeafd] text-[#5c4bb8]'
            : 'border-[#6e56cf]/70 bg-white hover:bg-[#f4f2ff] text-[#5c4bb8]'
        }`}
        title="Toggle Effects & Full Inspector"
      >
        <Sparkles size={14} />
        <span>Effects</span>
      </button>

      <button type="button" onClick={bringForward} className={iconBtn()} title="Bring Forward">
        <ArrowUp size={15} />
      </button>
      <button type="button" onClick={sendBackward} className={iconBtn()} title="Send Backward">
        <ArrowDown size={15} />
      </button>

      <button
        type="button"
        onClick={() => updateSelectedElements({ flipH: !primary?.flipH })}
        className={iconBtn()}
        title="Flip Horizontal"
      >
        <FlipHorizontal2 size={15} />
      </button>
      <button
        type="button"
        onClick={() => updateSelectedElements({ flipV: !primary?.flipV })}
        className={iconBtn()}
        title="Flip Vertical"
      >
        <FlipVertical2 size={15} />
      </button>

      <button
        type="button"
        onClick={() => selectedElements.forEach((el) => toggleElementLock(el.id))}
        className={iconBtn(anyLocked)}
        title={anyLocked ? 'Unlock' : 'Lock'}
      >
        {anyLocked ? <Lock size={15} /> : <Unlock size={15} />}
      </button>
      <button type="button" onClick={duplicateSelectedElements} className={iconBtn()} title="Duplicate">
        <Copy size={15} />
      </button>
      <button
        type="button"
        onClick={deleteSelectedElements}
        className="min-w-[36px] min-h-[36px] p-2 rounded-[10px] flex items-center justify-center text-[#b42318] hover:bg-[#ffe4e7] active:scale-95 transition cursor-pointer touch-manipulation"
        title="Delete"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
};
