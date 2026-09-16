import { describe, expect, it } from 'vitest'
import { initialOf, letterRange, NUMERAL } from './letters'

describe('initialOf', () => {
  it.each([
    ['alien', 'A'],
    ['The Thing', 'T'],
    ['¡three amigos!', 'T'],
    ['(500) days of summer', NUMERAL],
    ['12 angry men', NUMERAL],
    ['', NUMERAL],
    ['élan', 'É'],
  ])('%s', (title, expected) => {
    expect(initialOf(title)).toBe(expected)
  })
})

describe('letterRange', () => {
  it.each([
    [['A', 'B', 'C'], 'A–C'],
    [['D', 'D'], 'D'],
    [['#'], '#'],
    [[], ''],
  ])('%j', (initials, expected) => {
    expect(letterRange(initials)).toBe(expected)
  })
})
