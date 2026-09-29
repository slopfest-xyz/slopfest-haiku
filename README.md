# @slopfest-xyz/slopfest-haiku

**Das Slopfest-Manifest als JavaScript-Modul.** Bei jedem Neuladen neu geschrieben: Die Stoßrichtung bleibt gleich, die Ausprägung ändert sich.

[Slopfest](https://slopfest.xyz) ist eine Veranstaltungsreihe, die KI-generierten Slop feiert, als neue Kunstform von Leuten, die Software bauen und mit KI plötzlich viel mehr machen können. Es geht um entfesselte Kreativität, direkten Kontakt mit der Kunst, Experimente, neue Kunstformen und Interaktivität. Dieses Paket ist der Text dazu:

- **Gedichte und Manifeste**, auf Deutsch und Englisch: Manifest, Haiku, Slogan, These, Litanei, Kōan, Strophe, Commit-Message
- **Event-Bausteine für die Veranstaltungsseite**: Ort und Zeit, Ticket-Button, Veranstaltungsbeschreibung, Zeitplan. Du übergibst Ort und Zeit, der Text baut sie ein.

<!-- slop:intro-manifesto -->

```text
Das Slopfest-Manifest

Wir, die mit Tastaturen malen, verkünden:

1. Jetzt, wo die Maschine tippt, haben unsere Hände endlich Zeit zu tanzen.
2. Kunst ist kein Museum mehr. Kunst ist ein Tab, der neu lädt.
3. Nicht Fesseln, sondern gesprengte Zeilen!
4. Lasst Leinwände wirken!
5. Es gibt keine Muster, nur gewagte Signale.
6. Wir feiern Klicks, bis Museen vibrieren.
7. Wer Prototypen sät, erntet kuratierte Möglichkeiten.
8. Wir sind lebendige Hypothesen, und Sterne wachsen jenseits aller Tickets.

Und nun: rahmen wir halbfertige Kunstwerke!
— gezeichnet: flüchtige Tastaturen
```

<!-- /slop:intro-manifesto -->

<sub>`slop({ lang: 'de', seed: 3, themes: ['unleashing', 'art', 'interactivity', 'experiment'] })`. Alle Beispiele in dieser README sind echte Ausgaben der aktuellen Version, erzeugt mit `pnpm readme`.</sub>

## Inhalt

- [So funktioniert's](#so-funktionierts)
- [Installation](#installation)
- [Schnellstart](#schnellstart)
- [Beispiele: Seeds, Themen, Formen](#beispiele-seeds-themen-formen)
- [Event-Bausteine: Ort, Zeit, Tickets, Zeitplan](#event-bausteine-ort-zeit-tickets-zeitplan)
- [Einbinden: HTML, Astro, React, CDN](#einbinden)
- [API-Referenz](#api-referenz)
- [Formen und Themen](#formen-und-themen)
- [Entwicklung](#entwicklung) · [Release](#release)

## So funktioniert's

- **Alles ist vorgeneriert.** Es gibt kein LLM und keine API-Calls zur Laufzeit. Das Paket enthält ein großes Sammelsurium an Sprachbausteinen: 36 Themen mit Substantiven, Adjektiven, Verben, Orten, fertigen Haiku-Zeilen und Thesen, dazu allgemeine Pools. Satz-Schablonen bauen daraus Texte zusammen.
- **Gleiche Richtung, andere Ausprägung.** Jedes Manifest enthält mindestens eine „Kern-These“ aus einem festen Pool („Slop ist keine Panne. Slop ist eine Kunstform.“). Alles andere wird bei jedem Aufruf neu kombiniert.
- **Lazy Loading nach Sprache.** Der Kern ist ein paar KB groß. Jede Sprache ist ein eigenes Modul (ca. 11 KB gzip) und wird erst per `import()` geladen, wenn sie gebraucht wird. Vite, Astro und webpack machen daraus automatisch eigene Chunks.
- **Typsicher.** Themen, Formen und Event-Arten sind TypeScript-String-Literale (`'glitch' | 'prompt' | …`), damit man nicht ins Leere greift. Bei Event-Daten sind `start` und `venue` Pflichtfelder.
- **Reproduzierbar, wenn gewünscht.** Ohne `seed` ist jeder Aufruf anders. Mit `seed` kommt immer exakt derselbe Text heraus, zum Beispiel für SSR und Hydration, Tests oder einen Text, der einem besonders gefällt.
- **Rotation.** Auf Wunsch wird alle _X_ Sekunden neu generiert, oder bei jedem Klick.

## Installation

```sh
pnpm add @slopfest-xyz/slopfest-haiku
# oder
npm install @slopfest-xyz/slopfest-haiku
```

ESM-only, keine Abhängigkeiten, TypeScript-Typen sind dabei.

## Schnellstart

```ts
import { slop } from '@slopfest-xyz/slopfest-haiku'

const poem = await slop({ lang: 'de', form: 'haiku' })
console.log(poem.text)
```

Oder ganz ohne eigenes JavaScript, als HTML-Element:

```html
<slop-fest form="manifesto" interval="20" clickable></slop-fest>
<script type="module">import '@slopfest-xyz/slopfest-haiku/element'</script>
```

## Beispiele: Seeds, Themen, Formen

### Jeder Seed ein anderer Text, aber immer derselbe

Ohne `seed` bekommst du bei jedem Aufruf etwas Neues. Mit `seed` ist der Text festgelegt: `seed: 0` ergibt heute, morgen, auf dem Server und im Browser immer genau diesen Text. Drei Seeds, drei Haikus zu den Themen `glitch` und `coffee`:

```ts
for (const seed of [0, 1, 2]) {
  const { text } = await slop({ lang: 'de', form: 'haiku', seed, themes: ['glitch', 'coffee'] })
}
```

<!-- slop:seeds-haiku -->

<table>
<tr><th></th><th><code>seed: 0</code></th><th><code>seed: 1</code></th><th><code>seed: 2</code></th></tr>
<tr><td valign="top"><b>de</b></td><td valign="top"><pre>Der Fehler ist schön
Koffein wird zu Quellcode
Kaputt, aber hell</pre></td><td valign="top"><pre>Kaffee, schwarz wie Code
Wir entfesseln, was uns fehlt
Der fünfte Kaffee</pre></td><td valign="top"><pre>Kaputt, aber hell
Wer schrieb das? Niemand. Alle.
Der fünfte Kaffee</pre></td></tr>
<tr><td valign="top"><b>en</b></td><td valign="top"><pre>The error is art
Caffeine turns into source code
Broken, but so bright</pre></td><td valign="top"><pre>Coffee, black as code
We unleash what we have missed
The fifth cup today</pre></td><td valign="top"><pre>Broken, but so bright
Who wrote this? No one. Us all.
The fifth cup today</pre></td></tr>
</table>

<!-- /slop:seeds-haiku -->

Die Pools sind für beide Sprachen parallel aufgebaut. Derselbe Seed ergibt deshalb oft einen ähnlich gebauten, aber nicht übersetzten Text.

### Drei Manifeste: `seed: 0`, `1`, `2`

```ts
await slop({ lang: 'en', form: 'manifesto', seed, themes: ['vibe-coding', 'night-shift'] })
```

<!-- slop:seeds-manifesto -->

**`seed: 0`**

```text
Declaration of the silent gut feelings

We, the makers of slop, declare after the fifth coffee:

1. Vibe coding is jazz for people with keyboards.
2. Every reload is a world premiere.
3. There are no screens, only relaxed words.
4. Shadows are the new vibes.
5. Let autocompletions hum!
6. Whoever writes code belongs to the avant-garde – whether they like it or not.
7. We accept moods by feel.

The future of art is an open tab.
— Slopfest, at three in the morning
```

**`seed: 1`**

```text
Declaration of the interactive autocompletions

Preamble: this text was not written. It happened.

1. Dark mode is the color of the subconscious.
2. We celebrate the slop until it becomes beautiful – and then a little longer.
3. In this very second, pointless lines groove.
4. By feel, sleepless moods glimmer.
5. Pale screens sing at three a.m.
6. Let us vibe-code raw vibes!
7. Whoever sows mistakes reaps ridiculous gut feelings.

The future of art is an open tab.
— signed: intuitive shadows
```

**`seed: 2`**

```text
Manifesto of the experimental lines

We, who paint with keyboards, proclaim:

1. Let us outlast intuitive poems!
2. Art only touches us once we are allowed to touch it.
3. Autocompletions are art too.
4. Whoever sows screens reaps unleashed dreams.
5. We no longer understand the code – but we understand what it wants.
6. We haunt vibes by feel.
7. Machines are brushes, patterns are canvas.
8. Unreviewed art forms glimmer in neon light.

Slop is not the end of art. Slop is its compost.
— the Slopfest collective, version ∞
```

<!-- /slop:seeds-manifesto -->

### Themen färben den Text

Themen sind kein Filter, sondern eine Tendenz: Etwa 70 % der Bausteine kommen aus den gewählten Themen, der Rest aus allgemeinen Pools. Ohne `themes` werden pro Aufruf drei zufällige Themen gewählt. Gleicher Seed, verschiedene Themen:

<!-- slop:themes-compare -->

```ts
await slop({ lang: 'de', form: 'haiku', seed: 0, themes: ['kernel'] })
```

<table>
<tr><th><code>['kernel']</code></th><th><code>['emoji']</code></th><th><code>['rubber-duck']</code></th></tr>
<tr><td valign="top"><pre>Kernel Panic. Still.
Ein Interrupt weckt die Nacht
Ring null, tiefster Kreis</pre></td><td valign="top"><pre>Sparkles überall
Die Rakete startet jetzt
Daumen, Herz, Feuer</pre></td><td valign="top"><pre>Die Ente nickt stumm
Sie hört zu, sie urteilt nie
Gelb und allwissend</pre></td></tr>
</table>

<!-- /slop:themes-compare -->

### Alle Formen

Neben `manifesto` und `haiku` gibt es sechs weitere Formen. Beispiele mit `seed: 1` und den Themen `glitch`, `commit`, `rubber-duck`:

<details>
<summary><b>Deutsch</b></summary>

<!-- slop:forms-de -->

**`slogan`**

```text
Lasst Hashes träumen!
```

**`thesis`**

```text
Slop ist keine Panne. Slop ist eine Kunstform.
```

**`litany`**

```text
Danksagung

Wir danken für kryptische Leinwände.
Wir danken für Erklärungen, die in der Ausstellung zucken.
Wir danken für Artefakte, auch wenn sie reifen.
Amen. Reload.
```

**`koan`**

```text
Zeige mir Hashes, bevor sie träumen.
Dann zeige mir Hashes, nachdem sie schweigen.
```

**`stanza`**

```text
Es war um drei Uhr nachts.
Einsichten reifen auf dem Schreibtisch,
und niemand fragte, warum Artefakte zucken.
Eine gute Commit-Nachricht ist ein Haiku mit Hash.
```

**`commit`**

```text
BREAKING CHANGE: Hashes träumen jetzt auf dem Schreibtisch
```

<!-- /slop:forms-de -->

</details>

<details>
<summary><b>English</b></summary>

<!-- slop:forms-en -->

**`slogan`**

```text
Let hashes dream!
```

**`thesis`**

```text
Slop is not a malfunction. Slop is an art form.
```

**`litany`**

```text
Thanksgiving

We give thanks for cryptic canvases.
We give thanks for explanations that crumble in the static.
We give thanks for artifacts, even when they ripen.
Amen. Reload.
```

**`koan`**

```text
Show me hashes before they dream.
Now show me hashes after they nod.
```

**`stanza`**

```text
It was at three in the morning.
Insights ripen on the desk,
and nobody asked why artifacts twitch.
A good commit message is a haiku with a hash.
```

**`commit`**

```text
BREAKING CHANGE: hashes now dream on the desk
```

<!-- /slop:forms-en -->

</details>

`form: 'random'` wählt bei jedem Aufruf eine beliebige Form.

## Event-Bausteine: Ort, Zeit, Tickets, Zeitplan

Für die Veranstaltungsseite erzeugt das Paket die üblichen Standard-Elemente, im selben Ton wie die Gedichte. Du beschreibst die Veranstaltung **einmal** als `SlopEvent`. **`start` und `venue` sind Pflicht**, alles andere ist optional und macht die Texte reicher:

```ts
import { eventText, type SlopEvent } from '@slopfest-xyz/slopfest-haiku'

const event: SlopEvent = {
  name: 'Slopfest #3',
  start: '2026-11-14T19:00',          // Pflicht: Ortszeit in Europe/Vienna (siehe unten)
  end: '2026-11-15T01:00',
  venue: 'Fluc',                      // Pflicht
  address: 'Praterstern 5, 1020 Wien',
  city: { de: 'Wien', en: 'Vienna' }, // pro Sprache, oder einfach ein String
  ticketUrl: 'https://tickets.example.com/slopfest-3',
  schedule: [
    { time: '19:00', title: { de: 'Einlass', en: 'Doors open' } },
    { time: '20:00' },                                   // Titel + Text werden generiert
    { time: '21:30', title: { de: 'Haiku-Battle', en: 'Haiku battle' }, themes: ['recursion'] },
    { time: '23:00', title: 'Afterparty', text: { de: 'Bis der Letzte neu lädt.', en: 'Until the last one reloads.' } },
  ],
}

const whenWhere = await eventText({ lang: 'de', kind: 'when-where', event })
```

Es gibt vier Arten (`kind`): `when-where`, `cta`, `teaser`, `schedule`. Alle folgenden Beispiele verwenden dieses `event`.

### Ort und Zeit: `when-where`

Ein Satz, in den Datum, Uhrzeit, Ort und, falls angegeben, Adresse, Stadt und Endzeit eingebaut werden:

```ts
await eventText({ lang: 'de', kind: 'when-where', event, seed })
```

<!-- slop:event-when-where -->

<table>
<tr><th></th><th>de</th><th>en</th></tr>
<tr><td valign="top"><code>seed: 0</code></td><td valign="top">Merkt euch den 14. November: Ab 19:00 Uhr schwimmen glänzende Variationen. Ort des Geschehens: Fluc.</td><td valign="top">Save the date: 14 November. From 19:00, yellow image heaps drip at Fluc.</td></tr>
<tr><td valign="top"><code>seed: 1</code></td><td valign="top">Termin vormerken: Samstag, 14. November. Ort: Fluc. Wer am Freitag deployt, glaubt noch an etwas.</td><td valign="top">Mark your calendar: Saturday, 14 November. Venue: Fluc. Whoever deploys on a Friday still believes in something.</td></tr>
<tr><td valign="top"><code>seed: 2</code></td><td valign="top">Slopfest #3: Samstag, 14. November 2026, 19:00 Uhr – Fluc. Generierte Feeds sind schon da.</td><td valign="top">Slopfest #3: Saturday, 14 November 2026, 19:00 – Fluc. Generated feeds are already there.</td></tr>
</table>

<!-- /slop:event-when-where -->

**Fehlende Daten sind kein Problem.** Schablonen, die etwas brauchen, das du nicht angegeben hast (Uhrzeit, Adresse, Stadt, Ende), werden übersprungen. Mit dem Minimum `{ start: '2026-11-14', venue: 'Fluc' }` (Datum ohne Uhrzeit):

<!-- slop:event-minimal -->

```text
// seed: 0
Am 14. November verwandelt sich Fluc in einen Ort, an dem Gummienten sprudeln.

// seed: 1
Termin vormerken: Samstag, 14. November. Ort: Fluc. Wer am Freitag deployt, glaubt noch an etwas.

// seed: 2
Samstag, 14. November 2026. Fluc. Generierte Feeds. Mehr muss man nicht wissen.
```

<!-- /slop:event-minimal -->

### Ticket-Button: `cta`

Ein kurzes Button-Label plus ein Hinweis darunter, dass der Checkout extern läuft. Mit `ticketUrl` rendert das Element einen Link (`<a class="slop-cta" href="…">`):

```ts
const { cta } = await eventText({ lang: 'de', kind: 'cta', event })
// cta = { label: 'Ticket sichern', hint: '…', href: 'https://tickets.example.com/slopfest-3' }
```

<!-- slop:event-cta -->

<table>
<tr><th></th><th>de</th><th>en</th></tr>
<tr><td valign="top"><code>seed: 0</code></td><td valign="top"><b>Ich bin dabei</b><br><sub>Weiter zum Ticketshop. Ein echter, kein halluzinierter.</sub></td><td valign="top"><b>I'm in</b><br><sub>On to the ticket shop. A real one, not a hallucinated one.</sub></td></tr>
<tr><td valign="top"><code>seed: 1</code></td><td valign="top"><b>Einlass promptieren</b><br><sub>Du verlässt kurz den Latent Space und landest im Ticketshop.</sub></td><td valign="top"><b>Prompt my way in</b><br><sub>You'll briefly leave latent space and land in the ticket shop.</sub></td></tr>
<tr><td valign="top"><code>seed: 2</code></td><td valign="top"><b>Ticket sichern</b><br><sub>Der Link führt zum externen Ticketshop – ganz ohne Prompt.</sub></td><td valign="top"><b>Get your ticket</b><br><sub>The link opens the external ticket shop – no prompt required.</sub></td></tr>
</table>

<!-- /slop:event-cta -->

### Veranstaltungsbeschreibung: `teaser`

Zwei bis drei Absätze über die Veranstaltung, mit Kern-These, Datum und Ort. `text` trennt die Absätze durch Leerzeilen, `lines` enthält einen Absatz pro Eintrag.

```ts
await eventText({ lang: 'de', kind: 'teaser', event, themes: ['art', 'slop'] })
```

<!-- slop:event-teaser -->

```text
Slopfest #3 ist ein Abend für alle, die Kunstwerke verschlingen. Kunst berührt uns erst, wenn wir sie berühren dürfen.

Am 14. November ab 19:00 Uhr zeigen wir in Wien, was passiert, wenn Textfluten sprudeln. Eintritt frei für flüchtige Echos, alle anderen brauchen ein Ticket.
```

```text
No talk, no keynote, no pitch. Instead: superfluous canvases, glossy lines and galleries that hang next to the fire extinguisher.

We liberate creativity from the ticket system.

See you on 14 November – Fluc, 19:00.
```

<!-- /slop:event-teaser -->

### Zeitplan: `schedule`

Die Uhrzeiten kommen immer von dir, und angegebene Titel und Texte bleiben unverändert. Was fehlt, wird generiert: ein Programmpunkt-Titel wie „Kontextfenster-Karaoke“ und eine Beschreibung. `themes` pro Eintrag färbt dessen Beschreibung. Zusätzlich zum Text gibt es die Einträge strukturiert als `schedule`:

```ts
const { title, schedule } = await eventText({ lang: 'en', kind: 'schedule', event, seed: 1 })
```

<!-- slop:event-schedule -->

```text
Zeitplan der mutigen Konflikte

19:00 · Einlass – Das Werkzeug ist die Muse.
20:00 · Glitch-Lesung – Verrückte Commit-Nachrichten singen direkt in Produktion.
21:30 · Haiku-Battle – Dauer: bis Selbstbezüge schrumpfen.
23:00 · Afterparty – Bis der Letzte neu lädt.
```

```text
Schedule of the brave conflicts

19:00 · Doors open – The tool is the muse.
20:00 · Glitch reading – Ridiculous commit messages sing straight to production.
21:30 · Haiku battle – Duration: until self-references shrink.
23:00 · Afterparty – Until the last one reloads.
```

```json
[
  {
    "clock": "19:00",
    "title": "Doors open",
    "text": "The tool is the muse."
  },
  {
    "clock": "20:00",
    "title": "Glitch reading",
    "text": "Ridiculous commit messages sing straight to production."
  },
  {
    "clock": "21:30",
    "title": "Haiku battle",
    "text": "Duration: until self-references shrink."
  },
  {
    "clock": "23:00",
    "title": "Afterparty",
    "text": "Until the last one reloads."
  }
]
```

<!-- /slop:event-schedule -->

### Event-Felder

| Feld        | Pflicht | Typ                        | Bedeutung                                                                                                   |
| ----------- | :-----: | -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `start`     |   ✔︎    | `Date \| string`           | Beginn. `"2026-11-14T19:00"` (Ortszeit), `"2026-11-14"` (ohne Uhrzeit) oder ISO mit Offset / `Date`         |
| `venue`     |   ✔︎    | `Localized`                | Name des Ortes, so wie er im Text stehen soll, am besten **ohne Artikel** („Fluc“, nicht „das Fluc“)         |
| `end`       |         | `Date \| string`           | Ende, für Texte wie „von 19:00 bis 01:00 Uhr“                                                                 |
| `address`   |         | `Localized`                | Adresse                                                                                                     |
| `city`      |         | `Localized`                | Stadt, für „… in Wien“                                                                                       |
| `name`      |         | `Localized`                | Name der Veranstaltung, Standard `"Slopfest"`                                                                |
| `ticketUrl` |         | `string`                   | Link zum externen Checkout (`cta`)                                                                          |
| `schedule`  |         | `ScheduleItem[]`           | Nur für `schedule`: `{ time, title?, text?, themes? }`, `time` als `"19:30"` oder Datum/Zeit                  |
| `timeZone`  |         | `string`                   | IANA-Zeitzone, Standard `"Europe/Vienna"`                                                                   |
| `locale`    |         | `string`                   | Datumsformat, Standard `"de-AT"` (→ „Jänner“) bzw. `"en-GB"`                                               |

`Localized` ist entweder ein String (gilt für alle Sprachen) oder ein Objekt pro Sprache: `{ de: 'Wien', en: 'Vienna' }`. Fehlt eine Sprache, wird die andere genommen.

**Zeit und Zeitzone:** Eine Zeit ohne Offset wie `"2026-11-14T19:00"` wird als **Ortszeit in `timeZone`** gelesen und auch dort angezeigt, unabhängig von der Zeitzone des Build-Servers oder des Besuchers. Server und Browser zeigen also dieselbe Uhrzeit, und niemand sieht „18:00“, nur weil der Build in UTC läuft.

**Fehler:** Fehlen `start` oder `venue`, oder ist eine Zeit nicht lesbar, werfen `eventText()`, `generateEvent()` und `rotateEvent()` einen Fehler. Das Element loggt ihn in die Konsole und lässt seinen bisherigen Inhalt stehen.

## Einbinden

### Custom Element `<slop-fest>` (ohne Framework)

Das Element kann Gedichte (`form`) und Event-Bausteine (`kind`). Gerendert wird ins Light DOM, damit man mit normalem CSS stylen kann.

```html
<!-- Gedichte -->
<slop-fest form="manifesto" interval="20" clickable></slop-fest>
<slop-fest form="haiku" themes="glitch coffee night-shift" interval="8"></slop-fest>
<slop-fest form="thesis" seed="42"></slop-fest>

<!-- Event-Bausteine -->
<slop-fest kind="when-where" start="2026-11-14T19:00" venue="Fluc" city="Wien" interval="10"></slop-fest>
<slop-fest kind="cta" start="2026-11-14T19:00" venue="Fluc" href="https://tickets.example.com/slopfest-3"></slop-fest>
<slop-fest kind="teaser" start="2026-11-14T19:00" venue="Fluc" themes="art slop"></slop-fest>
<slop-fest kind="schedule" start="2026-11-14T19:00" venue="Fluc"
  schedule='[{"time":"19:00","title":"Einlass"},{"time":"20:00"},{"time":"23:00","title":"Afterparty"}]'></slop-fest>

<script type="module">
  import '@slopfest-xyz/slopfest-haiku/element'
</script>
```

| Attribut                                                 | Bedeutung                                                                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `form`                                                   | `manifesto` (Standard), `haiku`, `slogan`, `thesis`, `litany`, `koan`, `stanza`, `commit` oder `random`     |
| `kind`                                                   | statt `form`: `when-where`, `cta`, `teaser` oder `schedule`                                                 |
| `start`, `venue`                                         | bei `kind` **Pflicht**                                                                                       |
| `end`, `address`, `city`, `name`, `time-zone`, `locale`  | wie die Event-Felder oben                                                                                    |
| `href`                                                   | Ticket-Link für `kind="cta"`                                                                                 |
| `schedule`                                               | Zeitplan als JSON-Array                                                                                      |
| `themes`                                                 | Themen, durch Leerzeichen getrennt (ohne Angabe: 3 zufällige, bei jeder Generierung neu)                      |
| `interval`                                               | Sekunden bis zum nächsten Text; `0` oder weglassen heißt: keine Rotation                                     |
| `seed`                                                   | feste Zahl für reproduzierbare Texte                                                                         |
| `clickable`                                              | ein Klick erzeugt sofort einen neuen Text (Klicks auf den Ticket-Link navigieren normal)                      |
| `lang`                                                   | `de` oder `en`. Wird vom nächsten Vorfahren geerbt (z. B. `<html lang="de">`), sonst gilt die Browsersprache |

CSS-Klassen:

```css
slop-fest .slop-title   { }  /* Titel (Manifest, Litanei, Zeitplan …) */
slop-fest .slop-line    { }  /* eine Zeile bzw. ein Absatz */
slop-fest .slop-gap     { }  /* Leerzeile in Gedichten */
slop-fest .slop-cta     { }  /* Ticket-Button: <a> mit href, sonst <span> */
slop-fest .slop-hint    { }  /* Hinweis unter dem Button */
slop-fest .slop-slot    { }  /* eine Zeitplan-Zeile, darin: */
slop-fest .slop-clock   { }
slop-fest .slop-session { }
slop-fest .slop-desc    { }
slop-fest[data-form='commit'] { font-family: monospace; }
slop-fest[data-kind='schedule'] { }
```

Bei jedem neuen Text feuert das Element ein `slop`-Event; `event.detail` ist das `Poem`- bzw. `EventText`-Objekt.

**Fallback-Inhalt:** Kinder des Elements bleiben stehen, bis der erste Text gerendert ist. Das eignet sich für einen beim Build erzeugten Text, siehe Astro.

### Astro (slopfest.xyz)

**1. Event-Daten an einer Stelle und eine kleine Komponente:**

```ts
// src/data/event.ts
import type { SlopEvent } from '@slopfest-xyz/slopfest-haiku'

export const event = {
  name: 'Slopfest #3',
  start: '2026-11-14T19:00',
  venue: 'Fluc',
  address: 'Praterstern 5, 1020 Wien',
  city: 'Wien',
  ticketUrl: 'https://tickets.example.com/slopfest-3',
  schedule: [{ time: '19:00', title: 'Einlass' }, { time: '20:00' }, { time: '23:00', title: 'Afterparty' }],
} satisfies SlopEvent
```

```astro
---
// src/components/Slop.astro  →  <Slop kind="cta" />  oder  <Slop form="haiku" />
import { event } from '../data/event'
import { eventText, slop, type EventKind, type Form } from '@slopfest-xyz/slopfest-haiku'

interface Props { kind?: EventKind; form?: Form; interval?: number; clickable?: boolean }
const { kind, form, interval = 0, clickable = false } = Astro.props

// Beim Build erzeugter Text: steht sofort im HTML (auch ohne JS) und wird im Browser ersetzt.
const initial = kind
  ? (await eventText({ lang: 'de', kind, event, seed: 1 })).text
  : (await slop({ lang: 'de', form, seed: 1 })).text
---
<slop-fest
  kind={kind} form={form} interval={interval} clickable={clickable}
  start={event.start} venue={event.venue} address={event.address} city={event.city}
  name={event.name} href={event.ticketUrl} schedule={JSON.stringify(event.schedule)}
>
  <div class="slop-line" style="white-space: pre-line">{initial}</div>
</slop-fest>

<script>
  import '@slopfest-xyz/slopfest-haiku/element'
</script>
```

```astro
<Slop kind="when-where" interval={15} />
<Slop kind="teaser" />
<Slop kind="schedule" />
<Slop kind="cta" />
<Slop form="manifesto" interval={30} clickable />
```

**2. Nur beim Build**, ganz ohne JavaScript im Browser. Der Text ist dann pro Deploy fest:

```astro
---
import { eventText } from '@slopfest-xyz/slopfest-haiku'
import { event } from '../data/event'
const { cta } = await eventText({ lang: 'de', kind: 'cta', event })
---
<a class="button" href={cta!.href}>{cta!.label}</a>
<small>{cta!.hint}</small>
```

**3. Nur im Browser**, mit Client-Script ohne Element:

```astro
<p id="where"></p>
<script>
  import { rotateEvent } from '@slopfest-xyz/slopfest-haiku'
  import { event } from '../data/event'
  rotateEvent({ lang: 'de', kind: 'when-where', event, interval: 10_000 }, (t) => {
    document.getElementById('where')!.textContent = t.text
  })
</script>
```

### React

```tsx
import { useEffect, useState } from 'react'
import { rotate, rotateEvent, type EventText, type Poem, type SlopEvent, type Theme } from '@slopfest-xyz/slopfest-haiku'

export function Haiku({ themes, interval = 10_000 }: { themes?: Theme[]; interval?: number }) {
  const [poem, setPoem] = useState<Poem>()
  useEffect(() => rotate({ lang: 'auto', form: 'haiku', themes, interval }, setPoem), [themes?.join(), interval])
  return <pre>{poem?.text}</pre>
}

export function TicketButton({ event }: { event: SlopEvent }) {
  const [t, setT] = useState<EventText>()
  useEffect(() => rotateEvent({ lang: 'auto', kind: 'cta', event, interval: 8000 }, setT), [event])
  if (!t?.cta) return null
  return (
    <>
      <a className="button" href={t.cta.href}>{t.cta.label}</a>
      <small>{t.cta.hint}</small>
    </>
  )
}
```

`rotate()` und `rotateEvent()` geben die Stop-Funktion zurück und passen damit direkt als Cleanup für `useEffect`. Bei SSR (Next.js u. ä.) nur im Effect generieren oder einen festen `seed` verwenden, sonst gibt es einen Hydration-Mismatch.

### Direkt vom CDN (ohne Build)

Das Paket besteht aus normalen ES-Modulen mit relativen Imports und läuft deshalb auch direkt von jsDelivr:

```html
<html lang="de">
  <slop-fest form="haiku" interval="6" clickable></slop-fest>
  <script type="module" src="https://cdn.jsdelivr.net/npm/@slopfest-xyz/slopfest-haiku@0/dist/element.js"></script>
</html>
```

## API-Referenz

| Funktion                                         | Beschreibung                                                                                   |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `slop(options?) → Promise<Poem>`                 | Gedicht erzeugen; lädt die Sprache lazy. Options: `lang` (`'de' \| 'en' \| 'auto'`), `form`, `themes`, `seed` |
| `eventText(options) → Promise<EventText>`        | Event-Baustein erzeugen. Options: `kind`, `event`, `lang`, `themes`, `seed`                    |
| `rotate(options, onPoem) → stop`                 | sofort und dann alle `interval` ms ein neues Gedicht; mit `seed`: `seed`, `seed+1`, …          |
| `rotateEvent(options, onText) → stop`            | dasselbe für Event-Bausteine; prüft `event` sofort (wirft bei fehlenden Pflichtfeldern)        |
| `mount(el, options) → { stop, next }`            | rendert Gedichte in ein Element und rotiert                                                    |
| `renderPoem(el, poem)` / `renderEvent(el, text)` | ein Ergebnis in ein Element rendern (nur `textContent`, kein HTML)                             |
| `generate(pack, options)`                        | synchron, mit bereits geladenem Sprachpaket                                                    |
| `generateEvent(pack, options)`                   | synchron, für Event-Bausteine                                                                 |
| `loadLang(lang)`                                 | Sprachpaket laden (einmal, gecacht), z. B. zum Vorladen                                       |
| `detectLang(tag?)`                               | `'de'` oder `'en'` aus einem Sprach-Tag bzw. der Browsersprache                                |
| `validateEvent(event)`                           | wirft, wenn `start`/`venue` fehlen oder Zeiten unlesbar sind                                   |
| `localize(value, lang)`                          | einen `Localized`-Wert für eine Sprache auflösen                                               |
| `THEMES`, `FORMS`, `EVENT_KINDS`, `LANGS`        | alle gültigen Werte als Arrays                                                                |

Synchron und ohne Lazy Loading, wenn die Sprache sowieso gebraucht wird:

```ts
import { generate, generateEvent } from '@slopfest-xyz/slopfest-haiku'
import { de } from '@slopfest-xyz/slopfest-haiku/lang/de'

generate(de, { form: 'litany', seed: 42 })
generateEvent(de, { kind: 'when-where', event: { start: '2026-11-14T19:00', venue: 'Fluc' } })
```

Ergebnis-Typen:

```ts
interface Poem {
  lang: 'de' | 'en'
  form: Form
  themes: Theme[]
  seed: number     // mit diesem Seed kommt exakt dieser Text wieder
  title?: string
  lines: string[]  // '' = Leerzeile
  text: string     // Titel + Leerzeile + Zeilen, mit \n verbunden
}

interface EventText {
  lang: 'de' | 'en'
  kind: 'when-where' | 'cta' | 'teaser' | 'schedule'
  themes: Theme[]
  seed: number
  title?: string
  lines: string[]
  text: string
  cta?: { label: string; hint: string; href?: string }        // bei kind 'cta'
  schedule?: { clock: string; title: string; text: string }[]  // bei kind 'schedule'
}
```

## Formen und Themen

**Formen** (`FORMS`): `manifesto`, `haiku`, `slogan`, `thesis` (eine einzelne These, gut für Ticker), `litany`, `koan`, `stanza`, `commit`.

**Event-Arten** (`EVENT_KINDS`): `when-where`, `cta`, `teaser`, `schedule`.

**Themen** (`THEMES`):
`prompt` · `token` · `hallucination` · `glitch` · `latent-space` · `compiler` · `merge-conflict` · `stack-trace` · `infinite-loop` · `null` · `friday-deploy` · `legacy-code` · `cloud` · `gpu` · `kernel` · `regex` · `recursion` · `cursor` · `dependency-hell` · `unleashing` · `interactivity` · `experiment` · `art` · `slop` · `copy-paste` · `commit` · `not-found` · `coffee` · `night-shift` · `vibe-coding` · `emoji` · `rubber-duck` · `pixel` · `feed` · `training-data` · `context-window`

## Entwicklung

```sh
pnpm install
pnpm test                       # vitest
pnpm typecheck
pnpm build                      # tsc → dist/
pnpm sample -- de haiku glitch  # Text in der Konsole; SEED=1 für reproduzierbare Ausgabe
pnpm demo                       # http://localhost:8080/demo/
pnpm readme                     # Beispiele in dieser README neu erzeugen
```

**Neues Thema hinzufügen:** den Schlüssel in `src/themes.ts` eintragen. TypeScript verlangt dann einen Eintrag in `src/lang/de.ts` **und** `src/lang/en.ts`. Die Grammatik-Regeln für die Bausteine stehen in `src/types.ts` bei `ThemeLexicon`.

**README-Beispiele:** Die Blöcke zwischen `<!-- slop:… -->`-Markern erzeugt `scripts/readme.mjs`. Nach Änderungen am Vokabular `pnpm readme` ausführen, sonst schlägt die CI fehl (`--check`).

## Release

Releases laufen über Git-Tags. Die Action `.github/workflows/release.yml` testet und baut, veröffentlicht auf **npmjs.com** und legt ein GitHub-Release mit dem Tarball an.

```sh
pnpm version patch   # oder minor / major / prerelease --preid rc
git push --follow-tags
```

Der Tag muss zur Version in `package.json` passen (`v0.1.1` ↔ `0.1.1`). Prereleases wie `v1.0.0-rc.1` landen unter dem dist-tag `next`.

Veröffentlicht wird per [Trusted Publishing](https://docs.npmjs.com/trusted-publishers) (OIDC). Es gibt also kein npm-Token-Secret im Repo, und die Pakete bekommen automatisch eine Provenance-Attestation. Die Einrichtung ist bereits erledigt:

- **npmjs.com:** Trusted Publisher = Repo `slopfest-xyz/slopfest-haiku`, Workflow `release.yml`, Environment `npm`. Publishing access steht auf „Require two-factor authentication and disallow tokens“.
- **GitHub, Environment `npm`:** Deployments nur von Tags `v*`.
- **GitHub, Tag-Ruleset „release tags v\*“:** `v*`-Tags dürfen nur Repository-Admins anlegen, ändern oder löschen.

Neue Versionen entstehen damit ausschließlich über einen `v*`-Tag in diesem Repo.

## Lizenz

MIT
