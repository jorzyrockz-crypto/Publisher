import React, { useState } from 'react';
import { FileText, Layers } from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import { RecentDesign, formatEditedAgo } from '../../utils/recentDesigns';
import { useRecentDesigns } from './useRecentDesigns';
import { useDesignLauncher } from './useDesignLauncher';
import { RecentDesignCard } from './RecentDesignCard';
import { OpenFileCard } from './OpenFileCard';

/**
 * My Projects — the documents you can get back to.
 *
 * Two kinds, deliberately separated: what is open in the workspace right now (unsaved work
 * included, since the editor keeps tabs alive), and what has been saved to this device. Merging
 * them would have meant a single row where some items survive a reload and some do not.
 */
export const MyProjectsSection: React.FC = () => {
  const { workspaceTabs, activeTabId, switchWorkspaceTab, openEditor } = usePublisher();
  const { items, loading } = useRecentDesigns();
  const { openRecent } = useDesignLauncher();
  const [notice, setNotice] = useState<string | null>(null);

  const openDesign = async (design: RecentDesign) => {
    const opened = await openRecent(design.id);
    if (!opened) {
      setNotice(`“${design.name}” is no longer stored on this device. Open the saved file instead.`);
    }
  };

  return (
    <div className="space-y-7">
      <section className="space-y-2.5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-1.5 text-lead font-bold tracking-[-0.01em] text-ink">
              <Layers size={14} className="text-accent-ink" />
              Open now
            </h2>
            <p className="text-meta text-ink-muted">
              {workspaceTabs.length} document{workspaceTabs.length === 1 ? '' : 's'} in this
              workspace — unsaved work included.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {workspaceTabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  switchWorkspaceTab(tab.id);
                  openEditor();
                }}
                className={`flex items-start gap-2.5 rounded-tile border bg-surface p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-elevated cursor-pointer ${
                  isActive ? 'border-accent-line' : 'border-line hover:border-accent-line'
                }`}
                title={`Open ${tab.project.name}`}
              >
                <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-chip bg-accent-soft text-accent-ink">
                  <FileText size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-body font-semibold text-ink">
                      {tab.project.name}
                    </span>
                    {isActive && (
                      <span className="flex-shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-2xs font-semibold text-white">
                        Open
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-2xs text-ink-muted">
                    {tab.project.pages.length} page
                    {tab.project.pages.length === 1 ? '' : 's'} · {tab.project.pageSizeName} ·{' '}
                    {formatEditedAgo(tab.updatedAt)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2.5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lead font-bold tracking-[-0.01em] text-ink">Saved on this device</h2>
            <p className="text-meta text-ink-muted">
              Every save keeps a copy here so it can be reopened without hunting for the download.
            </p>
          </div>
          <OpenFileCard variant="pill" />
        </div>

        {!loading && items.length === 0 ? (
          <div className="rounded-tile border border-dashed border-line bg-surface-sunken px-6 py-10 text-center">
            <p className="text-body font-semibold text-ink">Nothing saved yet.</p>
            <p className="mx-auto mt-1 max-w-md text-meta text-ink-muted">
              Save a document — Ctrl+S, or File ▸ Save As — and it will appear here, with the artwork
              of its first page.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((design) => (
              <RecentDesignCard
                key={design.id}
                design={design}
                layout="grid"
                onOpen={(d) => void openDesign(d)}
              />
            ))}
            <OpenFileCard />
          </div>
        )}

        {notice && (
          <p className="rounded-chip border border-line bg-surface-sunken px-2.5 py-1.5 text-2xs text-ink-secondary">
            {notice}
          </p>
        )}
      </section>
    </div>
  );
};
