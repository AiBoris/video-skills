// Generates index.html from content.json.
// Layout is reverse-engineered from a screenshot of the Google start page:
// box geometry, logo size, type sizes and colours live in STYLE / THEMES below.
//
// The measured values describe the page inside a 1080 px tall frame. Chrome sizes
// (logo, box, type) stay absolute and are only touched by "scale"; vertical
// positions are carried over as a share of the frame height, so the same page
// sits at the same relative height in every format.
import { readFileSync, writeFileSync } from "node:fs";

const FORMATS = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
};

const STYLE = {
  designHeight: 1080, // the frame the values below were measured in

  // page geometry — measured off the reference
  logoWidth: 230, // wordmark, aspect 272:92
  logoCenterY: 378,
  boxWidth: 640,
  boxHeight: 48,
  boxRadius: 26,
  boxCenterY: 508,
  boxPadX: 22,
  magSize: 22,
  micSize: 26,
  gapIcon: 15, // magnifier -> text, and text -> mic
  buttonsTop: 600,
  buttonsGap: 42,

  // typography
  ui: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
  querySize: 17,
  buttonSize: 15,

  // pointer — it starts off-frame and glides in; tall formats need a
  // different entry vector than wide ones, so this is picked per orientation
  cursorHeight: 31,
  cursorFromWide: { x: 620, y: 372 },
  cursorFromTall: { x: 300, y: 620 },

  // timing (seconds)
  leadIn: 0.9, // caret blinks in the empty field before the first keystroke
  charsPerSecond: 8.7, // measured typing pace
  afterType: 0.4, // the finished question stands still
  cursorTravel: 1.05,
  clickDelay: 0.15, // pointer settles, then presses
  endHold: 1.05, // nothing happens after the click
  jitter: 0.7, // +/- 35 % keystroke variation
  spaceExtra: 0.55, // longer beat between words
  punctExtra: 0.4, // ... and before . ? !
};

const THEMES = {
  // the cream Google variant from the reference screenshot
  cream: {
    bg: "#fdf3e9",
    border: "#d9c3a8",
    query: "#3c2a1a",
    caret: "#3c2a1a",
    mag: "#9e8873",
    link: "#a9592c",
    linkHover: "#8a441e",
    ripple: "#a9592c",
    cursorFill: "#ffffff",
    cursorStroke: "#141414",
  },
  // the ordinary white start page
  light: {
    bg: "#ffffff",
    border: "#dfe1e5",
    query: "#202124",
    caret: "#202124",
    mag: "#9aa0a6",
    link: "#3c4043",
    linkHover: "#202124",
    ripple: "#5f6368",
    cursorFill: "#ffffff",
    cursorStroke: "#141414",
  },
  // dark mode
  dark: {
    bg: "#202124",
    border: "#5f6368",
    query: "#e8eaed",
    caret: "#e8eaed",
    mag: "#9aa0a6",
    link: "#e8eaed",
    linkHover: "#ffffff",
    ripple: "#e8eaed",
    cursorFill: "#ffffff",
    cursorStroke: "#141414",
  },
};

// ---- read the content ---------------------------------------------------
const content = JSON.parse(readFileSync("content.json", "utf8"));

const query = String(content.query ?? "").trim();
if (!query) {
  console.error("! content.json needs a non-empty \"query\".");
  process.exit(1);
}

const theme = THEMES[content.theme ?? "cream"];
if (!theme) {
  console.error(
    `! Unknown theme "${content.theme}". Pick one of: ${Object.keys(THEMES).join(", ")}.`
  );
  process.exit(1);
}

const labels = {
  search: content.labels?.search ?? "Google Search",
  lucky: content.labels?.lucky ?? "I'm Feeling Lucky",
};
const clickTarget = content.click === "lucky" ? "lucky" : "search";

// ---- resolve the frame --------------------------------------------------
const formatName = content.format ?? "16:9";
const format = FORMATS[formatName];
if (!format) {
  console.error(
    `! Unknown format "${formatName}". Pick one of: ${Object.keys(FORMATS).join(", ")}.`
  );
  process.exit(1);
}

// "scale" enlarges the page chrome without moving it. 1 keeps the measured
// desktop sizes; a vertical clip usually wants more, because the same 17 px of
// query text is a lot smaller on a phone-shaped frame.
const scale = Number(content.scale ?? 1);
if (!(scale > 0.4 && scale <= 3)) {
  console.error(`! "scale" must be between 0.4 and 3, got ${content.scale}.`);
  process.exit(1);
}

const { width: W, height: H } = format;
const px = (v) => Math.round(v * scale); // chrome size
const y = (v) => Math.round((v / STYLE.designHeight) * H); // vertical position

const L = {
  logoWidth: px(STYLE.logoWidth),
  logoCenterY: y(STYLE.logoCenterY),
  boxWidth: px(STYLE.boxWidth),
  boxHeight: px(STYLE.boxHeight),
  boxRadius: px(STYLE.boxRadius),
  boxCenterY: y(STYLE.boxCenterY),
  boxPadX: px(STYLE.boxPadX),
  magSize: px(STYLE.magSize),
  micSize: px(STYLE.micSize),
  gapIcon: px(STYLE.gapIcon),
  buttonsTop: y(STYLE.buttonsTop),
  buttonsGap: px(STYLE.buttonsGap),
  querySize: px(STYLE.querySize),
  buttonSize: px(STYLE.buttonSize),
  cursorHeight: px(STYLE.cursorHeight),
  cursorWidth: px(20),
};
L.logoHeight = Math.round((L.logoWidth * 92) / 272);
L.fieldHeight = Math.round(L.querySize * 1.42);
L.caretHeight = Math.round(L.querySize * 1.1);
L.buttonLine = Math.round(L.buttonSize * 1.47);

const cursorFrom = H > W ? STYLE.cursorFromTall : STYLE.cursorFromWide;

if (L.boxWidth > W - px(80)) {
  console.warn(
    `! The search box is ${L.boxWidth}px wide in a ${W}px frame — it nearly touches the edge. ` +
      `Lower "scale" or pick a wider format.`
  );
}

// The field is this wide; Arial averages ~0.48 em per character.
const fieldWidth = L.boxWidth - 2 * L.boxPadX - L.magSize - L.micSize - 2 * L.gapIcon;
const maxChars = Math.floor(fieldWidth / (L.querySize * 0.482));
if (query.length > maxChars) {
  console.warn(
    `! The question is ${query.length} characters — about ${maxChars} fit in the box. ` +
      `Longer text is clipped on the left, like a real input. Shorten it if that is not wanted.`
  );
}

// ---- keystroke rhythm ---------------------------------------------------
// Deterministic on purpose: a seeded generator, resolved here at build time,
// so every render of this project types in exactly the same rhythm.
let seed = 20260910;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const typeDur = query.length / STYLE.charsPerSecond;
const weights = [...query].map((ch) => {
  let w = 1 + (rnd() - 0.5) * STYLE.jitter;
  if (ch === " ") w += STYLE.spaceExtra;
  if (".?!".includes(ch)) w += STYLE.punctExtra;
  return w;
});
const total = weights.reduce((a, b) => a + b, 0);
let acc = 0;
const stops = weights.map((w) => {
  acc += w / total;
  return Number((acc * typeDur).toFixed(4)); // seconds after typing starts
});

// ---- beats --------------------------------------------------------------
const T = {
  type: STYLE.leadIn,
  typed: STYLE.leadIn + typeDur,
};
T.move = T.typed + STYLE.afterType;
T.arrive = T.move + STYLE.cursorTravel;
T.click = T.arrive + STYLE.clickDelay;
const duration = Number((T.click + STYLE.endHold).toFixed(2));

// ---- emit ---------------------------------------------------------------
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const html = `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"><\/script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        width: ${W}px;
        height: ${H}px;
        overflow: hidden;
        background: ${theme.bg};
      }
      body {
        font-family: ${STYLE.ui};
        -webkit-font-smoothing: antialiased;
      }

      .clip { position: absolute; inset: 0; }

      #page { background: ${theme.bg}; }

      #logo {
        position: absolute;
        left: ${Math.round((W - L.logoWidth) / 2)}px;
        top: ${Math.round(L.logoCenterY - L.logoHeight / 2)}px;
        width: ${L.logoWidth}px;
        height: ${L.logoHeight}px;
      }

      #searchbox {
        position: absolute;
        left: ${Math.round((W - L.boxWidth) / 2)}px;
        top: ${Math.round(L.boxCenterY - L.boxHeight / 2)}px;
        width: ${L.boxWidth}px;
        height: ${L.boxHeight}px;
        display: flex;
        align-items: center;
        padding: 0 ${L.boxPadX}px;
        border: 1px solid ${theme.border};
        border-radius: ${L.boxRadius}px;
        background: transparent;
      }

      #mag { width: ${L.magSize}px; height: ${L.magSize}px; flex: 0 0 auto; fill: ${theme.mag}; }

      #field {
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        margin-left: ${L.gapIcon}px;
        height: ${L.fieldHeight}px;
        overflow: hidden;
        white-space: nowrap;
      }

      #typed {
        font-size: ${L.querySize}px;
        line-height: ${L.fieldHeight}px;
        color: ${theme.query};
        letter-spacing: 0.1px;
        white-space: pre;
      }

      #caret {
        width: ${Math.max(1, Math.round(scale))}px;
        height: ${L.caretHeight}px;
        background: ${theme.caret};
        margin-left: 1px;
        flex: 0 0 auto;
      }

      #mic { width: ${L.micSize}px; height: ${L.micSize}px; flex: 0 0 auto; margin-left: ${L.gapIcon}px; }

      #buttons {
        position: absolute;
        left: 0;
        top: ${L.buttonsTop}px;
        width: ${W}px;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        gap: ${L.buttonsGap}px;
      }

      .gbtn {
        position: relative;
        display: block;
        font-size: ${L.buttonSize}px;
        line-height: ${L.buttonLine}px;
        color: ${theme.link};
        padding: 0 2px;
      }

      .gbtn .ul {
        position: absolute;
        left: 2px;
        right: 2px;
        bottom: 1px;
        height: 1px;
        background: ${theme.link};
      }

      #ripple {
        position: absolute;
        width: ${px(76)}px;
        height: ${px(76)}px;
        margin-left: ${-px(38)}px;
        margin-top: ${-px(38)}px;
        border-radius: 50%;
        border: ${Math.max(2, Math.round(2 * scale))}px solid ${theme.ripple};
        opacity: 0;
      }

      #cursor {
        position: absolute;
        width: ${L.cursorWidth}px;
        height: ${L.cursorHeight}px;
        opacity: 0;
      }

      #cursor-arrow { display: block; width: ${L.cursorWidth}px; height: ${L.cursorHeight}px; }
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
      <div id="page" class="clip" data-start="0" data-duration="${duration}" data-track-index="1">
        <img id="logo" src="assets/google-logo.svg" alt="Google" />

        <div id="searchbox">
          <svg id="mag" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>

          <div id="field"><span id="typed"></span><span id="caret"></span></div>

          <svg id="mic" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285f4" d="M12 15c1.66 0 3-1.31 3-2.97V4.98C15 3.32 13.66 2 12 2S9 3.32 9 4.98v7.05c0 1.66 1.34 2.97 3 2.97z"/>
            <path fill="#34a853" d="M11 18.08h2V22h-2z"/>
            <path fill="#fbbc05" d="M7.05 16.87c-1.27-1.33-2.05-2.83-2.05-4.87h2c0 1.45.56 2.42 1.47 3.38l-1.42 1.49z"/>
            <path fill="#ea4335" d="M12 16.93a4.94 4.94 0 0 1-3.54-1.55l-1.41 1.49A6.94 6.94 0 0 0 12 18.97c3.87 0 6.99-2.92 6.99-7h-1.99c0 2.92-2.24 4.96-5 4.96z"/>
          </svg>
        </div>

        <div id="buttons">
          <span class="gbtn" id="btn-search">${esc(labels.search)}<span class="ul"></span></span>
          <span class="gbtn" id="btn-lucky">${esc(labels.lucky)}<span class="ul"></span></span>
        </div>

        <div id="ripple"></div>

        <div id="cursor">
          <svg id="cursor-arrow" viewBox="0 0 20 31" aria-hidden="true">
            <path
              d="M1 1 L1 24.2 L6.9 18.5 L10.6 26.9 L14.5 25.1 L10.8 16.9 L18.6 16.9 Z"
              fill="${theme.cursorFill}"
              stroke="${theme.cursorStroke}"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>

    <script>
      (function () {
        var TEXT = ${JSON.stringify(query)};
        var STOPS = ${JSON.stringify(stops)};
        var T_TYPE = ${T.type};
        var T_TYPED = ${Number(T.typed.toFixed(4))};
        var T_MOVE = ${Number(T.move.toFixed(4))};
        var MOVE_DUR = ${STYLE.cursorTravel};
        var T_ARRIVE = ${Number(T.arrive.toFixed(4))};
        var T_CLICK = ${Number(T.click.toFixed(4))};
        var END = ${duration};

        var typedEl = document.getElementById("typed");
        var lastCount = -1;
        function renderTyping(t) {
          var e = t - T_TYPE;
          var k = 0;
          while (k < STOPS.length && e >= STOPS[k]) k++;
          if (k !== lastCount) {
            lastCount = k;
            typedEl.textContent = TEXT.slice(0, k);
          }
        }
        renderTyping(0);

        function build() {
          var caret = document.getElementById("caret");
          var cursor = document.getElementById("cursor");
          var arrow = document.getElementById("cursor-arrow");
          var ripple = document.getElementById("ripple");
          var btn = document.getElementById("btn-${clickTarget}");
          var ul = btn.querySelector(".ul");

          /* park the pointer tip on the label it is going to click */
          var r = btn.getBoundingClientRect();
          var tx = r.left + r.width * 0.5;
          var ty = r.top + r.height * 0.55;
          cursor.style.left = tx + "px";
          cursor.style.top = ty - ${px(7)} + "px";
          ripple.style.left = tx + "px";
          ripple.style.top = ty + "px";

          var tl = gsap.timeline({ paused: true });
          tl.to({}, { duration: END }, 0);

          /* caret: blink, hold solid while typing, blink again afterwards */
          tl.to(caret, { opacity: 0, duration: ${Number((STYLE.leadIn / 2).toFixed(3))}, ease: "steps(1)", repeat: 1, yoyo: true }, 0);
          tl.set(caret, { opacity: 1 }, T_TYPE);
          tl.to(caret, { opacity: 0, duration: 0.53, ease: "steps(1)", repeat: ${Math.max(1, Math.ceil((duration - T.typed) / 0.53) - 1)}, yoyo: true }, T_TYPED);

          /* resting state everything seeks back to */
          tl.set(cursor, { x: ${cursorFrom.x}, opacity: 0 }, 0);
          tl.set(arrow, { y: ${cursorFrom.y}, scale: 1, transformOrigin: "0% 0%" }, 0);
          tl.set(".gbtn .ul", { scaleX: 0, transformOrigin: "0% 50%" }, 0);
          tl.set(ripple, { opacity: 0, scale: 0.25, transformOrigin: "50% 50%" }, 0);

          /* the pointer glides in and settles on the label */
          tl.to(cursor, { opacity: 1, duration: 0.22, ease: "none" }, T_MOVE);
          tl.to(cursor, { x: 0, duration: MOVE_DUR, ease: "power3.out" }, T_MOVE);
          tl.to(arrow, { y: 0, duration: MOVE_DUR, ease: "power2.inOut" }, T_MOVE);

          /* hover state right before the click */
          tl.to(ul, { scaleX: 1, duration: 0.2, ease: "power2.out" }, T_ARRIVE - 0.05);
          tl.to(btn, { color: "${theme.linkHover}", duration: 0.2, ease: "power2.out" }, T_ARRIVE - 0.05);

          /* the click itself */
          tl.to(arrow, { scale: 0.82, duration: 0.07, ease: "power2.out" }, T_CLICK);
          tl.to(arrow, { scale: 1, duration: 0.14, ease: "power2.out" }, T_CLICK + 0.07);
          tl.to(ripple, { opacity: 0.42, duration: 0.01, ease: "none" }, T_CLICK);
          tl.to(ripple, { opacity: 0, scale: 1, duration: 0.55, ease: "power2.out" }, T_CLICK + 0.01);

          tl.eventCallback("onUpdate", function () {
            renderTyping(tl.time());
          });

          window.__timelines["main"] = tl;
          tl.seek(0);
          renderTyping(0);
        }

        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(build);
        } else {
          build();
        }
      })();
    <\/script>
  </body>
</html>
`;

writeFileSync("index.html", html);

console.log(`index.html written`);
console.log(`  question   "${query}" (${query.length} chars, ~${maxChars} fit)`);
console.log(`  format     ${formatName} (${W}x${H}), scale ${scale}`);
console.log(`  theme      ${content.theme ?? "cream"}, click on "${labels[clickTarget]}"`);
console.log(`  typing     ${typeDur.toFixed(2)}s   click at ${T.click.toFixed(2)}s`);
console.log(`  duration   ${duration}s`);
