# Touch readiness

The app is a desktop publishing tool, but it gets opened on tablets and phones. This note records
what that costs and where each piece lives.

## The canvas: a mouse API taught to hear fingers

Every pasteboard interaction — select, drag an element, the resize handles, guides, artboards,
panning the pasteboard — is written against `mousedown` / `mousemove` / `mouseup`, and every drag
handler attaches its listeners to `window`. Rewriting a dozen drag handlers behind pointer events
would be a large change with a dozen chances to be subtly wrong.

Instead `useCanvasTouchGestures` (`src/hooks/useCanvasTouchGestures.ts`) bridges one finger into
exactly those mouse events, so the existing gestures run unchanged — including the rule that a
*click* on empty pasteboard means "nothing is selected", which is decided in the same `mouseup`.

What the bridge adds that a mouse never had:

| gesture | result |
|---|---|
| one finger on an object | drag it (via synthetic mouse) |
| one finger on empty pasteboard | pan the view |
| two fingers | pinch-zoom anchored on the point between them, and pan in the same gesture |
| long press (550 ms, < 8 px travel) | `contextmenu` — the canvas menu (Group, Ungroup, Arrange) |
| second finger during a drag | the drag is cancelled, the pinch takes over |

The anchored pinch is the part worth keeping: the pasteboard point under the fingers is restored
under the fingers after each zoom step (`anchor * newZoom - centre`), so the sheet does not slide
away from the gesture.

A finger is not a cursor in one place: tapping a **selected** text box with a mouse opens it for
editing, which on a tablet would make text boxes impossible to move. Touch-derived events are
marked (`__spTouch`) and that branch is skipped for them — a finger drags, and a double tap edits.

## Sizing and behaviour

In `src/index.css`:

- `touch-action: manipulation` on controls (no 300 ms delay, no double-tap zoom), `none` on the
  canvas workspace (the canvas owns its gestures), `contain` scroll chaining in panels.
- `overscroll-behavior: none` on `body` so dragging on the pasteboard cannot trigger
  pull-to-refresh or rubber-banding.
- No tap highlight, no text selection or iOS callout on the sheet (except inside a box being
  edited, where the caret must work).
- `(pointer: coarse)`: inputs at 16 px (below that iOS zooms the layout on focus), resize handles
  grow to 22 px with an invisible 8 px ring, scrollbars to 10 px, ribbon tabs to 44 px, quick
  access to 40 px.
- Hover-only controls — `group-hover:opacity-100` and friends — are forced visible, because a
  hover style that never fires is not a subtle affordance, it is a missing button.
- `@custom-variant touch` so a component can write `touch:min-h-11`.

Viewport: `width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover`. Pinch-zoom
of the *page* is left allowed — never banned.

## Known gaps

- HTML5 drag-and-drop does not fire for touch, so reordering **page thumbnails** by dragging has
  no touch path yet. Layer order is not affected: the canvas context menu (Arrangement) covers it.
