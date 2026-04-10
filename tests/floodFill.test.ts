import { describe, it, expect } from 'vitest'
import { floodFill } from '../src/utils/floodFill'

function makeGrid(rows: string[]): string[][] {
  return rows.map(r => r.split(''))
}

describe('floodFill', () => {
  it('returns empty array when target char equals fill char', () => {
    const data = makeGrid([
      '####',
      '####',
      '####',
    ])
    const result = floodFill(data, 0, 0, '#', 3, 4)
    expect(result).toHaveLength(0)
  })

  it('fills a fully open grid from the corner', () => {
    const data = makeGrid([
      '    ',
      '    ',
      '    ',
    ])
    const result = floodFill(data, 0, 0, '#', 3, 4)
    expect(result).toHaveLength(12)
  })

  it('fills a connected region bounded by walls', () => {
    // Inner 2x2 of spaces surrounded by #
    const data = makeGrid([
      '#####',
      '#   #',
      '#   #',
      '#####',
    ])
    const result = floodFill(data, 1, 1, '#', 4, 5)
    // Should fill all inner spaces: 3x2 = 6 cells
    expect(result).toHaveLength(6)
    // All filled cells should be inside bounds (rows 1-2, cols 1-3)
    result.forEach(({ row, col }) => {
      expect(row).toBeGreaterThanOrEqual(1)
      expect(row).toBeLessThanOrEqual(2)
      expect(col).toBeGreaterThanOrEqual(1)
      expect(col).toBeLessThanOrEqual(3)
    })
  })

  it('fills only the connected region, not across walls', () => {
    // Two separate regions
    const data = makeGrid([
      ' # ',
      ' # ',
      ' # ',
    ])
    const resultLeft = floodFill(data, 0, 0, '#', 3, 3)
    expect(resultLeft).toHaveLength(3) // only the left column
    resultLeft.forEach(p => expect(p.col).toBe(0))

    const resultRight = floodFill(data, 0, 2, '#', 3, 3)
    expect(resultRight).toHaveLength(3) // only the right column
    resultRight.forEach(p => expect(p.col).toBe(2))
  })

  it('fills a single cell region', () => {
    const data = makeGrid([
      '###',
      '# #',
      '###',
    ])
    const result = floodFill(data, 1, 1, '#', 3, 3)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ row: 1, col: 1 })
  })

  it('starts fill from an arbitrary interior cell', () => {
    const data = makeGrid([
      '     ',
      '     ',
      '     ',
    ])
    const result = floodFill(data, 1, 2, '#', 3, 5)
    expect(result).toHaveLength(15)
  })
})
