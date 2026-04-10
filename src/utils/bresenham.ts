export interface Point {
  row: number
  col: number
}

/**
 * Bresenham's line algorithm.
 * Returns an array of {row, col} points from (r0, c0) to (r1, c1), inclusive.
 */
export function bresenhamLine(r0: number, c0: number, r1: number, c1: number): Point[] {
  const points: Point[] = []

  let row = r0
  let col = c0

  const dr = Math.abs(r1 - r0)
  const dc = Math.abs(c1 - c0)

  const sr = r0 < r1 ? 1 : -1
  const sc = c0 < c1 ? 1 : -1

  let err = dr - dc

  while (true) {
    points.push({ row, col })
    if (row === r1 && col === c1) break
    const e2 = 2 * err
    if (e2 > -dc) {
      err -= dc
      row += sr
    }
    if (e2 < dr) {
      err += dr
      col += sc
    }
  }

  return points
}
