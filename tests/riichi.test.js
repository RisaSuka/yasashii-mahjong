import { assertEqual, assertTrue, loadModule, test } from "./test.js";

export function registerRiichiTests() {
  test("RIICHI: tenpai-after-discard hand can declare riichi", async () => {
    const state = await scenarioState("human-riichi-ready");
    const { canDeclareRiichi, getRiichiDiscardOptions } = await loadRiichiActions();
    const options = getRiichiDiscardOptions(state, 0);

    assertEqual(canDeclareRiichi(state, 0), true, "Human should be able to declare riichi from a tenpai discard");
    assertTrue(options.length > 0, "Riichi discard options should be listed");
    assertTrue(options.some((option) => option.discardTile.suit === "z" && option.discardTile.rank === 2), "Extra honor tile should be a riichi discard option");
  });

  test("RIICHI: non-tenpai hand cannot declare riichi", async () => {
    const state = await scenarioState("human-not-riichi-ready");
    const { canDeclareRiichi, getRiichiDiscardOptions } = await loadRiichiActions();

    assertEqual(canDeclareRiichi(state, 0), false, "Non-tenpai-after-discard hand should not allow riichi");
    assertEqual(getRiichiDiscardOptions(state, 0).length, 0, "Non-riichi hand should have no riichi discard options");
  });

  test("RIICHI: declaration marks player and discards the selected tile", async () => {
    const state = await scenarioState("human-riichi-ready");
    const { dispatchAction, getRiichiDiscardOptions } = await loadRiichiActions();
    const option = getRiichiDiscardOptions(state, 0).find((candidate) => candidate.discardTile.suit === "z" && candidate.discardTile.rank === 2);
    const nextState = dispatchAction(state, { type: "DECLARE_RIICHI", playerId: 0, tileId: option.discardTileId });
    const human = nextState.round.players[0];

    assertEqual(human.isRiichi, true, "Riichi declaration should mark isRiichi");
    assertEqual(human.riichi, true, "Riichi declaration should keep legacy riichi flag true");
    assertEqual(human.hand.length, 13, "Riichi declaration should discard one tile");
    assertEqual(human.discards.length, 1, "Riichi declaration should add one discard");
    assertEqual(nextState.round.phase, "draw", "Riichi declaration should move to draw phase after discard");
    assertEqual(nextState.round.lastDiscard.tile.id, option.discardTileId, "Riichi discard should become the latest discard");
  });

  test("RIICHI: declaration rejects tiles that do not leave tenpai", async () => {
    const state = await scenarioState("human-riichi-ready");
    const { dispatchAction, getRiichiDiscardOptions } = await loadRiichiActions();
    const optionIds = new Set(getRiichiDiscardOptions(state, 0).map((option) => option.discardTileId));
    const badTile = state.round.players[0].hand.find((tile) => !optionIds.has(tile.id));
    const nextState = dispatchAction(state, { type: "DECLARE_RIICHI", playerId: 0, tileId: badTile.id });

    assertEqual(nextState.round.players[0].isRiichi || false, false, "Invalid riichi discard should not mark riichi");
    assertEqual(nextState.round.players[0].hand.length, state.round.players[0].hand.length, "Invalid riichi discard should not change hand");
  });

  test("RIICHI: after riichi only the latest drawn tile can be discarded", async () => {
    const state = await riichiDrawState();
    const { dispatchAction } = await loadRiichiActions();
    const human = state.round.players[0];
    const drawnTileId = state.round.lastDraw.tile.id;
    const lockedTileId = human.hand.find((tile) => tile.id !== drawnTileId).id;
    const rejected = dispatchAction(state, { type: "DISCARD_TILE", playerId: 0, tileId: lockedTileId });
    const accepted = dispatchAction(state, { type: "DISCARD_TILE", playerId: 0, tileId: drawnTileId });

    assertEqual(rejected.round.players[0].hand.length, human.hand.length, "Riichi should reject non-drawn tile discards");
    assertEqual(accepted.round.players[0].hand.length, human.hand.length - 1, "Riichi should allow tsumogiri");
    assertEqual(accepted.round.lastDiscard.tile.id, drawnTileId, "Tsumogiri tile should become latest discard");
  });

  test("RIICHI: riichi tsumo stores riichi yaku", async () => {
    const state = await scenarioState("human-riichi-tsumo-ready");
    const { dispatchAction } = await loadRiichiActions();
    const nextState = dispatchAction(state, { type: "DECLARE_TSUMO", playerId: 0 });

    assertEqual(nextState.round.phase, "ended", "Riichi tsumo should end the round");
    assertTrue(hasYaku(nextState, "riichi"), "Winning result should include riichi yaku");
  });

  test("RIICHI: riichi ron stores riichi yaku", async () => {
    const state = await scenarioState("human-riichi-ron-ready", { phase: "reaction" });
    const { canDeclareRon, dispatchAction } = await loadRiichiActions();
    const nextState = dispatchAction(state, { type: "DECLARE_RON", playerId: 0 });

    assertEqual(canDeclareRon(state, 0), true, "Riichi should make the ron shape declarable");
    assertEqual(nextState.round.phase, "ended", "Riichi ron should end the round");
    assertTrue(hasYaku(nextState, "riichi"), "Winning result should include riichi yaku");
  });

  test("RIICHI: non-riichi win does not gain riichi yaku", async () => {
    const state = await scenarioState("human-tsumo-ready");
    const { dispatchAction } = await loadRiichiActions();
    const nextState = dispatchAction(state, { type: "DECLARE_TSUMO", playerId: 0 });

    assertEqual(hasYaku(nextState, "riichi"), false, "Non-riichi win should not include riichi");
  });
}

async function loadRiichiActions() {
  return loadModule("../src/game/actions.js", [
    "canDeclareRiichi",
    "getRiichiDiscardOptions",
    "canDeclareRon",
    "dispatchAction"
  ]);
}

async function scenarioState(name, options = {}) {
  const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
  return createScenarioState(name, options);
}

async function riichiDrawState() {
  const state = await scenarioState("human-riichi-ready");
  const { dispatchAction, getRiichiDiscardOptions } = await loadRiichiActions();
  const option = getRiichiDiscardOptions(state, 0)[0];
  const declared = dispatchAction(state, { type: "DECLARE_RIICHI", playerId: 0, tileId: option.discardTileId });
  const drawTile = declared.round.wall[0];

  return {
    ...declared,
    round: {
      ...declared.round,
      phase: "discard",
      currentPlayerIndex: 0,
      lastDraw: {
        playerId: 0,
        tile: drawTile
      },
      wall: declared.round.wall.slice(1),
      players: declared.round.players.map((player) => player.id === 0
        ? {
          ...player,
          hand: [...player.hand, drawTile]
        }
        : player)
    }
  };
}

function hasYaku(state, yakuId) {
  return Boolean(state.round.winningResult?.yakuResult?.some((yaku) => yaku.id === yakuId));
}
