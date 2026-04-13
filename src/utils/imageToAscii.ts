import { CELL_WIDTH, CELL_HEIGHT } from '../canvas/gridUtils'

/**
 * Convert an image to ASCII art by mapping brightness to characters.
 *
 * @param dataUrl - data URL of the source image
 * @param gridWidth - number of columns in the ASCII grid
 * @param gridHeight - number of rows in the ASCII grid
 * @param ramp - character ramp from lightest to darkest (e.g., " ░▒▓█")
 * @returns Promise of a 2D array of characters [row][col]
 *
 * TODO: expand the default ramp character pool with the broader picker character library
 *       (kana, geometric, punctuation) for richer brightness mapping. See spec
 *       docs/superpowers/specs/2026-04-13-character-picker-expansion-design.md (Out of scope).
 */
export function imageToAscii(
  dataUrl: string,
  gridWidth: number,
  gridHeight: number,
  ramp: string,
): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // Work in pixel space that matches the visual proportions of the grid.
      // Each cell is CELL_WIDTH x CELL_HEIGHT pixels, so the visual canvas is:
      const pixelW = gridWidth * CELL_WIDTH
      const pixelH = gridHeight * CELL_HEIGHT

      const canvas = document.createElement('canvas')
      canvas.width = pixelW
      canvas.height = pixelH
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Could not get 2d context')); return }

      // Fill with white (will map to lightest/space char)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, pixelW, pixelH)

      // Scale to fit while maintaining aspect ratio, then center
      const scale = Math.min(pixelW / img.naturalWidth, pixelH / img.naturalHeight)
      const drawW = img.naturalWidth * scale
      const drawH = img.naturalHeight * scale
      const drawX = (pixelW - drawW) / 2
      const drawY = (pixelH - drawH) / 2

      ctx.drawImage(img, drawX, drawY, drawW, drawH)
      const imageData = ctx.getImageData(0, 0, pixelW, pixelH)
      const pixels = imageData.data

      const chars = Array.from(ramp)
      if (chars.length === 0) { reject(new Error('Empty character ramp')); return }

      // Sample each cell by averaging the brightness of all pixels in that cell
      const result: string[][] = []
      for (let r = 0; r < gridHeight; r++) {
        const row: string[] = []
        for (let c = 0; c < gridWidth; c++) {
          // Pixel region for this cell
          const px0 = c * CELL_WIDTH
          const py0 = r * CELL_HEIGHT
          const px1 = px0 + CELL_WIDTH
          const py1 = py0 + CELL_HEIGHT

          let totalBrightness = 0
          let count = 0
          for (let py = py0; py < py1; py++) {
            for (let px = px0; px < px1; px++) {
              const i = (py * pixelW + px) * 4
              const red = pixels[i]
              const green = pixels[i + 1]
              const blue = pixels[i + 2]
              const alpha = pixels[i + 3]
              const brightness = alpha === 0
                ? 255
                : 0.299 * red + 0.587 * green + 0.114 * blue
              totalBrightness += brightness
              count++
            }
          }

          const avgBrightness = totalBrightness / count
          const normalized = 1 - avgBrightness / 255  // 0 = white, 1 = black
          const idx = Math.min(
            Math.floor(normalized * chars.length),
            chars.length - 1,
          )
          row.push(chars[idx])
        }
        result.push(row)
      }

      resolve(result)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}
