import { preloadFont } from 'troika-three-text'
import { FONTS } from '../theme/fonts'

const ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('')
export const GLYPHS = `${ASCII}·–—‘’“”…•é`

let pending: Promise<void> | null = null

function preload(font: string): Promise<void> {
  return new Promise((resolve) => preloadFont({ font, characters: GLYPHS }, resolve))
}

export function preloadGlyphs(): Promise<void> {
  pending ??= Promise.all(Object.values(FONTS).map(preload)).then(() => undefined)
  return pending
}
