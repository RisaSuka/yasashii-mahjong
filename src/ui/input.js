export function bindControls(root, handlers) {
  root.querySelector("[data-action='start-round']")?.addEventListener("click", () => {
    handlers.onStartRound();
  });

  root.querySelector("[data-action='toggle-large']")?.addEventListener("click", () => {
    handlers.onToggleLargeTileMode();
  });

  for (const button of root.querySelectorAll("[data-action='discard-tile']")) {
    button.addEventListener("click", () => {
      handlers.onDiscardTile(button.dataset.tileId);
    });
  }
}
