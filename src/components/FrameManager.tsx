import { useEffect, useRef, useCallback, useState } from 'react'
import './FrameManager.css'
import { useProjectState, useProjectDispatch } from '../state/ProjectContext'
import { Frame } from '../types'
import { frameToText } from '../file/exportTxt'
import { exportTextFile } from '../file/fileSystem'

const THUMB_W = 64
const THUMB_H = 44

// Render a tiny preview of a frame using a canvas element
function FrameThumb({ frame, gridWidth, gridHeight }: { frame: Frame; gridWidth: number; gridHeight: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, THUMB_W, THUMB_H)

    const cellW = THUMB_W / gridWidth
    const cellH = THUMB_H / gridHeight

    ctx.fillStyle = '#e0e0e0'
    ctx.font = `${cellH * 0.85}px "Noto Sans Mono CJK JP", monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (let r = 0; r < gridHeight; r++) {
      for (let c = 0; c < gridWidth; c++) {
        const ch = frame.data[r]?.[c]
        if (!ch || ch === ' ') continue
        ctx.fillText(ch, c * cellW + cellW / 2, r * cellH + cellH / 2)
      }
    }
  }, [frame, gridWidth, gridHeight])

  return (
    <div className="fm-thumb">
      <canvas ref={canvasRef} width={THUMB_W} height={THUMB_H} style={{ display: 'block' }} />
    </div>
  )
}

interface ContextMenuState {
  x: number
  y: number
  frameIndex: number
}

export default function FrameManager() {
  const state = useProjectState()
  const dispatch = useProjectDispatch()

  const { project, activeFrameIndex, isPlaying, onionSkinEnabled } = state
  const { fps, frames } = project

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const [selectedFrames, setSelectedFrames] = useState<Set<number>>(new Set())

  const handleFrameClick = (e: React.MouseEvent, index: number) => {
    if (e.shiftKey) {
      // Shift+click: select range from active frame to clicked frame
      const min = Math.min(activeFrameIndex, index)
      const max = Math.max(activeFrameIndex, index)
      const newSet = new Set<number>()
      for (let i = min; i <= max; i++) newSet.add(i)
      setSelectedFrames(newSet)
    } else {
      // Normal click: select single frame, clear multi-selection
      setSelectedFrames(new Set())
      dispatch({ type: 'SELECT_FRAME', index })
    }
  }

  const handleExportSelected = async () => {
    closeContextMenu()
    const indices = selectedFrames.size > 0
      ? Array.from(selectedFrames).sort((a, b) => a - b)
      : [activeFrameIndex]
    try {
      for (const i of indices) {
        const f = frames[i]
        if (!f) continue
        const sanitized = f.name.replace(/[^a-zA-Z0-9_-]/g, '_')
        const filename = `${sanitized}.txt`
        await exportTextFile(filename, frameToText(f))
      }
    } catch (err) {
      window.alert(`Export failed: ${(err as Error).message}`)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, frameIndex: index })
  }

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  useEffect(() => {
    if (!contextMenu) return
    const handler = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        closeContextMenu()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [contextMenu, closeContextMenu])

  // Adjust context menu position to stay within viewport
  useEffect(() => {
    if (!contextMenu || !contextMenuRef.current) return
    const el = contextMenuRef.current
    const rect = el.getBoundingClientRect()
    let { x, y } = contextMenu
    if (rect.right > window.innerWidth) {
      x = window.innerWidth - rect.width - 4
    }
    if (rect.bottom > window.innerHeight) {
      y = window.innerHeight - rect.height - 4
    }
    if (x < 0) x = 4
    if (y < 0) y = 4
    if (x !== contextMenu.x || y !== contextMenu.y) {
      el.style.left = `${x}px`
      el.style.top = `${y}px`
    }
  }, [contextMenu])

  const handleDuplicate = (index: number) => {
    dispatch({ type: 'DUPLICATE_FRAME', index })
    closeContextMenu()
  }

  const handleDelete = (index: number) => {
    if (frames.length <= 1) {
      alert('Cannot delete the only frame.')
      closeContextMenu()
      return
    }
    dispatch({ type: 'DELETE_FRAME', index })
    closeContextMenu()
  }

  const handleRename = (index: number) => {
    const current = frames[index]?.name ?? ''
    const name = prompt('Rename frame:', current)
    if (name !== null && name.trim().length > 0) {
      dispatch({ type: 'RENAME_FRAME', index, name: name.trim() })
    }
    closeContextMenu()
  }

  const handleMoveLeft = (index: number) => {
    if (index > 0) dispatch({ type: 'MOVE_FRAME', from: index, to: index - 1 })
    closeContextMenu()
  }

  const handleMoveRight = (index: number) => {
    if (index < frames.length - 1) dispatch({ type: 'MOVE_FRAME', from: index, to: index + 1 })
    closeContextMenu()
  }

  // Drag-and-drop reordering
  const dragIndexRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragSide, setDragSide] = useState<'left' | 'right'>('left')

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragIndexRef.current === null || dragIndexRef.current === index) {
      setDragOverIndex(null)
      return
    }
    // Determine if cursor is on left or right half of the target
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const side = (e.clientX - rect.left) < rect.width / 2 ? 'left' : 'right'
    setDragOverIndex(index)
    setDragSide(side)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const fromIndex = dragIndexRef.current
    if (fromIndex !== null && fromIndex !== dropIndex) {
      dispatch({ type: 'MOVE_FRAME', from: fromIndex, to: dropIndex })
    }
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  return (
    <div className="frame-manager">
      {/* Header */}
      <div className="fm-header">
        <span className="fm-label">Frames</span>

        <div className="fm-fps-group">
          <span>FPS</span>
          <input
            className="fm-fps-input"
            type="number"
            min={1}
            max={30}
            value={fps}
            onChange={e => {
              const val = parseInt(e.target.value, 10)
              if (!isNaN(val)) {
                dispatch({ type: 'SET_FPS', fps: val })
              }
            }}
          />
        </div>

        <button
          className={`fm-icon-btn${isPlaying ? ' active' : ''}`}
          title={isPlaying ? 'Pause' : 'Play'}
          onClick={() => dispatch({ type: 'TOGGLE_PLAYING' })}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          className={`fm-icon-btn${onionSkinEnabled ? ' active' : ''}`}
          title={onionSkinEnabled ? 'Disable Onion Skin' : 'Enable Onion Skin'}
          onClick={() => dispatch({ type: 'TOGGLE_ONION_SKIN' })}
        >
          ⧖
        </button>
      </div>

      {/* Frame strip */}
      <div className="fm-strip-wrap">
        {frames.map((frame, index) => (
          <div
            key={index}
            className={[
              'fm-frame-item',
              activeFrameIndex === index ? 'active' : '',
              selectedFrames.has(index) ? 'selected' : '',
              dragOverIndex === index && dragSide === 'left' ? 'drop-left' : '',
              dragOverIndex === index && dragSide === 'right' ? 'drop-right' : '',
            ].filter(Boolean).join(' ')}
            draggable
            onClick={e => handleFrameClick(e, index)}
            onContextMenu={e => handleContextMenu(e, index)}
            onDragStart={e => handleDragStart(e, index)}
            onDragOver={e => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            <FrameThumb
              frame={frame}
              gridWidth={project.canvas.width}
              gridHeight={project.canvas.height}
            />
            <div className="fm-frame-name">{frame.name}</div>
          </div>
        ))}

        <button
          className="fm-add-btn"
          title="Add Frame"
          onClick={() => dispatch({ type: 'ADD_FRAME' })}
        >
          +
        </button>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fm-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="fm-context-item" onClick={() => handleDuplicate(contextMenu.frameIndex)}>
            Duplicate
          </div>
          <div className="fm-context-item" onClick={() => handleRename(contextMenu.frameIndex)}>
            Rename
          </div>
          <div className="fm-context-item" onClick={() => handleMoveLeft(contextMenu.frameIndex)}>
            Move Left
          </div>
          <div className="fm-context-item" onClick={() => handleMoveRight(contextMenu.frameIndex)}>
            Move Right
          </div>
          <div className="fm-context-item" onClick={handleExportSelected}>
            Export {selectedFrames.size > 1 ? `${selectedFrames.size} Frames` : 'Frame'}
          </div>
          <div className="fm-context-item danger" onClick={() => handleDelete(contextMenu.frameIndex)}>
            Delete
          </div>
        </div>
      )}
    </div>
  )
}
