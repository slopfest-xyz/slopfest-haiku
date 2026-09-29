import type { Form } from './forms.js'
import type { Theme } from './themes.js'

export const LANGS = ['de', 'en'] as const
export type Lang = (typeof LANGS)[number]

/**
 * Word material for one theme in one language. Grammar contract (see CLAUDE.md):
 * - `n`:     plural nouns without article (DE: identical in nominative/accusative)
 * - `adj`:   attributive adjectives; DE in strong plural form ending in "-e"
 * - `v`:     intransitive verbs, DE infinitive (= 1st/3rd person plural), EN base form; no separable/reflexive verbs
 * - `vt`:    transitive verbs, same form rules as `v`
 * - `place`: adverbials/prepositional phrases that can open or close a sentence
 * - `five`/`seven`: complete haiku lines with 5 / 7 syllables
 * - `claim`: complete sentences including punctuation
 */
export interface ThemeLexicon {
  n: string[]
  adj: string[]
  v: string[]
  vt: string[]
  place: string[]
  five: string[]
  seven: string[]
  claim: string[]
}

export type ThemedSlot = keyof ThemeLexicon

export const THEMED_SLOTS: readonly ThemedSlot[] = ['n', 'adj', 'v', 'vt', 'place', 'five', 'seven', 'claim']

/** Theme-independent pools. May themselves contain `{slot}` placeholders. */
export interface CommonPools extends ThemeLexicon {
  thesis: string[]
  core: string[]
  preamble: string[]
  closing: string[]
  signoff: string[]
  title: string[]
  time: string[]
  num: string[]
  koanact: string[]
  amen: string[]
}

export type Slot = keyof CommonPools

export interface Variant {
  title?: string
  lines: string[]
}

export interface LangPack {
  lang: Lang
  /** Turns a strong adjective (`{adj}`) into its weak form (`{adj:w}`), e.g. DE "wilde" → "wilden". */
  weak: (adj: string) => string
  common: CommonPools
  themes: Record<Theme, ThemeLexicon>
  forms: Record<Exclude<Form, 'manifesto'>, Variant[]>
}

export interface GenerateOptions {
  /** Poetic form, or `'random'`. Default: `'manifesto'`. */
  form?: Form | 'random'
  /** Themes to steer towards. Default: 3 random themes per generation. */
  themes?: readonly Theme[]
  /** Seed for reproducible output (e.g. SSR + hydration). Default: random. */
  seed?: number
}

export interface Poem {
  lang: Lang
  form: Form
  themes: Theme[]
  seed: number
  title?: string
  lines: string[]
  /** Title (if any), blank line, then all lines joined with `\n`. */
  text: string
}
