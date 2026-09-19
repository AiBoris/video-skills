# video-skills

Sechs Skills, die aus einem Satz Text ein fertig gerendertes Video machen —
für KI-Agenten wie Claude Code, Codex, Cursor, Gemini CLI oder Windsurf.

Jeder Skill ist aus einer echten Referenzaufnahme vermessen: Timing, Abstände,
Farben und Eases stecken fest im Generator. Du schreibst nur den Inhalt, der
Agent baut das Projekt und rendert das MP4.

Gebaut auf [HyperFrames](https://github.com/heygen-com/hyperframes).

## Installieren

Alle sechs auf einmal:

```bash
npx skills add AiBoris/video-skills --global --copy --all
```

Nur einen bestimmten:

```bash
npx skills add AiBoris/video-skills@google-suche --global --copy --all
```

Danach den Agenten neu starten.

> `--copy` kopiert statt zu verlinken, `--global` installiert für alle Projekte,
> `--all` überspringt die Rückfragen.

### Voraussetzungen

- Node.js 22 oder neuer (`node --version`)
- die HyperFrames CLI:

```bash
npx skills add heygen-com/hyperframes --global --copy --all
```

## Die Skills

| Skill | Was es baut | Womit du es fütterst |
| --- | --- | --- |
| **google-suche** | Eine Frage tippt sich ins Google-Suchfeld, ein Mauszeiger klickt „Google Search". Die Startseite ist 1:1 nachgebaut. 16:9, 9:16, 1:1, 4:5. | eine Suchanfrage |
| **wort-highlight** | Kinetic Typography: ein schräger Balken wandert Wort für Wort durch den Satz und dreht das Wort darunter auf Weiß. | ein Claim oder Hook |
| **typewriter-liste** | Eine nummerierte Liste tippt sich Zeichen für Zeichen auf ein Blatt Papier. Schreibmaschinen-Optik. | Thesen, Ausreden, Regeln |
| **balken-race** | Bar Chart Race: Balken wachsen, überholen sich und tauschen die Plätze, während die Zahlen hochzählen. | eine CSV oder Tabelle |
| **kennzahlen-karten** | Kennzahlen-Dashboard: Karten fahren versetzt herein, Zahlen zählen hoch, Badges zeigen die Veränderung. | eine Handvoll KPIs |
| **testimonial-karten** | Kundenstimmen als Glaskarten: goldene Sterne, das Zitat schreibt sich ein, die Pointe leuchtet gold. | Zitate, eine CSV oder ein Bewertungsprofil |

Alle rendern stumm nach MP4. Laufzeit ergibt sich jeweils aus dem Inhalt.

## Benutzen

Sag deinem Agenten, was du willst:

> Mach mir ein Google-Suche-Video mit der Frage „Wie erstelle ich Videos mit KI?"

> Bau ein Balken-Race aus dieser CSV

Er wählt den passenden Skill, fragt das Nötige nach, legt das Projekt an und
rendert das MP4.

## Aufbau

Jeder Skill ist gleich geschnitten:

```
<skill>/
  SKILL.md        Anleitung für den Agenten
  README.md       Kurzfassung für Menschen
  ANLEITUNG.md    Einrichtung Schritt für Schritt, ohne Vorkenntnisse
  template/
    build.mjs     Generator + alle vermessenen Stilwerte
    ...           Beispielinhalt, Schriften, Assets
```

`build.mjs` wird beim Bauen **ins Videoprojekt kopiert**, nie aus dem
Skill-Ordner ausgeführt. Ein fertiges Projekt rendert dadurch auch dann noch,
wenn der Skill aktualisiert oder deinstalliert wird.

## Lizenz und Drittinhalte

Der Code steht unter der MIT-Lizenz (siehe `LICENSE`).

Mitgelieferte Schriften stehen unter der SIL Open Font License und dürfen
weitergegeben werden — Inter, Courier Prime und Poppins. Sie liegen lokal bei,
damit Renders offline laufen und überall identisch aussehen.

`google-suche/template/assets/google-logo.svg` ist Googles Wortmarke. Der Skill
baut damit eine erkennbare Nachstellung der Google-Startseite — üblich für
Mockups, Hooks und redaktionelle Videos, aber es bleibt fremdes Markenrecht.
Benutz es nicht für Werbung, die eine Google-Zugehörigkeit oder -Empfehlung
suggeriert.
