import { bresenhamLine } from './bresenham'

export interface Point {
  row: number
  col: number
}

// ---------------------------------------------------------------------------
// Dedup helper
// ---------------------------------------------------------------------------
function dedup(points: Point[]): Point[] {
  const seen = new Set<string>()
  return points.filter(({ row, col }) => {
    const key = `${row},${col}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ---------------------------------------------------------------------------
// Rectangle
// ---------------------------------------------------------------------------

export function rectangleOutline(r0: number, c0: number, r1: number, c1: number): Point[] {
  const minR = Math.min(r0, r1)
  const maxR = Math.max(r0, r1)
  const minC = Math.min(c0, c1)
  const maxC = Math.max(c0, c1)

  const points: Point[] = [
    ...bresenhamLine(minR, minC, minR, maxC), // top
    ...bresenhamLine(maxR, minC, maxR, maxC), // bottom
    ...bresenhamLine(minR, minC, maxR, minC), // left
    ...bresenhamLine(minR, maxC, maxR, maxC), // right
  ]

  return dedup(points)
}

export function rectangleFilled(r0: number, c0: number, r1: number, c1: number): Point[] {
  const minR = Math.min(r0, r1)
  const maxR = Math.max(r0, r1)
  const minC = Math.min(c0, c1)
  const maxC = Math.max(c0, c1)

  const points: Point[] = []
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      points.push({ row: r, col: c })
    }
  }
  return points
}

// ---------------------------------------------------------------------------
// Ellipse
// ---------------------------------------------------------------------------

export function ellipseOutline(r0: number, c0: number, r1: number, c1: number): Point[] {
  const minR = Math.min(r0, r1)
  const maxR = Math.max(r0, r1)
  const minC = Math.min(c0, c1)
  const maxC = Math.max(c0, c1)

  const cx = (minC + maxC) / 2
  const cy = (minR + maxR) / 2
  const rx = (maxC - minC) / 2
  const ry = (maxR - minR) / 2

  const points: Point[] = []

  if (rx === 0 && ry === 0) {
    points.push({ row: Math.round(cy), col: Math.round(cx) })
    return points
  }

  // Use parametric sampling with enough steps for full coverage
  const steps = Math.max(360, Math.ceil(2 * Math.PI * Math.max(rx, ry) * 4))
  for (let i = 0; i < steps; i++) {
    const t = (2 * Math.PI * i) / steps
    const col = Math.round(cx + rx * Math.cos(t))
    const row = Math.round(cy + ry * Math.sin(t))
    points.push({ row, col })
  }

  return dedup(points)
}

export function ellipseFilled(r0: number, c0: number, r1: number, c1: number): Point[] {
  const minR = Math.min(r0, r1)
  const maxR = Math.max(r0, r1)
  const minC = Math.min(c0, c1)
  const maxC = Math.max(c0, c1)

  const cx = (minC + maxC) / 2
  const cy = (minR + maxR) / 2
  const rx = (maxC - minC) / 2
  const ry = (maxR - minR) / 2

  const points: Point[] = []

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const dr = ry === 0 ? 0 : (r - cy) / ry
      const dc = rx === 0 ? 0 : (c - cx) / rx
      if (dr * dr + dc * dc <= 1.0) {
        points.push({ row: r, col: c })
      }
    }
  }

  return points
}

// ---------------------------------------------------------------------------
// Triangle
// Vertices: top-center, bottom-left, bottom-right of bounding box
// ---------------------------------------------------------------------------

export function triangleOutline(r0: number, c0: number, r1: number, c1: number): Point[] {
  const minR = Math.min(r0, r1)
  const maxR = Math.max(r0, r1)
  const minC = Math.min(c0, c1)
  const maxC = Math.max(c0, c1)

  const topR = minR
  const topC = Math.round((minC + maxC) / 2)
  const botL: Point = { row: maxR, col: minC }
  const botR: Point = { row: maxR, col: maxC }

  const points: Point[] = [
    ...bresenhamLine(topR, topC, botL.row, botL.col),
    ...bresenhamLine(topR, topC, botR.row, botR.col),
    ...bresenhamLine(botL.row, botL.col, botR.row, botR.col),
  ]

  return dedup(points)
}

export function triangleFilled(r0: number, c0: number, r1: number, c1: number): Point[] {
  const minR = Math.min(r0, r1)
  const maxR = Math.max(r0, r1)
  const minC = Math.min(c0, c1)
  const maxC = Math.max(c0, c1)

  const topC = (minC + maxC) / 2
  const botLC = minC
  const botRC = maxC

  // For each row, find the left and right extents by interpolating along edges
  const points: Point[] = []

  const totalRows = maxR - minR

  for (let r = minR; r <= maxR; r++) {
    const t = totalRows === 0 ? 1 : (r - minR) / totalRows

    // Left edge: top -> bottom-left
    const leftC = topC + t * (botLC - topC)
    // Right edge: top -> bottom-right
    const rightC = topC + t * (botRC - topC)

    const startC = Math.round(Math.min(leftC, rightC))
    const endC = Math.round(Math.max(leftC, rightC))

    for (let c = startC; c <= endC; c++) {
      points.push({ row: r, col: c })
    }
  }

  return dedup(points)
}
