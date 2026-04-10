import { ProjectState, HistoryEntry } from '../../types'
import { ProjectAction } from '../../state/projectReducer'

function getBrushCells(
  row: number,
  col: number,
  brushSize: 1 | 2 | 3,
  data: string[][],
  height: number,
  width: number,
): { row: number; col: number; prev: string; next: string }[] {
  const cells: { row: number; col: number; prev: string; next: string }[] = []
  const half = Math.floor(brushSize / 2)

  for (let dr = 0; dr < brushSize; dr++) {
    for (let dc = 0; dc < brushSize; dc++) {
      const r = row - half + dr
      const c = col - half + dc
      if (r < 0 || r >= height || c < 0 || c >= width) continue
      const prev = data[r]?.[c] ?? ' '
      cells.push({ row: r, col: c, prev, next: ' ' })
    }
  }

  return cells
}

export function handleEraserDown(
  row: number,
  col: number,
  state: ProjectState,
  dispatch: (action: ProjectAction) => void,
): void {
  const { width, height } = state.project.canvas
  const frame = state.project.frames[state.activeFrameIndex]
  const { brushSize } = state

  const cells = getBrushCells(row, col, brushSize, frame.data, height, width)
  if (cells.length === 0) return

  const entry: HistoryEntry = { cells }
  dispatch({ type: 'PUSH_UNDO', entry })
  dispatch({
    type: 'SET_CELLS',
    cells: cells.map(c => ({ row: c.row, col: c.col, char: ' ' })),
  })
  dispatch({ type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
}

export function handleEraserDrag(
  row: number,
  col: number,
  state: ProjectState,
  dispatch: (action: ProjectAction) => void,
): void {
  const { width, height } = state.project.canvas
  const frame = state.project.frames[state.activeFrameIndex]
  const { brushSize } = state

  const cells = getBrushCells(row, col, brushSize, frame.data, height, width)
  if (cells.length === 0) return

  dispatch({
    type: 'SET_CELLS',
    cells: cells.map(c => ({ row: c.row, col: c.col, char: ' ' })),
  })
  dispatch({ type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
}
