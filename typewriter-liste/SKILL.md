---
name: typewriter-liste
description: "Builds a video in which a numbered list types itself onto a sheet of paper, character by character — typewriter look, paper texture, silent, 16:9, about 10-20 s. Use it when someone wants claims, excuses, rules or a narrative as a typed list in a video: 'typewriter video', 'typed list video', 'list that types itself', 'typewriter list', 'Typewriter-Video', 'getippte Liste', 'Schreibmaschinen-Video', 'Liste die sich tippt'. Not for narrated explainers, subtitles or product promos. Requires the HyperFrames CLI."
---

# Typewriter List

A numbered list types itself onto a sheet of paper, character by character.
No audio, no narrator, no images — the list is the entire video.

Style, timing and paper texture were measured off a reference clip and are baked
into `template/build.mjs`. You only write the content.

## Check the requirement first

```bash
npx hyperframes --version
```

If that fails, stop and tell the user:

> This skill needs the HyperFrames CLI. Install it with:
> `npx skills add heygen-com/hyperframes --global --copy --all`

Do not guess your way around it and do not build a substitute.

## Step 1 — Settle the content

Ask the user whether they **supply the text** or name a **topic**.

For a topic you write the list yourself and put it in front of them for approval
before you build anything.

### The editorial rule — the most important thing about this format

The format only works when the list is **somebody's argument**, recorded deadpan,
and **tips over at the end**. The nesting at the bottom (`4.` → `A.` `B.`) is the
mechanism for that: the justification exposes itself.

A tidy enumeration of facts is dead in this look. If the last item does not make
anyone grin or wince, the list is not finished.

An example of the shape:

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

### Hard limits

Stick to these or the text runs out of frame:

- **Uppercase only.** Lowercase runs, but it breaks the look.
- **44 characters per line maximum.**
- **9 lines maximum** including the title.
- Accented characters are fine and need no rewriting.

## Step 2 — Set up the project

`<project>` is a short kebab-case name derived from the topic.

```bash
npx hyperframes init videos/<project> --non-interactive --example=blank
cp -R <SKILL_DIR>/template/build.mjs <SKILL_DIR>/template/assets videos/<project>/
```

Always copy `build.mjs` and the font **into the project**. Never run them out of
the skill folder: the finished video project has to keep rendering even if this
skill is later updated or uninstalled.

## Step 3 — Write the content

`videos/<project>/content.json`:

```json
{
  "title": "YOUR HEADING",
  "lines": [
    { "text": "1. FIRST POINT" },
    { "text": "2. SECOND POINT" },
    { "text": "A. SUB-POINT", "sub": true }
  ]
}
```

`"sub": true` indents the line and pulls it closer to the one above — that is how
you build the punchline at the end of the list.

## Step 4 — Build, check, render

```bash
cd videos/<project>
node build.mjs
npx hyperframes check .
npx hyperframes render . -q high -o ./renders/video.mp4
```

`build.mjs` prints the runtime and the margin, and **warns** when the block gets
too tall for the frame. Take the warning seriously and shorten the list instead
of ignoring it.

Runtime, line positions, caret timing and the vertical centring are all computed
from the text. At any line count the top and bottom margins stay equal.

## What not to touch

The `STYLE` block in `build.mjs` holds the measured values from the reference.
Change only what the user explicitly asks for.

One value is especially delicate: `capTopInBox()` is fitted to two measured
points (55 px and 81 px type size). Anyone changing `bodySize` or `titleSize`
**must re-measure both points** — otherwise the vertical centring drifts without
any check catching it. The comment in the code says how.

## Afterwards

Show the user the rendered MP4. For another list in the same style it is enough
to change `content.json` and run `node build.mjs` again.
