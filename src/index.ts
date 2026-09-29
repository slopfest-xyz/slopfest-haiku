import { generate } from './generate.js'
import { LANGS, type GenerateOptions, type Lang, type LangPack, type Poem } from './types.js'

export { generate } from './generate.js'
export { FORMS, isForm, type Form } from './forms.js'
export { THEMES, isTheme, type Theme } from './themes.js'
export { LANGS } from './types.js'
export type { GenerateOptions, Lang, LangPack, Poem, ThemeLexicon, Variant } from './types.js'

export interface SlopOptions extends GenerateOptions {
  /** Language, or `'auto'` (browser language, falls back to English). Default: `'auto'`. */
  lang?: Lang | 'auto'
}

export interface RotateOptions extends SlopOptions {
  /** Milliseconds between new poems. Default: 10000. */
  interval?: number
}

// One dynamic import per language: bundlers (Vite/Astro/webpack) split these into separate chunks.
const loaders: Record<Lang, () => Promise<LangPack>> = {
  de: () => import('./lang/de.js').then((m) => m.de),
  en: () => import('./lang/en.js').then((m) => m.en),
}

const cache = new Map<Lang, Promise<LangPack>>()

/** Loads (once) and returns the language pack. Call early to preload. */
export function loadLang(lang: Lang): Promise<LangPack> {
  let p = cache.get(lang)
  if (!p) {
    p = loaders[lang]()
    p.catch(() => cache.delete(lang))
    cache.set(lang, p)
  }
  return p
}

function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value)
}

/** Picks `de` or `en` from a language tag, or from the browser languages if none is given. */
export function detectLang(hint?: string | null): Lang {
  const tags = hint ? [hint] : typeof navigator !== 'undefined' ? [...(navigator.languages ?? []), navigator.language] : []
  for (const tag of tags) {
    const base = tag?.toLowerCase().split('-')[0]
    if (base && isLang(base)) return base
  }
  return 'en'
}

function resolveLang(lang: SlopOptions['lang']): Lang {
  return lang === undefined || lang === 'auto' ? detectLang() : lang
}

/** Generates a poem, lazily loading the needed language pack. */
export async function slop(options: SlopOptions = {}): Promise<Poem> {
  const pack = await loadLang(resolveLang(options.lang))
  return generate(pack, options)
}

/**
 * Calls `onPoem` immediately and then every `interval` ms with a fresh poem.
 * With a fixed `seed`, the sequence is reproducible (seed, seed+1, …).
 * Returns a function that stops the rotation.
 */
export function rotate(options: RotateOptions, onPoem: (poem: Poem) => void): () => void {
  let stopped = false
  let timer: ReturnType<typeof setInterval> | undefined
  let n = 0
  const { interval = 10_000, seed, ...rest } = options
  loadLang(resolveLang(options.lang)).then((pack) => {
    if (stopped) return
    const tick = () => onPoem(generate(pack, { ...rest, ...(seed === undefined ? {} : { seed: seed + n++ }) }))
    tick()
    if (interval > 0) timer = setInterval(tick, interval)
  })
  return () => {
    stopped = true
    if (timer !== undefined) clearInterval(timer)
  }
}

/** Replaces the children of `el` with the poem (title + one `div.slop-line` per line). Uses textContent only. */
export function renderPoem(el: Element, poem: Poem): void {
  const doc = el.ownerDocument
  const nodes: Node[] = []
  if (poem.title !== undefined) {
    const t = doc.createElement('div')
    t.className = 'slop-title'
    t.textContent = poem.title
    nodes.push(t)
  }
  for (const line of poem.lines) {
    const d = doc.createElement('div')
    d.className = line === '' ? 'slop-gap' : 'slop-line'
    d.textContent = line === '' ? ' ' : line
    nodes.push(d)
  }
  el.replaceChildren(...nodes)
  el.setAttribute('data-form', poem.form)
  el.setAttribute('data-seed', String(poem.seed))
}

/** Renders into `el` and keeps rotating. Returns `stop()` and `next()` (render a new poem now). */
export function mount(el: Element, options: RotateOptions = {}): { stop: () => void; next: () => Promise<Poem> } {
  const stop = rotate(options, (poem) => renderPoem(el, poem))
  const { seed: _seed, ...rest } = options
  return {
    stop,
    next: async () => {
      const poem = await slop(rest)
      renderPoem(el, poem)
      return poem
    },
  }
}
