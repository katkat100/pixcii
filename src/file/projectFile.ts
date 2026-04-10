import { Project } from '../types'

export function serializeProject(project: Project): string {
  const updated: Project = {
    ...project,
    meta: {
      ...project.meta,
      modified: new Date().toISOString(),
    },
  }
  return JSON.stringify(updated, null, 2)
}

export function deserializeProject(json: string): Project {
  const data = JSON.parse(json) as Project
  if (data.version !== 1) {
    throw new Error(`Unsupported project version: ${data.version}`)
  }
  return data
}
