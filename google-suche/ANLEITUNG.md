# Anleitung: Google-Suche-Videos einrichten

Für Einsteiger geschrieben. Einmal einrichten, dann dauerhaft benutzbar.
Dauer: etwa 5 Minuten.

---

## Was du vorher brauchst

**1. Einen KI-Agenten.** Zum Beispiel Claude Code, Cursor, Codex, Gemini CLI
oder Windsurf. Wenn du diese Anleitung liest, hast du vermutlich schon einen.

**2. Node.js, Version 22 oder neuer.** Das ist ein kostenloses Programm, das im
Hintergrund läuft. So prüfst du, ob du es hast:

Öffne das Terminal (Mac: Programme → Dienstprogramme → Terminal.
Windows: Startmenü → „Terminal" oder „PowerShell") und tippe:

```
node --version
```

Drücke Enter. Wenn dort etwas wie `v22.20.0` oder höher steht, bist du fertig.
Steht dort eine kleinere Zahl als 22, eine Fehlermeldung oder
`command not found`, dann lade Node.js hier herunter und installiere es:

**https://nodejs.org** → den Button mit **„LTS"** wählen.

Danach das Terminal einmal schließen und neu öffnen.

---

## Schritt 1: Ordner entpacken

Entpacke `google-suche-skill.zip` per Doppelklick.

**Wohin?** Völlig egal — Downloads, Schreibtisch, sonst wo. Der Ordner wird
nur zum Installieren gebraucht. Danach kannst du ihn löschen, ohne dass etwas
kaputtgeht.

---

## Schritt 2: HyperFrames installieren

HyperFrames ist das Werkzeug, das die Videos tatsächlich baut. Es wird einmal
installiert. Tippe im Terminal:

```
npx skills add heygen-com/hyperframes --global --copy --all
```

Enter drücken und warten, bis es fertig ist. Beim ersten Mal kann das ein bis
zwei Minuten dauern.

Falls eine Rückfrage kommt wie „Ok to proceed? (y)": einfach Enter drücken.

---

## Schritt 3: Diesen Skill installieren

Tippe im Terminal — **aber noch nicht Enter drücken**:

```
npx skills add
```

Jetzt ein Leerzeichen tippen. Dann **ziehe den entpackten Ordner
`google-suche-skill` mit der Maus ins Terminal-Fenster.** Der Pfad wird
automatisch eingefügt. Das erspart dir das fehlerfreie Abtippen.

Danach noch dies dahinter tippen:

```
 --global --copy --all
```

Die ganze Zeile sieht dann ungefähr so aus:

```
npx skills add /Users/deinname/Downloads/google-suche-skill --global --copy --all
```

Jetzt Enter drücken.

Am Ende erscheint eine lange Liste von Ordnern und darunter **„Done!"**. Fertig.

### Zwei rote Zeilen am Ende sind normal

Wenn ganz unten so etwas steht:

```
Failed to install 2
  google-suche -> Eve: Eve does not support global skill installation
  google-suche -> PromptScript: ...
```

**Dann ist alles in Ordnung.** Der Skill wird für rund 80 Agenten gleichzeitig
installiert. Zwei davon können keine globale Installation — die benutzt du
ohnehin nicht.

Entscheidend ist die Zeile weiter oben:

```
google-suche (copied)
```

Steht die da, hat es funktioniert.

---

## Schritt 4: Agenten neu starten

Schließe deinen KI-Agenten und öffne ihn neu. Sonst kennt er den neuen Skill
noch nicht.

---

## Schritt 5: Video machen

Sag deinem Agenten einfach:

> Mach mir ein Google-Suche-Video mit der Frage „Wie erstelle ich Videos mit KI?"

Er fragt nach dem Format (quer fürs Web, hochkant für Reels und Shorts), der
Farbvariante und ob die Buttons deutsch oder englisch sein sollen, und rendert
dann das fertige MP4.

Für ein Hochformat-Video sag einfach dazu:

> ... als 9:16 fürs Reel

Das Video liegt danach im Projektordner unter `renders/video.mp4`.

---

## Die wichtigste Entscheidung: welche Frage?

Das Format lebt davon, dass sich dein Zuschauer beim Tippen selbst erkennt.
Nimm die Frage, die er **wirklich** bei Google eingibt — nicht die, die dein
Marketing gern hätte.

- Funktioniert: `Wie erstelle ich Videos mit KI?`
- Funktioniert: `warum konvertiert meine landingpage nicht`
- Tot: `Professionelle Videoproduktion Agentur Premium`

Kleinschreibung ohne Satzzeichen wirkt oft echter als ein sauberer Satz.

---

## Aufräumen

Der entpackte Ordner aus Schritt 1 wird nicht mehr gebraucht. Du kannst ihn
löschen — der Skill wurde bei der Installation kopiert, nicht verknüpft.

---

## Wenn etwas nicht klappt

**„Failed to install 2" am Ende**
Normal, siehe Schritt 3. Solange `google-suche (copied)` erscheint, hat es
geklappt.

**`npx: command not found` oder `node: command not found`**
Node.js fehlt. Zurück zu „Was du vorher brauchst", Punkt 2.

**„No skills found" / „Keine Skills gefunden"**
Der Pfad zeigt auf den falschen Ordner. Er muss auf den Ordner zeigen, in dem
die Datei `SKILL.md` direkt drin liegt — also auf `google-suche-skill`, nicht
auf den Ordner darüber und nicht auf die ZIP-Datei.

**Der Agent kennt den Skill nicht**
Agenten neu starten (Schritt 4). Falls es dann immer noch nicht geht, prüfe mit:

```
npx skills list
```

Dort muss `google-suche` auftauchen.

**Der Text ist im Video links abgeschnitten**
Die Frage ist zu lang. Etwa 60 Zeichen passen ins Feld. Beim Bauen erscheint
dazu eine Warnung.

**Im Hochformat ist alles winzig**
Gewollt — es ist die echte Google-Seite in einem schmalen Rahmen. Sag deinem
Agenten „mach die Seite größer", dann setzt er `scale` auf 1.5 und das Suchfeld
füllt die Breite.

**Fehler beim Rendern, der HyperFrames erwähnt**
Deine Node-Version ist wahrscheinlich zu alt. HyperFrames braucht mindestens
Version 22. Prüfen mit `node --version`.

---

## Was das Video kann und was nicht

- Eine Frage, **eine Zeile**, maximal etwa 60 Zeichen
- Vier Formate: 16:9 (quer), 9:16 (hochkant), 1:1 und 4:5
- Drei Varianten: `cream` (warm), `light` (weiß), `dark` (Dark Mode)
- Buttons deutsch oder englisch
- **Kein Ton**, je nach Textlänge 6 bis 10 Sekunden
- **Keine Ergebnisseite.** Nach dem Klick passiert bewusst nichts mehr —
  das ist der Hook, nicht ein fehlendes Feature.

Das mitgelieferte Google-Logo ist eine fremde Wortmarke. Für Hooks und
redaktionelle Videos ist das üblich; für Werbung, die eine Google-Empfehlung
suggeriert, nicht.
