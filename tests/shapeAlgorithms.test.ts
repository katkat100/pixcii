import { describe, it, expect } from 'vitest'
import {
  rectangleOutline,
  rectangleFilled,
  ellipseOutline,
  ellipseFilled,
  triangleOutline,
  triangleFilled,
} from '../src/utils/shapeAlgorithms'

// ---------------------------------------------------------------------------
// Rectangle
// ---------------------------------------------------------------------------
describe('rectangleOutline', () => {
  it('returns only perimeter cells for a 5x4 rectangle', () => {
    // bounding box rows 0-4, cols 0-3 => 5 rows, 4 cols
    // perimeter = 2*(5+4) - 4 = 14
    const pts = rectangleOutline(0, 0, 4, 3)
    expect(pts).toHaveLength(14)
  })

  it('returns only perimeter cells for a 1x1 rectangle (single cell)', () => {
    const pts = rectangleOutline(2, 2, 2, 2)
    expect(pts).toHaveLength(1)
    expect(pts[0]).toEqual({ row: 2, col: 2 })
  })

  it('handles reversed corner ordering', () => {
    const pts1 = rectangleOutline(0, 0, 4, 3)
    const pts2 = rectangleOutline(4, 3, 0, 0)
    expect(pts1).toHaveLength(pts2.length)
  })

  it('all outline points are on the border', () => {
    const pts = rectangleOutline(1, 1, 5, 4)
    pts.forEach(({ row, col }) => {
      const onBorder = row === 1 || row === 5 || col === 1 || col === 4
      expect(onBorder).toBe(true)
    })
  })
})

describe('rectangleFilled', () => {
  it('returns all cells for a 3x3 filled rectangle', () => {
    const pts = rectangleFilled(0, 0, 2, 2)
    expect(pts).toHaveLength(9)
  })

  it('returns correct area for a 5x4 filled rectangle', () => {
    const pts = rectangleFilled(0, 0, 4, 3)
    expect(pts).toHaveLength(20) // 5 rows * 4 cols
  })

  it('every cell is within bounds', () => {
    const pts = rectangleFilled(1, 2, 4, 5)
    pts.forEach(({ row, col }) => {
      expect(row).toBeGreaterThanOrEqual(1)
      expect(row).toBeLessThanOrEqual(4)
      expect(col).toBeGreaterThanOrEqual(2)
      expect(col).toBeLessThanOrEqual(5)
    })
  })
})

// ---------------------------------------------------------------------------
// Ellipse
// ---------------------------------------------------------------------------
describe('ellipseOutline', () => {
  it('returns points for a circle-ish ellipse', () => {
    const pts = ellipseOutline(0, 0, 10, 10)
    expect(pts.length).toBeGreaterThan(0)
  })

  it('all points are within or on the bounding box', () => {
    const pts = ellipseOutline(0, 0, 8, 10)
    pts.forEach(({ row, col }) => {
      expect(row).toBeGreaterThanOrEqual(0)
      expect(row).toBeLessThanOrEqual(8)
      expect(col).toBeGreaterThanOrEqual(0)
      expect(col).toBeLessThanOrEqual(10)
    })
  })

  it('returns a single point for a degenerate 1x1 ellipse', () => {
    const pts = ellipseOutline(3, 3, 3, 3)
    expect(pts).toHaveLength(1)
    expect(pts[0]).toEqual({ row: 3, col: 3 })
  })

  it('has no duplicate points', () => {
    const pts = ellipseOutline(0, 0, 6, 8)
    const keys = pts.map(({ row, col }) => `${row},${col}`)
    const unique = new Set(keys)
    expect(unique.size).toBe(pts.length)
  })
})

describe('ellipseFilled', () => {
  it('returns points for a filled ellipse', () => {
    const pts = ellipseFilled(0, 0, 10, 10)
    expect(pts.length).toBeGreaterThan(0)
  })

  it('filled ellipse has more points than outline', () => {
    const outline = ellipseOutline(0, 0, 8, 8)
    const filled = ellipseFilled(0, 0, 8, 8)
    expect(filled.length).toBeGreaterThan(outline.length)
  })

  it('all filled points are within bounding box', () => {
    const pts = ellipseFilled(1, 2, 9, 10)
    pts.forEach(({ row, col }) => {
      expect(row).toBeGreaterThanOrEqual(1)
      expect(row).toBeLessThanOrEqual(9)
      expect(col).toBeGreaterThanOrEqual(2)
      expect(col).toBeLessThanOrEqual(10)
    })
  })
})

// ---------------------------------------------------------------------------
// Triangle
// ---------------------------------------------------------------------------
describe('triangleOutline', () => {
  it('returns points for a triangle outline', () => {
    const pts = triangleOutline(0, 0, 4, 4)
    expect(pts.length).toBeGreaterThan(0)
  })

  it('includes top-center vertex', () => {
    const pts = triangleOutline(0, 0, 4, 4)
    const topCenter = pts.find(p => p.row === 0 && p.col === 2)
    expect(topCenter).toBeDefined()
  })

  it('includes bottom-left and bottom-right corners', () => {
    const pts = triangleOutline(0, 0, 4, 4)
    const botLeft = pts.find(p => p.row === 4 && p.col === 0)
    const botRight = pts.find(p => p.row === 4 && p.col === 4)
    expect(botLeft).toBeDefined()
    expect(botRight).toBeDefined()
  })

  it('has no duplicate points', () => {
    const pts = triangleOutline(0, 0, 6, 8)
    const keys = pts.map(({ row, col }) => `${row},${col}`)
    const unique = new Set(keys)
    expect(unique.size).toBe(pts.length)
  })
})

describe('triangleFilled', () => {
  it('returns points for a filled triangle', () => {
    const pts = triangleFilled(0, 0, 4, 4)
    expect(pts.length).toBeGreaterThan(0)
  })

  it('filled triangle has at least as many points as outline', () => {
    const outline = triangleOutline(0, 0, 6, 6)
    const filled = triangleFilled(0, 0, 6, 6)
    expect(filled.length).toBeGreaterThanOrEqual(outline.length)
  })

  it('all filled points are within bounding box', () => {
    const pts = triangleFilled(0, 0, 4, 4)
    pts.forEach(({ row, col }) => {
      expect(row).toBeGreaterThanOrEqual(0)
      expect(row).toBeLessThanOrEqual(4)
      expect(col).toBeGreaterThanOrEqual(0)
      expect(col).toBeLessThanOrEqual(4)
    })
  })
})
