import { assertEqual, loadModule, NotImplementedError, test } from "./test.js";

const REACTION_NOT_IMPLEMENTED = "reaction phase connection is not implemented yet";

export function registerReactionTests() {
  test("REACTION: ron-ready discard enters reaction phase", async () => {
    const state = await ronReadyBeforeReaction();
    const nextState = await enterReactionOrPending(state, 0);

    assertEqual(nextState.round.phase, "reaction", "Ron-ready discard should enter reaction phase");
  });

  test("REACTION: currentPlayerIndex does not advance while entering reaction", async () => {
    const state = await ronReadyBeforeReaction();
    const nextState = await enterReactionOrPending(state, 0);

    assertEqual(
      nextState.round.currentPlayerIndex,
      state.round.currentPlayerIndex,
      "Entering reaction should not advance current player"
    );
  });

  test("REACTION: CPU_DISCARD does not progress during reaction", async () => {
    const state = await ronReadyReactionState();
    const cpu = state.round.players[state.round.currentPlayerIndex];
    const nextState = await dispatch(state, { type: "CPU_DISCARD", random: () => 0 });

    assertEqual(nextState.round.phase, "reaction", "CPU discard should not progress during reaction");
    assertEqual(nextState.round.currentPlayerIndex, state.round.currentPlayerIndex, "Turn should not advance");
    assertEqual(nextState.round.players[cpu.id].hand.length, cpu.hand.length, "CPU hand should not change");
    assertEqual(nextState.round.players[cpu.id].discards.length, cpu.discards.length, "CPU discards should not change");
  });

  test("REACTION: DECLARE_RON during reaction ends the round", async () => {
    const state = await ronReadyReactionState();
    const nextState = await dispatch(state, { type: "DECLARE_RON", playerId: 0 });

    assertEqual(nextState.round.phase, "ended", "Ron should end the round during reaction");
    assertEqual(nextState.round.endReason, "win", "Ron should end as win");
  });

  test("REACTION: DECLARE_RON during reaction stores winType ron", async () => {
    const state = await ronReadyReactionState();
    const nextState = await dispatch(state, { type: "DECLARE_RON", playerId: 0 });

    assertEqual(nextState.round.winningResult?.winType, "ron", "Ron win type should be stored");
  });

  test("REACTION: ADVANCE_AFTER_REACTION skips ron and advances to next player", async () => {
    const state = await ronReadyReactionState({ currentPlayerIndex: 1 });
    const nextState = await advanceAfterReactionOrPending(state);

    assertEqual(nextState.round.phase, "draw", "Skipping ron should return to draw flow");
    assertEqual(nextState.round.currentPlayerIndex, 2, "Skipping ron should advance to next player");
  });

  test("REACTION: non-winning discard does not enter reaction and can continue normally", async () => {
    const state = await nonWinningBeforeReaction();
    const { canRonLatestDiscard } = await loadReactionActions();

    assertEqual(canRonLatestDiscard(state, 0), false, "Non-winning latest discard should not be ron-ready");
    const continued = await continueNormallyAfterNoReactionOrPending(state);

    assertEqual(continued.round.phase, "discard", "No-ron flow should continue to next discard");
    assertEqual(continued.round.currentPlayerIndex, 2, "No-ron flow should advance to next player");
  });

  test("REACTION: own discard does not enter reaction", async () => {
    const state = await ronReadyBeforeReaction({ lastDiscardPlayerId: 0 });
    const { canRonLatestDiscard } = await loadReactionActions();

    assertEqual(canRonLatestDiscard(state, 0), false, "Human should not react to own discard");
    const nextState = await dispatch(state, { type: "ENTER_REACTION", playerId: 0 });

    assertEqual(nextState.round.phase, state.round.phase, "Own discard should not enter reaction");
  });

  test("REACTION: ended round does not enter reaction", async () => {
    const started = await ronReadyBeforeReaction();
    const state = {
      ...started,
      round: {
        ...started.round,
        phase: "ended",
        endReason: "exhaustive-draw"
      }
    };
    const { canRonLatestDiscard } = await loadReactionActions();

    assertEqual(canRonLatestDiscard(state, 0), false, "Ended round should not be ron-ready");
    const nextState = await dispatch(state, { type: "ENTER_REACTION", playerId: 0 });

    assertEqual(nextState.round.phase, "ended", "Ended round should stay ended");
    assertEqual(nextState.round.endReason, "exhaustive-draw", "Ended reason should be preserved");
  });

  test("REACTION: existing DECLARE_TSUMO behavior still works", async () => {
    const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
    const state = createScenarioState("human-tsumo-ready");
    const nextState = await dispatch(state, { type: "DECLARE_TSUMO", playerId: 0 });

    assertEqual(nextState.round.phase, "ended", "Tsumo should still end the round");
    assertEqual(nextState.round.endReason, "win", "Tsumo should still use win end reason");
    assertEqual(nextState.round.winningResult?.winType, "tsumo", "Tsumo win type should be preserved");
  });

  test("REACTION: existing DECLARE_RON direct behavior still works", async () => {
    const state = await ronReadyReactionState();
    const nextState = await dispatch(state, { type: "DECLARE_RON", playerId: 0 });

    assertEqual(nextState.round.phase, "ended", "Ron should still end the round");
    assertEqual(nextState.round.endReason, "win", "Ron should still use win end reason");
    assertEqual(nextState.round.winningResult?.winType, "ron", "Ron win type should be preserved");
  });

  test("REACTION: existing exhaustive-draw behavior still works", async () => {
    const { createInitialGameState, startRound } = await loadModule("../src/game/round.js", [
      "createInitialGameState",
      "startRound"
    ]);
    const state = startRound(createInitialGameState());
    state.round.wall = [];
    const nextState = await dispatch(state, { type: "DRAW_TILE", playerId: 0 });

    assertEqual(nextState.round.phase, "ended", "Empty wall draw should still end the round");
    assertEqual(nextState.round.endReason, "exhaustive-draw", "Exhaustive draw reason should remain unchanged");
  });
}

async function enterReactionOrPending(state, playerId) {
  const { canRonLatestDiscard } = await loadReactionActions();

  if (!canRonLatestDiscard(state, playerId)) {
    throw new NotImplementedError(REACTION_NOT_IMPLEMENTED);
  }

  const nextState = await dispatch(state, { type: "ENTER_REACTION", playerId });

  if (nextState.round?.phase !== "reaction") {
    throw new NotImplementedError(REACTION_NOT_IMPLEMENTED);
  }

  return nextState;
}

async function advanceAfterReactionOrPending(state) {
  const nextState = await dispatch(state, { type: "ADVANCE_AFTER_REACTION" });

  if (nextState === state || nextState.round?.phase === "reaction") {
    throw new NotImplementedError(REACTION_NOT_IMPLEMENTED);
  }

  return nextState;
}

async function continueNormallyAfterNoReactionOrPending(state) {
  const afterAdvance = await dispatch(state, { type: "ADVANCE_TURN" });
  const player = afterAdvance.round.players[afterAdvance.round.currentPlayerIndex];
  const afterDraw = await dispatch(afterAdvance, { type: "DRAW_TILE", playerId: player.id });

  if (afterDraw === state || afterDraw.round.phase !== "discard") {
    throw new NotImplementedError(REACTION_NOT_IMPLEMENTED);
  }

  return afterDraw;
}

async function loadReactionActions() {
  return loadModule("../src/game/actions.js", ["canRonLatestDiscard", "dispatchAction"]);
}

async function dispatch(state, action) {
  const { dispatchAction } = await loadModule("../src/game/actions.js", ["dispatchAction"]);
  return dispatchAction(state, action);
}

async function ronReadyBeforeReaction(options = {}) {
  const state = await ronReadyReactionState(options);

  return {
    ...state,
    round: {
      ...state.round,
      phase: options.phase || "draw"
    }
  };
}

async function ronReadyReactionState(options = {}) {
  const { createScenarioState } = await loadModule("../src/game/scenarios.js", ["createScenarioState"]);
  const state = createScenarioState("ron-ready-basic", { phase: "reaction" });
  const lastDiscard = {
    ...state.round.lastDiscard,
    playerId: options.lastDiscardPlayerId ?? state.round.lastDiscard.playerId
  };

  return {
    ...state,
    round: {
      ...state.round,
      currentPlayerIndex: options.currentPlayerIndex ?? state.round.currentPlayerIndex,
      phase: options.phase || "reaction",
      lastDiscard
    }
  };
}

async function nonWinningBeforeReaction() {
  const state = await ronReadyBeforeReaction({ currentPlayerIndex: 1 });

  return {
    ...state,
    round: {
      ...state.round,
      players: state.round.players.map((player) => {
        if (player.id !== 0) {
          return player;
        }

        return {
          ...player,
          hand: tiles("m1 m2 m4 m5 m7 m9 p1 p3 p6 s2 s5 s8 z1")
        };
      })
    }
  };
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
        id: `reaction-${key}-${copy}`,
        suit,
        rank,
        copy,
        red: false
      };
    });
}
