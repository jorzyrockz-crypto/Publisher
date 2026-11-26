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
  Images,
  Search,
  X,
  KeyRound,
  Loader2,
  Sparkles,
  AlertCircle,
  Sticker,
} from 'lucide-react';

type StockSourceFilter = 'all' | 'builtin' | 'clipartfree' | 'iconify' | 'wikimedia' | 'openverse';

interface UnifiedStockItem {
  uid: string;
  source: 'builtin' | 'clipartfree' | 'iconify' | 'wikimedia' | 'openverse';
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
}

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

  const [loadingSources, setLoadingSources] = useState({
    clipartfree: false,
    iconify: false,
    wikimedia: false,
    openverse: false,
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
  };

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
      const buckets = [builtinItems, cfItems, iconifyItems, wikiItems, ovItems];
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
    } else {
      list = wikiItems;
    }

    if (svgOnly) {
      list = list.filter((item) => item.isSvg);
    }
    return list;
  }, [sourceFilter, svgOnly, builtinItems, cfItems, iconifyItems, wikiItems, ovItems]);

  const isAnyLoading =
    loadingSources.clipartfree ||
    loadingSources.iconify ||
    loadingSources.wikimedia ||
    loadingSources.openverse;

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
      }

      if (!dataUrl) return;

      const maxDim = asSticker ? 180 : 220;
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
        ...(asSticker
          ? {
              effectPreset: 'sticker' as const,
              isSticker: true,
              stickerOutlineColor: '#ffffff',
              stickerOutlineWidth: 5,
              stickerFinish: 'matte' as const,
              borderWidth: 0,
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
    builtinItems.length + cfItems.length + iconifyItems.length + wikiItems.length;

  return (
    <aside
      style={{ width: panelWidth }}
      className={`bg-white border-l border-[#e5e9ee] flex flex-col h-full flex-shrink-0 select-none text-[#161a22] ${
        isNarrowViewport ? 'absolute right-0 top-0 bottom-0 z-30 shadow-[0_8px_28px_rgba(28,44,58,0.12)]' : 'relative z-20'
      } ${isResizing ? '' : 'transition-[width] duration-150'}`}
    >
      {/* Drag-to-resize handle on left edge */}
      <div
        onMouseDown={handleResizeStart}
        onDoubleClick={resetWidth}
        title="Drag to resize • Double-click to reset"
        className={`absolute top-0 left-0 bottom-0 w-1.5 cursor-col-resize z-30 transition-colors ${
          isResizing ? 'bg-[#6e56cf]' : 'hover:bg-[#6e56cf]/50'
        }`}
      />
      {/* Inspector-style Header */}
      <div className="px-3.5 py-2.5 border-b border-[#e5e9ee] bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-[#efeafd] text-[#5c4bb8] flex items-center justify-center">
            <Images size={14} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#161a22] leading-tight">
              Stock Art & Clipart
            </h3>
            <p className="text-[10px] text-[#5b6673] leading-tight">
              Unified search across 5 sources
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowKeyBar(!showKeyBar)}
            title="Clipart.Free API Key Settings"
            className={`p-1.5 rounded-[8px] border transition cursor-pointer ${
              showKeyBar
                ? 'bg-[#efeafd] border-[#d3c9f9] text-[#5c4bb8]'
                : 'border-transparent text-[#5b6673] hover:text-[#5c4bb8] hover:bg-[#f4f2ff]'
            }`}
          >
            <KeyRound size={13} />
          </button>
          <button
            type="button"
            onClick={() => setIsStockArtPanelOpen(false)}
            title="Close Stock Art Panel"
            className="p-1.5 rounded-[8px] text-[#5b6673] hover:text-[#161a22] hover:bg-[#f4f2ff] transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-3 border-b border-[#e5e9ee] space-y-2.5 bg-white">
        {showKeyBar && (
          <div className="p-2 rounded-[8px] bg-[#f8fafb] border border-[#e5e9ee] space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-[0.09em] text-[#6a7682]">
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
                className="flex-1 bg-white px-2 py-1 rounded-[8px] border border-[#e5e9ee] text-[11px] outline-none focus:border-[#b3a4f2]"
              />
              <button
                type="button"
                onClick={() => setShowKeyBar(false)}
                className="px-2.5 py-1 rounded-[8px] bg-[#6e56cf] hover:bg-[#5c4bb8] text-white text-[10px] font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>

            <label className="block pt-0.5 text-[10px] font-bold uppercase tracking-[0.09em] text-[#6a7682]">
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
              className="w-full bg-white px-2 py-1 rounded-[8px] border border-[#e5e9ee] text-[11px] outline-none focus:border-[#b3a4f2]"
            />
            <p className="text-[9.5px] leading-snug text-[#6a7682]">
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
              className="w-full py-1 rounded-[8px] border border-[#d3c9f9] bg-[#efeafd] hover:bg-[#f4f2ff] text-[#5c4bb8] text-[10px] font-bold transition cursor-pointer disabled:opacity-60"
            >
              {isTestingCf ? 'Testing connection…' : 'Test Clipart.Free connection'}
            </button>

            {cfTest && (
              <p
                className={`text-[9.5px] leading-snug rounded-[6px] px-1.5 py-1 border ${
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
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6a7682] pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cliparts, icons, photos..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] focus:bg-white text-xs text-[#161a22] placeholder-[#6a7682] outline-none focus:border-[#b3a4f2] transition"
            />
          </div>
          <button
            type="submit"
            disabled={isAnyLoading}
            className="px-3 py-1.5 rounded-[8px] bg-[#6e56cf] hover:bg-[#5c4bb8] disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
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
              className={`px-2 py-0.5 rounded-[6px] text-[10px] font-medium transition cursor-pointer ${
                query.toLowerCase() === chip
                  ? 'bg-[#efeafd] text-[#5c4bb8] font-semibold'
                  : 'bg-[#f3f5f7] text-[#4a5661] hover:bg-[#f4f2ff] hover:text-[#5c4bb8]'
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
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSourceFilter(tab.id)}
              className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold transition cursor-pointer tabular-nums ${
                sourceFilter === tab.id
                  ? 'bg-[#efeafd] text-[#5c4bb8]'
                  : 'bg-[#f3f5f7] text-[#4a5661] hover:bg-[#f4f2ff] hover:text-[#5c4bb8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSvgOnly(!svgOnly)}
            title="Show only recolorable Vector SVGs"
            className={`ml-auto px-2 py-0.5 rounded-[6px] text-[10px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
              svgOnly
                ? 'bg-[#efeafd] border-[#d3c9f9] text-[#5c4bb8]'
                : 'bg-[#f8fafb] border-[#e5e9ee] text-[#4a5661] hover:text-[#5c4bb8] hover:bg-[#f4f2ff]'
            }`}
          >
            <Sparkles size={10} />
            <span>SVG Only</span>
          </button>
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#f8fafb]">
        {sourceErrors.length > 0 && (
          <div className="space-y-1">
            {Array.from(new Set(sourceErrors)).map((err) => {
              const isClipart = err.startsWith('Clipart.Free');
              return (
                <div
                  key={err}
                  className="p-1.5 rounded-[8px] bg-amber-50 border border-amber-200 text-[10px] text-amber-900 flex items-start gap-1.5"
                >
                  <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="block leading-snug">{err}</span>
                    {isClipart && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowKeyBar(true)}
                          className="px-1.5 py-0.5 rounded-[5px] bg-white border border-amber-300 font-semibold hover:bg-amber-100 transition cursor-pointer"
                        >
                          Proxy settings
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSourceDisabled('clipartfree', true);
                            setSourceErrors((prev) => prev.filter((e) => !e.startsWith('Clipart.Free')));
                          }}
                          className="px-1.5 py-0.5 rounded-[5px] bg-white border border-amber-300 font-semibold hover:bg-amber-100 transition cursor-pointer"
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

        {disabledSources.includes('clipartfree') && (
          <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-[8px] bg-[#f8fafb] border border-[#e5e9ee] text-[10px] text-[#5b6673]">
            <span>Clipart.Free is turned off for this browser.</span>
            <button
              type="button"
              onClick={() => {
                setSourceDisabled('clipartfree', false);
                runUnifiedSearch();
              }}
              className="ml-auto px-1.5 py-0.5 rounded-[5px] bg-[#efeafd] border border-[#d3c9f9] text-[#5c4bb8] font-semibold hover:bg-[#f4f2ff] transition cursor-pointer"
            >
              Turn on
            </button>
          </div>
        )}

        {isAnyLoading && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#efeafd] border border-[#d3c9f9] text-[10.5px] text-[#5c4bb8] font-medium">
            <Loader2 size={12} className="animate-spin flex-shrink-0" />
            <span>
              Searching{' '}
              {[
                loadingSources.clipartfree && 'Clipart.Free',
                loadingSources.iconify && 'Iconify',
                loadingSources.wikimedia && 'Wikimedia',
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
            <p className="text-xs font-semibold text-slate-600">No matching graphics found</p>
            <p className="text-[11px] text-slate-400">
              Try a broader keyword like <strong>star</strong>, <strong>cat</strong>, or{' '}
              <strong>trophy</strong>.
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-2 ${
              panelWidth >= 380 ? 'grid-cols-3' : 'grid-cols-2'
            }`}
          >
            {combinedResults.map((item) => {
              const isInserting = insertingUid === item.uid;
              return (
                <div
                  key={item.uid}
                  className="group relative flex flex-col rounded-xl bg-white border border-slate-200/90 hover:border-[#d3c9f9] hover:shadow-sm transition overflow-hidden"
                >
                  {/* Clickable Card Body */}
                  <button
                    type="button"
                    disabled={isInserting}
                    onClick={() => handleInsertItem(item, false)}
                    title={`Click to insert "${item.title}" (${item.sourceLabel})`}
                    className="flex flex-col items-center p-2 text-left w-full cursor-pointer disabled:opacity-60"
                  >
                    <div className="w-full h-20 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden p-1.5 relative">
                      <img
                        src={item.thumbUrl}
                        alt={item.title}
                        loading="lazy"
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
                      />
                      {/* Source Badge */}
                      <span
                        className={`absolute top-1 left-1 px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-tight ${
                          item.source === 'builtin'
                            ? 'bg-[#efeafd] text-[#5c4bb8]'
                            : item.source === 'clipartfree'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.source === 'iconify'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.source === 'clipartfree'
                          ? 'CF'
                          : item.source === 'wikimedia'
                          ? 'Wiki'
                          : item.sourceLabel}
                      </span>
                      {item.isSvg && (
                        <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-[#6e56cf] text-white text-[8px] font-bold">
                          SVG
                        </span>
                      )}
                    </div>
                    <span className="mt-1.5 text-[10px] font-semibold text-slate-700 truncate w-full text-center">
                      {isInserting ? 'Inserting...' : item.title}
                    </span>
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
                      className="opacity-0 group-hover:opacity-100 absolute bottom-7 right-2 px-1.5 py-0.5 rounded-md bg-slate-900/85 hover:bg-[#6e56cf] text-white text-[9px] font-bold flex items-center gap-0.5 transition cursor-pointer shadow-xs"
                    >
                      <Sticker size={9} />
                      <span>Sticker</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Tip */}
      <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-500 flex items-center justify-between">
        <span>Click to insert • SVG items can be recolored</span>
      </div>
    </aside>
  );
};
