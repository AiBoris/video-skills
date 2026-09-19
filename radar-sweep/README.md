# Radar-Sweep — Skill für KI-Agenten

Erzeugt Videos mit einer drehenden Radarscheibe: Ringe springen auf, ein
Suchstrahl kreist mit nachziehendem Schweif, Kontakte blitzen bernsteinfarben
auf. Dunkel, technisch, stumm, 4 bis 12 Sekunden.

> **Neu hier? Lies ANLEITUNG.md** — Schritt für Schritt, ohne Vorkenntnisse.
> Das hier ist die Kurzfassung.

## Installieren

```bash
npx skills add AiBoris/video-skills@radar-sweep --global --copy --all
```

Danach den KI-Agenten neu starten.

## Voraussetzungen

Node.js 22 oder neuer, FFmpeg, und die HyperFrames CLI:

```bash
brew install ffmpeg
npx skills add heygen-com/hyperframes --global --copy --all
```

## Benutzen

> Mach mir ein Radar-Video mit der Überschrift „Wir finden Fachkräfte für Nexora Automation"

## Der eigentliche Trick: die Serie

`title` darf `{name}` enthalten. Steht in `names` eine Liste von Firmen, baut
der Skill daraus je ein eigenes Video — gleiche Scheibe, gleiche Kontakte,
gleiche Bewegung, nur ein anderer Name im Titel.

```json
{
  "title": "Wir finden Fachkräfte für {name}",
  "names": ["Nexora Automation GmbH", "Veltrix Systems GmbH"]
}
```

Dafür ist das Format gebaut: personalisierte Erstkontakt-Videos, bei denen der
Empfänger sich selbst im Fadenkreuz sieht.

## Einstellungen

| Feld | Voreinstellung | Alternativen |
| --- | --- | --- |
| `format` | `16:9` | `9:16`, `1:1`, `4:5` |
| `preset` | `gruen` | `bernstein`, `blau`, `rot` |
| `duration` | `6` | 3 bis 20 Sekunden |
| `blips` | `9` | 1 bis 24 Kontakte |
| `crosshair` / `scanlines` | `true` | `false` |

## Grenzen

- Die Überschrift darf **höchstens drei Zeilen** ergeben, sonst läuft sie in die
  Scheibe. `build.mjs` warnt.
- Der Strahl braucht **3,7 Sekunden pro Umdrehung**. Unter 5 Sekunden Laufzeit
  bleiben Kontakte dunkel.
- Kein Ton, keine echten Landkarten, keine echten Koordinaten — die
  mitlaufenden Werte unten rechts sind Kulisse.

## Was drin ist

```
ANLEITUNG.md              Einrichtung für Einsteiger
SKILL.md                  Anleitung für den Agenten
template/
  build.mjs               Generator + alle ausgelesenen Stilwerte
  content.json            Beispielinhalt
  assets/fonts/           Inter und JetBrains Mono (liegen lokal bei, damit
                          Renders offline und überall identisch aussehen)
```
