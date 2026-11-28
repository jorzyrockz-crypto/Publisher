import type { Page, PublisherElement } from '../types/publisher';
import {
  AIDesignAdvice,
  DesignRecommendation,
  generateDesignRecommendations,
} from './designRecommendations';
import { composeDesignForTarget } from './designBlueprints';
import { LayoutScore, describeScore, scoreElements } from './layoutScore';
import {
  FeedbackState,
  affinityDelta,
  getFeedback,
  hasEnoughEvidence,
} from './designFeedback';

/**
 * Suggestions, ranked — and the reason each one is where it is.
 *
 * The panel used to show whatever the generators happened to emit. Now every candidate is
 * scored by `layoutScore`, nudged by how often the user has chosen that kind of suggestion,
 * and sorted. A source that has never been tried gets a small exploration bonus, so the ranking
 * keeps learning instead of collapsing onto its first favourite.
 */

export type CandidateSource = 'blueprint' | 'advice' | 'document';

/**
 * What the learning is about: the specific family, not "all blueprints". Dismissing Editorial
 * Split should make *that* layout less likely, not punish every suggestion in the panel.
 */
export const sourceKey = (source: CandidateSource, id: string) =>
  source === 'blueprint' ? `blueprint:${id}` : source;

export interface DesignCandidate {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  category: 'layouts' | 'color-dark' | 'photo';
  source: CandidateSource;
  page: Page;
  score: LayoutScore;
  /** Score after affinity and exploration — what the list is sorted by. */
  rank: number;
  /** The key the feedback loop learns under (see `sourceKey`). */
  learnKey: string;
  /** The one line that says why this is here: what is good, or what to fix. */
  rationale: string;
  /** True when this candidate was surfaced to keep exploring a source. */
  exploring: boolean;
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function withElements(page: Page, elements: PublisherElement[]): Page {
  return { ...page, elements };
}

/** Same design, re-composed as another composition style — usually the biggest quality gap. */
function composeVariants(page: Page): DesignCandidate['page'][] {
  const styles = ['editorial', 'centered'] as const;
  const targets: Page[] = [];

  styles.forEach((style) => {
    const elements = composeDesignForTarget(
      clone(page.elements),
      page.width,
      page.height,
      page.width,
      page.height,
      page.margins,
      false,
      style
    );
    if (elements && elements.length > 0) targets.push(withElements(page, elements));
  });

  return targets;
}

/**
 * A layout built out of the user's *own* page, at its best: everything snapped to the margin
 * and to common edges, which is what people mean when they say a suggestion "feels designed".
 */
function documentVariant(page: Page): Page | null {
  const margin = page.margins;
  const elements = page.elements.map((el) => {
    if (el.visible === false) return el;
    const next = { ...el };
    const leftGap = Math.abs(el.x - margin.left);
    const rightGap = Math.abs(page.width - margin.right - (el.x + el.width));
    const topGap = Math.abs(el.y - margin.top);
    const bottomGap = Math.abs(page.height - margin.bottom - (el.y + el.height));

    // Only pull something to an edge when it is already nearly there — this tidies a layout
    // rather than rearranging it.
    if (leftGap > 0 && leftGap <= 24) next.x = margin.left;
    else if (rightGap > 0 && rightGap <= 24) next.x = page.width - margin.right - el.width;
    if (topGap > 0 && topGap <= 24) next.y = margin.top;
    else if (bottomGap > 0 && bottomGap <= 24) next.y = page.height - margin.bottom - el.height;
    return next;
  });

  const changed = elements.some((el, i) => el.x !== page.elements[i].x || el.y !== page.elements[i].y);
  return changed ? withElements(page, elements) : null;
}

function toCandidate(
  rec: DesignRecommendation,
  source: CandidateSource,
  feedback: FeedbackState,
  exploring: boolean
): DesignCandidate {
  const score = scoreElements(rec.previewPage.elements || [], rec.previewPage);
  const rationale = describeScore(score);
  const key = sourceKey(source, rec.id);
  const rank = Math.round(score.total + affinityDelta(key, feedback)) / 1;

  return {
    id: rec.id,
    title: rec.title,
    subtitle: rec.subtitle,
    badge: rec.badge,
    category: rec.category,
    source,
    page: rec.previewPage,
    score,
    rank,
    learnKey: key,
    rationale,
    exploring,
  };
}

export function rankDesignCandidates(
  page: Page,
  advice?: AIDesignAdvice | null,
  options?: { limit?: number; feedback?: FeedbackState }
): DesignCandidate[] {
  const limit = options?.limit ?? 6;
  const feedback = options?.feedback ?? getFeedback();

  const recommendations = generateDesignRecommendations(page, advice);

  // The AI advice and the user's own tidy-up enter the same ranking as the blueprints: a
  // suggestion is a suggestion, and the score decides.
  const extra: DesignRecommendation[] = [];
  if (advice) {
    const advicePage = recommendations.find((r) => r.id === advice.preferredLayout);
    if (advicePage) {
      extra.push({
        ...advicePage,
        id: `advice-${advicePage.id}`,
        title: `${advice.vibeTitle} — ${advicePage.title}`,
        subtitle: `Built from your prompt · ${advice.headingFont} / ${advice.bodyFont}`,
      });
    }
  }
  const tidy = documentVariant(page);
  if (tidy) {
    extra.push({
      id: 'document-tidy',
      title: 'Your page, tightened',
      subtitle: 'Your own layout, snapped to the margins',
      category: 'layouts',
      badge: 'Yours',
      previewPage: tidy,
    });
  }

  const candidates: DesignCandidate[] = [
    ...recommendations.map((rec) =>
      toCandidate(rec, rec.id.startsWith('advice') ? 'advice' : 'blueprint', feedback, false)
    ),
    ...extra.map((rec) =>
      toCandidate(
        rec,
        rec.id === 'document-tidy' ? 'document' : 'advice',
        feedback,
        false
      )
    ),
  ];

  // Keep exploring, but only once there is something learned to explore away from: nudge the
  // best candidate whose family has never been judged. Early on everything is new, and a badge
  // on all of it means nothing.
  const unexplored = candidates.filter((c) => !feedback[c.learnKey]);
  const bestOverall = candidates.reduce((best, c) => (c.score.total > best.score.total ? c : best), candidates[0]);
  if (hasEnoughEvidence(feedback) && unexplored.length > 0) {
    const pick = unexplored.sort((a, b) => b.score.total - a.score.total)[0];
    // Only explore a genuine contender: promoting a weak layout to "because we were curious"
    // would waste the shelf space that a good suggestion deserves.
    if (pick && pick.score.total >= bestOverall.score.total - 12) {
      pick.exploring = true;
      pick.rank = Math.round(pick.rank + 12);
    }
  }

  candidates.sort((a, b) => b.rank - a.rank);
  return candidates.slice(0, limit);
}

/** The extra suggestions beyond what the generators already emit, for tests and previews. */
export function candidateVariants(page: Page): Page[] {
  return composeVariants(page);
}
