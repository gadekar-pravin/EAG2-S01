# Repository Guidelines

## Project Structure & Module Organization
- Root: `manifest.json` (MV3), `index.html`.
- Styles: `css/styles.css`.
- Scripts (ES modules) in `js/`:
  - `util.js` (helpers, constants), `confetti.js` (canvas effect), `game.js` (engine + render), `controls.js` (input wiring), `main.js` (boot).
- Assets: `assets/icons/` (optional; remove `icons` from manifest if not used).

## Build, Test, and Development Commands
- Run (load unpacked): Chrome → `chrome://extensions` → enable Developer mode → Load unpacked → select repo folder. Opens on New Tab.
- Quick preview (HTML/CSS only): open `index.html` in a browser; some behaviors require extension context.
- Package: `zip -r dist/retro-15puzzle.zip . -x 'dist/*' '.*'`.
- Optional lint/format (if configured): `npx eslint js --fix` and `npx prettier --write .`.

## Coding Style & Naming Conventions
- JavaScript: ES modules, `"use strict"`, 2‑space indent, semicolons, double quotes, `const/let` over `var`.
- Filenames: lowercase, words separated by `-` or kept as single words (e.g., `game.js`, `confetti.js`).
- Functions: small, pure where possible; keep DOM work in `game.js` and `controls.js`.
- CSS: BEM‑ish, dashed class names; prefer transforms for animation.

## Testing Guidelines
- Manual QA (every PR):
  - Scramble presets, keyboard (Arrows/WASD/HJKL), click‑to‑move, move counter, timer start/stop, win state (banner + confetti), responsive layout.
- Optional unit tests (logic): add `js/__tests__/*.test.js` using Vitest/Jest; aim ≥80% for `util.js` and non‑DOM logic in `game.js`.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (e.g., `feat(game): add win banner`, `fix(controls): prevent scroll`).
- PRs: clear description, linked issue, screenshots/GIF for UI changes, test notes (browsers tested), and no unrelated refactors.

## Security & Configuration Tips
- MV3: no remote code; keep everything local. `chrome_url_overrides.newtab` is required. Avoid adding network calls or storage unless justified.
- Icons optional—if missing, remove `icons` from `manifest.json`.

## Agent‑Specific Instructions
- Keep changes minimal and modular; do not introduce build tooling or dependencies without discussion.
- Preserve file names and structure; avoid renames. Add tests next to code under `js/` if introduced.
