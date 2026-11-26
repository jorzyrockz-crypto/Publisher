import React, { useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { SAMPLE_GRAPHICS, StockCategory } from '../../constants/sampleGraphics';
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
  const qrBtnRef = useRef<HTMLButtonElement>(null);
  const [tableGridHover, setTableGridHover] = useState<{ r: number; c: number }>({ r: 3, c: 3 });
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);
  const [isPlaceholderOpen, setIsPlaceholderOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrMode, setQrMode] = useState<'url' | 'wifi' | 'email' | 'phone'>('url');
  const [qrInput, setQrInput] = useState('https://example.com');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [stockCategory, setStockCategory] = useState<'All' | StockCategory>('All');
  const [stockSearch, setStockSearch] = useState('');

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
              className="p-3 w-88"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700">
                  Stock Art & Clipart ({SAMPLE_GRAPHICS.length})
                </span>
              </div>
              <input
                type="text"
                placeholder="Search clipart (e.g. rocket, cake, sunset)..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="w-full mb-2 px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-[11px] outline-none focus:border-indigo-500"
              />
              <div className="flex items-center gap-1 mb-2.5 flex-wrap">
                {(['All', 'Nature', 'Abstract', 'Business', 'Badges', 'Lifestyle'] as const).map((cat) => (
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
