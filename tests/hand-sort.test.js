import { assertEqual, assertTrue, loadModule, test } from "./test.js";

export function registerHandSortTests() {
  test("sortTiles: sorts suits manzu, pinzu, souzu, honors", async () => {
    const { sortTiles } = await loadModule("../src/game/tiles.js", ["sortTiles"]);
    const sorted = sortTiles([
      tile("z", 1, 0),
      tile("s", 1, 0),
      tile("p", 1, 0),
      tile("m", 1, 0)
    ]);

    assertEqual(tileKeys(sorted), "m1,p1,s1,z1", "Tiles should be sorted by suit");
  });

  test("sortTiles: sorts suited ranks from 1 to 9", async () => {
    const { sortTiles } = await loadModule("../src/game/tiles.js", ["sortTiles"]);
    const sorted = sortTiles([tile("m", 9, 0), tile("m", 1, 0), tile("m", 5, 0)]);

    assertEqual(tileKeys(sorted), "m1,m5,m9", "Suited tiles should be sorted by rank");
  });

  test("sortTiles: sorts honors east, south, west, north, white, green, red", async () => {
    const { sortTiles } = await loadModule("../src/game/tiles.js", ["sortTiles"]);
    const sorted = sortTiles([tile("z", 7, 0), tile("z", 3, 0), tile("z", 1, 0), tile("z", 5, 0)]);

    assertEqual(tileKeys(sorted), "z1,z3,z5,z7", "Honor tiles should follow rank order");
  });

  test("START_MATCH: human hand is sorted after initial deal", async () => {
    const state = await startMatchWithReverseWall();
    const human = getHuman(state);

    assertTrue(isSorted(human.hand), "Human hand should be sorted after START_MATCH");
  });

  test("DRAW_TILE: human hand is sorted after draw", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const state = await startMatchWithReverseWall();
    const human = getHuman(state);
    const afterDiscard = dispatchAction(state, {
      type: "DISCARD_TILE",
      playerId: human.id,
      tileId: human.hand[0].id
    });
    const afterAdvance = dispatchAction(afterDiscard, { type: "ADVANCE_TURN" });
    const returnedToHuman = {
      ...afterAdvance,
      round: {
        ...afterAdvance.round,
        currentPlayerIndex: human.id,
        phase: "draw"
      }
    };
    const afterDraw = dispatchAction(returnedToHuman, { type: "DRAW_TILE", playerId: human.id });

    assertTrue(isSorted(getHuman(afterDraw).hand), "Human hand should be sorted after DRAW_TILE");
  });

  test("START_NEXT_ROUND: human hand is sorted after next hand starts", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const east1 = await startMatchWithReverseWall();
    const ended = {
      ...east1,
      round: {
        ...east1.round,
        phase: "ended",
        endReason: "exhaustive-draw"
      }
    };
    const east2 = dispatchAction(ended, { type: "START_NEXT_ROUND", random: reverseRandom });

    assertTrue(isSorted(getHuman(east2).hand), "Human hand should be sorted after START_NEXT_ROUND");
  });

  test("DISCARD_TILE: sorted hand can still discard by tile id", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const state = await startMatchWithReverseWall();
    const human = getHuman(state);
    const tileId = human.hand[3].id;
    const afterDiscard = dispatchAction(state, { type: "DISCARD_TILE", playerId: human.id, tileId });

    assertEqual(getHuman(afterDiscard).hand.some((candidate) => candidate.id === tileId), false, "Discarded tile should leave hand");
    assertEqual(getHuman(afterDiscard).discards.at(-1).id, tileId, "Discarded tile id should be preserved");
  });

  test("discard advice still returns suggestions for sorted hand", async () => {
    const { suggestDiscards } = await loadModule("../src/game/advice/discard-advice.js", ["suggestDiscards"]);
    const state = await startMatchWithReverseWall();
    const suggestions = suggestDiscards(getHuman(state).hand, { strategy: "beginner", maxSuggestions: 3 });

    assertTrue(Array.isArray(suggestions), "Advice should return an array");
    assertTrue(suggestions.length <= 3, "Advice should still cap suggestions");
  });

  test("MVP-1.0 UI remains renderable with sorted hand", async () => {
    const { renderGame } = await loadModule("../src/ui/render.js", ["renderGame"]);
    const state = await startMatchWithReverseWall();
    const root = { innerHTML: "" };

    renderGame(state, root, {
      canDeclareTsumo: () => false,
      canDeclareRon: () => false,
      suggestDiscards: () => []
    });

    assertTrue(root.innerHTML.includes("東1局"), "East-only hand label should still render");
    assertTrue(root.innerHTML.includes("seat-east"), "Human seat should still render");
  });
}

async function startMatchWithReverseWall() {
  const { createInitialGameState } = await loadModule("../src/game/round.js", ["createInitialGameState"]);
  const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);

  return dispatchAction(createInitialGameState(), { type: "START_MATCH", random: reverseRandom });
}

function reverseRandom() {
  return 0.999999;
}

function getHuman(state) {
  return state.round.players.find((player) => player.type === "human");
}

function isSorted(tiles) {
  return tileKeys(tiles) === tileKeys([...tiles].sort(compareForTest));
}

function compareForTest(a, b) {
  const suitOrder = { m: 0, p: 1, s: 2, z: 3 };
  return suitOrder[a.suit] - suitOrder[b.suit] || a.rank - b.rank || a.copy - b.copy;
}

function tile(suit, rank, copy) {
  return {
    id: `${suit}${rank}-${copy}`,
    suit,
    rank,
    copy,
    red: false
  };
}

function tileKeys(tiles) {
  return tiles.map((tileValue) => `${tileValue.suit}${tileValue.rank}`).join(",");
}
