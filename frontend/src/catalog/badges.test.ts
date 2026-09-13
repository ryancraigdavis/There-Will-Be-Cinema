import { describe, expect, it } from 'vitest'
import { item } from '../test/fixtures'
import { badgesFor } from './badges'

describe('badgesFor', () => {
  it.each([
    ['twbb', ['4K', 'DV 7.6', 'Atmos']],
    ['alien', ['4K', 'HDR10']],
    ['aliens', []],
    ['peaks', ['TV']],
  ])('%s', (id, expected) => {
    expect(badgesFor(item(id)).map((b) => b.label)).toEqual(expected)
  })
})
