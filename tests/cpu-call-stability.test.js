import { assertEqual, assertTrue, loadModule, test } from "./test.js";

export function registerCpuCallStabilityTests() {
  test("CPU CALL: pon and chi immediately discard and continue to the next player", async () => {
    const ponState = await scenarioState("cpu-pon-then-discard-flow");
    const chiState = await scenarioState("cpu-chi-then-discard-flow");
    const { dispatchAction, resolveCpuPonAfterDiscard, resolveCpuChiAfterDiscard } = await loadActions([
      "dispatchAction",
      "resolveCpuPonAfterDiscard",
      "resolveCpuChiAfterDiscard"
    ]);

    assertCallDiscardThenNextDraw(resolveCpuPonAfterDiscard(ponState, () => 0), dispatchAction, "pon");
    assertCallDiscardThenNextDraw(resolveCpuChiAfterDiscard(chiState, () => 0), dispatchAction, "chi");
  });

  test("CPU CALL: open call flow can continue to exhaustive draw", async () => {
    const state = await scenarioState("cpu-pon-then-discard-flow");
    const { dispatchAction, resolveCpuPonAfterDiscard } = await loadActions([
      "dispatchAction",
      "resolveCpuPonAfterDiscard"
    ]);
    const called = resolveCpuPonAfterDiscard({
      ...state,
      round: {
        ...state.round,
        wall: []
      }
    }, () => 0);
    const advanced = dispatchAction(called, { type: "ADVANCE_TURN" });
    const drawn = dispatchAction(advanced, { type: "DRAW_TILE", playerId: advanced.round.currentPlayerIndex });

    assertEqual(drawn.round.phase, "ended", "Empty wall after CPU call should end in exhaustive draw");
    assertEqual(drawn.round.endReason, "exhaustive-draw", "CPU call flow should not block exhaustive draw");
  });

  test("CPU CALL: open yakuhai can tsumo and ron without menzen or riichi yaku", async () => {
    const tsumoState = await scenarioState("cpu-open-yakuhai-tsumo");
    const ronState = await scenarioState("cpu-open-yakuhai-ron");
    const { canCpuDeclareTsumo, dispatchAction, resolveCpuRonAfterDiscard } = await loadActions([
      "canCpuDeclareTsumo",
      "dispatchAction",
      "resolveCpuRonAfterDiscard"
    ]);

    assertEqual(canCpuDeclareTsumo(tsumoState, 1), true, "Open yakuhai CPU hand should be able to tsumo");

    const tsumo = dispatchAction(tsumoState, { type: "DECLARE_TSUMO", playerId: 1 });
    const ron = resolveCpuRonAfterDiscard(ronState);

    assertWinYaku(tsumo, "tsumo", "yakuhai");
    assertWinYaku(ron, "ron", "yakuhai");
    assertNoClosedOnlyYaku(tsumo);
    assertNoClosedOnlyYaku(ron);
  });

  test("CPU CALL: open tanyao can tsumo and ron, while open no-yaku is rejected", async () => {
    const tsumoState = await scenarioState("cpu-open-tanyao-tsumo");
    const ronState = await scenarioState("cpu-open-tanyao-ron");
    const noYakuState = await scenarioState("cpu-open-no-yaku-shape");
    const { canCpuDeclareTsumo, dispatchAction, resolveCpuRonAfterDiscard } = await loadActions([
      "canCpuDeclareTsumo",
      "dispatchAction",
      "resolveCpuRonAfterDiscard"
    ]);

    const tsumo = dispatchAction(tsumoState, { type: "DECLARE_TSUMO", playerId: 1 });
    const ron = resolveCpuRonAfterDiscard(ronState);
    const noYaku = dispatchAction(noYakuState, { type: "DECLARE_TSUMO", playerId: 1 });

    assertEqual(canCpuDeclareTsumo(noYakuState, 1), false, "Open no-yaku CPU shape should not be allowed to tsumo");
    assertWinYaku(tsumo, "tsumo", "tanyao");
    assertWinYaku(ron, "ron", "tanyao");
    assertTrue(noYaku.round.winningResult == null, "Open no-yaku tsumo should not create a winning result");
    assertEqual(noYaku.round.lastActionResult?.reason, "no-yaku", "Open no-yaku tsumo should keep guidance");
    assertNoClosedOnlyYaku(tsumo);
    assertNoClosedOnlyYaku(ron);
  });

  test("CPU CALL: open CPU hand cannot riichi and riichi CPU cannot call", async () => {
    const openState = await scenarioState("cpu-call-riichi-disabled");
    const ponRiichi = await scenarioState("cpu-pon-riichi-blocked");
    const chiRiichi = await scenarioState("cpu-chi-riichi-blocked");
    const { canCpuCallPon, canCpuCallChi, canCpuDeclareRiichi, getCpuRiichiDiscardOptions } = await loadActions([
      "canCpuCallPon",
      "canCpuCallChi",
      "canCpuDeclareRiichi",
      "getCpuRiichiDiscardOptions"
    ]);

    assertEqual(canCpuDeclareRiichi(openState, 1), false, "Open CPU hand should not be able to riichi");
    assertEqual(getCpuRiichiDiscardOptions(openState, 1).length, 0, "Open CPU hand should expose no riichi discard options");
    assertEqual(canCpuCallPon(ponRiichi, 1), false, "Riichi CPU should not pon");
    assertEqual(canCpuCallChi(chiRiichi, 1), false, "Riichi CPU should not chi");
  });

  test("CPU CALL: reaction priority keeps human choice, CPU ron, pon, then chi", async () => {
    const humanReactionState = makeCpuPonPossibleForHumanReaction(await scenarioState("human-pon-ready-yakuhai"));
    const cpuRonState = await scenarioState("cpu-ron-ready-yakuhai");
    const cpuPonState = await scenarioState("cpu-pon-priority-over-chi");
    const cpuChiState = await scenarioState("cpu-chi-ready-tanyao");
    const {
      resolveCpuRonAfterDiscard,
      resolveCpuPonAfterDiscard,
      resolveCpuChiAfterDiscard
    } = await loadActions([
      "resolveCpuRonAfterDiscard",
      "resolveCpuPonAfterDiscard",
      "resolveCpuChiAfterDiscard"
    ]);

    assertEqual(resolveCpuPonAfterDiscard(humanReactionState, () => 0), humanReactionState, "Human call reaction should block CPU pon");
    assertEqual(resolveCpuChiAfterDiscard(humanReactionState, () => 0), humanReactionState, "Human call reaction should block CPU chi");

    const ron = resolveCpuRonAfterDiscard(cpuRonState);
    assertEqual(ron.round.winningResult?.winType, "ron", "CPU ron should resolve before calls");
    assertEqual(resolveCpuPonAfterDiscard(cpuRonState, () => 0), cpuRonState, "CPU pon should not run when CPU ron is available");

    const pon = resolveCpuPonAfterDiscard(cpuPonState, () => 0);
    assertEqual(pon.round.players[1].melds[0].type, "pon", "CPU pon should win priority over CPU chi");
    assertEqual(resolveCpuChiAfterDiscard(cpuPonState, () => 0), cpuPonState, "CPU chi should not run while a CPU pon opportunity exists");

    const chi = resolveCpuChiAfterDiscard(cpuChiState, () => 0);
    assertEqual(chi.round.players[1].melds[0].type, "chi", "CPU chi should run after higher-priority reactions are absent");
  });

  test("CPU CALL: discard evaluator remains available after pon and chi", async () => {
    const ponState = await scenarioState("cpu-pon-then-discard-flow");
    const chiState = await scenarioState("cpu-chi-then-discard-flow");
    const { resolveCpuPonAfterDiscard, resolveCpuChiAfterDiscard } = await loadActions([
      "resolveCpuPonAfterDiscard",
      "resolveCpuChiAfterDiscard"
    ]);
    const { evaluateDiscardCandidates } = await loadModule("../src/game/advice/discard-advice.js", ["evaluateDiscardCandidates"]);
    const { chooseCpuDiscard } = await loadModule("../src/game/cpu/random-cpu.js", ["chooseCpuDiscard"]);

    assertPostCallDiscardCandidate(resolveCpuPonAfterDiscard(ponState, () => 0), evaluateDiscardCandidates, chooseCpuDiscard, "pon");
    assertPostCallDiscardCandidate(resolveCpuChiAfterDiscard(chiState, () => 0), evaluateDiscardCandidates, chooseCpuDiscard, "chi");
  });

  test("CPU CALL: next round clears all CPU open melds", async () => {
    const state = await scenarioState("cpu-call-next-round-clears-melds");
    const { dispatchAction } = await loadActions(["dispatchAction"]);
    const next = dispatchAction(state, { type: "START_NEXT_ROUND" });

    assertTrue(next.round.players.every((player) => Array.isArray(player.melds)), "Next round players should have meld arrays");
    assertTrue(next.round.players.every((player) => player.melds.length === 0), "Next round should clear CPU melds");
  });

  test("CPU CALL UI: multiple CPU pon and chi melds render in four-direction lanes", async () => {
    const state = await scenarioState("cpu-open-multiple-melds-layout");
    const html = await renderState(state);

    assertTrue(html.includes("table-meld-right"), "CPU1 right meld lane should render");
    assertTrue(html.includes("table-meld-top"), "CPU2 top meld lane should render");
    assertTrue(html.includes("table-meld-left"), "CPU3 left meld lane should render");
    assertTrue(countOccurrences(html, "meld-pon") >= 2, "CPU pon melds should render");
    assertTrue(countOccurrences(html, "meld-chi") >= 2, "CPU chi melds should render");
    assertTrue(countOccurrences(html, "meld-tile") >= 12, "Multiple CPU meld tiles should render");
  });

  test("CPU CALL: stability scenarios are listed for manual checks", async () => {
    const { listScenarios } = await loadModule("../src/game/scenarios.js", ["listScenarios"]);
    const names = listScenarios().map((scenario) => scenario.name);

    for (const name of [
      "cpu-open-yakuhai-tsumo",
      "cpu-open-yakuhai-ron",
      "cpu-open-tanyao-tsumo",
      "cpu-open-tanyao-ron",
      "cpu-open-no-yaku-shape",
      "cpu-pon-then-discard-flow",
      "cpu-chi-then-discard-flow",
      "cpu-open-multiple-melds-layout",
      "cpu-call-next-round-clears-melds",
      "cpu-call-riichi-disabled"
    ]) {
      assertTrue(names.includes(name), `${name} scenario should be listed`);
    }
  });
}

function assertCallDiscardThenNextDraw(calledState, dispatchAction, callType) {
  const cpu = calledState.round.players[1];

  assertEqual(cpu.melds.at(-1)?.type, callType, `CPU ${callType} should add the expected meld`);
  assertEqual(calledState.round.phase, "draw", `CPU ${callType} immediate discard should return to draw phase`);
  assertEqual(calledState.round.currentPlayerIndex, 1, `CPU ${callType} should leave current index on the caller before advance`);
  assertEqual(calledState.round.lastDiscard?.playerId, 1, `CPU ${callType} should discard after calling`);

  const advanced = dispatchAction(calledState, { type: "ADVANCE_TURN" });
  const nextPlayer = advanced.round.players[advanced.round.currentPlayerIndex];
  const drawn = dispatchAction(advanced, { type: "DRAW_TILE", playerId: nextPlayer.id });

  assertEqual(advanced.round.currentPlayerIndex, 2, `CPU ${callType} should advance to the next player`);
  assertEqual(drawn.round.phase, "discard", `Next player should draw after CPU ${callType} flow`);
  assertEqual(drawn.round.lastDraw?.playerId, 2, `CPU ${callType} flow should draw for the next player`);
}

function assertWinYaku(state, winType, expectedYakuId) {
  const result = state.round.winningResult;
  const yakuIds = (result?.yakuResult || []).map((entry) => entry.id);

  assertEqual(state.round.phase, "ended", `${winType} should end the hand`);
  assertEqual(result?.winnerId, 1, `${winType} winner should be CPU 1`);
  assertEqual(result?.winType, winType, `Win type should be ${winType}`);
  assertTrue(yakuIds.includes(expectedYakuId), `${winType} should include ${expectedYakuId}`);
}

function assertNoClosedOnlyYaku(state) {
  const yakuIds = (state.round.winningResult?.yakuResult || []).map((entry) => entry.id);

  assertEqual(yakuIds.includes("menzen_tsumo"), false, "Open CPU hand should not receive menzen tsumo");
  assertEqual(yakuIds.includes("riichi"), false, "Open CPU hand should not receive riichi");
}

function assertPostCallDiscardCandidate(state, evaluateDiscardCandidates, chooseCpuDiscard, callType) {
  const cpu = state.round.players[1];
  const context = {
    player: cpu,
    currentPlayerId: cpu.id,
    players: state.round.players,
    round: state.round,
    match: state.match,
    doraIndicators: state.round.doraIndicators,
    discards: state.round.players.map((player) => player.discards)
  };
  const candidates = evaluateDiscardCandidates(cpu.hand, context);
  const discard = chooseCpuDiscard(cpu, context, () => 0);

  assertTrue(candidates.length > 0, `CPU ${callType} should still produce discard candidates`);
  assertTrue(Boolean(discard?.id), `CPU ${callType} should choose a fallback-safe discard`);
}

function makeCpuPonPossibleForHumanReaction(state) {
  return {
    ...state,
    round: {
      ...state.round,
      players: state.round.players.map((player) => player.id === 2
        ? {
            ...player,
            hand: [
              { id: "cpu2-z5-a", suit: "z", rank: 5, copy: 1, red: false },
              { id: "cpu2-z5-b", suit: "z", rank: 5, copy: 2, red: false },
              ...player.hand.slice(2)
            ]
          }
        : player)
    }
  };
}

async function loadActions(extraExports = []) {
  return loadModule("../src/game/actions.js", extraExports);
}

async function scenarioState(name, options = {}) {
  const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
  return createScenarioState(name, options);
}

async function renderState(state, renderOptions = {}) {
  const { renderGame } = await loadModule("../src/ui/render.js", ["renderGame"]);
  const root = { innerHTML: "" };

  renderGame(state, root, {
    canDeclareTsumo: () => false,
    canDeclareRon: () => false,
    canCompleteRonLatestDiscard: () => false,
    canDeclarePon: () => false,
    canDeclareChi: () => false,
    getChiOptions: () => [],
    suggestDiscards: () => [],
    ...renderOptions
  });

  return root.innerHTML;
}

function countOccurrences(text, needle) {
  return (text.match(new RegExp(needle, "g")) || []).length;
}
