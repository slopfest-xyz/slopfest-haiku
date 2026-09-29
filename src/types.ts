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

/**
 * Placeholders filled from the `SlopEvent` passed by the caller (not drawn from pools).
 * Templates that reference a variable the event does not provide are skipped.
 */
export const EVENT_VARS = ['name', 'venue', 'address', 'city', 'date', 'day', 'weekday', 'clock', 'until'] as const
export type EventVar = (typeof EVENT_VARS)[number]

/** Word material for event page elements. String pools may use `EVENT_VARS` and all common slots. */
export interface EventPools {
  whenwhere: string[]
  cta: string[]
  ctahint: string[]
  teaser: Variant[]
  scheduletitle: string[]
  session: string[]
  sessiondesc: string[]
}

export interface LangPack {
  lang: Lang
  /** Turns a strong adjective (`{adj}`) into its weak form (`{adj:w}`), e.g. DE "wilde" → "wilden". */
  weak: (adj: string) => string
  common: CommonPools
  themes: Record<Theme, ThemeLexicon>
  forms: Record<Exclude<Form, 'manifesto'>, Variant[]>
  event: EventPools
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

/** A plain string (same in every language) or one string per language, e.g. `{ de: 'Wien', en: 'Vienna' }`. */
export type Localized = string | Partial<Record<Lang, string>>

export const EVENT_KINDS = ['when-where', 'cta', 'teaser', 'schedule'] as const
export type EventKind = (typeof EVENT_KINDS)[number]

export interface ScheduleItem {
  /** "19:30" (taken as is) or a date/time like `start`. */
  time: string | Date
  /** e.g. `{ de: 'Einlass', en: 'Doors open' }`. Generated if omitted. */
  title?: Localized
  /** Fixed description. Generated if omitted. */
  text?: Localized
  /** Themes for the generated description of this item (default: the event's themes). */
  themes?: readonly Theme[]
}

/** The event. `start` and `venue` are mandatory; everything else refines the generated texts. */
export interface SlopEvent {
  /**
   * Start time: a `Date`, an ISO string with offset, or a local wall-clock time
   * like `"2026-11-14T19:00"` interpreted in `timeZone`. A date without time
   * (`"2026-11-14"`) is allowed; texts then leave out the clock time.
   */
  start: Date | string
  /** Venue name as it should appear in the text, e.g. "Fluc". Avoid leading articles. */
  venue: Localized
  end?: Date | string
  address?: Localized
  city?: Localized
  /** Event name. Default: "Slopfest". */
  name?: Localized
  /** Link to the (external) ticket checkout, used by the `cta` kind. */
  ticketUrl?: string
  schedule?: readonly ScheduleItem[]
  /** IANA time zone for display and for parsing local times. Default: "Europe/Vienna". */
  timeZone?: string
  /** Locale for date formatting. Default: "de-AT" / "en-GB". */
  locale?: string
}

export interface EventOptions {
  kind: EventKind
  event: SlopEvent
  /** Themes to color the texts. Default: 3 random themes. */
  themes?: readonly Theme[]
  seed?: number
}

export interface ScheduleEntry {
  clock: string
  title: string
  text: string
}

export interface EventText {
  lang: Lang
  kind: EventKind
  themes: Theme[]
  seed: number
  title?: string
  /** Paragraphs / lines as plain text. */
  lines: string[]
  text: string
  /** Set for `kind: 'cta'`. */
  cta?: { label: string; hint: string; href?: string }
  /** Set for `kind: 'schedule'`. */
  schedule?: ScheduleEntry[]
}
