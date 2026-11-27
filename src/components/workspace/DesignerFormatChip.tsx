import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Monitor, Smartphone } from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import { PAGE_SIZES } from '../../constants/pageSizes';

const INCH = 96;

/** 816 px is 8.5″, but 1080 px is 11.25″ — a phone asset should not be read as inches. */
function isInchPage(width: number, height: number): boolean {
  return width % INCH === 0 && height % INCH === 0;
}

function formatDims(width: number, height: number): string {
  if (isInchPage(width, height)) {
    return `${width / INCH}″ × ${height / INCH}″`;
  }
  return `${width} × ${height} px`;
}

/**
 * The artboard identity, in the top bar, where design tools put it.
 *
 * Microsoft Designer treats size as an object property you can change at any moment —
 * not a document setting buried in a tab. In Designer mode this chip replaces that trip:
 * it reads the live page dimensions and opens a resize popover.
 */
export const DesignerFormatChip: React.FC = () => {
  const { activePage, setPageSize, setPageOrientation } = usePublisher();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const { width, height, orientation } = activePage;
  const currentName = PAGE_SIZES.find(
    (size) => size.width === width && size.height === height
  )?.name;

  return (
    <div ref={rootRef} className="relative hidden lg:block flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Artboard size and orientation"
        className="flex h-7 cursor-pointer items-center gap-1.5 rounded-chip border border-line bg-surface px-2 text-meta font-medium text-ink-body transition hover:border-accent-line hover:text-accent-ink"
      >
        {isInchPage(width, height) ? <Monitor size={13} /> : <Smartphone size={13} />}
        <span className="tabular-nums">{formatDims(width, height)}</span>
        <span className="text-ink-muted">·</span>
        <span className="capitalize text-ink-muted">{orientation}</span>
        <ChevronDown size={12} className="text-ink-muted" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Artboard format"
          className="absolute left-0 top-full z-50 mt-1.5 w-[268px] overflow-hidden rounded-tile border border-line bg-surface shadow-elevated"
        >
          <div className="border-b border-line-soft px-3 py-2">
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-muted">
              Orientation
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-1">
              {(['portrait', 'landscape'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPageOrientation(value)}
                  className={`h-7 cursor-pointer rounded-chip border text-meta font-medium capitalize transition ${
                    orientation === value
                      ? 'border-accent-line bg-accent-soft text-accent-ink'
                      : 'border-line bg-surface text-ink-body hover:bg-surface-sunken'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[320px] overflow-y-auto py-1">
            {PAGE_SIZES.map((size) => {
              const active = size.name === currentName;
              return (
                <button
                  key={size.name}
                  type="button"
                  onClick={() => {
                    setPageSize(size.name);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-left transition ${
                    active ? 'bg-accent-soft' : 'hover:bg-surface-sunken'
                  }`}
                >
                  <span
                    className={`truncate text-meta ${
                      active ? 'font-semibold text-accent-ink' : 'text-ink-body'
                    }`}
                  >
                    {size.displayName}
                  </span>
                  <span className="flex-shrink-0 text-2xs tabular-nums text-ink-muted">
                    {formatDims(size.width, size.height)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
