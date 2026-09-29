/** Poetic forms. `manifesto` is assembled in code; all others are template variants in the language packs. */
export const FORMS = [
  'manifesto',
  'haiku',
  'slogan',
  'thesis',
  'litany',
  'koan',
  'stanza',
  'commit',
] as const

export type Form = (typeof FORMS)[number]

export function isForm(value: string): value is Form {
  return (FORMS as readonly string[]).includes(value)
}
