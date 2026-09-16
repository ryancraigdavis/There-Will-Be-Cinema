const LEADING_PUNCTUATION = /^[^\p{L}\p{N}]+/u
const DIGIT = /\p{N}/u

export const NUMERAL = '#'
export const LETTER_SHEET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const LETTER_GRID = { cols: 8, rows: 4 } as const
const DIACRITIC = /\p{Diacritic}/gu

export function letterCell(letter: string): [number, number] {
  const plain = letter.normalize('NFD').replace(DIACRITIC, '').toUpperCase()
  const index = Math.max(0, LETTER_SHEET.indexOf(plain))
  return [index % LETTER_GRID.cols, Math.floor(index / LETTER_GRID.cols)]
}

export function initialOf(sortTitle: string): string {
  const first = sortTitle.replace(LEADING_PUNCTUATION, '').charAt(0).toUpperCase()
  return first === '' ? NUMERAL : DIGIT.test(first) ? NUMERAL : first
}

export function letterRange(initials: readonly string[]): string {
  const first = initials[0]
  const last = initials[initials.length - 1]
  return !first || !last ? '' : first === last ? first : `${first}–${last}`
}
