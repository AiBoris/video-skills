---
name: radar-sweep
description: "Erzeugt ein Radar-Video: eine grün leuchtende Radarscheibe mit Ringen, Skala und Fadenkreuz baut sich auf, ein Suchstrahl dreht sich mit nachziehendem Schweif darüber und lässt bernsteinfarbene Kontakte kurz aufblitzen, während oben links eine Überschrift steht und unten rechts Koordinaten mitlaufen. Dunkel, technisch, stumm, 4-12 s. Nutze es, wenn jemand Suchen, Aufspüren, Scannen oder Beobachten als Video will: 'Radar-Video', 'Radar-Animation', 'wir finden X', 'Sonar', 'Scan-Animation', 'Zielsuche', 'Monitoring-Video', 'Recruiting-Hook', 'radar sweep video'. Kann eine Serie bauen: eine Namensliste ergibt pro Name ein eigenes Video mit identischem Bild. Nicht für Landkarten mit echten Orten, Balken- oder Tortendiagramme oder Sprecher-Videos. Voraussetzung: HyperFrames CLI."
---

# Radar-Sweep

Eine Radarscheibe im Dunkeln. Ringe springen von innen nach außen auf, der
Suchstrahl beginnt zu kreisen und zieht einen verblassenden Schweif hinter sich
her, Kontakte leuchten bernsteinfarben auf, wenn der Strahl über sie streicht,
und dimmen danach langsam weg. Oben links eine Überschrift, unten rechts
mitlaufende Koordinaten. Am Ende blendet alles weg.

Kein Ton, keine Sprecherstimme, kein Schnitt.

Geometrie, Federn und Timing sind aus einer gerenderten Referenz ausgelesen und
stecken fertig in `template/build.mjs`. Du schreibst nur die Überschrift.

## Voraussetzung zuerst prüfen

```bash
npx hyperframes --version
```

Schlägt das fehl, brich ab und sage dem User:

> Dieser Skill braucht die HyperFrames CLI. Installieren mit:
> `npx skills add heygen-com/hyperframes`

Rate nicht daran vorbei und baue keinen Ersatz.

## Schritt 1 — Die Überschrift klären

Frage den User nach der **Überschrift**. Sie wird in Großbuchstaben gesetzt und
steht oben links über der Scheibe.

### Die Redaktionsregel

Das Bild behauptet: *hier wird gesucht, und es wird gefunden.* Die Überschrift
muss diese Behauptung einlösen, sonst ist das Radar bloß Dekoration.

- Gut: `Wir finden Fachkräfte für Nexora Automation`
- Gut: `47 Wettbewerber. Einer wächst schneller als du.`
- Tot: `Willkommen bei der Nexora Automation GmbH`

Am stärksten wird es, wenn die Überschrift den **Namen des Empfängers** trägt —
dann sieht er sich selbst im Fadenkreuz. Genau dafür gibt es die Serie in
Schritt 3.

### Harte Grenzen

- **Maximal drei Zeilen**, sonst läuft die Überschrift in die Scheibe.
  `build.mjs` rechnet die Zeichengrenze für Format und Schriftgröße aus und
  warnt. Nimm die Warnung ernst oder setz `titleSize` kleiner.
- Der Untertitel ist eine einzelne kurze Zeile in Versalien und Monospace
  (`GRID REF 34-B // ACTIVE`). Er soll wie ein Statusfeld wirken, nicht wie ein
  zweiter Satz. Leer lassen geht auch.

## Schritt 2 — Look festlegen

Fragen, die du nur stellst, wenn der User nichts dazu gesagt hat.

| Feld        | Voreinstellung | Alternativen                                  |
| ----------- | -------------- | --------------------------------------------- |
| `format`    | `16:9`         | `9:16`, `1:1`, `4:5`                          |
| `preset`    | `gruen`        | `bernstein`, `blau`, `rot`                    |
| `duration`  | `6`            | 3 bis 20 Sekunden                             |
| `blips`     | `9`            | 1 bis 24 Kontakte                             |
| `crosshair` | `true`         | `false` — ohne Fadenkreuz                     |
| `scanlines` | `true`         | `false` — ohne CRT-Zeilen                     |

`gruen` ist die Referenz: Signalgrün auf Fast-Schwarz, bernsteinfarbene
Kontakte. Nimm sie im Zweifel.

Einzelne Farben lassen sich über `colors` überschreiben, etwa
`"colors": { "blip": "#ff6b4a" }`. Nur tun, wenn der User es verlangt — die
vier Presets sind aufeinander abgestimmt.

### Was die Laufzeit tut

Der Strahl braucht **110 Frames für eine Umdrehung**, also gut 3,7 Sekunden.
Die Voreinstellung von 6 s ergibt knapp anderthalb Umdrehungen: genug, damit
jeder Kontakt einmal aufleuchtet, kurz genug für einen Hook. 8 s ergibt zwei
volle Umdrehungen. `build.mjs` gibt die Zahl der Umdrehungen aus.

Unter 5 s schafft der Strahl keine volle Runde — dann bleiben Kontakte dunkel.
Das kann gewollt sein, ist aber meist ein Versehen.

## Schritt 3 — Serie oder Einzelstück

`title` darf den Platzhalter `{name}` enthalten. Steht in `names` eine Liste,
baut `node build.mjs <index>` daraus je ein Video — gleiche Scheibe, gleiche
Kontakte, gleiche Bewegung, nur ein anderer Name.

Das ist der eigentliche Zweck des Formats: personalisierte Erstkontakt-Videos.

```json
{
  "title": "Wir finden Fachkräfte für {name}",
  "names": ["Nexora Automation GmbH", "Veltrix Systems GmbH"]
}
```

Ohne `names` wird `title` unverändert gesetzt; ein `{name}` darin fällt weg.

## Schritt 4 — Projekt anlegen

`<projekt>` ist ein kurzer kebab-case-Name aus dem Thema.

```bash
npx hyperframes init videos/<projekt> --non-interactive --example=blank
cp -R <SKILL_DIR>/template/build.mjs <SKILL_DIR>/template/content.json <SKILL_DIR>/template/assets videos/<projekt>/
```

Kopiere `build.mjs` und `assets/` **immer ins Projekt**. Führe sie nie aus dem
Skill-Ordner heraus aus: Das fertige Videoprojekt muss auch dann noch rendern,
wenn dieser Skill aktualisiert oder deinstalliert wird.

## Schritt 5 — Inhalt schreiben

`videos/<projekt>/content.json`:

```json
{
  "title": "Wir finden Fachkräfte für {name}",
  "names": ["Nexora Automation GmbH"],
  "subtitle": "GRID REF 34-B // ACTIVE",
  "format": "16:9",
  "duration": 6,
  "preset": "gruen",
  "blips": 9,
  "crosshair": true,
  "scanlines": true
}
```

## Schritt 6 — Bauen, prüfen, rendern

```bash
cd videos/<projekt>
node build.mjs
npx hyperframes check .
npx hyperframes render . -q high -o ./renders/video.mp4
```

Für eine Serie einmal pro Name:

```bash
for i in 0 1 2; do node build.mjs $i && npx hyperframes render . -q high -o ./renders/version-$i.mp4; done
```

`build.mjs` schreibt zwei Dateien: `index.html` (die Hülle mit der Laufzeit) und
`compositions/radar-scene.html` (die Szene). Das ist die Form, die
`hyperframes lint` verlangt, sobald ein getaktetes Element verschachtelte
Kinder hat — sie hält den Check auf null Warnungen und die Studio-Timeline
lesbar.

## Was du nicht anfassen solltest

Der `STYLE`-Block in `build.mjs` enthält die aus der Referenz ausgelesenen
Werte. Alle Längen stehen als **Anteil des Radarradius**, nicht in Pixeln —
deshalb hält das Bild in jedem Format. Für ein anderes Seitenverhältnis fasst
du sie also **nicht** an, dafür gibt es `format`.

Drei Dinge sind empfindlich:

- **`ringSpring` und `titleSpring`.** Das sind echte Federparameter
  (`damping` / `stiffness` / `mass`), die pro Frame durchgerechnet werden, nicht
  GSAP-Eases. Wer daran dreht, bekommt entweder ein träges Aufgehen oder ein
  Überschwingen, das die Ringe kurz über den Rand schiebt.
- **`sweepPeriod: 110`.** Bestimmt die Drehzahl. Schneller wirkt hektisch,
  langsamer lässt die Kontakte zu lange dunkel.
- **`blipFalloff: 2.2`.** Wie schnell ein Kontakt hinter dem Strahl ausgeht.
  Kleiner heißt: alles leuchtet dauernd, und die Scheibe verliert ihre Tiefe.

Die Kontakte selbst sind **seeded**, nicht zufällig: dieselbe Kontaktzahl ergibt
immer dieselbe Verteilung. Das ist der Grund, warum eine Serie von zwanzig
Videos dasselbe Bild zeigt und nur den Namen wechselt. Zieh den Seed nicht, ohne
dass der User eine andere Verteilung will.

## Danach

Zeige dem User das gerenderte MP4. Für eine weitere Überschrift im selben Stil
reicht es, `content.json` zu ändern und `node build.mjs` erneut laufen zu lassen.
