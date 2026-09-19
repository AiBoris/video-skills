---
name: typewriter-liste
description: "Erzeugt ein Video, in dem sich eine nummerierte Liste Zeichen für Zeichen auf ein Blatt Papier tippt — Schreibmaschinen-Optik, Papiertextur, stumm, 16:9, ca. 10-20 s. Nutze es, wenn jemand Thesen, Ausreden, Regeln, Behauptungen oder ein Narrativ als getippte Liste im Video will: 'Typewriter-Video', 'getippte Liste', 'Schreibmaschinen-Video', 'Liste die sich tippt', 'typewriter list video', 'typed list video'. Nicht für gesprochene Erklärvideos, Untertitel oder Produktpromos. Voraussetzung: HyperFrames CLI."
---

# Typewriter-Liste

Eine nummerierte Liste tippt sich Zeichen für Zeichen auf ein Blatt Papier.
Kein Ton, keine Sprecherstimme, keine Bilder — die Liste ist das ganze Video.

Stil, Timing und Papiertextur sind aus einer Referenzaufnahme vermessen und
stecken fertig in `template/build.mjs`. Du schreibst nur den Inhalt.

## Voraussetzung zuerst prüfen

```bash
npx hyperframes --version
```

Schlägt das fehl, brich ab und sage dem User:

> Dieser Skill braucht die HyperFrames CLI. Installieren mit:
> `npx skills add heygen-com/hyperframes`

Rate nicht daran vorbei und baue keinen Ersatz.

## Schritt 1 — Inhalt klären

Frage den User, ob er den **Text vorgibt** oder ein **Thema** nennt.

Bei einem Thema schreibst du die Liste selbst und legst sie ihm zur Freigabe
vor, bevor du irgendetwas baust.

### Die Redaktionsregel — das Wichtigste an diesem Format

Das Format funktioniert nur, wenn die Liste **jemandes Argument** ist, nüchtern
protokolliert, und **unten kippt**. Die Verschachtelung am Ende (`4.` → `A.` `B.`)
ist der Mechanismus dafür: Die Begründung entlarvt sich selbst.

Eine brave Aufzählung von Fakten ist in dieser Optik tot. Wenn der letzte Punkt
niemanden zum Grinsen oder Zusammenzucken bringt, ist die Liste noch nicht fertig.

Beispiel für die Bauform:

```
WARUM WIR NOCH WARTEN
1. DATENSCHUTZ
2. UNSERE BRANCHE IST ANDERS
3. DIE MITARBEITER MACHEN DAS NICHT MIT
4. ERST MUSS DIE IT:
   A. DIE PROZESSE SAUBER HABEN
   B. DEN DATENSCHUTZ PRÜFEN
5. NÄCHSTES JAHR DANN WIRKLICH
```

### Harte Grenzen

Halte dich daran, sonst läuft der Text aus dem Bild:

- **Nur Großbuchstaben.** Kleinbuchstaben laufen zwar, brechen aber den Look.
- **Maximal 44 Zeichen pro Zeile.**
- **Maximal 9 Zeilen** inklusive Titel.
- Umlaute sind in Ordnung (Ä Ö Ü) und brauchen keine Umschreibung.

## Schritt 2 — Projekt anlegen

`<projekt>` ist ein kurzer kebab-case-Name aus dem Thema.

```bash
npx hyperframes init videos/<projekt> --non-interactive --example=blank
cp -R <SKILL_DIR>/template/build.mjs <SKILL_DIR>/template/assets videos/<projekt>/
```

Kopiere `build.mjs` und die Schrift **immer ins Projekt**. Führe sie nie aus dem
Skill-Ordner heraus aus: Das fertige Videoprojekt muss auch dann noch rendern,
wenn dieser Skill aktualisiert oder deinstalliert wird.

## Schritt 3 — Inhalt schreiben

`videos/<projekt>/content.json`:

```json
{
  "title": "DEINE ÜBERSCHRIFT",
  "lines": [
    { "text": "1. ERSTER PUNKT" },
    { "text": "2. ZWEITER PUNKT" },
    { "text": "A. UNTERPUNKT", "sub": true }
  ]
}
```

`"sub": true` rückt die Zeile ein und zieht sie enger an die Zeile darüber —
damit baust du die Pointe am Listenende.

## Schritt 4 — Bauen, prüfen, rendern

```bash
cd videos/<projekt>
node build.mjs
npx hyperframes check .
npx hyperframes render . -q high -o ./renders/video.mp4
```

`build.mjs` gibt Laufzeit und Randabstand aus und **warnt**, wenn der Block
für das Bild zu hoch wird. Nimm die Warnung ernst und kürze die Liste, statt
sie zu ignorieren.

Laufzeit, Zeilenpositionen, Cursor-Timing und die vertikale Zentrierung
berechnen sich aus dem Text. Bei jeder Zeilenzahl bleibt oben und unten
derselbe Abstand.

## Was du nicht anfassen solltest

Der `STYLE`-Block in `build.mjs` enthält die vermessenen Werte der Referenz.
Änder daran nur, was der User ausdrücklich verlangt.

Ein Wert ist besonders empfindlich: `capTopInBox()` ist an zwei gemessenen
Punkten gefittet (55 px und 81 px Schriftgröße). Wer `bodySize` oder
`titleSize` ändert, **muss beide Punkte neu messen** — sonst verrutscht die
vertikale Zentrierung, ohne dass eine Prüfung anschlägt. Der Kommentar im Code
sagt, wie.

## Danach

Zeige dem User das gerenderte MP4. Für eine weitere Liste im selben Stil reicht
es, `content.json` zu ändern und `node build.mjs` erneut laufen zu lassen.
