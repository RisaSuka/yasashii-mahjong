import { assertEqual, assertTrue, loadModule, test } from "./test.js";

export function registerWallTests() {
  test("王牌が14枚、通常山が122枚に分離される", async () => {
    const { createTiles } = await loadModule("../src/game/tiles.js", ["createTiles"]);
    const { buildWall } = await loadModule("../src/game/wall.js", ["buildWall"]);
    const wallState = buildWall(createTiles());

    assertEqual(wallState.deadWall.length, 14, "deadWall should contain 14 tiles");
    assertEqual(wallState.wall.length, 122, "wall should contain 122 tiles");
  });

  test("シャッフル後も全牌のidが重複しない", async () => {
    const { createTiles } = await loadModule("../src/game/tiles.js", ["createTiles"]);
    const { buildWall } = await loadModule("../src/game/wall.js", ["buildWall"]);
    const wallState = buildWall(createTiles());
    const allTiles = [...wallState.wall, ...wallState.deadWall];
    const ids = new Set(allTiles.map((tile) => tile.id));

    assertEqual(allTiles.length, 136, "wall and deadWall should contain all 136 tiles");
    assertEqual(ids.size, 136, "Shuffled tiles should keep unique ids");
  });

  test("ドラ表示牌枠が1枚用意される", async () => {
    const { createTiles } = await loadModule("../src/game/tiles.js", ["createTiles"]);
    const { buildWall } = await loadModule("../src/game/wall.js", ["buildWall"]);
    const wallState = buildWall(createTiles());

    assertEqual(wallState.doraIndicators.length, 1, "MVP-0.1 should expose one dora indicator");
    assertTrue(wallState.deadWall.includes(wallState.doraIndicators[0]), "Dora indicator should come from deadWall");
  });
}
