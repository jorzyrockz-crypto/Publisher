import React, { useEffect, useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { SHAPE_CATALOG } from '../../utils/shapePaths';
import { ShapePreviewIcon } from '../common/ShapePreviewIcon';
import type { ShapeType } from '../../types/publisher';
import {
  MousePointer2,
  Hand,
  Type,
  Square,
  Minus,
  Image as ImageIcon,
  Shapes,
  Table as TableIcon,
  QrCode,
  Sparkles,
  Wand2,
  Palette,
  PanelLeft,
  PanelRight,
  ChevronRight,
} from 'lucide-react';

export const DesignerToolRail: React.FC = () => {
  const {
    toolMode,
    setToolMode,
    addTextBox,
    addShape,
    addLine,
    addPicturePlaceholder,
    addTable,
    addQRCode,
    isStockArtPanelOpen,
    setIsStockArtPanelOpen,
    setIsWordArtModalOpen,
    setIsAIImageModalOpen,
    setIsBrandKitModalOpen,
    isLeftPanelOpen,
    setIsLeftPanelOpen,
    isRightPanelOpen,
    setIsRightPanelOpen,
  } = usePublisher();

  const [lastShape, setLastShape] = useState<ShapeType>('rounded-rect');
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const shapeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shapeMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (shapeMenuRef.current && !shapeMenuRef.current.contains(e.target as Node)) {
        setShapeMenuOpen(false);
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [shapeMenuOpen]);

  // Single-key Designer tool shortcuts (V, H, T, U, L, I, S, G, Q, W, A, B)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          e.preventDefault();
          setToolMode('select');
          break;
        case 'h':
          e.preventDefault();
          setToolMode('pan');
          break;
        case 't':
          e.preventDefault();
          addTextBox();
          setToolMode('select');
          break;
        case 'u':
          e.preventDefault();
          addShape(lastShape);
          setToolMode('select');
          break;
        case 'l':
          e.preventDefault();
          addLine();
          setToolMode('select');
          break;
        case 'i':
          e.preventDefault();
          addPicturePlaceholder();
          setToolMode('select');
          break;
        case 's':
          e.preventDefault();
          setIsStockArtPanelOpen(!isStockArtPanelOpen);
          break;
        case 'g':
          e.preventDefault();
          addTable(3, 3);
          setToolMode('select');
          break;
        case 'q':
          e.preventDefault();
          addQRCode();
          setToolMode('select');
          break;
        case 'w':
          e.preventDefault();
          setIsWordArtModalOpen(true);
          break;
        case 'a':
          e.preventDefault();
          setIsAIImageModalOpen(true);
          break;
        case 'b':
          e.preventDefault();
          setIsBrandKitModalOpen(true);
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    addLine,
    addPicturePlaceholder,
    addQRCode,
    addShape,
    addTable,
    addTextBox,
    isStockArtPanelOpen,
    lastShape,
    setIsAIImageModalOpen,
    setIsBrandKitModalOpen,
    setIsStockArtPanelOpen,
    setIsWordArtModalOpen,
    setToolMode,
  ]);

  const railBtn = (active = false) =>
    `w-9 h-9 rounded-[8px] flex items-center justify-center transition-all cursor-pointer relative ${
      active
        ? 'bg-[#efeafd] text-[#5c4bb8] shadow-2xs ring-1 ring-[#d3c9f9]'
        : 'text-[#4a5661] hover:text-[#161a22] hover:bg-[#f4f2ff]'
    }`;

  return (
    <aside
      className="w-[48px] bg-white border-r border-[#e5e9ee] flex flex-col items-center justify-between py-2 select-none flex-shrink-0 z-30"
      aria-label="Designer Tool Rail"
    >
      {/* Top & Middle: Primary Creation Tools */}
      <div className="flex flex-col items-center gap-1 w-full px-1">
        <button
          type="button"
          onClick={() => setToolMode('select')}
          className={railBtn(toolMode === 'select')}
          title="Select & Move Tool (V)"
        >
          <MousePointer2 size={16} />
        </button>

        <button
          type="button"
          onClick={() => setToolMode('pan')}
          className={railBtn(toolMode === 'pan')}
          title="Hand / Pan Canvas (H)"
        >
          <Hand size={16} />
        </button>

        <div className="w-6 h-[1px] bg-[#e5e9ee] my-1" />

        <button
          type="button"
          onClick={() => {
            addTextBox();
            setToolMode('select');
          }}
          className={railBtn(false)}
          title="Insert Text Box (T)"
        >
          <Type size={16} />
        </button>

        {/* Shape Tool with Flyout Picker */}
        <div className="relative" ref={shapeMenuRef}>
          <button
            type="button"
            onClick={() => {
              addShape(lastShape);
              setToolMode('select');
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setShapeMenuOpen((v) => !v);
            }}
            className={railBtn(shapeMenuOpen)}
            title="Insert Shape (U) — click arrow for more shapes"
          >
            <Square size={16} />
          </button>
          <button
            type="button"
            onClick={() => setShapeMenuOpen((v) => !v)}
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded bg-white border border-[#e5e9ee] flex items-center justify-center text-[#6a7682] hover:text-[#5c4bb8] cursor-pointer"
            title="Choose Shape"
            aria-label="Choose Shape"
          >
            <ChevronRight size={9} />
          </button>

          {shapeMenuOpen && (
            <div className="absolute left-11 top-0 w-56 bg-white border border-[#e5e9ee] rounded-[12px] shadow-xl p-2 z-50">
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6a7682] px-1 pb-1.5">
                Vector Shapes
              </div>
              <div className="grid grid-cols-4 gap-1">
                {SHAPE_CATALOG.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setLastShape(item.type);
                      addShape(item.type);
                      setShapeMenuOpen(false);
                      setToolMode('select');
                    }}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-[8px] border transition cursor-pointer ${
                      lastShape === item.type
                        ? 'border-[#d3c9f9] bg-[#f4f2ff] text-[#5c4bb8]'
                        : 'border-transparent hover:bg-[#f8fafb] text-[#4a5661]'
                    }`}
                    title={item.label}
                  >
                    <ShapePreviewIcon shapeType={item.type} size={20} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            addLine();
            setToolMode('select');
          }}
          className={railBtn(false)}
          title="Insert Line (L)"
        >
          <Minus size={16} className="-rotate-45" />
        </button>

        <button
          type="button"
          onClick={() => {
            addPicturePlaceholder();
            setToolMode('select');
          }}
          className={railBtn(false)}
          title="Insert Picture Frame (I)"
        >
          <ImageIcon size={16} />
        </button>

        <button
          type="button"
          onClick={() => setIsStockArtPanelOpen(!isStockArtPanelOpen)}
          className={railBtn(isStockArtPanelOpen)}
          title="Stock Photos & Clipart (S)"
        >
          <Shapes size={16} />
        </button>

        <button
          type="button"
          onClick={() => {
            addTable(3, 3);
            setToolMode('select');
          }}
          className={railBtn(false)}
          title="Insert 3x3 Table (G)"
        >
          <TableIcon size={16} />
        </button>

        <button
          type="button"
          onClick={() => {
            addQRCode();
            setToolMode('select');
          }}
          className={railBtn(false)}
          title="Insert QR Code (Q)"
        >
          <QrCode size={16} />
        </button>

        <div className="w-6 h-[1px] bg-[#e5e9ee] my-1" />

        <button
          type="button"
          onClick={() => setIsWordArtModalOpen(true)}
          className={railBtn(false)}
          title="WordArt Gallery (W)"
        >
          <Sparkles size={16} />
        </button>

        <button
          type="button"
          onClick={() => setIsAIImageModalOpen(true)}
          className={railBtn(false)}
          title="AI Image Studio (A)"
        >
          <Wand2 size={16} className="text-[#6e56cf]" />
        </button>

        <button
          type="button"
          onClick={() => setIsBrandKitModalOpen(true)}
          className={railBtn(false)}
          title="Brand Kit & Swatches (B)"
        >
          <Palette size={16} />
        </button>
      </div>

      {/* Bottom: Studio Panel Toggles */}
      <div className="flex flex-col items-center gap-1 w-full px-1 pt-2 border-t border-[#e5e9ee]">
        <button
          type="button"
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          className={railBtn(isLeftPanelOpen)}
          title={isLeftPanelOpen ? 'Hide Layers / Pages Panel' : 'Show Layers / Pages Panel'}
        >
          <PanelLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          className={railBtn(isRightPanelOpen)}
          title={isRightPanelOpen ? 'Hide Inspector Panel' : 'Show Inspector Panel'}
        >
          <PanelRight size={16} />
        </button>
      </div>
    </aside>
  );
};
