export interface Point {
  row: number
  col: number
}

/**
 * Stack-based flood fill.
 * Returns array of {row, col} cells that should be filled with fillChar,
 * starting from (startRow, startCol) and spreading to all adjacent cells
 * that share the same character as the starting cell.
 *
 * Returns empty array if the target char at the start equals fillChar.
 */
export function floodFill(
  data: string[][],
  startRow: number,
  startCol: number,
  fillChar: string,
  height: number,
  width: number,
): Point[] {
  const targetChar = data[startRow]?.[startCol] ?? ' '

  // No-op if already the fill char
  if (targetChar === fillChar) return []

  const visited = Array.from({ length: height }, () => new Array(width).fill(false))
  const result: Point[] = []
  const stack: Point[] = [{ row: startRow, col: startCol }]

  while (stack.length > 0) {
    const { row, col } = stack.pop()!

    if (row < 0 || row >= height || col < 0 || col >= width) continue
    if (visited[row][col]) continue
    if ((data[row]?.[col] ?? ' ') !== targetChar) continue

    visited[row][col] = true
    result.push({ row, col })

    stack.push({ row: row - 1, col })
    stack.push({ row: row + 1, col })
    stack.push({ row, col: col - 1 })
    stack.push({ row, col: col + 1 })
  }

  return result
}
