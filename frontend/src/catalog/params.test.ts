import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS, type Filters } from './filters'
import { filtersFromParams, paramsFromFilters, toYear } from './params'

describe('params', () => {
  it('omits defaults from the URL', () => {
    expect(paramsFromFilters(DEFAULT_FILTERS).toString()).toBe('')
  })

  it('round-trips every field', () => {
    const filters: Filters = {
      query: 'blade runner',
      type: 'Movie',
      genres: ['Science Fiction', 'Thriller'],
      yearFrom: 1980,
      yearTo: 1989,
      formats: ['4k', 'atmos'],
      sort: 'year-desc',
    }
    expect(filtersFromParams(paramsFromFilters(filters))).toEqual(filters)
  })

  it('drops unknown and duplicate values', () => {
    const params = new URLSearchParams(
      'type=vhs&sort=random&fmt=laserdisc&fmt=4k&fmt=4k&genre=Horror&genre=Horror&from=19',
    )
    expect(filtersFromParams(params)).toEqual({
      ...DEFAULT_FILTERS,
      genres: ['Horror'],
      formats: ['4k'],
    })
  })

  it.each([
    ['1994', 1994],
    [' 2001 ', 2001],
    ['199', null],
    ['1500', null],
    ['abcd', null],
    [null, null],
  ])('toYear(%s)', (input, expected) => {
    expect(toYear(input)).toBe(expected)
  })
})
