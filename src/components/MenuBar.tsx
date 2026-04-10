import { useState, useEffect, useRef } from 'react'
import { useProjectState, useProjectDispatch } from '../state/ProjectContext'
import { serializeProject, deserializeProject } from '../file/projectFile'
import { mirrorHorizontal, mirrorVertical, rotateCW, rotateCCW } from '../canvas/tools/select'
import { saveProject, openProject, exportTextFile } from '../file/fileSystem'
import { frameToText, allFramesToTexts } from '../file/exportTxt'
import './MenuBar.css'

type MenuName = 'file' | 'edit' | 'view' | 'canvas' | null

export default function MenuBar() {
  const state = useProjectState()
  const dispatch = useProjectDispatch()
  const [openMenu, setOpenMenu] = useState<MenuName>(null)
  const menuBarRef = useRef<HTMLDivElement>(null)

  const { project, activeFrameIndex, gridVisible, guidesVisible, onionSkinEnabled } = state

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleMenu = (name: MenuName) => {
    setOpenMenu(prev => (prev === name ? null : name))
  }

  const closeMenu = () => setOpenMenu(null)

  // ---------------------------------------------------------------------------
  // File actions
  // ---------------------------------------------------------------------------

  const handleNew = () => {
    closeMenu()
    const input = window.prompt('New canvas dimensions (WxH):', '40x20')
    if (!input) return
    const match = input.match(/^(\d+)[x×](\d+)$/i)
    if (!match) { window.alert('Invalid format. Use WxH, e.g. 40x20'); return }
    const width = parseInt(match[1], 10)
    const height = parseInt(match[2], 10)
    if (width < 1 || height < 1 || width > 200 || height > 200) {
      window.alert('Dimensions must be between 1 and 200.')
      return
    }
    dispatch({ type: 'NEW_PROJECT', width, height })
  }

  const handleOpen = async () => {
    closeMenu()
    try {
      const json = await openProject()
      if (!json) return
      const loaded = deserializeProject(json)
      dispatch({ type: 'LOAD_PROJECT', project: loaded })
    } catch (err) {
      window.alert(`Failed to open project: ${(err as Error).message}`)
    }
  }

  const handleSave = async () => {
    closeMenu()
    try {
      const json = serializeProject(project)
      await saveProject(json, false)
    } catch (err) {
      window.alert(`Failed to save project: ${(err as Error).message}`)
    }
  }

  const handleSaveAs = async () => {
    closeMenu()
    try {
      const json = serializeProject(project)
      await saveProject(json, true)
    } catch (err) {
      window.alert(`Failed to save project: ${(err as Error).message}`)
    }
  }

  const handleExportFrame = async () => {
    closeMenu()
    const frame = project.frames[activeFrameIndex]
    if (!frame) return
    const sanitized = frame.name.replace(/[^a-zA-Z0-9_-]/g, '_')
    const filename = `${sanitized}.txt`
    const content = frameToText(frame)
    try {
      await exportTextFile(filename, content)
    } catch (err) {
      window.alert(`Export failed: ${(err as Error).message}`)
    }
  }

  const handleExportAll = async () => {
    closeMenu()
    const files = allFramesToTexts(project.frames)
    try {
      for (const f of files) {
        await exportTextFile(f.name, f.content)
      }
    } catch (err) {
      window.alert(`Export failed: ${(err as Error).message}`)
    }
  }

  // ---------------------------------------------------------------------------
  // Edit actions
  // ---------------------------------------------------------------------------

  const handleUndo = () => { closeMenu(); dispatch({ type: 'UNDO' }) }
  const handleRedo = () => { closeMenu(); dispatch({ type: 'REDO' }) }
  const handleMirrorH = () => { closeMenu(); mirrorHorizontal(state, dispatch) }
  const handleMirrorV = () => { closeMenu(); mirrorVertical(state, dispatch) }
  const handleRotateCW = () => { closeMenu(); rotateCW(state, dispatch) }
  const handleRotateCCW = () => { closeMenu(); rotateCCW(state, dispatch) }

  // ---------------------------------------------------------------------------
  // View actions
  // ---------------------------------------------------------------------------

  const handleToggleGrid = () => { closeMenu(); dispatch({ type: 'TOGGLE_GRID' }) }
  const handleToggleGuides = () => { closeMenu(); dispatch({ type: 'TOGGLE_GUIDES' }) }
  const handleToggleOnion = () => { closeMenu(); dispatch({ type: 'TOGGLE_ONION_SKIN' }) }

  // ---------------------------------------------------------------------------
  // Canvas actions
  // ---------------------------------------------------------------------------

  const handleResizeCanvas = () => {
    closeMenu()
    const current = `${project.canvas.width}x${project.canvas.height}`
    const input = window.prompt('Resize canvas (WxH):', current)
    if (!input) return
    const match = input.match(/^(\d+)[x×](\d+)$/i)
    if (!match) { window.alert('Invalid format. Use WxH, e.g. 40x20'); return }
    const width = parseInt(match[1], 10)
    const height = parseInt(match[2], 10)
    if (width < 1 || height < 1 || width > 200 || height > 200) {
      window.alert('Dimensions must be between 1 and 200.')
      return
    }
    dispatch({ type: 'NEW_PROJECT', width, height })
  }

  return (
    <div className="menu-bar" ref={menuBarRef}>
      <span className="app-title">Pixcii</span>

      {/* File Menu */}
      <div className="menu-group">
        <button
          className={`menu-trigger${openMenu === 'file' ? ' active' : ''}`}
          onClick={() => toggleMenu('file')}
        >
          File
        </button>
        {openMenu === 'file' && (
          <div className="dropdown">
            <button className="dropdown-item" onClick={handleNew}>New…</button>
            <button className="dropdown-item" onClick={handleOpen}>
              Open <span className="shortcut">Ctrl+O</span>
            </button>
            <div className="dropdown-separator" />
            <button className="dropdown-item" onClick={handleSave}>
              Save <span className="shortcut">Ctrl+S</span>
            </button>
            <button className="dropdown-item" onClick={handleSaveAs}>
              Save As… <span className="shortcut">Ctrl+Shift+S</span>
            </button>
            <div className="dropdown-separator" />
            <button className="dropdown-item" onClick={handleExportFrame}>Export Frame</button>
            <button className="dropdown-item" onClick={handleExportAll}>Export All Frames</button>
          </div>
        )}
      </div>

      {/* Edit Menu */}
      <div className="menu-group">
        <button
          className={`menu-trigger${openMenu === 'edit' ? ' active' : ''}`}
          onClick={() => toggleMenu('edit')}
        >
          Edit
        </button>
        {openMenu === 'edit' && (
          <div className="dropdown">
            <button className="dropdown-item" onClick={handleUndo}>
              Undo <span className="shortcut">Ctrl+Z</span>
            </button>
            <button className="dropdown-item" onClick={handleRedo}>
              Redo <span className="shortcut">Ctrl+Shift+Z</span>
            </button>
            <div className="dropdown-separator" />
            <button className="dropdown-item" onClick={handleMirrorH}>Mirror Horizontal</button>
            <button className="dropdown-item" onClick={handleMirrorV}>Mirror Vertical</button>
            <button className="dropdown-item" onClick={handleRotateCW}>Rotate 90° CW</button>
            <button className="dropdown-item" onClick={handleRotateCCW}>Rotate 90° CCW</button>
          </div>
        )}
      </div>

      {/* View Menu */}
      <div className="menu-group">
        <button
          className={`menu-trigger${openMenu === 'view' ? ' active' : ''}`}
          onClick={() => toggleMenu('view')}
        >
          View
        </button>
        {openMenu === 'view' && (
          <div className="dropdown">
            <button className="dropdown-item" onClick={handleToggleGrid}>
              {gridVisible ? 'Hide Grid' : 'Show Grid'} <span className="shortcut">G</span>
            </button>
            <button className="dropdown-item" onClick={handleToggleGuides}>
              {guidesVisible ? 'Hide Guides' : 'Show Guides'}
            </button>
            <button className="dropdown-item" onClick={handleToggleOnion}>
              {onionSkinEnabled ? 'Disable Onion Skin' : 'Enable Onion Skin'}
            </button>
          </div>
        )}
      </div>

      {/* Canvas Menu */}
      <div className="menu-group">
        <button
          className={`menu-trigger${openMenu === 'canvas' ? ' active' : ''}`}
          onClick={() => toggleMenu('canvas')}
        >
          Canvas
        </button>
        {openMenu === 'canvas' && (
          <div className="dropdown">
            <button className="dropdown-item" onClick={handleResizeCanvas}>
              Resize Canvas…
            </button>
          </div>
        )}
      </div>

      {/* Dimensions display on the right */}
      <div className="menu-bar-spacer" />
      <span className="menu-dimensions">
        {project.canvas.width} × {project.canvas.height}
      </span>
    </div>
  )
}
