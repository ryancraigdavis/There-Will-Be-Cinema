import { describe, expect, it } from 'vitest'
import { warmedUp, warmLevel } from './warmup'

describe('warmLevel', () => {
  it.each([
    ['desktop warms the middle size', [1024, 2048, 4096], 4096, 2048],
    ['phones warm the small size', [1024, 2048, 4096], 2048, 1024],
    ['an old single-size index', [4096], 4096, 4096],
    ['nothing usable', [4096], 2048, null],
  ])('%s', (_name, levels, max, expected) => {
    expect(warmLevel(levels, max)).toBe(expected)
  })
})

it('is warm only when every step is done', () => {
  expect(warmedUp({ glyphs: true, atlases: true, shaders: true })).toBe(true)
  expect(warmedUp({ glyphs: true, atlases: false, shaders: true })).toBe(false)
})
