import { describe, it, expect } from 'vitest'
import { serializeProject, deserializeProject } from '../src/file/projectFile'
import { createDefaultProject } from '../src/types'

describe('serializeProject / deserializeProject', () => {
  it('round-trips a project without data loss', () => {
    const original = createDefaultProject()
    const json = serializeProject(original)
    const restored = deserializeProject(json)

    expect(restored.version).toBe(original.version)
    expect(restored.canvas).toEqual(original.canvas)
    expect(restored.fps).toBe(original.fps)
    expect(restored.frames).toEqual(original.frames)
    expect(restored.meta.created).toBe(original.meta.created)
  })

  it('updates the modified timestamp on serialize', () => {
    const original = createDefaultProject()
    // Set modified to something old
    original.meta.modified = '2020-01-01T00:00:00.000Z'
    const json = serializeProject(original)
    const restored = deserializeProject(json)
    expect(restored.meta.modified).not.toBe('2020-01-01T00:00:00.000Z')
  })

  it('produces valid JSON with 2-space indent', () => {
    const project = createDefaultProject()
    const json = serializeProject(project)
    // Should be valid JSON
    expect(() => JSON.parse(json)).not.toThrow()
    // Should use 2-space indentation
    expect(json).toContain('  "version"')
  })

  it('throws when version !== 1', () => {
    const project = createDefaultProject()
    const json = serializeProject(project)
    const withBadVersion = json.replace('"version": 1', '"version": 99')
    expect(() => deserializeProject(withBadVersion)).toThrow('Unsupported project version: 99')
  })

  it('throws on completely invalid version field', () => {
    const badJson = JSON.stringify({ version: 2, canvas: { width: 10, height: 10 }, fps: 4, frames: [], meta: {} })
    expect(() => deserializeProject(badJson)).toThrow()
  })
})
