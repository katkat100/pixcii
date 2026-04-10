import { useRef, useEffect, useCallback } from 'react'
import { useProjectState, useProjectDispatch } from '../state/ProjectContext'
import { renderCanvas } from '../canvas/renderer'
import { pixelToCell, cellToPixel, CELL_WIDTH, CELL_HEIGHT } from '../canvas/gridUtils'
import { handlePencilDown, handlePencilDrag, handlePencilUp } from '../canvas/tools/pencil'
import { handleEraserDown, handleEraserDrag, handleEraserUp } from '../canvas/tools/eraser'
import { handleFillDown } from '../canvas/tools/fill'
import { getShapePoints, commitShape, Point as ShapePoint } from '../canvas/tools/shape'
import { handleTextKey } from '../canvas/tools/text'
import {
  copySelection,
  cutSelection,
  deleteSelection,
  pasteClipboard,
} from '../canvas/tools/select'
import { serializeProject, deserializeProject } from '../file/projectFile'
import { saveProject, openProject } from '../file/fileSystem'
import { isInSelection, Selection, HistoryEntry } from '../types'
import './Canvas.css'

export default function Canvas() {
  const state = useProjectState()
  const dispatch = useProjectDispatch()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDrawingRef = useRef(false)
  const animFrameRef = useRef<number>(0)

  // Shape tool state
  const shapeStartRef = useRef<{ row: number; col: number } | null>(null)
  const shapePreviewRef = useRef<ShapePoint[]>([])

  // Select tool state
  const selectStartRef = useRef<{ row: number; col: number } | null>(null)
  const isMovingSelectionRef = useRef(false)
  const moveStartRef = useRef<{ row: number; col: number } | null>(null)
  const moveContentRef = useRef<{ data: string[][], selSnapshot: Selection } | null>(null)

  const {
    project,
    activeFrameIndex,
    zoom,
    panX,
    panY,
    gridVisible,
    cursorRow,
    cursorCol,
    selection,
    onionSkinEnabled,
    activeTool,
    activeShapeType,
    shapeFilled,
  } = state

  const frame = project.frames[activeFrameIndex]
  const onionFrame = onionSkinEnabled && activeFrameIndex > 0
    ? project.frames[activeFrameIndex - 1]
    : undefined

  // -------------------------------------------------------------------------
  // Draw
  // -------------------------------------------------------------------------
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    renderCanvas({
      ctx,
      width: canvas.width,
      height: canvas.height,
      canvasWidth: project.canvas.width,
      canvasHeight: project.canvas.height,
      frame,
      onionFrame,
      zoom,
      panX,
      panY,
      gridVisible,
      cursorRow,
      cursorCol,
      selection,
      brushSize: state.brushSize,
      activeTool: state.activeTool,
    })

    // Draw shape preview overlay
    const preview = shapePreviewRef.current
    if (preview.length > 0 && activeTool === 'shape') {
      const scale = zoom / 100
      const cellW = CELL_WIDTH * scale
      const cellH = CELL_HEIGHT * scale

      ctx.save()
      ctx.globalAlpha = 0.5
      ctx.fillStyle = '#e94560'
      ctx.font = `${cellH * 0.85}px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      for (const { row, col } of preview) {
        if (
          row < 0 || row >= project.canvas.height ||
          col < 0 || col >= project.canvas.width
        ) continue
        const { x, y } = cellToPixel(col, row, zoom, panX, panY)
        ctx.fillText(state.activeChar, x + cellW / 2, y + cellH / 2)
      }
      ctx.restore()
    }
  }, [
    frame, onionFrame, zoom, panX, panY,
    gridVisible, cursorRow, cursorCol, selection,
    project.canvas.width, project.canvas.height,
    activeTool, state.activeChar, state.brushSize,
  ])

  // -------------------------------------------------------------------------
  // Animation playback
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!state.isPlaying) return
    const interval = setInterval(() => {
      const nextIndex = (state.activeFrameIndex + 1) % state.project.frames.length
      dispatch({ type: 'SELECT_FRAME', index: nextIndex })
    }, 1000 / state.project.fps)
    return () => clearInterval(interval)
  }, [state.isPlaying, state.activeFrameIndex, state.project.fps, state.project.frames.length, dispatch])

  // Re-render whenever state changes
  useEffect(() => {
    cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [draw])

  // -------------------------------------------------------------------------
  // ResizeObserver
  // -------------------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        canvas.width = Math.floor(width)
        canvas.height = Math.floor(height)
        draw()
      }
    })
    ro.observe(container)

    // Initial size
    const rect = container.getBoundingClientRect()
    canvas.width = Math.floor(rect.width)
    canvas.height = Math.floor(rect.height)
    draw()

    return () => ro.disconnect()
  }, [draw])

  // -------------------------------------------------------------------------
  // Keyboard shortcuts
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // When text tool is active, text input takes priority over single-letter shortcuts
      if (state.activeTool === 'text') {
        // Escape always clears selection, even in text mode
        if (e.key === 'Escape') {
          e.preventDefault()
          dispatch({ type: 'SET_SELECTION', selection: null })
          return
        }
        // Allow modifier combos (Ctrl/Meta) to pass through to shortcuts below
        // but handle printable chars, Enter, Backspace for text input
        if (!e.ctrlKey && !e.metaKey) {
          if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace') {
            e.preventDefault()
            handleTextKey(e.key, state, dispatch)
            return
          }
        }
      }

      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && e.shiftKey && e.key === 'Z') {
        e.preventDefault()
        dispatch({ type: 'REDO' })
        return
      }

      if (ctrl && e.key === 'z') {
        e.preventDefault()
        dispatch({ type: 'UNDO' })
        return
      }

      if (ctrl && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault()
        saveProject(serializeProject(state.project), true).catch(() => {})
        return
      }

      if (ctrl && e.key === 's') {
        e.preventDefault()
        saveProject(serializeProject(state.project), false).catch(() => {})
        return
      }

      if (ctrl && e.key === 'o') {
        e.preventDefault()
        openProject().then((json) => {
          if (!json) return
          try {
            const loaded = deserializeProject(json)
            dispatch({ type: 'LOAD_PROJECT', project: loaded })
          } catch (err) {
            window.alert(`Failed to open project: ${(err as Error).message}`)
          }
        }).catch(() => {})
        return
      }

      if (ctrl && e.key === 'c') {
        e.preventDefault()
        copySelection(state, dispatch)
        return
      }

      if (ctrl && e.key === 'x') {
        e.preventDefault()
        cutSelection(state, dispatch)
        return
      }

      if (ctrl && e.key === 'v') {
        e.preventDefault()
        pasteClipboard(state, dispatch)
        return
      }

      // Non-modifier shortcuts — skip if text tool is active (handled above)
      if (state.activeTool === 'text') return

      if (e.key === 'Delete') {
        e.preventDefault()
        deleteSelection(state, dispatch)
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        dispatch({ type: 'SET_SELECTION', selection: null })
        return
      }

      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault()
        dispatch({ type: 'TOGGLE_GRID' })
        return
      }

      if (e.key === ',') {
        e.preventDefault()
        const prevIndex = state.activeFrameIndex - 1
        if (prevIndex >= 0) {
          dispatch({ type: 'SELECT_FRAME', index: prevIndex })
        }
        return
      }

      if (e.key === '.') {
        e.preventDefault()
        const nextIndex = state.activeFrameIndex + 1
        if (nextIndex < state.project.frames.length) {
          dispatch({ type: 'SELECT_FRAME', index: nextIndex })
        }
        return
      }

      if (e.key === ' ') {
        e.preventDefault()
        dispatch({ type: 'TOGGLE_PLAYING' })
        return
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        dispatch({ type: 'ADD_FRAME' })
        return
      }

      // Tool shortcuts
      const toolKeys: Record<string, typeof state.activeTool> = {
        p: 'pencil', e: 'eraser', s: 'select', f: 'fill', t: 'text', h: 'shape',
      }
      const tool = toolKeys[e.key.toLowerCase()]
      if (tool) {
        e.preventDefault()
        dispatch({ type: 'SET_TOOL', tool })
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state, dispatch])

  // -------------------------------------------------------------------------
  // Drawing helpers
  // -------------------------------------------------------------------------
  const getCell = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    return pixelToCell(px, py, zoom, panX, panY)
  }, [zoom, panX, panY])

  // -------------------------------------------------------------------------
  // Mouse events
  // -------------------------------------------------------------------------
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return
    isDrawingRef.current = true
    const cell = getCell(e)
    if (!cell) return

    dispatch({ type: 'SET_CURSOR', row: cell.row, col: cell.col })

    if (activeTool === 'pencil') {
      handlePencilDown(cell.row, cell.col, state, dispatch)
    } else if (activeTool === 'eraser') {
      handleEraserDown(cell.row, cell.col, state, dispatch)
    } else if (activeTool === 'fill') {
      handleFillDown(cell.row, cell.col, state, dispatch)
    } else if (activeTool === 'shape') {
      shapeStartRef.current = { row: cell.row, col: cell.col }
      shapePreviewRef.current = []
    } else if (activeTool === 'select') {
      // If clicking inside an existing selection, enter move mode
      if (selection && isInSelection(cell.row, cell.col, selection)) {
        isMovingSelectionRef.current = true
        moveStartRef.current = { row: cell.row, col: cell.col }

        // Copy selection content
        const minRow = Math.min(selection.startRow, selection.endRow)
        const maxRow = Math.max(selection.startRow, selection.endRow)
        const minCol = Math.min(selection.startCol, selection.endCol)
        const maxCol = Math.max(selection.startCol, selection.endCol)
        const selH = maxRow - minRow + 1
        const selW = maxCol - minCol + 1
        const capturedData: string[][] = []
        for (let r = 0; r < selH; r++) {
          const rowData: string[] = []
          for (let c = 0; c < selW; c++) {
            rowData.push(frame.data[minRow + r]?.[minCol + c] ?? ' ')
          }
          capturedData.push(rowData)
        }
        moveContentRef.current = { data: capturedData, selSnapshot: { ...selection } }

        // Clear the original cells immediately (will be stamped on mouseup)
        const clearCells: { row: number; col: number; char: string }[] = []
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            if (r >= 0 && r < project.canvas.height && c >= 0 && c < project.canvas.width) {
              clearCells.push({ row: r, col: c, char: ' ' })
            }
          }
        }
        dispatch({ type: 'SET_CELLS', cells: clearCells })
      } else {
        // Start a new selection drag
        isMovingSelectionRef.current = false
        moveStartRef.current = null
        moveContentRef.current = null
        selectStartRef.current = { row: cell.row, col: cell.col }
        dispatch({
          type: 'SET_SELECTION',
          selection: {
            startRow: cell.row,
            startCol: cell.col,
            endRow: cell.row,
            endCol: cell.col,
          },
        })
      }
    } else if (activeTool === 'text') {
      dispatch({ type: 'SET_CURSOR', row: cell.row, col: cell.col })
    }
  }, [getCell, dispatch, activeTool, state])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCell(e)
    if (!cell) return
    dispatch({ type: 'SET_CURSOR', row: cell.row, col: cell.col })

    if (!isDrawingRef.current) return

    if (activeTool === 'pencil') {
      handlePencilDrag(cell.row, cell.col, state, dispatch)
    } else if (activeTool === 'eraser') {
      handleEraserDrag(cell.row, cell.col, state, dispatch)
    } else if (activeTool === 'shape') {
      const start = shapeStartRef.current
      if (start) {
        let endRow = cell.row
        let endCol = cell.col

        if (e.shiftKey) {
          const dRow = endRow - start.row
          const dCol = endCol - start.col

          if (activeShapeType === 'line') {
            // Snap to 0, 45, or 90 degree angles
            const angle = Math.atan2(dRow * CELL_HEIGHT, dCol * CELL_WIDTH) * 180 / Math.PI
            const snapped = Math.round(angle / 45) * 45
            const rad = snapped * Math.PI / 180
            const pixelDist = Math.sqrt((dRow * CELL_HEIGHT) ** 2 + (dCol * CELL_WIDTH) ** 2)
            endRow = start.row + Math.round((pixelDist * Math.sin(rad)) / CELL_HEIGHT)
            endCol = start.col + Math.round((pixelDist * Math.cos(rad)) / CELL_WIDTH)
          } else {
            // Rectangle, circle, triangle: force visually square bounding box
            // Use pixel dimensions to determine which axis the user dragged further
            const pixelH = Math.abs(dRow) * CELL_HEIGHT
            const pixelW = Math.abs(dCol) * CELL_WIDTH
            const maxPixel = Math.max(pixelH, pixelW)
            // Convert back to cell counts for each axis
            endRow = start.row + (dRow >= 0 ? 1 : -1) * Math.round(maxPixel / CELL_HEIGHT)
            endCol = start.col + (dCol >= 0 ? 1 : -1) * Math.round(maxPixel / CELL_WIDTH)
          }
        }

        const points = getShapePoints(
          activeShapeType,
          shapeFilled,
          start.row,
          start.col,
          endRow,
          endCol,
        )
        shapePreviewRef.current = points
        // Trigger re-render for preview
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = requestAnimationFrame(() => {
          const canvas = canvasRef.current
          if (!canvas) return
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          renderCanvas({
            ctx,
            width: canvas.width,
            height: canvas.height,
            canvasWidth: project.canvas.width,
            canvasHeight: project.canvas.height,
            frame,
            onionFrame,
            zoom,
            panX,
            panY,
            gridVisible,
            cursorRow: cell.row,
            cursorCol: cell.col,
            selection,
            brushSize: state.brushSize,
            activeTool: state.activeTool,
          })

          // Draw shape preview overlay
          const scale = zoom / 100
          const cellW = CELL_WIDTH * scale
          const cellH = CELL_HEIGHT * scale

          ctx.save()
          ctx.globalAlpha = 0.5
          ctx.fillStyle = '#e94560'
          ctx.font = `${cellH * 0.85}px monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'

          for (const { row, col } of points) {
            if (
              row < 0 || row >= project.canvas.height ||
              col < 0 || col >= project.canvas.width
            ) continue
            const { x, y } = cellToPixel(col, row, zoom, panX, panY)
            ctx.fillText(state.activeChar, x + cellW / 2, y + cellH / 2)
          }
          ctx.restore()
        })
      }
    } else if (activeTool === 'select') {
      if (isMovingSelectionRef.current && moveStartRef.current && moveContentRef.current) {
        // Move mode: offset the selection by the drag delta
        const dRow = cell.row - moveStartRef.current.row
        const dCol = cell.col - moveStartRef.current.col
        const snap = moveContentRef.current.selSnapshot
        const minRow = Math.min(snap.startRow, snap.endRow)
        const maxRow = Math.max(snap.startRow, snap.endRow)
        const minCol = Math.min(snap.startCol, snap.endCol)
        const maxCol = Math.max(snap.startCol, snap.endCol)
        dispatch({
          type: 'SET_SELECTION',
          selection: {
            startRow: minRow + dRow,
            startCol: minCol + dCol,
            endRow: maxRow + dRow,
            endCol: maxCol + dCol,
          },
        })
      } else {
        const start = selectStartRef.current
        if (start) {
          dispatch({
            type: 'SET_SELECTION',
            selection: {
              startRow: start.row,
              startCol: start.col,
              endRow: cell.row,
              endCol: cell.col,
            },
          })
        }
      }
    }
  }, [
    getCell, dispatch, activeTool, state,
    activeShapeType, shapeFilled,
    frame, onionFrame, zoom, panX, panY,
    gridVisible, selection, project.canvas.width, project.canvas.height,
  ])

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false

    const cell = getCell(e)

    // Commit stroke undo for pencil/eraser
    if (activeTool === 'pencil') {
      handlePencilUp(dispatch)
    } else if (activeTool === 'eraser') {
      handleEraserUp(dispatch)
    }

    if (activeTool === 'shape') {
      const start = shapeStartRef.current
      if (start && cell) {
        let endRow = cell.row
        let endCol = cell.col

        if (e.shiftKey) {
          const dRow = endRow - start.row
          const dCol = endCol - start.col

          if (activeShapeType === 'line') {
            const angle = Math.atan2(dRow * CELL_HEIGHT, dCol * CELL_WIDTH) * 180 / Math.PI
            const snapped = Math.round(angle / 45) * 45
            const rad = snapped * Math.PI / 180
            const pixelDist = Math.sqrt((dRow * CELL_HEIGHT) ** 2 + (dCol * CELL_WIDTH) ** 2)
            endRow = start.row + Math.round((pixelDist * Math.sin(rad)) / CELL_HEIGHT)
            endCol = start.col + Math.round((pixelDist * Math.cos(rad)) / CELL_WIDTH)
          } else {
            const pixelH = Math.abs(dRow) * CELL_HEIGHT
            const pixelW = Math.abs(dCol) * CELL_WIDTH
            const maxPixel = Math.max(pixelH, pixelW)
            endRow = start.row + (dRow >= 0 ? 1 : -1) * Math.round(maxPixel / CELL_HEIGHT)
            endCol = start.col + (dCol >= 0 ? 1 : -1) * Math.round(maxPixel / CELL_WIDTH)
          }
        }

        const points = getShapePoints(
          activeShapeType,
          shapeFilled,
          start.row,
          start.col,
          endRow,
          endCol,
        )
        commitShape(points, state, dispatch)
      }
      shapeStartRef.current = null
      shapePreviewRef.current = []
    } else if (activeTool === 'select') {
      if (isMovingSelectionRef.current && moveStartRef.current && moveContentRef.current && cell) {
        // Stamp content at new position
        const dRow = cell.row - moveStartRef.current.row
        const dCol = cell.col - moveStartRef.current.col
        const snap = moveContentRef.current.selSnapshot
        const minRow = Math.min(snap.startRow, snap.endRow)
        const minCol = Math.min(snap.startCol, snap.endCol)
        const movedData = moveContentRef.current.data

        const { width: cW, height: cH } = project.canvas
        const stampCells: { row: number; col: number; prev: string; next: string }[] = []

        for (let r = 0; r < movedData.length; r++) {
          for (let c = 0; c < movedData[r].length; c++) {
            const destRow = minRow + dRow + r
            const destCol = minCol + dCol + c
            if (destRow < 0 || destRow >= cH || destCol < 0 || destCol >= cW) continue
            const ch = movedData[r][c]
            const prev = frame.data[destRow]?.[destCol] ?? ' '
            stampCells.push({ row: destRow, col: destCol, prev, next: ch })
          }
        }

        // Build undo entry covering both the clear (originals) and the stamp
        const snap2 = moveContentRef.current.selSnapshot
        const origMinRow = Math.min(snap2.startRow, snap2.endRow)
        const origMaxRow = Math.max(snap2.startRow, snap2.endRow)
        const origMinCol = Math.min(snap2.startCol, snap2.endCol)
        const origMaxCol = Math.max(snap2.startCol, snap2.endCol)
        const clearHistory: { row: number; col: number; prev: string; next: string }[] = []
        for (let r = origMinRow; r <= origMaxRow; r++) {
          for (let c = origMinCol; c <= origMaxCol; c++) {
            if (r < 0 || r >= cH || c < 0 || c >= cW) continue
            clearHistory.push({ row: r, col: c, prev: movedData[r - origMinRow]?.[c - origMinCol] ?? ' ', next: ' ' })
          }
        }
        const entry: HistoryEntry = { cells: [...clearHistory, ...stampCells] }
        dispatch({ type: 'PUSH_UNDO', entry })
        dispatch({
          type: 'SET_CELLS',
          cells: stampCells.map(sc => ({ row: sc.row, col: sc.col, char: sc.next })),
        })
        dispatch({ type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
      }
      // Clean up move state
      isMovingSelectionRef.current = false
      moveStartRef.current = null
      moveContentRef.current = null
      selectStartRef.current = null
    }
  }, [getCell, activeTool, activeShapeType, shapeFilled, state, dispatch, frame, project.canvas])

  const handleMouseLeave = useCallback(() => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false
      // Commit stroke undo for pencil/eraser if dragged off canvas
      if (activeTool === 'pencil') {
        handlePencilUp(dispatch)
      } else if (activeTool === 'eraser') {
        handleEraserUp(dispatch)
      }
      // If shape was being drawn, clear preview but don't commit
      if (activeTool === 'shape') {
        shapeStartRef.current = null
        shapePreviewRef.current = []
      }
    }
  }, [activeTool, dispatch])

  // -------------------------------------------------------------------------
  // Wheel: Ctrl+scroll to zoom
  // -------------------------------------------------------------------------
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!e.ctrlKey) return
    e.preventDefault()
    const delta = e.deltaY < 0 ? 10 : -10
    const newZoom = Math.min(400, Math.max(50, zoom + delta))
    dispatch({ type: 'SET_ZOOM', zoom: newZoom })
  }, [zoom, dispatch])

  return (
    <div ref={containerRef} className="canvas-container">
      <canvas
        ref={canvasRef}
        className="canvas-main"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      />
    </div>
  )
}
