import React, { useMemo, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import type { TemplateDefinition } from '../../constants/templates';
import { TemplateCard } from './TemplateCard';
import { TemplatePreviewDialog } from './TemplatePreviewDialog';
import {
  filterTemplates,
  FORMAT_FILTERS,
  FormatFilter,
  GROUP_COUNTS,
  TEMPLATE_GROUPS,
} from './homeCatalog';
import { useDesignLauncher } from './useDesignLauncher';

export interface GalleryFilterState {
  query: string;
  group: string;
  format: FormatFilter;
}

/**
 * The template gallery.
 *
 * Two navigations used to compete here: fourteen wrapping category pills and the fourteen headed
 * sections they filtered to. Both listed the same taxonomy, and between them they pushed the first
 * row of artwork below the fold on a laptop. This keeps one row of pills — scrollable, with faded
 * ends rather than a scrollbar — and puts every result in a single responsive grid.
 *
 * The format filter is the question people actually ask of a template ("is this a poster or a
 * story?"), and it sits next to the count so the two read as one statement.
 */
export const TemplateGallery: React.FC<{
  filters: GalleryFilterState;
  onFiltersChange: (next: Partial<GalleryFilterState>) => void;
  /** Home shows a taste of the library; Templates shows all of it. */
  limit?: number;
  onSeeAll?: () => void;
  title: string;
  showSearch?: boolean;
}> = ({ filters, onFiltersChange, limit, onSeeAll, title, showSearch = false }) => {
  const [preview, setPreview] = useState<TemplateDefinition | null>(null);
  const { applyTemplate } = useDesignLauncher();

  const results = useMemo(() => filterTemplates(filters), [filters]);
  const shown = limit ? results.slice(0, limit) : results;
  const isFiltered = filters.group !== 'All' || filters.format !== 'all' || filters.query.trim() !== '';

  const chipClass = (isActive: boolean) =>
    `whitespace-nowrap rounded-full border px-3 py-1 text-meta transition-colors cursor-pointer ${
      isActive
        ? 'border-accent bg-accent font-semibold text-white'
        : 'border-line bg-surface font-medium text-ink-body hover:border-accent-line hover:bg-accent-soft hover:text-accent-ink'
    }`;

  const startFromPreview = (template: TemplateDefinition) => {
    setPreview(null);
    applyTemplate(template.id);
  };

  return (
    <section aria-label="Templates" className="space-y-3">
      {/* Title, count, search (Templates only) and the format filter */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lead font-bold tracking-[-0.01em] text-ink">{title}</h2>
          <p className="text-meta text-ink-muted">
            {results.length} template{results.length === 1 ? '' : 's'}
            {filters.group !== 'All' && ` in ${filters.group}`}
            {filters.format !== 'all' && ` · ${filters.format}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {showSearch && (
            <div className="relative">
              <Search
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
              />
              <input
                type="text"
                value={filters.query}
                onChange={(e) => onFiltersChange({ query: e.target.value })}
                placeholder="Search templates"
                className="w-44 rounded-full border border-line bg-surface py-1.5 pl-7 pr-7 text-meta text-ink outline-none placeholder:text-ink-placeholder focus:border-accent-focus focus:ring-2 focus:ring-accent-focus/25 sm:w-56"
              />
              {filters.query && (
                <button
                  type="button"
                  onClick={() => onFiltersChange({ query: '' })}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-ink-muted hover:text-ink cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          <div
            className="flex items-center gap-0.5 rounded-full border border-line bg-surface-sunken p-0.5"
            role="group"
            aria-label="Format"
          >
            {FORMAT_FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onFiltersChange({ format: option.id })}
                aria-pressed={filters.format === option.id}
                className={`rounded-full px-2.5 py-1 text-meta transition-colors cursor-pointer ${
                  filters.format === option.id
                    ? 'bg-surface font-semibold text-accent-ink shadow-xs'
                    : 'font-medium text-ink-muted hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* One row of category pills, scrollable, faded at the ends. */}
      <div className="home-fade-x -mx-1">
        <div className="home-strip flex gap-1.5 overflow-x-auto px-1 py-1" role="group" aria-label="Category">
          {[{ label: 'All' }, ...TEMPLATE_GROUPS].map((group) => {
            const isActive = filters.group === group.label;
            const count = GROUP_COUNTS[group.label];
            return (
              <button
                key={group.label}
                type="button"
                onClick={() => onFiltersChange({ group: group.label })}
                aria-pressed={isActive}
                className={chipClass(isActive)}
              >
                {group.label}
                {typeof count === 'number' && group.label !== 'All' && count > 0 && (
                  <span className={`ml-1.5 text-2xs ${isActive ? 'text-white/70' : 'text-ink-faint'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="rounded-tile border border-dashed border-line bg-surface-sunken px-6 py-12 text-center">
          <p className="text-body font-semibold text-ink">No templates match that.</p>
          <p className="mt-1 text-meta text-ink-muted">
            Try a different word, or clear the filters to see all of them.
          </p>
          <button
            type="button"
            onClick={() => onFiltersChange({ query: '', group: 'All', format: 'all' })}
            className="mt-3 rounded-full border border-line bg-surface px-3 py-1.5 text-meta font-semibold text-ink-body transition-colors hover:border-accent-line hover:bg-accent-soft hover:text-accent-ink cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={(tpl) => applyTemplate(tpl.id)}
              onPreview={setPreview}
            />
          ))}
        </div>
      )}

      {limit && results.length > limit && onSeeAll && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onSeeAll}
            className="group flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-meta font-semibold text-ink-body transition-colors hover:border-accent-line hover:bg-accent-soft hover:text-accent-ink cursor-pointer"
          >
            <span>
              Browse all {results.length} {isFiltered ? 'matching ' : ''}templates
            </span>
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      )}

      {preview && (
        <TemplatePreviewDialog
          template={preview}
          onClose={() => setPreview(null)}
          onUse={() => startFromPreview(preview)}
        />
      )}
    </section>
  );
};
