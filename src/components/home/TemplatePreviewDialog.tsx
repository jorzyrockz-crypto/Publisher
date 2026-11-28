import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import type { TemplateDefinition } from '../../constants/templates';
import { TemplatePagePreview } from '../templates/TemplatePagePreview';
import { templateSizeLabel, templateSubtitle } from './homeCatalog';

/**
 * The full look at a template, page by page.
 *
 * Lifted out of the File menu's gallery so it follows the card. A card preview is 250px wide and
 * that is enough to tell a menu from a poster — it is not enough to read the deck, so the second
 * click exists; it just no longer costs a mode switch to get to.
 */
export const TemplatePreviewDialog: React.FC<{
  template: TemplateDefinition;
  onClose: () => void;
  onUse: () => void;
}> = ({ template, onClose, onUse }) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${template.name} preview`}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-tile border border-line bg-surface shadow-elevated"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-accent-line bg-accent-soft px-2 py-0.5 text-2xs font-semibold text-accent-ink">
                {templateSizeLabel(template)}
              </span>
              <h2 className="truncate text-lead font-bold text-ink">{template.name}</h2>
            </div>
            <p className="mt-0.5 text-meta text-ink-muted">
              {templateSubtitle(template)} · {template.description}
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onUse}
              className="rounded-full bg-accent px-4 py-2 text-meta font-semibold text-white transition-colors hover:bg-accent-hover cursor-pointer"
            >
              Use This Template
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="home-scroll flex-1 overflow-y-auto bg-surface-sunken p-6">
          <div className="flex flex-wrap items-start justify-center gap-6">
            {template.project.pages.map((page, index) => (
              <div key={page.id} className="flex flex-col items-center gap-2">
                <TemplatePagePreview page={page} maxWidth={430} maxHeight={510} />
                <span className="text-meta font-medium text-ink-muted">
                  Page {index + 1}
                  {page.name ? ` · ${page.name}` : ''} ({Math.round(page.width)}×{Math.round(page.height)}px)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
