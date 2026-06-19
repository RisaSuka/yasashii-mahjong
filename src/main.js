import { bindControls } from "./ui/input.js?v=mvp18-cpu-win-1";
import { renderGame } from "./ui/render.js?v=mvp18-cpu-win-1";

const APP_ASSET_VERSION = "mvp18-cpu-win-1";

const appRoot = document.querySelector("#app");

let state = null;
let gameApi = null;
let cpuTimer = null;
let discardAdviceDialogOpen = false;
let discardZoomPlayerId = null;
let matchResultDialogOpen = false;
let beginnerHelpDialogOpen = false;
let yakuGuideDialogOpen = false;
let waitsDialogOpen = false;

init();

async function init() {
  gameApi = await loadGameApi();
  state = gameApi.createInitialGameState();
  state.stats = gameApi.loadStats();
  applyDiscardAdviceSettings(gameApi.loadDiscardAdviceSettings());
  render();
}

async function loadGameApi() {
  try {
    const [actions, round, storage, advice, yakuGuide, waits] = await Promise.all([
      import(`./game/actions.js?v=${APP_ASSET_VERSION}`),
      import(`./game/round.js?v=${APP_ASSET_VERSION}`),
      import(`./game/storage.js?v=${APP_ASSET_VERSION}`),
      import(`./game/advice/discard-advice.js?v=${APP_ASSET_VERSION}`),
      import(`./game/advice/yaku-guide.js?v=${APP_ASSET_VERSION}`),
      import(`./game/advice/wait-analysis.js?v=${APP_ASSET_VERSION}`)
    ]);

    return {
      dispatchAction: actions.dispatchAction,
      canDeclareTsumo: actions.canDeclareTsumo,
      canDeclareRon: actions.canDeclareRon,
      canRonLatestDiscard: actions.canRonLatestDiscard,
      canCompleteRonLatestDiscard: actions.canCompleteRonLatestDiscard,
      resolveCpuRonAfterDiscard: actions.resolveCpuRonAfterDiscard,
      createInitialGameState: round.createInitialGameState,
      loadStats: storage.loadStats,
      suggestDiscards: advice.suggestDiscards,
      suggestYakuTargets: yakuGuide.suggestYakuTargets,
      analyzeWaits: waits.analyzeWaits,
      loadDiscardAdviceSettings: advice.loadDiscardAdviceSettings,
      saveDiscardAdviceSettings: advice.saveDiscardAdviceSettings
    };
  } catch (_error) {
    return createFallbackGameApi();
  }
}

function render() {
  renderGame(state, appRoot, {
    canDeclareTsumo: gameApi.canDeclareTsumo,
    canDeclareRon: gameApi.canDeclareRon,
    canCompleteRonLatestDiscard: gameApi.canCompleteRonLatestDiscard,
    suggestDiscards: gameApi.suggestDiscards,
    suggestYakuTargets: gameApi.suggestYakuTargets,
    discardAdviceDialogOpen,
    discardZoomPlayerId,
    matchResultDialogOpen,
    beginnerHelpDialogOpen,
    yakuGuideDialogOpen,
    waitsDialogOpen
  });
  bindControls(appRoot, {
    onStartMatch: startMatch,
    onStartRound: startMatch,
    onStartNextRound: startNextRound,
    onToggleLargeTileMode: toggleLargeTileMode,
    onToggleDiscardAdvice: toggleDiscardAdvice,
    onOpenDiscardAdvice: openDiscardAdvice,
    onCloseDiscardAdvice: closeDiscardAdvice,
    onOpenDiscardZoom: openDiscardZoom,
    onCloseDiscardZoom: closeDiscardZoom,
    onOpenMatchResult: openMatchResult,
    onCloseMatchResult: closeMatchResult,
    onOpenBeginnerHelp: openBeginnerHelp,
    onCloseBeginnerHelp: closeBeginnerHelp,
    onOpenYakuGuide: openYakuGuide,
    onCloseYakuGuide: closeYakuGuide,
    onOpenWaits: openWaits,
    onCloseWaits: closeWaits,
    onDiscardTile: discardHumanTile,
    onDeclareTsumo: declareHumanTsumo,
    onDeclareRon: declareHumanRon,
    onSkipRon: skipRon
  });
}

function startMatch() {
  window.clearTimeout(cpuTimer);
  discardAdviceDialogOpen = false;
  discardZoomPlayerId = null;
  matchResultDialogOpen = false;
  beginnerHelpDialogOpen = false;
  yakuGuideDialogOpen = false;
  waitsDialogOpen = false;
  state = gameApi.dispatchAction(state, { type: "START_MATCH" });
  render();
  scheduleCpuIfNeeded();
}

function startNextRound() {
  window.clearTimeout(cpuTimer);
  discardAdviceDialogOpen = false;
  discardZoomPlayerId = null;
  matchResultDialogOpen = false;
  beginnerHelpDialogOpen = false;
  yakuGuideDialogOpen = false;
  waitsDialogOpen = false;
  state = gameApi.dispatchAction(state, { type: "START_NEXT_ROUND" });
  render();
  scheduleCpuIfNeeded();
}

function toggleLargeTileMode() {
  state = gameApi.dispatchAction(state, { type: "TOGGLE_LARGE_TILE_MODE" });
  render();
}

function toggleDiscardAdvice() {
  const nextEnabled = !state.settings.discardAdviceEnabled;
  const nextSettings = {
    discardAdviceEnabled: nextEnabled,
    strategy: state.settings.discardAdviceStrategy || "beginner"
  };

  gameApi.saveDiscardAdviceSettings(nextSettings);
  applyDiscardAdviceSettings(nextSettings);
  discardAdviceDialogOpen = false;
  discardZoomPlayerId = null;
  matchResultDialogOpen = false;
  beginnerHelpDialogOpen = false;
  yakuGuideDialogOpen = false;
  waitsDialogOpen = false;
  render();
}

function openDiscardAdvice() {
  discardAdviceDialogOpen = true;
  discardZoomPlayerId = null;
  matchResultDialogOpen = false;
  beginnerHelpDialogOpen = false;
  yakuGuideDialogOpen = false;
  waitsDialogOpen = false;
  render();
}

function closeDiscardAdvice() {
  discardAdviceDialogOpen = false;
  render();
}

function openDiscardZoom(playerId) {
  discardAdviceDialogOpen = false;
  discardZoomPlayerId = Number(playerId);
  matchResultDialogOpen = false;
  beginnerHelpDialogOpen = false;
  yakuGuideDialogOpen = false;
  waitsDialogOpen = false;
  render();
}

function closeDiscardZoom() {
  discardZoomPlayerId = null;
  render();
}

function openMatchResult() {
  discardAdviceDialogOpen = false;
  discardZoomPlayerId = null;
  matchResultDialogOpen = true;
  beginnerHelpDialogOpen = false;
  yakuGuideDialogOpen = false;
  waitsDialogOpen = false;
  render();
}

function closeMatchResult() {
  matchResultDialogOpen = false;
  render();
}

function openBeginnerHelp() {
  discardAdviceDialogOpen = false;
  discardZoomPlayerId = null;
  matchResultDialogOpen = false;
  beginnerHelpDialogOpen = true;
  yakuGuideDialogOpen = false;
  waitsDialogOpen = false;
  render();
}

function closeBeginnerHelp() {
  beginnerHelpDialogOpen = false;
  render();
}

function openYakuGuide() {
  discardAdviceDialogOpen = false;
  discardZoomPlayerId = null;
  matchResultDialogOpen = false;
  beginnerHelpDialogOpen = false;
  yakuGuideDialogOpen = true;
  waitsDialogOpen = false;
  render();
}

function closeYakuGuide() {
  yakuGuideDialogOpen = false;
  render();
}

function openWaits() {
  discardAdviceDialogOpen = false;
  discardZoomPlayerId = null;
  matchResultDialogOpen = false;
  beginnerHelpDialogOpen = false;
  yakuGuideDialogOpen = false;
  waitsDialogOpen = true;
  render();
}

function closeWaits() {
  waitsDialogOpen = false;
  render();
}

function discardHumanTile(tileId) {
  const currentPlayer = getCurrentPlayer();

  if (!currentPlayer || currentPlayer.type !== "human") {
    return;
  }

  state = gameApi.dispatchAction(state, {
    type: "DISCARD_TILE",
    playerId: currentPlayer.id,
    tileId
  });
  discardAdviceDialogOpen = false;
  discardZoomPlayerId = null;
  matchResultDialogOpen = false;
  beginnerHelpDialogOpen = false;
  yakuGuideDialogOpen = false;
  waitsDialogOpen = false;
  handleAfterDiscard();
}

function declareHumanTsumo() {
  const currentPlayer = getCurrentPlayer();

  if (!currentPlayer || currentPlayer.type !== "human") {
    return;
  }

  state = gameApi.dispatchAction(state, {
    type: "DECLARE_TSUMO",
    playerId: currentPlayer.id
  });
  render();
}

function declareHumanRon() {
  const human = getHumanPlayer();

  if (!human) {
    return;
  }

  state = gameApi.dispatchAction(state, {
    type: "DECLARE_RON",
    playerId: human.id
  });
  render();
}

function skipRon() {
  state = gameApi.dispatchAction(state, { type: "SKIP_RON" });
  continueAfterReaction();
}

function handleAfterDiscard() {
  if (enterReactionIfNeeded()) {
    return;
  }

  if (resolveCpuRonIfNeeded()) {
    return;
  }

  continueAfterDiscard();
}

function enterReactionIfNeeded() {
  const human = getHumanPlayer();

  if (!human || !gameApi.canCompleteRonLatestDiscard?.(state, human.id)) {
    return false;
  }

  window.clearTimeout(cpuTimer);
  state = gameApi.dispatchAction(state, {
    type: "ENTER_REACTION",
    playerId: human.id
  });
  render();
  return state.round?.phase === "reaction";
}

function resolveCpuRonIfNeeded() {
  if (typeof gameApi.resolveCpuRonAfterDiscard !== "function") {
    return false;
  }

  const previousPhase = state.round?.phase;
  state = gameApi.resolveCpuRonAfterDiscard(state);

  if (previousPhase !== "ended" && state.round?.phase === "ended") {
    render();
    return true;
  }

  return false;
}

function continueAfterDiscard() {
  if (!state.round || state.round.phase === "ended") {
    render();
    return;
  }

  state = gameApi.dispatchAction(state, { type: "ADVANCE_TURN" });
  const nextPlayer = getCurrentPlayer();

  if (nextPlayer) {
    state = gameApi.dispatchAction(state, { type: "DRAW_TILE", playerId: nextPlayer.id });
    declareCpuTsumoIfAvailable(nextPlayer.id);
  }

  render();
  scheduleCpuIfNeeded();
}

function continueAfterReaction() {
  if (!state.round || state.round.phase === "ended") {
    render();
    return;
  }

  const nextPlayer = getCurrentPlayer();

  if (nextPlayer && state.round.phase === "draw") {
    state = gameApi.dispatchAction(state, { type: "DRAW_TILE", playerId: nextPlayer.id });
    declareCpuTsumoIfAvailable(nextPlayer.id);
  }

  render();
  scheduleCpuIfNeeded();
}

function declareCpuTsumoIfAvailable(playerId) {
  const player = state.round?.players.find((candidate) => candidate.id === playerId);

  if (!player || player.type !== "cpu" || !gameApi.canDeclareTsumo?.(state, playerId)) {
    return;
  }

  state = gameApi.dispatchAction(state, {
    type: "DECLARE_TSUMO",
    playerId
  });
}

function scheduleCpuIfNeeded() {
  window.clearTimeout(cpuTimer);

  const player = getCurrentPlayer();
  if (!player || player.type !== "cpu" || state.round?.phase !== "discard") {
    return;
  }

  cpuTimer = window.setTimeout(() => {
    state = gameApi.dispatchAction(state, { type: "CPU_DISCARD" });
    handleAfterDiscard();
  }, state.settings.cpuDelayMs);
}

function getCurrentPlayer() {
  if (!state?.round) {
    return null;
  }

  return state.round.players[state.round.currentPlayerIndex] || null;
}

function getHumanPlayer() {
  if (!state?.round) {
    return null;
  }

  return state.round.players.find((player) => player.type === "human") || null;
}

function applyDiscardAdviceSettings(settings) {
  state = {
    ...state,
    settings: {
      ...state.settings,
      discardAdviceEnabled: settings.discardAdviceEnabled,
      discardAdviceStrategy: settings.strategy || "beginner"
    }
  };
}

function createFallbackGameApi() {
  return {
    createInitialGameState() {
      return {
        version: 1,
        settings: {
          largeTileMode: false,
          cpuDelayMs: 300
        },
        stats: {
          roundsStarted: 0,
          roundsDrawn: 0,
          lastPlayedAt: null
        },
        round: createFallbackRound()
      };
    },
    loadStats() {
      return {
        roundsStarted: 0,
        roundsDrawn: 0,
        lastPlayedAt: null
      };
    },
    suggestDiscards() {
      return [];
    },
    suggestYakuTargets() {
      return [];
    },
    analyzeWaits() {
      return {
        isTenpai: false,
        waits: [],
        message: ""
      };
    },
    loadDiscardAdviceSettings() {
      return {
        discardAdviceEnabled: true,
        strategy: "beginner"
      };
    },
    saveDiscardAdviceSettings(settings) {
      return settings;
    },
    canDeclareTsumo() {
      return false;
    },
    canDeclareRon() {
      return false;
    },
    canRonLatestDiscard() {
      return false;
    },
    canCompleteRonLatestDiscard() {
      return false;
    },
    resolveCpuRonAfterDiscard(currentState) {
      return currentState;
    },
    dispatchAction(currentState, action) {
      if (action.type === "TOGGLE_LARGE_TILE_MODE") {
        return {
          ...currentState,
          settings: {
            ...currentState.settings,
            largeTileMode: !currentState.settings.largeTileMode
          }
        };
      }

      if (action.type === "START_MATCH" || action.type === "START_ROUND") {
        return {
          ...currentState,
          match: createFallbackMatch(),
          round: createFallbackRound()
        };
      }

      if (action.type === "START_NEXT_ROUND") {
        return {
          ...currentState,
          lastRoundResult: createFallbackRoundResult(currentState.round),
          round: createFallbackRound()
        };
      }

      return currentState;
    }
  };
}

function createFallbackRound() {
  return {
    phase: "discard",
    dealerIndex: 0,
    currentPlayerIndex: 0,
    wall: Array.from({ length: 69 }, (_, index) => ({ id: `wall-${index}` })),
    deadWall: Array.from({ length: 14 }, (_, index) => ({ id: `dead-${index}` })),
    doraIndicators: [{ id: "z1-0", suit: "z", rank: 1, copy: 0, red: false }],
    endReason: null,
    players: [
      createFallbackPlayer(0, "You", "human", "east", 14),
      createFallbackPlayer(1, "CPU 1", "cpu", "south", 13),
      createFallbackPlayer(2, "CPU 2", "cpu", "west", 13),
      createFallbackPlayer(3, "CPU 3", "cpu", "north", 13)
    ]
  };
}

function createFallbackPlayer(id, name, type, wind, handSize) {
  return {
    id,
    name,
    type,
    wind,
    hand: Array.from({ length: handSize }, (_, index) => ({
      id: `${wind}-${index}`,
      suit: ["m", "p", "s"][index % 3],
      rank: (index % 9) + 1,
      copy: 0,
      red: false
    })),
    discards: []
  };
}

function createFallbackMatch() {
  return {
    type: "tonpuu",
    phase: "playing",
    status: "playing",
    roundWind: "east",
    handNumber: 1,
    dealerIndex: 0,
    maxHands: 4,
    scores: [25000, 25000, 25000, 25000],
    roundHistory: []
  };
}

function createFallbackRoundResult(round) {
  return {
    roundId: round?.id || "fallback-round",
    endReason: round?.endReason || "exhaustive-draw",
    endedAt: new Date().toISOString()
  };
}
