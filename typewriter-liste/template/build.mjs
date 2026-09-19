// Generates index.html from content.json.
// Style is reverse-engineered from a reference typewriter-on-paper clip:
// measurements (glyph pitch, cap heights, line rhythm, typing speed) live in STYLE below.
import { readFileSync, writeFileSync } from "node:fs";

const STYLE = {
  width: 1920,
  height: 1080,

  // typography — Courier Prime Regular, tracking pulled in to match the reference pitch.
  // Sizes are set so cap heights land on the reference's 48 px / 32 px.
  font: '"Courier Prime", "Courier New", Courier, monospace',
  titleSize: 81, // px  -> cap height 48px
  titlePitch: 46, // px per character cell
  bodySize: 55, // px  -> cap height 32px
  bodyPitch: 28.9, // px per character cell
  ink: "#141414",

  // layout — the block is centred vertically, so only the internal rhythm is fixed here
  titleGap: 149, // title cap-top to first item cap-top
  mainPitch: 108, // vertical distance to the next numbered item
  subPitch: 86, // ... to the next indented sub-item
  marginLeft: 285,
  subIndent: 368,

  // caret — measured at body size (5 x 57 px), scaled for the title
  caretRatioW: 0.089,
  caretRatioH: 1.018,

  // timing (seconds)
  leadIn: 1.0,
  charsPerSecond: 30,
  linePause: 0.73,
  endHold: 2.7,
  vignetteIn: 1.0, // the paper settles from flat to vignetted just as typing starts
};

const CAP = 0.583; // Courier Prime cap height, in em
const capH = (size) => size * CAP;
const boxH = (size) => Math.round(size * 1.43); // line box, roomy enough that overflow:hidden never clips
// Where the cap-top actually lands inside that box. Derived from font metrics this came out
// 3-6 px wrong (the browser strut does not follow them exactly), so it is fitted instead:
// measured cap-tops of 19.4 px @ 55 px and 26.8 px @ 81 px in a rendered snapshot.
// Re-measure both points if the font or the 1.43 line-box factor changes.
const capTopInBox = (size) => 0.2846 * size + 3.75;

const content = JSON.parse(readFileSync("content.json", "utf8"));

// ---- lay the lines out --------------------------------------------------
// Positions are built relative to the title's cap-top, then the whole block is
// centred vertically, so top and bottom margins stay equal at any line count.
const rows = [];
let y = STYLE.titleGap;
content.lines.forEach((line, i) => {
  if (i > 0) y += line.sub ? STYLE.subPitch : STYLE.mainPitch;
  rows.push({
    text: line.text,
    capTop: y,
    left: line.sub ? STYLE.subIndent : STYLE.marginLeft,
  });
});

const all = [{ text: content.title, title: true, capTop: 0 }, ...rows];

// The block runs from the title's cap-top to the last line's baseline — the ink
// the eye actually sees. Umlaut dots overshoot it slightly and are ignored, as
// they would be in hand-set type.
const blockHeight = rows[rows.length - 1].capTop + capH(STYLE.bodySize);
const blockTop = (STYLE.height - blockHeight) / 2;
if (blockTop < 40) {
  console.warn(
    `! Block is ${Math.round(blockHeight)}px tall in a ${STYLE.height}px frame — ` +
      `only ${Math.round(blockTop)}px margin left. Drop a line or shorten the list.`
  );
}
for (const row of all) row.capTop += blockTop;

// ---- schedule the typing ------------------------------------------------
let t = STYLE.leadIn;
for (const row of all) {
  const pitch = row.title ? STYLE.titlePitch : STYLE.bodyPitch;
  const size = row.title ? STYLE.titleSize : STYLE.bodySize;
  row.chars = [...row.text].length;
  row.full = +(row.chars * pitch).toFixed(2);
  row.dur = +(row.chars / STYLE.charsPerSecond).toFixed(3);
  row.start = +t.toFixed(3);
  row.box = boxH(size);
  row.top = +(row.capTop - capTopInBox(size)).toFixed(2);
  row.caretW = Math.max(3, Math.round(size * STYLE.caretRatioW));
  row.caretH = Math.round(size * STYLE.caretRatioH);
  row.caretTop = +(capTopInBox(size) - (row.caretH - capH(size)) / 2).toFixed(2);
  // The title re-centres as it grows, so its caret sits at centre + half the typed width.
  row.caretFrom = row.title ? STYLE.width / 2 : 0;
  // Animated as a transform (x) rather than left, so the caret never snaps to device pixels.
  row.caretTo = row.title ? row.full / 2 : row.full;
  t += row.dur + STYLE.linePause;
}
const duration = +(t - STYLE.linePause + STYLE.endHold).toFixed(2);

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const lineHtml = (row, i) => {
  const id = row.title ? "title" : `line-${i}`;
  const style = row.title
    ? `top:${row.top}px;left:0;width:${STYLE.width}px;text-align:center;font-size:${STYLE.titleSize}px;letter-spacing:${(STYLE.titlePitch - STYLE.titleSize * 0.6).toFixed(2)}px;height:${row.box}px;line-height:${row.box}px`
    : `top:${row.top}px;left:${row.left}px;font-size:${STYLE.bodySize}px;letter-spacing:${(STYLE.bodyPitch - STYLE.bodySize * 0.6).toFixed(2)}px;height:${row.box}px;line-height:${row.box}px`;
  // The title centres itself, so its reveal box is centred inside a full-width row.
  const inner = `<span class="ink" id="${id}-ink" style="width:0"><span class="glyphs" data-layout-allow-overflow data-layout-allow-occlusion>${esc(row.text)}</span></span><span class="caret" id="${id}-caret" style="top:${row.caretTop}px;left:${row.caretFrom}px;width:${row.caretW}px;height:${row.caretH}px"></span>`;
  return `      <div class="line${row.title ? " title" : ""}" id="${id}" style="${style}">${inner}</div>`;
};

const linesHtml = all.map(lineHtml).join("\n");

const tweens = all
  .map((row, i) => {
    const id = row.title ? "title" : `line-${i}`;
    return `      typeLine("${id}", ${row.full}, ${row.caretTo}, ${row.chars}, ${row.dur}, ${row.start});`;
  })
  .join("\n");

const html = `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${STYLE.width}, height=${STYLE.height}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      /* Bundled locally so the composition renders identically offline and on any machine. */
      @font-face {
        font-family: "Courier Prime";
        font-weight: 400;
        font-style: normal;
        font-display: block;
        src: url("assets/fonts/courier-prime-400.woff2") format("woff2");
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        width: ${STYLE.width}px;
        height: ${STYLE.height}px;
        overflow: hidden;
        background: #969696;
      }

      .clip { position: absolute; inset: 0; }

      /* --- paper -------------------------------------------------------- */
      .paper {
        position: absolute;
        inset: 0;
        background:
          repeating-linear-gradient(0deg,
            rgba(0,0,0,0.020) 0px, rgba(0,0,0,0.020) 1px,
            rgba(255,255,255,0.030) 1px, rgba(255,255,255,0.030) 2px,
            transparent 2px, transparent 4px),
          #dfdfdf;
      }
      /* Measured off the reference: a vertically stretched ellipse, not a circle. */
      .vignette {
        position: absolute;
        inset: 0;
        opacity: 0;
        background: radial-gradient(ellipse 1128px 1015px at 50% 50%,
          rgba(0,0,0,0) 0%,
          rgba(0,0,0,0.049) 52.5%,
          rgba(0,0,0,0.260) 85.1%,
          rgba(0,0,0,0.332) 100%);
      }
      .speckle { position: absolute; inset: 0; }

      /* --- type --------------------------------------------------------- */
      .line {
        position: absolute;
        font-family: ${STYLE.font};
        font-weight: 400;
        color: ${STYLE.ink};
        white-space: pre;
      }
      .line .ink {
        display: inline-block;
        overflow: hidden;
        vertical-align: top;
        height: 100%;
      }
      .line .glyphs { display: inline-block; white-space: pre; }
      .line.title .ink { text-align: left; }
      .caret {
        position: absolute;
        background: ${STYLE.ink};
        opacity: 0;
        visibility: hidden;
      }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="${duration}"
      data-width="${STYLE.width}"
      data-height="${STYLE.height}"
    >
      <div id="page" class="clip" data-start="0" data-duration="${duration}" data-track-index="1">
        <div class="paper"></div>
        <div class="vignette" id="vignette"></div>
        <svg class="speckle" width="${STYLE.width}" height="${STYLE.height}" aria-hidden="true">
          <defs>
            <filter id="specks" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="12" result="t" />
              <feColorMatrix in="t" type="matrix"
                values="0 0 0 0 0.08
                        0 0 0 0 0.08
                        0 0 0 0 0.08
                        3.2 0 0 0 -2.55" />
            </filter>
          </defs>
          <rect width="100%" height="100%" filter="url(#specks)" />
        </svg>
${linesHtml}
      </div>
    </div>

    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });

      // The sheet settles from flat to vignetted over the lead-in, landing as typing starts.
      tl.to("#vignette", { opacity: 1, duration: ${STYLE.vignetteIn}, ease: "power2.inOut" }, 0);

      // Reveals a line one character cell at a time and walks the caret with it.
      // steps() keeps every frame a pure function of time, so seeking stays exact.
      function typeLine(id, full, caretTo, chars, dur, at) {
        const ink = document.getElementById(id + "-ink");
        const caret = document.getElementById(id + "-caret");
        const ease = "steps(" + chars + ")";
        tl.set(caret, { autoAlpha: 1 }, at);
        tl.to(ink, { width: full, duration: dur, ease: ease }, at);
        tl.to(caret, { x: caretTo, duration: dur, ease: ease }, at);
        tl.set(caret, { autoAlpha: 0 }, at + dur);
      }

${tweens}

      // no-op tween so the timeline spans the closing hold
      tl.to("#page", { opacity: 1, duration: 0.01 }, ${duration} - 0.01);
      tl.seek(0);
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;

writeFileSync("index.html", html);
console.log(
  `index.html written — ${all.length} lines, duration ${duration}s, ` +
    `block ${Math.round(blockHeight)}px, margin ${Math.round(blockTop)}px top and bottom`
);
