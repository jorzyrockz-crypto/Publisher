import React, { useEffect, useState } from 'react';
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
import { Scissors, Quote, Award, QrCode } from 'lucide-react';

interface ElementRendererProps {
  element: PublisherElement;
  isSelected: boolean;
  pageNumber?: number;
  totalPages?: number;
  onTextChange?: (newText: string) => void;
  onTableCellChange?: (row: number, col: number, value: string) => void;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  isSelected,
  pageNumber = 1,
  totalPages = 1,
  onTextChange,
  onTableCellChange,
}) => {
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
      return <ImageRenderer element={element} />;
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

const TextRenderer: React.FC<{
  element: TextElement;
  isSelected: boolean;
  pageNumber: number;
  totalPages: number;
  onTextChange?: (t: string) => void;
}> = ({ element, isSelected, pageNumber, totalPages, onTextChange }) => {
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

  return (
    <div
      style={{
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
      }}
      className={getWordArtClass()}
      contentEditable={isSelected}
      suppressContentEditableWarning
      onBlur={(e) => {
        if (onTextChange) {
          onTextChange(e.currentTarget.innerText);
        }
      }}
    >
      {renderTextContent()}
    </div>
  );
};

const ShapeRenderer: React.FC<{ element: ShapeElement }> = ({ element }) => {
  const { width, height, shapeType, fillColor, strokeColor, strokeWidth, strokeDash, cornerRadius } =
    element;
  const dashArray =
    strokeDash === 'dashed' ? '8 4' : strokeDash === 'dotted' ? '3 3' : undefined;

  const shadowFilter = element.shadow
    ? `drop-shadow(3px 4px ${element.shadowBlur || 6}px ${element.shadowColor || 'rgba(0,0,0,0.3)'})`
    : undefined;

  const renderSvgShape = () => {
    switch (shapeType) {
      case 'rectangle':
        return (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      case 'rounded-rect':
        return (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            rx={cornerRadius || 12}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      case 'circle':
        return (
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={(width - strokeWidth) / 2}
            ry={(height - strokeWidth) / 2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      case 'triangle':
        return (
          <polygon
            points={`${width / 2},${strokeWidth} ${width - strokeWidth},${height - strokeWidth} ${strokeWidth},${height - strokeWidth}`}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      case 'diamond':
        return (
          <polygon
            points={`${width / 2},${strokeWidth} ${width - strokeWidth},${height / 2} ${width / 2},${height - strokeWidth} ${strokeWidth},${height / 2}`}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      case 'star': {
        // 5-point star
        const cx = width / 2;
        const cy = height / 2;
        const outerR = Math.min(cx, cy) - strokeWidth;
        const innerR = outerR * 0.45;
        const points: string[] = [];
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
        }
        return (
          <polygon
            points={points.join(' ')}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      }
      case 'banner':
        return (
          <path
            d={`M 0 0 L ${width} 0 L ${width - 25} ${height / 2} L ${width} ${height} L 0 ${height} L 25 ${height / 2} Z`}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
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
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
      case 'arrow-right': {
        const arrowHeadW = Math.min(width * 0.35, 45);
        const shaftH = height * 0.5;
        const shaftY = (height - shaftH) / 2;
        return (
          <polygon
            points={`0,${shaftY} ${width - arrowHeadW},${shaftY} ${width - arrowHeadW},0 ${width},${height / 2} ${width - arrowHeadW},${height} ${width - arrowHeadW},${shaftY + shaftH} 0,${shaftY + shaftH}`}
            fill={fillColor}
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
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        );
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

const ImageRenderer: React.FC<{ element: ImageElement }> = ({ element }) => {
  const getFilterStyle = () => {
    const filters: string[] = [];
    if (element.brightness !== undefined && element.brightness !== 100) {
      filters.push(`brightness(${element.brightness}%)`);
    }
    if (element.contrast !== undefined && element.contrast !== 100) {
      filters.push(`contrast(${element.contrast}%)`);
    }
    if (element.grayscale !== undefined && element.grayscale > 0) {
      filters.push(`grayscale(${element.grayscale}%)`);
    }
    return filters.length > 0 ? filters.join(' ') : undefined;
  };

  const getBorderArtClasses = () => {
    switch (element.borderArt) {
      case 'double-gold':
        return 'border-4 border-amber-500 ring-2 ring-amber-300 ring-offset-2';
      case 'art-deco':
        return 'border-4 border-slate-800 shadow-[0_0_0_3px_#fff,0_0_0_6px_#334155]';
      case 'dots-and-dashes':
        return 'border-4 border-dashed border-emerald-600';
      default:
        return '';
    }
  };

  const getMaskRadius = () => {
    if (element.maskShape === 'circle') return '50%';
    if (element.maskShape === 'rounded') return '24px';
    return element.borderRadius ? `${element.borderRadius}px` : undefined;
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: getMaskRadius(),
        border: element.borderWidth
          ? `${element.borderWidth}px solid ${element.borderColor || '#cbd5e1'}`
          : undefined,
      }}
      className={getBorderArtClasses()}
    >
      {element.src ? (
        <img
          src={element.src}
          alt={element.alt || 'Publication image'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: getFilterStyle(),
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 border border-dashed border-slate-300">
          <span className="text-xs font-semibold">Picture Placeholder</span>
          <span className="text-[10px] text-slate-400">Click to load image</span>
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
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        border: `${element.borderWidth}px solid ${element.borderColor}`,
        backgroundColor: '#ffffff',
      }}
    >
      <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {element.data.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cellText, cIdx) => {
                const isHeader = rIdx === 0;
                return (
                  <td
                    key={cIdx}
                    style={{
                      border: `${element.borderWidth}px solid ${element.borderColor}`,
                      backgroundColor: isHeader ? element.headerBg : element.cellBg,
                      color: isHeader ? element.headerColor : element.cellColor,
                      fontWeight: isHeader ? 'bold' : 'normal',
                      padding: '6px 10px',
                      fontSize: isHeader ? '13px' : '12px',
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
                );
              })}
            </tr>
          ))}
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
    QRCode.toDataURL(element.value || 'https://www.microsoft.com', {
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
