const TILE_ASSET_BASE = "./assets/tiles/";

const HONOR_ASSET_NAMES = {
  1: "honor-east.svg",
  2: "honor-south.svg",
  3: "honor-west.svg",
  4: "honor-north.svg",
  5: "honor-white.svg",
  6: "honor-green.svg",
  7: "honor-red.svg"
};

const SUIT_ASSET_PREFIX = {
  m: "man",
  p: "pin",
  s: "sou"
};

export function getTileSvgPath(tile) {
  const assetName = getTileSvgFileName(tile);

  return assetName ? `${TILE_ASSET_BASE}${assetName}` : "";
}

export function getTileSvgFileName(tile) {
  if (!tile) {
    return "";
  }

  if (tile.suit === "z") {
    return HONOR_ASSET_NAMES[tile.rank] || "";
  }

  const prefix = SUIT_ASSET_PREFIX[tile.suit];

  if (!prefix || tile.rank < 1 || tile.rank > 9) {
    return "";
  }

  return `${prefix}-${tile.rank}.svg`;
}

export function getExpectedTileSvgPaths() {
  const suitedTiles = ["man", "pin", "sou"].flatMap((prefix) =>
    Array.from({ length: 9 }, (_, index) => `${TILE_ASSET_BASE}${prefix}-${index + 1}.svg`)
  );
  const honors = Object.values(HONOR_ASSET_NAMES).map((name) => `${TILE_ASSET_BASE}${name}`);

  return [...suitedTiles, ...honors];
}
