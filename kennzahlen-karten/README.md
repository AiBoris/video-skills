# KPI Cards — a skill for AI agents

Builds KPI dashboard videos: cards slide in from below in a staggered wave, each
big number counts up, a coloured badge shows the change and a sparkline sits at
the bottom of the card. Dark navy, silent, about 4 to 6 seconds.

> **New here? Read SETUP.md** — step by step, no prior knowledge needed.
> This is the short version.

## Install

```bash
npx skills add AiBoris/video-skills@kennzahlen-karten --global --copy --all
```

To get all seven skills instead, drop the `@kennzahlen-karten`. Restart your AI agent
afterwards.

- `--copy` copies instead of linking, `--global` installs for every project,
  `--all` skips the prompts.

## Requirements

Node.js 22 or newer (`node --version`), FFmpeg (`ffmpeg -version`) and the
HyperFrames CLI:

```bash
brew install ffmpeg          # Mac; Windows: winget install ffmpeg
npx skills add heygen-com/hyperframes --global --copy --all
```

## Use it

Just tell your agent:

> Make me a KPI video from these quarterly figures

It asks for for your numbers — or researches them and shows you the table for approval, sets up the project and renders the MP4.

## The trick

Six cards are six statements. If all six say the same thing in different units,
you have built a dashboard, not a story.

A good mix is three kinds: the **headline number**, a **comparison** (the same
measure for another model, country or quarter), and a **context number** from a
different dimension. **Four to six cards is the sweet spot** — three looks empty,
past nine nobody reads everything in four seconds.

## Two lines under each number

`note` says **what** the number is (“estimated global units”). `meta` says
**where it comes from** (“Q2 2026 · IDC”). Keeping them apart is what lets this
format carry numbers that need explaining — and it is what keeps a derived figure
from being read as a reported one.

## Any language

Language is just content. Translate the labels, set `locale` (`en` → `16.6` and
`1,200`; `de` → `16,6` and `1.200`) and translate the units in `suffix` along
with them.

## Limits

- Runtime follows the card count: 6 cards ≈ 4.3 s, 9 cards ≈ 4.9 s
- Three formats: 16:9, portrait, square
- Six colours — from the seventh card on they repeat
- All numbers share one type size, set by the longest one
- The sparkline is decoration unless you supply real values in `trend`
- No audio

## What is in here

```
SETUP.md                  setup for beginners
SKILL.md                  instructions for the agent
template/
  build.mjs               generator + every measured style value
  csv-to-data.mjs         CSV -> data.json
  data.example.json       example data set
```

Every project gets its own copy of `build.mjs` and the assets, so a finished
video still renders years later even if this skill is updated or removed.
