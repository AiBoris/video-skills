// Generates index.html (a HyperFrames composition) from data.json.
//
// The look is reverse-engineered from a reference bar-chart-race clip. Every number in
// STYLE below was measured off that recording (1242x718) and scaled to a 1920x1080 frame;
// the comment on each line says what it was measured from. Do not "tidy" these values.
//
// Usage:  node build.mjs [data.json]

import { readFileSync, writeFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// STYLE — the measured reference. Treat as locked unless the user asks.
// ---------------------------------------------------------------------------
const STYLE = {
  // --- canvas -------------------------------------------------------------
  formats: {
    landscape: { width: 1920, height: 1080 },
    portrait: { width: 1080, height: 1920 },
    square: { width: 1080, height: 1080 },
  },

  // --- background ---------------------------------------------------------
  // Sampled across the reference frame: #11112A top-left, #090F1B centre-right,
  // #111C3A far right, #0F1421 bottom. Rebuilt as a base plus two soft glows.
  bgBase: "#0B0F1A",
  bgGlowA: "rgba(38, 36, 96, 0.55)", // indigo, upper left
  bgGlowB: "rgba(20, 44, 96, 0.40)", // blue, right edge

  // --- typography ---------------------------------------------------------
  // The reference was recorded on macOS with the system UI font. Keeping system-ui
  // first reproduces it exactly there and stays offline everywhere else.
  font: 'system-ui, -apple-system, "Segoe UI", Inter, "Helvetica Neue", Arial, sans-serif',
  // Header type is sized against the bar height, not the frame, because that is what the
  // eye compares it to. The two ratios are the reference's: 58/84 and 25/84.
  titleRatio: 0.69,
  titleMinRatio: 0.45, // a long title may shrink this far before it is a problem
  titleWeight: 500, // stem 4px at 37px size -> ratio .108
  titleColor: "#FFFFFF",
  titleTracking: "-0.012em",
  subRatio: 0.3,
  subColor: "#9EA1C5", // sampled peak
  labelRatio: 0.4, // label font size as a fraction of bar height (34/84)
  labelWeight: 500,
  labelColor: "#C9CDDE",
  valueWeight: 600,
  valueColor: "#FFFFFF",

  // --- chart geometry (fractions of frame width, from the reference) -------
  trackFrac: 0.631, // leader bar width 784/1242
  barLeftFrac: 0.1997, // bar left edge 248/1242
  leftPadFrac: 0.045, // outer margin left of the label column
  labelGapFrac: 0.0145, // label right edge to bar left, 18/1242
  valueGapFrac: 0.0121, // bar right edge to value left, 15/1242
  headerTopFrac: 0.11, // title cap-top, 79/718
  headerToChartRatio: 0.62, // subtitle baseline to first bar top, as a fraction of bar height
  bottomPadFrac: 0.055,

  // --- bar geometry (fractions of bar height) -----------------------------
  rowPitch: 129, // 86px @1242 -> scaled, at a 1080-high frame
  barHeight: 84, // 56px @1242 -> scaled
  radiusRatio: 0.143, // corner radius 12/84
  capInsetRatio: 0.167, // light pill inset from bar left, 14/84
  capWidthRatio: 0.143, // pill width 12/84
  capHeightRatio: 0.63, // pill height 53/84
  capAlpha: 0.52, // pill is white over the bar at ~52% (solved from #C0761B -> #E0BD93)
  // Coloured shadow under each bar. Fitted to the reference falloff below the bar edge:
  // red channel +40 at 2px, +24 at 10px, +15 at 16px, gone by 24px.
  glowAlpha: 0.3,
  glowOffsetRatio: 0.09, // of bar height
  glowBlurRatio: 0.3,

  // A bar shorter than this still shows its cap pill and rounded ends.
  minBarRatio: 0.42, // as a fraction of bar height

  // --- timing (seconds) ---------------------------------------------------
  // Reference: leader hits full track width at t~0.86 growing near-linearly,
  // races until ~5.8s, holds, then fades to black by 6.49s.
  intro: 0.85,
  introExponent: 0.9, // g = p^0.9 — fitted to widths at t = .2/.4/.6/.8
  secondsPerPeriod: 0.9,
  hold: 0.65,
  outro: 0.5,
  // Longer lists need a beat more per step to stay readable.
  rowsForBaseSpeed: 6,
  perExtraRow: 0.03, // +3% per visible row above six, capped below
  maxRowSpeedFactor: 1.4,

  // Rank-swap shape. Measured off the reference by tracking one bar's y frame by frame:
  // a swap spans about 0.78s of a 0.9s period, and its peak speed is ~2.9x its average
  // (166px moved, 79px of it inside one 0.13s sample). Smoothstep peaks at only 1.5x and
  // reads as drifting; a cubic in-out peaks at 3x and matches. Rests are not scripted —
  // a row simply does not move in a period where its rank does not change.
  swapFrom: 0.06,
  swapTo: 0.94,
};

// The reference palette, in the order the six series appeared.
// A series keeps its colour as it changes rank; the cycle repeats past six.
const PALETTE = [
  { name: "orange", end: "#F0910B" },
  { name: "violet", end: "#9B48F0" },
  { name: "pink", end: "#E73E8C" },
  { name: "indigo", end: "#5D5EF2" },
  { name: "cyan", end: "#1ECAE9" },
  { name: "green", end: "#0BAE73" },
];
// Each bar is a left-to-right gradient; the dark end measured ~82% of the bright end.
const GRADIENT_DARK = 0.82;

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

if (!Array.isArray(data.series) || data.series.length < 2)
  die("data.json needs at least two entries in \"series\".");

const periodCount = data.series[0].values.length;
if (!periodCount || periodCount < 2)
  die('Each series needs at least two values — the race is the movement between them.');

data.series.forEach((s, i) => {
  if (!s.name) die(`series[${i}] has no "name".`);
  if (!Array.isArray(s.values) || s.values.length !== periodCount)
    die(
      `"${s.name}" has ${s.values?.length ?? 0} values but "${data.series[0].name}" has ` +
        `${periodCount}. Every series needs a value for every period — use 0 or null for gaps.`
    );
  if (s.values.some((v) => v !== null && !Number.isFinite(Number(v))))
    die(`"${s.name}" has a value that is not a number.`);
});

if (data.periods && data.periods.length !== periodCount)
  die(`"periods" has ${data.periods.length} labels but the series have ${periodCount} values.`);

const format = STYLE.formats[opt.format || "landscape"];
if (!format) die(`Unknown format "${opt.format}". Use landscape, portrait or square.`);
const W = format.width;
const H = format.height;

const seriesCount = data.series.length;
const visibleRows = Math.min(opt.visibleRows || Math.min(seriesCount, 6), seriesCount);
const decimals = Number.isInteger(opt.decimals) ? opt.decimals : 0;

// null means "not in the race yet" — carried as 0 so ranks stay defined.
const values = data.series.map((s) => s.values.map((v) => (v === null ? 0 : Number(v))));

// ---------------------------------------------------------------------------
// duration — this is what makes more data a longer video
// ---------------------------------------------------------------------------
const rowSpeedFactor = Math.min(
  STYLE.maxRowSpeedFactor,
  1 + Math.max(0, visibleRows - STYLE.rowsForBaseSpeed) * STYLE.perExtraRow
);
const perPeriod = (opt.secondsPerPeriod || STYLE.secondsPerPeriod) * rowSpeedFactor;
const intro = STYLE.intro;
const race = (periodCount - 1) * perPeriod;
const hold = opt.hold ?? STYLE.hold;
const outro = STYLE.outro;
const duration = Math.round((intro + race + hold + outro) * 1000) / 1000;

// ---------------------------------------------------------------------------
// layout
// ---------------------------------------------------------------------------
const scale = H / 1080;
const headerTop = Math.round(H * STYLE.headerTopFrac);
const bottomPad = H * STYLE.bottomPadFrac;

// Header size and chart size depend on each other: the type is sized off the bar height,
// and the bars get whatever height the header leaves. Three passes settle it — the values
// move by well under a pixel after that.
const subGap = 14; // title block to subtitle, at the reference title size
let chartTop = H * 0.34;
let rowPitch, barH, titleSize, subSize;
for (let pass = 0; pass < 3; pass++) {
  const avail = H - chartTop - bottomPad;
  // Rows keep the reference rhythm until there are too many to fit, then shrink to fit.
  rowPitch = Math.min(STYLE.rowPitch * scale, avail / visibleRows);
  barH = rowPitch * (STYLE.barHeight / STYLE.rowPitch);
  titleSize = barH * STYLE.titleRatio;
  subSize = barH * STYLE.subRatio;
  let headerH = titleSize * 1.05;
  if (data.subtitle) headerH += subGap * (subSize / 25) + subSize * 1.3;
  chartTop = headerTop + headerH + barH * STYLE.headerToChartRatio;
}
chartTop = Math.round(chartTop);
const chartHeight = H - chartTop - bottomPad;
const labelFont = Math.max(13, barH * STYLE.labelRatio);
const valueFont = labelFont;

// A title too wide for the frame is shrunk rather than clipped.
const titleRoom = W * (1 - 2 * STYLE.leftPadFrac);
const titleWide = (data.title || "").length * 0.52 * titleSize;
if (titleWide > titleRoom) {
  const fitted = Math.max(barH * STYLE.titleMinRatio, (titleSize * titleRoom) / titleWide);
  if (fitted < barH * STYLE.titleMinRatio * 1.001)
    console.log(
      `! Title "${data.title}" is long for a ${W}px frame — it has been set at ` +
        `${Math.round(fitted)}px and may still crowd the edge. A shorter title reads better.`
    );
  titleSize = fitted;
}

// Columns: sized to the widest label and the widest number, then the whole block is
// centred — which is how the reference sits (167px left, 170px right).
const longestLabel = Math.max(...data.series.map((s) => s.name.length));
const fmt = (v) => v.toFixed(decimals);
const widestValue = Math.max(
  ...values.flat().map((v) => (fmt(v) + (data.valueSuffix || "")).length)
);
const valueColW = widestValue * 0.62 * valueFont + 8;
const labelGap = Math.round(W * STYLE.labelGapFrac);
const valueGap = Math.round(W * STYLE.valueGapFrac);

// The bar's left edge is pinned where the reference put it, which fixes the label column
// too. Only a label too wide for that column pushes the bars right and costs track width.
const leftPad = W * STYLE.leftPadFrac;
let barLeft = W * STYLE.barLeftFrac;
let labelColW = barLeft - labelGap - leftPad;
const labelNeeds = longestLabel * 0.52 * labelFont + 6;
if (labelNeeds > labelColW) {
  labelColW = labelNeeds;
  barLeft = leftPad + labelColW + labelGap;
}

// Prefer the reference track width; give it up only when the labels took the room.
const maxTrack = W - barLeft - valueGap - valueColW - W * 0.03;
const trackW = Math.min(W * STYLE.trackFrac, maxTrack);
if (trackW < W * 0.3)
  die(
    `Labels are too long — the bars would only get ${Math.round(trackW)}px of a ${W}px frame. ` +
      `Shorten the longest name ("${data.series.find((s) => s.name.length === longestLabel).name}").`
  );

const blockW = labelColW + labelGap + trackW + valueGap + valueColW;
const blockLeft = Math.round(barLeft - labelColW - labelGap);

const round = (n) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// colours
// ---------------------------------------------------------------------------
const hexToRgb = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const darken = (h, f) =>
  "#" +
  hexToRgb(h)
    .map((c) => Math.round(c * f).toString(16).padStart(2, "0"))
    .join("");

const colorOf = (s, i) => {
  if (s.color && s.color.startsWith("#")) return s.color;
  if (s.color) {
    const named = PALETTE.find((p) => p.name === s.color);
    if (!named) die(`Unknown colour "${s.color}" for "${s.name}". Use a hex value or one of: ${PALETTE.map((p) => p.name).join(", ")}.`);
    return named.end;
  }
  return PALETTE[i % PALETTE.length].end;
};

const rows = data.series.map((s, i) => {
  const end = colorOf(s, i);
  const [r, g, b] = hexToRgb(end);
  return {
    name: s.name,
    end,
    start: darken(end, GRADIENT_DARK),
    glow: `rgba(${r}, ${g}, ${b}, ${STYLE.glowAlpha})`,
  };
});

// ---------------------------------------------------------------------------
// markup
// ---------------------------------------------------------------------------
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const rowsHtml = rows
  .map(
    // data-layout-allow-overlap: two rows cross while they swap rank. That is the whole
    // point of the format and the reference does it too, so the layout audit is told it
    // is deliberate rather than being worked around.
    // data-layout-allow-overflow: rows past the visible window slide out of the clipped
    // chart box on their way off-screen. They are already faded to nothing by then.
    (r, i) => `        <div class="row" id="row-${i}" data-layout-allow-overflow>
          <div class="label" data-layout-allow-overlap data-layout-allow-occlusion>${esc(r.name)}</div>
          <div class="bar" style="background: linear-gradient(90deg, ${r.start} 0%, ${r.end} 100%);
               box-shadow: 0 ${round(barH * STYLE.glowOffsetRatio)}px ${round(barH * STYLE.glowBlurRatio)}px ${r.glow};">
            <span class="cap"></span>
          </div>
          <div class="value" data-layout-allow-overlap data-layout-allow-occlusion>0${esc(data.valueSuffix || "")}</div>
        </div>`
  )
  .join("\n");

const periodHtml = opt.showPeriodLabel && data.periods
  ? `      <div id="period"></div>\n`
  : "";

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>${esc(data.title || "Bar chart race")}</title>
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
          radial-gradient(120% 90% at 18% 0%, ${STYLE.bgGlowA} 0%, rgba(11, 15, 26, 0) 62%),
          radial-gradient(90% 120% at 100% 45%, ${STYLE.bgGlowB} 0%, rgba(11, 15, 26, 0) 58%),
          ${STYLE.bgBase};
      }

      #header { position: absolute; left: ${blockLeft}px; top: ${headerTop}px; }
      #title {
        margin: 0;
        font-size: ${round(titleSize)}px;
        font-weight: ${STYLE.titleWeight};
        letter-spacing: ${STYLE.titleTracking};
        color: ${STYLE.titleColor};
        line-height: 1.05;
      }
      #subtitle {
        margin: ${round(subGap * (subSize / 25))}px 0 0;
        font-size: ${round(subSize)}px;
        font-weight: 400;
        color: ${STYLE.subColor};
        letter-spacing: 0.005em;
      }

      #chart {
        position: absolute;
        left: 0;
        top: ${chartTop}px;
        width: ${W}px;
        height: ${round(chartHeight)}px;
        overflow: hidden;
      }

      /* Rows are absolutely stacked and moved with translateY, so a rank change is a
         slide rather than a reflow. */
      .row {
        position: absolute;
        left: ${blockLeft}px;
        top: 0;
        width: ${round(blockW)}px;
        height: ${round(barH)}px;
        display: flex;
        align-items: center;
        will-change: transform, opacity;
      }

      .label {
        width: ${round(labelColW)}px;
        margin-right: ${labelGap}px;
        text-align: right;
        font-size: ${round(labelFont)}px;
        font-weight: ${STYLE.labelWeight};
        color: ${STYLE.labelColor};
        white-space: nowrap;
        overflow: hidden;
      }

      .bar {
        position: relative;
        height: ${round(barH)}px;
        width: 0px;
        border-radius: ${round(barH * STYLE.radiusRatio)}px;
        flex: 0 0 auto;
      }

      /* The light pill sitting just inside the left end of every bar. */
      .cap {
        position: absolute;
        left: ${round(barH * STYLE.capInsetRatio)}px;
        top: 50%;
        width: ${round(barH * STYLE.capWidthRatio)}px;
        height: ${round(barH * STYLE.capHeightRatio)}px;
        margin-top: ${round((-barH * STYLE.capHeightRatio) / 2)}px;
        border-radius: 999px;
        background: rgba(255, 255, 255, ${STYLE.capAlpha});
      }

      .value {
        margin-left: ${valueGap}px;
        font-size: ${round(valueFont)}px;
        font-weight: ${STYLE.valueWeight};
        color: ${STYLE.valueColor};
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }

      #period {
        position: absolute;
        right: ${blockLeft}px;
        bottom: ${round(H * 0.045)}px;
        font-size: ${round(labelFont * 1.35)}px;
        font-weight: 600;
        color: ${STYLE.subColor};
        letter-spacing: 0.02em;
      }

      #fade {
        position: absolute;
        inset: 0;
        background: #000;
        opacity: 0;
        pointer-events: none;
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

      <div id="chart">
${rowsHtml}
      </div>
${periodHtml}      <div id="fade"></div>
    </div>

    <script>
      // Every frame is drawn from the timeline's time alone — no accumulated state, so
      // seeking backwards or rendering frames out of order gives identical pixels.
      const VALUES = ${JSON.stringify(values)};
      const PERIODS = ${JSON.stringify(data.periods || null)};
      const SUFFIX = ${JSON.stringify(data.valueSuffix || "")};
      const CFG = {
        intro: ${intro},
        introExp: ${STYLE.introExponent},
        perPeriod: ${round(perPeriod)},
        race: ${round(race)},
        periods: ${periodCount},
        rowPitch: ${round(rowPitch)},
        track: ${round(trackW)},
        minBar: ${round(barH * STYLE.minBarRatio)},
        visible: ${visibleRows},
        decimals: ${decimals}
      };

      const rowEls = VALUES.map((_, i) => {
        const el = document.getElementById("row-" + i);
        return { el: el, bar: el.querySelector(".bar"), val: el.querySelector(".value") };
      });
      const periodEl = document.getElementById("period");

      // Ranks are precomputed per data period, then interpolated — that is what turns a
      // rank change into a slide instead of a jump, without remembering the last frame.
      const RANKS = [];
      for (let k = 0; k < CFG.periods; k++) {
        const order = VALUES.map((v, i) => i).sort(
          (a, b) => VALUES[b][k] - VALUES[a][k] || a - b
        );
        const r = new Array(VALUES.length);
        order.forEach((seriesIndex, rank) => { r[seriesIndex] = rank; });
        RANKS.push(r);
      }

      const SWAP_FROM = ${STYLE.swapFrom}, SWAP_SPAN = ${round(STYLE.swapTo - STYLE.swapFrom)};
      // Cubic in-out: eases out of the old slot, crosses fast, settles into the new one.
      const cubicInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - 4 * (1 - x) * (1 - x) * (1 - x));
      const rankEase = (f) => cubicInOut(Math.max(0, Math.min(1, (f - SWAP_FROM) / SWAP_SPAN)));

      function draw(t) {
        let k, f, grow;
        if (t < CFG.intro) {
          // Bars grow out of nothing against the first period's ranking.
          k = 0; f = 0;
          grow = Math.pow(Math.min(1, t / CFG.intro), CFG.introExp);
        } else {
          grow = 1;
          const p = Math.min(CFG.periods - 1, (t - CFG.intro) / CFG.perPeriod);
          k = Math.min(CFG.periods - 2, Math.floor(p));
          f = Math.min(1, p - k);
        }
        const next = Math.min(CFG.periods - 1, k + 1);
        const fr = rankEase(f);

        // The scale is normalised against the ungrown values, so during the intro the
        // whole chart grows out of nothing. Normalising against the grown values would
        // cancel the growth factor out and snap every bar to full width on frame one.
        let max = 0;
        const raw = VALUES.map((v) => {
          const value = v[k] + (v[next] - v[k]) * f;
          if (value > max) max = value;
          return value;
        });
        const current = raw.map((v) => v * grow);

        for (let i = 0; i < rowEls.length; i++) {
          const rank = RANKS[k][i] + (RANKS[next][i] - RANKS[k][i]) * fr;
          const r = rowEls[i];
          r.el.style.transform = "translateY(" + (rank * CFG.rowPitch).toFixed(2) + "px)";
          // A bar dropping out of the last visible slot fades as it slides away.
          const vis = Math.max(0, Math.min(1, CFG.visible - rank));
          r.el.style.opacity = vis.toFixed(3);

          const w = max > 0 ? (raw[i] / max) * CFG.track * grow : 0;
          r.bar.style.width = (w > 0 ? Math.max(CFG.minBar, w) : 0).toFixed(2) + "px";
          r.val.textContent = current[i].toFixed(CFG.decimals) + SUFFIX;
        }

        if (periodEl && PERIODS) periodEl.textContent = PERIODS[f < 0.5 ? k : next];
      }

      const state = { t: 0 };
      const tl = gsap.timeline({ paused: true });
      tl.to(state, {
        t: ${round(intro + race + hold)},
        duration: ${round(intro + race + hold)},
        ease: "none",
        onUpdate: () => draw(state.t)
      }, 0);
      tl.to("#fade", { opacity: 1, duration: ${outro}, ease: "power2.in" }, ${round(intro + race + hold)});

      draw(0);
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;

writeFileSync("index.html", html);

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
console.log(
  `index.html written — ${seriesCount} series x ${periodCount} periods, ` +
    `${visibleRows} rows visible, ${W}x${H}, duration ${duration}s (${mmss(duration)})`
);
if (seriesCount > visibleRows)
  console.log(
    `  ${seriesCount - visibleRows} series start off-screen and race in as they climb the ranking.`
  );
if (duration > 90)
  console.log(
    `! ${mmss(duration)} is long for this format. Consider fewer periods, or set ` +
      `options.secondsPerPeriod below ${round(perPeriod)}.`
  );
