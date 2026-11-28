/**
 * Collage identity, adopted retroactively.
 *
 * New collages are stamped with a `collageId` the moment they are inserted, so they can be
 * found again whatever happens to their group. Documents saved before that existed carry no
 * id, and a released one can only be recognised by counting its parts — which is exactly the
 * fragile thing identity was introduced to avoid.
 *
 * So the first time such a document is opened, every collage in it is given an id here. The
 * stamp is earned, not guessed:
 *
 *   - elements that share a group and carry meta  -> one collage
 *   - elements with no group but identical meta    -> one collage (the builder stamps one
 *     serialized meta onto every part, and two collages differ in their photos or their seed)
 *
 * Elements that are not part of a collage are never touched, and a collage that already has
 * an id keeps it, so opening a document twice changes nothing.
 */

import type { Page, PublisherElement } from '../types/publisher';
import type { CollageMeta } from './borderArtStyles';
import { mintCollageId } from './collageBuild';

/** Meta with the identity removed — what makes two parts look like the same collage. */
function metaSignature(meta: CollageMeta): string {
  const { collageId: _ignored, ...rest } = meta;
  return JSON.stringify(rest);
}

function adoptOnPage(page: Page): Page {
  const elements = page.elements;
  if (!elements.some((el) => el.collageMeta && !el.collageMeta.collageId)) return page;

  // Key -> the elements that belong together. A group is the strongest signal; without one,
  // identical meta is.
  const clusters = new Map<string, PublisherElement[]>();
  for (const el of elements) {
    if (!el.collageMeta) continue;
    if (el.collageMeta.collageId) continue;
    const key = el.groupId ? `group:${el.groupId}` : `meta:${metaSignature(el.collageMeta)}`;
    const bucket = clusters.get(key);
    if (bucket) bucket.push(el);
    else clusters.set(key, [el]);
  }
  if (clusters.size === 0) return page;

  const idsByElement = new Map<string, string>();
  for (const cluster of clusters.values()) {
    // A single ungrouped part could be one half of something we cannot prove is whole —
    // but stamping it only means "these parts are this collage", and every part of the
    // cluster is stamped together, so nothing is orphaned.
    const collageId = mintCollageId();
    cluster.forEach((el) => idsByElement.set(el.id, collageId));
  }

  return {
    ...page,
    elements: elements.map((el) => {
      const collageId = idsByElement.get(el.id);
      if (!collageId || !el.collageMeta) return el;
      return { ...el, collageMeta: { ...el.collageMeta, collageId } };
    }),
  };
}

/**
 * Gives a copied set of elements its own collages.
 *
 * A duplicate is a second collage that looks like the first, not another part of it. Left
 * sharing the id, selecting either one would find both, and styling one would restyle both.
 */
export function freshCollageIds(elements: PublisherElement[]): PublisherElement[] {
  const remap = new Map<string, string>();
  return elements.map((el) => {
    const current = el.collageMeta?.collageId;
    if (!current || !el.collageMeta) return el;
    let next = remap.get(current);
    if (!next) {
      next = mintCollageId();
      remap.set(current, next);
    }
    return { ...el, collageMeta: { ...el.collageMeta, collageId: next } };
  });
}

/** Returns the pages with every legacy collage given an id. Untouched pages keep their identity. */
export function adoptCollageIds(pages: Page[]): Page[] {
  let changed = false;
  const next = pages.map((page) => {
    const adopted = adoptOnPage(page);
    if (adopted !== page) changed = true;
    return adopted;
  });
  return changed ? next : pages;
}
