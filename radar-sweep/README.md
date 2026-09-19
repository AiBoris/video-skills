# Radar Sweep — a skill for AI agents

Builds videos with a rotating radar dish: rings snap open, a search beam sweeps
with a trailing wake, contacts flash amber. Dark, technical, silent, 4 to 12
seconds.

> **New here? Read SETUP.md** — step by step, no prior knowledge needed.
> This is the short version.

## Install

```bash
npx skills add AiBoris/video-skills@radar-sweep --global --copy --all
```

To get all seven skills instead, drop the `@radar-sweep`. Restart your AI agent
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

> Make me a radar video with the headline “We find engineers for Nexora Automation”

It asks for the headline, format and colour variant, sets up the project and renders the MP4.

## The real trick: the series

`title` may contain `{name}`. Put a list of companies in `names` and the skill
builds one video per name — same dish, same contacts, same motion, only the name
in the title changes.

```json
{
  "title": "We find engineers for {name}",
  "names": ["Nexora Automation", "Veltrix Systems"]
}
```

That is what the format is built for: personalised first-contact videos where the
recipient sees themselves in the crosshairs.

## Settings

| Field | Default | Alternatives |
| --- | --- | --- |
| `format` | `16:9` | `9:16`, `1:1`, `4:5` |
| `preset` | `gruen` | `bernstein`, `blau`, `rot` |
| `duration` | `6` | 3 to 20 seconds |
| `blips` | `9` | 1 to 24 contacts |
| `crosshair` / `scanlines` | `true` | `false` |

## Limits

- The headline may run to **three lines at most**, or it collides with the dish.
  `build.mjs` warns.
- The beam needs **3.7 seconds per revolution**. Below 5 seconds of runtime some
  contacts never light up.
- No audio, no real maps, no real coordinates — the running values in the bottom
  right are set dressing.

## What is in here

```
SETUP.md                  setup for beginners
SKILL.md                  instructions for the agent
template/
  build.mjs               generator + every measured style value
  content.json            example content
  assets/fonts/           Inter and JetBrains Mono (bundled so renders work
                          offline and look identical everywhere)
```

Every project gets its own copy of `build.mjs` and the assets, so a finished
video still renders years later even if this skill is updated or removed.
