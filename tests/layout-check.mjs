import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARTIFACT_DIR = path.join(ROOT, "test-artifacts", "layout");
const CACHE_BUST = "mvp442-cpu-meld-seat-lanes-1";
const PORT = Number(process.env.LAYOUT_CHECK_PORT || 18765);
const VIEWPORTS = [
  { width: 844, height: 390 },
  { width: 896, height: 414 },
  { width: 932, height: 430 },
  { width: 812, height: 375 },
  { width: 780, height: 360 },
  { width: 844, height: 360 },
  { width: 896, height: 380 },
  { width: 932, height: 400 },
  { width: 812, height: 345 },
  { width: 780, height: 330 }
];
const SCENARIOS = [
  { name: "normal", discards: 9, mode: "playing" },
  { name: "early", discards: 3, mode: "playing" },
  { name: "mid", discards: 9, mode: "playing" },
  { name: "late", discards: 18, mode: "playing" },
  { name: "river-order-fixture", discards: 18, mode: "river-order-fixture" },
  { name: "draw-ended", discards: 18, mode: "draw-ended" },
  { name: "actions", discards: 9, mode: "actions" },
  { name: "discard-zoom", discards: 18, mode: "discard-zoom" },
  { name: "match-ended", discards: 18, mode: "match-ended" },
  { name: "result-popup", discards: 18, mode: "result-popup" },
  { name: "yaku-guide", discards: 9, mode: "yaku-guide" },
  { name: "waits", discards: 9, mode: "waits" },
  { name: "waits-after-discard", discards: 9, mode: "waits-after-discard" },
  { name: "riichi-ready", discards: 9, mode: "riichi-ready" },
  { name: "riichi-declared", discards: 9, mode: "riichi-declared" },
  { name: "cpu-riichi", discards: 9, mode: "cpu-riichi" },
  { name: "pon-reaction", discards: 9, mode: "pon-reaction" },
  { name: "chi-reaction", discards: 9, mode: "chi-reaction" },
  { name: "open-melds", discards: 9, mode: "open-melds" },
  { name: "multiple-melds", discards: 9, mode: "multiple-melds" },
  { name: "open-tanyao-win", discards: 9, mode: "open-tanyao-win" },
  { name: "open-yakuhai-win", discards: 9, mode: "open-yakuhai-win" },
  { name: "cpu-win", discards: 12, mode: "cpu-win" },
  { name: "cpu-pon", discards: 9, mode: "cpu-pon" },
  { name: "cpu-chi", discards: 9, mode: "cpu-chi" },
  { name: "cpu-open-melds", discards: 9, mode: "cpu-open-melds" },
  { name: "cpu-pon-yakuhai-win", discards: 9, mode: "cpu-pon-yakuhai-win" },
  { name: "cpu-chi-tanyao-win", discards: 9, mode: "cpu-chi-tanyao-win" },
  { name: "multiple-cpu-melds", discards: 9, mode: "multiple-cpu-melds" },
  { name: "cpu-open-yakuhai-win", discards: 9, mode: "cpu-pon-yakuhai-win" },
  { name: "cpu-open-tanyao-win", discards: 9, mode: "cpu-chi-tanyao-win" },
  { name: "cpu-open-multiple-melds", discards: 9, mode: "multiple-cpu-melds" },
  { name: "cpu1-multiple-melds", discards: 9, mode: "cpu1-multiple-melds" },
  { name: "cpu2-multiple-melds", discards: 9, mode: "cpu2-multiple-melds" },
  { name: "cpu3-multiple-melds", discards: 9, mode: "cpu3-multiple-melds" },
  { name: "all-players-melds", discards: 9, mode: "all-players-melds" },
  { name: "cpu-right-four-melds-real", discards: 9, mode: "cpu-right-four-melds-real" },
  { name: "cpu-left-four-melds-real", discards: 9, mode: "cpu-left-four-melds-real" },
  { name: "cpu-top-four-melds-real", discards: 9, mode: "cpu-top-four-melds-real" },
  { name: "all-opponents-four-melds-real", discards: 9, mode: "all-opponents-four-melds-real" },
  { name: "all-players-melds-real", discards: 9, mode: "all-players-melds-real" },
  { name: "cpu-call-late-hand", discards: 18, mode: "cpu-call-late-hand" },
  { name: "cpu-call-flow", discards: 9, mode: "cpu-open-melds" },
  { name: "cpu-call-next-round", discards: 9, mode: "cpu-open-melds" },
  { name: "all-hands-open", discards: 18, mode: "all-hands-open" },
  { name: "settings-menu-open", discards: 9, mode: "settings-menu-open" },
  { name: "gear-menu-open", discards: 9, mode: "gear-menu-open" },
  { name: "assist-buttons-open", discards: 9, mode: "assist-buttons-open" },
  { name: "call-reaction-buttons", discards: 9, mode: "pon-reaction" },
  { name: "riichi-action-buttons", discards: 9, mode: "riichi-ready" }
];
const TOLERANCE = 2;
const VIEWPORT_FILTER = process.env.LAYOUT_CHECK_VIEWPORT || "";
const SCENARIO_FILTER = process.env.LAYOUT_CHECK_SCENARIO || "";
const ACTIVE_VIEWPORTS = VIEWPORT_FILTER
  ? VIEWPORTS.filter((viewport) => `${viewport.width}x${viewport.height}` === VIEWPORT_FILTER)
  : VIEWPORTS;
const ACTIVE_SCENARIOS = SCENARIO_FILTER
  ? SCENARIOS.filter((scenario) => scenario.name === SCENARIO_FILTER || scenario.mode === SCENARIO_FILTER)
  : SCENARIOS;

let server;
let chrome;
let browser;

main().catch(async (error) => {
  console.error(error.stack || error.message || error);
  await cleanup();
  process.exit(1);
});

async function main() {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  server = await startStaticServer(ROOT, PORT);
  chrome = await startChrome();
  browser = await connectToChrome(chrome.port);

  const failures = [];
  for (const viewport of ACTIVE_VIEWPORTS) {
    for (const scenario of ACTIVE_SCENARIOS) {
      const result = await runScenario(viewport, scenario);
      failures.push(...result.failures);
      console.log(formatResult(result));
    }
  }

  await cleanup();

  if (failures.length > 0) {
    console.error("\nLayout check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("\nLayout check passed.");
}

async function runScenario(viewport, scenario) {
  const page = await browser.newPage();
  const label = `${viewport.width}x${viewport.height}-${scenario.name}`;
  const failures = [];

  try {
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 2,
      mobile: true,
      screenOrientation: { type: "landscapePrimary", angle: 90 }
    });
    await page.send("Page.navigate", { url: `http://127.0.0.1:${PORT}/?v=${CACHE_BUST}-${label}` });
    await page.waitForLoad();
    await page.evaluate(setupScenarioSource(), {
      discards: scenario.discards,
      mode: scenario.mode,
      cacheBust: `${CACHE_BUST}-${label}`
    });
    const inspection = await page.evaluate(inspectLayoutSource(), {
      tolerance: TOLERANCE,
      scenarioName: scenario.name,
      mode: scenario.mode
    });
    failures.push(...inspection.failures.map((message) => `${label}: ${message}`));
    await page.screenshot(path.join(ARTIFACT_DIR, `${label}.png`));
    const finalScreenshotName = getAppFinalScreenshotName(viewport, scenario);
    if (finalScreenshotName) {
      await page.screenshot(path.join(ARTIFACT_DIR, finalScreenshotName));
    }

    return {
      label,
      failures,
      summary: inspection.summary
    };
  } finally {
    await page.close();
  }
}

function getAppFinalScreenshotName(viewport, scenario) {
  const viewportKey = `${viewport.width}x${viewport.height}`;
  if (scenario.name === "normal" && ["780x360", "844x390", "932x430"].includes(viewportKey)) {
    return `app-${viewportKey}-final.png`;
  }

  if (viewportKey !== "844x390") {
    return null;
  }

  const scenarioNames = {
    "pon-reaction": "app-844x390-pon-reaction-final.png",
    "chi-reaction": "app-844x390-chi-reaction-final.png",
    "multiple-melds": "app-844x390-multiple-melds-final.png",
    "result-popup": "app-844x390-result-popup-final.png",
    "settings-menu-open": "app-844x390-settings-menu-final.png"
  };

  return scenarioNames[scenario.name] || null;
}

function setupScenarioSource() {
  return `async ({ discards, mode, cacheBust }) => {
    const roundModule = await import("./src/game/round.js?layout=" + cacheBust);
    const actionsModule = await import("./src/game/actions.js?layout=" + cacheBust);
    const renderModule = await import("./src/ui/render.js?layout=" + cacheBust);
    const inputModule = await import("./src/ui/input.js?layout=" + cacheBust);
    const root = document.querySelector("#app");
    const tile = (id, suit, rank, copy = 0) => ({ id, suit, rank, copy, red: false });

    let state = actionsModule.dispatchAction(roundModule.createInitialGameState(), { type: "START_MATCH" });
    state = {
      ...state,
      settings: {
        ...state.settings,
        discardAdviceEnabled: true
      },
      round: {
        ...state.round,
        players: state.round.players.map((player) => ({
          ...player,
          discards: Array.from({ length: discards }, (_, index) => ({
            id: player.wind + "-layout-discard-" + index,
            suit: ["m", "p", "s", "z"][index % 4],
            rank: index % 4 === 3 ? (index % 7) + 1 : (index % 9) + 1,
            copy: index % 4,
            red: false
          }))
        }))
      }
    };

    if (mode === "draw-ended") {
      state = {
        ...state,
        round: {
          ...state.round,
          wall: [],
          phase: "ended",
          endReason: "exhaustive-draw",
          winningResult: null
        }
      };
    }

    if (mode === "match-ended" || mode === "result-popup") {
      state = {
        ...state,
        match: {
          ...state.match,
          phase: "ended",
          status: "ended",
          handNumber: 4,
          dealerIndex: 3,
          roundHistory: [
            { handLabel: "譚ｱ1螻", handNumber: 1, resultType: "draw" },
            { handLabel: "譚ｱ2螻", handNumber: 2, resultType: "tsumo", winnerId: 0, winType: "tsumo" },
            { handLabel: "譚ｱ3螻", handNumber: 3, resultType: "ron", winnerId: 1, winType: "ron" },
            { handLabel: "譚ｱ4螻", handNumber: 4, resultType: "draw" }
          ]
        },
        round: {
          ...state.round,
          handNumber: 4,
          dealerIndex: 3,
          wall: [],
          phase: "ended",
          endReason: "exhaustive-draw",
          winningResult: null
        }
      };
    }

    if (mode === "cpu-win" || mode === "all-hands-open") {
      state = {
        ...state,
        round: {
          ...state.round,
          phase: "ended",
          endReason: "win",
          winningResult: {
            winnerId: 1,
            winType: "ron",
            fromPlayerId: 0,
            loserId: 0,
            winningTile: { id: "cpu-win-z5", suit: "z", rank: 5, copy: 0, red: false },
            handType: "standard",
            handTiles: state.round.players[1].hand,
            yakuResult: [{ id: "yakuhai", name: "Yakuhai", han: 1 }]
          }
        }
      };
    }

    if (mode === "actions") {
      state = {
        ...state,
        round: {
          ...state.round,
          phase: "reaction",
          lastDiscard: {
            playerId: 1,
            tile: { id: "p5-layout-last", suit: "p", rank: 5, copy: 0, red: false }
          }
        }
      };
    }

    if (mode === "riichi-ready" || mode === "riichi-declared") {
      state = {
        ...state,
        round: {
          ...state.round,
          phase: "discard",
          currentPlayerIndex: 0
        }
      };
    }

    if (mode === "riichi-declared") {
      const drawnTile = state.round.players[0].hand[state.round.players[0].hand.length - 1];
      state = {
        ...state,
        round: {
          ...state.round,
          lastDraw: {
            playerId: 0,
            tile: drawnTile
          },
          players: state.round.players.map((player) => player.id === 0
            ? {
              ...player,
              isRiichi: true,
              riichi: true
            }
            : player)
        }
      };
    }

    if (mode === "cpu-riichi") {
      state = {
        ...state,
        round: {
          ...state.round,
          players: state.round.players.map((player) => player.id === 1
            ? {
              ...player,
              isRiichi: true,
              riichi: true
            }
            : player)
        }
      };
    }

    if (mode === "pon-reaction") {
      state = {
        ...state,
        round: {
          ...state.round,
          phase: "reaction",
          lastDiscard: {
            playerId: 1,
            tile: { id: "layout-pon-z5", suit: "z", rank: 5, copy: 0, red: false }
          },
          players: state.round.players.map((player) => player.id === 0
            ? {
              ...player,
              hand: [
                tile("layout-pon-z5-hand-1", "z", 5, 1),
                tile("layout-pon-z5-hand-2", "z", 5, 2),
                ...player.hand.slice(2)
              ]
            }
            : player)
        }
      };
    }

    if (mode === "chi-reaction") {
      state = {
        ...state,
        round: {
          ...state.round,
          phase: "reaction",
          currentPlayerIndex: 3,
          lastDiscard: {
            playerId: 3,
            tile: tile("layout-chi-p5", "p", 5)
          },
          players: state.round.players.map((player) => player.id === 0
            ? {
              ...player,
              hand: [
                tile("layout-chi-p3", "p", 3),
                tile("layout-chi-p4a", "p", 4),
                tile("layout-chi-p4b", "p", 4, 1),
                tile("layout-chi-p6a", "p", 6),
                tile("layout-chi-p6b", "p", 6, 1),
                tile("layout-chi-p7", "p", 7),
                tile("layout-chi-m1", "m", 1),
                tile("layout-chi-m2", "m", 2),
                tile("layout-chi-m3", "m", 3),
                tile("layout-chi-s2", "s", 2),
                tile("layout-chi-s3", "s", 3),
                tile("layout-chi-s4", "s", 4),
                tile("layout-chi-z5", "z", 5)
              ]
            }
            : player)
        }
      };
    }

    if (mode === "open-melds") {
      state = {
        ...state,
        round: {
          ...state.round,
          players: state.round.players.map((player) => player.id === 0
            ? {
              ...player,
              isClosed: false,
              menzen: false,
              melds: [
                {
                  id: "layout-meld-pon-z5",
                  type: "pon",
                  tiles: [
                    { id: "layout-meld-z5-a", suit: "z", rank: 5, copy: 0, red: false },
                    { id: "layout-meld-z5-b", suit: "z", rank: 5, copy: 1, red: false },
                    { id: "layout-meld-z5-c", suit: "z", rank: 5, copy: 2, red: false }
                  ],
                  calledTile: { id: "layout-meld-z5-c", suit: "z", rank: 5, copy: 2, red: false },
                  fromPlayerId: 1
                }
              ]
            }
            : player)
        }
      };
    }

    if (mode === "multiple-melds") {
      state = {
        ...state,
        round: {
          ...state.round,
          phase: "discard",
          currentPlayerIndex: 0,
          players: state.round.players.map((player) => player.id === 0
            ? {
              ...player,
              isClosed: false,
              menzen: false,
              hand: [
                tile("layout-multi-m1", "m", 1),
                tile("layout-multi-m2", "m", 2),
                tile("layout-multi-m3", "m", 3),
                tile("layout-multi-p7", "p", 7),
                tile("layout-multi-p8", "p", 8),
                tile("layout-multi-s2", "s", 2),
                tile("layout-multi-s3", "s", 3),
                tile("layout-multi-s4", "s", 4),
                tile("layout-multi-z6", "z", 6)
              ],
              melds: [
                {
                  id: "layout-multi-pon-z5",
                  type: "pon",
                  tiles: [tile("layout-multi-z5-a", "z", 5), tile("layout-multi-z5-b", "z", 5, 1), tile("layout-multi-z5-c", "z", 5, 2)],
                  calledTile: tile("layout-multi-z5-c", "z", 5, 2),
                  fromPlayerId: 1
                },
                {
                  id: "layout-multi-chi-p345",
                  type: "chi",
                  tiles: [tile("layout-multi-p3", "p", 3), tile("layout-multi-p4", "p", 4), tile("layout-multi-p5", "p", 5)],
                  calledTile: tile("layout-multi-p5", "p", 5),
                  fromPlayerId: 3
                },
                {
                  id: "layout-multi-pon-m9",
                  type: "pon",
                  tiles: [tile("layout-multi-m9-a", "m", 9), tile("layout-multi-m9-b", "m", 9, 1), tile("layout-multi-m9-c", "m", 9, 2)],
                  calledTile: tile("layout-multi-m9-c", "m", 9, 2),
                  fromPlayerId: 2
                }
              ]
            }
            : player)
        }
      };
    }

    if (mode === "open-tanyao-win" || mode === "open-yakuhai-win") {
      const openMeld = mode === "open-tanyao-win"
        ? {
          id: "layout-open-chi-p345",
          type: "chi",
          tiles: [tile("layout-open-p3", "p", 3), tile("layout-open-p4", "p", 4), tile("layout-open-p5", "p", 5)],
          calledTile: tile("layout-open-p5", "p", 5),
          fromPlayerId: 3
        }
        : {
          id: "layout-open-pon-z5",
          type: "pon",
          tiles: [tile("layout-open-z5-a", "z", 5), tile("layout-open-z5-b", "z", 5, 1), tile("layout-open-z5-c", "z", 5, 2)],
          calledTile: tile("layout-open-z5-c", "z", 5, 2),
          fromPlayerId: 1
        };
      state = {
        ...state,
        round: {
          ...state.round,
          phase: "ended",
          endReason: "win",
          winningResult: {
            winnerId: 0,
            winType: "tsumo",
            winningTile: tile("layout-open-win-m5", "m", 5),
            handType: "standard",
            handTiles: state.round.players[0].hand,
            yakuResult: mode === "open-tanyao-win"
              ? [{ id: "tanyao", name: "Tanyao", han: 1 }]
              : [{ id: "yakuhai", name: "Yakuhai", han: 1 }]
          },
          players: state.round.players.map((player) => player.id === 0
            ? {
              ...player,
              isClosed: false,
              menzen: false,
              melds: [openMeld]
            }
            : player)
        }
      };
    }

    if (
      mode === "cpu-pon"
      || mode === "cpu-chi"
      || mode === "cpu-open-melds"
      || mode === "cpu-pon-yakuhai-win"
      || mode === "cpu-chi-tanyao-win"
      || mode === "multiple-cpu-melds"
      || mode === "cpu1-multiple-melds"
      || mode === "cpu2-multiple-melds"
      || mode === "cpu3-multiple-melds"
      || mode === "all-players-melds"
      || mode === "cpu-right-four-melds-real"
      || mode === "cpu-left-four-melds-real"
      || mode === "cpu-top-four-melds-real"
      || mode === "all-opponents-four-melds-real"
      || mode === "all-players-melds-real"
      || mode === "cpu-call-late-hand"
    ) {
      const cpu1Meld = {
        id: "layout-cpu-pon-z5",
        type: "pon",
        tiles: [tile("layout-cpu-z5-a", "z", 5), tile("layout-cpu-z5-b", "z", 5, 1), tile("layout-cpu-z5-c", "z", 5, 2)],
        calledTile: tile("layout-cpu-z5-c", "z", 5, 2),
        fromPlayerId: 0
      };
      const cpu1ChiMeld = {
        id: "layout-cpu-chi-p345",
        type: "chi",
        tiles: [tile("layout-cpu-p3", "p", 3), tile("layout-cpu-p4", "p", 4), tile("layout-cpu-p5", "p", 5)],
        calledTile: tile("layout-cpu-p5", "p", 5),
        fromPlayerId: 0
      };
      const cpu2Meld = {
        id: "layout-cpu2-pon-z6",
        type: "pon",
        tiles: [tile("layout-cpu2-z6-a", "z", 6), tile("layout-cpu2-z6-b", "z", 6, 1), tile("layout-cpu2-z6-c", "z", 6, 2)],
        calledTile: tile("layout-cpu2-z6-c", "z", 6, 2),
        fromPlayerId: 3
      };
      const cpu3Meld = {
        id: "layout-cpu3-pon-z7",
        type: "pon",
        tiles: [tile("layout-cpu3-z7-a", "z", 7), tile("layout-cpu3-z7-b", "z", 7, 1), tile("layout-cpu3-z7-c", "z", 7, 2)],
        calledTile: tile("layout-cpu3-z7-c", "z", 7, 2),
        fromPlayerId: 2
      };
      const cpu1PonMeld2 = {
        id: "layout-cpu1-pon-m7",
        type: "pon",
        tiles: [tile("layout-cpu1-m7-a", "m", 7), tile("layout-cpu1-m7-b", "m", 7, 1), tile("layout-cpu1-m7-c", "m", 7, 2)],
        calledTile: tile("layout-cpu1-m7-c", "m", 7, 2),
        fromPlayerId: 3
      };
      const cpu1ChiMeld2 = {
        id: "layout-cpu1-chi-s456",
        type: "chi",
        tiles: [tile("layout-cpu1-s4", "s", 4), tile("layout-cpu1-s5", "s", 5), tile("layout-cpu1-s6", "s", 6)],
        calledTile: tile("layout-cpu1-s5", "s", 5),
        fromPlayerId: 0
      };
      const cpu2ChiMeld = {
        id: "layout-cpu2-chi-m345",
        type: "chi",
        tiles: [tile("layout-cpu2-m3", "m", 3), tile("layout-cpu2-m4", "m", 4), tile("layout-cpu2-m5", "m", 5)],
        calledTile: tile("layout-cpu2-m4", "m", 4),
        fromPlayerId: 1
      };
      const cpu2PonMeld2 = {
        id: "layout-cpu2-pon-p7",
        type: "pon",
        tiles: [tile("layout-cpu2-p7-a", "p", 7), tile("layout-cpu2-p7-b", "p", 7, 1), tile("layout-cpu2-p7-c", "p", 7, 2)],
        calledTile: tile("layout-cpu2-p7-c", "p", 7, 2),
        fromPlayerId: 0
      };
      const cpu2ChiMeld2 = {
        id: "layout-cpu2-chi-s234",
        type: "chi",
        tiles: [tile("layout-cpu2-s2", "s", 2), tile("layout-cpu2-s3", "s", 3), tile("layout-cpu2-s4", "s", 4)],
        calledTile: tile("layout-cpu2-s3", "s", 3),
        fromPlayerId: 1
      };
      const cpu3ChiMeld = {
        id: "layout-cpu3-chi-p456",
        type: "chi",
        tiles: [tile("layout-cpu3-p4", "p", 4), tile("layout-cpu3-p5", "p", 5), tile("layout-cpu3-p6", "p", 6)],
        calledTile: tile("layout-cpu3-p5", "p", 5),
        fromPlayerId: 2
      };
      const cpu3PonMeld2 = {
        id: "layout-cpu3-pon-m8",
        type: "pon",
        tiles: [tile("layout-cpu3-m8-a", "m", 8), tile("layout-cpu3-m8-b", "m", 8, 1), tile("layout-cpu3-m8-c", "m", 8, 2)],
        calledTile: tile("layout-cpu3-m8-c", "m", 8, 2),
        fromPlayerId: 1
      };
      const cpu3ChiMeld2 = {
        id: "layout-cpu3-chi-s567",
        type: "chi",
        tiles: [tile("layout-cpu3-s5", "s", 5), tile("layout-cpu3-s6", "s", 6), tile("layout-cpu3-s7", "s", 7)],
        calledTile: tile("layout-cpu3-s6", "s", 6),
        fromPlayerId: 2
      };
      const humanOpenMeld = {
        id: "layout-all-human-pon-z5",
        type: "pon",
        tiles: [tile("layout-all-human-z5-a", "z", 5), tile("layout-all-human-z5-b", "z", 5, 1), tile("layout-all-human-z5-c", "z", 5, 2)],
        calledTile: tile("layout-all-human-z5-c", "z", 5, 2),
        fromPlayerId: 1
      };

      state = {
        ...state,
        round: {
          ...state.round,
          phase: (mode === "cpu-pon-yakuhai-win" || mode === "cpu-chi-tanyao-win") ? "ended" : "discard",
          currentPlayerIndex: 1,
          endReason: (mode === "cpu-pon-yakuhai-win" || mode === "cpu-chi-tanyao-win") ? "win" : state.round.endReason,
          winningResult: (mode === "cpu-pon-yakuhai-win" || mode === "cpu-chi-tanyao-win")
            ? {
              winnerId: 1,
              winType: "tsumo",
              winningTile: tile("layout-cpu-win-m9", "m", 9),
              handType: "standard",
              handTiles: state.round.players[1].hand,
              yakuResult: mode === "cpu-chi-tanyao-win"
                ? [{ id: "tanyao", name: "Tanyao", han: 1 }]
                : [{ id: "yakuhai", name: "Yakuhai", han: 1 }]
            }
            : state.round.winningResult,
          players: state.round.players.map((player) => {
            if (player.id === 1) {
              const melds = mode === "cpu-chi" || mode === "cpu-chi-tanyao-win"
                ? [cpu1ChiMeld]
                : mode === "cpu1-multiple-melds" || mode === "cpu-right-four-melds-real" || mode === "all-opponents-four-melds-real" || mode === "all-players-melds-real"
                  ? [cpu1Meld, cpu1ChiMeld, cpu1PonMeld2, cpu1ChiMeld2]
                  : mode === "all-players-melds" || mode === "cpu-call-late-hand"
                    ? [cpu1Meld, cpu1ChiMeld, cpu1PonMeld2]
                    : mode === "cpu-open-melds" || mode === "multiple-cpu-melds"
                      ? [cpu1Meld, cpu1ChiMeld]
                      : [cpu1Meld];
              return {
                ...player,
                isClosed: false,
                menzen: false,
                melds
              };
            }

            if ((mode === "multiple-cpu-melds" || mode === "cpu2-multiple-melds" || mode === "all-players-melds" || mode === "cpu-call-late-hand" || mode === "cpu-top-four-melds-real" || mode === "all-opponents-four-melds-real" || mode === "all-players-melds-real") && player.id === 2) {
              const melds = mode === "cpu2-multiple-melds" || mode === "cpu-top-four-melds-real" || mode === "all-opponents-four-melds-real" || mode === "all-players-melds-real"
                ? [cpu2Meld, cpu2ChiMeld, cpu2PonMeld2, cpu2ChiMeld2]
                : [cpu2Meld, cpu2ChiMeld, cpu2PonMeld2];
              return {
                ...player,
                isClosed: false,
                menzen: false,
                melds
              };
            }

            if ((mode === "multiple-cpu-melds" || mode === "cpu3-multiple-melds" || mode === "all-players-melds" || mode === "cpu-call-late-hand" || mode === "cpu-left-four-melds-real" || mode === "all-opponents-four-melds-real" || mode === "all-players-melds-real") && player.id === 3) {
              const melds = mode === "cpu3-multiple-melds" || mode === "cpu-left-four-melds-real" || mode === "all-opponents-four-melds-real" || mode === "all-players-melds-real"
                ? [cpu3Meld, cpu3ChiMeld, cpu3PonMeld2, cpu3ChiMeld2]
                : [cpu3Meld, cpu3ChiMeld, cpu3PonMeld2];
              return {
                ...player,
                isClosed: false,
                menzen: false,
                melds
              };
            }

            if ((mode === "all-players-melds" || mode === "cpu-call-late-hand" || mode === "all-players-melds-real") && player.id === 0) {
              return {
                ...player,
                isClosed: false,
                menzen: false,
                melds: [humanOpenMeld]
              };
            }

            return player;
          })
        }
      };
    }

    const baseRenderOptions = {
      canDeclareTsumo: () => mode === "actions",
      canDeclareRon: () => mode === "actions",
      canDeclarePon: () => mode === "pon-reaction",
      getPonOptions: () => mode === "pon-reaction" ? actionsModule.getPonOptions(state, 0) : [],
      canDeclareChi: () => mode === "chi-reaction" ? actionsModule.canDeclareChi(state, 0) : false,
      getChiOptions: () => mode === "chi-reaction" ? actionsModule.getChiOptions(state, 0) : [],
      canDeclareRiichi: () => mode === "riichi-ready",
      getRiichiDiscardOptions: () => mode === "riichi-ready"
        ? [
          {
            discardTile: state.round.players[0].hand[0],
            discardTileId: state.round.players[0].hand[0]?.id,
            waits: [{ tileLabel: "5 pin", hasYaku: true }]
          }
        ]
        : [],
      suggestDiscards: () => [
        {
          tileId: state.round.players[0].hand[0]?.id,
          priority: 1,
          label: "Advice",
          reason: "Layout check advice reason one."
        },
        {
          tileId: state.round.players[0].hand[1]?.id,
          priority: 2,
          label: "Candidate",
          reason: "Layout check advice reason two."
        }
      ],
      discardAdviceDialogOpen: mode === "actions",
      discardZoomPlayerId: mode === "discard-zoom" ? 0 : null,
      matchResultDialogOpen: mode === "result-popup",
      yakuGuideDialogOpen: mode === "yaku-guide",
      waitsDialogOpen: mode === "waits" || mode === "waits-after-discard",
      allHandsDialogOpen: mode === "all-hands-open",
      settingsMenuOpen: mode === "settings-menu-open" || mode === "gear-menu-open",
      analyzeWaits: () => mode === "waits-after-discard"
        ? ({
          isTenpai: false,
          message: "A 14-tile hand uses discard-to-wait guidance.",
          waits: []
        })
        : ({
          isTenpai: true,
          message: "5 pin completes the hand.",
          waits: [
          {
            tile: { id: "wait-p5", suit: "p", rank: 5, copy: 0, red: false },
            tileLabel: "5 pin",
            canWin: true,
            hasYaku: true,
            yaku: [{ id: "tanyao", name: "Tanyao", han: 1 }],
            message: "5 pin completes the hand."
          },
          {
            tile: { id: "wait-m9", suit: "m", rank: 9, copy: 0, red: false },
            tileLabel: "9 man",
            canWin: false,
            hasYaku: false,
            yaku: [],
            message: "9 man completes the shape, but there is no yaku."
          }
          ]
        }),
      analyzeDiscardWaits: () => mode === "waits-after-discard"
        ? ({
          hasTenpaiDiscard: true,
          message: "Discard 1 man to keep waits.",
          options: [
            {
              discardTile: { id: "discard-m1", suit: "m", rank: 1, copy: 0, red: false },
              discardTileId: "discard-m1",
              discardTileLabel: "1 man",
              isTenpaiAfterDiscard: true,
              hasYakuWait: true,
              message: "Discard 1 man for a 5 pin wait.",
              waits: [
                {
                  tile: { id: "wait-p5", suit: "p", rank: 5, copy: 0, red: false },
                  tileLabel: "5 pin",
                  canWin: true,
                  hasYaku: true,
                  yaku: [{ id: "tanyao", name: "Tanyao", han: 1 }],
                  message: "5 pin completes the hand."
                },
                {
                  tile: { id: "wait-s8", suit: "s", rank: 8, copy: 0, red: false },
                  tileLabel: "8 sou",
                  canWin: true,
                  hasYaku: true,
                  yaku: [{ id: "tanyao", name: "Tanyao", han: 1 }],
                  message: "8 sou completes the hand."
                }
              ]
            },
            {
              discardTile: { id: "discard-z1", suit: "z", rank: 1, copy: 0, red: false },
              discardTileId: "discard-z1",
              discardTileLabel: "East",
              isTenpaiAfterDiscard: true,
              hasYakuWait: false,
              message: "Discard east for a shape-complete no-yaku wait.",
              waits: [
                {
                  tile: { id: "wait-m9", suit: "m", rank: 9, copy: 0, red: false },
                  tileLabel: "9 man",
                  canWin: false,
                  hasYaku: false,
                  yaku: [],
                  message: "9 man completes the shape, but no yaku."
                }
              ]
            }
          ]
        })
        : ({
          hasTenpaiDiscard: false,
          options: [],
          message: ""
        }),
      suggestYakuTargets: () => [
        {
          id: "tanyao",
          name: "Tanyao",
          reading: "Tanyao",
          priority: 80,
          description: "A hand without terminals or honors.",
          why: "Many middle number tiles are present.",
          keepHints: ["Keep 2-8 suited tiles"],
          discardHints: ["Terminals and honors are easier to discard"],
          exampleTiles: [
            { id: "guide-m2", suit: "m", rank: 2, copy: 0, red: false },
            { id: "guide-m3", suit: "m", rank: 3, copy: 0, red: false },
            { id: "guide-m4", suit: "m", rank: 4, copy: 0, red: false },
            { id: "guide-p4", suit: "p", rank: 4, copy: 0, red: false },
            { id: "guide-p5", suit: "p", rank: 5, copy: 0, red: false },
            { id: "guide-p6", suit: "p", rank: 6, copy: 0, red: false }
          ]
        },
        {
          id: "yakuhai",
          name: "Yakuhai",
          reading: "Yakuhai",
          priority: 70,
          description: "A triplet of dragons or value winds.",
          why: "A value-tile pair can become a yaku.",
          keepHints: ["Keep value tiles"],
          discardHints: ["Isolated tiles"],
          exampleTiles: [
            { id: "guide-z5a", suit: "z", rank: 5, copy: 0, red: false },
            { id: "guide-z5b", suit: "z", rank: 5, copy: 1, red: false },
            { id: "guide-z5c", suit: "z", rank: 5, copy: 2, red: false }
          ]
        }
      ]
    };

    const renderWithOptions = (extraOptions = {}) => {
      renderModule.renderGame(state, root, {
        ...baseRenderOptions,
        ...extraOptions
      });
      inputModule.bindControls(root, {
        onOpenDiscardAdvice() {
          renderWithOptions({
            discardAdviceDialogOpen: true,
            yakuGuideDialogOpen: false,
            waitsDialogOpen: false
          });
        },
        onCloseDiscardAdvice() {
          renderWithOptions({ discardAdviceDialogOpen: false });
        },
        onOpenYakuGuide() {
          renderWithOptions({
            discardAdviceDialogOpen: false,
            yakuGuideDialogOpen: true,
            waitsDialogOpen: false
          });
        },
        onCloseYakuGuide() {
          renderWithOptions({ yakuGuideDialogOpen: false });
        },
        onOpenWaits() {
          renderWithOptions({
            discardAdviceDialogOpen: false,
            yakuGuideDialogOpen: false,
            waitsDialogOpen: true
          });
        },
        onCloseWaits() {
          renderWithOptions({ waitsDialogOpen: false });
        },
        onOpenDiscardZoom() {},
        onOpenSettingsMenu() {
          renderWithOptions({
            discardAdviceDialogOpen: false,
            yakuGuideDialogOpen: false,
            waitsDialogOpen: false,
            settingsMenuOpen: true
          });
        },
        onCloseSettingsMenu() {
          renderWithOptions({ settingsMenuOpen: false });
        },
        onStartMatch() {},
        onStartRound() {},
        onStartNextRound() {},
        onToggleLargeTileMode() {},
        onToggleDiscardAdvice() {},
        onDeclareTsumo() {},
        onDeclareRon() {},
        onDeclareRiichi() {},
        onCancelRiichi() {},
        onOpenCallOptions(callType) {
          renderWithOptions({
            discardAdviceDialogOpen: false,
            yakuGuideDialogOpen: false,
            waitsDialogOpen: false,
            settingsMenuOpen: false,
            callOptionsDialogType: callType
          });
        },
        onCloseCallOptions() {
          renderWithOptions({ callOptionsDialogType: null });
        },
        onDeclarePon() {},
        onDeclareChi() {},
        onSkipRon() {},
        onDiscardTile() {}
      });
    };

    renderWithOptions();

    window.__layoutClickAssist = async (action) => {
      const modalSelectors = {
        "open-discard-advice": ".discard-advice-modal",
        "open-yaku-guide": ".yaku-guide-modal",
        "open-waits": ".waits-modal"
      };
      const button = document.querySelector(".table-meld-self [data-action='" + action + "']");
      if (!button) {
        return { found: false, opened: false };
      }
      button.click();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const opened = Boolean(document.querySelector(modalSelectors[action]));
      renderWithOptions();
      return { found: true, opened };
    };

    window.__layoutClickGearMenu = async () => {
      const button = document.querySelector("[data-action='open-settings-menu']");
      if (!button) {
        return { found: false, opened: false };
      }
      button.click();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const opened = Boolean(document.querySelector(".settings-menu-modal"));
      renderWithOptions();
      return { found: true, opened };
    };

    window.__layoutClickCallTrigger = async (callType) => {
      const button = document.querySelector("[data-action='open-call-options'][data-call-type='" + callType + "']");
      if (!button) {
        return { found: false, opened: false };
      }
      button.click();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const opened = Boolean(document.querySelector(".call-options-modal"));
      renderWithOptions();
      return { found: true, opened };
    };
  }`;
}

function inspectLayoutSource() {
  return `async ({ tolerance, scenarioName, mode }) => {
    const failures = [];
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const selectors = {
      app: ".app",
      header: ".topbar",
      table: ".table",
      centerPanel: ".center-panel",
      centerRing: ".table-exact",
      centerInfo: ".center-score-board",
      topSeat: ".table-seat-top",
      leftSeat: ".table-seat-left",
      rightSeat: ".table-seat-right",
      selfSeat: ".table-seat-self",
      topDiscard: ".table-discard-top",
      leftDiscard: ".table-discard-left",
      rightDiscard: ".table-discard-right",
      bottomDiscard: ".table-discard-bottom",
      topMeld: ".table-meld-top",
      leftMeld: ".table-meld-left",
      rightMeld: ".table-meld-right",
      selfMeld: ".table-meld-self",
      actionArea: ".human-action-area",
      hand: ".table-seat-bottom .hand",
      handTile: ".table-seat-bottom .hand .tile",
      gearButton: "[data-action='open-settings-menu']",
      adviceButton: ".table-meld-self [data-action='open-discard-advice']",
      yakuGuideButton: ".table-meld-self [data-action='open-yaku-guide']",
      waitsButton: ".table-meld-self [data-action='open-waits']"
    };

    if (document.documentElement.scrollWidth > viewport.width + tolerance) {
      failures.push("page has horizontal overflow: " + document.documentElement.scrollWidth + " > " + viewport.width);
    }

    if (document.body && document.body.scrollWidth > viewport.width + tolerance) {
      failures.push("body has horizontal overflow: " + document.body.scrollWidth + " > " + viewport.width);
    }

    if (document.documentElement.scrollHeight > viewport.height + tolerance) {
      failures.push("page has vertical overflow: " + document.documentElement.scrollHeight + " > " + viewport.height);
    }

    if (document.body && document.body.scrollHeight > viewport.height + tolerance) {
      failures.push("body has vertical overflow: " + document.body.scrollHeight + " > " + viewport.height);
    }

    const rects = {};
    for (const [name, selector] of Object.entries(selectors)) {
      const element = document.querySelector(selector);
      if (!element) {
        if (name === "adviceButton") {
          continue;
        }
        if (name === "header") {
          continue;
        }
        failures.push(name + " is missing: " + selector);
        continue;
      }

      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      rects[name] = toRect(rect);
      if (style.display === "none" || style.visibility === "hidden") {
        failures.push(name + " is hidden");
      }
      if (rect.width <= 0 || rect.height <= 0) {
        failures.push(name + " has no size");
      }
      if (!isInViewport(rect, viewport, tolerance)) {
        failures.push(name + " is outside viewport: " + rectToString(rect));
      }
    }

    const visibleHeader = document.querySelector(".app-in-round .topbar");
    if (visibleHeader && getComputedStyle(visibleHeader).display !== "none") {
      failures.push("in-round header should not be visible");
    }

    const tableRect = rects.table;
    const centerRect = rects.centerPanel;
    if (tableRect && centerRect) {
      if (rects.topSeat && rects.topDiscard && rects.topSeat.left < rects.topDiscard.right - tolerance) {
        failures.push("CPU2 seat should be right of top river");
      }
      if (rects.rightSeat && rects.rightDiscard && rects.rightSeat.left < rects.rightDiscard.right - tolerance) {
        failures.push("CPU1 seat should be right of right river");
      }
      if (rects.leftSeat && rects.leftDiscard && rects.leftSeat.right > rects.leftDiscard.left + tolerance) {
        failures.push("CPU3 seat should be left of left river");
      }
      if (rects.selfSeat && rects.bottomDiscard && rects.selfSeat.right > rects.bottomDiscard.left + tolerance) {
        failures.push("human seat marker should be left of self river");
      }

      if (rects.topMeld && rects.topDiscard && rects.topMeld.right > rects.topDiscard.left + tolerance) {
        failures.push("CPU2 meld lane should be left of top river");
      }
      if (rects.selfMeld && rects.bottomDiscard && rects.selfMeld.left < rects.bottomDiscard.right - tolerance) {
        failures.push("human meld lane should be right of self river");
      }
      if (rects.actionArea && rects.bottomDiscard && rects.actionArea.left < rects.bottomDiscard.right - tolerance) {
        failures.push("action area should be right of self river");
      }
      if (rects.actionArea && rects.selfMeld && rects.actionArea.right > rects.selfMeld.left + tolerance) {
        failures.push("action area should be left of human meld lane");
      }

      if (rects.leftSeat && rects.leftSeat.width > viewport.width * 0.08) {
        failures.push("CPU3 left seat is too wide: " + rects.leftSeat.width);
      }
      if (rects.rightSeat && rects.rightSeat.width > viewport.width * 0.08) {
        failures.push("CPU1 right seat is too wide: " + rects.rightSeat.width);
      }
      if (rects.topSeat && rects.topSeat.width > viewport.width * 0.1) {
        failures.push("CPU2 top seat is too wide: " + rects.topSeat.width);
      }
      if (rects.selfSeat && rects.selfSeat.width > viewport.width * 0.12) {
        failures.push("human seat marker is too wide: " + rects.selfSeat.width);
      }

      const tableCenterX = tableRect.left + tableRect.width / 2;
      const tableCenterY = tableRect.top + tableRect.height / 2;
      const centerX = centerRect.left + centerRect.width / 2;
      const centerY = centerRect.top + centerRect.height / 2;
      if (Math.abs(centerX - tableCenterX) > viewport.width * 0.12) {
        failures.push("center score board is too far from table horizontal center");
      }
      if (Math.abs(centerY - tableCenterY) > viewport.height * 0.16) {
        failures.push("center score board is too far from table vertical center");
      }
      const minCenterHeight = Math.min(104, viewport.height * 0.26);
      if (centerRect.width < 104 || centerRect.height < minCenterHeight) {
        failures.push("center score board is too small: " + rectToString(centerRect));
      }
    }

    if (rects.gearButton) {
      if (rects.gearButton.width > viewport.width * 0.08 || rects.gearButton.height > viewport.height * 0.12) {
        failures.push("gear button is too large: " + rectToString(rects.gearButton));
      }
    }

    if (rects.hand && rects.hand.width < viewport.width * 0.9) {
      failures.push("human hand uses too little width: " + rects.hand.width + " < " + viewport.width * 0.9);
    }

    if (rects.centerInfo) {
      const centerText = document.querySelector(selectors.centerInfo)?.innerText || "";
      if (centerText.includes("\u3042\u306a\u305f\u306e\u756a")) {
        failures.push("center score board should not show human turn sentence");
      }
      if (centerText.includes("...") || centerText.includes("…")) {
        failures.push("center score board text appears ellipsized");
      }
      const scoreValues = [...document.querySelectorAll(".center-score-board .score-value")].map((node) => node.textContent.trim());
      if (scoreValues.length < 4 || scoreValues.some((value) => value !== "25000")) {
        failures.push("center score board should show all four 25000 scores");
      }
      const windIndicators = [...document.querySelectorAll(".center-score-board .wind-indicator")];
      if (windIndicators.length < 4) {
        failures.push("center score board should show four wind indicators");
      }
      for (const [index, value] of scoreValues.entries()) {
        if (/[東南西北]/.test(value)) {
          failures.push("score value " + index + " should not include wind text");
        }
      }
      if (centerRect) {
        const scoreItems = [...document.querySelectorAll(".center-score-board .score-unit")];
        for (const [index, item] of scoreItems.entries()) {
          const itemRect = item.getBoundingClientRect();
          if (!isInsideRect(itemRect, centerRect, tolerance)) {
            failures.push("center score item " + index + " is clipped by center board");
            break;
          }
        }
        const centerCore = document.querySelector(".center-score-board .score-core");
        const coreRect = centerCore ? toRect(centerCore.getBoundingClientRect()) : null;
        if (centerCore && !isInsideRect(centerCore.getBoundingClientRect(), centerRect, tolerance)) {
          failures.push("center score core is clipped by center board");
        }
        for (const item of scoreItems) {
          const position = item.dataset.seatPosition || "unknown";
          checkOverlap("center core", coreRect, "score unit " + position, toRect(item.getBoundingClientRect()), 0);
        }
      }
    }

    if (centerRect) {
      if (rects.topDiscard && rects.topDiscard.bottom > centerRect.top + tolerance) {
        failures.push("top discard river is not above the center score board");
      }
      if (rects.bottomDiscard && rects.bottomDiscard.top < centerRect.bottom - tolerance) {
        failures.push("bottom discard river is not below the center score board");
      }
      if (rects.leftDiscard && rects.leftDiscard.right > centerRect.left + tolerance) {
        failures.push("left discard river is not left of the center score board");
      }
      if (rects.rightDiscard && rects.rightDiscard.left < centerRect.right - tolerance) {
        failures.push("right discard river is not right of the center score board");
      }
    }

    for (const name of ["topDiscard", "leftDiscard", "rightDiscard", "bottomDiscard"]) {
      const selector = selectors[name];
      const zone = document.querySelector(selector);
      if (!zone) continue;
      const zoneRect = zone.getBoundingClientRect();
      const tiles = [...zone.querySelectorAll(".discard-tile")];
      if (tiles.length === 0) continue;
      const riverGrid = zone.querySelector(".table-center-discards");
      if (riverGrid && tiles.length >= 13) {
        const style = getComputedStyle(riverGrid);
        const columnCount = getGridTrackCount(style.gridTemplateColumns);
        const rowCount = getGridTrackCount(style.gridTemplateRows);
        if (columnCount !== 6 || rowCount !== 3) {
          failures.push(name + " river should be a local 6x3 grid but was " + columnCount + "x" + rowCount);
        }
        const orderValues = tiles.map((tile) => Number(tile.dataset.discardOrder));
        if (orderValues.some((value, index) => value !== index + 1)) {
          failures.push(name + " river discard order data is not 1..n");
        }
        const orderFailure = getLocalRiverOrderFailure(name, tiles);
        if (orderFailure) {
          failures.push(orderFailure);
        }
      }

      for (const [index, tile] of tiles.entries()) {
        const rect = tile.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
          failures.push(name + " discard " + index + " has no size");
        }
        if (Math.min(rect.width, rect.height) < 15) {
          failures.push(name + " discard " + index + " visible size is too small: " + rectToString(rect));
          break;
        }
        if (!isInViewport(rect, viewport, tolerance)) {
          failures.push(name + " discard " + index + " is outside viewport");
          break;
        }
      }
    }

    const expectedRotations = {
      topDiscard: 180,
      leftDiscard: 90,
      rightDiscard: -90,
      bottomDiscard: 0
    };
    for (const [name, expectedAngle] of Object.entries(expectedRotations)) {
      const river = document.querySelector(selectors[name] + " .table-center-discards");
      if (!river) continue;
      const angle = getRotationAngle(river);
      if (!angleMatches(angle, expectedAngle)) {
        failures.push(name + " river rotation expected " + expectedAngle + "deg but got " + angle + "deg");
      }
    }

    const hand = document.querySelector(selectors.hand);
    const handRect = hand?.getBoundingClientRect();
    if (hand && handRect) {
      const handStyle = getComputedStyle(hand);
      const handGap = Number.parseFloat(handStyle.columnGap || handStyle.gap || "0");
      if (Number.isFinite(handGap) && handGap > 2.1) {
        failures.push("human hand tile gap is too large: " + handGap);
      }

      const handBadges = [...document.querySelectorAll(".human-hand-panel .seat-dealer-badge, .human-hand-panel .seat-turn-indicator")];
      for (const badge of handBadges) {
        const style = getComputedStyle(badge);
        const rect = badge.getBoundingClientRect();
        if (style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0) {
          failures.push("dealer/turn badge is visible inside human hand area");
          break;
        }
      }

      const handTiles = [...hand.querySelectorAll(".tile")];
      for (const [index, tile] of handTiles.entries()) {
        const rect = tile.getBoundingClientRect();
        if (rect.bottom > handRect.bottom + tolerance || rect.top < handRect.top - tolerance) {
          failures.push("hand tile " + index + " is vertically clipped");
          break;
        }
      }

      const badges = [...hand.querySelectorAll(".advice-badge")];
      for (const [index, badge] of badges.entries()) {
        const style = getComputedStyle(badge);
        if (style.display === "none" || style.visibility === "hidden") {
          continue;
        }
        const rect = badge.getBoundingClientRect();
        if (rect.bottom > handRect.bottom + tolerance || rect.top < handRect.top - tolerance) {
          failures.push("recommended badge " + index + " is clipped");
          break;
        }
        if (rect.width > 22 || rect.height > 18) {
          failures.push("recommended badge " + index + " is too large or wrapped: " + rectToString(rect));
          break;
        }
      }
    }

    const callOptionsModal = document.querySelector(".call-options-modal");
    const modal = document.querySelector(".discard-advice-modal");
    const zoomModal = document.querySelector(".discard-zoom-modal");
    const resultModal = document.querySelector(".match-result-modal");
    const yakuGuideModal = document.querySelector(".yaku-guide-modal");
    const waitsModal = document.querySelector(".waits-modal");
    const allHandsModal = document.querySelector(".all-hands-modal");
    const settingsMenuModal = document.querySelector(".settings-menu-modal");
    const modalList = [
      callOptionsModal,
      modal,
      zoomModal,
      resultModal,
      yakuGuideModal,
      waitsModal,
      allHandsModal,
      settingsMenuModal
    ].filter(Boolean);
    if (modalList.length > 1) {
      failures.push("multiple modal surfaces are visible at once: " + modalList.map((node) => node.className).join(", "));
    }
    const activeModal = modalList[0] || null;

    if (!activeModal && rects.gearButton && !isClickableAtCenter(document.querySelector(selectors.gearButton), rects.gearButton)) {
      failures.push("gear menu button is not clickable at center");
    }

    const actionButtons = [...document.querySelectorAll(".table-action-bar button, .restart-match-button, .next-round-button")];
    const actionBar = document.querySelector(".human-action-area .table-action-bar");
    if (!activeModal) {
      for (const [index, button] of actionButtons.entries()) {
        const rect = button.getBoundingClientRect();
        if (!isInViewport(rect, viewport, tolerance)) {
          failures.push("action button " + index + " is outside viewport");
        }
        if (!isClickableAtCenter(button, rect)) {
          failures.push("action button " + index + " is not clickable at center");
        }
      }
    }
    if (actionBar && handRect) {
      checkOverlap("action bar", toRect(actionBar.getBoundingClientRect()), "human hand", toRect(handRect), 0);
    }

    const assistButtons = [
      ["advice", selectors.adviceButton, "open-discard-advice"],
      ["yaku guide", selectors.yakuGuideButton, "open-yaku-guide"],
      ["waits", selectors.waitsButton, "open-waits"]
    ];
    if (!activeModal) {
      for (const [name, selector] of assistButtons) {
        const button = document.querySelector(selector);
        if (!button) {
          continue;
        }
        const rect = button.getBoundingClientRect();
        if (!isInViewport(rect, viewport, tolerance)) {
          failures.push(name + " assist button is outside viewport");
        }
        if (!isClickableAtCenter(button, rect)) {
          failures.push(name + " assist button is not clickable at center");
        }
      }
    }

    const ponButton = document.querySelector("[data-action='declare-pon']");
    if (ponButton && !isInViewport(ponButton.getBoundingClientRect(), viewport, tolerance)) {
      failures.push("pon button is outside viewport");
    }

    const chiButtons = [...document.querySelectorAll("[data-action='declare-chi']")];
    for (const [index, button] of chiButtons.entries()) {
      const rect = button.getBoundingClientRect();
      if (!isInViewport(rect, viewport, tolerance)) {
        failures.push("chi button " + index + " is outside viewport");
      }
      if (!isClickableAtCenter(button, rect)) {
        failures.push("chi button " + index + " is not clickable at center");
      }
      const optionTiles = [...button.querySelectorAll(".chi-option-tile")];
      if (optionTiles.length < 3) {
        failures.push("chi button " + index + " does not show a 3-tile option");
      }
    }

    const meldArea = document.querySelector(".table-meld-bottom .meld-area");
    const meldRect = meldArea ? toRect(meldArea.getBoundingClientRect()) : null;
    if (meldArea && !isInViewport(meldArea.getBoundingClientRect(), viewport, tolerance)) {
      failures.push("meld area is outside viewport");
    }
    if (meldArea) {
      const meldStyle = getComputedStyle(meldArea);
      const allowsHorizontalScroll = ["auto", "scroll"].includes(meldStyle.overflowX)
        && meldArea.scrollWidth > meldArea.clientWidth + 1;
      const melds = [...meldArea.querySelectorAll(".meld")];
      for (const [index, meld] of melds.entries()) {
        const rect = meld.getBoundingClientRect();
        if (!isInsideRect(rect, meldArea.getBoundingClientRect(), tolerance) && !allowsHorizontalScroll) {
          failures.push("meld " + index + " is clipped inside meld area");
          break;
        }
      }
    }
    if (meldRect && handRect) {
      const handTiles = [...hand.querySelectorAll(".tile")];
      for (const [index, tile] of handTiles.entries()) {
        const tileRect = toRect(tile.getBoundingClientRect());
        const beforeCount = failures.length;
        checkOverlap("meld area", meldRect, "hand tile " + index, tileRect, 0);
        if (failures.length > beforeCount) {
          break;
        }
      }
    }

    const expectedMeldCountsByMode = {
      "multiple-cpu-melds": { right: 2, top: 3, left: 3 },
      "cpu1-multiple-melds": { right: 4 },
      "cpu2-multiple-melds": { top: 4 },
      "cpu3-multiple-melds": { left: 4 },
      "all-players-melds": { right: 3, top: 3, left: 3, self: 1 },
      "cpu-right-four-melds-real": { right: 4 },
      "cpu-left-four-melds-real": { left: 4 },
      "cpu-top-four-melds-real": { top: 4 },
      "all-opponents-four-melds-real": { right: 4, top: 4, left: 4 },
      "all-players-melds-real": { right: 4, top: 4, left: 4, self: 1 },
      "cpu-call-late-hand": { right: 3, top: 3, left: 3, self: 1 }
    };
    const expectedMeldCounts = expectedMeldCountsByMode[mode] || expectedMeldCountsByMode[scenarioName] || {};
    const meldZoneChecks = [
      ["top", ".table-meld-top", rects.topDiscard, rects.topSeat, 180],
      ["right", ".table-meld-right", rects.rightDiscard, rects.rightSeat, -90],
      ["left", ".table-meld-left", rects.leftDiscard, rects.leftSeat, 90],
      ["self", ".table-meld-self", rects.bottomDiscard, rects.selfSeat, 0]
    ];
    for (const [name, selector, riverRect, seatRect, expectedRotation] of meldZoneChecks) {
      const zone = document.querySelector(selector);
      const area = zone?.querySelector(".meld-area");
      if (!area) {
        continue;
      }

      const areaRect = toRect(area.getBoundingClientRect());
      if (!isInViewport(area.getBoundingClientRect(), viewport, tolerance)) {
        failures.push(name + " meld area is outside viewport");
      }
      if (riverRect) {
        checkOverlap(name + " meld area", areaRect, name + " river", riverRect, 0);
      }
      if (seatRect) {
        checkOverlap(name + " meld area", areaRect, name + " seat", seatRect, 0);
      }
      if (handRect && name !== "self") {
        checkOverlap(name + " meld area", areaRect, "human hand", toRect(handRect), 0);
      }
      if (rects.actionArea && name === "right") {
        checkOverlap(name + " meld area", areaRect, "action area", rects.actionArea, 0);
      }
      if (rects.gearButton && (name === "top" || name === "right")) {
        checkOverlap(name + " meld area", areaRect, "gear button", rects.gearButton, 0);
      }
      if (["top", "right", "left"].includes(name) && (expectedMeldCounts[name] || area.querySelector(".meld"))) {
        const nearestSeatOrRiver = Math.min(
          seatRect ? rectDistance(areaRect, seatRect) : Number.POSITIVE_INFINITY,
          riverRect ? rectDistance(areaRect, riverRect) : Number.POSITIVE_INFINITY
        );
        const maxSeatDistance = Math.max(36, Math.min(viewport.width, viewport.height) * 0.26);
        if (nearestSeatOrRiver > maxSeatDistance) {
          failures.push(name + " CPU meld lane is too far from its seat/river: " + Math.round(nearestSeatOrRiver) + "px");
        }
      }
      if (name === "right" && rects.actionArea && areaRect.bottom > rects.actionArea.top - 1) {
        failures.push("right CPU meld lane should stay above the human action area");
      }
      if (name === "top" && areaRect.top < 0) {
        failures.push("top CPU meld lane is clipped by the top viewport edge");
      }

      const meldList = area.querySelector(".meld-list");
      if (meldList) {
        const angle = getRotationAngle(meldList);
        if (!angleMatches(angle, 0)) {
          failures.push(name + " meld list should not rotate as a whole but got " + angle + "deg");
        }
      }

      const melds = [...area.querySelectorAll(".meld")];
      const expectedCount = expectedMeldCounts[name];
      if (["top", "right", "left"].includes(name) && (expectedCount || melds.length > 0)) {
        const slots = [...area.querySelectorAll(".cpu-meld-slot")];
        if (slots.length !== 4) {
          failures.push(name + " CPU meld lane should expose 4 fixed slots but found " + slots.length);
        }
        for (const [slotIndex, slot] of slots.entries()) {
          const slotRect = slot.getBoundingClientRect();
          if (!isInViewport(slotRect, viewport, tolerance)) {
            failures.push(name + " CPU meld slot " + (slotIndex + 1) + " is outside viewport");
            break;
          }
          if (!isInsideRect(slotRect, area.getBoundingClientRect(), tolerance)) {
            failures.push(name + " CPU meld slot " + (slotIndex + 1) + " is outside its fixed lane");
            break;
          }
        }
      }

      if (expectedCount && melds.length < expectedCount) {
        failures.push(name + " meld area shows " + melds.length + " melds but expected at least " + expectedCount);
      }
      for (const [index, meld] of melds.entries()) {
        const meldRect = meld.getBoundingClientRect();
        if (!isInViewport(meldRect, viewport, tolerance)) {
          failures.push(name + " meld " + index + " is outside viewport");
          break;
        }
        if (!isInsideRect(meldRect, area.getBoundingClientRect(), tolerance)) {
          failures.push(name + " meld " + index + " is clipped inside CPU meld lane");
          break;
        }

        const meldTiles = [...meld.querySelectorAll(".meld-tile")];
        if ((name === "right" || name === "left") && meldTiles.length >= 3) {
          const tileRects = meldTiles.slice(0, 3).map((tile) => tile.getBoundingClientRect());
          const centers = tileRects.map((rect) => ({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          }));
          const xSpread = Math.max(...centers.map((center) => center.x)) - Math.min(...centers.map((center) => center.x));
          const ySpread = Math.max(...centers.map((center) => center.y)) - Math.min(...centers.map((center) => center.y));
          const maxTileWidth = Math.max(...tileRects.map((rect) => rect.width));
          const maxTileHeight = Math.max(...tileRects.map((rect) => rect.height));
          const orderedLeftToRight = centers.every((center, centerIndex) => (
            centerIndex === 0 || center.x > centers[centerIndex - 1].x - 0.5
          ));

          const looksHorizontal = xSpread > Math.max(8, ySpread * 1.4) && xSpread > maxTileWidth * 1.05;
          if (!orderedLeftToRight || !looksHorizontal) {
            failures.push(name + " meld " + index + " tiles should form one horizontal 3-tile group");
            break;
          }

          if (meldRect.height > maxTileHeight * 2.2) {
            failures.push(name + " meld " + index + " looks like a vertical tile stack: " + rectToString(meldRect));
            break;
          }
        }
      }

      const tiles = [...area.querySelectorAll(".meld-tile")];
      for (const [index, tile] of tiles.entries()) {
        const tileRect = tile.getBoundingClientRect();
        if (Math.min(tileRect.width, tileRect.height) < 10) {
          failures.push(name + " meld tile " + index + " visible size is too small: " + rectToString(tileRect));
          break;
        }
        if (!isInsideRect(tileRect, area.getBoundingClientRect(), tolerance)) {
          failures.push(name + " meld tile " + index + " is clipped inside CPU meld lane");
          break;
        }
        const tileBox = toRect(tileRect);
        if (riverRect) {
          const beforeCount = failures.length;
          checkOverlap(name + " meld tile " + index, tileBox, name + " river", riverRect, 0);
          if (failures.length > beforeCount) break;
        }
        if (seatRect) {
          const beforeCount = failures.length;
          checkOverlap(name + " meld tile " + index, tileBox, name + " seat", seatRect, 0);
          if (failures.length > beforeCount) break;
        }
        if (handRect && name !== "self") {
          const beforeCount = failures.length;
          checkOverlap(name + " meld tile " + index, tileBox, "human hand", toRect(handRect), 0);
          if (failures.length > beforeCount) break;
        }
        if (rects.actionArea && name === "right") {
          const beforeCount = failures.length;
          checkOverlap(name + " meld tile " + index, tileBox, "action area", rects.actionArea, 0);
          if (failures.length > beforeCount) break;
        }
        if (rects.gearButton && (name === "top" || name === "right")) {
          const beforeCount = failures.length;
          checkOverlap(name + " meld tile " + index, tileBox, "gear button", rects.gearButton, 0);
          if (failures.length > beforeCount) break;
        }
        const tileAngle = getRotationAngle(tile);
        if (!angleMatches(tileAngle, expectedRotation)) {
          failures.push(name + " meld tile rotation expected " + expectedRotation + "deg but got " + tileAngle + "deg");
          break;
        }
      }
    }

    if (modal) {
      const rect = modal.getBoundingClientRect();
      if (!isInViewport(rect, viewport, tolerance)) {
        failures.push("advice popup is outside viewport");
      }
    }

    if (zoomModal) {
      const rect = zoomModal.getBoundingClientRect();
      if (!isInViewport(rect, viewport, tolerance)) {
        failures.push("discard zoom popup is outside viewport");
      }

      const closeButton = zoomModal.querySelector("[data-action='close-discard-zoom']");
      if (!closeButton) {
        failures.push("discard zoom close button is missing");
      } else {
        const closeRect = closeButton.getBoundingClientRect();
        if (!isInViewport(closeRect, viewport, tolerance)) {
          failures.push("discard zoom close button is outside viewport");
        }
        if (!isClickableAtCenter(closeButton, closeRect)) {
          failures.push("discard zoom close button is not clickable at center");
        }
      }

      const zoomTiles = zoomModal.querySelectorAll(".discard-zoom-tile");
      if (zoomTiles.length < 18) {
        failures.push("discard zoom shows fewer than 18 discard tiles");
      }
    }

    if (resultModal) {
      const rect = resultModal.getBoundingClientRect();
      if (!isInViewport(rect, viewport, tolerance)) {
        failures.push("match result popup is outside viewport");
      }

      const closeButton = resultModal.querySelector("[data-action='close-match-result']");
      if (!closeButton) {
        failures.push("match result close button is missing");
      } else {
        const closeRect = closeButton.getBoundingClientRect();
        if (!isInViewport(closeRect, viewport, tolerance)) {
          failures.push("match result close button is outside viewport");
        }
        if (!isClickableAtCenter(closeButton, closeRect)) {
          failures.push("match result close button is not clickable at center");
        }
      }

      const entries = resultModal.querySelectorAll(".match-result-list li");
      if (entries.length < 4) {
        failures.push("match result popup shows fewer than 4 history entries");
      }
      for (const [index, entry] of entries.entries()) {
        const entryRect = entry.getBoundingClientRect();
        if (!isInsideRect(entryRect, rect, tolerance)) {
          failures.push("match result entry " + (index + 1) + " is clipped inside popup");
        }
      }
    }

    if (yakuGuideModal) {
      const rect = yakuGuideModal.getBoundingClientRect();
      if (!isInViewport(rect, viewport, tolerance)) {
        failures.push("yaku guide popup is outside viewport");
      }

      const closeButton = yakuGuideModal.querySelector("[data-action='close-yaku-guide']");
      if (!closeButton) {
        failures.push("yaku guide close button is missing");
      } else {
        const closeRect = closeButton.getBoundingClientRect();
        if (!isInViewport(closeRect, viewport, tolerance)) {
          failures.push("yaku guide close button is outside viewport");
        }
        if (!isClickableAtCenter(closeButton, closeRect)) {
          failures.push("yaku guide close button is not clickable at center");
        }
      }

      const guideTiles = [...yakuGuideModal.querySelectorAll(".yaku-guide-tile")];
      if (guideTiles.length === 0) {
        failures.push("yaku guide popup has no example tiles");
      }
      for (const [index, tile] of guideTiles.entries()) {
        const tileRect = tile.getBoundingClientRect();
        if (!isInsideRect(tileRect, rect, tolerance)) {
          failures.push("yaku guide example tile " + (index + 1) + " is clipped inside popup");
          break;
        }
      }
    }

    if (waitsModal) {
      const rect = waitsModal.getBoundingClientRect();
      if (!isInViewport(rect, viewport, tolerance)) {
        failures.push("waits popup is outside viewport");
      }

      const closeButton = waitsModal.querySelector("[data-action='close-waits']");
      if (!closeButton) {
        failures.push("waits close button is missing");
      } else {
        const closeRect = closeButton.getBoundingClientRect();
        if (!isInViewport(closeRect, viewport, tolerance)) {
          failures.push("waits close button is outside viewport");
        }
        if (!isClickableAtCenter(closeButton, closeRect)) {
          failures.push("waits close button is not clickable at center");
        }
      }

      const waitTiles = [...waitsModal.querySelectorAll(".waits-tile")];
      if (waitTiles.length === 0) {
        failures.push("waits popup has no wait tiles");
      }
      for (const [index, tile] of waitTiles.entries()) {
        const tileRect = tile.getBoundingClientRect();
        if (!isInsideRect(tileRect, rect, tolerance)) {
          failures.push("wait tile " + (index + 1) + " is clipped inside popup");
          break;
        }
      }

      const discardWaitItems = [...waitsModal.querySelectorAll(".discard-waits-item")];
      for (const [index, item] of discardWaitItems.entries()) {
        const itemRect = item.getBoundingClientRect();
        if (!isInsideRect(itemRect, rect, tolerance)) {
          failures.push("discard wait option " + (index + 1) + " is clipped inside popup");
          break;
        }
      }
    }

    if (allHandsModal) {
      const rect = allHandsModal.getBoundingClientRect();
      if (!isInViewport(rect, viewport, tolerance)) {
        failures.push("all-hands popup is outside viewport");
      }

      const closeButton = allHandsModal.querySelector("[data-action='close-all-hands']");
      if (!closeButton) {
        failures.push("all-hands close button is missing");
      } else {
        const closeRect = closeButton.getBoundingClientRect();
        if (!isInViewport(closeRect, viewport, tolerance)) {
          failures.push("all-hands close button is outside viewport");
        }
        if (!isClickableAtCenter(closeButton, closeRect)) {
          failures.push("all-hands close button is not clickable at center");
        }
      }

      const handItems = [...allHandsModal.querySelectorAll(".all-hands-item")];
      if (handItems.length < 4) {
        failures.push("all-hands popup shows fewer than 4 player hands");
      }
      const handTiles = [...allHandsModal.querySelectorAll(".all-hands-tile")];
      if (handTiles.length < 40) {
        failures.push("all-hands popup shows too few hand tiles");
      }
      for (const [index, item] of handItems.entries()) {
        const itemRect = item.getBoundingClientRect();
        if (itemRect.width <= 0 || itemRect.height <= 0) {
          failures.push("all-hands item " + (index + 1) + " has no size");
        }
      }
    }

    if (settingsMenuModal) {
      const rect = settingsMenuModal.getBoundingClientRect();
      if (!isInViewport(rect, viewport, tolerance)) {
        failures.push("settings menu popup is outside viewport");
      }

      const closeButton = settingsMenuModal.querySelector("[data-action='close-settings-menu']");
      if (!closeButton) {
        failures.push("settings menu close button is missing");
      } else {
        const closeRect = closeButton.getBoundingClientRect();
        if (!isInViewport(closeRect, viewport, tolerance)) {
          failures.push("settings menu close button is outside viewport");
        }
        if (!isClickableAtCenter(closeButton, closeRect)) {
          failures.push("settings menu close button is not clickable at center");
        }
      }

      const menuActions = [
        ["new match", "[data-action='start-match']"],
        ["large tile", "[data-action='toggle-large']"],
        ["advice toggle", "[data-action='toggle-discard-advice']"],
        ["help", "[data-action='open-beginner-help']"]
      ];
      for (const [name, selector] of menuActions) {
        const button = settingsMenuModal.querySelector(selector);
        if (!button) {
          failures.push("settings menu " + name + " button is missing");
          continue;
        }
        const buttonRect = button.getBoundingClientRect();
        if (!isInViewport(buttonRect, viewport, tolerance)) {
          failures.push("settings menu " + name + " button is outside viewport");
        }
        if (!isClickableAtCenter(button, buttonRect)) {
          failures.push("settings menu " + name + " button is not clickable at center");
        }
      }
    }

    checkOverlap("bottom discard", rects.bottomDiscard, "hand", rects.hand, 0.02);
    checkOverlap("center info", rects.centerInfo, "top discard", rects.topDiscard, 0.04);
    checkOverlap("center info", rects.centerInfo, "left discard", rects.leftDiscard, 0.04);
    checkOverlap("center info", rects.centerInfo, "right discard", rects.rightDiscard, 0.04);
    checkOverlap("center info", rects.centerInfo, "bottom discard", rects.bottomDiscard, 0.04);
    checkOverlap("action area", rects.actionArea, "right discard", rects.rightDiscard, 0);
    checkOverlap("action area", rects.actionArea, "self discard", rects.bottomDiscard, 0);
    checkOverlap("action area", rects.actionArea, "human meld", rects.selfMeld, 0);
    checkOverlap("action area", rects.actionArea, "right meld", rects.rightMeld, 0);
    checkOverlap("human meld", rects.selfMeld, "hand", rects.hand, 0);

    const scoreOverlapPairs = [
      [".score-unit-top", rects.topDiscard, "top river"],
      [".score-unit-right", rects.rightDiscard, "right river"],
      [".score-unit-bottom", rects.bottomDiscard, "self river"],
      [".score-unit-left", rects.leftDiscard, "left river"]
    ];
    for (const [selector, riverRect, riverName] of scoreOverlapPairs) {
      const unit = document.querySelector(".center-score-board " + selector);
      if (!unit) continue;
      checkOverlap(selector, toRect(unit.getBoundingClientRect()), riverName, riverRect, 0);
    }

    if (!activeModal && typeof window.__layoutClickAssist === "function") {
      for (const [name, selector, action] of assistButtons) {
        if (!document.querySelector(selector)) {
          continue;
        }
        const result = await window.__layoutClickAssist(action);
        if (!result.found) {
          failures.push(name + " assist button could not be clicked because it was not found");
        } else if (!result.opened) {
          failures.push(name + " assist button click did not open its popup");
        }
      }
    }

    if (!activeModal && typeof window.__layoutClickGearMenu === "function") {
      const result = await window.__layoutClickGearMenu();
      if (!result.found) {
        failures.push("gear menu button could not be clicked because it was not found");
      } else if (!result.opened) {
        failures.push("gear menu button click did not open the menu");
      }
    }

    if (!activeModal && typeof window.__layoutClickCallTrigger === "function") {
      const callTriggers = [...document.querySelectorAll("[data-action='open-call-options']")];
      const callTypes = [...new Set(callTriggers.map((button) => button.dataset.callType).filter(Boolean))];
      for (const callType of callTypes) {
        const result = await window.__layoutClickCallTrigger(callType);
        if (!result.found) {
          failures.push(callType + " call trigger could not be clicked because it was not found");
        } else if (!result.opened) {
          failures.push(callType + " call trigger click did not open its candidate modal");
        }
      }
    }

    return {
      failures,
      summary: {
        viewport,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        actionButtons: actionButtons.length,
        discardCounts: {
          north: document.querySelectorAll(".table-discard-top .discard-tile").length,
          west: document.querySelectorAll(".table-discard-left .discard-tile").length,
          south: document.querySelectorAll(".table-discard-right .discard-tile").length,
          east: document.querySelectorAll(".table-discard-bottom .discard-tile").length
        }
      }
    };

    function checkOverlap(nameA, rectA, nameB, rectB, maxRatio) {
      if (!rectA || !rectB) return;
      const width = Math.max(0, Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left));
      const height = Math.max(0, Math.min(rectA.bottom, rectB.bottom) - Math.max(rectA.top, rectB.top));
      const area = width * height;
      const smaller = Math.min(rectA.width * rectA.height, rectB.width * rectB.height);
      if (smaller > 0 && area / smaller > maxRatio) {
        failures.push(nameA + " overlaps " + nameB + " too much");
      }
    }

    function rectDistance(rectA, rectB) {
      if (!rectA || !rectB) return Number.POSITIVE_INFINITY;
      const dx = Math.max(0, rectA.left - rectB.right, rectB.left - rectA.right);
      const dy = Math.max(0, rectA.top - rectB.bottom, rectB.top - rectA.bottom);
      return Math.sqrt(dx * dx + dy * dy);
    }

    function getGridTrackCount(value) {
      const trimmed = String(value || "").trim();
      if (!trimmed || trimmed === "none") {
        return 0;
      }
      const repeatMatch = trimmed.match(/repeat\\(\\s*(\\d+)/);
      if (repeatMatch) {
        return Number(repeatMatch[1]);
      }
      return trimmed.split(/\\s+/).filter(Boolean).length;
    }

    function getLocalRiverOrderFailure(name, tiles) {
      const first18 = tiles.slice(0, 18);
      if (first18.length < 18) {
        return "";
      }

      const cells = first18.map((tile, index) => ({
        index,
        order: Number(tile.dataset.discardOrder),
        left: tile.offsetLeft,
        top: tile.offsetTop
      }));

      for (let row = 0; row < 3; row += 1) {
        const rowCells = cells.slice(row * 6, row * 6 + 6);
        const topValues = rowCells.map((cell) => cell.top);
        if (Math.max(...topValues) - Math.min(...topValues) > 2) {
          return name + " river local row " + (row + 1) + " is not aligned";
        }
        for (let column = 1; column < rowCells.length; column += 1) {
          if (rowCells[column].left <= rowCells[column - 1].left) {
            return name + " river local order is not left-to-right within row " + (row + 1);
          }
        }
        if (row > 0) {
          const previousRow = cells.slice((row - 1) * 6, (row - 1) * 6 + 6);
          const previousTop = previousRow.reduce((sum, cell) => sum + cell.top, 0) / previousRow.length;
          const currentTop = rowCells.reduce((sum, cell) => sum + cell.top, 0) / rowCells.length;
          if (currentTop <= previousTop) {
            return name + " river local rows are not top-to-bottom";
          }
        }
      }

      return "";
    }

    function isClickableAtCenter(element, rect) {
      if (rect.width <= 0 || rect.height <= 0) return false;
      const x = Math.min(Math.max(rect.left + rect.width / 2, 0), window.innerWidth - 1);
      const y = Math.min(Math.max(rect.top + rect.height / 2, 0), window.innerHeight - 1);
      const hit = document.elementFromPoint(x, y);
      return hit === element || element.contains(hit);
    }

    function containsRect(container, child, tolerance) {
      return child.top >= container.top - tolerance
        && child.left >= container.left - tolerance
        && child.right <= container.right + tolerance
        && child.bottom <= container.bottom + tolerance;
    }

    function isInViewport(rect, viewport, tolerance) {
      return rect.top >= -tolerance
        && rect.left >= -tolerance
        && rect.right <= viewport.width + tolerance
        && rect.bottom <= viewport.height + tolerance;
    }

    function isInsideRect(rect, containerRect, tolerance) {
      return rect.top >= containerRect.top - tolerance
        && rect.left >= containerRect.left - tolerance
        && rect.right <= containerRect.right + tolerance
        && rect.bottom <= containerRect.bottom + tolerance;
    }

    function getRotationAngle(element) {
      const transform = getComputedStyle(element).transform;
      if (!transform || transform === "none") {
        return 0;
      }
      const match = transform.match(/matrix\\(([^)]+)\\)/);
      if (!match) {
        return 0;
      }
      const values = match[1].split(",").map((value) => Number.parseFloat(value.trim()));
      const [a, b] = values;
      return Math.round(Math.atan2(b, a) * (180 / Math.PI));
    }

    function angleMatches(actual, expected) {
      const normalizedActual = ((actual % 360) + 360) % 360;
      const normalizedExpected = ((expected % 360) + 360) % 360;
      return Math.abs(normalizedActual - normalizedExpected) <= 2
        || Math.abs(normalizedActual - normalizedExpected) >= 358;
    }

    function toRect(rect) {
      return {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      };
    }

    function rectToString(rect) {
      return JSON.stringify({
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom)
      });
    }
  }`;
}

function formatResult(result) {
  const status = result.failures.length === 0 ? "PASS" : "FAIL";
  const counts = result.summary.discardCounts;
  return `${status} ${result.label} scroll=${result.summary.scrollWidth}x${result.summary.scrollHeight} discards=N${counts.north}/W${counts.west}/S${counts.south}/E${counts.east}`;
}

async function startStaticServer(root, port) {
  const mimeTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml"
  };

  const staticServer = createServer((request, response) => {
    const rawPath = new URL(request.url, `http://${request.headers.host}`).pathname;
    const requestedPath = rawPath === "/" ? "/index.html" : rawPath;
    const filePath = path.normalize(path.join(root, decodeURIComponent(requestedPath)));

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "content-type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "cache-control": "no-store"
    });
    createReadStream(filePath).pipe(response);
  });

  await new Promise((resolve, reject) => {
    staticServer.once("error", reject);
    staticServer.listen(port, "127.0.0.1", resolve);
  });

  return staticServer;
}

async function startChrome() {
  const chromePath = findChrome();
  const userDataDir = mkdtempSync(path.join(tmpdir(), "mahjong-layout-check-"));
  const browserProcess = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-extensions",
    "--hide-scrollbars",
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
    "about:blank"
  ], {
    stdio: ["ignore", "pipe", "pipe"]
  });

  browserProcess.userDataDir = userDataDir;
  browserProcess.stderr.on("data", () => {});
  browserProcess.stdout.on("data", () => {});

  const portFile = path.join(userDataDir, "DevToolsActivePort");
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (existsSync(portFile)) {
      const [port] = (await readFile(portFile, "utf8")).trim().split(/\r?\n/);
      return { process: browserProcess, port, userDataDir };
    }
    await delay(100);
  }

  throw new Error("Chrome did not expose a DevTools port. Set CHROME_PATH if Chrome is installed in a non-standard location.");
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe")
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error("Chrome executable was not found. Set CHROME_PATH to run the layout check.");
}

async function connectToChrome(port) {
  return {
    async newPage() {
      const target = await requestJson(`http://127.0.0.1:${port}/json/new`, { method: "PUT" });
      return new CdpPage(target.webSocketDebuggerUrl);
    }
  };
}

class CdpPage {
  constructor(webSocketUrl) {
    this.webSocket = new WebSocket(webSocketUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.loadResolvers = [];
    this.opened = new Promise((resolve, reject) => {
      this.webSocket.addEventListener("open", resolve, { once: true });
      this.webSocket.addEventListener("error", reject, { once: true });
    });
    this.webSocket.addEventListener("message", (event) => this.handleMessage(event));
  }

  async send(method, params = {}) {
    await this.opened;
    const id = this.nextId;
    this.nextId += 1;
    const promise = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.webSocket.send(JSON.stringify({ id, method, params }));
    return promise;
  }

  async evaluate(expression, argument) {
    const result = await this.send("Runtime.evaluate", {
      expression: `(${expression})(${JSON.stringify(argument)})`,
      awaitPromise: true,
      returnByValue: true
    });

    if (result.exceptionDetails) {
      const details = result.exceptionDetails.exception?.description
        || result.exceptionDetails.exception?.value
        || result.exceptionDetails.text
        || "Runtime evaluation failed";
      throw new Error(details);
    }

    return result.result.value;
  }

  async waitForLoad() {
    await this.send("Page.enable");
    await this.send("Runtime.enable");
    await new Promise((resolve) => {
      this.loadResolvers.push(resolve);
      setTimeout(resolve, 5000);
    });
  }

  async screenshot(filePath) {
    const result = await this.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false
    });
    await import("node:fs/promises").then(({ writeFile }) => writeFile(filePath, Buffer.from(result.data, "base64")));
  }

  async close() {
    try {
      await Promise.race([
        this.send("Page.close"),
        delay(1000)
      ]);
    } catch {
      this.webSocket.close();
      return;
    }

    this.webSocket.close();
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    if (message.id && this.pending.has(message.id)) {
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(message.error.message));
      } else {
        pending.resolve(message.result || {});
      }
      return;
    }

    if (message.method === "Page.loadEventFired") {
      const resolvers = this.loadResolvers.splice(0);
      for (const resolve of resolvers) {
        resolve();
      }
    }
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${url}`);
  }
  return response.json();
}

async function cleanup() {
  if (browser) {
    browser = null;
  }

  if (chrome?.process) {
    chrome.process.kill();
    await delay(100);
  }

  if (chrome?.userDataDir) {
    try {
      rmSync(chrome.userDataDir, { recursive: true, force: true });
    } catch {
      // Windows can keep Chrome's temp profile locked briefly after process exit.
      // The layout result should not fail because of best-effort cleanup.
    }
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
