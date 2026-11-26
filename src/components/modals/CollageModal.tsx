import React, { useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { COLLAGE_LAYOUTS, computeCollageSlots } from '../../utils/collageLayouts';
import { ImageElement } from '../../types/publisher';
import { LayoutGrid, X, Upload, ImagePlus, Trash2 } from 'lucide-react';

export const CollageModal: React.FC = () => {
  const { isCollageModalOpen, setIsCollageModalOpen, activePage, addElementsBatch } =
    usePublisher();

  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('4-grid');
  const [slotImages, setSlotImages] = useState<string[]>([]);
  const [gap, setGap] = useState<number>(10);
  const [cornerRadius, setCornerRadius] = useState<number>(12);

  const multiFileRef = useRef<HTMLInputElement>(null);
  const singleFileRef = useRef<HTMLInputElement>(null);
  const activeSlotIndexRef = useRef<number>(0);

  if (!isCollageModalOpen) return null;

  const activeLayout =
    COLLAGE_LAYOUTS.find((l) => l.id === selectedLayoutId) || COLLAGE_LAYOUTS[0];

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(String(e.target?.result || ''));
      reader.readAsDataURL(file);
    });

  const handleMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const urls = await Promise.all(files.map(readFileAsDataUrl));
    setSlotImages((prev) => {
      const next = [...prev];
      let urlIdx = 0;
      for (let i = 0; i < activeLayout.count && urlIdx < urls.length; i++) {
        if (!next[i]) {
          next[i] = urls[urlIdx++];
        }
      }
      // If all slots were already filled, overwrite from index 0
      if (urlIdx === 0) {
        urls.slice(0, activeLayout.count).forEach((u, idx) => {
          next[idx] = u;
        });
      }
      return next;
    });
    e.target.value = '';
  };

  const handleSingleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await readFileAsDataUrl(file);
    const idx = activeSlotIndexRef.current;
    setSlotImages((prev) => {
      const next = [...prev];
      next[idx] = url;
      return next;
    });
    e.target.value = '';
  };

  const handleInsertCollage = () => {
    const availW = Math.max(220, activePage.width - activePage.margins.left - activePage.margins.right);
    const availH = Math.max(220, activePage.height - activePage.margins.top - activePage.margins.bottom);
    const boxSize = Math.min(availW, availH, 520);
    const totalW = boxSize;
    const totalH = boxSize;

    const originX = Math.round((activePage.width - totalW) / 2);
    const originY = Math.round((activePage.height - totalH) / 2);
    const slots = computeCollageSlots(activeLayout, totalW, totalH, gap);
    const groupId = `grp-collage-${Date.now()}`;
    const baseZ = activePage.elements.reduce((acc, el) => Math.max(acc, el.zIndex), 0) + 1;

    const elements: ImageElement[] = slots.map((slot, idx) => ({
      id: `img-col-${Date.now()}-${idx}`,
      type: 'image',
      name: `Collage Photo ${idx + 1}`,
      groupId,
      src: slotImages[idx] || '',
      x: originX + slot.x,
      y: originY + slot.y,
      width: slot.width,
      height: slot.height,
      rotation: 0,
      zIndex: baseZ + idx,
      objectFit: 'cover',
      borderRadius: cornerRadius,
      aspectRatioLocked: false,
    }));

    addElementsBatch(elements);
    setIsCollageModalOpen(false);
  };

  const previewSlots = computeCollageSlots(activeLayout, 320, 320, gap);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 flex items-center justify-center p-4 select-none"
      onClick={() => setIsCollageModalOpen(false)}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <LayoutGrid size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Photo Collage Builder</h2>
              <p className="text-[11px] text-slate-500">
                Pick a grid layout, add photos, and insert as a movable group
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCollageModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition"
          >
            <X size={18} />
          </button>
        </div>

        <input
          ref={multiFileRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleMultiUpload}
        />
        <input
          ref={singleFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleSingleUpload}
        />

        {/* Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left: Layout Presets & Sliders */}
          <div className="md:col-span-5 p-5 space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-2">
                1. Choose Grid Layout
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COLLAGE_LAYOUTS.map((layout) => {
                  const isActive = layout.id === activeLayout.id;
                  const miniSlots = computeCollageSlots(layout, 48, 48, 3);
                  return (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => setSelectedLayoutId(layout.id)}
                      className={`p-2 rounded-xl border flex items-center gap-2.5 text-left transition ${
                        isActive
                          ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500/30'
                          : 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="relative w-12 h-12 flex-shrink-0 bg-slate-100 rounded-md overflow-hidden p-0.5">
                        {miniSlots.map((s, i) => (
                          <div
                            key={i}
                            style={{
                              position: 'absolute',
                              left: `${s.x}px`,
                              top: `${s.y}px`,
                              width: `${s.width}px`,
                              height: `${s.height}px`,
                            }}
                            className={`rounded-[2px] ${
                              isActive ? 'bg-indigo-500/80' : 'bg-slate-400/70'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-800 truncate">
                          {layout.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {layout.count} Photos
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gap & Corner Radius */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>Gap Spacing</span>
                  <span className="font-mono">{gap}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={gap}
                  onChange={(e) => setGap(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>Corner Radius</span>
                  <span className="font-mono">{cornerRadius}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={cornerRadius}
                  onChange={(e) => setCornerRadius(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Right: Interactive Slot Preview */}
          <div className="md:col-span-7 p-5 bg-slate-50 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600">
                2. Click Any Slot to Add/Replace Photo
              </span>
              <button
                type="button"
                onClick={() => multiFileRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <Upload size={13} />
                <span>Upload Multiple</span>
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center py-2">
              <div
                className="relative bg-white rounded-2xl shadow-md border border-slate-200 p-3"
                style={{ width: '344px', height: '344px' }}
              >
                <div className="relative w-[320px] h-[320px]">
                  {previewSlots.map((slot, idx) => {
                    const imgSrc = slotImages[idx];
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          activeSlotIndexRef.current = idx;
                          singleFileRef.current?.click();
                        }}
                        style={{
                          position: 'absolute',
                          left: `${slot.x}px`,
                          top: `${slot.y}px`,
                          width: `${slot.width}px`,
                          height: `${slot.height}px`,
                          borderRadius: `${cornerRadius}px`,
                        }}
                        className="group overflow-hidden border border-dashed border-slate-300 bg-slate-100 hover:border-indigo-500 cursor-pointer transition flex items-center justify-center"
                      >
                        {imgSrc ? (
                          <>
                            <img
                              src={imgSrc}
                              alt={`Slot ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSlotImages((prev) => {
                                  const next = [...prev];
                                  next[idx] = '';
                                  return next;
                                });
                              }}
                              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/70 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition"
                              title="Remove Photo"
                            >
                              <Trash2 size={11} />
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-indigo-600 transition">
                            <Upload size={16} />
                            <span className="text-[10px] font-semibold">Photo {idx + 1}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-[11px] text-slate-400">
                Empty slots insert as clickable placeholders
              </span>
              <button
                type="button"
                onClick={handleInsertCollage}
                className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <ImagePlus size={14} />
                <span>Insert Collage</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
