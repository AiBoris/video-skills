# Google Search — a skill for AI agents

Builds videos in which a question types itself into the Google search box and a
mouse pointer then clicks “Google Search”. Silent, 6 to 10 seconds, in 16:9,
9:16, 1:1 or 4:5.

> **New here? Read SETUP.md** — step by step, no prior knowledge needed.
> This is the short version.

## Install

```bash
npx skills add AiBoris/video-skills@google-suche --global --copy --all
```

To get all seven skills instead, drop the `@google-suche`. Restart your AI agent
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

> Make me a Google search video with the question “How do I make videos with AI?”

It asks for the question, format, colour variant and button language, sets up the project and renders the MP4.

## Formats

`16:9` (1920×1080), `9:16` (1080×1920), `1:1` and `4:5` — via `format` in
`content.json`.

The page keeps its original pixel sizes in every format, which makes it look
small in portrait with a lot of air below. If the video has to be readable on a
phone, add `"scale": 1.5` and the search box fills the width.

## Three variants

| `theme` | Look |
| --- | --- |
| `cream` | warm cream — stands out most in a feed |
| `light` | the familiar white start page |
| `dark` | dark mode |

Buttons in English (“Google Search” / “I'm Feeling Lucky”) or German
(“Google Suche” / “Auf gut Glück!”). The pointer can click either one.

## The trick

It has to be the question your viewer **actually** types. Lowercase with no
punctuation reads more honestly than a polished sentence. A marketing phrase
(“Professional Video Production Agency”) kills the effect instantly.

## Limits

- About 60 characters, one line
- No audio, no results page, no navigation
- Runtime follows the character count
- In portrait `scale` tops out at 1.5, above that the box touches the edge

`build.mjs` warns when the question is too long for the box.

## What is in here

```
SETUP.md                  setup for beginners
SKILL.md                  instructions for the agent
template/
  build.mjs               generator + every measured style value
  content.json            example content
  assets/google-logo.svg  the original wordmark (bundled so renders work
                          offline and look identical everywhere)
```

Every project gets its own copy of `build.mjs` and the assets, so a finished
video still renders years later even if this skill is updated or removed.

## Legal

The bundled logo is Google's wordmark. Usual practice for mockups, hooks and
editorial video; not for advertising that implies Google endorses you.
