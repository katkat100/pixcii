import './Toolbar.css'
import { useProjectState, useProjectDispatch } from '../state/ProjectContext'
import { Tool } from '../types'

const TOOLS: { tool: Tool; label: string; title: string }[] = [
  { tool: 'pencil',  label: '✎', title: 'Pencil (P)' },
  { tool: 'eraser',  label: '⌫', title: 'Eraser (E)' },
  { tool: 'select',  label: '▭', title: 'Select (S)' },
  { tool: 'fill',    label: '◧', title: 'Fill (F)' },
  { tool: 'text',    label: 'T', title: 'Text (T)' },
  { tool: 'shape',   label: '◇', title: 'Shape (H)' },
]

export default function Toolbar() {
  const state = useProjectState()
  const dispatch = useProjectDispatch()

  return (
    <div className="toolbar">
      <div className="toolbar-tools">
        {TOOLS.map(({ tool, label, title }) => (
          <button
            key={tool}
            className={`tool-btn${state.activeTool === tool ? ' active' : ''}`}
            title={title}
            onClick={() => dispatch({ type: 'SET_TOOL', tool })}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="toolbar-active-char" title={`Active char: ${state.activeChar}`}>
        {state.activeChar}
      </div>
    </div>
  )
}
