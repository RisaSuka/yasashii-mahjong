import { chooseCpuDiscard, chooseCpuRiichiDiscardOption } from "./cpu/random-cpu.js";
import { analyzeDiscardWaits } from "./advice/wait-analysis.js";
import { addTileToPlayer, createInitialGameState, startRound } from "./round.js?v=mvp341-exact-layout-redo-1";
import { isWinningHand } from "./rules/win-check.js";
import { detectYaku } from "./rules/yaku.js";
import { drawFromWall } from "./wall.js";
import { createDefaultStats, saveStats } from "./storage.js";

const NO_YAKU_MESSAGE = [
  "\u5f62\u306f\u5b8c\u6210\u3057\u3066\u3044\u307e\u3059\u304c\u3001\u5f79\u304c\u3042\u308a\u307e\u305b\u3093\u3002",
  "\u307e\u305a\u306f\u30bf\u30f3\u30e4\u30aa\u3084\u5f79\u724c\u3092\u72d9\u3063\u3066\u307f\u307e\u3057\u3087\u3046\u3002"
].join("\n");

export function dispatchAction(state, action) {
  switch (action.type) {
    case "START_ROUND":
      return startRound(state, { storage: action.storage, random: action.random });
    case "START_MATCH":
      return startMatch(state, { storage: action.storage, random: action.random });
    case "START_NEXT_ROUND":
      return startNextRound(state, { storage: action.storage, random: action.random });
    case "DISCARD_TILE":
      return discardTile(state, action.playerId, action.tileId);
    case "DECLARE_RIICHI":
      return declareRiichi(state, action.playerId, action.tileId);
    case "DECLARE_PON":
      return declarePon(state, action.playerId);
    case "DECLARE_CHI":
      return declareChi(state, action.playerId, action.handTileIds);
    case "DRAW_TILE":
      return drawTile(state, action.playerId, action.storage);
    case "ADVANCE_TURN":
      return advanceTurn(state);
    case "CPU_DISCARD":
      return cpuDiscard(state, action.random);
    case "ENTER_REACTION":
      return enterReaction(state, action.playerId);
    case "ADVANCE_AFTER_REACTION":
    case "SKIP_RON":
      return advanceAfterReaction(state);
    case "DECLARE_TSUMO":
      return declareTsumo(state, action.playerId);
    case "DECLARE_RON":
      return declareRon(state, action.playerId);
    case "RESOLVE_CPU_RON":
      return resolveCpuRonAfterDiscard(state);
    case "END_ROUND_DRAW":
      return endRoundDraw(state, action.storage);
    case "TOGGLE_LARGE_TILE_MODE":
      return {
        ...state,
        settings: {
          ...state.settings,
          largeTileMode: !state.settings.largeTileMode
        }
      };
    case "RESET_STATS": {
      const stats = createDefaultStats();
      saveStats(stats, action.storage);
      return {
        ...state,
        stats
      };
    }
    default:
      return state;
  }
}

export function canDeclareTsumo(state, playerId) {
  if (!state.round || state.round.phase !== "discard") {
    return false;
  }

  if (state.round.currentPlayerIndex !== playerId) {
    return false;
  }

  const player = state.round.players.find((candidate) => candidate.id === playerId);

  if (!player) {
    return false;
  }

  const handTiles = getAllHandTiles(player);
  const result = isWinningHand(handTiles);

  if (!result.winning) {
    return false;
  }

  return detectYaku(handTiles, createTsumoYakuContext(state, player, result)).length > 0;
}

export function canCpuDeclareTsumo(state, playerId) {
  const player = state.round?.players.find((candidate) => candidate.id === playerId);

  return player?.type === "cpu" && canDeclareTsumo(state, playerId);
}

export function getRiichiDiscardOptions(state, playerId) {
  return getRiichiDiscardOptionsForPlayer(state, playerId, { allowedType: "human" });
}

export function getCpuRiichiDiscardOptions(state, playerId) {
  return getRiichiDiscardOptionsForPlayer(state, playerId, { allowedType: "cpu" });
}

function getRiichiDiscardOptionsForPlayer(state, playerId, options = {}) {
  if (!state.round || state.round.phase !== "discard" || state.round.currentPlayerIndex !== playerId) {
    return [];
  }

  const player = state.round.players.find((candidate) => candidate.id === playerId);

  if (!player || (options.allowedType && player.type !== options.allowedType) || player.isRiichi || player.riichi || !isClosedHand(player)) {
    return [];
  }

  const result = analyzeDiscardWaits(player.hand, {
    round: state.round,
    match: state.match,
    player
  });

  return Array.isArray(result.options)
    ? result.options.filter((option) => option.isTenpaiAfterDiscard && Array.isArray(option.waits) && option.waits.length > 0)
    : [];
}

export function canDeclareRiichi(state, playerId) {
  return getRiichiDiscardOptions(state, playerId).length > 0;
}

export function canCpuDeclareRiichi(state, playerId) {
  return getCpuRiichiDiscardOptions(state, playerId).length > 0;
}

export function canDeclarePon(state, playerId) {
  return getPonOptions(state, playerId).length > 0;
}

export function canDeclareChi(state, playerId) {
  return getChiOptions(state, playerId).length > 0;
}

export function getPonOptions(state, playerId) {
  if (!state.round || state.round.phase === "ended" || !["draw", "reaction"].includes(state.round.phase)) {
    return [];
  }

  const player = state.round.players.find((candidate) => candidate.id === playerId);
  const lastDiscard = state.round.lastDiscard;

  if (!player || player.type !== "human" || isRiichiPlayer(player) || !lastDiscard?.tile || lastDiscard.playerId === playerId) {
    return [];
  }

  const matchingTiles = player.hand.filter((tile) => isSameTileKind(tile, lastDiscard.tile));

  if (matchingTiles.length < 2) {
    return [];
  }

  return [{
    type: "pon",
    calledTile: lastDiscard.tile,
    fromPlayerId: lastDiscard.playerId,
    handTileIds: matchingTiles.slice(0, 2).map((tile) => tile.id),
    tiles: [...matchingTiles.slice(0, 2), lastDiscard.tile]
  }];
}

export function getChiOptions(state, playerId) {
  if (!state.round || state.round.phase === "ended" || !["draw", "reaction"].includes(state.round.phase)) {
    return [];
  }

  const player = state.round.players.find((candidate) => candidate.id === playerId);
  const lastDiscard = state.round.lastDiscard;

  if (!player || player.type !== "human" || isRiichiPlayer(player) || !lastDiscard?.tile || lastDiscard.playerId === playerId) {
    return [];
  }

  if (!isKamichaDiscard(state.round, playerId, lastDiscard.playerId)) {
    return [];
  }

  return getChiOptionsForDiscard(lastDiscard.tile, player.hand).map((option, index) => ({
    ...option,
    id: `chi-${lastDiscard.tile.id}-${index}`,
    fromPlayerId: lastDiscard.playerId
  }));
}

export function getChiOptionsForDiscard(discardTile, hand) {
  if (!discardTile || discardTile.suit === "z" || !Array.isArray(hand)) {
    return [];
  }

  const candidates = [
    [discardTile.rank - 2, discardTile.rank - 1],
    [discardTile.rank - 1, discardTile.rank + 1],
    [discardTile.rank + 1, discardTile.rank + 2]
  ];

  return candidates
    .filter((ranks) => ranks.every((rank) => rank >= 1 && rank <= 9))
    .map((ranks) => {
      const handTiles = [];
      for (const rank of ranks) {
        const tile = hand.find((candidate) => (
          candidate.suit === discardTile.suit
          && candidate.rank === rank
          && !handTiles.some((usedTile) => usedTile.id === candidate.id)
        ));
        if (!tile) {
          return null;
        }
        handTiles.push(tile);
      }

      const tiles = [...handTiles, discardTile].sort(compareTileForMeld);
      return {
        type: "chi",
        calledTile: discardTile,
        handTileIds: handTiles.map((tile) => tile.id),
        tiles
      };
    })
    .filter(Boolean);
}

export function startMatch(state, options = {}) {
  const match = createInitialMatch();
  const nextState = startRound(
    {
      ...state,
      match,
      lastRoundResult: null
    },
    {
      ...options,
      roundWind: match.roundWind,
      handNumber: match.handNumber,
      dealerIndex: match.dealerIndex
    }
  );

  return {
    ...nextState,
    match
  };
}

export function startNextRound(state, options = {}) {
  if (!state.round) {
    return startRound(state, options);
  }

  if (state.round.phase !== "ended") {
    return state;
  }

  const lastRoundResult = createLastRoundResult(state.round);

  if (state.match?.type === "tonpuu") {
    return startNextMatchRound(state, lastRoundResult, options);
  }

  const nextState = startRound(
    {
      ...state,
      lastRoundResult
    },
    options
  );

  if (nextState.round.id === state.round.id) {
    return {
      ...nextState,
      round: {
        ...nextState.round,
        id: `${nextState.round.id}-next`
      }
    };
  }

  return nextState;
}

function createInitialMatch() {
  return {
    type: "tonpuu",
    phase: "playing",
    status: "playing",
    roundWind: "east",
    handNumber: 1,
    dealerIndex: 0,
    maxHands: 4,
    scores: [25000, 25000, 25000, 25000],
    roundHistory: []
  };
}

function startNextMatchRound(state, lastRoundResult, options = {}) {
  const match = normalizeMatch(state.match);
  const roundHistory = [...match.roundHistory, createRoundHistoryEntry(lastRoundResult)];

  if (match.handNumber >= match.maxHands) {
    return {
      ...state,
      lastRoundResult,
      match: {
        ...match,
        phase: "ended",
        status: "ended",
        roundHistory
      }
    };
  }

  const nextMatch = {
    ...match,
    phase: "playing",
    status: "playing",
    handNumber: match.handNumber + 1,
    dealerIndex: (match.dealerIndex + 1) % 4,
    roundHistory
  };
  const nextState = startRound(
    {
      ...state,
      match: nextMatch,
      lastRoundResult
    },
    {
      ...options,
      roundWind: nextMatch.roundWind,
      handNumber: nextMatch.handNumber,
      dealerIndex: nextMatch.dealerIndex
    }
  );

  return {
    ...nextState,
    match: nextMatch
  };
}

function normalizeMatch(match) {
  return {
    type: "tonpuu",
    phase: match.phase || match.status || "playing",
    status: match.status || match.phase || "playing",
    roundWind: match.roundWind || "east",
    handNumber: match.handNumber || 1,
    dealerIndex: match.dealerIndex ?? 0,
    maxHands: match.maxHands || 4,
    scores: match.scores || [25000, 25000, 25000, 25000],
    roundHistory: Array.isArray(match.roundHistory) ? match.roundHistory : []
  };
}

function createLastRoundResult(round) {
  const result = {
    roundId: round.id,
    roundWind: round.roundWind,
    handNumber: round.handNumber,
    handLabel: getHandLabel(round),
    endReason: round.endReason,
    resultType: getResultType(round),
    endedAt: new Date().toISOString()
  };

  if (round.endReason !== "win" || !round.winningResult) {
    return result;
  }

  return {
    ...result,
    winnerId: round.winningResult.winnerId,
    winType: round.winningResult.winType,
    fromPlayerId: round.winningResult.fromPlayerId,
    loserId: round.winningResult.loserId ?? round.winningResult.fromPlayerId,
    winningTile: round.winningResult.winningTile,
    handType: round.winningResult.handType,
    yakuResult: round.winningResult.yakuResult
  };
}

function createRoundHistoryEntry(result) {
  return {
    handLabel: result.handLabel,
    roundWind: result.roundWind,
    handNumber: result.handNumber,
    resultType: result.resultType,
    winnerId: result.winnerId,
    loserId: result.loserId,
    winType: result.winType
  };
}

function getResultType(round) {
  if (round.endReason === "win") {
    return round.winningResult?.winType || "win";
  }

  if (round.endReason === "exhaustive-draw") {
    return "draw";
  }

  return round.endReason || "ended";
}

function getHandLabel(round) {
  const windLabels = {
    east: "\u6771"
  };

  return `${windLabels[round.roundWind] || round.roundWind}${round.handNumber}\u5c40`;
}

export function declareTsumo(state, playerId) {
  if (!state.round || state.round.phase !== "discard" || state.round.currentPlayerIndex !== playerId) {
    return state;
  }

  const player = state.round.players.find((candidate) => candidate.id === playerId);

  if (!player) {
    return state;
  }

  const handTiles = getAllHandTiles(player);
  const result = isWinningHand(handTiles);

  if (!result.winning) {
    return state;
  }

  const yakuResult = detectYaku(handTiles, createTsumoYakuContext(state, player, result));

  if (yakuResult.length === 0) {
    return withLastActionResult(state, createNoYakuResult("tsumo"));
  }

  return {
    ...state,
    round: {
      ...state.round,
      lastActionResult: null,
      phase: "ended",
      endReason: "win",
      winningResult: {
        winnerId: playerId,
        winType: "tsumo",
        handType: result.type,
        handTiles,
        yakuResult
      }
    }
  };
}

export function canDeclareRon(state, playerId) {
  if (!state.round || state.round.phase !== "reaction") {
    return false;
  }

  return canRonLatestDiscard(state, playerId);
}

export function canRonLatestDiscard(state, playerId) {
  const ronShape = getRonShapeResult(state, playerId);

  if (!ronShape?.winning) {
    return false;
  }

  return detectYaku(ronShape.handTiles, createRonYakuContext(state, ronShape.player, ronShape.result)).length > 0;
}

export function canCompleteRonLatestDiscard(state, playerId) {
  return Boolean(getRonShapeResult(state, playerId)?.winning);
}

function getRonShapeResult(state, playerId, options = {}) {
  if (!state.round || state.round.phase === "ended") {
    return null;
  }

  const lastDiscard = state.round.lastDiscard;

  if (!lastDiscard?.tile || lastDiscard.playerId === null || lastDiscard.playerId === playerId) {
    return null;
  }

  const player = state.round.players.find((candidate) => candidate.id === playerId);
  const humanOnly = options.humanOnly !== false;

  if (!player || (humanOnly && player.type !== "human")) {
    return null;
  }

  const handTiles = getAllHandTiles(player, lastDiscard.tile);
  const result = isWinningHand(handTiles);

  if (!result.winning) {
    return {
      winning: false,
      player,
      handTiles,
      result
    };
  }

  return {
    winning: true,
    player,
    handTiles,
    result
  };
}

export function findCpuRonWinner(state) {
  if (!state.round || state.round.phase === "ended") {
    return null;
  }

  const lastDiscard = state.round.lastDiscard;

  if (!lastDiscard?.tile || lastDiscard.playerId === null) {
    return null;
  }

  for (const player of state.round.players) {
    if (player.type !== "cpu" || player.id === lastDiscard.playerId) {
      continue;
    }

    const ronShape = getRonShapeResult(state, player.id, { humanOnly: false });

    if (!ronShape?.winning) {
      continue;
    }

    const yakuResult = detectYaku(ronShape.handTiles, createRonYakuContext(state, ronShape.player, ronShape.result));

    if (yakuResult.length === 0) {
      continue;
    }

    return {
      player: ronShape.player,
      result: ronShape.result,
      handTiles: ronShape.handTiles,
      winningTile: lastDiscard.tile,
      fromPlayerId: lastDiscard.playerId,
      yakuResult
    };
  }

  return null;
}

export function resolveCpuRonAfterDiscard(state) {
  const cpuRon = findCpuRonWinner(state);

  if (!cpuRon) {
    return state;
  }

  return {
    ...state,
    round: {
      ...state.round,
      lastActionResult: null,
      phase: "ended",
      endReason: "win",
      winningResult: {
        winnerId: cpuRon.player.id,
        winType: "ron",
        fromPlayerId: cpuRon.fromPlayerId,
        loserId: cpuRon.fromPlayerId,
        winningTile: cpuRon.winningTile,
        handType: cpuRon.result.type,
        handTiles: cpuRon.handTiles,
        yakuResult: cpuRon.yakuResult
      }
    }
  };
}

export function enterReaction(state, playerId) {
  if (!canCompleteRonLatestDiscard(state, playerId) && !canDeclarePon(state, playerId) && !canDeclareChi(state, playerId)) {
    return state;
  }

  return {
    ...state,
    round: {
      ...state.round,
      phase: "reaction"
    }
  };
}

export function advanceAfterReaction(state) {
  if (!state.round || state.round.phase !== "reaction") {
    return state;
  }

  return {
    ...state,
    round: {
      ...state.round,
      phase: "draw",
      currentPlayerIndex: (state.round.currentPlayerIndex + 1) % state.round.players.length,
      turnCount: state.round.turnCount + 1
    }
  };
}

export function declareRon(state, playerId) {
  if (!state.round || state.round.phase !== "reaction") {
    return state;
  }

  const lastDiscard = state.round.lastDiscard;

  if (!lastDiscard?.tile || lastDiscard.playerId === null || lastDiscard.playerId === playerId) {
    return state;
  }

  const player = state.round.players.find((candidate) => candidate.id === playerId);

  if (!player || player.type !== "human") {
    return state;
  }

  const winningTile = lastDiscard.tile;
  const handTiles = getAllHandTiles(player, winningTile);
  const result = isWinningHand(handTiles);

  if (!result.winning) {
    return state;
  }

  const yakuResult = detectYaku(handTiles, createRonYakuContext(state, player, result));

  if (yakuResult.length === 0) {
    return withLastActionResult(state, createNoYakuResult("ron"));
  }

  return {
    ...state,
    round: {
      ...state.round,
      lastActionResult: null,
      phase: "ended",
      endReason: "win",
      winningResult: {
        winnerId: playerId,
        winType: "ron",
        fromPlayerId: state.round.lastDiscard.playerId,
        loserId: state.round.lastDiscard.playerId,
        winningTile,
        handType: result.type,
        handTiles,
        yakuResult
      }
    }
  };
}

function createNoYakuResult(action) {
  return {
    type: "rejected",
    reason: "no-yaku",
    action,
    message: NO_YAKU_MESSAGE
  };
}

function withLastActionResult(state, lastActionResult) {
  return {
    ...state,
    round: {
      ...state.round,
      lastActionResult
    }
  };
}

function createTsumoYakuContext(state, player, result) {
  return {
    winType: "tsumo",
    menzen: isClosedHand(player),
    isClosed: isClosedHand(player),
    riichi: isRiichiPlayer(player),
    handType: result.type,
    winnerId: player.id,
    winningTile: state.round.lastDraw?.playerId === player.id ? state.round.lastDraw.tile : null
  };
}

function createRonYakuContext(state, player, result) {
  return {
    winType: "ron",
    menzen: isClosedHand(player),
    isClosed: isClosedHand(player),
    riichi: isRiichiPlayer(player),
    handType: result.type,
    winnerId: player.id,
    fromPlayerId: state.round.lastDiscard.playerId,
    winningTile: state.round.lastDiscard.tile
  };
}

function isClosedHand(player) {
  return player.menzen !== false && player.isClosed !== false && (!player.melds || player.melds.length === 0);
}

function getAllHandTiles(player, extraTile = null) {
  const meldTiles = (player.melds || []).flatMap((meld) => meld.tiles || []);
  return [...player.hand, ...(extraTile ? [extraTile] : []), ...meldTiles];
}

function isRiichiPlayer(player) {
  return player?.isRiichi === true || player?.riichi === true;
}

export function declareRiichi(state, playerId, tileId) {
  return declareRiichiForPlayer(state, playerId, tileId, { allowedType: "human" });
}

function declareCpuRiichi(state, playerId, tileId) {
  return declareRiichiForPlayer(state, playerId, tileId, { allowedType: "cpu" });
}

function declareRiichiForPlayer(state, playerId, tileId, options = {}) {
  const riichiOptions = getRiichiDiscardOptionsForPlayer(state, playerId, options);

  if (riichiOptions.length === 0 || !riichiOptions.some((option) => option.discardTileId === tileId)) {
    return state;
  }

  return discardTileWithPlayerUpdate(state, playerId, tileId, (player, tile) => ({
    ...player,
    isRiichi: true,
    riichi: true,
    riichiDeclaredAt: {
      roundId: state.round.id,
      roundWind: state.round.roundWind,
      handNumber: state.round.handNumber,
      turnCount: state.round.turnCount
    },
    riichiDiscardTileId: tile.id
  }));
}

export function declarePon(state, playerId) {
  const option = getPonOptions(state, playerId)[0];

  if (!option) {
    return state;
  }

  const player = state.round.players.find((candidate) => candidate.id === playerId);
  const nextMeld = {
    id: `${state.round.id}-pon-${state.round.turnCount}-${player.melds?.length || 0}`,
    type: "pon",
    tiles: option.tiles,
    calledTile: option.calledTile,
    fromPlayerId: option.fromPlayerId,
    openedAtTurn: state.round.turnCount
  };
  const handTileIds = new Set(option.handTileIds);
  const nextPlayers = state.round.players.map((candidate) => {
    if (candidate.id !== playerId) {
      return candidate;
    }

    return {
      ...candidate,
      hand: candidate.hand.filter((tile) => !handTileIds.has(tile.id)),
      melds: [...(candidate.melds || []), nextMeld],
      isClosed: false,
      menzen: false
    };
  });

  return {
    ...state,
    round: {
      ...state.round,
      players: nextPlayers,
      phase: "discard",
      currentPlayerIndex: playerId,
      lastActionResult: {
        type: "call",
        callType: "pon",
        playerId,
        fromPlayerId: option.fromPlayerId,
        calledTile: option.calledTile,
        message: "\u30dd\u30f3\u3057\u307e\u3057\u305f\u3002\u6368\u3066\u308b\u724c\u3092\u9078\u3093\u3067\u304f\u3060\u3055\u3044\u3002"
      }
    }
  };
}

export function discardTile(state, playerId, tileId) {
  if (!state.round || state.round.phase !== "discard") {
    return state;
  }

  const player = state.round.players.find((candidate) => candidate.id === playerId);

  if (!player || state.round.currentPlayerIndex !== playerId) {
    return state;
  }

  const tile = player.hand.find((candidate) => candidate.id === tileId);

  if (!tile) {
    return state;
  }

  if (isRiichiPlayer(player) && !isLatestDrawTile(state, playerId, tileId)) {
    return state;
  }

  return discardTileWithPlayerUpdate(state, playerId, tileId);
}

function discardTileWithPlayerUpdate(state, playerId, tileId, updatePlayer = (player) => player) {
  const player = state.round.players.find((candidate) => candidate.id === playerId);
  const tile = player?.hand.find((candidate) => candidate.id === tileId);

  if (!player || !tile) {
    return state;
  }

  const nextPlayers = state.round.players.map((candidate) => {
    if (candidate.id !== playerId) {
      return candidate;
    }

    const updated = updatePlayer(candidate, tile);

    return {
      ...updated,
      hand: updated.hand.filter((handTile) => handTile.id !== tileId),
      discards: [...updated.discards, tile]
    };
  });

  return {
    ...state,
    round: {
      ...state.round,
      players: nextPlayers,
      lastDiscard: {
        playerId,
        tile
      },
      lastActionResult: null,
      phase: "draw"
    }
  };
}

export function declareChi(state, playerId, handTileIds = []) {
  const selectedIds = Array.isArray(handTileIds) ? handTileIds : [];
  const selectedIdsSorted = [...selectedIds].sort();
  const options = getChiOptions(state, playerId);
  const option = options.find((candidate) => {
    const candidateIds = [...candidate.handTileIds].sort();
    return candidateIds.length === selectedIds.length
      && candidateIds.every((id, index) => id === selectedIdsSorted[index]);
  });

  if (!option) {
    return state;
  }

  const player = state.round.players.find((candidate) => candidate.id === playerId);
  const nextMeld = {
    id: `${state.round.id}-chi-${state.round.turnCount}-${player.melds?.length || 0}`,
    type: "chi",
    tiles: option.tiles,
    calledTile: option.calledTile,
    fromPlayerId: option.fromPlayerId,
    openedAtTurn: state.round.turnCount
  };
  const handTileIdSet = new Set(option.handTileIds);
  const nextPlayers = state.round.players.map((candidate) => {
    if (candidate.id !== playerId) {
      return candidate;
    }

    return {
      ...candidate,
      hand: candidate.hand.filter((tile) => !handTileIdSet.has(tile.id)),
      melds: [...(candidate.melds || []), nextMeld],
      isClosed: false,
      menzen: false
    };
  });

  return {
    ...state,
    round: {
      ...state.round,
      players: nextPlayers,
      phase: "discard",
      currentPlayerIndex: playerId,
      lastActionResult: {
        type: "call",
        callType: "chi",
        playerId,
        fromPlayerId: option.fromPlayerId,
        calledTile: option.calledTile,
        message: "\u30c1\u30fc\u3057\u307e\u3057\u305f\u3002\u6368\u3066\u308b\u724c\u3092\u9078\u3093\u3067\u304f\u3060\u3055\u3044\u3002"
      }
    }
  };
}

function isSameTileKind(a, b) {
  return a?.suit === b?.suit && a?.rank === b?.rank;
}

function isKamichaDiscard(round, playerId, discardPlayerId) {
  if (!round?.players?.length || discardPlayerId === null || discardPlayerId === undefined) {
    return false;
  }

  return discardPlayerId === (playerId + round.players.length - 1) % round.players.length;
}

function compareTileForMeld(a, b) {
  if (a.suit !== b.suit) {
    return a.suit.localeCompare(b.suit);
  }

  if (a.rank !== b.rank) {
    return a.rank - b.rank;
  }

  return String(a.id).localeCompare(String(b.id));
}

function isLatestDrawTile(state, playerId, tileId) {
  return state.round.lastDraw?.playerId === playerId && state.round.lastDraw?.tile?.id === tileId;
}

export function drawTile(state, playerId, storage) {
  if (!state.round || state.round.phase === "ended") {
    return state;
  }

  const drawResult = drawFromWall(state.round);

  if (!drawResult.tile) {
    return endRoundDraw(
      {
        ...state,
        round: {
          ...state.round,
          wall: []
        }
      },
      storage
    );
  }

  return {
    ...state,
    round: {
      ...drawResult.round,
      players: addTileToPlayer(drawResult.round.players, playerId, drawResult.tile),
      lastDraw: {
        playerId,
        tile: drawResult.tile
      },
      phase: "discard"
    }
  };
}

export function advanceTurn(state) {
  if (!state.round || state.round.phase === "ended") {
    return state;
  }

  return {
    ...state,
    round: {
      ...state.round,
      currentPlayerIndex: (state.round.currentPlayerIndex + 1) % state.round.players.length,
      turnCount: state.round.turnCount + 1
    }
  };
}

export function cpuDiscard(state, random = Math.random) {
  if (!state.round || state.round.phase !== "discard") {
    return state;
  }

  const player = state.round.players[state.round.currentPlayerIndex];

  if (!player || player.type !== "cpu") {
    return state;
  }

  if (isRiichiPlayer(player)) {
    const tsumogiriTile = state.round.lastDraw?.playerId === player.id ? state.round.lastDraw.tile : null;
    return tsumogiriTile ? discardTile(state, player.id, tsumogiriTile.id) : state;
  }

  const context = createDiscardEvaluationContext(state, player);
  const riichiOption = chooseCpuRiichiDiscardOption(player, getCpuRiichiDiscardOptions(state, player.id), context, random);

  if (riichiOption?.discardTileId) {
    return declareCpuRiichi(state, player.id, riichiOption.discardTileId);
  }

  const tile = chooseCpuDiscard(player, context, random);
  return tile ? discardTile(state, player.id, tile.id) : state;
}

function createDiscardEvaluationContext(state, player) {
  return {
    player,
    currentPlayerId: player.id,
    players: state.round.players,
    round: state.round,
    match: state.match,
    doraIndicators: state.round.doraIndicators,
    discards: state.round.players.map((candidate) => candidate.discards)
  };
}

export function endRoundDraw(state, storage) {
  if (!state.round) {
    return state;
  }

  const nextState = {
    ...state,
    stats: {
      ...state.stats,
      roundsDrawn: state.stats.roundsDrawn + (state.round.phase === "ended" ? 0 : 1),
      lastPlayedAt: new Date().toISOString()
    },
    round: {
      ...state.round,
      phase: "ended",
      endReason: "exhaustive-draw"
    }
  };

  saveStats(nextState.stats, storage);
  return nextState;
}

export { createInitialGameState };
