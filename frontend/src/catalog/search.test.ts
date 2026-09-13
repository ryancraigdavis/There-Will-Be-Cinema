import { describe, expect, it } from 'vitest'
import { catalogFixture } from '../test/fixtures'
import { buildIndex, normalizeTerm, rankIds } from './search'

const index = buildIndex(catalogFixture().items)

describe('rankIds', () => {
  it.each([
    ['blank query means no text filter', '   ', null],
    ['prefix', 'termin', ['term']],
    ['typo', 'termnator', ['term']],
    ['accent-insensitive', 'amelie', ['amelie']],
    ['title plus year narrows', 'alien 1979', ['alien']],
    ['years are not fuzzy', 'alien 1978', []],
  ])('%s', (_name, query, expected) => {
    expect(rankIds(index, query)).toEqual(expected)
  })

  it('ranks the exact title first', () => {
    expect(rankIds(index, 'alien')?.[0]).toBe('alien')
  })
})

describe('normalizeTerm', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalizeTerm('Amélie')).toBe('amelie')
  })
})
