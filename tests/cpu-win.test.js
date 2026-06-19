import { assertEqual, assertTrue, loadModule, test } from "./test.js";

export function registerCpuWinTests() {
  test("CPU WIN: CPU can declare tsumo from yakuhai scenario", async () => {
    const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
    const { canCpuDeclareTsumo, dispatchAction } = await loadModule("../src/game/actions.js", ["canCpuDeclareTsumo", "dispatchAction"]);
    const state = createScenarioState("cpu-tsumo-ready-yakuhai");

    assertEqual(canCpuDeclareTsumo(state, 1), true, "CPU yakuhai tsumo should be available");

    const nextState = dispatchAction(state, { type: "DECLARE_TSUMO", playerId: 1 });

    assertEqual(nextState.round.phase, "ended", "CPU tsumo should end the round");
    assertEqual(nextState.round.winningResult?.winnerId, 1, "CPU should be stored as winner");
    assertEqual(nextState.round.winningResult?.winType, "tsumo", "Win type should be tsumo");
    assertTrue(
      nextState.round.winningResult?.yakuResult?.some((yaku) => yaku.id === "yakuhai"),
      "CPU tsumo should store yaku result"
    );
  });

  test("CPU WIN: CPU ron winner is found from human discard", async () => {
    const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
    const { findCpuRonWinner } = await loadModule("../src/game/actions.js", ["findCpuRonWinner"]);
    const state = createScenarioState("cpu-ron-ready-yakuhai");
    const cpuRon = findCpuRonWinner(state);

    assertEqual(cpuRon?.player?.id, 1, "CPU 1 should be found as ron winner");
    assertEqual(cpuRon?.fromPlayerId, 0, "Human discard should be stored as ron source");
    assertTrue(cpuRon?.yakuResult?.some((yaku) => yaku.id === "yakuhai"), "CPU ron should have yakuhai");
  });

  test("CPU WIN: resolving CPU ron ends the round", async () => {
    const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
    const { resolveCpuRonAfterDiscard } = await loadModule("../src/game/actions.js", ["resolveCpuRonAfterDiscard"]);
    const state = createScenarioState("cpu-ron-ready-yakuhai");
    const nextState = resolveCpuRonAfterDiscard(state);

    assertEqual(nextState.round.phase, "ended", "CPU ron should end the round");
    assertEqual(nextState.round.endReason, "win", "CPU ron should use win end reason");
    assertEqual(nextState.round.winningResult?.winnerId, 1, "CPU winner should be stored");
    assertEqual(nextState.round.winningResult?.winType, "ron", "CPU win type should be ron");
    assertEqual(nextState.round.winningResult?.fromPlayerId, 0, "Human discarder should be stored");
    assertEqual(nextState.round.winningResult?.loserId, 0, "Human discarder should be stored as loser");
  });

  test("CPU WIN: CPU ignores no-yaku ron shape", async () => {
    const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
    const { findCpuRonWinner, resolveCpuRonAfterDiscard } = await loadModule("../src/game/actions.js", [
      "findCpuRonWinner",
      "resolveCpuRonAfterDiscard"
    ]);
    const state = createScenarioState("cpu-no-yaku-win-shape");
    const nextState = resolveCpuRonAfterDiscard(state);

    assertEqual(findCpuRonWinner(state), null, "No-yaku CPU shape should not become a ron winner");
    assertEqual(nextState.round.phase, state.round.phase, "No-yaku CPU shape should not end the round");
    assertEqual(nextState.round.winningResult ?? null, null, "No-yaku CPU shape should not set a win");
  });

  test("CPU WIN: CPU tsumo result is stored in next round history", async () => {
    const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const state = withTonpuuMatch(createScenarioState("cpu-tsumo-ready-yakuhai"));
    const wonState = dispatchAction(state, { type: "DECLARE_TSUMO", playerId: 1 });
    const nextState = dispatchAction(wonState, { type: "START_NEXT_ROUND", random: () => 0 });

    assertEqual(nextState.lastRoundResult?.winnerId, 1, "Last round result should store CPU tsumo winner");
    assertEqual(nextState.lastRoundResult?.winType, "tsumo", "Last round result should store tsumo");
    assertEqual(nextState.match?.roundHistory?.at(-1)?.winnerId, 1, "Round history should store CPU winner");
    assertEqual(nextState.match?.roundHistory?.at(-1)?.winType, "tsumo", "Round history should store CPU tsumo");
  });

  test("CPU WIN: CPU ron result is stored in next round history", async () => {
    const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
    const { dispatchAction, resolveCpuRonAfterDiscard } = await loadModule("../src/game/actions.js", [
      "dispatchAction",
      "resolveCpuRonAfterDiscard"
    ]);
    const state = withTonpuuMatch(createScenarioState("cpu-ron-ready-yakuhai"));
    const wonState = resolveCpuRonAfterDiscard(state);
    const nextState = dispatchAction(wonState, { type: "START_NEXT_ROUND", random: () => 0 });

    assertEqual(nextState.lastRoundResult?.winnerId, 1, "Last round result should store CPU ron winner");
    assertEqual(nextState.lastRoundResult?.winType, "ron", "Last round result should store ron");
    assertEqual(nextState.lastRoundResult?.loserId, 0, "Last round result should store ron loser");
    assertEqual(nextState.match?.roundHistory?.at(-1)?.winnerId, 1, "Round history should store CPU winner");
    assertEqual(nextState.match?.roundHistory?.at(-1)?.winType, "ron", "Round history should store CPU ron");
  });

  test("CPU WIN: scenarios are listed for manual checks", async () => {
    const { listScenarios } = await loadModule("../src/game/scenarios.js", ["listScenarios"]);
    const names = listScenarios().map((scenario) => scenario.name);

    assertTrue(names.includes("cpu-tsumo-ready-yakuhai"), "CPU tsumo scenario should be listed");
    assertTrue(names.includes("cpu-ron-ready-yakuhai"), "CPU ron scenario should be listed");
    assertTrue(names.includes("cpu-no-yaku-win-shape"), "CPU no-yaku scenario should be listed");
  });
}

function withTonpuuMatch(state) {
  return {
    ...state,
    match: {
      type: "tonpuu",
      phase: "playing",
      status: "playing",
      roundWind: "east",
      handNumber: 1,
      dealerIndex: 0,
      maxHands: 4,
      scores: [25000, 25000, 25000, 25000],
      roundHistory: []
    },
    round: {
      ...state.round,
      roundWind: "east",
      handNumber: 1,
      dealerIndex: 0
    }
  };
}
