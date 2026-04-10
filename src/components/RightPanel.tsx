import { useState } from 'react'
import './RightPanel.css'
import { useProjectState, useProjectDispatch } from '../state/ProjectContext'
import { ShapeType } from '../types'

const SHAPE_TYPES: { value: ShapeType; label: string }[] = [
  { value: 'line',      label: 'Line' },
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'circle',    label: 'Circle' },
  { value: 'triangle',  label: 'Triangle' },
]

const TOOL_NAMES: Record<string, string> = {
  pencil: 'Pencil',
  eraser: 'Eraser',
  select: 'Select',
  fill:   'Fill',
  text:   'Text',
  shape:  'Shape',
}

export default function RightPanel() {
  const state = useProjectState()
  const dispatch = useProjectDispatch()
  const [typeChar, setTypeChar] = useState('')

  const { activeTool, brushSize, activeShapeType, shapeFilled, gridVisible, charactersInDocument, activeChar } = state

  const handleUseChar = () => {
    if (typeChar.length > 0) {
      dispatch({ type: 'SET_CHAR', char: typeChar[0] })
    }
  }

  return (
    <div className="right-panel">
      {/* Section 1: Tool Options */}
      <div className="rp-section">
        <div className="rp-section-title">Tool Options</div>
        <div className="rp-tool-name">{TOOL_NAMES[activeTool] ?? activeTool}</div>

        {(activeTool === 'pencil' || activeTool === 'eraser') && (
          <div className="rp-brush-sizes">
            {([1, 2, 3] as (1 | 2 | 3)[]).map(size => (
              <button
                key={size}
                className={`rp-size-btn${brushSize === size ? ' active' : ''}`}
                onClick={() => dispatch({ type: 'SET_BRUSH_SIZE', size })}
              >
                {size}x{size}
              </button>
            ))}
          </div>
        )}

        {activeTool === 'shape' && (
          <div className="rp-shape-row">
            <select
              className="rp-select"
              value={activeShapeType}
              onChange={e => dispatch({ type: 'SET_SHAPE_TYPE', shapeType: e.target.value as ShapeType })}
            >
              {SHAPE_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <label className="rp-checkbox-row">
              <input
                type="checkbox"
                checked={shapeFilled}
                onChange={e => dispatch({ type: 'SET_SHAPE_FILLED', filled: e.target.checked })}
              />
              Filled
            </label>
          </div>
        )}

        <label className="rp-grid-row">
          <input
            type="checkbox"
            checked={gridVisible}
            onChange={() => dispatch({ type: 'TOGGLE_GRID' })}
          />
          Show Grid
        </label>
      </div>

      {/* Section 2: Characters in Document */}
      <div className="rp-section">
        <div className="rp-section-title">Characters in Document</div>
        {charactersInDocument.length === 0 ? (
          <div className="rp-empty-chars">No characters drawn yet</div>
        ) : (
          <div className="rp-char-grid">
            {charactersInDocument.map(ch => (
              <button
                key={ch}
                className={`rp-char-btn${activeChar === ch ? ' active' : ''}`}
                title={`Use "${ch}"`}
                onClick={() => dispatch({ type: 'SET_CHAR', char: ch })}
              >
                {ch}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Type Character */}
      <div className="rp-section">
        <div className="rp-section-title">Type Character</div>
        <div className="rp-type-row">
          <input
            className="rp-char-input"
            type="text"
            maxLength={1}
            value={typeChar}
            placeholder="#"
            onChange={e => setTypeChar(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleUseChar() }}
          />
          <button className="rp-use-btn" onClick={handleUseChar}>
            Use
          </button>
        </div>
      </div>
    </div>
  )
}
