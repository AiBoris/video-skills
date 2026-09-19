# Setup: Google Search Videos

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
npx skills add AiBoris/video-skills@google-suche --global --copy --all
```

To get all seven skills instead, drop the `@google-suche`.

At the end you get a long list of directories and, below it, **“Done!”**.

### Two red lines at the end are normal

If the bottom says `Failed to install 2` with names like Eve or PromptScript,
everything is fine. The skill installs for around 80 agents at once, and two of
them cannot do a global install. What matters is the line `google-suche (copied)`
further up.

---

## Step 3: Restart your agent

Close your AI agent and open it again. Otherwise it does not know about the new
skill yet.

---

## Step 4: Make a video

> Make me a Google search video with the question “How do I make videos with AI?”

It asks for the format, the colour variant and whether the buttons should be English or German, then renders the MP4. You will find it in the project
folder under `renders/`.

---

## The decision that matters: which question?

The format works because your viewer recognises themselves in the typing. Use the
question they **actually** type into Google — not the one your marketing would
prefer.

- Works: `How do I make videos with AI?`
- Works: `why is my landing page not converting`
- Dead: `Professional Video Production Agency Premium`

Lowercase with no punctuation often reads more honestly than a clean sentence.

---

## Portrait, square, and the other formats

Just say so:

> ... as 9:16 for a reel

The page keeps its original pixel sizes in every format, so in portrait it looks
small with a lot of air below it. If the video needs to be readable on a phone,
say “make the page bigger” — the agent raises `scale` and the search box fills
the width.

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
`google-suche` has to show up there.

**“Failed to install 2” at the end**
Normal, see step 2.

**The text is cut off on the left**
The question is too long. About 60 characters fit in the box. A warning appears when building.

**Everything is tiny in portrait**
That is faithful to the real Google page inside a narrow frame. Say “make the page bigger” and the agent raises `scale` to 1.5.

---

## What the video can and cannot do

- One question, **one line**, about 60 characters
- Four formats: 16:9, 9:16, 1:1, 4:5
- Three variants: `cream` (warm), `light` (white), `dark`
- Buttons in English or German
- **No audio**, 6 to 10 seconds depending on the text
- **No results page.** Nothing happens after the click — that is the hook, not a missing feature.

---

## The legal bit, in one paragraph

The bundled Google logo is someone else's trademark. Fine for hooks and
editorial videos; not fine for advertising that implies Google endorses you.
