import { useState, useEffect, useRef, useCallback } from 'react'
import './FrameManager.css'
import { useProjectState, useProjectDispatch } from '../state/ProjectContext'
import { Frame } from '../types'

// Render a tiny preview of a frame (first N rows/cols as plain text)
function FrameThumb({ frame }: { frame: Frame }) {
  const PREVIEW_ROWS = 10
  const PREVIEW_COLS = 16
  const lines = frame.data.slice(0, PREVIEW_ROWS).map(row =>
    row.slice(0, PREVIEW_COLS).join('')
  )
  return (
    <div className="fm-thumb">
      <pre className="fm-thumb-pre">{lines.join('\n')}</pre>
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

  const [fpsInput, setFpsInput] = useState(String(fps))
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // Keep fps input in sync with state
  useEffect(() => {
    setFpsInput(String(fps))
  }, [fps])

  const commitFps = () => {
    const val = parseInt(fpsInput, 10)
    if (!isNaN(val) && val >= 1) {
      dispatch({ type: 'SET_FPS', fps: val })
    } else {
      setFpsInput(String(fps))
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
            value={fpsInput}
            onChange={e => setFpsInput(e.target.value)}
            onBlur={commitFps}
            onKeyDown={e => { if (e.key === 'Enter') commitFps() }}
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
            className={`fm-frame-item${activeFrameIndex === index ? ' active' : ''}`}
            onClick={() => dispatch({ type: 'SELECT_FRAME', index })}
            onContextMenu={e => handleContextMenu(e, index)}
          >
            <FrameThumb frame={frame} />
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
          <div className="fm-context-item danger" onClick={() => handleDelete(contextMenu.frameIndex)}>
            Delete
          </div>
        </div>
      )}
    </div>
  )
}
