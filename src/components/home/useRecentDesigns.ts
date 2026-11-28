import { useEffect, useState } from 'react';
import { RecentDesign, listRecentDesigns, subscribeRecentDesigns } from '../../utils/recentDesigns';

/**
 * The recent shelf, live.
 *
 * Saving happens in the editor while Home may already be mounted behind it, so the list is
 * subscribed rather than read once: `recordRecentDesign` publishes, and the strip updates without
 * a reload. `loading` exists so the strip can stay hidden instead of flashing an empty row on a
 * first visit.
 */
export function useRecentDesigns(): { items: RecentDesign[]; loading: boolean } {
  const [items, setItems] = useState<RecentDesign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = () => {
      void listRecentDesigns().then((rows) => {
        if (!alive) return;
        setItems(rows);
        setLoading(false);
      });
    };
    load();
    const unsubscribe = subscribeRecentDesigns(load);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  return { items, loading };
}
