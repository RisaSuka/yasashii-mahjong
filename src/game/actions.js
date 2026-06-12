import { chooseRandomDiscard } from "./cpu/random-cpu.js";
import { addTileToPlayer, createInitialGameState, startRound } from "./round.js";
import { isWinningHand } from "./rules/win-check.js";
import { drawFromWall } from "./wall.js";
import { createDefaultStats, saveStats } from "./storage.js";

export function dispatchAction(state, action) {
  switch (action.type) {
    case "START_ROUND":
      return startRound(state, { storage: action.storage, random: action.random });
    case "DISCARD_TILE":
      return discardTile(state, action.playerId, action.tileId);
    case "DRAW_TILE":
      return drawTile(state, action.playerId, action.storage);
    case "ADVANCE_TURN":
      return advanceTurn(state);
    case "CPU_DISCARD":
      return cpuDiscard(state, action.random);
    case "DECLARE_TSUMO":
      return declareTsumo(state, action.playerId);
    case "END_ROUND_DRAW":
      return endRoundDraw(state, action.storage);
    case "TOGGLE_LARGE_TILE_MODE":
      return {
        ...state,
        settings: {
          ...state.settings,
          largeTileMode: !state.settings.largeTileMode
        }
      };
    case "RESET_STATS": {
      const stats = createDefaultStats();
      saveStats(stats, action.storage);
      return {
        ...state,
        stats
      };
    }
    default:
      return state;
  }
}

export function canDeclareTsumo(state, playerId) {
  if (!state.round || state.round.phase !== "discard") {
    return false;
  }

  if (state.round.currentPlayerIndex !== playerId) {
    return false;
  }

  const player = state.round.players.find((candidate) => candidate.id === playerId);

  if (!player) {
    return false;
  }

  return isWinningHand(player.hand).winning;
}

export function declareTsumo(state, playerId) {
  if (!canDeclareTsumo(state, playerId)) {
    return state;
  }

  const player = state.round.players.find((candidate) => candidate.id === playerId);
  const result = isWinningHand(player.hand);

  return {
    ...state,
    round: {
      ...state.round,
      phase: "ended",
      endReason: "win",
      winningResult: {
        winnerId: playerId,
        winType: "tsumo",
        handType: result.type,
        handTiles: [...player.hand]
      }
    }
  };
}

export function discardTile(state, playerId, tileId) {
  if (!state.round || state.round.phase !== "discard") {
    return state;
  }

  const player = state.round.players.find((candidate) => candidate.id === playerId);

  if (!player || state.round.currentPlayerIndex !== playerId) {
    return state;
  }

  const tile = player.hand.find((candidate) => candidate.id === tileId);

  if (!tile) {
    return state;
  }

  return {
    ...state,
    round: {
      ...state.round,
      players: state.round.players.map((candidate) => {
        if (candidate.id !== playerId) {
          return candidate;
        }

        return {
          ...candidate,
          hand: candidate.hand.filter((handTile) => handTile.id !== tileId),
          discards: [...candidate.discards, tile]
        };
      }),
      lastDiscard: {
        playerId,
        tile
      },
      phase: "draw"
    }
  };
}

export function drawTile(state, playerId, storage) {
  if (!state.round || state.round.phase === "ended") {
    return state;
  }

  const drawResult = drawFromWall(state.round);

  if (!drawResult.tile) {
    return endRoundDraw(
      {
        ...state,
        round: {
          ...state.round,
          wall: []
        }
      },
      storage
    );
  }

  return {
    ...state,
    round: {
      ...drawResult.round,
      players: addTileToPlayer(drawResult.round.players, playerId, drawResult.tile),
      lastDraw: {
        playerId,
        tile: drawResult.tile
      },
      phase: "discard"
    }
  };
}

export function advanceTurn(state) {
  if (!state.round || state.round.phase === "ended") {
    return state;
  }

  return {
    ...state,
    round: {
      ...state.round,
      currentPlayerIndex: (state.round.currentPlayerIndex + 1) % state.round.players.length,
      turnCount: state.round.turnCount + 1
    }
  };
}

export function cpuDiscard(state, random = Math.random) {
  if (!state.round || state.round.phase !== "discard") {
    return state;
  }

  const player = state.round.players[state.round.currentPlayerIndex];

  if (!player || player.type !== "cpu") {
    return state;
  }

  const tile = chooseRandomDiscard(player, random);
  return tile ? discardTile(state, player.id, tile.id) : state;
}

export function endRoundDraw(state, storage) {
  if (!state.round) {
    return state;
  }

  const nextState = {
    ...state,
    stats: {
      ...state.stats,
      roundsDrawn: state.stats.roundsDrawn + (state.round.phase === "ended" ? 0 : 1),
      lastPlayedAt: new Date().toISOString()
    },
    round: {
      ...state.round,
      phase: "ended",
      endReason: "exhaustive-draw"
    }
  };

  saveStats(nextState.stats, storage);
  return nextState;
}

export { createInitialGameState };
