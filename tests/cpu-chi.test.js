import { assertEqual, assertTrue, loadModule, test } from "./test.js";

export function registerCpuChiTests() {
  test("CPU CHI: upper-player suited discard can be chi", async () => {
    const state = await scenarioState("cpu-chi-ready-tanyao");
    const { canCpuCallChi, getCpuChiOptions } = await loadCpuChiActions();
    const options = getCpuChiOptions(state, 1);

    assertEqual(canCpuCallChi(state, 1), true, "CPU should be able to chi the upper player's suited discard");
    assertEqual(options.length, 1, "One CPU chi option should be listed");
    assertEqual(options[0].calledTile.suit, "p", "Called tile should be a suited tile");
    assertEqual(options[0].fromPlayerId, 0, "CPU chi should remember the human discard source");
  });

  test("CPU CHI: non-upper, honor, own discard, and riichi block chi", async () => {
    const base = await scenarioState("cpu-chi-ready-tanyao");
    const notKamicha = await scenarioState("cpu-chi-not-kamicha");
    const honorDiscard = {
      ...base,
      round: {
        ...base.round,
        lastDiscard: {
          playerId: 0,
          tile: { id: "test-z5-discard", suit: "z", rank: 5, copy: 0, red: false }
        }
      }
    };
    const ownDiscard = {
      ...base,
      round: {
        ...base.round,
        lastDiscard: {
          playerId: 1,
          tile: base.round.lastDiscard.tile
        }
      }
    };
    const riichi = await scenarioState("cpu-chi-riichi-blocked");
    const { canCpuCallChi } = await loadCpuChiActions();

    assertEqual(canCpuCallChi(notKamicha, 1), false, "CPU should not chi a discard that is not from kamicha");
    assertEqual(canCpuCallChi(honorDiscard, 1), false, "CPU should not chi honor tiles");
    assertEqual(canCpuCallChi(ownDiscard, 1), false, "CPU should not chi its own discard");
    assertEqual(canCpuCallChi(riichi, 1), false, "CPU riichi should block chi calls");
  });

  test("CPU CHI: multiple options are exposed for the same discard", async () => {
    const state = await scenarioState("cpu-chi-multiple-options");
    const { getCpuChiOptions } = await loadCpuChiActions();
    const options = getCpuChiOptions(state, 1);

    assertEqual(options.length, 3, "CPU should see all three chi patterns on a five discard");
  });

  test("CPU CHI: decision favors tanyao and avoids no-yaku chi with injected rng", async () => {
    const tanyao = await scenarioState("cpu-chi-ready-tanyao");
    const noYaku = await scenarioState("cpu-chi-no-yaku-avoid");
    const { getCpuChiOptions, evaluateCpuChiDecision, shouldCpuCallChi } = await loadCpuChiActions([
      "evaluateCpuChiDecision",
      "shouldCpuCallChi"
    ]);
    const tanyaoOption = getCpuChiOptions(tanyao, 1)[0];
    const noYakuOption = getCpuChiOptions(noYaku, 1)[0];
    const tanyaoDecision = evaluateCpuChiDecision(tanyao, 1, tanyaoOption);
    const noYakuDecision = evaluateCpuChiDecision(noYaku, 1, noYakuOption);

    assertTrue(tanyaoDecision.chance >= 0.25, "Tanyao-direction chi should be considered more readily");
    assertEqual(noYakuDecision.chance, 0.01, "No-yaku terminal chi should be rare");
    assertEqual(shouldCpuCallChi(tanyao, 1, tanyaoOption, () => 0), true, "Injected rng should allow a good chi");
    assertEqual(shouldCpuCallChi(noYaku, 1, noYakuOption, () => 0.9), false, "Injected rng should usually skip no-yaku chi");
  });

  test("CPU CHI: resolve removes two tiles, adds meld, and discards immediately", async () => {
    const state = await scenarioState("cpu-chi-ready-tanyao");
    const { resolveCpuChiAfterDiscard, canCpuDeclareRiichi } = await loadCpuChiActions([
      "resolveCpuChiAfterDiscard",
      "canCpuDeclareRiichi"
    ]);
    const nextState = resolveCpuChiAfterDiscard(state, () => 0);
    const cpu = nextState.round.players[1];

    assertEqual(cpu.melds.length, 1, "CPU chi should add one open meld");
    assertEqual(cpu.melds[0].type, "chi", "CPU meld type should be chi");
    assertEqual(cpu.melds[0].fromPlayerId, 0, "CPU chi meld should remember the source player");
    assertEqual(cpu.melds[0].tiles.length, 3, "CPU chi meld should contain three tiles");
    assertEqual(cpu.hand.length, 10, "CPU should have ten concealed tiles after chi and immediate discard");
    assertEqual(cpu.discards.length, state.round.players[1].discards.length + 1, "CPU should discard after chi");
    assertEqual(cpu.isClosed, false, "CPU chi should make the hand open");
    assertEqual(cpu.menzen, false, "CPU chi should clear menzen status");
    assertEqual(nextState.round.phase, "draw", "CPU chi discard should return to draw flow");
    assertEqual(nextState.round.currentPlayerIndex, 1, "CPU discard should not advance the turn by itself");
    assertEqual(nextState.round.lastDiscard.playerId, 1, "Latest discard should be the CPU post-chi discard");
    assertEqual(canCpuDeclareRiichi(nextState, 1), false, "Open CPU hand should not be able to riichi after chi");
  });

  test("CPU CHI: CPU pon priority blocks chi on the same discard", async () => {
    const state = await scenarioState("cpu-pon-priority-over-chi");
    const { canCpuCallPon, resolveCpuPonAfterDiscard } = await loadCpuPonActions([
      "canCpuCallPon",
      "resolveCpuPonAfterDiscard"
    ]);
    const { canCpuCallChi, resolveCpuChiAfterDiscard } = await loadCpuChiActions(["resolveCpuChiAfterDiscard"]);

    assertEqual(canCpuCallPon(state, 1), true, "CPU should have a pon option");
    assertEqual(canCpuCallChi(state, 1), true, "CPU should also have a chi option");
    assertEqual(resolveCpuChiAfterDiscard(state, () => 0), state, "CPU chi should not run while a CPU pon opportunity exists");

    const ponState = resolveCpuPonAfterDiscard(state, () => 0);
    assertEqual(ponState.round.players[1].melds[0].type, "pon", "CPU pon should be resolved before chi");
  });

  test("CPU CHI: open tanyao can win and open no-yaku cannot", async () => {
    const tanyao = await scenarioState("cpu-chi-open-tanyao-win-shape");
    const noYaku = await scenarioState("cpu-chi-open-no-yaku-win-shape");
    const { canCpuDeclareTsumo, dispatchAction } = await loadCpuChiActions([
      "canCpuDeclareTsumo",
      "dispatchAction"
    ]);

    assertEqual(canCpuDeclareTsumo(tanyao, 1), true, "Open CPU tanyao chi hand should be able to tsumo");
    assertEqual(canCpuDeclareTsumo(noYaku, 1), false, "Open CPU no-yaku hand should not be able to tsumo");

    const won = dispatchAction(tanyao, { type: "DECLARE_TSUMO", playerId: 1 });
    const yakuIds = (won.round.winningResult?.yakuResult || []).map((entry) => entry.id);

    assertEqual(won.round.phase, "ended", "Open CPU tanyao tsumo should end the hand");
    assertTrue(yakuIds.includes("tanyao"), "Open CPU chi should keep tanyao");
    assertEqual(yakuIds.includes("menzen_tsumo"), false, "Open CPU tsumo should not receive menzen tsumo");
  });

  test("CPU CHI: next round clears CPU chi melds", async () => {
    const state = await scenarioState("cpu-chi-open-tanyao-win-shape");
    const { dispatchAction } = await loadCpuChiActions(["dispatchAction"]);
    const ended = {
      ...state,
      round: {
        ...state.round,
        phase: "ended",
        endReason: "exhaustive-draw"
      }
    };
    const next = dispatchAction(ended, { type: "START_NEXT_ROUND" });

    assertTrue(next.round.players.every((player) => player.melds.length === 0), "New round should clear CPU chi melds");
  });

  test("CPU CHI UI: CPU chi meld renders in the four-direction table", async () => {
    const state = await scenarioState("cpu-chi-open-tanyao-win-shape");
    const html = await renderState(state);

    assertTrue(html.includes("table-meld-right"), "CPU1 meld lane should render on the right");
    assertTrue(html.includes("meld-chi"), "CPU chi meld should render with a chi class");
    assertTrue(html.includes("meld-tile"), "CPU chi meld should render visible tiles");
  });

  test("CPU CHI: scenarios are listed for manual checks", async () => {
    const { listScenarios } = await loadModule("../src/game/scenarios.js", ["listScenarios"]);
    const names = listScenarios().map((scenario) => scenario.name);

    assertTrue(names.includes("cpu-chi-ready-tanyao"), "CPU tanyao chi scenario should be listed");
    assertTrue(names.includes("cpu-chi-multiple-options"), "CPU multiple chi scenario should be listed");
    assertTrue(names.includes("cpu-chi-not-kamicha"), "CPU non-kamicha chi scenario should be listed");
    assertTrue(names.includes("cpu-chi-no-yaku-avoid"), "CPU no-yaku avoid chi scenario should be listed");
    assertTrue(names.includes("cpu-chi-riichi-blocked"), "CPU riichi blocked chi scenario should be listed");
    assertTrue(names.includes("cpu-chi-open-tanyao-win-shape"), "CPU open tanyao chi win scenario should be listed");
    assertTrue(names.includes("cpu-pon-priority-over-chi"), "CPU pon priority over chi scenario should be listed");
  });
}

async function loadCpuChiActions(extraExports = []) {
  return loadModule("../src/game/actions.js", [
    "canCpuCallChi",
    "getCpuChiOptions",
    ...extraExports
  ]);
}

async function loadCpuPonActions(extraExports = []) {
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
