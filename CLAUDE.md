# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@slopfest-xyz/slopfest-haiku`: an ESM-only TypeScript library that generates Slopfest texts in German and English from **pre-written word material**: poems (manifestos, haikus, litanies, koans, slogans, commit messages) and event page elements (when/where, ticket CTA, teaser, schedule) that embed caller-supplied event data. No LLM runs at runtime. Every call gives a different text unless a `seed` is passed. It is meant to be embedded in the (not yet built) `slopfest-xyz/slopfest.xyz` Astro site. The README (in German) is the user-facing documentation.

## Commands

```sh
pnpm test                          # vitest run (all)
pnpm vitest run test/packs.test.ts # single file
pnpm vitest run -t "haiku"         # tests matching a name
pnpm typecheck                     # tsc --noEmit
pnpm build                         # tsc → dist/ (plain tsc, no bundler)
pnpm sample -- de manifesto glitch # build + print one text; SEED=3 for reproducible output
pnpm demo                          # build + zero-dep static server, http://localhost:8080/demo/
pnpm readme                        # build + regenerate README example blocks (CI runs it with --check)
```

pnpm is pinned via `packageManager`. TypeScript is v7.

## Architecture

- `src/themes.ts` / `src/forms.ts`: `as const` arrays → literal union types `Theme` / `Form`. These are the public vocabulary.
- `src/types.ts`: `LangPack` is the core data shape. `themes: Record<Theme, ThemeLexicon>` means **adding a theme key fails compilation until both `de.ts` and `en.ts` have a full lexicon for it.**
- `src/lang/{de,en}.ts`: all word material. Each pack has `common` pools, per-theme `themes` lexicons, and `forms` (template variants for every form except `manifesto`). This is most of the package size (~10 KB gzip per language).
- `src/generate.ts`: the template engine (`Expander`, shared by poems and events). Placeholders are `{slot}`, `{slot:w}` (weak adjective form via `pack.weak`, DE appends `n`), `{slot:c}` (capitalize, for slots after a sentence boundary mid-template) and `{slot@label}` (reuse the same drawn value, used in koans). Drawn values are expanded recursively, so pool entries may contain placeholders themselves (e.g. `thesis` → `{adj} {n} …`). For themed slots (`n adj v vt place five seven claim`), a value comes from a random selected theme with probability `THEME_BIAS` and otherwise from `common`. Values are deduplicated within one poem. A line whose template **starts with `{`** gets its first letter capitalized; lines starting with literal text keep their case (that is how `feat: …` and the stanza continuation lines stay lowercase). `manifesto` is assembled in code: title, preamble, 5–7 theses plus 1–2 `core` theses (the fixed "direction" of Slopfest), closing, signoff.
- `src/event.ts`: event page texts (`generateEvent`). A `SlopEvent` (mandatory `start` + `venue`, checked by `validateEvent`) is turned into **event variables** (`EVENT_VARS`: `{name} {venue} {address} {city} {date} {day} {weekday} {clock} {until}`) that the `Expander` resolves before any pool. Templates/variants referencing a variable the event does not provide are **filtered out** (`Expander.usable/choose`), so every event pool needs enough entries that only use `{name} {venue} {date} {day} {weekday}` (a date-only `start` has no `{clock}`). Local times without offset are parsed as wall-clock time in `timeZone` (default Europe/Vienna) via `Intl`, independent of the runtime zone; default locales are `de-AT`/`en-GB`. `Localized` fields (`venue`, `city`, schedule titles …) accept `{ de, en }` objects, resolved by `localize()`. Event word material lives in `pack.event` (`EventPools`); `{venue}` is only used without preposition/article because its grammatical gender is unknown.
- `src/index.ts`: public API. `loadLang` uses one dynamic `import('./lang/xx.js')` per language, which is what lets consumer bundlers code-split languages. Keep it that way; don't import language packs statically from `index.ts`. Also exports `slop`/`eventText` (async, lazy), `rotate`/`rotateEvent` (shared `loop`; with a fixed seed it uses seed, seed+1, …; `rotateEvent` validates synchronously), `mount`, `renderPoem`/`renderEvent` (DOM, textContent only) and `detectLang`.
- `src/element.ts`: `<slop-fest>` custom element, exported as the `./element` subpath (listed in `sideEffects`). It defines itself only if `customElements` exists, so importing it under SSR/Node is a no-op. Language comes from `closest('[lang]')`. With a `kind` attribute it renders event texts from attributes (`start`, `venue`, `href`, `schedule` as JSON, …); errors are logged and existing children (build-time fallback) stay.
- `package.json` `exports` has `.`, `./element`, `./lang/de`, `./lang/en`. Add new languages there, to `LANGS` in `types.ts` and to `loaders` in `index.ts`.

## Word-material grammar contract (must hold for generated text to be correct)

Templates concatenate slots blindly, so every entry must fit every template:

- `n`: plural nouns **without article** (DE: identical in nominative/accusative, capitalized; EN: lowercase unless a proper noun). No mass/singular nouns, since templates use plural verbs.
- `adj`: DE **strong plural form ending in `-e`** ("flackernde"); `{adj:w}` turns it into "flackernden". EN: plain adjective.
- `v` (intransitive) / `vt` (transitive): DE **infinitive** (= 1st/3rd person plural, also used in "Entfesseln wir …!"). **No separable verbs** ("aufwachen" → "wachen … auf" breaks templates), no reflexive verbs. EN: base form (fits "they …", "let us …").
- `place`: an adverbial phrase that works both sentence-initially (DE V2 inversion: "Im Labor misslingen …") and sentence-finally. Avoid internal commas.
- `five` / `seven`: complete haiku lines with exactly 5 / 7 syllables (counted by hand; anglicisms count as spoken).
- `claim`: complete sentences with final punctuation.
- Avoid templates that need the dative plural in German (e.g. "mit {n}"); bare plurals only work for nominative, accusative and genitive-with-"der".
- Parallel DE/EN templates share the same structure, so the same seed yields structurally matching texts in both languages.

`test/packs.test.ts` enforces some of this (placeholders must be common/event pool names or `EVENT_VARS`; DE `-e` adjectives; infinitive endings; no duplicates). Syllable counts and separability are **not** tested, so review them manually when adding lines.

## Release / CI

- `.github/workflows/ci.yml`: typecheck, test, pack and `node scripts/readme.mjs --check` on pushes to `main` and on PRs.
- `README.md` example outputs between `<!-- slop:id -->` / `<!-- /slop:id -->` markers are generated by `scripts/readme.mjs` from `dist/`; any change to word material or engine changes them, so run `pnpm readme` and commit the result. Don't hand-edit those blocks.
- `.github/workflows/release.yml`: on a `v*` tag it checks that the tag equals the `package.json` version, then runs `npm publish` of the packed tarball to **npmjs.com** via **Trusted Publishing** (OIDC, `id-token: write`; no token secret, provenance is automatic; the trusted publisher is configured on npmjs.com for `slopfest-xyz/slopfest-haiku` + `release.yml` + environment `npm`, and token publishing is disallowed). The job runs in the GitHub environment `npm`, which only allows `v*` tags; a tag ruleset restricts creating/updating/deleting `v*` tags to repo admins. It also creates a GitHub Release with the tarball. Tags containing `-` publish to dist-tag `next` and are marked as prerelease. `publishConfig.access = public` is required because the package is scoped.
- Flow: `pnpm version <patch|minor|major>` then `git push --follow-tags`. `prepack` runs clean + build.
