# Kennzahlen-Karten einrichten

Diese Anleitung setzt nichts voraus. Wenn du schon weißt, was Skills sind,
nimm stattdessen `README.md`.

## Was das ist

Ein **Skill** ist eine Anleitung, die dein KI-Agent lesen kann. Ist er einmal
installiert, weißt du: Sagst du „mach mir ein Kennzahlen-Video", legt der Agent
das Projekt an, schreibt die Zahlen hinein und rendert das fertige MP4 — ohne
dass du ihm jedes Mal erklärst, wie das Video aussehen soll.

**Kennzahlen-Karten** sind ein Video, in dem sechs Karten versetzt von unten ins
Bild fahren. In jeder Karte steht eine Beschriftung, oben rechts ein farbiges
Badge mit der Veränderung, darunter eine große Zahl, die von 0 auf ihren Wert
hochzählt, zwei kleine Zeilen mit Erklärung und Quelle, und am Kartenboden ein
farbiger Verlauf.

## Schritt 1 — Node prüfen

Öffne das Terminal und tippe:

```bash
node --version
```

Kommt eine Zahl ab `v22`, ist alles gut. Kommt eine kleinere Zahl oder eine
Fehlermeldung, installiere Node 22 von <https://nodejs.org> und mach dann weiter.

**FFmpeg.** Das Programm, das am Ende die Videodatei schreibt. Prüfen mit:

```
ffmpeg -version
```

Kommt eine Fehlermeldung, installiere es — Mac: `brew install ffmpeg`
(Homebrew von <https://brew.sh>), Windows: `winget install ffmpeg`.

## Schritt 2 — HyperFrames installieren

Das ist die Software, die aus HTML ein Video rendert. Der Skill braucht sie.

```bash
npx skills add heygen-com/hyperframes --global --copy --all
```

Prüfen, ob es geklappt hat:

```bash
npx hyperframes --version
```

Kommt eine Versionsnummer, passt es.

## Schritt 3 — Diesen Skill installieren

Entpacke den Ordner `kennzahlen-karten-skill` irgendwohin, wo er liegen bleiben
darf. Dann, mit dem echten Pfad statt des Platzhalters:

```bash
npx skills add /pfad/zu/kennzahlen-karten-skill --global --copy --all
```

`--copy` ist wichtig: Damit wird der Skill kopiert statt nur verlinkt. Ohne das
Flag geht er kaputt, sobald du den entpackten Ordner verschiebst oder löschst.

**Starte danach deinen KI-Agenten neu.** Vorher sieht er den Skill nicht.

## Schritt 4 — Das erste Video

Sag deinem Agenten einfach, was du willst.

**Mit eigenen Zahlen:**

> Mach mir ein Kennzahlen-Video aus dieser CSV: /pfad/zur/datei.csv

**Ohne eigene Zahlen:**

> Mach mir ein Kennzahlen-Video zu den iPhone-17-Verkäufen im letzten Quartal

Der Agent recherchiert dann die Zahlen und legt sie dir **zur Freigabe vor**,
bevor er baut. Schau sie dir an — Zahlen in einem Video sehen wie Fakten aus,
und Fehler fallen dort niemandem mehr auf.

## Wie deine CSV aussehen sollte

Eine Zeile je Karte. Pflicht sind nur die ersten zwei Spalten:

```
label;value;suffix;note;meta;delta;tone
Impressions;317;;Aufrufe deiner Beiträge;7 Tage · ggü. Vorwoche;67 %;down
Follower:innen;8879;;Follower:innen insgesamt;Stand 7. September;0 %;flat
Profilbesuche;266;;Besucher:innen deines Profils;90 Tage · ggü. Vorwoche;33 %;down
```

| Spalte | |
| --- | --- |
| `label` | Was die Zahl ist. Kurz halten, sonst wird sie abgeschnitten. |
| `value` | Die Zahl. Zählt im Video von 0 hoch. |
| `suffix` | Die Einheit, mit Leerzeichen davor: `" Mio."`, `" %"`, `" Mrd. $"`. |
| `note` | Die Zeile unter der Zahl: **was** die Zahl ist. |
| `meta` | Die kleinere Zeile darunter: **woher** sie kommt — Zeitraum, Quelle, Vergleich. |
| `delta` | Text im Badge oben rechts: `22 %`, `Rang 2`, `150 Mio.`. |
| `tone` | `up` grün mit Pfeil nach oben, `down` rot mit Pfeil nach unten, `flat` grau ohne Pfeil. |

Deutsche Spaltennamen gehen auch (`Beschriftung`, `Wert`, `Einheit`, `Delta`,
`Trend`, `Farbe`), ebenso deutsche Zahlen (`1.234,5`), Semikolon oder Komma als
Trenner und leere Zellen.

## Wie viele Karten?

| Karten | |
| --- | --- |
| 3 | Raster wirkt leer, geht aber |
| **4–6** | **das Optimum** |
| 7–9 | wird knapp zu lesen |
| 10–12 | Obergrenze, nur für Standbilder sinnvoll |

Sechs Karten ergeben rund 4,3 Sekunden Video. Jede weitere Karte kommt 0,2
Sekunden später herein, das Video wird also entsprechend länger.

## Wann Kennzahlen-Karten nichts bringen

Wenn alle Karten dieselbe Aussage in anderen Einheiten sind. Sechs Karten sind
sechs Aussagen — ein guter Mix ist: die Hauptzahl, eine Vergleichszahl (dasselbe
für ein anderes Modell oder Quartal) und eine Kontextzahl aus einer anderen
Dimension, die die Hauptzahl einordnet.

Für **Ranglisten über die Zeit** („wer führt wann?") ist das der falsche Skill —
dafür ist das Balken-Race gemacht.

## Andere Sprache

Sag es dem Agenten dazu:

> ... und bitte auf Englisch

Er übersetzt dann alle Beschriftungen und stellt die Zahlenschreibweise um:
`16,6` wird `16.6`, `1.200` wird `1,200`. Beide Fassungen desselben Videos gehen
auch — er legt dann `data.de.json` und `data.en.json` an und rendert zweimal.

## Hochformat für Social Media

> ... und bitte im Hochformat für Instagram

Er setzt dann `format` auf `portrait` (1080×1920) und stellt das Raster auf zwei
Spalten um. `square` (1080×1080) geht auch.

## Wenn etwas klemmt

**„Dieser Skill braucht die HyperFrames CLI"** — Schritt 2 wurde übersprungen
oder hat nicht funktioniert.

**Der Agent kennt den Skill nicht** — nach der Installation neu starten. Wenn er
ihn danach immer noch nicht kennt, prüfe, ob du `--global` mit angegeben hast.

**„Label ... ist zu lang und wird abgeschnitten"** — eine Beschriftung passt
nicht in ihre Karte. Kürze sie; der lange Text gehört in den Untertitel oder die
Fußzeile, nicht in die Karte.

**Die Zahlen sehen klein aus** — zwei Gründe. Erstens teilen alle Karten eine
Schriftgröße, und die richtet sich nach der längsten Zahl: kürze sie über die
Einheit (`1,28 Mio.` statt `1.284.500`). Zweitens kosten die Zeilen `note` und
`meta` Platz — ohne sie ist die Zahl rund ein Fünftel größer.
