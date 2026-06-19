import { isWinningHand } from "../rules/win-check.js";
import { detectYaku } from "../rules/yaku.js";

const SUITS = ["m", "p", "s"];
const HONOR_SUIT = "z";
const MAX_COPIES = 4;

export function analyzeWaits(hand, context = {}) {
  const tiles = Array.isArray(hand) ? hand.filter(isValidTile) : [];

  if (tiles.length !== 13) {
    return {
      isTenpai: false,
      waits: [],
      message: "\u5f85\u3061\u3092\u8abf\u3079\u308b\u306b\u306f\u300113\u679a\u306e\u624b\u724c\u304c\u5fc5\u8981\u3067\u3059\u3002"
    };
  }

  const counts = createTileCounts(tiles);
  const waits = [];

  for (const baseTile of createTileKinds()) {
    const key = getTileKey(baseTile);

    if ((counts.get(key) || 0) >= MAX_COPIES) {
      continue;
    }

    const waitTile = createWaitTile(baseTile);
    const candidateHand = [...tiles, waitTile];
    const result = isWinningHand(candidateHand);

    if (!result.winning) {
      continue;
    }

    const yaku = detectYaku(candidateHand, createWaitYakuContext(context, result, waitTile));

    waits.push({
      tile: waitTile,
      tileLabel: getTileLabel(waitTile),
      canWin: yaku.length > 0,
      hasYaku: yaku.length > 0,
      yaku,
      handType: result.type,
      message: yaku.length > 0
        ? `${getTileLabel(waitTile)}\u304c\u6765\u308b\u3068\u4e0a\u304c\u308c\u307e\u3059\u3002`
        : `${getTileLabel(waitTile)}\u3067\u5f62\u306f\u5b8c\u6210\u3057\u307e\u3059\u304c\u3001\u5f79\u304c\u3042\u308a\u307e\u305b\u3093\u3002`
    });
  }

  waits.sort(compareWaits);

  return {
    isTenpai: waits.length > 0,
    waits,
    message: createSummaryMessage(waits)
  };
}

export const findWinningWaits = analyzeWaits;
export const getTenpaiInfo = analyzeWaits;

export function analyzeDiscardWaits(hand, context = {}) {
  const tiles = Array.isArray(hand) ? hand.filter(isValidTile) : [];

  if (tiles.length !== 14) {
    return {
      hasTenpaiDiscard: false,
      options: [],
      message: "\u5207\u3063\u305f\u5f8c\u306e\u5f85\u3061\u3092\u8abf\u3079\u308b\u306b\u306f\u300114\u679a\u306e\u624b\u724c\u304c\u5fc5\u8981\u3067\u3059\u3002"
    };
  }

  const options = [];

  for (let index = 0; index < tiles.length; index += 1) {
    const discardTile = tiles[index];
    const remainingTiles = tiles.filter((_, candidateIndex) => candidateIndex !== index);
    const waitInfo = analyzeWaits(remainingTiles, context);

    if (!waitInfo.isTenpai || waitInfo.waits.length === 0) {
      continue;
    }

    options.push({
      discardTile,
      discardTileId: discardTile.id,
      discardTileLabel: getTileLabel(discardTile),
      isTenpaiAfterDiscard: true,
      waits: waitInfo.waits,
      hasYakuWait: waitInfo.waits.some((wait) => wait.hasYaku),
      message: createDiscardWaitMessage(discardTile, waitInfo.waits)
    });
  }

  options.sort(compareDiscardWaitOptions);

  return {
    hasTenpaiDiscard: options.length > 0,
    options,
    message: createDiscardWaitSummary(options)
  };
}

export const analyzeWaitsAfterDiscard = analyzeDiscardWaits;
export const getDiscardTenpaiOptions = analyzeDiscardWaits;

function createWaitYakuContext(context, result, winningTile) {
  const player = context.player || {};

  return {
    winType: "ron",
    menzen: player.menzen !== false && player.isClosed !== false,
    isClosed: player.menzen !== false && player.isClosed !== false,
    handType: result.type,
    winnerId: player.id,
    winningTile,
    round: context.round,
    match: context.match
  };
}

function createSummaryMessage(waits) {
  if (waits.length === 0) {
    return "\u307e\u3060\u30c6\u30f3\u30d1\u30a4\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002";
  }

  const winningWaits = waits.filter((wait) => wait.hasYaku);

  if (winningWaits.length > 0) {
    return `${winningWaits.map((wait) => wait.tileLabel).join("\u30fb")}\u304c\u6765\u308b\u3068\u4e0a\u304c\u308c\u307e\u3059\u3002`;
  }

  return "\u5f62\u306f\u5b8c\u6210\u3059\u308b\u5f85\u3061\u304c\u3042\u308a\u307e\u3059\u304c\u3001\u5f79\u304c\u898b\u3048\u306b\u304f\u3044\u624b\u3067\u3059\u3002";
}

function createDiscardWaitSummary(options) {
  if (options.length === 0) {
    return "\u307e\u3060\u30c6\u30f3\u30d1\u30a4\u306b\u306a\u308b\u5207\u308a\u65b9\u306f\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002";
  }

  const yakuOptions = options.filter((option) => option.hasYakuWait);

  if (yakuOptions.length > 0) {
    return `${yakuOptions[0].discardTileLabel}\u3092\u5207\u308b\u3068\u5f85\u3061\u304c\u6b8b\u308a\u307e\u3059\u3002`;
  }

  return "\u5f62\u306f\u5b8c\u6210\u3059\u308b\u5f85\u3061\u304c\u6b8b\u308a\u307e\u3059\u304c\u3001\u5f79\u304c\u898b\u3048\u306b\u304f\u3044\u5207\u308a\u65b9\u3067\u3059\u3002";
}

function createDiscardWaitMessage(discardTile, waits) {
  const yakuWaits = waits.filter((wait) => wait.hasYaku);
  const waitLabels = (yakuWaits.length > 0 ? yakuWaits : waits)
    .map((wait) => wait.tileLabel)
    .join("\u30fb");

  if (yakuWaits.length > 0) {
    return `${getTileLabel(discardTile)}\u3092\u5207\u308b\u3068${waitLabels}\u5f85\u3061\u306b\u306a\u308a\u307e\u3059\u3002`;
  }

  return `${getTileLabel(discardTile)}\u3092\u5207\u308b\u3068${waitLabels}\u3067\u5f62\u306f\u5b8c\u6210\u3057\u307e\u3059\u304c\u3001\u5f79\u304c\u3042\u308a\u307e\u305b\u3093\u3002`;
}

function compareWaits(a, b) {
  if (a.hasYaku !== b.hasYaku) {
    return a.hasYaku ? -1 : 1;
  }

  return tileSortValue(a.tile) - tileSortValue(b.tile);
}

function compareDiscardWaitOptions(a, b) {
  if (a.hasYakuWait !== b.hasYakuWait) {
    return a.hasYakuWait ? -1 : 1;
  }

  const yakuWaitDiff = countYakuWaits(b.waits) - countYakuWaits(a.waits);
  if (yakuWaitDiff !== 0) {
    return yakuWaitDiff;
  }

  const waitCountDiff = b.waits.length - a.waits.length;
  if (waitCountDiff !== 0) {
    return waitCountDiff;
  }

  return tileSortValue(a.discardTile) - tileSortValue(b.discardTile);
}

function countYakuWaits(waits) {
  return waits.filter((wait) => wait.hasYaku).length;
}

function createTileKinds() {
  const tiles = [];

  for (const suit of SUITS) {
    for (let rank = 1; rank <= 9; rank += 1) {
      tiles.push({ suit, rank });
    }
  }

  for (let rank = 1; rank <= 7; rank += 1) {
    tiles.push({ suit: HONOR_SUIT, rank });
  }

  return tiles;
}

function createWaitTile(tile) {
  return {
    id: `wait-${tile.suit}${tile.rank}`,
    suit: tile.suit,
    rank: tile.rank,
    copy: 0,
    red: false
  };
}

function createTileCounts(tiles) {
  const counts = new Map();

  for (const tile of tiles) {
    const key = getTileKey(tile);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return counts;
}

function isValidTile(tile) {
  if (!tile || typeof tile !== "object") {
    return false;
  }

  if (tile.suit === HONOR_SUIT) {
    return Number.isInteger(tile.rank) && tile.rank >= 1 && tile.rank <= 7;
  }

  return SUITS.includes(tile.suit) && Number.isInteger(tile.rank) && tile.rank >= 1 && tile.rank <= 9;
}

function getTileKey(tile) {
  return `${tile.suit}${tile.rank}`;
}

function tileSortValue(tile) {
  if (tile.suit === HONOR_SUIT) {
    return 40 + tile.rank;
  }

  const base = { m: 0, p: 10, s: 20 }[tile.suit] || 50;
  return base + tile.rank;
}

function getTileLabel(tile) {
  const suits = { m: "\u842c", p: "\u7b52", s: "\u7d22" };
  const honors = ["", "\u6771", "\u5357", "\u897f", "\u5317", "\u767d", "\u767c", "\u4e2d"];

  if (!tile) {
    return "";
  }

  if (tile.suit === HONOR_SUIT) {
    return honors[tile.rank] || "?";
  }

  return `${tile.rank}${suits[tile.suit] || "?"}`;
}
