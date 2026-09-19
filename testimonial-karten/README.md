# Testimonial-Karten — Skill für KI-Agenten

Erzeugt Videos aus echten Kundenstimmen: Titelkarte („Das sagen unsere Kunden"),
dann je eine Glaskarte mittig im Bild — goldene Sterne, das Zitat schreibt sich
Wort für Wort ein, die entscheidende Stelle leuchtet gold, darunter Name und
Quelle (Google, ProvenExpert, Trustpilot …) — und zum Schluss die Gesamtnote mit
Call-to-Action und Webseite. Dunkler Spotlight-Grund, stumm, ohne Datumsangaben.

Quelle sind einzelne Zitate, eine CSV, ein Bewertungsprofil im Netz oder die
eigene Website.

**Die Laufzeit ergibt sich aus der Anzahl der Zitate:** 4 Zitate mit Titel- und
Schlusskarte ≈ 40 s. Nichts einzustellen.

> **Neu hier? Lies ANLEITUNG.md** — Schritt für Schritt, ohne Vorkenntnisse.
> Das hier ist die Kurzfassung.

## Installieren

Ordner entpacken, dann:

```bash
npx skills add /pfad/zu/testimonial-karten-skill --global --copy --all
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

> Mach mir ein Testimonial-Video aus unseren Google-Bewertungen: <Profil-Link>

oder:

> Mach mir Testimonial-Karten aus dieser CSV: /pfad/zu/bewertungen.csv

oder einfach die Zitate direkt in den Chat.

Der Agent fragt zuerst vier Dinge ab (Einzelperson oder Unternehmen, wie du in
Zitaten genannt wirst, dein Call-to-Action, deine Webseite), holt dann die
Bewertungen, kürzt sie auf Kartenlänge, schlägt für jede die eine Stelle vor, die
golden leuchten soll — und **legt dir alles zur Freigabe vor, bevor er baut**.

## Die Regel, die der Skill durchsetzt

Jede Karte braucht einen **Fokustext**: genau eine Stelle im Zitat, die golden
leuchtet. Fehlt sie, baut der Generator nicht. Ohne Fokus ist die Karte eine
graue Wand, an der das Auge abrutscht.

Und: Zitate werden nur **gekürzt**, nie umformuliert. Es sind die Worte echter
Leute über ein echtes Geschäft. Beginnt ein gekürztes Zitat auf „Er hat …",
ersetzt der Agent das Pronomen durch den Namen — sonst zeigt das Zitat ins Leere.

Sterne werden immer **aufgerundet**; unter 4,5 warnt der Generator.

## Was drin ist

```
ANLEITUNG.md                 Einrichtung für Einsteiger
SKILL.md                     Anleitung für den Agenten
template/
  build.mjs                  Generator + alle vermessenen Stilwerte
  csv-to-testimonials.mjs    CSV -> testimonials.json
  testimonials.example.json  Beispieldatensatz
  assets/fonts/              Inter, mitgeliefert für identische Renders
```

## Formate

`landscape` 1920×1080 · `portrait` 1080×1920 · `square` 1080×1080 —
per `options.format` in `testimonials.json`.
