# Pixcii

A browser-based ASCII art editor with animation support.

## Features

- **Drawing Tools**: Pencil, eraser, flood fill, shapes (line, rectangle, circle, triangle), and text input
- **Animation**: Multiple frames, adjustable FPS, playback preview, and onion skinning
- **Selection**: Rectangular selection with copy, cut, paste, delete, and drag-to-move
- **Character Picker**: Grouped character sets including box drawing, Japanese kana, and common symbols
- **Reference Images**: Import images as tracing overlays with adjustable opacity
- **File Operations**: Save/open `.pixcii` projects, export to plain text, autosave with recovery
- **Canvas Controls**: Zoom, pan, toggleable grid and guides

## Keyboard Shortcuts

### Tools
| Key | Tool |
|-----|------|
| P | Pencil |
| E | Eraser |
| S | Select |
| F | Fill |
| T | Text |
| H | Shape |

### Actions
| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+S | Save |
| Ctrl+Shift+S | Save As |
| Ctrl+O | Open |
| Ctrl+C | Copy |
| Ctrl+X | Cut |
| Ctrl+V | Paste |
| Delete | Delete selection |
| Escape | Clear selection |
| G | Toggle grid |
| Space | Play/pause animation |
| N | New frame |
| , | Previous frame |
| . | Next frame |

### Shape Tool
Hold **Shift** while drawing to constrain:
- Lines snap to 0°, 45°, or 90° angles
- Rectangles, circles, and triangles become square-proportioned

### Navigation
- **Scroll wheel**: Zoom in/out (toward cursor)
- **Middle-click drag** or **Right-click drag**: Pan canvas

## Getting Started

### Prerequisites
- Node.js 18+

### Development
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
npm run preview
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Project Structure

```
src/
├── components/       # React components (Canvas, Toolbar, MenuBar, etc.)
├── canvas/
│   ├── tools/        # Tool implementations (pencil, eraser, fill, etc.)
│   ├── renderer.ts   # Canvas rendering logic
│   └── gridUtils.ts  # Coordinate conversion utilities
├── state/            # React context and reducer for project state
├── file/             # File I/O, autosave, and export
├── utils/            # Algorithms (Bresenham, flood fill, shapes)
└── types.ts          # TypeScript type definitions
```

## File Format

Projects are saved as `.pixcii` JSON files:

```json
{
  "version": 1,
  "canvas": { "width": 40, "height": 20 },
  "fps": 4,
  "frames": [
    { "name": "Frame 1", "data": [["@", " ", ...], ...] }
  ],
  "meta": {
    "created": "2024-01-01T00:00:00.000Z",
    "modified": "2024-01-01T00:00:00.000Z"
  }
}
```

## License

MIT
