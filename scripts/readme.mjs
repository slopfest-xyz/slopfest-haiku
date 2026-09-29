// Regenerates the example outputs in README.md from the built package (pnpm readme).
// Blocks look like <!-- slop:id --> … <!-- /slop:id -->; everything between the markers is replaced.
// `--check` only verifies that README.md is up to date (used in CI).
import { readFileSync, writeFileSync } from 'node:fs'
import { eventText, slop } from '../dist/index.js'

const README = new URL('../README.md', import.meta.url)

const fence = (text, lang = 'text') => '```' + lang + '\n' + text + '\n```'
const esc = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const cellPre = (text) => '<pre>' + esc(text) + '</pre>'
const table = (headers, rows) =>
  [
    '<table>',
    '<tr>' + headers.map((h) => `<th>${h}</th>`).join('') + '</tr>',
    ...rows.map((cells) => '<tr>' + cells.map((c) => `<td valign="top">${c}</td>`).join('') + '</tr>'),
    '</table>',
  ].join('\n')

const event = {
  name: 'Slopfest #3',
  start: '2026-11-14T19:00',
  end: '2026-11-15T01:00',
  venue: 'Fluc',
  address: 'Praterstern 5, 1020 Wien',
  city: { de: 'Wien', en: 'Vienna' },
  ticketUrl: 'https://tickets.example.com/slopfest-3',
  schedule: [
    { time: '19:00', title: { de: 'Einlass', en: 'Doors open' } },
    { time: '20:00' },
    { time: '21:30', title: { de: 'Haiku-Battle', en: 'Haiku battle' }, themes: ['recursion'] },
    { time: '23:00', title: 'Afterparty', text: { de: 'Bis der Letzte neu lädt.', en: 'Until the last one reloads.' } },
  ],
}
const minimalEvent = { start: '2026-11-14', venue: 'Fluc' }

const SEEDS = [0, 1, 2]
const FORM_LIST = ['slogan', 'thesis', 'litany', 'koan', 'stanza', 'commit']

const specs = {
  'intro-manifesto': async () =>
    fence((await slop({ lang: 'de', seed: 3, themes: ['unleashing', 'art', 'interactivity', 'experiment'] })).text),

  'seeds-haiku': async () => {
    const row = async (lang) =>
      [`<b>${lang}</b>`, ...(await Promise.all(SEEDS.map(async (seed) => cellPre((await slop({ lang, form: 'haiku', seed, themes: ['glitch', 'coffee'] })).text))))]
    return table(['', ...SEEDS.map((s) => `<code>seed: ${s}</code>`)], [await row('de'), await row('en')])
  },

  'seeds-manifesto': async () => {
    const parts = []
    for (const seed of SEEDS) {
      const poem = await slop({ lang: 'en', form: 'manifesto', seed, themes: ['vibe-coding', 'night-shift'] })
      parts.push(`**\`seed: ${seed}\`**\n\n${fence(poem.text)}`)
    }
    return parts.join('\n\n')
  },

  'themes-compare': async () => {
    // Smallest seed where the three haikus share no line, so the theme effect is fully visible.
    const themes = ['kernel', 'emoji', 'rubber-duck']
    for (let seed = 0; seed < 1000; seed++) {
      const poems = await Promise.all(themes.map((t) => slop({ lang: 'de', form: 'haiku', seed, themes: [t] })))
      const lines = poems.flatMap((p) => p.lines)
      if (new Set(lines).size !== lines.length) continue
      return (
        fence(`await slop({ lang: 'de', form: 'haiku', seed: ${seed}, themes: ['kernel'] })`, 'ts') +
        '\n\n' +
        table(themes.map((t) => `<code>['${t}']</code>`), [poems.map((p) => cellPre(p.text))])
      )
    }
    throw new Error('themes-compare: no seed without shared lines found')
  },

  'forms-de': async () => formList('de'),
  'forms-en': async () => formList('en'),

  'event-when-where': async () => {
    const rows = []
    for (const seed of SEEDS) {
      const de = await eventText({ lang: 'de', kind: 'when-where', event, seed })
      const en = await eventText({ lang: 'en', kind: 'when-where', event, seed })
      rows.push([`<code>seed: ${seed}</code>`, esc(de.text), esc(en.text)])
    }
    return table(['', 'de', 'en'], rows)
  },

  'event-minimal': async () => {
    // First three seeds that pick different templates.
    const lines = []
    const starts = new Set()
    for (let seed = 0; lines.length < 3; seed++) {
      if (seed > 1000) throw new Error('event-minimal: not enough distinct templates')
      const { text } = await eventText({ lang: 'de', kind: 'when-where', event: minimalEvent, seed })
      const start = text.slice(0, 12)
      if (starts.has(start)) continue
      starts.add(start)
      lines.push(`// seed: ${seed}\n${text}`)
    }
    return fence(lines.join('\n\n'))
  },

  'event-cta': async () => {
    const rows = []
    for (const seed of SEEDS) {
      const de = (await eventText({ lang: 'de', kind: 'cta', event, seed })).cta
      const en = (await eventText({ lang: 'en', kind: 'cta', event, seed })).cta
      rows.push([`<code>seed: ${seed}</code>`, `<b>${esc(de.label)}</b><br><sub>${esc(de.hint)}</sub>`, `<b>${esc(en.label)}</b><br><sub>${esc(en.hint)}</sub>`])
    }
    return table(['', 'de', 'en'], rows)
  },

  'event-teaser': async () => {
    const de = await eventText({ lang: 'de', kind: 'teaser', event, seed: 0, themes: ['art', 'slop'] })
    const en = await eventText({ lang: 'en', kind: 'teaser', event, seed: 1, themes: ['art', 'slop'] })
    return fence(de.text) + '\n\n' + fence(en.text)
  },

  'event-schedule': async () => {
    const de = await eventText({ lang: 'de', kind: 'schedule', event, seed: 1 })
    const en = await eventText({ lang: 'en', kind: 'schedule', event, seed: 1 })
    return fence(de.text) + '\n\n' + fence(en.text) + '\n\n' + fence(JSON.stringify(en.schedule, null, 2), 'json')
  },
}

async function formList(lang) {
  const parts = []
  for (const form of FORM_LIST) {
    const poem = await slop({ lang, form, seed: 1, themes: ['glitch', 'commit', 'rubber-duck'] })
    parts.push(`**\`${form}\`**\n\n${fence(poem.text)}`)
  }
  return parts.join('\n\n')
}

const original = readFileSync(README, 'utf8')
let updated = original
const seen = new Set()
for (const [, id] of original.matchAll(/<!-- slop:([a-z-]+) -->/g)) {
  const spec = specs[id]
  if (!spec) throw new Error(`README: unknown block "${id}"`)
  seen.add(id)
  const block = new RegExp(`(<!-- slop:${id} -->)[\\s\\S]*?(<!-- /slop:${id} -->)`)
  if (!block.test(updated)) throw new Error(`README: block "${id}" has no end marker`)
  const content = await spec()
  updated = updated.replace(block, (_m, open, close) => `${open}\n\n${content}\n\n${close}`)
}
for (const id of Object.keys(specs)) if (!seen.has(id)) console.warn(`README: spec "${id}" is not used`)

if (process.argv.includes('--check')) {
  if (updated !== original) {
    console.error('README.md examples are outdated – run `pnpm readme` and commit the result.')
    process.exit(1)
  }
  console.log('README.md examples are up to date.')
} else {
  writeFileSync(README, updated)
  console.log(updated === original ? 'README.md unchanged.' : 'README.md updated.')
}
