# Mirror & Rotate - Design Spec

Add mirror and rotate operations to Pixcii. Operations apply to the active selection if one exists, or the entire active frame if no selection.

---

## Operations

| Action | Effect |
|--------|--------|
| Mirror Horizontal | Flip content left-to-right |
| Mirror Vertical | Flip content top-to-bottom |
| Rotate 90° CW | Rotate content clockwise |
| Rotate 90° CCW | Rotate content counter-clockwise |

## Scope Logic

- **Selection exists:** operate on the selected region only. All operations push an undo entry.
- **No selection:** operate on the entire active frame. All operations push an undo entry.

## Rotation Behavior

### Selection rotation
- A rectangular selection changes dimensions after 90° rotation (3-row x 5-col becomes 5-row x 3-col)
- Rotated content is placed starting from the selection's top-left corner
- If rotated content overflows the canvas, it is clipped at the canvas boundary
- The selection rectangle updates to reflect the new dimensions

### Full frame rotation
- Canvas dimensions stay the same
- Content is rotated within the existing bounds
- If the canvas isn't square, some content may be clipped after rotation

## Implementation

### Files to modify
- `src/canvas/tools/select.ts` -- extend existing `mirrorHorizontal`/`mirrorVertical` to handle no-selection case, add `rotateCW`/`rotateCCW`
- `src/components/MenuBar.tsx` -- add Mirror/Rotate items to Edit menu

### Mirror logic (no selection)
Read entire frame data, create a new 2D array with columns reversed (horizontal) or rows reversed (vertical), push undo entry covering all changed cells, dispatch SET_CELLS.

### Rotate logic
For a region (row0,col0) to (row1,col1) with height H and width W:
- **90° CW:** new cell at `(col, H-1-row)` maps from original `(row, col)`. Output dimensions: W rows x H cols.
- **90° CCW:** new cell at `(W-1-col, row)` maps from original `(row, col)`. Output dimensions: W rows x H cols.

For full frame, the region is (0,0) to (canvasHeight-1, canvasWidth-1).

### Menu location
Edit menu, below Undo/Redo, with a divider separating them:
```
Undo (Ctrl+Z)
Redo (Ctrl+Shift+Z)
─────────────────
Mirror Horizontal
Mirror Vertical
Rotate 90° CW
Rotate 90° CCW
```
