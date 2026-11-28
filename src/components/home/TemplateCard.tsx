import React from 'react';
import { Eye } from 'lucide-react';
import type { TemplateDefinition } from '../../constants/templates';
import { useInView } from '../../hooks/useInView';
import { TemplatePagePreview } from '../templates/TemplatePagePreview';
import { templateSizeLabel, templateSubtitle } from './homeCatalog';

/**
 * One template, as a picture.
 *
 * The old card carried four things at once: a preview, a category chip, a two-line description and
 * a "Create Publication →" footer row. Nine words of description do not help anyone choose between
 * two posters, and the footer was a second, quieter copy of the whole card. What is left is the
 * artwork, one line saying what the sheet is, and the name.
 *
 * Hovering lifts the card and fades a scrim in with the one action that matters. On touch, where
 * there is no hover, the scrim never appears — the card is already the tap target — and the whole
 * card stays a single button so a tap anywhere does the same thing.
 */
export const TemplateCard: React.FC<{
  template: TemplateDefinition;
  onUse: (template: TemplateDefinition) => void;
  onPreview: (template: TemplateDefinition) => void;
}> = ({ template, onUse, onPreview }) => {
  const page = template.project.pages[0];
  // Previews are live pages, so they are built when the card gets near the viewport rather than
  // all 73 at once (see `useInView`).
  const [ref, inView] = useInView<HTMLDivElement>();

  return (
    <article className="group relative flex flex-col" ref={ref}>
      <button
        type="button"
        onClick={() => onUse(template)}
        className="block w-full cursor-pointer text-left"
        aria-label={`Use template ${template.name}`}
      >
        <div className="home-paper-shadow relative flex h-[188px] items-center justify-center overflow-hidden rounded-tile border border-line bg-surface-sunken p-3 transition-[transform,box-shadow] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-elevated">
          {inView && page ? (
            <TemplatePagePreview page={page} maxWidth={252} maxHeight={162} />
          ) : (
            <span className="block h-[152px] w-[112px] animate-pulse rounded-chip bg-line-soft" />
          )}

          <span className="absolute left-2.5 top-2.5 rounded-full border border-line bg-surface/90 px-2 py-0.5 text-2xs font-semibold text-ink-secondary backdrop-blur-[2px]">
            {templateSizeLabel(template)}
          </span>

          <span className="home-card-scrim pointer-events-none absolute inset-0 flex items-center justify-center rounded-tile bg-ink/50">
            <span className="rounded-full bg-accent px-4 py-1.5 text-meta font-semibold text-white shadow-elevated">
              Use Template
            </span>
          </span>
        </div>

        <div className="px-0.5 pt-2.5">
          <h3 className="truncate text-body font-semibold text-ink transition-colors group-hover:text-accent-ink">
            {template.name}
          </h3>
          <p className="truncate text-meta text-ink-muted">{templateSubtitle(template)}</p>
        </div>
      </button>

      {/* A sibling of the card button, not a child: nested buttons are invalid, and this is the
          one control that must not "use the template". */}
      <button
        type="button"
        onClick={() => onPreview(template)}
        aria-label={`Preview ${template.name}`}
        title="Full preview"
        className="absolute right-2.5 top-2.5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface/90 text-ink-secondary opacity-0 shadow-sm transition-opacity hover:text-accent-ink focus-visible:opacity-100 group-hover:opacity-100 cursor-pointer"
      >
        <Eye size={13} />
      </button>
    </article>
  );
};
