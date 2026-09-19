// Generates index.html (a HyperFrames composition) from data.json.
//
// The look is reverse-engineered from a reference KPI-dashboard clip. Every number in
// STYLE below was measured off that recording (content area 1223x586) and expressed as a
// ratio, so it rebuilds at any canvas size; the comment on each line says what it was
// measured from. Do not "tidy" these values.
//
// Usage:  node build.mjs [data.json]

import { readFileSync, writeFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// STYLE — the measured reference. Treat as locked unless the user asks.
// ---------------------------------------------------------------------------
const STYLE = {
  formats: {
    landscape: { width: 1920, height: 1080 },
    portrait: { width: 1080, height: 1920 },
    square: { width: 1080, height: 1080 },
  },

  // --- background ---------------------------------------------------------
  // Sampled across the reference frame: #0A0F19 top-left, #080D18 bottom corners,
  // #131927 centre. Rebuilt as a near-black base plus one wide soft glow.
  // One wide glow hanging off the top edge, symmetric left to right — the reference
  // peaks at (19,25,41) just under the title and is back to base by 85% frame height.
  bgBase: "#080D18",
  bgGlow: "rgba(40, 50, 80, 0.42)",
  bgGlowMid: "rgba(26, 33, 55, 0.34)", // an intermediate stop, so the 8-bit banding spreads

  // --- typography ---------------------------------------------------------
  // The reference was recorded on macOS with the system UI font. Keeping system-ui
  // first reproduces it exactly there and stays offline everywhere else.
  font: 'system-ui, -apple-system, "Segoe UI", Inter, "Helvetica Neue", Arial, sans-serif',
  titleRatio: 0.026, // 32px cap-fitted at 1223 wide -> 50px at 1920
  titleWeight: 600,
  titleColor: "#FFFFFF",
  titleTracking: "-0.018em",
  subRatio: 0.0112, // 13.5/1223
  subColor: "#8E93AE",
  footRatio: 0.0094,
  footColor: "#787D90", // lifted from the sampled #5F6479 to clear 4.5:1 contrast

  // --- page geometry (fractions of canvas width) --------------------------
  padXRatio: 0.058, // card block starts 71/1223 from the left
  gapRatio: 0.018, // gap between cards 22/1223
  // In the reference the top margin (67) and the left margin (71) are the same, so both
  // hang off the width. That also keeps 9:16 from becoming top-heavy.
  headerTopRatio: 0.058,
  headerToGridRatio: 0.038, // subtitle box bottom to first card top, 32/1223 plus air
  padBottomRatio: 0.055,

  // --- card geometry ------------------------------------------------------
  // Card fill sampled #171C29 over a #0D121F ground -> white at ~4.5%, with the
  // 1px border one step lighter (#181E2A).
  cardFillTop: "rgba(255, 255, 255, 0.055)",
  cardFillBottom: "rgba(255, 255, 255, 0.028)",
  cardBorder: "rgba(255, 255, 255, 0.075)",
  cardRadiusRatio: 0.038, // 13/348 of card width
  cardPadRatio: 0.063, // 22/348
  // Card height as a fraction of its width, when the frame leaves height free.
  // 182/348 in the reference; the taller portrait/square defaults keep a 2-column
  // grid from leaving a void above and below.
  cardAspect: { landscape: 0.58, portrait: 0.78, square: 0.7 },
  cardAspectMin: 0.42,
  cardAspectMax: 0.82,

  // --- card contents (fractions of card width) ----------------------------
  labelRatio: 0.043, // 15/348
  labelWeight: 500,
  labelColor: "#A9AFC6", // sampled #AEB3CB
  badgeRatio: 0.04, // 14/348
  badgeWeight: 600,
  valueRatio: 0.138, // 48/348
  valueWeight: 500,
  valueColor: "#FFFFFF",
  valueTracking: "-0.02em",
  // Two optional lines under the number. Not in the reference clip, which had no room
  // for them — sized one step down from the label so they read as caption, not content.
  noteRatio: 0.04,
  noteColor: "#A9AFC6",
  metaRatio: 0.0335,
  metaColor: "#828798", // on the card fill this is the darkest grey that clears 4.5:1
  valueToNoteRatio: 0.075, // of card width, number baseline to the note line
  noteToMetaRatio: 0.012,
  sparkWRatio: 0.42, // 146/348
  sparkHRatio: 0.115, // 40/348 — measured against the width so it does not chase the height
  sparkGapRatio: 0.063, // number box bottom to sparkline top, 22/348
  sparkStrokeRatio: 0.0055, // ~2px at 348 wide -> 3px at 1920
  sparkFillAlpha: 0.28, // fill under the line, sampled ~22-28% at the top edge
  sparkPoints: 10,

  // Badge tones, sampled off the reference (#21BB50 / #E63738). The red is lifted one
  // step from the sampled value: on this card fill the reference red lands at 4.3:1 and
  // fails WCAG AA, which `hyperframes check` rejects.
  toneUp: "#22C55E",
  toneDown: "#F25555",
  toneFlat: "#8E93AE",

  // --- timing (seconds) ---------------------------------------------------
  // Reference: card 1 lands at t~0.1 and each following card follows 0.21s later;
  // every card's number counts LINEARLY over 1.53s from the moment its card lands
  // (measured $19.5K/$36.3K/$53.0K/$69.8K/$86.5K at 0.2s steps — a constant
  // 83.8 units per second, then a clamp). The last card settles at 2.58s and the
  // frame holds unchanged to the end of the recording.
  headerIn: 0.5,
  firstCard: 0.3,
  stagger: 0.21,
  entry: 0.34,
  entryRiseRatio: 0.068, // cards rise 22px of a 348-wide card as they fade in
  count: 1.53,
  hold: 1.4,
  outro: 0, // the reference never fades out
};

// The reference palette, in the order the six cards appeared. Tailwind 500-ish;
// cyan (#21D1EF) and amber (#F5900B) matched their sampled pixels exactly.
const PALETTE = [
  { name: "indigo", hex: "#6366F1" },
  { name: "cyan", hex: "#22D3EE" },
  { name: "amber", hex: "#F59E0B" },
  { name: "emerald", hex: "#10B981" },
  { name: "pink", hex: "#EC4899" },
  { name: "violet", hex: "#A855F7" },
];

// ---------------------------------------------------------------------------
// input
// ---------------------------------------------------------------------------
const dataPath = process.argv[2] || "data.json";
const data = JSON.parse(readFileSync(dataPath, "utf8"));
const opt = data.options || {};

const die = (msg) => {
  console.error("\n! " + msg + "\n");
  process.exit(1);
};

const metrics = data.metrics;
if (!Array.isArray(metrics) || metrics.length < 1)
  die('data.json needs at least one entry in "metrics".');
if (metrics.length > 12)
  die(`${metrics.length} metrics is past what this layout can hold. Twelve is the ceiling; six reads best.`);

metrics.forEach((m, i) => {
  if (!m.label) die(`metrics[${i}] has no "label".`);
  if (m.value === undefined || m.value === null) die(`"${m.label}" has no "value".`);
  if (typeof m.value !== "number" && typeof m.value !== "string")
    die(`"${m.label}": "value" must be a number (counts up) or a string (stands still).`);
  if (m.trend !== undefined && !["up", "down", "flat", "none"].includes(m.trend) && !Array.isArray(m.trend))
    die(`"${m.label}": "trend" must be "up", "down", "flat", "none", or an array of numbers.`);
  ["note", "meta"].forEach((f) => {
    if (m[f] !== undefined && typeof m[f] !== "string") die(`"${m.label}": "${f}" must be a string.`);
  });
});

// ---------------------------------------------------------------------------
// canvas + grid
// ---------------------------------------------------------------------------
const formatName = opt.format || "landscape";
const fmt = STYLE.formats[formatName];
if (!fmt) die(`Unknown format "${formatName}". Use landscape, portrait, or square.`);
const W = fmt.width;
const H = fmt.height;

const n = metrics.length;
const defaultCols = () => {
  if (formatName === "portrait") return n <= 2 ? 1 : 2;
  if (formatName === "square") return n <= 2 ? 1 : n <= 4 ? 2 : 3;
  return n <= 3 ? n : n === 4 ? 2 : n <= 6 ? 3 : 4;
};
const cols = Math.max(1, Math.min(n, opt.columns || defaultCols()));
const rows = Math.ceil(n / cols);

const round = (v) => Math.round(v * 100) / 100;
const padX = round(W * STYLE.padXRatio);
const gap = round(W * STYLE.gapRatio);
const gridW = W - 2 * padX;
const cardW = round((gridW - (cols - 1) * gap) / cols);

// The header block is measured, not guessed: title box, then the subtitle's margin
// and box, then the measured gap down to the first card.
const headerTop = round(W * STYLE.headerTopRatio);
const titleSize = round(W * STYLE.titleRatio);
const subSize = round(W * STYLE.subRatio);
const footSize = round(W * STYLE.footRatio);
const gridTop = round(
  headerTop + titleSize * 1.04 + (data.subtitle ? subSize * 2.15 : 0) + W * STYLE.headerToGridRatio
);
const gridBottom = H - round(H * STYLE.padBottomRatio) - (data.footnote ? round(W * STYLE.footRatio * 2.8) : 0);
const heightAvailable = (gridBottom - gridTop - (rows - 1) * gap) / rows;

// ---------------------------------------------------------------------------
// numbers
// ---------------------------------------------------------------------------
const locale = (opt.locale || "de").toLowerCase().startsWith("de") ? "de" : "en";
const decimalSep = opt.decimalSep ?? (locale === "de" ? "," : ".");
const groupSep = opt.groupSep ?? (locale === "de" ? "." : ",");

const formatNumber = (v, decimals) => {
  const neg = v < 0;
  const [intPart, frac] = Math.abs(v).toFixed(decimals).split(".");
  const int = groupSep ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupSep) : intPart;
  return (neg ? "-" : "") + int + (frac ? decimalSep + frac : "");
};

// The count-up never gets wider than its final value, so one shared font size fitted
// to the longest final string keeps every card's number optically identical.
const finalText = (m) => {
  const dec = m.decimals ?? (typeof m.value === "number" && !Number.isInteger(m.value) ? 1 : 0);
  const core = typeof m.value === "number" ? formatNumber(m.value, dec) : String(m.value);
  return (m.prefix || "") + core + (m.suffix || "");
};
// Width per character at font-size 1, for the reference's system UI font: digits and
// most punctuation sit on the tabular 0.58em advance, letters average wider.
const textWidth = (s) =>
  [...s].reduce((w, ch) => w + (/[\d.,]/.test(ch) ? 0.58 : ch === " " ? 0.28 : /[%€$£¥]/.test(ch) ? 0.6 : 0.62), 0);

// ---------------------------------------------------------------------------
// the card box — its contents ask for a height, the grid band caps it
// ---------------------------------------------------------------------------
const cardPad = round(cardW * STYLE.cardPadRatio);
const labelSize = round(cardW * STYLE.labelRatio);
const badgeSize = round(cardW * STYLE.badgeRatio);
const noteSize = round(cardW * STYLE.noteRatio);
const metaSize = round(cardW * STYLE.metaRatio);
const valueBox = cardW - 2 * cardPad;
const valueWanted = round(
  Math.min(cardW * STYLE.valueRatio, ...metrics.map((m) => valueBox / Math.max(0.1, textWidth(finalText(m)))))
);

// A note or meta line on any card reserves that line on every card, so all six
// numbers keep one baseline. Same for the sparkline.
const hasNote = metrics.some((m) => m.note);
const hasMeta = metrics.some((m) => m.meta);
const anySpark = metrics.some((m) => m.trend !== "none");
const sparkW = round(cardW * STYLE.sparkWRatio);
const sparkGap = round(cardW * STYLE.sparkGapRatio);
const sparkWanted = round(cardW * STYLE.sparkHRatio);

const stackHeight = (value, spark) =>
  cardPad * 2 +
  labelSize * 1.25 +
  value +
  (hasNote ? cardW * STYLE.valueToNoteRatio + noteSize * 1.3 : 0) +
  (hasMeta ? cardW * STYLE.noteToMetaRatio + metaSize * 1.3 : 0) +
  (anySpark ? sparkGap + spark : 0);

const cardH = round(
  Math.max(
    cardW * STYLE.cardAspectMin,
    Math.min(
      Math.max(
        cardW * (opt.cardAspect || STYLE.cardAspect[formatName] || STYLE.cardAspect.landscape),
        stackHeight(valueWanted, sparkWanted)
      ),
      heightAvailable,
      cardW * STYLE.cardAspectMax
    )
  )
);

// Over-tall content gives up the sparkline's height first — it is decoration — and
// only then the number's size, which is the thing the viewer came for.
let over = round(Math.max(0, stackHeight(valueWanted, sparkWanted) - cardH));
const sparkH = round(Math.max(sparkWanted * 0.55, sparkWanted - over));
over = round(Math.max(0, over - (sparkWanted - sparkH)));
const valueSize = round(Math.max(cardW * 0.075, valueWanted - over));
const sparkStroke = round(Math.max(1.5, cardW * STYLE.sparkStrokeRatio));
const rise = round(cardW * STYLE.entryRiseRatio);

// Whatever height the cards did not need is split above and below the grid, so a
// short grid sits centred in its band instead of hanging off the header.
const gridH = rows * cardH + (rows - 1) * gap;
const gridY = round(gridTop + Math.max(0, (gridBottom - gridTop - gridH) * 0.5));

// ---------------------------------------------------------------------------
// sparklines
// ---------------------------------------------------------------------------
// Deterministic wobble: the same data.json always produces the same shape, so a
// re-render is pixel-identical.
const lcg = (seed) => () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

const sparkSeries = (m, i) => {
  if (Array.isArray(m.trend) && m.trend.length >= 2) return m.trend.map(Number);
  const dir = m.trend === "down" ? -1 : m.trend === "flat" ? 0 : m.trend === "up" ? 1 : autoDir(m);
  const rnd = lcg(9176 + i * 7919);
  // "flat" must start and end at the same height, or a card badged 0 % draws a
  // rising line and contradicts its own number.
  const from = dir > 0 ? 0.22 : dir < 0 ? 0.82 : 0.5;
  const to = dir > 0 ? 0.86 : dir < 0 ? 0.3 : 0.5;
  const pts = [];
  for (let k = 0; k < STYLE.sparkPoints; k++) {
    const p = k / (STYLE.sparkPoints - 1);
    const wobble = k === 0 || k === STYLE.sparkPoints - 1 ? 0 : (rnd() - 0.45) * 0.11;
    pts.push(from + (to - from) * p + wobble);
  }
  return pts;
};

// A card with no explicit trend takes its direction from the sign of its delta badge.
const autoDir = (m) => (tone(m) === "down" ? -1 : 1);
const tone = (m) => {
  if (m.deltaTone) return m.deltaTone;
  const d = String(m.delta ?? "");
  if (/^\s*[-−▼]/.test(d)) return "down";
  if (/^\s*[+▲]/.test(d)) return "up";
  return d ? "flat" : "flat";
};

const sparkPath = (values) => {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const inset = sparkStroke;
  const xs = values.map((_, k) => round((k / (values.length - 1)) * sparkW));
  const ys = values.map((v) => round(inset + (1 - (v - lo) / span) * (sparkH - inset * 2)));
  const line = xs.map((x, k) => `${k === 0 ? "M" : "L"}${x} ${ys[k]}`).join(" ");
  const area = `${line} L${xs[xs.length - 1]} ${sparkH} L${xs[0]} ${sparkH} Z`;
  return { line, area };
};

// ---------------------------------------------------------------------------
// timing
// ---------------------------------------------------------------------------
const stagger = opt.stagger ?? STYLE.stagger;
const count = opt.count ?? STYLE.count;
const hold = opt.hold ?? STYLE.hold;
const firstCard = opt.firstCard ?? STYLE.firstCard;
const lastSettles = firstCard + (n - 1) * stagger + Math.max(count, STYLE.entry);
const duration = round(lastSettles + hold);

// ---------------------------------------------------------------------------
// html
// ---------------------------------------------------------------------------
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const arrow = { up: "▲", down: "▼", flat: "" };

const cardsHtml = metrics
  .map((m, i) => {
    const color = m.color
      ? m.color.startsWith("#")
        ? m.color
        : (PALETTE.find((p) => p.name === m.color) || PALETTE[i % PALETTE.length]).hex
      : PALETTE[i % PALETTE.length].hex;
    const t = tone(m);
    const { line, area } = sparkPath(sparkSeries(m, i));
    const row = Math.floor(i / cols);
    const col = i % cols;
    // An incomplete last row is centred rather than left-hung.
    const inRow = Math.min(cols, n - row * cols);
    const rowOffset = ((cols - inRow) * (cardW + gap)) / 2;
    const x = round(padX + rowOffset + col * (cardW + gap));
    const y = round(gridY + row * (cardH + gap));
    const badge = m.delta
      ? `<div class="badge" style="color:${t === "down" ? STYLE.toneDown : t === "up" ? STYLE.toneUp : STYLE.toneFlat}">${
          arrow[t] ? arrow[t] + " " : ""
        }${esc(m.delta)}</div>`
      : "";
    // Every card reserves the same lines even when its own text is empty, so the
    // numbers across the grid share one baseline.
    const noteHtml = hasNote ? `\n          <div class="note">${esc(m.note || "")}</div>` : "";
    const metaHtml = hasMeta ? `\n          <div class="meta">${esc(m.meta || "")}</div>` : "";
    const sparkHtml =
      m.trend === "none"
        ? anySpark
          ? `\n          <div class="spark-hole"></div>`
          : ""
        : `\n          <svg class="spark" width="${sparkW}" height="${sparkH}" viewBox="0 0 ${sparkW} ${sparkH}" fill="none">
            <defs>
              <linearGradient id="g-${i}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="${color}" stop-opacity="${STYLE.sparkFillAlpha}" />
                <stop offset="1" stop-color="${color}" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path d="${area}" fill="url(#g-${i})" />
            <path d="${line}" stroke="${color}" stroke-width="${sparkStroke}" stroke-linejoin="round" stroke-linecap="round" />
          </svg>`;
    return `        <div class="card" id="card-${i}" style="left:${x}px; top:${y}px">
          <div class="top">
            <div class="label">${esc(m.label)}</div>
            ${badge}
          </div>
          <div class="mid">
            <div class="value" id="val-${i}" data-layout-allow-overlap data-layout-allow-occlusion>${esc(
              typeof m.value === "number" ? "" : m.value
            )}</div>${noteHtml}${metaHtml}
          </div>${sparkHtml}
        </div>`;
  })
  .join("\n");

const runtime = metrics.map((m, i) => ({
  i,
  value: typeof m.value === "number" ? m.value : null,
  decimals: m.decimals ?? (typeof m.value === "number" && !Number.isInteger(m.value) ? 1 : 0),
  prefix: m.prefix || "",
  suffix: m.suffix || "",
  start: round(firstCard + i * stagger),
}));

const html = `<!doctype html>
<html lang="${esc(opt.lang || (locale === "de" ? "de" : "en"))}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>${esc(data.title || "Kennzahlen")}</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      body { margin: 0; background: ${STYLE.bgBase}; }

      #root {
        position: relative;
        width: ${W}px;
        height: ${H}px;
        overflow: hidden;
        font-family: ${STYLE.font};
        background:
          radial-gradient(
            125% 98% at 50% 1%,
            ${STYLE.bgGlow} 0%,
            ${STYLE.bgGlowMid} 34%,
            rgba(8, 13, 24, 0) 78%
          ),
          ${STYLE.bgBase};
      }

      #header { position: absolute; left: ${padX}px; top: ${headerTop}px; }
      #title {
        margin: 0;
        font-size: ${titleSize}px;
        font-weight: ${STYLE.titleWeight};
        letter-spacing: ${STYLE.titleTracking};
        color: ${STYLE.titleColor};
        line-height: 1.04;
      }
      #subtitle {
        margin: ${round(subSize * 0.75)}px 0 0;
        font-size: ${subSize}px;
        font-weight: 400;
        color: ${STYLE.subColor};
        letter-spacing: 0.004em;
      }

      .card {
        position: absolute;
        width: ${cardW}px;
        height: ${cardH}px;
        box-sizing: border-box;
        padding: ${cardPad}px;
        border-radius: ${round(cardW * STYLE.cardRadiusRatio)}px;
        border: 1px solid ${STYLE.cardBorder};
        background: linear-gradient(180deg, ${STYLE.cardFillTop} 0%, ${STYLE.cardFillBottom} 100%);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        opacity: 0;
        will-change: transform, opacity;
      }

      .top { display: flex; align-items: baseline; justify-content: space-between; gap: ${round(cardPad * 0.5)}px; }
      .label {
        font-size: ${labelSize}px;
        font-weight: ${STYLE.labelWeight};
        color: ${STYLE.labelColor};
        letter-spacing: 0.004em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .badge {
        font-size: ${badgeSize}px;
        font-weight: ${STYLE.badgeWeight};
        white-space: nowrap;
        flex: 0 0 auto;
      }

      /* The number block sits a touch above the card's centre, as in the reference. */
      .mid { margin-bottom: ${round(cardH * 0.02)}px; }
      .value {
        font-size: ${valueSize}px;
        font-weight: ${STYLE.valueWeight};
        letter-spacing: ${STYLE.valueTracking};
        color: ${STYLE.valueColor};
        line-height: 1;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      .note {
        margin: ${round(cardW * STYLE.valueToNoteRatio * 0.55)}px 0 0;
        font-size: ${noteSize}px;
        font-weight: 400;
        color: ${STYLE.noteColor};
        letter-spacing: 0.004em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .meta {
        margin: ${round(cardW * STYLE.noteToMetaRatio + noteSize * 0.18)}px 0 0;
        font-size: ${metaSize}px;
        font-weight: 400;
        color: ${STYLE.metaColor};
        letter-spacing: 0.008em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .spark { display: block; }
      /* A card that opted out of its sparkline still holds the space open. */
      .spark-hole { height: ${sparkH}px; }

      #footnote {
        position: absolute;
        left: ${padX}px;
        bottom: ${round(H * 0.042)}px;
        max-width: ${round(W - 2 * padX)}px;
        font-size: ${footSize}px;
        font-weight: 400;
        color: ${STYLE.footColor};
        letter-spacing: 0.006em;
        opacity: 0;
      }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="main"
      data-start="0"
      data-width="${W}"
      data-height="${H}"
      data-duration="${duration}"
    >
      <div id="header">
        <h1 id="title">${esc(data.title || "")}</h1>
        ${data.subtitle ? `<p id="subtitle">${esc(data.subtitle)}</p>` : ""}
      </div>

${cardsHtml}
${data.footnote ? `      <div id="footnote">${esc(data.footnote)}</div>\n` : ""}    </div>

    <script>
      // Every frame is drawn from the timeline's time alone — no accumulated state, so
      // seeking backwards or rendering frames out of order gives identical pixels.
      const CARDS = ${JSON.stringify(runtime)};
      const CFG = {
        headerIn: ${STYLE.headerIn},
        entry: ${STYLE.entry},
        rise: ${rise},
        count: ${round(count)},
        decSep: ${JSON.stringify(decimalSep)},
        grpSep: ${JSON.stringify(groupSep)}
      };

      const els = CARDS.map((c) => ({
        card: document.getElementById("card-" + c.i),
        val: document.getElementById("val-" + c.i)
      }));
      const headerEl = document.getElementById("header");
      const footEl = document.getElementById("footnote");

      function fmt(v, decimals, prefix, suffix) {
        const neg = v < 0;
        const parts = Math.abs(v).toFixed(decimals).split(".");
        let int = parts[0];
        if (CFG.grpSep) int = int.replace(/\\B(?=(\\d{3})+(?!\\d))/g, CFG.grpSep);
        return prefix + (neg ? "-" : "") + int + (parts[1] ? CFG.decSep + parts[1] : "") + suffix;
      }

      const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
      // Cards fade on a quadratic ease-out and rise on a cubic one — the fade reads a
      // beat softer than the movement, which is what the reference does.
      const fadeEase = (p) => 1 - (1 - p) * (1 - p);
      const riseEase = (p) => 1 - Math.pow(1 - p, 3);

      function draw(t) {
        const h = clamp01(t / CFG.headerIn);
        headerEl.style.opacity = fadeEase(h).toFixed(3);
        headerEl.style.transform = "translateY(" + (CFG.rise * (1 - riseEase(h))).toFixed(2) + "px)";

        for (let k = 0; k < CARDS.length; k++) {
          const c = CARDS[k];
          const p = clamp01((t - c.start) / CFG.entry);
          els[k].card.style.opacity = fadeEase(p).toFixed(3);
          els[k].card.style.transform = "translateY(" + (CFG.rise * (1 - riseEase(p))).toFixed(2) + "px)";

          // Linear count-up, as measured: a constant rate, then a clamp on the target.
          if (c.value !== null) {
            const q = clamp01((t - c.start) / CFG.count);
            els[k].val.textContent = fmt(c.value * q, c.decimals, c.prefix, c.suffix);
          }
        }

        if (footEl) {
          const f = clamp01((t - ${round(firstCard + (n - 1) * stagger)}) / 0.6);
          footEl.style.opacity = fadeEase(f).toFixed(3);
        }
      }

      const state = { t: 0 };
      const tl = gsap.timeline({ paused: true });
      tl.to(state, {
        t: ${duration},
        duration: ${duration},
        ease: "none",
        onUpdate: () => draw(state.t)
      }, 0);

      draw(0);
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;

writeFileSync("index.html", html);

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
console.log(
  `index.html written — ${n} metrics in a ${cols}x${rows} grid, ${W}x${H}, ` +
    `cards ${cardW}x${cardH}, duration ${duration}s (${mmss(duration)})`
);
if (valueSize < cardW * STYLE.valueRatio * 0.72)
  console.log(
    `! The numbers were shrunk to ${valueSize}px to fit the longest one ` +
      `("${metrics.map(finalText).sort((a, b) => textWidth(b) - textWidth(a))[0]}"). ` +
      `Shorter units (e.g. "Mio." instead of "Millionen") or more columns would read better.`
  );
if (valueSize < valueWanted)
  console.log(
    `! The numbers came down to ${valueSize}px (from ${valueWanted}px) because the note and ` +
      `meta lines took the height. Shorter lines, fewer columns, or a taller options.cardAspect ` +
      `would give the number its size back.`
  );
metrics.forEach((m) => {
  const inner = cardW - 2 * cardPad;
  if (textWidth(m.label) * labelSize > inner - (m.delta ? textWidth(m.delta) * badgeSize + cardPad : 0))
    console.log(`! Label "${m.label}" is too long for its card and will be clipped with an ellipsis.`);
  if (m.note && textWidth(m.note) * noteSize > inner)
    console.log(`! Note "${m.note}" is too long for its card and will be clipped with an ellipsis.`);
  if (m.meta && textWidth(m.meta) * metaSize > inner)
    console.log(`! Meta "${m.meta}" is too long for its card and will be clipped with an ellipsis.`);
});
if (data.footnote && textWidth(data.footnote) * footSize > (W - 2 * padX) * 1.9)
  console.log(
    `! The footnote runs past two lines at ${W}px wide. Trim it to the sources themselves — ` +
      `it is set small on purpose and nobody reads a paragraph down there.`
  );
if (duration > 30)
  console.log(`! ${mmss(duration)} is long for this format — consider fewer metrics or a shorter options.hold.`);
