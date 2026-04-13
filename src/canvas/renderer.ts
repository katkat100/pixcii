import { Frame, Selection } from '../types'
import { CELL_WIDTH, CELL_HEIGHT, cellToPixel } from './gridUtils'

export interface RenderOptions {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  canvasWidth: number   // project grid columns
  canvasHeight: number  // project grid rows
  frame: Frame
  onionFrame?: Frame
  zoom: number
  panX: number
  panY: number
  gridVisible: boolean
  cursorRow: number
  cursorCol: number
  selection: Selection | null
  accentColor?: string
  brushSize?: number
  activeTool?: string
  guidesVisible?: boolean
  referenceImage?: HTMLImageElement | null
  referenceImageOpacity?: number
}

export function renderCanvas(opts: RenderOptions): void {
  const {
    ctx,
    width,
    height,
    canvasWidth,
    canvasHeight,
    frame,
    onionFrame,
    zoom,
    panX,
    panY,
    gridVisible,
    cursorRow,
    cursorCol,
    selection,
    accentColor = '#e94560',
    brushSize = 1,
    activeTool,
    guidesVisible = false,
    referenceImage,
    referenceImageOpacity = 30,
  } = opts

  const scale = zoom / 100
  const cellW = CELL_WIDTH * scale
  const cellH = CELL_HEIGHT * scale

  // -------------------------------------------------------------------------
  // Background
  // -------------------------------------------------------------------------
  ctx.fillStyle = '#12122a'
  ctx.fillRect(0, 0, width, height)

  // Grid area background
  const gridAreaX = panX
  const gridAreaY = panY
  const gridAreaW = canvasWidth * cellW
  const gridAreaH = canvasHeight * cellH

  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(gridAreaX, gridAreaY, gridAreaW, gridAreaH)

  // -------------------------------------------------------------------------
  // Reference image
  // -------------------------------------------------------------------------
  if (referenceImage && referenceImageOpacity > 0) {
    ctx.save()
    ctx.globalAlpha = referenceImageOpacity / 100

    // Scale to fit within grid area while maintaining aspect ratio, then center
    const imgW = referenceImage.naturalWidth
    const imgH = referenceImage.naturalHeight
    const scaleFit = Math.min(gridAreaW / imgW, gridAreaH / imgH)
    const drawW = imgW * scaleFit
    const drawH = imgH * scaleFit
    const drawX = gridAreaX + (gridAreaW - drawW) / 2
    const drawY = gridAreaY + (gridAreaH - drawH) / 2

    ctx.drawImage(referenceImage, drawX, drawY, drawW, drawH)
    ctx.restore()
  }

  // -------------------------------------------------------------------------
  // Onion skin (previous frame at 20% opacity)
  // -------------------------------------------------------------------------
  if (onionFrame) {
    ctx.save()
    ctx.globalAlpha = 0.2
    ctx.fillStyle = '#e94560'
    ctx.font = `${cellH * 0.85}px monospace, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (let r = 0; r < canvasHeight; r++) {
      for (let c = 0; c < canvasWidth; c++) {
        const ch = onionFrame.data[r]?.[c]
        if (!ch || ch === ' ') continue
        const { x, y } = cellToPixel(c, r, zoom, panX, panY)
        ctx.fillText(ch, x + cellW / 2, y + cellH / 2)
      }
    }
    ctx.restore()
  }

  // -------------------------------------------------------------------------
  // Characters (current frame)
  // -------------------------------------------------------------------------
  ctx.fillStyle = '#e0e0e0'
  ctx.font = `${cellH * 0.85}px monospace, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let r = 0; r < canvasHeight; r++) {
    for (let c = 0; c < canvasWidth; c++) {
      const ch = frame.data[r]?.[c]
      if (!ch || ch === ' ') continue
      const { x, y } = cellToPixel(c, r, zoom, panX, panY)
      ctx.fillText(ch, x + cellW / 2, y + cellH / 2)
    }
  }

  // -------------------------------------------------------------------------
  // Grid overlay
  // -------------------------------------------------------------------------
  if (gridVisible) {
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1

    ctx.beginPath()
    // Vertical lines
    for (let c = 0; c <= canvasWidth; c++) {
      const x = Math.round(panX + c * cellW) + 0.5
      ctx.moveTo(x, gridAreaY)
      ctx.lineTo(x, gridAreaY + gridAreaH)
    }
    // Horizontal lines
    for (let r = 0; r <= canvasHeight; r++) {
      const y = Math.round(panY + r * cellH) + 0.5
      ctx.moveTo(gridAreaX, y)
      ctx.lineTo(gridAreaX + gridAreaW, y)
    }
    ctx.stroke()
  }

  // -------------------------------------------------------------------------
  // Center crosshair + thirds guides
  // -------------------------------------------------------------------------
  if (guidesVisible) {
    ctx.save()
    ctx.lineWidth = 1

    // Center crosshair (quarters) -- brighter
    ctx.strokeStyle = 'rgba(233, 69, 96, 0.35)'
    ctx.beginPath()
    // Vertical center line
    const centerX = Math.round(panX + (canvasWidth / 2) * cellW) + 0.5
    ctx.moveTo(centerX, gridAreaY)
    ctx.lineTo(centerX, gridAreaY + gridAreaH)
    // Horizontal center line
    const centerY = Math.round(panY + (canvasHeight / 2) * cellH) + 0.5
    ctx.moveTo(gridAreaX, centerY)
    ctx.lineTo(gridAreaX + gridAreaW, centerY)
    ctx.stroke()

    // Thirds guide lines -- subtler
    ctx.strokeStyle = 'rgba(233, 69, 96, 0.18)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    // Vertical thirds
    const thirdX1 = Math.round(panX + (canvasWidth / 3) * cellW) + 0.5
    const thirdX2 = Math.round(panX + (2 * canvasWidth / 3) * cellW) + 0.5
    ctx.moveTo(thirdX1, gridAreaY)
    ctx.lineTo(thirdX1, gridAreaY + gridAreaH)
    ctx.moveTo(thirdX2, gridAreaY)
    ctx.lineTo(thirdX2, gridAreaY + gridAreaH)
    // Horizontal thirds
    const thirdY1 = Math.round(panY + (canvasHeight / 3) * cellH) + 0.5
    const thirdY2 = Math.round(panY + (2 * canvasHeight / 3) * cellH) + 0.5
    ctx.moveTo(gridAreaX, thirdY1)
    ctx.lineTo(gridAreaX + gridAreaW, thirdY1)
    ctx.moveTo(gridAreaX, thirdY2)
    ctx.lineTo(gridAreaX + gridAreaW, thirdY2)
    ctx.stroke()

    ctx.restore()
  }

  // -------------------------------------------------------------------------
  // Cursor highlight
  // -------------------------------------------------------------------------
  const cursorBrush = (activeTool === 'pencil' || activeTool === 'eraser') ? brushSize : 1
  const half = Math.floor(cursorBrush / 2)
  const { x: curX, y: curY } = cellToPixel(cursorCol - half, cursorRow - half, zoom, panX, panY)
  ctx.strokeStyle = accentColor
  ctx.lineWidth = 1.5
  ctx.strokeRect(
    Math.round(curX) + 0.5,
    Math.round(curY) + 0.5,
    cellW * cursorBrush - 1,
    cellH * cursorBrush - 1,
  )

  // -------------------------------------------------------------------------
  // Selection (marching ants)
  // -------------------------------------------------------------------------
  if (selection) {
    const minCol = Math.min(selection.startCol, selection.endCol)
    const maxCol = Math.max(selection.startCol, selection.endCol)
    const minRow = Math.min(selection.startRow, selection.endRow)
    const maxRow = Math.max(selection.startRow, selection.endRow)

    const { x: selX, y: selY } = cellToPixel(minCol, minRow, zoom, panX, panY)
    const selW = (maxCol - minCol + 1) * cellW
    const selH = (maxRow - minRow + 1) * cellH

    const now = Date.now()
    const dashOffset = (now / 80) % 16

    ctx.save()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.lineDashOffset = -dashOffset
    ctx.strokeRect(Math.round(selX) + 0.5, Math.round(selY) + 0.5, selW, selH)
    ctx.restore()
  }
}
