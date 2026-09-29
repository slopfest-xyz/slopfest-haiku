import { FORMS, isForm, type Form } from './forms.js'
import { mulberry32, pick, randomSeed, shuffle, type Rng } from './random.js'
import { THEMES, isTheme, type Theme } from './themes.js'
import {
  EVENT_VARS,
  THEMED_SLOTS,
  type EventVar,
  type GenerateOptions,
  type LangPack,
  type Poem,
  type Slot,
  type ThemedSlot,
} from './types.js'

/** Probability that a themed slot draws from a selected theme instead of the common pool. */
const THEME_BIAS = 0.7
const DEFAULT_THEME_COUNT = 3
const MAX_DEPTH = 6

/**
 * `{slot}`, `{slot:w}` (weak adjective), `{slot:c}` (capitalize, for sentence starts),
 * `{slot@a}` (reuse the value bound to label `a`).
 */
export const PLACEHOLDER = /\{([a-z]+)(?::([a-z]+))?(?:@([a-z0-9]+))?\}/g

const isThemedSlot = (s: string): s is ThemedSlot => (THEMED_SLOTS as readonly string[]).includes(s)
const isEventVar = (s: string): s is EventVar => (EVENT_VARS as readonly string[]).includes(s)

/** @internal Template engine shared by poems (`generate`) and event texts (`generateEvent`). */
export class Expander {
  private used = new Set<string>()
  private bound = new Map<string, string>()

  constructor(
    private pack: LangPack,
    public themes: readonly Theme[],
    private rng: Rng,
    /** Event data (`{venue}`, `{date}`, …). Templates needing a missing variable are skipped. */
    private vars: Partial<Record<EventVar, string>> = {},
  ) {}

  /** True if every event variable referenced directly in `template` is available. */
  usable(template: string): boolean {
    for (const [, slot] of template.matchAll(PLACEHOLDER)) {
      if (isEventVar(slot!) && this.vars[slot] === undefined) return false
    }
    return true
  }

  /** Picks one of `list`, restricted to templates whose event variables are available. */
  choose<T>(list: readonly T[], templates: (item: T) => readonly string[]): T {
    const ok = list.filter((item) => templates(item).every((t) => this.usable(t)))
    if (ok.length === 0) throw new Error('slopfest: no template matches the given event data')
    return pick(this.rng, ok)
  }

  private candidates(slot: string): readonly string[] {
    if (isThemedSlot(slot) && this.themes.length > 0 && this.rng() < THEME_BIAS) {
      const list = this.pack.themes[pick(this.rng, this.themes)][slot]
      if (list.length > 0) return list
    }
    const pools = this.pack.common as unknown as Record<string, string[] | undefined>
    const events = this.pack.event as unknown as Record<string, unknown>
    const list = pools[slot] ?? (Array.isArray(events[slot]) ? (events[slot] as string[]) : undefined)
    if (!list) throw new Error(`slopfest: unknown slot {${slot}} in language "${this.pack.lang}"`)
    return list
  }

  /** Draws a value, avoiding repetitions within one text where possible. */
  draw(slot: Slot | string): string {
    let value = ''
    for (let attempt = 0; attempt < 12; attempt++) {
      const list = this.candidates(slot).filter((t) => this.usable(t))
      if (list.length === 0) continue
      value = pick(this.rng, list)
      if (!this.used.has(value)) break
    }
    this.used.add(value)
    return value
  }

  expand(template: string, depth = 0): string {
    if (depth > MAX_DEPTH) throw new Error(`slopfest: template recursion too deep: ${template}`)
    return template.replace(PLACEHOLDER, (_m, slot: string, mod?: string, label?: string) => {
      let value: string | undefined = isEventVar(slot) ? this.vars[slot] : undefined
      if (value === undefined) {
        const key = label ? `${slot}@${label}` : undefined
        value = key ? this.bound.get(key) : undefined
        if (value === undefined) {
          value = this.expand(this.draw(slot), depth + 1)
          if (key) this.bound.set(key, value)
        }
      }
      if (mod === 'w') return this.pack.weak(value)
      if (mod === 'c') return capitalize(value)
      if (mod) throw new Error(`slopfest: unknown modifier :${mod} in {${slot}}`)
      return value
    })
  }

  /** Expands a whole line; lines whose template starts with a placeholder get a capital first letter. */
  line(template: string, cap = template.startsWith('{')): string {
    const text = tidy(this.expand(template))
    return cap ? capitalize(text) : text
  }
}

export function tidy(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?:;])/g, '$1')
    .replace(/(?<!\.)\.\.(?!\.)/g, '.') // "at three a.m." + "." → one period; "..." stays
    .trim()
}

export function capitalize(s: string): string {
  return s.replace(/\p{L}/u, (c) => c.toUpperCase())
}

export function resolveThemes(themes: readonly Theme[] | undefined, rng: Rng): Theme[] {
  if (themes === undefined) return shuffle(rng, THEMES).slice(0, DEFAULT_THEME_COUNT)
  for (const t of themes) {
    if (!isTheme(t)) throw new Error(`slopfest: unknown theme "${t}"`)
  }
  return [...new Set(themes)]
}

function resolveForm(form: GenerateOptions['form'], rng: Rng): Form {
  if (form === undefined) return 'manifesto'
  if (form === 'random') return pick(rng, FORMS)
  if (!isForm(form)) throw new Error(`slopfest: unknown form "${form}"`)
  return form
}

function manifesto(x: Expander, rng: Rng): { title: string; lines: string[] } {
  const count = 5 + Math.floor(rng() * 3)
  const theses = Array.from({ length: count }, () => x.line('{thesis}'))
  // The "core" theses carry the constant direction of Slopfest; the rest is variation.
  theses.splice(Math.floor(rng() * 2), 0, x.line('{core}'))
  if (rng() < 0.5) theses.splice(theses.length - Math.floor(rng() * 2), 0, x.line('{core}'))
  return {
    title: x.line('{title}'),
    lines: [
      x.line('{preamble}'),
      '',
      ...theses.map((t, i) => `${i + 1}. ${t}`),
      '',
      x.line('{closing}'),
      x.line('{signoff}', false),
    ],
  }
}

/**
 * Generates one poem synchronously from an already loaded language pack.
 * Use `slop()` for the lazy-loading variant.
 */
export function generate(pack: LangPack, options: GenerateOptions = {}): Poem {
  const seed = (options.seed ?? randomSeed()) >>> 0
  const rng = mulberry32(seed)
  const form = resolveForm(options.form, rng)
  const themes = resolveThemes(options.themes, rng)
  const x = new Expander(pack, themes, rng)

  let title: string | undefined
  let lines: string[]
  if (form === 'manifesto') {
    ;({ title, lines } = manifesto(x, rng))
  } else {
    const variant = x.choose(pack.forms[form], (v) => v.lines)
    title = variant.title === undefined ? undefined : x.line(variant.title)
    lines = variant.lines.map((l) => (l === '' ? '' : x.line(l)))
  }

  const body = lines.join('\n')
  return {
    lang: pack.lang,
    form,
    themes,
    seed,
    ...(title === undefined ? {} : { title }),
    lines,
    text: title === undefined ? body : `${title}\n\n${body}`,
  }
}
