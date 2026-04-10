import { describe, it, expect } from 'vitest'
import { bresenhamLine } from '../src/utils/bresenham'

describe('bresenhamLine', () => {
  it('returns a single point when start equals end', () => {
    const pts = bresenhamLine(3, 5, 3, 5)
    expect(pts).toEqual([{ row: 3, col: 5 }])
  })

  it('draws a horizontal line left-to-right', () => {
    const pts = bresenhamLine(0, 0, 0, 4)
    expect(pts).toHaveLength(5)
    expect(pts[0]).toEqual({ row: 0, col: 0 })
    expect(pts[4]).toEqual({ row: 0, col: 4 })
    // All same row
    pts.forEach(p => expect(p.row).toBe(0))
  })

  it('draws a horizontal line right-to-left', () => {
    const pts = bresenhamLine(2, 5, 2, 1)
    expect(pts).toHaveLength(5)
    expect(pts[0]).toEqual({ row: 2, col: 5 })
    expect(pts[4]).toEqual({ row: 2, col: 1 })
  })

  it('draws a vertical line top-to-bottom', () => {
    const pts = bresenhamLine(0, 3, 4, 3)
    expect(pts).toHaveLength(5)
    expect(pts[0]).toEqual({ row: 0, col: 3 })
    expect(pts[4]).toEqual({ row: 4, col: 3 })
    // All same col
    pts.forEach(p => expect(p.col).toBe(3))
  })

  it('draws a vertical line bottom-to-top', () => {
    const pts = bresenhamLine(4, 3, 0, 3)
    expect(pts).toHaveLength(5)
    expect(pts[0]).toEqual({ row: 4, col: 3 })
    expect(pts[4]).toEqual({ row: 0, col: 3 })
  })

  it('draws a 45-degree diagonal line', () => {
    const pts = bresenhamLine(0, 0, 3, 3)
    expect(pts).toHaveLength(4)
    expect(pts[0]).toEqual({ row: 0, col: 0 })
    expect(pts[3]).toEqual({ row: 3, col: 3 })
    pts.forEach((p, i) => {
      expect(p.row).toBe(i)
      expect(p.col).toBe(i)
    })
  })

  it('draws a steep diagonal line', () => {
    const pts = bresenhamLine(0, 0, 4, 1)
    expect(pts[0]).toEqual({ row: 0, col: 0 })
    expect(pts[pts.length - 1]).toEqual({ row: 4, col: 1 })
    expect(pts.length).toBeGreaterThanOrEqual(4)
  })

  it('includes both endpoints', () => {
    const pts = bresenhamLine(1, 2, 5, 8)
    expect(pts[0]).toEqual({ row: 1, col: 2 })
    expect(pts[pts.length - 1]).toEqual({ row: 5, col: 8 })
  })
})
