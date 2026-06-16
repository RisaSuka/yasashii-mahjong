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
  { name: "result-popup", discards: 18, mode: "result-popup" }
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
            { handLabel: "東1局", handNumber: 1, resultType: "draw" },
            { handLabel: "東2局", handNumber: 2, resultType: "tsumo", winnerId: 0, winType: "tsumo" },
            { handLabel: "東3局", handNumber: 3, resultType: "ron", winnerId: 1, winType: "ron" },
            { handLabel: "東4局", handNumber: 4, resultType: "draw" }
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

    renderModule.renderGame(state, root, {
      canDeclareTsumo: () => mode === "actions",
      canDeclareRon: () => mode === "actions",
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
      matchResultDialogOpen: mode === "result-popup"
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
      northDiscard: ".table-discard-north",
      westDiscard: ".table-discard-west",
      southDiscard: ".table-discard-south",
      eastDiscard: ".table-discard-east",
      hand: ".seat-east .hand",
      handTile: ".seat-east .hand .tile",
      adviceButton: ".seat-east [data-action='open-discard-advice']"
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

    for (const name of ["northDiscard", "westDiscard", "southDiscard", "eastDiscard"]) {
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
    const activeModal = modal || zoomModal || resultModal;

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
    }

    checkOverlap("east discard", rects.eastDiscard, "hand", rects.hand, 0.08);
    checkOverlap("center info", rects.centerInfo, "north discard", rects.northDiscard, 0.05);
    checkOverlap("center info", rects.centerInfo, "west discard", rects.westDiscard, 0.05);
    checkOverlap("center info", rects.centerInfo, "south discard", rects.southDiscard, 0.05);
    checkOverlap("center info", rects.centerInfo, "east discard", rects.eastDiscard, 0.05);

    return {
      failures,
      summary: {
        viewport,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        actionButtons: actionButtons.length,
        discardCounts: {
          north: document.querySelectorAll(".table-discard-north .discard-tile").length,
          west: document.querySelectorAll(".table-discard-west .discard-tile").length,
          south: document.querySelectorAll(".table-discard-south .discard-tile").length,
          east: document.querySelectorAll(".table-discard-east .discard-tile").length
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
