import { bindControls } from "./ui/input.js";
import { renderGame } from "./ui/render.js";

const appRoot = document.querySelector("#app");

let state = null;
let gameApi = null;
let cpuTimer = null;

init();

async function init() {
  gameApi = await loadGameApi();
  state = gameApi.createInitialGameState();
  state.stats = gameApi.loadStats();
  render();
}

async function loadGameApi() {
  try {
    const [actions, round, storage] = await Promise.all([
      import("./game/actions.js"),
      import("./game/round.js"),
      import("./game/storage.js")
    ]);

    return {
      dispatchAction: actions.dispatchAction,
      createInitialGameState: round.createInitialGameState,
      loadStats: storage.loadStats
    };
  } catch (_error) {
    return createFallbackGameApi();
  }
}

function render() {
  renderGame(state, appRoot);
  bindControls(appRoot, {
    onStartRound: startRound,
    onToggleLargeTileMode: toggleLargeTileMode,
    onDiscardTile: discardHumanTile
  });
}

function startRound() {
  state = gameApi.dispatchAction(state, { type: "START_ROUND" });
  render();
  scheduleCpuIfNeeded();
}

function toggleLargeTileMode() {
  state = gameApi.dispatchAction(state, { type: "TOGGLE_LARGE_TILE_MODE" });
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
  continueAfterDiscard();
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
  }

  render();
  scheduleCpuIfNeeded();
}

function scheduleCpuIfNeeded() {
  window.clearTimeout(cpuTimer);

  const player = getCurrentPlayer();
  if (!player || player.type !== "cpu" || state.round?.phase !== "discard") {
    return;
  }

  cpuTimer = window.setTimeout(() => {
    state = gameApi.dispatchAction(state, { type: "CPU_DISCARD" });
    continueAfterDiscard();
  }, state.settings.cpuDelayMs);
}

function getCurrentPlayer() {
  if (!state?.round) {
    return null;
  }

  return state.round.players[state.round.currentPlayerIndex] || null;
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

      if (action.type === "START_ROUND") {
        return {
          ...currentState,
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
      createFallbackPlayer(0, "あなた", "human", "east", 14),
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
