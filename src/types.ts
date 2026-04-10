export type Tool = 'pencil' | 'eraser' | 'select' | 'fill' | 'text' | 'shape'
export type ShapeType = 'line' | 'rectangle' | 'circle' | 'triangle'

export interface Frame {
  name: string
  data: string[][]
}

export interface Project {
  version: number
  canvas: { width: number; height: number }
  fps: number
  frames: Frame[]
  meta: { created: string; modified: string }
}

export interface Selection {
  startRow: number; startCol: number; endRow: number; endCol: number
}

export interface Clipboard {
  data: string[][]; width: number; height: number
}

export interface HistoryEntry {
  cells: { row: number; col: number; prev: string; next: string }[]
}

export interface ProjectState {
  project: Project
  activeFrameIndex: number
  activeTool: Tool
  activeChar: string
  activeShapeType: ShapeType
  shapeFilled: boolean
  brushSize: 1 | 2 | 3
  gridVisible: boolean
  guidesVisible: boolean
  zoom: number
  panX: number
  panY: number
  selection: Selection | null
  clipboard: Clipboard | null
  isPlaying: boolean
  onionSkinEnabled: boolean
  undoStacks: HistoryEntry[][]
  redoStacks: HistoryEntry[][]
  charactersInDocument: string[]
  cursorRow: number
  cursorCol: number
}

export function isInSelection(row: number, col: number, selection: Selection | null): boolean {
  if (!selection) return true  // no selection = everything is valid
  const minR = Math.min(selection.startRow, selection.endRow)
  const maxR = Math.max(selection.startRow, selection.endRow)
  const minC = Math.min(selection.startCol, selection.endCol)
  const maxC = Math.max(selection.startCol, selection.endCol)
  return row >= minR && row <= maxR && col >= minC && col <= maxC
}

export function createEmptyFrame(width: number, height: number, name: string): Frame {
  const data: string[][] = []
  for (let r = 0; r < height; r++) {
    data.push(new Array(width).fill(' '))
  }
  return { name, data }
}

export function createDefaultProject(): Project {
  return {
    version: 1,
    canvas: { width: 40, height: 20 },
    fps: 4,
    frames: [createEmptyFrame(40, 20, 'Frame 1')],
    meta: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    },
  }
}
