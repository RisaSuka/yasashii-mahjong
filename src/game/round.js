import { createPlayers } from "./player.js";
import { createTiles } from "./tiles.js";
import { buildWall, drawFromWall } from "./wall.js";
import { createDefaultStats, saveStats } from "./storage.js";

export function createInitialGameState() {
  return {
    version: 1,
    settings: {
      largeTileMode: false,
      cpuDelayMs: 300
    },
    stats: createDefaultStats(),
    lastRoundResult: null,
    round: null
  };
}

export function startRound(state, options = {}) {
  const tiles = createTiles();
  const wallState = buildWall(tiles, options.random);
  const players = createPlayers();
  let wall = wallState.wall;

  for (let handIndex = 0; handIndex < 13; handIndex += 1) {
    for (const player of players) {
      const tile = wall[0];
      wall = wall.slice(1);
      player.hand = [...player.hand, tile];
    }
  }

  let round = {
    id: `round-${Date.now()}`,
    phase: "setup",
    roundWind: "east",
    handNumber: 1,
    honba: 0,
    riichiSticks: 0,
    dealerIndex: 0,
    currentPlayerIndex: 0,
    wall,
    deadWall: wallState.deadWall,
    doraIndicators: wallState.doraIndicators,
    lastDraw: {
      playerId: null,
      tile: null
    },
    lastDiscard: {
      playerId: null,
      tile: null
    },
    turnCount: 0,
    endReason: null,
    winningResult: null,
    players
  };

  const drawResult = drawFromWall(round);
  round = drawResult.round;
  round.players = addTileToPlayer(round.players, round.dealerIndex, drawResult.tile);
  round.phase = "discard";
  round.lastDraw = {
    playerId: round.dealerIndex,
    tile: drawResult.tile
  };

  const nextState = {
    ...state,
    stats: {
      ...state.stats,
      roundsStarted: state.stats.roundsStarted + 1,
      lastPlayedAt: new Date().toISOString()
    },
    round
  };

  saveStats(nextState.stats, options.storage);
  return nextState;
}

export function addTileToPlayer(players, playerId, tile) {
  return players.map((player) => {
    if (player.id !== playerId || !tile) {
      return player;
    }

    return {
      ...player,
      hand: [...player.hand, tile]
    };
  });
}
