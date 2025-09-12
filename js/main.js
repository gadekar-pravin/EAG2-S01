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