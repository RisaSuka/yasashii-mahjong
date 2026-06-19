import { assertEqual, assertTrue, loadModule, test } from "./test.js";

export function registerYakuGuideTests() {
  test("YAKU GUIDE: simple-heavy hand suggests tanyao", async () => {
    const { suggestYakuTargets } = await loadYakuGuideModule();
    const targets = suggestYakuTargets(tiles("m2 m3 m4 p4 p5 p6 s3 s4 s5 m5 m6 p6 p7"));

    assertEqual(targets[0].id, "tanyao", "Simple-heavy hand should prioritize tanyao");
    assertGuideShape(targets[0]);
  });

  test("YAKU GUIDE: dragon pair suggests yakuhai", async () => {
    const { suggestYakuTargets } = await loadYakuGuideModule();
    const targets = suggestYakuTargets(tiles("m2 m3 m4 p4 p5 p6 s3 s4 s5 z5 z5 m8 p9"));

    assertTrue(targets.some((target) => target.id === "yakuhai"), "Dragon pair should suggest yakuhai");
    assertGuideShape(targets.find((target) => target.id === "yakuhai"));
  });

  test("YAKU GUIDE: seat wind pair suggests yakuhai", async () => {
    const { suggestYakuTargets } = await loadYakuGuideModule();
    const targets = suggestYakuTargets(tiles("m2 m3 m4 p4 p5 p6 s3 s4 s5 z1 z1 m8 p9"), {
      player: { wind: "east" },
      roundWind: "east"
    });

    assertTrue(targets.some((target) => target.id === "yakuhai"), "Seat or round wind pair should suggest yakuhai");
  });

  test("YAKU GUIDE: many pairs suggest chiitoitsu", async () => {
    const { suggestYakuTargets } = await loadYakuGuideModule();
    const targets = suggestYakuTargets(tiles("m2 m2 p5 p5 s3 s3 z1 z1 m7 p8 s9 z5 z6"));

    assertTrue(targets.some((target) => target.id === "chiitoitsu"), "Many pairs should suggest chiitoitsu");
  });

  test("YAKU GUIDE: pairs and triplets suggest toitoi", async () => {
    const { suggestYakuTargets } = await loadYakuGuideModule();
    const targets = suggestYakuTargets(tiles("m3 m3 m3 p7 p7 z5 z5 s2 s2 m8 p9 z1 z2"));

    assertTrue(targets.some((target) => target.id === "toitoi"), "Pair/triplet-heavy hand should suggest toitoi");
  });

  test("YAKU GUIDE: unclear hand still returns beginner guidance", async () => {
    const { suggestYakuTargets } = await loadYakuGuideModule();
    const targets = suggestYakuTargets(tiles("m1 m4 m8 p1 p5 p9 s1 s5 s9 z1 z3 z5 z7"));

    assertTrue(targets.length >= 1, "Guide should return at least one target for a valid hand");
    assertTrue(targets.length <= 3, "Guide should keep suggestions compact");
    assertGuideShape(targets[0]);
  });

  test("YAKU GUIDE: invalid and empty hands are safe", async () => {
    const { suggestYakuTargets } = await loadYakuGuideModule();

    assertEqual(suggestYakuTargets([]).length, 0, "Empty hand should return no guide");
    assertEqual(suggestYakuTargets(null).length, 0, "Invalid hand should return no guide");
  });
}

async function loadYakuGuideModule() {
  return loadModule("../src/game/advice/yaku-guide.js", ["suggestYakuTargets"]);
}

function assertGuideShape(target) {
  assertTrue(Boolean(target), "Guide target should exist");
  assertTrue(typeof target.name === "string" && target.name.length > 0, "Guide target should include name");
  assertTrue(typeof target.reading === "string" && target.reading.length > 0, "Guide target should include reading");
  assertTrue(typeof target.description === "string" && target.description.length > 0, "Guide target should include description");
  assertTrue(typeof target.why === "string" && target.why.length > 0, "Guide target should include why text");
  assertTrue(Array.isArray(target.exampleTiles) && target.exampleTiles.length > 0, "Guide target should include example tiles");
}

function tiles(pattern) {
  return pattern.split(/\s+/).filter(Boolean).map((token, index) => {
    const suit = token[0];
    const rank = Number(token.slice(1));
    return {
      id: `${suit}${rank}-${index}`,
      suit,
      rank,
      copy: index % 4,
      red: false
    };
  });
}
