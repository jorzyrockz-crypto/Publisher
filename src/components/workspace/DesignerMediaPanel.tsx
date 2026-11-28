import React from 'react';
import { AlertCircle, Image as ImageIcon, Images, Plus, Upload, Wand2, X } from 'lucide-react';
import { formatBytes, isMediaLibraryPersistent, type MediaUpload } from '../../utils/mediaLibrary';

/**
 * My media: the user's own uploads, and nothing else.
 *
 * The stock sources used to live here, which is why the drawer read as a grab bag —
 * a photo library and a stock search competing for the same scroll. Stock now has its
 * own rail item; this panel keeps the uploads, the quick inserts that act on them, and
 * a single pointer to Stock for everything the user did not shoot.
 *
 * The library itself is owned by the rail (which stays mounted), so switching drawers
 * no longer throws the session's uploads away.
 */
export const DesignerMediaPanel: React.FC<{
  uploads: MediaUpload[];
  onFiles: (files: FileList | null) => void;
  onPlace: (src: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onAddPlaceholder: () => void;
  onOpenAI: () => void;
  onOpenStock: () => void;
  notice?: string | null;
}> = ({
  uploads,
  onFiles,
  onPlace,
  onDelete,
  onClear,
  onAddPlaceholder,
  onOpenAI,
  onOpenStock,
  notice,
}) => {
  const persistent = isMediaLibraryPersistent();
  const totalBytes = uploads.reduce((sum, item) => sum + item.bytes, 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-shrink-0 space-y-1.5 border-b border-line-soft p-2.5">
        <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-tile bg-accent px-3 py-2 text-meta font-semibold text-white transition hover:bg-accent-hover">
          <Upload size={14} />
          <span>Upload from device</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              onFiles(event.target.files);
              event.target.value = '';
            }}
            className="hidden"
          />
        </label>
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={onAddPlaceholder}
            className="flex h-8 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-chip border border-line bg-surface text-2xs font-medium text-ink-body transition hover:bg-surface-sunken hover:text-accent-ink"
            title="Add a picture frame to fill later"
          >
            <ImageIcon size={13} className="text-accent" />
            <span>Frame</span>
          </button>
          <button
            type="button"
            onClick={onOpenAI}
            className="flex h-8 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-chip border border-line bg-surface text-2xs font-medium text-ink-body transition hover:bg-surface-sunken hover:text-accent-ink"
            title="Generate an image with AI"
          >
            <Wand2 size={13} className="text-accent" />
            <span>AI image</span>
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
        {uploads.length > 0 ? (
          <>
            <div className="mb-1.5 flex items-baseline justify-between gap-1">
              <h3 className="text-lead font-semibold text-ink">Uploaded</h3>
              <button
                type="button"
                onClick={onClear}
                title="Remove every upload from this device"
                className="cursor-pointer text-2xs text-ink-muted underline-offset-2 transition hover:text-accent-ink hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {uploads.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-square overflow-hidden rounded-tile bg-surface-sunken ring-1 ring-line transition hover:ring-accent-line"
                >
                  <button
                    type="button"
                    onClick={() => onPlace(item.dataUrl)}
                    title={`${item.name} — place on the page`}
                    className="h-full w-full cursor-pointer"
                  >
                    <img
                      src={item.dataUrl}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.04]"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
                      <Plus size={16} />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    title={`Remove ${item.name}`}
                    aria-label={`Remove ${item.name}`}
                    className="absolute right-0.5 top-0.5 grid h-4 w-4 cursor-pointer place-items-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-black/80 group-hover:opacity-100"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-2xs text-ink-muted">
              {persistent
                ? `Saved on this device · ${uploads.length} file${uploads.length === 1 ? '' : 's'} · ${formatBytes(totalBytes)}`
                : 'Private window: uploads last only for this session.'}
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 rounded-tile border border-dashed border-line px-3 py-8 text-center">
            <Images size={18} className="text-ink-muted" />
            <p className="text-meta font-medium text-ink-body">No uploads yet</p>
            <p className="text-2xs text-ink-muted">
              {persistent
                ? 'Logos and photos you upload are kept on this device, ready to place again.'
                : 'Private window: uploads will not be kept after this session.'}
            </p>
          </div>
        )}
      </div>

      {notice && (
        <p className="mx-2.5 mb-1 flex items-start gap-1 rounded-chip bg-surface-sunken px-2 py-1 text-2xs text-ink-secondary">
          <AlertCircle size={12} className="mt-px flex-shrink-0 text-ink-muted" />
          {notice}
        </p>
      )}

      <div className="flex-shrink-0 border-t border-line-soft p-2.5">
        <button
          type="button"
          onClick={onOpenStock}
          className="flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-chip border border-line bg-surface text-2xs font-medium text-ink-body transition hover:bg-surface-sunken hover:text-accent-ink"
        >
          <Images size={13} className="text-accent" />
          Photos you didn't shoot? Open Stock art
        </button>
      </div>
    </div>
  );
};
