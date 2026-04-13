# Character Picker Expansion — Design

**Date:** 2026-04-13
**Status:** Approved, ready for implementation plan

## Overview

Expand Pixcii's character picker in `RightPanel` from a flat 45-character list to a grouped, scannable palette of ~172 characters across 7 sections, including kana for Matrix-style and Japanese-aesthetic ASCII art. Switch the canvas and picker font to **Noto Sans Mono CJK JP** so kana renders cleanly in Pixcii's fixed grid.

## Motivation

Pixcii is for hand-drawing and animating ASCII art from scratch. The current `COMMON_CHARS` flat list (`src/components/RightPanel.tsx:23-26`) covers blocks and box-drawing well but offers no kana — limiting the aesthetic range available for art. Half-width katakana and hiragana unlock a large additional design space (Matrix-style rain, soft organic textures, traditional Japanese-influenced art) without any change to Pixcii's interaction model.

## Components

### 1. Character set definition (new file)

**File:** `src/components/characterSets.ts`

Single source of truth for picker contents. Exports an ordered array:

```ts
export type CharacterGroup = { title: string; chars: string[] }
export const CHARACTER_GROUPS: CharacterGroup[] = [ ... ]
```

Group order and contents:

1. **Blocks & Shading** (~12) — `█ ▀ ▄ ▌ ▐ ░ ▒ ▓ ▖ ▗ ▘ ▝`
2. **Box Drawing** (~22) — current set: `┌ ┐ └ ┘ │ ─ ├ ┤ ┬ ┴ ┼ ╔ ╗ ╚ ╝ ║ ═ ╠ ╣ ╦ ╩ ╬`
3. **Geometric** (~14) — `■ □ ▪ ▫ ▲ ▼ ◆ ◇ ○ ● ◯ ◉ ★ ☆`
4. **Punctuation** (~20) — `. , : ; ' " · • … ! ? * + - = / \ | < > ~`
5. **Arrows** (~8) — `← → ↑ ↓ ↖ ↗ ↘ ↙`
6. **Half-width Katakana** (~50) — `ｦ ｧ ｨ ｩ ｪ ｫ ｬ ｭ ｮ ｯ ｰ ｱ ｲ ｳ ｴ ｵ ｶ ｷ ｸ ｹ ｺ ｻ ｼ ｽ ｾ ｿ ﾀ ﾁ ﾂ ﾃ ﾄ ﾅ ﾆ ﾇ ﾈ ﾉ ﾊ ﾋ ﾌ ﾍ ﾎ ﾏ ﾐ ﾑ ﾒ ﾓ ﾔ ﾕ ﾖ ﾗ ﾘ ﾙ ﾚ ﾛ ﾜ ﾝ`
7. **Hiragana** (~46) — `あ い う え お か き く け こ さ し す せ そ た ち つ て と な に ぬ ね の は ひ ふ へ ほ ま み む め も や ゆ よ ら り る れ ろ わ を ん`

Total: ~172 characters.

### 2. Picker rendering

**File:** `src/components/RightPanel.tsx`

Replace the single static `COMMON_CHARS` rendering (lines 23-26 and 213-225) with a loop over `CHARACTER_GROUPS`. Each group renders as:

- A `rp-subsection-title` heading (matching the existing "Characters in Document" subheading style)
- A `rp-char-grid` with `rp-char-btn` buttons for each char

The dynamic "Characters in Document" section remains at the top of the static groups, unchanged. Static groups follow in the order above.

### 3. Font integration

**Files:**
- `public/fonts/NotoSansMonoCJKjp-Regular.woff2` (new asset, ~5MB)
- `src/index.css` — add `@font-face` declaration with `font-display: swap`; update root font stack to `'Noto Sans Mono CJK JP', monospace`
- `src/canvas/renderer.ts` — update both `ctx.font` lines (currently lines 97 and 116) from `'... monospace, sans-serif'` to `"... 'Noto Sans Mono CJK JP', monospace"`

Font is self-hosted (no Google Fonts CDN) for offline reliability and to avoid third-party request on a creative tool that should work locally.

### 4. Image-to-ASCII deferral

Add `// TODO:` comments at:

- `src/utils/imageToAscii.ts` — note that the ramp character pool should later be expanded for richer image conversion
- `src/state/projectReducer.ts:123` (the `asciiConvertRamp: ' ░▒▓█'` default) — note that this default is intentionally left simple for now and should later draw from the broader character library

## Data flow

Unchanged. Picker buttons continue to call `selectChar(ch)` → `dispatch({ type: 'SET_CHAR', char: ch })`. No new state, actions, types, or reducers. The canvas renderer already handles arbitrary Unicode characters per cell.

## Visual layout (Characters section, top to bottom)

```
Characters
[type-input]
─ Characters in Document ─
[dynamic grid]
─ Blocks & Shading ─
[grid]
─ Box Drawing ─
[grid]
─ Geometric ─
[grid]
─ Punctuation ─
[grid]
─ Arrows ─
[grid]
─ Half-width Katakana ─
[grid]
─ Hiragana ─
[grid]
```

The right panel is already scrollable; the additional vertical content is fine.

## Error handling / edge cases

- **Font load failure** — falls back to `monospace`. Kana renders in the system font; layout may shift but the app remains functional. Acceptable degradation.
- **Existing projects with characters not in the new picker** — render fine. The canvas renders any character regardless of picker contents.
- **"Characters in Document" section** — continues to work; reflects whatever the user has actually drawn.
- **Slow first load (~5MB font)** — mitigated by `font-display: swap` (UI is usable immediately with fallback) and browser caching (only on first visit).

## Out of scope

- Image-to-ASCII ramp expansion (TODO note added; future work)
- Categorized image-to-ASCII ramps
- User-customizable picker (favorites, hide categories, reordering)
- Recently-used character tracking
- Font weight or font selection options
- Font subsetting

## Testing (manual)

- Picker displays 7 static groups, each with correct heading and characters.
- Clicking any character (latin, kana, box-drawing, block) sets it as active and lets the user draw with it.
- Canvas renders half-width katakana, hiragana, box-drawing, and latin characters at uniform cell width with no horizontal overflow or overlap.
- Existing projects load and render correctly.
- Image-to-ASCII conversion (existing feature) continues to work with the default `' ░▒▓█'` ramp.
- Font loads from `/fonts/` and is applied to both DOM (picker) and canvas.
