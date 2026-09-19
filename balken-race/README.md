# Balken-Race — Skill für KI-Agenten

Erzeugt Videos, in denen waagerechte Balken wachsen, sich überholen und die
Plätze tauschen — ein Bar Chart Race. Dunkler Hintergrund, sechs Farbverläufe,
stumm. Datenquelle ist eine CSV, eine Tabelle oder eine KI-Recherche.

**Die Laufzeit ergibt sich aus der Datenmenge:** 6 Perioden ≈ 6,5 s,
24 Perioden ≈ 25 s. Nichts einzustellen.

> **Neu hier? Lies ANLEITUNG.md** — Schritt für Schritt, ohne Vorkenntnisse.
> Das hier ist die Kurzfassung.

## Installieren

Ordner entpacken, dann:

```bash
npx skills add /pfad/zu/balken-race-skill --global --copy --all
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

Sag deinem Agenten:

> Mach mir ein Balken-Race aus dieser CSV: /pfad/zur/datei.csv

oder ohne eigene Daten:

> Mach mir ein Balken-Race über die größten Autohersteller 2015 bis 2025

Bei einem Thema recherchiert er die Zahlen und legt sie dir zur Freigabe vor,
bevor er baut. Danach legt er das Projekt an und rendert das MP4.

## Was drin ist

```
ANLEITUNG.md              Einrichtung für Einsteiger
SKILL.md                  Anleitung für den Agenten
template/
  build.mjs               Generator + alle vermessenen Stilwerte
  csv-to-data.mjs         CSV -> data.json
  data.example.json       Beispieldatensatz (der Nachbau der Referenz)
```

## Formate

`landscape` 1920×1080 · `portrait` 1080×1920 · `square` 1080×1080 —
per `options.format` in `data.json`.
