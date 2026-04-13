import { useState } from 'react'
import './RightPanel.css'
import { useProjectState, useProjectDispatch } from '../state/ProjectContext'
import { ShapeType, HistoryEntry } from '../types'
import { imageToAscii } from '../utils/imageToAscii'
import { CHARACTER_GROUPS } from './characterSets'

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
  const [typeChar, setTypeChar] = useState(state.activeChar ?? '')

  const { activeTool, brushSize, activeShapeType, shapeFilled, gridVisible, charactersInDocument, activeChar } = state

  function selectChar(ch: string) {
    setTypeChar(ch)
    dispatch({ type: 'SET_CHAR', char: ch })
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
      </div>

      {/* Section 2: Display */}
      <div className="rp-section">
        <div className="rp-section-title">Display</div>
        <label className="rp-grid-row">
          <input
            type="checkbox"
            checked={gridVisible}
            onChange={() => dispatch({ type: 'TOGGLE_GRID' })}
          />
          Show Grid
        </label>
        <label className="rp-grid-row">
          <input
            type="checkbox"
            checked={state.guidesVisible}
            onChange={() => dispatch({ type: 'TOGGLE_GUIDES' })}
          />
          Show Guides
        </label>

        {state.referenceImage && (
          <>
            <label className="rp-grid-row">
              <input
                type="checkbox"
                checked={state.referenceImageVisible}
                onChange={() => dispatch({ type: 'TOGGLE_REFERENCE_IMAGE' })}
              />
              Show Reference
            </label>
            <div className="rp-slider-row">
              <span className="option-label">Opacity</span>
              <input
                type="range"
                className="rp-slider"
                min={0}
                max={100}
                value={state.referenceImageOpacity}
                onChange={e => dispatch({ type: 'SET_REFERENCE_OPACITY', opacity: parseInt(e.target.value) })}
              />
              <span className="rp-slider-value">{state.referenceImageOpacity}%</span>
            </div>
            <div className="rp-convert-section">
              <div className="rp-subsection-title">Convert to ASCII</div>
              <div className="rp-type-row">
                <input
                  className="rp-char-input rp-ramp-input mono-cjk"
                  type="text"
                  value={state.asciiConvertRamp}
                  title="Character ramp: lightest to darkest"
                  onChange={e => dispatch({ type: 'SET_ASCII_RAMP', ramp: e.target.value })}
                />
              </div>
              <button
                className="rp-convert-btn"
                onClick={async () => {
                  if (!state.referenceImage) return
                  try {
                    const ascii = await imageToAscii(
                      state.referenceImage,
                      state.project.canvas.width,
                      state.project.canvas.height,
                      state.asciiConvertRamp,
                    )
                    const frame = state.project.frames[state.activeFrameIndex]
                    const cells: HistoryEntry['cells'] = []
                    for (let r = 0; r < ascii.length; r++) {
                      for (let c = 0; c < ascii[r].length; c++) {
                        if (r < state.project.canvas.height && c < state.project.canvas.width) {
                          cells.push({ row: r, col: c, prev: frame.data[r][c], next: ascii[r][c] })
                        }
                      }
                    }
                    dispatch({ type: 'PUSH_UNDO', entry: { cells } })
                    dispatch({ type: 'SET_CELLS', cells: cells.map(c => ({ row: c.row, col: c.col, char: c.next })) })
                    dispatch({ type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
                  } catch (err) {
                    window.alert(`Conversion failed: ${(err as Error).message}`)
                  }
                }}
              >
                Convert to ASCII
              </button>
            </div>
          </>
        )}
      </div>

      {/* Section 3: Characters */}
      <div className="rp-section">
        <div className="rp-section-title">Characters</div>
        <div className="rp-type-row">
          <input
            className="rp-char-input mono-cjk"
            type="text"
            value={typeChar}
            placeholder="#"
            onChange={e => {
              const val = e.target.value
              if (val.length > 0) {
                // Use Array.from to properly handle multi-byte Unicode chars
                const chars = Array.from(val)
                const lastChar = chars[chars.length - 1]
                selectChar(lastChar)
              } else {
                setTypeChar('')
              }
            }}
          />
        </div>

        <div className="rp-subsection-title">Characters in Document</div>
        {charactersInDocument.length === 0 ? (
          <div className="rp-empty-chars">No characters drawn yet</div>
        ) : (
          <div className="rp-char-grid">
            {charactersInDocument.map(ch => (
              <button
                key={ch}
                className={`rp-char-btn mono-cjk${activeChar === ch ? ' active' : ''}`}
                title={`Use "${ch}"`}
                onClick={() => selectChar(ch)}
              >
                {ch}
              </button>
            ))}
          </div>
        )}

        {CHARACTER_GROUPS.map(group => (
          <div key={group.title}>
            <div className="rp-subsection-title">{group.title}</div>
            <div className="rp-char-grid">
              {group.chars.map(ch => (
                <button
                  key={ch}
                  className={`rp-char-btn mono-cjk${activeChar === ch ? ' active' : ''}`}
                  title={`Use "${ch}"`}
                  onClick={() => selectChar(ch)}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
