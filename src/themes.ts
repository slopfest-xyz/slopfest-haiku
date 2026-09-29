/**
 * All themes a poem can be steered towards. Keys are language-neutral;
 * every language pack must provide a lexicon for each of them
 * (enforced by the `Record<Theme, ThemeLexicon>` type in `LangPack`).
 */
export const THEMES = [
  'prompt',
  'token',
  'hallucination',
  'glitch',
  'latent-space',
  'compiler',
  'merge-conflict',
  'stack-trace',
  'infinite-loop',
  'null',
  'friday-deploy',
  'legacy-code',
  'cloud',
  'gpu',
  'kernel',
  'regex',
  'recursion',
  'cursor',
  'dependency-hell',
  'unleashing',
  'interactivity',
  'experiment',
  'art',
  'slop',
  'copy-paste',
  'commit',
  'not-found',
  'coffee',
  'night-shift',
  'vibe-coding',
  'emoji',
  'rubber-duck',
  'pixel',
  'feed',
  'training-data',
  'context-window',
] as const

export type Theme = (typeof THEMES)[number]

export function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value)
}
