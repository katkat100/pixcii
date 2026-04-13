import {
  ProjectState,
  Project,
  Frame,
  Tool,
  ShapeType,
  Selection,
  Clipboard,
  HistoryEntry,
  createEmptyFrame,
  createDefaultProject,
} from '../types'

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export type ProjectAction =
  | { type: 'SET_CELL'; row: number; col: number; char: string }
  | { type: 'SET_CELLS'; cells: { row: number; col: number; char: string }[] }
  | { type: 'SET_TOOL'; tool: Tool }
  | { type: 'SET_CHAR'; char: string }
  | { type: 'SET_SHAPE_TYPE'; shapeType: ShapeType }
  | { type: 'SET_SHAPE_FILLED'; filled: boolean }
  | { type: 'SET_BRUSH_SIZE'; size: 1 | 2 | 3 }
  | { type: 'TOGGLE_GRID' }
  | { type: 'TOGGLE_GUIDES' }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_PAN'; panX: number; panY: number }
  | { type: 'SET_SELECTION'; selection: Selection | null }
  | { type: 'SET_CLIPBOARD'; clipboard: Clipboard | null }
  | { type: 'SET_CURSOR'; row: number; col: number }
  | { type: 'ADD_FRAME' }
  | { type: 'DELETE_FRAME'; index: number }
  | { type: 'SELECT_FRAME'; index: number }
  | { type: 'RENAME_FRAME'; index: number; name: string }
  | { type: 'DUPLICATE_FRAME'; index: number }
  | { type: 'MOVE_FRAME'; from: number; to: number }
  | { type: 'SET_FPS'; fps: number }
  | { type: 'TOGGLE_PLAYING' }
  | { type: 'TOGGLE_ONION_SKIN' }
  | { type: 'PUSH_UNDO'; entry: HistoryEntry }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD_PROJECT'; project: Project }
  | { type: 'NEW_PROJECT'; width: number; height: number }
  | { type: 'UPDATE_CHARACTERS_IN_DOCUMENT' }
  | { type: 'MARK_SAVED'; fileName?: string }
  | { type: 'SET_FILE_NAME'; fileName: string }
  | { type: 'SET_REFERENCE_IMAGE'; dataUrl: string | null }
  | { type: 'TOGGLE_REFERENCE_IMAGE' }
  | { type: 'SET_REFERENCE_OPACITY'; opacity: number }
  | { type: 'SET_ASCII_RAMP'; ramp: string }
  | { type: 'IMPORT_FRAME'; name: string; data: string[][] }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_UNDO = 50

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function deepCopyFrame(frame: Frame): Frame {
  return {
    name: frame.name,
    data: frame.data.map(row => [...row]),
  }
}

function buildEmptyStacks(count: number): HistoryEntry[][] {
  return Array.from({ length: count }, () => [])
}

function scanCharacters(frames: Frame[]): string[] {
  const chars = new Set<string>()
  for (const frame of frames) {
    for (const row of frame.data) {
      for (const cell of row) {
        if (cell !== ' ') chars.add(cell)
      }
    }
  }
  return Array.from(chars).sort()
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export function createInitialState(): ProjectState {
  const project = createDefaultProject()
  return {
    project,
    activeFrameIndex: 0,
    activeTool: 'pencil',
    activeChar: '#',
    activeShapeType: 'rectangle',
    shapeFilled: false,
    brushSize: 1,
    gridVisible: true,
    guidesVisible: false,
    zoom: 100,
    panX: 0,
    panY: 0,
    selection: null,
    clipboard: null,
    isPlaying: false,
    onionSkinEnabled: false,
    undoStacks: buildEmptyStacks(project.frames.length),
    redoStacks: buildEmptyStacks(project.frames.length),
    charactersInDocument: [],
    cursorRow: 0,
    cursorCol: 0,
    isDirty: false,
    lastSaveTime: null,
    fileName: null,
    referenceImage: null,
    referenceImageVisible: false,
    referenceImageOpacity: 30,
    asciiConvertRamp: ' ░▒▓█',
  }
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const DIRTY_ACTIONS = new Set([
  'SET_CELL', 'SET_CELLS', 'ADD_FRAME', 'DELETE_FRAME',
  'DUPLICATE_FRAME', 'MOVE_FRAME', 'RENAME_FRAME', 'UNDO', 'REDO', 'IMPORT_FRAME',
])

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  const result = projectReducerInner(state, action)
  if (result !== state && DIRTY_ACTIONS.has(action.type)) {
    return { ...result, isDirty: true }
  }
  return result
}

function projectReducerInner(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {

    case 'SET_CELL': {
      const { row, col, char } = action
      const { width, height } = state.project.canvas
      if (row < 0 || row >= height || col < 0 || col >= width) return state

      const frames = state.project.frames.map((f, i) => {
        if (i !== state.activeFrameIndex) return f
        const data = f.data.map(r => [...r])
        data[row][col] = char
        return { ...f, data }
      })
      return {
        ...state,
        project: { ...state.project, frames },
      }
    }

    case 'SET_CELLS': {
      const { width, height } = state.project.canvas
      const validCells = action.cells.filter(
        ({ row, col }) => row >= 0 && row < height && col >= 0 && col < width
      )
      if (validCells.length === 0) return state

      const frames = state.project.frames.map((f, i) => {
        if (i !== state.activeFrameIndex) return f
        const data = f.data.map(r => [...r])
        for (const { row, col, char } of validCells) {
          data[row][col] = char
        }
        return { ...f, data }
      })
      return {
        ...state,
        project: { ...state.project, frames },
      }
    }

    case 'SET_TOOL':
      return { ...state, activeTool: action.tool }

    case 'SET_CHAR':
      return { ...state, activeChar: action.char }

    case 'SET_SHAPE_TYPE':
      return { ...state, activeShapeType: action.shapeType }

    case 'SET_SHAPE_FILLED':
      return { ...state, shapeFilled: action.filled }

    case 'SET_BRUSH_SIZE':
      return { ...state, brushSize: action.size }

    case 'TOGGLE_GRID':
      return { ...state, gridVisible: !state.gridVisible }

    case 'TOGGLE_GUIDES':
      return { ...state, guidesVisible: !state.guidesVisible }

    case 'SET_ZOOM':
      return { ...state, zoom: clamp(action.zoom, 50, 400) }

    case 'SET_PAN':
      return { ...state, panX: action.panX, panY: action.panY }

    case 'SET_SELECTION':
      return { ...state, selection: action.selection }

    case 'SET_CLIPBOARD':
      return { ...state, clipboard: action.clipboard }

    case 'SET_CURSOR':
      return { ...state, cursorRow: action.row, cursorCol: action.col }

    case 'ADD_FRAME': {
      const { width, height } = state.project.canvas
      const insertAt = state.activeFrameIndex + 1
      const newFrame = createEmptyFrame(width, height, `Frame ${state.project.frames.length + 1}`)
      const frames = [
        ...state.project.frames.slice(0, insertAt),
        newFrame,
        ...state.project.frames.slice(insertAt),
      ]
      const undoStacks = [
        ...state.undoStacks.slice(0, insertAt),
        [],
        ...state.undoStacks.slice(insertAt),
      ]
      const redoStacks = [
        ...state.redoStacks.slice(0, insertAt),
        [],
        ...state.redoStacks.slice(insertAt),
      ]
      return {
        ...state,
        project: { ...state.project, frames },
        activeFrameIndex: insertAt,
        undoStacks,
        redoStacks,
      }
    }

    case 'DELETE_FRAME': {
      const { index } = action
      if (state.project.frames.length <= 1) return state
      if (index < 0 || index >= state.project.frames.length) return state

      const frames = state.project.frames.filter((_, i) => i !== index)
      const undoStacks = state.undoStacks.filter((_, i) => i !== index)
      const redoStacks = state.redoStacks.filter((_, i) => i !== index)

      let activeFrameIndex = state.activeFrameIndex
      if (activeFrameIndex >= frames.length) {
        activeFrameIndex = frames.length - 1
      } else if (activeFrameIndex > index) {
        activeFrameIndex -= 1
      }

      return {
        ...state,
        project: { ...state.project, frames },
        activeFrameIndex,
        undoStacks,
        redoStacks,
      }
    }

    case 'SELECT_FRAME': {
      const { index } = action
      if (index < 0 || index >= state.project.frames.length) return state
      return { ...state, activeFrameIndex: index }
    }

    case 'RENAME_FRAME': {
      const { index, name } = action
      if (index < 0 || index >= state.project.frames.length) return state
      const frames = state.project.frames.map((f, i) =>
        i === index ? { ...f, name } : f
      )
      return { ...state, project: { ...state.project, frames } }
    }

    case 'DUPLICATE_FRAME': {
      const { index } = action
      if (index < 0 || index >= state.project.frames.length) return state

      const source = state.project.frames[index]
      const copy = deepCopyFrame(source)
      copy.name = `${source.name} Copy`

      const insertAt = index + 1
      const frames = [
        ...state.project.frames.slice(0, insertAt),
        copy,
        ...state.project.frames.slice(insertAt),
      ]
      const undoStacks = [
        ...state.undoStacks.slice(0, insertAt),
        [],
        ...state.undoStacks.slice(insertAt),
      ]
      const redoStacks = [
        ...state.redoStacks.slice(0, insertAt),
        [],
        ...state.redoStacks.slice(insertAt),
      ]
      return {
        ...state,
        project: { ...state.project, frames },
        activeFrameIndex: insertAt,
        undoStacks,
        redoStacks,
      }
    }

    case 'MOVE_FRAME': {
      const { from, to } = action
      const len = state.project.frames.length
      if (from < 0 || from >= len || to < 0 || to >= len || from === to) return state

      const frames = [...state.project.frames]
      const undoStacks = [...state.undoStacks]
      const redoStacks = [...state.redoStacks]

      const [movedFrame] = frames.splice(from, 1)
      frames.splice(to, 0, movedFrame)
      const [movedUndo] = undoStacks.splice(from, 1)
      undoStacks.splice(to, 0, movedUndo)
      const [movedRedo] = redoStacks.splice(from, 1)
      redoStacks.splice(to, 0, movedRedo)

      let activeFrameIndex = state.activeFrameIndex
      if (activeFrameIndex === from) {
        activeFrameIndex = to
      } else if (from < activeFrameIndex && to >= activeFrameIndex) {
        activeFrameIndex -= 1
      } else if (from > activeFrameIndex && to <= activeFrameIndex) {
        activeFrameIndex += 1
      }

      return {
        ...state,
        project: { ...state.project, frames },
        activeFrameIndex,
        undoStacks,
        redoStacks,
      }
    }

    case 'SET_FPS':
      return {
        ...state,
        project: { ...state.project, fps: clamp(action.fps, 1, 30) },
      }

    case 'TOGGLE_PLAYING':
      return { ...state, isPlaying: !state.isPlaying }

    case 'TOGGLE_ONION_SKIN':
      return { ...state, onionSkinEnabled: !state.onionSkinEnabled }

    case 'PUSH_UNDO': {
      const idx = state.activeFrameIndex
      const currentStack = state.undoStacks[idx] ?? []
      const trimmed = currentStack.length >= MAX_UNDO
        ? currentStack.slice(currentStack.length - MAX_UNDO + 1)
        : currentStack
      const undoStacks = state.undoStacks.map((s, i) =>
        i === idx ? [...trimmed, action.entry] : s
      )
      const redoStacks = state.redoStacks.map((s, i) =>
        i === idx ? [] : s
      )
      return { ...state, undoStacks, redoStacks }
    }

    case 'UNDO': {
      const idx = state.activeFrameIndex
      const undoStack = state.undoStacks[idx] ?? []
      if (undoStack.length === 0) return state

      const entry = undoStack[undoStack.length - 1]
      const newUndoStack = undoStack.slice(0, -1)

      // Apply previous (prev) values to the frame
      const frames = state.project.frames.map((f, i) => {
        if (i !== idx) return f
        const data = f.data.map(r => [...r])
        for (const { row, col, prev } of entry.cells) {
          data[row][col] = prev
        }
        return { ...f, data }
      })

      const undoStacks = state.undoStacks.map((s, i) =>
        i === idx ? newUndoStack : s
      )
      const redoStacks = state.redoStacks.map((s, i) =>
        i === idx ? [...s, entry] : s
      )

      return {
        ...state,
        project: { ...state.project, frames },
        undoStacks,
        redoStacks,
      }
    }

    case 'REDO': {
      const idx = state.activeFrameIndex
      const redoStack = state.redoStacks[idx] ?? []
      if (redoStack.length === 0) return state

      const entry = redoStack[redoStack.length - 1]
      const newRedoStack = redoStack.slice(0, -1)

      // Apply next values to the frame
      const frames = state.project.frames.map((f, i) => {
        if (i !== idx) return f
        const data = f.data.map(r => [...r])
        for (const { row, col, next } of entry.cells) {
          data[row][col] = next
        }
        return { ...f, data }
      })

      const undoStacks = state.undoStacks.map((s, i) =>
        i === idx ? [...s, entry] : s
      )
      const redoStacks = state.redoStacks.map((s, i) =>
        i === idx ? newRedoStack : s
      )

      return {
        ...state,
        project: { ...state.project, frames },
        undoStacks,
        redoStacks,
      }
    }

    case 'LOAD_PROJECT': {
      const { project } = action
      return {
        ...createInitialState(),
        project,
        undoStacks: buildEmptyStacks(project.frames.length),
        redoStacks: buildEmptyStacks(project.frames.length),
        activeFrameIndex: 0,
      }
    }

    case 'NEW_PROJECT': {
      const { width, height } = action
      const project: Project = {
        version: 1,
        canvas: { width, height },
        fps: 4,
        frames: [createEmptyFrame(width, height, 'Frame 1')],
        meta: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
      }
      return {
        ...createInitialState(),
        project,
        undoStacks: [[]],
        redoStacks: [[]],
      }
    }

    case 'UPDATE_CHARACTERS_IN_DOCUMENT':
      return {
        ...state,
        charactersInDocument: scanCharacters(state.project.frames),
      }

    case 'MARK_SAVED':
      return {
        ...state,
        isDirty: false,
        lastSaveTime: Date.now(),
        fileName: action.fileName ?? state.fileName,
      }

    case 'SET_FILE_NAME':
      return { ...state, fileName: action.fileName }

    case 'SET_REFERENCE_IMAGE':
      return {
        ...state,
        referenceImage: action.dataUrl,
        referenceImageVisible: action.dataUrl !== null,
      }

    case 'TOGGLE_REFERENCE_IMAGE':
      return { ...state, referenceImageVisible: !state.referenceImageVisible }

    case 'SET_REFERENCE_OPACITY':
      return { ...state, referenceImageOpacity: Math.max(0, Math.min(100, action.opacity)) }

    case 'SET_ASCII_RAMP':
      return { ...state, asciiConvertRamp: action.ramp }

    case 'IMPORT_FRAME': {
      const newFrame: Frame = { name: action.name, data: action.data }
      const insertIndex = state.activeFrameIndex + 1
      const newFrames = [
        ...state.project.frames.slice(0, insertIndex),
        newFrame,
        ...state.project.frames.slice(insertIndex),
      ]
      return {
        ...state,
        project: { ...state.project, frames: newFrames },
        activeFrameIndex: insertIndex,
        undoStacks: [...state.undoStacks.slice(0, insertIndex), [], ...state.undoStacks.slice(insertIndex)],
        redoStacks: [...state.redoStacks.slice(0, insertIndex), [], ...state.redoStacks.slice(insertIndex)],
      }
    }

    default:
      return state
  }
}
