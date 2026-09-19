# Setup: KPI Card Videos

Written for beginners. Set this up once, then use it for good.
Takes about five minutes.

---

## What you need first

**1. An AI agent.** Claude Code, Cursor, Codex, Gemini CLI or Windsurf, for
example. If you are reading this, you probably already have one.

**2. Node.js, version 22 or newer.** Check it in the terminal (Mac: Applications
→ Utilities → Terminal. Windows: Start menu → “Terminal” or “PowerShell”):

```
node --version
```

If it prints `v22.…` or higher, you are set. Otherwise get it from
**https://nodejs.org** → the **“LTS”** button, then close and reopen the
terminal.

**3. FFmpeg.** The program that actually writes the video file at the end.
Check it:

```
ffmpeg -version
```

If that errors, install it — Mac: `brew install ffmpeg` (Homebrew from
**https://brew.sh**), Windows: `winget install ffmpeg`.

Chrome you do not have to worry about: HyperFrames downloads it on the first
render.

---

## Step 1: Install HyperFrames

HyperFrames is the tool that actually builds the videos:

```
npx skills add heygen-com/hyperframes --global --copy --all
```

The first run can take a minute or two. Answer any “Ok to proceed? (y)” prompt
with Enter.

---

## Step 2: Install this skill

```
npx skills add AiBoris/video-skills@kennzahlen-karten --global --copy --all
```

To get all seven skills instead, drop the `@kennzahlen-karten`.

At the end you get a long list of directories and, below it, **“Done!”**.

### Two red lines at the end are normal

If the bottom says `Failed to install 2` with names like Eve or PromptScript,
everything is fine. The skill installs for around 80 agents at once, and two of
them cannot do a global install. What matters is the line `kennzahlen-karten (copied)`
further up.

---

## Step 3: Restart your agent

Close your AI agent and open it again. Otherwise it does not know about the new
skill yet.

---

## Step 4: Make a video

> Make me a KPI video from these quarterly figures

It asks for for your numbers — or researches them and shows you the table for approval, then renders the MP4. You will find it in the project
folder under `renders/`.

---

## The decision that matters: six cards are six statements

If all six say the same thing in different units, you have built a dashboard,
not a story. Check the selection against one question:

> **Does each card say something the others do not already say?**

A good mix is three kinds: the **headline number**, a **comparison** (the same
measure for another model, country or quarter), and a **context number** from a
different dimension that puts the headline in proportion.

**Four to six cards is the sweet spot.** Three looks empty; past nine nobody
reads everything in four seconds.

---

## When something goes wrong

**`npx: command not found` or `node: command not found`**
Node.js is missing. Back to “What you need first”, point 2.

**A render error mentioning FFmpeg**
FFmpeg is missing. Back to “What you need first”, point 3.

**A render error mentioning HyperFrames**
Your Node version is probably too old. HyperFrames needs at least version 22.
Check with `node --version`.

**Your agent does not know the skill**
Restart the agent (step 3). If it still does not, check with `npx skills list` —
`kennzahlen-karten` has to show up there.

**“Failed to install 2” at the end**
Normal, see step 2.

**“Label … is too long and will be truncated”**
A label does not fit its card. Shorten it; the long version belongs in the subtitle or the footnote, not on the card.

**The numbers look small**
Two reasons. All cards share one type size, set by the longest number — shorten it via the unit (`1.28 M` instead of `1,284,500`). And the `note` and `meta` lines cost space; without them the number is about a fifth bigger.

---

## What the video can and cannot do

- Runtime follows the card count: 6 cards ≈ 4.3 s, 9 cards ≈ 4.9 s
- Three formats: 16:9, portrait, square
- Six colours — from the seventh card on, colours repeat
- The sparkline at the bottom is decoration unless you supply real values
- **No audio**
