import { useMemo } from 'react';
import { usePublisher } from '../context/PublisherContext';
import type { CollageMeta } from '../utils/borderArtStyles';
import { resolveCollageLayout } from '../utils/collageLayouts';
import type { PublisherElement } from '../types/publisher';

/** A collage on the page, seen through the current selection. */
export interface CollageSelection {
  groupId: string;
  meta: CollageMeta;
  members: PublisherElement[];
  /** Every element of this collage, for patching it precisely. */
  memberIds: string[];
  /** True when the collage has no group id and is held together by this selection alone. */
  ungrouped: boolean;
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

    // Identify a collage by what it *is* — a group holding `collageMeta` — not by the shape
    // of its group id. Keying on `grp-collage-` meant any collage that had since been
    // grouped (Ctrl+G rewrites the id) fell through to the generic object toolbar.
    const groupId = selected[0].groupId;
    if (groupId && !selected.every((el) => el.groupId === groupId)) return null;

    const groupMembers = groupId
      ? activePage.elements.filter((el) => el.groupId === groupId)
      : selected;
    const metaCarrier = groupMembers.find((el) => Boolean(el.collageMeta));
    if (!metaCarrier || !metaCarrier.collageMeta) return null;

    const meta = metaCarrier.collageMeta;
    // Count the slots the layout draws, not the slot states the meta carries: a 4-grid
    // stores nine states, and counting images cannot work either — a vibe pack can give
    // photo slots the same sticker effect its stickers have.
    const layout = resolveCollageLayout(meta, [], 1);
    const slotCount = Math.max(1, Math.min(layout.slotCount, meta.slots.length));

    let members = groupMembers;
    if (!groupId) {
      // An ungrouped collage (Ctrl+Shift+G releases it) has no id to gather its parts, so
      // the selection itself must prove it is the whole thing. The meta says exactly how
      // many elements that is: the slots, the backdrop card if it draws one, and stickers.
      // Anything short of that is a partial selection — patching it would rebuild half a
      // collage and orphan the rest, so the generic toolbar stays.
      const expectedMembers =
        slotCount +
        (meta.backdrop.type !== 'none' && !meta.coverDocumentBackground ? 1 : 0) +
        (meta.stickers?.length ?? 0);
      if (selected.length !== expectedMembers) return null;
      if (!selected.every((el) => Boolean(el.collageMeta))) return null;
      members = selected;
    }
    return {
      groupId: groupId ?? '',
      meta,
      members,
      memberIds: members.map((el) => el.id),
      ungrouped: !groupId,
      origin: {
        x: Math.min(...members.map((el) => el.x)),
        y: Math.min(...members.map((el) => el.y)),
      },
      filledSlots: meta.slots.slice(0, slotCount).filter((slot) => Boolean(slot.imageUrl)).length,
      slotCount,
    };
  }, [activePage.elements, selectedElementIds]);
}
