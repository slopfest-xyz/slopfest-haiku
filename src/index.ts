import { generateEvent, validateEvent } from './event.js'
import { generate } from './generate.js'
import {
  LANGS,
  type EventOptions,
  type EventText,
  type GenerateOptions,
  type Lang,
  type LangPack,
  type Poem,
} from './types.js'

export { generate } from './generate.js'
export { generateEvent, localize, validateEvent } from './event.js'
export { FORMS, isForm, type Form } from './forms.js'
export { THEMES, isTheme, type Theme } from './themes.js'
export { EVENT_KINDS, LANGS } from './types.js'
export type {
  EventKind,
  EventOptions,
  EventText,
  GenerateOptions,
  Lang,
  LangPack,
  Localized,
  Poem,
  ScheduleEntry,
  ScheduleItem,
  SlopEvent,
  ThemeLexicon,
  Variant,
} from './types.js'

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

export interface EventTextOptions extends EventOptions {
  lang?: Lang | 'auto'
}

/** Generates an event page text (when/where, CTA, teaser, schedule), lazily loading the language pack. */
export async function eventText(options: EventTextOptions): Promise<EventText> {
  const pack = await loadLang(resolveLang(options.lang))
  return generateEvent(pack, options)
}

function loop<T>(
  options: { lang?: Lang | 'auto'; interval?: number; seed?: number },
  make: (pack: LangPack, seed: number | undefined) => T,
  onValue: (value: T) => void,
): () => void {
  let stopped = false
  let timer: ReturnType<typeof setInterval> | undefined
  let n = 0
  const { interval = 10_000, seed } = options
  loadLang(resolveLang(options.lang))
    .then((pack) => {
      if (stopped) return
      const tick = () => onValue(make(pack, seed === undefined ? undefined : seed + n++))
      tick()
      if (interval > 0) timer = setInterval(tick, interval)
    })
    .catch((err: unknown) => console.error(err))
  return () => {
    stopped = true
    if (timer !== undefined) clearInterval(timer)
  }
}

const withSeed = <O extends object>(o: O, seed: number | undefined) => (seed === undefined ? o : { ...o, seed })

/**
 * Calls `onPoem` immediately and then every `interval` ms with a fresh poem.
 * With a fixed `seed`, the sequence is reproducible (seed, seed+1, …).
 * Returns a function that stops the rotation.
 */
export function rotate(options: RotateOptions, onPoem: (poem: Poem) => void): () => void {
  const { interval: _i, seed: _s, ...rest } = options
  return loop(options, (pack, seed) => generate(pack, withSeed(rest, seed)), onPoem)
}

/** Like `rotate`, for event texts. Validates the event immediately (throws if start/venue are missing). */
export function rotateEvent(
  options: EventTextOptions & { interval?: number },
  onText: (text: EventText) => void,
): () => void {
  validateEvent(options.event)
  const { interval: _i, seed: _s, ...rest } = options
  return loop(options, (pack, seed) => generateEvent(pack, withSeed(rest, seed)), onText)
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

/**
 * Renders an event text into `el`. CTA → `a.slop-cta` (or `span.slop-cta` without `ticketUrl`) + `div.slop-hint`;
 * schedule → `div.slop-slot` rows with `span.slop-clock`, `span.slop-session`, `span.slop-desc`;
 * otherwise `div.slop-line` per paragraph. Uses textContent only.
 */
export function renderEvent(el: Element, text: EventText): void {
  const doc = el.ownerDocument
  const node = (tag: string, className: string, content?: string) => {
    const n = doc.createElement(tag)
    n.className = className
    if (content !== undefined) n.textContent = content
    return n
  }
  const nodes: Node[] = []
  if (text.title !== undefined) nodes.push(node('div', 'slop-title', text.title))
  if (text.cta) {
    const link = node(text.cta.href ? 'a' : 'span', 'slop-cta', text.cta.label)
    if (text.cta.href) link.setAttribute('href', text.cta.href)
    nodes.push(link, node('div', 'slop-hint', text.cta.hint))
  } else if (text.schedule) {
    for (const entry of text.schedule) {
      const row = node('div', 'slop-slot')
      row.append(
        node('span', 'slop-clock', entry.clock),
        ' ',
        node('span', 'slop-session', entry.title),
        ' ',
        node('span', 'slop-desc', entry.text),
      )
      nodes.push(row)
    }
  } else {
    for (const line of text.lines) nodes.push(node('div', 'slop-line', line))
  }
  el.replaceChildren(...nodes)
  el.setAttribute('data-kind', text.kind)
  el.setAttribute('data-seed', String(text.seed))
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
