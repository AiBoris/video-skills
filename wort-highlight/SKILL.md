---
name: wort-highlight
description: "Erzeugt ein Kinetic-Typography-Video: farbiger Vollflächen-Hintergrund, zwei Zeilen fetter Schrift, und ein schräger dunkler Balken wandert Wort für Wort durch den Satz und dreht das Wort darunter auf Weiß. Nutze es, wenn jemand einen Text als Video will: 'Wort-Highlight', 'Kinetic Typography', 'Text-Video', 'Textanimation', 'Wort für Wort hervorheben', 'Claim als Video', 'Slogan-Video', 'Hook-Video für Social'. Der Text wird selbstständig in Phrasen und Zeilen aufgeteilt. Die Farbe kommt aus dem Referenz-Gelb, aus einer Vorgabe des Users oder wird aus seiner Webseite ausgelesen. Nicht für Sprecher-Videos, Untertitel, Balkendiagramme oder Produktdemos. Voraussetzung: HyperFrames CLI."
---

# Wort-Highlight

Ein Satz steht groß im Bild, höchstens zwei Zeilen auf einmal. Ein schräger
dunkler Balken springt von Wort zu Wort und dreht das Wort darunter auf Weiß.
Kein Ton, keine Bilder, keine Sprecherstimme — der Text ist das ganze Video.

Optik und Timing sind aus einer Referenzaufnahme vermessen und stecken fertig in
`template/build.mjs`. Du lieferst nur Text und Farbe.

## Voraussetzung zuerst prüfen

```bash
npx hyperframes --version
```

Schlägt das fehl, brich ab und sage dem User:

> Dieser Skill braucht die HyperFrames CLI. Installieren mit:
> `npx skills add heygen-com/hyperframes`

Rate nicht daran vorbei und baue keinen Ersatz.

## Schritt 1 — Text klären

Frage den User, ob er den **Text vorgibt** oder ein **Thema** nennt. Bei einem
Thema schreibst du den Text selbst und legst ihn zur Freigabe vor, bevor du
irgendetwas baust.

Du gibst **einen Fließtext** in `content.json`. Zeilen- und Phrasenumbrüche
setzt `build.mjs` selbst — schreib keine Zeilenumbrüche in den Text hinein.

### Die Redaktionsregel

Jedes Wort bekommt seinen eigenen Moment im Balken, also zählt jedes Wort.
Füllwörter fallen in dieser Optik sofort auf.

- **15 bis 40 Wörter.** Darunter wirkt das Video abgehackt, darüber ermüdet es.
  Etwa 0,45 s pro Wort: 25 Wörter ≈ 14 s.
- **Kurze Hauptsätze.** Satzzeichen sind die Schnitte: Punkt, Komma,
  Gedankenstrich, Doppelpunkt und Semikolon beenden jeweils eine Phrase.
  Wer die Schnitte steuern will, setzt Kommas.
- **Keine Schachtelsätze.** Ein Nebensatz, der über vier Phrasen läuft, ist beim
  letzten Wort nicht mehr lesbar.
- **Zahlen und Zeichen zusammenlassen.** `100 %` bleibt ein Wort, das ist schon
  eingebaut.

## Schritt 2 — Farbe klären

Drei Wege, in dieser Reihenfolge:

1. **Der User nennt eine Farbe** (`#1B6EF3`, "unser Blau", ein Hex aus dem
   Styleguide) → direkt in `content.json` unter `brand.bg`.
2. **Der User nennt eine Webseite** → `brand.mjs` liest sie aus (Schritt 4).
3. **Nichts davon** → das Referenz-Gelb `#FAC143` bleibt stehen. Frag einmal
   nach, bevor du damit renderst.

Du gibst **nur den Hintergrund** an. Schrift, Balken und Balkenschrift leitet
`build.mjs` daraus ab: heller Hintergrund bekommt fast schwarze Schrift und
einen fast schwarzen Balken, dunkler Hintergrund dreht beides um. Setz
`brand.ink`, `brand.slab` oder `brand.slabInk` nur, wenn der User das ausdrücklich
verlangt — sonst kippt der Kontrast.

Sehr blasse oder sehr dunkle Markenfarben tragen dieses Format nicht. Wenn die
Marke ein helles Grau ist, sag das und schlage die kräftigste Farbe aus dem
Markenset vor.

## Schritt 3 — Projekt anlegen

`<projekt>` ist ein kurzer kebab-case-Name aus dem Thema.

```bash
npx hyperframes init videos/<projekt> --non-interactive --example=blank
cp -R <SKILL_DIR>/template/build.mjs <SKILL_DIR>/template/brand.mjs \
      <SKILL_DIR>/template/content.json <SKILL_DIR>/template/assets videos/<projekt>/
```

Kopiere die Skripte und die Schrift **immer ins Projekt**. Führe sie nie aus dem
Skill-Ordner heraus aus: Das fertige Videoprojekt muss auch dann noch rendern,
wenn dieser Skill aktualisiert oder deinstalliert wird.

## Schritt 4 — Markenfarbe aus der Webseite (nur Weg 2)

```bash
cd videos/<projekt>
node brand.mjs https://kundenseite.de          # nur anzeigen
node brand.mjs https://kundenseite.de --write  # in content.json übernehmen
```

Das Skript liest die Seite und ihre Stylesheets und rankt die Farben: eine
deklarierte Marken-Variable (`--brand`, `--primary`, `--accent`) schlägt alles,
danach `<meta name="theme-color">`, danach Häufigkeit im CSS. Es zeigt die sechs
besten Treffer.

**Zeig dem User die Liste, bevor du `--write` ausführst.** Das Skript kann eine
Akzentfarbe erwischen, die auf der Seite nur in einem Button vorkommt. Die
Entscheidung gehört ihm, nicht dem Ranking.

Findet es nichts Brauchbares — bei Seiten, die ihr CSS in JavaScript bündeln,
kommt das vor — beendet es sich mit einer Meldung. Dann frag den User nach dem
Hex-Wert. Bau kein Fallback dazu.

## Schritt 5 — Inhalt schreiben

`videos/<projekt>/content.json`:

```json
{
  "text": "Dein Fließtext. Ein Satz, zwei Sätze, ruhig mit Kommas.",
  "brand": { "bg": "#FAC143" },
  "speed": 1,
  "width": 1920,
  "height": 1080
}
```

Optional:

- `speed` — Tempo. `1.2` ist zwanzig Prozent schneller, `0.85` langsamer.
- `fontSize` — überschreibt die berechnete Schriftgröße in px. Nur anfassen,
  wenn der User mehr Wörter pro Zeile will: kleinere Schrift heißt längere
  Zeilen. Bei 1920 px Breite sind 171 px der Referenzwert, 150 px packt bei
  deutschen Texten meist ein Wort mehr pro Zeile.
- `width` / `height` — z. B. `1080` × `1920` für Hochformat. Die Schriftgröße
  skaliert mit.

## Schritt 6 — Bauen, prüfen, rendern

```bash
cd videos/<projekt>
node build.mjs
npx hyperframes check .
npx hyperframes render . -q high -o ./renders/video.mp4
```

`build.mjs` gibt Laufzeit, Schriftgröße und die fertige Aufteilung Phrase für
Phrase aus. **Lies diese Liste, bevor du renderst** — daran siehst du sofort,
ob der Umbruch den Satz zerlegt hat. Wenn eine Phrase schlecht sitzt, änderst du
den Text (ein Komma mehr, ein Wort kürzer), nicht den `STYLE`-Block.

`check` meldet bei diesem Format zwei Warnungen, die so sein müssen:
`timeline_track_too_dense` (jede Phrase ist ein eigener Clip) und ein paar
Kontrast-Warnungen (der Prüfer misst die weiße Kopie gegen den Hintergrund statt
gegen den Balken, der wirklich dahinter liegt). Fehler dürfen keine auftreten.

## Was du nicht anfassen solltest

Der `STYLE`-Block in `build.mjs` enthält die vermessenen Werte der Referenz —
Schräge, Balkenhöhe, Zeilenabstand, Polsterung — alle in em, damit eine einzige
Schriftgröße das ganze Design skaliert. Änder daran nur, was der User
ausdrücklich verlangt.

Zwei Dinge hängen zusammen und dürfen nur gemeinsam geändert werden:

- **`font-kerning: none` und `font-variant-ligatures: none` im erzeugten CSS.**
  Nur dadurch entspricht die Summe der Breiten aus
  `assets/metrics/poppins-500.json` exakt dem, was der Browser setzt. Ohne sie
  wandern alle Balken um ein paar Pixel neben ihr Wort, und keine Prüfung
  schlägt an.
- **Schriftart und Breitentabelle.** Eine andere Schrift braucht eine neue
  `poppins-500.json` (Vorschubbreiten in em, gemessen mit ausgeschaltetem
  Kerning) und neue Werte für `baselineFromTop`, `cap`, `ascender`, `descender`.
  Die Kopfzeile der JSON sagt, wie sie gemessen wurden.

## Danach

Zeige dem User das gerenderte MP4. Für einen weiteren Text im selben Stil reicht
es, `content.json` zu ändern und `node build.mjs` erneut laufen zu lassen.
