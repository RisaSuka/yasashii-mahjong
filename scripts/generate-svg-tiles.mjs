import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve("assets/tiles");
fs.mkdirSync(outputDir, { recursive: true });

function writeTile(name, body, accent = "#334155") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 112" role="img">
  <defs>
    <linearGradient id="tileBase" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.76" stop-color="#fffdf8"/>
      <stop offset="1" stop-color="#d7c8ad"/>
    </linearGradient>
    <filter id="tileShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.2" flood-color="#0f172a" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect x="5" y="4" width="70" height="104" rx="10" fill="url(#tileBase)" stroke="${accent}" stroke-width="3" filter="url(#tileShadow)"/>
  <rect x="12" y="11" width="56" height="85" rx="7" fill="#fff" stroke="${accent}" stroke-opacity="0.42" stroke-width="2"/>
  ${body}
  <rect x="16" y="96" width="48" height="5" rx="3" fill="#8b7355" opacity="0.26"/>
</svg>
`;
  fs.writeFileSync(path.join(outputDir, name), svg, "utf8");
}

function label(x, y, value, size, color, weight = 800) {
  return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, 'Noto Sans JP', sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${value}</text>`;
}

function dot(x, y, color) {
  return `<circle cx="${x}" cy="${y}" r="7.6" fill="#fff" stroke="${color}" stroke-width="4"/>
  <circle cx="${x}" cy="${y}" r="2.6" fill="${color}"/>`;
}

function bamboo(x, y, height = 46) {
  return `<rect x="${x - 3}" y="${y}" width="6" height="${height}" rx="3" fill="#087443"/>
  <circle cx="${x}" cy="${y + 8}" r="4" fill="#34d399"/>
  <circle cx="${x}" cy="${y + height - 8}" r="4" fill="#34d399"/>`;
}

const kanjiNumbers = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
for (let rank = 1; rank <= 9; rank += 1) {
  writeTile(
    `man-${rank}.svg`,
    `${label(40, 39, kanjiNumbers[rank], 31, "#a32018", 900)}
  ${label(40, 68, "萬", 25, "#b42318", 900)}
  ${label(62, 25, String(rank), 13, "#a32018", 900)}`,
    "#b42318"
  );
}

const pinDots = {
  1: [[40, 52]],
  2: [[31, 42], [49, 62]],
  3: [[28, 37], [40, 52], [52, 67]],
  4: [[29, 38], [51, 38], [29, 66], [51, 66]],
  5: [[29, 36], [51, 36], [40, 52], [29, 68], [51, 68]],
  6: [[28, 34], [52, 34], [28, 52], [52, 52], [28, 70], [52, 70]],
  7: [[28, 31], [52, 31], [28, 47], [52, 47], [40, 60], [28, 75], [52, 75]],
  8: [[28, 30], [52, 30], [28, 44], [52, 44], [28, 58], [52, 58], [28, 72], [52, 72]],
  9: [[27, 30], [40, 30], [53, 30], [27, 52], [40, 52], [53, 52], [27, 74], [40, 74], [53, 74]]
};
const pinColors = ["#175cd3", "#087443", "#b42318"];
for (let rank = 1; rank <= 9; rank += 1) {
  const dots = pinDots[rank].map(([x, y], index) => dot(x, y, pinColors[index % pinColors.length])).join("\n  ");
  writeTile(`pin-${rank}.svg`, `${dots}\n  ${label(62, 87, String(rank), 13, "#175cd3", 900)}`, "#175cd3");
}

const bird = `<path d="M24 60c9-23 25-30 38-17-15 0-20 8-21 20 8-4 15-3 20 2-10 2-17 8-24 17-3-10-8-16-13-22Z" fill="#087443"/>
  <circle cx="49" cy="44" r="3" fill="#fff"/>
  <path d="M55 43l9-4-6 9z" fill="#f59e0b"/>`;
writeTile("sou-1.svg", `${bird}\n  ${label(62, 87, "1", 13, "#087443", 900)}`, "#087443");

const souPositions = {
  2: [30, 50],
  3: [26, 40, 54],
  4: [27, 37, 47, 57],
  5: [25, 33, 40, 47, 55],
  6: [25, 34, 43, 52, 30, 48],
  7: [23, 31, 39, 47, 55, 31, 47],
  8: [23, 31, 39, 47, 55, 27, 40, 53],
  9: [23, 31, 39, 47, 55, 27, 40, 53, 60]
};
for (let rank = 2; rank <= 9; rank += 1) {
  const bars = souPositions[rank]
    .map((x, index) => bamboo(x, index >= 5 ? 52 : 28, index >= 5 ? 28 : 42))
    .join("\n  ");
  writeTile(`sou-${rank}.svg`, `${bars}\n  ${label(62, 87, String(rank), 13, "#087443", 900)}`, "#087443");
}

const honors = [
  ["honor-east.svg", "東", "#111827", "#334155", ""],
  ["honor-south.svg", "南", "#111827", "#334155", ""],
  ["honor-west.svg", "西", "#111827", "#334155", ""],
  ["honor-north.svg", "北", "#111827", "#334155", ""],
  ["honor-white.svg", "白", "#111827", "#64748b", '<rect x="24" y="24" width="32" height="54" rx="5" fill="none" stroke="#94a3b8" stroke-width="3" opacity="0.9"/>'],
  ["honor-green.svg", "發", "#087443", "#087443", ""],
  ["honor-red.svg", "中", "#b42318", "#b42318", ""]
];
for (const [name, glyph, color, accent, extra] of honors) {
  writeTile(name, `${label(40, 51, glyph, 43, color, 900)}\n  ${extra}`, accent);
}

console.log(`Generated ${fs.readdirSync(outputDir).filter((file) => file.endsWith(".svg")).length} SVG tile files in ${outputDir}`);
