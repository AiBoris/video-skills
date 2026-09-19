---
name: wort-highlight
description: "Builds a kinetic typography video: a full-bleed colour background, two lines of bold type, and a slanted dark bar travelling word by word through the sentence, flipping the word underneath to white. Use it when someone wants a piece of text as a video: 'kinetic typography', 'word highlight', 'text video', 'text animation', 'highlight word by word', 'claim as video', 'slogan video', 'social hook video', 'Wort-Highlight', 'Text-Video', 'Claim als Video'. The text is split into phrases and lines automatically. The colour comes from the reference yellow, from the user, or is read off their website. Not for narrated videos, subtitles, bar charts or product demos. Requires the HyperFrames CLI."
---

# Word Highlight

A sentence stands large in frame, at most two lines at a time. A slanted dark bar
jumps from word to word and flips the word underneath to white. No audio, no
images, no narrator — the text is the whole video.

Look and timing were measured off a reference clip and are baked into
`template/build.mjs`. You only supply text and colour.

## Check the requirement first

```bash
npx hyperframes --version
```

If that fails, stop and tell the user:

> This skill needs the HyperFrames CLI. Install it with:
> `npx skills add heygen-com/hyperframes --global --copy --all`

Do not guess your way around it and do not build a substitute.

## Step 1 — Settle the text

Ask the user whether they **supply the text** or name a **topic**. For a topic
you write the text yourself and put it in front of them for approval before you
build anything.

You give **one running text** in `content.json`. Line and phrase breaks are set
by `build.mjs` itself — do not put line breaks into the text.

### The editorial rule

Every word gets its own moment under the bar, so every word counts. Filler words
stand out immediately in this look.

- **15 to 40 words.** Below that the video feels clipped, above it tires.
  Roughly 0.45 s per word: 25 words ≈ 14 s.
- **Short main clauses.** Punctuation marks are the cuts: full stop, comma, dash,
  colon and semicolon each end a phrase. To control the cuts, place commas.
- **No nested clauses.** A subordinate clause running across four phrases is no
  longer readable by its last word.
- **Keep numbers and symbols together.** `100 %` stays one word — that is already
  built in.

## Step 2 — Settle the colour

Three routes, in this order:

1. **The user names a colour** (`#1B6EF3`, “our blue”, a hex from the style
   guide) → straight into `content.json` under `brand.bg`.
2. **The user names a website** → `brand.mjs` reads it out (step 4).
3. **Neither** → the reference yellow `#FAC143` stays. Ask once before rendering
   with it.

You only ever specify **the background**. Type, bar and bar type are derived from
it by `build.mjs`: a light background gets near-black type and a near-black bar,
a dark background inverts both. Set `brand.ink`, `brand.slab` or `brand.slabInk`
only when the user explicitly asks — otherwise the contrast tips over.

Very pale or very dark brand colours do not carry this format. If the brand is a
light grey, say so and propose the strongest colour in the brand set.

## Step 3 — Set up the project

`<project>` is a short kebab-case name derived from the topic.

```bash
npx hyperframes init videos/<project> --non-interactive --example=blank
cp -R <SKILL_DIR>/template/build.mjs <SKILL_DIR>/template/brand.mjs \
      <SKILL_DIR>/template/content.json <SKILL_DIR>/template/assets videos/<project>/
```

Always copy the scripts and the font **into the project**. Never run them out of
the skill folder: the finished video project has to keep rendering even if this
skill is later updated or uninstalled.

## Step 4 — Brand colour from a website (route 2 only)

```bash
cd videos/<project>
node brand.mjs https://clientsite.com          # show only
node brand.mjs https://clientsite.com --write  # write into content.json
```

The script reads the page and its stylesheets and ranks the colours: a declared
brand variable (`--brand`, `--primary`, `--accent`) beats everything, then
`<meta name="theme-color">`, then frequency in the CSS. It shows the six best
hits.

**Show the user the list before you run `--write`.** The script can pick up an
accent colour that appears on the site in one button only. That decision is
theirs, not the ranking's.

If it finds nothing usable — which happens with sites that bundle their CSS into
JavaScript — it exits with a message. Then ask the user for the hex value. Do not
build a fallback around it.

## Step 5 — Write the content

`videos/<project>/content.json`:

```json
{
  "text": "Your running text. One sentence, two sentences, commas welcome.",
  "brand": { "bg": "#FAC143" },
  "speed": 1,
  "width": 1920,
  "height": 1080
}
```

Optional:

- `speed` — pace. `1.2` is twenty percent faster, `0.85` slower.
- `fontSize` — overrides the computed type size in px. Only touch it when the
  user wants more words per line: smaller type means longer lines. At 1920 px
  wide, 171 px is the reference value; 150 px usually fits one more word per line
  for German text.
- `width` / `height` — e.g. `1080` × `1920` for portrait. The type size scales
  with it.

## Step 6 — Build, check, render

```bash
cd videos/<project>
node build.mjs
npx hyperframes check .
npx hyperframes render . -q high -o ./renders/video.mp4
```

`build.mjs` prints the runtime, the type size and the finished split phrase by
phrase. **Read that list before you render** — it shows immediately whether the
break has mangled the sentence. If a phrase sits badly, change the text (one more
comma, one shorter word), not the `STYLE` block.

For this format `check` reports two warnings that are supposed to be there:
`timeline_track_too_dense` (every phrase is its own clip) and a few contrast
warnings (the checker measures the white copy against the background rather than
against the bar that is actually behind it). Errors must not appear.

## What not to touch

The `STYLE` block in `build.mjs` holds the values measured off the reference —
slant, bar height, line spacing, padding — all in em, so a single type size
scales the entire design. Change only what the user explicitly asks for.

Two things are connected and may only be changed together:

- **`font-kerning: none` and `font-variant-ligatures: none` in the generated
  CSS.** They are the only reason the sum of the widths from
  `assets/metrics/poppins-500.json` matches exactly what the browser sets.
  Without them every bar drifts a few pixels away from its word, and no check
  catches it.
- **Typeface and width table.** A different font needs a new
  `poppins-500.json` (advance widths in em, measured with kerning off) and new
  values for `baselineFromTop`, `cap`, `ascender` and `descender`. The header of
  the JSON says how they were measured.

## Afterwards

Show the user the rendered MP4. For another text in the same style it is enough
to change `content.json` and run `node build.mjs` again.
