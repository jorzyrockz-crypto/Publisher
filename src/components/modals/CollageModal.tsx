import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import {
  COLLAGE_LAYOUTS,
  DYNAMIC_MODE_LABELS,
  computeCollageSlots,
  generateDynamicLayout,
  resolveCollageLayout,
  suggestBestLayout,
} from '../../utils/collageLayouts';
import {
  COLLAGE_BORDER_ART_OPTIONS,
  COLLAGE_VIBE_PACKS,
  BorderArtId,
  CollageBackdropConfig,
  CollageBackdropType,
  CollageMeta,
  CollagePlacedSticker,
  CollageSlotState,
  CollageStyleConfig,
  DynamicLayoutMode,
  SlotMaskShape,
  StyleEffectId,
  getBackdropPreviewStyle,
  getEffectCssFilter,
  getMaskClipPath,
  toPublisherBorderArt,
  toPublisherEffect,
  toPublisherMask,
} from '../../utils/borderArtStyles';
import { GRADIENT_SWATCHES, buildLinearGradientCss } from '../../constants/gradientSwatches';
import { STICKER_CATALOG, getStickerById } from '../../constants/stickerLibrary';
import {
  BackgroundPatternType,
  ImageElement,
  PublisherElement,
  ShapeElement,
} from '../../types/publisher';
import { PATTERN_CATALOG } from '../../utils/patternGenerator';
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
  Plus,
  ZoomIn,
  ZoomOut,
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
  slotScale: 1,
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
  paperW: number,
  paperH: number,
  maxBox: number
): { width: number; height: number } {
  let ratio = 1;
  if (aspect === '4:3') ratio = 4 / 3;
  else if (aspect === '3:4') ratio = 3 / 4;
  else if (aspect === '16:9') ratio = 16 / 9;
  else if (aspect === '9:16') ratio = 9 / 16;
  else if (aspect === 'page-margin') ratio = availW / Math.max(1, availH);
  else if (aspect === 'full-paper') ratio = paperW / Math.max(1, paperH);

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
    project,
    activePage,
    addElementsBatch,
    replaceCollageGroup,
    applyPageBackdrop,
  } = usePublisher();

  const resolvedInitialMeta = initialMeta || editingCollageState?.meta;
  const isEditMode = Boolean(resolvedInitialMeta);

  const [meta, setMeta] = useState<CollageMeta>(() =>
    resolvedInitialMeta ? JSON.parse(JSON.stringify(resolvedInitialMeta)) : createDefaultMeta()
  );
  const [past, setPast] = useState<CollageMeta[]>([]);
  const [future, setFuture] = useState<CollageMeta[]>([]);
  const [leftPanelTab, setLeftPanelTab] = useState<'vibe' | 'layouts'>('vibe');
  const [layoutFilter, setLayoutFilter] = useState<'all' | '2-3' | '4-5' | '6+' | 'scrapbook'>('all');
  const [inspectorScope, setInspectorScope] = useState<'all' | 'slot'>('all');
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number>(0);
  const [tapSwapMode, setTapSwapMode] = useState<boolean>(false);
  const [swapSourceIdx, setSwapSourceIdx] = useState<number | null>(null);
  const [dragSwapIdx, setDragSwapIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [groupSlots, setGroupSlots] = useState<boolean>(true);
  const [includeVibeStickers, setIncludeVibeStickers] = useState<boolean>(true);
  const [autoAdaptLayout, setAutoAdaptLayout] = useState<boolean>(() => !resolvedInitialMeta);
  const [previewZoom, setPreviewZoom] = useState<number>(1);
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
    setAutoAdaptLayout(!seed);
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

  const filledPhotosCount = useMemo(
    () => meta.slots.filter((s) => Boolean(s.imageUrl)).length,
    [meta.slots]
  );

  const slotPhotoDims = useMemo(
    () => meta.slots.map((s) => ({ width: s.naturalWidth, height: s.naturalHeight })),
    [meta.slots]
  );

  const availW = Math.max(220, activePage.width - activePage.margins.left - activePage.margins.right);
  const availH = Math.max(220, activePage.height - activePage.margins.top - activePage.margins.bottom);

  const previewStageBox = getAspectDimensions(
    meta.aspectRatio,
    availW,
    availH,
    activePage.width,
    activePage.height,
    Math.round(450 * previewZoom)
  );
  const containerAspect = previewStageBox.width / Math.max(1, previewStageBox.height);

  const activeLayout = useMemo(
    () => resolveCollageLayout(meta, slotPhotoDims, containerAspect),
    [meta, slotPhotoDims, containerAspect]
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

  const pad = meta.backdrop.type === 'none' ? 0 : Math.round(meta.backdrop.padding * previewZoom);
  const innerPreviewW = Math.max(80, previewStageBox.width - pad * 2);
  const innerPreviewH = Math.max(80, previewStageBox.height - pad * 2);

  const rawComputedSlots = computeCollageSlots(
    activeLayout,
    innerPreviewW,
    innerPreviewH,
    Math.round(meta.globalStyle.gap * previewZoom),
    meta.globalStyle.scatterTilt,
    meta.globalStyle.slotScale ?? 1,
    meta.sizeSeed ?? 0
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

  const buildAdaptedLayoutPatch = (
    prev: CollageMeta,
    nextSlots: CollageSlotState[],
    forceDynamicMode?: DynamicLayoutMode
  ): Partial<CollageMeta> => {
    const filledDims = nextSlots
      .filter((s) => Boolean(s.imageUrl))
      .map((s) => ({
        width: s.naturalWidth || 800,
        height: s.naturalHeight || 800,
      }));
    const count = Math.max(1, Math.min(24, filledDims.length));
    const useDynamic =
      Boolean(forceDynamicMode) ||
      Boolean(prev.customLayout) ||
      count === 1 ||
      count === 7 ||
      count > 9;

    if (useDynamic) {
      const mode = forceDynamicMode || prev.customLayout?.mode || 'smart-grid';
      const customLayout = {
        mode,
        slotCount: count,
        columns: mode === 'smart-grid' ? prev.customLayout?.columns : undefined,
      };
      const dyn = generateDynamicLayout(customLayout, filledDims);
      return { layoutId: dyn.id, customLayout };
    }

    const bestId = suggestBestLayout(filledDims);
    if (bestId.startsWith('dynamic-')) {
      const customLayout = { mode: 'smart-grid' as DynamicLayoutMode, slotCount: count };
      const dyn = generateDynamicLayout(customLayout, filledDims);
      return { layoutId: dyn.id, customLayout };
    }
    return { layoutId: bestId, customLayout: undefined };
  };

  const ingestMultiFiles = async (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith('image/'));
    if (imgs.length === 0) return;
    const optimized = (await Promise.all(imgs.map(optimizeImageFile))).filter((r) => Boolean(r.url));
    if (optimized.length === 0) return;

    commitMeta((prev) => {
      const nextSlots = [...prev.slots];
      const maxSlots = 24;
      let cursor = 0;

      // 1. Fill existing empty slots first
      for (let i = 0; i < nextSlots.length && cursor < optimized.length; i++) {
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

      // 2. Append remaining imported photos up to maxSlots instead of dropping them
      while (cursor < optimized.length && nextSlots.length < maxSlots) {
        nextSlots.push({
          ...createEmptySlot(),
          imageUrl: optimized[cursor].url,
          naturalWidth: optimized[cursor].width,
          naturalHeight: optimized[cursor].height,
        });
        cursor++;
      }

      // 3. If all slots were already full and we didn't place anything, overwrite from index 0
      if (cursor === 0) {
        optimized.slice(0, maxSlots).forEach((item, idx) => {
          nextSlots[idx] = {
            ...(nextSlots[idx] || createEmptySlot()),
            imageUrl: item.url,
            naturalWidth: item.width,
            naturalHeight: item.height,
            cropX: 0,
            cropY: 0,
            zoom: 1,
          };
        });
      }

      while (nextSlots.length < 9) {
        nextSlots.push(createEmptySlot());
      }

      const filledTotal = nextSlots.filter((s) => Boolean(s.imageUrl)).length;
      const shouldAdapt = autoAdaptLayout || filledTotal > activeLayout.slotCount;
      const layoutPatch = shouldAdapt ? buildAdaptedLayoutPatch(prev, nextSlots) : {};

      return { ...prev, ...layoutPatch, slots: nextSlots };
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
    commitMeta((prev) => ({
      ...prev,
      ...buildAdaptedLayoutPatch(prev, prev.slots),
    }));
  };

  const applyDynamicMode = (mode: DynamicLayoutMode, forcedColumns?: number) => {
    commitMeta((prev) => {
      const targetCount = Math.max(
        1,
        Math.min(24, filledPhotosCount > 0 ? filledPhotosCount : activeLayout.slotCount)
      );
      const customLayout = {
        mode,
        slotCount: targetCount,
        columns: mode === 'smart-grid' ? forcedColumns : undefined,
      };
      const dyn = generateDynamicLayout(customLayout, slotPhotoDims);
      return {
        ...prev,
        layoutId: dyn.id,
        customLayout,
      };
    });
  };

  const handleAddSlot = () => {
    commitMeta((prev) => {
      const curCount = activeLayout.slotCount;
      if (curCount >= 24) return prev;
      const nextCount = curCount + 1;
      const nextSlots = [...prev.slots];
      while (nextSlots.length < nextCount) {
        nextSlots.push(createEmptySlot());
      }
      const mode: DynamicLayoutMode = prev.customLayout?.mode || 'smart-grid';
      const customLayout = {
        mode,
        slotCount: nextCount,
        columns: mode === 'smart-grid' ? prev.customLayout?.columns : undefined,
      };
      const dyn = generateDynamicLayout(customLayout, slotPhotoDims);
      setSelectedSlotIdx(nextCount - 1);
      return {
        ...prev,
        layoutId: dyn.id,
        customLayout,
        slots: nextSlots,
      };
    });
  };

  const handleRemoveSlot = (idx: number) => {
    if (activeLayout.slotCount <= 1) return;
    commitMeta((prev) => {
      const nextCount = Math.max(1, activeLayout.slotCount - 1);
      const nextSlots = prev.slots.filter((_, i) => i !== idx);
      while (nextSlots.length < 9) {
        nextSlots.push(createEmptySlot());
      }
      const mode: DynamicLayoutMode = prev.customLayout?.mode || 'smart-grid';
      const customLayout = {
        mode,
        slotCount: nextCount,
        columns: mode === 'smart-grid' ? prev.customLayout?.columns : undefined,
      };
      const dyn = generateDynamicLayout(customLayout, nextSlots.map((s) => ({ width: s.naturalWidth, height: s.naturalHeight })));
      setSelectedSlotIdx((cur) => Math.max(0, Math.min(cur, nextCount - 1)));
      return {
        ...prev,
        layoutId: dyn.id,
        customLayout,
        slots: nextSlots,
      };
    });
  };

  const handleDeleteSlotPhoto = (idx: number) => {
    commitMeta((prev) => {
      const shouldReflow =
        (autoAdaptLayout || Boolean(prev.customLayout)) && activeLayout.slotCount > 1;
      if (shouldReflow) {
        const nextSlots = prev.slots.filter((_, i) => i !== idx);
        while (nextSlots.length < 9) {
          nextSlots.push(createEmptySlot());
        }
        const remainingCount = Math.max(1, activeLayout.slotCount - 1);
        const dims = nextSlots
          .slice(0, remainingCount)
          .map((s) => ({ width: s.naturalWidth || 800, height: s.naturalHeight || 800 }));
        const mode: DynamicLayoutMode = prev.customLayout?.mode || 'smart-grid';
        const layoutPatch =
          prev.customLayout || remainingCount === 1 || remainingCount === 7 || remainingCount > 9
            ? (() => {
                const customLayout = {
                  mode,
                  slotCount: remainingCount,
                  columns: mode === 'smart-grid' ? prev.customLayout?.columns : undefined,
                };
                const dyn = generateDynamicLayout(customLayout, dims);
                return { layoutId: dyn.id, customLayout };
              })()
            : { layoutId: suggestBestLayout(dims), customLayout: undefined };

        setSelectedSlotIdx((cur) => Math.max(0, Math.min(cur, remainingCount - 1)));
        return { ...prev, ...layoutPatch, slots: nextSlots };
      }

      const next = [...prev.slots];
      next[idx] = createEmptySlot();
      return { ...prev, slots: next };
    });
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

  const buildStickersFromIds = (ids: string[] = []): CollagePlacedSticker[] => {
    const anchors = [
      { x: 0.03, y: 0.03, rotation: -10 },
      { x: 0.85, y: 0.84, rotation: 8 },
      { x: 0.84, y: 0.04, rotation: 12 },
      { x: 0.04, y: 0.84, rotation: -8 },
    ];
    return ids.slice(0, 4).map((stickerId, i) => ({
      id: `col-stk-${Date.now()}-${i}`,
      stickerId,
      x: anchors[i % anchors.length].x,
      y: anchors[i % anchors.length].y,
      size: 56,
      rotation: anchors[i % anchors.length].rotation,
    }));
  };

  const handleApplyVibePack = (packId: string) => {
    const pack = COLLAGE_VIBE_PACKS.find((p) => p.id === packId);
    if (!pack) return;
    commitMeta((prev) => ({
      ...prev,
      vibePackId: pack.id,
      globalStyle: { ...prev.globalStyle, ...pack.style },
      backdrop: { ...pack.backdrop },
      stickers:
        includeVibeStickers && pack.stickerIds?.length
          ? buildStickersFromIds(pack.stickerIds)
          : [],
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
            ...(patch.frameThickness !== undefined ? { frameThickness: patch.frameThickness } : {}),
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
    const canvasDims =
      meta.aspectRatio === 'page-margin'
        ? { width: availW, height: availH }
        : meta.aspectRatio === 'full-paper'
        ? { width: activePage.width, height: activePage.height }
        : getAspectDimensions(
            meta.aspectRatio,
            availW,
            availH,
            activePage.width,
            activePage.height,
            Math.min(availW, availH, 680)
          );
    const originX = editingCollageState
      ? editingCollageState.originX
      : meta.aspectRatio === 'full-paper'
      ? 0
      : meta.aspectRatio === 'page-margin'
      ? activePage.margins.left
      : Math.round((activePage.width - canvasDims.width) / 2);
    const originY = editingCollageState
      ? editingCollageState.originY
      : meta.aspectRatio === 'full-paper'
      ? 0
      : meta.aspectRatio === 'page-margin'
      ? activePage.margins.top
      : Math.round((activePage.height - canvasDims.height) / 2);

    const saveAspect = canvasDims.width / Math.max(1, canvasDims.height);
    const saveLayout = resolveCollageLayout(meta, slotPhotoDims, saveAspect);

    const canvasPad = meta.backdrop.type === 'none' ? 0 : Math.round(meta.backdrop.padding * 1.4);
    const slotCanvasW = Math.max(120, canvasDims.width - canvasPad * 2);
    const slotCanvasH = Math.max(120, canvasDims.height - canvasPad * 2);
    const canvasSlots = computeCollageSlots(
      saveLayout,
      slotCanvasW,
      slotCanvasH,
      Math.round(meta.globalStyle.gap * 1.3),
      meta.globalStyle.scatterTilt,
      meta.globalStyle.slotScale ?? 1,
      meta.sizeSeed ?? 0
    );

    const groupId = groupSlots
      ? editingCollageState?.groupId || `grp-collage-${Date.now()}`
      : undefined;
    const serializedMeta: CollageMeta = JSON.parse(JSON.stringify(meta));
    const elementsToInsert: PublisherElement[] = [];

    // Cover Document Page Background if requested
    if (meta.coverDocumentBackground && meta.backdrop.type !== 'none') {
      const overlayPat =
        meta.backdrop.patternType && meta.backdrop.patternType !== 'none'
          ? {
              type: meta.backdrop.patternType,
              color: meta.backdrop.patternColor || '#4f46e5',
              opacity: meta.backdrop.patternOpacity ?? 0.25,
              scale: 22,
              strokeWidth: 1.5,
              rotation: 0,
            }
          : undefined;

      if (meta.backdrop.type === 'pastel-gradient') {
        applyPageBackdrop({
          backgroundColor: meta.backdrop.color || '#fdf2f8',
          backgroundGradient: {
            color1: meta.backdrop.color || '#fdf2f8',
            color2: meta.backdrop.gradientColor2 || '#e0f2fe',
            angle: meta.backdrop.gradientAngle ?? 135,
          },
          backgroundPattern: overlayPat,
        });
      } else if (meta.backdrop.type === 'dot-grid') {
        applyPageBackdrop({
          backgroundColor: meta.backdrop.color || '#f8fafc',
          backgroundGradient: undefined,
          backgroundPattern: overlayPat || {
            type: 'dots',
            color: '#64748b',
            opacity: 0.25,
            scale: 22,
            strokeWidth: 1.5,
            rotation: 0,
          },
        });
      } else if (meta.backdrop.type === 'kraft-paper') {
        applyPageBackdrop({
          backgroundColor: meta.backdrop.color || '#e6ccb2',
          backgroundGradient: undefined,
          backgroundPattern: overlayPat || {
            type: 'terrazzo',
            color: '#785028',
            opacity: 0.14,
            scale: 26,
            strokeWidth: 1.5,
            rotation: 0,
          },
        });
      } else {
        applyPageBackdrop({
          backgroundColor: meta.backdrop.color || '#f1f5f9',
          backgroundGradient: undefined,
          backgroundPattern: overlayPat,
        });
      }
    }

    // Optional Backdrop Card element behind slots
    if (meta.backdrop.type !== 'none' && !meta.coverDocumentBackground) {
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
        gradientColor2:
          meta.backdrop.type === 'pastel-gradient'
            ? meta.backdrop.gradientColor2 || '#e0f2fe'
            : undefined,
        gradientAngle: meta.backdrop.gradientAngle ?? 135,
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
      const effThickness = sState.styleOverride?.frameThickness ?? meta.globalStyle.frameThickness;
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
        borderArtWidth: effThickness,
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

    // Placed Collage / Vibe Stickers layered on top
    (meta.stickers || []).forEach((placed, idx) => {
      const def = getStickerById(placed.stickerId);
      if (!def) return;
      const stickerPx = Math.round((placed.size / 450) * Math.min(canvasDims.width, canvasDims.height));
      const stkEl: ImageElement = {
        id: `img-col-stk-${Date.now()}-${idx}`,
        type: 'image',
        name: `${def.name} Sticker`,
        groupId,
        collageMeta: groupSlots ? serializedMeta : undefined,
        src: def.dataUri,
        x: Math.round(originX + placed.x * canvasDims.width),
        y: Math.round(originY + placed.y * canvasDims.height),
        width: Math.max(32, stickerPx),
        height: Math.max(32, stickerPx),
        rotation: placed.rotation,
        zIndex: 40 + idx,
        objectFit: 'contain',
        aspectRatioLocked: true,
        effectPreset: 'sticker',
      };
      elementsToInsert.push(stkEl);
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
      className="fixed inset-0 z-50 bg-[#15232d]/35 backdrop-blur-[2px] backdrop-blur-[2px] flex items-center justify-center p-3 select-none"
      onClick={() => setIsCollageModalOpen(false)}
    >
      <div
        className="bg-white rounded-[15px] shadow-[0_20px_70px_rgba(21,35,45,0.22)] border border-[#e5e9ee] max-w-[96vw] w-[1360px] max-h-[95vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#e5e9ee] flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#087f83] text-white flex items-center justify-center shadow-sm">
              <LayoutGrid size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>Photo Collage Studio</span>
                {isEditMode && (
                  <span className="px-2 py-0.5 rounded-full bg-[#e5f4f3] text-[#087477] text-[10px] font-bold">
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
              className="p-1.5 rounded-xl border border-[#e5e9ee] bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 transition"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={15} />
            </button>
            <button
              type="button"
              disabled={future.length === 0}
              onClick={handleRedo}
              className="p-1.5 rounded-xl border border-[#e5e9ee] bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 transition"
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
          {/* Left Column: Vibe Packs / Preset Layouts Switch + Bottom-Pinned Custom/Auto Card (3 cols) */}
          <div className="lg:col-span-3 p-3.5 flex flex-col gap-3 max-h-[82vh]">
            {/* Segmented Switch: Vibe Packs vs Preset Layouts */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-[#e5e9ee] flex-shrink-0">
              <button
                type="button"
                onClick={() => setLeftPanelTab('vibe')}
                className={`py-1.5 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                  leftPanelTab === 'vibe'
                    ? 'bg-white text-[#087477] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles size={11} />
                <span>Vibe Packs ({COLLAGE_VIBE_PACKS.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setLeftPanelTab('layouts')}
                className={`py-1.5 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                  leftPanelTab === 'layouts'
                    ? 'bg-white text-[#087477] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid size={11} />
                <span>Presets ({COLLAGE_LAYOUTS.length})</span>
              </button>
            </div>

            {/* Active Tab Scrollable Area */}
            <div className="flex-1 overflow-y-auto pr-1 min-h-0">
              {leftPanelTab === 'vibe' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      1-Click Occasions
                    </span>
                    <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeVibeStickers}
                        onChange={(e) => setIncludeVibeStickers(e.target.checked)}
                        className="accent-[#087f83] rounded"
                      />
                      <span>+ Stickers</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {COLLAGE_VIBE_PACKS.map((pack) => {
                      const isActive = meta.vibePackId === pack.id;
                      const bgStyle = getBackdropPreviewStyle(pack.backdrop);
                      const frameCol = pack.style.frameColor || '#ffffff';
                      const accentCol = pack.style.accentColor || '#cbd5e1';
                      return (
                        <button
                          key={pack.id}
                          type="button"
                          onClick={() => handleApplyVibePack(pack.id)}
                          title={pack.description}
                          className={`p-1.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1.5 ${
                            isActive
                              ? 'border-indigo-600 bg-[#e5f4f3] ring-1 ring-[#087f83]/30 shadow-xs'
                              : 'border-[#e5e9ee] bg-white hover:border-[#b7dddd] hover:bg-slate-50'
                          }`}
                        >
                          {/* Mini 3-tile preview card */}
                          <div
                            className="w-full h-11 rounded-lg p-1.5 flex items-center justify-center gap-1 overflow-hidden border border-[#e5e9ee]/70"
                            style={bgStyle}
                          >
                            <div
                              className="w-6 h-7 rounded-[3px] flex-shrink-0"
                              style={{
                                backgroundColor: frameCol,
                                border: `2px solid ${accentCol}`,
                                transform: pack.style.scatterTilt ? 'rotate(-5deg)' : undefined,
                              }}
                            />
                            <div
                              className="w-7 h-8 rounded-[3px] flex-shrink-0 shadow-2xs"
                              style={{
                                backgroundColor: frameCol,
                                border: `2px solid ${accentCol}`,
                              }}
                            />
                            <div
                              className="w-6 h-7 rounded-[3px] flex-shrink-0"
                              style={{
                                backgroundColor: frameCol,
                                border: `2px solid ${accentCol}`,
                                transform: pack.style.scatterTilt ? 'rotate(5deg)' : undefined,
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-slate-800 truncate flex items-center gap-1">
                              {pack.badgeEmoji && <span>{pack.badgeEmoji}</span>}
                              <span className="truncate">{pack.label}</span>
                            </div>
                            <div className="text-[9px] text-slate-500 truncate">
                              {pack.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700">
                      Preset Layouts ({filteredLayouts.length})
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoMatchLayout}
                      className="px-2 py-0.5 rounded-lg bg-[#e5f4f3] hover:bg-[#e5f4f3] text-[#087477] text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
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

                  <div className="grid grid-cols-2 gap-1.5">
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
                          onClick={() =>
                            commitMeta((prev) => ({
                              ...prev,
                              layoutId: layout.id,
                              customLayout: undefined,
                            }))
                          }
                          className={`p-1.5 rounded-xl border flex items-center gap-2 text-left transition cursor-pointer ${
                            isActive
                              ? 'border-indigo-600 bg-[#e5f4f3]/75 ring-1 ring-[#087f83]/30'
                              : 'border-[#e5e9ee] bg-white hover:border-[#b7dddd] hover:bg-slate-50'
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
                                  isActive ? 'bg-[#087f83]/85' : 'bg-slate-400/75'
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
              )}
            </div>

            {/* Bottom-Pinned Dynamic Custom / Auto Layout Card */}
            <div className="p-2.5 rounded-2xl bg-[#e5f4f3] border border-[#b7dddd]/80 space-y-2 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                    <span>Custom / Auto Layout</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-[#087f83] text-white text-[9.5px] font-bold">
                      {filledPhotosCount > 0 ? `${filledPhotosCount} photos` : `${activeLayout.slotCount} slots`}
                    </span>
                  </div>
                  <p className="text-[9.5px] text-[#087477]/80">
                    Size-aware for 1–24 photos &amp; paper ratio
                  </p>
                </div>
                <label
                  className="flex items-center gap-1 text-[10px] font-bold text-[#087477] cursor-pointer"
                  title="Automatically adjust layout when importing, deleting, or resizing"
                >
                  <input
                    type="checkbox"
                    checked={autoAdaptLayout}
                    onChange={(e) => setAutoAdaptLayout(e.target.checked)}
                    className="accent-[#087f83] rounded"
                  />
                  <span>Auto</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-1">
                {(Object.keys(DYNAMIC_MODE_LABELS) as DynamicLayoutMode[]).map((mode) => {
                  const isDynamicActive = meta.customLayout?.mode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => applyDynamicMode(mode, meta.customLayout?.columns)}
                      className={`px-2 py-1 rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                        isDynamicActive
                          ? 'bg-[#087f83] text-white border-indigo-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-[#b7dddd]/70 hover:bg-[#e5f4f3]/60'
                      }`}
                    >
                      {DYNAMIC_MODE_LABELS[mode]}
                    </button>
                  );
                })}
              </div>

              {(!meta.customLayout || meta.customLayout.mode === 'smart-grid') && (
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  <span className="text-[10px] font-semibold text-[#087477]">Columns:</span>
                  <div className="flex items-center gap-1">
                    {([undefined, 1, 2, 3, 4, 5, 6] as Array<number | undefined>).map((col) => {
                      const isColActive =
                        meta.customLayout?.mode === 'smart-grid' &&
                        meta.customLayout?.columns === col;
                      return (
                        <button
                          key={col ?? 'auto'}
                          type="button"
                          onClick={() => applyDynamicMode('smart-grid', col)}
                          className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-bold border transition cursor-pointer ${
                            isColActive
                              ? 'bg-[#087f83] text-white border-indigo-600'
                              : 'bg-white text-slate-600 border-[#e5e9ee] hover:border-[#b7dddd]'
                          }`}
                        >
                          {col ?? 'Auto'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Column: Interactive Stage & Top Quick Bar (6 cols) */}
          <div
            className="lg:col-span-6 p-4 bg-slate-50/90 flex flex-col justify-between gap-2.5 max-h-[82vh]"
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
                <div className="flex flex-wrap items-center gap-1">
                  {(
                    [
                      { id: '1:1', label: '1:1' },
                      { id: '4:3', label: '4:3' },
                      { id: '3:4', label: '3:4' },
                      { id: '16:9', label: '16:9' },
                      { id: '9:16', label: '9:16' },
                      { id: 'page-margin', label: 'Page Fit' },
                      { id: 'full-paper', label: 'Full Paper' },
                    ] as const
                  ).map((ar) => (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => commitMeta((prev) => ({ ...prev, aspectRatio: ar.id }))}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                        meta.aspectRatio === ar.id
                          ? 'bg-[#087f83] text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-[#e5e9ee] hover:bg-slate-100'
                      }`}
                    >
                      {ar.label}
                    </button>
                  ))}
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-200/70 text-[9.5px] font-semibold text-slate-600">
                    {project.pageSizeName} ({activePage.width}×{activePage.height})
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleAddSlot}
                    disabled={activeLayout.slotCount >= 24}
                    className="px-2 py-1 rounded-lg bg-white border border-[#e5e9ee] hover:bg-[#e5f4f3] hover:border-[#b7dddd] disabled:opacity-40 text-slate-700 text-[10.5px] font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Add another photo slot and reflow layout"
                  >
                    <Plus size={12} />
                    <span>Slot</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => multiFileRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-[#087f83] hover:bg-[#06696c] text-white text-[10.5px] font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                  >
                    <Upload size={12} />
                    <span>Add Photos</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleShufflePhotos}
                  className="px-2 py-1 rounded-lg bg-white border border-[#e5e9ee] hover:bg-slate-100 text-[10px] font-semibold text-slate-700 flex items-center gap-1 transition"
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
                  className="px-2 py-1 rounded-lg bg-white border border-[#e5e9ee] hover:bg-slate-100 text-[10px] font-semibold text-slate-700 flex items-center gap-1 transition cursor-pointer"
                >
                  <RefreshCw size={11} />
                  <span>Shuffle Tilts</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    commitMeta((prev) => ({
                      ...prev,
                      sizeSeed: ((prev.sizeSeed ?? 0) + 1) % 12,
                    }))
                  }
                  className="px-2 py-1 rounded-lg bg-white border border-[#e5e9ee] hover:bg-[#e5f4f3] hover:border-[#b7dddd] text-[10px] font-semibold text-slate-700 flex items-center gap-1 transition cursor-pointer"
                  title="Vary photo sizes across the layout"
                >
                  <Sparkles size={11} className="text-[#087477]" />
                  <span>Shuffle Sizes</span>
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
                      : 'bg-white border-[#e5e9ee] hover:bg-slate-100 text-slate-700'
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
                  className="ml-auto px-2 py-1 rounded-lg bg-white border border-[#e5e9ee] hover:bg-rose-50 hover:text-rose-700 text-[10px] font-semibold text-slate-500 transition"
                >
                  Clear All
                </button>
              </div>

              {/* Studio Preview Zoom Bar */}
              <div className="flex items-center justify-between gap-2 bg-white/80 border border-[#e5e9ee] rounded-xl px-2.5 py-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Preview Zoom
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
                    title="Zoom Out"
                  >
                    <ZoomOut size={12} />
                  </button>
                  {[0.75, 1, 1.25, 1.5].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setPreviewZoom(z)}
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition ${
                        Math.abs(previewZoom - z) < 0.05
                          ? 'bg-[#087f83] text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {Math.round(z * 100)}%
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
                    title="Zoom In"
                  >
                    <ZoomIn size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Live Collage Preview Stage (Scrollable when zoomed) */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-3 bg-slate-100/70 rounded-2xl border border-[#e5e9ee]/60 min-h-[340px]">
              <div
                className="relative rounded-2xl shadow-md border border-[#e5e9ee] transition-all"
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
                    const effThickness = slotState.styleOverride?.frameThickness ?? meta.globalStyle.frameThickness;
                    const effEffect = slotState.styleOverride?.effect ?? meta.globalStyle.effect;
                    const effMask = slotState.styleOverride?.mask ?? meta.globalStyle.mask;

                    const artDef =
                      COLLAGE_BORDER_ART_OPTIONS.find((b) => b.id === effBorderArt) ||
                      COLLAGE_BORDER_ART_OPTIONS[0];
                    const densityScale =
                      Math.min(1, Math.min(slot.width, slot.height) / (110 * previewZoom)) *
                      previewZoom;
                    const containerStyle = artDef.getContainerStyle({
                      frameColor: effFrameColor,
                      accentColor: effAccentColor,
                      thickness: effThickness,
                      cornerRadius: meta.globalStyle.cornerRadius,
                      densityScale,
                    });
                    const innerStyle = artDef.getInnerStyle?.({
                      frameColor: effFrameColor,
                      accentColor: effAccentColor,
                      thickness: effThickness,
                      cornerRadius: meta.globalStyle.cornerRadius,
                      densityScale,
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
                                  handleDeleteSlotPhoto(idx);
                                }}
                                className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition"
                                title="Delete Photo & Reflow Layout"
                              >
                                <Trash2 size={10} />
                              </button>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 text-slate-400 group-hover:text-[#087477]">
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

                {/* Placed Vibe / Collage Stickers Overlay */}
                {(meta.stickers || []).map((placed) => {
                  const def = getStickerById(placed.stickerId);
                  if (!def) return null;
                  const pxSize = Math.round(placed.size * previewZoom);
                  return (
                    <div
                      key={placed.id}
                      className="group/stk absolute select-none"
                      style={{
                        left: `${Math.round(placed.x * previewStageBox.width)}px`,
                        top: `${Math.round(placed.y * previewStageBox.height)}px`,
                        width: `${pxSize}px`,
                        height: `${pxSize}px`,
                        transform: `rotate(${placed.rotation}deg)`,
                        zIndex: 60,
                      }}
                    >
                      <img
                        src={def.dataUri}
                        alt={def.name}
                        draggable={false}
                        className="w-full h-full object-contain drop-shadow-md pointer-events-none"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          commitMeta((prev) => ({
                            ...prev,
                            stickers: (prev.stickers || []).filter((s) => s.id !== placed.id),
                          }));
                        }}
                        className="absolute -top-1 -right-1 p-0.5 rounded-full bg-slate-900/80 text-white opacity-0 group-hover/stk:opacity-100 hover:bg-rose-600 transition"
                        title="Remove sticker"
                      >
                        <X size={9} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#e5e9ee] gap-2">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={groupSlots}
                  onChange={(e) => setGroupSlots(e.target.checked)}
                  className="accent-[#087f83] rounded"
                />
                <span>Group collage slots together</span>
              </label>

              <button
                type="button"
                onClick={handleSaveCollage}
                className="py-2 px-4 rounded-xl bg-[#087f83] hover:bg-[#06696c] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <ImagePlus size={14} />
                <span>{isEditMode ? 'Update Collage' : 'Insert Collage'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Global vs Selected Slot Inspector + Backdrop (3 cols) */}
          <div className="lg:col-span-3 p-3.5 space-y-3 overflow-y-auto max-h-[82vh] text-xs">
            {/* Scope Toggle */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-[#e5e9ee]">
              <button
                type="button"
                onClick={() => setInspectorScope('all')}
                className={`py-1 rounded-lg text-[10.5px] font-bold transition ${
                  inspectorScope === 'all'
                    ? 'bg-white text-[#087477] shadow-xs'
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
                    ? 'bg-white text-[#087477] shadow-xs'
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
                className="w-full bg-slate-50 border border-[#e5e9ee] rounded-xl px-2 py-1.5 text-[11px] font-semibold outline-none cursor-pointer"
              >
                {COLLAGE_BORDER_ART_OPTIONS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-1.5">
                <label className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-xl border border-[#e5e9ee] cursor-pointer">
                  <input
                    type="color"
                    value={activeStyleForInspector.frameColor}
                    onChange={(e) => updateInspectorStyle({ frameColor: e.target.value })}
                    className="w-4 h-4 rounded border-0 p-0 cursor-pointer"
                  />
                  <span className="text-[10px] font-semibold text-slate-600">Frame</span>
                </label>
                <label className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-xl border border-[#e5e9ee] cursor-pointer">
                  <input
                    type="color"
                    value={activeStyleForInspector.accentColor}
                    onChange={(e) => updateInspectorStyle({ accentColor: e.target.value })}
                    className="w-4 h-4 rounded border-0 p-0 cursor-pointer"
                  />
                  <span className="text-[10px] font-semibold text-slate-600">Accent</span>
                </label>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                  <span>Border Size</span>
                  <span className="font-mono">{activeStyleForInspector.frameThickness}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={activeStyleForInspector.frameThickness}
                  onChange={(e) =>
                    updateInspectorStyle({ frameThickness: Number(e.target.value) })
                  }
                  className="w-full accent-[#087f83] cursor-pointer"
                />
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
                        ? 'bg-[#087f83] text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-[#e5e9ee] hover:bg-slate-100'
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
                          ? 'bg-[#e5f4f3] text-[#087477] border-[#b7dddd]'
                          : 'bg-slate-50 text-slate-600 border-[#e5e9ee] hover:bg-slate-100'
                      }`}
                    >
                      {mask}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Global Grid, Size & Tilt Sliders */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div>
                <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                  <span>Photo Distance</span>
                  <span className="font-mono">{meta.globalStyle.gap}px</span>
                </div>
                <input
                  type="range"
                  min={-16}
                  max={40}
                  value={meta.globalStyle.gap}
                  onChange={(e) =>
                    commitMeta((prev) => ({
                      ...prev,
                      globalStyle: { ...prev.globalStyle, gap: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-[#087f83] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                  <span>Photo Size</span>
                  <span className="font-mono">{Math.round((meta.globalStyle.slotScale ?? 1) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={125}
                  value={Math.round((meta.globalStyle.slotScale ?? 1) * 100)}
                  onChange={(e) =>
                    commitMeta((prev) => ({
                      ...prev,
                      globalStyle: { ...prev.globalStyle, slotScale: Number(e.target.value) / 100 },
                    }))
                  }
                  className="w-full accent-[#087f83] cursor-pointer"
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
                  className="w-full accent-[#087f83] cursor-pointer"
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
                  className="accent-[#087f83] rounded"
                />
              </label>
            </div>

            {/* Selected Slot Crop & Caption Controls */}
            <div className="space-y-2 pt-2 border-t border-slate-100 bg-slate-50 p-2.5 rounded-xl border border-[#e5e9ee]">
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
                  className="text-[10px] font-bold text-[#087477] hover:underline"
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
                  className="w-full accent-[#087f83] cursor-pointer"
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
                  className="px-2 py-1 rounded-lg bg-white border border-[#e5e9ee] hover:bg-slate-100 text-[10px] font-semibold flex items-center gap-1"
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
                  className="px-2 py-1 rounded-lg bg-white border border-[#e5e9ee] hover:bg-slate-100 text-[10px] font-semibold flex items-center gap-1"
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
                  className="px-2 py-1 rounded-lg bg-white border border-[#e5e9ee] hover:bg-slate-100 text-[10px] font-semibold flex items-center gap-1"
                >
                  <ArrowUpToLine size={10} /> Front
                </button>
                {activeLayout.slotCount > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(selectedSlotIdx)}
                    className="px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold flex items-center gap-1"
                    title="Remove this slot and reflow layout"
                  >
                    <Trash2 size={10} /> Remove Slot
                  </button>
                )}
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
                  className="w-full px-2 py-1 rounded-lg border border-[#e5e9ee] bg-white text-[10.5px] outline-none focus:border-[#b7dddd]"
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
                  className="flex-1 bg-slate-50 border border-[#e5e9ee] rounded-xl px-2 py-1 text-[10.5px] font-semibold outline-none"
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
                    className="w-7 h-7 rounded-lg border border-[#e5e9ee] p-0 cursor-pointer"
                  />
                )}
              </div>
              {meta.backdrop.type === 'pastel-gradient' && (
                <div>
                  <span className="block text-[9.5px] font-semibold text-slate-500 mb-1">
                    Gradient Swatches
                  </span>
                  <div className="grid grid-cols-6 gap-1">
                    {GRADIENT_SWATCHES.map((sw) => {
                      const isSel =
                        meta.backdrop.color === sw.color1 &&
                        meta.backdrop.gradientColor2 === sw.color2;
                      return (
                        <button
                          key={sw.id}
                          type="button"
                          title={sw.name}
                          onClick={() =>
                            commitMeta((prev) => ({
                              ...prev,
                              backdrop: {
                                ...prev.backdrop,
                                color: sw.color1,
                                gradientColor2: sw.color2,
                                gradientAngle: sw.angle,
                              },
                            }))
                          }
                          className={`h-5 rounded-md border transition cursor-pointer ${
                            isSel
                              ? 'border-indigo-600 ring-1 ring-[#087f83]/40 scale-105'
                              : 'border-[#e5e9ee] hover:scale-105'
                          }`}
                          style={{
                            backgroundImage: buildLinearGradientCss(sw.color1, sw.color2, sw.angle),
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {meta.backdrop.type !== 'none' && (
                <>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={meta.backdrop.patternType || 'none'}
                      onChange={(e) =>
                        commitMeta((prev) => ({
                          ...prev,
                          backdrop: {
                            ...prev.backdrop,
                            patternType: e.target.value as BackgroundPatternType,
                          },
                        }))
                      }
                      className="flex-1 bg-slate-50 border border-[#e5e9ee] rounded-xl px-2 py-1 text-[10px] font-semibold outline-none"
                    >
                      <option value="none">Pattern Overlay: None</option>
                      {PATTERN_CATALOG.map((p) => (
                        <option key={p.id} value={p.id}>
                          Pattern: {p.label}
                        </option>
                      ))}
                    </select>
                    {meta.backdrop.patternType && meta.backdrop.patternType !== 'none' && (
                      <input
                        type="color"
                        value={meta.backdrop.patternColor || '#4f46e5'}
                        onChange={(e) =>
                          commitMeta((prev) => ({
                            ...prev,
                            backdrop: { ...prev.backdrop, patternColor: e.target.value },
                          }))
                        }
                        className="w-6 h-6 rounded-lg border border-[#e5e9ee] p-0 cursor-pointer"
                        title="Pattern Ink Color"
                      />
                    )}
                  </div>
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
                      className="w-full accent-[#087f83] cursor-pointer"
                    />
                  </div>
                  <label className="flex items-center justify-between text-[10px] font-semibold text-[#087477] bg-[#e5f4f3] px-2 py-1.5 rounded-xl border border-[#b7dddd]/70 cursor-pointer">
                    <span>Cover document page background</span>
                    <input
                      type="checkbox"
                      checked={Boolean(meta.coverDocumentBackground)}
                      onChange={(e) =>
                        commitMeta((prev) => ({
                          ...prev,
                          coverDocumentBackground: e.target.checked,
                        }))
                      }
                      className="accent-[#087f83] rounded"
                    />
                  </label>
                </>
              )}
            </div>

            {/* Collage & Vibe Stickers */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-[10.5px] font-bold text-slate-500">
                  Stickers ({(meta.stickers || []).length})
                </label>
                {(meta.stickers || []).length > 0 && (
                  <button
                    type="button"
                    onClick={() => commitMeta((prev) => ({ ...prev, stickers: [] }))}
                    className="text-[10px] font-semibold text-rose-600 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="grid grid-cols-6 gap-1 max-h-28 overflow-y-auto pr-0.5">
                {STICKER_CATALOG.map((stk) => (
                  <button
                    key={stk.id}
                    type="button"
                    title={`Add ${stk.name}`}
                    onClick={() =>
                      commitMeta((prev) => {
                        const existing = prev.stickers || [];
                        const anchors = [
                          { x: 0.03, y: 0.03, rotation: -10 },
                          { x: 0.85, y: 0.84, rotation: 8 },
                          { x: 0.84, y: 0.04, rotation: 12 },
                          { x: 0.04, y: 0.84, rotation: -8 },
                          { x: 0.44, y: 0.02, rotation: 4 },
                          { x: 0.44, y: 0.85, rotation: -5 },
                        ];
                        const pos = anchors[existing.length % anchors.length];
                        return {
                          ...prev,
                          stickers: [
                            ...existing,
                            {
                              id: `col-stk-${Date.now()}-${existing.length}`,
                              stickerId: stk.id,
                              x: pos.x,
                              y: pos.y,
                              size: 56,
                              rotation: pos.rotation,
                            },
                          ],
                        };
                      })
                    }
                    className="p-1 rounded-lg border border-[#e5e9ee] bg-white hover:border-amber-400 hover:bg-amber-50/40 transition cursor-pointer flex items-center justify-center"
                  >
                    <img src={stk.dataUri} alt={stk.name} className="w-6 h-6 object-contain" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
