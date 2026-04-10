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

export function mirrorHorizontal(
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
      const mirrorC = maxCol - (c - minCol)
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
  const bounds = getSelectionBounds(state)
  if (!bounds) return

  const { minRow, maxRow, minCol, maxCol } = bounds
  const { width, height } = state.project.canvas
  const frame = state.project.frames[state.activeFrameIndex]

  const cells: { row: number; col: number; prev: string; next: string }[] = []

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      if (r < 0 || r >= height || c < 0 || c >= width) continue
      const mirrorR = maxRow - (r - minRow)
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
