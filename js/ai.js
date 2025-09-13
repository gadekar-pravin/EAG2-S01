"use strict";

import { SIZE, idxToRC, rcToIdx } from "./util.js";

/**
 * Lightweight IDA* solver (Manhattan heuristic).
 * Returns a short optimal/near-optimal prefix path under a time budget.
 */

const GOAL_POS = (() => {
  const m = Array(SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    const val = (i + 1) % (SIZE * SIZE);
    m[val] = { r: Math.floor(i / SIZE), c: i % SIZE };
  }
  return m;
})();

const DIRS = [
  { name: "up", dr: -1, dc: 0, opp: "down" },
  { name: "down", dr: 1, dc: 0, opp: "up" },
  { name: "left", dr: 0, dc: -1, opp: "right" },
  { name: "right", dr: 0, dc: 1, opp: "left" }
];

function manhattan(board) {
  let h = 0;
  for (let i = 0; i < board.length; i++) {
    const v = board[i];
    if (v === 0) continue;
    const r = Math.floor(i / SIZE), c = i % SIZE;
    const g = GOAL_POS[v];
    h += Math.abs(r - g.r) + Math.abs(c - g.c);
  }
  return h;
}

function cloneBoard(board) {
  const b = new Array(board.length);
  for (let i = 0; i < board.length; i++) b[i] = board[i];
  return b;
}

function idxValid(r, c) { return r >= 0 && r < SIZE && c >= 0 && c < SIZE; }

export function serializeBoard(board) { return board.join(","); }

function firstMoveTileAndDir(board, blankIdx, blankMoveName) {
  // Map blank movement to the tile that will move (opposite direction).
  const { r, c } = idxToRC(blankIdx);
  let tileIdx = null, tileDir = null;
  switch (blankMoveName) {
    case "left":
      if (c > 0) { tileIdx = rcToIdx(r, c - 1); tileDir = "right"; }
      break;
    case "right":
      if (c < SIZE - 1) { tileIdx = rcToIdx(r, c + 1); tileDir = "left"; }
      break;
    case "up":
      if (r > 0) { tileIdx = rcToIdx(r - 1, c); tileDir = "down"; }
      break;
    case "down":
      if (r < SIZE - 1) { tileIdx = rcToIdx(r + 1, c); tileDir = "up"; }
      break;
  }
  const tile = tileIdx != null ? board[tileIdx] : null;
  return { tile, tileDir };
}

function idaStar(startBoard, startBlank, { timeMs = 800, maxDepth = 128 } = {}) {
  const board = cloneBoard(startBoard);
  const start = performance.now();
  let nodes = 0;
  let bestPartial = []; // best-so-far path (lowest f) if timed out

  function heuristic() { return manhattan(board); }

  let bound = heuristic();
  const path = [];

  function search(g, bound, prevDir) {
    const h = heuristic();
    const f = g + h;
    if (f > bound) {
      if (!bestPartial.length || f < g + manhattan(applyPath(startBoard, startBlank, path))) {
        bestPartial = path.slice();
      }
      return f;
    }
    if (h === 0) return "FOUND";
    if (g >= maxDepth) return Infinity;
    if (performance.now() - start > timeMs) throw new Error("TIME");

    const { r, c } = idxToRC(getBlank(board));
    let min = Infinity;

    for (const d of DIRS) {
      if (prevDir && d.name === prevDir.opp) continue; // no 180s
      const nr = r + d.dr, nc = c + d.dc;
      if (!idxValid(nr, nc)) continue;

      // swap blank with neighbor
      const ni = rcToIdx(nr, nc), bi = rcToIdx(r, c);
      swap(board, bi, ni);
      path.push(d.name);
      nodes++;

      const t = search(g + 1, bound, d);
      if (t === "FOUND") return "FOUND";
      if (t < min) min = t;

      path.pop();
      swap(board, bi, ni); // undo
    }
    return min;
  }

  try {
    while (true) {
      const t = search(0, bound, null);
      if (t === "FOUND") return { path: path.slice(), nodes, timedOut: false };
      if (t === Infinity) return { path: bestPartial.slice(), nodes, timedOut: false };
      bound = t;
    }
  } catch (e) {
    if (e.message === "TIME") {
      return { path: bestPartial.slice(), nodes, timedOut: true };
    }
    throw e;
  }
}

function getBlank(board) {
  for (let i = 0; i < board.length; i++) if (board[i] === 0) return i;
  return -1;
}

function swap(arr, i, j) { const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }

// Helper used only inside the search heuristic bound update (rare); safe but O(d).
function applyPath(board, blank, path) {
  const b = cloneBoard(board);
  let bi = blank;
  for (const step of path) {
    const { r, c } = idxToRC(bi);
    let nr = r, nc = c;
    if (step === "left") nc = c - 1;
    else if (step === "right") nc = c + 1;
    else if (step === "up") nr = r - 1;
    else if (step === "down") nr = r + 1;
    const ni = rcToIdx(nr, nc);
    swap(b, bi, ni);
    bi = ni;
  }
  return b;
}

/** ---------------- LLM integration ---------------- */

const cache = new Map(); // key: provider|type|boardSig -> result

function ensureKey(provider) {
  const keyName = provider === "openai" ? "OPENAI_API_KEY" : "GEMINI_API_KEY";
  let key = localStorage.getItem(keyName);
  if (!key) {
    key = prompt(`Enter your ${provider.toUpperCase()} API key`);
    if (key) localStorage.setItem(keyName, key.trim());
  }
  if (!key) throw new Error(`${provider} API key not set`);
  return key.trim();
}

async function callOpenAI({ prompt, model = "gpt-4o-mini", key }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a 15-puzzle tactical assistant. Reply with minimal JSON." },
        { role: "user", content: prompt }
      ]
    })
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenAI HTTP ${res.status} ${txt}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI: empty response");
  return JSON.parse(content);
}

async function callGemini({ prompt, model = "gemini-1.5-flash", key }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, responseMimeType: "application/json" }
    })
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Gemini HTTP ${res.status} ${txt}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini: empty response");
  return JSON.parse(text);
}

function buildPrompt({ board, blank, path, hintType }) {
  const grid = [];
  for (let r = 0; r < SIZE; r++) {
    grid.push(board.slice(r * SIZE, (r + 1) * SIZE).map(v => String(v).padStart(2, " ")).join(" "));
  }
  const boardCsv = serializeBoard(board);
  const next = path[0] || null;
  const { tile, tileDir } = next ? firstMoveTileAndDir(board, blank, next) : { tile: null, tileDir: null };

  const plan = path.length ? path.slice(0, 12).join(" > ") : "";

  const task = hintType === "direct"
    ? `Return the single best immediate move grounded in the optimal path prefix provided (if any).`
    : `Return succinct strategic guidance for the next mini-goal (e.g., settle top row, position corners) grounded in the board.`

  return `
You are assisting with a 4x4 sliding 15-puzzle.
Board (row-major, 0=blank):
CSV: [${boardCsv}]
Grid:
${grid.join("\n")}
Heuristic path prefix (blank-direction steps, earliest first): ${plan || "none"}
If a next step exists, the tile that would move is: ${tile ?? "unknown"} moving ${tileDir ?? "unknown"}.

Task: ${task}
Constraints:
- Reply as strict JSON. No markdown. No extra keys.
- If type="direct", include: {"type":"direct","tile":<int>,"direction":"left|right|up|down","text":"one concise sentence"}.
- If type="strategic", include: {"type":"strategic","focus":"e.g. 'first row'","text":"one concise sentence"}.
- Do not propose illegal moves. Keep it short and specific.
Set "type"="${hintType}".
`.trim();
}

/**
 * Public API: request AI hint
 * @param {{board:number[], blank:number, hintType:'direct'|'strategic', provider:'openai'|'gemini', timeBudgetMs?:number}} params
 * @returns {Promise<{type:string, message:string, tile?:number, direction?:string}>}
 */
export async function requestAIHint({ board, blank, hintType = "direct", provider = "openai", timeBudgetMs = 800 }) {
  const sig = `${provider}|${hintType}|${serializeBoard(board)}`;
  if (cache.has(sig)) return cache.get(sig);

  // Compute a short optimal/near-optimal prefix under budget
  const { path } = idaStar(board, blank, { timeMs: timeBudgetMs, maxDepth: 128 });

  const prompt = buildPrompt({ board, blank, path, hintType });

  let parsed;
  try {
    const key = ensureKey(provider);
    parsed = provider === "openai"
      ? await callOpenAI({ prompt, key })
      : await callGemini({ prompt, key });
  } catch (e) {
    // Fallback (no network/parse): synthesize from solver
    if (hintType === "direct") {
      const step = path[0];
      if (step) {
        const { tile, tileDir } = firstMoveTileAndDir(board, blank, step);
        const message = `Move tile ${tile} ${tileDir}.`;
        const result = { type: "direct", message, tile, direction: tileDir };
        cache.set(sig, result);
        return result;
      }
    }
    const result = { type: hintType, message: "Hint unavailable. Try again." };
    cache.set(sig, result);
    return result;
  }

  // Normalize to return shape
  if (parsed?.type === "direct") {
    const tile = Number(parsed.tile);
    const direction = String(parsed.direction || "").toLowerCase();
    const text = parsed.text || `Move tile ${tile} ${direction}.`;
    const result = { type: "direct", message: text, tile, direction };
    cache.set(sig, result);
    return result;
  } else {
    const text = parsed?.text || "Focus on placing tiles 1–4 across the top row.";
    const result = { type: "strategic", message: text };
    cache.set(sig, result);
    return result;
  }
}
