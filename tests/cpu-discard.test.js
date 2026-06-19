import { assertEqual, assertTrue, loadModule, test } from "./test.js";

export function registerCpuDiscardTests() {
  test("CPU DISCARD: chooseCpuDiscardCandidate returns an evaluated tile id", async () => {
    const { chooseCpuDiscardCandidate } = await loadCpuModule(["chooseCpuDiscardCandidate"]);
    const player = createCpuPlayer("m1 m5 m5 p2 p3 p4 s4 s5 s6 m8 m9 z1 z2 z2");
    const candidate = chooseCpuDiscardCandidate(player, {}, () => 0);

    assertTrue(Boolean(candidate?.tileId), "CPU candidate should include tileId");
    assertTrue(Array.isArray(candidate.reasons) && candidate.reasons.length > 0, "CPU candidate should include reasons");
  });

  test("CPU DISCARD: isolated terminal is selected ahead of pair with best rng", async () => {
    const { chooseCpuDiscard } = await loadCpuModule(["chooseCpuDiscard"]);
    const { evaluateDiscardCandidates } = await loadModule("../src/game/advice/discard-advice.js", [
      "evaluateDiscardCandidates"
    ]);
    const player = createCpuPlayer("m1 m5 m5 p2 p3 p4 s4 s5 s6 m8 m9 z2 z2 z5");
    const expectedBest = evaluateDiscardCandidates(player.hand)[0];
    const tile = chooseCpuDiscard(player, {}, () => 0);

    assertEqual(tile.id, expectedBest.tileId, "Best CPU candidate should match evaluator output");
    assertEqual(tile.id.startsWith("m5"), false, "CPU should avoid discarding a pair before weaker candidates");
  });

  test("CPU DISCARD: weighted rng can choose the second evaluated candidate", async () => {
    const { chooseCpuDiscardCandidate } = await loadCpuModule(["chooseCpuDiscardCandidate"]);
    const { evaluateDiscardCandidates } = await loadModule("../src/game/advice/discard-advice.js", [
      "evaluateDiscardCandidates"
    ]);
    const player = createCpuPlayer("m1 p9 z1 p2 p3 p4 s4 s5 s6 m5 m5 z2 z2 z5");
    const expectedSecond = evaluateDiscardCandidates(player.hand)[1];
    const candidate = chooseCpuDiscardCandidate(player, {}, () => 0.7);

    assertEqual(candidate.tileId, expectedSecond.tileId, "CPU weighted rng should be deterministic for tests");
  });

  test("CPU DISCARD: invalid evaluated candidates still fall back safely", async () => {
    const { chooseCpuDiscardCandidate } = await loadCpuModule(["chooseCpuDiscardCandidate"]);
    const player = {
      id: 1,
      type: "cpu",
      hand: [{ id: "unknown-0", suit: "x", rank: 0 }]
    };
    const candidate = chooseCpuDiscardCandidate(player, {}, () => 0);

    assertEqual(candidate.tileId, "unknown-0", "CPU fallback should still return a discardable tile id");
    assertTrue(candidate.tags.includes("fallback"), "CPU fallback candidate should be marked");
  });

  test("CPU DISCARD: action uses evaluator-selected tile", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const { evaluateDiscardCandidates } = await loadModule("../src/game/advice/discard-advice.js", [
      "evaluateDiscardCandidates"
    ]);
    const state = await startedCpuState();
    const cpu = state.round.players[1];
    cpu.hand = tiles("m1 m5 m5 p2 p3 p4 s4 s5 s6 m8 m9 z2 z2 z5");
    const expectedBest = evaluateDiscardCandidates(cpu.hand, {
      player: cpu,
      currentPlayerId: cpu.id,
      players: state.round.players,
      round: state.round,
      match: state.match,
      doraIndicators: state.round.doraIndicators,
      discards: state.round.players.map((player) => player.discards)
    })[0];
    const nextState = dispatchAction(state, { type: "CPU_DISCARD", random: () => 0 });
    const nextCpu = nextState.round.players[1];

    assertEqual(nextState.round.lastDiscard.tile.id, expectedBest.tileId, "CPU action should discard evaluator candidate");
    assertEqual(nextCpu.hand.length, cpu.hand.length - 1, "CPU action should remove one tile from hand");
    assertEqual(nextCpu.discards.at(-1).id, expectedBest.tileId, "CPU discard pile should store the evaluator candidate");
  });

  test("CPU DISCARD: evaluator protects completed sequences for CPU choices", async () => {
    const { chooseCpuDiscardCandidate } = await loadCpuModule(["chooseCpuDiscardCandidate"]);
    const player = createCpuPlayer("p1 p2 p3 m2 m3 m4 s4 s5 s6 p7 p8 z1 z2 z3");
    const candidate = chooseCpuDiscardCandidate(player, {}, () => 0);

    assertTrue(!candidate.tileId.startsWith("p1"), "CPU should avoid breaking 1-2-3 sequence at the edge");
    assertTrue(!candidate.tileId.startsWith("p2"), "CPU should avoid breaking 1-2-3 sequence in the middle");
    assertTrue(!candidate.tileId.startsWith("p3"), "CPU should avoid breaking 1-2-3 sequence at the edge");
  });

  test("CPU DISCARD: evaluator protects yakuhai pairs in pair-heavy hands", async () => {
    const { chooseCpuDiscardCandidate } = await loadCpuModule(["chooseCpuDiscardCandidate"]);
    const player = createCpuPlayer("m4 m4 m7 m7 s3 s4 s5 s7 s7 s8 s9 s9 z6 z6");
    const candidate = chooseCpuDiscardCandidate(player, {}, () => 0);

    assertTrue(!candidate.tileId.startsWith("z6"), "CPU should avoid discarding a yakuhai pair when other candidates exist");
  });

  test("CPU DISCARD: action keeps round moving into draw phase", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const state = await startedCpuState();
    state.round.players[1].hand = tiles("m1 m5 m5 p2 p3 p4 s4 s5 s6 m8 m9 z2 z2 z5");
    const nextState = dispatchAction(state, { type: "CPU_DISCARD", random: () => 0 });

    assertEqual(nextState.round.phase, "draw", "CPU discard should leave the round ready for draw progression");
    assertEqual(nextState.round.currentPlayerIndex, 1, "CPU discard should not skip turn advancement rules");
  });
}

async function loadCpuModule(extraExports = []) {
  return loadModule("../src/game/cpu/random-cpu.js", extraExports);
}

async function startedCpuState() {
  const { createInitialGameState, startRound } = await loadModule("../src/game/round.js", [
    "createInitialGameState",
    "startRound"
  ]);
  const state = startRound(createInitialGameState());

  return {
    ...state,
    round: {
      ...state.round,
      currentPlayerIndex: 1,
      phase: "discard"
    }
  };
}

function createCpuPlayer(pattern) {
  return {
    id: 1,
    type: "cpu",
    hand: tiles(pattern),
    discards: []
  };
}

function tiles(pattern) {
  const counts = new Map();

  return pattern
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const copy = counts.get(token) || 0;
      counts.set(token, copy + 1);
      return {
        id: `${token}-${copy}`,
        suit: token[0],
        rank: Number(token.slice(1)),
        copy,
        red: false
      };
    });
}
