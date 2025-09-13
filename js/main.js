"use strict";

import { Game } from "./game.js";
import { bindControls } from "./controls.js";
import { requestAIHint } from "./ai.js";


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

  const hintBtn = $("#getHint");
  const hintTypeSel = $("#hintType");
  const llmSel = $("#llm");
  const hintOut = $("#aiHint");

  hintBtn?.addEventListener("click", async () => {
    try {
      hintBtn.disabled = true;
      hintBtn.classList.add("loading");
      hintBtn.textContent = "Thinking…";
      const state = (typeof game.getState === "function")
        ? game.getState()
        : { board: [...game.board], blank: game.blank };

      const res = await requestAIHint({
        board: state.board,
        blank: state.blank,
        hintType: hintTypeSel?.value || "direct",
        provider: llmSel?.value || "openai"
      });

      hintOut.textContent = res.message;

      if (res.type === "direct" && Number.isFinite(res.tile)) {
        if (typeof game.flashTile === "function") game.flashTile(res.tile);
        else {
          const el = game.tiles?.[res.tile];
          if (el) { el.classList.add("hint"); setTimeout(() => el.classList.remove("hint"), 900); }
        }
      }
    } catch (err) {
      hintOut.textContent = `Error: ${err?.message || err}`;
    } finally {
      hintBtn.disabled = false;
      hintBtn.classList.remove("loading");
      hintBtn.textContent = "Get hint";
    }
  });


  // Start with default preset
  await game.scramble($("#preset").value);

  // Accessibility: focus board for immediate keyboard play
  $("#board").setAttribute("tabindex", "0");
  $("#board").focus();
});