# @slopfest-xyz/slopfest-haiku

**Das Slopfest-Manifest als JavaScript-Modul.** Bei jedem Neuladen neu geschrieben: Die Stoßrichtung bleibt gleich, die Ausprägung ändert sich.

[Slopfest](https://slopfest.xyz) ist eine Veranstaltungsreihe, die KI-generierten Slop feiert, als neue Kunstform von Leuten, die Software bauen und mit KI plötzlich viel mehr machen können. Es geht um entfesselte Kreativität, direkten Kontakt mit der Kunst, Experimente, neue Kunstformen und Interaktivität. Dieses Paket ist der Text dazu. Es schreibt Manifeste, Haikus, Litaneien, Kōans, Slogans und Commit-Messages, auf Deutsch und Englisch.

```
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

<sub>`slop({ lang: 'de', seed: 3, themes: ['unleashing', 'art', 'interactivity', 'experiment'] })`, eine von sehr vielen Fassungen.</sub>

```
Kaputt, aber hell
Ein Pixel stottert im Takt
Drei Uhr, Dark Mode an
```

```
Show me line numbers before they pulse.
Now show me line numbers after they scroll.
```

## So funktioniert's

- **Alles ist vorgeneriert.** Es gibt kein LLM und keine API-Calls zur Laufzeit. Das Paket enthält ein großes Sammelsurium an Sprachbausteinen: 36 Themen mit Substantiven, Adjektiven, Verben, Orten, fertigen Haiku-Zeilen und Thesen, dazu allgemeine Pools. Satz-Schablonen bauen daraus Texte zusammen.
- **Lazy Loading nach Sprache.** Der Kern ist ein paar KB groß. Jede Sprache ist ein eigenes Modul (ca. 10 KB gzip) und wird erst per `import()` geladen, wenn sie gebraucht wird. Vite, Astro und webpack machen daraus automatisch eigene Chunks.
- **Typsichere Themen.** Themen sind TypeScript-String-Literale (`'glitch' | 'prompt' | …`), damit man nicht ins Leere greift.
- **Reproduzierbar, wenn gewünscht.** Mit `seed` kommt immer derselbe Text heraus, zum Beispiel für SSR und Hydration. Ohne `seed` ist jeder Aufruf anders.
- **Rotation.** Auf Wunsch wird alle _X_ Sekunden neu generiert.

## Installation

```sh
pnpm add @slopfest-xyz/slopfest-haiku
# oder
npm install @slopfest-xyz/slopfest-haiku
```

## Verwendung

### Variante 1: Custom Element `<slop-fest>` (ohne Framework)

```html
<slop-fest form="manifesto" interval="20" clickable></slop-fest>
<slop-fest form="haiku" themes="glitch coffee night-shift" interval="8"></slop-fest>

<script type="module">
  import '@slopfest-xyz/slopfest-haiku/element'
</script>
```

| Attribut    | Bedeutung                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `form`      | `manifesto` (Standard), `haiku`, `slogan`, `thesis`, `litany`, `koan`, `stanza`, `commit` oder `random`           |
| `themes`    | Themen, durch Leerzeichen getrennt (ohne Angabe: 3 zufällige, bei jeder Generierung neu)                            |
| `interval`  | Sekunden bis zum nächsten Text, `0` oder weglassen heißt: keine Rotation                                           |
| `seed`      | feste Zahl für reproduzierbare Texte                                                                               |
| `clickable` | ein Klick erzeugt sofort einen neuen Text                                                                          |
| `lang`      | `de` oder `en`. Wird vom nächsten Vorfahren geerbt (z. B. `<html lang="de">`), sonst gilt die Browsersprache     |

Gerendert wird ins Light DOM, damit man mit normalem CSS stylen kann:

```css
slop-fest .slop-title { font-weight: bold; }
slop-fest .slop-line { }
slop-fest .slop-gap { }               /* Leerzeile */
slop-fest[data-form='commit'] { font-family: monospace; }
```

Bei jedem neuen Text feuert das Element ein `slop`-Event (`event.detail` ist das `Poem`-Objekt).

### Variante 2: API

```ts
import { slop, mount, rotate, THEMES, type Theme } from '@slopfest-xyz/slopfest-haiku'

// Einmal generieren (lädt die Sprache lazy)
const poem = await slop({ lang: 'de', form: 'haiku', themes: ['glitch', 'prompt'] })
console.log(poem.text)

// In ein Element rendern und alle 15 s erneuern
const { stop, next } = mount(document.querySelector('#manifest')!, { form: 'manifesto', interval: 15_000 })

// Ohne DOM: eigener Callback
const stopRotation = rotate({ lang: 'en', form: 'slogan', interval: 5000 }, (p) => console.log(p.text))
```

Synchron und ohne Lazy Loading, wenn die Sprache sowieso gebraucht wird:

```ts
import { generate } from '@slopfest-xyz/slopfest-haiku'
import { de } from '@slopfest-xyz/slopfest-haiku/lang/de'

const poem = generate(de, { form: 'litany', seed: 42 })
```

### Astro (slopfest.xyz)

Am einfachsten ist das Custom Element. Astro bündelt das `<script>` und lädt die Sprache erst im Browser:

```astro
---
// src/components/Manifest.astro
---
<slop-fest form="manifesto" interval="30" clickable></slop-fest>

<script>
  import '@slopfest-xyz/slopfest-haiku/element'
</script>

<style is:global>
  slop-fest .slop-title { font-size: 1.5rem; font-weight: 700; }
</style>
```

Alternativ kann der Text **beim Build** erzeugt werden. Dann ist er im HTML enthalten und pro Deploy fest, ganz ohne JavaScript im Browser:

```astro
---
import { slop } from '@slopfest-xyz/slopfest-haiku'
const poem = await slop({ lang: 'de', form: 'haiku' })
---
<pre>{poem.text}</pre>
```

Beides kombiniert: Das Build-Ergebnis steht sofort da, und das Element ersetzt es im Browser durch einen frischen Text. Dafür den Build-Text als Kinder in `<slop-fest>` setzen.

### React

```tsx
import { useEffect, useState } from 'react'
import { rotate, type Poem, type Theme } from '@slopfest-xyz/slopfest-haiku'

export function Slop({ themes, interval = 10_000 }: { themes?: Theme[]; interval?: number }) {
  const [poem, setPoem] = useState<Poem>()
  useEffect(() => rotate({ lang: 'auto', form: 'haiku', themes, interval }, setPoem), [themes?.join(), interval])
  return <pre>{poem?.text}</pre>
}
```

`rotate()` gibt die Stop-Funktion zurück, passt also direkt als Cleanup für `useEffect`. Bei SSR (Next.js u. ä.) nur im Effect generieren oder einen festen `seed` verwenden, sonst gibt es einen Hydration-Mismatch.

## Formen und Themen

**Formen** (`FORMS`): `manifesto`, `haiku`, `slogan`, `thesis` (eine einzelne These, gut für Ticker), `litany`, `koan`, `stanza`, `commit`.

**Themen** (`THEMES`):
`prompt` · `token` · `hallucination` · `glitch` · `latent-space` · `compiler` · `merge-conflict` · `stack-trace` · `infinite-loop` · `null` · `friday-deploy` · `legacy-code` · `cloud` · `gpu` · `kernel` · `regex` · `recursion` · `cursor` · `dependency-hell` · `unleashing` · `interactivity` · `experiment` · `art` · `slop` · `copy-paste` · `commit` · `not-found` · `coffee` · `night-shift` · `vibe-coding` · `emoji` · `rubber-duck` · `pixel` · `feed` · `training-data` · `context-window`

Themen steuern die Tendenz, sie sind kein Filter: Etwa 70 % der Bausteine kommen aus den gewählten Themen, der Rest aus allgemeinen Pools. Jedes Manifest enthält außerdem mindestens eine „Kern-These“ aus einem festen Pool. Das ist die gleichbleibende Stoßrichtung.

### `Poem`

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
```

## Entwicklung

```sh
pnpm install
pnpm test                       # vitest
pnpm typecheck
pnpm build                      # tsc → dist/
pnpm sample -- de haiku glitch  # Text in der Konsole; SEED=1 für reproduzierbare Ausgabe
pnpm demo                       # http://localhost:8080/demo/
```

Neues Thema hinzufügen: den Schlüssel in `src/themes.ts` eintragen. TypeScript verlangt dann einen Eintrag in `src/lang/de.ts` **und** `src/lang/en.ts`. Die Grammatik-Regeln für die Bausteine stehen in `src/types.ts` bei `ThemeLexicon`.

## Release

Releases laufen über Git-Tags. Die Action `.github/workflows/release.yml` testet und baut, veröffentlicht auf **npmjs.com** und legt ein GitHub-Release mit dem Tarball an.

```sh
pnpm version patch   # oder minor / major / prerelease --preid rc
git push --follow-tags
```

Der Tag muss zur Version in `package.json` passen (`v0.1.1` ↔ `0.1.1`). Prereleases wie `v1.0.0-rc.1` landen unter dem dist-tag `next`.

Veröffentlicht wird per [Trusted Publishing](https://docs.npmjs.com/trusted-publishers) (OIDC). Es gibt also kein npm-Token-Secret im Repo, und die Pakete bekommen automatisch eine Provenance-Attestation. **Einmalige Einrichtung:**

1. Auf npmjs.com die Organisation `slopfest-xyz` anlegen (Scope `@slopfest-xyz`).
2. Die erste Version lokal veröffentlichen, weil ein Trusted Publisher nur für ein bereits existierendes Paket eingetragen werden kann:
   `npm login && pnpm pack && npm publish ./slopfest-xyz-slopfest-haiku-0.1.0.tgz --access public`
3. Auf npmjs.com unter Paket → *Settings* → *Trusted Publisher* „GitHub Actions“ wählen: Organisation `slopfest-xyz`, Repository `slopfest-haiku`, Workflow `release.yml`, Environment `npm`.
4. Ebenfalls unter *Settings* → *Publishing access*: „Require two-factor authentication and disallow tokens“. Danach ist Trusted Publishing der einzige Weg zu einem Release.

Auf GitHub gibt es dazu zwei Absicherungen (bereits eingerichtet):

- **Environment `npm`**: Deployments nur von Tags `v*`. Der Release-Job läuft in diesem Environment, und npm akzeptiert nur Veröffentlichungen aus genau diesem Repo, Workflow und Environment.
- **Tag-Ruleset „release tags v*“**: `v*`-Tags dürfen nur Repository-Admins anlegen, ändern oder löschen.

Ab dann genügt ein Tag-Push.

## Lizenz

MIT
