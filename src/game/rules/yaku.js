import { isSevenPairs, isThirteenOrphans, validateHandTiles } from "./win-check.js";

const YAKU = {
  RIICHI: { id: "riichi", name: "\u7acb\u76f4", han: 1 },
  MENZEN_TSUMO: { id: "menzen_tsumo", name: "門前清自摸和", han: 1 },
  TANYAO: { id: "tanyao", name: "断么九", han: 1 },
  YAKUHAI: { id: "yakuhai", name: "役牌", han: 1 },
  CHIITOITSU: { id: "chiitoitsu", name: "七対子", han: 2 },
  TOITOI: { id: "toitoi", name: "対々和", han: 2 },
  KOKUSHI_MUSOU: { id: "kokushi_musou", name: "国士無双", han: 13 }
};

const DRAGON_KEYS = new Set(["z5", "z6", "z7"]);

export function detectYaku(tiles, context = {}) {
  if (!validateTilesForYaku(tiles)) {
    return [];
  }

  const yaku = [];
  const counts = createTileCounts(tiles);

  if (isRiichi(context)) {
    yaku.push(YAKU.RIICHI);
  }

  if (isMenzenTsumo(context)) {
    yaku.push(YAKU.MENZEN_TSUMO);
  }

  if (isTanyao(tiles)) {
    yaku.push(YAKU.TANYAO);
  }

  if (hasYakuhaiTriplet(counts, context)) {
    yaku.push(YAKU.YAKUHAI);
  }

  if (isSevenPairs(tiles) || context.handType === "seven-pairs") {
    yaku.push(YAKU.CHIITOITSU);
  }

  if (isToitoiFromCounts(counts)) {
    yaku.push(YAKU.TOITOI);
  }

  if (isThirteenOrphans(tiles) || context.handType === "thirteen-orphans") {
    yaku.push(YAKU.KOKUSHI_MUSOU);
  }

  return yaku;
}

export function hasYaku(tiles, context = {}) {
  return detectYaku(tiles, context).length > 0;
}

function validateTilesForYaku(tiles) {
  return validateHandTiles(tiles).valid;
}

function isMenzenTsumo(context) {
  const isClosed = context.menzen !== false && context.isClosed !== false;
  return context.winType === "tsumo" && isClosed;
}

function isRiichi(context) {
  const isClosed = context.menzen !== false && context.isClosed !== false;
  return context.riichi === true && isClosed;
}

function isTanyao(tiles) {
  return tiles.every((tile) => tile.suit !== "z" && tile.rank >= 2 && tile.rank <= 8);
}

function hasYakuhaiTriplet(counts, context = {}) {
  for (const key of DRAGON_KEYS) {
    if ((counts.get(key) || 0) >= 3) {
      return true;
    }
  }

  for (const key of collectValueWindKeys(context)) {
    if ((counts.get(key) || 0) >= 3) {
      return true;
    }
  }

  return false;
}

function collectValueWindKeys(context) {
  const ranks = new Set();
  const roundWindRank = getWindRank(context.roundWind || context.match?.roundWind || context.round?.roundWind);
  const playerWindRank = getWindRank(context.playerWind || context.player?.wind);

  if (roundWindRank) {
    ranks.add(roundWindRank);
  }

  if (playerWindRank) {
    ranks.add(playerWindRank);
  }

  return [...ranks].map((rank) => `z${rank}`);
}

function getWindRank(wind) {
  return {
    east: 1,
    south: 2,
    west: 3,
    north: 4
  }[wind] || null;
}

function isToitoiFromCounts(counts) {
  let pairCount = 0;
  let tripletCount = 0;

  for (const count of counts.values()) {
    if (count === 2) {
      pairCount += 1;
    } else if (count === 3 || count === 4) {
      tripletCount += 1;
    } else {
      return false;
    }
  }

  return pairCount === 1 && tripletCount === 4;
}

function createTileCounts(tiles) {
  const counts = new Map();

  for (const tile of tiles) {
    const key = `${tile.suit}${tile.rank}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return counts;
}
