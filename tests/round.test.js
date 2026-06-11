import { assertEqual, loadModule, test } from "./test.js";

export function registerRoundTests() {
  test("全員13枚配牌され、親が初回ツモ後14枚になる", async () => {
    const { createInitialGameState, startRound } = await loadModule("../src/game/round.js", [
      "createInitialGameState",
      "startRound"
    ]);
    const state = startRound(createInitialGameState());
    const { players, dealerIndex } = state.round;

    assertEqual(players.length, 4, "Round should create four players");

    for (const player of players) {
      const expectedHandSize = player.id === dealerIndex ? 14 : 13;
      assertEqual(player.hand.length, expectedHandSize, `${player.name} should have ${expectedHandSize} tiles`);
    }
  });

  test("局開始直後の通常山が69枚になる", async () => {
    const { createInitialGameState, startRound } = await loadModule("../src/game/round.js", [
      "createInitialGameState",
      "startRound"
    ]);
    const state = startRound(createInitialGameState());

    assertEqual(state.round.wall.length, 69, "Initial round wall should have 69 tiles after deal and dealer draw");
  });

  test("局開始直後の手番は親でphaseはdiscard", async () => {
    const { createInitialGameState, startRound } = await loadModule("../src/game/round.js", [
      "createInitialGameState",
      "startRound"
    ]);
    const state = startRound(createInitialGameState());

    assertEqual(state.round.currentPlayerIndex, state.round.dealerIndex, "Dealer should act first");
    assertEqual(state.round.phase, "discard", "Round should wait for dealer discard after initial draw");
  });
}
