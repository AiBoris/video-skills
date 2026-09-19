# Word Highlight — a skill for AI agents

Builds kinetic typography videos: a full-bleed colour background, two lines of
bold type, and a slanted dark bar travelling word by word through the sentence,
flipping the word underneath to white. Silent.

> **New here? Read SETUP.md** — step by step, no prior knowledge needed.
> This is the short version.

## Install

```bash
npx skills add AiBoris/video-skills@wort-highlight --global --copy --all
```

To get all seven skills instead, drop the `@wort-highlight`. Restart your AI agent
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

> Make me a word-highlight video from this text: … — in our blue #1B6EF3

It asks for the text and the colour, sets up the project and renders the MP4.

## The colour

Three ways in:

| Way | What you say |
| --- | --- |
| Give it | “in #1B6EF3” — any hex value from your style guide |
| From a website | “take the colour from clientsite.com” |
| Reference | say nothing — you get the template's yellow `#FAC143` |

You only ever specify the **background**. Type and bar are derived from it: light
background → near-black type, dark background → light type. That keeps the
contrast readable in any brand colour.

## The text

- **15 to 40 words.** Roughly 0.45 seconds per word: 25 words ≈ 14 seconds.
- **Short main clauses.** Full stops, commas, dashes and colons are the cuts.
  To control where the line breaks, place a comma.
- **No line breaks in your text.** The skill sets those.

## Limits

- At most two lines on screen at once
- One colour, no audio, no narrator, no images
- 16:9 or portrait

## What is in here

```
SETUP.md                  setup for beginners
SKILL.md                  instructions for the agent
template/
  build.mjs               generator + every measured style value
  brand.mjs               reads the brand colour off a website
  content.json            example content
  assets/fonts/           Poppins Medium, bundled
  assets/metrics/         character widths for the line breaking
```

Every project gets its own copy of `build.mjs` and the assets, so a finished
video still renders years later even if this skill is updated or removed.
