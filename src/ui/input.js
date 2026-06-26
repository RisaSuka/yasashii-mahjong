export function bindControls(root, handlers) {
  root.addEventListener?.("keydown", (event) => {
    if (event.key === "Escape") {
      handlers.onCloseDiscardAdvice?.();
      handlers.onCloseDiscardZoom?.();
      handlers.onCloseMatchResult?.();
      handlers.onCloseBeginnerHelp?.();
      handlers.onCloseYakuGuide?.();
      handlers.onCloseWaits?.();
      handlers.onCloseAllHands?.();
      handlers.onCloseSettingsMenu?.();
      handlers.onCloseCallOptions?.();
    }
  });

  for (const button of root.querySelectorAll("[data-action='start-match']")) {
    button.addEventListener("click", () => {
      handlers.onStartMatch?.();
    });
  }

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

  root.querySelector("[data-action='open-settings-menu']")?.addEventListener("click", () => {
    handlers.onOpenSettingsMenu?.();
  });

  for (const trigger of root.querySelectorAll("[data-action='close-settings-menu']")) {
    trigger.addEventListener("click", (event) => {
      if (trigger.classList?.contains("settings-menu-backdrop") && event.target !== trigger) {
        return;
      }
      handlers.onCloseSettingsMenu?.();
    });
  }

  root.querySelector("[data-action='open-discard-advice']")?.addEventListener("click", () => {
    handlers.onOpenDiscardAdvice?.();
  });

  root.querySelector("[data-action='close-discard-advice']")?.addEventListener("click", () => {
    handlers.onCloseDiscardAdvice?.();
  });

  for (const trigger of root.querySelectorAll("[data-action='open-discard-zoom']")) {
    trigger.addEventListener("click", () => {
      handlers.onOpenDiscardZoom?.(trigger.dataset.playerId);
    });
    trigger.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handlers.onOpenDiscardZoom?.(trigger.dataset.playerId);
      }
    });
  }

  for (const trigger of root.querySelectorAll("[data-action='close-discard-zoom']")) {
    trigger.addEventListener("click", (event) => {
      if (trigger.classList?.contains("discard-zoom-backdrop") && event.target !== trigger) {
        return;
      }
      handlers.onCloseDiscardZoom?.();
    });
  }

  root.querySelector("[data-action='open-match-result']")?.addEventListener("click", () => {
    handlers.onOpenMatchResult?.();
  });

  for (const trigger of root.querySelectorAll("[data-action='close-match-result']")) {
    trigger.addEventListener("click", (event) => {
      if (trigger.classList?.contains("match-result-backdrop") && event.target !== trigger) {
        return;
      }
      handlers.onCloseMatchResult?.();
    });
  }

  root.querySelector("[data-action='open-beginner-help']")?.addEventListener("click", () => {
    handlers.onOpenBeginnerHelp?.();
  });

  for (const trigger of root.querySelectorAll("[data-action='close-beginner-help']")) {
    trigger.addEventListener("click", (event) => {
      if (trigger.classList?.contains("beginner-help-backdrop") && event.target !== trigger) {
        return;
      }
      handlers.onCloseBeginnerHelp?.();
    });
  }

  root.querySelector("[data-action='open-yaku-guide']")?.addEventListener("click", () => {
    handlers.onOpenYakuGuide?.();
  });

  for (const trigger of root.querySelectorAll("[data-action='close-yaku-guide']")) {
    trigger.addEventListener("click", (event) => {
      if (trigger.classList?.contains("yaku-guide-backdrop") && event.target !== trigger) {
        return;
      }
      handlers.onCloseYakuGuide?.();
    });
  }

  root.querySelector("[data-action='open-waits']")?.addEventListener("click", () => {
    handlers.onOpenWaits?.();
  });

  for (const trigger of root.querySelectorAll("[data-action='close-waits']")) {
    trigger.addEventListener("click", (event) => {
      if (trigger.classList?.contains("waits-backdrop") && event.target !== trigger) {
        return;
      }
      handlers.onCloseWaits?.();
    });
  }

  root.querySelector("[data-action='open-all-hands']")?.addEventListener("click", () => {
    handlers.onOpenAllHands?.();
  });

  for (const trigger of root.querySelectorAll("[data-action='close-all-hands']")) {
    trigger.addEventListener("click", (event) => {
      if (trigger.classList?.contains("all-hands-backdrop") && event.target !== trigger) {
        return;
      }
      handlers.onCloseAllHands?.();
    });
  }

  root.querySelector("[data-action='declare-riichi']")?.addEventListener("click", () => {
    handlers.onDeclareRiichi?.();
  });

  root.querySelector("[data-action='cancel-riichi']")?.addEventListener("click", () => {
    handlers.onCancelRiichi?.();
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

  for (const button of root.querySelectorAll("[data-action='open-call-options']")) {
    button.addEventListener("click", () => {
      handlers.onOpenCallOptions?.(button.dataset.callType);
    });
  }

  for (const trigger of root.querySelectorAll("[data-action='close-call-options']")) {
    trigger.addEventListener("click", (event) => {
      if (trigger.classList?.contains("call-options-backdrop") && event.target !== trigger) {
        return;
      }
      handlers.onCloseCallOptions?.();
    });
  }

  root.querySelector("[data-action='declare-pon']")?.addEventListener("click", () => {
    handlers.onDeclarePon?.();
  });

  for (const button of root.querySelectorAll("[data-action='declare-chi']")) {
    button.addEventListener("click", () => {
      handlers.onDeclareChi?.((button.dataset.handTileIds || "").split(",").filter(Boolean));
    });
  }

  root.querySelector("[data-action='skip-ron']")?.addEventListener("click", () => {
    handlers.onSkipRon();
  });
}
