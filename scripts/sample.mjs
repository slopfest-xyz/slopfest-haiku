// Prints a poem from the built package: pnpm sample -- [de|en] [form] [themes...]
// SEED=123 pnpm sample -- de haiku glitch   → reproducible output
import { slop } from '../dist/index.js'

const [lang = 'de', form = 'manifesto', ...themes] = process.argv.slice(2).filter((a) => a !== '--')
const seed = process.env.SEED === undefined ? undefined : Number(process.env.SEED)
const poem = await slop({ lang, form, ...(themes.length ? { themes } : {}), ...(seed === undefined ? {} : { seed }) })
console.log(poem.text)
console.error(`\n[${poem.lang} · ${poem.form} · seed ${poem.seed} · ${poem.themes.join(', ')}]`)
