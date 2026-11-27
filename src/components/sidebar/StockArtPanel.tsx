import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { SAMPLE_GRAPHICS } from '../../constants/sampleGraphics';
import { useResizablePanel, useWindowWidth } from '../../hooks/useResizablePanel';
import {
  ClipartFreeItem,
  fetchClipartAsDataUrl,
  fetchIconifyAsDataUrl,
  fetchWikimediaAsDataUrl,
  getSavedClipartFreeKey,
  IconifyItem,
  saveClipartFreeKey,
  searchClipartFree,
  diagnoseClipartConnection,
  searchIconify,
  searchWikimedia,
  toProxiedClipartUrl,
  toProxiedWikimediaUrl,
  WikimediaItem,
} from '../../utils/clipartSearch';
import { getClipartProxyBase, saveClipartProxyBase } from '../../utils/apiEndpoints';
import {
  OpenverseItem,
  fetchOpenverseAsDataUrl,
  searchOpenverse,
} from '../../utils/openverseSearch';
import {
  OpenclipartItem,
  fetchOpenclipartSvgAsDataUrl,
  searchOpenclipart,
} from '../../utils/openclipartVectors';
import {
  OpenAccessItem,
  fetchOpenAccessAsDataUrl,
  searchOpenAccess,
} from '../../utils/openAccessArt';
import {
  UnsplashItem,
  UnsplashNotConfiguredError,
  UnsplashOrder,
  UnsplashOrientation,
  UNSPLASH_PROXY_HINT,
  fetchUnsplashAsDataUrl,
  searchUnsplash,
  trackUnsplashUse,
  unsplashCreditUrl,
} from '../../utils/unsplashSearch';
import {
  PexelsItem,
  PexelsNotConfiguredError,
  PexelsOrientation,
  PEXELS_PROXY_HINT,
  fetchPexelsAsDataUrl,
  searchPexels,
} from '../../utils/pexelsSearch';
import {
  PixabayItem,
  PixabayImageType,
  PixabayNotConfiguredError,
  PixabayOrientation,
  PIXABAY_PROXY_HINT,
  fetchPixabayAsDataUrl,
  searchPixabay,
} from '../../utils/pixabaySearch';
import {
  Images,
  Search,
  X,
  KeyRound,
  Loader2,
  Sparkles,
  AlertCircle,
  Sticker,
} from 'lucide-react';

type StockSourceFilter =
  | 'all'
  | 'builtin'
  | 'clipartfree'
  | 'iconify'
  | 'wikimedia'
  | 'openverse'
  | 'pixabay'
  | 'unsplash'
  | 'openart'
  | 'pexels'
  | 'oclipart';

interface UnifiedStockItem {
  uid: string;
  source:
    | 'builtin'
    | 'clipartfree'
    | 'iconify'
    | 'wikimedia'
    | 'openverse'
    | 'pixabay'
    | 'unsplash'
    | 'openart'
    | 'pexels'
    | 'oclipart';
  sourceLabel: string;
  title: string;
  thumbUrl: string;
  isSvg: boolean;
  width: number;
  height: number;
  rawBuiltinSrc?: string;
  rawClipartFree?: ClipartFreeItem;
  rawIconify?: IconifyItem;
  rawWikimedia?: WikimediaItem;
  rawOpenverse?: OpenverseItem;
  rawPixabay?: PixabayItem;
  rawUnsplash?: UnsplashItem;
  rawOpenAccess?: OpenAccessItem;
  rawPexels?: PexelsItem;
  rawOpenclipart?: OpenclipartItem;
  /** Photographer credit — required wherever Pixabay results are shown. */
  credit?: string;
}

/**
 * A row of small toggle chips. Pixabay and Unsplash each expose a couple of
 * filters; the other sources have none, so this keeps those rows identical.
 */
function FilterChipRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-2xs font-bold uppercase tracking-[0.08em] text-ink-placeholder mr-0.5">
        {label}
      </span>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`px-1.5 py-0.5 rounded-chip text-2xs font-semibold transition cursor-pointer ${
            value === opt.id
              ? 'bg-accent-soft text-accent-ink'
              : 'bg-surface-sunken text-ink-secondary hover:bg-accent-soft-hover hover:text-accent-ink'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** "Load more" plus the licence/attribution line both keyed sources need. */
function ResultPaging({
  total,
  page,
  perPage,
  loading,
  onMore,
  credit,
}: {
  total: number;
  page: number;
  perPage: number;
  loading: boolean;
  onMore: () => void;
  credit: React.ReactNode;
}) {
  const capped = Math.min(total, 500);
  return (
    <div className="space-y-1.5 pt-0.5">
      {page * perPage < capped && (
        <button
          type="button"
          disabled={loading}
          onClick={onMore}
          className="w-full py-1 rounded-tile border border-accent-line bg-white hover:bg-accent-soft-hover text-accent-ink text-2xs font-bold transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1"
        >
          {loading ? (
            <>
              <Loader2 size={11} className="animate-spin" /> Loading…
            </>
          ) : (
            `Load more (${capped} available)`
          )}
        </button>
      )}
      <p className="text-2xs leading-snug text-ink-placeholder text-center">{credit}</p>
    </div>
  );
}

const PIXABAY_TYPE_OPTIONS = [
  { id: 'photo', label: 'Photos' },
  { id: 'illustration', label: 'Illos' },
  { id: 'vector', label: 'Vectors' },
  { id: 'all', label: 'Any' },
] as const;

const PIXABAY_SHAPE_OPTIONS = [
  { id: 'all', label: 'Any' },
  { id: 'horizontal', label: 'Landscape' },
  { id: 'vertical', label: 'Portrait' },
] as const;

const PEXELS_SHAPE_OPTIONS = [
  { id: 'all', label: 'Any' },
  { id: 'landscape', label: 'Landscape' },
  { id: 'portrait', label: 'Portrait' },
  { id: 'square', label: 'Square' },
] as const;

const UNSPLASH_SHAPE_OPTIONS = [
  { id: 'all', label: 'Any' },
  { id: 'landscape', label: 'Landscape' },
  { id: 'portrait', label: 'Portrait' },
  { id: 'squarish', label: 'Square' },
] as const;

const UNSPLASH_ORDER_OPTIONS = [
  { id: 'relevant', label: 'Relevant' },
  { id: 'latest', label: 'Latest' },
] as const;

const QUICK_SEARCH_CHIPS = [
  'graduation',
  'trophy',
  'cat',
  'floral',
  'star',
  'certificate',
  'ribbon',
  'book',
];

export const StockArtPanel: React.FC = () => {
  const { isStockArtPanelOpen, setIsStockArtPanelOpen, addImage, activePage } = usePublisher();

  const [query, setQuery] = useState('graduation');
  const [sourceFilter, setSourceFilter] = useState<StockSourceFilter>('all');
  const [svgOnly, setSvgOnly] = useState(false);

  // No hardcoded fallback: a baked-in key would be published with the bundle.
  // Static deployments use the server-side proxy (api/clipart.js) instead.
  const [clipartApiKey, setClipartApiKey] = useState<string>(() => getSavedClipartFreeKey());
  const [showKeyBar, setShowKeyBar] = useState(false);
  const [clipartProxyUrl, setClipartProxyUrl] = useState<string>(() => getClipartProxyBase());
  const [cfTest, setCfTest] = useState<{ ok: boolean; message: string } | null>(null);
  const [isTestingCf, setIsTestingCf] = useState(false);

  // Per-source results & loading states so fast sources render immediately
  const [builtinItems, setBuiltinItems] = useState<UnifiedStockItem[]>([]);
  const [cfItems, setCfItems] = useState<UnifiedStockItem[]>([]);
  const [iconifyItems, setIconifyItems] = useState<UnifiedStockItem[]>([]);
  const [wikiItems, setWikiItems] = useState<UnifiedStockItem[]>([]);
  const [ovItems, setOvItems] = useState<UnifiedStockItem[]>([]);
  const [pbItems, setPbItems] = useState<UnifiedStockItem[]>([]);

  // Pixabay's own filters and paging. The key lives on the server, so the only
  // client-side state is what the user is browsing.
  const [pbImageType, setPbImageType] = useState<PixabayImageType>('photo');
  const [pbOrientation, setPbOrientation] = useState<PixabayOrientation>('all');
  const [pbPage, setPbPage] = useState(1);
  const [pbTotal, setPbTotal] = useState(0);
  const [pbLoadingMore, setPbLoadingMore] = useState(false);
  // Set when the deployment has no PIXABAY_API_KEY — shown as a quiet notice
  // instead of a scary error, since the rest of the panel still works.
  const [pixabayUnavailable, setPixabayUnavailable] = useState(false);

  // Unsplash: hotlinked photos, oriented/ordered the same way.
  const [unItems, setUnItems] = useState<UnifiedStockItem[]>([]);
  const [unOrientation, setUnOrientation] = useState<UnsplashOrientation>('all');
  const [unOrder, setUnOrder] = useState<UnsplashOrder>('relevant');
  const [unPage, setUnPage] = useState(1);
  const [unTotal, setUnTotal] = useState(0);
  const [unLoadingMore, setUnLoadingMore] = useState(false);
  const [unsplashUnavailable, setUnsplashUnavailable] = useState(false);

  // Public-domain museum art (Art Institute of Chicago + Cleveland).
  const [oaItems, setOaItems] = useState<UnifiedStockItem[]>([]);
  const [oaTotal, setOaTotal] = useState(0);
  const [oaPage, setOaPage] = useState(1);
  const [oaLoadingMore, setOaLoadingMore] = useState(false);

  // Pexels: key lives on the server, exactly like Pixabay. 200 requests/hour on
  // the free tier, which is why the relay caches and the panel asks for a page at
  // a time.
  const [pxItems, setPxItems] = useState<UnifiedStockItem[]>([]);
  const [pxOrientation, setPxOrientation] = useState<PexelsOrientation>('all');
  const [pxPage, setPxPage] = useState(1);
  const [pxTotal, setPxTotal] = useState(0);
  const [pxLoadingMore, setPxLoadingMore] = useState(false);
  // Set when the deployment has no PEXELS_API_KEY: a quiet notice, because a
  // missing key in a fresh deployment is a setup step, not a failure.
  const [pexelsUnavailable, setPexelsUnavailable] = useState(false);
  // Pexels paused new API key issuance (their own API page says so), so a fresh
  // deployment will never have one. Rather than leave a tab that only ever says
  // "add a key", ask the relay once and hide the source unless it is configured.
  // `null` means "not asked yet" — the tab stays hidden until the answer is in.
  const [pexelsConfigured, setPexelsConfigured] = useState<boolean | null>(null);

  // Openclipart: the only true-vector source. Keyless, CC0, and the reason the
  // panel can offer clip art that stays sharp at poster size.
  const [ocItems, setOcItems] = useState<UnifiedStockItem[]>([]);
  const [ocPage, setOcPage] = useState(1);
  const [ocTotal, setOcTotal] = useState(0);
  const [ocLoadingMore, setOcLoadingMore] = useState(false);

  const [loadingSources, setLoadingSources] = useState({
    clipartfree: false,
    iconify: false,
    wikimedia: false,
    openverse: false,
    pixabay: false,
    unsplash: false,
    openart: false,
    pexels: false,
    oclipart: false,
  });
  const [sourceErrors, setSourceErrors] = useState<string[]>([]);
  // Sources the user chose not to retry (persisted), e.g. because the host has
  // no route to them. Keeps a dead third-party API from complaining every search.
  const [disabledSources, setDisabledSources] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('studiopress_disabled_sources');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  });
  const [insertingUid, setInsertingUid] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const pbAbortRef = useRef<AbortController | null>(null);
  const unAbortRef = useRef<AbortController | null>(null);
  const oaAbortRef = useRef<AbortController | null>(null);
  const pxAbortRef = useRef<AbortController | null>(null);
  const ocAbortRef = useRef<AbortController | null>(null);
  const hasAutoSearchedRef = useRef(false);

  const setSourceDisabled = (source: string, disabled: boolean) => {
    setDisabledSources((prev) => {
      const next = disabled ? Array.from(new Set([...prev, source])) : prev.filter((x) => x !== source);
      try {
        localStorage.setItem('studiopress_disabled_sources', JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const pbEnabled = !disabledSources.includes('pixabay');

  const mapPixabayItems = (items: PixabayItem[]): UnifiedStockItem[] =>
    items.map((item) => ({
      uid: `pb-${item.id}`,
      source: 'pixabay' as const,
      sourceLabel: 'Pixabay',
      title: item.title,
      thumbUrl: item.thumbUrl,
      isSvg: item.type === 'vector',
      width: item.width,
      height: item.height,
      rawPixabay: item,
      credit: item.user,
    }));

  /** Runs only the Pixabay leg — used by its filter chips and pagination. */
  const runPixabaySearch = (q: string, page = 1, keepItems = false, signal?: AbortSignal) => {
    if (!pbEnabled || !q) {
      setPbItems([]);
      setPbTotal(0);
      setLoadingSources((prev) => ({ ...prev, pixabay: false }));
      return;
    }
    if (!signal) {
      pbAbortRef.current?.abort();
      const controller = new AbortController();
      pbAbortRef.current = controller;
      signal = controller.signal;
    }
    if (page === 1) setLoadingSources((s) => ({ ...s, pixabay: true }));
    else setPbLoadingMore(true);

    searchPixabay(q, {
      page,
      perPage: 18,
      imageType: pbImageType,
      orientation: pbOrientation,
      signal,
    })
      .then((res) => {
        if (signal?.aborted) return;
        setPixabayUnavailable(false);
        setPbTotal(res.total);
        setPbPage(page);
        setPbItems((prev) => {
          const next = mapPixabayItems(res.items);
          if (!keepItems || page === 1) return next;
          const seen = new Set(prev.map((i) => i.uid));
          return [...prev, ...next.filter((i) => !seen.has(i.uid))];
        });
      })
      .catch((err) => {
        if (signal?.aborted) return;
        if (err instanceof PixabayNotConfiguredError) {
          setPixabayUnavailable(true);
          setPbItems([]);
          setPbTotal(0);
          return;
        }
        if (page === 1) setPbItems([]);
        setSourceErrors((prev) => [
          ...prev,
          `Pixabay: ${err instanceof Error ? err.message : 'Error'}`,
        ]);
      })
      .finally(() => {
        if (signal?.aborted) return;
        setLoadingSources((s) => ({ ...s, pixabay: false }));
        setPbLoadingMore(false);
      });
  };

  const unEnabled = !disabledSources.includes('unsplash');

  const mapUnsplashItems = (items: UnsplashItem[]): UnifiedStockItem[] =>
    items.map((item) => ({
      uid: `un-${item.id}`,
      source: 'unsplash' as const,
      sourceLabel: 'Unsplash',
      title: item.title,
      thumbUrl: item.thumbUrl,
      isSvg: false,
      width: item.width,
      height: item.height,
      rawUnsplash: item,
      credit: item.user ? `by ${item.user}` : 'Unsplash',
    }));

  /** Runs only the Unsplash leg — used by its filter chips and pagination. */
  const runUnsplashSearch = (q: string, page = 1, keepItems = false, signal?: AbortSignal) => {
    if (!unEnabled || !q) {
      setUnItems([]);
      setUnTotal(0);
      setLoadingSources((prev) => ({ ...prev, unsplash: false }));
      return;
    }
    if (!signal) {
      unAbortRef.current?.abort();
      const controller = new AbortController();
      unAbortRef.current = controller;
      signal = controller.signal;
    }
    if (page === 1) setLoadingSources((s) => ({ ...s, unsplash: true }));
    else setUnLoadingMore(true);

    searchUnsplash(q, {
      page,
      perPage: 18,
      orientation: unOrientation,
      orderBy: unOrder,
      signal,
    })
      .then((res) => {
        if (signal?.aborted) return;
        setUnsplashUnavailable(false);
        setUnTotal(res.total);
        setUnPage(page);
        setUnItems((prev) => {
          const next = mapUnsplashItems(res.items);
          if (!keepItems || page === 1) return next;
          const seen = new Set(prev.map((i) => i.uid));
          return [...prev, ...next.filter((i) => !seen.has(i.uid))];
        });
      })
      .catch((err) => {
        if (signal?.aborted) return;
        if (err instanceof UnsplashNotConfiguredError) {
          setUnsplashUnavailable(true);
          setUnItems([]);
          setUnTotal(0);
          return;
        }
        if (page === 1) setUnItems([]);
        setSourceErrors((prev) => [
          ...prev,
          `Unsplash: ${err instanceof Error ? err.message : 'Error'}`,
        ]);
      })
      .finally(() => {
        if (signal?.aborted) return;
        setLoadingSources((s) => ({ ...s, unsplash: false }));
        setUnLoadingMore(false);
      });
  };

  const mapOpenclipartItems = (items: OpenclipartItem[]): UnifiedStockItem[] =>
    items.map((item) => ({
      uid: `oc-${item.id}`,
      source: 'oclipart' as const,
      sourceLabel: 'Openclipart',
      title: item.title,
      thumbUrl: item.thumbUrl,
      isSvg: true,
      // CC0 clip art has no intrinsic pixel size: keep it square and let the
      // vector scale, so inserts are not forced into a photo aspect ratio.
      width: 1000,
      height: 1000,
      rawOpenclipart: item,
    }));

  /** Runs only the Openclipart leg — keyless, so it is always attempted. */
  const runOpenclipartSearch = (q: string, page = 1, keepItems = false, signal?: AbortSignal) => {
    if (!q) {
      setOcItems([]);
      setOcTotal(0);
      setLoadingSources((prev) => ({ ...prev, oclipart: false }));
      return;
    }
    if (!signal) {
      ocAbortRef.current?.abort();
      const controller = new AbortController();
      ocAbortRef.current = controller;
      signal = controller.signal;
    }
    if (page === 1) setLoadingSources((s) => ({ ...s, oclipart: true }));
    else setOcLoadingMore(true);

    searchOpenclipart(q, { page, signal })
      .then((res) => {
        if (signal?.aborted) return;
        setOcTotal(res.total);
        setOcPage(page);
        const next = mapOpenclipartItems(res.items);
        setOcItems((prev) => {
          if (!keepItems || page === 1) return next;
          const seen = new Set(prev.map((i) => i.uid));
          return [...prev, ...next.filter((i) => !seen.has(i.uid))];
        });
      })
      .catch((err) => {
        if (signal?.aborted) return;
        if (page === 1) setOcItems([]);
        setSourceErrors((prev) => [
          ...prev,
          `Openclipart: ${err instanceof Error ? err.message : 'Error'}`,
        ]);
      })
      .finally(() => {
        if (signal?.aborted) return;
        setLoadingSources((s) => ({ ...s, oclipart: false }));
        setOcLoadingMore(false);
      });
  };

  // `pexelsConfigured === true` only; unknown and false both keep it off.
  const pxEnabled = pexelsConfigured === true && !disabledSources.includes('pexels');

  const mapPexelsItems = (items: PexelsItem[]): UnifiedStockItem[] =>
    items.map((item) => ({
      uid: `px-${item.id}`,
      source: 'pexels' as const,
      sourceLabel: 'Pexels',
      title: item.title,
      thumbUrl: item.thumbUrl,
      isSvg: false,
      width: item.width,
      height: item.height,
      rawPexels: item,
      credit: item.photographer,
    }));

  /** Runs only the Pexels leg — used by its shape chips and pagination. */
  const runPexelsSearch = (q: string, page = 1, keepItems = false, signal?: AbortSignal) => {
    if (!pxEnabled || !q) {
      setPxItems([]);
      setPxTotal(0);
      setLoadingSources((prev) => ({ ...prev, pexels: false }));
      return;
    }
    if (!signal) {
      pxAbortRef.current?.abort();
      const controller = new AbortController();
      pxAbortRef.current = controller;
      signal = controller.signal;
    }
    if (page === 1) setLoadingSources((s) => ({ ...s, pexels: true }));
    else setPxLoadingMore(true);

    searchPexels(q, { page, perPage: 18, orientation: pxOrientation, signal })
      .then((res) => {
        if (signal?.aborted) return;
        setPexelsUnavailable(false);
        setPxTotal(res.total);
        setPxPage(page);
        const next = mapPexelsItems(res.items);
        setPxItems((prev) => {
          if (!keepItems || page === 1) return next;
          const seen = new Set(prev.map((i) => i.uid));
          return [...prev, ...next.filter((i) => !seen.has(i.uid))];
        });
      })
      .catch((err) => {
        if (signal?.aborted) return;
        if (err instanceof PexelsNotConfiguredError) {
          setPexelsUnavailable(true);
          setPxItems([]);
          setPxTotal(0);
          return;
        }
        if (page === 1) setPxItems([]);
        setSourceErrors((prev) => [...prev, `Pexels: ${err instanceof Error ? err.message : 'Error'}`]);
      })
      .finally(() => {
        if (signal?.aborted) return;
        setLoadingSources((s) => ({ ...s, pexels: false }));
        setPxLoadingMore(false);
      });
  };

  const runOpenAccessSearch = (q: string, page = 1, keepItems = false, signal?: AbortSignal) => {
    if (!q) {
      setOaItems([]);
      setOaTotal(0);
      setLoadingSources((prev) => ({ ...prev, openart: false }));
      return;
    }
    if (!signal) {
      oaAbortRef.current?.abort();
      const controller = new AbortController();
      oaAbortRef.current = controller;
      signal = controller.signal;
    }
    if (page === 1) setLoadingSources((s) => ({ ...s, openart: true }));
    else setOaLoadingMore(true);

    searchOpenAccess(q, { page, limit: 18, signal })
      .then((res) => {
        if (signal?.aborted) return;
        setOaTotal(res.total);
        setOaPage(page);
        const mapped: UnifiedStockItem[] = res.items.map((item) => ({
          uid: `oa-${item.source}-${item.id}`,
          source: 'openart' as const,
          sourceLabel: item.museum,
          title: item.title,
          thumbUrl: item.thumbUrl,
          isSvg: false,
          width: 900,
          height: 900,
          rawOpenAccess: item,
          credit: item.creator || item.museum,
        }));
        setOaItems((prev) => {
          if (!keepItems || page === 1) return mapped;
          const seen = new Set(prev.map((i) => i.uid));
          return [...prev, ...mapped.filter((i) => !seen.has(i.uid))];
        });
      })
      .catch((err) => {
        if (signal?.aborted) return;
        if (page === 1) setOaItems([]);
        setSourceErrors((prev) => [
          ...prev,
          `Museum art: ${err instanceof Error ? err.message : 'Error'}`,
        ]);
      })
      .finally(() => {
        if (signal?.aborted) return;
        setLoadingSources((s) => ({ ...s, openart: false }));
        setOaLoadingMore(false);
      });
  };

  const runUnifiedSearch = (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) {
      // If empty query, show all built-in graphics
      setBuiltinItems(
        SAMPLE_GRAPHICS.map((g) => ({
          uid: `builtin-${g.id}`,
          source: 'builtin',
          sourceLabel: 'Built-in',
          title: g.name,
          thumbUrl: g.src,
          isSvg: g.src.startsWith('data:image/svg+xml'),
          width: 200,
          height: 200,
          rawBuiltinSrc: g.src,
        }))
      );
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSourceErrors([]);
    const cfEnabled = !disabledSources.includes('clipartfree');
    setLoadingSources({
      clipartfree: cfEnabled,
      iconify: true,
      wikimedia: true,
      openverse: true,
      pixabay: pbEnabled,
      unsplash: unEnabled,
      openart: true,
      pexels: pxEnabled,
      oclipart: true,
    });

    // 1. Built-in (instant local filter)
    const lowerQ = q.toLowerCase();
    const matchedBuiltin = SAMPLE_GRAPHICS.filter(
      (g) => g.name.toLowerCase().includes(lowerQ) || g.category.toLowerCase().includes(lowerQ)
    ).map((g) => ({
      uid: `builtin-${g.id}`,
      source: 'builtin' as const,
      sourceLabel: 'Built-in',
      title: g.name,
      thumbUrl: g.src,
      isSvg: g.src.startsWith('data:image/svg+xml'),
      width: 200,
      height: 200,
      rawBuiltinSrc: g.src,
    }));
    setBuiltinItems(matchedBuiltin);

    // 2. Clipart.Free (CC0) — skipped when the user disabled the source
    if (cfEnabled) {
    searchClipartFree(q, { apiKey: clipartApiKey, signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        const mapped: UnifiedStockItem[] = (res.results || []).slice(0, 18).map((item) => ({
          uid: `cf-${item.slug}`,
          source: 'clipartfree',
          sourceLabel: 'Clipart.Free',
          title: item.title || item.slug,
          thumbUrl: toProxiedClipartUrl(item.png_urls?.['400'] || item.svg_url),
          isSvg: Boolean(item.svg_url),
          width: item.width || 220,
          height: item.height || 220,
          rawClipartFree: item,
        }));
        setCfItems(mapped);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setCfItems([]);
        const msg = err instanceof Error ? err.message : 'Error';
        setSourceErrors((prev) => [
          ...prev,
          msg.startsWith('Clipart.Free') ? msg : `Clipart.Free: ${msg}`,
        ]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingSources((s) => ({ ...s, clipartfree: false }));
        }
      });
    } else {
      setCfItems([]);
    }

    // 3. Iconify (200k+ SVG icons & color illustrations)
    searchIconify(q, { limit: 24, signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        const mapped: UnifiedStockItem[] = res.items.map((item) => ({
          uid: `iconify-${item.id}`,
          source: 'iconify',
          sourceLabel: 'Iconify',
          title: item.name.replace(/-/g, ' '),
          thumbUrl: item.previewUrl,
          isSvg: true,
          width: 140,
          height: 140,
          rawIconify: item,
        }));
        setIconifyItems(mapped);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setIconifyItems([]);
        setSourceErrors((prev) => [
          ...prev,
          `Iconify: ${err instanceof Error ? err.message : 'Error'}`,
        ]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingSources((s) => ({ ...s, iconify: false }));
        }
      });

    // 5. Openverse — keyless, CORS-enabled CC imagery (works without a proxy)
    searchOpenverse(q, { limit: 16, signal: controller.signal })
      .then((items) => {
        if (controller.signal.aborted) return;
        setOvItems(
          items.map((item) => ({
            uid: `ov-${item.id}`,
            source: 'openverse' as const,
            sourceLabel: 'Openverse',
            title: item.title,
            thumbUrl: item.thumbUrl,
            isSvg: item.isSvg,
            width: item.width,
            height: item.height,
            rawOpenverse: item,
          }))
        );
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setOvItems([]);
        setSourceErrors((prev) => [
          ...prev,
          `Openverse: ${err instanceof Error ? err.message : 'Error'}`,
        ]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingSources((s) => ({ ...s, openverse: false }));
        }
      });

    // 4. Wikimedia Commons (SVGs & CC/PD media)
    searchWikimedia(q, { filter: 'all', limit: 16, signal: controller.signal })
      .then((items) => {
        if (controller.signal.aborted) return;
        const mapped: UnifiedStockItem[] = items.map((item) => ({
          uid: `wiki-${item.pageid}`,
          source: 'wikimedia',
          sourceLabel: 'Wikimedia',
          title: item.cleanTitle,
          thumbUrl: toProxiedWikimediaUrl(item.thumbUrl),
          isSvg: item.mime === 'image/svg+xml',
          width: item.width || 240,
          height: item.height || 240,
          rawWikimedia: item,
        }));
        setWikiItems(mapped);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setWikiItems([]);
        setSourceErrors((prev) => [
          ...prev,
          `Wikimedia: ${err instanceof Error ? err.message : 'Error'}`,
        ]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingSources((s) => ({ ...s, wikimedia: false }));
        }
      });

    // 6. Pixabay — free stock photos/illustrations/vectors via the serverless
    // relay (the key must never reach the browser). Degrades quietly when the
    // deployment has no key configured.
    runPixabaySearch(q, 1, false);

    // 7. Unsplash — hotlinked photos; only search and download-tracking touch
    // our server, because the access key must stay off the client.
    runUnsplashSearch(q, 1, false);

    // 8. Public-domain museum art — keyless, CC0, and the best source in the
    // panel for engravings, ornaments and botanical plates.
    runOpenAccessSearch(q, 1, false, controller.signal);

    // 9. Pexels — free photos through the relay. Quietly absent until the
    // deployment has a PEXELS_API_KEY.
    runPexelsSearch(q, 1, false, controller.signal);

    // 10. Openclipart — CC0 SVG clip art, keyless. True vectors, so no search is
    // really complete without it.
    runOpenclipartSearch(q, 1, false, controller.signal);
  };

  // Ask the relay once whether this deployment holds a PEXELS_API_KEY. No key,
  // no upstream call, no cost — `mode=diag` only reports what the function sees.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/pexels?mode=diag', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { configured?: boolean } | null) => {
        if (!cancelled) setPexelsConfigured(Boolean(data?.configured));
      })
      .catch(() => {
        // No relay (static hosting) or offline: leave the source hidden.
        if (!cancelled) setPexelsConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-run initial unified search when the panel first opens, and reactively debounce live typing
  useEffect(() => {
    if (!isStockArtPanelOpen) return;
    if (!hasAutoSearchedRef.current) {
      hasAutoSearchedRef.current = true;
      runUnifiedSearch(query);
      return;
    }
    const timer = window.setTimeout(() => {
      runUnifiedSearch(query);
    }, 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStockArtPanelOpen, query]);

  // Interleave results when viewing "All Sources" so users see diverse results from every source right away
  const combinedResults = useMemo(() => {
    let list: UnifiedStockItem[] = [];
    if (sourceFilter === 'all') {
      const buckets = [
        builtinItems,
        cfItems,
        iconifyItems,
        wikiItems,
        ovItems,
        pbItems,
        unItems,
        oaItems,
        pxItems,
        ocItems,
      ];
      const maxLen = Math.max(...buckets.map((b) => b.length), 0);
      for (let i = 0; i < maxLen; i++) {
        for (const bucket of buckets) {
          if (bucket[i]) list.push(bucket[i]);
        }
      }
    } else if (sourceFilter === 'builtin') {
      list = builtinItems;
    } else if (sourceFilter === 'clipartfree') {
      list = cfItems;
    } else if (sourceFilter === 'iconify') {
      list = iconifyItems;
    } else if (sourceFilter === 'openverse') {
      list = ovItems;
    } else if (sourceFilter === 'pixabay') {
      list = pbItems;
    } else if (sourceFilter === 'unsplash') {
      list = unItems;
    } else if (sourceFilter === 'openart') {
      list = oaItems;
    } else if (sourceFilter === 'pexels') {
      list = pxItems;
    } else if (sourceFilter === 'oclipart') {
      list = ocItems;
    } else {
      list = wikiItems;
    }

    if (svgOnly) {
      list = list.filter((item) => item.isSvg);
    }
    return list;
  }, [
    sourceFilter,
    svgOnly,
    builtinItems,
    cfItems,
    iconifyItems,
    wikiItems,
    ovItems,
    pbItems,
    unItems,
    oaItems,
    pxItems,
    ocItems,
  ]);

  const isAnyLoading =
    loadingSources.clipartfree ||
    loadingSources.iconify ||
    loadingSources.wikimedia ||
    loadingSources.openverse ||
    loadingSources.pixabay ||
    loadingSources.unsplash ||
    loadingSources.openart ||
    loadingSources.pexels ||
    loadingSources.oclipart;

  const handleInsertItem = async (item: UnifiedStockItem, asSticker = false) => {
    setInsertingUid(item.uid);
    try {
      let dataUrl = '';
      if (item.source === 'builtin' && item.rawBuiltinSrc) {
        dataUrl = item.rawBuiltinSrc;
      } else if (item.source === 'clipartfree' && item.rawClipartFree) {
        dataUrl = await fetchClipartAsDataUrl(item.rawClipartFree);
      } else if (item.source === 'iconify' && item.rawIconify) {
        dataUrl = await fetchIconifyAsDataUrl(item.rawIconify);
      } else if (item.source === 'wikimedia' && item.rawWikimedia) {
        dataUrl = await fetchWikimediaAsDataUrl(item.rawWikimedia);
      } else if (item.source === 'openverse' && item.rawOpenverse) {
        dataUrl = await fetchOpenverseAsDataUrl(item.rawOpenverse);
      } else if (item.source === 'oclipart' && item.rawOpenclipart) {
        // CC0 vector: stored as an SVG data URL, so it scales without a trace of
        // pixelation in the PNG and PDF exports.
        dataUrl = await fetchOpenclipartSvgAsDataUrl(item.rawOpenclipart);
      } else if (item.source === 'pexels' && item.rawPexels) {
        // Bytes, not a hotlink: the document must keep working without Pexels.
        dataUrl = await fetchPexelsAsDataUrl(item.rawPexels);
      } else if (item.source === 'openart' && item.rawOpenAccess) {
        dataUrl = await fetchOpenAccessAsDataUrl(item.rawOpenAccess);
      } else if (item.source === 'unsplash' && item.rawUnsplash) {
        // Hotlinked straight from images.unsplash.com (CORS-enabled), then kept
        // inside the user's own document. Record the required "use" event.
        void trackUnsplashUse(item.rawUnsplash);
        dataUrl = await fetchUnsplashAsDataUrl(item.rawUnsplash);
      } else if (item.source === 'pixabay' && item.rawPixabay) {
        // Copied into the project as a data URL: Pixabay forbids permanent
        // hotlinking, and a remote URL would taint the export canvas.
        dataUrl = await fetchPixabayAsDataUrl(item.rawPixabay);
      }

      if (!dataUrl) return;

      const maxDim =
        asSticker
          ? 180
          : item.source === 'pixabay' ||
              item.source === 'unsplash' ||
              item.source === 'openart' ||
              item.source === 'pexels'
            ? 280
            : 220;
      const ratio = item.width && item.height ? item.width / item.height : 1;
      const width = Math.max(48, ratio >= 1 ? maxDim : Math.round(maxDim * ratio));
      const height = Math.max(48, ratio >= 1 ? Math.round(maxDim / ratio) : maxDim);

      addImage(dataUrl, {
        name: item.title.slice(0, 32),
        width,
        height,
        x: Math.round((activePage.width - width) / 2),
        y: Math.round((activePage.height - height) / 2),
        objectFit: item.isSvg || asSticker ? 'contain' : 'cover',
        // Stock art is transparent clip art: any outline here reads as a box
        // around the drawing, so never frame it on insert.
        borderWidth: 0,
        ...(asSticker
          ? {
              effectPreset: 'sticker' as const,
              isSticker: true,
              stickerOutlineColor: '#ffffff',
              stickerOutlineWidth: 5,
              stickerFinish: 'matte' as const,
            }
          : {}),
      });
    } catch (err) {
      setSourceErrors((prev) => [
        ...prev,
        `Insert failed: ${err instanceof Error ? err.message : 'Error'}`,
      ]);
    } finally {
      setInsertingUid(null);
    }
  };

  const windowWidth = useWindowWidth();
  const isNarrowViewport = windowWidth < 1024;
  const {
    width: panelWidth,
    isDragging: isResizing,
    onMouseDown: handleResizeStart,
    resetWidth,
  } = useResizablePanel({
    storageKey: 'studiopress_stock_panel_width',
    defaultWidth: 320,
    minWidth: 260,
    maxWidth: 520,
    edge: 'left',
  });

  if (!isStockArtPanelOpen) return null;

  const totalAllCount =
    builtinItems.length +
    cfItems.length +
    iconifyItems.length +
    wikiItems.length +
    ovItems.length +
    pbItems.length +
    unItems.length +
    oaItems.length +
    pxItems.length +
    ocItems.length;

  return (
    <aside
      style={{ width: panelWidth }}
      className={`bg-white border-l border-line flex flex-col h-full flex-shrink-0 select-none text-ink ${
        isNarrowViewport ? 'absolute right-0 top-0 bottom-0 z-30 shadow-[0_8px_28px_rgba(28,44,58,0.12)]' : 'relative z-20'
      } ${isResizing ? '' : 'transition-[width] duration-150'}`}
    >
      {/* Drag-to-resize handle on left edge */}
      <div
        onMouseDown={handleResizeStart}
        onDoubleClick={resetWidth}
        title="Drag to resize • Double-click to reset"
        className={`absolute top-0 left-0 bottom-0 w-1.5 cursor-col-resize z-30 transition-colors ${
          isResizing ? 'bg-accent' : 'hover:bg-accent/50'
        }`}
      />
      {/* Inspector-style Header */}
      <div className="px-4 py-3 border-b border-line bg-surface flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-tile bg-accent-soft text-accent-ink flex items-center justify-center">
            <Images size={14} />
          </div>
          <div>
            <h3 className="text-lead font-semibold text-ink leading-tight">
              Stock Art & Clipart
            </h3>
            <p className="text-2xs text-ink-muted leading-tight">
              Unified search across {pexelsConfigured === true ? 10 : 9} sources
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowKeyBar(!showKeyBar)}
            title="Clipart.Free API Key Settings"
            className={`p-1.5 rounded-tile border transition cursor-pointer ${
              showKeyBar
                ? 'bg-accent-soft border-accent-line text-accent-ink'
                : 'border-transparent text-ink-muted hover:text-accent-ink hover:bg-accent-soft-hover'
            }`}
          >
            <KeyRound size={13} />
          </button>
          <button
            type="button"
            onClick={() => setIsStockArtPanelOpen(false)}
            title="Close Stock Art Panel"
            className="p-1.5 rounded-tile text-ink-muted hover:text-ink hover:bg-accent-soft-hover transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-3 border-b border-line space-y-2.5 bg-white">
        {showKeyBar && (
          <div className="p-2 rounded-tile bg-surface-sunken border border-line space-y-1.5">
            <label className="block text-2xs font-bold uppercase tracking-[0.09em] text-ink-placeholder">
              Clipart.Free API Key (cf_...)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="password"
                value={clipartApiKey}
                onChange={(e) => {
                  setClipartApiKey(e.target.value);
                  saveClipartFreeKey(e.target.value);
                }}
                placeholder="cf_..."
                className="flex-1 bg-white px-2 py-1 rounded-tile border border-line text-meta outline-none focus:border-accent-focus"
              />
              <button
                type="button"
                onClick={() => setShowKeyBar(false)}
                className="px-2.5 py-1 rounded-tile bg-accent hover:bg-accent-hover text-white text-2xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>

            <label className="block pt-0.5 text-2xs font-bold uppercase tracking-[0.09em] text-ink-placeholder">
              CORS Proxy (static hosting)
            </label>
            <input
              type="url"
              value={clipartProxyUrl}
              onChange={(e) => {
                setClipartProxyUrl(e.target.value);
                saveClipartProxyBase(e.target.value);
              }}
              placeholder="https://your-worker.workers.dev"
              className="w-full bg-white px-2 py-1 rounded-tile border border-line text-meta outline-none focus:border-accent-focus"
            />
            <p className="text-2xs leading-snug text-ink-placeholder">
              Optional. Iconify &amp; Wikimedia work without a proxy; Clipart.Free needs one on static hosts (or when
              the app&apos;s host has no outbound internet).
            </p>

            <button
              type="button"
              disabled={isTestingCf}
              onClick={async () => {
                setIsTestingCf(true);
                setCfTest(null);
                try {
                  setCfTest(await diagnoseClipartConnection(clipartApiKey));
                } finally {
                  setIsTestingCf(false);
                }
              }}
              className="w-full py-1 rounded-tile border border-accent-line bg-accent-soft hover:bg-accent-soft-hover text-accent-ink text-2xs font-bold transition cursor-pointer disabled:opacity-60"
            >
              {isTestingCf ? 'Testing connection…' : 'Test Clipart.Free connection'}
            </button>

            {cfTest && (
              <p
                className={`text-2xs leading-snug rounded-chip px-1.5 py-1 border ${
                  cfTest.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {cfTest.ok ? '✓ ' : '✕ '}
                {cfTest.message}
              </p>
            )}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runUnifiedSearch();
          }}
          className="flex items-center gap-1.5"
        >
          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-placeholder pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cliparts, icons, photos..."
              className="w-full pl-8 pr-3 py-2 rounded-tile border border-line bg-surface-sunken focus:bg-surface text-body text-ink placeholder-ink-placeholder outline-none focus:border-accent-focus transition"
            />
          </div>
          <button
            type="submit"
            disabled={isAnyLoading}
            className="px-3 py-1.5 rounded-tile bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-body font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            {isAnyLoading ? <Loader2 size={13} className="animate-spin" /> : 'Search'}
          </button>
        </form>

        {/* Quick Keyword Chips */}
        <div className="flex items-center gap-1 flex-wrap">
          {QUICK_SEARCH_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setQuery(chip);
                runUnifiedSearch(chip);
              }}
              className={`px-2 py-0.5 rounded-chip text-2xs font-medium transition cursor-pointer ${
                query.toLowerCase() === chip
                  ? 'bg-accent-soft text-accent-ink font-semibold'
                  : 'bg-surface-sunken text-ink-secondary hover:bg-accent-soft-hover hover:text-accent-ink'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Source Filter Tabs */}
        <div className="flex items-center gap-1 flex-wrap pt-0.5">
          {(
            [
              { id: 'all', label: `All (${totalAllCount})` },
              { id: 'builtin', label: `Built-in (${builtinItems.length})` },
              {
                id: 'clipartfree',
                label: disabledSources.includes('clipartfree') ? 'CF (off)' : `CF (${cfItems.length})`,
              },
              { id: 'iconify', label: `Iconify (${iconifyItems.length})` },
              { id: 'wikimedia', label: `Wiki (${wikiItems.length})` },
              { id: 'openverse', label: `Open (${ovItems.length})` },
              {
                id: 'pixabay',
                label: disabledSources.includes('pixabay')
                  ? 'Pix (off)'
                  : `Pix (${pbItems.length})`,
              },
              {
                id: 'unsplash',
                label: disabledSources.includes('unsplash')
                  ? 'Uns (off)'
                  : `Uns (${unItems.length})`,
              },
              { id: 'openart', label: `Art (${oaItems.length})` },
              { id: 'oclipart', label: `Vec (${ocItems.length})` },
              ...(pexelsConfigured === true
                ? [
                    {
                      id: 'pexels' as const,
                      label: disabledSources.includes('pexels')
                        ? 'Pex (off)'
                        : `Pex (${pxItems.length})`,
                    },
                  ]
                : []),
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSourceFilter(tab.id)}
              className={`px-2 py-0.5 rounded-chip text-2xs font-semibold transition cursor-pointer tabular-nums ${
                sourceFilter === tab.id
                  ? 'bg-accent-soft text-accent-ink'
                  : 'bg-surface-sunken text-ink-secondary hover:bg-accent-soft-hover hover:text-accent-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSvgOnly(!svgOnly)}
            title="Show only recolorable Vector SVGs"
            className={`ml-auto px-2 py-0.5 rounded-chip text-2xs font-semibold border transition cursor-pointer flex items-center gap-1 ${
              svgOnly
                ? 'bg-accent-soft border-accent-line text-accent-ink'
                : 'bg-surface-sunken border-line text-ink-secondary hover:text-accent-ink hover:bg-accent-soft-hover'
            }`}
          >
            <Sparkles size={10} />
            <span>SVG Only</span>
          </button>
        </div>

        {/* Pixabay's own filters — the rest of the sources have none. */}
        {sourceFilter === 'pixabay' && (
          <div className="space-y-1.5 pt-0.5">
            <FilterChipRow
              label="Type"
              options={PIXABAY_TYPE_OPTIONS}
              value={pbImageType}
              onChange={(value) => {
                setPbImageType(value);
                runPixabaySearch(query, 1);
              }}
            />
            <FilterChipRow
              label="Shape"
              options={PIXABAY_SHAPE_OPTIONS}
              value={pbOrientation}
              onChange={(value) => {
                setPbOrientation(value);
                runPixabaySearch(query, 1);
              }}
            />
            <p className="text-2xs text-right">
              <a
                href="https://pixabay.com/"
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold text-accent-ink hover:underline"
              >
                Powered by Pixabay
              </a>
            </p>
          </div>
        )}

        {/* Pexels' shape filter. The API guidelines require a visible link back
            to Pexels wherever its results are shown. */}
        {sourceFilter === 'pexels' && (
          <div className="space-y-1.5 pt-0.5">
            <FilterChipRow
              label="Shape"
              options={PEXELS_SHAPE_OPTIONS}
              value={pxOrientation}
              onChange={(value) => {
                setPxOrientation(value);
                runPexelsSearch(query, 1);
              }}
            />
            <p className="text-2xs text-right">
              <a
                href="https://www.pexels.com/"
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold text-accent-ink hover:underline"
              >
                Photos provided by Pexels
              </a>
            </p>
          </div>
        )}

        {/* Unsplash's filters. Photos are hotlinked, so results appear fast. */}
        {sourceFilter === 'unsplash' && (
          <div className="space-y-1.5 pt-0.5">
            <FilterChipRow
              label="Shape"
              options={UNSPLASH_SHAPE_OPTIONS}
              value={unOrientation}
              onChange={(value) => {
                setUnOrientation(value);
                runUnsplashSearch(query, 1);
              }}
            />
            <FilterChipRow
              label="Order"
              options={UNSPLASH_ORDER_OPTIONS}
              value={unOrder}
              onChange={(value) => {
                setUnOrder(value);
                runUnsplashSearch(query, 1);
              }}
            />
            <p className="text-2xs text-right">
              <a
                href={unsplashCreditUrl('https://unsplash.com/')}
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold text-accent-ink hover:underline"
              >
                Photos from Unsplash
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-surface-sunken">
        {sourceErrors.length > 0 && (
          <div className="space-y-1">
            {Array.from(new Set(sourceErrors)).map((err) => {
              const isClipart = err.startsWith('Clipart.Free');
              return (
                <div
                  key={err}
                  className="p-1.5 rounded-tile bg-amber-50 border border-amber-200 text-2xs text-amber-900 flex items-start gap-1.5"
                >
                  <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="block leading-snug">{err}</span>
                    {isClipart && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowKeyBar(true)}
                          className="px-1.5 py-0.5 rounded-chip bg-white border border-amber-300 font-semibold hover:bg-amber-100 transition cursor-pointer"
                        >
                          Proxy settings
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSourceDisabled('clipartfree', true);
                            setSourceErrors((prev) => prev.filter((e) => !e.startsWith('Clipart.Free')));
                          }}
                          className="px-1.5 py-0.5 rounded-chip bg-white border border-amber-300 font-semibold hover:bg-amber-100 transition cursor-pointer"
                        >
                          Don&apos;t retry
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSourceErrors((prev) => prev.filter((e) => e !== err))}
                    className="p-0.5 rounded-[4px] text-amber-700 hover:bg-amber-100 cursor-pointer flex-shrink-0"
                    aria-label="Dismiss"
                  >
                    <X size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {pexelsUnavailable && (sourceFilter === 'pexels' || sourceFilter === 'all') && (
          <div className="p-1.5 rounded-tile bg-surface-sunken border border-line text-2xs text-ink-secondary flex items-start gap-1.5">
            <AlertCircle size={12} className="flex-shrink-0 mt-0.5 text-ink-faint" />
            <div className="flex-1 min-w-0 space-y-1">
              <span className="block leading-snug">{PEXELS_PROXY_HINT}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => runPexelsSearch(query, 1)}
                  className="px-1.5 py-0.5 rounded-chip bg-white border border-line font-semibold hover:bg-accent-soft-hover transition cursor-pointer"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSourceDisabled('pexels', true);
                    setPexelsUnavailable(false);
                  }}
                  className="px-1.5 py-0.5 rounded-chip bg-white border border-line font-semibold hover:bg-accent-soft-hover transition cursor-pointer"
                >
                  Hide
                </button>
              </div>
            </div>
          </div>
        )}

        {pixabayUnavailable && (sourceFilter === 'pixabay' || sourceFilter === 'all') && (
          <div className="p-1.5 rounded-tile bg-surface-sunken border border-line text-2xs text-ink-secondary flex items-start gap-1.5">
            <AlertCircle size={12} className="flex-shrink-0 mt-0.5 text-ink-faint" />
            <div className="flex-1 min-w-0 space-y-1">
              <span className="block leading-snug">{PIXABAY_PROXY_HINT}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => runPixabaySearch(query, 1)}
                  className="px-1.5 py-0.5 rounded-chip bg-white border border-line font-semibold hover:bg-accent-soft-hover transition cursor-pointer"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSourceDisabled('pixabay', true);
                    setPixabayUnavailable(false);
                  }}
                  className="px-1.5 py-0.5 rounded-chip bg-white border border-line font-semibold hover:bg-accent-soft-hover transition cursor-pointer"
                >
                  Hide
                </button>
              </div>
            </div>
          </div>
        )}

        {unsplashUnavailable && (sourceFilter === 'unsplash' || sourceFilter === 'all') && (
          <div className="p-1.5 rounded-tile bg-surface-sunken border border-line text-2xs text-ink-secondary flex items-start gap-1.5">
            <AlertCircle size={12} className="flex-shrink-0 mt-0.5 text-ink-faint" />
            <div className="flex-1 min-w-0 space-y-1">
              <span className="block leading-snug">{UNSPLASH_PROXY_HINT}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => runUnsplashSearch(query, 1)}
                  className="px-1.5 py-0.5 rounded-chip bg-white border border-line font-semibold hover:bg-accent-soft-hover transition cursor-pointer"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSourceDisabled('unsplash', true);
                    setUnsplashUnavailable(false);
                  }}
                  className="px-1.5 py-0.5 rounded-chip bg-white border border-line font-semibold hover:bg-accent-soft-hover transition cursor-pointer"
                >
                  Hide
                </button>
              </div>
            </div>
          </div>
        )}

        {disabledSources.includes('clipartfree') && (
          <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-tile bg-surface-sunken border border-line text-2xs text-ink-muted">
            <span>Clipart.Free is turned off for this browser.</span>
            <button
              type="button"
              onClick={() => {
                setSourceDisabled('clipartfree', false);
                runUnifiedSearch();
              }}
              className="ml-auto px-1.5 py-0.5 rounded-chip bg-accent-soft border border-accent-line text-accent-ink font-semibold hover:bg-accent-soft-hover transition cursor-pointer"
            >
              Turn on
            </button>
          </div>
        )}

        {isAnyLoading && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-tile bg-accent-soft border border-accent-line text-2xs text-accent-ink font-medium">
            <Loader2 size={12} className="animate-spin flex-shrink-0" />
            <span>
              Searching{' '}
              {[
                loadingSources.clipartfree && 'Clipart.Free',
                loadingSources.iconify && 'Iconify',
                loadingSources.wikimedia && 'Wikimedia',
                loadingSources.pixabay && 'Pixabay',
                loadingSources.unsplash && 'Unsplash',
                loadingSources.openart && 'Museum art',
                loadingSources.pexels && 'Pexels',
                loadingSources.oclipart && 'Openclipart',
              ]
                .filter(Boolean)
                .join(', ')}
              ...
            </span>
          </div>
        )}

        {combinedResults.length === 0 && !isAnyLoading ? (
          <div className="py-12 text-center space-y-1.5 px-4">
            <Images size={26} className="mx-auto text-slate-300" />
            <p className="text-body font-semibold text-slate-600">No matching graphics found</p>
            <p className="text-meta text-ink-faint">
              Try a broader keyword like <strong>star</strong>, <strong>cat</strong>, or{' '}
              <strong>trophy</strong>.
            </p>
          </div>
        ) : (
          <>
          <div
            className={`grid gap-2.5 ${
              panelWidth >= 380 ? 'grid-cols-3' : 'grid-cols-2'
            }`}
          >
            {combinedResults.map((item) => {
              const isInserting = insertingUid === item.uid;
              return (
                <div
                  key={item.uid}
                  className="group relative flex flex-col rounded-tile bg-white border border-line hover:border-accent-line hover:shadow-sm transition overflow-hidden"
                >
                  {/* Clickable Card Body */}
                  <button
                    type="button"
                    disabled={isInserting}
                    onClick={() => handleInsertItem(item, false)}
                    title={`Click to insert "${item.title}" (${item.sourceLabel})`}
                    className="flex flex-col items-center p-2.5 text-left w-full cursor-pointer disabled:opacity-60"
                  >
                    <div className="w-full h-20 rounded-chip bg-surface-sunken border border-line-soft flex items-center justify-center overflow-hidden p-2 relative">
                      <img
                        src={item.thumbUrl}
                        alt={item.title}
                        loading="lazy"
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
                      />
                      {/* Source Badge */}
                      <span
                        className="absolute top-1 left-1 max-w-[72%] truncate px-1.5 py-0.5 rounded-[4px] bg-white/90 text-ink-secondary text-2xs font-bold uppercase tracking-tight border border-line"
                      >
                        {item.source === 'clipartfree'
                          ? 'CF'
                          : item.source === 'wikimedia'
                          ? 'Wiki'
                          : item.source === 'pixabay'
                          ? 'Pix'
                          : item.source === 'unsplash'
                          ? 'Uns'
                          : item.source === 'openart'
                          ? 'Art'
                          : item.source === 'pexels'
                          ? 'Pex'
                          : item.source === 'oclipart'
                          ? 'Vec'
                          : item.sourceLabel}
                      </span>
                      {item.isSvg && (
                        <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-accent text-white text-2xs font-bold">
                          SVG
                        </span>
                      )}
                    </div>
                    <span className="mt-1.5 text-2xs font-semibold text-ink-secondary truncate w-full text-center">
                      {isInserting ? 'Inserting...' : item.title}
                    </span>
                    {item.credit && (
                      <span className="text-2xs text-ink-faint truncate w-full text-center leading-tight">
                        {item.credit}
                      </span>
                    )}
                  </button>

                  {/* Hover Quick Sticker Action */}
                  {!isInserting && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInsertItem(item, true);
                      }}
                      title="Insert as Die-Cut Sticker"
                      className="opacity-0 group-hover:opacity-100 absolute bottom-7 right-2 px-1.5 py-0.5 rounded-chip bg-ink/85 hover:bg-accent-hover text-white text-2xs font-bold flex items-center gap-0.5 transition cursor-pointer shadow-xs"
                    >
                      <Sticker size={9} />
                      <span>Sticker</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {sourceFilter === 'pixabay' && pbItems.length > 0 && (
            <ResultPaging
              total={pbTotal}
              page={pbPage}
              perPage={18}
              loading={pbLoadingMore}
              onMore={() => runPixabaySearch(query, pbPage + 1, true)}
              credit={
                <>
                  Images from{' '}
                  <a
                    href="https://pixabay.com/"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-semibold text-accent-ink hover:underline"
                  >
                    Pixabay
                  </a>
                  , used under the Pixabay Content License. Search results are cached for 24 hours.
                </>
              }
            />
          )}

          {sourceFilter === 'oclipart' && ocItems.length > 0 && (
            <ResultPaging
              total={ocTotal}
              page={ocPage}
              // Openclipart serves 25 results per page, unlike the keyed APIs.
              perPage={25}
              loading={ocLoadingMore}
              onMore={() => runOpenclipartSearch(query, ocPage + 1, true)}
              credit={
                <>
                  SVG clip art dedicated to the public domain by{' '}
                  <a
                    href="https://openclipart.org/"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-semibold text-accent-ink hover:underline"
                  >
                    Openclipart
                  </a>{' '}
                  (CC0).
                </>
              }
            />
          )}

          {sourceFilter === 'pexels' && pxItems.length > 0 && (
            <ResultPaging
              total={pxTotal}
              page={pxPage}
              perPage={18}
              loading={pxLoadingMore}
              onMore={() => runPexelsSearch(query, pxPage + 1, true)}
              credit={
                <>
                  Free photos under the{' '}
                  <a
                    href="https://www.pexels.com/license/"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-semibold text-accent-ink hover:underline"
                  >
                    Pexels License
                  </a>
                  .
                </>
              }
            />
          )}

          {sourceFilter === 'openart' && oaItems.length > 0 && (
            <ResultPaging
              total={oaTotal}
              page={oaPage}
              perPage={18}
              loading={oaLoadingMore}
              onMore={() => runOpenAccessSearch(query, oaPage + 1, true)}
              credit={
                <>
                  Public-domain art from the{' '}
                  <a
                    href="https://www.artic.edu/"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-semibold text-accent-ink hover:underline"
                  >
                    Art Institute of Chicago
                  </a>{' '}
                  and the{' '}
                  <a
                    href="https://www.clevelandart.org/art/collection"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-semibold text-accent-ink hover:underline"
                  >
                    Cleveland Museum of Art
                  </a>
                  .
                </>
              }
            />
          )}

          {sourceFilter === 'unsplash' && unItems.length > 0 && (
            <ResultPaging
              total={unTotal}
              page={unPage}
              perPage={18}
              loading={unLoadingMore}
              onMore={() => runUnsplashSearch(query, unPage + 1, true)}
              credit={
                <>
                  Photos from{' '}
                  <a
                    href={unsplashCreditUrl('https://unsplash.com/')}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-semibold text-accent-ink hover:underline"
                  >
                    Unsplash
                  </a>
                  , used under the Unsplash License. Photographer credits link back to Unsplash.
                </>
              }
            />
          )}
          </>
        )}
      </div>

      {/* Footer Tip */}
      <div className="px-3 py-2 border-t border-slate-200 bg-surface-sunken text-2xs text-slate-500 flex items-center justify-between">
        <span>Click to insert • SVG items can be recolored</span>
      </div>
    </aside>
  );
};
