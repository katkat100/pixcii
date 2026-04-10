import { ProjectState, HistoryEntry, Selection, isInSelection } from '../../types'
import { ProjectAction } from '../../state/projectReducer'

function getBrushCells(
  row: number,
  col: number,
  brushSize: 1 | 2 | 3,
  data: string[][],
  char: string,
  height: number,
  width: number,
  selection: Selection | null,
): { row: number; col: number; prev: string; next: string }[] {
  const cells: { row: number; col: number; prev: string; next: string }[] = []
  const half = Math.floor(brushSize / 2)

  for (let dr = 0; dr < brushSize; dr++) {
    for (let dc = 0; dc < brushSize; dc++) {
      const r = row - half + dr
      const c = col - half + dc
      if (r < 0 || r >= height || c < 0 || c >= width) continue
      if (!isInSelection(r, c, selection)) continue
      const prev = data[r]?.[c] ?? ' '
      cells.push({ row: r, col: c, prev, next: char })
    }
  }

  return cells
}

// Stroke accumulator -- collects all cells changed during a full mousedown-to-mouseup stroke
let strokeCells: Map<string, { row: number; col: number; prev: string; next: string }> = new Map()

export function handlePencilDown(
  row: number,
  col: number,
  state: ProjectState,
  dispatch: (action: ProjectAction) => void,
): void {
  const { width, height } = state.project.canvas
  const frame = state.project.frames[state.activeFrameIndex]
  const { brushSize, activeChar } = state

  // Start a new stroke
  strokeCells = new Map()

  const cells = getBrushCells(row, col, brushSize, frame.data, activeChar, height, width, state.selection)
  if (cells.length === 0) return

  // Record original prev values for undo
  for (const c of cells) {
    const key = `${c.row},${c.col}`
    if (!strokeCells.has(key)) {
      strokeCells.set(key, c)
    }
  }

  dispatch({
    type: 'SET_CELLS',
    cells: cells.map(c => ({ row: c.row, col: c.col, char: c.next })),
  })
  dispatch({ type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
}

export function handlePencilDrag(
  row: number,
  col: number,
  state: ProjectState,
  dispatch: (action: ProjectAction) => void,
): void {
  const { width, height } = state.project.canvas
  const frame = state.project.frames[state.activeFrameIndex]
  const { brushSize, activeChar } = state

  const cells = getBrushCells(row, col, brushSize, frame.data, activeChar, height, width, state.selection)
  if (cells.length === 0) return

  // Accumulate into stroke -- only record the first prev value per cell
  for (const c of cells) {
    const key = `${c.row},${c.col}`
    if (!strokeCells.has(key)) {
      strokeCells.set(key, c)
    }
  }

  dispatch({
    type: 'SET_CELLS',
    cells: cells.map(c => ({ row: c.row, col: c.col, char: c.next })),
  })
  dispatch({ type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
}

export function handlePencilUp(
  dispatch: (action: ProjectAction) => void,
): void {
  if (strokeCells.size === 0) return
  const entry: HistoryEntry = { cells: Array.from(strokeCells.values()) }
  dispatch({ type: 'PUSH_UNDO', entry })
  strokeCells = new Map()
}
