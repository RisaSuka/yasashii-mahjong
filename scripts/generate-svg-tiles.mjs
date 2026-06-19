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

function pinDot(x, y, color = COLORS.blue, size = 7.4) {
  return `<circle cx="${x}" cy="${y}" r="${size + 3.6}" fill="#fffef9" stroke="${color}" stroke-width="2.8"/>
  <circle cx="${x}" cy="${y}" r="${size}" fill="none" stroke="${color}" stroke-width="3.2"/>
  <circle cx="${x}" cy="${y}" r="${Math.max(2.2, size * 0.35)}" fill="${color}"/>`;
}

function largePinOne() {
  return `<circle cx="40" cy="52" r="21" fill="#fffef9" stroke="${COLORS.blue}" stroke-width="4.2"/>
  <circle cx="40" cy="52" r="13" fill="none" stroke="${COLORS.blue}" stroke-width="3.2"/>
  <circle cx="40" cy="52" r="6.2" fill="${COLORS.red}"/>
  <circle cx="40" cy="52" r="2.3" fill="#fffef9"/>`;
}

function bambooUnit(x, y, color = COLORS.green, scale = 1) {
  const width = 11.8 * scale;
  const height = 24 * scale;
  const bandWidth = 13.6 * scale;
  const bandHeight = 3.4 * scale;
  const dotRadius = 2.2 * scale;

  return `<g>
    <rect x="${round(x - width / 2)}" y="${round(y - height / 2)}" width="${round(width)}" height="${round(height)}" rx="${round(4.4 * scale)}" fill="${color}"/>
    <rect x="${round(x - bandWidth / 2)}" y="${round(y - bandHeight / 2)}" width="${round(bandWidth)}" height="${round(bandHeight)}" rx="${round(1.7 * scale)}" fill="#fffef9" opacity="0.94"/>
    <circle cx="${x}" cy="${round(y - height * 0.27)}" r="${round(dotRadius)}" fill="#fffef9" opacity="0.9"/>
    <circle cx="${x}" cy="${round(y + height * 0.27)}" r="${round(dotRadius)}" fill="#fffef9" opacity="0.9"/>
  </g>`;
}

function souGrid(points, redIndexes = []) {
  return points.map(([x, y, scale = 1], index) => bambooUnit(x, y, redIndexes.includes(index) ? COLORS.red : COLORS.green, scale)).join("\n  ");
}

function round(value) {
  return Number(value.toFixed(2));
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
      .map(([x, y], index) => pinDot(x, y, rank >= 5 && index >= Math.floor(pinDots[rank].length / 2) ? COLORS.red : COLORS.blue, rank >= 7 ? 6.1 : 6.7))
      .join("\n  ");
  writeTile(`pin-${rank}.svg`, `${dots}\n  ${label(62, 88, String(rank), 12, COLORS.blue, 900, "Arial, sans-serif")}`, COLORS.blue);
}

const souOne = `<path d="M18 64c8-27 25-40 43-35-10 6-16 14-17 24 8-5 16-3 22 3-12 4-20 11-28 22-5-9-11-14-20-14Z" fill="${COLORS.green}"/>
  <path d="M23 64c9 0 18 5 26 14" fill="none" stroke="#0f5132" stroke-width="4" stroke-linecap="round"/>
  <circle cx="51" cy="38" r="3.5" fill="#fffef9"/>
  <path d="M59 38l8-4-5 9z" fill="#f59e0b"/>
  <path d="M18 73c8-4 16-1 22 6" fill="none" stroke="${COLORS.red}" stroke-width="3.4" stroke-linecap="round"/>`;
writeTile("sou-1.svg", `${souOne}\n  ${label(62, 88, "1", 12, COLORS.green, 900, "Arial, sans-serif")}`, COLORS.green);

const souPoints = {
  2: [[40, 36, 1.08], [40, 68, 1.08]],
  3: [[31, 34, 1.02], [40, 52, 1.02], [49, 70, 1.02]],
  4: [[30, 36, 1], [50, 36, 1], [30, 68, 1], [50, 68, 1]],
  5: [[29, 34, 0.98], [51, 34, 0.98], [40, 52, 0.98], [29, 70, 0.98], [51, 70, 0.98]],
  6: [[30, 31, 0.9], [50, 31, 0.9], [30, 52, 0.9], [50, 52, 0.9], [30, 73, 0.9], [50, 73, 0.9]],
  7: [[26, 31, 0.82], [40, 31, 0.82], [54, 31, 0.82], [31, 52, 0.86], [49, 52, 0.86], [31, 73, 0.86], [49, 73, 0.86]],
  8: [[26, 31, 0.8], [40, 31, 0.8], [54, 31, 0.8], [31, 51, 0.84], [49, 51, 0.84], [26, 73, 0.8], [40, 73, 0.8], [54, 73, 0.8]],
  9: [[26, 31, 0.78], [40, 31, 0.78], [54, 31, 0.78], [26, 52, 0.78], [40, 52, 0.78], [54, 52, 0.78], [26, 73, 0.78], [40, 73, 0.78], [54, 73, 0.78]]
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
