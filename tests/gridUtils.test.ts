import { describe, it, expect } from 'vitest'
import { cellToPixel, pixelToCell, CELL_WIDTH, CELL_HEIGHT } from '../src/canvas/gridUtils'

describe('cellToPixel', () => {
  it('returns origin for (0,0) at 100% zoom with no pan', () => {
    const result = cellToPixel(0, 0, 100, 0, 0)
    expect(result).toEqual({ x: 0, y: 0 })
  })

  it('calculates correct pixel at 100% zoom with no pan', () => {
    const col = 3
    const row = 5
    const result = cellToPixel(col, row, 100, 0, 0)
    expect(result).toEqual({ x: col * CELL_WIDTH, y: row * CELL_HEIGHT })
  })

  it('scales correctly at 200% zoom', () => {
    const result = cellToPixel(2, 3, 200, 0, 0)
    expect(result).toEqual({ x: 2 * CELL_WIDTH * 2, y: 3 * CELL_HEIGHT * 2 })
  })

  it('scales correctly at 50% zoom', () => {
    const result = cellToPixel(4, 2, 50, 0, 0)
    expect(result).toEqual({ x: 4 * CELL_WIDTH * 0.5, y: 2 * CELL_HEIGHT * 0.5 })
  })

  it('applies pan offset correctly', () => {
    const result = cellToPixel(1, 1, 100, 20, 30)
    expect(result).toEqual({ x: CELL_WIDTH + 20, y: CELL_HEIGHT + 30 })
  })

  it('applies pan with zoom together', () => {
    const result = cellToPixel(2, 2, 200, 10, 15)
    expect(result).toEqual({ x: 2 * CELL_WIDTH * 2 + 10, y: 2 * CELL_HEIGHT * 2 + 15 })
  })
})

describe('pixelToCell', () => {
  it('returns (0,0) for origin at 100% zoom with no pan', () => {
    const result = pixelToCell(0, 0, 100, 0, 0)
    expect(result).toEqual({ col: 0, row: 0 })
  })

  it('converts pixel back to correct cell at 100% zoom', () => {
    const col = 3
    const row = 5
    const px = col * CELL_WIDTH + 2  // inside the cell
    const py = row * CELL_HEIGHT + 5
    const result = pixelToCell(px, py, 100, 0, 0)
    expect(result).toEqual({ col, row })
  })

  it('converts pixel to cell at 200% zoom', () => {
    const col = 2
    const row = 3
    const px = col * CELL_WIDTH * 2 + 3
    const py = row * CELL_HEIGHT * 2 + 5
    const result = pixelToCell(px, py, 200, 0, 0)
    expect(result).toEqual({ col, row })
  })

  it('converts pixel to cell at 50% zoom', () => {
    const col = 4
    const row = 2
    const px = col * CELL_WIDTH * 0.5 + 1
    const py = row * CELL_HEIGHT * 0.5 + 1
    const result = pixelToCell(px, py, 50, 0, 0)
    expect(result).toEqual({ col, row })
  })

  it('accounts for pan offset', () => {
    const panX = 20
    const panY = 30
    const col = 1
    const row = 1
    const px = col * CELL_WIDTH + panX + 2
    const py = row * CELL_HEIGHT + panY + 2
    const result = pixelToCell(px, py, 100, panX, panY)
    expect(result).toEqual({ col, row })
  })

  it('accounts for pan with zoom', () => {
    const panX = 10
    const panY = 15
    const col = 2
    const row = 2
    const px = col * CELL_WIDTH * 2 + panX + 1
    const py = row * CELL_HEIGHT * 2 + panY + 1
    const result = pixelToCell(px, py, 200, panX, panY)
    expect(result).toEqual({ col, row })
  })

  it('is inverse of cellToPixel at 100% zoom', () => {
    const col = 5
    const row = 7
    const { x, y } = cellToPixel(col, row, 100, 0, 0)
    const result = pixelToCell(x, y, 100, 0, 0)
    expect(result).toEqual({ col, row })
  })

  it('is inverse of cellToPixel with pan and zoom', () => {
    const col = 3
    const row = 4
    const panX = 50
    const panY = 25
    const zoom = 150
    const { x, y } = cellToPixel(col, row, zoom, panX, panY)
    const result = pixelToCell(x, y, zoom, panX, panY)
    expect(result).toEqual({ col, row })
  })
})
