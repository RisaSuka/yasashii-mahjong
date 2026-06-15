export function bindControls(root, handlers) {
  root.querySelector("[data-action='start-round']")?.addEventListener("click", () => {
    handlers.onStartRound();
  });

  root.querySelector("[data-action='start-next-round']")?.addEventListener("click", () => {
    handlers.onStartNextRound();
  });

  root.querySelector("[data-action='toggle-large']")?.addEventListener("click", () => {
    handlers.onToggleLargeTileMode();
  });

  root.querySelector("[data-action='toggle-discard-advice']")?.addEventListener("click", () => {
    handlers.onToggleDiscardAdvice();
  });

  for (const button of root.querySelectorAll("[data-action='discard-tile']")) {
    button.addEventListener("click", () => {
      handlers.onDiscardTile(button.dataset.tileId);
    });
  }

  root.querySelector("[data-action='declare-tsumo']")?.addEventListener("click", () => {
    handlers.onDeclareTsumo();
  });

  root.querySelector("[data-action='declare-ron']")?.addEventListener("click", () => {
    handlers.onDeclareRon();
  });

  root.querySelector("[data-action='skip-ron']")?.addEventListener("click", () => {
    handlers.onSkipRon();
  });
}
