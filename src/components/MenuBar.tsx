import { useState, useEffect, useRef } from 'react'
import { useProjectState, useProjectDispatch } from '../state/ProjectContext'
import { serializeProject, deserializeProject } from '../file/projectFile'
import { mirrorHorizontal, mirrorVertical, rotateCW, rotateCCW } from '../canvas/tools/select'
import { saveProject, openProject, exportTextFile, clearFileHandle } from '../file/fileSystem'
import { frameToText, allFramesToTexts } from '../file/exportTxt'
import { setLastManualSaveTime } from '../file/autosave'
import './MenuBar.css'

type MenuName = 'file' | 'edit' | 'view' | 'canvas' | null

export default function MenuBar() {
  const state = useProjectState()
  const dispatch = useProjectDispatch()
  const [openMenu, setOpenMenu] = useState<MenuName>(null)
  const menuBarRef = useRef<HTMLDivElement>(null)

  const { project, activeFrameIndex, gridVisible, guidesVisible, onionSkinEnabled, isDirty, fileName } = state

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
    clearFileHandle()
    dispatch({ type: 'NEW_PROJECT', width, height })
  }

  const handleOpen = async () => {
    closeMenu()
    try {
      const result = await openProject()
      if (!result) return
      const loaded = deserializeProject(result.json)
      dispatch({ type: 'LOAD_PROJECT', project: loaded })
      dispatch({ type: 'MARK_SAVED', fileName: result.fileName })
    } catch (err) {
      window.alert(`Failed to open project: ${(err as Error).message}`)
    }
  }

  const handleSave = async () => {
    closeMenu()
    try {
      const json = serializeProject(project)
      const savedName = await saveProject(json, false)
      setLastManualSaveTime()
      dispatch({ type: 'MARK_SAVED', fileName: savedName ?? undefined })
    } catch (err) {
      window.alert(`Failed to save project: ${(err as Error).message}`)
    }
  }

  const handleSaveAs = async () => {
    closeMenu()
    try {
      const json = serializeProject(project)
      const savedName = await saveProject(json, true)
      setLastManualSaveTime()
      dispatch({ type: 'MARK_SAVED', fileName: savedName ?? undefined })
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

  const handleImportImage = () => {
    closeMenu()
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/gif,image/webp'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        dispatch({ type: 'SET_REFERENCE_IMAGE', dataUrl })
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const handleClearReference = () => {
    closeMenu()
    dispatch({ type: 'SET_REFERENCE_IMAGE', dataUrl: null })
  }

  const importTxtFile = (callback: (text: string, fileName: string) => void) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,text/plain'
    input.multiple = true
    input.onchange = async () => {
      const files = input.files
      if (!files) return
      for (const file of Array.from(files)) {
        const text = await file.text()
        const name = file.name.replace(/\.txt$/, '')
        callback(text, name)
      }
    }
    input.click()
  }

  const txtToFrameData = (text: string, width: number, height: number): string[][] => {
    const lines = text.split('\n')
    const data: string[][] = []
    for (let r = 0; r < height; r++) {
      const row: string[] = []
      const line = lines[r] ?? ''
      const chars = Array.from(line)
      for (let c = 0; c < width; c++) {
        row.push(chars[c] ?? ' ')
      }
      data.push(row)
    }
    return data
  }

  const handleImportTxtAsProject = () => {
    closeMenu()
    importTxtFile((text, fileName) => {
      const lines = text.split('\n')
      const width = Math.max(...lines.map(l => Array.from(l).length), 1)
      const height = Math.max(lines.length, 1)
      clearFileHandle()
      dispatch({ type: 'NEW_PROJECT', width, height })
      dispatch({ type: 'RENAME_FRAME', index: 0, name: fileName })
      const data = txtToFrameData(text, width, height)
      const cells: { row: number; col: number; char: string }[] = []
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          if (data[r][c] !== ' ') {
            cells.push({ row: r, col: c, char: data[r][c] })
          }
        }
      }
      if (cells.length > 0) {
        dispatch({ type: 'SET_CELLS', cells })
        dispatch({ type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
      }
      dispatch({ type: 'MARK_SAVED', fileName })
    })
  }

  const handleImportTxtAsFrames = () => {
    closeMenu()
    importTxtFile((text, fileName) => {
      const { width, height } = project.canvas
      const data = txtToFrameData(text, width, height)
      dispatch({ type: 'IMPORT_FRAME', name: fileName, data })
      dispatch({ type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
    })
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
      <span className="app-title">
        Pixcii
        <span className="app-filename"> - {fileName ?? 'untitled'}{isDirty ? ' ●' : ''}</span>
      </span>

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
            <div className="dropdown-separator" />
            <button className="dropdown-item" onClick={handleImportTxtAsProject}>Import .txt as New Project</button>
            <button className="dropdown-item" onClick={handleImportTxtAsFrames}>Import .txt as Frame(s)</button>
            <button className="dropdown-item" onClick={handleImportImage}>Import Image as Reference</button>
            {state.referenceImage && (
              <button className="dropdown-item" onClick={handleClearReference}>Clear Reference Image</button>
            )}
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
