const VALID_SUITS = new Set(["m", "p", "s", "z"]);
const DRAGON_RANKS = new Set([5, 6, 7]);
const WIND_RANKS = {
  east: 1,
  south: 2,
  west: 3,
  north: 4
};

const TEXT = {
  tanyaoName: "\u65ad\u4e48\u4e5d",
  tanyaoReading: "\u30bf\u30f3\u30e4\u30aa",
  tanyaoDescription: "1\u30fb9\u30fb\u5b57\u724c\u3092\u4f7f\u308f\u306a\u3044\u5f79\u3067\u3059\u3002",
  tanyaoWhy: "2\u301c8\u306e\u6570\u724c\u304c\u591a\u3044\u306e\u3067\u3001\u72d9\u3044\u3084\u3059\u305d\u3046\u3067\u3059\u3002",
  yakuhaiName: "\u5f79\u724c",
  yakuhaiReading: "\u30e4\u30af\u30cf\u30a4",
  yakuhaiDescription: "\u767d\u30fb\u767c\u30fb\u4e2d\u3084\u3001\u81ea\u5206\u306e\u98a8\u30fb\u5834\u306e\u98a8\u30923\u679a\u305d\u308d\u3048\u308b\u5f79\u3067\u3059\u3002",
  yakuhaiWhy: "\u5f79\u724c\u5019\u88dc\u304c2\u679a\u3042\u308b\u306e\u3067\u3001\u3082\u30461\u679a\u304f\u308b\u3068\u5f79\u306b\u306a\u308a\u307e\u3059\u3002",
  chiitoitsuName: "\u4e03\u5bfe\u5b50",
  chiitoitsuReading: "\u30c1\u30fc\u30c8\u30a4\u30c4",
  chiitoitsuDescription: "\u540c\u3058\u724c2\u679a\u306e\u7d44\u30927\u3064\u4f5c\u308b\u5f79\u3067\u3059\u3002",
  chiitoitsuWhy: "\u5bfe\u5b50\u304c\u591a\u3044\u306e\u3067\u3001\u540c\u3058\u724c\u3092\u6b8b\u3059\u65b9\u5411\u304c\u5206\u304b\u308a\u3084\u3059\u3044\u3067\u3059\u3002",
  toitoiName: "\u5bfe\u3005\u548c",
  toitoiReading: "\u30c8\u30a4\u30c8\u30a4",
  toitoiDescription: "\u540c\u3058\u724c3\u679a\u306e\u7d44\u30924\u3064\u4f5c\u308b\u5f79\u3067\u3059\u3002",
  toitoiWhy: "\u5bfe\u5b50\u3084\u523b\u5b50\u304c\u591a\u3044\u306e\u3067\u30013\u679a\u305d\u308d\u3048\u308b\u5f62\u3092\u76ee\u6307\u305b\u305d\u3046\u3067\u3059\u3002",
  noYakuName: "\u5f79\u306a\u3057\u6ce8\u610f",
  noYakuReading: "\u30e4\u30af\u30ca\u30b7\u30c1\u30e5\u30a6\u30a4",
  noYakuDescription: "\u5f62\u304c\u826f\u304f\u3066\u3082\u3001\u5f79\u304c\u306a\u3044\u3068\u3042\u304c\u308c\u307e\u305b\u3093\u3002",
  noYakuWhy: "\u307e\u305a\u306f\u30bf\u30f3\u30e4\u30aa\u3084\u5f79\u724c\u3092\u72d9\u3046\u3068\u5206\u304b\u308a\u3084\u3059\u3044\u3067\u3059\u3002"
};

export function suggestYakuTargets(hand, context = {}) {
  if (!Array.isArray(hand) || hand.length === 0) {
    return [];
  }

  const tiles = hand.filter(isValidTile);

  if (!tiles.length) {
    return [];
  }

  const counts = countTileTypes(tiles);
  const simpleCount = tiles.filter(isSimple).length;
  const terminalHonorCount = tiles.filter(isTerminalOrHonor).length;
  const pairCount = countPairs(counts);
  const tripletCount = countTriplets(counts);
  const yakuhaiPairs = getYakuhaiPairs(counts, context);
  const candidates = [
    createTanyaoTarget(simpleCount, terminalHonorCount),
    createYakuhaiTarget(yakuhaiPairs),
    createChiitoitsuTarget(pairCount),
    createToitoiTarget(pairCount, tripletCount)
  ].filter(Boolean);

  candidates.sort((a, b) => b.priority - a.priority || a.order - b.order);

  const strongTargets = candidates.filter((candidate) => candidate.priority >= 45);

  if (strongTargets.length > 0) {
    return strongTargets.slice(0, 3).map(stripOrder);
  }

  const fallback = createNoYakuTarget();
  return [fallback, ...candidates.slice(0, 2)].slice(0, 3).map(stripOrder);
}

export const evaluateYakuTargets = suggestYakuTargets;
export const getBeginnerYakuGuide = suggestYakuTargets;

function createTanyaoTarget(simpleCount, terminalHonorCount) {
  const priority = simpleCount * 8 - terminalHonorCount * 9 + (simpleCount >= 8 ? 20 : 0);

  return {
    id: "tanyao",
    name: TEXT.tanyaoName,
    reading: TEXT.tanyaoReading,
    priority,
    order: 1,
    description: TEXT.tanyaoDescription,
    why: simpleCount >= 7
      ? TEXT.tanyaoWhy
      : "2\u301c8\u306e\u6570\u724c\u3092\u5897\u3084\u305b\u308b\u3068\u3001\u30bf\u30f3\u30e4\u30aa\u304c\u898b\u3048\u3084\u3059\u304f\u306a\u308a\u307e\u3059\u3002",
    keepHints: ["2\u301c8\u306e\u6570\u724c\u3092\u6b8b\u3057\u307e\u3057\u3087\u3046"],
    discardHints: ["1\u30fb9\u30fb\u5b57\u724c\u306f\u5c11\u3057\u5207\u308a\u3084\u3059\u3044\u3067\u3059"],
    exampleTiles: tiles("m2 m3 m4 p4 p5 p6 s3 s4 s5 s6 s7 s8 m5 m5")
  };
}

function createYakuhaiTarget(yakuhaiPairs) {
  if (yakuhaiPairs.length === 0) {
    return null;
  }

  const best = yakuhaiPairs[0];

  return {
    id: "yakuhai",
    name: TEXT.yakuhaiName,
    reading: TEXT.yakuhaiReading,
    priority: 85 + yakuhaiPairs.length * 4,
    order: 2,
    description: TEXT.yakuhaiDescription,
    why: `${getTileLabel(best)}\u304c2\u679a\u3042\u308b\u306e\u3067\u3001\u3082\u30461\u679a\u304f\u308b\u3068\u5f79\u306b\u306a\u308a\u307e\u3059\u3002`,
    keepHints: [`${getTileLabel(best)}\u306f\u6b8b\u3057\u3066\u307f\u307e\u3057\u3087\u3046`],
    discardHints: ["\u5b64\u7acb\u3057\u305f1\u30fb9\u30fb\u5b57\u724c\u306f\u5019\u88dc\u306b\u306a\u308a\u307e\u3059"],
    exampleTiles: [tile("z", best.rank, 0), tile("z", best.rank, 1), tile("z", best.rank, 2)]
  };
}

function createChiitoitsuTarget(pairCount) {
  return {
    id: "chiitoitsu",
    name: TEXT.chiitoitsuName,
    reading: TEXT.chiitoitsuReading,
    priority: pairCount * 18 + (pairCount >= 4 ? 20 : 0),
    order: 3,
    description: TEXT.chiitoitsuDescription,
    why: pairCount >= 4 ? TEXT.chiitoitsuWhy : "\u5bfe\u5b50\u304c\u5897\u3048\u305f\u3089\u5019\u88dc\u306b\u306a\u308a\u307e\u3059\u3002",
    keepHints: ["\u540c\u3058\u724c2\u679a\u306e\u7d44\u3092\u5927\u5207\u306b\u3057\u307e\u3057\u3087\u3046"],
    discardHints: ["\u5b64\u7acb\u3057\u305f\u724c\u304b\u3089\u6574\u7406\u3059\u308b\u3068\u898b\u3084\u3059\u3044\u3067\u3059"],
    exampleTiles: tiles("m2 m2 p5 p5 s3 s3 z1 z1")
  };
}

function createToitoiTarget(pairCount, tripletCount) {
  return {
    id: "toitoi",
    name: TEXT.toitoiName,
    reading: TEXT.toitoiReading,
    priority: pairCount * 12 + tripletCount * 24 + (pairCount + tripletCount >= 4 ? 18 : 0),
    order: 4,
    description: TEXT.toitoiDescription,
    why: pairCount + tripletCount >= 4 ? TEXT.toitoiWhy : "\u540c\u3058\u724c\u304c\u96c6\u307e\u3063\u3066\u304d\u305f\u3089\u5019\u88dc\u306b\u306a\u308a\u307e\u3059\u3002",
    keepHints: ["\u5bfe\u5b50\u3084\u523b\u5b50\u3092\u6b8b\u3057\u307e\u3057\u3087\u3046"],
    discardHints: ["\u3064\u306a\u304c\u308a\u306e\u5c11\u306a\u3044\u5b64\u7acb\u724c\u306f\u5207\u308a\u3084\u3059\u3044\u3067\u3059"],
    exampleTiles: tiles("m3 m3 m3 z5 z5 z5 p7 p7 p7")
  };
}

function createNoYakuTarget() {
  return {
    id: "no-yaku-caution",
    name: TEXT.noYakuName,
    reading: TEXT.noYakuReading,
    priority: 40,
    order: 0,
    description: TEXT.noYakuDescription,
    why: TEXT.noYakuWhy,
    keepHints: ["\u30bf\u30f3\u30e4\u30aa\u306e2\u301c8\u3084\u3001\u5f79\u724c\u306e\u5bfe\u5b50\u3092\u898b\u3064\u3051\u307e\u3057\u3087\u3046"],
    discardHints: ["\u307e\u305a\u306f\u5b64\u7acb\u3057\u305f1\u30fb9\u30fb\u5b57\u724c\u304b\u3089\u8003\u3048\u307e\u3057\u3087\u3046"],
    exampleTiles: tiles("m2 m3 m4 p4 p5 p6 z5 z5 z5")
  };
}

function stripOrder(target) {
  const { order: _order, ...rest } = target;
  return rest;
}

function getYakuhaiPairs(counts, context) {
  const ranks = new Set(DRAGON_RANKS);
  const seatWindRank = normalizeWindRank(context.player?.wind || context.seatWind || context.wind);
  const roundWindRank = normalizeWindRank(context.round?.roundWind || context.roundWind);

  if (seatWindRank) {
    ranks.add(seatWindRank);
  }
  if (roundWindRank) {
    ranks.add(roundWindRank);
  }

  return [...ranks]
    .filter((rank) => (counts.get(`z${rank}`) || 0) >= 2)
    .map((rank) => ({ suit: "z", rank }));
}

function normalizeWindRank(wind) {
  if (Number.isInteger(wind) && wind >= 1 && wind <= 4) {
    return wind;
  }

  return WIND_RANKS[wind] || null;
}

function countTileTypes(tiles) {
  const counts = new Map();

  for (const currentTile of tiles) {
    const key = tileKey(currentTile);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return counts;
}

function countPairs(counts) {
  let count = 0;

  for (const value of counts.values()) {
    if (value >= 2) {
      count += 1;
    }
  }

  return count;
}

function countTriplets(counts) {
  let count = 0;

  for (const value of counts.values()) {
    if (value >= 3) {
      count += 1;
    }
  }

  return count;
}

function tiles(pattern) {
  return pattern.split(/\s+/).filter(Boolean).map((token, index) => {
    const suit = token[0];
    const rank = Number(token.slice(1));
    return tile(suit, rank, index % 4);
  });
}

function tile(suit, rank, copy = 0) {
  return {
    id: `guide-${suit}${rank}-${copy}`,
    suit,
    rank,
    copy,
    red: false
  };
}

function isValidTile(currentTile) {
  if (!currentTile || typeof currentTile !== "object" || !VALID_SUITS.has(currentTile.suit)) {
    return false;
  }

  if (currentTile.suit === "z") {
    return Number.isInteger(currentTile.rank) && currentTile.rank >= 1 && currentTile.rank <= 7;
  }

  return Number.isInteger(currentTile.rank) && currentTile.rank >= 1 && currentTile.rank <= 9;
}

function tileKey(currentTile) {
  return `${currentTile.suit}${currentTile.rank}`;
}

function isSimple(currentTile) {
  return currentTile.suit !== "z" && currentTile.rank >= 2 && currentTile.rank <= 8;
}

function isTerminalOrHonor(currentTile) {
  return currentTile.suit === "z" || currentTile.rank === 1 || currentTile.rank === 9;
}

function getTileLabel(currentTile) {
  if (!currentTile) {
    return "";
  }

  const honors = ["", "\u6771", "\u5357", "\u897f", "\u5317", "\u767d", "\u767c", "\u4e2d"];
  const suits = { m: "\u842c", p: "\u7b52", s: "\u7d22" };

  if (currentTile.suit === "z") {
    return honors[currentTile.rank] || "?";
  }

  return `${currentTile.rank}${suits[currentTile.suit] || "?"}`;
}
