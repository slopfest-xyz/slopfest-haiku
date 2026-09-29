/**
 * `<slop-fest>` custom element. Import for its side effect:
 *
 *   import '@slopfest-xyz/slopfest-haiku/element'
 *   <slop-fest form="manifesto" themes="glitch prompt" interval="15" clickable></slop-fest>
 *   <slop-fest kind="when-where" start="2026-11-14T19:00" venue="Fluc" city="Wien"></slop-fest>
 *
 * Poem attributes: form, themes (space separated), interval (seconds, 0 = no rotation),
 * seed, clickable (click = new text). With `kind` (when-where | cta | teaser | schedule) it
 * renders event texts instead; event data comes from start, venue (both required), end,
 * address, city, name, href (ticket URL), time-zone, locale and schedule (JSON array).
 * Language comes from the nearest `lang` attribute (element or ancestor, e.g. <html lang="de">),
 * falling back to the browser language.
 */
import { detectLang, renderEvent, renderPoem, rotate, rotateEvent, type RotateOptions } from './index.js'
import { isForm } from './forms.js'
import { isTheme, type Theme } from './themes.js'
import { EVENT_KINDS, type EventKind, type EventText, type Poem, type ScheduleItem, type SlopEvent } from './types.js'

export const TAG_NAME = 'slop-fest'

const EVENT_ATTRS = ['start', 'venue', 'end', 'address', 'city', 'name', 'href', 'time-zone', 'locale', 'schedule']

function readOptions(el: HTMLElement): RotateOptions {
  const form = el.getAttribute('form') ?? undefined
  const themes = (el.getAttribute('themes') ?? '').split(/[\s,]+/).filter(isTheme) as Theme[]
  const interval = Number(el.getAttribute('interval') ?? '0')
  const seed = el.getAttribute('seed')
  return {
    lang: detectLang(el.closest('[lang]')?.getAttribute('lang')),
    ...(form === 'random' || (form && isForm(form)) ? { form } : {}),
    ...(themes.length ? { themes } : {}),
    interval: Number.isFinite(interval) ? interval * 1000 : 0,
    ...(seed !== null && Number.isFinite(Number(seed)) ? { seed: Number(seed) } : {}),
  }
}

function readEvent(el: HTMLElement): SlopEvent {
  const attr = (name: string) => el.getAttribute(name)?.trim() || undefined
  const scheduleJson = attr('schedule')
  let schedule: ScheduleItem[] | undefined
  if (scheduleJson) {
    try {
      schedule = JSON.parse(scheduleJson)
    } catch {
      throw new Error('slopfest: <slop-fest schedule> must be a JSON array')
    }
  }
  const event: SlopEvent = { start: attr('start') ?? '', venue: attr('venue') ?? '' }
  const optional = {
    end: attr('end'),
    address: attr('address'),
    city: attr('city'),
    name: attr('name'),
    ticketUrl: attr('href'),
    timeZone: attr('time-zone'),
    locale: attr('locale'),
    schedule,
  }
  for (const [key, value] of Object.entries(optional)) if (value !== undefined) Object.assign(event, { [key]: value })
  return event
}

function define(): void {
  class SlopFestElement extends HTMLElement {
    static observedAttributes = ['lang', 'form', 'themes', 'interval', 'seed', 'kind', ...EVENT_ATTRS]
    private stopRotation: (() => void) | undefined

    connectedCallback(): void {
      if (!this.style.display) this.style.display = 'block'
      this.addEventListener('click', this.onClick)
      this.start()
    }

    disconnectedCallback(): void {
      this.removeEventListener('click', this.onClick)
      this.stopRotation?.()
    }

    attributeChangedCallback(): void {
      if (this.isConnected) this.start()
    }

    private start(options: RotateOptions = readOptions(this)): void {
      this.stopRotation?.()
      this.stopRotation = undefined
      const kind = this.getAttribute('kind')
      if (kind === null) {
        this.stopRotation = rotate(options, (poem) => this.show(poem))
        return
      }
      if (!(EVENT_KINDS as readonly string[]).includes(kind)) {
        console.error(`slopfest: unknown kind "${kind}"`)
        return
      }
      try {
        const { form: _form, ...rest } = options
        const event = readEvent(this)
        this.stopRotation = rotateEvent({ ...rest, kind: kind as EventKind, event }, (text) => this.show(text))
      } catch (err) {
        // Missing start/venue etc.: keep any fallback children, report once.
        console.error(err)
      }
    }

    private show(value: Poem | EventText): void {
      if ('form' in value) renderPoem(this, value)
      else renderEvent(this, value)
      this.dispatchEvent(new CustomEvent('slop', { detail: value }))
    }

    private onClick = (event: Event): void => {
      if (!this.hasAttribute('clickable')) return
      // Let CTA links navigate; clicks elsewhere regenerate.
      if ((event.target as Element | null)?.closest?.('a')) return
      // Restart without seed: renders a fresh text now and resets the interval.
      const { seed: _seed, ...options } = readOptions(this)
      this.start(options)
    }
  }
  customElements.define(TAG_NAME, SlopFestElement)
}

if (typeof customElements !== 'undefined' && !customElements.get(TAG_NAME)) define()
