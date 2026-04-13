import type { Project } from '../types'

const AUTOSAVE_KEY = 'pixcii_autosave'
const AUTOSAVE_TIME_KEY = 'pixcii_autosave_time'
const LAST_SAVE_TIME_KEY = 'pixcii_last_save_time'

export function saveToLocalStorage(project: Project): void {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(project))
    localStorage.setItem(AUTOSAVE_TIME_KEY, String(Date.now()))
  } catch {
    // localStorage full or unavailable -- silently fail
  }
}

export function clearAutosave(): void {
  try {
    localStorage.removeItem(AUTOSAVE_KEY)
    localStorage.removeItem(AUTOSAVE_TIME_KEY)
  } catch {
    // ignore
  }
}

export function setLastManualSaveTime(): void {
  try {
    localStorage.setItem(LAST_SAVE_TIME_KEY, String(Date.now()))
  } catch {
    // ignore
  }
}

export interface RecoveryInfo {
  project: Project
  autosaveTime: number
  lastManualSaveTime: number | null
}

export function checkForRecovery(): RecoveryInfo | null {
  try {
    const json = localStorage.getItem(AUTOSAVE_KEY)
    const timeStr = localStorage.getItem(AUTOSAVE_TIME_KEY)
    if (!json || !timeStr) return null

    const autosaveTime = parseInt(timeStr, 10)
    if (isNaN(autosaveTime)) return null

    const lastSaveStr = localStorage.getItem(LAST_SAVE_TIME_KEY)
    const lastManualSaveTime = lastSaveStr ? parseInt(lastSaveStr, 10) : null

    // Only offer recovery if autosave is more recent than last manual save
    if (lastManualSaveTime && autosaveTime <= lastManualSaveTime) return null

    const project = JSON.parse(json) as Project
    if (!project.version || !project.frames) return null

    return { project, autosaveTime, lastManualSaveTime }
  } catch {
    return null
  }
}

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
