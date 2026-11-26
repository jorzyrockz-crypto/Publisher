import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { COLLAGE_LAYOUTS, computeCollageSlots, suggestBestLayout } from '../../utils/collageLayouts';
import {
  COLLAGE_BORDER_ART_OPTIONS,
  COLLAGE_VIBE_PACKS,
  BorderArtId,
  CollageBackdropConfig,
  CollageBackdropType,
  CollageMeta,
  CollageSlotState,
  CollageStyleConfig,
  SlotMaskShape,
  StyleEffectId,
  getBackdropPreviewStyle,
  getEffectCssFilter,
  getMaskClipPath,
  toPublisherBorderArt,
  toPublisherEffect,
  toPublisherMask,
} from '../../utils/borderArtStyles';
import { ImageElement, PublisherElement, ShapeElement } from '../../types/publisher';
import {
  LayoutGrid,
  X,
  Upload,
  ImagePlus,
  Trash2,
  Wand2,
  Shuffle,
  ArrowLeftRight,
  Undo2,
  Redo2,
  RotateCw,
  FlipHorizontal2,
  ArrowUpToLine,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export type { CollageSlotState, CollageMeta };

interface CollageModalProps {
  initialMeta?: CollageMeta;
}

const MAX_LONG_EDGE = 2000;

const DEFAULT_STYLE: CollageStyleConfig = {
  borderArt: 'none',
  frameColor: '#ffffff',
  accentColor: '#ff8fab',
  frameThickness: 4,
  effect: 'none',
  mask: 'rounded',
  gap: 10,
  cornerRadius: 12,
  scatterTilt: false,
};

const DEFAULT_BACKDROP: CollageBackdropConfig = {
  type: 'none',
  color: '#fff1f2',
  padding: 16,
};

const createEmptySlot = (): CollageSlotState => ({
  imageUrl: null,
  cropX: 0,
  cropY: 0,
  zoom: 1,
  imageRotation: 0,
  flipH: false,
});

const createDefaultMeta = (): CollageMeta => ({
  layoutId: '4-grid',
  aspectRatio: '1:1',
  globalStyle: { ...DEFAULT_STYLE },
  backdrop: { ...DEFAULT_BACKDROP },
  slots: Array.from({ length: 9 }, createEmptySlot),
});

function getAspectDimensions(
  aspect: CollageMeta['aspectRatio'],
  availW: number,
  availH: number,
  maxBox: number
): { width: number; height: number } {
  let ratio = 1;
  if (aspect === '4:3') ratio = 4 / 3;
  else if (aspect === '3:4') ratio = 3 / 4;
  else if (aspect === '16:9') ratio = 16 / 9;
  else if (aspect === '9:16') ratio = 9 / 16;
  else if (aspect === 'page-margin') ratio = availW / Math.max(1, availH);

  let width = maxBox;
  let height = Math.round(maxBox / ratio);
  if (height > maxBox) {
    height = maxBox;
    width = Math.round(maxBox * ratio);
  }
  return { width: Math.max(120, width), height: Math.max(120, height) };
}

export const CollageModal: React.FC<CollageModalProps> = ({ initialMeta }) => {
  const {
    isCollageModalOpen,
    setIsCollageModalOpen,
    editingCollageState,
    activePage,
    addElementsBatch,
    replaceCollageGroup,
  } = usePublisher();

  const resolvedInitialMeta = initialMeta || editingCollageState?.meta;
  const isEditMode = Boolean(resolvedInitialMeta);

  const [meta, setMeta] = useState<CollageMeta>(() =>
    resolvedInitialMeta ? JSON.parse(JSON.stringify(resolvedInitialMeta)) : createDefaultMeta()
  );
  const [past, setPast] = useState<CollageMeta[]>([]);
  const [future, setFuture] = useState<CollageMeta[]>([]);
  const [layoutFilter, setLayoutFilter] = useState<'all' | '2-3' | '4-5' | '6+' | 'scrapbook'>('all');
  const [inspectorScope, setInspectorScope] = useState<'all' | 'slot'>('all');
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number>(0);
  const [tapSwapMode, setTapSwapMode] = useState<boolean>(false);
  const [swapSourceIdx, setSwapSourceIdx] = useState<number | null>(null);
  const [dragSwapIdx, setDragSwapIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [groupSlots, setGroupSlots] = useState<boolean>(true);
  const [tiltSeed, setTiltSeed] = useState<number>(0);
  const [isDraggingCrop, setIsDraggingCrop] = useState<boolean>(false);

  const multiFileRef = useRef<HTMLInputElement>(null);
  const singleFileRef = useRef<HTMLInputElement>(null);
  const activeUploadSlotRef = useRef<number>(0);
  const blobUrlsRef = useRef<Set<string>>(new Set());

  // Sync state whenever modal opens or edit target changes
  useEffect(() => {
    if (!isCollageModalOpen) return;
    const seed = initialMeta || editingCollageState?.meta;
    const next = seed ? (JSON.parse(JSON.stringify(seed)) as CollageMeta) : createDefaultMeta();
    while (next.slots.length < 9) {
      next.slots.push(createEmptySlot());
    }
    setMeta(next);
    setPast([]);
    setFuture([]);
    setSelectedSlotIdx(0);
    setInspectorScope('all');
    setSwapSourceIdx(null);
  }, [isCollageModalOpen, initialMeta, editingCollageState]);

  // Revoke any tracked temporary blob URLs on unmount
  useEffect(() => {
    const urls = blobUrlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      urls.clear();
    };
  }, []);

  const commitMeta = useCallback(
    (updater: CollageMeta | ((prev: CollageMeta) => CollageMeta)) => {
      setMeta((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        setPast((p) => [...p.slice(-24), prev]);
        setFuture([]);
        return next;
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const previous = prevPast[prevPast.length - 1];
      setFuture((f) => [meta, ...f]);
      setMeta(previous);
      return prevPast.slice(0, -1);
    });
  }, [meta]);

  const handleRedo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const next = prevFuture[0];
      setPast((p) => [...p, meta]);
      setMeta(next);
      return prevFuture.slice(1);
    });
  }, [meta]);

  // Keyboard Undo / Redo inside modal
  useEffect(() => {
    if (!isCollageModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCollageModalOpen, handleUndo, handleRedo]);

  // Optimize & downscale images > 2000px on longest edge
  const optimizeImageFile = useCallback(
    (file: File): Promise<{ url: string; width: number; height: number }> => {
      return new Promise((resolve) => {
        const objUrl = URL.createObjectURL(file);
        blobUrlsRef.current.add(objUrl);

        const img = new Image();
        img.onload = () => {
          const origW = img.naturalWidth || 800;
          const origH = img.naturalHeight || 600;
          const longest = Math.max(origW, origH);
          const scale = longest > MAX_LONG_EDGE ? MAX_LONG_EDGE / longest : 1;
          const targetW = Math.max(1, Math.round(origW * scale));
          const targetH = Math.max(1, Math.round(origH * scale));

          const off = document.createElement('canvas');
          off.width = targetW;
          off.height = targetH;
          const ctx = off.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, targetW, targetH);
            const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            const dataUrl = off.toDataURL(mime, mime === 'image/jpeg' ? 0.9 : undefined);
            URL.revokeObjectURL(objUrl);
            blobUrlsRef.current.delete(objUrl);
            resolve({ url: dataUrl, width: targetW, height: targetH });
          } else {
            const reader = new FileReader();
            reader.onload = (ev) => {
              URL.revokeObjectURL(objUrl);
              blobUrlsRef.current.delete(objUrl);
              resolve({ url: String(ev.target?.result || ''), width: origW, height: origH });
            };
            reader.readAsDataURL(file);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(objUrl);
          blobUrlsRef.current.delete(objUrl);
          resolve({ url: '', width: 0, height: 0 });
        };
        img.src = objUrl;
      });
    },
    []
  );

  const activeLayout = useMemo(
    () => COLLAGE_LAYOUTS.find((l) => l.id === meta.layoutId) || COLLAGE_LAYOUTS[0],
    [meta.layoutId]
  );

  const filteredLayouts = useMemo(() => {
    return COLLAGE_LAYOUTS.filter((l) => {
      if (layoutFilter === '2-3') return l.slotCount >= 2 && l.slotCount <= 3;
      if (layoutFilter === '4-5') return l.slotCount >= 4 && l.slotCount <= 5;
      if (layoutFilter === '6+') return l.slotCount >= 6;
      if (layoutFilter === 'scrapbook') return l.category === 'scrapbook';
      return true;
    });
  }, [layoutFilter]);

  if (!isCollageModalOpen) return null;

  const availW = Math.max(220, activePage.width - activePage.margins.left - activePage.margins.right);
  const availH = Math.max(220, activePage.height - activePage.margins.top - activePage.margins.bottom);

  const previewStageBox = getAspectDimensions(meta.aspectRatio, availW, availH, 340);
  const pad = meta.backdrop.type === 'none' ? 0 : meta.backdrop.padding;
  const innerPreviewW = Math.max(80, previewStageBox.width - pad * 2);
  const innerPreviewH = Math.max(80, previewStageBox.height - pad * 2);

  const rawComputedSlots = computeCollageSlots(
    activeLayout,
    innerPreviewW,
    innerPreviewH,
    meta.globalStyle.gap,
    meta.globalStyle.scatterTilt
  );

  const computedSlots = rawComputedSlots.map((slot, idx) => {
    const tiltOffset =
      tiltSeed > 0 && meta.globalStyle.scatterTilt
        ? ((idx + tiltSeed) % 2 === 0 ? 1 : -1) * (((idx * 3 + tiltSeed) % 5) + 1)
        : 0;
    const slotState = meta.slots[idx] || createEmptySlot();
    return {
      ...slot,
      rotation: meta.globalStyle.scatterTilt ? slot.rotation + tiltOffset : slot.rotation,
      zIndex: slotState.zIndexOverride ?? slot.zIndex,
    };
  });

  const ingestMultiFiles = async (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith('image/'));
    if (imgs.length === 0) return;
    const optimized = (await Promise.all(imgs.map(optimizeImageFile))).filter((r) => Boolean(r.url));
    if (optimized.length === 0) return;

    commitMeta((prev) => {
      const nextSlots = [...prev.slots];
      while (nextSlots.length < Math.max(9, activeLayout.slotCount)) {
        nextSlots.push(createEmptySlot());
      }
      let cursor = 0;
      for (let i = 0; i < activeLayout.slotCount && cursor < optimized.length; i++) {
        if (!nextSlots[i]?.imageUrl) {
          nextSlots[i] = {
            ...nextSlots[i],
            imageUrl: optimized[cursor].url,
            naturalWidth: optimized[cursor].width,
            naturalHeight: optimized[cursor].height,
            cropX: 0,
            cropY: 0,
            zoom: 1,
          };
          cursor++;
        }
      }
      // If no empty slots left, overwrite from index 0
      if (cursor === 0) {
        optimized.slice(0, activeLayout.slotCount).forEach((item, idx) => {
          nextSlots[idx] = {
            ...nextSlots[idx],
            imageUrl: item.url,
            naturalWidth: item.width,
            naturalHeight: item.height,
            cropX: 0,
            cropY: 0,
            zoom: 1,
          };
        });
      }
      return { ...prev, slots: nextSlots };
    });
  };

  const ingestSingleFile = async (file: File, targetIdx: number) => {
    if (!file.type.startsWith('image/')) return;
    const res = await optimizeImageFile(file);
    if (!res.url) return;
    commitMeta((prev) => {
      const nextSlots = [...prev.slots];
      nextSlots[targetIdx] = {
        ...(nextSlots[targetIdx] || createEmptySlot()),
        imageUrl: res.url,
        naturalWidth: res.width,
        naturalHeight: res.height,
        cropX: 0,
        cropY: 0,
        zoom: 1,
      };
      return { ...prev, slots: nextSlots };
    });
  };

  const swapSlots = (idxA: number, idxB: number) => {
    if (idxA === idxB) return;
    commitMeta((prev) => {
      const next = [...prev.slots];
      const temp = next[idxA] || createEmptySlot();
      next[idxA] = next[idxB] || createEmptySlot();
      next[idxB] = temp;
      return { ...prev, slots: next };
    });
    setSelectedSlotIdx(idxB);
  };

  const handleAutoMatchLayout = () => {
    const filled = meta.slots
      .slice(0, activeLayout.slotCount)
      .filter((s) => Boolean(s.imageUrl))
      .map((s) => ({
        width: s.naturalWidth || 800,
        height: s.naturalHeight || 800,
      }));
    const allWithImg = meta.slots
      .filter((s) => Boolean(s.imageUrl))
      .map((s) => ({
        width: s.naturalWidth || 800,
        height: s.naturalHeight || 800,
      }));
    const photos = allWithImg.length > 0 ? allWithImg : filled;
    const bestId = suggestBestLayout(photos);
    commitMeta((prev) => ({ ...prev, layoutId: bestId }));
  };

  const handleShufflePhotos = () => {
    commitMeta((prev) => {
      const count = activeLayout.slotCount;
      const head = prev.slots.slice(0, count);
      for (let i = head.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [head[i], head[j]] = [head[j], head[i]];
      }
      return { ...prev, slots: [...head, ...prev.slots.slice(count)] };
    });
  };

  const handleApplyVibePack = (packId: string) => {
    const pack = COLLAGE_VIBE_PACKS.find((p) => p.id === packId);
    if (!pack) return;
    commitMeta((prev) => ({
      ...prev,
      vibePackId: pack.id,
      globalStyle: { ...prev.globalStyle, ...pack.style },
      backdrop: { ...pack.backdrop },
      slots: prev.slots.map((s, idx) => ({
        ...s,
        caption: pack.enableCaptions && !s.caption ? `Memory #${idx + 1}` : s.caption,
      })),
    }));
  };

  const selectedSlot = meta.slots[selectedSlotIdx] || createEmptySlot();
  const activeStyleForInspector: CollageStyleConfig =
    inspectorScope === 'slot' && selectedSlot.styleOverride
      ? { ...meta.globalStyle, ...selectedSlot.styleOverride }
      : meta.globalStyle;

  const updateInspectorStyle = (patch: Partial<CollageStyleConfig>) => {
    if (inspectorScope === 'slot') {
      commitMeta((prev) => {
        const nextSlots = [...prev.slots];
        const cur = nextSlots[selectedSlotIdx] || createEmptySlot();
        nextSlots[selectedSlotIdx] = {
          ...cur,
          styleOverride: {
            ...cur.styleOverride,
            ...(patch.borderArt !== undefined ? { borderArt: patch.borderArt } : {}),
            ...(patch.frameColor !== undefined ? { frameColor: patch.frameColor } : {}),
            ...(patch.accentColor !== undefined ? { accentColor: patch.accentColor } : {}),
            ...(patch.effect !== undefined ? { effect: patch.effect } : {}),
            ...(patch.mask !== undefined ? { mask: patch.mask } : {}),
          },
        };
        return { ...prev, slots: nextSlots };
      });
    } else {
      commitMeta((prev) => ({
        ...prev,
        vibePackId: undefined,
        globalStyle: { ...prev.globalStyle, ...patch },
      }));
    }
  };

  const handleSaveCollage = () => {
    const canvasDims = getAspectDimensions(
      meta.aspectRatio,
      availW,
      availH,
      Math.min(availW, availH, 540)
    );
    const originX = editingCollageState
      ? editingCollageState.originX
      : Math.round((activePage.width - canvasDims.width) / 2);
    const originY = editingCollageState
      ? editingCollageState.originY
      : Math.round((activePage.height - canvasDims.height) / 2);

    const canvasPad = meta.backdrop.type === 'none' ? 0 : Math.round(meta.backdrop.padding * 1.4);
    const slotCanvasW = Math.max(120, canvasDims.width - canvasPad * 2);
    const slotCanvasH = Math.max(120, canvasDims.height - canvasPad * 2);
    const canvasSlots = computeCollageSlots(
      activeLayout,
      slotCanvasW,
      slotCanvasH,
      Math.round(meta.globalStyle.gap * 1.3),
      meta.globalStyle.scatterTilt
    );

    const groupId = groupSlots
      ? editingCollageState?.groupId || `grp-collage-${Date.now()}`
      : undefined;
    const serializedMeta: CollageMeta = JSON.parse(JSON.stringify(meta));
    const elementsToInsert: PublisherElement[] = [];

    // Optional Backdrop Card element behind slots
    if (meta.backdrop.type !== 'none') {
      const backdropFill =
        meta.backdrop.type === 'pastel-gradient'
          ? meta.backdrop.color || '#fdf2f8'
          : meta.backdrop.color || '#f8fafc';
      const backdropEl: ShapeElement = {
        id: `shp-col-bg-${Date.now()}`,
        type: 'shape',
        name: 'Collage Backdrop Card',
        groupId,
        collageMeta: serializedMeta,
        shapeType: 'rounded-rect',
        cornerRadius: 18,
        fillColor: backdropFill,
        fillType: meta.backdrop.type === 'pastel-gradient' ? 'linear-gradient' : 'solid',
        gradientColor2: meta.backdrop.type === 'pastel-gradient' ? '#e0f2fe' : undefined,
        gradientAngle: 135,
        strokeColor: meta.backdrop.type === 'kraft-paper' ? '#d4a373' : '#e2e8f0',
        strokeWidth: 1,
        x: originX,
        y: originY,
        width: canvasDims.width,
        height: canvasDims.height,
        rotation: 0,
        zIndex: 1,
        shadow: true,
        shadowBlur: 14,
      };
      elementsToInsert.push(backdropEl);
    }

    canvasSlots.forEach((slot, idx) => {
      const sState = meta.slots[idx] || createEmptySlot();
      const effBorderArt = sState.styleOverride?.borderArt ?? meta.globalStyle.borderArt;
      const effFrameColor = sState.styleOverride?.frameColor ?? meta.globalStyle.frameColor;
      const effAccentColor = sState.styleOverride?.accentColor ?? meta.globalStyle.accentColor;
      const effEffect = sState.styleOverride?.effect ?? meta.globalStyle.effect;
      const effMask = sState.styleOverride?.mask ?? meta.globalStyle.mask;

      const tiltOffset =
        tiltSeed > 0 && meta.globalStyle.scatterTilt
          ? ((idx + tiltSeed) % 2 === 0 ? 1 : -1) * (((idx * 3 + tiltSeed) % 5) + 1)
          : 0;
      const finalRotation = meta.globalStyle.scatterTilt ? slot.rotation + tiltOffset : slot.rotation;

      const imgEl: ImageElement = {
        id: `img-col-${Date.now()}-${idx}`,
        type: 'image',
        name: sState.imageUrl ? `Collage Photo ${idx + 1}` : `Photo Slot ${idx + 1}`,
        groupId,
        collageMeta: groupSlots ? serializedMeta : undefined,
        src: sState.imageUrl || '',
        x: originX + canvasPad + slot.x,
        y: originY + canvasPad + slot.y,
        width: slot.width,
        height: slot.height,
        rotation: finalRotation,
        zIndex: 2 + (sState.zIndexOverride ?? slot.zIndex),
        objectFit: 'cover',
        aspectRatioLocked: false,
        borderRadius: meta.globalStyle.cornerRadius,
        borderArt: toPublisherBorderArt(effBorderArt),
        borderArtColor: effFrameColor,
        borderArtColor2: effAccentColor,
        borderArtWidth: meta.globalStyle.frameThickness,
        borderArtCaption: sState.caption,
        effectPreset: toPublisherEffect(effEffect),
        maskShape: toPublisherMask(effMask),
        panX: sState.cropX,
        panY: sState.cropY,
        imageScale: sState.zoom,
        imageRotation: sState.imageRotation,
        flipH: sState.flipH,
      };
      elementsToInsert.push(imgEl);
    });

    if (editingCollageState) {
      replaceCollageGroup(
        elementsToInsert,
        editingCollageState.groupId,
        editingCollageState.elementId
      );
    } else {
      addElementsBatch(elementsToInsert);
    }
    setIsCollageModalOpen(false);
  };

  const activeBorderDef =
    COLLAGE_BORDER_ART_OPTIONS.find((b) => b.id === activeStyleForInspector.borderArt) ||
    COLLAGE_BORDER_ART_OPTIONS[0];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-3 select-none"
      onClick={() => setIsCollageModalOpen(false)}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-6xl w-full max-h-[93vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <LayoutGrid size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>Photo Collage Studio</span>
                {isEditMode && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                    Editing Group
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-500">
                18 layouts, Vibe Packs, cute BorderArt frames, in-slot crop &amp; re-editable groups
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={past.length === 0}
              onClick={handleUndo}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 transition"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={15} />
            </button>
            <button
              type="button"
              disabled={future.length === 0}
              onClick={handleRedo}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 transition"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => setIsCollageModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <input
          ref={multiFileRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            ingestMultiFiles(Array.from(e.target.files || []));
            e.target.value = '';
          }}
        />
        <input
          ref={singleFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) ingestSingleFile(file, activeUploadSlotRef.current);
            e.target.value = '';
          }}
        />

        {/* Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left Column: Vibe Packs & 18 Layouts (4 cols) */}
          <div className="lg:col-span-4 p-4 space-y-4 overflow-y-auto max-h-[75vh]">
            {/* One-Click Vibe Packs */}
            <div>
              <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Sparkles size={12} className="text-indigo-600" />
                <span>One-Click Vibe Packs</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {COLLAGE_VIBE_PACKS.map((pack) => {
                  const isActive = meta.vibePackId === pack.id;
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => handleApplyVibePack(pack.id)}
                      title={pack.description}
                      className={`px-2.5 py-1.5 rounded-xl border text-[10.5px] font-bold whitespace-nowrap transition cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {pack.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category / Count Filter Pills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">
                  Layouts ({filteredLayouts.length})
                </label>
                <button
                  type="button"
                  onClick={handleAutoMatchLayout}
                  className="px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Pick best layout based on your uploaded photos"
                >
                  <Wand2 size={11} />
                  <span>Auto-Match</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1">
                {(
                  [
                    { id: 'all', label: 'All (18)' },
                    { id: '2-3', label: '2–3' },
                    { id: '4-5', label: '4–5' },
                    { id: '6+', label: '6+' },
                    { id: 'scrapbook', label: 'Scrapbook' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setLayoutFilter(cat.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                      layoutFilter === cat.id
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-1.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredLayouts.map((layout) => {
                  const isActive = layout.id === activeLayout.id;
                  const miniSlots = computeCollageSlots(
                    layout,
                    44,
                    44,
                    2,
                    layout.category === 'scrapbook'
                  );
                  return (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => commitMeta((prev) => ({ ...prev, layoutId: layout.id }))}
                      className={`p-1.5 rounded-xl border flex items-center gap-2 text-left transition cursor-pointer ${
                        isActive
                          ? 'border-indigo-600 bg-indigo-50/75 ring-1 ring-indigo-500/30'
                          : 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="relative w-11 h-11 flex-shrink-0 bg-slate-100 rounded-md overflow-hidden p-0.5">
                        {miniSlots.map((s) => (
                          <div
                            key={s.index}
                            style={{
                              position: 'absolute',
                              left: `${s.x}px`,
                              top: `${s.y}px`,
                              width: `${s.width}px`,
                              height: `${s.height}px`,
                              transform: s.rotation ? `rotate(${s.rotation}deg)` : undefined,
                              zIndex: s.zIndex,
                            }}
                            className={`rounded-[2px] border border-white/70 ${
                              isActive ? 'bg-indigo-500/85' : 'bg-slate-400/75'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10.5px] font-bold text-slate-800 truncate">
                          {layout.name}
                        </div>
                        <div className="text-[9.5px] text-slate-400 capitalize">
                          {layout.slotCount} slots • {layout.category}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center Column: Interactive Stage & Top Quick Bar (5 cols) */}
          <div
            className="lg:col-span-5 p-4 bg-slate-50/90 flex flex-col justify-between gap-3"
            onDragOver={(e) => {
              if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
            }}
            onDrop={(e) => {
              const files = Array.from(e.dataTransfer?.files || []);
              if (files.length > 0) {
                e.preventDefault();
                ingestMultiFiles(files);
              }
            }}
          >
            {/* Top Quick Bar: Aspect Ratio + Quick Tools */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      { id: '1:1', label: '1:1' },
                      { id: '4:3', label: '4:3' },
                      { id: '3:4', label: '3:4' },
                      { id: '16:9', label: '16:9' },
                      { id: '9:16', label: '9:16' },
                      { id: 'page-margin', label: 'Page Fit' },
                    ] as const
                  ).map((ar) => (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => commitMeta((prev) => ({ ...prev, aspectRatio: ar.id }))}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                        meta.aspectRatio === ar.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => multiFileRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                >
                  <Upload size={12} />
                  <span>Add Photos</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleShufflePhotos}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-semibold text-slate-700 flex items-center gap-1 transition"
                >
                  <Shuffle size={11} />
                  <span>Shuffle Photos</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    commitMeta((prev) => ({
                      ...prev,
                      globalStyle: { ...prev.globalStyle, scatterTilt: true },
                    }));
                    setTiltSeed((s) => s + 1);
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-semibold text-slate-700 flex items-center gap-1 transition"
                >
                  <RefreshCw size={11} />
                  <span>Shuffle Tilts</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTapSwapMode((m) => !m);
                    setSwapSourceIdx(null);
                  }}
                  className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition ${
                    tapSwapMode
                      ? 'bg-amber-100 border-amber-400 text-amber-900'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <ArrowLeftRight size={11} />
                  <span>{tapSwapMode ? 'Tap Swap ON' : 'Tap-to-Swap'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    commitMeta((prev) => ({
                      ...prev,
                      slots: prev.slots.map(() => createEmptySlot()),
                    }))
                  }
                  className="ml-auto px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-[10px] font-semibold text-slate-500 transition"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Live Collage Preview Stage */}
            <div className="flex-1 flex items-center justify-center py-2">
              <div
                className="relative rounded-2xl shadow-md border border-slate-200 transition-all"
                style={{
                  width: `${previewStageBox.width}px`,
                  height: `${previewStageBox.height}px`,
                  padding: `${pad}px`,
                  ...getBackdropPreviewStyle(meta.backdrop),
                }}
              >
                <div
                  className="relative"
                  style={{ width: `${innerPreviewW}px`, height: `${innerPreviewH}px` }}
                >
                  {computedSlots.map((slot, idx) => {
                    const slotState = meta.slots[idx] || createEmptySlot();
                    const effBorderArt = slotState.styleOverride?.borderArt ?? meta.globalStyle.borderArt;
                    const effFrameColor = slotState.styleOverride?.frameColor ?? meta.globalStyle.frameColor;
                    const effAccentColor = slotState.styleOverride?.accentColor ?? meta.globalStyle.accentColor;
                    const effEffect = slotState.styleOverride?.effect ?? meta.globalStyle.effect;
                    const effMask = slotState.styleOverride?.mask ?? meta.globalStyle.mask;

                    const artDef =
                      COLLAGE_BORDER_ART_OPTIONS.find((b) => b.id === effBorderArt) ||
                      COLLAGE_BORDER_ART_OPTIONS[0];
                    const containerStyle = artDef.getContainerStyle({
                      frameColor: effFrameColor,
                      accentColor: effAccentColor,
                      thickness: meta.globalStyle.frameThickness,
                      cornerRadius: meta.globalStyle.cornerRadius,
                    });
                    const innerStyle = artDef.getInnerStyle?.({
                      frameColor: effFrameColor,
                      accentColor: effAccentColor,
                      thickness: meta.globalStyle.frameThickness,
                      cornerRadius: meta.globalStyle.cornerRadius,
                    });
                    const clipPath = getMaskClipPath(effMask);
                    const isSelected = selectedSlotIdx === idx;
                    const isSwapSource = swapSourceIdx === idx;
                    const isDragTarget = dragOverIdx === idx;

                    return (
                      <div
                        key={idx}
                        draggable={!isDraggingCrop && Boolean(slotState.imageUrl)}
                        onDragStart={() => setDragSwapIdx(idx)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragOverIdx !== idx) setDragOverIdx(idx);
                        }}
                        onDragLeave={() => {
                          if (dragOverIdx === idx) setDragOverIdx(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverIdx(null);
                          const droppedFiles = Array.from(e.dataTransfer?.files || []);
                          if (droppedFiles.length > 0) {
                            ingestSingleFile(droppedFiles[0], idx);
                            setDragSwapIdx(null);
                            return;
                          }
                          if (dragSwapIdx !== null && dragSwapIdx !== idx) {
                            swapSlots(dragSwapIdx, idx);
                          }
                          setDragSwapIdx(null);
                        }}
                        onClick={() => {
                          if (tapSwapMode) {
                            if (swapSourceIdx === null) {
                              setSwapSourceIdx(idx);
                            } else {
                              swapSlots(swapSourceIdx, idx);
                              setSwapSourceIdx(null);
                            }
                            return;
                          }
                          setSelectedSlotIdx(idx);
                          if (!slotState.imageUrl) {
                            activeUploadSlotRef.current = idx;
                            singleFileRef.current?.click();
                          }
                        }}
                        style={{
                          position: 'absolute',
                          left: `${slot.x}px`,
                          top: `${slot.y}px`,
                          width: `${slot.width}px`,
                          height: `${slot.height}px`,
                          transform: slot.rotation ? `rotate(${slot.rotation}deg)` : undefined,
                          zIndex: isSelected ? slot.zIndex + 20 : slot.zIndex,
                          clipPath,
                          ...containerStyle,
                          outline: isDragTarget
                            ? '3px dashed #4f46e5'
                            : isSwapSource
                            ? '3px solid #f59e0b'
                            : isSelected
                            ? '2px solid #4f46e5'
                            : containerStyle.outline,
                        }}
                        className="group cursor-pointer transition-shadow flex flex-col"
                      >
                        {/* Washi tape top strip */}
                        {effBorderArt === 'washi-tape' && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '-7px',
                              left: '50%',
                              transform: 'translateX(-50%) rotate(-3deg)',
                              width: '44px',
                              height: '13px',
                              backgroundColor: effAccentColor,
                              opacity: 0.85,
                              zIndex: 15,
                              pointerEvents: 'none',
                            }}
                          />
                        )}

                        <div
                          className="w-full h-full flex-1 relative bg-slate-100"
                          style={innerStyle}
                          onMouseDown={(e) => {
                            if (!slotState.imageUrl || tapSwapMode || e.button !== 0 || selectedSlotIdx !== idx) {
                              return;
                            }
                            setIsDraggingCrop(true);
                            const startX = e.clientX;
                            const startY = e.clientY;
                            const initCropX = slotState.cropX;
                            const initCropY = slotState.cropY;
                            const onMove = (me: MouseEvent) => {
                              const dx = Math.round(((me.clientX - startX) / Math.max(40, slot.width)) * 100);
                              const dy = Math.round(((me.clientY - startY) / Math.max(40, slot.height)) * 100);
                              setMeta((prev) => {
                                const nextSlots = [...prev.slots];
                                nextSlots[idx] = {
                                  ...(nextSlots[idx] || createEmptySlot()),
                                  cropX: Math.max(-50, Math.min(50, initCropX + dx)),
                                  cropY: Math.max(-50, Math.min(50, initCropY + dy)),
                                };
                                return { ...prev, slots: nextSlots };
                              });
                            };
                            const onUp = () => {
                              setIsDraggingCrop(false);
                              window.removeEventListener('mousemove', onMove);
                              window.removeEventListener('mouseup', onUp);
                            };
                            window.addEventListener('mousemove', onMove);
                            window.addEventListener('mouseup', onUp);
                          }}
                        >
                          {slotState.imageUrl ? (
                            <>
                              <img
                                src={slotState.imageUrl}
                                alt={`Slot ${idx + 1}`}
                                draggable={false}
                                className="w-full h-full object-cover pointer-events-none"
                                style={{
                                  objectPosition: `${50 + slotState.cropX}% ${50 + slotState.cropY}%`,
                                  transform: [
                                    slotState.zoom !== 1 ? `scale(${slotState.zoom})` : '',
                                    slotState.imageRotation ? `rotate(${slotState.imageRotation}deg)` : '',
                                    slotState.flipH ? 'scaleX(-1)' : '',
                                  ]
                                    .filter(Boolean)
                                    .join(' ') || undefined,
                                  filter: getEffectCssFilter(effEffect),
                                }}
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  commitMeta((prev) => {
                                    const next = [...prev.slots];
                                    next[idx] = createEmptySlot();
                                    return { ...prev, slots: next };
                                  });
                                }}
                                className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition"
                                title="Clear Slot"
                              >
                                <Trash2 size={10} />
                              </button>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 text-slate-400 group-hover:text-indigo-600">
                              <Upload size={14} />
                              <span className="text-[9.5px] font-bold">Slot {idx + 1}</span>
                            </div>
                          )}
                        </div>

                        {artDef.supportsCaption && slotState.caption && (
                          <div className="text-[9.5px] font-semibold text-slate-600 text-center truncate pt-1 font-serif pointer-events-none">
                            {slotState.caption}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 gap-2">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={groupSlots}
                  onChange={(e) => setGroupSlots(e.target.checked)}
                  className="accent-indigo-600 rounded"
                />
                <span>Group collage slots together</span>
              </label>

              <button
                type="button"
                onClick={handleSaveCollage}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <ImagePlus size={14} />
                <span>{isEditMode ? 'Update Collage' : 'Insert Collage'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Global vs Selected Slot Inspector + Backdrop (3 cols) */}
          <div className="lg:col-span-3 p-4 space-y-3 overflow-y-auto max-h-[75vh] text-xs">
            {/* Scope Toggle */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setInspectorScope('all')}
                className={`py-1 rounded-lg text-[10.5px] font-bold transition ${
                  inspectorScope === 'all'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Apply to All
              </button>
              <button
                type="button"
                onClick={() => setInspectorScope('slot')}
                className={`py-1 rounded-lg text-[10.5px] font-bold transition ${
                  inspectorScope === 'slot'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Slot #{selectedSlotIdx + 1}
              </button>
            </div>

            {/* BorderArt Frame Selector */}
            <div className="space-y-1.5">
              <label className="block text-[10.5px] font-bold text-slate-500">
                BorderArt Frame
              </label>
              <select
                value={activeStyleForInspector.borderArt}
                onChange={(e) => {
                  const id = e.target.value as BorderArtId;
                  const def = COLLAGE_BORDER_ART_OPTIONS.find((b) => b.id === id);
                  updateInspectorStyle({
                    borderArt: id,
                    frameColor: def?.defaultFrameColor || activeStyleForInspector.frameColor,
                    accentColor: def?.defaultAccentColor || activeStyleForInspector.accentColor,
                    frameThickness: def?.defaultThickness ?? 4,
                  });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] font-semibold outline-none cursor-pointer"
              >
                {COLLAGE_BORDER_ART_OPTIONS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-1.5">
                <label className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="color"
                    value={activeStyleForInspector.frameColor}
                    onChange={(e) => updateInspectorStyle({ frameColor: e.target.value })}
                    className="w-4 h-4 rounded border-0 p-0 cursor-pointer"
                  />
                  <span className="text-[10px] font-semibold text-slate-600">Frame</span>
                </label>
                <label className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="color"
                    value={activeStyleForInspector.accentColor}
                    onChange={(e) => updateInspectorStyle({ accentColor: e.target.value })}
                    className="w-4 h-4 rounded border-0 p-0 cursor-pointer"
                  />
                  <span className="text-[10px] font-semibold text-slate-600">Accent</span>
                </label>
              </div>
            </div>

            {/* Style Effects */}
            <div className="space-y-1">
              <label className="block text-[10.5px] font-bold text-slate-500">Style Effect</label>
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: 'none', label: 'None' },
                    { id: 'sticker', label: 'Sticker' },
                    { id: 'clay', label: 'Clay' },
                    { id: 'cartoon', label: 'Cartoon' },
                    { id: 'retro-film', label: 'Retro' },
                    { id: 'duotone-pop', label: 'Pop' },
                  ] as const
                ).map((ef) => (
                  <button
                    key={ef.id}
                    type="button"
                    onClick={() => updateInspectorStyle({ effect: ef.id as StyleEffectId })}
                    className={`py-1 rounded-lg text-[10px] font-bold border transition ${
                      activeStyleForInspector.effect === ef.id
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {ef.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slot Mask Shape */}
            <div className="space-y-1">
              <label className="block text-[10.5px] font-bold text-slate-500">Slot Shape Mask</label>
              <div className="grid grid-cols-3 gap-1">
                {(['rounded', 'circle', 'hexagon', 'diamond', 'heart', 'star'] as SlotMaskShape[]).map(
                  (mask) => (
                    <button
                      key={mask}
                      type="button"
                      onClick={() => updateInspectorStyle({ mask })}
                      className={`py-1 rounded-lg text-[10px] font-semibold capitalize border transition ${
                        activeStyleForInspector.mask === mask
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-400'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mask}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Global Grid & Tilt Sliders */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div>
                <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                  <span>Gap</span>
                  <span className="font-mono">{meta.globalStyle.gap}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={28}
                  value={meta.globalStyle.gap}
                  onChange={(e) =>
                    commitMeta((prev) => ({
                      ...prev,
                      globalStyle: { ...prev.globalStyle, gap: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                  <span>Corner Radius</span>
                  <span className="font-mono">{meta.globalStyle.cornerRadius}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={32}
                  value={meta.globalStyle.cornerRadius}
                  onChange={(e) =>
                    commitMeta((prev) => ({
                      ...prev,
                      globalStyle: { ...prev.globalStyle, cornerRadius: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <label className="flex items-center justify-between text-[10.5px] font-semibold text-slate-700 cursor-pointer">
                <span>Playful Scatter Tilt</span>
                <input
                  type="checkbox"
                  checked={meta.globalStyle.scatterTilt}
                  onChange={(e) =>
                    commitMeta((prev) => ({
                      ...prev,
                      globalStyle: { ...prev.globalStyle, scatterTilt: e.target.checked },
                    }))
                  }
                  className="accent-indigo-600 rounded"
                />
              </label>
            </div>

            {/* Selected Slot Crop & Caption Controls */}
            <div className="space-y-2 pt-2 border-t border-slate-100 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold text-slate-700">
                  Slot #{selectedSlotIdx + 1} Crop &amp; Actions
                </span>
                <button
                  type="button"
                  onClick={() => {
                    activeUploadSlotRef.current = selectedSlotIdx;
                    singleFileRef.current?.click();
                  }}
                  className="text-[10px] font-bold text-indigo-700 hover:underline"
                >
                  Replace
                </button>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>In-Slot Zoom</span>
                  <span className="font-mono">{Math.round(selectedSlot.zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={250}
                  value={Math.round(selectedSlot.zoom * 100)}
                  onChange={(e) =>
                    commitMeta((prev) => {
                      const nextSlots = [...prev.slots];
                      nextSlots[selectedSlotIdx] = {
                        ...(nextSlots[selectedSlotIdx] || createEmptySlot()),
                        zoom: Number(e.target.value) / 100,
                      };
                      return { ...prev, slots: nextSlots };
                    })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() =>
                    commitMeta((prev) => {
                      const nextSlots = [...prev.slots];
                      const cur = nextSlots[selectedSlotIdx] || createEmptySlot();
                      nextSlots[selectedSlotIdx] = {
                        ...cur,
                        imageRotation: (((cur.imageRotation + 90) % 360) as 0 | 90 | 180 | 270),
                      };
                      return { ...prev, slots: nextSlots };
                    })
                  }
                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-semibold flex items-center gap-1"
                >
                  <RotateCw size={10} /> 90°
                </button>
                <button
                  type="button"
                  onClick={() =>
                    commitMeta((prev) => {
                      const nextSlots = [...prev.slots];
                      const cur = nextSlots[selectedSlotIdx] || createEmptySlot();
                      nextSlots[selectedSlotIdx] = { ...cur, flipH: !cur.flipH };
                      return { ...prev, slots: nextSlots };
                    })
                  }
                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-semibold flex items-center gap-1"
                >
                  <FlipHorizontal2 size={10} /> Flip
                </button>
                <button
                  type="button"
                  onClick={() =>
                    commitMeta((prev) => {
                      const nextSlots = [...prev.slots];
                      const cur = nextSlots[selectedSlotIdx] || createEmptySlot();
                      nextSlots[selectedSlotIdx] = { ...cur, zIndexOverride: 15 };
                      return { ...prev, slots: nextSlots };
                    })
                  }
                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-semibold flex items-center gap-1"
                >
                  <ArrowUpToLine size={10} /> Front
                </button>
                {selectedSlot.styleOverride && (
                  <button
                    type="button"
                    onClick={() =>
                      commitMeta((prev) => {
                        const nextSlots = [...prev.slots];
                        const cur = nextSlots[selectedSlotIdx] || createEmptySlot();
                        nextSlots[selectedSlotIdx] = {
                          ...cur,
                          styleOverride: undefined,
                          zIndexOverride: undefined,
                        };
                        return { ...prev, slots: nextSlots };
                      })
                    }
                    className="px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-semibold"
                  >
                    Reset Style
                  </button>
                )}
              </div>

              {activeBorderDef.supportsCaption && (
                <input
                  type="text"
                  value={selectedSlot.caption || ''}
                  onChange={(e) =>
                    commitMeta((prev) => {
                      const nextSlots = [...prev.slots];
                      nextSlots[selectedSlotIdx] = {
                        ...(nextSlots[selectedSlotIdx] || createEmptySlot()),
                        caption: e.target.value,
                      };
                      return { ...prev, slots: nextSlots };
                    })
                  }
                  placeholder="Polaroid caption..."
                  className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-[10.5px] outline-none focus:border-indigo-500"
                />
              )}
            </div>

            {/* Collage Backdrop Matte */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="block text-[10.5px] font-bold text-slate-500">
                Backdrop Matte Card
              </label>
              <div className="flex gap-1.5">
                <select
                  value={meta.backdrop.type}
                  onChange={(e) =>
                    commitMeta((prev) => ({
                      ...prev,
                      backdrop: {
                        ...prev.backdrop,
                        type: e.target.value as CollageBackdropType,
                      },
                    }))
                  }
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-[10.5px] font-semibold outline-none"
                >
                  <option value="none">None</option>
                  <option value="solid">Solid Color</option>
                  <option value="pastel-gradient">Pastel Gradient</option>
                  <option value="kraft-paper">Kraft Paper</option>
                  <option value="dot-grid">Dot Grid</option>
                </select>
                {meta.backdrop.type !== 'none' && (
                  <input
                    type="color"
                    value={meta.backdrop.color}
                    onChange={(e) =>
                      commitMeta((prev) => ({
                        ...prev,
                        backdrop: { ...prev.backdrop, color: e.target.value },
                      }))
                    }
                    className="w-7 h-7 rounded-lg border border-slate-200 p-0 cursor-pointer"
                  />
                )}
              </div>
              {meta.backdrop.type !== 'none' && (
                <div>
                  <div className="flex justify-between text-[9.5px] text-slate-500">
                    <span>Matte Padding</span>
                    <span className="font-mono">{meta.backdrop.padding}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={meta.backdrop.padding}
                    onChange={(e) =>
                      commitMeta((prev) => ({
                        ...prev,
                        backdrop: { ...prev.backdrop, padding: Number(e.target.value) },
                      }))
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
