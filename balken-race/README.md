# Bar Chart Race — a skill for AI agents

Builds videos in which horizontal bars grow, overtake each other and swap places
while the numbers count along. Dark navy background, six gradients, silent.

> **New here? Read SETUP.md** — step by step, no prior knowledge needed.
> This is the short version.

## Install

```bash
npx skills add AiBoris/video-skills@balken-race --global --copy --all
```

To get all seven skills instead, drop the `@balken-race`. Restart your AI agent
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

> Build a bar chart race from this CSV

It asks for for your data — or researches the numbers and shows you the table for approval, sets up the project and renders the MP4.

## The trick

A bar chart race lives on **overtaking**. If the order never changes, you have
built a bar chart that slowly gets bigger, and that is not worth a video.

Before building, check the data against one question: **does first place change
at least once?** If not — go further back in time, pick a different metric
(growth or market share change order far more often than absolute revenue), or
drop the perennial leader and show the race behind them.

8 to 20 participants with `visibleRows: 10` gives the best effect: bars drive in
from below and push others out of frame.

## Runtime

Follows the data. 6 periods ≈ 6.5 s, 24 periods ≈ 25 s — nothing to configure.

Too long? Use **fewer periods** (every second year instead of every year) rather
than a faster pace. Below about 0.6 s per period the eye can no longer follow the
rank changes, and those are the content.

## Limits

- Three formats: 16:9, portrait, square
- Six colours — from the seventh series on they repeat; set `color` per series
- Negative values are not supported
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
