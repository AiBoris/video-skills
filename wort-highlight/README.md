# Wort-Highlight — Skill für KI-Agenten

Erzeugt Kinetic-Typography-Videos: farbiger Vollflächen-Hintergrund, zwei Zeilen
große Schrift, und ein schräger dunkler Balken wandert Wort für Wort durch den
Satz und dreht das Wort darunter auf Weiß. Stumm, 16:9 oder Hochformat.

Du gibst einen Fließtext. Die Aufteilung in Phrasen und Zeilen macht der Skill.

> **Neu hier? Lies ANLEITUNG.md** — Schritt für Schritt, ohne Vorkenntnisse.
> Das hier ist die Kurzfassung.

## Installieren

Ordner entpacken, dann:

```bash
npx skills add /pfad/zu/wort-highlight-skill --global --copy --all
```

- `--copy` kopiert statt zu verlinken. Ohne das Flag geht der Skill kaputt,
  sobald du diesen Ordner verschiebst oder löschst.
- `--global` installiert für alle Projekte, nicht nur das aktuelle.
- `--all` überspringt die Rückfragen.

Danach den KI-Agenten neu starten.

## Voraussetzungen

Node.js 22 oder neuer (`node --version`), FFmpeg (`ffmpeg -version`, Mac:
`brew install ffmpeg`) und die HyperFrames CLI:

```bash
npx skills add heygen-com/hyperframes
```

## Benutzen

Sag deinem Agenten einfach, was du willst:

> Mach mir ein Wort-Highlight-Video aus diesem Text: … — in unserem Blau #1B6EF3

oder

> Wort-Highlight-Video aus diesem Text, Farbe von vidlyz.de holen

## Die Farbe

Drei Wege:

| Weg | Was du sagst |
| --- | --- |
| Vorgabe | „in #1B6EF3" — oder irgendein Hex-Wert aus deinem Styleguide |
| Aus der Webseite | „Farbe von kundenseite.de holen" |
| Referenz | nichts sagen — dann bleibt das Gelb `#FAC143` aus der Vorlage |

Du gibst nur den **Hintergrund** an. Schrift und Balken leitet der Skill daraus
ab: heller Hintergrund → fast schwarze Schrift, dunkler Hintergrund → helle
Schrift. So bleibt der Kontrast in jeder Markenfarbe lesbar.

## Der Text

- **15 bis 40 Wörter.** Etwa 0,45 Sekunden pro Wort: 25 Wörter ≈ 14 Sekunden.
- **Kurze Hauptsätze.** Punkt, Komma, Gedankenstrich und Doppelpunkt sind die
  Schnitte. Wer die Schnitte steuern will, setzt Kommas.
- **Keine Zeilenumbrüche im Text.** Die setzt der Skill.

## Was dabei herauskommt

Ein Projektordner unter `videos/<name>/` mit `content.json` (dein Text),
`build.mjs` (der Bauplan) und dem gerenderten MP4 unter `renders/`.

Für einen weiteren Text im selben Look reicht es, `content.json` zu ändern:

```bash
cd videos/<name>
node build.mjs
npx hyperframes render . -q high -o ./renders/video.mp4
```

## Inhalt des Ordners

```
SKILL.md                              Anweisungen für den KI-Agenten
README.md                             diese Datei
ANLEITUNG.md                          Schritt-für-Schritt für Einsteiger
template/build.mjs                    baut index.html aus content.json
template/brand.mjs                    liest die Markenfarbe aus einer Webseite
template/content.json                 Beispielinhalt
template/assets/fonts/                Poppins Medium, mitgeliefert
template/assets/metrics/              Zeichenbreiten für den Zeilenumbruch
```
