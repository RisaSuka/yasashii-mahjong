import { createInitialGameState } from "../src/game/round.js";
import {
  canDeclareTsumo,
  canCpuDeclareTsumo,
  dispatchAction,
  resolveCpuChiAfterDiscard,
  resolveCpuPonAfterDiscard,
  resolveCpuRonAfterDiscard
} from "../src/game/actions.js";

const ROUND_COUNT = Number(process.env.CPU_CALL_FREQUENCY_ROUNDS || 40);
const STEP_LIMIT = Number(process.env.CPU_CALL_FREQUENCY_STEP_LIMIT || 600);
const SEED = Number(process.env.CPU_CALL_FREQUENCY_SEED || 4401);

function main() {
  const random = createSeededRandom(SEED);
  const summary = createSummary();

  for (let roundIndex = 0; roundIndex < ROUND_COUNT; roundIndex += 1) {
    let state = dispatchAction(createInitialGameState(), {
      type: "START_MATCH",
      random
    });
    const beforeRoundCalls = countCpuMeldsByType(state);
    let steps = 0;

    while (state.round?.phase !== "ended" && steps < STEP_LIMIT) {
      steps += 1;
      state = stepRound(state, random, summary);
    }

    const afterRoundCalls = countCpuMeldsByType(state);
    summary.rounds += 1;
    summary.totalSteps += steps;
    summary.cpuPonCalls += Math.max(0, afterRoundCalls.pon - beforeRoundCalls.pon);
    summary.cpuChiCalls += Math.max(0, afterRoundCalls.chi - beforeRoundCalls.chi);
    summary.maxCpuCallsInRound = Math.max(
      summary.maxCpuCallsInRound,
      afterRoundCalls.pon + afterRoundCalls.chi - beforeRoundCalls.pon - beforeRoundCalls.chi
    );

    for (const player of state.round?.players || []) {
      if (player.type !== "cpu") {
        continue;
      }
      const counts = countPlayerMeldsByType(player);
      const playerSummary = summary.byCpu[String(player.id)];
      playerSummary.pon += counts.pon;
      playerSummary.chi += counts.chi;
      playerSummary.total += counts.pon + counts.chi;
    }

    recordOutcome(state, summary);
  }

  summary.cpuCallsPerRound = roundTo(summary.cpuCalls / Math.max(1, summary.rounds), 2);
  summary.cpuPonPerRound = roundTo(summary.cpuPonCalls / Math.max(1, summary.rounds), 2);
  summary.cpuChiPerRound = roundTo(summary.cpuChiCalls / Math.max(1, summary.rounds), 2);
  summary.averageSteps = roundTo(summary.totalSteps / Math.max(1, summary.rounds), 1);

  console.log(JSON.stringify(summary, null, 2));

  if (summary.rounds !== ROUND_COUNT || summary.stalledRounds > 0) {
    process.exitCode = 1;
  }
}

function stepRound(state, random, summary) {
  if (!state.round || state.round.phase === "ended") {
    return state;
  }

  if (state.round.phase === "draw") {
    const advanced = dispatchAction(state, { type: "ADVANCE_TURN" });
    const player = advanced.round?.players?.[advanced.round.currentPlayerIndex];
    if (!player) {
      return advanced;
    }
    return dispatchAction(advanced, { type: "DRAW_TILE", playerId: player.id });
  }

  if (state.round.phase === "reaction") {
    return dispatchAction(state, { type: "SKIP_RON" });
  }

  if (state.round.phase !== "discard") {
    return state;
  }

  const player = state.round.players[state.round.currentPlayerIndex];
  if (!player) {
    return state;
  }

  if (player.type === "cpu" && canCpuDeclareTsumo(state, player.id)) {
    return dispatchAction(state, { type: "DECLARE_TSUMO", playerId: player.id });
  }

  if (player.type === "human" && canDeclareTsumo(state, player.id)) {
    return dispatchAction(state, { type: "DECLARE_TSUMO", playerId: player.id });
  }

  const discarded = player.type === "cpu"
    ? dispatchAction(state, { type: "CPU_DISCARD", random })
    : discardHumanTile(state, player);

  return processCpuReactions(discarded, random, summary);
}

function processCpuReactions(state, random, summary) {
  let current = state;
  for (let depth = 0; depth < 4; depth += 1) {
    const ron = resolveCpuRonAfterDiscard(current);
    if (ron !== current) {
      return ron;
    }

    const beforePon = countCpuMeldsByType(current);
    const pon = resolveCpuPonAfterDiscard(current, random);
    const afterPon = countCpuMeldsByType(pon);
    if (pon !== current) {
      recordCallDelta(summary, beforePon, afterPon);
      current = pon;
      continue;
    }

    const beforeChi = countCpuMeldsByType(current);
    const chi = resolveCpuChiAfterDiscard(current, random);
    const afterChi = countCpuMeldsByType(chi);
    if (chi !== current) {
      recordCallDelta(summary, beforeChi, afterChi);
      current = chi;
      continue;
    }

    return current;
  }

  return current;
}

function discardHumanTile(state, player) {
  const tile = player.hand[player.hand.length - 1] || player.hand[0];
  if (!tile) {
    return state;
  }
  return dispatchAction(state, {
    type: "DISCARD_TILE",
    playerId: player.id,
    tileId: tile.id
  });
}

function recordCallDelta(summary, before, after) {
  const pon = Math.max(0, after.pon - before.pon);
  const chi = Math.max(0, after.chi - before.chi);
  summary.cpuCalls += pon + chi;
  summary.cpuPonDetectedDuringFlow += pon;
  summary.cpuChiDetectedDuringFlow += chi;
}

function recordOutcome(state, summary) {
  if (state.round?.phase !== "ended") {
    summary.stalledRounds += 1;
    return;
  }

  if (state.round.endReason === "exhaustive-draw") {
    summary.exhaustiveDraws += 1;
    return;
  }

  const winnerId = state.round.winningResult?.winnerId;
  if (winnerId === 0) {
    summary.humanWins += 1;
    return;
  }

  if (winnerId !== undefined && winnerId !== null) {
    summary.cpuWins += 1;
    const winner = state.round.players.find((player) => player.id === winnerId);
    if ((winner?.melds || []).length > 0) {
      summary.cpuWinsAfterCall += 1;
    }
  }
}

function createSummary() {
  return {
    seed: SEED,
    targetRounds: ROUND_COUNT,
    rounds: 0,
    stalledRounds: 0,
    totalSteps: 0,
    averageSteps: 0,
    cpuCalls: 0,
    cpuCallsPerRound: 0,
    cpuPonCalls: 0,
    cpuPonPerRound: 0,
    cpuChiCalls: 0,
    cpuChiPerRound: 0,
    cpuPonDetectedDuringFlow: 0,
    cpuChiDetectedDuringFlow: 0,
    maxCpuCallsInRound: 0,
    cpuWinsAfterCall: 0,
    exhaustiveDraws: 0,
    humanWins: 0,
    cpuWins: 0,
    byCpu: {
      1: { pon: 0, chi: 0, total: 0 },
      2: { pon: 0, chi: 0, total: 0 },
      3: { pon: 0, chi: 0, total: 0 }
    }
  };
}

function countCpuMeldsByType(state) {
  return (state.round?.players || [])
    .filter((player) => player.type === "cpu")
    .reduce((counts, player) => {
      const playerCounts = countPlayerMeldsByType(player);
      counts.pon += playerCounts.pon;
      counts.chi += playerCounts.chi;
      return counts;
    }, { pon: 0, chi: 0 });
}

function countPlayerMeldsByType(player) {
  return (player.melds || []).reduce((counts, meld) => {
    if (meld.type === "pon") {
      counts.pon += 1;
    }
    if (meld.type === "chi") {
      counts.chi += 1;
    }
    return counts;
  }, { pon: 0, chi: 0 });
}

function createSeededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function roundTo(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

main();
