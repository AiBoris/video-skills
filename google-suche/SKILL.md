---
name: google-suche
description: "Builds a video in which a question types itself character by character into the Google search box and a mouse pointer then clicks 'Google Search'. The Google start page is rebuilt pixel for pixel (original wordmark, magnifier, microphone, pill-shaped search field), silent, about 6-10 s, in 16:9, 9:16, 1:1 or 4:5. Use it when someone wants the moment of searching as a video: 'Google search video', 'search bar typing video', 'someone googles this', 'search query animation', 'typing into Google', 'Google-Suche als Video', 'Frage wird gegoogelt', 'Suchleiste tippt sich'. Typical use: a video hook in which the audience sees their own question on screen. Not for results pages, screen recordings of real websites, or narrated explainers. Requires the HyperFrames CLI."
---

# Google Search

An empty Google start page. The caret blinks, a question types itself into the
search box character by character, a mouse pointer glides in, settles on
“Google Search”, clicks — and then nothing else happens.

No audio, no results page, no navigation. The hook is the question.

Geometry, colours and timing were measured off a reference screenshot and are
baked into `template/build.mjs`. You only write the question.

## Check the requirement first

```bash
npx hyperframes --version
```

If that fails, stop and tell the user:

> This skill needs the HyperFrames CLI. Install it with:
> `npx skills add heygen-com/hyperframes --global --copy --all`

Do not guess your way around it and do not build a substitute.

## Step 1 — Settle the question

Ask the user for the **exact search query**. It is the entire content of the
video, so take it word for word and do not rephrase it.

If they only name a topic, propose two or three phrasings and let them pick
before you build anything.

### The editorial rule

The format works because the viewer recognises themselves in the typing. It has
to be the question they **actually** enter — not the one marketing would prefer.

- Good: `How do I make videos with AI?`
- Good: `why is my landing page not converting`
- Dead: `Professional Video Production Agency Premium`

Lowercase with no punctuation often reads more honestly than a clean sentence.
Ask the user which they want — both work.

### Hard limits

- **About 60 characters max.** `build.mjs` computes the limit for the chosen
  format and `scale` and warns. Longer text is clipped on the left exactly like
  a real input field — that looks deliberate but is rarely what was wanted.
- **One line**, no line breaks.
- Accented characters and emoji work.

## Step 2 — Settle the look

Only ask these if the user has not already said. Otherwise take the default.

| Field    | Default  | Alternatives                                           |
| -------- | -------- | ------------------------------------------------------ |
| `format` | `16:9`   | `9:16`, `1:1`, `4:5`                                   |
| `scale`  | `1`      | 0.4 to 3 — enlarges the page without moving it         |
| `theme`  | `cream`  | `light` (white start page), `dark` (dark mode)         |
| `labels` | English  | German: `"Google Suche"` / `"Auf gut Glück!"`          |
| `click`  | `search` | `lucky` — the pointer clicks the other button instead  |

`cream` is the warm variant from the reference and stands out far more in a feed
than the familiar white. Take it when in doubt.

### Format and `scale` are connected

The page keeps its measured pixel sizes in every format; only the vertical
positions move proportionally. In 16:9 that is exactly the reference. In 9:16 it
becomes the desktop page inside a narrow frame — very small type, a lot of air
below.

Sometimes that is precisely the look you want. For a reel that has to be readable
on a phone it is not. Then raise `scale`:

| Format | `scale` | Result                                                     |
| ------ | ------- | ---------------------------------------------------------- |
| `16:9` | `1`     | the reference, unchanged                                   |
| `9:16` | `1`     | desktop page in portrait — small, lots of white space      |
| `9:16` | `1.5`   | search box fills the width, question readable (**pick this**) |
| `1:1`  | `1.3`   | balanced for a feed                                        |

At 1080 px wide, `1.5` is the maximum before the box touches the edge.
`build.mjs` warns when it gets too tight — take the warning seriously.

In portrait, actively ask the user which of the two they want. When in doubt
build both: it costs one more `node build.mjs` and one more render.

## Step 3 — Set up the project

`<project>` is a short kebab-case name derived from the question.

```bash
npx hyperframes init videos/<project> --non-interactive --example=blank
cp -R <SKILL_DIR>/template/build.mjs <SKILL_DIR>/template/content.json <SKILL_DIR>/template/assets videos/<project>/
```

Always copy `build.mjs` and `assets/` **into the project**. Never run them out of
the skill folder: the finished video project has to keep rendering even if this
skill is later updated or uninstalled.

## Step 4 — Write the content

`videos/<project>/content.json`:

```json
{
  "query": "How do I make videos with AI?",
  "format": "16:9",
  "scale": 1,
  "theme": "cream",
  "labels": {
    "search": "Google Search",
    "lucky": "I'm Feeling Lucky"
  },
  "click": "search"
}
```

## Step 5 — Build, check, render

```bash
cd videos/<project>
node build.mjs
npx hyperframes check .
npx hyperframes render . -q high -o ./renders/video.mp4
```

`build.mjs` prints the typing duration, the click moment and the total runtime.
The runtime follows the character count — a shorter question gives a shorter
video.

## The sequence the video produces

| Beat       | What happens                                                    |
| ---------- | --------------------------------------------------------------- |
| 0.0–0.9 s  | empty search box, caret blinking                                |
| from 0.9 s | the question types itself, uneven keystrokes, pauses between words |
| +0.4 s     | the question stands complete                                    |
| +1.05 s    | the pointer comes in from the lower right, hover with underline |
| +0.15 s    | click — the pointer presses, a ring expands                     |
| +1.05 s    | end. Deliberately nothing else happens.                         |

The typing rhythm is **seeded**, not random: the same text produces exactly the
same keystrokes on every render.

## What not to touch

The `STYLE` block in `build.mjs` holds the values measured off the reference
screenshot — box width 640, height 48, radius 26, wordmark 230 px, and the Y
positions of logo, field and links, measured in a 1080 px tall frame. Change only
what the user explicitly asks for: the page very quickly ends up looking “almost
like Google”, and that is exactly what people notice.

For a different aspect ratio do **not** touch these — that is what `format` and
`scale` are for. Turning `boxWidth` instead shifts the character limit
`build.mjs` computes, and then the warning at build time is not a detail but
truncated text.

`cursorFromWide` / `cursorFromTall` decide which direction the pointer enters
from — in portrait from further below, because there is no room to the right.
`build.mjs` makes that choice itself from the frame dimensions.

## Legal

`template/assets/google-logo.svg` is Google's wordmark. The skill uses it to
build a recognisable restaging of the Google start page — usual and unproblematic
for mockups, hooks and editorial videos, but it remains someone else's trademark.
Point this out to the user if the video would imply that Google is affiliated
with them or endorses them.

## Afterwards

Show the user the rendered MP4. For another question in the same style it is
enough to change `content.json` and run `node build.mjs` again.
