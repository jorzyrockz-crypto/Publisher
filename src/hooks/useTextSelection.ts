import { useMemo } from 'react';
import { usePublisher } from '../context/PublisherContext';
import type { PublisherElement, TextElement } from '../types/publisher';

/** The text the canvas bar and its panel are talking about. */
export interface TextSelection {
  /** Every text element selected — changes apply to all of them in one commit. */
  elements: TextElement[];
  /** The element the bar reads its labels from (the first one selected). */
  primary: TextElement;
  /** Values the selection disagrees on, so the UI can say "Mixed" instead of lying. */
  mixed: {
    fontFamily: boolean;
    fontSize: boolean;
    color: boolean;
    fontWeight: boolean;
  };
}

function isText(el: PublisherElement | undefined): el is TextElement {
  return Boolean(el) && el!.type === 'text';
}

/**
 * Null unless *every* selected element is text: a text box plus a photo is not a text
 * selection, and the bar should fall back to the generic one rather than offer to recolour
 * a picture.
 */
export function resolveTextSelection(
  elements: PublisherElement[],
  selectedElementIds: string[]
): TextSelection | null {
  if (selectedElementIds.length === 0) return null;
  const selectedSet = new Set(selectedElementIds);
  const selected = elements.filter((el) => selectedSet.has(el.id));
  if (selected.length === 0) return null;
  if (!selected.every(isText)) return null;

  const text = selected as TextElement[];
  const primary = text[0];
  const disagrees = <K extends keyof TextElement>(key: K) =>
    text.some((el) => el[key] !== primary[key]);

  return {
    elements: text,
    primary,
    mixed: {
      fontFamily: disagrees('fontFamily'),
      fontSize: disagrees('fontSize'),
      color: disagrees('color'),
      fontWeight: disagrees('fontWeight'),
    },
  };
}

export function useTextSelection(): TextSelection | null {
  const { activePage, selectedElementIds } = usePublisher();
  return useMemo(
    () => resolveTextSelection(activePage.elements, selectedElementIds),
    [activePage.elements, selectedElementIds]
  );
}
