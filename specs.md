Below is a complete, production‑ready Chrome extension that replaces the New Tab page with a polished, retro 15‑Puzzle. I’ve kept the code modular, fast, and easy to read, with smooth animations and both mouse + keyboard controls.

⸻

🔎 High‑level design (what matters & why)

File organization
	•	manifest.json – MV3 config; overrides New Tab.
	•	index.html – full‑page UI and layout skeleton.
	•	css/styles.css – retro UI, responsive layout, animations.
	•	js/util.js – helpers (format time, RNG).
	•	js/confetti.js – lightweight canvas confetti on win.
	•	js/game.js – puzzle state, rules, scramble, win check.
	•	js/controls.js – mouse/keyboard bindings, UI wiring.
	•	js/main.js – bootstraps everything.

Retro visual approach
	•	Bold, pixel‑inspired typography + scanline overlay for CRT feel.
	•	Chunky, bevelled “plastic” tiles with subtle grain + shadow.
	•	Neon accent colors and glow for feedback and win states.
	•	CSS‑only pixel border + soft vignette for depth.
	•	Responsive board (aspect-ratio: 1 / 1; tiles move via transform).

Puzzle generation & validation
	•	Guaranteed‑solvable scrambles by performing N random legal moves from the solved state (no parity pitfalls).
	•	Difficulty presets = different scramble depths (e.g., 10/30/60/120/200 moves) + “Almost solved”.
	•	Win detection is O(n), compare against goal [1…15,0].

Animation strategy
	•	GPU‑friendly transform: translate(...) with easing; no layouts on move.
	•	Board‑level .no-animate class disables transitions during scrambles (instant; zero jank).
	•	Completion: board glow + confetti burst (canvas) + subtle tile “pop”.

Controls
	•	Mouse: click an adjacent tile to slide.
	•	Keyboard: Arrow keys, WASD, or HJKL. Prevent default scrolling on arrows.
	•	Input is locked only during multi‑step scrambles to avoid race conditions.

Scoring
	•	Live Move counter + Timer (starts on first user move).
	•	Best (session) for fewest moves and fastest time; no persistence (resets on page reload), per requirements.
	•	“New best!” flash on improve.

⸻

📁 File structure

retro-15puzzle/
  manifest.json
  index.html
  css/
    styles.css
  js/
    main.js
    util.js
    confetti.js
    game.js
    controls.js
  assets/
    icons/
      icon-16.png        (optional)
      icon-48.png        (optional)
      icon-128.png       (optional)

Icons are optional for local development. If you don’t add them, simply remove the icons field from manifest.json.

⸻

1) manifest.json

{
  "manifest_version": 3,
  "name": "Retro 15‑Puzzle (New Tab)",
  "version": "1.0.0",
  "description": "Classic 15‑Puzzle with smooth animations and retro vibes. Replaces the New Tab page.",
  "chrome_url_overrides": {
    "newtab": "index.html"
  },
  "icons": {
    "16": "assets/icons/icon-16.png",
    "48": "assets/icons/icon-48.png",
    "128": "assets/icons/icon-128.png"
  },
  "offline_enabled": true
}


⸻

2) index.html

<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Retro 15‑Puzzle</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <div class="page">
    <header class="topbar">
      <h1 class="brand" aria-label="Retro 15 Puzzle">15‑PUZZLE</h1>
      <div class="stats">
        <div class="stat"><span class="label">Moves</span><span id="moves">0</span></div>
        <div class="stat"><span class="label">Time</span><span id="time">00:00</span></div>
        <div class="stat best" title="Session best">
          <span class="label">Best</span>
          <span id="best">—</span>
        </div>
      </div>
    </header>

    <main class="content">
      <section class="controls" aria-label="Game controls">
        <label class="select">
          <span>Preset</span>
          <select id="preset">
            <option value="almost">Almost solved (1)</option>
            <option value="easy" selected>Easy (10)</option>
            <option value="medium">Medium (30)</option>
            <option value="hard">Hard (60)</option>
            <option value="expert">Expert (120)</option>
            <option value="diabolical">Diabolical (200)</option>
          </select>
        </label>
        <button id="newGame" class="btn primary" aria-label="Start new game">New game</button>
        <button id="reset" class="btn" aria-label="Reset to solved">Reset</button>
      </section>

      <section class="board-wrap">
        <div id="board" class="board" role="application" aria-label="15 puzzle board" aria-live="polite"></div>
        <canvas id="confetti" class="confetti" aria-hidden="true"></canvas>
        <div id="winBanner" class="win-banner" hidden>
          <div class="win-card">
            <div class="win-title">Solved!</div>
            <div class="win-sub" id="winStats"></div>
            <button id="playAgain" class="btn primary">Play again</button>
          </div>
        </div>
        <div class="scanlines" aria-hidden="true"></div>
      </section>

      <p class="hint">
        Click tiles or use <strong>Arrow keys</strong> / <strong>WASD</strong> / <strong>HJKL</strong>.
      </p>
    </main>

    <footer class="foot">
      <small>Session only · No data is stored.</small>
    </footer>
  </div>

  <script type="module" src="js/main.js"></script>
</body>
</html>


⸻

3) css/styles.css

/* ---------- Reset & base ---------- */
* { box-sizing: border-box; }
html, body { height: 100%; }
body {
  margin: 0;
  color: #e9e9f0;
  background: radial-gradient(1200px 800px at 60% 10%, #1b1932, #0c0b16 70%);
  font-family: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI", Roboto, Arial, sans-serif;
  letter-spacing: 0.2px;
}

/* ---------- Layout ---------- */
.page {
  min-height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 12px;
  padding: clamp(10px, 2vmin, 24px);
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  margin: 0;
  font-weight: 900;
  letter-spacing: 3px;
  font-size: clamp(20px, 5vw, 36px);
  text-shadow: 0 2px 0 #000, 0 0 12px rgba(0,255,255,.25);
}
.stats {
  display: flex;
  gap: 18px;
  align-items: center;
}
.stat { display: grid; gap: 4px; text-align: right; }
.stat .label { font-size: 12px; opacity: .7; }
.stat.best { color: #8ef0ff; text-shadow: 0 0 8px rgba(0,240,255,0.3); }

.content {
  display: grid;
  justify-items: center;
  gap: clamp(12px, 2vmin, 18px);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: center;
}
.select {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 6px 10px;
  border-radius: 8px;
  backdrop-filter: blur(4px);
}
select {
  background: transparent;
  color: inherit;
  border: none;
  font-size: 14px;
  outline: none;
}

.btn {
  border: 1px solid rgba(255,255,255,0.15);
  background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
  color: #e9e9f0;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: transform .06s ease, box-shadow .15s ease;
  box-shadow: 0 2px 0 rgba(0,0,0,.8), 0 0 0 2px rgba(0,0,0,.2) inset;
}
.btn:hover { transform: translateY(-1px); }
.btn:active { transform: translateY(0); }
.btn.primary {
  border-color: rgba(0, 255, 255, .35);
  box-shadow: 0 2px 0 rgba(0,0,0,.8), 0 0 18px rgba(0,255,255,.18) inset;
}

/* ---------- Board ---------- */
.board-wrap {
  position: relative;
  width: min(92vmin, 600px);
  aspect-ratio: 1 / 1;
}

.board {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(0,0,0,.6), rgba(0,0,0,.3)),
    radial-gradient(120% 120% at 0% 0%, #221f3f, #131225 60%);
  border-radius: 14px;
  border: 3px solid #000;
  box-shadow:
    0 0 0 4px #090812,
    0 30px 60px rgba(0,0,0,.6),
    inset 0 0 0 2px rgba(255,255,255,.05);
  overflow: hidden;
}

/* pixel-ish outer bevel */
.board::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  box-shadow:
    inset 0 2px 0 rgba(255,255,255,.08),
    inset 0 -2px 0 rgba(0,0,0,.8),
    inset 2px 0 0 rgba(255,255,255,.04),
    inset -2px 0 0 rgba(0,0,0,.7);
  border-radius: 12px;
}

.tile {
  position: absolute;
  width: 25%;
  height: 25%;
  left: 0; top: 0;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: clamp(22px, 7vmin, 42px);
  letter-spacing: 1px;
  color: #ffe8a6;
  text-shadow: 0 2px 0 rgba(0,0,0,.9), 0 0 8px rgba(255,230,150,.25);
  user-select: none;
  cursor: pointer;
  border-radius: 12px;
  border: 2px solid rgba(0,0,0,.85);
  background:
    linear-gradient(180deg, rgba(255,255,255,.14), transparent 40%),
    linear-gradient(180deg, #3c2f7a, #2a235a 60%, #201943);
  box-shadow:
    0 8px 0 rgba(0,0,0,.7),
    0 14px 30px rgba(0,0,0,.5),
    inset 0 0 0 1px rgba(255,255,255,.05);
  transition: transform 140ms cubic-bezier(.22,.61,.36,1), box-shadow 140ms;
  will-change: transform;
}
.tile:active { box-shadow: 0 6px 0 rgba(0,0,0,.7), 0 10px 22px rgba(0,0,0,.45); }

.board.no-animate .tile { transition: none; }
.tile.flash { animation: flash 200ms ease; }
@keyframes flash {
  from { filter: brightness(1.15); } to { filter: none; }
}

/* Win state */
.board.win { box-shadow: 0 0 0 4px #0df, 0 0 60px rgba(0,255,255,.25), inset 0 0 0 2px rgba(255,255,255,.1); }
.tile.win-pop { animation: pop .3s ease; }
@keyframes pop {
  0% { transform: scale(.98) var(--last-transform); }
  100% { transform: scale(1) var(--last-transform); }
}

/* Confetti canvas covers board */
.confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Win banner */
.win-banner {
  position: absolute; inset: 0;
  display: grid; place-items: center;
  background: rgba(0,0,0,.35);
  backdrop-filter: blur(2px);
}
.win-card {
  background: rgba(18,18,32,.9);
  border: 2px solid rgba(0,255,255,.3);
  box-shadow: 0 0 24px rgba(0,255,255,.2), 0 6px 0 rgba(0,0,0,.8);
  padding: 18px 20px;
  border-radius: 12px;
  text-align: center;
}
.win-title { font-size: 28px; font-weight: 900; margin-bottom: 6px; }
.win-sub { opacity: .9; margin-bottom: 12px; }

/* Scanlines overlay for CRT vibe */
.scanlines {
  position: absolute;
  inset: 0;
  mix-blend-mode: soft-light;
  background:
    repeating-linear-gradient(
      to bottom,
      rgba(255,255,255,.07),
      rgba(255,255,255,.07) 1px,
      transparent 1px,
      transparent 3px
    );
  pointer-events: none;
  border-radius: 12px;
}

/* Hint & footer */
.hint { opacity: .8; margin: 8px 0 0; }
.foot { opacity: .6; text-align: center; }

/* Responsive tweaks */
@media (max-width: 520px) {
  .stats { gap: 12px; }
  .brand { letter-spacing: 2px; }
}


⸻

4) js/util.js

"use strict";

export const SIZE = 4;
export const GOAL = Array.from({ length: SIZE * SIZE }, (_, i) => (i + 1) % (SIZE * SIZE)); // [1..15,0]

export function idxToRC(i) { return { r: Math.floor(i / SIZE), c: i % SIZE }; }
export function rcToIdx(r, c) { return r * SIZE + c; }

export function formatTime(ms) {
  if (!ms || ms <= 0) return "00:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }


⸻

5) js/confetti.js

"use strict";

/**
 * Tiny confetti engine tailored for a single board canvas.
 * Draws lightweight rectangles with gravity & drag for ~2.2s.
 */
export function confettiBurst(canvas, strength = 1) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  const { width, height } = canvas.getBoundingClientRect();
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.scale(dpr, dpr);

  const N = Math.floor(120 * strength);
  const colors = ["#ffd166", "#06d6a0", "#118ab2", "#ef476f", "#f78c6b"];
  const parts = [];

  for (let i = 0; i < N; i++) {
    parts.push({
      x: width / 2 + (Math.random() - 0.5) * 80,
      y: height / 2,
      w: 4 + Math.random() * 4,
      h: 6 + Math.random() * 8,
      vx: (Math.random() - 0.5) * 5,
      vy: -4 - Math.random() * 3,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.2,
      col: colors[i % colors.length],
      life: 0
    });
  }

  const gravity = 0.15;
  const drag = 0.995;
  let then = performance.now();

  function step(now) {
    const dt = Math.min(32, now - then) / 16.67;
    then = now;
    ctx.clearRect(0, 0, width, height);

    let alive = 0;
    for (const p of parts) {
      p.life += dt;
      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx * dt * 3;
      p.y += p.vy * dt * 3;
      p.rot += p.vr * dt;

      if (p.y < height + 20 && p.life < 150) {
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.col;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    }

    if (alive > 0) requestAnimationFrame(step);
    else ctx.clearRect(0, 0, width, height);
  }
  requestAnimationFrame(step);
}


⸻

6) js/game.js

"use strict";

import { SIZE, GOAL, idxToRC, rcToIdx, formatTime, randChoice } from "./util.js";
import { confettiBurst } from "./confetti.js";

/**
 * Game engine + rendering. Keeps DOM & state in sync.
 */
export class Game {
  constructor({ boardEl, movesEl, timeEl, bestEl, winBannerEl, winStatsEl, confettiCanvas }) {
    this.boardEl = boardEl;
    this.movesEl = movesEl;
    this.timeEl = timeEl;
    this.bestEl = bestEl;
    this.winBannerEl = winBannerEl;
    this.winStatsEl = winStatsEl;
    this.confettiCanvas = confettiCanvas;

    // State
    this.board = [...GOAL];   // 1..15,0 (0=blank)
    this.posOf = Array(SIZE * SIZE).fill(0); // posOf[val] = idx
    for (let i = 0; i < this.board.length; i++) {
      this.posOf[this.board[i]] = i;
    }
    this.blank = this.posOf[0];

    this.moves = 0;
    this.timeStart = 0;
    this.timer = null;
    this.bestMoves = null;
    this.bestTimeMs = null;
    this.started = false;
    this.locked = false;     // blocks input while scrambling
    this.won = false;

    // Tiles (DOM elements indexed by tile value)
    this.tiles = Array(SIZE * SIZE).fill(null);

    this._buildTiles();
    this._renderAll(true);
  }

  /* ---------- Setup & rendering ---------- */

  _buildTiles() {
    this.boardEl.innerHTML = "";
    this.boardEl.classList.remove("win", "no-animate");
    for (let val = 1; val < SIZE * SIZE; val++) {
      const el = document.createElement("div");
      el.className = "tile";
      el.textContent = String(val);
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", `Tile ${val}`);
      el.dataset.val = String(val);
      this.tiles[val] = el;
      this.boardEl.appendChild(el);
    }
    // positions will be applied in _renderAll
  }

  _applyTransformFor(val, idx) {
    const { r, c } = idxToRC(idx);
    const t = `translate(${c * 100}%, ${r * 100}%)`;
    const el = this.tiles[val];
    if (!el) return;
    // keep last transform for pop animation basis
    el.style.setProperty("--last-transform", t);
    el.style.transform = t;
  }

  _renderAll(skipAnim = false) {
    if (skipAnim) this.boardEl.classList.add("no-animate");
    for (let val = 1; val < SIZE * SIZE; val++) {
      const idx = this.posOf[val];
      this._applyTransformFor(val, idx);
    }
    if (skipAnim) {
      // force next frame to apply transforms, then re-enable animations
      requestAnimationFrame(() => this.boardEl.classList.remove("no-animate"));
    }
  }

  _updateHUD() {
    this.movesEl.textContent = String(this.moves);
    const elapsed = this.started ? (performance.now() - this.timeStart) : 0;
    this.timeEl.textContent = formatTime(elapsed);
    const bestStr = (this.bestMoves == null || this.bestTimeMs == null)
      ? "—"
      : `${this.bestMoves} • ${formatTime(this.bestTimeMs)}`;
    this.bestEl.textContent = bestStr;
  }

  _tick = () => {
    if (!this.started || this.won) return;
    this.timeEl.textContent = formatTime(performance.now() - this.timeStart);
    this._timerRAF = requestAnimationFrame(this._tick);
  };

  /* ---------- Core logic ---------- */

  neighborsOfBlank() {
    const { r, c } = idxToRC(this.blank);
    const nbrs = [];
    if (r > 0) nbrs.push(rcToIdx(r - 1, c));
    if (r < SIZE - 1) nbrs.push(rcToIdx(r + 1, c));
    if (c > 0) nbrs.push(rcToIdx(r, c - 1));
    if (c < SIZE - 1) nbrs.push(rcToIdx(r, c + 1));
    return nbrs;
  }

  canMoveIndex(idx) {
    const { r: br, c: bc } = idxToRC(this.blank);
    const { r, c } = idxToRC(idx);
    return Math.abs(br - r) + Math.abs(bc - c) === 1;
  }

  moveIndex(idx, countMove = true) {
    if (this.locked || this.won) return false;
    if (!this.canMoveIndex(idx)) return false;

    // Start timer on first user move
    if (!this.started) {
      this.started = true;
      this.timeStart = performance.now();
      cancelAnimationFrame(this._timerRAF);
      this._timerRAF = requestAnimationFrame(this._tick);
    }

    // Swap tile at idx with blank
    const movingVal = this.board[idx];
    this.board[this.blank] = movingVal;
    this.board[idx] = 0;

    // Update position map
    this.posOf[movingVal] = this.blank;
    this.blank = idx;

    // Animate moving tile
    const el = this.tiles[movingVal];
    if (el) {
      el.classList.add("flash");
      this._applyTransformFor(movingVal, this.posOf[movingVal]);
      setTimeout(() => el.classList.remove("flash"), 200);
    }

    if (countMove) {
      this.moves++;
      this._updateHUD();
    }

    if (this.isSolved()) {
      this._onWin();
    }
    return true;
  }

  moveDirection(dir) {
    // dir: "up","down","left","right" (empty moves toward dir)
    const { r, c } = idxToRC(this.blank);
    let src = null;
    if (dir === "up"    && r < SIZE - 1) src = rcToIdx(r + 1, c);
    if (dir === "down"  && r > 0)        src = rcToIdx(r - 1, c);
    if (dir === "left"  && c < SIZE - 1) src = rcToIdx(r, c + 1);
    if (dir === "right" && c > 0)        src = rcToIdx(r, c - 1);
    if (src != null) this.moveIndex(src, true);
  }

  isSolved() {
    // All tiles in order, blank at end
    for (let i = 0; i < this.board.length; i++) {
      if (this.board[i] !== GOAL[i]) return false;
    }
    return true;
  }

  /* ---------- Public API ---------- */

  async scramble(preset = "medium") {
    if (this.locked) return;
    const depths = {
      almost: 1,
      easy: 10,
      medium: 30,
      hard: 60,
      expert: 120,
      diabolical: 200
    };
    const steps = depths[preset] ?? 30;

    // reset to solved then do N legal random moves (no immediate backtrack)
    this.locked = true;
    this.won = false;
    this.board = [...GOAL];
    for (let i = 0; i < this.board.length; i++) this.posOf[this.board[i]] = i;
    this.blank = this.posOf[0];
    this.moves = 0;
    this.started = false;
    cancelAnimationFrame(this._timerRAF);
    this.boardEl.classList.remove("win");
    this.winBannerEl.hidden = true;

    this._updateHUD();

    this.boardEl.classList.add("no-animate");
    let prevBlank = -1;

    for (let i = 0; i < steps; i++) {
      const nbrs = this.neighborsOfBlank().filter(n => n !== prevBlank);
      const pick = randChoice(nbrs);
      // perform move (without counting & animation flag irrelevant due to .no-animate)
      const movingVal = this.board[pick];
      this.board[this.blank] = movingVal;
      this.board[pick] = 0;
      this.posOf[movingVal] = this.blank;
      prevBlank = this.blank;
      this.blank = pick;
    }
    this._renderAll(true);
    this.locked = false;
  }

  resetToSolved() {
    if (this.locked) return;
    this.locked = true;
    this.won = false;
    this.board = [...GOAL];
    for (let i = 0; i < this.board.length; i++) this.posOf[this.board[i]] = i;
    this.blank = this.posOf[0];
    this.moves = 0;
    this.started = false;
    cancelAnimationFrame(this._timerRAF);
    this.timeEl.textContent = "00:00";
    this._renderAll(true);
    this.boardEl.classList.remove("win");
    this.winBannerEl.hidden = true;
    this._updateHUD();
    this.locked = false;
  }

  clickTile(val) {
    const idx = this.posOf[val];
    this.moveIndex(idx, true);
  }

  _onWin() {
    if (this.won) return;
    this.won = true;
    cancelAnimationFrame(this._timerRAF);

    const elapsed = performance.now() - this.timeStart;
    // Update best (session)
    let improved = false;
    if (this.bestMoves == null || this.moves < this.bestMoves) {
      this.bestMoves = this.moves; improved = true;
    }
    if (this.bestTimeMs == null || elapsed < this.bestTimeMs) {
      this.bestTimeMs = elapsed; improved = true;
    }
    this._updateHUD();

    // Visuals
    this.boardEl.classList.add("win");
    Array.from(this.boardEl.children).forEach(el => el.classList.add("win-pop"));
    setTimeout(() => Array.from(this.boardEl.children).forEach(el => el.classList.remove("win-pop")), 320);

    // Confetti
    confettiBurst(this.confettiCanvas, 1);

    // Banner
    this.winStatsEl.textContent = `Moves: ${this.moves} • Time: ${formatTime(elapsed)}${improved ? "  —  New best!" : ""}`;
    this.winBannerEl.hidden = false;
  }
}


⸻

7) js/controls.js

"use strict";

/**
 * Wires UI controls and input to the game instance.
 */
export function bindControls(game, { presetSel, newBtn, resetBtn, playAgainBtn }) {
  // Buttons
  newBtn.addEventListener("click", () => game.scramble(presetSel.value));
  resetBtn.addEventListener("click", () => game.resetToSolved());
  playAgainBtn.addEventListener("click", () => {
    document.getElementById("winBanner").hidden = true;
    game.scramble(presetSel.value);
  });

  // Clicking tiles (event delegation)
  game.boardEl.addEventListener("click", (e) => {
    const target = e.target.closest(".tile");
    if (!target) return;
    const val = Number(target.dataset.val);
    if (!Number.isFinite(val)) return;
    game.clickTile(val);
  });

  // Keyboard controls
  window.addEventListener("keydown", (e) => {
    const k = e.key;
    // Prevent page scroll for arrows
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(k)) e.preventDefault();

    switch (k) {
      case "ArrowUp": case "w": case "W": case "k": case "K": game.moveDirection("up"); break;
      case "ArrowDown": case "s": case "S": case "j": case "J": game.moveDirection("down"); break;
      case "ArrowLeft": case "a": case "A": case "h": case "H": game.moveDirection("left"); break;
      case "ArrowRight": case "d": case "D": case "l": case "L": game.moveDirection("right"); break;
      case "r": case "R": game.resetToSolved(); break;
      case "n": case "N": game.scramble(presetSel.value); break;
    }
  }, { passive: false });
}


⸻

8) js/main.js

"use strict";

import { Game } from "./game.js";
import { bindControls } from "./controls.js";

const $ = (sel) => document.querySelector(sel);

document.addEventListener("DOMContentLoaded", async () => {
  const game = new Game({
    boardEl: $("#board"),
    movesEl: $("#moves"),
    timeEl: $("#time"),
    bestEl: $("#best"),
    winBannerEl: $("#winBanner"),
    winStatsEl: $("#winStats"),
    confettiCanvas: $("#confetti")
  });

  bindControls(game, {
    presetSel: $("#preset"),
    newBtn: $("#newGame"),
    resetBtn: $("#reset"),
    playAgainBtn: $("#playAgain")
  });

  // Start with default preset
  await game.scramble($("#preset").value);

  // Accessibility: focus board for immediate keyboard play
  $("#board").setAttribute("tabindex", "0");
  $("#board").focus();
});


⸻

🧪 Notes on quality & performance
	•	Solvability: Scramble by legal moves only → always solvable. No parity checks needed.
	•	Smoothness: Only transform changes on tiles; transitions are short and GPU‑friendly.
	•	No persistence: Best moves/time reset on reload; HUD shows “Session best”.
	•	Responsiveness: Tiles use % transforms; board uses aspect-ratio and vmin sizing; works from phones to desktops.
	•	Separation: Logic (game), wiring (controls), visuals (CSS), effects (confetti) are isolated for maintainability.

⸻

🔧 Installation (load unpacked)
	1.	Create a folder, e.g. retro-15puzzle/.
	2.	Add the files exactly as shown above (keeping the folder structure).
	3.	(Optional) Add icons to assets/icons/, or remove the icons field from manifest.json.
	4.	Open chrome://extensions, enable Developer mode.
	5.	Click Load unpacked → select the retro-15puzzle/ folder.
	6.	Open a new tab to play. 🎉

⸻

✅ How requirements map to implementation
	•	Full tab page: chrome_url_overrides.newtab.
	•	4×4 grid: SIZE = 4; tiles 1–15 + blank 0.
	•	Mouse & keyboard: Delegated click + arrows/WASD/HJKL.
	•	Move counter & timer: HUD updates each move; timer starts on first user move.
	•	Best tracking (session): Stored in memory only; no persistence.
	•	Reset: Button + “R”.
	•	Presets: “Almost solved” and multiple difficulty depths.
	•	Smooth animations: CSS transforms, short easing; .no-animate for scrambles.
	•	Retro style: CRT scanlines, bevelled tiles, neon accents, glow, vignette.
	•	Responsive: vmin sizing + aspect-ratio; transforms in %.
	•	Algorithms: Guaranteed‑solvable scrambles; O(1) moves; O(n) win check.
	•	Clean structure: Modular JS; minimal coupling; comments where helpful.

⸻
