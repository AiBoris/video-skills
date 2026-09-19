# Testimonial Cards — a skill for AI agents

Builds videos from real customer reviews: a title card, then one glass card per
quote — golden stars, the quote writing itself in word by word, the decisive
phrase glowing gold, name and source underneath — and a closing card with the
overall rating and your call to action. Silent.

> **New here? Read SETUP.md** — step by step, no prior knowledge needed.
> This is the short version.

## Install

```bash
npx skills add AiBoris/video-skills@testimonial-karten --global --copy --all
```

To get all seven skills instead, drop the `@testimonial-karten`. Restart your AI agent
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

> Make me a testimonial video from our Google reviews: <profile link>

It asks for four things first (person or company, how you are referred to in quotes, your call to action, your website), then fetches the reviews, sets up the project and renders the MP4.

You can also point it at a CSV, or just paste the quotes into the chat.

It shortens each quote to card length, proposes the one phrase that should glow
gold, and **puts everything in front of you for approval before it builds**.

## The rule the skill enforces

Every card needs a **focus phrase**: exactly one passage in the quote that glows
gold. Without one the generator refuses to build. A card with no focus is a grey
wall the eye slides off.

And quotes are only ever **shortened**, never reworded. These are real people's
words about a real business. If a shortened quote opens on “He …”, the agent
replaces the pronoun with the name — otherwise the quote points at nothing.

Stars are always **rounded up**; below 4.5 the generator warns.

## Formats

`landscape` 1920×1080 · `portrait` 1080×1920 · `square` 1080×1080 — via
`options.format` in `testimonials.json`.

## What is in here

```
SETUP.md                  setup for beginners
SKILL.md                  instructions for the agent
template/
  build.mjs                  generator + every measured style value
  csv-to-testimonials.mjs    CSV -> testimonials.json
  testimonials.example.json  example data set
  assets/fonts/              Inter, bundled for identical renders
```

Every project gets its own copy of `build.mjs` and the assets, so a finished
video still renders years later even if this skill is updated or removed.

## Legal

Reviews are statements by real people. They may be shortened but not edited in a
way that changes their meaning, and advertising with invented or distorted
reviews is illegal in most jurisdictions. Show only what is really there and name
the source. Platform logos are trademarks, which is why the skill writes the
source as text.
