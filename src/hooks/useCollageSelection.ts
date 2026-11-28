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
  /** True when the collage has no group id and is held together by its id alone. */
  ungrouped: boolean;
  origin: { x: number; y: number };
  /** Slots that actually hold a photo — what the label should say. */
  filledSlots: number;
  slotCount: number;
}

function slotsFor(meta: CollageMeta): number {
  // Count the slots the layout draws, not the slot states the meta carries: a 4-grid stores
  // nine states, and counting images cannot work either — a vibe pack can give photo slots
  // the same sticker effect its stickers have.
  const layout = resolveCollageLayout(meta, [], 1);
  return Math.max(1, Math.min(layout.slotCount, meta.slots.length));
}

function buildSelection(
  meta: CollageMeta,
  members: PublisherElement[],
  groupId: string
): CollageSelection {
  const slotCount = slotsFor(meta);
  return {
    groupId,
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
}

/**
 * Returns the collage the selection is sitting in, or `null`.
 *
 * Null is the normal case: a text box, a mixed selection, or a partial handful of collage
 * parts all fall through to the generic object toolbar. Callers never have to ask "is this
 * a collage?" themselves — the answer is computed one way, for every caller.
 *
 * Identity comes from `collageId`, stamped on every element when the collage is inserted.
 * Group ids cannot do this job: Group rewrites them and Ungroup clears them, and neither
 * distinguishes two collages sharing a page.
 */
export function resolveCollageSelection(
  elements: PublisherElement[],
  selectedElementIds: string[]
): CollageSelection | null {
  {
    if (selectedElementIds.length === 0) return null;

    const selectedSet = new Set(selectedElementIds);
    const selected = elements.filter((el) => selectedSet.has(el.id));
    if (selected.length === 0) return null;

    // 1. Stamped identity — reliable regardless of grouping.
    const stampedId = selected.find((el) => el.collageMeta?.collageId)?.collageMeta?.collageId;
    if (stampedId) {
      const members = elements.filter((el) => el.collageMeta?.collageId === stampedId);
      // A collage plus a text box is not "the collage is selected".
      if (!selected.every((el) => members.some((member) => member.id === el.id))) return null;
      const carrier = members.find((el) => el.collageMeta?.collageId === stampedId);
      if (!carrier?.collageMeta) return null;
      return buildSelection(carrier.collageMeta, members, carrier.groupId ?? '');
    }

    // 2. Legacy collages, inserted before collageId existed: fall back to the group that
    // carries the meta. They adopt an id the first time they are patched.
    const groupId = selected[0].groupId;
    if (groupId && !selected.every((el) => el.groupId === groupId)) return null;

    const groupMembers = groupId
      ? elements.filter((el) => el.groupId === groupId)
      : selected;
    const carrier = groupMembers.find((el) => Boolean(el.collageMeta));
    if (!carrier || !carrier.collageMeta) return null;

    const meta = carrier.collageMeta;
    let members = groupMembers;
    if (!groupId) {
      // Ungrouped and unidentified: the meta says exactly how many elements the collage has
      // — slots, the backdrop card if it draws one, stickers. Only an exact match is the
      // whole collage; anything less would rebuild half of it and orphan the rest.
      const expectedMembers =
        slotsFor(meta) +
        (meta.backdrop.type !== 'none' && !meta.coverDocumentBackground ? 1 : 0) +
        (meta.stickers?.length ?? 0);
      if (selected.length !== expectedMembers) return null;
      if (!selected.every((el) => Boolean(el.collageMeta))) return null;
      members = selected;
    }

    return buildSelection(meta, members, groupId ?? '');
  }
}

/**
 * The same answer for a live editor. Kept thin so the rule itself can be exercised without
 * React — see `resolveCollageSelection`.
 */
export function useCollageSelection(): CollageSelection | null {
  const { activePage, selectedElementIds } = usePublisher();
  return useMemo(
    () => resolveCollageSelection(activePage.elements, selectedElementIds),
    [activePage.elements, selectedElementIds]
  );
}
