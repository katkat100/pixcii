// Module-level file handle for Ctrl+S re-save
let currentFileHandle: FileSystemFileHandle | null = null

export function hasFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window
}

export function getCurrentFileName(): string | null {
  return currentFileHandle?.name?.replace(/\.pixcii$/, '') ?? null
}

export function clearFileHandle(): void {
  currentFileHandle = null
}

// ---------------------------------------------------------------------------
// Open
// ---------------------------------------------------------------------------

export async function openProject(): Promise<{ json: string; fileName: string } | null> {
  if (hasFileSystemAccess()) {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'Pixcii Project',
            accept: { 'application/json': ['.pixcii'] },
          },
        ],
        multiple: false,
      })
      currentFileHandle = handle
      const file = await handle.getFile()
      const json = await file.text()
      const fileName = handle.name?.replace(/\.pixcii$/, '') ?? 'untitled'
      return { json, fileName }
    } catch (err: any) {
      // User cancelled
      if (err?.name === 'AbortError') return null
      throw err
    }
  }

  // Fallback: hidden file input
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pixcii,application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      const json = await file.text()
      const fileName = file.name.replace(/\.pixcii$/, '')
      resolve({ json, fileName })
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}

// ---------------------------------------------------------------------------
// Save -- returns the filename used
// ---------------------------------------------------------------------------

export async function saveProject(json: string, saveAs = false): Promise<string | null> {
  if (hasFileSystemAccess()) {
    try {
      if (!currentFileHandle || saveAs) {
        currentFileHandle = await (window as any).showSaveFilePicker({
          suggestedName: 'project.pixcii',
          types: [
            {
              description: 'Pixcii Project',
              accept: { 'application/json': ['.pixcii'] },
            },
          ],
        })
      }
      const writable = await currentFileHandle!.createWritable()
      await writable.write(json)
      await writable.close()
      return currentFileHandle!.name?.replace(/\.pixcii$/, '') ?? null
    } catch (err: any) {
      if (err?.name === 'AbortError') return null
      throw err
    }
  }

  // Fallback: trigger download
  downloadText('project.pixcii', json)
  return 'project'
}

// ---------------------------------------------------------------------------
// Export text
// ---------------------------------------------------------------------------

export async function exportTextFile(filename: string, content: string): Promise<void> {
  if (hasFileSystemAccess()) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'Text File',
            accept: { 'text/plain': ['.txt'] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(content)
      await writable.close()
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      throw err
    }
    return
  }

  // Fallback: download
  downloadText(filename, content)
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
