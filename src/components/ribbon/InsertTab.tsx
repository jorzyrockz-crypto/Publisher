import React, { useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { SAMPLE_GRAPHICS, StockCategory } from '../../constants/sampleGraphics';
import { STICKER_CATALOG, StickerCategory } from '../../constants/stickerLibrary';
import {
  CLIPART_FREE_CATEGORIES,
  ClipartFreeItem,
  fetchClipartAsDataUrl,
  fetchIconifyAsDataUrl,
  fetchWikimediaAsDataUrl,
  getSavedClipartFreeKey,
  IconifyItem,
  saveClipartFreeKey,
  searchClipartFree,
  searchIconify,
  searchWikimedia,
  toProxiedClipartUrl,
  toProxiedWikimediaUrl,
  WikimediaItem,
} from '../../utils/clipartSearch';
import { ImageElement } from '../../types/publisher';
import { FloatingDropdown } from '../common/FloatingDropdown';
import {
  FilePlus,
  Copy,
  Table as TableIcon,
  Image as ImageIcon,
  Square,
  Sparkles,
  Scissors,
  Quote,
  Layout,
  Minus,
  QrCode,
  Hash,
  Images,
  Wand2,
  LayoutGrid,
  ImagePlus,
  Smile,
  Globe,
  KeyRound,
  Loader2,
  Search,
} from 'lucide-react';

export const InsertTab: React.FC = () => {
  const {
    activePage,
    addPage,
    duplicateActivePage,
    addShape,
    addImage,
    addPicturePlaceholder,
    addElementsBatch,
    addTable,
    addAccent,
    addLine,
    addQRCode,
    addPageNumberToken,
    setIsWordArtModalOpen,
    setIsAIImageModalOpen,
    setIsCollageModalOpen,
  } = usePublisher();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableBtnRef = useRef<HTMLButtonElement>(null);
  const placeholderBtnRef = useRef<HTMLButtonElement>(null);
  const stockBtnRef = useRef<HTMLButtonElement>(null);
  const stickerBtnRef = useRef<HTMLButtonElement>(null);
  const qrBtnRef = useRef<HTMLButtonElement>(null);
  const [tableGridHover, setTableGridHover] = useState<{ r: number; c: number }>({ r: 3, c: 3 });
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);
  const [isPlaceholderOpen, setIsPlaceholderOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isStickersOpen, setIsStickersOpen] = useState(false);
  const [stickerCategory, setStickerCategory] = useState<'all' | 'vibe' | StickerCategory>('all');
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrMode, setQrMode] = useState<'url' | 'wifi' | 'email' | 'phone'>('url');
  const [qrInput, setQrInput] = useState('https://example.com');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [stockCategory, setStockCategory] = useState<'All' | StockCategory>('All');
  const [stockSearch, setStockSearch] = useState('');
  const [stockTab, setStockTab] = useState<'builtin' | 'online' | 'iconify' | 'wikimedia'>('builtin');
  const [clipartApiKey, setClipartApiKey] = useState<string>(
    () => getSavedClipartFreeKey() || 'cf_12a1b9727cf3c4f4e3d3fafc0e01e0ddd2eb714f'
  );
  const [showClipartKeyBar, setShowClipartKeyBar] = useState(false);
  const [onlineQuery, setOnlineQuery] = useState('cat silhouette');
  const [onlineCategory, setOnlineCategory] = useState<string>('All');
  const [onlineResults, setOnlineResults] = useState<ClipartFreeItem[]>([]);
  const [onlineTotal, setOnlineTotal] = useState<number | null>(null);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [insertingSlug, setInsertingSlug] = useState<string | null>(null);

  // Iconify state
  const [iconifyQuery, setIconifyQuery] = useState('graduation');
  const [iconifyFilter, setIconifyFilter] = useState<'all' | 'color' | 'mono'>('all');
  const [iconifyResults, setIconifyResults] = useState<IconifyItem[]>([]);
  const [iconifyTotal, setIconifyTotal] = useState<number | null>(null);
  const [isSearchingIconify, setIsSearchingIconify] = useState(false);
  const [iconifyError, setIconifyError] = useState<string | null>(null);

  // Wikimedia Commons state
  const [wikimediaQuery, setWikimediaQuery] = useState('trophy');
  const [wikimediaFilter, setWikimediaFilter] = useState<'all' | 'svg' | 'photo'>('svg');
  const [wikimediaResults, setWikimediaResults] = useState<WikimediaItem[]>([]);
  const [isSearchingWikimedia, setIsSearchingWikimedia] = useState(false);
  const [wikimediaError, setWikimediaError] = useState<string | null>(null);

  const [stickerSearch, setStickerSearch] = useState('');

  const handleSearchIconify = async (
    overrideQuery?: string,
    overrideFilter?: 'all' | 'color' | 'mono'
  ) => {
    const q = (overrideQuery ?? iconifyQuery).trim();
    const flt = overrideFilter ?? iconifyFilter;
    if (!q) return;
    setIsSearchingIconify(true);
    setIconifyError(null);
    try {
      const data = await searchIconify(q, { filter: flt });
      setIconifyResults(data.items);
      setIconifyTotal(data.total);
    } catch (err) {
      setIconifyError(err instanceof Error ? err.message : 'Failed to search Iconify');
    } finally {
      setIsSearchingIconify(false);
    }
  };

  const handleInsertIconify = async (item: IconifyItem) => {
    setInsertingSlug(item.id);
    setIconifyError(null);
    try {
      const dataUrl = await fetchIconifyAsDataUrl(item);
      addImage(dataUrl, {
        name: item.name.replace(/-/g, ' '),
        width: 140,
        height: 140,
        objectFit: 'contain',
      });
      setIsStockOpen(false);
    } catch (err) {
      setIconifyError(err instanceof Error ? err.message : 'Failed to insert icon');
    } finally {
      setInsertingSlug(null);
    }
  };

  const handleSearchWikimedia = async (
    overrideQuery?: string,
    overrideFilter?: 'all' | 'svg' | 'photo'
  ) => {
    const q = (overrideQuery ?? wikimediaQuery).trim();
    const flt = overrideFilter ?? wikimediaFilter;
    if (!q) return;
    setIsSearchingWikimedia(true);
    setWikimediaError(null);
    try {
      const items = await searchWikimedia(q, { filter: flt });
      setWikimediaResults(items);
    } catch (err) {
      setWikimediaError(err instanceof Error ? err.message : 'Failed to search Wikimedia');
    } finally {
      setIsSearchingWikimedia(false);
    }
  };

  const handleInsertWikimedia = async (item: WikimediaItem) => {
    setInsertingSlug(String(item.pageid));
    setWikimediaError(null);
    try {
      const dataUrl = await fetchWikimediaAsDataUrl(item);
      const maxDim = 240;
      const ratio = item.width && item.height ? item.width / item.height : 1;
      const width = ratio >= 1 ? maxDim : Math.round(maxDim * ratio);
      const height = ratio >= 1 ? Math.round(maxDim / ratio) : maxDim;
      addImage(dataUrl, {
        name: item.cleanTitle.slice(0, 32),
        width: Math.max(48, width),
        height: Math.max(48, height),
        objectFit: item.mime === 'image/svg+xml' ? 'contain' : 'cover',
      });
      setIsStockOpen(false);
    } catch (err) {
      setWikimediaError(err instanceof Error ? err.message : 'Failed to insert Wikimedia file');
    } finally {
      setInsertingSlug(null);
    }
  };

  const handleSearchOnlineClipart = async (overrideQuery?: string, overrideCat?: string) => {
    const q = (overrideQuery ?? onlineQuery).trim();
    const cat = overrideCat ?? onlineCategory;
    if (!q) return;
    setIsSearchingOnline(true);
    setOnlineError(null);
    try {
      const data = await searchClipartFree(q, {
        category: cat,
        apiKey: clipartApiKey,
      });
      setOnlineResults(data.results || []);
      setOnlineTotal(data.total ?? (data.results?.length || 0));
    } catch (err) {
      setOnlineError(err instanceof Error ? err.message : 'Failed to search Clipart.Free');
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const handleInsertOnlineClipart = async (item: ClipartFreeItem) => {
    setInsertingSlug(item.slug);
    setOnlineError(null);
    try {
      const dataUrl = await fetchClipartAsDataUrl(item);
      const maxDim = 220;
      const ratio = item.width && item.height ? item.width / item.height : 1;
      const width = ratio >= 1 ? maxDim : Math.round(maxDim * ratio);
      const height = ratio >= 1 ? Math.round(maxDim / ratio) : maxDim;
      addImage(dataUrl, {
        name: item.title || item.slug,
        width: Math.max(48, width),
        height: Math.max(48, height),
        objectFit: 'contain',
      });
      setIsStockOpen(false);
    } catch (err) {
      setOnlineError(err instanceof Error ? err.message : 'Failed to insert clipart');
    } finally {
      setInsertingSlug(null);
    }
  };

  const buildQrPayload = () => {
    if (qrMode === 'wifi') {
      return `WIFI:T:WPA;S:${wifiSsid || 'GuestWiFi'};P:${wifiPass || ''};;`;
    }
    if (qrMode === 'email') {
      const clean = qrInput.trim().replace(/^mailto:/i, '') || 'hello@example.com';
      return `mailto:${clean}`;
    }
    if (qrMode === 'phone') {
      const clean = qrInput.trim().replace(/^tel:/i, '') || '+15551234567';
      return `tel:${clean}`;
    }
    return qrInput.trim() || 'https://example.com';
  };

  return (
    <div className="flex items-center h-24 px-3 py-1 gap-3 text-xs text-slate-700 overflow-x-auto select-none">
      {/* 1. Pages Group */}
      <div className="flex flex-col justify-between h-full py-1 pr-3 border-r border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          <button
            onClick={addPage}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Insert Blank Page"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
              <FilePlus size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">New Page</span>
          </button>

          <button
            onClick={duplicateActivePage}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Duplicate Current Page"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-200 transition-all shadow-xs">
              <Copy size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Duplicate</span>
          </button>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Pages</span>
      </div>

      {/* 2. Tables Group */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-slate-200 flex-shrink-0 relative">
        <div className="my-auto">
          <button
            ref={tableBtnRef}
            onClick={() => setIsTableDropdownOpen(!isTableDropdownOpen)}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Insert Table"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
              <TableIcon size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Table</span>
          </button>

          <FloatingDropdown
            isOpen={isTableDropdownOpen}
            onClose={() => setIsTableDropdownOpen(false)}
            anchorRef={tableBtnRef}
            className="p-3 w-48"
          >
            <div className="text-[11px] font-semibold text-slate-700 mb-2">
              Insert Table ({tableGridHover.r} × {tableGridHover.c})
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-2.5">
              {Array.from({ length: 5 }).map((_, r) =>
                Array.from({ length: 5 }).map((_, c) => {
                  const isHighlighted = r < tableGridHover.r && c < tableGridHover.c;
                  return (
                    <div
                      key={`${r}-${c}`}
                      onMouseEnter={() => setTableGridHover({ r: r + 1, c: c + 1 })}
                      onClick={() => {
                        addTable(tableGridHover.r, tableGridHover.c);
                        setIsTableDropdownOpen(false);
                      }}
                      className={`w-5 h-5 border rounded cursor-pointer transition ${
                        isHighlighted
                          ? 'bg-indigo-500 border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 hover:bg-indigo-100'
                      }`}
                    />
                  );
                })
              )}
            </div>
            <button
              onClick={() => {
                addTable(3, 3);
                setIsTableDropdownOpen(false);
              }}
              className="w-full text-center py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 rounded-lg text-xs font-medium text-slate-700 transition"
            >
              Insert 3×3 Grid
            </button>
          </FloatingDropdown>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Tables</span>
      </div>

      {/* 3. Illustrations & Media */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2 my-auto">
          {/* Picture (Single or Batch Multiple Import in Staggered Grid) */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              if (files.length === 0) return;

              const readDataUrl = (f: File) =>
                new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (ev) => resolve(String(ev.target?.result || ''));
                  reader.readAsDataURL(f);
                });

              if (files.length === 1) {
                const src = await readDataUrl(files[0]);
                if (src) addImage(src, { name: files[0].name.replace(/\.[^.]+$/, '') });
              } else {
                const urls = (await Promise.all(files.map(readDataUrl))).filter(Boolean);
                const availW = Math.max(
                  200,
                  activePage.width - activePage.margins.left - activePage.margins.right
                );
                const cols = urls.length >= 4 ? 3 : 2;
                const gap = 16;
                const cellW = Math.min(240, Math.floor((availW - gap * (cols - 1)) / cols));
                const cellH = Math.round(cellW * 0.78);
                const baseZ =
                  activePage.elements.reduce((acc, el) => Math.max(acc, el.zIndex), 0) + 1;

                const batch: ImageElement[] = urls.map((src, idx) => {
                  const col = idx % cols;
                  const row = Math.floor(idx / cols);
                  const staggerOffsetY = (col % 2) * 14;
                  return {
                    id: `img-batch-${Date.now()}-${idx}`,
                    type: 'image',
                    name: files[idx]?.name.replace(/\.[^.]+$/, '') || `Picture ${idx + 1}`,
                    src,
                    x: Math.round(activePage.margins.left + col * (cellW + gap)),
                    y: Math.round(
                      activePage.margins.top + row * (cellH + gap) + staggerOffsetY
                    ),
                    width: cellW,
                    height: cellH,
                    rotation: 0,
                    zIndex: baseZ + idx,
                    objectFit: 'cover',
                    aspectRatioLocked: true,
                    borderRadius: 6,
                  };
                });

                addElementsBatch(batch);
              }
              e.target.value = '';
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Upload Picture"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
              <ImageIcon size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Picture</span>
          </button>

          {/* Picture Placeholder with Shape/Ratio Presets */}
          <div className="relative">
            <button
              ref={placeholderBtnRef}
              onClick={() => setIsPlaceholderOpen(!isPlaceholderOpen)}
              className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
              title="Insert Empty Picture Placeholder (Drag & drop or customize anytime)"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-50 border border-dashed border-sky-400 text-sky-700 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-all shadow-xs">
                <ImagePlus size={16} />
              </div>
              <span className="text-[10px] font-medium mt-1 text-slate-600">Placeholder</span>
            </button>

            <FloatingDropdown
              isOpen={isPlaceholderOpen}
              onClose={() => setIsPlaceholderOpen(false)}
              anchorRef={placeholderBtnRef}
              className="p-2.5 w-52 space-y-1"
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1">
                Insert Picture Placeholder
              </div>
              {[
                { label: 'Standard (4:3)', opts: { width: 240, height: 180, maskShape: 'none' as const } },
                { label: 'Square (1:1)', opts: { width: 200, height: 200, maskShape: 'none' as const } },
                { label: 'Widescreen (16:9)', opts: { width: 288, height: 162, maskShape: 'none' as const } },
                { label: 'Portrait (3:4)', opts: { width: 180, height: 240, maskShape: 'none' as const } },
                { label: 'Circle Portrait', opts: { width: 180, height: 180, maskShape: 'circle' as const } },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    addPicturePlaceholder(preset.opts);
                    setIsPlaceholderOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-800 text-[11px] font-semibold text-slate-700 transition flex items-center justify-between"
                >
                  <span>{preset.label}</span>
                  <span className="text-[9.5px] text-slate-400 font-normal">
                    {preset.opts.width}×{preset.opts.height}
                  </span>
                </button>
              ))}
              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    const availW = Math.max(
                      200,
                      activePage.width - activePage.margins.left - activePage.margins.right
                    );
                    const gap = 16;
                    const slotW = Math.floor((availW - gap * 2) / 3);
                    const slotH = Math.round(slotW * 0.8);
                    const baseZ =
                      activePage.elements.reduce((acc, el) => Math.max(acc, el.zIndex), 0) + 1;
                    const slots: ImageElement[] = [0, 1, 2].map((col) => ({
                      id: `ph-row-${Date.now()}-${col}`,
                      type: 'image',
                      name: `Photo Slot ${col + 1}`,
                      src: '',
                      x: Math.round(activePage.margins.left + col * (slotW + gap)),
                      y: Math.round(activePage.margins.top + (col % 2) * 14),
                      width: slotW,
                      height: slotH,
                      rotation: 0,
                      zIndex: baseZ + col,
                      objectFit: 'cover',
                      aspectRatioLocked: true,
                      borderRadius: 10,
                      maskShape: 'none',
                    }));
                    addElementsBatch(slots);
                    setIsPlaceholderOpen(false);
                  }}
                  className="w-full text-center py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[11px] font-bold transition"
                >
                  + Staggered 3-Slot Row
                </button>
              </div>
            </FloatingDropdown>
          </div>

          {/* Free Hybrid AI Image Studio */}
          <button
            onClick={() => setIsAIImageModalOpen(true)}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Free AI Image Studio (Hybrid Cloud + Offline Art)"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-50 to-teal-100 border border-indigo-300 text-indigo-700 flex items-center justify-center group-hover:from-indigo-600 group-hover:to-teal-600 group-hover:text-white transition-all shadow-xs">
              <Wand2 size={16} />
            </div>
            <span className="text-[10px] font-semibold mt-1 text-indigo-800">AI Image</span>
          </button>

          {/* Photo Collage Builder */}
          <button
            onClick={() => setIsCollageModalOpen(true)}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Create Multi-Photo Collage Grid"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
              <LayoutGrid size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Collage</span>
          </button>

          {/* Stock Graphics Picker */}
          <div className="relative">
            <button
              ref={stockBtnRef}
              onClick={() => setIsStockOpen(!isStockOpen)}
              className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
              title="Insert Built-in Stock Graphics"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all shadow-xs">
                <Images size={16} />
              </div>
              <span className="text-[10px] font-medium mt-1 text-slate-600">Stock Art</span>
            </button>

            <FloatingDropdown
              isOpen={isStockOpen}
              onClose={() => setIsStockOpen(false)}
              anchorRef={stockBtnRef}
              className="p-3 w-[430px]"
            >
              {/* Tab Switcher: Built-in, Clipart.Free, Iconify, Wikimedia */}
              <div className="flex items-center justify-between gap-1.5 mb-2.5">
                <div className="grid grid-cols-4 gap-0.5 bg-slate-100 p-0.5 rounded-xl flex-1">
                  <button
                    type="button"
                    onClick={() => setStockTab('builtin')}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition ${
                      stockTab === 'builtin'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Built-in ({SAMPLE_GRAPHICS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStockTab('online');
                      if (onlineResults.length === 0 && !isSearchingOnline) {
                        handleSearchOnlineClipart();
                      }
                    }}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                      stockTab === 'online'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Globe size={10} />
                    <span>Clipart.Free</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStockTab('iconify');
                      if (iconifyResults.length === 0 && !isSearchingIconify) {
                        handleSearchIconify();
                      }
                    }}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition ${
                      stockTab === 'iconify'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Iconify
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStockTab('wikimedia');
                      if (wikimediaResults.length === 0 && !isSearchingWikimedia) {
                        handleSearchWikimedia();
                      }
                    }}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition ${
                      stockTab === 'wikimedia'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Wikimedia
                  </button>
                </div>
                {stockTab === 'online' && (
                  <button
                    type="button"
                    onClick={() => setShowClipartKeyBar(!showClipartKeyBar)}
                    title="Configure Clipart.Free API Key"
                    className={`p-1.5 rounded-lg border transition ${
                      showClipartKeyBar
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <KeyRound size={12} />
                  </button>
                )}
              </div>

              {stockTab === 'builtin' && (
                <>
                  <input
                    type="text"
                    placeholder="Search clipart (e.g. rocket, cake, sunset)..."
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                    className="w-full mb-2 px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-[11px] outline-none focus:border-indigo-500"
                  />
                  <div className="flex items-center gap-1 mb-2.5 flex-wrap">
                    {(
                      [
                        'All',
                        'People',
                        'Animals',
                        'Plants',
                        'Things',
                        'Education',
                        'Nature',
                        'Abstract',
                        'Business',
                        'Badges',
                        'Lifestyle',
                      ] as const
                    ).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setStockCategory(cat)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition ${
                          stockCategory === cat
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                    {SAMPLE_GRAPHICS.filter(
                      (g) =>
                        (stockCategory === 'All' || g.category === stockCategory) &&
                        g.name.toLowerCase().includes(stockSearch.toLowerCase())
                    ).map((g) => (
                      <button
                        key={g.id}
                        onClick={() => {
                          addImage(g.src, { name: g.name });
                          setIsStockOpen(false);
                        }}
                        className="group/item flex flex-col items-center p-1.5 rounded-xl border border-slate-200/80 hover:border-indigo-500 hover:bg-indigo-50/40 transition"
                      >
                        <img
                          src={g.src}
                          alt={g.name}
                          className="w-full h-14 object-cover rounded-lg mb-1"
                        />
                        <span className="text-[10px] font-semibold text-slate-700 truncate w-full text-center">
                          {g.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {stockTab === 'online' && (
                <>
                  {showClipartKeyBar && (
                    <div className="mb-2 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                      <input
                        type="password"
                        value={clipartApiKey}
                        onChange={(e) => {
                          setClipartApiKey(e.target.value);
                          saveClipartFreeKey(e.target.value);
                        }}
                        placeholder="cf_..."
                        className="flex-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-[10.5px] outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowClipartKeyBar(false)}
                        className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold"
                      >
                        Save
                      </button>
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSearchOnlineClipart();
                    }}
                    className="flex items-center gap-1.5 mb-2"
                  >
                    <input
                      type="text"
                      placeholder="Search thousands of CC0 cliparts..."
                      value={onlineQuery}
                      onChange={(e) => setOnlineQuery(e.target.value)}
                      className="flex-1 px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-[11px] outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={isSearchingOnline}
                      className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      {isSearchingOnline ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Search size={12} />
                      )}
                      <span>Find</span>
                    </button>
                  </form>

                  <div className="flex items-center gap-1 mb-2 flex-wrap">
                    {CLIPART_FREE_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setOnlineCategory(cat);
                          handleSearchOnlineClipart(onlineQuery, cat);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[9.5px] font-semibold capitalize transition ${
                          onlineCategory === cat
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {onlineError && (
                    <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-[10.5px] text-rose-700">
                      {onlineError}
                    </div>
                  )}

                  {onlineTotal !== null && !onlineError && (
                    <div className="text-[10px] text-slate-400 font-medium mb-1.5 flex items-center justify-between">
                      <span>{onlineTotal.toLocaleString()} CC0 results found</span>
                      <span>Vector SVG • Recolorable</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                    {isSearchingOnline ? (
                      <div className="col-span-3 py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <Loader2 size={20} className="animate-spin text-indigo-500" />
                        <span className="text-[11px]">Searching Clipart.Free...</span>
                      </div>
                    ) : onlineResults.length === 0 ? (
                      <div className="col-span-3 py-8 text-center text-[11px] text-slate-400">
                        Enter a keyword above (e.g. cat, trophy, flower) and press Find.
                      </div>
                    ) : (
                      onlineResults.map((item) => {
                        const thumbUrl = toProxiedClipartUrl(
                          item.png_urls?.['400'] || item.svg_url
                        );
                        const isInserting = insertingSlug === item.slug;
                        return (
                          <button
                            key={item.slug}
                            type="button"
                            disabled={isInserting}
                            onClick={() => handleInsertOnlineClipart(item)}
                            title={`${item.title} (${item.license})`}
                            className="group/item relative flex flex-col items-center p-1.5 rounded-xl border border-slate-200/80 hover:border-indigo-500 hover:bg-indigo-50/40 transition disabled:opacity-60"
                          >
                            <div className="w-full h-14 flex items-center justify-center bg-slate-50 rounded-lg mb-1 overflow-hidden p-1">
                              <img
                                src={thumbUrl}
                                alt={item.title}
                                loading="lazy"
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <span className="text-[9.5px] font-semibold text-slate-700 truncate w-full text-center">
                              {isInserting ? 'Inserting...' : item.title}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              {stockTab === 'iconify' && (
                <>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSearchIconify();
                    }}
                    className="flex items-center gap-1.5 mb-2"
                  >
                    <input
                      type="text"
                      placeholder="Search 200k+ SVG icons & color art..."
                      value={iconifyQuery}
                      onChange={(e) => setIconifyQuery(e.target.value)}
                      className="flex-1 px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-[11px] outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={isSearchingIconify}
                      className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      {isSearchingIconify ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Search size={12} />
                      )}
                      <span>Find</span>
                    </button>
                  </form>

                  <div className="flex items-center gap-1 mb-2 flex-wrap">
                    {(
                      [
                        { id: 'all', label: 'All Packs' },
                        { id: 'color', label: 'Color Illustrations' },
                        { id: 'mono', label: 'Clean Line / Solid' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setIconifyFilter(f.id);
                          handleSearchIconify(iconifyQuery, f.id);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[9.5px] font-semibold transition ${
                          iconifyFilter === f.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {iconifyError && (
                    <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-[10.5px] text-rose-700">
                      {iconifyError}
                    </div>
                  )}

                  {iconifyTotal !== null && !iconifyError && (
                    <div className="text-[10px] text-slate-400 font-medium mb-1.5 flex items-center justify-between">
                      <span>{iconifyTotal.toLocaleString()} icons matched</span>
                      <span>Free SVG • Recolorable</span>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
                    {isSearchingIconify ? (
                      <div className="col-span-4 py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <Loader2 size={20} className="animate-spin text-indigo-500" />
                        <span className="text-[11px]">Searching Iconify...</span>
                      </div>
                    ) : iconifyResults.length === 0 ? (
                      <div className="col-span-4 py-8 text-center text-[11px] text-slate-400">
                        Search any icon or emoji (e.g. graduation, star, rocket, ribbon).
                      </div>
                    ) : (
                      iconifyResults.map((item) => {
                        const isInserting = insertingSlug === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            disabled={isInserting}
                            onClick={() => handleInsertIconify(item)}
                            title={item.id}
                            className="flex flex-col items-center p-1.5 rounded-xl border border-slate-200/80 hover:border-indigo-500 hover:bg-indigo-50/40 transition disabled:opacity-60"
                          >
                            <div className="w-full h-11 flex items-center justify-center bg-slate-50 rounded-lg mb-1 p-1.5">
                              <img
                                src={item.previewUrl}
                                alt={item.name}
                                loading="lazy"
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <span className="text-[9px] font-semibold text-slate-700 truncate w-full text-center">
                              {isInserting ? 'Adding...' : item.name}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              {stockTab === 'wikimedia' && (
                <>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSearchWikimedia();
                    }}
                    className="flex items-center gap-1.5 mb-2"
                  >
                    <input
                      type="text"
                      placeholder="Search Wikimedia Commons SVGs & photos..."
                      value={wikimediaQuery}
                      onChange={(e) => setWikimediaQuery(e.target.value)}
                      className="flex-1 px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-[11px] outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={isSearchingWikimedia}
                      className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      {isSearchingWikimedia ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Search size={12} />
                      )}
                      <span>Find</span>
                    </button>
                  </form>

                  <div className="flex items-center gap-1 mb-2 flex-wrap">
                    {(
                      [
                        { id: 'svg', label: 'Vector SVG / Clipart' },
                        { id: 'photo', label: 'Photos' },
                        { id: 'all', label: 'All Media' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setWikimediaFilter(f.id);
                          handleSearchWikimedia(wikimediaQuery, f.id);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[9.5px] font-semibold transition ${
                          wikimediaFilter === f.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {wikimediaError && (
                    <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-[10.5px] text-rose-700">
                      {wikimediaError}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                    {isSearchingWikimedia ? (
                      <div className="col-span-3 py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <Loader2 size={20} className="animate-spin text-indigo-500" />
                        <span className="text-[11px]">Searching Wikimedia Commons...</span>
                      </div>
                    ) : wikimediaResults.length === 0 ? (
                      <div className="col-span-3 py-8 text-center text-[11px] text-slate-400">
                        Search public-domain cliparts or photos (e.g. trophy, laurel, sunset).
                      </div>
                    ) : (
                      wikimediaResults.map((item) => {
                        const isInserting = insertingSlug === String(item.pageid);
                        return (
                          <button
                            key={item.pageid}
                            type="button"
                            disabled={isInserting}
                            onClick={() => handleInsertWikimedia(item)}
                            title={item.cleanTitle}
                            className="flex flex-col items-center p-1.5 rounded-xl border border-slate-200/80 hover:border-indigo-500 hover:bg-indigo-50/40 transition disabled:opacity-60"
                          >
                            <div className="w-full h-14 flex items-center justify-center bg-slate-50 rounded-lg mb-1 overflow-hidden p-1 relative">
                              <img
                                src={toProxiedWikimediaUrl(item.thumbUrl)}
                                alt={item.cleanTitle}
                                loading="lazy"
                                className="max-w-full max-h-full object-contain"
                              />
                              {item.mime === 'image/svg+xml' && (
                                <span className="absolute top-0.5 right-0.5 px-1 py-0.2 bg-indigo-600 text-white text-[8px] font-bold rounded">
                                  SVG
                                </span>
                              )}
                            </div>
                            <span className="text-[9.5px] font-semibold text-slate-700 truncate w-full text-center">
                              {isInserting ? 'Inserting...' : item.cleanTitle}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </FloatingDropdown>
          </div>

          {/* Stickers Picker (Single Source of Truth shared with Collage Vibe Packs) */}
          <div className="relative">
            <button
              ref={stickerBtnRef}
              onClick={() => setIsStickersOpen(!isStickersOpen)}
              className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
              title="Insert Decorative & Vibe Pack Stickers"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all shadow-xs">
                <Smile size={16} />
              </div>
              <span className="text-[10px] font-medium mt-1 text-slate-600">Stickers</span>
            </button>

            <FloatingDropdown
              isOpen={isStickersOpen}
              onClose={() => setIsStickersOpen(false)}
              anchorRef={stickerBtnRef}
              className="p-3 w-88"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700">
                  Stickers ({STICKER_CATALOG.length})
                </span>
                <span className="text-[9.5px] text-slate-400 font-semibold">
                  Includes Vibe Pack Stickers
                </span>
              </div>
              <input
                type="text"
                placeholder="Search stickers (e.g. owl, leaf, grad, cat)..."
                value={stickerSearch}
                onChange={(e) => setStickerSearch(e.target.value)}
                className="w-full mb-2 px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-[11px] outline-none focus:border-amber-500"
              />
              <div className="flex items-center gap-1 mb-2.5 flex-wrap">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'vibe', label: 'Vibe Packs' },
                    { id: 'people', label: 'People' },
                    { id: 'animals', label: 'Animals' },
                    { id: 'plants', label: 'Plants' },
                    { id: 'objects', label: 'Objects' },
                    { id: 'school-office', label: 'School/Office' },
                    { id: 'celebration', label: 'Celebration' },
                    { id: 'love', label: 'Love' },
                    { id: 'holiday', label: 'Holiday' },
                    { id: 'travel', label: 'Travel' },
                    { id: 'kawaii', label: 'Kawaii' },
                    { id: 'doodles', label: 'Doodles' },
                    { id: 'nature', label: 'Nature' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setStickerCategory(cat.id)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition ${
                      stickerCategory === cat.id
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
                {STICKER_CATALOG.filter((stk) => {
                  const matchesSearch =
                    !stickerSearch.trim() ||
                    stk.name.toLowerCase().includes(stickerSearch.toLowerCase());
                  if (!matchesSearch) return false;
                  if (stickerCategory === 'all') return true;
                  if (stickerCategory === 'vibe') return Boolean(stk.vibePackIds?.length);
                  return stk.category === stickerCategory;
                }).map((stk) => (
                  <button
                    key={stk.id}
                    onClick={() => {
                      addImage(stk.dataUri, {
                        name: stk.name,
                        width: 140,
                        height: 140,
                        objectFit: 'contain',
                        effectPreset: 'sticker',
                        isSticker: true,
                        stickerOutlineColor: '#ffffff',
                        stickerOutlineWidth: 5,
                        stickerFinish: 'matte',
                        borderWidth: 0,
                      });
                      setIsStickersOpen(false);
                    }}
                    className="group/item flex flex-col items-center p-1.5 rounded-xl border border-slate-200/80 hover:border-amber-500 hover:bg-amber-50/40 transition"
                    title={stk.name}
                  >
                    <img
                      src={stk.dataUri}
                      alt={stk.name}
                      className="w-12 h-12 object-contain mb-1"
                    />
                    <span className="text-[9.5px] font-semibold text-slate-700 truncate w-full text-center">
                      {stk.name}
                    </span>
                  </button>
                ))}
              </div>
            </FloatingDropdown>
          </div>

          {/* Quick Shapes */}
          <button
            onClick={() => addShape('rounded-rect')}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Add Rounded Rectangle"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-200 transition-all shadow-xs">
              <Square size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Shape</span>
          </button>

          {/* Line */}
          <button
            onClick={() => addLine()}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Insert Horizontal Divider Line"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-200 transition-all shadow-xs">
              <Minus size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Divider</span>
          </button>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Media</span>
      </div>

      {/* 4. Building Blocks */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2 my-auto">
          {/* Coupon */}
          <button
            onClick={() => addAccent('coupon')}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Insert Tear-off Special Coupon"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
              <Scissors size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Coupon</span>
          </button>

          {/* Pull Quote */}
          <button
            onClick={() => addAccent('pull-quote')}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Insert Large Pull Quote Accent"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
              <Quote size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Pull Quote</span>
          </button>

          {/* Masthead */}
          <button
            onClick={() => addAccent('masthead')}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Insert Newspaper / Newsletter Masthead"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
              <Layout size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Masthead</span>
          </button>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Blocks</span>
      </div>

      {/* 5. Typography Styles */}
      <div className="flex flex-col justify-between h-full py-1 px-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          {/* WordArt Gallery */}
          <button
            onClick={() => setIsWordArtModalOpen(true)}
            className="flex flex-col items-center p-1.5 hover:bg-amber-50 active:scale-95 rounded-xl transition-all group"
            title="Insert WordArt Styles"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all text-amber-600 shadow-xs">
              <Sparkles size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">WordArt</span>
          </button>

          {/* QR Code Popover Prompt */}
          <div className="relative">
            <button
              ref={qrBtnRef}
              onClick={() => setIsQrOpen(!isQrOpen)}
              className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
              title="Create & Insert Scannable QR Code"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-all text-slate-800 shadow-xs">
                <QrCode size={16} />
              </div>
              <span className="text-[10px] font-medium mt-1 text-slate-600">QR Code</span>
            </button>

            <FloatingDropdown
              isOpen={isQrOpen}
              onClose={() => setIsQrOpen(false)}
              anchorRef={qrBtnRef}
              className="p-3 w-72 space-y-2.5"
            >
              <div className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                <span>Insert QR Code</span>
                <span className="text-[10px] text-slate-400 font-medium">Scannable PNG</span>
              </div>

              {/* QR Content Type Pills */}
              <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
                {(
                  [
                    { id: 'url', label: 'URL' },
                    { id: 'wifi', label: 'Wi-Fi' },
                    { id: 'email', label: 'Email' },
                    { id: 'phone', label: 'Phone' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setQrMode(tab.id);
                      if (tab.id === 'url' && !qrInput.startsWith('http')) setQrInput('https://example.com');
                      if (tab.id === 'email' && qrInput.startsWith('http')) setQrInput('hello@example.com');
                      if (tab.id === 'phone' && qrInput.startsWith('http')) setQrInput('+1 555 123 4567');
                    }}
                    className={`py-1 rounded-lg text-[10.5px] font-semibold transition ${
                      qrMode === tab.id
                        ? 'bg-white text-indigo-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {qrMode === 'wifi' ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Wi-Fi Network Name (SSID)"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none focus:border-indigo-600"
                  />
                  <input
                    type="text"
                    placeholder="Wi-Fi Password"
                    value={wifiPass}
                    onChange={(e) => setWifiPass(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none focus:border-indigo-600"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  autoFocus
                  placeholder={
                    qrMode === 'email'
                      ? 'hello@yourbrand.com'
                      : qrMode === 'phone'
                      ? '+1 555 123 4567'
                      : 'https://yourwebsite.com'
                  }
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addQRCode(buildQrPayload());
                      setIsQrOpen(false);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none focus:border-indigo-600"
                />
              )}

              <button
                type="button"
                onClick={() => {
                  addQRCode(buildQrPayload());
                  setIsQrOpen(false);
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Generate &amp; Insert QR
              </button>
            </FloatingDropdown>
          </div>

          {/* Page Number */}
          <button
            onClick={addPageNumberToken}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Insert Dynamic Page Number"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all text-slate-700 shadow-xs">
              <Hash size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Page #</span>
          </button>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Smart Tools</span>
      </div>
    </div>
  );
};
