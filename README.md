# Retro 15‑Puzzle — Chrome New Tab Extension

A polished, retro‑styled 15‑Puzzle that replaces the New Tab page. Smooth GPU‑friendly animations, mouse and keyboard controls, solvable scrambles, difficulty presets, and session‑only best tracking.

## Features
- New Tab override (Manifest V3), works offline.
- Guaranteed‑solvable scrambles via legal random moves from the goal state.
- Controls: mouse (click adjacent tile) and keyboard (Arrows / WASD / HJKL).
- Difficulty presets: Almost solved, Easy, Medium, Hard, Expert, Diabolical.
- Move counter, timer (starts on first move), session “Best” (no persistence).
- Responsive layout and fast transform‑based animations.

## Game Rules
- Board: 4×4 grid with tiles 1–15 and one blank space.
- Goal: arrange tiles in order 1 → 15 with the blank at the bottom‑right.
- Legal move: slide a tile that is directly adjacent to the blank (up/down/left/right). No diagonal moves.
- Each slide counts as one move. Timer starts on your first user move.
- You win when the board matches the goal configuration; a banner and confetti appear.
- “Best” shows your best moves and time for the current session only.

## Installation (Load Unpacked)
1) Open your Chromium‑based browser:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
2) Enable “Developer mode”.
3) Click “Load unpacked” and select this repository folder.
4) Open a new tab to play.

Uninstall any time from the extensions page. No special permissions are requested beyond New Tab override.

## Controls
- Mouse: click an adjacent tile to slide it into the blank.
- Keyboard: Arrow keys, WASD, or HJKL.
- Shortcuts: `N` = New game, `R` = Reset to solved.
- Preset: choose a difficulty from the dropdown, then click “New game”.

## Development
- File structure:
  - `manifest.json`, `index.html`
  - `css/styles.css`
  - `js/util.js`, `js/confetti.js`, `js/game.js`, `js/controls.js`, `js/main.js`
- Quick preview: open `index.html` directly in a browser (note: full behavior is best tested as an extension on the New Tab page).
- Optional formatting (if you have the tools installed):
  - `npx prettier --write .`
  - `npx eslint js --fix`
- Package (optional): `zip -r dist/retro-15puzzle.zip . -x 'dist/*' '.*'`

## Troubleshooting
- Not appearing on New Tab: ensure the extension is enabled and loaded unpacked; try closing and opening a new tab.
- Arrows scroll the page: click the board once to focus, then use keys. The page also tries to capture arrows globally.
- Icons: none are included by default. You can add icons under `assets/icons/` and extend `manifest.json` with an `icons` field if desired.
- Performance: animations use transforms; if you see jank, close other heavy tabs or disable animations in OS settings.

## Privacy & Security
- No network requests, tracking, or data storage. Everything runs locally and offline.
