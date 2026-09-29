import { describe, expect, it } from 'vitest'
import { de } from '../src/lang/de.js'
import { en } from '../src/lang/en.js'
import { THEMES } from '../src/themes.js'
import { EVENT_VARS, THEMED_SLOTS, type LangPack } from '../src/types.js'

const PACKS: LangPack[] = [de, en]
const PLACEHOLDER = /\{([a-z]+)(?::([a-z]+))?(?:@[a-z0-9]+)?\}/g

/** Every string in a pack that may be used as a template. */
function templates(pack: LangPack): string[] {
  const out: string[] = []
  for (const list of Object.values(pack.common)) out.push(...list)
  for (const lex of Object.values(pack.themes)) for (const list of Object.values(lex)) out.push(...list)
  for (const variants of Object.values(pack.forms))
    for (const v of variants) out.push(...v.lines, ...(v.title ? [v.title] : []))
  for (const pool of Object.values(pack.event))
    for (const e of pool) out.push(...(typeof e === 'string' ? [e] : [...e.lines, ...(e.title ? [e.title] : [])]))
  return out
}

describe.each(PACKS)('language pack $lang', (pack) => {
  it('has a non-empty lexicon for every theme and slot', () => {
    for (const theme of THEMES) {
      for (const slot of THEMED_SLOTS) {
        expect(pack.themes[theme][slot].length, `${theme}.${slot}`).toBeGreaterThan(0)
      }
    }
  })

  it('only references existing slots and modifiers', () => {
    for (const t of templates(pack)) {
      for (const [, slot, mod] of t.matchAll(PLACEHOLDER)) {
        const known = [...Object.keys(pack.common), ...Object.keys(pack.event), ...EVENT_VARS]
        expect(known, `{${slot}} in "${t}"`).toContain(slot)
        if (mod) expect(['w', 'c'], `modifier in "${t}"`).toContain(mod)
      }
      expect(t.replace(PLACEHOLDER, ''), `stray brace in "${t}"`).not.toMatch(/[{}]/)
    }
  })

  it('has no duplicate entries inside a list', () => {
    for (const [theme, lex] of Object.entries(pack.themes)) {
      for (const [slot, list] of Object.entries(lex)) {
        expect(new Set(list).size, `${theme}.${slot}`).toBe(list.length)
      }
    }
  })
})

describe('German grammar contract', () => {
  const allAdj = [...de.common.adj, ...Object.values(de.themes).flatMap((l) => l.adj)]
  it('adjectives are in strong plural form ending in -e', () => {
    for (const a of allAdj) expect(a, a).toMatch(/e$/)
  })
  it('nouns are capitalized', () => {
    const nouns = [...de.common.n, ...Object.values(de.themes).flatMap((l) => l.n)]
    for (const n of nouns) expect(n, n).toMatch(/^[\p{Lu}0-9]/u)
  })
  it('verbs are infinitives', () => {
    const verbs = [...de.common.v, ...de.common.vt, ...Object.values(de.themes).flatMap((l) => [...l.v, ...l.vt])]
    for (const v of verbs) expect(v, v).toMatch(/(en|ern|eln)$/)
  })
})
