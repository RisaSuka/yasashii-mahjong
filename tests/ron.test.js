import { assertEqual, loadModule, NotImplementedError, test } from "./test.js";

const DECLARE_RON_NOT_IMPLEMENTED = "DECLARE_RON action is not implemented yet";

export function registerRonTests() {
  test("DECLARE_RON: human can declare ron from ron-ready-basic scenario", async () => {
    const state = await ronReadyState();
    const { canDeclareRon } = await loadRonActions();

    assertEqual(canDeclareRon(state, 0), true, "Human should be able to declare ron");
  });

  test("DECLARE_RON: successful ron ends the round", async () => {
    const nextState = await declareRonOrPending(await ronReadyState(), 0);

    assertEqual(nextState.round.phase, "ended", "Ron should end the round");
  });

  test("DECLARE_RON: successful ron sets endReason win", async () => {
    const nextState = await declareRonOrPending(await ronReadyState(), 0);

    assertEqual(nextState.round.endReason, "win", "Ron should use win end reason");
  });

  test("DECLARE_RON: successful ron stores winType ron", async () => {
    const nextState = await declareRonOrPending(await ronReadyState(), 0);

    assertEqual(nextState.round.winningResult?.winType, "ron", "Winning result should store ron win type");
  });

  test("DECLARE_RON: successful ron stores human winnerId", async () => {
    const nextState = await declareRonOrPending(await ronReadyState(), 0);

    assertEqual(nextState.round.winningResult?.winnerId, 0, "Winning result should store human winner");
  });

  test("DECLARE_RON: successful ron stores fromPlayerId", async () => {
    const state = await ronReadyState();
    const nextState = await declareRonOrPending(state, 0);

    assertEqual(
      nextState.round.winningResult?.fromPlayerId,
      state.round.lastDiscard.playerId,
      "Winning result should store discarder"
    );
  });

  test("DECLARE_RON: successful ron stores winningTile from lastDiscard", async () => {
    const state = await ronReadyState();
    const nextState = await declareRonOrPending(state, 0);

    assertEqual(
      nextState.round.winningResult?.winningTile?.id,
      state.round.lastDiscard.tile.id,
      "Winning tile should be the latest discard"
    );
  });

  test("DECLARE_RON: non-winning hand is rejected", async () => {
    await implementedRonBaseline();
    const state = await ronReadyState({
      hand: incompleteThirteenTileHand()
    });
    const { canDeclareRon, dispatchAction } = await loadRonActions();
    const nextState = dispatchAction(state, { type: "DECLARE_RON", playerId: 0 });

    assertEqual(canDeclareRon(state, 0), false, "Incomplete hand should not be ron-ready");
    assertEqual(nextState.round.phase, state.round.phase, "Rejected ron should not end the round");
    assertEqual(nextState.round.winningResult ?? null, null, "Rejected ron should not set winning result");
  });

  test("DECLARE_RON: player cannot ron their own discard", async () => {
    await implementedRonBaseline();
    const state = await ronReadyState({
      lastDiscardPlayerId: 0
    });
    const { canDeclareRon, dispatchAction } = await loadRonActions();
    const nextState = dispatchAction(state, { type: "DECLARE_RON", playerId: 0 });

    assertEqual(canDeclareRon(state, 0), false, "Discarder should not be able to ron own discard");
    assertEqual(nextState.round.phase, state.round.phase, "Own-discard ron should not end the round");
    assertEqual(nextState.round.winningResult ?? null, null, "Own-discard ron should not set winning result");
  });

  test("DECLARE_RON: ended round is rejected", async () => {
    await implementedRonBaseline();
    const started = await ronReadyState();
    const state = {
      ...started,
      round: {
        ...started.round,
        phase: "ended",
        endReason: "exhaustive-draw",
        winningResult: null
      }
    };
    const { canDeclareRon, dispatchAction } = await loadRonActions();
    const nextState = dispatchAction(state, { type: "DECLARE_RON", playerId: 0 });

    assertEqual(canDeclareRon(state, 0), false, "Ended round should not allow ron");
    assertEqual(nextState.round.phase, "ended", "Ended phase should remain ended");
    assertEqual(nextState.round.endReason, "exhaustive-draw", "Existing end reason should be preserved");
    assertEqual(nextState.round.winningResult ?? null, null, "Ended round should not set winning result");
  });

  test("DECLARE_RON: missing lastDiscard is rejected", async () => {
    await implementedRonBaseline();
    const state = await ronReadyState({
      lastDiscard: {
        playerId: null,
        tile: null
      }
    });
    const { canDeclareRon, dispatchAction } = await loadRonActions();
    const nextState = dispatchAction(state, { type: "DECLARE_RON", playerId: 0 });

    assertEqual(canDeclareRon(state, 0), false, "Missing last discard should not allow ron");
    assertEqual(nextState.round.phase, state.round.phase, "Missing-discard ron should not end the round");
    assertEqual(nextState.round.winningResult ?? null, null, "Missing-discard ron should not set winning result");
  });

  test("DECLARE_RON: existing DECLARE_TSUMO behavior still works", async () => {
    const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const state = createScenarioState("human-tsumo-ready");
    const nextState = dispatchAction(state, { type: "DECLARE_TSUMO", playerId: 0 });

    assertEqual(nextState.round.phase, "ended", "Tsumo should still end the round");
    assertEqual(nextState.round.endReason, "win", "Tsumo should still use win end reason");
    assertEqual(nextState.round.winningResult?.winType, "tsumo", "Tsumo win type should be preserved");
  });

  test("DECLARE_RON: existing exhaustive-draw behavior still works", async () => {
    const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
    const { createInitialGameState, startRound } = await loadModule("../src/game/round.js", [
      "createInitialGameState",
      "startRound"
    ]);
    const state = startRound(createInitialGameState());
    state.round.wall = [];
    const nextState = dispatchAction(state, { type: "DRAW_TILE", playerId: 0 });

    assertEqual(nextState.round.phase, "ended", "Empty wall draw should still end the round");
    assertEqual(nextState.round.endReason, "exhaustive-draw", "Exhaustive draw reason should remain unchanged");
  });
}

async function declareRonOrPending(state, playerId) {
  const { dispatchAction } = await loadRonActions();
  const nextState = dispatchAction(state, { type: "DECLARE_RON", playerId });

  if (!isRonWinState(nextState, state, playerId)) {
    throw new NotImplementedError(DECLARE_RON_NOT_IMPLEMENTED);
  }

  return nextState;
}

async function implementedRonBaseline() {
  return declareRonOrPending(await ronReadyState(), 0);
}

async function loadRonActions() {
  return loadModule("../src/game/actions.js", ["canDeclareRon", "dispatchAction"]);
}

async function ronReadyState(options = {}) {
  const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
  const state = createScenarioState("ron-ready-basic", { phase: "reaction" });
  const lastDiscard = options.lastDiscard || {
    ...state.round.lastDiscard,
    playerId: options.lastDiscardPlayerId ?? state.round.lastDiscard.playerId
  };

  return {
    ...state,
    round: {
      ...state.round,
      phase: options.phase || "reaction",
      lastDiscard,
      players: state.round.players.map((player) => {
        if (player.id !== 0 || !options.hand) {
          return player;
        }

        return {
          ...player,
          hand: options.hand
        };
      })
    }
  };
}

function isRonWinState(nextState, previousState, playerId) {
  return (
    nextState.round?.phase === "ended" &&
    nextState.round?.endReason === "win" &&
    nextState.round?.winningResult?.winnerId === playerId &&
    nextState.round?.winningResult?.winType === "ron" &&
    nextState.round?.winningResult?.fromPlayerId === previousState.round.lastDiscard.playerId &&
    nextState.round?.winningResult?.winningTile?.id === previousState.round.lastDiscard.tile.id
  );
}

function incompleteThirteenTileHand() {
  return tiles("m1 m2 m4 m5 m7 m9 p1 p3 p6 s2 s5 s8 z1");
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
        id: `test-${key}-${copy}`,
        suit,
        rank,
        copy,
        red: false
      };
    });
}
