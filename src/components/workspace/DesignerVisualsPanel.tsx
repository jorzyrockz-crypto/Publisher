import React, { useMemo, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { SHAPE_CATALOG } from '../../utils/shapePaths';
import { ShapePreviewIcon } from '../common/ShapePreviewIcon';
import { SAMPLE_GRAPHICS } from '../../constants/sampleGraphics';
import type { ShapeType } from '../../types/publisher';
import {
  Search,
  Wand2,
  Sticker,
  Sparkles,
  Minus,
  Table as TableIcon,
  QrCode,
  Images,
  X,
} from 'lucide-react';

const SHAPE_FILLS: Record<string, { fill: string; stroke: string }> = {
  rectangle: { fill: '#b91c68', stroke: '#9d174d' },
  'rounded-rect': { fill: '#a78bfa', stroke: '#7c3aed' },
  circle: { fill: '#a5f3fc', stroke: '#06b6d4' },
  triangle: { fill: '#7dd3fc', stroke: '#0284c7' },
  star: { fill: '#fcd34d', stroke: '#d97706' },
  'badge-burst': { fill: '#f9a8d4', stroke: '#db2777' },
  hexagon: { fill: '#6ee7b7', stroke: '#059669' },
  pentagon: { fill: '#c4b5fd', stroke: '#6d28d9' },
  diamond: { fill: '#fda4af', stroke: '#e11d48' },
  heart: { fill: '#fb7185', stroke: '#e11d48' },
  cloud: { fill: '#bae6fd', stroke: '#0284c7' },
  callout: { fill: '#fed7aa', stroke: '#ea580c' },
};

export const DesignerVisualsPanel: React.FC<{
  onOpenMyMedia?: () => void;
}> = ({ onOpenMyMedia }) => {
  const {
    addShape,
    addLine,
    addTable,
    addQRCode,
    addImage,
    setIsAIImageModalOpen,
    setToolMode,
  } = usePublisher();

  const [query, setQuery] = useState('');
  const [showAllShapes, setShowAllShapes] = useState(false);
  const [showAllGraphics, setShowAllGraphics] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredShapes = useMemo(() => {
    if (!normalizedQuery) return SHAPE_CATALOG;
    return SHAPE_CATALOG.filter((s) =>
      s.label.toLowerCase().includes(normalizedQuery) ||
      s.type.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  const filteredGraphics = useMemo(() => {
    if (!normalizedQuery) return SAMPLE_GRAPHICS;
    return SAMPLE_GRAPHICS.filter(
      (g) =>
        g.name.toLowerCase().includes(normalizedQuery) ||
        g.category.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  const illustrationItems = useMemo(
    () =>
      filteredGraphics.filter((g) =>
        ['Badges', 'Education', 'Animals', 'Plants', 'People', 'Things'].includes(g.category)
      ),
    [filteredGraphics]
  );

  const sceneItems = useMemo(
    () =>
      filteredGraphics.filter((g) =>
        ['Nature', 'Abstract', 'Business', 'Lifestyle'].includes(g.category)
      ),
    [filteredGraphics]
  );

  const handleInsertShape = (type: ShapeType) => {
    const palette = SHAPE_FILLS[type];
    addShape(
      type,
      palette
        ? { fillColor: palette.fill, strokeColor: palette.stroke, strokeWidth: 0 }
        : undefined
    );
    setToolMode('select');
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Search everything */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-2.5 text-[#6a7682] pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search everything"
            className="w-full h-8 pl-8 pr-7 rounded-[9px] bg-[#f3f5f7] border border-transparent focus:border-[#6e56cf] focus:bg-white text-xs text-[#161a22] placeholder-[#6a7682] outline-none transition"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 text-[#6a7682] hover:text-[#161a22] cursor-pointer"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Sections */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {/* 1. Generate your own */}
        {!normalizedQuery && (
          <section className="space-y-2">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-semibold text-[#161a22]">Generate your own</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setIsAIImageModalOpen(true)}
                className="group flex flex-col items-center gap-1 cursor-pointer"
              >
                <div className="w-full aspect-square rounded-[12px] bg-gradient-to-br from-[#c4b5fd] via-[#a78bfa] to-[#6e56cf] flex items-center justify-center text-white shadow-xs group-hover:scale-[1.03] transition-transform">
                  <Wand2 size={24} />
                </div>
                <span className="text-[11px] font-medium text-[#4a5661] group-hover:text-[#5c4bb8]">
                  Images
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsAIImageModalOpen(true)}
                className="group flex flex-col items-center gap-1 cursor-pointer"
              >
                <div className="w-full aspect-square rounded-[12px] bg-gradient-to-br from-[#fb923c] to-[#9a3412] flex items-center justify-center text-white shadow-xs group-hover:scale-[1.03] transition-transform">
                  <Sticker size={24} />
                </div>
                <span className="text-[11px] font-medium text-[#4a5661] group-hover:text-[#5c4bb8]">
                  Stickers
                </span>
              </button>

              <button
                type="button"
                onClick={() => (onOpenMyMedia ? onOpenMyMedia() : setIsAIImageModalOpen(true))}
                className="group flex flex-col items-center gap-1 cursor-pointer"
              >
                <div className="w-full aspect-square rounded-[12px] bg-gradient-to-br from-[#fde68a] to-[#f59e0b] flex items-center justify-center text-[#78350f] shadow-xs group-hover:scale-[1.03] transition-transform">
                  <Sparkles size={24} />
                </div>
                <span className="text-[11px] font-medium text-[#4a5661] group-hover:text-[#5c4bb8]">
                  Icons
                </span>
              </button>
            </div>
          </section>
        )}

        {/* 2. Filled shapes */}
        {filteredShapes.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#161a22]">Filled shapes</h3>
              <button
                type="button"
                onClick={() => setShowAllShapes((v) => !v)}
                className="text-[11px] font-semibold text-[#5c4bb8] hover:underline cursor-pointer"
              >
                {showAllShapes ? 'Show less' : 'Show all'}
              </button>
            </div>

            {showAllShapes || normalizedQuery ? (
              <div className="grid grid-cols-4 gap-1.5">
                {filteredShapes.map((item) => {
                  const colors = SHAPE_FILLS[item.type] || {
                    fill: '#a78bfa',
                    stroke: '#7c3aed',
                  };
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleInsertShape(item.type)}
                      className="aspect-square rounded-[10px] bg-[#f6f7f9] hover:bg-[#efeafd] flex items-center justify-center transition cursor-pointer"
                      title={item.label}
                    >
                      <ShapePreviewIcon
                        shapeType={item.type}
                        size={28}
                        fill={colors.fill}
                        stroke={colors.stroke}
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {filteredShapes.slice(0, 6).map((item) => {
                  const colors = SHAPE_FILLS[item.type] || {
                    fill: '#a78bfa',
                    stroke: '#7c3aed',
                  };
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleInsertShape(item.type)}
                      className="w-[62px] h-[62px] flex-shrink-0 rounded-[10px] bg-[#f6f7f9] hover:bg-[#efeafd] flex items-center justify-center transition cursor-pointer"
                      title={item.label}
                    >
                      <ShapePreviewIcon
                        shapeType={item.type}
                        size={34}
                        fill={colors.fill}
                        stroke={colors.stroke}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 3. Lines, Tables & QR */}
        {!normalizedQuery && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#161a22]">Lines &amp; utilities</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  addLine();
                  setToolMode('select');
                }}
                className="h-14 rounded-[10px] bg-[#f6f7f9] hover:bg-[#efeafd] flex flex-col items-center justify-center gap-1 text-[#4a5661] hover:text-[#5c4bb8] transition cursor-pointer"
              >
                <Minus size={16} className="-rotate-45" />
                <span className="text-[10.5px] font-medium">Line</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  addTable(3, 3);
                  setToolMode('select');
                }}
                className="h-14 rounded-[10px] bg-[#f6f7f9] hover:bg-[#efeafd] flex flex-col items-center justify-center gap-1 text-[#4a5661] hover:text-[#5c4bb8] transition cursor-pointer"
              >
                <TableIcon size={16} />
                <span className="text-[10.5px] font-medium">Table</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  addQRCode();
                  setToolMode('select');
                }}
                className="h-14 rounded-[10px] bg-[#f6f7f9] hover:bg-[#efeafd] flex flex-col items-center justify-center gap-1 text-[#4a5661] hover:text-[#5c4bb8] transition cursor-pointer"
              >
                <QrCode size={16} />
                <span className="text-[10.5px] font-medium">QR Code</span>
              </button>
            </div>
          </section>
        )}

        {/* 4. Vector Illustrations & Badges */}
        {illustrationItems.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#161a22]">Illustrations &amp; badges</h3>
              <button
                type="button"
                onClick={() => setShowAllGraphics((v) => !v)}
                className="text-[11px] font-semibold text-[#5c4bb8] hover:underline cursor-pointer"
              >
                {showAllGraphics ? 'Show less' : 'Show all'}
              </button>
            </div>
            <div
              className={
                showAllGraphics || normalizedQuery
                  ? 'grid grid-cols-3 gap-2'
                  : 'flex items-center gap-2 overflow-x-auto pb-1'
              }
            >
              {(showAllGraphics || normalizedQuery
                ? illustrationItems
                : illustrationItems.slice(0, 6)
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    addImage(item.src, { width: 220, height: 220 });
                    setToolMode('select');
                  }}
                  className={`${
                    showAllGraphics || normalizedQuery ? 'aspect-square' : 'w-[78px] h-[78px] flex-shrink-0'
                  } rounded-[10px] bg-[#f6f7f9] hover:bg-[#efeafd] p-2 flex items-center justify-center transition cursor-pointer overflow-hidden`}
                  title={item.name}
                >
                  <img
                    src={item.src}
                    alt={item.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 5. Scenes & Stock Media Shortcut */}
        {sceneItems.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#161a22]">Scenes &amp; backdrops</h3>
              {onOpenMyMedia && (
                <button
                  type="button"
                  onClick={onOpenMyMedia}
                  className="text-[11px] font-semibold text-[#5c4bb8] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Images size={11} />
                  <span>All media</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {sceneItems.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    addImage(item.src, { width: 280, height: 200 });
                    setToolMode('select');
                  }}
                  className="w-[88px] h-[68px] flex-shrink-0 rounded-[10px] bg-[#f6f7f9] hover:ring-2 hover:ring-[#6e56cf] overflow-hidden transition cursor-pointer"
                  title={item.name}
                >
                  <img
                    src={item.src}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
