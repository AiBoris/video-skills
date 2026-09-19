# Google-Suche — Skill für KI-Agenten

Erzeugt Videos, in denen sich eine Frage Zeichen für Zeichen ins Google-Suchfeld
tippt und ein Mauszeiger danach auf „Google Search" klickt. Stumm, 6 bis 10
Sekunden, in 16:9, 9:16, 1:1 oder 4:5.

> **Neu hier? Lies ANLEITUNG.md** — Schritt für Schritt, ohne Vorkenntnisse.
> Das hier ist die Kurzfassung.

## Installieren

Ordner entpacken, dann:

```bash
npx skills add /pfad/zu/google-suche-skill --global --copy --all
```

- `--copy` kopiert statt zu verlinken. Ohne das Flag geht der Skill kaputt,
  sobald du diesen Ordner verschiebst oder löschst.
- `--global` installiert für alle Projekte, nicht nur das aktuelle.
- `--all` überspringt die Rückfragen.

Danach den KI-Agenten neu starten.

Der Skill wird für alle gängigen KI-Agenten installiert — Claude Code, Codex,
Cursor, Gemini, Goose, opencode, Roo, Windsurf und weitere.

## Voraussetzungen

Node.js 22 oder neuer (`node --version`), und die HyperFrames CLI:

```bash
npx skills add heygen-com/hyperframes --global --copy --all
```

## Benutzen

Sag deinem Agenten einfach:

> Mach mir ein Google-Suche-Video mit der Frage „Wie erstelle ich Videos mit KI?"

Er fragt nach Frage, Format, Farbvariante und Sprache der Buttons, legt das
Projekt an und rendert das MP4.

## Was drin ist

```
ANLEITUNG.md              Einrichtung für Einsteiger
SKILL.md                  Anleitung für den Agenten
template/
  build.mjs               Generator + alle vermessenen Stilwerte
  content.json            Beispielinhalt
  assets/google-logo.svg  Original-Wortmarke (liegt lokal bei, damit Renders
                          offline und überall identisch aussehen)
```

## Formate

`16:9` (1920×1080), `9:16` (1080×1920), `1:1` und `4:5` — über `format` in
`content.json`.

Die Seite behält in jedem Format ihre Originalmaße. Im Hochformat wirkt sie
dadurch klein, mit viel Luft unten. Wenn das Video auf dem Handy lesbar sein
soll, `"scale": 1.5` dazusetzen — dann füllt das Suchfeld die Breite.

## Drei Varianten

| `theme` | Aussehen                                                  |
| ------- | --------------------------------------------------------- |
| `cream` | warme Creme-Variante — hebt sich im Feed am stärksten ab   |
| `light` | die gewohnte weiße Startseite                             |
| `dark`  | Dark Mode                                                 |

Buttons wahlweise englisch („Google Search" / „I'm Feeling Lucky") oder deutsch
(„Google Suche" / „Auf gut Glück!"). Der Mauszeiger kann statt der Suche auch
„Auf gut Glück!" klicken.

## Der Trick am Format

Es muss die Frage sein, die dein Zuschauer **wirklich** eingibt. Kleinschreibung
ohne Satzzeichen wirkt echter als ein sauber formulierter Satz. Eine
Marketing-Formulierung („Professionelle Videoproduktion Agentur") tötet den
Effekt sofort.

## Grenzen

- Maximal etwa 60 Zeichen, eine Zeile
- Kein Ton, keine Ergebnisseite, kein Seitenwechsel
- Laufzeit ergibt sich aus der Zeichenzahl
- Im Hochformat liegt `scale` bei maximal 1.5, sonst berührt das Feld den Rand

`build.mjs` warnt, wenn die Frage zu lang für das Feld wird.

## Rechtliches

Das mitgelieferte Logo ist Googles Wortmarke. Für Mockups, Hooks und
redaktionelle Videos ist das üblich; für Werbung, die eine Google-Zugehörigkeit
oder -Empfehlung suggeriert, ist es das nicht.
