# Setup: Radar Videos

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
npx skills add AiBoris/video-skills@radar-sweep --global --copy --all
```

To get all seven skills instead, drop the `@radar-sweep`.

At the end you get a long list of directories and, below it, **“Done!”**.

### Two red lines at the end are normal

If the bottom says `Failed to install 2` with names like Eve or PromptScript,
everything is fine. The skill installs for around 80 agents at once, and two of
them cannot do a global install. What matters is the line `radar-sweep (copied)`
further up.

---

## Step 3: Restart your agent

Close your AI agent and open it again. Otherwise it does not know about the new
skill yet.

---

## Step 4: Make a video

> Make me a radar video with the headline “We find engineers for Nexora Automation”

It asks for the format and the colour variant, then renders the MP4. You will find it in the project
folder under `renders/`.

---

## The decision that matters: the headline

The picture claims: *something is being searched for here, and it is being found.*
The headline has to deliver on that claim, or the radar is just decoration.

- Works: `We find engineers for Nexora Automation`
- Works: `47 competitors. One is growing faster than you.`
- Dead: `Welcome to Nexora Automation Inc.`

It lands hardest with the recipient's own name in it — then they see themselves
in the crosshairs.

---

## Many videos at once

Tell your agent:

> Do this for these 20 companies, one video each with the company name in the title

It puts the names into a list and builds 20 videos. All of them show the same
dish and the same motion — only the name changes.

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
`radar-sweep` has to show up there.

**“Failed to install 2” at the end**
Normal, see step 2.

**The headline runs into the radar dish**
It is too long. A warning appears when building. Shorten it, or tell the agent “make the headline smaller”.

**The contacts never light up**
The runtime is too short. The beam needs 3.7 seconds per revolution; under 5 seconds it does not reach every point. Say “make it 8 seconds long”.

---

## What the video can and cannot do

- One headline, at most three lines, plus a short status line
- Four formats: 16:9, 9:16, 1:1, 4:5 — and four colour variants
- **No audio**, 4 to 12 seconds
- **Not a real map.** The coordinates in the bottom right are set dressing and show no real location. Do not claim otherwise in advertising.
