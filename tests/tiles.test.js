import { assertEqual, assertTrue, loadModule, test } from "./test.js";

export function registerTileTests() {
  test("牌が136枚生成される", async () => {
    const { createTiles } = await loadModule("../src/game/tiles.js", ["createTiles"]);
    const tiles = createTiles();

    assertEqual(tiles.length, 136, "createTiles() should return 136 tiles");
  });

  test("tile idが重複しない", async () => {
    const { createTiles } = await loadModule("../src/game/tiles.js", ["createTiles"]);
    const tiles = createTiles();
    const ids = new Set(tiles.map((tile) => tile.id));

    assertEqual(ids.size, tiles.length, "Tile ids should be unique");
  });

  test("牌のsuit/rank/copy/redがMVP-0.1仕様に合う", async () => {
    const { createTiles } = await loadModule("../src/game/tiles.js", ["createTiles"]);
    const tiles = createTiles();

    for (const tile of tiles) {
      assertTrue(["m", "p", "s", "z"].includes(tile.suit), `Invalid suit: ${tile.suit}`);
      assertTrue(Number.isInteger(tile.rank), `Invalid rank: ${tile.rank}`);
      assertTrue(tile.copy >= 0 && tile.copy <= 3, `Invalid copy: ${tile.copy}`);
      assertEqual(tile.red, false, "MVP-0.1 should not create red dora tiles");

      if (tile.suit === "z") {
        assertTrue(tile.rank >= 1 && tile.rank <= 7, `Invalid honor rank: ${tile.rank}`);
      } else {
        assertTrue(tile.rank >= 1 && tile.rank <= 9, `Invalid suit rank: ${tile.rank}`);
      }
    }
  });
}
