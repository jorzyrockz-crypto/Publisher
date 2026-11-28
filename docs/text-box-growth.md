# Text boxes grow to hold their words

**The rule.** A text box gets taller rather than cutting the words off or shrinking the type. Growth
is downward, so the top-left stays where the box was put and the first line does not move. A centred
or bottom-aligned box grows upward by half or all of the difference instead — the box moving is the
cheaper lie than the words sliding down the page under the caret.

Growth never shrinks a box. Getting smaller is what **Fit box to text** in the Text panel is for, and
it is the only thing that does it.

**The opt-out** is `autoSizeText === false`, the same flag that already meant "this frame is a frame,
do not scale the type with it". WordArt extremes and deliberately fixed frames use it.

## Why it needed normalising

There were four separate answers to "how tall does this text need to be":

| where | what it did |
|---|---|
| `utils/textResize.ts` | side-handle drag: rewrap, then `max(height, contentHeight + padding * 2)` |
| `PropertiesPanel` → Fit box to text | `max(24, ceil(contentHeight + padding * 2))` |
| `utils/designRecommendations.ts` | its own `fitTextToBox` guess, clamped to the frame |
| `utils/textEffectsFit.ts` | effect bleed, grown on all four sides |

and **none of them ran when you typed**. A box with `autoFit: 'shrink'` scaled its letters down as
you typed; a box without it clipped the words silently. Text was the only object in the editor that
could lose content by being edited.

Now there is one function, `textBoxContentHeight` in `utils/textBoxGrowth.ts`, and one funnel,
`projectTextGeometry`, which the single element-write path in `PublisherContext` calls. Typing,
pasting a longer headline, switching to a wider font, changing the size from the bar, applying a
WordArt style and dragging a side handle all end in the same arithmetic — `npm run check:textbox`
asserts that the drag and the typing agree to the pixel.

## What the app does now, by case

| case | result |
|---|---|
| typing past the last line | box grows downward, caret stays put |
| deleting words | box keeps its height (nothing shrinks under you) |
| font size +2 from the bar | box grows if the new size needs it |
| new text box | grows as you type; no shrink-to-fit by default |
| "Shrink type" on | type scales down to the frame instead |
| **Fit box to text** | one shot: box set to exactly the height the words need |
| applying a WordArt style | effect inset first (all four sides, letters still), then growth |
| **inserting** a WordArt box | inset on the way in, so the paint is not clipped on insert |
| moved, rotated, recoloured | nothing — a move is not a text edit |
| `autoSizeText: false` | nothing, ever |

## The seam it must not cross

A grown box is still a box: growth changes `height` (and `y` for centre/bottom anchoring), which is
not in `TEXT_GROWTH_KEYS`, so growth cannot feed itself. Growth is also idempotent — apply the same
patch twice and the second call returns null — which is what lets the projection run on every write.
