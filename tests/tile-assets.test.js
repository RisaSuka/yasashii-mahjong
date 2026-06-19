import { assertEqual, assertTrue, loadModule, test } from "./test.js";

export function registerTileAssetTests() {
  test("MVP-2.0 SVG: all 34 tile asset paths are listed", async () => {
    const { getExpectedTileSvgPaths } = await loadModule("../src/ui/tile-assets.js", ["getExpectedTileSvgPaths"]);
    const paths = getExpectedTileSvgPaths();
    const uniquePaths = new Set(paths);

    assertEqual(paths.length, 34, "SVG tile set should include 34 tile faces");
    assertEqual(uniquePaths.size, 34, "SVG tile asset paths should be unique");
    assertTrue(paths.includes("./assets/tiles/man-1.svg"), "1 man SVG path should exist");
    assertTrue(paths.includes("./assets/tiles/man-9.svg"), "9 man SVG path should exist");
    assertTrue(paths.includes("./assets/tiles/pin-1.svg"), "1 pin SVG path should exist");
    assertTrue(paths.includes("./assets/tiles/pin-9.svg"), "9 pin SVG path should exist");
    assertTrue(paths.includes("./assets/tiles/sou-1.svg"), "1 sou SVG path should exist");
    assertTrue(paths.includes("./assets/tiles/sou-9.svg"), "9 sou SVG path should exist");
    assertTrue(paths.includes("./assets/tiles/honor-east.svg"), "East honor SVG path should exist");
    assertTrue(paths.includes("./assets/tiles/honor-red.svg"), "Red dragon SVG path should exist");
  });

  test("MVP-2.0 SVG: tile objects resolve to stable SVG paths", async () => {
    const { getTileSvgPath } = await loadModule("../src/ui/tile-assets.js", ["getTileSvgPath"]);

    assertEqual(getTileSvgPath({ suit: "m", rank: 1 }), "./assets/tiles/man-1.svg", "Man tile should resolve");
    assertEqual(getTileSvgPath({ suit: "p", rank: 9 }), "./assets/tiles/pin-9.svg", "Pin tile should resolve");
    assertEqual(getTileSvgPath({ suit: "s", rank: 1 }), "./assets/tiles/sou-1.svg", "Sou tile should resolve");
    assertEqual(getTileSvgPath({ suit: "z", rank: 1 }), "./assets/tiles/honor-east.svg", "East honor should resolve");
    assertEqual(getTileSvgPath({ suit: "z", rank: 5 }), "./assets/tiles/honor-white.svg", "White dragon should resolve");
    assertEqual(getTileSvgPath({ suit: "z", rank: 7 }), "./assets/tiles/honor-red.svg", "Red dragon should resolve");
    assertEqual(getTileSvgPath({ suit: "x", rank: 1 }), "", "Unknown suit should fall back to CSS tile");
    assertEqual(getTileSvgPath({ suit: "m", rank: 10 }), "", "Unknown rank should fall back to CSS tile");
  });
}
