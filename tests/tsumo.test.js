import { assertEqual, loadModule, NotImplementedError, test } from "./test.js";

const DECLARE_TSUMO_NOT_IMPLEMENTED = "DECLARE_TSUMO action is not implemented yet";

export function registerTsumoTests() {
  test("DECLARE_TSUMO: human winning hand ends the round", async () => {
    const state = await stateWithHand(0, standardWinningHand());
    const nextState = await declareTsumoOrPending(state, 0);

    assertEqual(nextState.round.phase, "ended", "Tsumo should end the round");
  });

  test("DECLARE_TSUMO: human winning hand sets endReason win", async () => {
    const state = await stateWithHand(0, standardWinningHand());
    const nextState = await declareTsumoOrPending(state, 0);

    assertEqual(nextState.round.endReason, "win", "Tsumo should use win end reason");
  });

  test("DECLARE_TSUMO: human winning hand stores winnerId", async () => {
    const state = await stateWithHand(0, standardWinningHand());
    const nextState = await declareTsumoOrPending(state, 0);

    assertEqual(nextState.round.winningResult?.winnerId, 0, "Winning result should store human winner");
  });

  test("DECLARE_TSUMO: human winning hand stores winType tsumo", async () => {
    const state = await stateWithHand(0, standardWinningHand());
    const nextState = await declareTsumoOrPending(state, 0);

    assertEqual(nextState.round.winningResult?.winType, "tsumo", "Winning result should store tsumo win type");
  });

  test("DECLARE_TSUMO: CPU current player can declare with a winning hand", async () => {
    const state = await stateWithHand(1, standardWinningHand(), { currentPlayerIndex: 1 });
    const nextState = await declareTsumoOrPending(state, 1);

    assertEqual(nextState.round.phase, "ended", "CPU tsumo should end the round");
    assertEqual(nextState.round.winningResult?.winnerId, 1, "Winning result should store CPU winner");
    assertEqual(nextState.round.winningResult?.winType, "tsumo", "CPU win type should be tsumo");
  });

  test("DECLARE_TSUMO: incomplete hand is rejected", async () => {
    const implementedState = await implementedTsumoBaseline();
    const state = await stateWithHand(0, incompleteHand());
    const nextState = await dispatch(state, { type: "DECLARE_TSUMO", playerId: 0 });

    assertEqual(implementedState.round.phase, "ended", "Baseline tsumo should be implemented");
    assertEqual(nextState.round.phase, state.round.phase, "Incomplete hand should not end the round");
    assertEqual(nextState.round.endReason, state.round.endReason, "Incomplete hand should not set end reason");
    assertEqual(nextState.round.winningResult ?? null, null, "Incomplete hand should not set winning result");
  });

  test("DECLARE_TSUMO: non-current player is rejected", async () => {
    await implementedTsumoBaseline();
    const state = await stateWithHand(1, standardWinningHand(), { currentPlayerIndex: 0 });
    const nextState = await dispatch(state, { type: "DECLARE_TSUMO", playerId: 1 });

    assertEqual(nextState.round.phase, state.round.phase, "Non-current player should not end the round");
    assertEqual(nextState.round.winningResult ?? null, null, "Non-current player should not set winning result");
  });

  test("DECLARE_TSUMO: ended round is rejected", async () => {
    await implementedTsumoBaseline();
    const started = await stateWithHand(0, standardWinningHand());
    const state = {
      ...started,
      round: {
        ...started.round,
        phase: "ended",
        endReason: "exhaustive-draw",
        winningResult: null
      }
    };
    const nextState = await dispatch(state, { type: "DECLARE_TSUMO", playerId: 0 });

    assertEqual(nextState.round.phase, "ended", "Ended phase should remain ended");
    assertEqual(nextState.round.endReason, "exhaustive-draw", "Existing end reason should be preserved");
    assertEqual(nextState.round.winningResult ?? null, null, "Ended round should not set winning result");
  });

  test("DECLARE_TSUMO: DRAW_TILE does not progress after tsumo", async () => {
    const wonState = await declareTsumoOrPending(await stateWithHand(0, standardWinningHand()), 0);
    const beforeWallLength = wonState.round.wall.length;
    const beforeHandLength = wonState.round.players[1].hand.length;
    const nextState = await dispatch(wonState, { type: "DRAW_TILE", playerId: 1 });

    assertEqual(nextState.round.phase, "ended", "Round should stay ended");
    assertEqual(nextState.round.wall.length, beforeWallLength, "Wall should not change after tsumo");
    assertEqual(nextState.round.players[1].hand.length, beforeHandLength, "Hand should not change after tsumo");
  });

  test("DECLARE_TSUMO: DISCARD_TILE does not progress after tsumo", async () => {
    const wonState = await declareTsumoOrPending(await stateWithHand(0, standardWinningHand()), 0);
    const player = wonState.round.players[0];
    const tileId = player.hand[0].id;
    const nextState = await dispatch(wonState, { type: "DISCARD_TILE", playerId: 0, tileId });

    assertEqual(nextState.round.phase, "ended", "Round should stay ended");
    assertEqual(nextState.round.players[0].hand.length, player.hand.length, "Hand should not change after tsumo");
    assertEqual(nextState.round.players[0].discards.length, player.discards.length, "Discards should not change after tsumo");
  });

  test("DECLARE_TSUMO: CPU_DISCARD does not progress after tsumo", async () => {
    const wonState = await declareTsumoOrPending(await stateWithHand(1, standardWinningHand(), { currentPlayerIndex: 1 }), 1);
    const player = wonState.round.players[1];
    const nextState = await dispatch(wonState, { type: "CPU_DISCARD", random: () => 0 });

    assertEqual(nextState.round.phase, "ended", "Round should stay ended");
    assertEqual(nextState.round.players[1].hand.length, player.hand.length, "CPU hand should not change after tsumo");
    assertEqual(nextState.round.players[1].discards.length, player.discards.length, "CPU discards should not change after tsumo");
  });

  test("DECLARE_TSUMO: exhaustive draw behavior still works", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const state = await startedState();
    state.round.wall = [];
    const nextState = dispatchAction(state, { type: "DRAW_TILE", playerId: 0 });

    assertEqual(nextState.round.phase, "ended", "Empty wall draw should still end the round");
    assertEqual(nextState.round.endReason, "exhaustive-draw", "Exhaustive draw reason should remain unchanged");
    assertEqual(nextState.round.winningResult ?? null, null, "Exhaustive draw should not set winning result");
  });
}

async function declareTsumoOrPending(state, playerId) {
  const nextState = await dispatch(state, { type: "DECLARE_TSUMO", playerId });

  if (!isTsumoWinState(nextState, playerId)) {
    throw new NotImplementedError(DECLARE_TSUMO_NOT_IMPLEMENTED);
  }

  return nextState;
}

async function implementedTsumoBaseline() {
  return declareTsumoOrPending(await stateWithHand(0, standardWinningHand()), 0);
}

async function dispatch(state, action) {
  const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
  return dispatchAction(state, action);
}

async function startedState() {
  const { createInitialGameState, startRound } = await loadModule("../src/game/round.js", [
    "createInitialGameState",
    "startRound"
  ]);

  return startRound(createInitialGameState());
}

async function stateWithHand(playerId, hand, options = {}) {
  const state = await startedState();

  return {
    ...state,
    round: {
      ...state.round,
      phase: options.phase || "discard",
      currentPlayerIndex: options.currentPlayerIndex ?? playerId,
      winningResult: null,
      players: state.round.players.map((player) => {
        if (player.id !== playerId) {
          return player;
        }

        return {
          ...player,
          hand
        };
      })
    }
  };
}

function isTsumoWinState(state, playerId) {
  return (
    state.round?.phase === "ended" &&
    state.round?.endReason === "win" &&
    state.round?.winningResult?.winnerId === playerId &&
    state.round?.winningResult?.winType === "tsumo"
  );
}

function standardWinningHand() {
  return tiles("m1 m2 m3 m4 m5 m6 p2 p3 p4 s7 s8 s9 z1 z1");
}

function incompleteHand() {
  return tiles("m1 m2 m4 m5 m7 m9 p1 p3 p6 s2 s5 s8 z1 z3");
}

function tiles(pattern) {
  const counts = new Map();

  return pattern
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const suit = token[0];
      const rank = Number(token.slice(1));
      const key = `${suit}${rank}`;
      const copy = counts.get(key) || 0;
      counts.set(key, copy + 1);

      return {
        id: `${key}-${copy}`,
        suit,
        rank,
        copy,
        red: false
      };
    });
}
