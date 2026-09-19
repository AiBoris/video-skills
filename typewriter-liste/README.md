# Typewriter-Liste — Skill für KI-Agenten

Erzeugt Videos, in denen sich eine nummerierte Liste Zeichen für Zeichen auf
ein Blatt Papier tippt. Schreibmaschinen-Optik, stumm, 16:9.

> **Neu hier? Lies ANLEITUNG.md** — Schritt für Schritt, ohne Vorkenntnisse.
> Das hier ist die Kurzfassung.

## Installieren

Ordner entpacken, dann:

```bash
npx skills add /pfad/zu/typewriter-liste-skill --global --copy --all
```

- `--copy` kopiert statt zu verlinken. Ohne das Flag geht der Skill kaputt,
  sobald du diesen Ordner verschiebst oder löschst.
- `--global` installiert für alle Projekte, nicht nur das aktuelle.
- `--all` überspringt die Rückfragen.

Danach den KI-Agenten neu starten.

Der Skill wird für alle gängigen KI-Agenten installiert — Claude Code, Codex,
Cursor, Gemini, Goose, opencode, Roo, Windsurf und weitere.

## Voraussetzungen

Node.js 22 oder neuer (`node --version`), FFmpeg (`ffmpeg -version`) und die
HyperFrames CLI:

```bash
brew install ffmpeg          # Mac; Windows: winget install ffmpeg
npx skills add heygen-com/hyperframes --global --copy --all
```

## Benutzen

Sag deinem Agenten einfach:

> Mach mir ein Typewriter-Listen-Video über [Thema]

Er fragt nach Text oder Thema, schreibt bei einem Thema die Liste zur Freigabe,
legt das Projekt an und rendert das MP4.

## Was drin ist

```
ANLEITUNG.md              Einrichtung für Einsteiger
SKILL.md                  Anleitung für den Agenten
template/
  build.mjs               Generator + alle vermessenen Stilwerte
  content.json            Beispielinhalt
  assets/fonts/           Courier Prime (liegt lokal bei, damit Renders
                          offline und überall identisch aussehen)
```

## Der Trick am Format

Die Liste muss *jemandes Argument* sein und am Ende kippen. Eine sachliche
Aufzählung wirkt in dieser Optik leblos. Die Verschachtelung unten
(`4.` → `A.` `B.`) ist der Mechanismus: Die Begründung entlarvt sich selbst.

## Grenzen

- Nur Großbuchstaben
- Max. 44 Zeichen pro Zeile
- Max. 9 Zeilen inklusive Titel

`build.mjs` warnt, wenn es zu eng wird.
