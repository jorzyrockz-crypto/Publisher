import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  PublisherElement,
  TextElement,
  ShapeElement,
  ImageElement,
  TableElement,
  AccentElement,
  LineElement,
  QRElement,
} from '../../types/publisher';
import { Scissors, Quote, Award, QrCode, ImagePlus, Upload } from 'lucide-react';
import { buildWavyRectPath } from '../../utils/shapePaths';

interface ElementRendererProps {
  element: PublisherElement;
  isSelected: boolean;
  isDropTarget?: boolean;
  pageNumber?: number;
  totalPages?: number;
  onTextChange?: (newText: string) => void;
  onTableCellChange?: (row: number, col: number, value: string) => void;
  onImageReplace?: (src: string, name?: string) => void;
}

export const ElementRenderer: React.FC<ElementRendererProps> = React.memo(
  ({
    element,
    isSelected,
    isDropTarget = false,
    pageNumber = 1,
    totalPages = 1,
    onTextChange,
    onTableCellChange,
    onImageReplace,
  }) => {
  const renderInner = () => {
    switch (element.type) {
      case 'text':
        return (
          <TextRenderer
            element={element}
            isSelected={isSelected}
            pageNumber={pageNumber}
            totalPages={totalPages}
            onTextChange={onTextChange}
          />
        );
      case 'shape':
        return <ShapeRenderer element={element} />;
      case 'image':
        return (
          <ImageRenderer
            element={element}
            isDropTarget={isDropTarget}
            onImageReplace={onImageReplace}
          />
        );
      case 'table':
        return (
          <TableRenderer
            element={element}
            isSelected={isSelected}
            onTableCellChange={onTableCellChange}
          />
        );
      case 'accent':
        return <AccentRenderer element={element} />;
      case 'line':
        return <LineRenderer element={element} />;
      case 'qr':
        return <QRRenderer element={element} />;
      default:
        return null;
    }
  };

  const scaleX = element.flipH ? -1 : 1;
  const scaleY = element.flipV ? -1 : 1;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        transform: scaleX !== 1 || scaleY !== 1 ? `scale(${scaleX}, ${scaleY})` : undefined,
        mixBlendMode: element.blendMode || 'normal',
      }}
    >
      {renderInner()}
    </div>
  );
  },
  (prev, next) =>
    prev.element === next.element &&
    prev.isSelected === next.isSelected &&
    prev.pageNumber === next.pageNumber &&
    prev.totalPages === next.totalPages
);

const TextRenderer: React.FC<{
  element: TextElement;
  isSelected: boolean;
  pageNumber: number;
  totalPages: number;
  onTextChange?: (t: string) => void;
}> = ({ element, isSelected, pageNumber, totalPages, onTextChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync element.text into the contentEditable DOM only when entering edit mode or when not focused
  useEffect(() => {
    if (isSelected && editorRef.current) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerText = element.text;
      }
    }
  }, [isSelected, element.id, element.text]);

  const getWordArtClass = () => {
    if (!element.isWordArt) return '';
    switch (element.wordArtStyle) {
      case 'rainbow':
        return 'wordart-rainbow';
      case 'gold3d':
        return 'wordart-gold3d';
      case 'outline':
        return 'wordart-outline';
      case 'retro':
        return 'wordart-retro';
      case 'neon-glow':
        return 'wordart-neon-glow';
      case 'chrome':
        return 'wordart-chrome';
      case 'fire':
        return 'wordart-fire';
      case 'comic-pop':
        return 'wordart-comic-pop';
      case 'emerald-3d':
        return 'wordart-indigo-3d';
      case 'sunset-gradient':
        return 'wordart-sunset-gradient';
      default:
        return '';
    }
  };

  // Render drop cap if requested and text starts with a letter
  const renderTextContent = () => {
    const resolvedText = isSelected
      ? element.text
      : element.text
          .replace(/{{PageNumber}}/gi, String(pageNumber))
          .replace(/{{TotalPages}}/gi, String(totalPages));

    if (element.dropCap && resolvedText && resolvedText.length > 0) {
      const firstLetter = resolvedText[0];
      const rest = resolvedText.slice(1);
      return (
        <span>
          <span
            style={{
              float: 'left',
              fontSize: `${element.fontSize * 2.8}px`,
              lineHeight: 0.8,
              paddingRight: '6px',
              paddingTop: '4px',
              fontFamily: 'Georgia, serif',
              fontWeight: 'bold',
              color: element.color,
            }}
          >
            {firstLetter}
          </span>
          {rest}
        </span>
      );
    }
    return resolvedText;
  };

  const sharedStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: element.backgroundColor || 'transparent',
    border: element.borderWidth
      ? `${element.borderWidth}px ${element.borderStyle || 'solid'} ${element.borderColor || '#000'}`
      : 'none',
    borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
    padding: `${element.padding}px`,
    color: element.color,
    fontFamily: element.fontFamily,
    fontSize: `${element.fontSize}px`,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle,
    textDecoration: element.textDecoration,
    textTransform: element.textTransform || 'none',
    fontVariant: element.fontVariant || 'normal',
    letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
    wordSpacing: element.wordSpacing ? `${element.wordSpacing}px` : undefined,
    textIndent: element.textIndent ? `${element.textIndent}px` : undefined,
    WebkitTextStroke: element.textStrokeWidth
      ? `${element.textStrokeWidth}px ${element.textStrokeColor || '#000000'}`
      : undefined,
    textShadow: element.shadow
      ? `2px 3px ${element.shadowBlur ?? 6}px ${element.shadowColor || 'rgba(0,0,0,0.35)'}`
      : undefined,
    transform: element.baselineShift ? `translateY(${-element.baselineShift}px)` : undefined,
    textAlign: element.textAlign,
    lineHeight: element.lineHeight,
    columnCount: element.columns,
    columnGap: `${element.columnGap}px`,
    columnRule: element.columns > 1 ? '1px solid #e2e8f0' : 'none',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    display: 'flex',
    flexDirection: 'column',
    justifyContent:
      element.verticalAlign === 'middle'
        ? 'center'
        : element.verticalAlign === 'bottom'
        ? 'flex-end'
        : 'flex-start',
    userSelect: isSelected ? 'text' : 'none',
    WebkitUserSelect: isSelected ? 'text' : 'none',
    cursor: isSelected ? 'text' : 'inherit',
    outline: 'none',
  };

  if (isSelected) {
    return (
      <div
        ref={editorRef}
        style={sharedStyle}
        className={getWordArtClass()}
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          const next = e.currentTarget.innerText;
          if (onTextChange && next !== element.text) {
            onTextChange(next);
          }
        }}
      />
    );
  }

  return (
    <div style={sharedStyle} className={getWordArtClass()}>
      {renderTextContent()}
    </div>
  );
};

const ShapeRenderer: React.FC<{ element: ShapeElement }> = ({ element }) => {
  const { width, height, shapeType, fillColor, strokeColor, strokeWidth, strokeDash, cornerRadius } =
    element;
  const dashArray =
    strokeDash === 'dashed' ? '8 4' : strokeDash === 'dotted' ? '3 3' : undefined;

  const filters: string[] = [];
  if (element.shadow) {
    filters.push(
      `drop-shadow(3px 4px ${element.shadowBlur || 6}px ${element.shadowColor || 'rgba(0,0,0,0.3)'})`
    );
  }
  if (element.glow) {
    filters.push(
      `drop-shadow(0 0 ${element.glowSize || 12}px ${element.glowColor || '#38bdf8'})`
    );
  }
  const shadowFilter = filters.length > 0 ? filters.join(' ') : undefined;

  const gradId = `grad-${element.id}`;
  const effectiveFill =
    element.fillType === 'linear-gradient' ? `url(#${gradId})` : fillColor;

  const renderSvgShape = () => {
    switch (shapeType) {
      case 'rectangle':
        if (element.waveEdge && element.waveEdge !== 'none') {
          return (
            <path
              d={buildWavyRectPath(
                width,
                height,
                strokeWidth,
                element.waveEdge,
                element.waveAmplitude ?? 18,
                element.waveFrequency ?? 2
              )}
              fill={effectiveFill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeLinejoin="round"
            />
          );
        }
        return (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={effectiveFill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      case 'rounded-rect': {
        const maxR = Math.min(width, height) / 2;
        const rxVal =
          element.adjustValue !== undefined ? element.adjustValue * maxR : cornerRadius ?? 12;
        return (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            rx={rxVal}
            fill={effectiveFill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      }
      case 'circle':
        return (
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={(width - strokeWidth) / 2}
            ry={(height - strokeWidth) / 2}
            fill={effectiveFill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      case 'triangle': {
        const apexX = width * (element.adjustValue ?? 0.5);
        return (
          <polygon
            points={`${apexX},${strokeWidth} ${width - strokeWidth},${height - strokeWidth} ${strokeWidth},${height - strokeWidth}`}
            fill={effectiveFill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      }
      case 'diamond':
        return (
          <polygon
            points={`${width / 2},${strokeWidth} ${width - strokeWidth},${height / 2} ${width / 2},${height - strokeWidth} ${strokeWidth},${height / 2}`}
            fill={effectiveFill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      case 'star': {
        const cx = width / 2;
        const cy = height / 2;
        const outerR = Math.min(cx, cy) - strokeWidth;
        const innerR = outerR * (element.adjustValue ?? 0.45);
        const points: string[] = [];
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
        }
        return (
          <polygon
            points={points.join(' ')}
            fill={effectiveFill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      }
      case 'banner': {
        const notch = width * (element.adjustValue ?? 0.12);
        return (
          <path
            d={`M 0 0 L ${width} 0 L ${width - notch} ${height / 2} L ${width} ${height} L 0 ${height} L ${notch} ${height / 2} Z`}
            fill={effectiveFill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      }
      case 'callout':
        return (
          <path
            d={`M 10 10 
                H ${width - 10} 
                A 10 10 0 0 1 ${width} 20 
                V ${height - 30} 
                A 10 10 0 0 1 ${width - 10} ${height - 20} 
                H 60 
                L 30 ${height - 2} 
                L 40 ${height - 20} 
                H 10 
                A 10 10 0 0 1 0 ${height - 30} 
                V 20 
                A 10 10 0 0 1 10 10 Z`}
            fill={effectiveFill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      case 'arrow-right': {
        const arrowHeadW = width * (element.adjustValue ?? 0.32);
        const shaftH = height * 0.5;
        const shaftY = (height - shaftH) / 2;
        return (
          <polygon
            points={`0,${shaftY} ${width - arrowHeadW},${shaftY} ${width - arrowHeadW},0 ${width},${height / 2} ${width - arrowHeadW},${height} ${width - arrowHeadW},${shaftY + shaftH} 0,${shaftY + shaftH}`}
            fill={effectiveFill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      }
      case 'heart':
        return (
          <path
            d={`M ${width / 2} ${height * 0.85}
                C ${width * 0.15} ${height * 0.6}, 0 ${height * 0.35}, 0 ${height * 0.22}
                C 0 ${height * 0.08}, ${width * 0.2} 0, ${width * 0.38} 0
                C ${width * 0.46} 0, ${width / 2} ${height * 0.12}, ${width / 2} ${height * 0.12}
                C ${width / 2} ${height * 0.12}, ${width * 0.54} 0, ${width * 0.62} 0
                C ${width * 0.8} 0, ${width} ${height * 0.08}, ${width} ${height * 0.22}
                C ${width} ${height * 0.35}, ${width * 0.85} ${height * 0.6}, ${width / 2} ${height * 0.85} Z`}
            fill={effectiveFill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      case 'arrow-double': {
        const headW = width * (element.adjustValue ?? 0.25);
        const shaftH = height * 0.45;
        const shaftY = (height - shaftH) / 2;
        return (
          <polygon
            points={`0,${height / 2} ${headW},0 ${headW},${shaftY} ${width - headW},${shaftY} ${width - headW},0 ${width},${height / 2} ${width - headW},${height} ${width - headW},${shaftY + shaftH} ${headW},${shaftY + shaftH} ${headW},${height}`}
            fill={effectiveFill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      }
      case 'hexagon': {
        const pts = [
          `${width * 0.25},${strokeWidth}`,
          `${width * 0.75},${strokeWidth}`,
          `${width - strokeWidth},${height / 2}`,
          `${width * 0.75},${height - strokeWidth}`,
          `${width * 0.25},${height - strokeWidth}`,
          `${strokeWidth},${height / 2}`,
        ];
        return (
          <polygon
            points={pts.join(' ')}
            fill={effectiveFill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      }
      case 'badge-burst': {
        const cx = width / 2;
        const cy = height / 2;
        const outerR = Math.min(cx, cy) - strokeWidth;
        const innerR = outerR * (element.adjustValue ?? 0.78);
        const pts: string[] = [];
        for (let i = 0; i < 24; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (i * Math.PI) / 12;
          pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
        }
        return (
          <polygon
            points={pts.join(' ')}
            fill={effectiveFill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      }
      case 'parallelogram': {
        const skew = width * (element.adjustValue ?? 0.2);
        return (
          <polygon
            points={`${skew},${strokeWidth} ${width - strokeWidth},${strokeWidth} ${width - skew},${height - strokeWidth} ${strokeWidth},${height - strokeWidth}`}
            fill={effectiveFill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      }
      case 'trapezoid': {
        const inset = width * (element.adjustValue ?? 0.18);
        return (
          <polygon
            points={`${inset},${strokeWidth} ${width - inset},${strokeWidth} ${width - strokeWidth},${height - strokeWidth} ${strokeWidth},${height - strokeWidth}`}
            fill={effectiveFill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      }
      case 'pentagon': {
        const cx = width / 2;
        const cy = height / 2;
        const r = Math.min(cx, cy) - strokeWidth;
        const pts = Array.from({ length: 5 }, (_, i) => {
          const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        });
        return (
          <polygon
            points={pts.join(' ')}
            fill={effectiveFill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      }
      case 'cross': {
        const arm = element.adjustValue ?? 0.35;
        const x1 = width * ((1 - arm) / 2);
        const x2 = width * ((1 + arm) / 2);
        const y1 = height * ((1 - arm) / 2);
        const y2 = height * ((1 + arm) / 2);
        return (
          <polygon
            points={`${x1},${strokeWidth} ${x2},${strokeWidth} ${x2},${y1} ${width - strokeWidth},${y1} ${width - strokeWidth},${y2} ${x2},${y2} ${x2},${height - strokeWidth} ${x1},${height - strokeWidth} ${x1},${y2} ${strokeWidth},${y2} ${strokeWidth},${y1} ${x1},${y1}`}
            fill={effectiveFill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      }
      case 'cloud':
        return (
          <path
            d={`M ${width * 0.25} ${height * 0.8}
                C ${width * 0.08} ${height * 0.8}, ${width * 0.04} ${height * 0.55}, ${width * 0.18} ${height * 0.45}
                C ${width * 0.16} ${height * 0.22}, ${width * 0.38} ${height * 0.12}, ${width * 0.52} ${height * 0.24}
                C ${width * 0.64} ${height * 0.1}, ${width * 0.88} ${height * 0.2}, ${width * 0.84} ${height * 0.44}
                C ${width * 0.96} ${height * 0.52}, ${width * 0.94} ${height * 0.8}, ${width * 0.75} ${height * 0.8} Z`}
            fill={effectiveFill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      case 'merged': {
        const parts = element.mergedParts || [];
        if (parts.length === 0) return null;
        const op = element.mergeOp || 'union';
        const maskId = `merge-mask-${element.id}`;
        const clipId = `merge-clip-${element.id}`;

        const renderPartTransform = (p: (typeof parts)[0]) =>
          `translate(${p.x}, ${p.y}) rotate(${p.rotation}, ${p.width / 2}, ${p.height / 2})`;

        if (op === 'subtract' && parts.length >= 2) {
          return (
            <>
              <defs>
                <mask id={maskId}>
                  <path
                    d={parts[0].d}
                    transform={renderPartTransform(parts[0])}
                    fill="#ffffff"
                  />
                  {parts.slice(1).map((p, idx) => (
                    <path
                      key={idx}
                      d={p.d}
                      transform={renderPartTransform(p)}
                      fill="#000000"
                    />
                  ))}
                </mask>
              </defs>
              <g mask={`url(#${maskId})`}>
                <path
                  d={parts[0].d}
                  transform={renderPartTransform(parts[0])}
                  fill={effectiveFill}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={dashArray}
                />
              </g>
            </>
          );
        }

        if (op === 'intersect' && parts.length >= 2) {
          return (
            <>
              <defs>
                <clipPath id={clipId}>
                  <path d={parts[1].d} transform={renderPartTransform(parts[1])} />
                </clipPath>
              </defs>
              <g clipPath={`url(#${clipId})`}>
                <path
                  d={parts[0].d}
                  transform={renderPartTransform(parts[0])}
                  fill={effectiveFill}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={dashArray}
                />
              </g>
            </>
          );
        }

        if (op === 'combine' && parts.length >= 2) {
          return (
            <>
              <defs>
                <mask id={`${maskId}-a`}>
                  <rect width={width} height={height} fill="#ffffff" />
                  {parts.slice(1).map((p, idx) => (
                    <path
                      key={idx}
                      d={p.d}
                      transform={renderPartTransform(p)}
                      fill="#000000"
                    />
                  ))}
                </mask>
                <mask id={`${maskId}-b`}>
                  <rect width={width} height={height} fill="#ffffff" />
                  <path
                    d={parts[0].d}
                    transform={renderPartTransform(parts[0])}
                    fill="#000000"
                  />
                </mask>
              </defs>
              <g>
                <path
                  d={parts[0].d}
                  transform={renderPartTransform(parts[0])}
                  fill={effectiveFill}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={dashArray}
                  mask={`url(#${maskId}-a)`}
                />
                {parts.slice(1).map((p, idx) => (
                  <path
                    key={idx}
                    d={p.d}
                    transform={renderPartTransform(p)}
                    fill={effectiveFill}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray}
                    mask={`url(#${maskId}-b)`}
                  />
                ))}
              </g>
            </>
          );
        }

        // Union
        return (
          <g>
            {parts.map((p, idx) => (
              <path
                key={idx}
                d={p.d}
                transform={renderPartTransform(p)}
                fill={effectiveFill}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
              />
            ))}
          </g>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        width={width}
        height={height}
        style={{
          overflow: 'visible',
          filter: shadowFilter,
        }}
      >
        {element.fillType === 'linear-gradient' && (
          <defs>
            <linearGradient
              id={gradId}
              gradientTransform={`rotate(${element.gradientAngle ?? 90}, 0.5, 0.5)`}
            >
              <stop offset="0%" stopColor={fillColor} />
              <stop offset="100%" stopColor={element.gradientColor2 || '#38bdf8'} />
            </linearGradient>
          </defs>
        )}
        {renderSvgShape()}
      </svg>
      {element.label && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: element.labelColor || '#ffffff',
            fontSize: `${element.labelFontSize || 14}px`,
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '8px',
            pointerEvents: 'none',
          }}
        >
          {element.label}
        </div>
      )}
    </div>
  );
};

const ImageRenderer: React.FC<{
  element: ImageElement;
  isDropTarget?: boolean;
  onImageReplace?: (src: string, name?: string) => void;
}> = ({ element, isDropTarget = false, onImageReplace }) => {
  const placeholderInputRef = useRef<HTMLInputElement>(null);
  const getFilterStyle = () => {
    const filters: string[] = [];
    if (element.brightness !== undefined && element.brightness !== 100) {
      filters.push(`brightness(${element.brightness}%)`);
    }
    if (element.contrast !== undefined && element.contrast !== 100) {
      filters.push(`contrast(${element.contrast}%)`);
    }
    if (element.saturate !== undefined && element.saturate !== 100) {
      filters.push(`saturate(${element.saturate}%)`);
    }
    if (element.grayscale !== undefined && element.grayscale > 0) {
      filters.push(`grayscale(${element.grayscale}%)`);
    }
    if (element.sepia !== undefined && element.sepia > 0) {
      filters.push(`sepia(${element.sepia}%)`);
    }
    if (element.blur !== undefined && element.blur > 0) {
      filters.push(`blur(${element.blur}px)`);
    }
    if (element.hueRotate !== undefined && element.hueRotate !== 0) {
      filters.push(`hue-rotate(${element.hueRotate}deg)`);
    }
    return filters.length > 0 ? filters.join(' ') : undefined;
  };

  const getBorderArtClasses = () => {
    const hoverLift =
      art === 'puffy-clay' || art === 'doodle-box' || art === 'candy-stripe' || art === 'stitched-scrapbook'
        ? 'border-art-interactive '
        : '';
    switch (element.borderArt) {
      case 'double-gold':
        return `${hoverLift}border-4 border-amber-500 ring-2 ring-amber-300 ring-offset-2`;
      case 'art-deco':
        return `${hoverLift}border-4 border-slate-800 shadow-[0_0_0_3px_#fff,0_0_0_6px_#334155]`;
      case 'dots-and-dashes':
        return `${hoverLift}border-4 border-dashed border-indigo-600`;
      default:
        return hoverLift.trim();
    }
  };

  const getMaskRadius = () => {
    if (element.maskShape === 'circle') return '50%';
    if (element.maskShape === 'rounded') return '24px';
    return element.borderRadius ? `${element.borderRadius}px` : undefined;
  };

  const getClipPath = () => {
    switch (element.maskShape) {
      case 'star':
        return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
      case 'diamond':
        return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
      case 'hexagon':
        return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
      case 'triangle':
        return 'polygon(50% 0%, 0% 100%, 100% 100%)';
      case 'heart':
        return 'polygon(50% 88%, 12% 52%, 4% 28%, 18% 10%, 38% 10%, 50% 24%, 62% 10%, 82% 10%, 96% 28%, 88% 52%)';
      default:
        return undefined;
    }
  };

  const imgScale = element.imageScale || 1;
  const panX = element.panX || 0;
  const panY = element.panY || 0;

  const art = element.borderArt || 'none';
  const artColor = element.borderArtColor || element.borderColor || '#ffffff';
  const artColor2 = element.borderArtColor2 || '#4f46e5';
  const artWidth = element.borderArtWidth ?? (art !== 'none' ? 4 : 0);
  const artPad =
    element.borderArtPadding ??
    (art === 'polaroid'
      ? 10
      : art === 'stitched-scrapbook' || art === 'stamp-postage'
      ? 12
      : art !== 'none' && art !== 'dots-and-dashes'
      ? 6
      : 0);
  const effect = element.effectPreset || 'none';

  const getOuterEffectStyle = (): React.CSSProperties => {
    const shadows: string[] = [];
    if (element.shadow) {
      shadows.push(`0 8px ${element.shadowBlur || 14}px rgba(0,0,0,0.28)`);
    }
    if (effect === 'sticker') {
      shadows.push('0 0 0 6px #ffffff', '0 10px 20px rgba(15,23,42,0.25)');
    } else if (effect === 'clay') {
      shadows.push(
        '0 12px 24px rgba(15,23,42,0.18)',
        'inset 0 6px 12px rgba(255,255,255,0.65)',
        'inset 0 -6px 12px rgba(15,23,42,0.16)'
      );
    } else if (effect === 'cartoon') {
      shadows.push('5px 5px 0 #0f172a');
    } else if (effect === 'animation') {
      shadows.push('0 0 18px rgba(56,189,248,0.45)');
    } else if (art === 'neon-frame') {
      shadows.push(`0 0 14px ${artColor}`, `0 0 28px ${artColor2}`);
    } else if (art === 'art-deco') {
      shadows.push(`0 0 0 3px ${artColor2}`, `0 0 0 6px ${artColor}`);
    } else if (art === 'double-gold') {
      shadows.push(`0 0 0 3px ${artColor2}`, `0 0 0 6px ${artColor}`);
    } else if (art === 'polaroid') {
      shadows.push('0 8px 20px rgba(15,23,42,0.22)');
    } else if (art === 'puffy-clay') {
      shadows.push(`0 8px 0 ${artColor2}`, '0 12px 20px rgba(0, 131, 143, 0.15)');
    } else if (art === 'doodle-box') {
      shadows.push(`6px 6px 0 ${artColor2}`);
    }

    let outerBorder = element.borderWidth
      ? `${element.borderWidth}px solid ${element.borderColor || '#cbd5e1'}`
      : undefined;
    if (effect === 'cartoon') {
      outerBorder = '3px solid #0f172a';
    } else if (art === 'dots-and-dashes') {
      outerBorder = `${artWidth}px dashed ${artColor}`;
    } else if (art === 'stamp-postage') {
      outerBorder = `2px solid ${artColor2}`;
    } else if (art === 'filmstrip') {
      outerBorder = `${artWidth}px solid ${artColor}`;
    } else if (art === 'stitched-scrapbook') {
      outerBorder = `${Math.max(4, artWidth)}px solid ${artColor}`;
    } else if (art === 'candy-stripe') {
      outerBorder = undefined;
    } else if (art === 'puffy-clay') {
      outerBorder = `${Math.max(2, artWidth)}px solid #ffffff`;
    } else if (art === 'pastel-rainbow') {
      outerBorder = `${Math.max(3, artWidth)}px solid transparent`;
    } else if (art === 'doodle-box') {
      outerBorder = `${Math.max(2, artWidth)}px solid #3d348b`;
    } else if (art === 'dotted-double') {
      outerBorder = `${Math.max(2, artWidth)}px solid ${artColor2}`;
    } else if (art !== 'none') {
      outerBorder = `${artWidth}px solid ${artColor}`;
    }

    const borderRadiusStyle =
      effect === 'clay'
        ? '26px'
        : effect === 'sticker'
        ? '18px'
        : art === 'stitched-scrapbook' || art === 'dotted-double'
        ? '16px'
        : art === 'candy-stripe'
        ? '18px'
        : art === 'puffy-clay'
        ? '24px'
        : art === 'pastel-rainbow'
        ? '20px'
        : art === 'doodle-box'
        ? '16px 22px 18px 24px'
        : getMaskRadius();

    let backgroundImage: string | undefined;
    if (art === 'candy-stripe') {
      backgroundImage = `repeating-linear-gradient(45deg, ${artColor}, ${artColor} 10px, ${artColor2} 10px, ${artColor2} 20px)`;
    } else if (art === 'pastel-rainbow') {
      backgroundImage = `linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, ${artColor}, #fad0c4, ${artColor2}, #c2e9fb)`;
    }

    const stampMask =
      art === 'stamp-postage'
        ? 'radial-gradient(8px at 8px 8px, #0000 98%, #000) -8px -8px / 20px 20px'
        : undefined;

    return {
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow:
        art === 'washi-tape' ||
        art === 'dotted-double' ||
        art === 'doodle-box' ||
        art === 'puffy-clay' ||
        effect === 'sticker'
          ? 'visible'
          : 'hidden',
      borderRadius: borderRadiusStyle,
      clipPath: getClipPath(),
      backgroundColor:
        art === 'polaroid' ||
        art === 'classic-frame' ||
        art === 'stamp-postage' ||
        art === 'filmstrip' ||
        art === 'stitched-scrapbook' ||
        art === 'puffy-clay' ||
        art === 'doodle-box' ||
        art === 'dotted-double'
          ? artColor
          : undefined,
      backgroundImage,
      backgroundOrigin: art === 'pastel-rainbow' ? 'padding-box, border-box' : undefined,
      backgroundClip: art === 'pastel-rainbow' ? 'padding-box, border-box' : undefined,
      outline:
        art === 'stitched-scrapbook'
          ? `2px dashed ${artColor2}`
          : art === 'dotted-double'
          ? '4px dotted #d8b4fe'
          : undefined,
      outlineOffset:
        art === 'stitched-scrapbook' ? '-8px' : art === 'dotted-double' ? '4px' : undefined,
      mask: stampMask,
      WebkitMask: stampMask,
      padding:
        art === 'polaroid'
          ? `${artPad}px ${artPad}px ${Math.max(26, artPad * 2.8)}px ${artPad}px`
          : artPad > 0
          ? `${artPad}px`
          : undefined,
      border: outerBorder,
      boxShadow: shadows.length > 0 ? shadows.join(', ') : undefined,
      boxSizing: 'border-box',
    };
  };

  return (
    <div style={getOuterEffectStyle()} className={getBorderArtClasses()}>
      {/* Decorative Corner Accents for Specialized Collage BorderArt */}
      {art === 'washi-tape' && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              left: '-14px',
              width: '56px',
              height: '18px',
              backgroundColor: artColor,
              opacity: 0.85,
              transform: 'rotate(-26deg)',
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              right: '-14px',
              width: '56px',
              height: '18px',
              backgroundColor: artColor2,
              opacity: 0.85,
              transform: 'rotate(24deg)',
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      {art === 'stars' && (
        <>
          <span
            style={{
              position: 'absolute',
              top: '2px',
              left: '4px',
              color: artColor,
              fontSize: '14px',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            ★
          </span>
          <span
            style={{
              position: 'absolute',
              bottom: '2px',
              right: '4px',
              color: artColor2,
              fontSize: '14px',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            ★
          </span>
        </>
      )}

      <div
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: art === 'candy-stripe' ? artColor2 : undefined,
          padding: art === 'candy-stripe' ? '4px' : undefined,
          borderRadius:
            art === 'polaroid'
              ? '4px'
              : art === 'candy-stripe'
              ? '10px'
              : effect === 'clay' || art === 'puffy-clay'
              ? '18px'
              : art === 'stitched-scrapbook' ||
                art === 'pastel-rainbow' ||
                art === 'doodle-box' ||
                art === 'dotted-double'
              ? '10px'
              : undefined,
          position: 'relative',
        }}
      >
        {element.src ? (
          <img
            src={element.src}
            alt={element.alt || 'Publication image'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: element.objectFit || 'cover',
              objectPosition: `${50 + panX}% ${50 + panY}%`,
              transform: imgScale !== 1 ? `scale(${imgScale})` : undefined,
              filter: getFilterStyle(),
              pointerEvents: 'none',
            }}
          />
        ) : (
          <div
            className={`w-full h-full relative flex flex-col items-center justify-center overflow-hidden transition-colors ${
              isDropTarget
                ? 'bg-indigo-50/90 border-2 border-indigo-500 ring-4 ring-indigo-300/60 text-indigo-700'
                : 'bg-slate-100/90 border border-dashed border-slate-300 text-slate-500'
            }`}
            style={{ filter: getFilterStyle() }}
          >
            {/* Subtle diagonal placeholder guides */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-45"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <line x1="0" y1="0" x2="100" y2="100" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="100" y1="0" x2="0" y2="100" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
            </svg>

            <input
              ref={placeholderInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onImageReplace) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    onImageReplace(
                      String(ev.target?.result || ''),
                      file.name.replace(/\.[^.]+$/, '')
                    );
                  };
                  reader.readAsDataURL(file);
                }
                e.target.value = '';
              }}
            />

            <div className="relative z-10 flex flex-col items-center gap-1.5 px-2 text-center">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                  isDropTarget
                    ? 'bg-indigo-600 text-white scale-110 transition-transform'
                    : 'bg-white/95 border border-slate-200 text-indigo-600'
                }`}
              >
                {isDropTarget ? <Upload size={17} /> : <ImagePlus size={17} />}
              </div>
              <span className="text-[11px] font-bold tracking-tight">
                {isDropTarget ? 'Drop Image to Fill' : element.name || 'Picture Placeholder'}
              </span>
              {!isDropTarget && element.width >= 110 && element.height >= 95 && (
                <>
                  {onImageReplace && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        placeholderInputRef.current?.click();
                      }}
                      className="px-2.5 py-1 rounded-full bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-[10px] font-bold shadow-xs transition cursor-pointer"
                    >
                      Choose Photo
                    </button>
                  )}
                  <span className="text-[9.5px] text-slate-400">
                    Drag photo here • {Math.round(element.width)}×{Math.round(element.height)}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {art === 'polaroid' && element.borderArtCaption && (
        <div
          style={{
            position: 'absolute',
            left: '8px',
            right: '8px',
            bottom: '4px',
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'Georgia, serif',
            color: '#334155',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            pointerEvents: 'none',
          }}
        >
          {element.borderArtCaption}
        </div>
      )}
    </div>
  );
};

const TableRenderer: React.FC<{
  element: TableElement;
  isSelected: boolean;
  onTableCellChange?: (row: number, col: number, val: string) => void;
}> = ({ element, isSelected, onTableCellChange }) => {
  const showHeader = element.showHeaderRow !== false;
  const banded = element.bandedRows !== false;
  const pad = element.cellPadding ?? 8;
  const baseFontSize = element.fontSize ?? 12;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        border: `${element.borderWidth}px solid ${element.borderColor}`,
        backgroundColor: element.cellBg || '#ffffff',
        borderRadius: '6px',
      }}
    >
      <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {element.data.map((row, rIdx) => {
            const isHeader = showHeader && rIdx === 0;
            const isAlt = !isHeader && banded && rIdx % 2 === 0;
            const rowBg = isHeader
              ? element.headerBg
              : isAlt && element.altRowBg
              ? element.altRowBg
              : element.cellBg;

            return (
              <tr key={rIdx}>
                {row.map((cellText, cIdx) => (
                  <td
                    key={cIdx}
                    style={{
                      border: `${element.borderWidth}px solid ${element.borderColor}`,
                      backgroundColor: rowBg,
                      color: isHeader ? element.headerColor : element.cellColor,
                      fontWeight: isHeader ? 'bold' : 'normal',
                      padding: `${pad}px ${pad + 4}px`,
                      fontSize: `${isHeader ? baseFontSize + 1 : baseFontSize}px`,
                    }}
                    contentEditable={isSelected}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      if (onTableCellChange) {
                        onTableCellChange(rIdx, cIdx, e.currentTarget.innerText);
                      }
                    }}
                  >
                    {cellText}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const AccentRenderer: React.FC<{ element: AccentElement }> = ({ element }) => {
  switch (element.accentType) {
    case 'coupon':
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            border: `2px dashed ${element.accentColor}`,
            backgroundColor: '#ffffff',
            padding: '16px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div className="absolute -top-3 left-4 bg-white px-2 flex items-center gap-1 text-xs text-slate-500 font-mono">
            <Scissors size={14} className="text-slate-600" />
            <span>CLIP & SAVE</span>
          </div>
          <div>
            <div
              style={{
                color: element.accentColor,
                fontSize: '18px',
                fontWeight: 'bold',
                fontFamily: 'Segoe UI',
              }}
            >
              {element.title}
            </div>
            <div className="text-sm font-semibold text-slate-700 mt-1">{element.subtitle}</div>
            <div className="text-xs text-slate-500 mt-2 leading-relaxed">{element.text}</div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 text-[11px] text-slate-400">
            <span>OFFICIAL PUBLISHER COUPON</span>
            <span className="font-mono font-bold text-slate-600">EXP: DEC 2026</span>
          </div>
        </div>
      );

    case 'pull-quote':
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderLeft: `5px solid ${element.accentColor}`,
            backgroundColor: '#f8fafc',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Quote size={28} style={{ color: element.accentColor }} className="mb-2 opacity-80" />
          <div
            style={{
              fontSize: '17px',
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif',
              color: '#1e293b',
              lineHeight: 1.4,
            }}
          >
            {element.title}
          </div>
          {element.subtitle && (
            <div
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: element.accentColor,
                marginTop: '8px',
              }}
            >
              {element.subtitle}
            </div>
          )}
        </div>
      );

    case 'masthead':
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderTop: `4px solid ${element.accentColor}`,
            borderBottom: `2px solid ${element.accentColor}`,
            padding: '10px 0',
            backgroundColor: '#ffffff',
          }}
        >
          <div
            style={{
              fontSize: '32px',
              fontWeight: '900',
              fontFamily: 'Georgia, serif',
              letterSpacing: '2px',
              color: element.accentColor,
              textAlign: 'center',
            }}
          >
            {element.title}
          </div>
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#64748b',
              marginTop: '4px',
              fontFamily: 'Segoe UI',
            }}
          >
            {element.subtitle}
          </div>
        </div>
      );

    case 'badge':
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: element.accentColor,
            color: '#ffffff',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '0 16px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            fontWeight: 'bold',
            fontSize: '12px',
            letterSpacing: '0.5px',
          }}
        >
          <Award size={16} />
          <span>{element.badgeText || 'SPECIAL AWARD'}</span>
        </div>
      );

    default:
      return null;
  }
};

const LineRenderer: React.FC<{ element: LineElement }> = ({ element }) => {
  const { width, strokeColor, strokeWidth, strokeDash } = element;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          height: `${strokeWidth}px`,
          backgroundColor: strokeDash === 'solid' ? strokeColor : 'transparent',
          borderTop:
            strokeDash !== 'solid'
              ? `${strokeWidth}px ${strokeDash || 'dashed'} ${strokeColor}`
              : undefined,
        }}
      />
    </div>
  );
};

const QRRenderer: React.FC<{ element: QRElement }> = ({ element }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(element.value || 'https://example.com', {
      margin: 1,
      width: 256,
      color: {
        dark: element.fgColor || '#0f172a',
        light: element.bgColor || '#ffffff',
      },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [element.value, element.fgColor, element.bgColor]);

  return (
    <div
      className="w-full h-full flex items-center justify-center rounded-lg overflow-hidden border border-slate-200/80 shadow-2xs"
      style={{ backgroundColor: element.bgColor || '#ffffff' }}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="QR Code"
          className="w-full h-full object-contain pointer-events-none"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-400">
          <QrCode size={32} />
          <span className="text-[10px] mt-1">QR Code</span>
        </div>
      )}
    </div>
  );
};
