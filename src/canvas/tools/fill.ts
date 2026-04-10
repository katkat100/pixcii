import { ProjectState, HistoryEntry } from '../../types'
import { ProjectAction } from '../../state/projectReducer'
import { floodFill } from '../../utils/floodFill'

export function handleFillDown(
  row: number,
  col: number,
  state: ProjectState,
  dispatch: (action: ProjectAction) => void,
): void {
  const { width, height } = state.project.canvas
  const frame = state.project.frames[state.activeFrameIndex]
  const { activeChar } = state

  if (row < 0 || row >= height || col < 0 || col >= width) return

  const filledPoints = floodFill(frame.data, row, col, activeChar, height, width)
  if (filledPoints.length === 0) return

  const cells = filledPoints.map(({ row: r, col: c }) => ({
    row: r,
    col: c,
    prev: frame.data[r]?.[c] ?? ' ',
    next: activeChar,
  }))

  const entry: HistoryEntry = { cells }
  dispatch({ type: 'PUSH_UNDO', entry })
  dispatch({
    type: 'SET_CELLS',
    cells: cells.map(c => ({ row: c.row, col: c.col, char: c.next })),
  })
  dispatch({ type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
}
