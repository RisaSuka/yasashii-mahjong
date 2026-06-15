const SUITED_TILE_TYPES = ["m", "p", "s"];
const HONOR_TILE_TYPE = "z";

export function createTiles() {
  const tiles = [];

  for (const suit of SUITED_TILE_TYPES) {
    for (let rank = 1; rank <= 9; rank += 1) {
      appendCopies(tiles, suit, rank);
    }
  }

  for (let rank = 1; rank <= 7; rank += 1) {
    appendCopies(tiles, HONOR_TILE_TYPE, rank);
  }

  return tiles;
}

export function compareTiles(a, b) {
  const suitOrder = { m: 0, p: 1, s: 2, z: 3 };
  const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];

  if (suitDiff !== 0) {
    return suitDiff;
  }

  if (a.rank !== b.rank) {
    return a.rank - b.rank;
  }

  return a.copy - b.copy;
}

export function sortTiles(tiles) {
  if (!Array.isArray(tiles)) {
    return [];
  }

  return [...tiles].sort(compareTiles);
}

export function getTileLabel(tile) {
  if (!tile) {
    return "";
  }

  const honorLabels = ["", "東", "南", "西", "北", "白", "發", "中"];
  const suitLabels = { m: "萬", p: "筒", s: "索" };

  if (tile.suit === "z") {
    return honorLabels[tile.rank] || "?";
  }

  return `${tile.rank}${suitLabels[tile.suit] || "?"}`;
}

function appendCopies(tiles, suit, rank) {
  for (let copy = 0; copy < 4; copy += 1) {
    tiles.push({
      id: `${suit}${rank}-${copy}`,
      suit,
      rank,
      copy,
      red: false
    });
  }
}
