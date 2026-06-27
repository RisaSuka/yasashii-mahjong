import { assertEqual, assertTrue, loadModule, test } from "./test.js";

export function registerCpuPonTests() {
  test("CPU PON: matching pair can call pon on human discard", async () => {
    const state = await scenarioState("cpu-pon-ready-yakuhai");
    const { canCpuCallPon, getCpuPonOptions } = await loadCpuPonActions();
    const options = getCpuPonOptions(state, 1);

    assertEqual(canCpuCallPon(state, 1), true, "CPU should be able to pon with two matching tiles");
    assertEqual(options.length, 1, "One CPU pon option should be listed");
    assertEqual(options[0].calledTile.suit, "z", "Called tile should be an honor");
    assertEqual(options[0].calledTile.rank, 5, "Called tile should be white dragon");
  });

  test("CPU PON: one matching tile, own discard, and riichi block pon", async () => {
    const base = await scenarioState("cpu-pon-ready-yakuhai");
    const oneMatch = {
      ...base,
      round: {
        ...base.round,
        players: base.round.players.map((player) => player.id === 1
          ? { ...player, hand: removeOneKind(player.hand, "z", 5) }
          : player)
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
    const riichi = await scenarioState("cpu-pon-riichi-blocked");
    const { canCpuCallPon } = await loadCpuPonActions();

    assertEqual(canCpuCallPon(oneMatch, 1), false, "A single matching tile should not allow CPU pon");
    assertEqual(canCpuCallPon(ownDiscard, 1), false, "CPU should not pon its own discard");
    assertEqual(canCpuCallPon(riichi, 1), false, "CPU riichi should block pon calls");
  });

  test("CPU PON: decision uses yaku and no-yaku probabilities with injected rng", async () => {
    const yakuhai = await scenarioState("cpu-pon-ready-yakuhai");
    const noYaku = await scenarioState("cpu-pon-no-yaku-avoid");
    const { getCpuPonOptions, evaluateCpuPonDecision, shouldCpuCallPon } = await loadCpuPonActions([
      "evaluateCpuPonDecision",
      "shouldCpuCallPon"
    ]);
    const yakuhaiOption = getCpuPonOptions(yakuhai, 1)[0];
    const noYakuOption = getCpuPonOptions(noYaku, 1)[0];
    const yakuhaiDecision = evaluateCpuPonDecision(yakuhai, 1, yakuhaiOption);
    const noYakuDecision = evaluateCpuPonDecision(noYaku, 1, noYakuOption);

    assertEqual(yakuhaiDecision.chance, 0.7, "Yakuhai pon should use the high base chance");
    assertEqual(noYakuDecision.chance, 0.05, "Ordinary no-yaku pon should be rare");
    assertEqual(shouldCpuCallPon(yakuhai, 1, yakuhaiOption, () => 0.69), true, "Injected rng should allow yakuhai pon");
    assertEqual(shouldCpuCallPon(yakuhai, 1, yakuhaiOption, () => 0.7), false, "Injected rng should skip at the threshold");
    assertEqual(shouldCpuCallPon(noYaku, 1, noYakuOption, () => 0.9), false, "No-yaku ordinary pon should usually be skipped");
  });

  test("CPU PON: resolve removes two tiles, adds meld, and discards immediately", async () => {
    const state = await scenarioState("cpu-pon-ready-yakuhai");
    const { resolveCpuPonAfterDiscard } = await loadCpuPonActions(["resolveCpuPonAfterDiscard"]);
    const nextState = resolveCpuPonAfterDiscard(state, () => 0);
    const cpu = nextState.round.players[1];

    assertEqual(cpu.melds.length, 1, "CPU pon should add one open meld");
    assertEqual(cpu.melds[0].type, "pon", "CPU meld type should be pon");
    assertEqual(cpu.melds[0].fromPlayerId, 0, "CPU meld should remember the human discard source");
    assertEqual(cpu.hand.length, 10, "CPU should have ten concealed tiles after pon and immediate discard");
    assertEqual(cpu.discards.length, state.round.players[1].discards.length + 1, "CPU should discard after pon");
    assertEqual(cpu.isClosed, false, "CPU pon should make the hand open");
    assertEqual(cpu.menzen, false, "CPU pon should clear menzen status");
    assertEqual(nextState.round.phase, "draw", "CPU pon discard should return to draw flow");
    assertEqual(nextState.round.currentPlayerIndex, 1, "CPU discard should not advance the turn by itself");
    assertEqual(nextState.round.lastDiscard.playerId, 1, "Latest discard should be the CPU post-pon discard");
  });

  test("CPU PON: human reaction priority prevents automatic CPU pon", async () => {
    const state = await scenarioState("human-pon-ready-yakuhai");
    const { resolveCpuPonAfterDiscard } = await loadCpuPonActions(["resolveCpuPonAfterDiscard"]);
    const nextState = resolveCpuPonAfterDiscard(state, () => 0);

    assertEqual(nextState, state, "CPU pon should not run while a human call reaction is available");
  });

  test("CPU PON: open CPU yakuhai hand can win without menzen tsumo", async () => {
    const state = await scenarioState("cpu-pon-open-yakuhai-win-shape");
    const { canCpuDeclareTsumo, dispatchAction } = await loadCpuPonActions(["canCpuDeclareTsumo", "dispatchAction"]);

    assertEqual(canCpuDeclareTsumo(state, 1), true, "Open CPU yakuhai hand should be able to tsumo");

    const won = dispatchAction(state, { type: "DECLARE_TSUMO", playerId: 1 });
    const yakuIds = (won.round.winningResult?.yakuResult || []).map((entry) => entry.id);

    assertEqual(won.round.phase, "ended", "Open CPU yakuhai tsumo should end the hand");
    assertTrue(yakuIds.includes("yakuhai"), "Open CPU yakuhai pon should keep yakuhai");
    assertEqual(yakuIds.includes("menzen_tsumo"), false, "Open CPU tsumo should not receive menzen tsumo");
  });

  test("CPU PON: next round clears CPU melds", async () => {
    const state = await scenarioState("cpu-pon-open-yakuhai-win-shape");
    const { dispatchAction } = await loadCpuPonActions(["dispatchAction"]);
    const ended = {
      ...state,
      round: {
        ...state.round,
        phase: "ended",
        endReason: "exhaustive-draw"
      }
    };
    const next = dispatchAction(ended, { type: "START_NEXT_ROUND" });

    assertTrue(next.round.players.every((player) => player.melds.length === 0), "New round should clear CPU melds");
  });

  test("CPU PON UI: CPU meld renders in the four-direction table", async () => {
    const state = await scenarioState("cpu-pon-open-yakuhai-win-shape");
    const html = await renderState(state);

    assertTrue(html.includes("table-meld-right"), "CPU1 meld lane should render on the right");
    assertTrue(html.includes("meld-pon"), "CPU pon meld should render with a pon class");
    assertTrue(html.includes("meld-tile"), "CPU meld should render visible tiles");
  });

  test("CPU PON: scenarios are listed for manual checks", async () => {
    const { listScenarios } = await loadModule("../src/game/scenarios.js", ["listScenarios"]);
    const names = listScenarios().map((scenario) => scenario.name);

    assertTrue(names.includes("cpu-pon-ready-yakuhai"), "CPU yakuhai pon scenario should be listed");
    assertTrue(names.includes("cpu-pon-ready-toitoi"), "CPU toitoi pon scenario should be listed");
    assertTrue(names.includes("cpu-pon-no-yaku-avoid"), "CPU no-yaku avoid scenario should be listed");
    assertTrue(names.includes("cpu-pon-riichi-blocked"), "CPU riichi blocked pon scenario should be listed");
    assertTrue(names.includes("cpu-pon-open-yakuhai-win-shape"), "CPU open yakuhai win scenario should be listed");
  });
}

async function loadCpuPonActions(extraExports = []) {
  return loadModule("../src/game/actions.js", [
    "canCpuCallPon",
    "getCpuPonOptions",
    ...extraExports
  ]);
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

function removeOneKind(tiles, suit, rank) {
  let removed = false;

  return tiles.filter((tile) => {
    if (!removed && tile.suit === suit && tile.rank === rank) {
      removed = true;
      return false;
    }

    return true;
  });
}
