export const CELL_WIDTH = 10
export const CELL_HEIGHT = 18

export function cellToPixel(col: number, row: number, zoom: number, panX: number, panY: number) {
  const scale = zoom / 100
  return { x: col * CELL_WIDTH * scale + panX, y: row * CELL_HEIGHT * scale + panY }
}

export function pixelToCell(px: number, py: number, zoom: number, panX: number, panY: number) {
  const scale = zoom / 100
  return {
    col: Math.floor((px - panX) / (CELL_WIDTH * scale)),
    row: Math.floor((py - panY) / (CELL_HEIGHT * scale)),
  }
}
