import { describe, expect, it } from 'vitest'
import { item } from '../test/fixtures'
import { formatCount, formatRuntime, formatSeasons, metaLine, truncate } from './format'

describe('format', () => {
  it.each([
    [158, '2h 38m'],
    [45, '45m'],
    [120, '2h 0m'],
    [0, null],
    [null, null],
  ])('formatRuntime(%s)', (minutes, expected) => {
    expect(formatRuntime(minutes)).toBe(expected)
  })

  it.each([
    [1, '1 season'],
    [9, '9 seasons'],
    [null, null],
  ])('formatSeasons(%s)', (count, expected) => {
    expect(formatSeasons(count)).toBe(expected)
  })

  it('builds meta lines per item type', () => {
    expect(metaLine(item('twbb'))).toBe('2007 · 1h 40m')
    expect(metaLine(item('peaks'))).toBe('1990 · 3 seasons')
    expect(metaLine(item('noyear'))).toBe('1h 40m')
  })

  it('pluralizes counts with separators', () => {
    expect(formatCount(3902, 'title')).toBe('3,902 titles')
    expect(formatCount(1, 'title')).toBe('1 title')
  })
})

describe('truncate', () => {
  it.each([
    ['short text', 20, 'short text'],
    ['cut at a word boundary please', 12, 'cut at a…'],
    ['averyveryverylongword', 6, 'averyv…'],
  ])('truncate(%s, %s)', (text, limit, expected) => {
    expect(truncate(text, limit)).toBe(expected)
  })
})
