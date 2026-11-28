/**
 * A suggestion engine that remembers what you keep.
 *
 * No dataset of other people's designs is legal to train on, and none is needed: the judgement
 * that matters is *this user's*, and they express it every time they insert a suggestion or
 * throw one away. Each source (a blueprint family, the AI advice, the user's own document
 * style) keeps a smoothed success rate, and sources that keep getting picked are shown first
 * while a little exploration keeps the others alive — the standard epsilon-greedy trade.
 */

export type DesignOutcome = 'accepted' | 'dismissed';

export interface SourceRecord {
  accepted: number;
  dismissed: number;
  lastAt: number;
}

export type FeedbackState = Record<string, SourceRecord>;

const STORAGE_KEY = 'studiopress_design_feedback_v1';
/** How often to show a source the user has not been picking, to keep learning. */
export const EXPLORATION_RATE = 0.18;

function read(): FeedbackState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? (parsed as FeedbackState) : {};
  } catch {
    return {};
  }
}

function write(state: FeedbackState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage is optional; a failed write only costs memory of past choices.
  }
}

export function getFeedback(): FeedbackState {
  return read();
}

export function recordDesignFeedback(source: string, outcome: DesignOutcome): FeedbackState {
  if (!source) return read();
  const state = read();
  const record = state[source] || { accepted: 0, dismissed: 0, lastAt: 0 };
  const next: SourceRecord = {
    accepted: record.accepted + (outcome === 'accepted' ? 1 : 0),
    dismissed: record.dismissed + (outcome === 'dismissed' ? 1 : 0),
    lastAt: Date.now(),
  };
  state[source] = next;
  write(state);
  return state;
}

/**
 * Smoothed success rate in 0..1, starting at the neutral 0.5 — two priors' worth of doubt, so a
 * single lucky accept does not crown a source and a single dismissal does not bury it.
 */
export function sourceAffinity(source: string, state: FeedbackState = read()): number {
  const record = state[source];
  if (!record) return 0.5;
  const total = record.accepted + record.dismissed;
  return (record.accepted + 1) / (total + 2);
}

export function totalSignals(state: FeedbackState = read()): number {
  return Object.values(state).reduce((sum, r) => sum + r.accepted + r.dismissed, 0);
}

/**
 * Points added to (or taken from) a candidate's design score, in the same 0–100 scale.
 *
 * Bounded on purpose: ±9 points means a source you keep choosing can win against a layout that
 * scores a little better, but a genuinely better layout still wins. Taste is a tiebreaker, not
 * an override.
 */
export const AFFINITY_WEIGHT = 18;

export function affinityDelta(source: string, state: FeedbackState = read()): number {
  return (sourceAffinity(source, state) - 0.5) * AFFINITY_WEIGHT;
}

/** True once there is enough evidence to be worth exploring other sources. */
export function hasEnoughEvidence(state: FeedbackState = read(), threshold = 3): boolean {
  return Object.values(state).some((r) => r.accepted + r.dismissed >= threshold);
}

/** Sources that have never been judged — the ones exploration should favour. */
export function unexploredSources(sources: string[], state: FeedbackState = read()): string[] {
  return sources.filter((source) => !state[source]);
}

export function resetFeedback(): void {
  write({});
}
