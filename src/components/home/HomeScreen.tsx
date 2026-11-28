import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, PenLine } from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import { useWindowWidth } from '../../hooks/useResizablePanel';
import type { HomeSection } from '../../types/publisher';
import { HomeNavRail } from './HomeNavRail';
import { HomeHero } from './HomeHero';
import { TemplateGallery, GalleryFilterState } from './TemplateGallery';
import { RecentDesignsStrip } from './RecentDesignsStrip';
import { MyProjectsSection } from './MyProjectsSection';
import { StoryKitsSection } from './StoryKitsSection';
import { filterTemplates } from './homeCatalog';

const SECTION_TITLES: Record<HomeSection, { label: string; hint: string }> = {
  home: { label: 'Home', hint: 'Your templates, kits and saved work' },
  templates: { label: 'Templates', hint: 'Every layout in the library' },
  projects: { label: 'My Projects', hint: 'Documents open now and saved on this device' },
  kits: { label: 'Story Kits', hint: 'Asset packs for backdrops, frames and stickers' },
};

/**
 * The Home screen.
 *
 * The app opens here instead of on a blank canvas. That one change decides the rest of the layout:
 * if the first thing you see is a gallery, then the gallery has to answer "what am I making?" in
 * the first screenful — a hero that names the formats, a search that filters as you type, and
 * artwork rather than a list of headings.
 *
 * The document is untouched by all of this. Home is a *view*: the editor and its state stay mounted
 * behind it, which is why "Resume Editing" returns to the exact page, zoom and selection you left,
 * and why nothing has to be saved to switch back and forth.
 */
export const HomeScreen: React.FC = () => {
  const { homeSection, setHomeSection, hasActiveDocument, project, openEditor } = usePublisher();
  const windowWidth = useWindowWidth();

  // Tablets get the icon rail: 14rem of navigation is a quarter of a landscape iPad, and the grid
  // loses a column to it.
  const [collapsed, setCollapsed] = useState(() => windowWidth < 1100);
  const prevWidthRef = useRef(windowWidth);
  useEffect(() => {
    const prev = prevWidthRef.current;
    prevWidthRef.current = windowWidth;
    if (prev >= 1100 && windowWidth < 1100) setCollapsed(true);
    if (prev < 1100 && windowWidth >= 1100) setCollapsed(false);
  }, [windowWidth]);

  const [filters, setFilters] = useState<GalleryFilterState>({
    query: '',
    group: 'All',
    format: 'all',
  });

  const updateFilters = useCallback((next: Partial<GalleryFilterState>) => {
    setFilters((current) => ({ ...current, ...next }));
  }, []);

  const resultCount = useMemo(() => filterTemplates(filters).length, [filters]);

  const section = SECTION_TITLES[homeSection];

  return (
    <div className="home-ground relative flex h-full w-full overflow-hidden bg-canvas text-ink">
      {/* Blooms: colour for the chrome's blur to sample (see .home-blooms). */}
      <div aria-hidden="true" className="home-blooms pointer-events-none absolute inset-0" />

      <HomeNavRail collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)} />

      <div className="relative flex min-w-0 flex-1 flex-col min-h-0">
        {/* Top bar — the section you are in, and the way back into the document.

            It floats *over* the scroll area rather than sitting above it: a
            frosted bar is only worth frosting if the gallery can slide under it,
            and the row of thumbnails passing beneath is the whole effect. The
            scroll area carries a matching 3.5rem of top padding so the first
            row still starts below the bar. */}
        <header className="home-glass absolute inset-x-0 top-0 z-20 flex h-14 items-center justify-between gap-3 border-b px-5">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <h2 className="truncate text-lead font-bold tracking-[-0.01em] text-ink">
                {section.label}
              </h2>
              <span className="hidden truncate text-meta text-ink-muted sm:inline">
                · {section.hint}
              </span>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            {hasActiveDocument && (
              <button
                type="button"
                onClick={openEditor}
                title={`Return to ${project.name}`}
                className="group flex max-w-[260px] items-center gap-2 rounded-full border border-accent-line bg-accent-soft px-3 py-1.5 text-meta font-semibold text-accent-ink transition-colors hover:bg-accent-soft-hover cursor-pointer"
              >
                <PenLine size={13} />
                <span className="whitespace-nowrap">Resume Editing</span>
                <span className="hidden truncate font-normal text-ink-muted md:inline">
                  {project.name}
                </span>
                <ArrowRight
                  size={12}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </button>
            )}
          </div>
        </header>

        <main className="home-scroll flex-1 min-h-0 overflow-y-auto pt-14">
          <div className="mx-auto max-w-[1500px] space-y-7 px-5 py-5">
            {homeSection === 'home' && (
              <>
                <HomeHero
                  query={filters.query}
                  onQueryChange={(query) => updateFilters({ query })}
                  resultCount={resultCount}
                />
                <RecentDesignsStrip />
                <TemplateGallery
                  title="Start from a template"
                  filters={filters}
                  onFiltersChange={updateFilters}
                  limit={12}
                  onSeeAll={() => setHomeSection('templates')}
                />
              </>
            )}

            {homeSection === 'templates' && (
              <TemplateGallery
                title="All templates"
                filters={filters}
                onFiltersChange={updateFilters}
                showSearch
              />
            )}

            {homeSection === 'projects' && <MyProjectsSection />}
            {homeSection === 'kits' && <StoryKitsSection />}
          </div>
        </main>
      </div>
    </div>
  );
};
