import { ProjectState, HistoryEntry, ShapeType } from '../../types'
import { ProjectAction } from '../../state/projectReducer'
import { bresenhamLine } from '../../utils/bresenham'
import {
  rectangleOutline,
  rectangleFilled,
  ellipseOutline,
  ellipseFilled,
  triangleOutline,
  triangleFilled,
} from '../../utils/shapeAlgorithms'

export interface Point {
  row: number
  col: number
}

export function getShapePoints(
  shapeType: ShapeType,
  filled: boolean,
  r0: number,
  c0: number,
  r1: number,
  c1: number,
): Point[] {
  switch (shapeType) {
    case 'line':
      return bresenhamLine(r0, c0, r1, c1)
    case 'rectangle':
      return filled ? rectangleFilled(r0, c0, r1, c1) : rectangleOutline(r0, c0, r1, c1)
    case 'circle':
      return filled ? ellipseFilled(r0, c0, r1, c1) : ellipseOutline(r0, c0, r1, c1)
    case 'triangle':
      return filled ? triangleFilled(r0, c0, r1, c1) : triangleOutline(r0, c0, r1, c1)
    default:
      return []
  }
}

export function commitShape(
  points: Point[],
  state: ProjectState,
  dispatch: (action: ProjectAction) => void,
): void {
  const { width, height } = state.project.canvas
  const frame = state.project.frames[state.activeFrameIndex]
  const { activeChar } = state

  const validPoints = points.filter(
    ({ row, col }) => row >= 0 && row < height && col >= 0 && col < width,
  )
  if (validPoints.length === 0) return

  const cells = validPoints.map(({ row, col }) => ({
    row,
    col,
    prev: frame.data[row]?.[col] ?? ' ',
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
