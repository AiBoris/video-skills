// Generates index.html from content.json.
//
// Style is reverse-engineered from a reference kinetic-typography clip: a warm
// flat background, near-black Poppins Medium set two lines at a time, and one
// skewed dark slab that slides from word to word and inverts the word under it.
// Everything measured off that clip lives in STYLE below, in em, so the whole
// design scales with a single font size.
//
// The text is split into phrases and lines here, not by the browser: line
// breaking has to be decided before the slab positions can be computed.
import { readFileSync, writeFileSync } from "node:fs";

// ---------------------------------------------------------------- measured --
const STYLE = {
  // Type. All of the following are em, relative to the font size.
  // Poppins Medium, kerning and ligatures off so the bundled width table is exact.
  font: '"Poppins", "Helvetica Neue", Arial, sans-serif',
  // Font size as a share of frame width. 0.0890 puts a cap height of 0.704em
  // on the reference's 99px-per-1592px-wide frame.
  fontSizeRatio: { landscape: 0.089, portrait: 0.125 },
  maxLineRatio: 0.8, // widest a line of type may get, as a share of frame width

  baselineFromTop: 0.85, // where the baseline sits in a line-height:1 block
  linePitch: 1.491, // baseline to baseline
  slabHeight: 1.442,
  slabTopFromBaseline: -1.057, // slab top, measured up from the baseline
  slabPadX: 0.096, // slab overhang left and right of the word's advance box
  slabRadius: 0.085,
  slabSkewDeg: 10, // the slab leans; the type inside it does not

  // Motion (seconds). Inside a phrase the slab slides; across a line break and
  // between phrases it cuts, exactly as the reference does.
  slide: 0.12,
  slideEase: "power2.out",
  leadIn: 0.35,
  phraseGap: 0.1,
  endHold: 0.9,

  // Word dwell = base + perChar x characters, clamped. Fitted against the
  // reference's voice-over pace (~0.45 s per word including gaps).
  dwellBase: 0.18,
  dwellPerChar: 0.05,
  dwellMin: 0.26,
  dwellMax: 0.85,
  lastWordFactor: 1.35, // the closing word of a phrase is held a beat longer
};

// Phrasing. The reference never puts more than four words on a line and never
// more than two lines on screen. German words are long, so the line filler is
// driven by width first and word count second — a one-word line is on-style
// (the reference sets "ahead." alone) and is preferred over shrinking the type.
const PHRASE = { maxWordsPerLine: 4, linesPerPhrase: 2 };

const METRICS = JSON.parse(
  readFileSync(new URL("./assets/metrics/poppins-500.json", import.meta.url), "utf8")
);

// ------------------------------------------------------------------ colour --
// The palette is derived from one background colour so a brand colour can be
// dropped in whole: the type flips between near-black and near-white on
// contrast, and the background gets the reference's soft centre lift.
const hexToRgb = (h) => {
  const s = h.trim().replace(/^#/, "");
  const f = s.length === 3 ? s.replace(/./g, (c) => c + c) : s;
  if (!/^[0-9a-f]{6}$/i.test(f)) throw new Error(`Not a hex colour: ${h}`);
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
};
const rgbToHex = (r, g, b) =>
  "#" + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("").toUpperCase();

const rgbToHsl = ([r, g, b]) => {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const l = (mx + mn) / 2;
  if (!d) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
};
const hslToRgb = ([h, s, l]) => {
  if (!s) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const k = (t) => {
    t = (t + 1) % 1;
    return (t < 1 / 6 ? p + (q - p) * 6 * t
      : t < 1 / 2 ? q
      : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6
      : p) * 255;
  };
  return [k(h + 1 / 3), k(h), k(h - 1 / 3)];
};
const shiftL = (hex, dl) => {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  return rgbToHex(...hslToRgb([h, s, Math.min(1, Math.max(0, l + dl))]));
};
const relLum = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

function palette(brand) {
  const bg = brand.bg || "#FAC143";
  const light = relLum(bg) > 0.35; // a light ground wants dark type, and the reverse
  const ink = brand.ink || (light ? "#1B1B1B" : "#FAFAF8");
  return {
    bg,
    bgCentre: brand.bgCentre || shiftL(bg, 0.04), // the reference lifts the middle ~4 points
    bgEdge: brand.bgEdge || shiftL(bg, -0.02),
    ink,
    slab: brand.slab || ink,
    slabInk: brand.slabInk || (light ? "#FAFAF8" : shiftL(bg, -0.1)),
  };
}

// ------------------------------------------------------------------ widths --
const charW = (c) => METRICS.widths[c] ?? METRICS.fallback;
const emWidth = (s) => [...s].reduce((a, c) => a + charW(c), 0);

// ------------------------------------------------------------------- split --
// A word is a run of non-space characters. A token that is only a symbol
// ("%", "€") belongs to the number in front of it — German writes "100 %".
function tokenise(s) {
  const raw = s.trim().split(/\s+/).filter(Boolean);
  const out = [];
  for (const w of raw) {
    if (out.length && /^[%€$£‰°+\-–—]$/.test(w)) out[out.length - 1] += " " + w;
    else out.push(w);
  }
  return out;
}

// Sentence ends, dashes, colons and commas are where a viewer expects a cut, so
// they end a segment; each segment is then flowed into lines on its own and
// never shares a phrase with the clause on the other side of the punctuation.
function segments(text) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?…,])\s+|\s+[–—]\s+|\s*[;:]\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Words that must not end a line: the eye reads them as pointing at the next
// word, and a break after one reads as a stumble. Anything not in the list is
// free to end a line.
const STICKY = new Set(
  ("der die das den dem des ein eine einer eines einem einen kein keine mein unser unsere unserem unseren " +
   "und oder aber denn sondern als wie wenn dass weil " +
   "mit ohne für von vom zu zum zur bei beim aus auf an am in im ins nach seit über unter vor durch gegen um " +
   "ist sind war waren hat haben wird werden kann können soll sollen " +
   "the a an and or but of to for with from at on in by as is are was were has have will can").split(" ")
);

// Fill a segment into lines, greedily, widest-first. A trailing one-word line
// is pulled back one word where the line above can spare it, so a phrase does
// not end on an orphan.
function flowLines(words, maxLineEm) {
  const w = (ws) => emWidth(ws.join(" "));
  const lines = [];
  let cur = [];
  for (const word of words) {
    const next = [...cur, word];
    if (cur.length && (next.length > PHRASE.maxWordsPerLine || w(next) > maxLineEm)) {
      lines.push(cur);
      cur = [word];
    } else cur = next;
  }
  if (cur.length) lines.push(cur);

  // Never end a line on a word that points at the next one. Push it down,
  // unless that would empty the line or overflow the one below.
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    const tail = line[line.length - 1];
    if (line.length < 2 || !STICKY.has(tail.replace(/[.,;:!?…]$/, "").toLowerCase())) continue;
    const below = [tail, ...lines[i + 1]];
    if (below.length > PHRASE.maxWordsPerLine || w(below) > maxLineEm) continue;
    lines[i] = line.slice(0, -1);
    lines[i + 1] = below;
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].length !== 1 || lines[i - 1].length < 3) continue;
    const moved = lines[i - 1][lines[i - 1].length - 1];
    if (w([moved, ...lines[i]]) > maxLineEm) continue;
    lines[i - 1] = lines[i - 1].slice(0, -1);
    lines[i] = [moved, ...lines[i]];
  }
  return lines;
}

// Group one segment's lines into phrases of two. An odd line out goes first
// where that reads — "Vidlyz" then "beantwortet / Fragen," — and last where the
// opening line points forward and would be stranded on its own.
function groupLines(lines) {
  const endsSticky = (line) =>
    STICKY.has(line[line.length - 1].replace(/[.,;:!?…]$/, "").toLowerCase());
  const odd = lines.length % PHRASE.linesPerPhrase !== 0;
  const rest = odd && !endsSticky(lines[0]) ? lines.slice(1) : lines;
  const phrases = odd && rest !== lines ? [[lines[0]]] : [];
  for (let i = 0; i < rest.length; i += PHRASE.linesPerPhrase)
    phrases.push(rest.slice(i, i + PHRASE.linesPerPhrase));
  return phrases;
}

// ------------------------------------------------------------------ timing --
const dwell = (word, speed) => {
  const raw = STYLE.dwellBase + STYLE.dwellPerChar * [...word].length;
  return Math.min(STYLE.dwellMax, Math.max(STYLE.dwellMin, raw)) / speed;
};

// -------------------------------------------------------------------- main --
const content = JSON.parse(readFileSync("content.json", "utf8"));
const W = content.width ?? 1920;
const H = content.height ?? 1080;
const speed = content.speed ?? 1;
const P = palette(content.brand ?? {});

const F = Math.round(content.fontSize ?? W * (W >= H ? STYLE.fontSizeRatio.landscape : STYLE.fontSizeRatio.portrait));
const maxLinePx = W * (content.maxLineRatio ?? STYLE.maxLineRatio);
const maxLineEm = maxLinePx / F;

const px = (em) => +(em * F).toFixed(2);
const SLAB_H = px(STYLE.slabHeight);
const PITCH = px(STYLE.linePitch);
const PAD = px(STYLE.slabPadX);
const TAN = Math.tan((STYLE.slabSkewDeg * Math.PI) / 180);

// text -> phrases -> lines
const phrases = [];
for (const seg of segments(content.text)) {
  for (const lines of groupLines(flowLines(tokenise(seg), maxLineEm))) phrases.push({ lines });
}
if (!phrases.length) throw new Error("content.json has no text");
for (const ph of phrases)
  for (const line of ph.lines)
    if (emWidth(line.join(" ")) > maxLineEm)
      console.warn(`! "${line.join(" ")}" is wider than the frame allows — shorten the word or lower fontSize.`);

// geometry + schedule
let t = STYLE.leadIn;
for (const ph of phrases) {
  const blockH = SLAB_H + (ph.lines.length - 1) * PITCH;
  const blockTop = (H - blockH) / 2;

  ph.start = +t.toFixed(3);
  ph.lines = ph.lines.map((words, li) => {
    const text = words.join(" ");
    const rowW = px(emWidth(text));
    const rowLeft = (W - rowW) / 2;
    const slabTop = blockTop + li * PITCH;
    // The type sits in a line-height:1 block, so its top is the baseline
    // less baselineFromTop; the baseline itself hangs off the slab.
    const textTop = slabTop - px(STYLE.slabTopFromBaseline) - px(STYLE.baselineFromTop);

    let cursor = 0;
    const slots = words.map((word, wi) => {
      const left = rowLeft + px(cursor);
      const adv = px(emWidth(word));
      cursor += emWidth(word) + (wi < words.length - 1 ? charW(" ") : 0);
      return {
        // The slab skews about its own top-left, so shifting it half a slab
        // height to the left lands its waist on the word, as in the reference.
        x: +(left - PAD - TAN * SLAB_H * 0.5).toFixed(2),
        w: +(adv + 2 * PAD).toFixed(2),
        word,
      };
    });
    return { text, rowLeft: +rowLeft.toFixed(2), rowW: +rowW.toFixed(2), slabTop: +slabTop.toFixed(2), textTop: +textTop.toFixed(2), slots };
  });

  // Walk the words in reading order; the slab slides within a line and cuts
  // across a line break.
  const steps = [];
  ph.lines.forEach((line, li) =>
    line.slots.forEach((slot, wi) => steps.push({ li, wi, slot, word: slot.word }))
  );
  steps.forEach((step, i) => {
    step.at = +t.toFixed(3);
    step.cut = i === 0 || steps[i - 1].li !== step.li;
    // Each line carries its own slab, so the one the highlight is leaving has
    // to be closed in the same frame — otherwise the last word of line one
    // stays inverted while line two is already running.
    step.clear = step.cut && i > 0 ? steps[i - 1].li : null;
    const last = i === steps.length - 1;
    t += dwell(step.word, speed) * (last ? STYLE.lastWordFactor : 1);
  });
  ph.steps = steps;
  ph.duration = +(t - ph.start).toFixed(3);
  t += STYLE.phraseGap;
}
const duration = +(t - STYLE.phraseGap + STYLE.endHold).toFixed(2);

const widest = Math.max(...phrases.flatMap((p) => p.lines.map((l) => l.rowW)));
if (widest > maxLinePx + 1) console.warn(`! Widest line is ${Math.round(widest)}px, over the ${Math.round(maxLinePx)}px limit.`);

// -------------------------------------------------------------------- html --
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const linesHtml = phrases
  .map((ph, pi) => {
    const lines = ph.lines
      .map((line, li) => {
        const id = `p${pi}l${li}`;
        // The white copy lives inside the slab and is counter-skewed, so the
        // slab's overflow clip is what inverts the word. skewX(a) . skewX(-a)
        // is the identity, up to a constant shift of tan(a) x the child's y
        // offset, which is folded into its left below.
        const hiTop = line.textTop - line.slabTop;
        const hiLeft = line.rowLeft - TAN * hiTop;
        // The layering is the effect: the slab covers the dark line and the
        // white copy sits on top of it, clipped by the slab. Both audits are
        // told so explicitly rather than left to fail on every phrase.
        return `        <div class="row" style="left:${line.rowLeft}px;top:${line.textTop}px;width:${line.rowW}px" data-layout-allow-overlap data-layout-allow-occlusion>${esc(line.text)}</div>
        <div class="slab" id="${id}-slab" style="top:${line.slabTop}px;height:${SLAB_H}px"><span class="hi" id="${id}-hi" style="left:${hiLeft.toFixed(2)}px;top:${hiTop.toFixed(2)}px;width:${line.rowW}px" data-layout-allow-overlap data-layout-allow-overflow>${esc(line.text)}</span></div>`;
      })
      .join("\n");
    return `      <div class="clip phrase" id="phrase-${pi}" data-start="${ph.start}" data-duration="${ph.duration}" data-track-index="${1 + (pi % 4)}">
${lines}
      </div>`;
  })
  .join("\n");

const tweens = phrases
  .map((ph, pi) =>
    ph.steps
      .map(
        (s) =>
          `      step("p${pi}l${s.li}", ${s.slot.x}, ${s.slot.w}, ${s.at}, ${s.cut}, ${
            s.clear === null ? "null" : `"p${pi}l${s.clear}"`
          });`
      )
      .join("\n")
  )
  .join("\n");

const html = `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      /* Bundled locally so the composition renders identically offline and on any machine. */
      @font-face {
        font-family: "Poppins";
        font-weight: 500;
        font-style: normal;
        font-display: block;
        src: url("assets/fonts/poppins-500-latin.woff2") format("woff2");
      }
      @font-face {
        font-family: "Poppins";
        font-weight: 500;
        font-style: normal;
        font-display: block;
        unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+1EF2-1EFF, U+20A0-20AB, U+20AD-20C0, U+2C60-2C7F, U+A720-A7FF;
        src: url("assets/fonts/poppins-500-latin-ext.woff2") format("woff2");
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${P.bg}; }

      .clip { position: absolute; inset: 0; }

      /* Flat brand ground with the reference's soft centre lift and darker rim. */
      .ground {
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse 62% 78% at 50% 50%,
          ${P.bgCentre} 0%, ${P.bg} 55%, ${P.bgEdge} 100%);
      }

      /* Kerning and ligatures are off so the builder's width table is exact —
         every slab position depends on it. Do not remove. */
      .row, .hi {
        position: absolute;
        font-family: ${STYLE.font};
        font-weight: 500;
        font-size: ${F}px;
        line-height: 1;
        white-space: pre;
        font-kerning: none;
        font-variant-ligatures: none;
        text-rendering: geometricPrecision;
      }
      .row { color: ${P.ink}; }

      .slab {
        position: absolute;
        left: 0;
        width: 0;
        overflow: hidden;
        background: ${P.slab};
        border-radius: ${px(STYLE.slabRadius)}px;
      }
      .hi { color: ${P.slabInk}; }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="${duration}"
      data-width="${W}"
      data-height="${H}"
    >
      <div class="clip" id="bg" data-start="0" data-duration="${duration}" data-track-index="0">
        <div class="ground"></div>
      </div>
${linesHtml}
    </div>

    <script>
      const tl = gsap.timeline({ paused: true });

      // The slab leans; the white copy inside it leans back by the same amount,
      // so the two cancel and the type stays upright. Both are set through GSAP
      // rather than CSS so nothing fights the x tweens below.
      document.querySelectorAll(".slab").forEach((el) => {
        gsap.set(el, { skewX: ${STYLE.slabSkewDeg}, transformOrigin: "0 0" });
        gsap.set(el.firstElementChild, { skewX: ${-STYLE.slabSkewDeg}, transformOrigin: "0 0" });
      });
      gsap.set(".slab", { x: 0, width: 0 });

      // Moves the slab onto one word. Within a line it slides and the copy
      // inside slides the opposite way by the same amount, which keeps the
      // white glyphs pinned to the dark ones underneath. Across a line break
      // there is nothing to slide along, so it cuts — and the slab on the line
      // being left is closed in the same frame, so only one word is ever lit.
      function step(id, x, w, at, cut, clear) {
        const slab = "#" + id + "-slab";
        const hi = "#" + id + "-hi";
        if (clear) tl.set("#" + clear + "-slab", { width: 0 }, at);
        if (cut) {
          tl.set(slab, { x: x, width: w }, at);
          tl.set(hi, { x: -x }, at);
        } else {
          tl.to(slab, { x: x, width: w, duration: ${STYLE.slide}, ease: "${STYLE.slideEase}" }, at);
          tl.to(hi, { x: -x, duration: ${STYLE.slide}, ease: "${STYLE.slideEase}" }, at);
        }
      }

${tweens}

      // no-op tween so the timeline spans the closing hold
      tl.to("#bg", { opacity: 1, duration: 0.01 }, ${duration} - 0.01);
      tl.seek(0);
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;

writeFileSync("index.html", html);
const words = phrases.reduce((a, p) => a + p.steps.length, 0);
console.log(
  `index.html written — ${phrases.length} phrases, ${words} words, ${duration}s, ` +
    `font ${F}px, widest line ${Math.round(widest)}px of ${Math.round(maxLinePx)}px allowed`
);
for (const [i, ph] of phrases.entries())
  console.log(`  ${String(i + 1).padStart(2)}. ${ph.lines.map((l) => l.text).join("  /  ")}`);
