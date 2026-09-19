// Generates index.html from content.json.
// Ported from a rendered radar-sweep composition; every geometry, spring and
// timing value below was read out of that reference and is kept as a share of
// the radar radius, so the same picture holds in every format.
//
//   node build.mjs          -> builds the first (or only) version
//   node build.mjs 2        -> builds version index 2 from "names"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const FORMATS = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
};

const PRESETS = {
  // the reference: signal green on near-black, amber contacts
  gruen: { radar: "#34d399", blip: "#f6b73c", background: "#04100c", text: "#e7fff5" },
  bernstein: { radar: "#f6b73c", blip: "#ff6b4a", background: "#140b02", text: "#fff4e2" },
  blau: { radar: "#38bdf8", blip: "#facc15", background: "#030d18", text: "#e6f6ff" },
  rot: { radar: "#f87171", blip: "#fbbf24", background: "#140505", text: "#ffecec" },
};

const STYLE = {
  fps: 30,

  // geometry, as a share of the frame / of the radar radius
  radiusOfWidth: 0.45, // radius fits whichever of the two is tighter
  radiusOfHeight: 0.4,
  centerYOfHeight: 0.5185, // the dish sits a touch below middle, leaving room for the title
  ringRadii: [0.28, 0.52, 0.76, 1], // 120.4 / 223.6 / 326.8 / 430 at r=430
  ringDelayFrames: 5, // each ring springs open 5 frames after the one inside it
  ringStroke: [1.2, 1.2, 1.2, 2.5],
  tickCount: 36,
  tickLong: 0.0512, // every 9th tick reaches this much further in (22 / 430)
  tickShort: 0.0279, // 12 / 430
  wakeLines: 14, // the fading trail behind the beam
  wakeStepDeg: 5,
  blipMin: 6.5, // contact radius at r=430
  blipMax: 13,

  // typography
  titleSize: 64, // at a 1080 px short edge
  coordSize: 22,
  subtitleRatio: 0.36, // of the title size
  marginXRatio: 0.0833, // 90 / 1080
  marginYRatio: 0.0778, // 84 / 1080

  // timing, in frames at 30 fps
  bootFrames: 20, // dish, ticks, crosshair and coordinates fade up
  titleDelay: 10,
  sweepStart: 18,
  sweepPeriod: 110, // frames per full turn
  fadeOutFrames: 18,
  blipFalloff: 2.2, // how fast a contact dims behind the beam
  scanlineDrift: 0.4, // px per frame
  scanlineOpacity: 0.07,

  // springs, straight out of the reference
  ringSpring: { damping: 14, stiffness: 90, mass: 0.8 },
  titleSpring: { damping: 15, stiffness: 110, mass: 0.8 },
};

// ---- read the content ---------------------------------------------------
const content = JSON.parse(readFileSync("content.json", "utf8"));

const names = Array.isArray(content.names) ? content.names : [];
const versionArg = process.argv[2];
const version = versionArg === undefined ? 0 : Number(versionArg);
if (!Number.isInteger(version) || version < 0 || (names.length && version >= names.length)) {
  console.error(
    `! Version ${versionArg} does not exist. "names" holds ${names.length || 0} entries.`
  );
  process.exit(1);
}

const rawTitle = String(content.title ?? "").trim();
if (!rawTitle) {
  console.error('! content.json needs a non-empty "title".');
  process.exit(1);
}
const name = names[version] ?? "";
const title = rawTitle.replaceAll("{name}", name).trim();
const subtitle = String(content.subtitle ?? "").trim();

const formatName = content.format ?? "16:9";
const format = FORMATS[formatName];
if (!format) {
  console.error(`! Unknown format "${formatName}". Pick one of: ${Object.keys(FORMATS).join(", ")}.`);
  process.exit(1);
}

const presetName = content.preset ?? "gruen";
const preset = PRESETS[presetName];
if (!preset) {
  console.error(`! Unknown preset "${presetName}". Pick one of: ${Object.keys(PRESETS).join(", ")}.`);
  process.exit(1);
}
const colors = { ...preset, ...(content.colors ?? {}) };

const duration = Number(content.duration ?? 6);
if (!(duration >= 3 && duration <= 20)) {
  console.error(`! "duration" must be between 3 and 20 seconds, got ${content.duration}.`);
  process.exit(1);
}

const blipCount = Math.max(1, Math.min(24, Number(content.blips ?? 9)));
const showCrosshair = content.crosshair !== false;
const showScanlines = content.scanlines !== false;

// ---- resolve the frame --------------------------------------------------
const { width: W, height: H } = format;
const shortEdge = Math.min(W, H);
const k = shortEdge / 1080; // type scales with the short edge, so 16:9 and 9:16 match

const R = Math.round(Math.min(W * STYLE.radiusOfWidth, H * STYLE.radiusOfHeight));
const CX = Math.round(W / 2);
const CY = Math.round(H * STYLE.centerYOfHeight);
const rr = (share) => +(R * share).toFixed(2); // a length given as a share of the radius

const titleSize = Math.round(Number(content.titleSize ?? STYLE.titleSize * k));
const subtitleSize = Math.round(titleSize * STYLE.subtitleRatio);
const coordSize = Math.round(STYLE.coordSize * k);
const marginX = Math.round(shortEdge * STYLE.marginXRatio);
const marginY = Math.round(shortEdge * STYLE.marginYRatio);

const totalFrames = Math.round(duration * STYLE.fps);
const turns = ((totalFrames - STYLE.sweepStart) / STYLE.sweepPeriod).toFixed(2);

// A title this long at this size will not fit the block; the block is 80 % wide
// and roughly three lines tall before it reaches the dish.
const titleColumn = W * 0.8;
const maxTitleChars = Math.floor((titleColumn / (titleSize * 0.54)) * 3);
if (title.length > maxTitleChars) {
  console.warn(
    `! The title is ${title.length} characters — about ${maxTitleChars} fit above the dish ` +
      `at ${titleSize}px. Shorten it, or set a smaller "titleSize".`
  );
}

// ---- place the contacts -------------------------------------------------
// Seeded, not random: the same blip count always lands in the same places, so
// every re-render and every version of a batch shows the identical dish.
let seed = 20260919;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const blips = [];
for (let i = 0; i < blipCount; i += 1) {
  const angle = rnd() * 360;
  const radius = R * (0.18 + Math.sqrt(rnd()) * 0.74); // spread evenly over the disc area
  const size = (STYLE.blipMin + rnd() * (STYLE.blipMax - STYLE.blipMin)) * (R / 430);
  const rad = (angle * Math.PI) / 180;
  blips.push({
    angle: +angle.toFixed(3),
    size: +size.toFixed(3),
    cx: +(CX + Math.cos(rad) * radius).toFixed(2),
    cy: +(CY + Math.sin(rad) * radius).toFixed(2),
  });
}

// ---- emit ---------------------------------------------------------------
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ringSvg = STYLE.ringRadii
  .map(
    (share, i) =>
      `            <circle class="ring" data-delay-frames="${i * STYLE.ringDelayFrames}" cx="${CX}" cy="${CY}" r="${rr(share)}" fill="none" stroke="var(--radar)" stroke-width="${STYLE.ringStroke[i]}" />`
  )
  .join("\n");

const blipSvg = blips
  .map(
    (b, i) =>
      `            <g class="blip" data-index="${i}" data-angle="${b.angle}" data-size="${b.size}"><circle class="blip-ring" cx="${b.cx}" cy="${b.cy}" r="${b.size}" /><circle class="blip-core" cx="${b.cx}" cy="${b.cy}" r="${+(b.size * 0.55).toFixed(3)}" /></g>`
  )
  .join("\n");

// The scene is a sub-composition: one row in the Studio timeline, and the shape
// `hyperframes lint` asks for once a timed element has nested children.
const scene = `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <template>
    <style>
      @font-face {
        font-family: "Inter";
        src: url("assets/fonts/inter-latin.woff2") format("woff2");
        font-weight: 100 900;
        font-display: block;
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F, U+2122, U+2191, U+2193, U+2212, U+2215;
      }
      @font-face {
        font-family: "Inter";
        src: url("assets/fonts/inter-latin-ext.woff2") format("woff2");
        font-weight: 100 900;
        font-display: block;
        unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+2C60-2C7F, U+A720-A7FF;
      }
      @font-face {
        font-family: "JetBrains Mono";
        src: url("assets/fonts/jetbrains-mono-400-latin.woff2") format("woff2");
        font-weight: 400;
        font-display: block;
      }

      #radar-scene {
        position: absolute;
        inset: 0;
        width: ${W}px;
        height: ${H}px;
        overflow: hidden;
        --radar: ${colors.radar};
        --radar-90: ${rgba(colors.radar, 0.9)};
        --radar-14: ${rgba(colors.radar, 0.14)};
        --radar-05: ${rgba(colors.radar, 0.05)};
        --radar-00: ${rgba(colors.radar, 0)};
        --blip: ${colors.blip};
        --surface: ${colors.background};
        --text: ${colors.text};
        --text-75: ${rgba(colors.text, 0.75)};
        --text-60: ${rgba(colors.text, 0.6)};
      }

      #visual, .surface, .radar-svg, #scanlines {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }

      .surface { background: var(--surface); }
      .radar-svg { display: block; }

      .ring {
        transform-box: view-box;
        transform-origin: ${CX}px ${CY}px;
        will-change: transform, opacity;
      }

      #sweep, #ticks, #crosshair, #disc, #center-dot, .blip, #scanlines, #title-block, #coordinates {
        opacity: 0;
      }

      .wake-line, .beam-line { stroke: var(--radar); }
      .blip-ring { fill: none; stroke: var(--blip); stroke-width: ${+(1.5 * (R / 430)).toFixed(2)}; }
      .blip-core { fill: var(--blip); }

      #scanlines {
        pointer-events: none;
        background-image: repeating-linear-gradient(
          to bottom,
          rgba(255, 255, 255, 1) 0,
          rgba(255, 255, 255, 1) 1.5px,
          rgba(255, 255, 255, 0) 1.5px,
          rgba(255, 255, 255, 0) 20px
        );
        background-position: 0 var(--scan-offset, 0px);
      }

      #title-block {
        position: absolute;
        top: ${marginY}px;
        left: ${marginX}px;
        display: block;
        width: 80%;
        will-change: transform, opacity;
      }

      #title {
        width: 100%;
        margin: 0;
        color: var(--text);
        font-family: Inter, system-ui, sans-serif;
        font-size: ${titleSize}px;
        font-weight: 800;
        line-height: 1.05;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        overflow-wrap: break-word;
      }

      #subtitle {
        margin-top: ${Math.round(32 * k)}px;
        color: var(--text-60);
        font-family: "JetBrains Mono", ui-monospace, Menlo, monospace;
        font-size: ${subtitleSize}px;
        line-height: 1.2;
        letter-spacing: 0.14em;
      }

      #coordinates {
        position: absolute;
        right: ${marginX}px;
        bottom: ${marginY}px;
        width: ${Math.round(420 * k)}px;
        color: var(--text-75);
        font-family: "JetBrains Mono", ui-monospace, Menlo, monospace;
        font-size: ${coordSize}px;
        line-height: 1.7;
        letter-spacing: 0.1em;
        text-align: right;
      }

      #sweep-coordinate { color: var(--radar-90); }
    </style>
    <div id="radar-scene" data-composition-id="radar-scene" data-width="${W}" data-height="${H}">
        <div id="visual">
          <div class="surface"></div>

          <svg class="radar-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true">
            <defs>
              <radialGradient id="radar-disc" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="var(--radar-14)" />
                <stop offset="80%" stop-color="var(--radar-05)" />
                <stop offset="100%" stop-color="var(--radar-00)" />
              </radialGradient>
              <filter id="radar-glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="${+(6 * (R / 430)).toFixed(2)}" result="radar-blur" />
                <feMerge>
                  <feMergeNode in="radar-blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle id="disc" cx="${CX}" cy="${CY}" r="${R}" fill="url(#radar-disc)" />

            <g id="rings">
${ringSvg}
            </g>

            <g id="ticks"></g>
${
  showCrosshair
    ? `
            <g id="crosshair">
              <line x1="${CX - R}" y1="${CY}" x2="${CX + R}" y2="${CY}" stroke="var(--radar)" stroke-width="1" />
              <line x1="${CX}" y1="${CY - R}" x2="${CX}" y2="${CY + R}" stroke="var(--radar)" stroke-width="1" />
            </g>`
    : ""
}

            <g id="sweep" data-layout-ignore="">
              <g id="wake"></g>
              <line class="beam-line" x1="${CX}" y1="${CY}" x2="${CX + R}" y2="${CY}" stroke-width="${+(4 * (R / 430)).toFixed(2)}" filter="url(#radar-glow)" />
            </g>

            <g id="blips" filter="url(#radar-glow)">
${blipSvg}
            </g>

            <circle id="center-dot" cx="${CX}" cy="${CY}" r="${+(6 * (R / 430)).toFixed(2)}" fill="var(--radar)" filter="url(#radar-glow)" />
          </svg>
${showScanlines ? '\n          <div id="scanlines" data-layout-ignore=""></div>\n' : ""}
          <div id="title-block">
            <div id="title">${esc(title)}</div>${
              subtitle ? `\n            <div id="subtitle">${esc(subtitle)}</div>` : ""
            }
          </div>

          <div id="coordinates">
            <div id="latitude">LAT 12.400° N</div>
            <div id="longitude">LON 77.100° E</div>
            <div id="sweep-coordinate">SWEEP 301°</div>
          </div>
        </div>
    </div>

    <script>
      (function () {
        var CX = ${CX}, CY = ${CY}, R = ${R};
        var FPS = ${STYLE.fps};
        var TOTAL = ${totalFrames};
        var BOOT = ${STYLE.bootFrames};
        var FADE = ${STYLE.fadeOutFrames};
        var SWEEP_START = ${STYLE.sweepStart};
        var SWEEP_PERIOD = ${STYLE.sweepPeriod};
        var FALLOFF = ${STYLE.blipFalloff};

        var visual = document.getElementById("visual");
        var disc = document.getElementById("disc");
        var ticks = document.getElementById("ticks");
        var crosshair = document.getElementById("crosshair");
        var sweep = document.getElementById("sweep");
        var wake = document.getElementById("wake");
        var centerDot = document.getElementById("center-dot");
        var scanlines = document.getElementById("scanlines");
        var titleBlock = document.getElementById("title-block");
        var coordinates = document.getElementById("coordinates");
        var latitude = document.getElementById("latitude");
        var longitude = document.getElementById("longitude");
        var sweepCoordinate = document.getElementById("sweep-coordinate");
        var ringEls = Array.prototype.slice.call(document.querySelectorAll(".ring"));
        var blipEls = Array.prototype.slice.call(document.querySelectorAll(".blip"));

        /* the tick ring around the rim: every ninth one reaches further in */
        var svgNs = "http://www.w3.org/2000/svg";
        for (var t = 0; t < ${STYLE.tickCount}; t += 1) {
          var a = (t / ${STYLE.tickCount}) * Math.PI * 2;
          var long = t % 9 === 0;
          var inner = R - R * (long ? ${STYLE.tickLong} : ${STYLE.tickShort});
          var tick = document.createElementNS(svgNs, "line");
          tick.setAttribute("x1", String(CX + Math.cos(a) * inner));
          tick.setAttribute("y1", String(CY + Math.sin(a) * inner));
          tick.setAttribute("x2", String(CX + Math.cos(a) * R));
          tick.setAttribute("y2", String(CY + Math.sin(a) * R));
          tick.setAttribute("stroke", "var(--radar)");
          tick.setAttribute("stroke-width", long ? "2" : "1");
          ticks.appendChild(tick);
        }

        /* the fading trail the beam drags behind it */
        for (var w = 0; w < ${STYLE.wakeLines}; w += 1) {
          var line = document.createElementNS(svgNs, "line");
          line.setAttribute("class", "wake-line");
          line.setAttribute("x1", String(CX));
          line.setAttribute("y1", String(CY));
          line.setAttribute("x2", String(CX + R));
          line.setAttribute("y2", String(CY));
          line.setAttribute("stroke-width", "${+(3 * (R / 430)).toFixed(2)}");
          line.setAttribute("opacity", String(0.4 * Math.pow(1 - w / ${STYLE.wakeLines}, 1.6)));
          line.setAttribute("transform", "rotate(" + -(w * ${STYLE.wakeStepDeg}) + " " + CX + " " + CY + ")");
          wake.appendChild(line);
        }

        /* the reference used a spring solver; this is it, stepped per frame */
        function springValue(frame, config) {
          var last = 0, current = 0, velocity = 0;
          var clamped = Math.max(0, frame);
          var rest = clamped % 1;
          for (var f = 0; f <= Math.floor(clamped); f += 1) {
            if (f === Math.floor(clamped)) f += rest;
            var now = (f / FPS) * 1000;
            var dt = Math.min(now - last, 64);
            var v0 = -velocity;
            var x0 = 1 - current;
            var zeta = config.damping / (2 * Math.sqrt(config.stiffness * config.mass));
            var omega0 = Math.sqrt(config.stiffness / config.mass);
            var omega1 = omega0 * Math.sqrt(1 - zeta * zeta);
            var time = dt / 1000;
            var sin1 = Math.sin(omega1 * time);
            var cos1 = Math.cos(omega1 * time);
            var env = Math.exp(-zeta * omega0 * time);
            var frag = env * (sin1 * ((v0 + zeta * omega0 * x0) / omega1) + x0 * cos1);
            current = zeta < 1 ? 1 - frag : 1 - Math.exp(-omega0 * time) * (x0 + (v0 + omega0 * x0) * time);
            velocity = zeta < 1
              ? zeta * omega0 * frag - env * (cos1 * (v0 + zeta * omega0 * x0) - omega1 * x0 * sin1)
              : Math.exp(-omega0 * time) * (v0 * (time * omega0 - 1) + time * x0 * omega0 * omega0);
            last = now;
          }
          return current;
        }

        var clamp = function (v, min, max) { return Math.min(max, Math.max(min, v)); };
        var playhead = { frame: 0 };

        function renderFrame() {
          var frame = playhead.frame;
          var bootIn = clamp(frame / BOOT, 0, 1);
          var fadeOut = clamp((TOTAL - frame) / FADE, 0, 1);
          var sweepAngle = ((frame - SWEEP_START) / SWEEP_PERIOD) * 360;
          var sweepActive = frame > SWEEP_START;

          visual.style.opacity = String(fadeOut);
          disc.style.opacity = String(bootIn);
          ticks.style.opacity = String(bootIn * 0.55);
          if (crosshair) crosshair.style.opacity = String(bootIn * 0.4);
          centerDot.style.opacity = String(bootIn);
          if (scanlines) {
            scanlines.style.opacity = "${STYLE.scanlineOpacity}";
            scanlines.style.setProperty("--scan-offset", ((frame * ${STYLE.scanlineDrift}) % 20) + "px");
          }
          coordinates.style.opacity = String(bootIn * 0.85);

          for (var i = 0; i < ringEls.length; i += 1) {
            var grow = springValue(frame - i * ${STYLE.ringDelayFrames}, ${JSON.stringify(STYLE.ringSpring)});
            ringEls[i].style.transform = "scale(" + Math.max(0.000002, grow) + ")";
            ringEls[i].style.opacity = String(bootIn * (0.5 - i * 0.08));
          }

          var titleSpring = springValue(frame - ${STYLE.titleDelay}, ${JSON.stringify(STYLE.titleSpring)});
          titleBlock.style.opacity = String(titleSpring);
          titleBlock.style.transform = "translateY(" + ${Math.round(24 * k)} * (1 - titleSpring) + "px)";

          sweep.style.opacity = sweepActive ? "1" : "0";
          sweep.setAttribute("transform", "rotate(" + sweepAngle + " " + CX + " " + CY + ")");

          for (var b = 0; b < blipEls.length; b += 1) {
            var blip = blipEls[b];
            var blipAngle = Number(blip.dataset.angle);
            var size = Number(blip.dataset.size);
            var diff = (((sweepAngle - blipAngle) % 360) + 360) % 360;
            var intensity = sweepActive ? Math.pow(1 - diff / 360, FALLOFF) : 0;
            if (intensity <= 0.02) { blip.style.opacity = "0"; continue; }
            var ring = blip.querySelector(".blip-ring");
            var core = blip.querySelector(".blip-core");
            blip.style.opacity = "1";
            ring.setAttribute("r", String(size * (1 + (1 - intensity) * 1.6)));
            ring.style.opacity = String(intensity * 0.5);
            core.style.opacity = String(intensity);
          }

          var tick2 = Math.floor(frame / 8);
          latitude.textContent = "LAT " + (12.4 + (tick2 % 40) * 0.37).toFixed(3) + "° N";
          longitude.textContent = "LON " + (77.1 + (tick2 % 28) * 0.51).toFixed(3) + "° E";
          var norm = Math.floor((((sweepAngle % 360) + 360) % 360));
          sweepCoordinate.textContent = "SWEEP " + String(norm).padStart(3, "0") + "°";
        }

        function build() {
          renderFrame();
          var tl = gsap.timeline({ paused: true });
          tl.to(playhead, { frame: TOTAL, duration: ${duration}, ease: "none", onUpdate: renderFrame }, 0);
          window.__timelines["radar-scene"] = tl;
          tl.seek(0);
        }

        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(build);
        } else {
          build();
        }
      })();
    <\/script>
    </template>
  </body>
</html>
`;

const host = `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"><\/script>
    <style>
      * { box-sizing: border-box; }
      html, body {
        width: ${W}px;
        height: ${H}px;
        margin: 0;
        overflow: hidden;
        background: #000;
      }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="${duration}"
      data-fps="${STYLE.fps}"
      data-width="${W}"
      data-height="${H}"
    >
      <div
        id="scene"
        class="clip"
        data-composition-id="radar-scene"
        data-composition-src="compositions/radar-scene.html"
        data-start="0"
        data-duration="${duration}"
        data-track-index="0"
        data-width="${W}"
        data-height="${H}"
      ></div>
    </div>

    <script>
      /* the root holds the length; the scene's own timeline is nested by the runtime */
      window.__timelines["main"] = gsap.timeline({ paused: true }).to({}, { duration: ${duration} }, 0);
    <\/script>
  </body>
</html>
`;

function rgba(hex, alpha) {
  const clean = String(hex).replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const v = Number.parseInt(full, 16) || 0;
  return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${alpha})`;
}

mkdirSync("compositions", { recursive: true });
writeFileSync("compositions/radar-scene.html", scene);
writeFileSync("index.html", host);

console.log("index.html + compositions/radar-scene.html written");
console.log(`  title      "${title}"${names.length ? `  (Version ${version + 1} von ${names.length})` : ""}`);
console.log(`  format     ${formatName} (${W}x${H}), preset ${presetName}`);
console.log(`  dish       r=${R} at ${CX},${CY} — ${blipCount} contacts`);
console.log(`  duration   ${duration}s (${totalFrames} frames, ${turns} sweeps)`);
