# Anleitung: Radar-Videos einrichten

Für Einsteiger geschrieben. Einmal einrichten, dann dauerhaft benutzbar.
Dauer: etwa 5 Minuten.

---

## Was du vorher brauchst

**1. Einen KI-Agenten.** Zum Beispiel Claude Code, Cursor, Codex, Gemini CLI
oder Windsurf.

**2. Node.js, Version 22 oder neuer.** Prüfen im Terminal (Mac: Programme →
Dienstprogramme → Terminal. Windows: Startmenü → „Terminal"):

```
node --version
```

Steht dort `v22.…` oder höher, passt es. Sonst: **https://nodejs.org** → den
Button **„LTS"**. Danach das Terminal einmal schließen und neu öffnen.

**3. FFmpeg.** Das Programm, das am Ende die Videodatei schreibt. Prüfen:

```
ffmpeg -version
```

Kommt eine Fehlermeldung, installiere es:

- **Mac:** `brew install ffmpeg` (braucht Homebrew von **https://brew.sh**)
- **Windows:** `winget install ffmpeg`

---

## Schritt 1: HyperFrames installieren

HyperFrames ist das Werkzeug, das die Videos tatsächlich baut:

```
npx skills add heygen-com/hyperframes --global --copy --all
```

Beim ersten Mal dauert das ein bis zwei Minuten. Rückfragen wie
„Ok to proceed? (y)" einfach mit Enter bestätigen.

---

## Schritt 2: Diesen Skill installieren

```
npx skills add AiBoris/video-skills@radar-sweep --global --copy --all
```

Am Ende erscheint eine lange Liste von Ordnern und darunter **„Done!"**.

### Zwei rote Zeilen am Ende sind normal

Steht ganz unten `Failed to install 2` mit Namen wie Eve oder PromptScript:
alles in Ordnung. Der Skill wird für rund 80 Agenten gleichzeitig installiert,
zwei davon können keine globale Installation. Entscheidend ist die Zeile
`radar-sweep (copied)` weiter oben.

---

## Schritt 3: Agenten neu starten

Schließe deinen KI-Agenten und öffne ihn neu. Sonst kennt er den neuen Skill
noch nicht.

---

## Schritt 4: Video machen

> Mach mir ein Radar-Video mit der Überschrift „Wir finden Fachkräfte für Nexora Automation"

Er fragt nach Format und Farbvariante und rendert dann das MP4. Es liegt danach
im Projektordner unter `renders/`.

---

## Die wichtigste Entscheidung: die Überschrift

Das Bild behauptet: *hier wird gesucht, und es wird gefunden.* Die Überschrift
muss das einlösen, sonst ist das Radar bloß Deko.

- Funktioniert: `Wir finden Fachkräfte für Nexora Automation`
- Funktioniert: `47 Wettbewerber. Einer wächst schneller als du.`
- Tot: `Willkommen bei der Nexora Automation GmbH`

Am stärksten wird es mit dem Namen des Empfängers drin — dann sieht er sich
selbst im Fadenkreuz.

---

## Viele Videos auf einmal

Sag deinem Agenten:

> Mach das für diese 20 Firmen, je ein Video mit dem Firmennamen im Titel

Er trägt die Namen in eine Liste ein und baut daraus 20 Videos. Alle zeigen
dieselbe Scheibe und dieselbe Bewegung — nur der Name wechselt.

---

## Wenn etwas nicht klappt

**„Failed to install 2" am Ende**
Normal, siehe Schritt 2.

**`npx: command not found` / `node: command not found`**
Node.js fehlt. Zurück zu „Was du vorher brauchst".

**Fehler beim Rendern, der FFmpeg erwähnt**
FFmpeg fehlt. Siehe Punkt 3 oben.

**Die Überschrift läuft in die Radarscheibe**
Sie ist zu lang. Beim Bauen erscheint dazu eine Warnung. Kürzen, oder dem
Agenten sagen: „mach die Überschrift kleiner".

**Der Agent kennt den Skill nicht**
Agenten neu starten (Schritt 3). Danach prüfen mit `npx skills list` —
`radar-sweep` muss auftauchen.

**Die Kontakte leuchten gar nicht auf**
Die Laufzeit ist zu kurz. Der Strahl braucht 3,7 Sekunden pro Umdrehung; unter
5 Sekunden erreicht er nicht jeden Punkt. Sag: „mach es 8 Sekunden lang".

---

## Was das Video kann und was nicht

- Eine Überschrift, höchstens drei Zeilen, plus eine kurze Statuszeile
- Vier Formate: 16:9, 9:16, 1:1, 4:5 — und vier Farbvarianten
- **Kein Ton**, 4 bis 12 Sekunden
- **Keine echte Landkarte.** Die Koordinaten unten rechts sind Kulisse und
  zeigen keinen realen Ort. Behaupte in der Werbung nichts anderes.
