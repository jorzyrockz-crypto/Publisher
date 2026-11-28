# Design taste: scoring, learning, and a second opinion

The Design Ideas panel used to *produce* suggestions and leave the judging to you. Taste is not
magic — most of what makes a layout look designed can be measured, the rest can be learned from
the person using the app, and the last part can be borrowed from a vision model without training
anything or copying anyone's templates.

Three layers, in the order they run.

## 1. `layoutScore` — a designer's eye, written down

`scoreElements(elements, page)` scores a page 0–100 and returns the reasons.

| metric | weight | what it measures |
|---|---|---|
| alignment | 0.16 | fraction of boxes that share an edge (±2px) with another box |
| rhythm | 0.12 | how close the gaps are to a 4/8px step |
| hierarchy | 0.16 | heading:next text size ratio — 1.5–3.2x is right |
| whitespace | 0.12 | ink coverage; 35–72% of the page is the comfortable band |
| contrast | 0.16 | every text element against the thing actually behind it |
| collisions | 0.16 | text-on-text overlaps, objects past the trim, objects past the margins |
| balance | 0.06 | visual-weight centroid vs page centre (a third of the page is free) |
| measure | 0.06 | characters per line — 45–75 reads well |

Two details matter more than the weights:

- **Backgrounds are not content.** A shape covering ~the whole page is furniture: it is excluded
  from ink, from margins and from the weight centroid. Without this, every blueprint with a
  coloured background scored as "too crowded".
- **Contrast looks behind the text, not just at the page.** The backdrop is the highest object
  under the text's centre; a white headline on a navy shape is 16:1, not 1:1. An image backdrop
  stands the check down rather than guessing a colour.

Output is `{ total, grade, metrics, issues, highlights }`. Issues are ordered worst-first, in
sentences a person can act on ("“Empowering future-ready…” sits at 4.4:1 — below the 4.5:1 a body
text needs"), and highlights are sorted by how well each thing is done, so two good layouts do not
read identically.

## 2. `designFeedback` + `designCandidates` — ranked, and learning

`rankDesignCandidates(page, advice)` takes the blueprints the generators already emit, adds an
"Your page, tightened" candidate (the user's own layout snapped to margins and edges when it is
within 24px), scores every candidate, and sorts.

Learning is per **family**, not per class: dismissing *Editorial Split Left* makes that layout
less likely, not every blueprint. Each family keeps an accept/dismiss count in
`studiopress_design_feedback_v1`, smoothed as `(accepted + 1) / (total + 2)`, which maps to
**±9 points** on the 100-point score — taste is a tiebreaker, never an override. Once any family
has three signals, the best *unjudged* family within 12 points of the leader gets a small
exploration bump, so the ranking keeps learning instead of collapsing onto its first favourite.

The panel shows the score and grade on each card, one line of "why" (the strongest highlight for a
good layout, the worst issue for a poor one), a dismiss button, a live score for the current page
with its top three issues, and "Reset learned preferences" when there is anything to forget.

## 3. `designCritic` — a second opinion, keyless-first

The local scorer measures what can be measured. Whether the thing *looks* good is a judgement, and
`critiqueDesign(page)` borrows one: the page is rendered with the same renderer the exporter uses
(1.5x, JPEG 0.85), sent to a vision model with a rubric, and returned as
`{ score, verdict, fixes[3] }`.

- No key, no connection, no render → `null`, and the panel simply keeps the local score. The
  feature is an upgrade, never a dependency; nothing leaves the machine without a key.
- Rendering races an 8s timeout, so a photo that never loads cannot leave the panel spinning.
- The request half is a separate function (`requestDesignCritique`) so it is testable without a
  browser and a different provider is a new function, not a fork.

## What is not here

A *trained* ranker — features from layer 1, labels from layer 2's accept/dismiss signals — is the
natural next step, and layer 2 is now collecting exactly those labels. It is not in this change on
purpose: it needs a corpus of signals that does not exist yet, and Canva's templates are neither
licensed for training nor necessary. Once a few hundred signals exist, a small gradient-boosted
ranker over the layer-1 metrics is a contained piece of work.

## Verification

```
tidy layout   91 A   Edges line up across the layout
messy layout  37 D   Text is overlapping, Low contrast, Edges do not line up, Too crowded
separation    +54 points between a tidy and a messy page

"Yours"      present on a messy page: 46 vs the page's own 37 (improves it)
ranking      sorted by rank, 8 candidates, learnKey per family
learning     dismiss swiss-minimal x5 → position 0 → 3; keep gradient-pop → stays ahead
critic       parses / clamps 0-100 / caps fixes at 3 / null on bad json, empty, 429, throw
             no key → fetch never called
panel        page 74/100 B with its real issues; cards 94 A, 93 A, 92 A, 91 A, sorted
             dismiss records blueprint:split-left; second opinion disabled without a key
             0 runtime errors
```
