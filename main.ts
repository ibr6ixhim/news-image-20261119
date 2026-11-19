// "19 November 2026 — The Day in One Page"
// A photographic front page for the make.fun bounty news-image-20261119.
// Node 22, stdlib only, no network. Reads indexed-colour photo assets from
// ./assets (raw palette indices + 256-colour palettes, made deterministically
// from generated editorial photos) and composites a 1024x1024 front page,
// then writes /output/entry.png (PNG, RGB, per-row filter choice).
//
// Stories (all verified for 19 November 2026):
//   HERO   GTA VI launches worldwide (rolling midnight, NZ first) — 99
//          Metascore, 15.9M pre-order copies / $1.54B (Sensor Tower).
//   SUMMIT Trump, Xi and Putin meet in Shenzhen, APEC sidelines — first
//          ever trilateral of the three leaders (14:30 Shenzhen).
//   GULF   Iran strikes a US base in Kuwait (first attack on Kuwait since
//          September); Bahrain intercepts a 3rd attack in a week (Reuters).
//   ICJ    The Hague rules today on Gambia v Myanmar (Rohingya genocide);
//          700,000+ fled in 2017.
//   IPO    Anthropic debuts on Nasdaq (ANT), priced at $83.00 a share.
//   STORM  Twin cyclones: Xavier, Category 5, over the N. Cook Islands;
//          Akvan in the Bay of Bengal.

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as zlib from "node:zlib";
import * as crypto from "node:crypto";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- palette
const PAPER: [number, number, number] = [247, 242, 231];
const INK: [number, number, number] = [26, 35, 64];
const RED: [number, number, number] = [193, 39, 45];
const TEAL: [number, number, number] = [15, 118, 110];
const PURPLE: [number, number, number] = [109, 40, 217];
const ORANGE: [number, number, number] = [217, 119, 6];
const WHITE: [number, number, number] = [255, 255, 255];
const NAVY: [number, number, number] = [26, 35, 64];

// ------------------------------------------------------------------ canvas
const px = new Uint8Array(W * H * 3);
function fill(r: number, g: number, b: number): void {
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = r;
    px[i * 3 + 1] = g;
    px[i * 3 + 2] = b;
  }
}
function rect(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w);
  const y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W + xx) * 3;
      px[i] = c[0];
      px[i + 1] = c[1];
      px[i + 2] = c[2];
    }
  }
}
function border(x: number, y: number, w: number, h: number, t: number, c: [number, number, number]): void {
  rect(x, y, w, t, c);
  rect(x, y + h - t, w, t, c);
  rect(x, y, t, h, c);
  rect(x + w - t, y, t, h, c);
}
function setPx(x: number, y: number, c: [number, number, number]): void {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

// ------------------------------------------------------------ photo assets
const HERE = path.dirname(fileURLToPath(import.meta.url));
function drawPhoto(name: string, w: number, h: number, dx: number, dy: number): void {
  const idx = fs.readFileSync(path.join(HERE, "assets", `${name}.idx`));
  const pal = fs.readFileSync(path.join(HERE, "assets", `${name}.pal`));
  if (idx.length !== w * h) throw new Error(`asset ${name}: bad idx size ${idx.length}`);
  if (pal.length !== 768) throw new Error(`asset ${name}: bad pal size ${pal.length}`);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ci = idx[y * w + x] * 3;
      setPx(dx + x, dy + y, [pal[ci], pal[ci + 1], pal[ci + 2]]);
    }
  }
}

// ------------------------------------------------------------ bitmap font
// Bold 8x10 glyphs, one string per row, "#" = ink. Only the characters the
// page uses are defined; anything else throws so typos cannot slip through.
const GLYPHS: Record<string, string[]> = {
  " ": ["........", "........", "........", "........", "........", "........", "........", "........", "........", "........"],
  A: ["........", ".######.", "##....##", "##....##", "##....##", "########", "##....##", "##....##", "##....##", "........"],
  B: ["........", "#######.", "##....##", "##....##", "#######.", "##....##", "##....##", "##....##", "#######.", "........"],
  C: ["........", ".######.", "##....##", "##......", "##......", "##......", "##......", "##....##", ".######.", "........"],
  D: ["........", "#######.", "##....##", "##....##", "##....##", "##....##", "##....##", "##....##", "#######.", "........"],
  E: ["........", "########", "##......", "##......", "#####...", "##......", "##......", "##......", "########", "........"],
  F: ["........", "########", "##......", "##......", "#####...", "##......", "##......", "##......", "##......", "........"],
  G: ["........", ".######.", "##....##", "##......", "##..####", "##....##", "##....##", "##....##", ".######.", "........"],
  H: ["........", "##....##", "##....##", "##....##", "########", "##....##", "##....##", "##....##", "##....##", "........"],
  I: ["........", ".######.", "...##...", "...##...", "...##...", "...##...", "...##...", "...##...", ".######.", "........"],
  J: ["........", "....####", ".....##.", ".....##.", ".....##.", ".....##.", "##...##.", "##...##.", ".#####..", "........"],
  K: ["........", "##....##", "##...##.", "##..##..", "#####...", "##..##..", "##...##.", "##....##", "##....##", "........"],
  L: ["........", "##......", "##......", "##......", "##......", "##......", "##......", "##......", "########", "........"],
  M: ["........", "##....##", "###..###", "##.##.##", "##.##.##", "##....##", "##....##", "##....##", "##....##", "........"],
  N: ["........", "##....##", "###...##", "####..##", "##.##.##", "##..####", "##...###", "##....##", "##....##", "........"],
  O: ["........", ".######.", "##....##", "##....##", "##....##", "##....##", "##....##", "##....##", ".######.", "........"],
  P: ["........", "#######.", "##....##", "##....##", "#######.", "##......", "##......", "##......", "##......", "........"],
  Q: ["........", ".######.", "##....##", "##....##", "##....##", "##..#.##", "##...##.", "##....##", ".#####.#", "........"],
  R: ["........", "#######.", "##....##", "##....##", "#######.", "##..##..", "##...##.", "##....##", "##....##", "........"],
  S: ["........", ".######.", "##....##", "##......", ".#####..", ".....##.", "##....##", "##....##", ".######.", "........"],
  T: ["........", "########", "...##...", "...##...", "...##...", "...##...", "...##...", "...##...", "...##...", "........"],
  U: ["........", "##....##", "##....##", "##....##", "##....##", "##....##", "##....##", "##....##", ".######.", "........"],
  V: ["........", "##....##", "##....##", "##....##", "##....##", "##....##", ".##..##.", ".##..##.", "..####..", "........"],
  W: ["........", "##....##", "##....##", "##....##", "##.##.##", "##.##.##", "##.##.##", ".##..##.", ".##..##.", "........"],
  X: ["........", "##....##", "##....##", ".##..##.", "..####..", "..####..", ".##..##.", "##....##", "##....##", "........"],
  Y: ["........", "##....##", "##....##", ".##..##.", "..####..", "...##...", "...##...", "...##...", "...##...", "........"],
  Z: ["........", "########", ".....##.", "....##..", "...##...", "..##....", ".##.....", "##......", "########", "........"],
  "0": ["........", ".######.", "##....##", "##...###", "##..####", "##.##.##", "####..##", "###...##", ".######.", "........"],
  "1": ["........", "....##..", "...###..", "..####..", "....##..", "....##..", "....##..", "....##..", "..######", "........"],
  "2": ["........", ".######.", "##....##", "......##", ".....##.", "....##..", "...##...", "..##....", "########", "........"],
  "3": ["........", ".######.", "##....##", "......##", "...####.", "......##", "......##", "##....##", ".######.", "........"],
  "4": ["........", "....##..", "...###..", "..##.#..", ".##..#..", "########", "....##..", "....##..", "....##..", "........"],
  "5": ["........", "########", "##......", "##......", "#######.", "......##", "......##", "##....##", ".######.", "........"],
  "6": ["........", ".######.", "##....##", "##......", "#######.", "##....##", "##....##", "##....##", ".######.", "........"],
  "7": ["........", "########", "......##", ".....##.", "....##..", "...##...", "...##...", "...##...", "...##...", "........"],
  "8": ["........", ".######.", "##....##", "##....##", ".######.", "##....##", "##....##", "##....##", ".######.", "........"],
  "9": ["........", ".######.", "##....##", "##....##", "##....##", ".#######", "......##", "##....##", ".######.", "........"],
  ".": ["........", "........", "........", "........", "........", "........", "........", "...##...", "...##...", "........"],
  ",": ["........", "........", "........", "........", "........", "........", "........", "...##...", "...##...", "..##...."],
  ":": ["........", "........", "...##...", "...##...", "........", "........", "...##...", "...##...", "........", "........"],
  ";": ["........", "........", "...##...", "...##...", "........", "........", "...##...", "...##...", "..##....", "........"],
  "!": ["........", "...##...", "...##...", "...##...", "...##...", "...##...", "...##...", "........", "...##...", "........"],
  "?": ["........", ".######.", "##....##", "......##", ".....##.", "....##..", "........", "...##...", "...##...", "........"],
  "-": ["........", "........", "........", "........", ".######.", ".######.", "........", "........", "........", "........"],
  "—": ["........", "........", "........", "........", "########", "########", "........", "........", "........", "........"],
  "/": ["........", "......##", ".....##.", ".....##.", "....##..", "...##...", "..##....", ".##.....", "##......", "........"],
  "(": ["........", "....##..", "...##...", "..##....", "..##....", "..##....", "..##....", "...##...", "....##..", "........"],
  ")": ["........", "..##....", "...##...", "....##..", "....##..", "....##..", "....##..", "...##...", "..##....", "........"],
  "'": ["........", "...##...", "...##...", "...##...", "........", "........", "........", "........", "........", "........"],
  '"': ["........", "..##.##.", "..##.##.", "..##.##.", "........", "........", "........", "........", "........", "........"],
  "+": ["........", "........", "...##...", "...##...", ".######.", ".######.", "...##...", "...##...", "........", "........"],
  "&": ["........", "..###...", ".##.##..", "##...##.", ".#####..", "##..##..", "##...##.", "##...##.", ".#####.#", "........"],
  "•": ["........", "........", "........", "...##...", "..####..", "..####..", "...##...", "........", "........", "........"],
};

function textWidth(s: string, scale: number): number {
  return s.length * 8 * scale;
}
function drawText(s: string, x: number, y: number, scale: number, c: [number, number, number]): void {
  const up = s.toUpperCase();
  for (let ci = 0; ci < up.length; ci++) {
    const g = GLYPHS[up[ci]];
    if (!g) throw new Error(`no glyph for ${JSON.stringify(up[ci])} in ${JSON.stringify(s)}`);
    for (let r = 0; r < 10; r++) {
      const row = g[r];
      for (let col = 0; col < 8; col++) {
        if (row[col] === "#") {
          rect(x + ci * 8 * scale + col * scale, y + r * scale, scale, scale, c);
        }
      }
    }
  }
}
function drawTextRight(s: string, rightX: number, y: number, scale: number, c: [number, number, number]): void {
  drawText(s, rightX - textWidth(s, scale), y, scale, c);
}
function drawLines(lines: string[], x: number, y: number, scale: number, c: [number, number, number], maxLines: number, maxChars: number): void {
  if (lines.length > maxLines) throw new Error(`too many lines (${lines.length} > ${maxLines}): ${JSON.stringify(lines)}`);
  for (const ln of lines) {
    if (ln.length > maxChars) throw new Error(`line too long (${ln.length} > ${maxChars}): ${JSON.stringify(ln)}`);
  }
  lines.forEach((ln, i) => drawText(ln, x, y + i * 10 * scale, scale, c));
}

// --------------------------------------------------------------- PNG out
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, "ascii"), data]));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}
function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}
function encodePng(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const rowBytes = W * 3;
  const raw = Buffer.alloc(H * (rowBytes + 1));
  const prev = Buffer.alloc(rowBytes);
  for (let y = 0; y < H; y++) {
    const row = px.subarray(y * rowBytes, (y + 1) * rowBytes);
    let best: Buffer | null = null;
    let bestScore = Infinity;
    let bestFilter = 0;
    for (let f = 0; f <= 4; f++) {
      const out = Buffer.alloc(rowBytes);
      for (let i = 0; i < rowBytes; i++) {
        const a = i >= 3 ? row[i - 3] : 0;
        const b = prev[i];
        const cc = i >= 3 ? prev[i - 3] : 0;
        let pred = 0;
        if (f === 1) pred = a;
        else if (f === 2) pred = b;
        else if (f === 3) pred = (a + b) >> 1;
        else if (f === 4) pred = paeth(a, b, cc);
        out[i] = (row[i] - pred) & 0xff;
      }
      let score = 0;
      for (let i = 0; i < rowBytes; i++) {
        const v = out[i];
        score += v < 128 ? v : 256 - v;
      }
      if (score < bestScore) {
        bestScore = score;
        best = out;
        bestFilter = f;
      }
    }
    raw[y * (rowBytes + 1)] = bestFilter;
    raw.set(best!, y * (rowBytes + 1) + 1);
    prev.set(row);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// ------------------------------------------------------------------ layout
function kicker(x: number, y: number, w: number, h: number, label: string, c: [number, number, number]): void {
  rect(x, y, w, h, c);
  drawText(label, x + 8, y + (h - 20) / 2, 2, WHITE);
}

function main(): void {
  fill(PAPER[0], PAPER[1], PAPER[2]);
  border(16, 16, 992, 992, 3, INK);

  // ---- masthead ------------------------------------------------------
  drawText("WORLD NEWS", 24, 30, 6, INK);
  rect(692, 28, 308, 52, RED);
  const date = "19 NOV 2026";
  drawText(date, 692 + Math.floor((308 - textWidth(date, 3)) / 2), 39, 3, WHITE);
  drawText("THURSDAY 19 NOVEMBER 2026", 24, 96, 1, INK);
  drawTextRight("THE DAY IN SIX PICTURES", 1000, 96, 1, INK);
  rect(24, 112, 976, 2, INK);

  // ---- hero: GTA VI --------------------------------------------------
  border(24, 120, 976, 272, 3, INK);
  rect(508, 120, 3, 272, INK);
  drawPhoto("hero", 484, 260, 516, 124);
  kicker(28, 124, 472, 26, "ENTERTAINMENT", PURPLE);
  drawLines(["GTA VI IS HERE", "THE WORLD PLAYS"], 28, 158, 3, INK, 2, 20);
  drawLines(["13 YEARS ON, ROCKSTAR'S", "BLOCKBUSTER LAUNCHES AT", "MIDNIGHT WORLDWIDE."], 28, 228, 2, INK, 3, 30);
  drawText("99 METASCORE. 1.5BN PREORDERS", 28, 300, 2, RED);
  drawText("PS5 + XBOX. USD 79.99.", 28, 332, 2, INK);
  rect(28, 362, 472, 2, INK);
  drawText("PREORDERS: 15.9M COPIES, 1.54BN USD (SENSOR TOWER)", 28, 370, 1, INK);

  // ---- row 2: summit + gulf ------------------------------------------
  const row2 = [
    { x: 24, label: "DIPLOMACY", color: TEAL, photo: "summit", w: 472, h: 140,
      head: ["TRUMP, XI, PUTIN", "MEET IN SHENZHEN"],
      body: ["FIRST-EVER TRILATERAL.", "UKRAINE, IRAN, TRADE."] },
    { x: 524, label: "WAR IN THE GULF", color: RED, photo: "iran", w: 472, h: 140,
      head: ["IRAN HITS US BASE", "IN KUWAIT"],
      body: ["FIRST ATTACK ON KUWAIT", "SINCE SEPT. BAHRAIN: 3RD."] },
  ];
  for (const c of row2) {
    border(c.x, 404, 476, 274, 3, INK);
    kicker(c.x + 3, 407, 470, 26, c.label, c.color);
    drawLines(c.head, c.x + 8, 441, 2, INK, 2, 28);
    drawLines(c.body, c.x + 8, 489, 2, INK, 2, 28);
    drawPhoto(c.photo, c.w, c.h, c.x + 2, 536);
  }

  // ---- row 3: ICJ + IPO + storm --------------------------------------
  const row3 = [
    { x: 24, label: "JUSTICE", color: NAVY, photo: "icj", w: 301, h: 80,
      head: ["COURT RULES ON", "MYANMAR TODAY"],
      body: ["GAMBIA V MYANMAR.", "700,000 FLED 2017."] },
    { x: 353, label: "MARKETS", color: ORANGE, photo: "anthropic", w: 301, h: 80,
      head: ["ANTHROPIC DEBUTS", "ON NASDAQ TODAY"],
      body: ["PRICED AT 83 USD.", "TRADES TODAY: ANT."] },
    { x: 682, label: "WEATHER", color: TEAL, photo: "cyclone", w: 301, h: 80,
      head: ["TWIN CYCLONES", "IN THE PACIFIC"],
      body: ["XAVIER CAT 5.", "N. COOK ISLANDS."] },
  ];
  for (const c of row3) {
    border(c.x, 690, 317, 200, 3, INK);
    kicker(c.x + 3, 693, 311, 22, c.label, c.color);
    drawPhoto(c.photo, c.w, c.h, c.x + 8, 717);
    drawLines(c.head, c.x + 8, 801, 2, INK, 2, 18);
    drawLines(c.body, c.x + 8, 845, 2, INK, 2, 18);
  }

  // ---- footer ticker --------------------------------------------------
  rect(24, 902, 976, 102, NAVY);
  const ticker = [
    "EBOLA: DR CONGO 11,376 CASES, 5,568 DEAD (WHO)",
    "GAZA: FLOODS PUT 950,000 AT RISK — MEASLES: US 5,400+ CASES",
    "SIBERIA: AN-12 CRASH KILLS 19 — MARKETS: NVIDIA BEAT FORECASTS",
    "SOURCES: REUTERS — AP — BBC — AL JAZEERA — ICJ — ANTHROPIC",
  ];
  ticker.forEach((ln, i) => drawText(ln, 36, 917 + i * 18, 1, WHITE));

  // ---- write ----------------------------------------------------------
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  fs.mkdirSync(outDir, { recursive: true });
  const png = encodePng();
  const outPath = path.join(outDir, "entry.png");
  fs.writeFileSync(outPath, png);
  const sha = crypto.createHash("sha256").update(png).digest("hex");
  console.log(`WROTE ${outPath} ${png.length} bytes sha256=${sha}`);
}

main();
