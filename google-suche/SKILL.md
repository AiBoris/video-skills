---
name: google-suche
description: "Erzeugt ein Video, in dem sich eine Frage Zeichen für Zeichen in das Google-Suchfeld tippt und ein Mauszeiger anschließend auf 'Google Search' klickt. Die Google-Startseite ist 1:1 nachgebaut (Original-Wordmark, Lupe, Mikrofon, Pill-Suchfeld), stumm, ca. 6-10 s, in 16:9, 9:16, 1:1 oder 4:5. Nutze es, wenn jemand den Moment der Suche als Video will: 'Google-Suche als Video', 'Frage wird gegoogelt', 'Suchleiste tippt sich', 'Google Search Video', 'jemand googelt', 'Suchanfrage Animation', 'search bar typing video'. Typischer Einsatz: Video-Hook, in dem das Publikum die eigene Frage auf dem Bildschirm sieht. Nicht für Suchergebnisseiten, Browser-Aufnahmen echter Webseiten oder Erklärvideos mit Sprecher. Voraussetzung: HyperFrames CLI."
---

# Google-Suche

Eine leere Google-Startseite. Der Textcursor blinkt, eine Frage tippt sich
Zeichen für Zeichen ins Suchfeld, ein Mauszeiger fährt herein, legt sich auf
„Google Search", klickt — und danach passiert nichts mehr.

Kein Ton, keine Ergebnisseite, kein Seitenwechsel. Der Hook ist die Frage.

Geometrie, Farben und Timing sind aus einem Referenz-Screenshot vermessen und
stecken fertig in `template/build.mjs`. Du schreibst nur die Frage.

## Voraussetzung zuerst prüfen

```bash
npx hyperframes --version
```

Schlägt das fehl, brich ab und sage dem User:

> Dieser Skill braucht die HyperFrames CLI. Installieren mit:
> `npx skills add heygen-com/hyperframes`

Rate nicht daran vorbei und baue keinen Ersatz.

## Schritt 1 — Die Frage klären

Frage den User nach der **exakten Suchanfrage**. Sie ist der ganze Inhalt des
Videos, also übernimm sie wortwörtlich und formuliere sie nicht um.

Nennt er nur ein Thema, schlage zwei bis drei Formulierungen vor und lass ihn
wählen, bevor du irgendetwas baust.

### Die Redaktionsregel

Das Format funktioniert, weil der Zuschauer sich beim Tippen selbst erkennt.
Es muss die Frage sein, die er **wirklich** eingibt — nicht die, die das
Marketing gern hätte.

- Gut: `Wie erstelle ich Videos mit KI?`
- Gut: `warum konvertiert meine landingpage nicht`
- Tot: `Professionelle Videoproduktion Agentur Premium`

Kleinschreibung ohne Satzzeichen wirkt echter als ein sauberer Satz. Frag den
User, welche Variante er will — beide laufen.

### Harte Grenzen

- **Maximal ~60 Zeichen.** `build.mjs` rechnet die Grenze für Format und `scale`
  aus und warnt. Längerer Text wird links abgeschnitten, genau wie in
  einem echten Eingabefeld — das sieht absichtlich aus, ist aber selten gewollt.
- **Eine Zeile**, kein Zeilenumbruch.
- Umlaute und Emojis laufen.

## Schritt 2 — Look festlegen

Fragen, die du nur stellst, wenn der User nichts dazu gesagt hat. Ansonsten
nimm die Voreinstellung.

| Feld     | Voreinstellung | Alternativen                                             |
| -------- | -------------- | -------------------------------------------------------- |
| `format` | `16:9`         | `9:16`, `1:1`, `4:5`                                     |
| `scale`  | `1`            | 0.4 bis 3 — vergrößert die Seite, ohne sie zu verschieben |
| `theme`  | `cream`        | `light` (weiße Startseite), `dark` (Dark Mode)           |
| `labels` | englisch       | deutsch: `"Google Suche"` / `"Auf gut Glück!"`           |
| `click`  | `search`       | `lucky` — der Zeiger klickt „Auf gut Glück!" stattdessen  |

`cream` ist die warme Variante aus der Referenz und hebt sich in einem Feed
deutlich stärker ab als das gewohnte Weiß. Nimm sie im Zweifel.

### Format und `scale` hängen zusammen

Die Seite behält in jedem Format ihre gemessenen Pixelmaße; nur die
Höhenpositionen wandern anteilig mit. In 16:9 ist das genau die Referenz — in
9:16 wird daraus die Desktop-Seite in einem schmalen Rahmen, mit sehr kleiner
Schrift und viel Luft unten.

Das ist manchmal genau der gewollte Look. Für ein Reel, das auf dem Handy
lesbar sein soll, ist es das nicht. Dann `scale` hochsetzen:

| Format | `scale` | Ergebnis                                                     |
| ------ | ------- | ------------------------------------------------------------ |
| `16:9` | `1`     | die Referenz, unverändert                                    |
| `9:16` | `1`     | Desktop-Seite im Hochformat — klein, viel Weißraum           |
| `9:16` | `1.5`   | Suchfeld füllt die Breite, Frage gut lesbar (**Empfehlung**) |
| `1:1`  | `1.3`   | ausgewogen für den Feed                                      |

Bei 1080 px Breite ist `1.5` das Maximum, bevor das Suchfeld den Rand berührt.
`build.mjs` warnt, wenn es zu eng wird — nimm die Warnung ernst.

Frage den User im Hochformat aktiv, welche der beiden Varianten er will. Baue
im Zweifel beide: es kostet einen zweiten `node build.mjs` und einen Render.

## Schritt 3 — Projekt anlegen

`<projekt>` ist ein kurzer kebab-case-Name aus der Frage.

```bash
npx hyperframes init videos/<projekt> --non-interactive --example=blank
cp -R <SKILL_DIR>/template/build.mjs <SKILL_DIR>/template/content.json <SKILL_DIR>/template/assets videos/<projekt>/
```

Kopiere `build.mjs` und `assets/` **immer ins Projekt**. Führe sie nie aus dem
Skill-Ordner heraus aus: Das fertige Videoprojekt muss auch dann noch rendern,
wenn dieser Skill aktualisiert oder deinstalliert wird.

## Schritt 4 — Inhalt schreiben

`videos/<projekt>/content.json`:

```json
{
  "query": "Wie erstelle ich Videos mit KI?",
  "format": "16:9",
  "scale": 1,
  "theme": "cream",
  "labels": {
    "search": "Google Search",
    "lucky": "I'm Feeling Lucky"
  },
  "click": "search"
}
```

## Schritt 5 — Bauen, prüfen, rendern

```bash
cd videos/<projekt>
node build.mjs
npx hyperframes check .
npx hyperframes render . -q high -o ./renders/video.mp4
```

`build.mjs` gibt Tippdauer, Klickzeitpunkt und Gesamtlaufzeit aus. Die Laufzeit
ergibt sich aus der Zeichenzahl — eine kurze Frage ergibt ein kürzeres Video.

## Der Ablauf, den das Video erzeugt

| Beat        | Was passiert                                                       |
| ----------- | ------------------------------------------------------------------ |
| 0.0–0.9 s   | leeres Suchfeld, Textcursor blinkt                                 |
| ab 0.9 s    | die Frage tippt sich, mit ungleichmäßigem Anschlag und Wortpausen  |
| +0.4 s      | die Frage steht vollständig                                        |
| +1.05 s     | der Mauszeiger kommt von unten rechts, Hover mit Unterstrich       |
| +0.15 s     | Klick — der Zeiger drückt, ein Ring läuft aus                      |
| +1.05 s     | Ende. Es passiert bewusst nichts mehr.                             |

Der Tipprhythmus ist **seeded**, nicht zufällig: Derselbe Text ergibt bei jedem
Render exakt denselben Anschlag.

## Was du nicht anfassen solltest

Der `STYLE`-Block in `build.mjs` enthält die vermessenen Werte des Referenz-
Screenshots — Boxbreite 640, Höhe 48, Radius 26, Wordmark 230 px, die
Y-Positionen von Logo, Feld und Links, gemessen in einem 1080 px hohen Rahmen. Änder daran nur, was der User
ausdrücklich verlangt: Die Seite sieht sonst schnell „fast wie Google" aus,
und genau das fällt auf.

Für ein anderes Seitenverhältnis fasst du diese Werte **nicht** an — dafür gibt
es `format` und `scale`. Wer stattdessen an `boxWidth` dreht, verschiebt die
Zeichengrenze, die `build.mjs` ausrechnet: Die Warnung beim Bauen ist dann keine
Kleinigkeit, sondern abgeschnittener Text.

`cursorFromWide` / `cursorFromTall` legen fest, aus welcher Richtung der
Mauszeiger hereinfährt — im Hochformat von weiter unten, weil rechts kein Platz
ist. Die Wahl trifft `build.mjs` selbst anhand der Bildmaße.

`charsPerSecond: 8.7` ist die gemessene Tippgeschwindigkeit. Höher wirkt
maschinell, niedriger zäh.

## Rechtliches

`template/assets/google-logo.svg` ist Googles Wortmarke. Der Skill baut damit
eine erkennbare Nachstellung der Google-Startseite — üblich und unproblematisch
für Mockups, Hooks und redaktionelle Videos, aber es ist fremdes Markenrecht.
Weise den User darauf hin, wenn das Video eine Google-Zugehörigkeit oder
-Empfehlung suggerieren würde.

## Danach

Zeige dem User das gerenderte MP4. Für eine weitere Frage im selben Stil reicht
es, `content.json` zu ändern und `node build.mjs` erneut laufen zu lassen.
