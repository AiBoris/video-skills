---
name: balken-race
description: "Erzeugt ein Balken-Rennen (Bar Chart Race): waagerechte Balken wachsen, überholen sich und tauschen die Plätze, während die Zahlen hochzählen. Dunkler Nachtblau-Hintergrund, sechs Farbverläufe, kein Ton. Nutze es, wenn jemand eine Rangliste über die Zeit als Video will: 'Balken-Race', 'Bar Chart Race', 'Balkenrennen', 'racing bars', 'Ranking-Video', 'Diagramm-Video', 'Daten als Video', 'CSV als Video', 'welches Land/Produkt/Team führt wann'. Datenquelle ist eine CSV, eine Tabelle oder eine KI-Recherche. Nicht für Einzelwert-Animationen, Tortendiagramme oder Liniencharts. Voraussetzung: HyperFrames CLI."
---

# Balken-Race

Waagerechte Balken wachsen, überholen sich und tauschen die Plätze. Der Führende
füllt immer die volle Breite, die Zahl am Balkenende zählt mit. Kein Ton, keine
Sprecherstimme, keine Bilder — die Bewegung der Rangliste ist das ganze Video.

Design, Timing und Farben sind aus einer Referenzaufnahme vermessen und stecken
fertig in `template/build.mjs`. Du lieferst nur die Daten.

**Die Laufzeit ergibt sich aus der Datenmenge.** Mehr Perioden = längeres Video,
ohne dass du etwas einstellst. 6 Perioden ≈ 6,5 s, 24 Perioden ≈ 25 s.

## Voraussetzung zuerst prüfen

```bash
npx hyperframes --version
```

Schlägt das fehl, brich ab und sage dem User:

> Dieser Skill braucht die HyperFrames CLI. Installieren mit:
> `npx skills add heygen-com/hyperframes --global --copy --all`

Rate nicht daran vorbei und baue keinen Ersatz.

## Schritt 1 — Daten beschaffen

Es gibt genau zwei Wege. Kläre zuerst, welcher gilt.

### Weg A — der User hat Daten

CSV, Excel-Export, Tabelle im Chat. Nimm sie und geh zu Schritt 2.

### Weg B — der User nennt nur ein Thema

Dann recherchierst du die Zahlen selbst. Halte dich an drei Regeln:

1. **Nenne die Quelle** und das Jahr, aus dem die Zahlen stammen — im Untertitel
   des Videos und im Chat.
2. **Erfinde keine Zwischenjahre.** Wenn du für 2010 und 2020 belastbare Werte
   hast, für die Jahre dazwischen aber nicht, dann nimm zwei Perioden statt elf
   ausgedachte. Ein Balken-Race interpoliert ohnehin weich zwischen den Werten.
3. **Lege dem User die Tabelle zur Freigabe vor, bevor du baust.** Zahlen im
   Video sehen wie Fakten aus. Falsche Zahlen fallen im Video niemandem auf.

### Die Redaktionsregel — das Wichtigste an diesem Format

Ein Balken-Race lebt vom **Überholen**. Bleibt die Reihenfolge über alle Perioden
gleich, hast du kein Rennen gebaut, sondern ein Balkendiagramm, das langsam
größer wird — und dafür lohnt kein Video.

Bevor du baust, prüf die Daten auf diese eine Frage:

> **Wechselt der erste Platz mindestens einmal?**

Wenn nein, ist eins davon der Ausweg:

- **Anderer Ausschnitt.** Länger zurückgehen, bis der Aufsteiger noch hinten lag.
- **Andere Kennzahl.** Absolute Umsätze ändern die Reihenfolge selten, Wachstum
  oder Marktanteil dagegen oft.
- **Andere Teilnehmer.** Den ewigen Marktführer weglassen und das Rennen
  dahinter zeigen.
- **Anderes Format.** Sag dem User ehrlich, dass seine Daten kein Rennen
  hergeben, und schlag ein einfaches Balkendiagramm oder eine andere Darstellung
  vor. Das ist besser, als ein totes Video abzuliefern.

Bei 8–20 Teilnehmern und `visibleRows: 10` entsteht der beste Effekt: Balken
fahren von unten ins Bild und schieben andere heraus.

## Schritt 2 — Projekt anlegen

`<projekt>` ist ein kurzer kebab-case-Name aus dem Thema.

```bash
npx hyperframes init videos/<projekt> --non-interactive --example=blank
cp <SKILL_DIR>/template/build.mjs <SKILL_DIR>/template/csv-to-data.mjs videos/<projekt>/
```

Kopiere die Skripte **immer ins Projekt**. Führe sie nie aus dem Skill-Ordner
heraus aus: Das fertige Videoprojekt muss auch dann noch rendern, wenn dieser
Skill aktualisiert oder deinstalliert wird.

## Schritt 3 — Daten in `data.json` bringen

### Aus einer CSV

```bash
cd videos/<projekt>
node csv-to-data.mjs /pfad/zur/datei.csv data.json
```

Erwartet wird: erste Spalte der Name, alle weiteren Spalten je eine Periode in
zeitlicher Reihenfolge.

```
Land,2020,2021,2022,2023
Deutschland,412,455,501,548
Frankreich,388,431,489,540
```

Das Lang-Format (`name,periode,wert` — eine Zeile je Messpunkt) wird erkannt und
automatisch gedreht. Semikolon als Trenner, deutsche Dezimalkommas, Tausender­punkte,
`€`, `%` und leere Zellen werden verarbeitet.

Danach `title` und `subtitle` ausfüllen — der Konverter schreibt dort `TODO` hinein.

### Von Hand

```json
{
  "title": "Marktanteil Europa",
  "subtitle": "Umsatz je Land · Mrd. € · Quelle: Eurostat 2024",
  "valueSuffix": " Mrd",
  "periods": ["2020", "2021", "2022", "2023"],
  "series": [
    { "name": "Deutschland", "values": [412, 455, 501, 548] },
    { "name": "Frankreich", "values": [388, 431, 489, 540] }
  ],
  "options": { "format": "landscape", "visibleRows": 6 }
}
```

| Feld | |
| --- | --- |
| `title` | Überschrift. Kurz halten — lange Titel werden automatisch verkleinert. |
| `subtitle` | Was die Zahlen sind, ihre Einheit, und bei Recherche die Quelle. Weglassbar. |
| `valueSuffix` | Hinter jede Zahl gehängt, z. B. `" Mrd"`, `" %"`. |
| `periods` | Beschriftungen. Nur nötig für `showPeriodLabel`, aber gut zur Selbstkontrolle. |
| `series[].name` | Wird links neben dem Balken angezeigt. |
| `series[].values` | Ein Wert je Periode. `null` heißt „noch nicht im Rennen". |
| `series[].color` | Optional. Hex (`"#F0910B"`) oder `orange`, `violet`, `pink`, `indigo`, `cyan`, `green`. |

### Optionen

| Option | Standard | |
| --- | --- | --- |
| `format` | `landscape` | `landscape` 1920×1080, `portrait` 1080×1920, `square` 1080×1080 |
| `visibleRows` | 6 (max. Anzahl Serien) | Wie viele Balken gleichzeitig zu sehen sind |
| `decimals` | 0 | Nachkommastellen der Zahlen |
| `secondsPerPeriod` | 0,9 | Tempo. **Nur anfassen, wenn der User die Länge vorgibt.** |
| `hold` | 0,65 | Standzeit auf dem Endstand, bevor ausgeblendet wird |
| `showPeriodLabel` | aus | Blendet die aktuelle Periode unten rechts ein |

## Schritt 4 — Bauen, prüfen, rendern

```bash
cd videos/<projekt>
node build.mjs data.json
npx hyperframes check .
npx hyperframes render . -q high -o ./renders/video.mp4
```

`build.mjs` gibt Serien, Perioden und die berechnete Laufzeit aus und **warnt**,
wenn das Video über 90 Sekunden lang wird oder der Titel zu lang ist. Nimm die
Warnungen ernst.

Bricht `build.mjs` ab, sagt die Meldung genau, welche Serie das Problem hat.
Häufig: unterschiedlich viele Werte je Serie (jede Serie braucht einen Wert für
**jede** Periode — Lücken als `null`).

## Wenn die Laufzeit nicht passt

Die Laufzeit ist `0,85 s Vorlauf + (Perioden − 1) × 0,9 s + 0,65 s Standzeit + 0,5 s Ausblende`,
bei mehr als sechs sichtbaren Zeilen leicht gestreckt.

Will der User es **kürzer**, ist die erste Wahl **weniger Perioden** (jedes
zweite Jahr statt jedes Jahr), nicht ein kleineres `secondsPerPeriod`. Unter etwa
0,6 s pro Periode kann das Auge den Rangwechseln nicht mehr folgen, und genau
die sind der Inhalt.

## Was du nicht anfassen solltest

Der `STYLE`-Block in `build.mjs` enthält die an der Referenz vermessenen Werte:
Farbverläufe, Balkenhöhe, Eckenradius, das helle Pill am Balkenanfang, der
farbige Schein darunter, die Wachstumskurve des Vorlaufs und die Ease-Form der
Rangwechsel. Jede Zeile trägt im Kommentar, woraus sie gemessen wurde.

Ändere daran nur, was der User ausdrücklich verlangt.

Zwei Werte sind besonders empfindlich:

- **`introExponent: 0.9`** ist an vier gemessenen Punkten der Wachstumskurve
  gefittet. Andere Werte lassen die Balken sichtbar falsch anlaufen.
- **Die Rangwechsel nutzen eine kubische In-Out-Kurve**, keinen Smoothstep. Das
  wurde gemessen: In der Referenz ist das Spitzentempo eines Wechsels rund das
  Dreifache seines Durchschnitts. Smoothstep erreicht nur das 1,5-fache und
  lässt die Zeilen träge dahinschleichen statt zu wechseln.

## Grenzen, die du kennen solltest

- **Ab sieben Serien wiederholen sich die Farben.** Die Palette hat sechs Farben,
  wie die Referenz. Bei vielen Teilnehmern können zwei gleichfarbige Balken
  nebeneinander liegen. Ist das störend, setz `color` gezielt pro Serie.
- **Beim Überholen kreuzen sich zwei Zeilen** und überlagern sich kurz. Das macht
  die Referenz genauso; es ist kein Fehler.
- **Negative Werte sind nicht vorgesehen.** Der Balken misst vom Nullpunkt nach
  rechts. Bei Daten mit negativen Werten sag das dem User, statt sie still auf 0
  zu klemmen.

## Danach

Zeig dem User das gerenderte MP4. Für einen weiteren Datensatz im selben Stil
reicht es, `data.json` zu ändern und `node build.mjs` erneut laufen zu lassen.
