import { useProjectState } from '../state/ProjectContext'
import './StatusBar.css'

export default function StatusBar() {
  const state = useProjectState()
  const {
    cursorRow,
    cursorCol,
    activeFrameIndex,
    project,
    activeChar,
    zoom,
  } = state

  const totalFrames = project.frames.length
  const frameNum = activeFrameIndex + 1

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
      <span className="status-item">
        Zoom: {zoom}%
      </span>
    </div>
  )
}
