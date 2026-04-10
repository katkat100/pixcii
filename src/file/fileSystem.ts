// Module-level file handle for Ctrl+S re-save
let currentFileHandle: FileSystemFileHandle | null = null

export function hasFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window
}

// ---------------------------------------------------------------------------
// Open
// ---------------------------------------------------------------------------

export async function openProject(): Promise<string | null> {
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
      return await file.text()
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
      const text = await file.text()
      resolve(text)
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

export async function saveProject(json: string, saveAs = false): Promise<void> {
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
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      throw err
    }
    return
  }

  // Fallback: trigger download
  downloadText('project.pixcii', json)
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
