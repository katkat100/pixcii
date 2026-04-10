import { ProjectState, HistoryEntry, isInSelection } from '../../types'
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
  const { activeChar, selection } = state

  if (row < 0 || row >= height || col < 0 || col >= width) return
  if (!isInSelection(row, col, selection)) return

  const allFilledPoints = floodFill(frame.data, row, col, activeChar, height, width)
  const filledPoints = allFilledPoints.filter(({ row: r, col: c }) => isInSelection(r, c, selection))
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
