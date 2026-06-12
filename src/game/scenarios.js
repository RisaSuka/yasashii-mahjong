import { createPlayers } from "./player.js";
import { createTiles } from "./tiles.js";
import { createInitialGameState } from "./round.js";

const SCENARIO_ALIASES = {
  "human-tsumo-standard": "human-tsumo-ready",
  "cpu-tsumo-standard": "cpu-tsumo-ready",
  "ron-ready-human-ron-on-cpu-discard": "ron-ready-basic"
};

const SCENARIOS = {
  "human-tsumo-ready": {
    name: "human-tsumo-ready",
    description: "Human player has a standard winning 14-tile hand.",
    phase: "discard",
    currentPlayerIndex: 0,
    hands: {
      0: "m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1 z1"
    },
    discards: {}
  },
  "cpu-tsumo-ready": {
    name: "cpu-tsumo-ready",
    description: "CPU player 1 has a standard winning 14-tile hand.",
    phase: "discard",
    currentPlayerIndex: 1,
    hands: {
      1: "m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1 z1"
    },
    discards: {}
  },
  "ron-ready-basic": {
    name: "ron-ready-basic",
    description: "Future ron setup: CPU 1 has discarded a tile that completes the human pair.",
    phase: "discard",
    currentPlayerIndex: 2,
    hands: {
      0: "m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1"
    },
    discards: {
      1: "z1"
    },
    lastDiscard: {
      playerId: 1,
      tile: "z1"
    }
  },
  "ron-ready-tanyao": {
    name: "ron-ready-tanyao",
    description: "Human player can ron on a CPU discard with tanyao.",
    phase: "discard",
    currentPlayerIndex: 2,
    hands: {
      0: "m2 m3 m4 m4 m5 m6 p2 p3 p4 p6 p7 p8 s5"
    },
    discards: {
      1: "s5"
    },
    lastDiscard: {
      playerId: 1,
      tile: "s5"
    }
  }
};

export function listScenarios() {
  return Object.values(SCENARIOS).map((scenario) => ({
    name: scenario.name,
    description: scenario.description
  }));
}

export function createScenarioState(name, options = {}) {
  const scenario = getScenario(name);

  if (!scenario) {
    throw new Error(`Unknown scenario: ${name}`);
  }

  const pool = createTilePool();
  const players = createPlayers();

  for (const player of players) {
    const handPattern = scenario.hands[player.id];
    const discardPattern = scenario.discards[player.id];

    player.hand = handPattern ? takePattern(pool, handPattern) : [];
    player.discards = discardPattern ? takePattern(pool, discardPattern) : [];
  }

  for (const player of players) {
    if (!scenario.hands[player.id]) {
      player.hand = takeNextTiles(pool, getTargetHandSize(scenario, player.id));
    }
  }

  const deadWall = takeNextTiles(pool, 14);
  const wall = takeNextTiles(pool, pool.length);
  const currentPlayerIndex = options.currentPlayerIndex ?? scenario.currentPlayerIndex;
  const phase = options.phase ?? scenario.phase;
  const lastDiscard = createLastDiscard(scenario, players);
  const lastDraw = createLastDraw(players, currentPlayerIndex);

  return {
    ...createInitialGameState(),
    round: {
      id: `scenario-${scenario.name}`,
      phase,
      roundWind: "east",
      handNumber: 1,
      honba: 0,
      riichiSticks: 0,
      dealerIndex: 0,
      currentPlayerIndex,
      wall,
      deadWall,
      doraIndicators: deadWall.length > 0 ? [deadWall[0]] : [],
      lastDraw,
      lastDiscard,
      turnCount: 0,
      endReason: null,
      winningResult: null,
      players
    }
  };
}

function getScenario(name) {
  const canonicalName = SCENARIO_ALIASES[name] || name;
  return SCENARIOS[canonicalName] || null;
}

function createTilePool() {
  return createTiles().map((tile) => ({ ...tile }));
}

function getTargetHandSize(scenario, playerId) {
  return scenario.currentPlayerIndex === playerId && scenario.phase === "discard" ? 14 : 13;
}

function takePattern(pool, pattern) {
  return pattern
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => takeTile(pool, token));
}

function takeTile(pool, token) {
  const suit = token[0];
  const rank = Number(token.slice(1));
  const index = pool.findIndex((tile) => tile.suit === suit && tile.rank === rank);

  if (index < 0) {
    throw new Error(`Scenario tile is unavailable: ${token}`);
  }

  const [tile] = pool.splice(index, 1);
  return tile;
}

function takeNextTiles(pool, count) {
  if (count > pool.length) {
    throw new Error("Scenario does not have enough tiles");
  }

  return pool.splice(0, count);
}

function createLastDiscard(scenario, players) {
  if (!scenario.lastDiscard) {
    return {
      playerId: null,
      tile: null
    };
  }

  const player = players.find((candidate) => candidate.id === scenario.lastDiscard.playerId);
  const tile = player?.discards.find((candidate) => getTileToken(candidate) === scenario.lastDiscard.tile) || null;

  return {
    playerId: scenario.lastDiscard.playerId,
    tile
  };
}

function createLastDraw(players, currentPlayerIndex) {
  const player = players[currentPlayerIndex];

  return {
    playerId: player?.id ?? null,
    tile: player?.hand[player.hand.length - 1] ?? null
  };
}

function getTileToken(tile) {
  return `${tile.suit}${tile.rank}`;
}
