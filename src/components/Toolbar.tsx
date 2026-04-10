import './Toolbar.css'
import { useProjectState, useProjectDispatch } from '../state/ProjectContext'
import { Tool } from '../types'

const TOOLS: { tool: Tool; label: string; title: string }[] = [
  { tool: 'pencil',  label: '✎', title: 'Pencil' },
  { tool: 'eraser',  label: '⌫', title: 'Eraser' },
  { tool: 'select',  label: '▭', title: 'Select' },
  { tool: 'fill',    label: '◧', title: 'Fill' },
  { tool: 'text',    label: 'T', title: 'Text' },
  { tool: 'shape',   label: '◇', title: 'Shape' },
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
