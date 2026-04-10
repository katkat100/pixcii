import { describe, it, expect } from 'vitest'
import { frameToText, allFramesToTexts } from '../src/file/exportTxt'
import { Frame } from '../src/types'

describe('frameToText', () => {
  it('joins each row chars and rows with newlines', () => {
    const frame: Frame = {
      name: 'Test',
      data: [
        ['a', 'b', 'c'],
        ['d', 'e', 'f'],
        ['g', 'h', 'i'],
      ],
    }
    expect(frameToText(frame)).toBe('abc\ndef\nghi')
  })

  it('handles spaces correctly', () => {
    const frame: Frame = {
      name: 'Spaces',
      data: [
        [' ', '#', ' '],
        ['#', ' ', '#'],
      ],
    }
    expect(frameToText(frame)).toBe(' # \n# #')
  })

  it('handles single-row frame', () => {
    const frame: Frame = {
      name: 'One',
      data: [['X', 'Y', 'Z']],
    }
    expect(frameToText(frame)).toBe('XYZ')
  })
})

describe('allFramesToTexts', () => {
  it('generates correct filenames with zero-padded index', () => {
    const frames: Frame[] = [
      { name: 'Frame 1', data: [['a']] },
      { name: 'Frame 2', data: [['b']] },
    ]
    const results = allFramesToTexts(frames)
    expect(results[0].name).toBe('Frame_1-01.txt')
    expect(results[1].name).toBe('Frame_2-02.txt')
  })

  it('sanitizes frame names by removing non-alphanumeric except _ and -', () => {
    const frames: Frame[] = [
      { name: 'My Frame! #1', data: [['x']] },
    ]
    const results = allFramesToTexts(frames)
    // 'My Frame! #1' -> spaces, '!', '#' all become '_'
    expect(results[0].name).toBe('My_Frame___1-01.txt')
  })

  it('preserves underscores and hyphens in frame names', () => {
    const frames: Frame[] = [
      { name: 'my-frame_name', data: [['x']] },
    ]
    const results = allFramesToTexts(frames)
    expect(results[0].name).toBe('my-frame_name-01.txt')
  })

  it('content matches frameToText output', () => {
    const frames: Frame[] = [
      { name: 'F1', data: [['a', 'b'], ['c', 'd']] },
    ]
    const results = allFramesToTexts(frames)
    expect(results[0].content).toBe('ab\ncd')
  })

  it('pads index to 2 digits', () => {
    const frames: Frame[] = Array.from({ length: 10 }, (_, i) => ({
      name: `F${i + 1}`,
      data: [['x']],
    }))
    const results = allFramesToTexts(frames)
    expect(results[9].name).toBe('F10-10.txt')
    expect(results[0].name).toBe('F1-01.txt')
  })
})
