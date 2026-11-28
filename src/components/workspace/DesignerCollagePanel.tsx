import React, { useMemo, useRef, useState } from 'react';
import { Images, LayoutGrid, Plus, Sparkles, Upload, X } from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import {
  COLLAGE_LAYOUTS,
  computeCollageSlots,
  pickCollageLayoutForCount,
} from '../../utils/collageLayouts';
import type { ImageElement, PublisherElement, ShapeElement } from '../../types/publisher';

const MAX_PHOTOS = 12;
/** No preset holds more than this, so a larger tray could never be fully placed. */
const MAX_COLLAGE_SLOTS = Math.max(...COLLAGE_LAYOUTS.map((layout) => layout.slotCount));
const PHOTO_LIMIT = Math.min(MAX_PHOTOS, MAX_COLLAGE_SLOTS);
/** Side of the square collage canvas, as a share of the shorter page edge. */
const CANVAS_SHARE = 0.72;

function LayoutThumb({ slots }: { slots: { x: number; y: number; width: number; height: number }[] }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      {slots.map((slot, index) => (
        <rect
          key={index}
          x={slot.x * 100}
          y={slot.y * 100}
          width={slot.width * 100}
          height={slot.height * 100}
          rx={1.5}
          fill="currentColor"
          opacity={0.55}
        />
      ))}
    </svg>
  );
}
/**
 * The Collage drawer.
 *
 * Fast path: pick a layout, drop in photos, insert as one grouped object. It reuses the
 * builder's layout maths (`computeCollageSlots`) and its `grp-collage-*` group convention,
 * so the Layers list and the group controls treat the result exactly like a collage made
 * in the full builder.
 *
 * The full builder stays available for what a drawer cannot hold: Vibe Packs, BorderArt
 * frames, per-slot masks, scatter and stickers.
 */
export const DesignerCollagePanel: React.FC = () => {
  const {
    activePage,
    selectedElementIds,
    addElementsBatch,
    setIsCollageModalOpen,
    setToolMode,
  } = usePublisher();

  const pageImages = useMemo(
    () =>
      activePage.elements
        .filter((el): el is ImageElement => el.type === 'image' && Boolean(el.src))
        .map((el) => el.src),
    [activePage.elements]
  );

  /**
   * Images on the page that are not already part of a collage. Insert falls back to these
   * when nothing is selected, so a collage never feeds its own frames back into a new one.
   */
  const pageImagesOutsideCollage = useMemo(
    () =>
      activePage.elements
        .filter(
          (el): el is ImageElement =>
            el.type === 'image' &&
            Boolean(el.src) &&
            !el.groupId?.startsWith('grp-collage-')
        )
        .map((el) => el.src),
    [activePage.elements]
  );

  const selectedImages = useMemo(() => {
    const selected = new Set(selectedElementIds);
    return activePage.elements
      .filter(
        (el): el is ImageElement => el.type === 'image' && selected.has(el.id) && Boolean(el.src)
      )
      .map((el) => el.src);
  }, [activePage.elements, selectedElementIds]);

  /**
   * `null` means "still following the workspace". It becomes an array the moment the user
   * builds the tray by hand (upload, remove, "Use page images"), which is the only way to
   * tell their intent apart from the ambient state.
   */
  const [manualPhotos, setManualPhotos] = useState<string[] | null>(null);
  const photos = useMemo(() => {
    if (manualPhotos) return manualPhotos;
    if (selectedImages.length > 0) return selectedImages.slice(0, PHOTO_LIMIT);
    return pageImagesOutsideCollage.slice(0, PHOTO_LIMIT);
  }, [manualPhotos, selectedImages, pageImagesOutsideCollage]);

  /**
   * A manual preset choice is stored with the photo count it was made at: add or remove a
   * photo and the automatic choice takes over again, so a 3-up preset never survives into
   * a 5-photo collage.
   */
  const [manualPick, setManualPick] = useState<{ id: string; count: number } | null>(null);
  const [gap, setGap] = useState(8);
  const [corner, setCorner] = useState(0);
  const [backdrop, setBackdrop] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const autoLayoutId = useMemo(
    () => pickCollageLayoutForCount(photos.length),
    [photos.length]
  );
  const usingManualPick = Boolean(manualPick && manualPick.count === photos.length);
  const layoutId = usingManualPick ? (manualPick as { id: string }).id : autoLayoutId;
  const layout = useMemo(
    () => COLLAGE_LAYOUTS.find((item) => item.id === layoutId) ?? COLLAGE_LAYOUTS[0],
    [layoutId]
  );

  const updatePhotos = (updater: (current: string[]) => string[]) => {
    setManualPhotos((current) => updater(current ?? photos));
  };

  const addPhotos = (urls: string[]) => {
    updatePhotos((current) => {
      const next = [...current];
      for (const url of urls) {
        if (next.length >= PHOTO_LIMIT) break;
        if (!next.includes(url)) next.push(url);
      }
      return next;
    });
  };

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') addPhotos([reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const filledSlots = Math.min(photos.length, layout.slotCount);

  const handleInsert = () => {
    const side = Math.round(Math.min(activePage.width, activePage.height) * CANVAS_SHARE);
    const pad = backdrop ? Math.max(6, Math.round(gap * 1.4)) : 0;
    const originX = Math.round((activePage.width - side) / 2);
    const originY = Math.round((activePage.height - side) / 2);
    const inner = Math.max(80, side - pad * 2);

    const slots = computeCollageSlots(layout, inner, inner, gap, false, 1, 0);
    const groupId = `grp-collage-${Date.now()}`;
    const elements: PublisherElement[] = [];

    if (backdrop) {
      const backdropEl: ShapeElement = {
        id: `shp-col-bg-${Date.now()}`,
        type: 'shape',
        name: 'Collage Backdrop Card',
        groupId,
        shapeType: 'rounded-rect',
        cornerRadius: 18,
        fillColor: '#f8fafc',
        fillType: 'solid',
        strokeColor: '#e2e8f0',
        strokeWidth: 1,
        x: originX,
        y: originY,
        width: side,
        height: side,
        rotation: 0,
        zIndex: 1,
        shadow: true,
        shadowBlur: 14,
      };
      elements.push(backdropEl);
    }

    slots.forEach((slot, index) => {
      const src = photos[index] ?? '';
      const imageEl: ImageElement = {
        id: `img-col-${Date.now()}-${index}`,
        type: 'image',
        name: src ? `Collage Photo ${index + 1}` : `Photo Slot ${index + 1}`,
        groupId,
        src,
        x: originX + pad + slot.x,
        y: originY + pad + slot.y,
        width: slot.width,
        height: slot.height,
        rotation: slot.rotation,
        zIndex: 2 + slot.zIndex,
        objectFit: 'cover',
        aspectRatioLocked: false,
        borderRadius: corner,
      };
      elements.push(imageEl);
    });

    addElementsBatch(elements);
    // Snapshot the tray: the insert selects the new collage, and a tray still following the
    // selection would silently swap to the collage it just made.
    setManualPhotos(photos);
    setToolMode('select');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
        {/* Photos going into the collage */}
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lead font-semibold text-ink">Photos</h3>
            <span className="text-2xs text-ink-muted">
              {photos.length}/{PHOTO_LIMIT}
            </span>
          </div>

          {photos.length > 0 ? (
            <div className="grid grid-cols-4 gap-1.5">
              {photos.map((src, index) => (
                <div
                  key={`${index}-${src.slice(0, 24)}`}
                  className="group relative aspect-square overflow-hidden rounded-tile bg-surface-sunken ring-1 ring-line"
                >
                  <img
                    src={src}
                    alt={`Collage photo ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => updatePhotos((current) => current.filter((_, i) => i !== index))}
                    className="absolute right-0.5 top-0.5 grid h-4 w-4 cursor-pointer place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="grid aspect-square cursor-pointer place-items-center rounded-tile border border-dashed border-line text-ink-muted transition hover:border-accent-line hover:text-accent-ink"
                  aria-label="Add photos"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full cursor-pointer flex-col items-center gap-1 rounded-tile border border-dashed border-line px-3 py-6 text-ink-muted transition hover:border-accent-line hover:text-accent-ink"
            >
              <Upload size={18} />
              <span className="text-meta font-medium">Add photos</span>
            </button>
          )}

          {manualPhotos === null && photos.length > 0 && (
            <p className="text-2xs text-ink-muted">
              {selectedImages.length > 0
                ? 'Following your selection'
                : 'Using the images on this page'}
              {' · '}
              {(() => {
                const available =
                  selectedImages.length > 0 ? selectedImages.length : pageImagesOutsideCollage.length;
                return available > photos.length
                  ? `${photos.length} of ${available} (no preset holds more than ${PHOTO_LIMIT})`
                  : `${photos.length} ${photos.length === 1 ? 'image' : 'images'}`;
              })()}
            </p>
          )}
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              disabled={selectedImages.length === 0}
              onClick={() => addPhotos(selectedImages)}
              className="h-7 cursor-pointer rounded-chip border border-line bg-surface text-2xs font-medium text-ink-body transition hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-45"
            >
              Use selection{selectedImages.length ? ` (${selectedImages.length})` : ''}
            </button>
            <button
              type="button"
              disabled={pageImages.length === 0}
              onClick={() => addPhotos(pageImages)}
              className="h-7 cursor-pointer rounded-chip border border-line bg-surface text-2xs font-medium text-ink-body transition hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-45"
            >
              Use page images{pageImages.length ? ` (${pageImages.length})` : ''}
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="hidden"
          />
        </section>

        {/* Layout */}
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lead font-semibold text-ink">Layout</h3>
            <span className="text-2xs text-ink-muted">
              {usingManualPick
                ? layout.name
                : `${layout.name} · chosen for ${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {COLLAGE_LAYOUTS.map((item) => {
              const active = item.id === layout.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setManualPick({ id: item.id, count: photos.length })}
                  title={`${item.name} · ${item.slotCount} photos`}
                  className={`aspect-square cursor-pointer rounded-tile border p-1.5 transition ${
                    active
                      ? 'border-accent-line bg-accent-soft text-accent'
                      : 'border-line bg-surface-sunken text-ink-muted hover:border-accent-line hover:text-accent-ink'
                  }`}
                >
                  <LayoutThumb slots={item.slots} />
                </button>
              );
            })}
          </div>
        </section>

        {/* Style */}
        <section className="space-y-2">
          <h3 className="text-lead font-semibold text-ink">Style</h3>
          <label className="block space-y-1">
            <span className="flex items-center justify-between text-2xs text-ink-secondary">
              <span>Spacing</span>
              <span className="tabular-nums text-ink-muted">{gap}px</span>
            </span>
            <input
              type="range"
              min={0}
              max={24}
              value={gap}
              onChange={(event) => setGap(Number(event.target.value))}
              className="w-full cursor-pointer accent-accent"
            />
          </label>
          <label className="block space-y-1">
            <span className="flex items-center justify-between text-2xs text-ink-secondary">
              <span>Corners</span>
              <span className="tabular-nums text-ink-muted">{corner}px</span>
            </span>
            <input
              type="range"
              min={0}
              max={32}
              value={corner}
              onChange={(event) => setCorner(Number(event.target.value))}
              className="w-full cursor-pointer accent-accent"
            />
          </label>
          <button
            type="button"
            onClick={() => setBackdrop((value) => !value)}
            aria-pressed={backdrop}
            className={`flex h-7 w-full cursor-pointer items-center justify-between rounded-chip border px-2 text-2xs font-medium transition ${
              backdrop
                ? 'border-accent-line bg-accent-soft text-accent-ink'
                : 'border-line bg-surface text-ink-body hover:bg-surface-sunken'
            }`}
          >
            <span>Backdrop card</span>
            <span className="text-ink-muted">{backdrop ? 'On' : 'Off'}</span>
          </button>
        </section>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 space-y-1.5 border-t border-line-soft px-3 py-2.5">
        <button
          type="button"
          onClick={handleInsert}
          className="flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-chip bg-accent text-meta font-semibold text-white transition hover:bg-accent-hover"
        >
          <LayoutGrid size={13} />
          {filledSlots === 0
            ? `Insert ${layout.slotCount} empty frames`
            : filledSlots < layout.slotCount
              ? `Insert collage · ${filledSlots}/${layout.slotCount} filled`
              : 'Insert collage'}
        </button>
        <button
          type="button"
          onClick={() => setIsCollageModalOpen(true)}
          className="flex h-7 w-full cursor-pointer items-center justify-center gap-1.5 rounded-chip border border-line bg-surface text-2xs font-medium text-ink-body transition hover:bg-surface-sunken"
        >
          <Sparkles size={12} className="text-accent" />
          Open full builder (Vibe Packs, frames)
        </button>
        {photos.length === 0 && (
          <p className="flex items-start gap-1 text-2xs text-ink-muted">
            <Images size={11} className="mt-px flex-shrink-0" />
            No photos yet — empty slots become picture frames you can fill later.
          </p>
        )}
      </div>
    </div>
  );
};
