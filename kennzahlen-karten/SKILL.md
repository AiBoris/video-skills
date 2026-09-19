---
name: kennzahlen-karten
description: "Builds a KPI dashboard as a video: cards slide in from below in a staggered wave, the big number in each card counts up, a coloured badge shows the change, and a sparkline sits at the bottom of the card. Dark navy background, six colours, no audio, about 4-6 s. Use it when someone wants numbers as an overview in a video: 'KPI cards video', 'metrics dashboard video', 'stat cards', 'quarterly figures video', 'numbers as video', 'Kennzahlen-Video', 'KPI-Karten', 'Dashboard-Video', 'Quartalszahlen'. All labels, units, language and number formats live in data.json and are freely changeable. Not for rankings over time (use balken-race for that), not for narrated videos or subtitles. Requires the HyperFrames CLI."
---

# KPI Cards

A grid of cards on a dark ground. Each card carries a label, a badge with the
change, a big number counting from 0 up to its value, below that two optional
lines (what the number is, and which period and source it comes from) and a
coloured sparkline along the bottom edge. The cards arrive staggered, then the
picture holds still. No audio, no narrator, no images.

Design and timing were measured off a reference clip and are baked into
`template/build.mjs`. You only supply numbers and labels.

**The runtime follows the card count.** 6 cards ≈ 4.3 s, 9 cards ≈ 4.9 s. Nothing
to configure.

## Check the requirement first

```bash
npx hyperframes --version
```

If that fails, stop and tell the user:

> This skill needs the HyperFrames CLI. Install it with:
> `npx skills add heygen-com/hyperframes --global --copy --all`

Do not guess your way around it and do not build a substitute.

## Step 1 — Get the numbers

There are exactly two routes. Establish which one applies first.

### Route A — the user has numbers

A CSV, a table in the chat, a screenshot of a dashboard. Take it and go to step 2.

### Route B — the user only names a topic

Then you research the numbers yourself. Four rules:

1. **Name the source** and the period — in the subtitle and the footnote of the
   video, and in the chat.
2. **Separate measured from estimated.** If a number is not reported and you
   derive it, the word “estimated” belongs in the card's `note` and the
   derivation in its `meta` — not only in the footnote. Numbers in a video look
   like facts, and wrong numbers in a video are something nobody catches.
3. **One period for all cards.** Two cards from different quarters sitting side
   by side read as the same snapshot, which is misleading. If it cannot be
   avoided, the period has to appear in the label.
4. **Put the table in front of the user for approval before you build.**

### The editorial rule — the most important thing about this format

Six cards are six statements. If all six are the same statement in different
units, you have built a dashboard and not a story.

Before building, check the selection against this question:

> **Does each card say something the others do not already say?**

A good mix is three kinds of card:

- **The headline number** — what this is about, usually first and with the
  strongest badge.
- **The comparison** — the same measure for another model, country or quarter.
- **The context number** — something from a different dimension that puts the
  headline in proportion (revenue next to units, users next to revenue).

**Four to six cards is the sweet spot.** At three the grid looks empty; past nine
nobody reads everything in four seconds. If the user has more numbers, ask which
are the most important rather than cramming them all in.

## Step 2 — Set up the project

`<project>` is a short kebab-case name derived from the topic.

```bash
npx hyperframes init videos/<project> --non-interactive --example=blank
cp <SKILL_DIR>/template/build.mjs <SKILL_DIR>/template/csv-to-data.mjs videos/<project>/
```

Always copy the scripts **into the project**. Never run them out of the skill
folder: the finished video project has to keep rendering even if this skill is
later updated or uninstalled.

## Step 3 — Get the numbers into `data.json`

### From a CSV

```bash
cd videos/<project>
node csv-to-data.mjs /path/to/file.csv data.json
```

It expects a header row. Only `label` and `value` are required:

```
label;value;suffix;delta;tone
iPhone 17;16.6; M;6 % world share;up
iPhone 17 Pro Max;12.4; M;rank 2;flat
```

German column names (`Beschriftung`, `Wert`, `Einheit`, `Delta`, `Trend`,
`Farbe`) are recognised too, as are semicolon or comma separators and German
decimal commas and thousands dots.

Afterwards fill in `title`, `subtitle` and `footnote` — the converter writes
`TODO` there.

### By hand

```json
{
  "title": "iPhone 17 in numbers",
  "subtitle": "Second quarter 2026 · units, revenue, ecosystem",
  "footnote": "Source: Counterpoint Research, Apple Q3/FY2026",
  "metrics": [
    {
      "label": "iPhone 17",
      "value": 16.6,
      "suffix": " M",
      "decimals": 1,
      "note": "estimated global units",
      "meta": "Q2 2026 · derived from 6 % market share",
      "trend": "up"
    },
    {
      "label": "iPhone revenue",
      "value": 54.3,
      "suffix": " bn $",
      "decimals": 1,
      "delta": "22 %",
      "deltaTone": "up",
      "note": "Apple iPhone segment",
      "meta": "Apple Q3/FY2026 (calendar Q2) · year over year"
    }
  ],
  "options": { "format": "landscape", "locale": "en" }
}
```

| Field | |
| --- | --- |
| `title` | Heading, top left. Keep it short. |
| `subtitle` | Period, unit, source. Optional. |
| `footnote` | Small line at the bottom edge, fading in last. The place for sources and estimates. Optional. |
| `metrics[].label` | What the number is. Truncated when too long — `build.mjs` warns. |
| `metrics[].value` | **Number** → counts up from 0. **Text** → stands still from the start. |
| `metrics[].prefix` | Before the number, e.g. `"$"`. |
| `metrics[].suffix` | After the number, with a leading space: `" M"`, `" %"`, `" bn $"`. |
| `metrics[].decimals` | Decimal places. Default: 1 for decimals, 0 for integers. |
| `metrics[].note` | Line under the number: **what** the number is. Optional. |
| `metrics[].meta` | Line below that, smaller and dimmer: **where** the number comes from — period, source, comparison basis. Optional. |
| `metrics[].delta` | Text in the badge top right, e.g. `"22 %"`, `"rank 2"`, `"150 M"`. Optional. |
| `metrics[].deltaTone` | `up` green with ▲, `down` red with ▼, `flat` grey with no arrow. Guessed from the sign of `delta` when omitted. |
| `metrics[].trend` | Shape of the sparkline: `"up"`, `"down"`, `"flat"` (level), `"none"` (no sparkline) or your own series like `[3, 5, 4, 9]`. Defaults to `deltaTone`. |
| `metrics[].color` | `indigo`, `cyan`, `amber`, `emerald`, `pink`, `violet` or hex. Default: palette order. |

### The two lines under the number

`note` and `meta` are the reason this format can carry numbers that need
explaining. Keep them strictly apart:

- **`note` says what the number is.** “estimated global units”, “worldwide
  smartphone shipments”, “views on your posts”.
- **`meta` says where it comes from.** Period, source, comparison basis:
  “Q2 2026 · IDC”, “7 days · vs. previous week”.

Three rules that make the difference between solid and misleading:

1. **Put the method in `note`, not in the footnote.** A derived number is
   “estimated units”, never “devices sold”. Whoever reads it in the video does
   not see the footnote.
2. **Use the source's own term.** IDC measures *shipments*, Counterpoint measures
   *sell-through*. The words are not interchangeable, and picking the wrong one
   is a factual error.
3. **State the period the way a reader can verify it.** For companies with an
   offset fiscal year, give both: “Apple Q3/FY2026 (calendar Q2)”.

Neither line **wraps** — they are truncated when too long, and `build.mjs` warns
beforehand. As soon as one card has a `note` or `meta`, every card reserves that
line so all the numbers sit on one baseline.

### Options

| Option | Default | |
| --- | --- | --- |
| `format` | `landscape` | `landscape` 1920×1080, `portrait` 1080×1920, `square` 1080×1080 |
| `columns` | from the card count | Grid columns. An incomplete last row is centred. |
| `locale` | `de` | `de` → `16,6` and `1.200`. `en` → `16.6` and `1,200`. **Set `"locale": "en"` for English videos** — the default is German. |
| `decimalSep` / `groupSep` | from `locale` | Overridable individually. `"groupSep": ""` turns thousands separators off. |
| `lang` | from `locale` | The document's `lang` attribute, which matters for hyphenation in other languages. |
| `stagger` | 0.21 | Gap between two card entrances. |
| `count` | 1.53 | How long a number counts up. |
| `hold` | 1.4 | How long the final state holds. |
| `cardAspect` | 0.62 | Card height as a share of card width. |

## Another language

Language is only content: translate `title`, `subtitle`, `footnote`, `label` and
`delta`, set `locale` to match (`en` for English number formatting), and
translate the units in `suffix` along with them — `" Mio."` becomes `" M"` or
`" million"`, `" Mrd. $"` becomes `" bn $"`.

For two language versions of the same video, create `data.de.json` and
`data.en.json` and build twice:

```bash
node build.mjs data.de.json && npx hyperframes render . -o ./renders/de.mp4
node build.mjs data.en.json && npx hyperframes render . -o ./renders/en.mp4
```

## Step 4 — Build, check, render

```bash
cd videos/<project>
node build.mjs data.json
npx hyperframes check .
npx hyperframes render . -q high -o ./renders/video.mp4
```

`build.mjs` prints the grid, card size and runtime, and **warns** when a label
does not fit its card or the numbers had to be scaled down. Take the warnings
seriously: both mean the text looks squashed or truncated in the video.

The most common case: `! Label "..." is too long`. Shorten the label rather than
forcing the type size down — `App downloads` instead of
`App Store downloads per year`; the rest belongs in `subtitle` or `footnote`.

## What not to touch

The `STYLE` block in `build.mjs` holds the values measured off the reference:
background gradient, card fill and border, every type size as a ratio of the card
width, the badge colours and the complete timing. Every line carries a comment
saying what it was measured from.

Three things are especially delicate:

- **The counter runs linearly** (`ease: "none"`), not with an ease-out. That was
  measured: in the reference the number rises at a constant rate (83.8 units per
  second toward a target of 128.4) and then clamps. An ease-out makes the last
  digits crawl and the card look finished before it is.
- **`stagger: 0.21`** is the spacing at which the cards read as one wave. Much
  smaller and it looks like a simultaneous flash; much larger and it looks like
  six separate fade-ins.
- **The background is a single, far-reaching gradient** from the top edge. A
  stronger or centred gradient produces visible rings (8-bit banding) across the
  large empty area.

Change only what the user explicitly asks for.

## Limits you should know about

- **From the seventh card on, colours repeat.** The palette has six colours, like
  the reference. Set `color` deliberately when two identically coloured cards end
  up adjacent.
- **All numbers share one type size**, set by the longest one. A single long
  number (`"1,284,500 units"`) therefore shrinks all six. Shorten it via the unit
  (`1.28 M units`).
- **`note` and `meta` cost the number size.** With both lines the number in a 3×2
  grid shrinks from roughly 75 to 61 px, because the card can only grow as tall
  as the grid allows. The sparkline gives up height first, then the number.
  `build.mjs` reports both.
- **The sparkline is decoration, not a chart.** Without your own series in
  `trend` its shape is invented and only indicates direction. If the user needs a
  real trend line, pass `trend` as a series of numbers — or use a chart format.
- **Negative values count from 0 downwards.** That works, but only looks good
  with a single negative card.

## Afterwards

Show the user the rendered MP4. For another data set in the same style it is
enough to change `data.json` and run `node build.mjs` again.
