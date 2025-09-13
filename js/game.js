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

  getState() {
    return { board: [...this.board], blank: this.blank };
  }

  flashTile(val) {
    const el = this.tiles[val];
    if (el) {
      el.classList.add("hint");
      setTimeout(() => el.classList.remove("hint"), 900);
    }
  }


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