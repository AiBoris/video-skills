# Balken-Race einrichten

Diese Anleitung setzt nichts voraus. Wenn du schon weißt, was Skills sind,
nimm stattdessen `README.md`.

## Was das ist

Ein **Skill** ist eine Anleitung, die dein KI-Agent lesen kann. Ist er einmal
installiert, weißt du: Sagst du „mach mir ein Balken-Race", legt der Agent das
Projekt an, schreibt die Daten hinein und rendert das fertige MP4 — ohne dass du
ihm jedes Mal erklärst, wie das Video aussehen soll.

Ein **Balken-Race** ist ein Video, in dem waagerechte Balken über die Zeit
wachsen und sich überholen. Der Führende ist immer ganz rechts, die Zahl am
Balkenende zählt mit.

## Schritt 1 — Node prüfen

Öffne das Terminal und tippe:

```bash
node --version
```

Kommt eine Zahl ab `v22`, ist alles gut. Kommt eine kleinere Zahl oder eine
Fehlermeldung, installiere Node 22 von <https://nodejs.org> und mach dann weiter.

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

Entpacke den Ordner `balken-race-skill` irgendwohin, wo er liegen bleiben darf.
Dann, mit dem echten Pfad statt des Platzhalters:

```bash
npx skills add /pfad/zu/balken-race-skill --global --copy --all
```

`--copy` ist wichtig: Damit wird der Skill kopiert statt nur verlinkt. Ohne das
Flag geht er kaputt, sobald du den entpackten Ordner verschiebst oder löschst.

**Starte danach deinen KI-Agenten neu.** Vorher sieht er den Skill nicht.

## Schritt 4 — Das erste Video

Sag deinem Agenten einfach, was du willst.

**Mit eigenen Daten:**

> Mach mir ein Balken-Race aus dieser CSV: /pfad/zur/datei.csv

**Ohne eigene Daten:**

> Mach mir ein Balken-Race über die zehn größten Städte Europas seit 1950

Der Agent recherchiert dann die Zahlen und legt sie dir **zur Freigabe vor**,
bevor er baut. Schau sie dir an — Zahlen in einem Video sehen wie Fakten aus,
und Fehler fallen dort niemandem mehr auf.

## Wie deine CSV aussehen sollte

Erste Spalte der Name, danach eine Spalte je Zeitpunkt:

```
Land,2020,2021,2022,2023
Deutschland,412,455,501,548
Frankreich,388,431,489,540
Italien,301,342,398,455
```

Das Format aus vielen Datenbank-Exporten geht auch — eine Zeile je Messpunkt:

```
Land,Jahr,Wert
Deutschland,2020,412
Deutschland,2021,455
```

Deutsche Zahlen (`1.234,5`), Semikolons als Trenner, `€`- und `%`-Zeichen sowie
leere Zellen versteht der Konverter von selbst.

## Wie lang wird das Video?

Das entscheidet die Datenmenge, nicht du:

| Zeitpunkte in den Daten | Länge |
| --- | --- |
| 4 | ca. 4,7 s |
| 6 | ca. 6,5 s |
| 12 | ca. 12 s |
| 24 | ca. 23 s |
| 40 | ca. 37 s |

Werden mehr als sechs Balken gleichzeitig gezeigt, wird es etwas länger — bei
zehn sichtbaren Balken rund ein Zehntel mehr, damit man den Wechseln folgen kann.

Willst du es kürzer, nimm weniger Zeitpunkte — zum Beispiel jedes zweite Jahr.
Das ist besser, als das Tempo hochzudrehen: Bei zu schnellem Lauf kann man den
Überholvorgängen nicht mehr folgen, und genau die sind der Inhalt.

## Wann ein Balken-Race nichts bringt

Wenn sich die Reihenfolge nie ändert. Dann siehst du nur Balken, die gemeinsam
länger werden — dafür lohnt kein Video. Ein guter Agent sagt dir das und schlägt
etwas anderes vor: einen anderen Zeitraum, eine andere Kennzahl (Wachstum statt
absoluter Zahlen ändert die Rangfolge viel häufiger), oder ein schlichtes
Balkendiagramm.

## Hochformat für Social Media

Sag dem Agenten dazu:

> ... und bitte im Hochformat für Instagram

Er setzt dann `format` auf `portrait` (1080×1920). `square` (1080×1080) geht auch.

## Wenn etwas klemmt

**„Dieser Skill braucht die HyperFrames CLI"** — Schritt 2 wurde übersprungen
oder hat nicht funktioniert.

**Der Agent kennt den Skill nicht** — nach der Installation neu starten. Wenn er
ihn danach immer noch nicht kennt, prüfe, ob du `--global` mit angegeben hast.

**Eine Serie hat mehr/weniger Werte als eine andere** — in deiner CSV fehlen
Zellen. Jede Zeile braucht einen Wert für jede Spalte. Lücken lässt du leer, dann
füllt der Konverter sie sinnvoll auf.
