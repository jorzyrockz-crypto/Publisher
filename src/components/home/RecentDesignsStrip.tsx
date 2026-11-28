import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { RecentDesign } from '../../utils/recentDesigns';
import { useRecentDesigns } from './useRecentDesigns';
import { useDesignLauncher } from './useDesignLauncher';
import { RecentDesignCard } from './RecentDesignCard';
import { OpenFileCard } from './OpenFileCard';

/**
 * Recent Designs — one compact row, above the gallery.
 *
 * A first-time visitor has no saved work, so the whole strip stays away rather than showing an
 * empty shelf with a label on it. It appears the first time a design is saved (or a file opened)
 * and updates in place, because the store publishes when a save lands.
 */
export const RecentDesignsStrip: React.FC = () => {
  const { items, loading } = useRecentDesigns();
  const { openRecent } = useDesignLauncher();
  const [notice, setNotice] = useState<string | null>(null);

  const open = async (design: RecentDesign) => {
    const opened = await openRecent(design.id);
    if (!opened) {
      setNotice(
        `“${design.name}” is no longer stored on this device. Open the saved file instead.`
      );
    }
  };

  if (loading || items.length === 0) return null;

  return (
    <section aria-label="Recent designs" className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-lead font-bold tracking-[-0.01em] text-ink">
          <Clock size={14} className="text-accent-ink" />
          Recent Designs
        </h2>
        <span className="text-meta text-ink-muted">Pick up where you left off</span>
      </div>

      <div className="home-strip home-fade-x -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {items.map((design) => (
          <RecentDesignCard key={design.id} design={design} onOpen={(d) => void open(d)} />
        ))}
        <div className="w-[196px] flex-shrink-0">
          <OpenFileCard variant="strip" />
        </div>
      </div>

      {notice && (
        <p className="rounded-chip border border-line bg-surface-sunken px-2.5 py-1.5 text-2xs text-ink-secondary">
          {notice}
        </p>
      )}
    </section>
  );
};
