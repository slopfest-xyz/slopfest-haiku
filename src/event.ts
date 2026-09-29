import { Expander, resolveThemes } from './generate.js'
import { mulberry32, randomSeed } from './random.js'
import {
  EVENT_KINDS,
  type EventOptions,
  type EventText,
  type EventVar,
  type Lang,
  type LangPack,
  type Localized,
  type ScheduleEntry,
  type SlopEvent,
} from './types.js'

const DEFAULT_TIME_ZONE = 'Europe/Vienna'
const DEFAULT_LOCALE = { de: 'de-AT', en: 'en-GB' } as const
const LOCAL_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/
const CLOCK = /^(\d{1,2}):(\d{2})$/

/** Resolves a `Localized` value for `lang`, falling back to any other language. */
export function localize(value: Localized | undefined, lang: Lang): string | undefined {
  if (value === undefined) return undefined
  const text = typeof value === 'string' ? value : (value[lang] ?? Object.values(value).find((v) => v?.trim()))
  return text?.trim() || undefined
}

/** Offset of `timeZone` from UTC at instant `date`, in ms. */
function zoneOffset(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asUtc - Math.floor(date.getTime() / 1000) * 1000
}

/** Parses a `SlopEvent` time. Returns the instant and whether a clock time was given. */
export function parseEventTime(value: Date | string, timeZone: string): { date: Date; hasTime: boolean } {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error('slopfest: invalid Date')
    return { date: value, hasTime: true }
  }
  const m = LOCAL_TIME.exec(value.trim())
  if (m) {
    // Wall-clock time in `timeZone`, independent of the runtime's own time zone (SSR = browser).
    const [, y, mo, d, h = '12', mi = '00', sec = '00'] = m
    const guess = Date.UTC(+y!, +mo! - 1, +d!, +h, +mi, +sec)
    let t = guess - zoneOffset(new Date(guess), timeZone)
    t = guess - zoneOffset(new Date(t), timeZone) // correct across DST boundaries
    return { date: new Date(t), hasTime: m[4] !== undefined }
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error(`slopfest: cannot parse event time "${value}"`)
  return { date, hasTime: true }
}

function formatter(locale: string, timeZone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, { timeZone, ...options })
}

function clockOf(date: Date, locale: string, timeZone: string): string {
  return formatter(locale, timeZone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date)
}

/** Throws if the mandatory fields (`start`, `venue`) are missing or times cannot be parsed. */
export function validateEvent(event: SlopEvent): void {
  if (!event || event.start === undefined || event.start === '') throw new Error('slopfest: event.start is required')
  const venues = typeof event.venue === 'string' ? [event.venue] : Object.values(event.venue ?? {})
  if (!venues.some((v) => typeof v === 'string' && v.trim())) throw new Error('slopfest: event.venue is required')
  const timeZone = event.timeZone ?? DEFAULT_TIME_ZONE
  parseEventTime(event.start, timeZone)
  if (event.end !== undefined) parseEventTime(event.end, timeZone)
}

/** Validates the event and turns it into template variables. */
export function eventVars(event: SlopEvent, pack: LangPack): Partial<Record<EventVar, string>> {
  validateEvent(event)
  const timeZone = event.timeZone ?? DEFAULT_TIME_ZONE
  const locale = event.locale ?? DEFAULT_LOCALE[pack.lang]
  const { date, hasTime } = parseEventTime(event.start, timeZone)
  const fmt = (o: Intl.DateTimeFormatOptions) => formatter(locale, timeZone, o).format(date)

  const vars: Partial<Record<EventVar, string>> = {
    name: localize(event.name, pack.lang) ?? 'Slopfest',
    venue: localize(event.venue, pack.lang)!,
    date: fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    day: fmt({ day: 'numeric', month: 'long' }),
    weekday: fmt({ weekday: 'long' }),
  }
  if (hasTime) vars.clock = clockOf(date, locale, timeZone)
  if (event.end !== undefined) {
    const end = parseEventTime(event.end, timeZone)
    if (end.hasTime) vars.until = clockOf(end.date, locale, timeZone)
  }
  const address = localize(event.address, pack.lang)
  const city = localize(event.city, pack.lang)
  if (address) vars.address = address
  if (city) vars.city = city
  return vars
}

function scheduleClock(time: string | Date, event: SlopEvent, pack: LangPack): string {
  if (typeof time === 'string') {
    const m = CLOCK.exec(time.trim())
    if (m) return `${m[1]!.padStart(2, '0')}:${m[2]}`
  }
  const timeZone = event.timeZone ?? DEFAULT_TIME_ZONE
  return clockOf(parseEventTime(time, timeZone).date, event.locale ?? DEFAULT_LOCALE[pack.lang], timeZone)
}

/**
 * Generates a text for an event page element synchronously from a loaded language pack.
 * Use `eventText()` for the lazy-loading variant.
 */
export function generateEvent(pack: LangPack, options: EventOptions): EventText {
  if (!(EVENT_KINDS as readonly string[]).includes(options.kind)) {
    throw new Error(`slopfest: unknown event kind "${options.kind}"`)
  }
  const { event, kind } = options
  const vars = eventVars(event, pack)
  const seed = (options.seed ?? randomSeed()) >>> 0
  const rng = mulberry32(seed)
  const themes = resolveThemes(options.themes, rng)
  const x = new Expander(pack, themes, rng, vars)
  const base = { lang: pack.lang, kind, themes, seed }

  switch (kind) {
    case 'when-where': {
      const line = x.line(x.choose(pack.event.whenwhere, (t) => [t]))
      return { ...base, lines: [line], text: line }
    }
    case 'cta': {
      const label = x.line(x.choose(pack.event.cta, (t) => [t]))
      const hint = x.line(x.choose(pack.event.ctahint, (t) => [t]))
      const href = event.ticketUrl?.trim() || undefined
      return {
        ...base,
        lines: [label, hint],
        text: `${label}\n${hint}`,
        cta: { label, hint, ...(href ? { href } : {}) },
      }
    }
    case 'teaser': {
      const variant = x.choose(pack.event.teaser, (v) => v.lines)
      const title = variant.title === undefined ? undefined : x.line(variant.title)
      const lines = variant.lines.map((l) => x.line(l))
      const body = lines.join('\n\n')
      return { ...base, ...(title ? { title } : {}), lines, text: title ? `${title}\n\n${body}` : body }
    }
    case 'schedule': {
      if (!event.schedule?.length) throw new Error('slopfest: event.schedule is required for kind "schedule"')
      const title = x.line('{scheduletitle}')
      const schedule: ScheduleEntry[] = event.schedule.map((item) => {
        x.themes = item.themes ? resolveThemes(item.themes, rng) : themes
        return {
          clock: scheduleClock(item.time, event, pack),
          title: localize(item.title, pack.lang) ?? x.line('{session}'),
          text: localize(item.text, pack.lang) ?? x.line('{sessiondesc}'),
        }
      })
      const lines = schedule.map((e) => `${e.clock} · ${e.title} – ${e.text}`)
      return { ...base, title, lines, text: `${title}\n\n${lines.join('\n')}`, schedule }
    }
  }
}
