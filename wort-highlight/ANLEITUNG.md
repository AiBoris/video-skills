# Anleitung: Wort-Highlight-Videos einrichten

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

Entpacke `wort-highlight-skill.zip` per Doppelklick.

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
`wort-highlight-skill` mit der Maus ins Terminal-Fenster.** Der Pfad wird
automatisch eingefügt. Das erspart dir das fehlerfreie Abtippen.

Danach noch dies dahinter tippen:

```
 --global --copy --all
```

Die ganze Zeile sieht dann ungefähr so aus:

```
npx skills add /Users/deinname/Downloads/wort-highlight-skill --global --copy --all
```

Jetzt Enter drücken.

Am Ende erscheint eine lange Liste von Ordnern und darunter **„Done!"**. Fertig.

### Zwei rote Zeilen am Ende sind normal

Wenn ganz unten so etwas steht:

```
Failed to install 2
  wort-highlight -> Eve: Eve does not support global skill installation
  wort-highlight -> PromptScript: ...
```

**Dann ist alles in Ordnung.** Der Skill wird für rund 80 Agenten gleichzeitig
installiert. Zwei davon können keine globale Installation — die benutzt du
ohnehin nicht.

Entscheidend ist die Zeile weiter oben:

```
wort-highlight (copied)
```

Steht die da, hat es funktioniert.

---

## Schritt 4: Agenten neu starten

Schließe deinen KI-Agenten und öffne ihn neu. Sonst kennt er den neuen Skill
noch nicht.

---

## Schritt 5: Video machen

Sag deinem Agenten einfach:

> Mach mir ein Wort-Highlight-Video aus diesem Text: Deutlich mehr Anfragen mit
> Videos. Unser Videoassistent beantwortet Fragen und bucht Termine rund um die
> Uhr – 100 % DSGVO-konform.

Er teilt den Text selbst in Phrasen und Zeilen auf, zeigt dir die Aufteilung und
rendert dann das fertige MP4.

Das Video liegt danach im Projektordner unter `renders/`.

---

## Die Farbe bestimmen

**Du kennst deinen Hex-Wert:**

> … in unserem Blau #1B6EF3

**Du kennst ihn nicht, hast aber eine Webseite:**

> … und hol die Farbe von vidlyz.de

Der Agent liest die Seite aus, zeigt dir die gefundenen Farben und fragt, welche
es sein soll. Findet er nichts — manche Seiten verstecken ihr CSS —, fragt er
dich nach dem Hex-Wert.

**Du sagst nichts dazu:** Dann bleibt das Gelb aus der Vorlage.

Du gibst immer nur die **Hintergrundfarbe** an. Schrift und Balken wählt der
Skill selbst so, dass es lesbar bleibt: helle Farbe → dunkle Schrift, dunkle
Farbe → helle Schrift.

---

## Hochformat für Reels und Shorts

> … als Hochformat für Instagram

Der Agent setzt dann `width: 1080` und `height: 1920`. Die Schrift skaliert mit.

---

## Aufräumen

Der entpackte Ordner aus Schritt 1 wird nicht mehr gebraucht. Du kannst ihn
löschen — der Skill wurde bei der Installation kopiert, nicht verknüpft.

---

## Wenn etwas nicht klappt

**„Failed to install 2" am Ende**
Normal, siehe Schritt 3. Solange `wort-highlight (copied)` erscheint, hat es
geklappt.

**`npx: command not found` oder `node: command not found`**
Node.js fehlt. Zurück zu „Was du vorher brauchst", Punkt 2.

**„No skills found" / „Keine Skills gefunden"**
Der Pfad zeigt auf den falschen Ordner. Er muss auf den Ordner zeigen, in dem
die Datei `SKILL.md` direkt drin liegt — also auf `wort-highlight-skill`,
nicht auf den Ordner darüber und nicht auf die ZIP-Datei.

**Der Agent kennt den Skill nicht**
Agenten neu starten (Schritt 4). Falls es dann immer noch nicht geht, prüfe mit:

```
npx skills list
```

Dort muss `wort-highlight` auftauchen.

**Fehler beim Rendern, der HyperFrames erwähnt**
Deine Node-Version ist wahrscheinlich zu alt. HyperFrames braucht mindestens
Version 22. Prüfen mit `node --version`.

**Der Umbruch zerlegt einen Satz an einer blöden Stelle**
Setz ein Komma dort, wo der Schnitt hin soll, oder kürze das Wort davor.
Satzzeichen sind die Schnitte.

---

## Was das Video kann und was nicht

- **Ein Fließtext**, 15 bis 40 Wörter — etwa 0,45 Sekunden pro Wort
- Höchstens **zwei Zeilen** gleichzeitig im Bild, das teilt der Skill selbst ein
- **Eine Farbe** — Hintergrund; Schrift und Balken ergeben sich daraus
- **Kein Ton**, kein Sprecher, keine Bilder
- 16:9 oder Hochformat

Umlaute (ä ö ü ß) funktionieren ohne Umschreiben.
