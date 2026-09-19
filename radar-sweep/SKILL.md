---
name: radar-sweep
description: "Builds a radar video: a glowing radar dish with rings, tick scale and crosshair boots up, a search beam sweeps across it with a trailing wake and makes amber contacts flash briefly, while a headline sits top left and coordinates tick along bottom right. Dark, technical, silent, 4-12 s. Use it when someone wants searching, tracking, scanning or watching as a video: 'radar video', 'radar sweep video', 'radar animation', 'sonar', 'scan animation', 'we find X', 'monitoring video', 'recruiting hook', 'Radar-Video', 'Zielsuche', 'Scan-Animation'. Can build a series: a list of names gives one video per name with an identical picture. Not for maps with real places, bar or pie charts, or narrated videos. Requires the HyperFrames CLI."
---

# Radar Sweep

A radar dish in the dark. Rings snap open from the inside out, the search beam
starts to circle and drags a fading wake behind it, contacts flash amber as the
beam brushes over them and dim away afterwards. A headline top left, running
coordinates bottom right. At the end everything fades out.

No audio, no narrator, no cuts.

Geometry, springs and timing were read out of a rendered reference and are baked
into `template/build.mjs`. You only write the headline.

## Check the requirement first

```bash
npx hyperframes --version
```

If that fails, stop and tell the user:

> This skill needs the HyperFrames CLI. Install it with:
> `npx skills add heygen-com/hyperframes --global --copy --all`

Do not guess your way around it and do not build a substitute.

## Step 1 — Settle the headline

Ask the user for the **headline**. It is set in uppercase and sits top left above
the dish.

### The editorial rule

The picture makes a claim: *something is being searched for here, and it is being
found.* The headline has to deliver on that claim, or the radar is just
decoration.

- Good: `We find engineers for Nexora Automation`
- Good: `47 competitors. One is growing faster than you.`
- Dead: `Welcome to Nexora Automation Inc.`

It lands hardest when the headline carries the **recipient's own name** — then
they see themselves in the crosshairs. That is exactly what the series in step 3
is for.

### Hard limits

- **Three lines at most**, or the headline runs into the dish. `build.mjs`
  computes the character limit for the format and type size and warns. Take the
  warning seriously or set a smaller `titleSize`.
- The subtitle is a single short line in caps and monospace
  (`GRID REF 34-B // ACTIVE`). It should read like a status field, not like a
  second sentence. Leaving it empty is fine.

## Step 2 — Settle the look

Only ask these if the user has not already said.

| Field       | Default | Alternatives                              |
| ----------- | ------- | ----------------------------------------- |
| `format`    | `16:9`  | `9:16`, `1:1`, `4:5`                      |
| `preset`    | `gruen` | `bernstein`, `blau`, `rot`                |
| `duration`  | `6`     | 3 to 20 seconds                           |
| `blips`     | `9`     | 1 to 24 contacts                          |
| `crosshair` | `true`  | `false` — no crosshair                    |
| `scanlines` | `true`  | `false` — no CRT lines                    |

`gruen` is the reference: signal green on near-black with amber contacts. Take it
when in doubt.

Individual colours can be overridden through `colors`, e.g.
`"colors": { "blip": "#ff6b4a" }`. Only do that when the user asks — the four
presets are tuned as sets.

### What the runtime does

The beam needs **110 frames for one revolution**, a little over 3.7 seconds. The
default of 6 s gives not quite one and a half revolutions: enough for every
contact to flash once, short enough for a hook. 8 s gives two full revolutions.
`build.mjs` prints the number of sweeps.

Below 5 s the beam never completes a full turn and some contacts stay dark. That
can be intentional, but it is usually an oversight.

## Step 3 — Series or single video

`title` may contain the placeholder `{name}`. If `names` holds a list,
`node build.mjs <index>` builds one video per entry — same dish, same contacts,
same motion, only a different name.

That is the actual purpose of the format: personalised first-contact videos.

```json
{
  "title": "We find engineers for {name}",
  "names": ["Nexora Automation", "Veltrix Systems"]
}
```

Without `names`, `title` is used unchanged and a `{name}` in it is dropped.

## Step 4 — Set up the project

`<project>` is a short kebab-case name derived from the topic.

```bash
npx hyperframes init videos/<project> --non-interactive --example=blank
cp -R <SKILL_DIR>/template/build.mjs <SKILL_DIR>/template/content.json <SKILL_DIR>/template/assets videos/<project>/
```

Always copy `build.mjs` and `assets/` **into the project**. Never run them out of
the skill folder: the finished video project has to keep rendering even if this
skill is later updated or uninstalled.

## Step 5 — Write the content

`videos/<project>/content.json`:

```json
{
  "title": "We find engineers for {name}",
  "names": ["Nexora Automation"],
  "subtitle": "GRID REF 34-B // ACTIVE",
  "format": "16:9",
  "duration": 6,
  "preset": "gruen",
  "blips": 9,
  "crosshair": true,
  "scanlines": true
}
```

## Step 6 — Build, check, render

```bash
cd videos/<project>
node build.mjs
npx hyperframes check .
npx hyperframes render . -q high -o ./renders/video.mp4
```

For a series, once per name:

```bash
for i in 0 1 2; do node build.mjs $i && npx hyperframes render . -q high -o ./renders/version-$i.mp4; done
```

`build.mjs` writes two files: `index.html` (the shell carrying the runtime) and
`compositions/radar-scene.html` (the scene). That is the shape
`hyperframes lint` asks for once a timed element has nested children — it keeps
the check at zero warnings and the Studio timeline readable.

## What not to touch

The `STYLE` block in `build.mjs` holds the values read out of the reference. All
lengths are expressed as a **share of the radar radius**, not in pixels, which is
why the picture holds in every format. So for a different aspect ratio do **not**
touch them — that is what `format` is for.

Three things are sensitive:

- **`ringSpring` and `titleSpring`.** These are real spring parameters
  (`damping` / `stiffness` / `mass`) stepped per frame, not GSAP eases. Change
  them and you get either a sluggish opening or an overshoot that briefly pushes
  the rings past the rim.
- **`sweepPeriod: 110`.** Sets the rotation speed. Faster reads as frantic,
  slower leaves the contacts dark too long.
- **`blipFalloff: 2.2`.** How fast a contact dims behind the beam. Lower means
  everything glows permanently and the dish loses its depth.

The contacts themselves are **seeded**, not random: the same contact count always
produces the same distribution. That is why a series of twenty videos shows the
identical picture and only swaps the name. Do not change the seed unless the user
wants a different distribution.

## Afterwards

Show the user the rendered MP4. For another headline in the same style it is
enough to change `content.json` and run `node build.mjs` again.
