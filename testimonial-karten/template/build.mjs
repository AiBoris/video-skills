// Generates index.html from testimonials.json.
//
// The look is taken 1:1 from a reference clip (dark spotlit stage, floating glass
// card, gold stars, word-by-word wipe). Every number in STYLE below is derived from
// that reference's CSS at its recording size of 1240x572, then expressed as a ratio
// so it holds at 1920x1080, 1080x1920 and 1080x1080. The derivation is in the comment
// next to each value — re-derive, do not guess, if you ever change one.
//
// Deliberate changes against the reference:
//   * the card sits in the middle of the frame, not on the right
//   * a source badge (Google, ProvenExpert, ...) sits opposite the stars
//   * an opening title card and a closing rating + CTA card bracket the quotes
//   * no dates on the cards — they date the video, not the service
//
// All CSS animations of the reference are re-expressed as one paused GSAP timeline,
// because CSS keyframes are not seek-safe and would render wrong.
import { readFileSync, writeFileSync } from "node:fs";

// ---------------------------------------------------------------- style ----
const REF = { w: 1240, h: 572, card: 496 }; // reference recording + its card width

const STYLE = {
  // colours, verbatim from the reference
  bg: "linear-gradient(160deg,#0b1024,#060810 72%)",
  accent: "#ffcf6b", // stars
  accent2: "#ff9e6b", // far end of the focus-text gradient
  ink: "#f2f6ff",
  spotTint: "rgba(124,155,255,.5)",
  blob1: "#6d28d9",
  blob2: "#0ea5e9",

  // card internals, as a fraction of the card width (measured at card = 496px)
  padY: 17.16 / REF.card, // 3vh
  padX: 29.76 / REF.card, // 2.4vw
  radius: 18 / REF.card,
  starSize: 23.56 / REF.card, // 1.9vw
  starGap: 6.82 / REF.card, // .55vw
  starsBelow: 13.73 / REF.card, // 2.4vh
  quoteSize: 26.04 / REF.card, // 2.1vw
  quoteLine: 1.36, // em
  whoAbove: 17.16 / REF.card, // 3vh
  whoGap: 12.4 / REF.card, // 1vw
  avatar: 38.44 / REF.card, // 3.1vw
  avatarText: 14.26 / REF.card, // 1.15vw
  nameSize: 15.5 / REF.card, // 1.25vw
  roleSize: 11.78 / REF.card, // .95vw
  quoteMark: 372 / REF.card, // 30vw, relative to the card

  // title card — not in the reference, sized against the quote type
  introSize: 1.62, // x quote size
  introSubSize: 1.5, // x role size
  introWidth: 1.16, // x card width
  introMaxFrame: 0.82, // ... but never wider than this share of the frame

  // stage, as a fraction of the frame
  perspective: 1400 / REF.w,
  blobBlur: 80 / REF.w,

  // timing (seconds), read off the reference's percentage keyframes at --dur:6.5s
  inDur: 0.78, // 0% -> 12%
  starStart: 0.39, //  6%
  starDur: 0.65, //     -> 16%
  starStagger: 0.06, // inline animation-delay on the 5 star svgs
  wordStart: 0.65, // 10%
  wordDur: 0.91, //     -> 24%
  wordStagger: 0.03, // inline animation-delay on the word spans
  sheenStart: 1.04, // 16%
  sheenDur: 0.91, //    -> 30%
  whoStart: 1.95, // 30%
  whoDur: 0.78, //      -> 42%
  outDur: 0.65, // 84% -> 94%
  tail: 0.39, // 94% -> 100%, the gap before the next card

  // How long a finished card stands still. The reference holds 2.73s on an
  // 8-word quote, so 0.34s per word reproduces it and scales with the sentence.
  holdPerWord: 0.34,
  holdMin: 1.9,
  holdMax: 4.2,
  holdOutro: 3.4, // the closing card carries a CTA and a URL — give them reading time

  leadIn: 0.45, // background establishes before the first card
  endHold: 0.6,

  // background motion. The reference loops 0->50%->100% over 6.5s, i.e. 3.25s one way.
  spotHalfCycle: 3.25,
  floatHalfCycle: 4.55, // quotemark, --dur*1.4 / 2
  floatRise: 0.022, // 2.2vh, as a fraction of frame height
};

const FORMATS = {
  landscape: { w: 1920, h: 1080, card: 860 },
  portrait: { w: 1080, h: 1920, card: 900 },
  square: { w: 1080, h: 1080, card: 840 },
};

// Warm gradients in the reference's family, cycled so a long sequence of cards
// does not look like the same person five times.
const AVATAR_GRADIENTS = [
  ["#ffd98a", "#ff8fb1"], // the reference
  ["#ffe3a3", "#ffa77c"],
  ["#ffc98f", "#f79ac0"],
  ["#ffdf9c", "#ff9a9e"],
];

const MAX_LINES = 3;
const MAX_INTRO_LINES = 2;
const WARN_WORDS = 18;

// A shortened quote that leans on a pronoun has lost the noun it referred to.
// "Er hat mir geholfen" points at nobody once the first sentence is cut away, and
// so does "Mit X hat er ..." in the middle of a cut. Both need the name put back.
const PRONOUN =
  /^(er|ihn|ihm|sein|seine|seinem|seinen|seiner|sie|ihr|ihre|ihrem|ihren|ihrer|dessen|deren)$/i;

// ------------------------------------------------------------- helpers ----
const fail = (msg) => {
  console.error("\n✗ " + msg + "\n");
  process.exit(1);
};

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const r2 = (n) => +n.toFixed(2);
const deComma = (n) => String(n).replace(".", ",");

// Rough Inter advance widths in em. Only used to count lines and to shrink an
// over-long quote, so being a few percent off is harmless.
const charEm = (ch) => {
  if (ch === " ") return 0.28;
  if ("ijltfI.,'!|:;".includes(ch)) return 0.31;
  if ("mwMW@".includes(ch)) return 0.88;
  if (ch >= "A" && ch <= "Z") return 0.68;
  if (ch >= "0" && ch <= "9") return 0.6;
  return 0.54;
};
const textEm = (s) => [...s].reduce((a, c) => a + charEm(c), 0);

// Greedy wrap, same rule the browser uses, to count the lines a quote will take.
function countLines(words, fontPx, boxPx) {
  const space = 0.28 * fontPx;
  let lines = 1;
  let x = 0;
  for (const w of words) {
    const wpx = textEm(w) * fontPx;
    if (x === 0) x = wpx;
    else if (x + space + wpx <= boxPx) x += space + wpx;
    else {
      lines++;
      x = wpx;
    }
  }
  return lines;
}

// Shrinks the type until the text fits maxLines, or gives up at 78% and reports it.
function fitText(plain, baseSize, boxPx, maxLines) {
  const words = plain.split(/\s+/).filter(Boolean);
  let size = baseSize;
  let lines = countLines(words, size, boxPx);
  while (lines > maxLines && size > baseSize * 0.78) {
    size = r2(size - 1);
    lines = countLines(words, size, boxPx);
  }
  return { size, lines };
}

// "the **best** pack" -> [[{t:"the"}], [{t:"best",em:true}], [{t:"pack"}]]
function parseQuote(s, where) {
  const parts = [];
  let em = false;
  let buf = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "*" && s[i + 1] === "*") {
      if (buf) parts.push({ t: buf, em });
      buf = "";
      em = !em;
      i++;
      continue;
    }
    buf += s[i];
  }
  if (buf) parts.push({ t: buf, em });
  if (em) fail(`${where}: an opening ** has no closing ** in the text.`);

  const words = [];
  let cur = [];
  for (const p of parts) {
    for (const c of p.t.split(/(\s+)/)) {
      if (!c) continue;
      if (/^\s+$/.test(c)) {
        if (cur.length) words.push(cur), (cur = []);
      } else cur.push({ t: c, em: p.em });
    }
  }
  if (cur.length) words.push(cur);
  return words;
}

const plainOf = (words) => words.map((w) => w.map((p) => p.t).join("")).join(" ");

function requireFocus(words, where, hint) {
  if (!words.some((w) => w.some((p) => p.em)))
    fail(
      `${where}: no focus text. Wrap the one phrase the viewer must remember in ` +
        `**double asterisks**, e.g. ${hint}`
    );
}

const initialsOf = (name) =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => [...w][0].toUpperCase())
    .join("") || "★";

const STAR_PATH =
  "M12 2l3 6.9 7.5.6-5.7 4.9 1.8 7.3L12 17.8 5.1 21.7l1.8-7.3L1.2 9.5 8.7 8.9z";

// ---------------------------------------------------------------- input ----
const dataFile = process.argv[2] || "testimonials.json";
const data = JSON.parse(readFileSync(dataFile, "utf8"));
const opt = data.options || {};
const fmt = FORMATS[opt.format || "landscape"];
if (!fmt) fail(`Unknown format "${opt.format}". Use landscape, portrait or square.`);

const items = data.testimonials || [];
if (!items.length) fail(`${dataFile} has no testimonials.`);

const brand = data.brand || {};
const subject = brand.subject || brand.name || null;

const warnings = [];

const W = fmt.w;
const H = fmt.h;
const CARD = opt.cardWidth || fmt.card;
const px = (ratio) => r2(ratio * CARD);

const S = {
  padY: px(STYLE.padY),
  padX: px(STYLE.padX),
  radius: px(STYLE.radius),
  star: px(STYLE.starSize),
  starGap: px(STYLE.starGap),
  starsBelow: px(STYLE.starsBelow),
  quote: px(STYLE.quoteSize),
  whoAbove: px(STYLE.whoAbove),
  whoGap: px(STYLE.whoGap),
  avatar: px(STYLE.avatar),
  avatarText: px(STYLE.avatarText),
  name: px(STYLE.nameSize),
  role: px(STYLE.roleSize),
  mark: px(STYLE.quoteMark),
};
const CONTENT = CARD - 2 * S.padX;
// The title line is measured against the card, but must also keep a margin to the
// frame — in portrait 1.16x the card is 97% of the frame width and the headline
// runs into the bezel. Whichever is narrower wins.
const INTRO_BOX = r2(Math.min(CARD * STYLE.introWidth, W * STYLE.introMaxFrame));

// ------------------------------------------------------------- the cards ---
const cards = [];
let t = STYLE.leadIn;

const defaultSource = data.defaultSource || null;

function scheduleCard(inner, wordCount, kind, holdFloor = 0) {
  const whoAt = inner.whoAt ?? STYLE.whoStart;
  const settle = Math.max(
    whoAt + STYLE.whoDur,
    STYLE.wordStart + Math.max(0, wordCount - 1) * STYLE.wordStagger + STYLE.wordDur
  );
  const hold = Math.max(
    holdFloor,
    Math.min(STYLE.holdMax, Math.max(STYLE.holdMin, wordCount * STYLE.holdPerWord))
  );
  const outAt = r2(settle + hold);
  const dur = r2(outAt + STYLE.outDur);
  cards.push({ ...inner, kind, whoAt, start: r2(t), dur, outAt });
  t = r2(t + dur + STYLE.tail);
}

// --- opening title ---------------------------------------------------------
if (data.intro) {
  const kind = brand.kind === "person" ? "person" : "company";
  const headline =
    data.intro.headline ||
    (kind === "person"
      ? "Das sagen **meine Kunden**"
      : "Das sagen **unsere Kunden**");
  const words = parseQuote(headline, "intro");
  requireFocus(words, "intro", '"Das sagen **unsere Kunden**".');

  const base = r2(S.quote * STYLE.introSize);
  const fitted = fitText(plainOf(words), base, INTRO_BOX, MAX_INTRO_LINES);
  if (fitted.lines > MAX_INTRO_LINES)
    warnings.push(
      `intro: the headline still needs ${fitted.lines} lines at the smallest size. ` +
        `A title card carries about six words.`
    );

  scheduleCard(
    {
      words,
      quoteSize: fitted.size,
      lineHeight: r2(fitted.size * 1.2),
      lines: fitted.lines,
      sub: data.intro.sub || "",
      whoAt: r2(STYLE.wordStart + 0.5),
    },
    words.length,
    "intro"
  );
}

// --- the quotes ------------------------------------------------------------
items.forEach((item, i) => {
  const where = `testimonial ${i + 1}${item.name ? ` (${item.name})` : ""}`;
  if (!item.quote) fail(`${where}: "quote" is missing.`);

  const words = parseQuote(item.quote, where);
  // The focus text is the point of this format: a card without one is a wall of
  // grey words that the eye slides off. Refuse to build rather than ship that.
  requireFocus(words, where, '"hat uns **drei Wochen Arbeit** gespart".');

  const plain = plainOf(words);

  // Pronouns whose antecedent the cut removed. If the quote never names the
  // subject, every "er"/"sein" in it points at nobody.
  const bare = (w) => w.replace(/[^\p{L}]/gu, "");
  const tokens = plain.split(/\s+/).map(bare).filter(Boolean);
  const namesSubject =
    subject &&
    tokens.some((w) => w.toLowerCase() === subject.split(/\s+/)[0].toLowerCase());
  const orphan = tokens.filter((w) => PRONOUN.test(w));
  if (orphan.length && !namesSubject)
    warnings.push(
      `${where}: the quote says "${orphan[0]}" but never names ` +
        (subject ? `${subject}` : "the subject") +
        `. The cut took the antecedent with it — put the name back, ` +
        `e.g. "${subject || "Name"} hat …".`
    );

  if (words.length > WARN_WORDS)
    warnings.push(
      `${where}: ${words.length} words. Over ~${WARN_WORDS} the card stops being ` +
        `a quote and starts being a paragraph — cut it further.`
    );

  const fitted = fitText(plain, S.quote, CONTENT, MAX_LINES);
  if (fitted.lines > MAX_LINES)
    warnings.push(
      `${where}: still ${fitted.lines} lines at the smallest allowed size. Shorten the quote.`
    );

  // Stars always round up, by project decision: a 4.8 review shows five.
  const raw = item.rating == null ? 5 : Number(item.rating);
  const stars = Math.max(0, Math.min(5, Math.ceil(raw)));
  if (raw < 4.5 && raw > 0)
    warnings.push(
      `${where}: rated ${deComma(raw)} but the card shows ${stars} stars (always ` +
        `rounded up). Below 4,5 that gap is large enough to mislead — check it is ` +
        `what you want.`
    );

  const [g1, g2] = item.avatar?.from
    ? [item.avatar.from, item.avatar.to || item.avatar.from]
    : AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];

  scheduleCard(
    {
      words,
      quoteSize: fitted.size,
      lineHeight: r2(fitted.size * STYLE.quoteLine),
      lines: fitted.lines,
      rating: stars,
      name: item.name || "",
      // No date on the card: it dates the video, not the service. `date` stays in
      // the JSON as provenance next to `url`, and is deliberately not rendered.
      role: item.role || "",
      initials: item.avatar?.initials || initialsOf(item.name),
      photo: item.avatar?.photo || null,
      g1,
      g2,
      source: item.source || defaultSource,
    },
    words.length,
    "quote"
  );
});

// --- closing rating + CTA --------------------------------------------------
const outro = data.outro || null;
if (outro) {
  // Several platforms can be summed, but never averaged plainly: 4,96 out of 33
  // and 4,7 out of 200 is 4,74 weighted, not the 4,83 a flat average gives. The
  // count decides the weight, so the arithmetic happens here and not by hand.
  const list = (outro.sources || []).filter((x) => x && x.name);
  const counted = list.filter((x) => Number(x.count) > 0 && x.rating != null);
  const total = counted.reduce((a, x) => a + Number(x.count), 0);
  const weighted = total
    ? counted.reduce((a, x) => a + Number(x.rating) * Number(x.count), 0) / total
    : null;

  if (list.length && counted.length < list.length)
    warnings.push(
      `outro: ${list.length - counted.length} of ${list.length} platforms have no ` +
        `rating or count and are left out of the total. Add both, or drop the platform.`
    );

  // total: false = keine Gesamtnote und keine Gesamtzahl. Weder eine gemittelte
  // Note noch eine addierte Anzahl muss dann verantwortet werden; jede Plattform
  // steht mit ihren eigenen Zahlen da.
  const noTotal = outro.total === false;
  let shown = noTotal ? null : (outro.rating ?? weighted);
  if (noTotal && outro.rating != null)
    warnings.push(
      `outro: total is false, so the rating ${deComma(outro.rating)} is not shown. ` +
        `Drop one of the two.`
    );
  if (!noTotal && outro.rating != null && weighted != null) {
    const off = Math.abs(Number(outro.rating) - weighted);
    if (off > 0.05)
      warnings.push(
        `outro: rating ${deComma(outro.rating)} does not match the weighted average ` +
          `of the platforms, which is ${deComma(weighted.toFixed(2))}. A flat average ` +
          `over platforms of different size is wrong — use the weighted figure or ` +
          `show the platforms separately without one total.`
      );
  }
  const ratingText =
    shown == null ? "" : deComma(String(Math.round(Number(shown) * 100) / 100));

  const src = outro.source || (list.length === 1 ? list[0].name : "") || defaultSource?.name || "";
  const count = outro.count ?? (total || null);
  // Without a total there is nothing to say in a sentence that the platform pills
  // do not already say better — each carries its own name, note and count. An
  // explicit `line` still wins if the user wants one.
  const line =
    outro.line ||
    (noTotal
      ? ""
      : list.length > 1
        ? `aus **${count} Bewertungen** auf ${list.length} Plattformen`
        : count
          ? `aus **${count} Bewertungen**${src ? ` auf ${src}` : ""}`
          : `**${src || "Bewertungen"}**`);
  const words = line ? parseQuote(line, "outro") : [];
  if (line) requireFocus(words, "outro", '"aus **128 Bewertungen** auf Google".');

  const size = r2(S.quote * 0.82);
  const fitted = line
    ? fitText(plainOf(words), size, CONTENT, 2)
    : { size, lines: 0 };

  // Quotes may cite a platform the closing card never mentions — that reads like
  // a number pulled from thin air.
  if (list.length) {
    const named = new Set(list.map((x) => x.name));
    const missing = [
      ...new Set(
        cards
          .filter((c) => c.kind === "quote" && c.source)
          .map((c) => c.source.name)
          .filter((n) => !named.has(n))
      ),
    ];
    if (missing.length)
      warnings.push(
        `outro: quotes cite ${missing.join(", ")}, but the closing card does not ` +
          `list ${missing.length > 1 ? "those platforms" : "that platform"}.`
      );
  }

  scheduleCard(
    {
      words,
      quoteSize: fitted.size,
      lineHeight: r2(fitted.size * STYLE.quoteLine),
      lines: fitted.lines,
      rating: Math.max(
        0,
        Math.min(
          5,
          Math.ceil(
            Number(
              shown ??
                (list.length ? Math.min(...list.map((x) => Number(x.rating ?? 5))) : 5)
            )
          )
        )
      ),
      ratingText,
      cta: outro.cta || "",
      website: outro.website || "",
      source: list.length > 1 ? null : src ? { name: src } : null,
      platforms: list.length > 1 ? list : null,
    },
    Math.max(6, words.length),
    "outro",
    STYLE.holdOutro
  );
}

const duration = r2(t - STYLE.tail + STYLE.endHold);

// Estimated card height, used only to place the decorative quote mark and to warn.
const tallest = Math.max(
  ...cards
    .filter((c) => c.kind !== "intro")
    .map(
      (c) =>
        2 * S.padY +
        S.star +
        S.starsBelow +
        c.lines * c.lineHeight +
        S.whoAbove +
        S.avatar
    )
);
if (tallest > H * 0.72)
  warnings.push(
    `The tallest card is ${Math.round(tallest)}px in a ${H}px frame. Shorten the ` +
      `longest quote or use options.cardWidth to widen the card.`
  );

// --------------------------------------------------------------- markup ----
const starsHtml = (id, filled) =>
  Array.from({ length: 5 }, (_, i) => {
    const dim = i >= filled ? ' class="dim"' : "";
    return `<svg id="${id}-star-${i}" viewBox="0 0 24 24"${dim}><path d="${STAR_PATH}"/></svg>`;
  }).join("");

const sourceHtml = (id, source) => {
  if (!source) return "";
  const rating =
    source.rating == null
      ? ""
      : `<span class="src-rating">${esc(deComma(source.rating))}</span>`;
  const mark = source.logo
    ? `<img class="src-logo" src="${esc(source.logo)}" alt="">`
    : `<svg class="src-mark" viewBox="0 0 24 24"><path d="${STAR_PATH}"/></svg>`;
  return `<div class="source" id="${id}-source">${mark}<span class="src-name">${esc(
    source.name
  )}</span>${rating}</div>`;
};

const wordsHtml = (id, words) =>
  words
    .map((word, i) => {
      const inner = word
        .map((p) => (p.em ? `<em>${esc(p.t)}</em>` : esc(p.t)))
        .join("");
      return `<span class="w" data-layout-allow-overflow data-layout-allow-occlusion><b id="${id}-w-${i}">${inner}</b></span>`;
    })
    .join(" ");

function cardHtml(c, i) {
  const id = `c${i}`;
  const quote = c.words.length
    ? `<p class="quote" style="font-size:${c.quoteSize}px;line-height:${c.lineHeight}px">${wordsHtml(
        id,
        c.words
      )}</p>`
    : "";

  if (c.kind === "intro")
    return `      <div class="card-wrap clip" id="${id}" data-start="${c.start}" data-duration="${c.dur}" data-track-index="${i + 2}">
        <div class="intro" id="${id}-card">
          ${quote.replace('class="quote"', 'class="quote intro-head"')}
          ${c.sub ? `<div class="intro-sub" id="${id}-who">${esc(c.sub)}</div>` : ""}
        </div>
      </div>`;

  const foot =
    c.kind === "outro"
      ? `<div class="cta-row" id="${id}-who">
              ${c.cta ? `<div class="cta">${esc(c.cta)}</div>` : ""}
              ${c.website ? `<div class="website">${esc(c.website)}</div>` : ""}
            </div>`
      : `<div class="who" id="${id}-who">
              <div class="avatar"${
                c.photo ? ` style="background-image:url('${esc(c.photo)}')"` : ""
              }>${c.photo ? "" : esc(c.initials)}</div>
              <div>
                <div class="name">${esc(c.name)}</div>
                ${c.role ? `<div class="role">${esc(c.role)}</div>` : ""}
              </div>
            </div>`;

  const platforms = c.platforms
    ? `<div class="srcrow" id="${id}-source">${c.platforms
        .map(
          (x) =>
            `<div class="source"><svg class="src-mark" viewBox="0 0 24 24"><path d="${STAR_PATH}"/></svg>` +
            `<span class="src-name">${esc(x.name)}</span>` +
            (x.rating == null ? "" : `<span class="src-rating">${esc(deComma(x.rating))}</span>`) +
            (x.count == null ? "" : `<span class="src-count">${esc(String(x.count))}</span>`) +
            `</div>`
        )
        .join("")}</div>`
    : "";

  const big =
    c.kind === "outro" && c.ratingText
      ? `<div class="big-rating" id="${id}-extra">${esc(c.ratingText)}</div>`
      : "";

  return `      <div class="card-wrap clip" id="${id}" data-start="${c.start}" data-duration="${c.dur}" data-track-index="${i + 2}">
        <div class="card" id="${id}-card" style="--av1:${c.g1 || AVATAR_GRADIENTS[0][0]};--av2:${
          c.g2 || AVATAR_GRADIENTS[0][1]
        }">
          <div class="glass">
            <span class="sheen" id="${id}-sheen" data-layout-allow-overflow data-layout-allow-occlusion></span>
            <div class="toprow">
              <div class="stars" id="${id}-stars">${starsHtml(id, c.rating)}</div>
              ${sourceHtml(id, c.source)}
            </div>
            ${big}
            ${quote}
            ${platforms}
            ${foot}
          </div>
        </div>
      </div>`;
}

const cardsHtml = cards.map(cardHtml).join("\n");

// ------------------------------------------------------------- timeline ----
const cardTweens = cards
  .map((c, i) => {
    const o = {
      id: `c${i}`,
      at: c.start,
      out: c.outAt,
      words: c.words.length,
      whoAt: r2(c.whoAt),
      source: (!!c.source || !!c.platforms) && c.kind !== "intro",
      stars: c.kind !== "intro",
      sheen: c.kind !== "intro",
      fly: c.kind !== "intro",
      extra: c.kind === "outro" && !!c.ratingText,
    };
    return `      card(${JSON.stringify(o)});`;
  })
  .join("\n");

// Background loops are stretched so a whole number of half-cycles fills the video
// exactly. Without this the GSAP timeline would run past the root's data-duration
// and the last cycle would be cut mid-swing.
const fitCycle = (half) => {
  const n = Math.max(1, Math.round(duration / half));
  return { dur: r2(duration / n), repeat: n - 1 };
};
const spot = fitCycle(STYLE.spotHalfCycle);
const float = fitCycle(STYLE.floatHalfCycle);
const grainSteps = Math.max(1, Math.round(duration / 0.07));

// The quote mark peeks out behind the card's top-left corner. Clamped so a narrow
// frame (portrait) does not push it half off the canvas.
const markLeft = r2(Math.max(0.03 * W, (W - CARD) / 2 - 0.14 * CARD));
const markTop = r2(Math.max(0.03 * H, H / 2 - tallest / 2 - 0.3 * S.mark));

const html = `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      /* Bundled so the render is identical offline and on any machine. */
      @font-face {
        font-family: "Inter";
        font-style: normal;
        font-weight: 100 900;
        font-display: block;
        src: url("assets/fonts/inter-latin.woff2") format("woff2");
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
          U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193,
          U+2212, U+2215, U+FEFF, U+FFFD;
      }
      @font-face {
        font-family: "Inter";
        font-style: normal;
        font-weight: 100 900;
        font-display: block;
        src: url("assets/fonts/inter-latin-ext.woff2") format("woff2");
        unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF,
          U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020,
          U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        width: ${W}px;
        height: ${H}px;
        overflow: hidden;
        background: #060810;
        font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
      }
      .clip { position: absolute; inset: 0; }

      /* --- stage -------------------------------------------------------- */
      .stage { position: absolute; inset: 0; overflow: hidden; background: ${STYLE.bg}; }
      .spot {
        position: absolute;
        inset: -20%;
        background: radial-gradient(38% 46% at 50% 40%, ${STYLE.spotTint}, transparent 60%);
      }
      .blob {
        position: absolute;
        border-radius: 50%;
        filter: blur(${r2(STYLE.blobBlur * W)}px);
        mix-blend-mode: screen;
        opacity: .7;
      }
      .bl1 {
        width: ${r2(0.44 * W)}px; height: ${r2(0.44 * W)}px;
        left: ${r2(-0.08 * W)}px; bottom: ${r2(-0.14 * H)}px;
        background: radial-gradient(circle, ${STYLE.blob1}, transparent 65%);
      }
      .bl2 {
        width: ${r2(0.4 * W)}px; height: ${r2(0.4 * W)}px;
        right: ${r2(-0.06 * W)}px; top: ${r2(-0.1 * H)}px;
        background: radial-gradient(circle, ${STYLE.blob2}, transparent 65%);
      }
      .vignette {
        position: absolute; inset: 0; pointer-events: none;
        background: radial-gradient(110% 110% at 50% 50%, transparent 45%, rgba(0,0,0,.6));
      }
      .quotemark {
        position: absolute;
        left: ${markLeft}px;
        top: ${markTop}px;
        font-size: ${S.mark}px;
        line-height: 1;
        font-family: Georgia, "Times New Roman", serif;
        color: rgba(255,255,255,.055);
        pointer-events: none;
      }
      .grain {
        position: absolute; inset: 0;
        width: ${W}px; height: ${H}px;
        opacity: .32; mix-blend-mode: overlay; pointer-events: none;
      }

      /* --- card --------------------------------------------------------- */
      .card-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        perspective: ${r2(STYLE.perspective * W)}px;
      }
      .card { width: ${CARD}px; transform-style: preserve-3d; }
      .glass {
        position: relative;
        padding: ${S.padY}px ${S.padX}px;
        border-radius: ${S.radius}px;
        overflow: hidden;
        background: linear-gradient(135deg, rgba(255,255,255,.1), rgba(255,255,255,.03));
        backdrop-filter: blur(${r2(0.023 * W)}px) saturate(1.3);
        -webkit-backdrop-filter: blur(${r2(0.023 * W)}px) saturate(1.3);
        border: 1px solid rgba(255,255,255,.12);
        box-shadow: 0 ${r2(0.028 * H)}px ${r2(0.074 * H)}px rgba(0,0,0,.5),
                    inset 0 1px 0 rgba(255,255,255,.2);
      }
      .sheen {
        position: absolute; top: 0; left: 0;
        width: ${r2(0.4 * CARD)}px; height: 100%;
        background: linear-gradient(105deg, transparent, rgba(255,255,255,.32), transparent);
        pointer-events: none;
      }

      .toprow {
        display: flex; align-items: center; justify-content: space-between;
        gap: ${S.whoGap}px;
        margin-bottom: ${S.starsBelow}px;
      }
      .stars { display: flex; gap: ${S.starGap}px; }
      .stars svg {
        width: ${S.star}px; height: ${S.star}px;
        fill: ${STYLE.accent};
        filter: drop-shadow(0 0 ${r2(S.star * 0.3)}px rgba(255,207,107,.45));
      }
      .stars svg.dim { fill: rgba(255,255,255,.18); filter: none; }

      .source {
        display: flex; align-items: center; gap: ${r2(S.starGap * 1.2)}px;
        padding: ${r2(S.role * 0.34)}px ${r2(S.role * 0.72)}px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(255,255,255,.055);
        white-space: nowrap;
      }
      .src-mark { width: ${r2(S.role * 0.92)}px; height: ${r2(S.role * 0.92)}px; fill: ${STYLE.accent}; }
      .src-logo { width: ${r2(S.role * 1.1)}px; height: ${r2(S.role * 1.1)}px; object-fit: contain; }
      .src-name { font-size: ${r2(S.role * 0.95)}px; font-weight: 500; color: rgba(255,255,255,.72); letter-spacing: .01em; }
      .src-rating { font-size: ${r2(S.role * 0.95)}px; font-weight: 500; color: ${STYLE.accent}; }

      .quote { font-weight: 400; letter-spacing: -.01em; color: ${STYLE.ink}; }
      .quote .w { display: inline-block; overflow: hidden; vertical-align: top; }
      .quote .w b { display: inline-block; font-weight: 400; }
      .quote em {
        font-style: normal;
        font-weight: 500;
        background: linear-gradient(90deg, ${STYLE.accent}, ${STYLE.accent2});
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      .who { display: flex; align-items: center; gap: ${S.whoGap}px; margin-top: ${S.whoAbove}px; }
      .avatar {
        width: ${S.avatar}px; height: ${S.avatar}px;
        border-radius: 50%; flex: none;
        display: grid; place-items: center;
        font-weight: 500; font-size: ${S.avatarText}px; color: #0b1024;
        background: linear-gradient(135deg, var(--av1), var(--av2));
        background-size: cover; background-position: center;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.5), 0 ${r2(0.006 * H)}px ${r2(0.015 * H)}px rgba(0,0,0,.35);
      }
      .name { font-size: ${S.name}px; font-weight: 500; color: ${STYLE.ink}; }
      .role { font-size: ${S.role}px; color: rgba(255,255,255,.55); font-weight: 400; }

      /* --- title card --------------------------------------------------- */
      .intro { width: ${INTRO_BOX}px; text-align: center; }
      .intro-head { font-weight: 400; }
      .intro-sub {
        margin-top: ${r2(S.whoAbove * 0.9)}px;
        font-size: ${r2(S.role * STYLE.introSubSize)}px;
        font-weight: 400;
        color: rgba(255,255,255,.55);
        letter-spacing: .01em;
      }

      /* --- closing card ------------------------------------------------- */
      .big-rating {
        margin-bottom: ${r2(S.whoAbove * 0.25)}px;
        font-size: ${r2(S.avatar * 1.9)}px;
        font-weight: 500;
        line-height: 1;
        letter-spacing: -.02em;
        background: linear-gradient(90deg, ${STYLE.accent}, ${STYLE.accent2});
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .src-count { font-size: ${r2(S.role * 0.95)}px; font-weight: 400; color: rgba(255,255,255,.45); }
      .srcrow {
        display: flex; flex-wrap: wrap;
        gap: ${r2(S.starGap * 1.6)}px;
        margin-top: ${r2(S.whoAbove * 0.85)}px;
      }
      /* Nothing above them, so they sit tighter under the stars. */
      .toprow + .srcrow { margin-top: ${r2(S.whoAbove * 0.3)}px; }
      /* The count needs a separator from the rating without adding a character. */
      .srcrow .src-count::before { content: "· "; }

      .cta-row {
        display: flex; align-items: center; gap: ${S.whoGap}px;
        margin-top: ${r2(S.whoAbove * 1.15)}px;
      }
      .cta {
        padding: ${r2(S.name * 0.62)}px ${r2(S.name * 1.15)}px;
        border-radius: 999px;
        background: linear-gradient(120deg, ${STYLE.accent}, ${STYLE.accent2});
        color: #0b1024;
        font-size: ${S.name}px;
        font-weight: 500;
        letter-spacing: -.005em;
        white-space: nowrap;
        box-shadow: 0 ${r2(0.008 * H)}px ${r2(0.022 * H)}px rgba(255,180,90,.22);
      }
      .website {
        font-size: ${r2(S.role * 1.25)}px;
        font-weight: 500;
        color: rgba(255,255,255,.72);
        letter-spacing: .01em;
        white-space: nowrap;
      }
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
      <div class="stage clip" id="stage" data-start="0" data-duration="${duration}" data-track-index="1">
        <div class="spot" id="spot" data-layout-allow-overflow></div>
        <div class="blob bl1" id="bl1" data-layout-allow-overflow></div>
        <div class="blob bl2" data-layout-allow-overflow></div>
        <div class="quotemark" id="quotemark" data-layout-allow-overflow data-layout-allow-occlusion>&ldquo;</div>
        <div class="vignette"></div>
        <svg class="grain" width="${W}" height="${H}" aria-hidden="true">
          <defs>
            <filter id="grainf" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
              <feTurbulence id="grainturb" type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch" result="t" />
              <feColorMatrix in="t" type="matrix"
                values="0 0 0 0 1
                        0 0 0 0 1
                        0 0 0 0 1
                        0 0 0 .5 0" />
            </filter>
          </defs>
          <rect width="100%" height="100%" filter="url(#grainf)" />
        </svg>
      </div>
${cardsHtml}
    </div>

    <script>
      const tl = gsap.timeline({ paused: true });

      // --- background: one slow sine, the reference's 3.25s half-cycle kept ---
      tl.fromTo("#spot",
        { xPercent: -8, yPercent: -4 },
        { xPercent: 10, yPercent: 6, duration: ${spot.dur}, ease: "sine.inOut", repeat: ${spot.repeat}, yoyo: true }, 0);
      tl.fromTo("#bl1",
        { xPercent: 10, yPercent: 6 },
        { xPercent: -8, yPercent: -4, duration: ${spot.dur}, ease: "sine.inOut", repeat: ${spot.repeat}, yoyo: true }, 0);
      tl.fromTo("#quotemark",
        { y: 0 },
        { y: ${r2(-STYLE.floatRise * H)}, duration: ${float.dur}, ease: "sine.inOut", repeat: ${float.repeat}, yoyo: true }, 0);

      // Film grain. Stepped so every frame is a pure function of time and a seek
      // lands on exactly the seed the render would have produced.
      const turb = document.getElementById("grainturb");
      const grain = { i: 0 };
      tl.to(grain, {
        i: ${grainSteps},
        duration: ${duration},
        ease: "steps(${grainSteps})",
        onUpdate: () => turb.setAttribute("seed", String((Math.round(grain.i) * 7919) % 97)),
      }, 0);

      // --- one card ---------------------------------------------------------
      // Times inside are local to the card; \`o.at\` shifts them onto the master timeline.
      function card(o) {
        const at = o.at;
        const el = "#" + o.id + "-card";

        if (o.fly) {
          tl.fromTo(el,
            { rotationY: 16, rotationX: -4, x: ${r2(0.03 * W)}, autoAlpha: 0 },
            { rotationY: 0, rotationX: 0, x: 0, autoAlpha: 1, duration: ${STYLE.inDur}, ease: "expo.out" },
            at);
        }

        if (o.stars) {
          for (let i = 0; i < 5; i++) {
            tl.fromTo("#" + o.id + "-star-" + i,
              { scale: 0, rotation: -24, autoAlpha: 0 },
              { scale: 1, rotation: 0, autoAlpha: 1, duration: ${STYLE.starDur}, ease: "back.out(1.7)" },
              at + ${STYLE.starStart} + i * ${STYLE.starStagger});
          }
        }

        if (o.source) {
          tl.fromTo("#" + o.id + "-source",
            { autoAlpha: 0, x: ${r2(0.02 * CARD)} },
            { autoAlpha: 1, x: 0, duration: ${STYLE.starDur}, ease: "power2.out" },
            at + ${STYLE.starStart} + 4 * ${STYLE.starStagger});
        }

        // The closing card's big number lands with the stars, before its sentence.
        if (o.extra) {
          tl.fromTo("#" + o.id + "-extra",
            { autoAlpha: 0, y: ${r2(0.012 * H)} },
            { autoAlpha: 1, y: 0, duration: ${STYLE.whoDur}, ease: "power2.out" },
            at + ${STYLE.starStart} + 0.2);
        }

        // Each word rides up out of its own overflow-hidden box.
        for (let i = 0; i < o.words; i++) {
          tl.fromTo("#" + o.id + "-w-" + i,
            { yPercent: 130 },
            { yPercent: 0, duration: ${STYLE.wordDur}, ease: "expo.out" },
            at + ${STYLE.wordStart} + i * ${STYLE.wordStagger});
        }

        if (o.sheen) {
          tl.fromTo("#" + o.id + "-sheen",
            { x: ${r2(-0.6 * CARD)}, skewX: -16 },
            { x: ${r2(1.35 * CARD)}, skewX: -16, duration: ${STYLE.sheenDur}, ease: "power1.inOut" },
            at + ${STYLE.sheenStart});
        }

        if (document.getElementById(o.id + "-who")) {
          tl.fromTo("#" + o.id + "-who",
            { autoAlpha: 0, y: ${r2(0.012 * H)} },
            { autoAlpha: 1, y: 0, duration: ${STYLE.whoDur}, ease: "power2.out" },
            at + o.whoAt);
        }

        if (o.fly) {
          tl.to(el,
            { rotationY: -9, rotationX: 4, x: ${r2(-0.014 * W)}, autoAlpha: 0, duration: ${STYLE.outDur}, ease: "power2.in" },
            at + o.out);
        } else {
          tl.to(el,
            { autoAlpha: 0, y: ${r2(-0.012 * H)}, duration: ${STYLE.outDur}, ease: "power2.in" },
            at + o.out);
        }
      }

${cardTweens}

      tl.seek(0);
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;

writeFileSync("index.html", html);

const mins = Math.floor(duration / 60);
console.log(
  `index.html written — ${cards.length} card(s), ${W}x${H}, duration ${duration}s` +
    (mins ? ` (${mins}:${String(Math.round(duration % 60)).padStart(2, "0")})` : "")
);
const label = { intro: "[Intro] ", outro: "[Outro] ", quote: "" };
for (const c of cards)
  console.log(
    `  ${String(c.start).padStart(6)}s  ${String(c.dur).padStart(5)}s  ` +
      `${label[c.kind]}${plainOf(c.words).slice(0, 62)}`
  );
if (duration > 90)
  warnings.push(
    `${duration}s is long for a testimonial reel. Six to eight quotes is usually ` +
      `where attention ends — pick the strongest, not all of them.`
  );
for (const w of warnings) console.warn("! " + w);
