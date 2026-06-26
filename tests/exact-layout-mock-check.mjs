import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARTIFACT_DIR = path.join(ROOT, "test-artifacts", "layout");
const PORT = Number(process.env.EXACT_MOCK_CHECK_PORT || 18766);
const VIEWPORTS = [
  { width: 780, height: 360 },
  { width: 844, height: 390 },
  { width: 932, height: 430 }
];
const TOLERANCE = 1;

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
  const measurements = [];
  for (const viewport of VIEWPORTS) {
    const result = await runMock(viewport);
    failures.push(...result.failures);
    measurements.push(result.measurements);
    console.log(formatResult(result));
  }

  await cleanup();

  console.log("\nExact mock measurements:");
  console.log(JSON.stringify(measurements, null, 2));

  if (failures.length > 0) {
    console.error("\nExact layout mock check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("\nExact layout mock check passed.");
}

async function runMock(viewport) {
  const page = await browser.newPage();
  const label = `exact-mock-${viewport.width}x${viewport.height}-v4`;
  const failures = [];

  try {
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 2,
      mobile: true,
      screenOrientation: { type: "landscapePrimary", angle: 90 }
    });
    await page.send("Page.navigate", { url: `http://127.0.0.1:${PORT}/dev/exact-table-layout-mock.html?v=mvp343-static-mock-${label}` });
    await page.waitForLoad();
    const inspection = await page.evaluate(inspectMockSource(), { tolerance: TOLERANCE });
    failures.push(...inspection.failures.map((message) => `${label}: ${message}`));
    await page.screenshot(path.join(ARTIFACT_DIR, `${label}.png`));

    return {
      label,
      failures,
      measurements: {
        label,
        ...inspection.measurements
      }
    };
  } finally {
    await page.close();
  }
}

function inspectMockSource() {
  return `({ tolerance }) => {
    const failures = [];
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const root = document.querySelector("[data-layout-root]");
    const gear = document.querySelector(".mock-gear");
    const center = document.querySelector(".mock-score-board");
    const hand = document.querySelector(".mock-hand-area");
    const handTiles = [...document.querySelectorAll(".mock-hand-tile")];
    const topRiver = document.querySelector(".mock-river-top .mock-river");
    const rightRiver = document.querySelector(".mock-river-right .mock-river");
    const leftRiver = document.querySelector(".mock-river-left .mock-river");
    const selfRiver = document.querySelector(".mock-river-self .mock-river");
    const windIndicators = [...document.querySelectorAll(".seat-wind-indicator")];
    const scoreDisplays = [...document.querySelectorAll(".player-score-display")];
    const scoreValues = scoreDisplays.map((node) => (node.querySelector("strong") || node).textContent.replace(/\\s+/g, "").replace("リーチ", ""));
    const scoreCore = document.querySelector(".score-core");
    const actionArea = document.querySelector(".mock-actions");
    const ponRow = document.querySelector(".pon-row");
    const chiRow = document.querySelector(".chi-row");
    const chiOptions = [...document.querySelectorAll(".chi-option-list .call-tile-button")];
    const ronRow = document.querySelector(".ron-row");
    const skipRow = document.querySelector(".skip-row");
    const supportButtons = [...document.querySelectorAll(".support-buttons button")];

    const docScrollWidth = document.documentElement.scrollWidth;
    const bodyScrollWidth = document.body.scrollWidth;
    const docScrollHeight = document.documentElement.scrollHeight;
    const bodyScrollHeight = document.body.scrollHeight;
    if (docScrollWidth !== viewport.width) {
      failures.push("documentElement scrollWidth must equal viewport: " + docScrollWidth + " !== " + viewport.width);
    }
    if (bodyScrollWidth !== viewport.width) {
      failures.push("body scrollWidth must equal viewport: " + bodyScrollWidth + " !== " + viewport.width);
    }
    if (docScrollHeight > viewport.height + tolerance) {
      failures.push("documentElement scrollHeight exceeds viewport: " + docScrollHeight + " > " + viewport.height);
    }
    if (bodyScrollHeight > viewport.height + tolerance) {
      failures.push("body scrollHeight exceeds viewport: " + bodyScrollHeight + " > " + viewport.height);
    }
    if (document.documentElement.scrollLeft !== 0 || document.body.scrollLeft !== 0 || window.scrollX !== 0) {
      failures.push("page has horizontal scroll offset");
    }

    const rootRect = rect(root);
    const gearRect = rect(gear);
    const centerRect = rect(center);
    const handRect = rect(hand);
    const topRiverRect = rect(topRiver);
    const rightRiverRect = rect(rightRiver);
    const leftRiverRect = rect(leftRiver);
    const selfRiverRect = rect(selfRiver);
    const actionRect = rect(actionArea);

    checkInViewport("table root", rootRect);
    checkInViewport("gear", gearRect);
    checkInViewport("center score board", centerRect);
    checkInViewport("hand area", handRect);
    checkInViewport("top river", topRiverRect);
    checkInViewport("right river", rightRiverRect);
    checkInViewport("left river", leftRiverRect);
    checkInViewport("self river", selfRiverRect);

    if (gearRect.top > viewport.height * 0.14 || gearRect.right < viewport.width - 8) {
      failures.push("gear is not pinned near the top-right safe area");
    }
    if (gearRect.width < 26 || gearRect.width > 34 || gearRect.height < 26 || gearRect.height > 34) {
      failures.push("gear size is outside 26-34px");
    }

    const playRight = gearRect.left || rootRect.right;
    const tableCenter = {
      x: (rootRect.left + playRight) / 2,
      y: (rootRect.top + handRect.top) / 2
    };
    const centerPoint = {
      x: centerRect.left + centerRect.width / 2,
      y: centerRect.top + centerRect.height / 2
    };
    const centerDelta = Math.hypot(centerPoint.x - tableCenter.x, centerPoint.y - tableCenter.y);
    if (centerDelta > Math.max(22, viewport.width * 0.035)) {
      failures.push("center score board is too far from table center: " + Math.round(centerDelta) + "px");
    }

    const handWidthRatio = handRect.width / viewport.width;
    if (handWidthRatio < 0.9) {
      failures.push("hand area width is less than 90% viewport: " + handWidthRatio.toFixed(3));
    }

    const handGap = getHandGap(handTiles);
    if (handGap > 1.5) {
      failures.push("hand tile gap is greater than 1.5px: " + handGap.toFixed(2));
    }
    const firstHandTileRect = rect(handTiles[0]);
    if (!firstHandTileRect || firstHandTileRect.height < 72) {
      failures.push("hand tile height is too small: " + (firstHandTileRect ? firstHandTileRect.height.toFixed(1) : "missing"));
    }
    const handTileAspectRatio = firstHandTileRect ? firstHandTileRect.height / firstHandTileRect.width : 0;
    if (handTileAspectRatio < 1.35 || handTileAspectRatio > 1.85) {
      failures.push("hand tile aspect ratio is outside natural tile range: " + handTileAspectRatio.toFixed(2));
    }
    if (handRect && firstHandTileRect && handRect.height < firstHandTileRect.height + 4) {
      failures.push("hand area height is smaller than tile height plus padding: " + handRect.height.toFixed(1) + " < " + (firstHandTileRect.height + 4).toFixed(1));
    }
    for (const [index, tile] of handTiles.entries()) {
      const tileRect = rect(tile);
      if (!tileRect) continue;
      if (tileRect.top < handRect.top - tolerance || tileRect.bottom > handRect.bottom + tolerance) {
        failures.push("hand tile " + (index + 1) + " is clipped vertically by hand area");
        break;
      }
    }

    if (windIndicators.length !== 4) {
      failures.push("center score board must have exactly four separate wind indicators");
    }
    if (scoreDisplays.length !== 4) {
      failures.push("center score board must have exactly four separate score displays");
    }
    if (windIndicators.some((node) => node.classList.contains("player-score-display"))
      || scoreDisplays.some((node) => node.classList.contains("seat-wind-indicator"))) {
      failures.push("wind indicators and score displays are not separate DOM roles");
    }
    if (scoreDisplays.some((node) => /[東南西北]/.test(node.textContent || ""))) {
      failures.push("score display includes wind text");
    }
    const scorePairDistances = [];
    for (const wind of windIndicators) {
      const seatPosition = wind.dataset.seatPosition;
      const score = scoreDisplays.find((node) => node.dataset.seatPosition === seatPosition);
      if (!score) {
        failures.push("score display is missing for wind position: " + seatPosition);
        continue;
      }
      const distance = elementGap(rect(wind), rect(score));
      scorePairDistances.push({ seatPosition, distance: Number(distance.toFixed(2)) });
      if (distance > 5) {
        failures.push("wind indicator is not adjacent to score display for " + seatPosition + ": " + distance.toFixed(1) + "px");
      }
    }
    if (!document.querySelector(".seat-wind-indicator.is-dealer-wind[data-current-wind='east']")) {
      failures.push("east wind indicator is not highlighted as dealer");
    }
    if (!document.querySelector(".player-score-display.is-riichi-score[data-player-id='1']")) {
      failures.push("CPU1 riichi score display is not highlighted");
    }
    checkRotation("top wind indicator", document.querySelector(".score-top-pair .wind-indicator"), 180);
    checkRotation("right wind indicator", document.querySelector(".score-right-pair .wind-indicator"), -90);
    checkRotation("left wind indicator", document.querySelector(".score-left-pair .wind-indicator"), 90);
    checkRotation("bottom wind indicator", document.querySelector(".score-bottom-pair .wind-indicator"), 0);
    if (!scoreValues.every((value) => value === "25000") || scoreValues.length !== 4) {
      failures.push("center score board does not show four full 25000 scores");
    }

    const coreText = scoreCore?.textContent || "";
    const bodyText = document.body.textContent || "";
    if (coreText.includes("親")) {
      failures.push("center core includes dealer player text");
    }
    if (bodyText.includes("あなたの番")) {
      failures.push("center/table text includes long current-turn message");
    }
    if (bodyText.includes("形は完成していますが")) {
      failures.push("long no-yaku guidance is visible on the table");
    }

    for (const river of [topRiver, rightRiver, leftRiver, selfRiver]) {
      const text = river.textContent || "";
      if (/CPU|あなた|捨て牌|枚/.test(text)) {
        failures.push("river contains seat name or discard count label");
      }
      const orderFailure = getLocalRiverOrderFailure(river);
      if (orderFailure) {
        failures.push(orderFailure);
      }
    }

    if (!isAbove(topRiverRect, centerRect)) failures.push("top river is not above center score board");
    if (!isLeftOf(leftRiverRect, centerRect)) failures.push("left river is not left of center score board");
    if (!isRightOf(rightRiverRect, centerRect)) failures.push("right river is not right of center score board");
    if (!isBelow(selfRiverRect, centerRect)) failures.push("self river is not below center score board");

    const ponRect = rect(ponRow);
    const chiRect = rect(chiRow);
    const ronRect = rect(ronRow);
    const skipRect = rect(skipRow);
    if (!ponRect || !chiRect || !ronRect || !skipRect) {
      failures.push("call action rows are missing");
    } else {
      if (!(ponRect.top < chiRect.top)) failures.push("pon row is not above chi row");
      if (!(chiRect.top < ronRect.top)) failures.push("ron row is not below chi row");
      if (!(ronRect.top < skipRect.top)) failures.push("skip row is not below ron row");
    }
    if (chiOptions.length < 3) {
      failures.push("chi options must show three candidates");
    } else {
      for (let index = 1; index < chiOptions.length; index += 1) {
        const previous = rect(chiOptions[index - 1]);
        const current = rect(chiOptions[index]);
        if (!(previous.bottom <= current.top + tolerance)) {
          failures.push("chi options are not stacked vertically");
          break;
        }
      }
    }
    for (const [index, button] of supportButtons.entries()) {
      const buttonRect = rect(button);
      if (!isInViewport(buttonRect)) {
        failures.push("support button " + (index + 1) + " is outside viewport");
      }
    }
    if (actionRect && handRect && overlaps(actionRect, handRect)) {
      failures.push("action area overlaps hand area");
    }

    checkRotation("top river", topRiver, 180);
    checkRotation("right river", rightRiver, -90);
    checkRotation("left river", leftRiver, 90);
    checkRotation("self river", selfRiver, 0);

    const riverTile = document.querySelector(".mock-river img");
    const riverTileRect = rect(riverTile);
    if (riverTileRect.width < 14 || riverTileRect.height < 19) {
      failures.push("river tile visible size is too small");
    }

    const rightUnusedWidth = Math.max(0, viewport.width - rootRect.right);
    if (rightUnusedWidth > viewport.width * 0.15) {
      failures.push("right unused blank area exceeds 15% viewport");
    }

    return {
      failures,
      measurements: {
        viewport,
        documentScrollWidth: docScrollWidth,
        bodyScrollWidth,
        documentScrollHeight: docScrollHeight,
        bodyScrollHeight,
        innerWidth: viewport.width,
        innerHeight: viewport.height,
        tableCenter: roundPoint(tableCenter),
        centerScoreCenter: roundPoint(centerPoint),
        centerDelta: Number(centerDelta.toFixed(2)),
        handGap: Number(handGap.toFixed(2)),
        handWidthRatio: Number(handWidthRatio.toFixed(3)),
        handWidth: Math.round(handRect.width),
        handAreaHeight: Number(handRect.height.toFixed(1)),
        handTileHeight: firstHandTileRect ? Number(firstHandTileRect.height.toFixed(1)) : 0,
        handTileAspectRatio: Number(handTileAspectRatio.toFixed(3)),
        scorePairDistances,
        gearRect: compactRect(gearRect),
        rootRect: compactRect(rootRect)
      }
    };

    function checkInViewport(name, target) {
      if (!target || target.width <= 0 || target.height <= 0) {
        failures.push(name + " has no visible size");
        return;
      }
      if (!isInViewport(target)) {
        failures.push(name + " is outside viewport: " + JSON.stringify(compactRect(target)));
      }
    }

    function isInViewport(target) {
      return !!target
        && target.left >= -tolerance
        && target.top >= -tolerance
        && target.right <= viewport.width + tolerance
        && target.bottom <= viewport.height + tolerance;
    }

    function getHandGap(tiles) {
      if (tiles.length < 2) return 0;
      const a = rect(tiles[0]);
      const b = rect(tiles[1]);
      return Math.max(0, b.left - a.right);
    }

    function elementGap(a, b) {
      if (!a || !b) return Infinity;
      const horizontal = Math.max(0, Math.max(a.left, b.left) - Math.min(a.right, b.right));
      const vertical = Math.max(0, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom));
      return Math.hypot(horizontal, vertical);
    }

    function getLocalRiverOrderFailure(river) {
      const tiles = [...river.querySelectorAll("img")].slice(0, 18).map((tile, index) => ({
        index,
        left: tile.offsetLeft,
        top: tile.offsetTop
      }));
      if (tiles.length < 18) {
        return "river has fewer than 18 tiles";
      }

      for (let row = 0; row < 3; row += 1) {
        const rowCells = tiles.slice(row * 6, row * 6 + 6);
        const topValues = rowCells.map((cell) => cell.top);
        if (Math.max(...topValues) - Math.min(...topValues) > 2) {
          return "river row " + (row + 1) + " is not locally aligned";
        }
        for (let index = 1; index < rowCells.length; index += 1) {
          if (rowCells[index].left <= rowCells[index - 1].left) {
            return "river local order is not left-to-right in row " + (row + 1);
          }
        }
        if (row > 0) {
          const previousRow = tiles.slice((row - 1) * 6, (row - 1) * 6 + 6);
          const previousTop = average(previousRow.map((cell) => cell.top));
          const currentTop = average(rowCells.map((cell) => cell.top));
          if (currentTop <= previousTop) {
            return "river rows are not locally top-to-bottom";
          }
        }
      }
      return "";
    }

    function checkRotation(name, element, expected) {
      const actual = getRotationAngle(element);
      if (!angleMatches(actual, expected)) {
        failures.push(name + " rotation is " + actual + "deg, expected " + expected + "deg");
      }
    }

    function getRotationAngle(element) {
      const transform = getComputedStyle(element).transform;
      if (!transform || transform === "none") return 0;
      const match = transform.match(/matrix\\(([^)]+)\\)/);
      if (!match) return 0;
      const values = match[1].split(",").map((value) => Number.parseFloat(value.trim()));
      return Math.round(Math.atan2(values[1], values[0]) * (180 / Math.PI));
    }

    function angleMatches(actual, expected) {
      const normalizedActual = ((actual % 360) + 360) % 360;
      const normalizedExpected = ((expected % 360) + 360) % 360;
      return Math.abs(normalizedActual - normalizedExpected) <= 2
        || Math.abs(normalizedActual - normalizedExpected) >= 358;
    }

    function isAbove(a, b) {
      return a.bottom <= b.top + 4;
    }

    function isBelow(a, b) {
      return a.top >= b.bottom - 4;
    }

    function isLeftOf(a, b) {
      return a.right <= b.left + 4;
    }

    function isRightOf(a, b) {
      return a.left >= b.right - 4;
    }

    function overlaps(a, b) {
      const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return width * height > 1;
    }

    function rect(element) {
      if (!element) return null;
      const value = element.getBoundingClientRect();
      return {
        left: value.left,
        top: value.top,
        right: value.right,
        bottom: value.bottom,
        width: value.width,
        height: value.height
      };
    }

    function roundPoint(point) {
      return {
        x: Math.round(point.x),
        y: Math.round(point.y)
      };
    }

    function compactRect(target) {
      if (!target) return null;
      return {
        left: Math.round(target.left),
        top: Math.round(target.top),
        right: Math.round(target.right),
        bottom: Math.round(target.bottom),
        width: Math.round(target.width),
        height: Math.round(target.height)
      };
    }

    function average(values) {
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    }
  }`;
}

function formatResult(result) {
  const status = result.failures.length === 0 ? "PASS" : "FAIL";
  const m = result.measurements;
  return `${status} ${result.label} scroll=${m.documentScrollWidth}x${m.documentScrollHeight}/${m.innerWidth}x${m.innerHeight} hand=${Math.round(m.handWidthRatio * 100)}% gap=${m.handGap}px centerDelta=${m.centerDelta}px`;
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
  const userDataDir = mkdtempSync(path.join(tmpdir(), "mahjong-exact-mock-check-"));
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

  throw new Error("Chrome executable was not found. Set CHROME_PATH to run the exact mock check.");
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
