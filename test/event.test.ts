import { describe, expect, it } from 'vitest'
import { generateEvent, parseEventTime } from '../src/event.js'
import { eventText, rotateEvent } from '../src/index.js'
import { de } from '../src/lang/de.js'
import { en } from '../src/lang/en.js'
import { EVENT_KINDS, type SlopEvent } from '../src/types.js'

const full: SlopEvent = {
  name: 'Slopfest #3',
  start: '2026-11-14T19:00',
  end: '2026-11-14T23:30',
  venue: 'Fluc',
  address: 'Praterstern 5',
  city: 'Wien',
  ticketUrl: 'https://tickets.example/slopfest-3',
  schedule: [{ time: '19:00', title: 'Einlass' }, { time: '20:00' }, { time: '2026-11-14T22:15', text: 'Fixed.' }],
}
const minimal: SlopEvent = { start: '2026-11-14', venue: 'Fluc' }

describe.each([de, en])('generateEvent() in $lang', (pack) => {
  it.each(EVENT_KINDS)('produces clean %s texts for many seeds, with full and minimal data', (kind) => {
    for (const event of [full, { ...minimal, schedule: [{ time: '18:00' }] }]) {
      for (let seed = 0; seed < 100; seed++) {
        const t = generateEvent(pack, { kind, event, seed })
        expect(t.kind).toBe(kind)
        expect(t.text, `seed ${seed}`).not.toMatch(/[{}]| [,.!?]| {2}|(?<!\.)\.\.(?!\.)/)
      }
    }
  })

  it('never uses data the event does not provide', () => {
    for (let seed = 0; seed < 200; seed++) {
      const { text } = generateEvent(pack, { kind: 'when-where', event: minimal, seed })
      expect(text).not.toMatch(/\d{1,2}:\d{2}/) // no clock time given
      expect(text).toContain('Fluc')
      expect(text).toContain('14')
    }
  })

  it('builds the date/time into when-where texts', () => {
    const texts = Array.from({ length: 50 }, (_, seed) => generateEvent(pack, { kind: 'when-where', event: full, seed }).text)
    expect(texts.every((t) => t.includes('Fluc'))).toBe(true)
    expect(texts.some((t) => t.includes('19:00'))).toBe(true)
    expect(texts.some((t) => t.includes('23:30'))).toBe(true)
    expect(texts.some((t) => t.includes('Praterstern 5'))).toBe(true)
  })

  it('cta carries label, hint and the ticket link', () => {
    const t = generateEvent(pack, { kind: 'cta', event: full, seed: 1 })
    expect(t.cta?.href).toBe(full.ticketUrl)
    expect(t.cta?.label.length).toBeGreaterThan(0)
    expect(generateEvent(pack, { kind: 'cta', event: minimal, seed: 1 }).cta?.href).toBeUndefined()
  })

  it('schedule keeps given times/titles/texts and fills the rest', () => {
    const t = generateEvent(pack, { kind: 'schedule', event: full, seed: 5 })
    expect(t.schedule?.map((e) => e.clock)).toEqual(['19:00', '20:00', '22:15'])
    expect(t.schedule?.[0]?.title).toBe('Einlass')
    expect(t.schedule?.[1]?.title.length).toBeGreaterThan(0)
    expect(t.schedule?.[2]?.text).toBe('Fixed.')
  })

  it('is deterministic for a given seed', () => {
    expect(generateEvent(pack, { kind: 'teaser', event: full, seed: 9 })).toEqual(
      generateEvent(pack, { kind: 'teaser', event: full, seed: 9 }),
    )
  })

  it('requires start and venue', () => {
    expect(() => generateEvent(pack, { kind: 'cta', event: { venue: 'Fluc' } as SlopEvent })).toThrow(/start/)
    expect(() => generateEvent(pack, { kind: 'cta', event: { start: '2026-11-14' } as SlopEvent })).toThrow(/venue/)
    expect(() => generateEvent(pack, { kind: 'cta', event: { start: 'soon', venue: 'Fluc' } })).toThrow(/parse/)
    expect(() => generateEvent(pack, { kind: 'schedule', event: minimal })).toThrow(/schedule/)
  })
})

describe('localized event data', () => {
  const event: SlopEvent = {
    start: '2026-11-14T19:00',
    venue: 'Fluc',
    city: { de: 'Wien', en: 'Vienna' },
    schedule: [{ time: '19:00', title: { de: 'Einlass', en: 'Doors open' } }],
  }
  it('picks the value for the pack language', () => {
    expect(generateEvent(en, { kind: 'schedule', event, seed: 1 }).schedule?.[0]?.title).toBe('Doors open')
    expect(generateEvent(de, { kind: 'schedule', event, seed: 1 }).schedule?.[0]?.title).toBe('Einlass')
    const en_ = Array.from({ length: 50 }, (_, seed) => generateEvent(en, { kind: 'when-where', event, seed }).text)
    expect(en_.some((t) => t.includes('Vienna'))).toBe(true)
    expect(en_.some((t) => t.includes('Wien'))).toBe(false)
  })
  it('falls back to another language and accepts localized venues', () => {
    const t = generateEvent(en, { kind: 'cta', event: { start: '2026-11-14', venue: { de: 'Fluc' } }, seed: 2 })
    expect(t.lang).toBe('en')
    expect(() => generateEvent(en, { kind: 'cta', event: { start: '2026-11-14', venue: {} } })).toThrow(/venue/)
  })
})

describe('time handling', () => {
  it('reads local times in the event time zone, independent of the runtime zone', () => {
    expect(parseEventTime('2026-11-14T19:00', 'Europe/Vienna').date.toISOString()).toBe('2026-11-14T18:00:00.000Z')
    expect(parseEventTime('2026-07-14T19:00', 'Europe/Vienna').date.toISOString()).toBe('2026-07-14T17:00:00.000Z')
    expect(parseEventTime('2026-11-14T19:00', 'America/New_York').date.toISOString()).toBe('2026-11-15T00:00:00.000Z')
  })

  it('formats in the event time zone', () => {
    const texts = Array.from({ length: 50 }, (_, seed) =>
      generateEvent(de, { kind: 'when-where', event: { start: '2026-11-14T18:00:00Z', venue: 'X' }, seed }).text,
    )
    expect(texts.some((t) => t.includes('19:00'))).toBe(true)
    expect(texts.some((t) => t.includes('18:00'))).toBe(false)
  })

  it('uses Austrian German month names by default', () => {
    const texts = Array.from({ length: 30 }, (_, seed) =>
      generateEvent(de, { kind: 'when-where', event: { start: '2027-01-15T19:00', venue: 'Fluc' }, seed }).text,
    )
    expect(texts.some((t) => t.includes('Jänner'))).toBe(true)
  })
})

describe('lazy API', () => {
  it('eventText loads the language and validates eagerly in rotateEvent', async () => {
    expect((await eventText({ lang: 'en', kind: 'cta', event: full, seed: 1 })).lang).toBe('en')
    expect(() => rotateEvent({ kind: 'cta', event: { start: '', venue: 'x' } }, () => {})).toThrow(/start/)
  })
})
