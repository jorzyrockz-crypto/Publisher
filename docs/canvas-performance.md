# Canvas performance: zoom and object moves

Two gestures carried all the cost, and both were paying it in React.

## Zooming

`zoom` lives in the workspace context, so every step of a wheel burst or a pinch re-rendered the
ribbon, both sidebars, the thumbnails, every page and every element on every page — sixty times a
second — to change one number.

Zoom is now a CSS custom property. The scroll container carries `--sp-zoom`, and everything that
scales reads it:

```css
[data-page-frame]  { width: calc(1056px * var(--sp-zoom)); }
[data-paper-canvas] { transform: scale(var(--sp-zoom)); }
```

`useLiveZoom` writes that one property straight onto the container during a gesture
(`zoomLive(next, anchor)`), so the sheet scales on the compositor and React stays idle. When the
gesture settles (180 ms without movement, or the fingers lift) the value is committed to state
once, which is what the zoom readout, the rulers and every coordinate calculation use.

- **Anchored**: a wheel zoom keeps the point under the pointer fixed, a pinch keeps the point
  between the fingers fixed.
- **Flush before measuring**: any interaction that measures — pan, marquee, drag, click — calls
  `flush()` first, so it never works from a zoom that React has not caught up with yet.
- **External changes win**: pressing Zoom In, Fit, or a shortcut clears any pending gesture value
  instead of being overwritten 180 ms later.

The rulers are drawn from the committed zoom, so they catch up when the gesture settles rather
than tracking it tick for tick.

## Moving objects

A drag called `updateElementsBatch(..., { transient: true })` on every frame. Transient skips undo
and autosave, but it is still a document write: the whole app re-rendered for every frame of every
drag, to move one box.

The drag now writes nothing. It computes the same snapped delta and stores it as local
`dragPreview` state in `PageCanvas` — the boxes being dragged get one
`translate3d(dx, dy, 0) rotate(…)`, every other element is untouched — and the document is written
**once**, on mouseup, at the position the preview left the boxes in. The preview is cleared in the
same commit, so nothing jumps.

Because the preview lives in `PageCanvas` and the alignment guides were already local state there,
a drag now re-renders one page instead of the application.

Also in place: `contain: layout style` on page frames and canvases so a move in one page cannot
invalidate layout for the others, `will-change: transform` on the scaled canvas and on boxes
mid-drag, and the ruler cursor position is coalesced to one update per frame.

## Not covered yet

Resizing a box and panning a photo inside its frame still write to the document per frame. They
are the same shape of problem, with a different fix (the resize path has to reflow text).
