# video-skills

Seven skills that turn a line of text into a finished, rendered video — for AI
agents like Claude Code, Codex, Cursor, Gemini CLI or Windsurf.

Every skill was measured off a real reference render: timing, spacing, colours
and easing are baked into the generator. You write the content, the agent sets
up the project and renders the MP4.

Built on [HyperFrames](https://github.com/heygen-com/hyperframes).

## Install

All seven at once:

```bash
npx skills add AiBoris/video-skills --global --copy --all
```

Just one of them:

```bash
npx skills add AiBoris/video-skills@google-suche --global --copy --all
```

Restart your agent afterwards.

> `--copy` copies instead of linking, `--global` installs for every project,
> `--all` skips the prompts.

### Requirements

- **Node.js 22 or newer** — `node --version`
- **FFmpeg** — `ffmpeg -version`; this is what writes the video file at the end.
  Mac: `brew install ffmpeg`, Windows: `winget install ffmpeg`
- **the HyperFrames CLI:**

```bash
npx skills add heygen-com/hyperframes --global --copy --all
```

Chrome you do not have to worry about — HyperFrames downloads it on the first
render.

## The skills

| Skill | What it builds | What you feed it |
| --- | --- | --- |
| **google-suche** | A question types itself into the Google search box, a pointer clicks “Google Search”. The start page is rebuilt pixel for pixel. 16:9, 9:16, 1:1, 4:5. | a search query |
| **wort-highlight** | Kinetic typography: a slanted bar travels word by word through the sentence, flipping the word underneath to white. | a claim or a hook |
| **radar-sweep** | A radar dish in the dark: rings snap open, a beam sweeps with a trailing wake, contacts flash. Can build a whole series — one video per company name. | a headline, optionally a list of names |
| **typewriter-liste** | A numbered list types itself onto a sheet of paper, character by character. Typewriter look. | claims, excuses, rules |
| **balken-race** | Bar chart race: bars grow, overtake each other and swap places while the numbers count along. | a CSV or a table |
| **kennzahlen-karten** | KPI dashboard: cards slide in staggered, numbers count up, badges show the change. | a handful of KPIs |
| **testimonial-karten** | Customer quotes as glass cards: golden stars, the quote writes itself in, the key phrase glows gold. | quotes, a CSV or a review profile |

All of them render silent MP4s. Runtime follows the content in each case.

## Use it

Tell your agent what you want:

> Make me a Google search video with the question “How do I make videos with AI?”

> Build a bar chart race from this CSV

It picks the right skill, asks what it needs, sets up the project and renders the
MP4.

## A note on language

The docs are English; the skills themselves are language-agnostic and the
`description` lines carry both English and German trigger phrases, so prompting
in either language routes correctly. Four skill names are still German
(`wort-highlight`, `balken-race`, `kennzahlen-karten`, `testimonial-karten`) —
renaming them would break existing installs, so they stay as they are.

## How a skill is built

Every skill has the same shape:

```
<skill>/
  SKILL.md        instructions for the agent
  README.md       the short version, for humans
  SETUP.md        step by step, no prior knowledge needed
  template/
    build.mjs     generator + every measured style value
    ...           example content, fonts, assets
```

`build.mjs` is **copied into the video project** when building, never run out of
the skill folder. That way a finished project still renders even if the skill is
later updated or removed.

## Licence and third-party content

The code is MIT licensed (see `LICENSE`).

The bundled fonts are under the SIL Open Font License and may be redistributed —
Inter, Courier Prime, Poppins and JetBrains Mono. They ship locally so renders
work offline and look identical everywhere.

`google-suche/template/assets/google-logo.svg` is Google's wordmark. The skill
uses it to build a recognisable restaging of the Google start page — usual
practice for mockups, hooks and editorial video, but it remains someone else's
trademark. Do not use it for advertising that implies Google is affiliated with
you or endorses you.
