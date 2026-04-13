import { useState, useEffect } from 'react'
import { useProjectState, useProjectDispatch } from '../state/ProjectContext'
import { formatTimeAgo } from '../file/autosave'
import './StatusBar.css'

export default function StatusBar() {
  const state = useProjectState()
  const dispatch = useProjectDispatch()
  const {
    cursorRow,
    cursorCol,
    activeFrameIndex,
    project,
    activeChar,
    zoom,
    lastSaveTime,
    isDirty,
  } = state

  const totalFrames = project.frames.length
  const frameNum = activeFrameIndex + 1

  // Tick the "saved X ago" label every 10 seconds
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!lastSaveTime) return
    const interval = setInterval(() => setTick(t => t + 1), 10_000)
    return () => clearInterval(interval)
  }, [lastSaveTime])

  const saveLabel = lastSaveTime
    ? `Saved ${formatTimeAgo(lastSaveTime)}`
    : 'Not yet saved'

  return (
    <div className="status-bar">
      <span className="status-item">
        Col: {cursorCol}&nbsp;&nbsp;Row: {cursorRow}
      </span>
      <span className="status-separator">|</span>
      <span className="status-item">
        Frame {frameNum}/{totalFrames}
      </span>
      <span className="status-separator">|</span>
      <span className="status-item status-char">
        Char: <code>{activeChar === ' ' ? '(space)' : activeChar}</code>
      </span>
      <span className="status-separator">|</span>
      <span className={`status-item ${isDirty ? 'status-unsaved' : 'status-saved'}`}>
        {saveLabel}{isDirty ? ' ● unsaved changes' : ''}
      </span>
      <span className="status-spacer" />
      <span className="status-zoom">
        <button
          className="zoom-btn"
          onClick={() => dispatch({ type: 'SET_ZOOM', zoom: zoom - 10 })}
          title="Zoom out"
        >
          −
        </button>
        <span className="zoom-label">{zoom}%</span>
        <button
          className="zoom-btn"
          onClick={() => dispatch({ type: 'SET_ZOOM', zoom: zoom + 10 })}
          title="Zoom in"
        >
          +
        </button>
      </span>
    </div>
  )
}
