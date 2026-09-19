# Typewriter List — a skill for AI agents

Builds videos in which a numbered list types itself onto a sheet of paper,
character by character. Typewriter look, silent, 16:9.

> **New here? Read SETUP.md** — step by step, no prior knowledge needed.
> This is the short version.

## Install

```bash
npx skills add AiBoris/video-skills@typewriter-liste --global --copy --all
```

To get all seven skills instead, drop the `@typewriter-liste`. Restart your AI agent
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

> Make me a typewriter list video about excuses in sales

It asks for whether you supply the text or it should be written; for a topic it drafts the list for your approval, sets up the project and renders the MP4.

## The trick

The list has to be *somebody's argument* and it has to tip over at the end. A
neutral enumeration looks lifeless in this style. The nesting at the bottom
(`4.` → `A.` `B.`) is the mechanism: the justification exposes itself.

```
WHY WE ARE STILL WAITING
1. DATA PROTECTION
2. OUR INDUSTRY IS DIFFERENT
3. THE TEAM WILL NOT GO ALONG
4. FIRST IT DEPENDS ON:
   A. CLEANING UP THE PROCESSES
   B. THE PRIVACY REVIEW
5. NEXT YEAR THEN, REALLY
```

## Limits

- Uppercase only
- Max. 44 characters per line
- Max. 9 lines including the heading

`build.mjs` warns when it gets too tight.

## What is in here

```
SETUP.md                  setup for beginners
SKILL.md                  instructions for the agent
template/
  build.mjs               generator + every measured style value
  content.json            example content
  assets/fonts/           Courier Prime (bundled so renders work offline and
                          look identical everywhere)
```

Every project gets its own copy of `build.mjs` and the assets, so a finished
video still renders years later even if this skill is updated or removed.
