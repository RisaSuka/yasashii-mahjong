import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARTIFACT_DIR = path.join(ROOT, "test-artifacts", "layout");
const CACHE_BUST = "mvp-layout-check";
const PORT = Number(process.env.LAYOUT_CHECK_PORT || 18765);
const VIEWPORTS = [
  { width: 844, height: 390 },
  { width: 896, height: 414 },
  { width: 932, height: 430 },
  { width: 812, height: 375 },
  { width: 780, height: 360 }
];
const SCENARIOS = [
  { name: "early", discards: 3, mode: "playing" },
  { name: "mid", discards: 9, mode: "playing" },
  { name: "late", discards: 18, mode: "playing" },
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
  { name: "all-hands-open", discards: 18, mode: "all-hands-open" },
  { name: "settings-menu-open", discards: 9, mode: "settings-menu-open" }
];
const TOLERANCE = 2;

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
  for (const viewport of VIEWPORTS) {
    for (const scenario of SCENARIOS) {
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
    const inspection = await page.evaluate(inspectLayoutSource(), { tolerance: TOLERANCE });
    failures.push(...inspection.failures.map((message) => `${label}: ${message}`));
    await page.screenshot(path.join(ARTIFACT_DIR, `${label}.png`));

    return {
      label,
      failures,
      summary: inspection.summary
    };
  } finally {
    await page.close();
  }
}

function setupScenarioSource() {
  return `async ({ discards, mode, cacheBust }) => {
    const roundModule = await import("./src/game/round.js?layout=" + cacheBust);
    const actionsModule = await import("./src/game/actions.js?layout=" + cacheBust);
    const renderModule = await import("./src/ui/render.js?layout=" + cacheBust);
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
          }
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

    renderModule.renderGame(state, root, {
      canDeclareTsumo: () => mode === "actions",
      canDeclareRon: () => mode === "actions",
      canDeclarePon: () => mode === "pon-reaction",
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
      settingsMenuOpen: mode === "settings-menu-open",
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
    });
  }`;
}

function inspectLayoutSource() {
  return `({ tolerance }) => {
    const failures = [];
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const selectors = {
      app: ".app",
      header: ".topbar",
      table: ".table",
      centerPanel: ".center-panel",
      centerRing: ".table-discard-ring",
      centerInfo: ".center-info",
      topSeat: ".table-seat-top",
      leftSeat: ".table-seat-left",
      rightSeat: ".table-seat-right",
      bottomSeat: ".table-seat-bottom",
      topDiscard: ".table-discard-top",
      leftDiscard: ".table-discard-left",
      rightDiscard: ".table-discard-right",
      bottomDiscard: ".table-discard-bottom",
      hand: ".table-seat-bottom .hand",
      handTile: ".table-seat-bottom .hand .tile",
      gearButton: "[data-action='open-settings-menu']",
      adviceButton: ".table-seat-bottom [data-action='open-discard-advice']"
    };

    if (document.documentElement.scrollWidth > viewport.width + tolerance) {
      failures.push("page has horizontal overflow: " + document.documentElement.scrollWidth + " > " + viewport.width);
    }

    if (document.documentElement.scrollHeight > viewport.height + tolerance) {
      failures.push("page has vertical overflow: " + document.documentElement.scrollHeight + " > " + viewport.height);
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
      if (rects.topSeat && rects.topSeat.bottom > centerRect.top + tolerance) {
        failures.push("CPU2 top seat is not above the table center");
      }
      if (rects.bottomSeat && rects.bottomSeat.top < centerRect.bottom - tolerance) {
        failures.push("human bottom seat is not below the table center");
      }
      if (rects.leftSeat && rects.leftSeat.right > centerRect.left + tolerance) {
        failures.push("CPU3 left seat is not left of the table center");
      }
      if (rects.rightSeat && rects.rightSeat.left < centerRect.right - tolerance) {
        failures.push("CPU1 right seat is not right of the table center");
      }
    }

    for (const name of ["topDiscard", "leftDiscard", "rightDiscard", "bottomDiscard"]) {
      const selector = selectors[name];
      const zone = document.querySelector(selector);
      if (!zone) continue;
      const zoneRect = zone.getBoundingClientRect();
      const tiles = [...zone.querySelectorAll(".discard-tile")];
      if (tiles.length === 0) continue;

      for (const [index, tile] of tiles.entries()) {
        const rect = tile.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
          failures.push(name + " discard " + index + " has no size");
        }
        if (!containsRect(zoneRect, rect, 1)) {
          failures.push(name + " discard " + index + " is clipped by zone");
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
      const tile = document.querySelector(selectors[name] + " .tile");
      if (!tile) continue;
      const angle = getRotationAngle(tile);
      if (!angleMatches(angle, expectedAngle)) {
        failures.push(name + " tile rotation expected " + expectedAngle + "deg but got " + angle + "deg");
      }
    }

    const hand = document.querySelector(selectors.hand);
    const handRect = hand?.getBoundingClientRect();
    if (hand && handRect) {
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
      }
    }

    const modal = document.querySelector(".discard-advice-modal");
    const zoomModal = document.querySelector(".discard-zoom-modal");
    const resultModal = document.querySelector(".match-result-modal");
    const yakuGuideModal = document.querySelector(".yaku-guide-modal");
    const waitsModal = document.querySelector(".waits-modal");
    const allHandsModal = document.querySelector(".all-hands-modal");
    const settingsMenuModal = document.querySelector(".settings-menu-modal");
    const activeModal = modal || zoomModal || resultModal || yakuGuideModal || waitsModal || allHandsModal || settingsMenuModal;

    const actionButtons = [...document.querySelectorAll(".table-action-bar button, .restart-match-button, .next-round-button")];
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

    const adviceButton = document.querySelector(selectors.adviceButton);
    if (adviceButton && !activeModal) {
      const rect = adviceButton.getBoundingClientRect();
      if (!isInViewport(rect, viewport, tolerance)) {
        failures.push("advice button is outside viewport");
      }
      if (!isClickableAtCenter(adviceButton, rect)) {
        failures.push("advice button is not clickable at center");
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

    const meldArea = document.querySelector(".table-seat-bottom .meld-area");
    const meldRect = meldArea ? toRect(meldArea.getBoundingClientRect()) : null;
    if (meldArea && !isInViewport(meldArea.getBoundingClientRect(), viewport, tolerance)) {
      failures.push("meld area is outside viewport");
    }
    if (meldArea) {
      const melds = [...meldArea.querySelectorAll(".meld")];
      for (const [index, meld] of melds.entries()) {
        const rect = meld.getBoundingClientRect();
        if (!isInsideRect(rect, meldArea.getBoundingClientRect(), tolerance)) {
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
    }

    checkOverlap("bottom discard", rects.bottomDiscard, "hand", rects.hand, 0.02);
    checkOverlap("center info", rects.centerInfo, "top discard", rects.topDiscard, 0.04);
    checkOverlap("center info", rects.centerInfo, "left discard", rects.leftDiscard, 0.04);
    checkOverlap("center info", rects.centerInfo, "right discard", rects.rightDiscard, 0.04);
    checkOverlap("center info", rects.centerInfo, "bottom discard", rects.bottomDiscard, 0.04);

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
      await this.send("Page.close");
    } catch {
      this.webSocket.close();
    }
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
    rmSync(chrome.userDataDir, { recursive: true, force: true });
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
