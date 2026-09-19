# Setup: Bar Chart Race Videos

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
npx skills add AiBoris/video-skills@balken-race --global --copy --all
```

To get all seven skills instead, drop the `@balken-race`.

At the end you get a long list of directories and, below it, **“Done!”**.

### Two red lines at the end are normal

If the bottom says `Failed to install 2` with names like Eve or PromptScript,
everything is fine. The skill installs for around 80 agents at once, and two of
them cannot do a global install. What matters is the line `balken-race (copied)`
further up.

---

## Step 3: Restart your agent

Close your AI agent and open it again. Otherwise it does not know about the new
skill yet.

---

## Step 4: Make a video

> Build a bar chart race from this CSV

It asks for for your data — or researches the numbers and shows you the table for approval, then renders the MP4. You will find it in the project
folder under `renders/`.

---

## The decision that matters: does the lead actually change?

A bar chart race lives on **overtaking**. If the order stays the same across
every period, you have not built a race — you have built a bar chart that slowly
gets bigger, and that is not worth a video.

Before building, check the data against one question:

> **Does first place change at least once?**

If not: go further back in time, pick a different metric (growth or market share
change order far more often than absolute revenue), or drop the perennial leader
and show the race behind them.

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
`balken-race` has to show up there.

**“Failed to install 2” at the end**
Normal, see step 2.

**One series has more or fewer values than another**
Cells are missing in your CSV. Every row needs a value for every column. Leave gaps empty and the converter fills them in sensibly.

**The video is too long**
Use fewer periods — every second year instead of every year. That beats speeding it up; below about 0.6 s per period the eye can no longer follow the rank changes, and those are the content.

---

## What the video can and cannot do

- Runtime follows the data: 6 periods ≈ 6.5 s, 24 periods ≈ 25 s
- Three formats: 16:9, portrait, square
- Six colours — from the seventh series on, colours repeat
- **No audio**; negative values are not supported
