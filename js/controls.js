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