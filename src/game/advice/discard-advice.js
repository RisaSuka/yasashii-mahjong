const STORAGE_KEY = "jun-chan-mahjong:advice-settings";
const DEFAULT_MAX_SUGGESTIONS = 3;
const VALID_SUITS = new Set(["m", "p", "s", "z"]);
const DRAGON_RANKS = new Set([5, 6, 7]);
const HONOR_ORDER = [1, 2, 3, 4, 5, 6, 7];

const REASON_TEXT = {
  isolatedHonor: "孤立した字牌で、役にしにくいため候補です。",
  isolatedTerminal: "端の牌で、つながる形が少ないため候補です。",
  isolatedSimple: "近い牌が少なく、組み合わせを作りにくい牌です。",
  tanyaoDirection: "タンヤオを狙うなら、1・9・字牌は使わないため候補です。",
  visibleMany: "同じ牌が場に多く出ていて、使い道が少なくなっています。",
  ownDiscardRelated: "自分で近い牌を捨てていて、形にしにくそうです。",
  pair: "同じ牌が2枚あり、形や役に育つ可能性があります。",
  sequence: "近い数字とつながっていて、形を作りやすい牌です。",
  goodWait: "両側の数字とつながりやすく、残したい牌です。",
  yakuhaiPair: "白・發・中は3枚そろうと役になるため残しやすい牌です。",
  dora: "ドラは大事な牌なので、基本的には残したい牌です。",
  nearDora: "ドラの近くの数牌で、形や価値につながる可能性があります。",
  default: "ほかの牌より形を作りにくそうなので候補です。"
};

export function evaluateDiscardCandidates(hand, context = {}) {
  if (!Array.isArray(hand) || hand.length === 0) {
    return [];
  }

  const tiles = hand.filter(isValidTile);

  if (!tiles.length) {
    return [];
  }

  const counts = countTileTypes(tiles);
  const visibleCounts = countVisibleTiles(context);
  const ownDiscardKeys = collectOwnDiscardKeys(context);
  const preferTanyao = shouldPreferTanyao(tiles, context);
  const pairCount = countPairs(counts);
  const tripletCount = countTriplets(counts);
  const doraKeys = collectDoraKeys(context);
  const nearDoraKeys = collectNearDoraKeys(context);
  const shapeKeys = analyzeHandShapes(counts);
  const yakuhaiRanks = collectYakuhaiRanks(context);

  return tiles
    .map((tile, handIndex) => evaluateTile(tile, {
      handIndex,
      tiles,
      counts,
      visibleCounts,
      ownDiscardKeys,
      preferTanyao,
      pairCount,
      tripletCount,
      doraKeys,
      nearDoraKeys,
      shapeKeys,
      yakuhaiRanks
    }))
    .sort(compareCandidates);
}

export function suggestDiscards(hand, context = {}) {
  const maxSuggestions = normalizeMaxSuggestions(context.maxSuggestions);

  if (maxSuggestions === 0) {
    return [];
  }

  const uniqueCandidates = evaluateDiscardCandidates(hand, context)
    .filter(uniqueByTileType());
  const adviceCandidates = preferUnprotectedCandidates(uniqueCandidates);

  return adviceCandidates
    .slice(0, maxSuggestions)
    .map((candidate, index) => ({
      tile: candidate.tile,
      tileId: candidate.tileId,
      priority: index + 1,
      score: candidate.score,
      label: index === 0 ? "おすすめ" : "候補",
      reason: candidate.reasons[0] || REASON_TEXT.default,
      reasons: candidate.reasons,
      tags: candidate.tags,
      category: candidate.tags[0] || "evaluated"
    }));
}

export function createDefaultDiscardAdviceSettings() {
  return {
    discardAdviceEnabled: true,
    strategy: "beginner"
  };
}

export function loadDiscardAdviceSettings(storage = getDefaultStorage()) {
  const defaults = createDefaultDiscardAdviceSettings();

  if (!storage) {
    return defaults;
  }

  try {
    const rawValue = storage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return defaults;
    }

    const parsed = JSON.parse(rawValue);

    if (!parsed || typeof parsed !== "object") {
      return defaults;
    }

    return normalizeSettings(parsed);
  } catch {
    return defaults;
  }
}

export function saveDiscardAdviceSettings(settings, storage = getDefaultStorage()) {
  const normalized = normalizeSettings(settings);

  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }

  return normalized;
}

function evaluateTile(tile, context) {
  const key = tileKey(tile);
  const count = context.counts.get(key) || 0;
  const visibleCount = context.visibleCounts.get(key) || 0;
  const tags = [];
  const keepReasons = [];
  const discardReasons = [];
  let score = 50;
  const inCompletedSequence = context.shapeKeys.completedSequenceKeys.has(key);
  const inCompletedTriplet = context.shapeKeys.completedTripletKeys.has(key);
  const inPair = context.shapeKeys.pairKeys.has(key);
  const inSequenceCandidate = context.shapeKeys.sequenceCandidateKeys.has(key);
  const isYakuhaiTile = tile.suit === "z" && context.yakuhaiRanks.has(tile.rank);
  const isYakuhaiPair = isYakuhaiTile && count >= 2;

  if (inCompletedSequence) {
    score += 80;
    tags.push("completed-sequence");
    keepReasons.push(REASON_TEXT.sequence);
  }

  if (inCompletedTriplet) {
    score += 48;
    tags.push("completed-triplet");
    keepReasons.push(REASON_TEXT.pair);
  }

  if (inSequenceCandidate && !inCompletedSequence) {
    tags.push("sequence-candidate");
  }

  if (tile.suit === "z") {
    score -= 12;
    tags.push("honor");

    if (isYakuhaiTile) {
      score += 8;
      tags.push("yakuhai");
    }
  }

  if (isTerminal(tile)) {
    score -= 8;
    tags.push("terminal");

    if (inCompletedSequence) {
      score += 8;
    }
  }

  if (isSimple(tile)) {
    score += 2;
  }

  if (context.preferTanyao && isTerminalOrHonor(tile) && count === 1 && !inCompletedSequence) {
    score -= 14;
    tags.push("tanyao-drop");
    discardReasons.push(REASON_TEXT.tanyaoDirection);
  }

  if (count >= 2) {
    score += count >= 3 ? 38 : 32;
    tags.push(count >= 3 ? "triplet" : "pair");
    keepReasons.push(REASON_TEXT.pair);

    if (isYakuhaiPair) {
      score += 58;
      tags.push("yakuhai-pair");
      tags.push("yaku-pair");
      keepReasons.push(REASON_TEXT.yakuhaiPair);
    }
  }

  if (context.pairCount >= 4 && count >= 2) {
    score += 22;
    tags.push("pair-heavy");
  }

  if (context.pairCount >= 5 && count >= 2) {
    score += 12;
    tags.push("chiitoitsu-shape");
  }

  if (context.pairCount + context.tripletCount >= 5 && count >= 2) {
    score += 8;
    tags.push("toitoi-shape");
  }

  const sequenceValue = getSequenceValue(tile, context.counts);
  score += sequenceValue.score;
  tags.push(...sequenceValue.tags);
  keepReasons.push(...sequenceValue.reasons);

  if (sequenceValue.score === 0 && count === 1 && !inCompletedSequence && !inSequenceCandidate) {
    score -= tile.suit === "z" ? 12 : 8;
    tags.push(tile.suit === "z" ? "isolated-honor" : "isolated");

    if (tile.suit === "z") {
      discardReasons.push(REASON_TEXT.isolatedHonor);
    } else if (isTerminal(tile)) {
      discardReasons.push(REASON_TEXT.isolatedTerminal);
    } else {
      discardReasons.push(REASON_TEXT.isolatedSimple);
    }
  }

  if (visibleCount >= 2) {
    score -= visibleCount >= 3 ? 14 : 7;
    tags.push("visible-many");
    discardReasons.push(REASON_TEXT.visibleMany);
  }

  if (context.ownDiscardKeys.has(key) || hasOwnDiscardNear(tile, context.ownDiscardKeys)) {
    score -= 4;
    tags.push("own-discard-related");
    discardReasons.push(REASON_TEXT.ownDiscardRelated);
  }

  if (context.doraKeys.has(key)) {
    score += 30;
    tags.push("dora");
    keepReasons.push(REASON_TEXT.dora);
  } else if (context.nearDoraKeys.has(key)) {
    score += 8;
    tags.push("near-dora");
    keepReasons.push(REASON_TEXT.nearDora);
  }

  const reasons = buildReasons(discardReasons, keepReasons);

  return {
    tile,
    tileId: tile.id,
    score,
    reasons,
    tags,
    handIndex: context.handIndex,
    typeKey: key
  };
}

function getSequenceValue(tile, counts) {
  if (tile.suit === "z") {
    return { score: 0, tags: [], reasons: [] };
  }

  const hasMinus2 = counts.has(`${tile.suit}${tile.rank - 2}`);
  const hasMinus1 = counts.has(`${tile.suit}${tile.rank - 1}`);
  const hasPlus1 = counts.has(`${tile.suit}${tile.rank + 1}`);
  const hasPlus2 = counts.has(`${tile.suit}${tile.rank + 2}`);
  const tags = [];
  const reasons = [];
  let score = 0;

  if (hasMinus1 && hasPlus1) {
    score += 20;
    tags.push("good-wait");
    reasons.push(REASON_TEXT.goodWait);
  } else if (hasMinus1 || hasPlus1) {
    score += 14;
    tags.push("sequence");
    reasons.push(REASON_TEXT.sequence);
  }

  if (hasMinus2 || hasPlus2) {
    score += 6;
    tags.push("near-sequence");
    if (!reasons.length) {
      reasons.push(REASON_TEXT.sequence);
    }
  }

  return { score, tags, reasons };
}

function analyzeHandShapes(counts) {
  const completedSequenceKeys = new Set();
  const completedTripletKeys = new Set();
  const pairKeys = new Set();
  const sequenceCandidateKeys = new Set();

  for (const [key, count] of counts.entries()) {
    if (count >= 3) {
      completedTripletKeys.add(key);
    }
    if (count >= 2) {
      pairKeys.add(key);
    }
  }

  for (const suit of ["m", "p", "s"]) {
    for (let start = 1; start <= 7; start += 1) {
      const first = `${suit}${start}`;
      const second = `${suit}${start + 1}`;
      const third = `${suit}${start + 2}`;

      if (counts.has(first) && counts.has(second) && counts.has(third)) {
        completedSequenceKeys.add(first);
        completedSequenceKeys.add(second);
        completedSequenceKeys.add(third);
      }
    }

    for (let rank = 1; rank <= 9; rank += 1) {
      const key = `${suit}${rank}`;

      if (!counts.has(key)) {
        continue;
      }

      const hasAdjacent = counts.has(`${suit}${rank - 1}`) || counts.has(`${suit}${rank + 1}`);
      const hasGapWait = counts.has(`${suit}${rank - 2}`) || counts.has(`${suit}${rank + 2}`);

      if (hasAdjacent || hasGapWait) {
        sequenceCandidateKeys.add(key);
      }
    }
  }

  return {
    completedSequenceKeys,
    completedTripletKeys,
    pairKeys,
    sequenceCandidateKeys
  };
}

function buildReasons(discardReasons, keepReasons) {
  const reasons = [];

  for (const reason of discardReasons) {
    if (!reasons.includes(reason)) {
      reasons.push(reason);
    }
  }

  if (!reasons.length) {
    reasons.push(REASON_TEXT.default);
  }

  for (const reason of keepReasons) {
    if (reasons.length >= 3) {
      break;
    }
    if (!reasons.includes(reason)) {
      reasons.push(reason);
    }
  }

  return reasons.slice(0, 3);
}

function compareCandidates(a, b) {
  if (a.score !== b.score) {
    return a.score - b.score;
  }

  const typeDiff = getTileTypeRank(a.tile) - getTileTypeRank(b.tile);

  if (typeDiff !== 0) {
    return typeDiff;
  }

  return a.handIndex - b.handIndex;
}

function getTileTypeRank(tile) {
  if (tile.suit === "z") {
    return 0 + HONOR_ORDER.indexOf(tile.rank);
  }

  const suitBase = { m: 10, p: 20, s: 30 }[tile.suit] || 40;
  const edgeBias = tile.rank === 1 || tile.rank === 9 ? -1 : 0;
  return suitBase + tile.rank + edgeBias;
}

function countTileTypes(tiles) {
  const counts = new Map();

  for (const tile of tiles) {
    const key = tileKey(tile);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return counts;
}

function countVisibleTiles(context) {
  const counts = new Map();
  const visibleTiles = [];

  if (Array.isArray(context.visibleTiles)) {
    visibleTiles.push(...context.visibleTiles);
  }

  if (Array.isArray(context.discards)) {
    visibleTiles.push(...context.discards.flat());
  }

  if (Array.isArray(context.players)) {
    for (const player of context.players) {
      if (Array.isArray(player?.discards)) {
        visibleTiles.push(...player.discards);
      }
    }
  }

  if (Array.isArray(context.round?.players)) {
    for (const player of context.round.players) {
      if (Array.isArray(player?.discards)) {
        visibleTiles.push(...player.discards);
      }
    }
  }

  for (const tile of visibleTiles.filter(isValidTile)) {
    const key = tileKey(tile);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return counts;
}

function collectOwnDiscardKeys(context) {
  const keys = new Set();
  const currentPlayerId = Number.isInteger(context.currentPlayerId)
    ? context.currentPlayerId
    : context.player?.id;
  const players = context.players || context.round?.players || [];
  const player = context.player || players.find((candidate) => candidate?.id === currentPlayerId);

  if (!Array.isArray(player?.discards)) {
    return keys;
  }

  for (const tile of player.discards.filter(isValidTile)) {
    keys.add(tileKey(tile));
  }

  return keys;
}

function collectDoraKeys(context) {
  const keys = new Set();
  const candidates = [
    context.dora,
    context.doraTile,
    context.doraIndicator,
    context.round?.dora,
    context.round?.doraTile,
    context.round?.doraIndicator,
    ...(Array.isArray(context.doraTiles) ? context.doraTiles : []),
    ...(Array.isArray(context.doraIndicators) ? context.doraIndicators : []),
    ...(Array.isArray(context.round?.doraIndicators) ? context.round.doraIndicators : [])
  ];

  for (const tile of candidates) {
    const dora = normalizeDoraTile(tile);
    if (dora) {
      keys.add(tileKey(dora));
    }
  }

  return keys;
}

function collectNearDoraKeys(context) {
  const keys = new Set();

  for (const key of collectDoraKeys(context)) {
    const suit = key[0];
    const rank = Number(key.slice(1));

    if (suit === "z") {
      continue;
    }

    if (rank > 1) {
      keys.add(`${suit}${rank - 1}`);
    }
    if (rank < 9) {
      keys.add(`${suit}${rank + 1}`);
    }
  }

  return keys;
}

function normalizeDoraTile(tile) {
  if (!tile || typeof tile !== "object") {
    return null;
  }

  if (tile.isIndicator === true || tile.indicator === true) {
    return indicatorToDora(tile);
  }

  if (isValidTile(tile)) {
    return tile;
  }

  return null;
}

function indicatorToDora(tile) {
  if (!isValidTile(tile)) {
    return null;
  }

  if (tile.suit === "z") {
    const nextRank = tile.rank === 4 ? 1 : tile.rank === 7 ? 5 : tile.rank + 1;
    return { ...tile, rank: nextRank };
  }

  return { ...tile, rank: tile.rank === 9 ? 1 : tile.rank + 1 };
}

function shouldPreferTanyao(tiles, context) {
  if (context.preferTanyao === true || context.strategy === "tanyao") {
    return true;
  }

  if (context.strategy && context.strategy !== "beginner") {
    return false;
  }

  const simpleCount = tiles.filter(isSimple).length;
  const terminalHonorCount = tiles.filter(isTerminalOrHonor).length;

  return simpleCount >= 8 && terminalHonorCount <= 5;
}

function countPairs(counts) {
  let pairCount = 0;

  for (const count of counts.values()) {
    if (count >= 2) {
      pairCount += 1;
    }
  }

  return pairCount;
}

function uniqueByTileType() {
  const seen = new Set();

  return (candidate) => {
    if (seen.has(candidate.typeKey)) {
      return false;
    }
    seen.add(candidate.typeKey);
    return true;
  };
}

function countTriplets(counts) {
  let tripletCount = 0;

  for (const count of counts.values()) {
    if (count >= 3) {
      tripletCount += 1;
    }
  }

  return tripletCount;
}

function collectYakuhaiRanks(context) {
  const ranks = new Set(DRAGON_RANKS);
  const roundWindRank = getWindRank(context.roundWind || context.match?.roundWind || context.round?.roundWind);
  const playerWindRank = getPlayerWindRank(context);

  if (roundWindRank) {
    ranks.add(roundWindRank);
  }
  if (playerWindRank) {
    ranks.add(playerWindRank);
  }

  return ranks;
}

function getPlayerWindRank(context) {
  const playerId = Number.isInteger(context.currentPlayerId)
    ? context.currentPlayerId
    : context.player?.id;

  if (!Number.isInteger(playerId)) {
    return null;
  }

  const dealerIndex = Number.isInteger(context.round?.dealerIndex)
    ? context.round.dealerIndex
    : Number.isInteger(context.match?.dealerIndex)
      ? context.match.dealerIndex
      : 0;
  const relativeSeat = (playerId - dealerIndex + 4) % 4;
  return relativeSeat + 1;
}

function getWindRank(wind) {
  if (wind === "east") {
    return 1;
  }
  if (wind === "south") {
    return 2;
  }
  if (wind === "west") {
    return 3;
  }
  if (wind === "north") {
    return 4;
  }
  return null;
}

function preferUnprotectedCandidates(candidates) {
  const unprotected = candidates.filter((candidate) => !isShapeProtectedCandidate(candidate));

  if (unprotected.length > 0) {
    return unprotected;
  }

  const withoutCritical = candidates.filter((candidate) => !isCriticalProtectedCandidate(candidate));

  return withoutCritical.length > 0 ? withoutCritical : candidates;
}

function isShapeProtectedCandidate(candidate) {
  return candidate.tags.includes("completed-sequence")
    || candidate.tags.includes("completed-triplet")
    || candidate.tags.includes("pair")
    || candidate.tags.includes("yakuhai-pair")
    || candidate.tags.includes("yaku-pair")
    || candidate.tags.includes("dora");
}

function isCriticalProtectedCandidate(candidate) {
  return candidate.tags.includes("completed-triplet")
    || candidate.tags.includes("yakuhai-pair")
    || candidate.tags.includes("yaku-pair")
    || candidate.tags.includes("dora");
}

function hasOwnDiscardNear(tile, ownDiscardKeys) {
  if (tile.suit === "z") {
    return false;
  }

  return ownDiscardKeys.has(`${tile.suit}${tile.rank - 1}`)
    || ownDiscardKeys.has(`${tile.suit}${tile.rank + 1}`);
}

function isValidTile(tile) {
  if (!tile || typeof tile !== "object" || !VALID_SUITS.has(tile.suit)) {
    return false;
  }

  if (tile.suit === "z") {
    return Number.isInteger(tile.rank) && tile.rank >= 1 && tile.rank <= 7 && typeof tile.id === "string";
  }

  return Number.isInteger(tile.rank) && tile.rank >= 1 && tile.rank <= 9 && typeof tile.id === "string";
}

function tileKey(tile) {
  return `${tile.suit}${tile.rank}`;
}

function isTerminal(tile) {
  return tile.suit !== "z" && (tile.rank === 1 || tile.rank === 9);
}

function isTerminalOrHonor(tile) {
  return tile.suit === "z" || isTerminal(tile);
}

function isSimple(tile) {
  return tile.suit !== "z" && tile.rank >= 2 && tile.rank <= 8;
}

function normalizeMaxSuggestions(value) {
  if (!Number.isFinite(value)) {
    return DEFAULT_MAX_SUGGESTIONS;
  }

  return Math.max(0, Math.min(DEFAULT_MAX_SUGGESTIONS, Math.floor(value)));
}

function normalizeSettings(settings) {
  const defaults = createDefaultDiscardAdviceSettings();

  if (!settings || typeof settings !== "object") {
    return defaults;
  }

  return {
    discardAdviceEnabled:
      typeof settings.discardAdviceEnabled === "boolean" ? settings.discardAdviceEnabled : defaults.discardAdviceEnabled,
    strategy: typeof settings.strategy === "string" ? settings.strategy : defaults.strategy
  };
}

function getDefaultStorage() {
  return typeof globalThis.localStorage === "object" ? globalThis.localStorage : null;
}
