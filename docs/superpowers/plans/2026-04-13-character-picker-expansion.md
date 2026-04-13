# Character Picker Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Pixcii's character picker from a flat 45-char list to a grouped ~172-char palette including kana, and switch the canvas font to Noto Sans Mono CJK JP so kana renders cleanly in the fixed grid.

**Architecture:** Add a self-hosted Noto Sans Mono CJK JP font asset, scope it via CSS to the canvas + character-picker UI (not chrome). Extract picker contents into `src/components/characterSets.ts` as an ordered array of named groups. Refactor the Characters section in `RightPanel.tsx` to loop over those groups. Add TODO comments to defer image-to-ASCII ramp expansion.

**Tech Stack:** React 18 + TypeScript + Vite. No tests in repo today — verification is manual per spec. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-04-13-character-picker-expansion-design.md`

---

## File Structure

**Created:**
- `public/fonts/NotoSansMonoCJKjp-Regular.otf` — font asset (~9MB)
- `src/components/characterSets.ts` — picker character group definitions

**Modified:**
- `src/App.css` — add `@font-face` and a `.mono-cjk` utility class
- `src/canvas/renderer.ts` — switch `ctx.font` to use Noto Sans Mono CJK JP
- `src/components/RightPanel.tsx` — replace flat `COMMON_CHARS` with grouped rendering; apply `mono-cjk` class to char buttons + char input
- `src/utils/imageToAscii.ts` — add TODO comment
- `src/state/projectReducer.ts` — add TODO comment near `asciiConvertRamp` default

---

## Task 1: Add Noto Sans Mono CJK JP font asset

**Files:**
- Create: `public/fonts/NotoSansMonoCJKjp-Regular.otf`

- [ ] **Step 1: Create fonts directory**

```bash
mkdir -p public/fonts
```

- [ ] **Step 2: Download the font from the official Noto CJK release**

```bash
curl -L -o public/fonts/NotoSansMonoCJKjp-Regular.otf \
  https://github.com/notofonts/noto-cjk/raw/main/Sans/OTF/Japanese/NotoSansMonoCJKjp-Regular.otf
```

Expected: `public/fonts/NotoSansMonoCJKjp-Regular.otf` exists, file size ~9MB.

- [ ] **Step 3: Verify file**

```bash
ls -lh public/fonts/NotoSansMonoCJKjp-Regular.otf
file public/fonts/NotoSansMonoCJKjp-Regular.otf
```

Expected: file exists, size between 5MB and 15MB, `file` reports OpenType font.

- [ ] **Step 4: Commit**

```bash
git add public/fonts/NotoSansMonoCJKjp-Regular.otf
git commit -m "chore: add Noto Sans Mono CJK JP font asset"
```

---

## Task 2: Register font in CSS and add utility class

**Files:**
- Modify: `src/App.css`

- [ ] **Step 1: Add `@font-face` declaration and `.mono-cjk` utility class**

Add at the very top of `src/App.css` (above the `:root` block):

```css
@font-face {
  font-family: 'Noto Sans Mono CJK JP';
  src: url('/fonts/NotoSansMonoCJKjp-Regular.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

.mono-cjk {
  font-family: 'Noto Sans Mono CJK JP', monospace;
}
```

- [ ] **Step 2: Verify in browser**

Run: `npm run dev`

Open the app, open DevTools → Network tab → reload. Confirm `NotoSansMonoCJKjp-Regular.otf` is requested and returns 200.

In DevTools console:

```js
document.fonts.check('16px "Noto Sans Mono CJK JP"')
```

Expected: returns `true` after load.

- [ ] **Step 3: Commit**

```bash
git add src/App.css
git commit -m "feat: register Noto Sans Mono CJK JP font with mono-cjk utility class"
```

---

## Task 3: Apply font to canvas renderer

**Files:**
- Modify: `src/canvas/renderer.ts:97,116`

- [ ] **Step 1: Read current renderer to confirm line numbers**

Read `src/canvas/renderer.ts`. Locate both `ctx.font = ` lines (currently around lines 97 and 116). They look like:

```ts
ctx.font = `${cellH * 0.85}px monospace, sans-serif`
```

- [ ] **Step 2: Update both `ctx.font` lines**

Change both occurrences to:

```ts
ctx.font = `${cellH * 0.85}px "Noto Sans Mono CJK JP", monospace`
```

Use Edit with `replace_all: true` since the two lines are identical.

- [ ] **Step 3: Manually verify in browser**

Run: `npm run dev`

In the running app, open the char input in the right panel and type `ｱ` (half-width katakana A — copy from this plan). Click on the canvas to place it. Verify:
- The character renders inside its cell with no horizontal overflow into neighboring cells.
- The character is visually crisp (Noto Sans Mono CJK JP, not the system fallback).

- [ ] **Step 4: Commit**

```bash
git add src/canvas/renderer.ts
git commit -m "feat: render canvas with Noto Sans Mono CJK JP for clean kana display"
```

---

## Task 4: Create character set definitions

**Files:**
- Create: `src/components/characterSets.ts`

- [ ] **Step 1: Create the file with grouped character definitions**

Create `src/components/characterSets.ts` with this exact content:

```ts
export type CharacterGroup = {
  title: string
  chars: string[]
}

export const CHARACTER_GROUPS: CharacterGroup[] = [
  {
    title: 'Blocks & Shading',
    chars: ['█','▀','▄','▌','▐','░','▒','▓','▖','▗','▘','▝'],
  },
  {
    title: 'Box Drawing',
    chars: [
      '┌','┐','└','┘','│','─','├','┤','┬','┴','┼',
      '╔','╗','╚','╝','║','═','╠','╣','╦','╩','╬',
    ],
  },
  {
    title: 'Geometric',
    chars: ['■','□','▪','▫','▲','▼','◆','◇','○','●','◯','◉','★','☆'],
  },
  {
    title: 'Punctuation',
    chars: ['.',',',':',';','\'','"','·','•','…','!','?','*','+','-','=','/','\\','|','<','>','~'],
  },
  {
    title: 'Arrows',
    chars: ['←','→','↑','↓','↖','↗','↘','↙'],
  },
  {
    title: 'Half-width Katakana',
    chars: [
      'ｦ','ｧ','ｨ','ｩ','ｪ','ｫ','ｬ','ｭ','ｮ','ｯ','ｰ',
      'ｱ','ｲ','ｳ','ｴ','ｵ','ｶ','ｷ','ｸ','ｹ','ｺ',
      'ｻ','ｼ','ｽ','ｾ','ｿ','ﾀ','ﾁ','ﾂ','ﾃ','ﾄ',
      'ﾅ','ﾆ','ﾇ','ﾈ','ﾉ','ﾊ','ﾋ','ﾌ','ﾍ','ﾎ',
      'ﾏ','ﾐ','ﾑ','ﾒ','ﾓ','ﾔ','ﾕ','ﾖ','ﾗ','ﾘ',
      'ﾙ','ﾚ','ﾛ','ﾜ','ﾝ',
    ],
  },
  {
    title: 'Hiragana',
    chars: [
      'あ','い','う','え','お','か','き','く','け','こ',
      'さ','し','す','せ','そ','た','ち','つ','て','と',
      'な','に','ぬ','ね','の','は','ひ','ふ','へ','ほ',
      'ま','み','む','め','も','や','ゆ','よ',
      'ら','り','る','れ','ろ','わ','を','ん',
    ],
  },
]
```

- [ ] **Step 2: TypeScript compile check**

Run: `npx tsc -b --noEmit`

Expected: no errors related to `characterSets.ts`. (Pre-existing errors elsewhere are not our concern; the file we just added must compile cleanly.)

- [ ] **Step 3: Commit**

```bash
git add src/components/characterSets.ts
git commit -m "feat: add grouped character set definitions for picker"
```

---

## Task 5: Refactor RightPanel to render grouped picker

**Files:**
- Modify: `src/components/RightPanel.tsx`

- [ ] **Step 1: Replace the flat `COMMON_CHARS` import block**

In `src/components/RightPanel.tsx`, find and DELETE this block (currently lines 23-26):

```ts
const COMMON_CHARS = [
  '█','▄','▀','▌','▐','░','▒','▓','■','□','▪','▫','▬','▲','▼','◄','►','◆','○','●','◘','◙',
  '╔','╗','╚','╝','║','═','╠','╣','╦','╩','╬','┌','┐','└','┘','│','─','├','┤','┬','┴','┼',
]
```

Add this import near the other imports at the top of the file:

```ts
import { CHARACTER_GROUPS } from './characterSets'
```

- [ ] **Step 2: Replace the static "Common Characters" section in the render output**

Find the JSX block that starts with `<div className="rp-subsection-title">Common Characters</div>` (currently around line 213) and ends with the closing `</div>` of its `rp-char-grid` (currently around line 225). It looks like:

```tsx
<div className="rp-subsection-title">Common Characters</div>
<div className="rp-char-grid">
  {COMMON_CHARS.map(ch => (
    <button
      key={ch}
      className={`rp-char-btn${activeChar === ch ? ' active' : ''}`}
      title={`Use "${ch}"`}
      onClick={() => selectChar(ch)}
    >
      {ch}
    </button>
  ))}
</div>
```

Replace it with:

```tsx
{CHARACTER_GROUPS.map(group => (
  <div key={group.title}>
    <div className="rp-subsection-title">{group.title}</div>
    <div className="rp-char-grid">
      {group.chars.map(ch => (
        <button
          key={ch}
          className={`rp-char-btn mono-cjk${activeChar === ch ? ' active' : ''}`}
          title={`Use "${ch}"`}
          onClick={() => selectChar(ch)}
        >
          {ch}
        </button>
      ))}
    </div>
  </div>
))}
```

Note the addition of `mono-cjk` to the button className so kana renders consistently in the picker too.

- [ ] **Step 3: Apply `mono-cjk` to the dynamic "Characters in Document" buttons**

In the same file, find the block that renders `charactersInDocument.map(ch => ...)` (currently around lines 200-209). Update its button className from:

```tsx
className={`rp-char-btn${activeChar === ch ? ' active' : ''}`}
```

to:

```tsx
className={`rp-char-btn mono-cjk${activeChar === ch ? ' active' : ''}`}
```

- [ ] **Step 4: Apply `mono-cjk` to the char input fields**

In the same file, find the two `<input className="rp-char-input ...">` elements (one for the type input, one for `rp-ramp-input`). Update both to include `mono-cjk`:

The type input (currently around line 177):

```tsx
className="rp-char-input mono-cjk"
```

The ramp input (currently around line 130):

```tsx
className="rp-char-input rp-ramp-input mono-cjk"
```

- [ ] **Step 5: TypeScript compile check**

Run: `npx tsc -b --noEmit`

Expected: no errors related to `RightPanel.tsx`.

- [ ] **Step 6: Manual verification in browser**

Run: `npm run dev`

In the right panel "Characters" section, verify:
- 7 subheadings appear in order: Blocks & Shading, Box Drawing, Geometric, Punctuation, Arrows, Half-width Katakana, Hiragana.
- Each section shows its character buttons in a grid.
- Clicking any character (including a hiragana like `あ` and a half-width katakana like `ｱ`) sets it as active (visible highlight) and lets you draw with it on the canvas.
- All picker buttons render their characters at uniform width with no overflow.

- [ ] **Step 7: Commit**

```bash
git add src/components/RightPanel.tsx
git commit -m "feat: render character picker as grouped sections with kana support"
```

---

## Task 6: Add TODO comments deferring image-to-ASCII ramp expansion

**Files:**
- Modify: `src/utils/imageToAscii.ts`
- Modify: `src/state/projectReducer.ts:123`

- [ ] **Step 1: Add TODO to `imageToAscii.ts`**

In `src/utils/imageToAscii.ts`, find the JSDoc comment above `export function imageToAscii(` (currently around lines 3-11). Insert this line at the bottom of the JSDoc, just before the closing `*/`:

```ts
 * TODO: expand the default ramp character pool with the broader picker character library
 *       (kana, geometric, punctuation) for richer brightness mapping. See spec
 *       docs/superpowers/specs/2026-04-13-character-picker-expansion-design.md (Out of scope).
```

- [ ] **Step 2: Add TODO to `projectReducer.ts`**

In `src/state/projectReducer.ts`, find the line containing `asciiConvertRamp: ' ░▒▓█',` (currently line 123). Insert a comment on the line immediately above it:

```ts
    // TODO: expand default ramp using the broader picker character library
    //       (see docs/superpowers/specs/2026-04-13-character-picker-expansion-design.md).
    asciiConvertRamp: ' ░▒▓█',
```

- [ ] **Step 3: TypeScript compile check**

Run: `npx tsc -b --noEmit`

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/utils/imageToAscii.ts src/state/projectReducer.ts
git commit -m "docs: add TODOs deferring image-to-ASCII ramp expansion"
```

---

## Task 7: End-to-end manual verification

**Files:** none modified

- [ ] **Step 1: Start dev server and exercise full feature**

Run: `npm run dev`

Run through this checklist in the browser:

1. **Font loads:** DevTools Network tab shows `NotoSansMonoCJKjp-Regular.otf` loads with status 200.
2. **Picker shows 7 groups:** Blocks & Shading, Box Drawing, Geometric, Punctuation, Arrows, Half-width Katakana, Hiragana — in that order, each with its heading.
3. **Click-to-select works:** Click `█` (block), `┼` (box), `★` (geometric), `…` (punctuation), `→` (arrow), `ｱ` (half-width katakana), `あ` (hiragana). Each becomes the active character and can be drawn with the pencil tool.
4. **Canvas renders kana cleanly:** Draw a row alternating `ｱ`, `あ`, `█`, `A`. All four characters occupy exactly one cell width with no horizontal overflow or overlap.
5. **"Characters in Document" updates:** After drawing the row above, the dynamic section near the top of the Characters panel includes those 4 characters and renders them in the same monospace style.
6. **Existing project loads correctly:** Refresh the page (autosave should restore your work). The drawn characters render the same as before refresh.
7. **Image-to-ASCII still works:** Upload a reference image, set ramp to default ` ░▒▓█`, click "Convert to ASCII". Conversion completes and produces output (unchanged behavior).
8. **TypeScript build passes:** Run `npm run build` → completes with no errors.
9. **Lint passes:** Run `npm run lint` → no new errors introduced by these changes.

- [ ] **Step 2: If any step fails, file fix as a follow-up**

If any verification step above fails, do not mark this task complete. Fix the issue (return to the relevant earlier task) and re-run the full checklist.

- [ ] **Step 3: Commit (only if any fixup commits were needed during verification)**

If no fixes were needed, skip this step. Otherwise:

```bash
git add -A
git commit -m "fix: address issues found during character picker verification"
```

---

## Done

After all tasks complete, the character picker offers a curated, grouped palette of ~172 characters (including kana) and the canvas renders them all at uniform cell width using Noto Sans Mono CJK JP. Image-to-ASCII expansion is documented as deferred follow-up work.
