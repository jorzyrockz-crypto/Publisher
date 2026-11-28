import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Box, Download, Layers, Search, Trash2 } from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import {
  AssetPackError,
  filterAssets,
  getAssetDataUrl,
  getAssetUrl,
  importAssetPackZip,
  listAssetPacks,
  uninstallAssetPack,
  type AssetEntry,
  type AssetLayer,
  type PackSummary,
} from '../../utils/assetStore';

/**
 * Asset packs: one kit, laid out by what it is for.
 *
 * A pack is a set of pieces that were drawn to be used together — a backdrop, the frames that
 * sit on it, the stickers that go over both — so the picker is organised by layer rather than by
 * file name. Clicking a piece puts it on the page at the size the layer implies: a backdrop fills
 * the page and goes to the back, a frame spans the width at the edge it was drawn for, a sticker
 * arrives as a sticker.
 *
 * Everything is resolved through the asset store, which means the built-in kit and an imported
 * `.zip` behave the same, and an imported one still works with the network off.
 */

const LAYER_ORDER: AssetLayer[] = ['backdrop', 'frame', 'sticker', 'badge'];

const LAYER_LABELS: Record<AssetLayer | 'all', string> = {
  all: 'All',
  backdrop: 'Backdrops',
  frame: 'Frames',
  sticker: 'Stickers',
  badge: 'Badges',
};

export const AssetPackPanel: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { addImage, activePage } = usePublisher();
  const [packs, setPacks] = useState<PackSummary[]>([]);
  const [activePackId, setActivePackId] = useState<string | null>(null);
  const [layer, setLayer] = useState<AssetLayer | 'all'>('all');
  const [query, setQuery] = useState('');
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const next = await listAssetPacks();
    setPacks(next);
    setActivePackId((current) =>
      current && next.some((p) => p.packId === current) ? current : (next[0]?.packId ?? null)
    );
    if (next.length === 0) {
      setNotice({ kind: 'error', text: 'The starter kit is missing from this build.' });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activePack = useMemo(
    () => packs.find((p) => p.packId === activePackId) ?? null,
    [packs, activePackId]
  );

  // Thumbs are resolved once per pack: an imported pack reads blobs out of IndexedDB, and doing
  // that on every render would be the one slow thing in this panel.
  useEffect(() => {
    let cancelled = false;
    if (!activePack) return;
    (async () => {
      const entries = await Promise.all(
        activePack.assets.map(async (asset) => [asset.id, await getAssetUrl(activePack, asset, 'thumb')] as const)
      );
      if (cancelled) return;
      setThumbs((prev) => {
        const next = { ...prev };
        for (const [id, url] of entries) if (url) next[`${activePack.packId}:${id}`] = url;
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [activePack]);

  const layers = useMemo(() => {
    if (!activePack) return [] as Array<AssetLayer | 'all'>;
    const present = new Set(activePack.assets.map((a) => a.layer));
    return ['all' as const, ...LAYER_ORDER.filter((l) => present.has(l))];
  }, [activePack]);

  const visible = useMemo(
    () => (activePack ? filterAssets(activePack.assets, { layer, query }) : []),
    [activePack, layer, query]
  );

  const place = useCallback(
    async (asset: AssetEntry) => {
      if (!activePack) return;
      setNotice(null);
      try {
        const src = await getAssetDataUrl(activePack, asset, 'full');
        if (!src) {
          setNotice({ kind: 'error', text: `“${asset.label}” could not be read from the pack.` });
          return;
        }
        const pageW = activePage.width;
        const pageH = activePage.height;
        const ratio = asset.width / Math.max(1, asset.height);
        const centred = { x: 0, y: 0 };

        if (asset.layer === 'backdrop') {
          addImage(src, {
            name: asset.label,
            ...centred,
            width: pageW,
            height: pageH,
            objectFit: 'cover',
            aspectRatioLocked: false,
            zIndex: 0,
            locked: true,
          });
          return;
        }

        if (asset.layer === 'frame') {
          // A side border is drawn tall and thin, so it spans the height instead of the width.
          const vertical = asset.slot === 'left' || asset.slot === 'right';
          const width = vertical ? Math.round(pageH * ratio) : pageW;
          const height = vertical ? pageH : Math.round(pageW / ratio);
          const x = asset.slot === 'right' ? Math.max(0, pageW - width) : 0;
          const y = asset.slot === 'bottom' ? Math.max(0, pageH - height) : 0;
          addImage(src, {
            name: asset.label,
            x,
            y,
            width,
            height,
            objectFit: 'contain',
            aspectRatioLocked: false,
            zIndex: 20,
          });
          return;
        }

        // Stickers and badges: a size that reads without dominating, square-ish pieces pinned to
        // the middle of the page so they are found immediately.
        const max = asset.layer === 'badge' ? 180 : 260;
        const width = Math.round(ratio >= 1 ? max : max * ratio);
        const height = Math.round(ratio >= 1 ? max / ratio : max);
        addImage(src, {
          name: asset.label,
          x: Math.round((pageW - width) / 2),
          y: Math.round((pageH - height) / 2),
          width,
          height,
          objectFit: 'contain',
          zIndex: 20,
        });
      } catch (err) {
        setNotice({
          kind: 'error',
          text: err instanceof AssetPackError ? err.message : 'That asset could not be placed.',
        });
      }
    },
    [activePack, addImage, activePage]
  );

  const onImport = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setBusy(true);
      setNotice(null);
      try {
        const pack = await importAssetPackZip(file);
        await refresh();
        setActivePackId(pack.packId);
        setLayer('all');
        setNotice({
          kind: 'info',
          text: `Installed “${pack.name}” — ${pack.assets.length} pieces, works offline.`,
        });
      } catch (err) {
        setNotice({
          kind: 'error',
          text: err instanceof AssetPackError ? err.message : 'That pack could not be imported.',
        });
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  const onRemove = useCallback(async () => {
    if (!activePack || activePack.source !== 'installed') return;
    setBusy(true);
    try {
      await uninstallAssetPack(activePack.packId);
      await refresh();
      setNotice({ kind: 'info', text: `Removed “${activePack.name}”.` });
    } catch {
      setNotice({ kind: 'error', text: 'That pack could not be removed.' });
    } finally {
      setBusy(false);
    }
  }, [activePack, refresh]);

  const Wrapper = embedded ? 'div' : 'aside';
  const total = activePack?.assets.length ?? 0;

  return (
    <Wrapper
      className={
        embedded
          ? 'flex min-h-0 flex-1 flex-col'
          : 'flex h-full min-h-0 w-[340px] flex-shrink-0 flex-col border-l border-line-soft bg-surface'
      }
    >
      <div className="flex-shrink-0 space-y-2 border-b border-line-soft p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-meta font-semibold text-ink">
              <Box size={14} className="text-accent" />
              <span className="truncate">{activePack?.name ?? 'Asset packs'}</span>
            </div>
            <div className="text-[11px] text-ink-muted">
              {activePack
                ? `${total} pieces · v${activePack.version}${activePack.source === 'installed' ? ' · offline' : ' · included'}`
                : 'Nothing installed yet'}
            </div>
          </div>
          {activePack?.source === 'installed' && (
            <button
              type="button"
              onClick={onRemove}
              disabled={busy}
              title="Remove this pack from this device"
              className="rounded-chip border border-line-soft p-1.5 text-ink-muted transition hover:bg-surface-sunken hover:text-ink disabled:opacity-50"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {packs.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {packs.map((pack) => (
              <button
                key={pack.packId}
                type="button"
                onClick={() => setActivePackId(pack.packId)}
                className={`rounded-chip border px-2 py-1 text-[11px] font-medium transition ${
                  pack.packId === activePackId
                    ? 'border-accent bg-accent-soft text-ink'
                    : 'border-line-soft text-ink-muted hover:bg-surface-sunken'
                }`}
              >
                {pack.name}
              </button>
            ))}
          </div>
        )}

        <label className="relative block">
          <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search this pack — owl, leaves, sign…"
            className="w-full rounded-chip border border-line-soft bg-surface py-1.5 pl-7 pr-2 text-meta text-ink placeholder:text-ink-placeholder focus:border-accent focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap gap-1">
          {layers.map((item) => {
            const count =
              item === 'all'
                ? (activePack?.assets.length ?? 0)
                : (activePack?.assets.filter((a) => a.layer === item).length ?? 0);
            return (
              <button
                key={item}
                type="button"
                onClick={() => setLayer(item)}
                className={`rounded-chip border px-2 py-1 text-[11px] font-medium transition ${
                  layer === item
                    ? 'border-accent bg-accent text-white'
                    : 'border-line-soft text-ink-muted hover:bg-surface-sunken'
                }`}
              >
                {LAYER_LABELS[item]} <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {notice && (
        <div
          className={`flex flex-shrink-0 items-start gap-1.5 border-b border-line-soft px-2.5 py-2 text-[11px] ${
            notice.kind === 'error' ? 'text-rose-600' : 'text-ink-muted'
          }`}
        >
          <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
          <span>{notice.text}</span>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-10 text-center text-meta text-ink-muted">
            <Layers size={18} className="text-ink-faint" />
            <span>{query ? `Nothing matches “${query}”.` : 'No pieces in this layer.'}</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {visible.map((asset) => {
              const url = thumbs[`${activePack?.packId}:${asset.id}`];
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => void place(asset)}
                  title={`${asset.label} · ${asset.width}×${asset.height}`}
                  className="group flex flex-col overflow-hidden rounded-tile border border-line-soft bg-surface-sunken text-left transition hover:border-accent"
                >
                  <div className="relative flex aspect-square items-center justify-center bg-[repeating-conic-gradient(#e9edf2_0%_25%,#f6f8fa_0%_50%)] bg-[length:14px_14px]">
                    {url ? (
                      <img
                        src={url}
                        alt=""
                        loading="lazy"
                        className="max-h-full max-w-full object-contain"
                        draggable={false}
                      />
                    ) : (
                      <div className="h-6 w-6 animate-pulse rounded bg-line-soft" />
                    )}
                    <span className="absolute left-1 top-1 rounded-chip bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                      {asset.layer}
                    </span>
                  </div>
                  <span className="truncate px-1.5 py-1 text-[11px] font-medium text-ink group-hover:text-accent">
                    {asset.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 space-y-1 border-t border-line-soft p-2.5">
        <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-tile border border-line-soft px-3 py-2 text-meta font-semibold text-ink transition hover:bg-surface-sunken">
          <Download size={13} />
          <span>{busy ? 'Importing…' : 'Import a .zip pack'}</span>
          <input
            ref={importRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={(event) => {
              void onImport(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>
        <p className="px-1 text-[10px] leading-snug text-ink-faint">
          A pack is a folder with a manifest.json plus thumbs and full-size artwork. Imported packs
          are stored on this device and keep working offline.
        </p>
      </div>
    </Wrapper>
  );
};
