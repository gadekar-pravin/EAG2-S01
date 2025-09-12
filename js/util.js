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