/**
 * `<slop-fest>` custom element. Import for its side effect:
 *
 *   import '@slopfest-xyz/slopfest-haiku/element'
 *   <slop-fest form="manifesto" themes="glitch prompt" interval="15" clickable></slop-fest>
 *
 * Attributes: form, themes (space separated), interval (seconds, 0 = no rotation),
 * seed, clickable (click = new poem). Language comes from the nearest `lang` attribute
 * (element or ancestor, e.g. <html lang="de">), falling back to the browser language.
 */
import { detectLang, renderPoem, rotate, type RotateOptions } from './index.js'
import { isForm } from './forms.js'
import { isTheme, type Theme } from './themes.js'

export const TAG_NAME = 'slop-fest'

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

function define(): void {
  class SlopFestElement extends HTMLElement {
    static observedAttributes = ['lang', 'form', 'themes', 'interval', 'seed']
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
      this.stopRotation = rotate(options, (poem) => this.show(poem))
    }

    private show(poem: Parameters<typeof renderPoem>[1]): void {
      renderPoem(this, poem)
      this.dispatchEvent(new CustomEvent('slop', { detail: poem }))
    }

    private onClick = (): void => {
      if (!this.hasAttribute('clickable')) return
      // Restart without seed: renders a fresh poem now and resets the interval.
      const { seed: _seed, ...options } = readOptions(this)
      this.start(options)
    }
  }
  customElements.define(TAG_NAME, SlopFestElement)
}

if (typeof customElements !== 'undefined' && !customElements.get(TAG_NAME)) define()
