import React, { useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { STICKER_CATALOG, StickerCategory } from '../../constants/stickerLibrary';
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
  Package,
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
    isStockArtPanelOpen,
    isAssetPackPanelOpen,
    setIsStockArtPanelOpen,
    setIsAssetPackPanelOpen,
    setIsCollageModalOpen,
  } = usePublisher();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableBtnRef = useRef<HTMLButtonElement>(null);
  const placeholderBtnRef = useRef<HTMLButtonElement>(null);
  const stickerBtnRef = useRef<HTMLButtonElement>(null);
  const qrBtnRef = useRef<HTMLButtonElement>(null);
  const [tableGridHover, setTableGridHover] = useState<{ r: number; c: number }>({ r: 3, c: 3 });
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);
  const [isPlaceholderOpen, setIsPlaceholderOpen] = useState(false);
  const [isStickersOpen, setIsStickersOpen] = useState(false);
  const [stickerCategory, setStickerCategory] = useState<'all' | 'vibe' | StickerCategory>('all');
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrMode, setQrMode] = useState<'url' | 'wifi' | 'email' | 'phone'>('url');
  const [qrInput, setQrInput] = useState('https://example.com');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [stickerSearch, setStickerSearch] = useState('');

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
    <div className="flex items-center h-[84px] px-2 py-1.5 gap-2 text-xs text-[#161a22] overflow-x-auto select-none">
      {/* 1. Pages Group */}
      <div className="flex flex-col justify-between h-full py-1 pr-2 border-r border-[#e5e9ee] flex-shrink-0">
        <div className="flex items-center gap-1 my-auto">
          <button
            onClick={addPage}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#f4f2ff] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] text-xs font-medium text-[#161a22] transition-all cursor-pointer"
            title="Insert Blank Page"
          >
            <FilePlus size={15} className="text-[#6e56cf]" />
            <span>New Page</span>
          </button>

          <button
            onClick={duplicateActivePage}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#f4f2ff] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] text-xs font-medium text-[#161a22] transition-all cursor-pointer"
            title="Duplicate Current Page"
          >
            <Copy size={15} className="text-[#4a5661]" />
            <span>Duplicate</span>
          </button>
        </div>
        <span className="text-[10px] text-[#6a7682] font-bold uppercase tracking-[0.09em] text-center">Pages</span>
      </div>

      {/* 2. Tables Group */}
      <div className="flex flex-col justify-between h-full py-1 px-2 border-r border-[#e5e9ee] flex-shrink-0 relative">
        <div className="my-auto">
          <button
            ref={tableBtnRef}
            onClick={() => setIsTableDropdownOpen(!isTableDropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#f4f2ff] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] text-xs font-medium text-[#161a22] transition-all cursor-pointer"
            title="Insert Table"
          >
            <TableIcon size={15} className="text-[#6e56cf]" />
            <span>Table</span>
          </button>

          <FloatingDropdown
            isOpen={isTableDropdownOpen}
            onClose={() => setIsTableDropdownOpen(false)}
            anchorRef={tableBtnRef}
            className="p-3 w-48"
          >
            <div className="text-[11px] font-semibold text-[#161a22] mb-2 tabular-nums">
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
                      className={`w-5 h-5 border rounded-[4px] cursor-pointer transition ${
                        isHighlighted
                          ? 'bg-[#6e56cf] border-[#5c4bb8]'
                          : 'bg-[#f8fafb] border-[#e5e9ee] hover:bg-[#efeafd]'
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
              className="w-full text-center py-1.5 bg-[#f3f5f7] hover:bg-[#f4f2ff] hover:text-[#5c4bb8] rounded-[8px] text-xs font-medium text-[#161a22] transition cursor-pointer"
            >
              Insert 3×3 Grid
            </button>
          </FloatingDropdown>
        </div>
        <span className="text-[10px] text-[#6a7682] font-bold uppercase tracking-[0.09em] text-center">Tables</span>
      </div>

      {/* 3. Illustrations & Media */}
      <div className="flex flex-col justify-between h-full py-1 px-2 border-r border-[#e5e9ee] flex-shrink-0">
        <div className="flex items-center gap-1 my-auto">
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
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#f4f2ff] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] text-xs font-medium text-[#161a22] transition-all cursor-pointer"
            title="Upload Picture"
          >
            <ImageIcon size={15} className="text-[#6e56cf]" />
            <span>Picture</span>
          </button>

          {/* Picture Placeholder with Shape/Ratio Presets */}
          <div className="relative">
            <button
              ref={placeholderBtnRef}
              onClick={() => setIsPlaceholderOpen(!isPlaceholderOpen)}
              className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#f4f2ff] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] text-xs font-medium text-[#161a22] transition-all cursor-pointer"
              title="Insert Empty Picture Placeholder (Drag & drop or customize anytime)"
            >
              <ImagePlus size={15} className="text-[#6e56cf]" />
              <span>Placeholder</span>
            </button>

            <FloatingDropdown
              isOpen={isPlaceholderOpen}
              onClose={() => setIsPlaceholderOpen(false)}
              anchorRef={placeholderBtnRef}
              className="p-2.5 w-52 space-y-1"
            >
              <div className="text-[10px] font-bold text-[#6a7682] uppercase tracking-[0.09em] px-1 pb-1">
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
                  className="w-full text-left px-2.5 py-1.5 rounded-[8px] hover:bg-[#f4f2ff] hover:text-[#5c4bb8] text-[11px] font-semibold text-[#161a22] transition flex items-center justify-between cursor-pointer"
                >
                  <span>{preset.label}</span>
                  <span className="text-[9.5px] text-[#6a7682] font-normal tabular-nums">
                    {preset.opts.width}×{preset.opts.height}
                  </span>
                </button>
              ))}
              <div className="pt-1 border-t border-[#e5e9ee]">
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
                  className="w-full text-center py-1.5 rounded-[8px] bg-[#efeafd] hover:bg-[#d5ecea] text-[#5c4bb8] text-[11px] font-bold transition cursor-pointer"
                >
                  + Staggered 3-Slot Row
                </button>
              </div>
            </FloatingDropdown>
          </div>

          {/* Free Hybrid AI Image Studio */}
          <button
            onClick={() => setIsAIImageModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#f4f2ff] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] text-xs font-medium text-[#161a22] transition-all cursor-pointer"
            title="Free AI Image Studio (Hybrid Cloud + Offline Art)"
          >
            <Wand2 size={15} className="text-[#6e56cf]" />
            <span>AI Image</span>
          </button>

          {/* Photo Collage Builder */}
          <button
            onClick={() => setIsCollageModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#f4f2ff] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] text-xs font-medium text-[#161a22] transition-all cursor-pointer"
            title="Create Multi-Photo Collage Grid"
          >
            <LayoutGrid size={15} className="text-[#6e56cf]" />
            <span>Collage</span>
          </button>

          {/* Stock Art & Clipart Unified Inspector Panel */}
          <button
            onClick={() => {
              const next = !isStockArtPanelOpen;
              setIsStockArtPanelOpen(next);
              if (next) setIsAssetPackPanelOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 active:scale-95 rounded-[8px] text-xs transition-all cursor-pointer ${
              isStockArtPanelOpen
                ? 'bg-[#efeafd] text-[#5c4bb8] font-semibold'
                : 'hover:bg-[#f4f2ff] hover:text-[#5c4bb8] font-medium text-[#161a22]'
            }`}
            title="Open Unified Stock Art & Clipart Panel (Built-in, Clipart.Free, Iconify, Wikimedia)"
          >
            <Images size={15} className="text-[#6e56cf]" />
            <span>Stock Art</span>
          </button>

          {/* Storybook asset packs: one kit, placed by layer. Mutually exclusive with Stock Art,
              because both own the same right-hand column. */}
          <button
            onClick={() => {
              const next = !isAssetPackPanelOpen;
              setIsAssetPackPanelOpen(next);
              if (next) setIsStockArtPanelOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 active:scale-95 rounded-[8px] text-xs transition-all cursor-pointer ${
              isAssetPackPanelOpen
                ? 'bg-[#efeafd] text-[#5c4bb8] font-semibold'
                : 'hover:bg-[#f4f2ff] hover:text-[#5c4bb8] font-medium text-[#161a22]'
            }`}
            title="Storybook & Reading Corner asset pack — backdrops, frames and stickers, all offline"
          >
            <Package size={15} className="text-[#6e56cf]" />
            <span>Story Kit</span>
          </button>

          {/* Stickers Picker (Single Source of Truth shared with Collage Vibe Packs) */}
          <div className="relative">
            <button
              ref={stickerBtnRef}
              onClick={() => setIsStickersOpen(!isStickersOpen)}
              className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#f4f2ff] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] text-xs font-medium text-[#161a22] transition-all cursor-pointer"
              title="Insert Decorative & Vibe Pack Stickers"
            >
              <Smile size={15} className="text-[#6e56cf]" />
              <span>Stickers</span>
            </button>

            <FloatingDropdown
              isOpen={isStickersOpen}
              onClose={() => setIsStickersOpen(false)}
              anchorRef={stickerBtnRef}
              className="p-3 w-88"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#161a22]">
                  Stickers ({STICKER_CATALOG.length})
                </span>
                <span className="text-[9.5px] text-[#6a7682] font-semibold">
                  Includes Vibe Pack Stickers
                </span>
              </div>
              <input
                type="text"
                placeholder="Search stickers (e.g. owl, leaf, grad, cat)..."
                value={stickerSearch}
                onChange={(e) => setStickerSearch(e.target.value)}
                className="w-full mb-2 px-2.5 py-1 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] focus:bg-white text-[11px] outline-none focus:border-[#b3a4f2]"
              />
              <div className="flex items-center gap-1 mb-2.5 flex-wrap">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'vibe', label: 'Vibe Packs' },
                    { id: 'certificates', label: 'Certificates' },
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
                    className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold transition cursor-pointer ${
                      stickerCategory === cat.id
                        ? 'bg-[#efeafd] text-[#5c4bb8]'
                        : 'bg-[#f3f5f7] text-[#4a5661] hover:bg-[#f4f2ff] hover:text-[#5c4bb8]'
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
                    className="group/item flex flex-col items-center p-1.5 rounded-[8px] border border-[#e5e9ee] hover:border-[#6e56cf] hover:bg-[#f4f2ff] transition cursor-pointer"
                    title={stk.name}
                  >
                    <img
                      src={stk.dataUri}
                      alt={stk.name}
                      className="w-12 h-12 object-contain mb-1"
                    />
                    <span className="text-[9.5px] font-semibold text-[#161a22] truncate w-full text-center">
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
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#f4f2ff] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] text-xs font-medium text-[#161a22] transition-all cursor-pointer"
            title="Add Rounded Rectangle"
          >
            <Square size={15} className="text-[#4a5661]" />
            <span>Shape</span>
          </button>

          {/* Line */}
          <button
            onClick={() => addLine()}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#f4f2ff] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] text-xs font-medium text-[#161a22] transition-all cursor-pointer"
            title="Insert Horizontal Divider Line"
          >
            <Minus size={15} className="text-[#4a5661]" />
            <span>Divider</span>
          </button>
        </div>
        <span className="text-[10px] text-[#6a7682] font-bold uppercase tracking-[0.09em] text-center">Media</span>
      </div>

      {/* 4. Building Blocks */}
      <div className="flex flex-col justify-between h-full py-1 px-2 border-r border-[#e5e9ee] flex-shrink-0">
        <div className="flex items-center gap-1 my-auto">
          <button
            onClick={() => addAccent('coupon')}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#f4f2ff] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] text-xs font-medium text-[#161a22] transition-all cursor-pointer"
            title="Insert Tear-off Special Coupon"
          >
            <Scissors size={15} className="text-[#6e56cf]" />
            <span>Coupon</span>
          </button>

          <button
            onClick={() => addAccent('pull-quote')}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#f4f2ff] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] text-xs font-medium text-[#161a22] transition-all cursor-pointer"
            title="Insert Large Pull Quote Accent"
          >
            <Quote size={15} className="text-[#6e56cf]" />
            <span>Pull Quote</span>
          </button>

          <button
            onClick={() => addAccent('masthead')}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#f4f2ff] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] text-xs font-medium text-[#161a22] transition-all cursor-pointer"
            title="Insert Newspaper / Newsletter Masthead"
          >
            <Layout size={15} className="text-[#6e56cf]" />
            <span>Masthead</span>
          </button>
        </div>
        <span className="text-[10px] text-[#6a7682] font-bold uppercase tracking-[0.09em] text-center">Blocks</span>
      </div>

      {/* 5. Typography Styles */}
      <div className="flex flex-col justify-between h-full py-1 px-3 flex-shrink-0">
        <div className="flex items-center gap-1 my-auto">
          <button
            onClick={() => setIsWordArtModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#f4f2ff] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] text-xs font-medium text-[#161a22] transition-all cursor-pointer"
            title="Insert WordArt Styles"
          >
            <Sparkles size={15} className="text-[#6e56cf]" />
            <span>WordArt</span>
          </button>

          {/* QR Code Popover Prompt */}
          <div className="relative">
            <button
              ref={qrBtnRef}
              onClick={() => setIsQrOpen(!isQrOpen)}
              className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#f4f2ff] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] text-xs font-medium text-[#161a22] transition-all cursor-pointer"
              title="Create & Insert Scannable QR Code"
            >
              <QrCode size={15} className="text-[#4a5661]" />
              <span>QR Code</span>
            </button>

            <FloatingDropdown
              isOpen={isQrOpen}
              onClose={() => setIsQrOpen(false)}
              anchorRef={qrBtnRef}
              className="p-3 w-72 space-y-2.5"
            >
              <div className="text-[11px] font-bold text-[#161a22] flex items-center justify-between">
                <span>Insert QR Code</span>
                <span className="text-[10px] text-[#6a7682] font-medium">Scannable PNG</span>
              </div>

              {/* QR Content Type Pills */}
              <div className="grid grid-cols-4 gap-1 bg-[#f3f5f7] p-1 rounded-[8px] border border-[#e5e9ee]">
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
                    className={`py-1 rounded-[6px] text-[10.5px] font-semibold transition cursor-pointer ${
                      qrMode === tab.id
                        ? 'bg-[#efeafd] text-[#5c4bb8]'
                        : 'text-[#4a5661] hover:text-[#161a22]'
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
                    className="w-full px-2.5 py-1.5 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] focus:bg-white text-xs outline-none focus:border-[#b3a4f2]"
                  />
                  <input
                    type="text"
                    placeholder="Wi-Fi Password"
                    value={wifiPass}
                    onChange={(e) => setWifiPass(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] focus:bg-white text-xs outline-none focus:border-[#b3a4f2]"
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
                  className="w-full px-2.5 py-1.5 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] focus:bg-white text-xs outline-none focus:border-[#b3a4f2]"
                />
              )}

              <button
                type="button"
                onClick={() => {
                  addQRCode(buildQrPayload());
                  setIsQrOpen(false);
                }}
                className="w-full py-1.5 px-3 rounded-[8px] bg-[#6e56cf] hover:bg-[#5c4bb8] text-white text-xs font-semibold transition cursor-pointer"
              >
                Generate &amp; Insert QR
              </button>
            </FloatingDropdown>
          </div>

          <button
            onClick={addPageNumberToken}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#f4f2ff] hover:text-[#5c4bb8] active:scale-95 rounded-[8px] text-xs font-medium text-[#161a22] transition-all cursor-pointer"
            title="Insert Dynamic Page Number"
          >
            <Hash size={15} className="text-[#4a5661]" />
            <span>Page #</span>
          </button>
        </div>
        <span className="text-[10px] text-[#6a7682] font-bold uppercase tracking-[0.09em] text-center">Smart Tools</span>
      </div>
    </div>
  );
};
