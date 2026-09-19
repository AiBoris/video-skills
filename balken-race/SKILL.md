---
name: balken-race
description: "Builds a bar chart race: horizontal bars grow, overtake each other and swap places while the numbers count along. Dark navy background, six gradients, no audio. Use it when someone wants a ranking over time as a video: 'bar chart race', 'racing bars', 'ranking video', 'chart video', 'data as video', 'CSV as video', 'which country/product/team leads when', 'Balken-Race', 'Balkenrennen', 'Ranking-Video', 'Daten als Video'. The data source is a CSV, a table, or AI research. Not for single-value animations, pie charts or line charts. Requires the HyperFrames CLI."
---

# Bar Chart Race

Horizontal bars grow, overtake each other and swap places. The leader always
fills the full width and the number at the end of the bar counts along. No audio,
no narrator, no images — the movement of the ranking is the whole video.

Design, timing and colours were measured off a reference clip and are baked into
`template/build.mjs`. You only supply the data.

**The runtime follows the amount of data.** More periods = longer video, with
nothing to configure. 6 periods ≈ 6.5 s, 24 periods ≈ 25 s.

## Check the requirement first

```bash
npx hyperframes --version
```

If that fails, stop and tell the user:

> This skill needs the HyperFrames CLI. Install it with:
> `npx skills add heygen-com/hyperframes --global --copy --all`

Do not guess your way around it and do not build a substitute.

## Step 1 — Get the data

There are exactly two routes. Establish which one applies first.

### Route A — the user has data

A CSV, an Excel export, a table in the chat. Take it and go to step 2.

### Route B — the user only names a topic

Then you research the numbers yourself. Three rules:

1. **Name the source** and the year the numbers come from — in the video's
   subtitle and in the chat.
2. **Do not invent intermediate years.** If you have solid values for 2010 and
   2020 but not for the years in between, use two periods rather than eleven
   made-up ones. A bar chart race interpolates smoothly between values anyway.
3. **Put the table in front of the user for approval before you build.** Numbers
   in a video look like facts, and wrong numbers in a video are something nobody
   catches.

### The editorial rule — the most important thing about this format

A bar chart race lives on **overtaking**. If the order stays the same across all
periods, you have not built a race but a bar chart that slowly gets bigger — and
that is not worth a video.

Before building, check the data against this one question:

> **Does first place change at least once?**

If not, one of these is the way out:

- **A different window.** Go further back, until the riser was still behind.
- **A different metric.** Absolute revenue rarely changes the order; growth or
  market share often does.
- **Different participants.** Drop the perennial market leader and show the race
  behind them.
- **A different format.** Tell the user honestly that their data does not make a
  race and propose a plain bar chart or another presentation. That beats
  delivering a dead video.

8–20 participants with `visibleRows: 10` gives the best effect: bars drive in
from below and push others out of frame.

## Step 2 — Set up the project

`<project>` is a short kebab-case name derived from the topic.

```bash
npx hyperframes init videos/<project> --non-interactive --example=blank
cp <SKILL_DIR>/template/build.mjs <SKILL_DIR>/template/csv-to-data.mjs videos/<project>/
```

Always copy the scripts **into the project**. Never run them out of the skill
folder: the finished video project has to keep rendering even if this skill is
later updated or uninstalled.

## Step 3 — Get the data into `data.json`

### From a CSV

```bash
cd videos/<project>
node csv-to-data.mjs /path/to/file.csv data.json
```

It expects the first column to be the name and every further column to be one
period in chronological order.

```
Country,2020,2021,2022,2023
Germany,412,455,501,548
France,388,431,489,540
```

The long format (`name,period,value` — one row per data point) is detected and
pivoted automatically. Semicolon separators, German decimal commas and thousands
dots, `€`, `%` and empty cells are all handled.

Afterwards fill in `title` and `subtitle` — the converter writes `TODO` there.

### By hand

```json
{
  "title": "Market share Europe",
  "subtitle": "Revenue by country · € bn · Source: Eurostat 2024",
  "valueSuffix": " bn",
  "periods": ["2020", "2021", "2022", "2023"],
  "series": [
    { "name": "Germany", "values": [412, 455, 501, 548] },
    { "name": "France", "values": [388, 431, 489, 540] }
  ],
  "options": { "format": "landscape", "visibleRows": 6 }
}
```

| Field | |
| --- | --- |
| `title` | Heading. Keep it short — long titles are scaled down automatically. |
| `subtitle` | What the numbers are, their unit, and for researched data the source. Optional. |
| `valueSuffix` | Appended to every number, e.g. `" bn"`, `" %"`. |
| `periods` | Labels. Only needed for `showPeriodLabel`, but useful as a self-check. |
| `series[].name` | Shown to the left of the bar. |
| `series[].values` | One value per period. `null` means “not in the race yet”. |
| `series[].color` | Optional. Hex (`"#F0910B"`) or `orange`, `violet`, `pink`, `indigo`, `cyan`, `green`. |

### Options

| Option | Default | |
| --- | --- | --- |
| `format` | `landscape` | `landscape` 1920×1080, `portrait` 1080×1920, `square` 1080×1080 |
| `visibleRows` | 6 (capped at the series count) | How many bars are on screen at once |
| `decimals` | 0 | Decimal places on the numbers |
| `secondsPerPeriod` | 0.9 | Pace. **Only touch this when the user dictates the length.** |
| `hold` | 0.65 | How long the final state holds before fading |
| `showPeriodLabel` | off | Shows the current period bottom right |

## Step 4 — Build, check, render

```bash
cd videos/<project>
node build.mjs data.json
npx hyperframes check .
npx hyperframes render . -q high -o ./renders/video.mp4
```

`build.mjs` prints series, periods and the computed runtime, and **warns** when
the video runs past 90 seconds or the title is too long. Take the warnings
seriously.

If `build.mjs` aborts, the message says exactly which series is the problem. The
usual cause: series with different numbers of values — every series needs a value
for **every** period, with gaps as `null`.

## When the runtime does not fit

The runtime is `0.85 s lead-in + (periods − 1) × 0.9 s + 0.65 s hold + 0.5 s fade`,
stretched slightly above six visible rows.

If the user wants it **shorter**, the first move is **fewer periods** (every
second year instead of every year), not a smaller `secondsPerPeriod`. Below about
0.6 s per period the eye can no longer follow the rank changes, and those are the
content.

## What not to touch

The `STYLE` block in `build.mjs` holds the values measured off the reference:
gradients, bar height, corner radius, the light pill at the start of the bar, the
coloured glow beneath it, the growth curve of the lead-in and the easing shape of
the rank changes. Every line carries a comment saying what it was measured from.

Change only what the user explicitly asks for.

Two values are especially delicate:

- **`introExponent: 0.9`** is fitted to four measured points on the growth curve.
  Other values make the bars visibly start wrong.
- **The rank changes use a cubic in-out curve**, not a smoothstep. That was
  measured: in the reference the peak speed of a swap is roughly three times its
  average. Smoothstep only reaches 1.5× and makes the rows creep along instead of
  swapping.

## Limits you should know about

- **From the seventh series on, colours repeat.** The palette has six colours,
  like the reference. With many participants two identically coloured bars can
  end up adjacent. If that bothers, set `color` per series.
- **During an overtake two rows cross** and briefly overlap. The reference does
  the same; it is not a bug.
- **Negative values are not supported.** The bar measures from zero to the right.
  With negative data, say so to the user rather than silently clamping to 0.

## Afterwards

Show the user the rendered MP4. For another data set in the same style it is
enough to change `data.json` and run `node build.mjs` again.
