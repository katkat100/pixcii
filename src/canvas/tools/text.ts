import { ProjectState, HistoryEntry } from '../../types'
import { ProjectAction } from '../../state/projectReducer'

function isPrintable(key: string): boolean {
  return key.length === 1
}

export function handleTextKey(
  key: string,
  state: ProjectState,
  dispatch: (action: ProjectAction) => void,
): void {
  const { width, height } = state.project.canvas
  const frame = state.project.frames[state.activeFrameIndex]
  const { cursorRow, cursorCol } = state

  if (isPrintable(key)) {
    const prev = frame.data[cursorRow]?.[cursorCol] ?? ' '
    const entry: HistoryEntry = {
      cells: [{ row: cursorRow, col: cursorCol, prev, next: key }],
    }
    dispatch({ type: 'PUSH_UNDO', entry })
    dispatch({ type: 'SET_CELLS', cells: [{ row: cursorRow, col: cursorCol, char: key }] })
    dispatch({ type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })

    // Advance cursor right, wrap at end of row
    const nextCol = cursorCol + 1
    if (nextCol < width) {
      dispatch({ type: 'SET_CURSOR', row: cursorRow, col: nextCol })
    }
  } else if (key === 'Enter') {
    // Move cursor down one row
    const nextRow = cursorRow + 1
    if (nextRow < height) {
      dispatch({ type: 'SET_CURSOR', row: nextRow, col: cursorCol })
    }
  } else if (key === 'Backspace') {
    // Move cursor left and clear that cell
    const prevCol = cursorCol - 1
    if (prevCol >= 0) {
      const prev = frame.data[cursorRow]?.[prevCol] ?? ' '
      const entry: HistoryEntry = {
        cells: [{ row: cursorRow, col: prevCol, prev, next: ' ' }],
      }
      dispatch({ type: 'PUSH_UNDO', entry })
      dispatch({ type: 'SET_CELLS', cells: [{ row: cursorRow, col: prevCol, char: ' ' }] })
      dispatch({ type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
      dispatch({ type: 'SET_CURSOR', row: cursorRow, col: prevCol })
    }
  }
}
