import { Frame } from '../types'

export function frameToText(frame: Frame): string {
  return frame.data.map(row => row.join('')).join('\n')
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_')
}

export function allFramesToTexts(frames: Frame[]): { name: string; content: string }[] {
  return frames.map((frame, index) => {
    const sanitized = sanitizeName(frame.name)
    const num = String(index + 1).padStart(2, '0')
    return {
      name: `${sanitized}-${num}.txt`,
      content: frameToText(frame),
    }
  })
}
