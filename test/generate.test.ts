import { describe, expect, it } from 'vitest'
import { generate } from '../src/generate.js'
import { FORMS } from '../src/forms.js'
import { detectLang, loadLang, slop } from '../src/index.js'
import { de } from '../src/lang/de.js'
import { en } from '../src/lang/en.js'
import type { Theme } from '../src/themes.js'

describe.each([de, en])('generate() in $lang', (pack) => {
  it.each(FORMS)('produces clean %s poems for many seeds', (form) => {
    for (let seed = 0; seed < 200; seed++) {
      const poem = generate(pack, { form, seed })
      expect(poem.form).toBe(form)
      expect(poem.lines.length).toBeGreaterThan(0)
      expect(poem.text, `seed ${seed}`).not.toMatch(/[{}]| [,.!?]| {2}|(?<!\.)\.\.(?!\.)/)
    }
  })

  it('is deterministic for a given seed', () => {
    expect(generate(pack, { seed: 42 })).toEqual(generate(pack, { seed: 42 }))
  })

  it('varies between seeds', () => {
    const texts = new Set(Array.from({ length: 20 }, (_, seed) => generate(pack, { seed }).text))
    expect(texts.size).toBeGreaterThan(15)
  })

  it('haiku has three distinct lines', () => {
    for (let seed = 0; seed < 50; seed++) {
      const { lines } = generate(pack, { form: 'haiku', seed })
      expect(lines).toHaveLength(3)
      expect(lines[0]).not.toBe(lines[2])
    }
  })

  it('manifesto has title, numbered theses and a sign-off', () => {
    const poem = generate(pack, { form: 'manifesto', seed: 7 })
    expect(poem.title).toBeTruthy()
    expect(poem.lines.filter((l) => /^\d+\. /.test(l)).length).toBeGreaterThanOrEqual(6)
    expect(poem.lines.at(-1)).toMatch(/^—/)
  })

  it('keeps the requested themes', () => {
    const themes: Theme[] = ['glitch', 'coffee']
    expect(generate(pack, { themes, seed: 1 }).themes).toEqual(themes)
  })

  it('picks three random themes by default', () => {
    expect(generate(pack, { seed: 3 }).themes).toHaveLength(3)
  })

  it('rejects unknown themes and forms', () => {
    expect(() => generate(pack, { themes: ['nope' as Theme] })).toThrow(/unknown theme/)
    expect(() => generate(pack, { form: 'sonnet' as never })).toThrow(/unknown form/)
  })
})

describe('lazy loading', () => {
  it('loads each language once', async () => {
    expect(await loadLang('de')).toBe(await loadLang('de'))
    expect((await slop({ lang: 'en', seed: 1 })).lang).toBe('en')
  })

  it('detects languages from tags', () => {
    expect(detectLang('de-AT')).toBe('de')
    expect(detectLang('en-US')).toBe('en')
    expect(detectLang('fr')).toBe('en')
  })
})
