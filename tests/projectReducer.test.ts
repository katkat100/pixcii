import { describe, it, expect } from 'vitest'
import { createInitialState, projectReducer } from '../src/state/projectReducer'
import { HistoryEntry } from '../src/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState() {
  return createInitialState()
}

// ---------------------------------------------------------------------------
// SET_CELL
// ---------------------------------------------------------------------------

describe('SET_CELL', () => {
  it('sets a cell in the active frame', () => {
    const state = makeState()
    const next = projectReducer(state, { type: 'SET_CELL', row: 0, col: 0, char: 'X' })
    expect(next.project.frames[0].data[0][0]).toBe('X')
  })

  it('does not mutate the original state', () => {
    const state = makeState()
    projectReducer(state, { type: 'SET_CELL', row: 0, col: 0, char: 'X' })
    expect(state.project.frames[0].data[0][0]).toBe(' ')
  })
})

// ---------------------------------------------------------------------------
// SET_CELL out-of-bounds
// ---------------------------------------------------------------------------

describe('SET_CELL out of bounds', () => {
  it('ignores negative row', () => {
    const state = makeState()
    const next = projectReducer(state, { type: 'SET_CELL', row: -1, col: 0, char: 'X' })
    expect(next).toBe(state)
  })

  it('ignores row >= height', () => {
    const state = makeState()
    const { height } = state.project.canvas
    const next = projectReducer(state, { type: 'SET_CELL', row: height, col: 0, char: 'X' })
    expect(next).toBe(state)
  })

  it('ignores negative col', () => {
    const state = makeState()
    const next = projectReducer(state, { type: 'SET_CELL', row: 0, col: -1, char: 'X' })
    expect(next).toBe(state)
  })

  it('ignores col >= width', () => {
    const state = makeState()
    const { width } = state.project.canvas
    const next = projectReducer(state, { type: 'SET_CELL', row: 0, col: width, char: 'X' })
    expect(next).toBe(state)
  })
})

// ---------------------------------------------------------------------------
// SET_CELLS
// ---------------------------------------------------------------------------

describe('SET_CELLS', () => {
  it('sets multiple cells at once', () => {
    const state = makeState()
    const next = projectReducer(state, {
      type: 'SET_CELLS',
      cells: [
        { row: 0, col: 0, char: 'A' },
        { row: 1, col: 2, char: 'B' },
      ],
    })
    expect(next.project.frames[0].data[0][0]).toBe('A')
    expect(next.project.frames[0].data[1][2]).toBe('B')
  })

  it('silently ignores out-of-bounds cells', () => {
    const state = makeState()
    const next = projectReducer(state, {
      type: 'SET_CELLS',
      cells: [
        { row: 0, col: 0, char: 'A' },
        { row: -1, col: 0, char: 'Z' },
      ],
    })
    expect(next.project.frames[0].data[0][0]).toBe('A')
  })
})

// ---------------------------------------------------------------------------
// SET_TOOL
// ---------------------------------------------------------------------------

describe('SET_TOOL', () => {
  it('changes the active tool', () => {
    const state = makeState()
    const next = projectReducer(state, { type: 'SET_TOOL', tool: 'eraser' })
    expect(next.activeTool).toBe('eraser')
  })
})

// ---------------------------------------------------------------------------
// ADD_FRAME
// ---------------------------------------------------------------------------

describe('ADD_FRAME', () => {
  it('inserts a blank frame after the current one', () => {
    const state = makeState()
    expect(state.project.frames).toHaveLength(1)
    const next = projectReducer(state, { type: 'ADD_FRAME' })
    expect(next.project.frames).toHaveLength(2)
    expect(next.activeFrameIndex).toBe(1)
  })

  it('new frame data is all spaces', () => {
    const state = makeState()
    const next = projectReducer(state, { type: 'ADD_FRAME' })
    const frame = next.project.frames[1]
    const allSpaces = frame.data.every(row => row.every(c => c === ' '))
    expect(allSpaces).toBe(true)
  })

  it('adds corresponding undo/redo stacks', () => {
    const state = makeState()
    const next = projectReducer(state, { type: 'ADD_FRAME' })
    expect(next.undoStacks).toHaveLength(2)
    expect(next.redoStacks).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// DELETE_FRAME
// ---------------------------------------------------------------------------

describe('DELETE_FRAME', () => {
  it('removes a frame by index', () => {
    let state = makeState()
    state = projectReducer(state, { type: 'ADD_FRAME' })
    expect(state.project.frames).toHaveLength(2)
    const next = projectReducer(state, { type: 'DELETE_FRAME', index: 1 })
    expect(next.project.frames).toHaveLength(1)
  })

  it('adjusts activeFrameIndex when deleting active frame at end', () => {
    let state = makeState()
    state = projectReducer(state, { type: 'ADD_FRAME' })
    // activeFrameIndex is now 1
    const next = projectReducer(state, { type: 'DELETE_FRAME', index: 1 })
    expect(next.activeFrameIndex).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Don't delete last frame
// ---------------------------------------------------------------------------

describe('DELETE_FRAME last frame', () => {
  it('does not delete when only one frame exists', () => {
    const state = makeState()
    expect(state.project.frames).toHaveLength(1)
    const next = projectReducer(state, { type: 'DELETE_FRAME', index: 0 })
    expect(next).toBe(state)
  })
})

// ---------------------------------------------------------------------------
// DUPLICATE_FRAME
// ---------------------------------------------------------------------------

describe('DUPLICATE_FRAME', () => {
  it('inserts a deep copy after the source frame', () => {
    // draw something on frame 0 first
    let state = makeState()
    state = projectReducer(state, { type: 'SET_CELL', row: 0, col: 0, char: 'Q' })
    const next = projectReducer(state, { type: 'DUPLICATE_FRAME', index: 0 })
    expect(next.project.frames).toHaveLength(2)
    expect(next.project.frames[1].data[0][0]).toBe('Q')
    expect(next.activeFrameIndex).toBe(1)
  })

  it('duplicate is a deep copy (mutations are independent)', () => {
    let state = makeState()
    state = projectReducer(state, { type: 'SET_CELL', row: 0, col: 0, char: 'Q' })
    state = projectReducer(state, { type: 'DUPLICATE_FRAME', index: 0 })
    // modify the duplicate
    const next = projectReducer(state, { type: 'SET_CELL', row: 0, col: 0, char: 'Z' })
    // original frame 0 should still have 'Q'
    expect(next.project.frames[0].data[0][0]).toBe('Q')
  })
})

// ---------------------------------------------------------------------------
// UNDO / REDO
// ---------------------------------------------------------------------------

describe('UNDO/REDO', () => {
  function makeHistoryEntry(row: number, col: number, prev: string, next: string): HistoryEntry {
    return { cells: [{ row, col, prev, next }] }
  }

  it('undo restores previous cell value', () => {
    let state = makeState()
    // manually place a character and push an undo entry
    state = projectReducer(state, { type: 'SET_CELL', row: 0, col: 0, char: 'X' })
    state = projectReducer(state, {
      type: 'PUSH_UNDO',
      entry: makeHistoryEntry(0, 0, ' ', 'X'),
    })
    const afterUndo = projectReducer(state, { type: 'UNDO' })
    expect(afterUndo.project.frames[0].data[0][0]).toBe(' ')
    expect(afterUndo.undoStacks[0]).toHaveLength(0)
    expect(afterUndo.redoStacks[0]).toHaveLength(1)
  })

  it('redo re-applies next cell value', () => {
    let state = makeState()
    state = projectReducer(state, { type: 'SET_CELL', row: 0, col: 0, char: 'X' })
    state = projectReducer(state, {
      type: 'PUSH_UNDO',
      entry: makeHistoryEntry(0, 0, ' ', 'X'),
    })
    state = projectReducer(state, { type: 'UNDO' })
    const afterRedo = projectReducer(state, { type: 'REDO' })
    expect(afterRedo.project.frames[0].data[0][0]).toBe('X')
    expect(afterRedo.redoStacks[0]).toHaveLength(0)
    expect(afterRedo.undoStacks[0]).toHaveLength(1)
  })

  it('PUSH_UNDO clears the redo stack', () => {
    let state = makeState()
    state = projectReducer(state, { type: 'SET_CELL', row: 0, col: 0, char: 'X' })
    state = projectReducer(state, {
      type: 'PUSH_UNDO',
      entry: makeHistoryEntry(0, 0, ' ', 'X'),
    })
    state = projectReducer(state, { type: 'UNDO' })
    // now redo stack has one entry; pushing new undo should clear it
    state = projectReducer(state, {
      type: 'PUSH_UNDO',
      entry: makeHistoryEntry(0, 0, ' ', 'Y'),
    })
    expect(state.redoStacks[0]).toHaveLength(0)
  })

  it('UNDO on empty stack returns same state', () => {
    const state = makeState()
    const next = projectReducer(state, { type: 'UNDO' })
    expect(next).toBe(state)
  })

  it('REDO on empty stack returns same state', () => {
    const state = makeState()
    const next = projectReducer(state, { type: 'REDO' })
    expect(next).toBe(state)
  })
})

// ---------------------------------------------------------------------------
// Zoom clamp
// ---------------------------------------------------------------------------

describe('SET_ZOOM', () => {
  it('clamps zoom to minimum 50', () => {
    const state = makeState()
    const next = projectReducer(state, { type: 'SET_ZOOM', zoom: 10 })
    expect(next.zoom).toBe(50)
  })

  it('clamps zoom to maximum 400', () => {
    const state = makeState()
    const next = projectReducer(state, { type: 'SET_ZOOM', zoom: 9999 })
    expect(next.zoom).toBe(400)
  })

  it('allows valid zoom value', () => {
    const state = makeState()
    const next = projectReducer(state, { type: 'SET_ZOOM', zoom: 150 })
    expect(next.zoom).toBe(150)
  })
})

// ---------------------------------------------------------------------------
// FPS clamp
// ---------------------------------------------------------------------------

describe('SET_FPS', () => {
  it('clamps fps to minimum 1', () => {
    const state = makeState()
    const next = projectReducer(state, { type: 'SET_FPS', fps: 0 })
    expect(next.project.fps).toBe(1)
  })

  it('clamps fps to maximum 30', () => {
    const state = makeState()
    const next = projectReducer(state, { type: 'SET_FPS', fps: 100 })
    expect(next.project.fps).toBe(30)
  })

  it('allows valid fps value', () => {
    const state = makeState()
    const next = projectReducer(state, { type: 'SET_FPS', fps: 12 })
    expect(next.project.fps).toBe(12)
  })
})

// ---------------------------------------------------------------------------
// UPDATE_CHARACTERS_IN_DOCUMENT
// ---------------------------------------------------------------------------

describe('UPDATE_CHARACTERS_IN_DOCUMENT', () => {
  it('collects unique non-space characters across all frames', () => {
    let state = makeState()
    state = projectReducer(state, { type: 'SET_CELL', row: 0, col: 0, char: 'A' })
    state = projectReducer(state, { type: 'SET_CELL', row: 0, col: 1, char: 'B' })
    state = projectReducer(state, { type: 'SET_CELL', row: 0, col: 2, char: 'A' }) // duplicate
    const next = projectReducer(state, { type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
    expect(next.charactersInDocument).toContain('A')
    expect(next.charactersInDocument).toContain('B')
    expect(next.charactersInDocument).toHaveLength(2)
  })

  it('does not include spaces', () => {
    const state = makeState()
    const next = projectReducer(state, { type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
    expect(next.charactersInDocument).not.toContain(' ')
    expect(next.charactersInDocument).toHaveLength(0)
  })

  it('collects characters from all frames', () => {
    let state = makeState()
    state = projectReducer(state, { type: 'SET_CELL', row: 0, col: 0, char: 'X' })
    state = projectReducer(state, { type: 'ADD_FRAME' })
    state = projectReducer(state, { type: 'SET_CELL', row: 0, col: 0, char: 'Y' })
    const next = projectReducer(state, { type: 'UPDATE_CHARACTERS_IN_DOCUMENT' })
    expect(next.charactersInDocument).toContain('X')
    expect(next.charactersInDocument).toContain('Y')
  })
})
