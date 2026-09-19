# Testimonial-Karten einrichten

Diese Anleitung setzt nichts voraus. Wenn du schon weißt, was Skills sind, nimm
stattdessen `README.md`.

## Was das ist

Ein **Skill** ist eine Anleitung, die dein KI-Agent lesen kann. Ist er einmal
installiert, sagst du „mach mir ein Testimonial-Video aus unseren
Google-Bewertungen" — und der Agent holt die Bewertungen, kürzt sie, legt sie dir
vor und rendert das fertige MP4.

**Testimonial-Karten** sind Videos, in denen Kundenstimmen nacheinander auf einer
Glaskarte in der Bildmitte erscheinen: fünf goldene Sterne, das Zitat schreibt
sich Wort für Wort ein, die wichtigste Stelle leuchtet golden, darunter der Name
und ein kleines Schild mit der Quelle — „Google", „ProvenExpert", was immer es
war.

Davor läuft eine Titelkarte („Das sagen meine Kunden"), danach eine Schlusskarte
mit deiner Gesamtnote, einem Call-to-Action und deiner Webseite.

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

Entpacke den Ordner `testimonial-karten-skill` irgendwohin, wo er liegen bleiben
darf. Dann, mit dem echten Pfad statt des Platzhalters:

```bash
npx skills add /pfad/zu/testimonial-karten-skill --global --copy --all
```

`--copy` ist wichtig: Damit wird der Skill kopiert statt nur verlinkt. Ohne das
Flag geht er kaputt, sobald du den entpackten Ordner verschiebst oder löschst.

**Starte danach deinen KI-Agenten neu.** Vorher sieht er den Skill nicht.

## Schritt 4 — Das erste Video

Sag deinem Agenten, woher die Bewertungen kommen sollen.

**Du hast einen Profil-Link:**

> Mach mir ein Testimonial-Video aus unseren Google-Bewertungen:
> https://maps.google.com/…

**Du hast eine Exportdatei:**

> Mach mir Testimonial-Karten aus dieser CSV: /pfad/zu/bewertungen.csv

**Du hast die Zitate im Kopf:**

Schreib sie einfach in den Chat, mit Namen dazu.

### Was der Agent dich vorher fragt

Vier Dinge, die am Ende fest im Video stecken:

1. **Bist du allein oder ein Unternehmen?** Davon hängt ab, ob die Titelkarte
   „Das sagen **meine** Kunden" oder „Das sagen **unsere** Kunden" sagt.
2. **Wie nennen dich deine Kunden in den Bewertungen?** Meist der Vorname. Der
   Agent braucht das, weil viele Bewertungen mit „Er hat …" weitergehen — im
   gekürzten Zitat wird daraus dein Name.
3. **Welcher Call-to-Action?** Der Satz auf der goldenen Schaltfläche am Schluss:
   „Jetzt Termin sichern", „Kostenloses Erstgespräch".
4. **Welche Webseite?** Steht daneben.

Weißt du etwas davon noch nicht, lass es weg — die Karten funktionieren auch ohne.

### Und dann?

Der Agent kürzt die Bewertungen auf Kartenlänge und schlägt für jede die Stelle
vor, die golden leuchten soll. **Schau dir das an, bevor er baut.** Es sind die
Worte echter Kunden — Kürzungsfehler fallen im fertigen Video niemandem mehr auf.

## Woher der Agent Bewertungen holen kann

| Quelle | geht das? |
| --- | --- |
| ProvenExpert, Trustpilot, kununu | meist direkt, die Seiten geben den Text her |
| Deine eigene Website | ja |
| CSV-Export (Google Business Profile, CRM, Excel) | ja, das ist der zuverlässigste Weg |
| Google Maps, Facebook | oft nur über den Browser, manchmal gar nicht |

Kommt er nicht heran, fragt er dich — und **erfindet nichts**. Wenn dein Agent
statt einer echten Bewertung ein „typisches Beispiel" anbietet, lehne ab.

Der bequemste Weg bei Google: In deinem Google-Unternehmensprofil kannst du die
Rezensionen exportieren. Diese Datei gibst du dem Agenten.

## Warum jede Karte eine goldene Stelle hat

Genau eine Stelle je Zitat leuchtet golden — die, die hängen bleiben soll. Der
Generator **baut nicht**, wenn sie fehlt. Das ist Absicht: Ohne sie ist die Karte
eine graue Textwand, an der der Blick abrutscht.

Gut sind konkrete Ergebnisse: „**doppelt so viele Anfragen**", „**in drei Tagen
umgesetzt**". Schwach ist alles, was in jeder Bewertung steht: „**super**",
„**immer wieder gerne**".

## Wie lang wird das Video?

Das entscheidet die Anzahl der Karten, nicht du:

| Zitate | mit Titel- und Schlusskarte |
| --- | --- |
| 2 | ca. 26 s |
| 4 | ca. 40 s |
| 6 | ca. 53 s |
| 8 | ca. 67 s |

Jede Karte steht so lange, wie man zum Lesen braucht. Willst du es kürzer, nimm
**weniger Karten** — nicht schnelleres Tempo. Wer das Zitat nicht zu Ende lesen
kann, hat die Karte nicht gesehen.

Drei bis sechs Karten sind fast immer die richtige Zahl. Danach wiederholen sich
die Aussagen.

## Die Schlusskarte

Sie zeigt deine große Gesamtnote, darunter „aus **128 Bewertungen** auf Google",
und darunter deinen Call-to-Action als goldene Schaltfläche mit der Webseite
daneben. Das ist der eigentliche Zweck des Videos — sag dem Agenten deine Note,
die Anzahl, den CTA-Satz und die Adresse.

## Warum kein Datum auf den Karten?

Weil ein Datum das Video altern lässt, nicht die Leistung. Eine sehr gute
Bewertung von 2023 ist 2026 immer noch eine sehr gute Bewertung — aber mit
„2023" darunter sieht sie alt aus. Die Daten bleiben in der Projektdatei stehen,
damit man jede Aussage nachprüfen kann; ins Bild kommen sie nicht.

## Hochformat für Social Media

Sag dem Agenten dazu:

> ... und bitte im Hochformat für Instagram

Er setzt dann `format` auf `portrait` (1080×1920). `square` (1080×1080) geht auch.

## Wenn etwas klemmt

**„Dieser Skill braucht die HyperFrames CLI"** — Schritt 2 wurde übersprungen
oder hat nicht funktioniert.

**Der Agent kennt den Skill nicht** — nach der Installation neu starten. Wenn er
ihn danach immer noch nicht kennt, prüfe, ob du `--global` mit angegeben hast.

**„no focus text"** — bei einem Zitat fehlt die goldene Stelle. Der Agent muss
sie setzen; sag ihm, welche Worte hervorstechen sollen.

**Ein Zitat passt nicht auf die Karte** — es ist zu lang. Drei Zeilen sind das
Maximum, 8 bis 12 Wörter sind angenehm. Lass den Agenten weiter kürzen.

**„the quote opens on …"** — ein gekürztes Zitat fängt mit „Er"/„Sie"/„Sein" an
und zeigt damit ins Leere. Der Agent soll deinen Namen einsetzen.

## Rechtliches in einem Absatz

Bewertungen sind Äußerungen echter Menschen. Sie dürfen gekürzt, aber nicht
sinnverändernd bearbeitet werden, und Werbung mit erfundenen oder verfälschten
Bewertungen ist unzulässig. Zeig nur, was wirklich so dasteht, nenne die Quelle,
und wenn dein Profil im Schnitt 3,1 Sterne hat, ist ein Video aus lauter
Fünf-Sterne-Zitaten kein gutes Marketing, sondern ein Problem. Plattform-Logos
sind Marken — der Skill schreibt die Quelle deshalb als Text.
