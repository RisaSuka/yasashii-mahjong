const STORAGE_KEY = "jun-chan-mahjong:advice-settings";
const DEFAULT_MAX_SUGGESTIONS = 3;
const VALID_SUITS = new Set(["m", "p", "s", "z"]);

const REASONS = {
  tanyao: "タンヤオを狙うなら、1・9・字牌は使わないためです。",
  isolatedHonor: "孤立した字牌で、役にしにくいためです。",
  isolatedTerminal: "端の牌で、近い牌とつながりにくいためです。",
  isolatedSimple: "近い牌が少なく、形を作りにくいためです。"
};

export function suggestDiscards(hand, context = {}) {
  if (!Array.isArray(hand) || hand.length === 0) {
    return [];
  }

  const tiles = hand.filter(isValidTile);

  if (!tiles.length) {
    return [];
  }

  const maxSuggestions = normalizeMaxSuggestions(context.maxSuggestions);
  const counts = countTileTypes(tiles);
  const preferTanyao = context.preferTanyao === true || context.strategy === "tanyao";
  const suggestions = [];

  tiles.forEach((tile, handIndex) => {
    const key = tileKey(tile);

    if (counts.get(key) >= 2) {
      return;
    }

    const advice = createAdviceForTile(tile, {
      handIndex,
      counts,
      preferTanyao
    });

    if (advice) {
      suggestions.push(advice);
    }
  });

  return suggestions
    .sort(compareAdvice)
    .slice(0, maxSuggestions)
    .map(({ handIndex, ...entry }) => entry);
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

function createAdviceForTile(tile, { handIndex, counts, preferTanyao }) {
  if (preferTanyao && isTerminalOrHonor(tile)) {
    return createAdvice(tile, handIndex, 1, "tanyao-direction", REASONS.tanyao);
  }

  if (tile.suit === "z") {
    return createAdvice(tile, handIndex, isDragon(tile) ? 3 : 1, "isolated-honor", REASONS.isolatedHonor);
  }

  if (isTerminal(tile) && !hasNearbyTerminalSupport(tile, counts)) {
    return createAdvice(tile, handIndex, 2, "isolated-terminal", REASONS.isolatedTerminal);
  }

  if (!hasAdjacent(tile, counts)) {
    return createAdvice(tile, handIndex, 4, "isolated-simple", REASONS.isolatedSimple);
  }

  return null;
}

function createAdvice(tile, handIndex, priority, category, reason) {
  return {
    tileId: tile.id,
    priority,
    label: "おすすめ",
    reason,
    category,
    handIndex
  };
}

function compareAdvice(a, b) {
  if (a.priority !== b.priority) {
    return a.priority - b.priority;
  }

  const typeRankDiff = getTileTypeRank(a.tileId) - getTileTypeRank(b.tileId);

  if (typeRankDiff !== 0) {
    return typeRankDiff;
  }

  return a.handIndex - b.handIndex;
}

function getTileTypeRank(tileId) {
  const suit = tileId?.[0];
  const rank = Number(String(tileId || "").slice(1));

  if (suit === "z") {
    return 0;
  }

  if (rank === 1 || rank === 9) {
    return 1;
  }

  return 2;
}

function countTileTypes(tiles) {
  const counts = new Map();

  for (const tile of tiles) {
    const key = tileKey(tile);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return counts;
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

function isDragon(tile) {
  return tile.suit === "z" && tile.rank >= 5 && tile.rank <= 7;
}

function isTerminal(tile) {
  return tile.suit !== "z" && (tile.rank === 1 || tile.rank === 9);
}

function isTerminalOrHonor(tile) {
  return tile.suit === "z" || isTerminal(tile);
}

function hasNearbyTerminalSupport(tile, counts) {
  if (tile.suit === "z") {
    return false;
  }

  if (tile.rank === 1) {
    return counts.has(`${tile.suit}2`) || counts.has(`${tile.suit}3`);
  }

  if (tile.rank === 9) {
    return counts.has(`${tile.suit}7`) || counts.has(`${tile.suit}8`);
  }

  return false;
}

function hasAdjacent(tile, counts) {
  if (tile.suit === "z") {
    return false;
  }

  return counts.has(`${tile.suit}${tile.rank - 1}`) || counts.has(`${tile.suit}${tile.rank + 1}`);
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
