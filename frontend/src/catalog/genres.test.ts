import { describe, expect, it } from 'vitest'
import { normalizeGenres, shelfGenre, UNCATEGORIZED } from './genres'

describe('genres', () => {
  it.each([
    [
      ['Sci-Fi', 'Science Fiction', 'Horror'],
      ['Science Fiction', 'Horror'],
    ],
    [
      ['Suspense', ' Drama '],
      ['Thriller', 'Drama'],
    ],
    [['Children', 'Kids'], ['Family']],
    [[], []],
  ])('normalizeGenres(%j)', (input, expected) => {
    expect(normalizeGenres(input)).toEqual(expected)
  })

  it.each([
    [['TV Movie', 'Horror'], 'Horror'],
    [['Drama', 'History'], 'Drama'],
    [['Mini-Series'], 'Mini-Series'],
    [[], UNCATEGORIZED],
  ])('shelfGenre(%j)', (input, expected) => {
    expect(shelfGenre(input)).toBe(expected)
  })
})
