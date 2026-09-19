// Reads a brand colour off a website and writes it into content.json.
//
//   node brand.mjs https://example.com          # look, print, ask nothing
//   node brand.mjs https://example.com --write  # also set brand.bg in content.json
//
// It fetches the page and its stylesheets and ranks every colour it finds.
// Declared brand tokens win over anything counted by frequency: a site that
// says --brand-primary is telling you the answer, and guessing from pixel
// counts on top of that only adds noise.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith("-"));
const write = args.includes("--write");
if (!url) {
  console.error("usage: node brand.mjs <url> [--write]");
  process.exit(1);
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function get(u) {
  const res = await fetch(u, { headers: { "user-agent": UA, accept: "*/*" }, redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${u}`);
  return await res.text();
}

// ---------------------------------------------------------------- colours ---
const clamp = (v) => Math.min(255, Math.max(0, Math.round(v)));
const toHex = (r, g, b) => "#" + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("").toUpperCase();

function parseColour(raw) {
  const s = raw.trim().toLowerCase();
  let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(s);
  if (m) {
    const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(s);
  if (m) return [+m[1], +m[2], +m[3]];
  m = /^hsla?\(\s*([-\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/.exec(s);
  if (m) {
    const h = (((+m[1] % 360) + 360) % 360) / 360, sa = +m[2] / 100, l = +m[3] / 100;
    if (!sa) return [l * 255, l * 255, l * 255];
    const q = l < 0.5 ? l * (1 + sa) : l + sa - l * sa, p = 2 * l - q;
    const k = (t) => {
      t = (t + 1) % 1;
      return (t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p) * 255;
    };
    return [k(h + 1 / 3), k(h), k(h - 1 / 3)];
  }
  return null;
}

const hsl = ([r, g, b]) => {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const l = (mx + mn) / 2;
  if (!d) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
};

// A usable ground is saturated enough to read as a colour and not so dark or
// pale that the design collapses into a white or black card.
const usable = (rgb) => {
  const [, s, l] = hsl(rgb);
  return s >= 0.25 && l >= 0.12 && l <= 0.9;
};

// ---------------------------------------------------------------- scraping --
const TOKEN = /--([a-z0-9-]*(?:brand|primary|accent|main|theme|highlight|cta)[a-z0-9-]*)\s*:\s*([^;}]+)/gi;
const ANY = /(#[0-9a-f]{3}\b|#[0-9a-f]{6}\b|rgba?\([^)]+\)|hsla?\([^)]+\))/gi;

const page = new URL(url.startsWith("http") ? url : "https://" + url);
const html = await get(page.href);

// stylesheets, in document order, same origin only
const sheets = [...html.matchAll(/<link[^>]+rel=["']?stylesheet["']?[^>]*>/gi)]
  .map((t) => /href=["']([^"']+)["']/i.exec(t[0])?.[1])
  .filter(Boolean)
  .map((h) => new URL(h, page).href)
  .filter((h) => new URL(h).origin === page.origin)
  .slice(0, 8);

let css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
for (const s of sheets) {
  try { css += "\n" + (await get(s)); } catch (e) { console.warn(`  (skipped ${s}: ${e.message})`); }
}

const candidates = new Map(); // hex -> { score, why }
const add = (rgb, score, why) => {
  if (!rgb || !usable(rgb)) return;
  const hex = toHex(...rgb);
  const cur = candidates.get(hex);
  if (!cur || cur.score < score) candidates.set(hex, { score, why });
  else cur.score += score * 0.1;
};

// 1. declared brand tokens — the strongest signal there is
for (const m of css.matchAll(TOKEN)) {
  const c = parseColour(m[2]) || parseColour((ANY.exec(m[2]) || [])[0] || "");
  ANY.lastIndex = 0;
  add(c, 1000, `--${m[1]}`);
}
// 2. the browser theme colour the site publishes for mobile chrome
const theme = /<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i.exec(html);
if (theme) add(parseColour(theme[1]), 700, "<meta theme-color>");

// 3. everything else, by how often the stylesheet repeats it
const counts = new Map();
for (const m of css.matchAll(ANY)) {
  const rgb = parseColour(m[1]);
  if (!rgb || !usable(rgb)) continue;
  const hex = toHex(...rgb);
  counts.set(hex, (counts.get(hex) || 0) + 1);
}
for (const [hex, n] of counts) {
  const [, s] = hsl(parseColour(hex));
  add(parseColour(hex), n * (1 + s), `${n}x in css`);
}

const ranked = [...candidates.entries()].sort((a, b) => b[1].score - a[1].score).slice(0, 6);
if (!ranked.length) {
  console.error(`No usable brand colour found on ${page.href}. Set brand.bg in content.json by hand.`);
  process.exit(2);
}

console.log(`Brand colours found on ${page.href}:`);
ranked.forEach(([hex, v], i) => console.log(`  ${i === 0 ? "->" : "  "} ${hex}  (${v.why})`));

if (write) {
  const file = "content.json";
  if (!existsSync(file)) {
    console.error("No content.json here — run this inside the video project.");
    process.exit(3);
  }
  const c = JSON.parse(readFileSync(file, "utf8"));
  c.brand = { ...(c.brand || {}), bg: ranked[0][0] };
  writeFileSync(file, JSON.stringify(c, null, 2) + "\n");
  console.log(`\ncontent.json updated: brand.bg = ${ranked[0][0]}. Run "node build.mjs" next.`);
} else {
  console.log(`\nTo use the first one: node brand.mjs ${page.href} --write`);
}
