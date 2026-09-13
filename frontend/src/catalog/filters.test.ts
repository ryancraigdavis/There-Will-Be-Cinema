import { describe, expect, it } from 'vitest'
import { toCatalog } from '../api'
import { catalogFixture, rawItem } from '../test/fixtures'
import {
  activeFilterCount,
  applyFilters,
  DEFAULT_FILTERS,
  effectiveSort,
  type Filters,
  genreCounts,
  selectResults,
  toggle,
  yearBounds,
} from './filters'

const catalog = catalogFixture()
const ids = (items: { id: string }[]) => items.map((i) => i.id)
const withFilters = (patch: Partial<Filters>): Filters => ({ ...DEFAULT_FILTERS, ...patch })

describe('applyFilters', () => {
  it.each([
    [
      'type movie',
      { type: 'Movie' as const },
      ['twbb', 'alien', 'aliens', 'amelie', 'term', 'noyear'],
    ],
    ['type series', { type: 'Series' as const }, ['peaks']],
    ['genres are AND-ed', { genres: ['Action', 'Science Fiction'] }, ['aliens', 'term']],
    ['year from excludes undated', { yearFrom: 1985 }, ['twbb', 'aliens', 'amelie', 'peaks']],
    ['year to excludes undated', { yearTo: 1984 }, ['alien', 'term']],
    ['4k', { formats: ['4k' as const] }, ['twbb', 'alien']],
    ['hdr includes dolby vision', { formats: ['hdr' as const] }, ['twbb', 'alien']],
    ['dolby vision only', { formats: ['dv' as const] }, ['twbb']],
    ['formats are AND-ed', { formats: ['4k' as const, 'atmos' as const] }, ['twbb']],
  ])('%s', (_name, patch, expected) => {
    expect(ids(applyFilters(catalog.items, withFilters(patch)))).toEqual(expected)
  })
})

describe('selectResults', () => {
  it('sorts by title when there is no query', () => {
    expect(ids(selectResults(catalog, null, DEFAULT_FILTERS))).toEqual([
      'alien',
      'aliens',
      'amelie',
      'term',
      'twbb',
      'peaks',
      'noyear',
    ])
  })

  it('keeps search rank order for best match', () => {
    expect(ids(selectResults(catalog, ['aliens', 'alien'], DEFAULT_FILTERS))).toEqual([
      'aliens',
      'alien',
    ])
  })

  it('applies an explicit sort on top of search membership', () => {
    const results = selectResults(catalog, ['aliens', 'alien'], withFilters({ sort: 'year-asc' }))
    expect(ids(results)).toEqual(['alien', 'aliens'])
  })

  it.each([
    ['year-desc', ['twbb', 'amelie', 'peaks', 'aliens', 'term', 'alien', 'noyear']],
    ['added', ['peaks', 'twbb', 'aliens', 'term', 'alien', 'amelie', 'noyear']],
    ['rating', ['alien', 'aliens', 'amelie', 'twbb', 'term', 'peaks', 'noyear']],
  ] as const)('sort %s', (sort, expected) => {
    expect(ids(selectResults(catalog, null, withFilters({ sort })))).toEqual(expected)
  })

  it('ignores leading punctuation when sorting by title', () => {
    const punctuated = toCatalog({
      atlas: 'v1',
      items: [
        rawItem({ id: 'amigos', st: '¡three amigos!' }),
        rawItem({ id: 'days', st: '(500) days of summer' }),
        rawItem({ id: 'alien', st: 'alien' }),
      ],
    })
    expect(ids(selectResults(punctuated, null, DEFAULT_FILTERS))).toEqual([
      'days',
      'alien',
      'amigos',
    ])
  })

  it('ignores ranked ids missing from the catalog', () => {
    expect(ids(selectResults(catalog, ['gone', 'alien'], DEFAULT_FILTERS))).toEqual(['alien'])
  })
})

describe('helpers', () => {
  it('falls back to title sort for best match without a query', () => {
    expect(effectiveSort('relevance', null)).toBe('title')
    expect(effectiveSort('relevance', [])).toBe('relevance')
    expect(effectiveSort('rating', null)).toBe('rating')
  })

  it('counts genres by frequency then name', () => {
    expect(genreCounts(catalog.items).slice(0, 3)).toEqual([
      ['Science Fiction', 3],
      ['Action', 2],
      ['Drama', 2],
    ])
  })

  it('finds year bounds ignoring undated items', () => {
    expect(yearBounds(catalog.items)).toEqual([1979, 2007])
  })

  it('counts active filters', () => {
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0)
    expect(
      activeFilterCount(
        withFilters({ query: 'x', genres: ['A', 'B'], formats: ['4k'], yearTo: 1990 }),
      ),
    ).toBe(5)
  })

  it('toggles values', () => {
    expect(toggle(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggle(['a', 'b'], 'a')).toEqual(['b'])
  })
})
