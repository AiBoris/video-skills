# Kennzahlen-Karten — Skill für KI-Agenten

Erzeugt Videos, in denen ein Raster aus Karten versetzt ins Bild fährt und in
jeder Karte eine große Zahl hochzählt — ein Kennzahlen-Dashboard als Video.
Dunkler Hintergrund, farbige Verläufe, grüne und rote Badges, stumm.
Datenquelle ist eine CSV, eine Tabelle oder eine KI-Recherche.

Unter jeder Zahl stehen zwei optionale Zeilen: **was** die Zahl ist
(„geschätzter Absatz weltweit") und **woher** sie kommt („Q2 2026 · IDC").
Damit trägt das Format auch Zahlen, die ohne Einordnung irreführend wären.

**Die Laufzeit ergibt sich aus der Kartenanzahl:** 6 Karten ≈ 4,3 s,
9 Karten ≈ 4,9 s. Nichts einzustellen.

Alle Beschriftungen, Einheiten, Zahlenformate und die Sprache stehen in
`data.json` und sind frei änderbar.

> **Neu hier? Lies ANLEITUNG.md** — Schritt für Schritt, ohne Vorkenntnisse.
> Das hier ist die Kurzfassung.

## Installieren

Ordner entpacken, dann:

```bash
npx skills add /pfad/zu/kennzahlen-karten-skill --global --copy --all
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

Sag deinem Agenten:

> Mach mir ein Kennzahlen-Video aus dieser CSV: /pfad/zur/datei.csv

oder ohne eigene Daten:

> Mach mir ein Kennzahlen-Video zu den iPhone-17-Verkäufen im letzten Quartal

Bei einem Thema recherchiert er die Zahlen und legt sie dir zur Freigabe vor,
bevor er baut. Danach legt er das Projekt an und rendert das MP4.

Wünsche kannst du direkt mitgeben:

> … als Hochformat für Instagram
> … auf Englisch
> … nur vier Karten, die anderen sind mir zu viel

## Was drin ist

| Datei | |
| --- | --- |
| `SKILL.md` | Die Anleitung für den Agenten. |
| `template/build.mjs` | Baut aus `data.json` die fertige HyperFrames-Komposition. Enthält alle an der Referenz vermessenen Design- und Timing-Werte. |
| `template/csv-to-data.mjs` | Wandelt eine CSV in `data.json`. |
| `template/data.example.json` | Beispieldatensatz mit allen Feldern. |

## Formate

`landscape` 1920×1080 · `portrait` 1080×1920 · `square` 1080×1080

Das Raster richtet sich automatisch nach Format und Kartenanzahl; eine
unvollständige letzte Reihe wird zentriert.

## Grenzen

- Vier bis sechs Karten lesen sich am besten, zwölf sind die Obergrenze.
- Alle Zahlen teilen eine Schriftgröße, bestimmt von der längsten — eine sehr
  lange Zahl verkleinert alle.
- Der Verlauf am Kartenboden zeigt ohne eigene Zahlenreihe nur die Richtung, er
  ist kein echtes Diagramm.
- Kein Ton, keine Sprecherstimme, keine Bilder. Für Ranglisten über die Zeit ist
  der Balken-Race-Skill das richtige Format.
