import React from 'react';
import { Search, X } from 'lucide-react';
import { TEMPLATES } from '../../constants/templates';
import { HomeShortcuts } from './HomeShortcuts';

/**
 * The top of Home: the question, the search, and the six formats people actually start from.
 *
 * The search is the hero's real content — it filters the grid below as you type, so there is no
 * submit button and nothing to navigate to. Under it, `HomeShortcuts` puts the six ways to start as
 * mini cards rather than pills; see that component for what each one opens.
 */
export const HomeHero: React.FC<{
  query: string;
  onQueryChange: (query: string) => void;
  resultCount: number;
}> = ({ query, onQueryChange, resultCount }) => {
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

      <HomeShortcuts />

    </section>
  );
};
