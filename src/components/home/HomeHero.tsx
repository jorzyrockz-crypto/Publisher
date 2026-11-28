import React from 'react';
import { Search, X } from 'lucide-react';
import { TEMPLATES } from '../../constants/templates';
import { HomeShortcuts } from './HomeShortcuts';

/**
 * The top of Home: the question, the search, and the six formats people actually start from.
 *
 * No card around it. A bordered, tinted panel put a box inside a box — the page is already the
 * surface — and it clipped the shortcut cards' hover shadow at its own edge. The headline, the
 * field and the row now sit straight on the page's warm ground.
 *
 * The search is the hero's real content — it filters the grid below as you type, so there is no
 * submit button and nothing to navigate to, and no caption line under it either: the gallery's own
 * heading counts what matched. The count survives as a live region for screen readers.
 */
export const HomeHero: React.FC<{
  query: string;
  onQueryChange: (query: string) => void;
  resultCount: number;
}> = ({ query, onQueryChange, resultCount }) => {
  return (
    <section className="pt-1 text-center">
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl">
        What will you design today?
      </h1>

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
            className="home-glass home-glass-strong w-full rounded-full border py-2.5 pl-11 pr-10 text-body text-ink outline-none transition-shadow placeholder:text-ink-muted focus:border-accent-focus focus:ring-2 focus:ring-accent-focus/25 [&::-webkit-search-cancel-button]:hidden"
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

        <p className="sr-only" role="status" aria-live="polite">
          {query ? `${resultCount} template${resultCount === 1 ? '' : 's'} match “${query}”` : ''}
        </p>
      </div>

      <HomeShortcuts />
    </section>
  );
};
