import React from 'react';
import {
  BookOpen,
  FileText,
  Images,
  LayoutGrid,
  Search,
  Share2,
  Square,
  X,
} from 'lucide-react';
import { TEMPLATES } from '../../constants/templates';
import { A4_POSTER, SQUARE_POST } from '../../utils/blankDesign';
import { filterTemplates, type FormatFilter } from './homeCatalog';
import { useDesignLauncher } from './useDesignLauncher';

/**
 * The top of Home: the question, the search, and the six formats people actually start from.
 *
 * The search is the hero's real content — it filters the grid below as you type, so there is no
 * submit button and nothing to navigate to.
 *
 * Every chip **starts a document**; none of them merely filters the gallery, because a chip called
 * "Reading Corner" that scrolls a grid is a link dressed as a button. Where a format has a design
 * worth starting from (a reading sign, an A4 poster, a collage layout) the chip opens the first
 * template of that kind; where it does not (a tarpapel grid, a square post, a blank page) it makes
 * the canvas. Either way the next thing on screen is the editor.
 */
export const HomeHero: React.FC<{
  query: string;
  onQueryChange: (query: string) => void;
  resultCount: number;
}> = ({ query, onQueryChange, resultCount }) => {
  const { startTarpapel, startBlank, applyTemplate } = useDesignLauncher();

  /** The first template of a kind, or a blank page if the library has none. */
  const openFirstTemplate = (group: string, format: FormatFilter = 'all', search = '') => {
    const template = filterTemplates({ group, format, query: search })[0];
    if (template) applyTemplate(template.id);
    else startBlank(A4_POSTER);
  };

  const chips: { label: string; icon: React.ComponentType<{ size?: number }>; onClick: () => void }[] =
    [
      { label: 'Tarpapel (3×2)', icon: LayoutGrid, onClick: () => startTarpapel() },
      { label: 'Reading Corner', icon: BookOpen, onClick: () => openFirstTemplate('Reading Corner') },
      { label: 'A4 Poster', icon: FileText, onClick: () => openFirstTemplate('Posters & Flyers', 'portrait', 'a4') },
      { label: 'Photo Collage', icon: Images, onClick: () => openFirstTemplate('Collages') },
      { label: 'Social Media', icon: Share2, onClick: () => startBlank(SQUARE_POST) },
      { label: 'Blank Canvas', icon: Square, onClick: () => startBlank(A4_POSTER) },
    ];

  return (
    <section className="home-hero-wash relative overflow-hidden rounded-tile border border-accent-line/70 px-5 py-8 text-center sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl">
        What will you design today?
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-lead text-ink-secondary">
        {TEMPLATES.length} print-ready layouts for schools and small studios — tarpaulins, reading
        corner signs, posters, collages and certificates — or start from a blank page.
      </p>

      <div className="mx-auto mt-5 w-full max-w-2xl">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={`Search ${TEMPLATES.length} templates, tarpapel, reading corner, collages...`}
            aria-label="Search templates"
            className="w-full rounded-full border border-line bg-surface py-2.5 pl-11 pr-10 text-body text-ink shadow-sm outline-none transition-shadow placeholder:text-ink-placeholder focus:border-accent-focus focus:ring-2 focus:ring-accent-focus/25 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <p className="mt-1.5 h-4 text-2xs font-medium text-ink-muted">
          {query
            ? `${resultCount} template${resultCount === 1 ? '' : 's'} match “${query}”`
            : 'Type to filter the gallery below as you go.'}
        </p>
      </div>

      {/* Quick start: one row, scrollable, never wraps into a second line of chips. */}
      <div className="home-strip home-fade-x mt-4 flex justify-start gap-2 overflow-x-auto pb-1 sm:justify-center">
        {chips.map((chip) => {
          const Icon = chip.icon;
          return (
            <button
              key={chip.label}
              type="button"
              onClick={chip.onClick}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface/90 px-3 py-1.5 text-meta font-semibold text-ink-body shadow-xs backdrop-blur-[2px] transition-colors hover:border-accent-line hover:bg-surface hover:text-accent-ink cursor-pointer"
            >
              <Icon size={13} />
              <span className="whitespace-nowrap">{chip.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
