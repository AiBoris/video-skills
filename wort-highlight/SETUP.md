# Setup: Kinetic Typography Videos

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
npx skills add AiBoris/video-skills@wort-highlight --global --copy --all
```

To get all seven skills instead, drop the `@wort-highlight`.

At the end you get a long list of directories and, below it, **“Done!”**.

### Two red lines at the end are normal

If the bottom says `Failed to install 2` with names like Eve or PromptScript,
everything is fine. The skill installs for around 80 agents at once, and two of
them cannot do a global install. What matters is the line `wort-highlight (copied)`
further up.

---

## Step 3: Restart your agent

Close your AI agent and open it again. Otherwise it does not know about the new
skill yet.

---

## Step 4: Make a video

> Make me a word-highlight video with this sentence: ...

It asks for the colour (or reads it off your website) and the format, then renders the MP4. You will find it in the project
folder under `renders/`.

---

## The decision that matters: one sentence, spoken out loud

Every word gets its own moment under the bar, so every word has to earn it.
Read the sentence aloud before you hand it over. Anything you stumble over,
the bar will stumble over too.

15 to 40 words is the range. Punctuation marks are the cuts — put a comma where
you want the line to break.

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
`wort-highlight` has to show up there.

**“Failed to install 2” at the end**
Normal, see step 2.

**The line break splits a sentence in a silly place**
Put a comma where the cut should go, or shorten the word before it. Punctuation marks are the cuts.

---

## What the video can and cannot do

- **One running text**, 15 to 40 words — about 0.45 seconds per word
- At most **two lines** on screen at once; the skill works out the split itself
- **One colour** — the background; type and bar follow from it
- **No audio**, no narrator, no images
- 16:9 or portrait
