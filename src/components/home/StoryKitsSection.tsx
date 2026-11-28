import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Download, Loader2, Package, Plus, Trash2 } from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import {
  FEATURED_PACK_ZIP,
  getAssetUrl,
  importAssetPackZip,
  listAssetPacks,
  uninstallAssetPack,
  type PackSummary,
} from '../../utils/assetStore';

/**
 * Story Kits — the asset packs, on the shelf.
 *
 * A pack is a set of pieces drawn to be used together (a backdrop, its frames, its stickers), so
 * the shelf shows the artwork rather than a file list: three thumbnails say more about a kit than
 * its manifest does. Installing one here is the same `importAssetPackZip` the editor's panel uses,
 * so a kit imported from Home is indistinguishable from one imported mid-design.
 */
export const StoryKitsSection: React.FC = () => {
  const { setIsAssetPackPanelOpen, openEditor, workspaceMode } = usePublisher();
  const [packs, setPacks] = useState<PackSummary[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const next = await listAssetPacks().catch(() => [] as PackSummary[]);
    setPacks(next);
    setLoading(false);

    const entries = await Promise.all(
      next.map(async (pack) => {
        const backdrops = pack.assets.filter((asset) => asset.layer === 'backdrop');
        const picks = [...backdrops, ...pack.assets].slice(0, 3);
        const urls = (
          await Promise.all(
            picks.map((asset) => getAssetUrl(pack, asset, 'thumb').catch(() => null))
          )
        ).filter((url): url is string => Boolean(url));
        return [pack.packId, urls] as const;
      })
    );
    setThumbs(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const importPack = async (file: File | undefined) => {
    if (!file) return;
    setBusy('import');
    setError(null);
    try {
      await importAssetPackZip(file);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That file is not a StudioPress kit.');
    } finally {
      setBusy(null);
      if (importRef.current) importRef.current.value = '';
    }
  };

  const removePack = async (packId: string) => {
    setBusy(packId);
    setError(null);
    try {
      await uninstallAssetPack(packId);
      await refresh();
    } catch {
      setError('That kit could not be removed.');
    } finally {
      setBusy(null);
    }
  };

  const useKit = () => {
    if (workspaceMode !== 'designer') setIsAssetPackPanelOpen(true);
    openEditor();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-1.5 text-lead font-bold tracking-[-0.01em] text-ink">
            <Package size={14} className="text-accent-ink" />
            Story Kits
          </h2>
          <p className="text-meta text-ink-muted">
            Backdrops, frames, stickers and badges drawn to be used together.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={FEATURED_PACK_ZIP}
            download
            className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-meta font-semibold text-ink-body transition-colors hover:border-accent-line hover:bg-accent-soft hover:text-accent-ink"
            title="Download a sample kit as a .zip"
          >
            <Download size={13} />
            Sample kit
          </a>
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            disabled={busy === 'import'}
            className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-meta font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60 cursor-pointer"
          >
            {busy === 'import' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Plus size={13} />
            )}
            Import kit (.zip)
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={(e) => void importPack(e.target.files?.[0])}
          />
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 rounded-chip border border-line bg-surface-sunken px-2.5 py-1.5 text-2xs text-ink-secondary">
          <AlertCircle size={12} className="text-red-500" />
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[132px] animate-pulse rounded-tile border border-line bg-surface-sunken" />
          ))}
        </div>
      ) : packs.length === 0 ? (
        <div className="rounded-tile border border-dashed border-line bg-surface-sunken px-6 py-10 text-center">
          <p className="text-body font-semibold text-ink">No kits available.</p>
          <p className="mt-1 text-meta text-ink-muted">
            This build shipped without its asset packs. Import a kit .zip to add one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack) => {
            const counts = pack.assets.reduce<Record<string, number>>((acc, asset) => {
              acc[asset.layer] = (acc[asset.layer] ?? 0) + 1;
              return acc;
            }, {});
            const urls = thumbs[pack.packId] ?? [];
            const isInstalled = pack.source === 'installed';

            return (
              <article
                key={pack.packId}
                className="flex flex-col gap-2.5 rounded-tile border border-line bg-surface p-3 transition-shadow hover:shadow-elevated"
              >
                <div className="flex gap-1.5">
                  {urls.length > 0 ? (
                    urls.map((url) => (
                      <span
                        key={url}
                        className="h-[86px] flex-1 overflow-hidden rounded-chip border border-line bg-surface-sunken"
                      >
                        <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
                      </span>
                    ))
                  ) : (
                    <span className="flex h-[86px] w-full items-center justify-center rounded-chip border border-line bg-surface-sunken text-ink-faint">
                      <Package size={20} />
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-body font-semibold text-ink">{pack.name}</h3>
                  <p className="truncate text-2xs text-ink-muted">
                    {counts.backdrop ?? 0} backdrops · {counts.frame ?? 0} frames ·{' '}
                    {counts.sticker ?? 0} stickers
                    {isInstalled ? ' · imported' : ' · included'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={useKit}
                    className="flex-1 rounded-chip bg-accent-soft px-2.5 py-1.5 text-meta font-semibold text-accent-ink transition-colors hover:bg-accent-soft-hover cursor-pointer"
                  >
                    Use in editor
                  </button>
                  {isInstalled && (
                    <button
                      type="button"
                      onClick={() => void removePack(pack.packId)}
                      disabled={busy === pack.packId}
                      aria-label={`Remove ${pack.name}`}
                      title="Remove this kit"
                      className="rounded-chip border border-line p-1.5 text-ink-muted transition-colors hover:border-red-200 hover:text-red-500 disabled:opacity-50 cursor-pointer"
                    >
                      {busy === pack.packId ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
