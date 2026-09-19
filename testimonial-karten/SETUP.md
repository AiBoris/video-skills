# Setup: Testimonial Videos

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
npx skills add AiBoris/video-skills@testimonial-karten --global --copy --all
```

To get all seven skills instead, drop the `@testimonial-karten`.

At the end you get a long list of directories and, below it, **“Done!”**.

### Two red lines at the end are normal

If the bottom says `Failed to install 2` with names like Eve or PromptScript,
everything is fine. The skill installs for around 80 agents at once, and two of
them cannot do a global install. What matters is the line `testimonial-karten (copied)`
further up.

---

## Step 3: Restart your agent

Close your AI agent and open it again. Otherwise it does not know about the new
skill yet.

---

## Step 4: Make a video

> Make me a testimonial video from my Google reviews

It asks for for your quotes, a CSV or a review profile, then renders the MP4. You will find it in the project
folder under `renders/`.

---

## The decision that matters: which sentence glows?

Every card highlights one phrase in gold. That phrase is the whole card. Pick
the words a sceptical reader needs to see — the concrete result, not the polite
opening.

8 to 12 words per quote reads comfortably; three lines is the hard maximum.
Shorten aggressively, but never in a way that changes what the person meant.

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
`testimonial-karten` has to show up there.

**“Failed to install 2” at the end**
Normal, see step 2.

**“no focus text”**
A quote is missing its golden phrase. Tell the agent which words should stand out.

**A quote does not fit on the card**
It is too long. Three lines is the maximum, 8 to 12 words reads comfortably. Let the agent keep shortening.

**“the quote opens on …”**
A shortened quote starts with “He”/“She”/“His” and points at nothing. The agent should substitute your name.

---

## What the video can and cannot do

- One title card, one card per quote, one closing card with the overall rating
- Runtime follows the number of cards
- **No audio**, no narrator
- Source platforms are written as text, because their logos are trademarks

---

## The legal bit, in one paragraph

Reviews are statements by real people. They may be shortened but not edited in
a way that changes their meaning, and advertising with invented or distorted
reviews is illegal in most jurisdictions. Show only what is really there, name
the source, and remember that if your profile averages 3.1 stars, a video made
entirely of five-star quotes is not good marketing — it is a problem.
