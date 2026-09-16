import { describe, expect, it } from 'vitest'
import { catalogFixture, item } from '../test/fixtures'
import { bestMatches, buildIndex, matchTier, normalizeTerm, rankIds } from './search'

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

describe('matchTier', () => {
  it.each([
    ['exact', 'Alien', 'alien', 0],
    ['prefix', 'Aliens', 'alien', 1],
    ['contains', 'Cowboys & Aliens', 'alien', 2],
    ['fuzzy only', 'Alfie', 'alien', 3],
  ])('%s', (_name, title, term, expected) => {
    expect(matchTier(title, term)).toBe(expected)
  })
})

describe('bestMatches', () => {
  it('lifts the exact title above looser hits without reshuffling a tier', () => {
    const hits = [item('aliens'), item('amelie'), item('alien')]
    expect(bestMatches(hits, 'alien').map((film) => film.id)).toEqual(['alien', 'aliens', 'amelie'])
  })
})
