import { useMemo } from 'react';
import { usePublisher } from '../context/PublisherContext';
import type { CollageMeta } from '../utils/borderArtStyles';
import type { PublisherElement } from '../types/publisher';

/** A collage on the page, seen through the current selection. */
export interface CollageSelection {
  groupId: string;
  meta: CollageMeta;
  members: PublisherElement[];
  origin: { x: number; y: number };
  /** Slots that actually hold a photo — what the label should say. */
  filledSlots: number;
  slotCount: number;
}

/**
 * Returns the collage the selection is sitting in, or `null`.
 *
 * Null is the normal case: a single slot, a mixed selection, a text box, or an ordinary
 * group all fall through to the generic object toolbar. The point is that callers never
 * have to guess — "is this a collage?" is answered in one place, the same way, for the
 * Publisher toolbar, the Designer context bar and anything added later.
 */
export function useCollageSelection(): CollageSelection | null {
  const { activePage, selectedElementIds } = usePublisher();

  return useMemo(() => {
    if (selectedElementIds.length === 0) return null;

    const selectedSet = new Set(selectedElementIds);
    const selected = activePage.elements.filter((el) => selectedSet.has(el.id));
    if (selected.length === 0) return null;

    const groupId = selected[0].groupId;
    if (!groupId || !groupId.startsWith('grp-collage-')) return null;
    if (!selected.every((el) => el.groupId === groupId)) return null;

    const members = activePage.elements.filter((el) => el.groupId === groupId);
    // The backdrop card always carries the meta; slots carry it too when they were grouped.
    const carrier = members.find((el) => Boolean(el.collageMeta));
    if (!carrier || !carrier.collageMeta) return null;

    const meta = carrier.collageMeta;
    // Count the slots actually drawn, not the slot states the meta happens to carry: a
    // 4-grid preset stores nine states, and "0/9" for a four-photo collage is a lie.
    const slotMembers = members.filter(
      (el) => el.type === 'image' && (el as { effectPreset?: string }).effectPreset !== 'sticker'
    );
    return {
      groupId,
      meta,
      members,
      origin: {
        x: Math.min(...members.map((el) => el.x)),
        y: Math.min(...members.map((el) => el.y)),
      },
      filledSlots: slotMembers.filter((el) => Boolean((el as { src?: string }).src)).length,
      slotCount: slotMembers.length || meta.slots.length,
    };
  }, [activePage.elements, selectedElementIds]);
}
