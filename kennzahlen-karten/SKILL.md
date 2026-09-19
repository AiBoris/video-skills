---
name: kennzahlen-karten
description: "Erzeugt ein Kennzahlen-Dashboard als Video: Karten fahren versetzt von unten ins Bild, die große Zahl in jeder Karte zählt hoch, ein farbiges Badge zeigt die Veränderung, ein Sparkline-Verlauf sitzt unten in der Karte. Dunkler Nachtblau-Hintergrund, sechs Farben, kein Ton, ca. 4-6 s. Nutze es, wenn jemand Zahlen als Übersicht im Video will: 'Kennzahlen-Video', 'KPI-Karten', 'Dashboard-Video', 'Zahlen-Karten', 'Metriken als Video', 'Quartalszahlen', 'Stat-Cards', 'KPI cards video', 'metrics dashboard video'. Alle Beschriftungen, Einheiten, Sprache und Zahlenformate stehen in data.json und sind frei änderbar. Nicht für Ranglisten über die Zeit (dafür Balken-Race), nicht für Sprecher-Videos oder Untertitel. Voraussetzung: HyperFrames CLI."
---

# Kennzahlen-Karten

Ein Raster aus Karten auf dunklem Grund. Jede Karte trägt eine Beschriftung, ein
Badge mit der Veränderung, eine große Zahl, die von 0 auf ihren Wert hochzählt,
darunter zwei optionale Zeilen (was die Zahl ist, und aus welchem Zeitraum und
welcher Quelle sie stammt) und einen farbigen Verlauf am unteren Rand. Die Karten
kommen versetzt herein, danach steht das Bild still. Kein Ton, keine
Sprecherstimme, keine Bilder.

Design und Timing sind aus einer Referenzaufnahme vermessen und stecken fertig in
`template/build.mjs`. Du lieferst nur Zahlen und Beschriftungen.

**Die Laufzeit ergibt sich aus der Anzahl der Karten.** 6 Karten ≈ 4,3 s,
9 Karten ≈ 4,9 s. Nichts einzustellen.

## Voraussetzung zuerst prüfen

```bash
npx hyperframes --version
```

Schlägt das fehl, brich ab und sage dem User:

> Dieser Skill braucht die HyperFrames CLI. Installieren mit:
> `npx skills add heygen-com/hyperframes --global --copy --all`

Rate nicht daran vorbei und baue keinen Ersatz.

## Schritt 1 — Zahlen beschaffen

Es gibt genau zwei Wege. Kläre zuerst, welcher gilt.

### Weg A — der User hat Zahlen

CSV, Tabelle im Chat, Screenshot eines Dashboards. Nimm sie und geh zu Schritt 2.

### Weg B — der User nennt nur ein Thema

Dann recherchierst du die Zahlen selbst. Halte dich an vier Regeln:

1. **Nenne die Quelle** und den Zeitraum — im Untertitel und in der Fußzeile des
   Videos, und im Chat.
2. **Trenne Gemessenes von Geschätztem.** Wenn eine Zahl nicht berichtet wird und
   du sie herleitest, gehört das Wort „geschätzt" in die `note` der Karte und die
   Herleitung in ihre `meta` — nicht nur in die Fußzeile. Zahlen im Video sehen
   wie Fakten aus, und falsche Zahlen fallen im Video niemandem auf.
3. **Ein Zeitraum für alle Karten.** Zwei Karten aus verschiedenen Quartalen
   nebeneinander lesen sich als dieselbe Momentaufnahme — das ist irreführend.
   Geht es nicht anders, muss der Zeitraum in der Beschriftung stehen.
4. **Lege dem User die Tabelle zur Freigabe vor, bevor du baust.**

### Die Redaktionsregel — das Wichtigste an diesem Format

Sechs Karten sind sechs Aussagen. Sind alle sechs dieselbe Aussage in anderen
Einheiten, hast du ein Dashboard gebaut und keine Geschichte.

Bevor du baust, prüf die Auswahl auf diese Frage:

> **Sagt jede Karte etwas, das die anderen nicht schon sagen?**

Eine gute Mischung sind drei Sorten Karten:

- **Die Hauptzahl** — worum es geht, meist zuerst und mit dem stärksten Badge.
- **Die Vergleichszahl** — dieselbe Größe für ein anderes Modell, Land, Quartal.
- **Die Kontextzahl** — etwas aus einer anderen Dimension, das die Hauptzahl
  einordnet (Umsatz neben Stückzahlen, Nutzer neben Umsatz).

**Vier bis sechs Karten sind das Optimum.** Bei drei wirkt das Raster leer, ab
neun liest niemand mehr alles in vier Sekunden. Hat der User mehr Zahlen, frag,
welche die wichtigsten sind, statt alle hineinzuquetschen.

## Schritt 2 — Projekt anlegen

`<projekt>` ist ein kurzer kebab-case-Name aus dem Thema.

```bash
npx hyperframes init videos/<projekt> --non-interactive --example=blank
cp <SKILL_DIR>/template/build.mjs <SKILL_DIR>/template/csv-to-data.mjs videos/<projekt>/
```

Kopiere die Skripte **immer ins Projekt**. Führe sie nie aus dem Skill-Ordner
heraus aus: Das fertige Videoprojekt muss auch dann noch rendern, wenn dieser
Skill aktualisiert oder deinstalliert wird.

## Schritt 3 — Zahlen in `data.json` bringen

### Aus einer CSV

```bash
cd videos/<projekt>
node csv-to-data.mjs /pfad/zur/datei.csv data.json
```

Erwartet wird eine Kopfzeile. Nur `label` und `value` sind Pflicht:

```
label;value;suffix;delta;tone
iPhone 17;16,6; Mio.;6 % Weltmarkt;up
iPhone 17 Pro Max;12,4; Mio.;Rang 2;flat
```

Deutsche Spaltennamen (`Beschriftung`, `Wert`, `Einheit`, `Delta`, `Trend`,
`Farbe`) werden genauso erkannt, ebenso Semikolon oder Komma als Trenner,
deutsche Dezimalkommas und Tausenderpunkte.

Danach `title`, `subtitle` und `footnote` ausfüllen — der Konverter schreibt dort
`TODO` hinein.

### Von Hand

```json
{
  "title": "iPhone 17 in Zahlen",
  "subtitle": "Zweites Quartal 2026 · Absatz, Umsatz, Ökosystem",
  "footnote": "Quelle: Counterpoint Research, Apple Q3/FY2026",
  "metrics": [
    {
      "label": "iPhone 17",
      "value": 16.6,
      "suffix": " Mio.",
      "decimals": 1,
      "note": "geschätzter Absatz weltweit",
      "meta": "Q2 2026 · aus 6 % Marktanteil abgeleitet",
      "trend": "up"
    },
    {
      "label": "iPhone-Umsatz",
      "value": 54.3,
      "suffix": " Mrd. $",
      "decimals": 1,
      "delta": "22 %",
      "deltaTone": "up",
      "note": "Apple iPhone-Segment",
      "meta": "Apple Q3/FY2026 (Kalender-Q2) · ggü. Vorjahr"
    }
  ],
  "options": { "format": "landscape", "locale": "de" }
}
```

| Feld | |
| --- | --- |
| `title` | Überschrift oben links. Kurz halten. |
| `subtitle` | Zeitraum, Einheit, Quelle. Weglassbar. |
| `footnote` | Kleine Zeile am unteren Bildrand, blendet zuletzt ein. Der Platz für Quellen und Schätzungen. Weglassbar. |
| `metrics[].label` | Was die Zahl ist. Wird bei Überlänge abgeschnitten — `build.mjs` warnt. |
| `metrics[].value` | **Zahl** → zählt von 0 hoch. **Text** → steht von Anfang an still. |
| `metrics[].prefix` | Vor die Zahl, z. B. `"$"`. |
| `metrics[].suffix` | Hinter die Zahl, mit führendem Leerzeichen: `" Mio."`, `" %"`, `" Mrd. $"`. |
| `metrics[].decimals` | Nachkommastellen. Standard: 1 bei Kommazahlen, 0 bei ganzen. |
| `metrics[].note` | Zeile unter der Zahl: **was** die Zahl ist. Weglassbar. |
| `metrics[].meta` | Zeile darunter, kleiner und dunkler: **woher** die Zahl kommt — Zeitraum, Quelle, Vergleichsbasis. Weglassbar. |
| `metrics[].delta` | Text im Badge oben rechts, z. B. `"22 %"`, `"Rang 2"`, `"150 Mio."`. Weglassbar. |
| `metrics[].deltaTone` | `up` grün mit ▲, `down` rot mit ▼, `flat` grau ohne Pfeil. Ohne Angabe aus dem Vorzeichen von `delta` erraten. |
| `metrics[].trend` | Form des Verlaufs unten: `"up"`, `"down"`, `"flat"` (waagerecht), `"none"` (kein Verlauf) oder eine eigene Zahlenreihe wie `[3, 5, 4, 9]`. Standard folgt `deltaTone`. |
| `metrics[].color` | `indigo`, `cyan`, `amber`, `emerald`, `pink`, `violet` oder Hex. Standard: Reihenfolge der Palette. |

### Die zwei Zeilen unter der Zahl

`note` und `meta` sind der Grund, warum dieses Format Zahlen tragen kann, die
Erklärung brauchen. Trenne sie strikt:

- **`note` sagt, was die Zahl ist.** „geschätzter Absatz weltweit",
  „weltweite Smartphone-Auslieferungen", „Aufrufe deiner Beiträge".
- **`meta` sagt, woher sie kommt.** Zeitraum, Quelle, Vergleichsbasis:
  „Q2 2026 · IDC", „7 Tage · ggü. Vorwoche".

Drei Regeln, die den Unterschied zwischen belastbar und irreführend machen:

1. **Schreib die Rechenart in `note`, nicht in die Fußzeile.** Eine abgeleitete
   Zahl heißt „geschätzter Absatz", nie „verkaufte Geräte". Wer sie im Video
   liest, sieht die Fußzeile nicht.
2. **Nimm den Fachbegriff der Quelle.** IDC misst *Auslieferungen* (Shipments),
   Counterpoint misst *Verkäufe* (Sell-through). Die Wörter sind nicht
   austauschbar, und die falsche Wahl ist ein sachlicher Fehler.
3. **Nenne den Zeitraum so, wie ihn der Leser prüfen kann.** Bei Firmen mit
   abweichendem Geschäftsjahr beide Bezeichnungen:
   „Apple Q3/FY2026 (Kalender-Q2)".

Beide Zeilen werden **nicht umgebrochen**, sondern bei Überlänge abgeschnitten —
`build.mjs` warnt vorher. Sobald eine Karte `note` oder `meta` hat, reserviert
jede Karte diese Zeile, damit alle Zahlen auf einer Grundlinie stehen.

### Optionen

| Option | Standard | |
| --- | --- | --- |
| `format` | `landscape` | `landscape` 1920×1080, `portrait` 1080×1920, `square` 1080×1080 |
| `columns` | aus Kartenanzahl | Spalten im Raster. Eine unvollständige letzte Reihe wird zentriert. |
| `locale` | `de` | `de` → `16,6` und `1.200`. `en` → `16.6` und `1,200`. |
| `decimalSep` / `groupSep` | aus `locale` | Einzeln überschreibbar. `"groupSep": ""` schaltet die Tausendertrennung ab. |
| `lang` | aus `locale` | `lang`-Attribut des Dokuments, wichtig für die Silbentrennung fremder Sprachen. |
| `stagger` | 0,21 | Abstand zwischen zwei Karteneinsätzen. |
| `count` | 1,53 | Wie lange eine Zahl hochzählt. |
| `hold` | 1,4 | Standzeit auf dem Endstand. |
| `cardAspect` | 0,62 | Kartenhöhe als Anteil der Kartenbreite. |

## Andere Sprache

Sprache ist nur Inhalt: `title`, `subtitle`, `footnote`, `label` und `delta`
übersetzen, `locale` passend setzen (`en` für englische Zahlenschreibweise), und
die Einheiten in `suffix` mit übersetzen — `" Mio."` wird `" M"` oder
`" million"`, `" Mrd. $"` wird `" bn $"`.

Für zwei Sprachfassungen desselben Videos legst du `data.de.json` und
`data.en.json` an und baust zweimal:

```bash
node build.mjs data.de.json && npx hyperframes render . -o ./renders/de.mp4
node build.mjs data.en.json && npx hyperframes render . -o ./renders/en.mp4
```

## Schritt 4 — Bauen, prüfen, rendern

```bash
cd videos/<projekt>
node build.mjs data.json
npx hyperframes check .
npx hyperframes render . -q high -o ./renders/video.mp4
```

`build.mjs` gibt Raster, Kartengröße und Laufzeit aus und **warnt**, wenn eine
Beschriftung nicht in ihre Karte passt oder die Zahlen verkleinert werden
mussten. Nimm die Warnungen ernst: Beide bedeuten, dass der Text im Video
gestaucht oder abgeschnitten aussieht.

Häufigster Fall: `! Label "..." ist zu lang`. Kürze die Beschriftung, statt die
Schriftgröße zu drücken — `App-Downloads` statt `App-Store-Downloads pro Jahr`,
der Rest gehört in `subtitle` oder `footnote`.

## Was du nicht anfassen solltest

Der `STYLE`-Block in `build.mjs` enthält die an der Referenz vermessenen Werte:
Hintergrundverlauf, Kartenfüllung und -rand, alle Schriftgrößen als Verhältnis
zur Kartenbreite, die Badge-Farben und das komplette Timing. Jede Zeile trägt im
Kommentar, woraus sie gemessen wurde.

Drei Dinge sind besonders empfindlich:

- **Der Hochzähler läuft linear** (`ease: "none"`), nicht mit Ease-out. Das ist
  gemessen: In der Referenz steigt die Zahl mit konstanter Rate (83,8 Einheiten
  pro Sekunde bei Zielwert 128,4) und klemmt dann auf dem Zielwert. Ein Ease-out
  lässt die letzten Stellen kriechen und die Karte fertig aussehen, bevor sie es
  ist.
- **`stagger: 0.21`** ist der Abstand, bei dem die Karten als eine Welle laufen.
  Deutlich kleiner wirkt es wie ein gleichzeitiges Aufblitzen, deutlich größer
  wie sechs einzelne Einblendungen.
- **Der Hintergrund ist ein einziger, weit auslaufender Verlauf** von der oberen
  Bildkante. Ein stärkerer oder mittig gesetzter Verlauf erzeugt sichtbare Ringe
  (8-Bit-Banding) auf der großen leeren Fläche.

Ändere daran nur, was der User ausdrücklich verlangt.

## Grenzen, die du kennen solltest

- **Ab sieben Karten wiederholen sich die Farben.** Die Palette hat sechs Farben,
  wie die Referenz. Setz `color` gezielt, wenn zwei gleichfarbige Karten
  nebeneinander liegen.
- **Alle Zahlen teilen eine Schriftgröße**, bestimmt von der längsten. Eine
  einzige lange Zahl (`"1.284.500 Stück"`) verkleinert also alle sechs. Kürze sie
  über die Einheit (`1,28 Mio. Stück`).
- **`note` und `meta` kosten die Zahl Größe.** Mit beiden Zeilen schrumpft die
  Zahl in einem 3×2-Raster von rund 75 auf 61 px, weil die Karte nur so hoch
  werden kann, wie das Raster zulässt. Der Verlauf gibt zuerst Höhe ab, danach
  die Zahl. `build.mjs` sagt beides an.
- **Der Verlauf unten ist Dekoration, kein Diagramm.** Ohne eigene Zahlenreihe in
  `trend` ist seine Form erfunden und zeigt nur die Richtung. Braucht der User
  einen echten Verlauf, gib `trend` als Zahlenreihe mit — oder nimm ein
  Diagrammformat.
- **Negative Werte zählen von 0 nach unten.** Das funktioniert, sieht aber nur
  bei einer einzelnen negativen Karte gut aus.

## Danach

Zeig dem User das gerenderte MP4. Für einen weiteren Datensatz im selben Stil
reicht es, `data.json` zu ändern und `node build.mjs` erneut laufen zu lassen.
