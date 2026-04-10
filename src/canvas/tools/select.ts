import { ProjectState, HistoryEntry, Clipboard } from '../../types'
import { ProjectAction } from '../../state/projectReducer'

function getSelectionBounds(state: ProjectState) {
  const { selection } = state
  if (!selection) return null

  const minRow = Math.min(selection.startRow, selection.endRow)
  const maxRow = Math.max(selection.startRow, selection.endRow)
  const minCol = Math.min(selection.startCol, selection.endCol)
  const maxCol = Math.max(selection.startCol, selection.endCol)

  return { minRow, maxRow, minCol, maxCol }
}

export function copySelection(
  state: ProjectState,
  dispatch: (action: ProjectAction) => void,
): void {
  const bounds = getSelectionBounds(state)
  if (!bounds) return

  const { minRow, maxRow, minCol, maxCol } = bounds
  const frame = state.project.frames[state.activeFrameIndex]

  const selWidth = maxCol - minCol + 1
  const selHeight = maxRow - minRow + 1

  const data: string[][] = []
  for (let r = 0; r < selHeight; r++) {
    const row: string[] = []
    for (let c = 0; c < selWidth; c++) {
      row.push(frame.data[minRow + r]?.[minCol + c] ?? ' ')
    }
    data.push(row)
  }

  const clipboard: Clipboard = { data, width: selWidth, height: selHeight }
  dispatch({ type: 'SET_CLIPBOARD', clipboard })
}

export function cutSelection(
  state: ProjectState,
  dispatch: (action: ProjectAction) => void,
): void {
  copySelection(state, dispatch)
  deleteSelection(state, dispatch)
}

export function deleteSelection(
  state: ProjectState,
  dispatch: (action: ProjectAction) => void,
): void {
  const bounds = getSelectionBounds(state)
  if (!bounds) return

  const { minRow, maxRow, minCol, maxCol } = bounds
  const { width, height } = state.project.canvas
  const frame = state.project.frames[state.activeFrameIndex]

  const cells: { row: number; col: number; prev: string; next: string }[] = []

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      if (r < 0 || r >= height || c < 0 || c >= width) continue
      const prev = frame.data[r]?.[c] ?? ' '
      if (prev !== ' ') {
        cells.push({ row: r, col: c, prev, next: ' ' })
      }
    }
  }

  if (cells.length === 0) return

  const entry: HistoryEntry = { cells }
  dispatch({ type: 'PUSH_UNDO', entry })
  dispatch({
    type: 'SET_CELLS',
    cells: cells.map(c => ({ row: c.row, col: c.col, char: ' ' })),
  })
  dispatch({ type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
}

export function pasteClipboard(
  state: ProjectState,
  dispatch: (action: ProjectAction) => void,
): void {
  const { clipboard, cursorRow, cursorCol } = state
  if (!clipboard) return

  const { width, height } = state.project.canvas
  const frame = state.project.frames[state.activeFrameIndex]

  const cells: { row: number; col: number; prev: string; next: string }[] = []

  for (let r = 0; r < clipboard.height; r++) {
    for (let c = 0; c < clipboard.width; c++) {
      const row = cursorRow + r
      const col = cursorCol + c
      if (row < 0 || row >= height || col < 0 || col >= width) continue
      const ch = clipboard.data[r]?.[c] ?? ' '
      const prev = frame.data[row]?.[col] ?? ' '
      cells.push({ row, col, prev, next: ch })
    }
  }

  if (cells.length === 0) return

  const entry: HistoryEntry = { cells }
  dispatch({ type: 'PUSH_UNDO', entry })
  dispatch({
    type: 'SET_CELLS',
    cells: cells.map(c => ({ row: c.row, col: c.col, char: c.next })),
  })
  dispatch({ type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
}

// Helper: get region bounds -- selection if exists, otherwise full frame
function getRegionBounds(state: ProjectState) {
  const { width, height } = state.project.canvas
  const bounds = getSelectionBounds(state)
  if (bounds) return bounds
  return { minRow: 0, maxRow: height - 1, minCol: 0, maxCol: width - 1 }
}

export function mirrorHorizontal(
  state: ProjectState,
  dispatch: (action: ProjectAction) => void,
): void {
  const { minRow, maxRow, minCol, maxCol } = getRegionBounds(state)
  const { width, height } = state.project.canvas
  const frame = state.project.frames[state.activeFrameIndex]

  const cells: { row: number; col: number; prev: string; next: string }[] = []

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      if (r < 0 || r >= height || c < 0 || c >= width) continue
      const mirrorC = maxCol - (c - minCol)
      if (mirrorC < 0 || mirrorC >= width) continue
      const prev = frame.data[r]?.[c] ?? ' '
      const next = frame.data[r]?.[mirrorC] ?? ' '
      cells.push({ row: r, col: c, prev, next })
    }
  }

  if (cells.length === 0) return

  const entry: HistoryEntry = { cells }
  dispatch({ type: 'PUSH_UNDO', entry })
  dispatch({
    type: 'SET_CELLS',
    cells: cells.map(c => ({ row: c.row, col: c.col, char: c.next })),
  })
  dispatch({ type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
}

export function mirrorVertical(
  state: ProjectState,
  dispatch: (action: ProjectAction) => void,
): void {
  const { minRow, maxRow, minCol, maxCol } = getRegionBounds(state)
  const { width, height } = state.project.canvas
  const frame = state.project.frames[state.activeFrameIndex]

  const cells: { row: number; col: number; prev: string; next: string }[] = []

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      if (r < 0 || r >= height || c < 0 || c >= width) continue
      const mirrorR = maxRow - (r - minRow)
      if (mirrorR < 0 || mirrorR >= height) continue
      const prev = frame.data[r]?.[c] ?? ' '
      const next = frame.data[mirrorR]?.[c] ?? ' '
      cells.push({ row: r, col: c, prev, next })
    }
  }

  if (cells.length === 0) return

  const entry: HistoryEntry = { cells }
  dispatch({ type: 'PUSH_UNDO', entry })
  dispatch({
    type: 'SET_CELLS',
    cells: cells.map(c => ({ row: c.row, col: c.col, char: c.next })),
  })
  dispatch({ type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
}

export function rotateCW(
  state: ProjectState,
  dispatch: (action: ProjectAction) => void,
): void {
  const { minRow, maxRow, minCol, maxCol } = getRegionBounds(state)
  const { width, height } = state.project.canvas
  const frame = state.project.frames[state.activeFrameIndex]

  const regionH = maxRow - minRow + 1
  const regionW = maxCol - minCol + 1

  // Read the region into a local grid
  const src: string[][] = []
  for (let r = 0; r < regionH; r++) {
    const row: string[] = []
    for (let c = 0; c < regionW; c++) {
      row.push(frame.data[minRow + r]?.[minCol + c] ?? ' ')
    }
    src.push(row)
  }

  // Rotate 90° CW: new[c][regionH-1-r] = src[r][c]
  // Output dimensions: regionW rows x regionH cols
  const dst: string[][] = []
  for (let r = 0; r < regionW; r++) {
    const row: string[] = []
    for (let c = 0; c < regionH; c++) {
      row.push(src[regionH - 1 - c][r])
    }
    dst.push(row)
  }

  // Build cell changes: clear original region, then stamp rotated content
  const cells: { row: number; col: number; prev: string; next: string }[] = []

  // Clear original region
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      if (r < 0 || r >= height || c < 0 || c >= width) continue
      const prev = frame.data[r]?.[c] ?? ' '
      cells.push({ row: r, col: c, prev, next: ' ' })
    }
  }

  // Stamp rotated content (may have different dimensions, clip to canvas)
  for (let r = 0; r < regionW; r++) {
    for (let c = 0; c < regionH; c++) {
      const tr = minRow + r
      const tc = minCol + c
      if (tr < 0 || tr >= height || tc < 0 || tc >= width) continue
      // Find existing entry for this cell or add new one
      const existing = cells.find(cell => cell.row === tr && cell.col === tc)
      if (existing) {
        existing.next = dst[r][c]
      } else {
        const prev = frame.data[tr]?.[tc] ?? ' '
        cells.push({ row: tr, col: tc, prev, next: dst[r][c] })
      }
    }
  }

  if (cells.length === 0) return

  const entry: HistoryEntry = { cells }
  dispatch({ type: 'PUSH_UNDO', entry })
  dispatch({
    type: 'SET_CELLS',
    cells: cells.map(c => ({ row: c.row, col: c.col, char: c.next })),
  })

  // Update selection to match new dimensions
  if (state.selection) {
    dispatch({
      type: 'SET_SELECTION',
      selection: {
        startRow: minRow,
        startCol: minCol,
        endRow: Math.min(minRow + regionW - 1, height - 1),
        endCol: Math.min(minCol + regionH - 1, width - 1),
      },
    })
  }

  dispatch({ type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
}

export function rotateCCW(
  state: ProjectState,
  dispatch: (action: ProjectAction) => void,
): void {
  const { minRow, maxRow, minCol, maxCol } = getRegionBounds(state)
  const { width, height } = state.project.canvas
  const frame = state.project.frames[state.activeFrameIndex]

  const regionH = maxRow - minRow + 1
  const regionW = maxCol - minCol + 1

  // Read the region into a local grid
  const src: string[][] = []
  for (let r = 0; r < regionH; r++) {
    const row: string[] = []
    for (let c = 0; c < regionW; c++) {
      row.push(frame.data[minRow + r]?.[minCol + c] ?? ' ')
    }
    src.push(row)
  }

  // Rotate 90° CCW: new[regionW-1-c][r] = src[r][c]
  // Output dimensions: regionW rows x regionH cols
  const dst: string[][] = []
  for (let r = 0; r < regionW; r++) {
    const row: string[] = []
    for (let c = 0; c < regionH; c++) {
      row.push(src[c][regionW - 1 - r])
    }
    dst.push(row)
  }

  // Build cell changes: clear original region, then stamp rotated content
  const cells: { row: number; col: number; prev: string; next: string }[] = []

  // Clear original region
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      if (r < 0 || r >= height || c < 0 || c >= width) continue
      const prev = frame.data[r]?.[c] ?? ' '
      cells.push({ row: r, col: c, prev, next: ' ' })
    }
  }

  // Stamp rotated content
  for (let r = 0; r < regionW; r++) {
    for (let c = 0; c < regionH; c++) {
      const tr = minRow + r
      const tc = minCol + c
      if (tr < 0 || tr >= height || tc < 0 || tc >= width) continue
      const existing = cells.find(cell => cell.row === tr && cell.col === tc)
      if (existing) {
        existing.next = dst[r][c]
      } else {
        const prev = frame.data[tr]?.[tc] ?? ' '
        cells.push({ row: tr, col: tc, prev, next: dst[r][c] })
      }
    }
  }

  if (cells.length === 0) return

  const entry: HistoryEntry = { cells }
  dispatch({ type: 'PUSH_UNDO', entry })
  dispatch({
    type: 'SET_CELLS',
    cells: cells.map(c => ({ row: c.row, col: c.col, char: c.next })),
  })

  // Update selection to match new dimensions
  if (state.selection) {
    dispatch({
      type: 'SET_SELECTION',
      selection: {
        startRow: minRow,
        startCol: minCol,
        endRow: Math.min(minRow + regionW - 1, height - 1),
        endCol: Math.min(minCol + regionH - 1, width - 1),
      },
    })
  }

  dispatch({ type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
}
