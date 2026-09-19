# Setup: Typewriter List Videos

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
npx skills add AiBoris/video-skills@typewriter-liste --global --copy --all
```

To get all seven skills instead, drop the `@typewriter-liste`.

At the end you get a long list of directories and, below it, **“Done!”**.

### Two red lines at the end are normal

If the bottom says `Failed to install 2` with names like Eve or PromptScript,
everything is fine. The skill installs for around 80 agents at once, and two of
them cannot do a global install. What matters is the line `typewriter-liste (copied)`
further up.

---

## Step 3: Restart your agent

Close your AI agent and open it again. Otherwise it does not know about the new
skill yet.

---

## Step 4: Make a video

> Make me a typewriter list video about excuses in sales

It asks for whether you want to supply the text or have it written, and shows you the list for approval, then renders the MP4. You will find it in the project
folder under `renders/`.

---

## The decision that matters: the list has to tip

The format only works when the list is **somebody's argument**, recorded
deadpan, and **tips over at the end**. The nesting at the bottom (`4.` → `A.` `B.`)
is the mechanism: the justification exposes itself.

A tidy list of facts is dead in this look. If the last item does not make anyone
grin or wince, the list is not finished.

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
`typewriter-liste` has to show up there.

**“Failed to install 2” at the end**
Normal, see step 2.

**The text runs out of frame**
Too many lines or too long a line. Maximum 9 lines including the title, 44 characters per line.

---

## What the video can and cannot do

- **Uppercase only** — lowercase breaks the typewriter look
- Maximum **44 characters per line**
- Maximum **9 lines** including the heading
- **No audio**, 16:9, roughly 10 to 20 seconds
