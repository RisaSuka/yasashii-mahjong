import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve("assets/tiles");
fs.mkdirSync(outputDir, { recursive: true });

const COLORS = {
  black: "#111827",
  red: "#b42318",
  blue: "#173b8f",
  green: "#087443",
  cream: "#fffaf0",
  edge: "#b7aa8d"
};

function writeTile(name, body, accent = COLORS.black) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 112" role="img">
  <defs>
    <linearGradient id="tileBase" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.72" stop-color="${COLORS.cream}"/>
      <stop offset="1" stop-color="#dfd2b8"/>
    </linearGradient>
    <filter id="tileShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.8" stdDeviation="1.1" flood-color="#0f172a" flood-opacity="0.20"/>
    </filter>
  </defs>
  <rect x="5" y="4" width="70" height="104" rx="10" fill="url(#tileBase)" stroke="${COLORS.edge}" stroke-width="3" filter="url(#tileShadow)"/>
  <rect x="11" y="10" width="58" height="88" rx="7" fill="#fffef9" stroke="${accent}" stroke-opacity="0.34" stroke-width="2"/>
  ${body}
  <rect x="17" y="96" width="46" height="5" rx="3" fill="#8b7355" opacity="0.22"/>
</svg>
`;
  fs.writeFileSync(path.join(outputDir, name), svg, "utf8");
}

function label(x, y, value, size, color, weight = 900, family = "Georgia, 'Yu Mincho', serif") {
  return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${color}">${value}</text>`;
}

function pinDot(x, y, color = COLORS.blue, size = 7.3) {
  return `<circle cx="${x}" cy="${y}" r="${size + 3.2}" fill="#fffef9" stroke="${color}" stroke-width="2.6"/>
  <circle cx="${x}" cy="${y}" r="${size}" fill="none" stroke="${color}" stroke-width="3"/>
  <circle cx="${x}" cy="${y}" r="${Math.max(2.1, size * 0.35)}" fill="${color}"/>`;
}

function largePinOne() {
  return `<circle cx="40" cy="52" r="21" fill="#fffef9" stroke="${COLORS.blue}" stroke-width="4.2"/>
  <circle cx="40" cy="52" r="13" fill="none" stroke="${COLORS.blue}" stroke-width="3.2"/>
  <circle cx="40" cy="52" r="6.2" fill="${COLORS.red}"/>
  <circle cx="40" cy="52" r="2.3" fill="#fffef9"/>`;
}

function bambooUnit(x, y, color = COLORS.green) {
  return `<g>
    <rect x="${x - 4.4}" y="${y - 9}" width="8.8" height="18" rx="3.4" fill="${color}"/>
    <rect x="${x - 5.6}" y="${y - 1.6}" width="11.2" height="3.2" rx="1.6" fill="#fffef9" opacity="0.92"/>
    <circle cx="${x}" cy="${y - 6}" r="2.1" fill="#fffef9" opacity="0.86"/>
    <circle cx="${x}" cy="${y + 6}" r="2.1" fill="#fffef9" opacity="0.86"/>
  </g>`;
}

function souGrid(points, redIndexes = []) {
  return points.map(([x, y], index) => bambooUnit(x, y, redIndexes.includes(index) ? COLORS.red : COLORS.green)).join("\n  ");
}

const kanjiNumbers = [
  "",
  "&#19968;",
  "&#20108;",
  "&#19977;",
  "&#22235;",
  "&#20116;",
  "&#20845;",
  "&#19971;",
  "&#20843;",
  "&#20061;"
];

for (let rank = 1; rank <= 9; rank += 1) {
  writeTile(
    `man-${rank}.svg`,
    `${label(40, 38, kanjiNumbers[rank], 35, COLORS.black, 900)}
  ${label(40, 72, "&#33836;", 31, COLORS.red, 900)}
  ${label(62, 23, String(rank), 12, COLORS.red, 900, "Arial, sans-serif")}`,
    COLORS.red
  );
}

const pinDots = {
  2: [[33, 39], [47, 66]],
  3: [[30, 35], [40, 52], [50, 69]],
  4: [[30, 36], [50, 36], [30, 68], [50, 68]],
  5: [[30, 35], [50, 35], [40, 52], [30, 69], [50, 69]],
  6: [[29, 33], [51, 33], [29, 52], [51, 52], [29, 71], [51, 71]],
  7: [[27, 31], [40, 31], [53, 31], [30, 51], [50, 51], [30, 72], [50, 72]],
  8: [[27, 31], [40, 31], [53, 31], [30, 48], [50, 48], [27, 72], [40, 72], [53, 72]],
  9: [[27, 31], [40, 31], [53, 31], [27, 52], [40, 52], [53, 52], [27, 73], [40, 73], [53, 73]]
};

for (let rank = 1; rank <= 9; rank += 1) {
  const dots = rank === 1
    ? largePinOne()
    : pinDots[rank]
      .map(([x, y], index) => pinDot(x, y, rank >= 5 && index >= Math.floor(pinDots[rank].length / 2) ? COLORS.red : COLORS.blue, rank >= 7 ? 5.7 : 6.3))
      .join("\n  ");
  writeTile(`pin-${rank}.svg`, `${dots}\n  ${label(62, 88, String(rank), 12, COLORS.blue, 900, "Arial, sans-serif")}`, COLORS.blue);
}

const souOne = `<path d="M22 66c7-23 22-37 38-31-9 5-14 12-15 21 7-4 14-3 19 2-10 4-17 10-24 20-4-9-10-13-18-12Z" fill="${COLORS.green}"/>
  <path d="M25 65c8 0 16 4 23 13" fill="none" stroke="#0f5132" stroke-width="3" stroke-linecap="round"/>
  <circle cx="50" cy="39" r="3.2" fill="#fffef9"/>
  <path d="M57 39l8-4-5 8z" fill="#f59e0b"/>
  <path d="M20 72c8-3 14-1 19 5" fill="none" stroke="${COLORS.red}" stroke-width="3" stroke-linecap="round"/>`;
writeTile("sou-1.svg", `${souOne}\n  ${label(62, 88, "1", 12, COLORS.green, 900, "Arial, sans-serif")}`, COLORS.green);

const souPoints = {
  2: [[40, 36], [40, 68]],
  3: [[32, 34], [40, 52], [48, 70]],
  4: [[30, 36], [50, 36], [30, 68], [50, 68]],
  5: [[30, 34], [50, 34], [40, 52], [30, 70], [50, 70]],
  6: [[30, 32], [50, 32], [30, 52], [50, 52], [30, 72], [50, 72]],
  7: [[26, 32], [40, 32], [54, 32], [31, 52], [49, 52], [31, 72], [49, 72]],
  8: [[26, 32], [40, 32], [54, 32], [31, 50], [49, 50], [26, 72], [40, 72], [54, 72]],
  9: [[26, 32], [40, 32], [54, 32], [26, 52], [40, 52], [54, 52], [26, 72], [40, 72], [54, 72]]
};
const souRedIndexes = {
  5: [2],
  7: [3],
  8: [3, 4],
  9: [1, 4, 7]
};

for (let rank = 2; rank <= 9; rank += 1) {
  writeTile(
    `sou-${rank}.svg`,
    `${souGrid(souPoints[rank], souRedIndexes[rank] || [])}\n  ${label(62, 88, String(rank), 12, COLORS.green, 900, "Arial, sans-serif")}`,
    COLORS.green
  );
}

const honors = [
  ["honor-east.svg", "&#26481;", COLORS.black, COLORS.black, ""],
  ["honor-south.svg", "&#21335;", COLORS.black, COLORS.black, ""],
  ["honor-west.svg", "&#35199;", COLORS.black, COLORS.black, ""],
  ["honor-north.svg", "&#21271;", COLORS.black, COLORS.black, ""],
  ["honor-white.svg", "&#30333;", COLORS.black, "#64748b", '<rect x="23" y="23" width="34" height="56" rx="5" fill="none" stroke="#94a3b8" stroke-width="3.4" opacity="0.95"/>'],
  ["honor-green.svg", "&#30332;", COLORS.green, COLORS.green, ""],
  ["honor-red.svg", "&#20013;", COLORS.red, COLORS.red, ""]
];

for (const [name, glyph, color, accent, extra] of honors) {
  writeTile(name, `${label(40, 52, glyph, 47, color, 900)}\n  ${extra}`, accent);
}

console.log(`Generated ${fs.readdirSync(outputDir).filter((file) => file.endsWith(".svg")).length} SVG tile files in ${outputDir}`);
