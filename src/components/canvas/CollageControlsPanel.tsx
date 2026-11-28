import React, { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import { useCollageSelection } from '../../hooks/useCollageSelection';
import { useCloseOnOutsideClick } from '../../hooks/useCloseOnOutsideClick';
import { COLLAGE_CONTROL_TITLES, type CollageControlSection } from '../../constants/collageControls';
import {
  COLLAGE_BORDER_ART_OPTIONS,
  COLLAGE_VIBE_PACKS,
  CollageBackdropType,
  getBackdropPreviewStyle,
} from '../../utils/borderArtStyles';
import { COLLAGE_LAYOUTS, computeCollageSlots } from '../../utils/collageLayouts';
import { applyVibePack } from '../../utils/collageVibes';
import { createEmptySlot } from '../../utils/collageBuild';

const BACKDROP_TYPES: Array<{ id: CollageBackdropType; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'solid', label: 'Solid' },
  { id: 'pastel-gradient', label: 'Gradient' },
  { id: 'kraft-paper', label: 'Kraft' },
  { id: 'dot-grid', label: 'Dots' },
];

const BACKDROP_SWATCHES = [
  '#fff1f2',
  '#fef3c7',
  '#ecfdf5',
  '#eff6ff',
  '#f5f3ff',
  '#fdf2f8',
  '#f8fafc',
  '#e6ccb2',
];

const FRAME_COLORS = ['#ffffff', '#0f172a', '#6e56cf', '#f9a8d4', '#fbbf24', '#10b981'];

function LayoutThumb({ layoutId }: { layoutId: string }) {
  const layout = COLLAGE_LAYOUTS.find((candidate) => candidate.id === layoutId) ?? COLLAGE_LAYOUTS[0];
  const slots = computeCollageSlots(layout, 100, 100, 2, false, 1, 0);
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      {slots.map((slot, index) => (
        <rect
          key={index}
          x={slot.x}
          y={slot.y}
          width={slot.width}
          height={slot.height}
          rx={1.5}
          fill="currentColor"
          opacity={0.55}
        />
      ))}
    </svg>
  );
}

/**
 * The context panel's collage sections — where the canvas bar's nested buttons land.
 *
 * Direct buttons on the bar act immediately; anything that needs a value picked comes here.
 * Lives in the right inspector, which renders in both Publisher and Designer mode, so the
 * bar has one destination rather than two implementations that drift apart.
 */
export const CollageControlsPanel: React.FC = () => {
  const {
    collageControlSection,
    closeCollageControl,
    patchCollageMeta,
    activePage,
    openCollageControl,
  } = usePublisher();
  const collage = useCollageSelection();
  const rootRef = useRef<HTMLDivElement>(null);

  // The panel is about one collage; if the selection moves on, so does the panel.
  useEffect(() => {
    if (!collage) closeCollageControl();
  }, [collage, closeCollageControl]);

  // And a click outside it is a click about something else.
  useCloseOnOutsideClick(rootRef, Boolean(collageControlSection && collage), closeCollageControl);

  if (!collageControlSection || !collage) return null;

  const { groupId, meta, memberIds, slotCount } = collage;
  const patch = (next: Parameters<typeof patchCollageMeta>[1]) =>
    patchCollageMeta(groupId, next, memberIds);

  // Photos already on the page that are not part of this collage.
  const loosePhotos = activePage.elements
    .filter(
      (el) =>
        el.type === 'image' &&
        Boolean((el as { src?: string }).src) &&
        el.groupId !== groupId &&
        !(el as { effectPreset?: string }).effectPreset
    )
    .map((el) => (el as { src: string }).src);

  const fillNextEmptySlot = (src: string) => {
    const slots = [...meta.slots];
    const target = slots.findIndex((slot) => !slot.imageUrl);
    const index = target === -1 ? 0 : target;
    slots[index] = { ...(slots[index] ?? createEmptySlot()), imageUrl: src };
    patch({ ...meta, slots, vibePackId: undefined });
  };

  const section = collageControlSection as CollageControlSection;

  return (
    <div
      ref={rootRef}
      className="space-y-2 rounded-[10px] border border-[#d3c9f9] bg-[#faf8ff] p-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-[#4a3c8c]">
          {COLLAGE_CONTROL_TITLES[section]}
        </span>
        <button
          type="button"
          onClick={closeCollageControl}
          className="p-0.5 rounded-[5px] text-[#7a6dbb] hover:bg-[#efeafd] hover:text-[#5c4bb8] transition"
          aria-label="Close collage controls"
          title="Close"
        >
          <X size={12} />
        </button>
      </div>

      {section === 'vibes' && (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            {COLLAGE_VIBE_PACKS.map((pack) => {
              const isActive = meta.vibePackId === pack.id;
              const frameColor = pack.style.frameColor || '#ffffff';
              const accentColor = pack.style.accentColor || '#cbd5e1';
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => patch(applyVibePack(meta, pack.id))}
                  title={pack.description}
                  aria-pressed={isActive}
                  className={`flex flex-col gap-1 rounded-[9px] border p-1.5 text-left transition cursor-pointer ${
                    isActive
                      ? 'border-[#6e56cf] bg-white ring-1 ring-[#6e56cf]/25'
                      : 'border-[#e5e9ee] bg-white hover:border-[#d3c9f9]'
                  }`}
                >
                  <div
                    className="flex h-8 w-full items-center justify-center gap-1 overflow-hidden rounded-[6px] border border-[#e5e9ee]/70 p-1"
                    style={getBackdropPreviewStyle(pack.backdrop)}
                  >
                    <div
                      className="h-5 w-4 flex-shrink-0 rounded-[2px]"
                      style={{ backgroundColor: frameColor, border: `1.5px solid ${accentColor}` }}
                    />
                    <div
                      className="h-5 w-4 flex-shrink-0 rounded-[2px]"
                      style={{
                        backgroundColor: frameColor,
                        border: `1.5px solid ${accentColor}`,
                        transform: pack.style.scatterTilt ? 'rotate(4deg)' : undefined,
                      }}
                    />
                  </div>
                  <span className="truncate text-[10px] font-semibold text-[#202833]">
                    {pack.label}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[9.5px] leading-snug text-[#7a6dbb]">
            Changes the look, not the photos — framings and positions stay put.
          </p>
        </>
      )}

      {section === 'layouts' && (
        <div className="grid grid-cols-4 gap-1.5">
          {COLLAGE_LAYOUTS.filter((layout) => layout.slotCount >= Math.max(1, collage.filledSlots)).map(
            (layout) => {
              const isActive = meta.layoutId === layout.id;
              return (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => patch({ ...meta, layoutId: layout.id, customLayout: undefined })}
                  title={`${layout.name} — ${layout.slotCount} slots`}
                  aria-pressed={isActive}
                  className={`flex flex-col items-center gap-1 rounded-[8px] border p-1 transition cursor-pointer ${
                    isActive
                      ? 'border-[#6e56cf] bg-white text-[#6e56cf]'
                      : 'border-[#e5e9ee] bg-white text-[#8b95a1] hover:border-[#d3c9f9] hover:text-[#6e56cf]'
                  }`}
                >
                  <span className="h-8 w-8">
                    <LayoutThumb layoutId={layout.id} />
                  </span>
                  <span className="text-[9px] font-semibold tabular-nums">{layout.slotCount}</span>
                </button>
              );
            }
          )}
        </div>
      )}

      {section === 'photos' && (
        <div className="space-y-1.5">
          <p className="text-[9.5px] leading-snug text-[#7a6dbb]">
            {collage.filledSlots}/{slotCount} slots hold a photo. Click one to fill the next
            empty slot.
          </p>
          {loosePhotos.length === 0 ? (
            <p className="rounded-[8px] border border-dashed border-[#d3c9f9] bg-white p-2 text-[9.5px] text-[#8b82b8]">
              No other images on this page. Add some, then come back.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {loosePhotos.slice(0, 8).map((src, index) => (
                <button
                  key={`${src.slice(-24)}-${index}`}
                  type="button"
                  onClick={() => fillNextEmptySlot(src)}
                  title="Put this image in the next empty slot"
                  className="aspect-square overflow-hidden rounded-[7px] border border-[#e5e9ee] bg-white hover:border-[#6e56cf] transition"
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() =>
              patch({ ...meta, slots: meta.slots.map(() => createEmptySlot()), vibePackId: undefined })
            }
            className="w-full rounded-[8px] border border-[#e5e9ee] bg-white px-2 py-1 text-[10px] font-semibold text-[#5b6673] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition"
          >
            Remove all photos
          </button>
        </div>
      )}

      {(section === 'backdrop' || section === 'frame') && (
        <div className="grid grid-cols-2 gap-1">
          {(['backdrop', 'frame'] as const).map((target) => (
            <button
              key={target}
              type="button"
              onClick={() => openCollageControl(target)}
              aria-pressed={section === target}
              className={`rounded-[7px] border px-1 py-1 text-[9.5px] font-semibold capitalize transition cursor-pointer ${
                section === target
                  ? 'border-[#6e56cf] bg-white text-[#5c4bb8]'
                  : 'border-[#e5e9ee] bg-white text-[#8b95a1] hover:border-[#d3c9f9]'
              }`}
            >
              {target}
            </button>
          ))}
        </div>
      )}

      {section === 'backdrop' && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-5 gap-1">
            {BACKDROP_TYPES.map((type) => {
              const isActive = meta.backdrop.type === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() =>
                    patch({
                      ...meta,
                      backdrop: { ...meta.backdrop, type: type.id },
                      vibePackId: undefined,
                    })
                  }
                  aria-pressed={isActive}
                  className={`rounded-[7px] border px-1 py-1 text-[9px] font-semibold transition cursor-pointer ${
                    isActive
                      ? 'border-[#6e56cf] bg-white text-[#5c4bb8]'
                      : 'border-[#e5e9ee] bg-white text-[#8b95a1] hover:border-[#d3c9f9]'
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {BACKDROP_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() =>
                  patch({
                    ...meta,
                    backdrop: { ...meta.backdrop, type: meta.backdrop.type === 'none' ? 'solid' : meta.backdrop.type, color },
                    vibePackId: undefined,
                  })
                }
                title={color}
                aria-label={`Backdrop colour ${color}`}
                className={`h-5 w-5 rounded-full border transition ${
                  meta.backdrop.color === color ? 'border-[#6e56cf] ring-1 ring-[#6e56cf]/40' : 'border-[#e5e9ee]'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}

      {section === 'frame' && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1">
            {COLLAGE_BORDER_ART_OPTIONS.map((option) => {
              const isActive = meta.globalStyle.borderArt === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    patch({
                      ...meta,
                      globalStyle: { ...meta.globalStyle, borderArt: option.id },
                      vibePackId: undefined,
                    })
                  }
                  aria-pressed={isActive}
                  title={option.label}
                  className={`flex items-center justify-center gap-1 rounded-[7px] border px-1 py-1.5 text-[9px] font-semibold transition cursor-pointer ${
                    isActive
                      ? 'border-[#6e56cf] bg-white text-[#5c4bb8]'
                      : 'border-[#e5e9ee] bg-white text-[#8b95a1] hover:border-[#d3c9f9]'
                  }`}
                >
                  {isActive && <Check size={9} />}
                  <span className="truncate">{option.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {FRAME_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() =>
                  patch({
                    ...meta,
                    globalStyle: { ...meta.globalStyle, frameColor: color },
                    vibePackId: undefined,
                  })
                }
                title={color}
                aria-label={`Frame colour ${color}`}
                className={`h-5 w-5 rounded-full border transition ${
                  meta.globalStyle.frameColor === color
                    ? 'border-[#6e56cf] ring-1 ring-[#6e56cf]/40'
                    : 'border-[#e5e9ee]'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
